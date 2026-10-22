@extends('layouts.app')

@section('title', 'Staff')

@section('page-id', 'staff')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/staff.css') }}?v={{ filemtime(public_path('css/staff.css')) }}">
@endsection

@section('content')
<section class="view" id="staff">
  <div class="view-header">
    <div>
      <div class="view-title">Staff Management</div>
    </div>
    <div class="styleFleallmainStaff" >
      <button class="btn" id="exportStaffBtn"><i class="ti ti-download"></i>Export</button>
      <button class="btn btn-accent" id="addEmployeeBtn"><i class="ti ti-plus"></i>Add employee</button>
      <button class="btn btn-staff-secondaryWhite" id="dailyAttendanceBtn"><i class="ti ti-calendar-event"></i>Daily Attendance</button>
    </div>
  </div>

  <!-- Everything below the header scrolls in one area; the header stays fixed -->
  <div class="stf-scroll-area" id="staffScrollArea">
  <div class="stf-stats-grid">
    <div class="stf-stat-card">
      <div class="stf-stat-icon stf-badge-blue"><i class="ti ti-users"></i></div>
      <div class="stf-stat-body">
        <div class="stf-stat-label">Total Staff</div>
        <div class="stf-stat-value" id="kpiTotalStaff">0</div>
        <div class="stf-stat-sub">All employees</div>
      </div>
    </div>
    <div class="stf-stat-card">
      <div class="stf-stat-icon stf-badge-green"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12 11 15 16 9"></polyline></svg></div>
      <div class="stf-stat-body">
        <div class="stf-stat-label">Present</div>
        <div class="stf-stat-value" id="kpiPresentToday">0</div>
        <div class="stf-stat-sub">Checked in today</div>
      </div>
    </div>
    <div class="stf-stat-card">
      <div class="stf-stat-icon stf-badge-red"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></div>
      <div class="stf-stat-body">
        <div class="stf-stat-label">Absent</div>
        <div class="stf-stat-value" id="kpiAbsentToday">0</div>
        <div class="stf-stat-sub">Not marked present</div>
      </div>
    </div>
    <div class="stf-stat-card">
      <div class="stf-stat-icon stf-badge-amber"><i class="ti ti-clock-hour-4"></i></div>
      <div class="stf-stat-body">
        <div class="stf-stat-label">Late</div>
        <div class="stf-stat-value" id="kpiLateToday">0</div>
        <div class="stf-stat-sub">Checked in late</div>
      </div>
    </div>
  </div>

  <div class="stf-tabs-row">
  <div class="stf-tabs" id="staffTabs">
    <button type="button" class="stf-tab active" data-tab="employee"><i class="ti ti-id-badge-2"></i>Employees Detail</button>
    <button type="button" class="stf-tab" data-tab="attendance"><i class="ti ti-calendar-stats"></i>Attendance Detail</button>
  </div>

    <div class="stf-toolbar">
    <div class="stf-search-field">

      <div class="stf-search-box">
        <i class="ti ti-search"></i>
        <input type="text" id="staffSearchInput" placeholder="Search staff by name, phone or email..." autocomplete="off">
      </div>
    </div>
    <div class="stf-attendance-controls">
      <!-- <div class="stf-filter-field">
        <label for="staffFilterSelect">Filter:</label>
        <select id="staffFilterSelect">
          <option value="all">All</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="on_leave">On Leave</option>
        </select>
      </div> -->
      <!-- <div class="stf-date-field">
        <label for="attendanceDate">Date:</label>
        <input type="date" id="attendanceDate">
      </div> -->
    </div>
  </div>
  </div>

  <div class="divScrollingMainAll">


  <div class="stf-employee-view">
    <div class="emp-grid" id="employeeGrid"></div>
    <div class="stf-empty" id="employeeEmptyState" style="display:none;">No staff match your search.</div>
  </div>

  <div class="stf-table-wrap stf-attendance-view">
    <div class="stf-table-scroll">
      <table class="stf-table">
        <thead><tr><th class="col-sl">#</th><th>Name</th><th>Shift</th><th>Date</th><th>Attendance</th><th>Today's Jobs</th><th>Action</th></tr></thead>
        <tbody id="staffTableBody"></tbody>
      </table>
      <div class="stf-empty" id="staffEmptyState" style="display:none;">No staff match your search.</div>
    </div>
    <div class="stf-pagination">
      <span id="staffPageInfo"></span>
      <div class="pagination-btns">
        <button type="button" class="btn" id="staffPrevBtn"><i class="ti ti-chevron-down" style="transform:rotate(90deg);display:inline-block;"></i></button>
        <div class="pagination-pages" id="staffPageNumbers"></div>
        <button type="button" class="btn" id="staffNextBtn"><i class="ti ti-chevron-down" style="transform:rotate(-90deg);display:inline-block;"></i></button>
      </div>
    </div>
  </div>
  </div>
  </div>

