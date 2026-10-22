<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Shinewise — Manager Portal</title>
  <link rel="stylesheet" href="{{ asset('css/icons.css') }}?v={{ filemtime(public_path('css/icons.css')) }}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/common.css') }}?v={{ filemtime(public_path('css/common.css')) }}">
  <link rel="stylesheet" href="{{ asset('css/manager.css') }}?v={{ time() }}">
</head>
<body>

  <!-- ============ HEADER ============ -->
  <header class="m-header">
    <div class="m-brand">
      <img src="{{ asset('images/forward-logo-256.png') }}" alt="Forward Prime Solutions" class="brand-logo-img" style="height:40px;width:40px;display:block;object-fit:contain;">
    </div>
    <div class="m-header-right">
      <div style="position:relative;">
        <div class="m-branch-pill" id="branchToggle">
          <i class="ti ti-map-pin"></i>
          <span id="branchLabel">Loading...</span>
          <i class="ti ti-chevron-down" style="font-size:11px;"></i>
        </div>
        <div class="dropdown-menu" id="branchMenu">
          <!-- Loaded dynamically -->
        </div>
      </div>
      <button class="m-icon-btn danger" id="logoutBtn" aria-label="Log out"><i class="ti ti-logout"></i></button>
    </div>
  </header>

  <!-- ============ STATS OVERVIEW ============ -->
  <section class="m-stats-row">
    <div class="m-stat-card accented">
      <div class="m-stat-val" id="statCompletedToday">0</div>
      <div class="m-stat-label">Today's Washes</div>
    </div>
    <div class="m-stat-card">
      <div class="m-stat-val" id="statWaitingList">0</div>
      <div class="m-stat-label">Waiting List</div>
    </div>
  </section>

  <!-- ============ MAIN VIEWPORT ============ -->
  <main class="m-view-container">

    <!-- TAB 1: QUEUE (Bays & Waitlist) -->
    <div class="m-tab-view active" id="view-queue">
      <div class="m-section-title">Washing Bays</div>
      <div class="m-bays-list" id="baysGrid">
        <!-- Loaded dynamically -->
      </div>

      <div class="m-section-title">
        Waitlist
        <span class="badge" id="waitlistCountBadge">0</span>
      </div>
      <div class="m-list-wrapper" id="waitlistRows">
        <!-- Loaded dynamically -->
      </div>
    </div>

    <!-- TAB 2: JOB CARDS -->
    <div class="m-tab-view" id="view-jobcards">
      <div class="m-filter-bar" id="jobcardFilters">
        <button class="m-filter-btn active" data-stage="active">Active</button>
        <button class="m-filter-btn" data-stage="pending">Pending</button>
        <button class="m-filter-btn" data-stage="inprogress">In Progress</button>
        <button class="m-filter-btn" data-stage="completed">Completed</button>
      </div>

      <div class="m-list-wrapper" id="jobcardsList">
        <!-- Loaded dynamically -->
      </div>
    </div>

    <!-- TAB 3: SERVICES -->
    <div class="m-tab-view" id="view-services">
      <div class="m-section-title">Available Services</div>
      <div class="m-list-wrapper" id="servicesList">
        <!-- Loaded dynamically -->
      </div>
    </div>

    <!-- TAB 4: BILLING -->
    <div class="m-tab-view" id="view-billing">
      <div class="m-section-title">Pending Billing & Invoices</div>
      <div class="m-list-wrapper" id="billingInvoicesList">
        <!-- Loaded dynamically -->
      </div>
    </div>

  </main>

  <!-- ============ FLOATING ACTION BUTTON ============ -->
  <div class="m-fab" id="newWashFab" title="New Wash Check-in">
    <i class="ti ti-plus"></i>
  </div>

  <!-- ============ BOTTOM NAVIGATION BAR ============ -->
  <nav class="m-tab-bar">
    <div class="m-tab-item active" data-tab="queue">
      <i class="ti ti-clock-hour-4"></i>
      <span>Queue</span>
    </div>
    <div class="m-tab-item" data-tab="jobcards">
      <i class="ti ti-clipboard-check"></i>
      <span>Job cards</span>
    </div>
    <div class="m-tab-item" data-tab="services">
      <i class="ti ti-wash"></i>
      <span>Services</span>
    </div>
    <div class="m-tab-item" data-tab="billing">
      <i class="ti ti-credit-card"></i>
      <span>Billing</span>
    </div>
  </nav>

  <!-- ============ MODAL: NEW WASH CHECK-IN ============ -->
  <div class="modal-overlay" id="newWashModal">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">New Wash Booking</div>
        <button class="m-icon-btn" onclick="closeModal('newWashModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
      </div>
      <form id="newWashForm">
        <div class="modal-body">
          <div class="field">
            <label class="label" for="nwCustomer">Customer Name</label>
            <input type="text" id="nwCustomer" placeholder="e.g. Aromal Manohar" required>
          </div>
          <div class="field">
            <label class="label" for="nwPhone">Phone Number</label>
            <input type="tel" id="nwPhone" inputmode="numeric" pattern="[0-9]*" maxlength="15" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="e.g. 9876543210">
          </div>
          <div class="field">
            <label class="label" for="nwVehicle">Vehicle Name / Model</label>
            <input type="text" id="nwVehicle" placeholder="e.g. Honda City / Swift">
          </div>
          <div class="modal-row" style="display:grid;grid-template-columns:1.2fr 1fr;gap:10px;">
            <div class="field">
              <label class="label" for="nwVehiclePlate">Vehicle Number</label>
              <input type="text" id="nwVehiclePlate" placeholder="e.g. KL 01 CD 5678" style="text-transform:uppercase;" required>
            </div>
            <div class="field">
              <label class="label" for="nwVehicleType">Vehicle Type</label>
              <select id="nwVehicleType" required>
                <option value="Hatchback">Hatchback</option>
                <option value="Sedan" selected>Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Luxury">Luxury</option>
                <option value="Bike">Bike / Two Wheeler</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label class="label" for="nwService">Service Category</label>
            <select id="nwService" required>
              <!-- Loaded dynamically -->
            </select>
          </div>
          <div class="field">
            <label class="label" for="nwNotes">Special instructions</label>
            <textarea id="nwNotes" rows="2" placeholder="e.g. Clean alloys carefully"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn" onclick="closeModal('newWashModal')">Cancel</button>
          <button type="submit" class="btn btn-accent"><i class="ti ti-plus"></i>Check In</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ============ MODAL: START WASH ASSIGNMENT ============ -->
  <div class="modal-overlay" id="startWashModal">
    <div class="modal" style="max-width:480px;">
      <div class="modal-header">
        <div class="modal-title">Start Work / Check In</div>
        <button type="button" class="m-icon-btn" onclick="closeModal('startWashModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
      </div>
      <form id="startWashForm">
        <div class="modal-body">
          <input type="hidden" id="swBookingId">
          <div class="field">
            <label class="label" for="swVehicleText">Vehicle</label>
            <input type="text" id="swVehicleText" readonly style="font-weight:600;">
          </div>
          <div class="field">
            <label class="label" for="swServiceText">Service</label>
            <input type="text" id="swServiceText" readonly>
          </div>
          <div class="modal-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="field">
              <label class="label" for="swBay">Bay</label>
              <select id="swBay" required>
                <option value="Bay 1">Bay 1</option>
                <option value="Bay 2">Bay 2</option>
                <option value="Bay 3">Bay 3</option>
                <option value="Bay 4">Bay 4</option>
              </select>
            </div>
            <div class="field">
              <label class="label" for="swStaff">Assign Staff</label>
              <select id="swStaff" required>
                <!-- Loaded dynamically -->
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;">
          <button type="button" class="btn" onclick="closeModal('startWashModal')">Cancel</button>
          <button type="submit" class="btn btn-accent" style="font-weight:600;"><i class="ti ti-plus"></i> Start Work</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ============ MODAL: JOB CARD DETAILS ============ -->
  <div class="modal-overlay" id="jobcardDetailsModal">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Job Card Details</div>
        <button class="m-icon-btn" onclick="closeModal('jobcardDetailsModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="detJobcardId">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <span class="m-jobcard-plate" id="detPlate">KL 01 CD 5678</span>
          <span class="m-jobcard-stage" id="detStage">Assigned</span>
        </div>
        
        <div style="font-size:12.5px;color:var(--text-2);line-height:1.6;margin-bottom:16px;">
          <div><strong>Service:</strong> <span id="detService">Foam Wash</span></div>
          <div><strong>Staff:</strong> <span id="detStaff">Deepu</span></div>
          <div><strong>Bay:</strong> <span id="detBay">Bay 1</span></div>
          <div><strong>Notes:</strong> <span id="detNotes" style="color:var(--text-3);">—</span></div>
        </div>

        <div class="m-section-title">Checklist Checklist</div>
        <div id="detChecklistGrid" style="margin-bottom:20px;">
          <!-- checklist rows loaded dynamically -->
        </div>

        <div class="m-section-title">Job Card Photos</div>
        <div id="detPhotosGrid" class="m-photo-grid">
          <!-- Photos loader -->
        </div>
        <div style="margin-top:10px;">
          <input type="file" id="photoUploadInput" accept="image/*" style="display:none;">
          <button type="button" class="btn btn-accent btn-sm" id="uploadPhotoBtn" style="width:100%;">
            <i class="ti ti-camera"></i> Take / Upload Photo
          </button>
        </div>
      </div>
      <div class="modal-footer" style="justify-content:space-between;">
        <button type="button" class="btn" onclick="closeModal('jobcardDetailsModal')">Close</button>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn btn-accent" id="completeWashBtn">Complete Wash</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ============ TOAST STACK ============ -->
  <div class="toast-stack" id="toastStack"></div>

  <script src="{{ asset('js/common.js') }}?v={{ time() }}"></script>
  <script src="{{ asset('js/manager.js') }}?v={{ time() }}"></script>
</body>
</html>
