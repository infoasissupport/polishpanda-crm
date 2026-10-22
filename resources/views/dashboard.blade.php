@extends('layouts.app')

@section('title', 'Dashboard')

@section('page-id', 'dashboard')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}?v={{ filemtime(public_path('css/dashboard.css')) }}">
@endsection

@section('content')
<section class="view" id="dashboard">
  <div class="dash-hero">
    <div class="dash-hero-text">

      <div class="view-title dash-page-title">Dashboard</div>

    </div>
    <button class="btn btn-accent dash-hero-btn" id="newBookingBtn"><i class="ti ti-plus"></i>New Appointment</button>
  </div>
  <div class="fixedScrolldivCommon">

  <div class="dash-stats-grid">
    <div class="dash-stat-card dash-kpi dash-kpi--red is-link" data-href="/bookings" role="link" tabindex="0" aria-label="View today's bookings">
      <div class="dash-stat-icon dash-badge-red">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
          <rect x="3" y="4.5" width="18" height="17" rx="3" stroke="currentColor" stroke-width="1.9"/>
          <path d="M7.5 2.5v4M16.5 2.5v4M3.5 9h17" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
          <path d="M9 15l2 2l4 -4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">Today's Wash</div>
        <div class="dash-kpi-line">
          <div class="dash-stat-value" id="kpiTodayBookings">—</div>
          <div class="dash-kpi-delta" id="kpiTodayBookingsDelta"></div>
        </div>
      </div>
      <span class="dash-kpi-go" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"/></svg></span>
    </div>
    <div class="dash-stat-card dash-kpi dash-kpi--orange is-link" data-href="/queue#waitlist" role="link" tabindex="0" aria-label="View cars in the queue">
      <div class="dash-stat-icon dash-badge-amber">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M5.2 10.2 6.9 5.6A2.4 2.4 0 0 1 9.1 4h5.8a2.4 2.4 0 0 1 2.2 1.6l1.7 4.6A2.6 2.6 0 0 1 21 12.8V17a1 1 0 0 1-1 1h-1v1.2a1.3 1.3 0 0 1-2.6 0V18H7.6v1.2a1.3 1.3 0 0 1-2.6 0V18H4a1 1 0 0 1-1-1v-4.2a2.6 2.6 0 0 1 2.2-2.6zm2.1-.2h9.4l-1.3-3.6a.9.9 0 0 0-.8-.6H9.4a.9.9 0 0 0-.8.6L7.3 10zM7 15.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm10 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z"/></svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">Cars In Queue</div>
        <div class="dash-kpi-line">
          <div class="dash-stat-value" id="kpiCarsWaiting">—</div>
        </div>
        <div class="dash-stat-sub">Live Now</div>
      </div>
      <span class="dash-kpi-go" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"/></svg></span>
    </div>
    <div class="dash-stat-card dash-kpi dash-kpi--green is-link" data-href="/queue#completed" role="link" tabindex="0" aria-label="View washes completed today">
      <div class="dash-stat-icon dash-badge-green">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.3l3 3l6-6.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">Completed Today</div>
        <div class="dash-kpi-line">
          <div class="dash-stat-value" id="kpiCompletedToday">—</div>
          <div class="dash-kpi-delta" id="kpiCompletedTodayDelta"></div>
        </div>
      </div>
      <span class="dash-kpi-go" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"/></svg></span>
    </div>
    <div class="dash-stat-card dash-kpi dash-kpi--blue is-link" data-href="/reports?timeframe=daily" role="link" tabindex="0" aria-label="View today's revenue report">
      <div class="dash-stat-icon dash-badge-blue">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 5h-11h3a4 4 0 0 1 0 8h-3l6 6"/><path d="M7 9l11 0"/></svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">Revenue Today</div>
        <div class="dash-kpi-line">
          <div class="dash-stat-value" id="kpiRevenueToday">—</div>
          <div class="dash-kpi-delta" id="kpiRevenueTodayDelta"></div>
        </div>
      </div>
      <span class="dash-kpi-go" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"/></svg></span>
    </div>
  </div>
  <div class="dash-stats-grid1">
    <div class="dash-stat-card dash-kpi dash-kpi--teal is-link" data-href="/reports?timeframe=weekly" role="link" tabindex="0" aria-label="View this week's revenue report">
      <div class="dash-stat-icon dash-badge-teal">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 20V11M9.3 20V6M14.6 20V9M20 20V4"/></svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">Revenue This Week</div>
        <div class="dash-kpi-line"><div class="dash-stat-value" id="kpiRevenueWeekly">—</div></div>
        <div class="dash-stat-sub">Last 7 days</div>
      </div>
      <span class="dash-kpi-go" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"/></svg></span>
    </div>
    <div class="dash-stat-card dash-kpi dash-kpi--pink is-link" data-href="/reports?timeframe=monthly" role="link" tabindex="0" aria-label="View this month's revenue report">
      <div class="dash-stat-icon dash-badge-pink">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18M8 15l3 2l5-4"/></svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">Revenue This Month</div>
        <div class="dash-kpi-line"><div class="dash-stat-value" id="kpiRevenueMonthly">—</div></div>
        <div class="dash-stat-sub">This month</div>
      </div>
      <span class="dash-kpi-go" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"/></svg></span>
    </div>
    <div class="dash-stat-card dash-kpi dash-kpi--red is-link" data-href="/payments?filter=pending" role="link" tabindex="0" aria-label="View pending payments">
      <div class="dash-stat-icon dash-badge-red">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9h18"/><circle cx="12" cy="14" r="2.6"/></svg>
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-label">Pending Payments</div>
        <div class="dash-kpi-line"><div class="dash-stat-value" id="kpiPendingPayments">—</div></div>
        <div class="dash-stat-sub"><span id="kpiPendingDeltaText">0 invoices</span></div>
      </div>
      <span class="dash-kpi-go" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6"/></svg></span>
    </div>
  </div>

  <div class="grid-2 dash-main-grid">
    <div class="card dash-panel">
      <div class="dash-panel-head">
        <span class="dash-panel-title"><span class="dash-panel-icon"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.2 10.2 6.9 5.6A2.4 2.4 0 0 1 9.1 4h5.8a2.4 2.4 0 0 1 2.2 1.6l1.7 4.6A2.6 2.6 0 0 1 21 12.8V17a1 1 0 0 1-1 1h-1v1.2a1.3 1.3 0 0 1-2.6 0V18H7.6v1.2a1.3 1.3 0 0 1-2.6 0V18H4a1 1 0 0 1-1-1v-4.2a2.6 2.6 0 0 1 2.2-2.6zm2.1-.2h9.4l-1.3-3.6a.9.9 0 0 0-.8-.6H9.4a.9.9 0 0 0-.8.6L7.3 10zM7 15.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm10 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z"/></svg></span>Live Queue</span>
        <a class="dash-outline-btn" href="/queue">Open Queue <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6l-6 6"/></svg></a>
      </div>
      <div class="dash-table-wrap">
        <table class="dash-table">
          <thead><tr><th>#</th><th>Vehicle</th><th>Customer</th><th>Service</th><th>Wait Time</th><th>Status</th></tr></thead>
          <tbody id="dashboardQueueRows"></tbody>
        </table>
        <div class="dash-empty dash-empty--queue" id="dashQueueEmpty">
          <span class="dash-empty-art"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.2 10.2 6.9 5.6A2.4 2.4 0 0 1 9.1 4h5.8a2.4 2.4 0 0 1 2.2 1.6l1.7 4.6A2.6 2.6 0 0 1 21 12.8V17a1 1 0 0 1-1 1h-1v1.2a1.3 1.3 0 0 1-2.6 0V18H7.6v1.2a1.3 1.3 0 0 1-2.6 0V18H4a1 1 0 0 1-1-1v-4.2a2.6 2.6 0 0 1 2.2-2.6zm2.1-.2h9.4l-1.3-3.6a.9.9 0 0 0-.8-.6H9.4a.9.9 0 0 0-.8.6L7.3 10zM7 15.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm10 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z"/></svg><span class="dash-empty-clock"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span></span>
          <div class="dash-empty-title">No cars in queue right now</div>
          <div class="dash-empty-sub">New appointments will appear here.</div>
          <button type="button" class="btn btn-accent dash-empty-cta" id="dashQueueNewBtn"><i class="ti ti-plus"></i>New Appointment</button>
        </div>
      </div>
    </div>
    <div class="card dash-panel">
      <div class="dash-panel-head">
        <span class="dash-panel-title"><span class="dash-panel-icon"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 20V11M9.3 20V6M14.6 20V9M20 20V4"/></svg></span>Revenue — <span id="revenueRangeTitle">Last 7 Days</span></span>
        <span class="card-title-actions chart-actions">
          <label class="chart-type-select" for="revenueChartType"><svg class="chart-select-icon chart-select-icon--accent" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 20v-8M12 20V5M19 20v-11"/></svg><span class="chart-type-value" id="revenueChartTypeLabel">Bar</span><select id="revenueChartType" aria-label="Chart type"><option value="column">Bar</option><option value="line">Line</option><option value="area">Area</option></select><i class="ti ti-chevron-down"></i></label>
          <label class="chart-type-select chart-range-select" for="revenueRange"><svg class="chart-select-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/></svg><span class="chart-type-value" id="revenueRangeLabel">Last 7 Days</span><select id="revenueRange" aria-label="Date range"><option value="7">Last 7 Days</option><option value="14">Last 14 Days</option><option value="30">Last 30 Days</option></select><i class="ti ti-chevron-down"></i></label>
        </span>
      </div>
      <div id="revenueChart"></div>
    </div>
  </div>

  <div class="dash-bottom-grid">
    <div class="card dash-panel">
      <div class="dash-panel-head">
        <span class="dash-panel-title dash-panel-title--sm"><span class="dash-panel-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h3"/></svg></span>Recent Payments</span>
        <a class="dash-outline-btn dash-outline-btn--sm" href="/payments">View All <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6l-6 6"/></svg></a>
      </div>
      <div class="dash-table-wrap">
        <table class="dash-table dash-table--sm">
          <thead><tr><th>Invoice #</th><th>Customer</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
          <tbody id="dashRecentPayments"></tbody>
        </table>
        <div class="dash-empty" id="dashRecentPaymentsEmpty"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 13h6M9 17h4"/></svg><div class="dash-empty-sub">No payments found</div></div>
      </div>
    </div>
    <div class="card dash-panel">
      <div class="dash-panel-head">
        <span class="dash-panel-title dash-panel-title--sm"><span class="dash-panel-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l8 4l-8 4l-8-4z"/><path d="M4 12l8 4l8-4"/><path d="M4 16l8 4l8-4"/></svg></span>Top Services (This Month)</span>
        <a class="dash-outline-btn dash-outline-btn--sm" href="/reports?timeframe=monthly">View All <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6l-6 6"/></svg></a>
      </div>
      <div class="dash-table-wrap">
        <table class="dash-table dash-table--sm">
          <thead><tr><th>Service</th><th>Count</th><th>Revenue</th></tr></thead>
          <tbody id="dashTopServices"></tbody>
        </table>
        <div class="dash-empty" id="dashTopServicesEmpty"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 20v-6M12 20V6M18 20v-10"/></svg><div class="dash-empty-sub">No service data available</div></div>
      </div>
    </div>
  </div>
  </div>
