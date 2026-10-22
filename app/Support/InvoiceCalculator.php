<?php

namespace App\Support;

use App\Models\CompanySetting;
use App\Models\Invoice;
use App\Models\Service;

/**
 * Single source of truth for invoice maths on the server.
 * Mirrors computeInvoiceTotals() in public/js/payments.js — keep both in sync.
 *
 * A service's products are a breakdown of the service price, never an extra charge:
 *   service total  = max(service price, sum of its products)
 *   gross          = service total + additional item
 *
 * GST-inclusive invoices (tax_inclusive = true, every invoice created from now on):
 *   the gross amount already contains GST, so it is extracted, never added:
 *   taxable        = gross ÷ (1 + GST rate / 100)
 *   GST            = gross − taxable, split into CGST / SGST by their rates
 *   total          = gross − discount
 *   the service's taxable value = mandatory service charge + products (entered prices) + the rest billed as the service
 *
 * Legacy invoices (tax_inclusive = false) keep the maths they were saved with:
 *   taxable        = gross
 *   CGST / SGST    = taxable × rate / 100
 *   total          = taxable + CGST + SGST − discount
 */
class InvoiceCalculator
{
    public static function productsTotal(?array $products): float
    {
        $total = 0;
        foreach ($products ?? [] as $p) {
            if (!is_array($p)) {
                continue;
            }
            $rawQty = (string) ($p['quantity'] ?? 1);
            $isPct = str_contains($rawQty, '%');
            $q = $isPct ? 1.0 : max(0.01, (float) $rawQty);
            $total += $q * (float) ($p['price'] ?? 0);
        }

        return round($total, 2);
    }

    /** Price billed for one service: its products are included in it, not added on top. */
    public static function serviceTotal(Service $service): float
    {
        return round(max((float) ($service->price ?? 0), self::productsTotal($service->products)), 2);
    }

    /** The services named on an invoice (comma separated), scoped to its owner. */
    public static function servicesFor(Invoice $invoice)
    {
        if (empty($invoice->service)) {
            return collect();
        }
        $names = array_map('trim', explode(',', $invoice->service));
        $byName = fn ($q) => $q->where(function ($q) use ($names) {
            foreach ($names as $name) {
                $q->orWhere('name', 'like', $name);
            }
        });

        $services = $byName(Service::where('user_id', $invoice->user_id))->get();

        return $services->isNotEmpty() ? $services : $byName(Service::query())->get();
    }

    /** True when the invoice's prices already include GST (see class docblock). */
    public static function isTaxInclusive(Invoice $invoice): bool
    {
        return (bool) ($invoice->tax_inclusive ?? false);
    }

    public static function productWeights(?array $products): array
    {
        return array_map(function ($p) {
            if (isset($p['amount'])) {
                return (float) $p['amount'];
            }
            $rawQty = (string) ($p['quantity'] ?? 1);
            $isPct = str_contains($rawQty, '%');
            $q = $isPct ? 1.0 : max(0.01, (float) $rawQty);
            return (float) ($q * (float) ($p['price'] ?? 0));
        }, array_values($products ?? []));
    }

