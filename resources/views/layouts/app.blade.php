<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Shinewise — @yield('title', 'Sparkle Auto Care')</title>
<link rel="stylesheet" href="{{ asset('css/icons.css') }}?v={{ filemtime(public_path('css/icons.css')) }}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/common.css') }}?v={{ filemtime(public_path('css/common.css')) }}">
<link rel="stylesheet" href="{{ asset('css/shell.css') }}?v={{ filemtime(public_path('css/shell.css')) }}">
@yield('styles')
</head>
<body data-page="@yield('page-id')">
<div class="app">

<!-- ============ SIDEBAR ============ -->
<aside class="sidebar">
  <div class="sidebar-head">
    <button type="button" class="sidebar-collapse-btn" id="sidebarCollapseBtn" aria-label="Collapse navigation menu">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
    </button>
    <a href="/dashboard" class="sidebar-logo">
      <img src="{{ asset('images/forward-logo-256.png') }}" alt="">
      <span class="sidebar-logo-text"><strong>Forward Prime</strong><small>Solutions Pvt. Ltd.</small></span>
    </a>
    <button type="button" class="sidebar-close-btn" id="sidebarCloseBtn" aria-label="Close navigation menu">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  </div>

  <div class="sidebar-menu">
    <div class="nav-group">
      <div class="nav-label">Overview</div>
      <a class="nav-item @if(Request::is('dashboard')) active @endif" data-page="dashboard" href="/dashboard"><i class="ti ti-layout-dashboard icon-purple"></i>Dashboard</a>
      <a class="nav-item @if(Request::is('queue')) active @endif" data-page="queue" href="/queue"><i class="ti ti-clock-hour-4 icon-amber"></i>Queue</a>
       <a class="nav-item @if(Request::is('jobcards')) active @endif" data-page="jobcards" href="/jobcards"><i class="ti ti-clipboard-check icon-pink"></i>Job Cards</a>
        <a class="nav-item @if(Request::is('payments')) active @endif" data-page="payments" href="/payments"><i class="ti ti-credit-card icon-gold"></i>Payments & Invoicing</a>
      </div>
  <div class="nav-group">
    <div class="nav-label">Customers</div>
    <a class="nav-item @if(Request::is('crm') || Request::is('vehicles')) active @endif" data-page="crm" href="/crm"><i class="ti ti-users icon-blue"></i>Customers</a>
    <a class="nav-item @if(Request::is('leads*')) active @endif" data-page="leads" href="/leads"><i class="ti ti-user-plus icon-teal"></i>Lead Management</a>
  </div>
  <div class="nav-group">
    <div class="nav-label">Operations</div>
    <!-- <a class="nav-item @if(Request::is('bookings')) active @endif" data-page="bookings" href="/bookings"><i class="ti ti-calendar-event icon-green"></i>Bookings</a> -->

    <a class="nav-item @if(Request::is('services')) active @endif" data-page="services" href="/services"><i class="ti ti-wash icon-cyan"></i>Services</a>
    <a class="nav-item @if(Request::is('products')) active @endif" data-page="products" href="/products"><i class="ti ti-package icon-orange"></i>Products</a>
    <a class="nav-item @if(Request::is('staff')) active @endif" data-page="staff" href="/staff"><i class="ti ti-id-badge-2 icon-indigo"></i>Staff</a>
    <!-- <a class="nav-item @if(Request::is('inventory')) active @endif" data-page="inventory" href="/inventory"><i class="ti ti-package icon-orange"></i>Inventory</a> -->
  </div>
  <div class="nav-group">
    <div class="nav-label">Revenue</div>

    <a class="nav-item @if(Request::is('expenses')) active @endif" data-page="expenses" href="/expenses"><i class="ti ti-report-money icon-red"></i>Expenses</a>
    <a class="nav-item @if(Request::is('reports')) active @endif" data-page="reports" href="/reports"><i class="ti ti-chart-bar icon-violet"></i>Reports</a>
  </div>
  <div class="nav-group">
    <div class="nav-label">Settings</div>
    <a class="nav-item @if(Request::is('branches')) active @endif" data-page="branches" href="/branches"><i class="ti ti-building-store icon-mint"></i>Branches</a>
    <a class="nav-item @if(Request::is('settings')) active @endif" data-page="settings" href="/settings"><i class="ti ti-settings icon-slate"></i>Settings</a>
  </div>
  </div>
</aside>

