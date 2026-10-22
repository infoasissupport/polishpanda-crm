@extends('layouts.app')

@section('title', 'Queue')

@section('page-id', 'queue')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/queue.css') }}?v={{ filemtime(public_path('css/queue.css')) }}">
@endsection

@section('content')
<section class="view" id="queue">
  <div class="q-header">
    <div>
  
      <div class="view-title q-title">Queue Management</div>
   
    </div>
    <button class="btn btn-accent q-header-btn" id="addBayBtn"><i class="ti ti-plus"></i>Add Bay</button>
  </div>
  <div class="fixedScrolldivCommon">

  <div class="q-stats">
    <div class="q-stat q-stat--orange">
      <span class="q-stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
      <div><div class="q-stat-label">Waiting</div><div class="q-stat-value" id="qStatWaiting">—</div><div class="q-stat-sub">In the waitlist</div></div>
    </div>
    <div class="q-stat q-stat--green">
      <span class="q-stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.2 10.2 6.9 5.6A2.4 2.4 0 0 1 9.1 4h5.8a2.4 2.4 0 0 1 2.2 1.6l1.7 4.6A2.6 2.6 0 0 1 21 12.8V17a1 1 0 0 1-1 1h-1v1.2a1.3 1.3 0 0 1-2.6 0V18H7.6v1.2a1.3 1.3 0 0 1-2.6 0V18H4a1 1 0 0 1-1-1v-4.2a2.6 2.6 0 0 1 2.2-2.6zm2.1-.2h9.4l-1.3-3.6a.9.9 0 0 0-.8-.6H9.4a.9.9 0 0 0-.8.6L7.3 10zM7 15.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm10 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z"/></svg></span>
      <div><div class="q-stat-label">In Bays</div><div class="q-stat-value" id="qStatActive">—</div><div class="q-stat-sub" id="qStatActiveSub">Starting &amp; washing</div></div>
    </div>
    <div class="q-stat q-stat--blue">
      <span class="q-stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/></svg></span>
      <div><div class="q-stat-label">Free Bays</div><div class="q-stat-value" id="qStatFree">—</div><div class="q-stat-sub">Ready for the next car</div></div>
    </div>
    <div class="q-stat q-stat--red">
      <span class="q-stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg></span>
      <div><div class="q-stat-label">Completed Today</div><div class="q-stat-value" id="qStatCompleted">—</div><div class="q-stat-sub">Finished washes</div></div>
    </div>
  </div>

  <div class="card q-section" id="washBays">
      <div class="q-section-head">
        <span class="q-section-title"><span class="q-section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V9l9-5l9 5v12"/><path d="M7 21v-8h10v8"/><path d="M7 17h10"/></svg></span>Wash Bays</span>
        <div class="q-legend">
          <span class="q-legend-item"><span class="q-dot q-dot--washing"></span>Washing</span>
          <span class="q-legend-item"><span class="q-dot q-dot--starting"></span>Starting</span>
          <span class="q-legend-item"><span class="q-dot q-dot--empty"></span>Empty</span>
        </div>
      </div>
      <div class="grid-3 q-bays" id="queueBaysGrid"></div>
  </div>

  <div class="card q-section" id="waitlist">
    <div class="card-title q-section-head">
      <span class="q-section-title"><span class="q-section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg></span>Waitlist<span class="q-count" id="waitlistCountBadge">0</span></span>
      <div class="cw-search">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path _ngcontent-ng-c389393698="" d="M14 14L11.1 11.1M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z" stroke="#172033" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
        <input type="text" id="waitlistSearchInput" placeholder="Search Vehicle, Customer, Service" aria-label="Search waitlist">
      </div>
    </div>
    <div class="table-scroll" id="waitlistTableScroll">
      <table>
        <thead>
          <tr>
            <th class="wl-col-num">#</th>
            <th>Vehicle</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Arrival Time</th>
            <th>Wait Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="queueWaitlistRows"></tbody>
      </table>
    </div>
    <div class="table-pagination">
      <span id="waitlistPageInfo"></span>
      <div class="pagination-btns">
        <button type="button" class="btn" id="waitlistPrevBtn">Prev</button>
        <button type="button" class="btn" id="waitlistNextBtn">Next</button>
      </div>
    </div>
  </div>

  <div class="card q-section" id="completed">
    <div class="card-title q-section-head" style="flex-wrap:wrap;gap:10px;">
      <span class="q-section-title"><span class="q-section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg></span><span id="completedTitleText">Today Completed Wash</span>
      <span class="tag" id="completedCountBadge" style="background:#E7F7EE;color:#166534;">0 washes</span></span>
      <div class="styleFleMain" >
        <div class="toolbar" style="background:none;border:0;padding:0;">
          <button type="button" class="chip cw-tab active" data-completed-tab="today" aria-pressed="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/></svg><span>Today Completed Wash</span></button>
          <button type="button" class="chip cw-tab" data-completed-tab="total" aria-pressed="false">Total Completed Wash</button>
        </div>
        <div class="cw-search">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 14L11.1 11.1M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z" stroke="#172033" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          <input type="text" id="completedSearchInput" placeholder="Search Vehicle, Customer, Service" aria-label="Search completed washes">
        </div>
      </div>
    </div>
    <div class="table-scroll" id="completedTableScroll">
      <table>
        <thead>
          <tr>
            <th class="wl-col-num">#</th>
            <th>Vehicle</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Staff</th>
            <th>Completed</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="queueCompletedRows"></tbody>
      </table>
    </div>
    <div class="table-pagination">
      <span id="completedPageInfo"></span>
      <div class="pagination-btns">
        <button type="button" class="btn" id="completedPrevBtn"><i class="ti ti-chevron-left"></i>Prev</button>
        <div class="pagination-pages" id="completedPageNums"></div>
        <button type="button" class="btn" id="completedNextBtn">Next<i class="ti ti-chevron-right"></i></button>
      </div>
    </div>
  </div>

  </div>