    public static function totals(Invoice $invoice, ?CompanySetting $settings, ?float $productsTotal = null, ?int $productCount = null, ?array $productWeights = null): array
    {
        $productsTotal ??= self::servicesFor($invoice)->sum(fn ($s) => self::productsTotal($s->products));
        $productCount ??= self::servicesFor($invoice)->sum(fn ($s) => is_array($s->products) ? count($s->products) : 0);
        $productWeights ??= self::servicesFor($invoice)->flatMap(fn ($s) => self::productWeights(is_array($s->products) ? $s->products : []))->all();

        $subtotal = (float) ($invoice->subtotal ?: $invoice->amount ?: 0);
        $servicePrice = max(0, $subtotal - $productsTotal);   // part of the service not covered by its products
        $serviceTotal = $servicePrice + $productsTotal;
        $itemPrice = (float) ($invoice->item_price ?? 0);
        $itemQuantity = max(1, (int) ($invoice->item_quantity ?? 1));
        $itemTotal = $itemPrice * $itemQuantity;
        $taxable = round($serviceTotal + $itemTotal, 2);

        $cgstRate = (float) ($settings->cgst_rate ?? 0);
        $sgstRate = (float) ($settings->sgst_rate ?? 0);
        $settingsTaxRate = $cgstRate + $sgstRate;
        $discount = (float) ($invoice->discount_amount ?? 0);
        $taxInclusive = self::isTaxInclusive($invoice);

        if ($taxInclusive) {
            $gross = $taxable;
            if ($settingsTaxRate > 0) {
                $taxRate = $settingsTaxRate;
            } else {
                // No company rates configured: use the invoice's own GST rate, split equally
                $taxRate = (float) ($invoice->tax_rate ?? 0);
                $cgstRate = $sgstRate = $taxRate / 2;
            }
            // Extract the GST already inside the price; SGST takes the rounding remainder
            // so taxable + CGST + SGST always equals the gross amount exactly
            $taxable = $taxRate > 0 ? round($gross / (1 + $taxRate / 100), 2) : $gross;
            $taxAmount = round($gross - $taxable, 2);
            $cgstAmount = $taxRate > 0 ? round($taxAmount * $cgstRate / $taxRate, 2) : 0.0;
            $sgstAmount = round($taxAmount - $cgstAmount, 2);
            $total = max(0, round($gross - $discount, 2));

            // Breakdown of the service's taxable value: the service charge rate configured on the service,
            // the products at their manually entered prices, and whatever is left billed as the service itself.
            $matchingService = self::servicesFor($invoice)->first();
            $svcChargeRate = $matchingService && $matchingService->service_charge_rate !== null
                ? (float) $matchingService->service_charge_rate
                : ServicePricing::serviceChargeRate($settings);

            $b = ServicePricing::breakdown($serviceTotal, $taxRate, $svcChargeRate, 0);
            $serviceTaxable = $b['taxable'];
            $serviceChargeRate = $b['serviceChargeRate'];
            $serviceCharge = $b['serviceCharge'];
            $productAmounts = array_map(fn ($w) => round((float) $w, 2), array_values($productWeights));
            $productsSum = round(array_sum($productAmounts), 2);
            if ($productsSum > $b['productsAmount'] + 0.005) {
                // entered prices no longer fit (e.g. the price was lowered later): scale them down so the invoice adds up
                $productAmounts = ServicePricing::breakdown($serviceTotal, $taxRate, $serviceChargeRate, count($productAmounts), $productAmounts)['productAmounts'];
                $productsSum = $b['productsAmount'];
            }
            $serviceRemainder = round($b['productsAmount'] - $productsSum, 2);   // billed as the service itself
            $itemTaxable = round($taxable - $serviceTaxable, 2);

            return compact(
                'productsTotal', 'subtotal', 'servicePrice', 'serviceTotal', 'itemPrice', 'itemQuantity', 'itemTotal',
                'gross', 'taxable', 'taxRate', 'cgstRate', 'sgstRate', 'cgstAmount', 'sgstAmount', 'taxAmount', 'discount', 'total', 'taxInclusive',
                'serviceTaxable', 'serviceChargeRate', 'serviceCharge', 'productAmounts', 'serviceRemainder', 'itemTaxable'
            );
        }

        if ($settingsTaxRate > 0) {
            $taxRate = $settingsTaxRate;
            $cgstAmount = round($taxable * $cgstRate / 100, 2);
            $sgstAmount = round($taxable * $sgstRate / 100, 2);
        } else {
            // No company rates configured: fall back to the invoice's own GST, split equally
            $taxRate = (float) ($invoice->tax_rate ?? 0);
            $gstTotal = (float) ($invoice->tax_amount ?? ($taxable * $taxRate / 100));
            $cgstRate = $sgstRate = $taxRate / 2;
            $cgstAmount = round($gstTotal / 2, 2);
            $sgstAmount = round($gstTotal - $cgstAmount, 2);
        }

        $taxAmount = round($cgstAmount + $sgstAmount, 2);
        $gross = round($taxable + $taxAmount, 2);
        $total = max(0, round($taxable + $taxAmount - $discount, 2));
        // Legacy invoices saved with a tax-inclusive amount and no company rates
        if ($settingsTaxRate == 0 && $invoice->amount && $invoice->amount > $subtotal) {
            $total = (float) $invoice->amount;
        }

        $serviceTaxable = 0.0;
        $serviceChargeRate = 0.0;
        $serviceCharge = 0.0;
        $productAmounts = [];
        $serviceRemainder = 0.0;
        $itemTaxable = 0.0;

        return compact(
            'productsTotal', 'subtotal', 'servicePrice', 'serviceTotal', 'itemPrice', 'itemQuantity', 'itemTotal',
            'gross', 'taxable', 'taxRate', 'cgstRate', 'sgstRate', 'cgstAmount', 'sgstAmount', 'taxAmount', 'discount', 'total', 'taxInclusive',
            'serviceTaxable', 'serviceChargeRate', 'serviceCharge', 'productAmounts', 'serviceRemainder', 'itemTaxable'
        );
    }

    /** Write the calculated tax and total onto the invoice so reports read the same figure. */
    public static function applyTo(Invoice $invoice, ?CompanySetting $settings = null): Invoice
    {
        $settings ??= CompanySetting::where('user_id', $invoice->user_id)->first();
        $t = self::totals($invoice, $settings);

        if ($t['taxInclusive']) {
            $invoice->tax_rate = $t['taxRate'];
            $invoice->tax_amount = $t['taxAmount'];
            $invoice->amount = $t['total'];

            return $invoice;
        }

        if ((float) ($settings->cgst_rate ?? 0) + (float) ($settings->sgst_rate ?? 0) > 0) {
            $invoice->tax_rate = $t['taxRate'];
            $invoice->tax_amount = $t['taxAmount'];
        }
        $invoice->amount = max(0, round($t['taxable'] + $t['taxAmount'] - $t['discount'], 2));

        return $invoice;
    }
}
