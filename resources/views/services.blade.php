@extends('layouts.app')

@section('title', 'Services')

@section('page-id', 'services')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/services.css') }}?v={{ filemtime(public_path('css/services.css')) }}">
@endsection

@section('content')
<section class="view" id="services">



  <div class="svc-toolbar">
      <div class="view-header">

      <div class="view-title">Services</div>


  </div>
  
    <div class="sortedByFlex">
        <div class="svc-search-box">
      <i class="ti ti-search"></i>
      <input type="text" id="servicesSearchInput" placeholder="Search services..." aria-label="Search services">
    </div>
    <div class="svc-view-toggle">
      <button type="button" class="svc-view-btn active" data-view="grid" title="Grid view" aria-label="Grid view">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>
      </button>
      <button type="button" class="svc-view-btn" data-view="list" title="List view" aria-label="List view">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
      </button>
    </div>
    <button class="btn btn-accent" id="addServiceBtn"><i class="ti ti-plus"></i>Add Service</button>
    </div>
 
  </div>
<div class="scrollingMainall1">
    <div class="svc-grid"  id="servicesGrid"></div>
</div>

  <div class="svc-empty" id="servicesEmptyState" style="display:none;">No services match your filters.</div>


</section>

<div class="modal-overlay" id="serviceModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="serviceModalTitle">Add service</div>
      <button class="icon-btn" onclick="window.SW.closeModal('serviceModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="serviceForm">
      <div class="modal-body">
        <div class="field"><label for="svcName">Service name</label><input type="text" id="svcName" required placeholder="e.g. Foam wash"></div>
        <div class="field"><label for="svcDesc">Description</label><input type="text" id="svcDesc" placeholder="e.g. Foam wash and rinse, hand dry"></div>
        <div class="field"><label for="svcCategory">Category</label>
          <select id="svcCategory">
            <option value="Exterior">Exterior</option>
            <option value="Interior">Interior</option>
            <option value="Bundle">Bundle</option>
            <option value="Detailing">Detailing</option>
            <option value="Premium">Premium</option>
            <option value="Add-on">Add-on</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="modal-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="field"><label for="svcPrice">Price (₹)</label><input type="number" id="svcPrice" min="0" required placeholder="e.g. 299"></div>
          <div class="field"><label for="svcServiceCharge">Service Charge (%)</label><input type="number" id="svcServiceCharge" min="0" max="100" step="0.01" value="0" placeholder="e.g. 20"></div>
        </div>
        <div class="modal-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="field"><label for="svcDuration">Duration</label><input type="text" id="svcDuration" required placeholder="e.g. 20 min"></div>
          <div class="field"><label for="svcStaff">Staff required</label><input type="number" id="svcStaff" min="1" value="1" required></div>
        </div>

        <div class="svc-products-section" style="margin-top: 6px; border-top: 1px solid #eef0f3; padding-top: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="font-weight: 600; font-size: 13.5px; color: #101828; display: flex; align-items: center; gap: 6px;">
                <i class="ti ti-package" style="color: var(--accent); font-size: 16px;"></i> Required Service Products
              </div>
              <div style="font-size: 11.5px; color: #667085;">Products/consumables needed to perform this service</div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <select id="svcProductQuickSelect" style="font-size: 12px; height: 32px; padding: 0 8px; border-radius: 8px; border: 1px solid #d0d5dd; background: #fff; max-width: 200px;">
                <option value="">+ Add from existing products...</option>
              </select>
              <button type="button" class="btn" id="svcAddCustomProdRowBtn" style="font-size: 12px; height: 32px; padding: 0 10px;"><i class="ti ti-plus"></i>Custom item</button>
            </div>
          </div>

          <div id="svcProductsHeader" style="display: none; grid-template-columns: 2.2fr 1fr 1fr 1.2fr 36px; gap: 8px; font-size: 11px; font-weight: 600; color: #475467; text-transform: uppercase; letter-spacing: 0.5px; padding: 0 4px 6px;">
            <div>Product Name</div>
            <div>Quantity / %</div>
            <div>Price (₹)</div>
            <div>HSN/SAC</div>
            <div></div>
          </div>

          <div id="svcProductsList" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Product rows will be dynamically inserted here -->
          </div>

          <div id="svcProductsEmpty" style="padding: 14px; text-align: center; color: #98a2b3; font-size: 12px; background: #f9fafb; border-radius: 8px; border: 1px dashed #e4e7ec;">
            No products added for this service yet. Select from existing products or add a custom item.
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn danger" id="deleteServiceBtn" style="display:none;margin-right:auto;"><i class="ti ti-x"></i>Delete service</button>
        <button type="button" class="btn" onclick="window.SW.closeModal('serviceModal')">Cancel</button>
        <button type="submit" class="btn btn-accent" id="serviceSubmitBtn"><i class="ti ti-plus"></i>Add service</button>
      </div>
    </form>
  </div>
</div>
@endsection

@section('scripts')
  <script src="{{ asset('js/services.js') }}?v={{ time() }}"></script>
@endsection
