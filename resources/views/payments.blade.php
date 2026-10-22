@extends('layouts.app')

@section('title', 'Payments and Invoicing')

@section('page-id', 'payments')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/payments.css') }}?v={{ filemtime(public_path('css/payments.css')) }}">
@endsection

@section('content')
<section class="view" id="payments">
  <div class="view-header">
    <div class="pay-header-text">
      <div class="view-title">Payments &amp; Invoicing</div>
      <div class="view-sub pay-header-sub">Manage invoices, payments and track your business revenue</div>
    </div>
    <div class="pay-header-actions">
      <div class="pay-filter-field pay-filter-field--icon">
        <label for="invoiceDateFilterSelect" class="sr-only">Timeframe</label>
        <svg class="pay-field-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/></svg>
        <select id="invoiceDateFilterSelect">
          <option value="all" selected>All Time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <button class="btn btn-accent pay-export-btn" id="exportInvoicesBtn"><i class="ti ti-download"></i>Export</button>
    </div>
  </div>
  <!-- Everything below the header scrolls in one area; the header stays fixed -->
  <div class="pay-scroll-area" id="paymentsScrollArea">
    <div class="pay-kpi-grid">
    <div class="pay-kpi">
      <div class="pay-kpi-icon" style="background:#ECFDF5;color:#10B981;"><i class="ti ti-cash"></i></div>
      <div class="pay-kpi-body">
        <div class="pay-kpi-label">Total Cash</div>
        <div class="pay-kpi-value" id="payKpiCash">₹0</div>
        <div class="pay-kpi-sub" id="payKpiCashSub">0 Invoices</div>
      </div>
    </div>
    <div class="pay-kpi">
      <div class="pay-kpi-icon" style="background:#EFF6FF;color:#3B82F6;"><i class="ti ti-device-mobile"></i></div>
      <div class="pay-kpi-body">
        <div class="pay-kpi-label">Total UPI</div>
        <div class="pay-kpi-value" id="payKpiUpi">₹0</div>
        <div class="pay-kpi-sub" id="payKpiUpiSub">0 Invoices</div>
      </div>
    </div>
    <div class="pay-kpi">
      <div class="pay-kpi-icon" style="background:#F3E8FF;color:#A855F7;"><i class="ti ti-wallet"></i></div>
      <div class="pay-kpi-body">
        <div class="pay-kpi-label">Total Cash + UPI</div>
        <div class="pay-kpi-value" id="payKpiTotal">₹0</div>
        <div class="pay-kpi-sub" id="payKpiTotalSub">0 Invoices</div>
      </div>
    </div>
  </div>
  <div class="paymentsCommonMainAll">
  <div class="tablefiletrFlex ">

    <div class="toolbar">
        <input id="invoiceSearchInput" aria-label="Search invoice, customer, vehicle number or model" placeholder="Search Invoice, Customer, Vehicle No. Or Model" autocomplete="off">
        <div class="pay-filter-field">
          <label for="invoiceFilterSelect" class="sr-only">Filter</label>
          <select id="invoiceFilterSelect">
            <option value="all">All Status</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div class="dropdown pay-filter-field" id="customRangeDropdown">
          <span class="pay-filter-label sr-only">Date Range</span>
          <div class="chip" data-filter="custom" id="customRangeChip"><svg class="pay-cal-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/></svg>Custom Range <i class="ti ti-chevron-down"></i></div>
          <div class="dropdown-menu" id="invDateRangeMenu">
            <div class="dropdown-header">Custom Range</div>
            <div class="field"><label for="invDateFrom">From</label><input type="date" id="invDateFrom"></div>
            <div class="field"><label for="invDateTo">To</label><input type="date" id="invDateTo"></div>
            <button type="button" class="btn btn-accent" id="invDateApplyBtn" style="width:100%;margin-top:4px;">Apply</button>
          </div>
        </div>
        <button type="button" class="btn btn-accent pay-search-btn" id="invoiceSearchBtn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/></svg>Search</button>
      </div>
    <div class="table-wrap">
      
      <div class="table-scroll">
        <table>
          <thead><tr><th class="col-num">#</th><th>Invoice No.</th><th>Customer</th><th>Vehicle No.</th><th>Vehicle Model</th><th>Amount</th><th>Method</th><th>Status</th><th>Last Wash Detail</th></tr></thead>
          <tbody id="invoiceTableBody"></tbody>
        </table>
        <div class="dropdown-empty" id="invoiceEmptyState" style="display:none;">No invoices match your search.</div>
      </div>
      <div class="table-pagination">
        <span id="invoicePageInfo"></span>
        <div class="pagination-btns">
          <button type="button" class="btn" id="invoicePrevBtn"><i class="ti ti-chevron-left"></i>Prev</button>
          <div class="pagination-pages" id="invoicePageNums"></div>
          <button type="button" class="btn" id="invoiceNextBtn">Next<i class="ti ti-chevron-right"></i></button>
        </div>
      </div>
    </div>
  </div>
    <div class="card">
      <div class="card-title">
        <span class="inv-preview-heading"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 9h1M9 13h6M13 17h2"/></svg>Invoice Preview</span>
        <span class="inv-gst-badge" id="previewGstBadge">GST 18%</span>
      </div>
      <div class="inv-preview-meta" id="previewMeta">INV-2026-0842 · 26 Jul 2026</div>

      <div class="inv-preview-party">
        <div class="inv-party">
          <span class="inv-party-avatar inv-party-avatar--customer"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg></span>
          <div class="inv-party-text"><div class="inv-party-name" id="previewCustomerName">—</div><div class="inv-party-sub">Customer</div></div>
        </div>
        <div class="inv-party">
          <span class="inv-party-avatar inv-party-avatar--vehicle"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17h-1a1 1 0 0 1-1-1v-4l2-5h14l2 5v4a1 1 0 0 1-1 1h-1"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/></svg></span>
          <div class="inv-party-text"><div class="inv-party-name" id="previewVehiclePlate">—</div><div class="inv-party-sub" id="previewVehicleModel">Vehicle</div></div>
        </div>
      </div>

      <div class="inv-svc-head"><span id="previewService">Premium detail</span><span class="mono" id="previewAmount">₹699.00</span></div>

      <div id="previewProductsBox" class="inv-items" style="display:none;">
        <div class="inv-items-head"><span>#</span><span>Item / Service</span><span>Qty</span><span>Price</span><span>Amount</span></div>
        <div class="inv-items-list" id="previewProductsList"></div>
        <span id="previewProductsCount" hidden>0 items</span>
      </div>

      <div class="inv-preview-box">
        <div class="inv-preview-row" id="previewBreakdownRow" style="display:none;"><span>Breakdown total</span><span class="mono" id="previewProductsTotal">₹0.00</span></div>
        <div class="inv-preview-row" id="previewItemRow" style="display:none;"><span id="previewItemName">Additional Item</span><span class="mono" id="previewItemPrice">₹0.00</span></div>
        <div class="inv-preview-row" id="previewTaxableRow"><span>Taxable Amount</span><span class="mono" id="previewTaxable">₹0.00</span></div>
        <div class="inv-preview-row" id="previewGstRow"><span>GST (18%)</span><span class="mono" id="previewGst">₹0.00</span></div>
        <div class="inv-preview-row" id="previewCgstRow" style="display:none;"><span id="previewCgstLabel">CGST (9%)</span><span class="mono" id="previewCgst">₹0.00</span></div>
        <div class="inv-preview-row" id="previewSgstRow" style="display:none;"><span id="previewSgstLabel">SGST (9%)</span><span class="mono" id="previewSgst">₹0.00</span></div>
        <div class="inv-preview-row" id="discountRow" style="display:none;"><span>Discount</span><span class="mono" id="previewDiscount">-₹0.00</span></div>
      </div>

      <div class="inv-preview-total"><span>Total Amount</span><span class="mono" id="previewTotal">₹824.82</span></div>
      <div class="inv-preview-split">
        <div class="inv-preview-row" id="splitCashRow" style="display:none;"><span>Paid via Cash</span><span class="mono" id="previewSplitCash">₹0.00</span></div>
        <div class="inv-preview-row" id="splitUpiRow" style="display:none;"><span>Paid via UPI</span><span class="mono" id="previewSplitUpi">₹0.00</span></div>
      </div>

      <div class="inv-preview-actions">
        <button class="btn inv-btn-whatsapp" id="previewWhatsappBtn"><i class="ti ti-brand-whatsapp"></i>WhatsApp</button>
        <button class="btn inv-btn-pdf" id="previewPdfBtn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 17h6M9 13h6"/></svg>PDF</button>
        <button class="btn inv-btn-edit" id="previewEditBtn"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Edit</button>
      </div>

      <div class="inv-preview-payment" id="payActionContainer" style="display:none;">
       <div class="inv-pay-groups">
        <div class="inv-pay-group">
        <label>Apply Discount</label>
        <div class="inv-pay-row">
          <select id="discountTypeSelect" style="width:80px;height:36px;border-radius:10px;border:1px solid #C9D3E2;background:#fff;color:#172033;padding:0 8px;font-size:13px;">
            <option value="flat">₹ Flat</option>
            <option value="percent">% Pct</option>
          </select>
          <input type="number" id="discountInput" placeholder="Amount" style="flex:1;height:36px;border-radius:10px;border:1px solid #C9D3E2;background:#fff;color:#172033;padding:0 8px;font-size:13px;" min="0">
          <button type="button" class="btn" id="applyDiscountBtn" style="height:36px;padding:0 12px;">Apply</button>
        </div>
        </div>
        <div class="inv-pay-group">
        <label for="payMethodSelect">Receive Payment</label>
        <div class="inv-pay-row">
          <select id="payMethodSelect" onchange="document.getElementById('splitPaymentFields').style.display = (this.value === 'upi_cash') ? 'flex' : 'none'; document.getElementById('splitErrorMsg').style.display = 'none';" style="flex:1;height:36px;border-radius:10px;border:1px solid #C9D3E2;background:#fff;color:#172033;padding:0 8px;font-size:13px;">
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="upi_cash">UPI + Cash</option>
          </select>
          <button class="btn btn-accent" id="markAsPaidBtn" style="height:36px;"><i class="ti ti-check"></i>Mark as Paid</button>
        </div>
        </div>
       </div>
        
        <div id="splitPaymentFields" style="display:none; gap:8px; margin-bottom:8px;">
          <input type="number" id="splitCashInput" placeholder="Cash Amount" style="flex:1;height:36px;border-radius:10px;border:1px solid #C9D3E2;background:#fff;color:#172033;padding:0 8px;font-size:13px;" min="0">
          <input type="number" id="splitUpiInput" placeholder="UPI Amount" style="flex:1;height:36px;border-radius:10px;border:1px solid #C9D3E2;background:#fff;color:#172033;padding:0 8px;font-size:13px;" min="0">
        </div>
        <div id="splitErrorMsg" style="display:none; color:#EF4444; font-size:12px; margin-bottom:8px;">Total does not match the invoice amount.</div>
      </div>
    </div>
  </div>
  </div>
