@extends('layouts.app')

@section('title', 'Customers')

@section('page-id', 'crm')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/crm.css') }}?v={{ filemtime(public_path('css/crm.css')) }}">
@endsection

@section('content')
<section class="view" id="crm">
  <div class="view-header crm-header">
    <div class="view-title">Customers</div>
    <div class="crm-header-search">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path _ngcontent-ng-c389393698="" d="M14 14L11.1 11.1M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z" stroke="#172033" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      <input id="crmSearchInput" aria-label="Search by customer, vehicle name, vehicle number or brand" placeholder="Search by customer, vehicle name, vehicle number or brand" autocomplete="off">
    </div>
    <button class="btn btn-accent" id="crmExportBtn"><i class="ti ti-download"></i>Export</button>
  </div>
  <div class="table-wrap">
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="col-sl">#</th>
            <th>Customer</th>
            <th>Vehicle Name</th>
            <th>Vehicle Number</th>
            <th>Brand / Model</th>
            <th>Car Type</th>
            <th>Services</th>
            <th>Last Wash Detail</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="crmTableBody"></tbody>
      </table>
      <div class="dropdown-empty" id="crmEmptyState" style="display:none;">No customers or vehicles match your search.</div>
    </div>
    <div class="table-pagination">
      <span id="crmPageInfo"></span>
      <div class="pagination-btns">
        <button type="button" class="btn" id="crmPrevBtn">Prev</button>
        <button type="button" class="btn" id="crmNextBtn">Next</button>
      </div>
    </div>
  </div>
</section>

<div class="modal-overlay" id="addCustomerModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Add customer</div>
      <button class="icon-btn" onclick="window.SW.closeModal('addCustomerModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="addCustomerForm">
      <div class="modal-body">
        <div class="field"><label for="acName">Customer name</label><input type="text" id="acName" required placeholder="e.g. Deepak Menon"></div>
        <div class="modal-row">
          <div class="field"><label for="acPhone">Phone</label><input type="tel" id="acPhone" inputmode="numeric" pattern="[0-9]*" maxlength="15" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="e.g. 9876543210"></div>
          <div class="field"><label for="acDistrict">District</label><input type="text" id="acDistrict" placeholder="e.g. Kottayam"></div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="acVehicle">Vehicle</label><input type="text" id="acVehicle" placeholder="e.g. Maruti Swift"></div>
          <div class="field"><label for="acPlate">Vehicle number</label><input type="text" id="acPlate" placeholder="e.g. KL-05-AB-1234"></div>
        </div>
        <div class="field"><label for="acPlan">Plan</label>
          <select id="acPlan">
            <option value="none">No plan</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
        <div class="field"><label for="acGstin">GSTIN</label><input type="text" id="acGstin" placeholder="32ABCDE1234F1Z5"></div>
        <div class="modal-row">
          <div class="field"><label for="acFollowUp">Follow-up due</label><input type="date" id="acFollowUp"></div>
          <div class="field"><label for="acLoyalty">Loyalty points</label><input type="number" id="acLoyalty" min="0" value="0"></div>
        </div>
        <div class="field"><label for="acNotes">Notes</label><textarea id="acNotes" placeholder="Optional"></textarea></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('addCustomerModal')">Cancel</button>
        <button type="submit" class="btn btn-accent"><i class="ti ti-user-plus"></i>Add customer</button>
      </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="editVehicleModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Edit Vehicle</div>
      <button class="icon-btn" onclick="window.SW.closeModal('editVehicleModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="editVehicleForm">
      <div class="modal-body">
        <div class="modal-row">
          <div class="field"><label for="evCustomerName">Customer</label><input type="text" id="evCustomerName" placeholder="e.g. Ravi Kumar"></div>
          <div class="field"><label for="evCustomerPhone">Phone</label><input type="tel" id="evCustomerPhone" inputmode="numeric" pattern="[0-9]*" maxlength="15" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="e.g. 9876543210"></div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="evPlate">Vehicle Number</label><input type="text" id="evPlate" readonly style="background:var(--bg-2);cursor:not-allowed;"></div>
          <div class="field"><label for="evBrand">Brand / Model</label><input type="text" id="evBrand" required placeholder="e.g. Honda City"></div>
        </div>
 
        <div class="modal-row">
          <div class="field"><label for="evType">Vehicle Type</label>
            <select id="evType">
              <option value="hatchback">Hatchback</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="luxury">Luxury</option>
              <option value="two-wheeler">2-Wheeler</option>
            </select>
          </div>
          <div class="field"><label for="evLastWash">Last Wash Detail</label><input type="text" id="evLastWash" placeholder="e.g. 12 Aug 2026"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('editVehicleModal')">Cancel</button>
        <button type="submit" class="btn btn-accent" id="saveVehicleBtn"><i class="ti ti-check"></i>Save changes</button>
      </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="exportModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Export Customers</div>
      <button class="icon-btn" onclick="window.SW.closeModal('exportModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <div class="modal-body">
      <div class="field">
        <label for="exportScope">Export Scope</label>
        <select id="exportScope" onchange="document.getElementById('exportCustomerField').style.display = this.value === 'single' ? 'block' : 'none'">
          <option value="all">Export All Customers</option>
          <option value="single">Export Specific Customer</option>
        </select>
      </div>
      <div class="field" id="exportCustomerField" style="display:none; margin-top: 15px;">
        <label for="exportCustomerSelect">Select Customer</label>
        <select id="exportCustomerSelect">
           <!-- Populated dynamically -->
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn" onclick="window.SW.closeModal('exportModal')">Cancel</button>
      <button type="button" class="btn btn-accent" id="confirmExportBtn"><i class="ti ti-download"></i>Download CSV</button>
    </div>
  </div>
</div>

@endsection

@section('scripts')
  <script src="{{ asset('js/crm.js') }}?v={{ filemtime(public_path('js/crm.js')) }}"></script>
@endsection
