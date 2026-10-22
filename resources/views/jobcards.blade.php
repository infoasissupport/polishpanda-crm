@extends('layouts.app')

@section('title', 'Job Cards')

@section('page-id', 'jobcards')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/jobcards.css') }}?v={{ filemtime(public_path('css/jobcards.css')) }}">
@endsection

@section('content')
<section class="view" id="jobcards">
  <div class="view-header">

      <div class="view-title">Job Cards</div>

  

  </div>

  <div class="fixedScrolldivCommon" id="jcScrollArea">
    <div class="jc-toolbar">
      <div class="jc-search">
        <i class="ti ti-search"></i>
        <input type="text" id="jcSearchInput" placeholder="Search by Job Card, Vehicle or Customer..." aria-label="Search job cards">
      </div>
      <button type="button" class="btn jc-filter-toggle" id="jcFilterToggle">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 4 20 4 14 12.5 14 19 10 21 10 12.5 4 4"></polygon></svg>Filters<span class="jc-filter-badge" id="jcFilterBadge" style="display:none;"></span>
        <i class="ti ti-chevron-down jc-filter-chevron"></i>
      </button>
      <div class="jc-filter-fields" id="jcFilterFields">
        <label class="jc-field" for="jcFilterBay"><svg class="jc-field-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 3 3 10.5l7.5 3 3 7.5z"/></svg><select id="jcFilterBay" aria-label="Filter by bay"><option value="">All Bays</option></select></label>
        <label class="jc-field" for="jcFilterService"><svg class="jc-field-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg><select id="jcFilterService" aria-label="Filter by service"><option value="">All Services</option></select></label>
        <label class="jc-field jc-field--date" for="jcFilterDate"><svg class="jc-field-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/></svg><input type="date" id="jcFilterDate" aria-label="Filter by date"></label>
        <button type="button" class="btn jc-btn-clear" id="jcClearFilters"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.9-3.9L4 8.5"/><path d="M4 3.5v5h5"/><path d="M4 13a8 8 0 0 0 14.9 3.9l1.1-1.4"/><path d="M20 20.5v-5h-5"/></svg>Clear</button>
        <button type="button" class="btn btn-accent jc-btn-apply" id="jcApplyFilters"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="4 4 20 4 14 12.5 14 19 10 21 10 12.5 4 4"/></svg>Apply</button>
      </div>
    </div>

    <div class="table-scroll" id="jcTableScroll">
      <table>
        <thead>
          <tr>
            <th class="jc-col-sl" title="Sl No">#</th>
            <th>Job Card</th>
            <th>Vehicle &amp; Customer</th>
            <th>Service</th>
            <th>Bay</th>
            <th>Assigned To</th>
            <th>Start Time</th>
            <th>Notes</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="jcTableRows"></tbody>
      </table>
    </div>

    <div class="table-pagination">
      <span id="jcPageInfo"></span>
      <div class="pagination-btns" id="jcPager">
        <button type="button" class="btn" id="jcPagePrev">Prev</button>
        <div class="pagination-pages"></div>
        <button type="button" class="btn" id="jcPageNext">Next</button>
      </div>
    </div>
  </div>
</section>

<div class="modal-overlay" id="jobCardModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="jobCardModalTitle">Job card</div>
      <button class="icon-btn" onclick="window.SW.closeModal('jobCardModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <div class="modal-body" id="jobCardModalBody"></div>
    <div class="modal-footer" id="jobCardModalFooter"></div>
  </div>
</div>

<div class="modal-overlay" id="newJobCardModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">New job card</div>
      <button class="icon-btn" onclick="window.SW.closeModal('newJobCardModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="newJobCardForm">
      <div class="modal-body">
        <div class="modal-row">
          <div class="field"><label for="njCustomer">Customer</label><input type="text" id="njCustomer" placeholder="e.g. Ravi Kumar"></div>
          <div class="field"><label for="njVehicle">Vehicle</label><input type="text" id="njVehicle" required placeholder="e.g. Honda City"><div id="njVehicleLoyalty" style="font-size:12px;color:#10B981;margin-top:4px;display:none;font-weight:600;"></div></div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="njService">Service</label>
            <select id="njService" required>
              <option value="">Select a service</option>
            </select>
          </div>
          <div class="field"><label for="njBay">Bay</label>
            <select id="njBay">
              <option>Bay 1</option>
              <option>Bay 2</option>
              <option>Bay 3</option>
              <option>Bay 4</option>
            </select>
          </div>
        </div>
        <div class="field"><label for="njStaff">Assigned staff</label>
          <select id="njStaff">
            <option value="">Select staff</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('newJobCardModal')">Cancel</button>
        <button type="submit" class="btn btn-accent"><i class="ti ti-plus"></i>Create job card</button>
      </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="startJobModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Start Job</div>
      <button class="icon-btn" onclick="window.SW.closeModal('startJobModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="sjJobId">
      <p style="font-size:12.5px;color:var(--text-3);margin-bottom:12px;">Add a photo of the vehicle's starting condition before beginning work (optional).</p>
      <div class="jc-photo-grid" id="sjPhotoGrid">
        <button type="button" class="jc-add-photo" id="sjAddPhotoBtn" title="Upload from Gallery">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        </button>
        <button type="button" class="jc-add-photo" id="sjTakePhotoBtn" title="Take Photo Directly" style="color:var(--accent); border-color:var(--accent);">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/></svg>
        </button>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn" onclick="window.SW.closeModal('startJobModal')">Cancel</button>
      <button type="button" class="btn btn-accent" id="sjConfirmBtn"><i class="ti ti-check"></i>Start Job</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="editJobCardModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Edit job card</div>
      <button class="icon-btn" onclick="window.SW.closeModal('editJobCardModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="editJobCardForm">
      <div class="modal-body">
        <input type="hidden" id="ejId">
        <div class="field"><label for="ejCustomer">Customer</label><input type="text" id="ejCustomer" placeholder="Customer name"></div>
        <div class="field"><label for="ejVehicle">Vehicle</label><input type="text" id="ejVehicle" required placeholder="e.g. Honda City"></div>
        <div class="field"><label for="ejService">Service</label><input type="text" id="ejService" required placeholder="e.g. Foam wash"></div>
        <div class="modal-row">
          <div class="field"><label for="ejBay">Bay</label>
            <select id="ejBay">
              <option value="">Select bay</option>
            </select>
          </div>
          <div class="field"><label for="ejStaff">Assigned staff</label>
            <select id="ejStaff" required>
              <option value="">Select staff</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('editJobCardModal')">Cancel</button>
        <button type="submit" class="btn btn-accent"><i class="ti ti-check"></i>Save changes</button>
      </div>
    </form>
  </div>
</div>
@endsection

@section('scripts')
  <script src="{{ asset('js/jobcards.js') }}?v={{ time() }}"></script>
@endsection
