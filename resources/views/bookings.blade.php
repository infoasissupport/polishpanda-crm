@extends('layouts.app')

@section('title', 'Bookings')

@section('page-id', 'bookings')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/bookings.css') }}">
@endsection

@section('content')
<section class="view" id="bookings">
  <div class="view-header">
    <div class="view-title">Bookings</div>
    <button class="btn btn-accent" id="newBookingBtn"><i class="ti ti-plus"></i>New wash</button>
  </div>
  <div class="toolbar" style="background:var(--surface);border:0.5px solid var(--border);border-radius:var(--radius-lg) var(--radius-lg) 0 0;">
    <div class="chip active" data-tab="list">List</div><div class="chip" data-tab="calendar">Calendar</div>
    <div style="margin-left:auto;display:flex;gap:8px;">
      <div class="chip active" data-source="all">All</div><div class="chip" data-source="online">Online</div><div class="chip" data-source="walkin">Walk-in</div><div class="chip" data-source="phone">Phone</div>
    </div>
  </div>

  <div id="bookingsListView">
    <div class="table-wrap" style="border-radius:0 0 var(--radius-lg) var(--radius-lg);border-top:none;">
      <div class="table-scroll">
        <table>
          <thead><tr><th class="col-sl">#</th><th>Time</th><th>Customer</th><th>Service</th><th>Source</th><th>Status</th><th></th></tr></thead>
          <tbody id="bookingsTableBody"></tbody>
        </table>
        <div class="dropdown-empty" id="bookingsEmptyState" style="display:none;">No bookings match your filters.</div>
      </div>
      <div class="table-pagination">
        <span id="bookingsPageInfo"></span>
        <div class="pagination-btns">
          <button type="button" class="btn" id="bookingsPrevBtn"><i class="ti ti-chevron-down" style="transform:rotate(90deg);display:inline-block;"></i>Prev</button>
          <button type="button" class="btn" id="bookingsNextBtn">Next<i class="ti ti-chevron-down" style="transform:rotate(-90deg);display:inline-block;"></i></button>
        </div>
      </div>
    </div>
  </div>

  <div id="bookingsCalendarView" style="display:none;">
    <div class="table-wrap" style="border-radius:0 0 var(--radius-lg) var(--radius-lg);border-top:none;padding:1.5rem;">
      <div class="timeline" id="bookingsTimeline"></div>
    </div>
  </div>
</section>