<!-- ============ MAIN ============ -->
<div class="main">
  <div class="topbar">
    <button type="button" class="icon-btn1main" id="sidebarToggleBtn" style="display:none" aria-label="Toggle navigation menu">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
    </button>
    <a href="/dashboard" class="topbar-brand-mobile"><img src="{{ asset('images/forward-logo-256.png') }}" alt=""><span class="topbar-brand-text"><span class="topbar-brand-name">Forward Prime</span><span class="topbar-brand-sub">Solutions Pvt. Ltd.</span></span></a>
    <div class="topbar-search">
      <svg class="topbar-search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>
      <input type="text" id="globalSearchInput" aria-label="Search customers, vehicles, appointments" placeholder="Search Customers, Vehicles, Appointments..." autocomplete="off">
      <kbd class="topbar-search-kbd" aria-hidden="true">Ctrl + K</kbd>
      <div class="search-results" id="searchResults"></div>
    </div>
    <div class="topbar-right">
      <div class="dropdown" id="branchDropdown">
        <div class="branch-pill" id="branchToggle"><i class="ti ti-map-pin"></i><span id="branchLabel">Select branch</span><i class="ti ti-chevron-down"></i></div>
        <div class="dropdown-menu" id="branchMenu">
          <!-- Loaded dynamically -->
        </div>
      </div>
      <div class="dropdown" id="notifDropdown">
        <div class="icon-btn1main" id="notifToggle"><i class="ti ti-bell"></i><span class="dot" id="notifDot"></span></div>
        <div class="dropdown-menu dropdown-menu-wide" id="notifMenu">
          <div class="dropdown-header">Notifications<span class="dropdown-header-actions"><span class="link" id="markAllRead">Mark all read</span><span class="link link-danger" id="clearAllNotifs">Clear</span></span></div>
          <div class="notif-list" id="notifList"></div>
        </div>
      </div>
      <div class="dropdown" id="waDropdown">
        <div class="icon-btn1main" id="waToggle"><svg class="wa-logo" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" aria-hidden="true"><path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg><span class="dot" id="waDot" style="display:none;background:red;"></span></div>
        <div class="dropdown-menu dropdown-menu-wide" id="waMenu">
          <div class="dropdown-header">WhatsApp CRM<span class="dropdown-header-actions"></span></div>
          <div class="notif-list" id="waList" style="max-height:300px;overflow-y:auto;padding:8px;"></div>
        </div>
      </div>

      <div class="dropdown topbar-user" id="userDropdown">
        <button type="button" class="topbar-user-toggle" id="userToggle" aria-label="Open account menu">
          <span class="avatar">SA</span>
          <span class="topbar-user-details"><strong id="userNameLabel">Admin User</strong><small id="userRoleLabel">Admin</small></span>
          <svg class="topbar-user-caret" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6"/></svg>
        </button>
        <div class="dropdown-menu sidebar-user-menu topbar-user-menu" id="userMenu">
          <div class="dropdown-user"><div class="avatar">SA</div><div><div class="dropdown-user-name">Admin User</div><div class="dropdown-user-email">admin@carwash.com</div></div></div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" id="profileBtn"><i class="ti ti-id-badge-2"></i>My profile</div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item danger" id="logoutBtn"><i class="ti ti-x"></i>Log out</div>
        </div>
      </div>

    </div>
  </div>

  @yield('content')

</div>
</div>

<footer class="app-footer">
  <span>© {{ date('Y') }} Forward Prime Solutions Pvt. Ltd. All rights reserved.</span>
  <span>Designed by <a herf=""><b>ATTechInfoasis</b> </a> </span>
</footer>

<div class="modal-overlay" id="profileModal">
  <div class="modal" style="max-width:400px;">
    <div class="modal-header">
      <div class="modal-title">My Profile</div>
    </div>
    <div class="modal-body profile-modal-body">
      <div class="profile-card">
        <div class="avatar profile-avatar">SA</div>
        <h3 class="profile-name" id="profileName">Admin User</h3>
        <p class="profile-role" id="profileRole">Administrator</p>
      </div>
      <div class="profile-details">
        <div class="profile-detail-row">
          <span class="profile-detail-label">Email Address</span>
          <span class="profile-detail-value" id="profileEmail">admin@carwash.com</span>
        </div>
        <div class="profile-detail-row">
          <span class="profile-detail-label">Member Since</span>
          <span class="profile-detail-value" id="profileJoined">July 2026</span>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn" onclick="window.SW.closeModal('profileModal')" >Close</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="photoLightboxModal">
  <div class="photo-lightbox">
    <button type="button" class="photo-lightbox-close" onclick="window.SW.closeModal('photoLightboxModal')" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
    <img id="photoLightboxImg" src="" alt="Photo preview">
  </div>
</div>

<script src="{{ asset('js/common.js') }}?v={{ filemtime(public_path('js/common.js')) }}"></script>
@yield('scripts')
</body>
</html>