</section>

<div class="modal-overlay" id="newBookingModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">New booking</div>
      <div class="modal-close" onclick="window.SW.closeModal('newBookingModal')"><i class="ti ti-x"></i></div>
    </div>
    <form id="newBookingForm">
      <div class="modal-body">
        <div class="modal-row-3">
          <div class="field" style="position:relative;">
            <label for="nbCustomer">Customer name</label>
            <input type="text" id="nbCustomer" required placeholder="Customer Name" autocomplete="off">
            <div id="nbCustomerDropdown" class="autocomplete-dropdown" style="display:none; position:absolute; top:100%; left:0; width:100%; background:#fff; border:1px solid #e2e8f0; z-index:100; max-height:200px; overflow-y:auto; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); margin-top:4px;"></div>
          </div>
     
          <div class="field" style="position:relative;">
            <label for="nbPhone">Phone</label>
            <input type="tel" id="nbPhone" inputmode="numeric" pattern="[0-9]*" maxlength="15" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="Phone" autocomplete="off">
            <div id="nbPhoneDropdown" class="autocomplete-dropdown" style="display:none; position:absolute; top:100%; left:0; width:100%; background:#fff; border:1px solid #e2e8f0; z-index:100; max-height:200px; overflow-y:auto; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); margin-top:4px;"></div>
          </div>
          
          <div class="field"><label for="nbVehicle">Vehicle Name</label><input type="text" id="nbVehicle" placeholder="Vehicle Name"></div>
        </div>
        <style>
          .autocomplete-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; }
          .autocomplete-item:hover { background: #f8fafc; }
          .autocomplete-item-name { font-weight: 600; color: #1e293b; }
          .autocomplete-item-desc { font-size: 12px; color: #64748b; margin-top: 2px; }
        </style>
        <div class="modal-row-3">
        
          <div class="field"><label for="nbVehiclePlate">Vehicle Number</label><input type="text" id="nbVehiclePlate" placeholder="Vehicle Number"><div id="nbVehicleLoyalty" style="font-size:12px;color:#10B981;margin-top:4px;display:none;font-weight:600;"></div></div>
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
              <option value="phone">Phone</option>
            </select>
          </div>
     
        </div>
               <div class="field" >
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
              
            
                <input type="text" id="nbServiceSearch" class="svc-search-input" placeholder="Search services…" aria-label="Search services" autocomplete="off">
              </div>
              <div id="nbServicesContainer" class="svc-options">
                <!-- Dynamic checkboxes -->
              </div>
              <div class="svc-empty" id="nbSvcEmpty" style="display:none;">No services match your search.</div>
            </div>
          </div>
        </div>
        <div class="modal-row-3">
         
    
          <div class="field"><label for="nbDate">Date</label><input type="date" id="nbDate"></div>
            <div class="field"><label for="nbTime">Time</label><input type="time" id="nbTime"></div>
        </div>
         <div class="field">
          <label>Before Photos</label>
          <div class="jc-photo-grid">
            <div id="nbPhotosPreview" style="display:contents;"></div>
            <button type="button" class="jc-add-photo" id="nbAddBeforePhotoGallery" title="Upload from gallery">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 9l5 -5l5 5" /><path d="M12 4l0 12" /></svg>
            </button>
            <button type="button" class="jc-add-photo" id="nbAddBeforePhotoCamera" title="Take photo directly">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" /><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
            </button>
          </div>
        </div>
      
      
        <div class="field"><label for="nbNotes">Notes</label><textarea id="nbNotes" placeholder="Notes"></textarea></div>

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
        <button type="button" class="btn" onclick="window.SW.closeModal('newBookingModal')">Cancel</button>
        <button type="submit" class="btn btn-accent"><i class="ti ti-plus"></i>Create booking</button>
      </div>
    </form>
  </div>
</div>
@endsection

@section('scripts')
  <script src="{{ asset('js/vendor/highcharts/highcharts.js') }}"></script>
  <script src="{{ asset('js/dashboard.js') }}?v={{ filemtime(public_path('js/dashboard.js')) }}"></script>
@endsection
