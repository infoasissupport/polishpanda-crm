@php
  // ---- line items (pre-tax) ----
  $taxInclusive = $taxInclusive ?? false;
  $lines = [];
  $hasBreakdown = !empty($serviceProducts);   // service row "includes the items below" is shown above its products
  if ($taxInclusive && !empty($breakdown)) {
    // GST-inclusive invoice: the service's taxable value = its products (at their entered prices)
    // + whatever they leave (billed as the service itself) + the mandatory service charge.
    // Every line below is a taxable value.
    $amounts = $breakdown['productAmounts'];
    foreach (array_values($serviceProducts ?? []) as $i => $sp) {
      $rawQty = (string) ($sp['quantity'] ?? 1);
      $isPct = str_contains($rawQty, '%');
      $qtyDisplay = $isPct ? $rawQty : max(1, (float) $rawQty);
      $qtyNum = $isPct ? 1.0 : max(1, (float) $rawQty);
      $lines[] = ['name' => $sp['name'] ?? 'Product', 'hsn' => $sp['hsn_sac'] ?? '', 'qty' => $qtyDisplay, 'unit' => $sp['unit'] ?? '-',
                  'rate' => ($amounts[$i] ?? 0) / $qtyNum, 'sub' => true];
    }
    if (empty($serviceProducts) && $breakdown['serviceRemainder'] > 0.005) {
      $lines[] = ['name' => $invoice->service, 'hsn' => '', 'qty' => 1, 'unit' => '-', 'rate' => (float) $breakdown['serviceRemainder'], 'sub' => false];
    }
    if ($breakdown['serviceCharge'] > 0) {
      $lines[] = ['name' => 'Service charge (' . rtrim(rtrim(number_format($breakdown['serviceChargeRate'], 2), '0'), '.') . '%)',
                  'hsn' => '', 'qty' => 1, 'unit' => '-', 'rate' => (float) $breakdown['serviceCharge'], 'sub' => !empty($serviceProducts)];
    }
    if ($item_price > 0 && !empty($invoice->item_name)) {
      $iq = max(1, (float) ($item_quantity ?? 1));
      $lines[] = ['name' => $invoice->item_name, 'hsn' => '', 'qty' => $iq, 'unit' => '-', 'rate' => (float) $breakdown['itemTaxable'] / $iq];
    }
  } else {
    // Legacy invoice: a service's products are a breakdown of its price (plus any uncovered remainder)
    if (!empty($serviceProducts)) {
      foreach ($serviceProducts as $sp) {
        $rawQty = (string) ($sp['quantity'] ?? 1);
        $isPct = str_contains($rawQty, '%');
        $qtyDisplay = $isPct ? $rawQty : max(1, (float) $rawQty);
        $lines[] = ['name' => $sp['name'] ?? 'Product', 'hsn' => $sp['hsn_sac'] ?? '', 'qty' => $qtyDisplay,
                    'unit' => $sp['unit'] ?? '-', 'rate' => (float) ($sp['price'] ?? 0), 'sub' => true];
      }
      if ($servicePrice > 0) {
        $lines[] = ['name' => 'Service charge', 'hsn' => '', 'qty' => 1, 'unit' => '-', 'rate' => (float) $servicePrice, 'sub' => true];
      }
    } else {
      $lines[] = ['name' => $invoice->service, 'hsn' => '', 'qty' => 1, 'unit' => '-', 'rate' => (float) $servicePrice];
    }
    if ($item_price > 0 && !empty($invoice->item_name)) {
      $lines[] = ['name' => $invoice->item_name, 'hsn' => '', 'qty' => (float) ($item_quantity ?? 1), 'unit' => '-', 'rate' => (float) $item_price];
    }
  }

  // Lines are taxable (pre-GST) values; the invoice GST is spread across them by value
  $numericQty = fn ($v) => (is_string($v) && str_contains($v, '%')) ? 1.0 : max(0.01, (float) $v);
  $taxableTotal = $taxInclusive ? (float) $taxableBase : array_sum(array_map(fn ($l) => $numericQty($l['qty']) * (float) $l['rate'], $lines));
  $hasTax = $taxAmount > 0;
  $qtyTotal = 0;
  $hsnRows = [];
  foreach ($lines as &$l) {
    $q = $numericQty($l['qty']);
    $l['taxable'] = round($q * (float) $l['rate'], 2);
    $share = $taxableTotal > 0 ? $l['taxable'] / $taxableTotal : 0;
    $l['gst'] = round($taxAmount * $share, 2);
    $l['amount'] = $l['taxable'] + $l['gst'];
    $qtyTotal += $q;

    $key = $l['hsn'] !== '' && $l['hsn'] !== null ? $l['hsn'] : '-';
    $hsnRows[$key] ??= ['taxable' => 0, 'cgst' => 0, 'sgst' => 0];
    $hsnRows[$key]['taxable'] += $l['taxable'];
    $hsnRows[$key]['cgst'] += round($cgstAmount * $share, 2);
    $hsnRows[$key]['sgst'] += round($sgstAmount * $share, 2);
  }
  unset($l);
  // GST-inclusive: the last line absorbs the rounding paisa so line GSTs add up to the invoice GST
  if ($taxInclusive && $lines) {
    $last = array_key_last($lines);
    $diff = round($taxAmount - array_sum(array_column($lines, 'gst')), 2);
    if ($diff != 0) {
      $lines[$last]['gst'] = round($lines[$last]['gst'] + $diff, 2);
      $lines[$last]['amount'] = $lines[$last]['taxable'] + $lines[$last]['gst'];
    }
  }

  $grossTotal = $taxableTotal + $taxAmount;
  $isPaid = in_array(strtolower((string) ($invoice->payment_status ?: $invoice->status)), ['paid', 'completed']);
  $received = $isPaid ? $total : 0;
  $balance = $total - $received;

  $method = strtolower((string) $invoice->method);
  if ($invoice->split_cash || $invoice->split_upi) {
    $paymentMode = 'Cash ₹' . number_format((float) $invoice->split_cash, 2) . ' + UPI ₹' . number_format((float) $invoice->split_upi, 2);
  } else {
    $paymentMode = $method && $method !== 'pending' ? ($method === 'upi' ? 'UPI' : ucfirst($method)) : '-';
  }

  // Amount in words with paise
  $rupees = (int) floor(round($total, 2));
  $paise = (int) round(($total - $rupees) * 100);
  $words = ucwords(\Illuminate\Support\Number::spell($rupees)) . ' Rupees';
  if ($paise > 0) $words .= ' and ' . ucwords(\Illuminate\Support\Number::spell($paise)) . ' Paisa';
  $words .= ' only';

  $states = [
    '01' => 'Jammu and Kashmir', '02' => 'Himachal Pradesh', '03' => 'Punjab', '04' => 'Chandigarh', '05' => 'Uttarakhand',
    '06' => 'Haryana', '07' => 'Delhi', '08' => 'Rajasthan', '09' => 'Uttar Pradesh', '10' => 'Bihar', '11' => 'Sikkim',
    '12' => 'Arunachal Pradesh', '13' => 'Nagaland', '14' => 'Manipur', '15' => 'Mizoram', '16' => 'Tripura', '17' => 'Meghalaya',
    '18' => 'Assam', '19' => 'West Bengal', '20' => 'Jharkhand', '21' => 'Odisha', '22' => 'Chhattisgarh', '23' => 'Madhya Pradesh',
    '24' => 'Gujarat', '26' => 'Dadra and Nagar Haveli and Daman and Diu', '27' => 'Maharashtra', '29' => 'Karnataka', '30' => 'Goa',
    '31' => 'Lakshadweep', '32' => 'Kerala', '33' => 'Tamil Nadu', '34' => 'Puducherry', '35' => 'Andaman and Nicobar Islands',
    '36' => 'Telangana', '37' => 'Andhra Pradesh', '38' => 'Ladakh',
  ];
  $stateCode = $settings->company_gstin ? substr($settings->company_gstin, 0, 2) : null;
  $state = $stateCode && isset($states[$stateCode]) ? $stateCode . '-' . $states[$stateCode] : null;

  $companyName = $settings->company_name ?: 'Our company';
  $rs = fn ($v) => '₹ ' . number_format((float) $v, 2);
  $pct = fn ($v) => rtrim(rtrim(number_format((float) $v, 2), '0'), '.') ?: '0';
  $fmtQty = function ($v) {
    if (is_string($v) && str_contains($v, '%')) return $v;
    $n = (float) $v;
    return floor($n) == $n ? (int) $n : $v;
  };