<div class="modal-overlay" id="newBookingModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="bookingModalTitle">New booking</div>
      <button class="icon-btn" onclick="window.SW.closeModal('newBookingModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="newBookingForm">
      <div class="modal-body">
        <div class="modal-row-3">
          <div class="field"><label for="nbCustomer">Customer name</label><input type="text" id="nbCustomer" required placeholder="e.g. Ravi Kumar"></div>
          <div class="field"><label for="nbStaff">Staff</label><select id="nbStaff"><option value="">Select staff</option></select></div>
          <div class="field"><label for="nbPhone">Phone</label><input type="tel" id="nbPhone" inputmode="numeric" pattern="[0-9]*" maxlength="15" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="e.g. 9876543210"></div>
        </div>
        <div class="modal-row-3">
          <div class="field"><label for="nbVehicle">Vehicle Name</label><input type="text" id="nbVehicle" placeholder="e.g. Honda City"></div>
          <div class="field"><label for="nbVehiclePlate">Vehicle Number</label><input type="text" id="nbVehiclePlate" placeholder="e.g. KL-07-BY-1234"></div>
          <div class="field"><label for="nbVehicleColor">Vehicle Color</label><input type="text" id="nbVehicleColor" placeholder="e.g. White"></div>
        </div>
        <div class="modal-row-3">
          <div class="field"><label for="nbBay">Bay</label>
            <select id="nbBay">
              <option value="">Select bay</option>
              <option value="Bay 1">Bay 1</option>
              <option value="Bay 2">Bay 2</option>
              <option value="Bay 3">Bay 3</option>
              <option value="Bay 4">Bay 4</option>
            </select>
          </div>
          <div class="field"><label for="nbVehicleType">Vehicle Type</label>
            <select id="nbVehicleType">
              <option value="hatchback">Hatchback</option>
              <option value="sedan" selected>Sedan</option>
              <option value="suv">SUV</option>
              <option value="luxury">Luxury</option>
              <option value="two-wheeler">2-Wheeler</option>
            </select>
          </div>
          <div class="field"><label for="nbSource">Source</label>
            <select id="nbSource">
              <option value="walkin">Walk-in</option>
              <option value="online">Online</option>
              <option value="phone">Phone</option>
            </select>
          </div>
        </div>
        <div class="field"><label for="nbDate">Date</label><input type="date" id="nbDate"></div>
        <div class="field" style="margin-bottom:14px;">
          <label style="margin-bottom:6px;display:block;">Select Services (Select one or more)</label>
          <div class="svc-select" id="nbSvcSelect">
            <div class="svc-select-control" id="nbSvcControl">
              <div class="svc-chip-list" id="nbSvcChips">
                <span class="svc-placeholder" id="nbSvcPlaceholder">Search and select services…</span>
              </div>
              <i class="ti ti-chevron-down svc-caret"></i>
            </div>
            <div class="svc-dropdown" id="nbSvcDropdown">
              <div class="svc-dropdown-search">
                <i class="ti ti-search"></i>
                <input type="text" id="nbServiceSearch" class="svc-search-input" placeholder="Search services…" aria-label="Search services" autocomplete="off">
              </div>
              <div id="nbServicesContainer" class="svc-options">
                <!-- Dynamic checkboxes -->
              </div>
              <div class="svc-empty" id="nbSvcEmpty" style="display:none;">No services match your search.</div>
            </div>
          </div>
        </div>
        <div class="field"><label for="nbTime">Time</label><input type="time" id="nbTime"></div>
        <div class="field"><label for="nbNotes">Notes</label><textarea id="nbNotes" placeholder="Optional"></textarea></div>

        <!-- Optional Follow-up Reminder Section -->
        <div class="field" style="margin-top:14px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
            <label style="font-weight:600;color:#0f172a;display:flex;align-items:center;gap:6px;margin:0;font-size:13px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent,#d97706);flex-shrink:0;" aria-hidden="true"><path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/><path d="M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727"/><path d="M3 6.727a11.05 11.05 0 0 1 2.792 -3.727"/></svg>
              Follow-up Reminder <span style="font-size:11.5px;font-weight:400;color:#64748b;">(Optional)</span>
            </label>
            <span style="font-size:11px;color:#64748b;">Notifies only when job card is completed</span>
          </div>
          <div class="modal-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px;">
            <div class="field" style="margin-bottom:0;">
              <label for="nbReminderType" style="font-size:12px;color:#475569;">Reminder Timing</label>
              <select id="nbReminderType">
                <option value="none">No Reminder</option>
                <option value="1_week">1 Week (7 Days)</option>
                <option value="1_month">1 Month (30 Days)</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>
            <div class="field" id="nbReminderDateWrap" style="display:none;margin-bottom:0;">
              <label for="nbReminderDate" style="font-size:12px;color:#475569;">Reminder Date</label>
              <input type="date" id="nbReminderDate">
            </div>
          </div>
          <div class="field" id="nbReminderNoteWrap" style="display:none;margin-bottom:0;margin-top:8px;">
            <label for="nbReminderNote" style="font-size:12px;color:#475569;">Reminder Note</label>
            <input type="text" id="nbReminderNote" placeholder="e.g. Ceramic coating inspection / periodic maintenance wash" autocomplete="off">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger" id="deleteBookingBtn" style="display:none;background:var(--danger-bg);color:var(--danger-text);border-color:transparent;"><i class="ti ti-trash"></i>Delete</button>
        <div style="margin-left:auto;display:flex;gap:8px;">
          <button type="button" class="btn" onclick="window.SW.closeModal('newBookingModal')">Cancel</button>
          <button type="submit" class="btn btn-accent" id="bookingSubmitBtn"><i class="ti ti-plus"></i>Create booking</button>
        </div>
      </div>
    </form>
  </div>
</div>
@endsection

@section('scripts')
  <script src="{{ asset('js/bookings.js') }}?v={{ time() }}"></script>
@endsection