</section>

<div class="modal-overlay" id="assignBookingModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Start Work / Check In</div>
      <button class="icon-btn" onclick="window.SW.closeModal('assignBookingModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="assignBookingForm">
      <div class="modal-body">
        <input type="hidden" id="abBookingId">
        <input type="hidden" id="abService">
        <input type="hidden" id="abPhone">
        <input type="hidden" id="abBranchId">

        <div class="modal-row">
          <div class="field">
            <label class="label" for="abVehicle">Vehicle</label>
            <input type="text" id="abVehicle" readonly style="background:#f6f7f9;color:#475569;">
          </div>
          <div class="field">
            <label class="label" for="abCustomer">Customer</label>
            <input type="text" id="abCustomer" readonly style="background:#f6f7f9;color:#475569;">
          </div>
        </div>

        <div class="modal-row">
          <div class="field">
            <label class="label" for="abBay">Bay</label>
            <select id="abBay" required>
              <option value="">Select bay</option>
            </select>
          </div>
          <div class="field">
            <label class="label" for="abStaff">Assign Staff</label>
            <select id="abStaff" required>
              <option value="">Select staff</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('assignBookingModal')">Cancel</button>
        <button type="submit" class="btn btn-accent"><i class="ti ti-plus"></i>Start Work</button>
      </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="editWaitlistModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Edit Waitlist Entry</div>
      <button class="icon-btn" onclick="window.SW.closeModal('editWaitlistModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="editWaitlistForm">
      <div class="modal-body">
        <input type="hidden" id="ewId">
        <div class="modal-row">
          <div class="field">
            <label class="label" for="ewCustomer">Customer</label>
            <input type="text" id="ewCustomer" required placeholder="Customer Name">
          </div>
          <div class="field">
            <label class="label" for="ewPhone">Phone</label>
            <input type="tel" id="ewPhone" inputmode="numeric" pattern="[0-9]*" maxlength="15" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="Phone Number">
          </div>
        </div>
        <div class="modal-row">
          <div class="field">
            <label class="label" for="ewVehiclePlate">Vehicle Number</label>
            <input type="text" id="ewVehiclePlate" placeholder="Vehicle Number">
          </div>
          <div class="field">
            <label class="label" for="ewVehicle">Vehicle Model</label>
            <input type="text" id="ewVehicle" placeholder="Vehicle Model">
          </div>
        </div>
        <div class="field">
          <label class="label" for="ewService">Service</label>
          <input type="text" id="ewService" required placeholder="Service">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('editWaitlistModal')">Cancel</button>
        <button type="submit" class="btn btn-accent" id="editWaitlistSubmitBtn"><i class="ti ti-check"></i>Save changes</button>
      </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="completedJobModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="completedJobModalTitle">Job card</div>
      <button class="icon-btn" onclick="window.SW.closeModal('completedJobModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <div class="modal-body" id="completedJobModalBody"></div>
    <div class="modal-footer">
      <a class="btn" id="completedJobFullLink" href="/jobcards">Open full job card</a>
      <button type="button" class="btn btn-accent" onclick="window.SW.closeModal('completedJobModal')">Close</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="addBayModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Add Bay</div>
      <button class="icon-btn" onclick="window.SW.closeModal('addBayModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="addBayForm">
      <div class="modal-body">
        <div class="field">
          <label class="label" for="newBayName">Bay name</label>
          <input type="text" id="newBayName" required placeholder="Bay Name">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('addBayModal')">Cancel</button>
        <button type="submit" class="btn btn-accent"><i class="ti ti-plus"></i>Add Bay</button>
      </div>
    </form>
  </div>
</div>

@endsection

@section('scripts')
  <script src="{{ asset('js/queue.js') }}?v={{ filemtime(public_path('js/queue.js')) }}"></script>
@endsection
