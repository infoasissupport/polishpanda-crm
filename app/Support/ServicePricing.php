<?php

namespace App\Support;

use App\Models\CompanySetting;
use Illuminate\Validation\ValidationException;

/**
 * How a GST-inclusive service price is broken down.
 * Mirrors serviceBreakdown() in public/js/services.js and public/js/payments.js — keep all three in sync.
 *
 *   taxable        = price ÷ (1 + GST rate / 100)
 *   service charge = taxable × service charge rate / 100
 *   service charge = mandatory, always charged (Company Settings, default 20%)
 *   products       = entered manually on the service (never calculated); they must fit in
 *                    taxable − service charge. Whatever they leave is billed as the service itself.
 *   GST            = price − taxable
 *
 * Maths runs at full precision; amounts are rounded to paise once at the end and reconciled
 * (GST and the last product absorb the rounding) so that
 *   products + service charge = taxable   and   taxable + GST = price, exactly.
 */
class ServicePricing
{
    public const DEFAULT_SERVICE_CHARGE_RATE = 0.0;

    public static function gstRate(?CompanySetting $settings): float
    {
        return max(0, (float) ($settings->cgst_rate ?? 0) + (float) ($settings->sgst_rate ?? 0));
    }

    public static function serviceChargeRate(?CompanySetting $settings, ?float $overrideRate = null): float
    {
        if ($overrideRate !== null && $overrideRate !== '') {
            return min(100, max(0, (float) $overrideRate));
        }

        $rate = $settings->service_charge_rate ?? null;

        return $rate === null || $rate === '' ? self::DEFAULT_SERVICE_CHARGE_RATE : min(100, max(0, (float) $rate));
    }

    /**
     * @return array{gross: float, taxable: float, gst: float, gstRate: float, serviceChargeRate: float,
     *               serviceCharge: float, productsAmount: float, productAmounts: float[]}
     */
    public static function breakdown(float $gross, float $gstRate, float $serviceChargeRate, int $productCount, array $weights = []): array
    {
        $gross = round(max(0, $gross), 2);
        $taxableExact = $gstRate > 0 ? $gross / (1 + $gstRate / 100) : $gross;
        $serviceChargeExact = $taxableExact * $serviceChargeRate / 100;

        $taxable = round($taxableExact, 2);
        $gst = round($gross - $taxable, 2);
        $serviceCharge = round($serviceChargeExact, 2);
        $productsAmount = round($taxable - $serviceCharge, 2);

        // Products share the products amount: in proportion to $weights (saved product amounts) when given,
        // otherwise equally. The last product takes the rounding remainder so they add up exactly.
        $productAmounts = [];
        if ($productCount > 0) {
            $productsExact = $taxableExact - $serviceChargeExact;
            $weights = array_values($weights);
            $weightSum = count($weights) === $productCount ? array_sum(array_map('floatval', $weights)) : 0;
            $allocated = 0;
            for ($i = 0; $i < $productCount - 1; $i++) {
                $amount = $weightSum > 0
                    ? round($productsExact * (float) $weights[$i] / $weightSum, 2)
                    : round($productsExact / $productCount, 2);
                $productAmounts[] = $amount;
                $allocated += $amount;
            }
            $productAmounts[] = round($productsAmount - $allocated, 2);
        }

        return compact('gross', 'taxable', 'gst', 'gstRate', 'serviceChargeRate', 'serviceCharge', 'productsAmount', 'productAmounts');
    }

    /**
     * Tidy a service's products before saving. Prices are entered manually and stored exactly as typed.
     * They must fit in what the price leaves after GST and the mandatory service charge.
     */
    public static function allocateProducts(array $products, float $price, ?CompanySetting $settings, ?float $serviceChargeRate = null): array
    {
        $products = array_values(array_filter($products, fn ($p) => is_array($p) && trim((string) ($p['name'] ?? '')) !== ''));

        $gstRate = self::gstRate($settings);
        $taxablePrice = $gstRate > 0 ? $price / (1 + $gstRate / 100) : $price;

        $sum = 0;
        foreach ($products as &$p) {
            $rawQty = (string) ($p['quantity'] ?? 1);
            $isPct = str_contains($rawQty, '%');
            $p['quantity'] = $isPct ? trim($rawQty) : max(0.01, (float) $rawQty);
            if ($isPct) {
                $pctVal = (float) str_replace('%', '', $rawQty);
                $p['price'] = round($taxablePrice * ($pctVal / 100), 2);
            } else {
                $p['price'] = round(max(0, (float) ($p['price'] ?? 0)), 2);
            }
            $qtyMultiplier = $isPct ? 1.0 : (float) $p['quantity'];
            $p['amount'] = round($p['price'] * $qtyMultiplier, 2);   // line total = (qty or 1 for %) × entered price
            unset($p['manual']);
            $sum += $p['amount'];
        }
        unset($p);

        $scRate = self::serviceChargeRate($settings, $serviceChargeRate);
        $b = self::breakdown($price, self::gstRate($settings), $scRate, 0);
        if (round($sum, 2) - $b['productsAmount'] > 0.005) {
            $money = fn ($v) => '₹'.number_format($v, 2);
            throw ValidationException::withMessages(['products' => 'Product prices add up to '.$money($sum).', more than the '
                .$money($b['productsAmount']).' left for products after GST and the '.rtrim(rtrim(number_format($b['serviceChargeRate'], 2), '0'), '.')
                .'% service charge ('.$money($b['serviceCharge']).'). Lower the product prices or raise the service price.']);
        }

        return $products;
    }
}