</section>

<div class="modal-overlay" id="staffModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="staffModalTitle">Add staff</div>
      <button class="icon-btn" onclick="window.SW.closeModal('staffModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="staffForm">
      <div class="modal-body">
        <div class="field" style="display:flex;align-items:center;gap:14px;">
          <div class="stf-photo-picker" id="stfPhotoPicker" title="Add profile photo">
            <img id="stfPhotoPreview" alt="" style="display:none;">
            <svg id="stfPhotoPlaceholderIcon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="8" r="4"></circle></svg>
          </div>
          <input type="file" id="stfPhotoInput" accept="image/*" style="display:none;">
          <div>
            <div style="font-size:13px;font-weight:600;color:#667085;margin-bottom:2px;">Profile photo</div>
            <div style="font-size:11.5px;color:#98a2b3;">Click the circle to upload a photo</div>
          </div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="stfFirstName">First name</label><input type="text" id="stfFirstName" required placeholder="e.g. Arun"></div>
          <div class="field"><label for="stfLastName">Last name</label><input type="text" id="stfLastName" placeholder="e.g. Kumar"></div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="stfEmployeeId">Employee ID</label><input type="text" id="stfEmployeeId" placeholder="e.g. EMP-1042"></div>
          <div class="field"><label for="stfNativePlace">Native Place</label><input type="text" id="stfNativePlace" placeholder="e.g. Thrissur"></div>
        </div>
        <div class="modal-row-3">
          <div class="field"><label for="stfGender">Gender</label>
            <select id="stfGender">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="field"><label for="stfAge">Age</label><input type="number" id="stfAge" min="16" max="80" placeholder="e.g. 28"></div>
          <div class="field"><label for="stfMaritalStatus">Marital Status</label>
            <select id="stfMaritalStatus">
              <option value="">Select status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="stfHighestEducation">Highest Education</label><input type="text" id="stfHighestEducation" placeholder="e.g. B.Com, 12th Pass, Diploma"></div>
          <div class="field"><label for="stfJoinedAt">Joining Date</label><input type="date" id="stfJoinedAt"></div>
        </div>
        <div class="modal-row">
          <div class="field stf-doc-field">
            <label>ID Proof (Aadhar / PAN)</label>
            <div class="stf-doc-row">
              <button type="button" class="btn" id="stfIdProofBtn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>Upload</button>
              <span class="stf-doc-status" id="stfIdProofStatus">No file uploaded</span>
              <a href="#" id="stfIdProofLink" target="_blank" style="display:none;">View</a>
            </div>
            <input type="file" id="stfIdProofInput" accept="image/*,.pdf" style="display:none;">
          </div>
          <div class="field stf-doc-field">
            <label>PCC Certificate</label>
            <div class="stf-doc-row">
              <button type="button" class="btn" id="stfPccBtn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>Upload</button>
              <span class="stf-doc-status" id="stfPccStatus">No file uploaded</span>
              <a href="#" id="stfPccLink" target="_blank" style="display:none;">View</a>
            </div>
            <input type="file" id="stfPccInput" accept="image/*,.pdf" style="display:none;">
          </div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="stfPhone">Phone</label><input type="tel" id="stfPhone" inputmode="numeric" pattern="[0-9]*" maxlength="15" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="e.g. 9876543210"></div>
          <div class="field" id="emailFieldContainer"><label for="stfEmail">Email</label><input type="email" id="stfEmail" placeholder="e.g. arun@example.com"></div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="stfRole">Role</label>
            <select id="stfRole" onchange="toggleManagerFields()">
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div class="field"><label for="stfShift">Shift</label>
            <select id="stfShift">
              <option>9 AM – 6 PM</option>
              <option>8 AM – 5 PM</option>
              <option>1 PM – 10 PM</option>
            </select>
          </div>
        </div>
        <div class="modal-row" id="managerPasswordRow" style="display:none;">
          <div class="field"><label for="stfPassword">Password (For Manager Login)</label><input type="text" id="stfPassword" placeholder="e.g. secret123"></div>
          <div class="field"></div>
        </div>
        <input type="hidden" id="stfBranch">
        <input type="hidden" id="stfAttendance" value="present">
        <input type="hidden" id="stfLeaveType">
        <div class="field"><label for="stfSalary">Base Salary (₹/mo)</label><input type="number" id="stfSalary" min="0" value="0" placeholder="e.g. 15000"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('staffModal')">Cancel</button>
        <button type="submit" class="btn btn-accent" id="staffSubmitBtn"><i class="ti ti-user-plus"></i>Add staff</button>
      </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="attendanceModal">
  <div class="modal" style="max-width: 520px;">
    <div class="modal-header">
      <div class="modal-title">Daily Attendance</div>
      <button class="icon-btn" onclick="window.SW.closeModal('attendanceModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="attendanceForm">
      <div class="modal-body">
        <p style="margin-bottom: 1.25rem; color: #667085; font-size: 0.85rem; line-height: 1.4;">
          Update the attendance status of all staff members for today.
        </p>
        <div id="attendanceStaffList" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 400px; overflow-y: auto; padding-right: 4px;">
          <!-- Staff rows will be rendered here dynamically -->
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn" onclick="window.SW.closeModal('attendanceModal')">Cancel</button>
        <button type="submit" class="btn btn-accent"><i class="ti ti-check"></i>Save Attendance</button>
      </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="calendarModal">
  <div class="modal" style="max-width: 600px;">
    <div class="modal-header">
      <div class="modal-title" id="calendarModalTitle">Monthly Attendance</div>
      <button class="icon-btn" onclick="window.SW.closeModal('calendarModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <div class="modal-body">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <button class="icon-btn" id="prevMonthBtn"><i class="ti ti-chevron-left"></i></button>
        <div id="calendarMonthDisplay" style="font-weight:600; font-size:1.1rem; color:#101828;"></div>
        <button class="icon-btn" id="nextMonthBtn"><i class="ti ti-chevron-right"></i></button>
      </div>
      <div id="calendarGrid" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:4px; text-align:center;">
        <!-- Days of week -->
        <div style="font-size:0.75rem; color:#667085; font-weight:600; padding-bottom:8px;">Sun</div>
        <div style="font-size:0.75rem; color:#667085; font-weight:600; padding-bottom:8px;">Mon</div>
        <div style="font-size:0.75rem; color:#667085; font-weight:600; padding-bottom:8px;">Tue</div>
        <div style="font-size:0.75rem; color:#667085; font-weight:600; padding-bottom:8px;">Wed</div>
        <div style="font-size:0.75rem; color:#667085; font-weight:600; padding-bottom:8px;">Thu</div>
        <div style="font-size:0.75rem; color:#667085; font-weight:600; padding-bottom:8px;">Fri</div>
        <div style="font-size:0.75rem; color:#667085; font-weight:600; padding-bottom:8px;">Sat</div>
      </div>
      <div id="calendarDays" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:4px; text-align:center;">
        <!-- Calendar days injected here -->
      </div>
      <div id="calendarLoading" style="display:none; text-align:center; padding:2rem; color:#667085;">Loading attendance data...</div>
    </div>
  </div>