</section>

<div class="modal-overlay" id="editInvoiceModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Edit Invoice</div>
      <button class="icon-btn" onclick="window.SW.closeModal('editInvoiceModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="editInvoiceForm">
      <input type="hidden" id="editInvoiceId">
      <div class="modal-body">
        <div class="field">
          <label class="label" for="editInvoiceDate">Invoice Date</label>
          <input type="text" id="editInvoiceDate" required placeholder="e.g. 09 Sep 2026">
        </div>
        <div class="field">
          <label class="label" for="editProductSelect">Select from Uploaded Products</label>
          <select id="editProductSelect" style="width: 100%; height: 38px; padding: 0 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; font-size: 13px; color: #1e293b;">
            <option value="">-- Choose an uploaded product (autofills below) --</option>
          </select>
        </div>
        <div class="field">
          <label class="label" for="editItemName">Additional Item Name</label>
          <input type="text" id="editItemName" placeholder="e.g. Microfiber Towel, Car Perfume">
        </div>
        <div class="modal-row">
          <div class="field">
            <label class="label" for="editItemQty">Quantity</label>
            <input type="number" id="editItemQty" min="1" value="1" placeholder="1">
          </div>
          <div class="field">
            <label class="label" for="editItemPrice">Unit Price (₹)</label>
            <input type="number" id="editItemPrice" placeholder="0" min="0">
          </div>
        </div>
        <div id="editItemTotalRow" style="display: none; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12.5px; color: #475569; justify-content: space-between; align-items: center; margin-top: 2px;">
          <span style="font-weight: 500;">Item Total (Qty × Price):</span>
          <span class="mono" id="editItemTotalCalc" style="font-weight: 700; color: #0f172a; font-size: 13px;">₹0.00</span>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('editInvoiceModal')">Cancel</button>
        <button type="submit" class="btn btn-accent" id="saveInvoiceEditBtn"><i class="ti ti-check"></i>Save Changes</button>
      </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="invoiceModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Create invoice</div>
      <button class="icon-btn" onclick="window.SW.closeModal('invoiceModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="invoiceForm">
      <div class="modal-body">
        <div class="field"><label for="invCustomer">Customer name</label><input type="text" id="invCustomer" required placeholder="e.g. Ravi Kumar"></div>
        <div class="modal-row">
          <div class="field"><label for="invBranch">Branch</label><select id="invBranch"><option value="">Select branch</option></select></div>
          <div class="field">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label for="invTaxRate" style="margin-bottom:0;">GST rate (%)</label>
              <label style="font-size:11.5px;color:var(--accent);font-weight:600;display:inline-flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="invGstToggle" style="width:auto;"> Enable GST</label>
            </div>
            <input type="number" id="invTaxRate" min="0" max="100" step="0.01" value="0" disabled>
          </div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="invPhone">Phone</label><input type="tel" id="invPhone" inputmode="numeric" pattern="[0-9]*" maxlength="15" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="e.g. 9876543210"></div>
          <div class="field"><label for="invServiceName">Service</label>
            <select id="invServiceName" required>
              <option value="">Select a service</option>
            </select>
          </div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="invAmount">Amount (₹, incl. GST)</label><input type="number" id="invAmount" min="0" required placeholder="e.g. 699"></div>
          <div class="field"><label for="invDiscount">Discount (₹)</label><input type="number" id="invDiscount" min="0" value="0"></div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="invMethod">Payment method</label>
            <select id="invMethod">
              <option value="pending">Not paid yet</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div class="field"><label for="invDueAt">Due date</label><input type="date" id="invDueAt"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('invoiceModal')">Cancel</button>
        <button type="submit" class="btn btn-accent"><i class="ti ti-plus"></i>Create invoice</button>
      </div>
    </form>
  </div>
</div>
@endsection

@section('scripts')
  <script src="{{ asset('js/payments.js') }}?v={{ time() }}"></script>
@endsection