@endphp
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no">
  <title>Invoice {{ $invoice->invoice_number ?: $invoice->id }}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f2f2f2; color: #111; font: 11px/1.35 Roboto, Arial, Helvetica, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 12px auto; padding: 8mm 9mm; background: #fff; }
    h1 { margin: 0 0 4px; text-align: center; font-size: 15px; font-weight: 700; }
    .box { border: 1px solid #555; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 4px 5px; vertical-align: top; }
    .r { text-align: right; white-space: nowrap; }
    a, a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    .c { text-align: center; }
    .b { font-weight: 700; }

    /* header */
    .top { display: flex; border-bottom: 1px solid #555; }
    .top-left { flex: 1; border-right: 1px solid #555; }
    .top-right { flex: 1; display: flex; flex-direction: column; }
    .company { display: flex; gap: 10px; align-items: center; padding: 6px 5px; border-bottom: 1px solid #555; }
    .company img { width: 52px; height: 52px; object-fit: contain; }
    .company .name { font-size: 17px; font-weight: 700; line-height: 1.2; }
    .company .meta { font-size: 10px; line-height: 1.45; }
    .billto { padding: 6px 5px; line-height: 1.9; }
    .meta-row { display: flex; border-bottom: 1px solid #555; }
    .meta-row > div { flex: 1; padding: 4px 5px; }
    .meta-row > div + div { border-left: 1px solid #555; }

    /* items */
    table.items th, table.items td { border-right: 1px solid #555; border-bottom: 1px solid #555; }
    table.items th:last-child, table.items td:last-child { border-right: 0; }
    table.items th { font-weight: 700; text-align: left; }
    table.items tr.total td { font-weight: 700; border-bottom: 0; }
    table.items tr.svc-head td { background: #f6f6f6; }
    table.items td.sub { padding-left: 16px; }
    .muted { color: #666; }

    /* words / amounts */
    .mid { display: flex; border-top: 1px solid #555; }
    .mid > div { flex: 1; }
    .mid > div + div { border-left: 1px solid #555; }
    .cell { padding: 4px 5px; }
    .amounts .line { display: flex; justify-content: space-between; padding: 4px 5px; }

    /* hsn summary */
    table.hsn { border-top: 1px solid #555; }
    table.hsn th, table.hsn td { border-right: 1px solid #555; border-bottom: 1px solid #555; }
    table.hsn th:last-child, table.hsn td:last-child { border-right: 0; }
    table.hsn th { font-weight: 700; text-align: center; vertical-align: middle; }
    table.hsn tr.total td { font-weight: 700; }

    /* terms / sign */
    .bottom { display: flex; }
    .bottom .terms { flex: 1; padding: 6px 5px; font-size: 10px; }
    .bottom .terms ol { margin: 8px 0 0; padding-left: 14px; }
    .bottom .sign { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; }
    .bottom .sign .inner { border-left: 1px solid #555; border-top: 1px solid #555; padding: 8px 5px; text-align: center; min-height: 110px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; }
    .bottom .sign img { max-height: 55px; max-width: 160px; }

    @page { size: A4; margin: 0; }
    @media print { body { background: #fff; } .page { margin: 0; } }
  </style>
</head>
<body>
  <main class="page">
    <h1>{{ $hasTax || $settings->company_gstin ? 'Tax Invoice' : 'Invoice' }}</h1>
    <section class="box">

      <div class="top">
        <div class="top-left">
          <div class="company">
            @if($settings->company_logo)
              <img src="{{ asset($settings->company_logo) }}" alt="">
            @endif
            <div>
              <div class="name">{{ $companyName }}</div>
              <div class="meta">
                @if($settings->company_address){!! str_replace("\n", ', ', e(trim($settings->company_address))) !!}<br>@endif
                @if($settings->company_phone)Phone no.: {{ $settings->company_phone }}<br>@endif
                @if($settings->company_email)Email: {{ $settings->company_email }}<br>@endif
                @if($settings->company_gstin)GSTIN: {{ $settings->company_gstin }}<br>@endif
                @if($state)State: {{ $state }}@endif
              </div>
            </div>
          </div>
          <div class="billto">
            Bill To<br>
            <span class="b">{{ $invoice->customer }}</span><br>
            @if($customerRecord && $customerRecord->district){{ $customerRecord->district }}<br>@endif
            @if($customerRecord && $customerRecord->gstin)GSTIN: {{ $customerRecord->gstin }}<br>@endif
            Contact No.: {{ $invoice->phone ?: '-' }}
          </div>
        </div>
        <div class="top-right">
          <div class="meta-row">
            <div>Invoice No.<br><span class="b">{{ $invoice->invoice_number ?: $invoice->id }}</span></div>
            <div>Date<br><span class="b">{{ $date }}</span></div>
          </div>
        </div>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th style="width:4%">#</th>
            <th>Item name</th>
            <th style="width:10%">HSN/ SAC</th>
            <th class="r" style="width:9%">Quantity</th>
            <th class="r" style="width:7%">Unit</th>
            <th class="r" style="width:11%">Price/ unit</th>
            @if($hasTax)<th class="r" style="width:17%">GST</th>@endif
            <th class="r" style="width:12%">Amount</th>
          </tr>
        </thead>
        <tbody>
          @if($hasBreakdown)
          <tr class="svc-head">
            <td></td>
            <td colspan="{{ $hasTax ? 7 : 6 }}"><span class="b">{{ $invoice->service }}</span> &mdash; service total {{ $rs($combinedSubtotal) }} <span class="muted">(includes the items below)</span></td>
          </tr>
          @endif
          @foreach($lines as $i => $l)
          <tr>
            <td>{{ $i + 1 }}</td>
            <td @if(!empty($l['sub'])) class="sub" @endif>{{ $l['name'] }}</td>
            <td>{{ $l['hsn'] }}</td>
            <td class="r">{{ $fmtQty($l['qty']) }}</td>
            <td class="r">{{ $l['unit'] ?: '-' }}</td>
            <td class="r">{{ $rs($l['rate']) }}</td>
            @if($hasTax)<td class="r">{{ $rs($l['gst']) }} ({{ number_format($taxRate, 1) }}%)</td>@endif
            <td class="r">{{ $rs($l['amount']) }}</td>
          </tr>
          @endforeach
          <tr class="total">
            <td></td>
            <td>Total</td>
            <td></td>
            <td class="r">{{ $fmtQty($qtyTotal) }}</td>
            <td></td>
            <td></td>
            @if($hasTax)<td class="r">{{ $rs($taxAmount) }}</td>@endif
            <td class="r">{{ $rs($grossTotal) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="mid">
        <div>
          <div class="cell">Invoice Amount In Words</div>
          <div class="cell b">{{ $words }}</div>
          <div class="cell">Description</div>
          <div class="cell b">VEHICLE : {{ $invoice->vehicle ?: '-' }}</div>
          <div class="cell">Payment Mode</div>
          <div class="cell b">{{ $paymentMode }}</div>
        </div>
        <div class="amounts">
          <div class="line b">Amounts:</div>
          <div class="line"><span>Sub Total</span><span>{{ $rs($grossTotal) }}</span></div>
          @if($discount > 0)
          <div class="line"><span>Discount</span><span>- {{ $rs($discount) }}</span></div>
          @endif
          <div class="line b"><span>Total</span><span>{{ $rs($total) }}</span></div>
          <div class="line"><span>Received</span><span>{{ $rs($received) }}</span></div>
          <div class="line"><span>Balance</span><span>{{ $rs($balance) }}</span></div>
        </div>
      </div>

      @if($hasTax)
      <table class="hsn">
        <thead>
          <tr>
            <th rowspan="2" style="width:24%">HSN/ SAC</th>
            <th rowspan="2" style="width:17%">Taxable amount</th>
            <th colspan="2">CGST</th>
            <th colspan="2">SGST</th>
            <th rowspan="2">Total Tax Amount</th>
          </tr>
          <tr>
            <th style="width:8%">Rate</th><th style="width:12%">Amount</th>
            <th style="width:8%">Rate</th><th style="width:12%">Amount</th>
          </tr>
        </thead>
        <tbody>
          @foreach($hsnRows as $code => $h)
          <tr>
            <td>{{ $code }}</td>
            <td class="r">{{ $rs($h['taxable']) }}</td>
            <td>{{ number_format($cgstRate, 1) }}%</td>
            <td class="r">{{ $rs($h['cgst']) }}</td>
            <td>{{ number_format($sgstRate, 1) }}%</td>
            <td class="r">{{ $rs($h['sgst']) }}</td>
            <td class="r">{{ $rs($h['cgst'] + $h['sgst']) }}</td>
          </tr>
          @endforeach
          <tr class="total">
            <td class="r">Total</td>
            <td class="r">{{ $rs($taxableTotal) }}</td>
            <td></td>
            <td class="r">{{ $rs($cgstAmount) }}</td>
            <td></td>
            <td class="r">{{ $rs($sgstAmount) }}</td>
            <td class="r">{{ $rs($taxAmount) }}</td>
          </tr>
        </tbody>
      </table>
      @endif

      <div class="bottom" @if(!$hasTax) style="border-top:1px solid #555" @endif>
        <div class="terms">
          <span class="b">Terms and conditions:</span>
          <ol>
            <li>Vehicles must be inspected by the customer at the time of delivery.</li>
            <li>{{ $companyName }} is not responsible for pre-existing damage, paint defects, rust, electrical/mechanical issues or personal belongings left in the vehicle.</li>
            <li>Service results may vary depending on the vehicle’s condition and previous repairs.</li>
            <li>Warranty, if applicable, is subject to the respective product/manufacturer terms and maintenance requirements.</li>
            <li>Any additional work will be carried out with customer approval.</li>
            <li>Vehicles should be collected within the agreed delivery time.</li>
            <li>GST is charged as applicable under prevailing laws.</li>
            <li>By accepting delivery, the customer agrees to these terms &amp; conditions.</li>
          </ol>
        </div>
        <div class="sign">
          <div class="inner">
            <div>For, {{ $companyName }}</div>
            @if($settings->signature)
              <img src="{{ asset($settings->signature) }}" alt="Signature">
            @endif
            <div>Authorized Signatory</div>
          </div>
        </div>
      </div>

    </section>
  </main>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>