</div>
@endsection

@section('scripts')
  <script>
    function toggleManagerFields() {
      var role = document.getElementById('stfRole').value;
      var passRow = document.getElementById('managerPasswordRow');
      if (role === 'manager') {
        passRow.style.display = 'flex';
      } else {
        passRow.style.display = 'none';
      }
    }
    
    // Auto-generate employee ID
    document.addEventListener('DOMContentLoaded', function() {
      // Small timeout to ensure staff.js variables have populated if needed
      setTimeout(function() {
        if (typeof STAFF_DATA !== 'undefined') {
          // Just a local helper to generate next ID for a new form
          window.generateNextEmpId = function() {
            if (document.getElementById('stfEmployeeId') && !document.getElementById('stfEmployeeId').value) {
                var maxId = 0;
                // find highest EMPxxx
                document.querySelectorAll('.staff-card-header .text-xs').forEach(function(el) {
                    var match = el.textContent.match(/EMP(\d+)/);
                    if(match) {
                        var id = parseInt(match[1]);
                        if(id > maxId) maxId = id;
                    }
                });
                var nextId = maxId + 1;
                document.getElementById('stfEmployeeId').value = 'EMP' + nextId.toString().padStart(3, '0');
            }
          };
        }
      }, 500);
    });
  </script>
  <script src="{{ asset('js/staff.js') }}?v={{ time() }}"></script>
@endsection