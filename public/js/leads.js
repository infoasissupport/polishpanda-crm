// ==========================================================================
// Lead Management Screen (leads.js)
// Multi-vertical: Detailing, Insurance, and Travel Leads
// ==========================================================================
(function () {
  'use strict';

  var tableBody = document.getElementById('leadsTableBody');
  var tableHead = document.getElementById('leadsTableHead');
  var emptyState = document.getElementById('leadsEmptyState');
  var searchInput = document.getElementById('leadSearchInput');
  var statusFilter = document.getElementById('leadStatusFilter');
  var sourceFilter = document.getElementById('leadSourceFilter');
  var addLeadBtn = document.getElementById('addLeadBtn');
  var exportBtn = document.getElementById('exportLeadsBtn');
  var prevBtn = document.getElementById('leadsPrevBtn');
  var nextBtn = document.getElementById('leadsNextBtn');
  var pageInfo = document.getElementById('leadsPageInfo');
  var totalBadge = document.getElementById('leadsTotalBadge');

  // Tab Elements
  var tabBtnDetailing = document.getElementById('tabBtnDetailing');
  var tabBtnInsurance = document.getElementById('tabBtnInsurance');
  var tabBtnTravel = document.getElementById('tabBtnTravel');
  var tabCountDetailing = document.getElementById('tabCountDetailing');
  var tabCountInsurance = document.getElementById('tabCountInsurance');
  var tabCountTravel = document.getElementById('tabCountTravel');
  var tabInsuranceExpiredBadge = document.getElementById('tabInsuranceExpiredBadge');

  // Insurance Alert Banner Elements
  var insuranceAlertBanner = document.getElementById('insuranceAlertBanner');
  var insuranceAlertTitle = document.getElementById('insuranceAlertTitle');
  var insuranceAlertCountBadge = document.getElementById('insuranceAlertCountBadge');
  var insuranceAlertDesc = document.getElementById('insuranceAlertDesc');
  var btnViewExpiredInsurance = document.getElementById('btnViewExpiredInsurance');
  var btnDismissInsuranceAlert = document.getElementById('btnDismissInsuranceAlert');

  // Modal Category Section Elements
  var categoryRadios = document.querySelectorAll('input[name="leadCategory"]');
  var sectionDetailingFields = document.getElementById('sectionDetailingFields');
  var sectionInsuranceFields = document.getElementById('sectionInsuranceFields');
  var sectionTravelFields = document.getElementById('sectionTravelFields');

  // Form Elements
  var leadForm = document.getElementById('leadForm');
  var leadIdInput = document.getElementById('leadId');
  var leadModalTitle = document.getElementById('leadModalTitle');
  var deleteLeadBtn = document.getElementById('deleteLeadBtn');
  var saveLeadBtn = document.getElementById('saveLeadBtn');
  var leadServiceSelect = document.getElementById('leadService');
  var customServiceWrap = document.getElementById('customServiceWrap');
  var leadCustomService = document.getElementById('leadCustomService');

  // Insurance Form Elements
  var leadInsuranceType = document.getElementById('leadInsuranceType');
  var customInsuranceTypeWrap = document.getElementById('customInsuranceTypeWrap');
  var leadCustomInsuranceType = document.getElementById('leadCustomInsuranceType');
  var leadPolicyNumber = document.getElementById('leadPolicyNumber');
  var leadInsuranceFromDate = document.getElementById('leadInsuranceFromDate');
  var leadInsuranceToDate = document.getElementById('leadInsuranceToDate');
  var leadInsuranceTaken = document.getElementById('leadInsuranceTaken');
  var insDd = document.getElementById('leadInsuranceTakenDd');
  var insDdTrigger = insDd ? insDd.querySelector('.ins-dd-trigger') : null;
  var insDdOpts = insDd ? insDd.querySelectorAll('.ins-dd-opt') : [];

  // "Has customer taken insurance?" custom dropdown (with icons) mirrors the hidden select
  function syncInsuranceTakenToggle() {
    if (!leadInsuranceTaken || !insDd) return;
    var val = leadInsuranceTaken.value;
    insDd.setAttribute('data-value', val);
    insDdOpts.forEach(function (opt) {
      var on = opt.getAttribute('data-value') === val;
      opt.classList.toggle('active', on);
      opt.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) insDd.querySelector('.ins-dd-value').textContent = opt.querySelector('strong').textContent;
    });
  }
  function setInsDdOpen(open) {
    if (!insDd) return;
    insDd.classList.toggle('open', open);
    if (insDdTrigger) insDdTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (insDdTrigger) {
    insDdTrigger.addEventListener('click', function () { setInsDdOpen(!insDd.classList.contains('open')); });
  }
  insDdOpts.forEach(function (opt) {
    opt.addEventListener('click', function () {
      leadInsuranceTaken.value = opt.getAttribute('data-value');
      leadInsuranceTaken.dispatchEvent(new Event('change', { bubbles: true }));
      syncInsuranceTakenToggle();
      setInsDdOpen(false);
      if (insDdTrigger) insDdTrigger.focus();
    });
  });
  document.addEventListener('click', function (e) {
    if (insDd && insDd.classList.contains('open') && !insDd.contains(e.target)) setInsDdOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && insDd && insDd.classList.contains('open')) { setInsDdOpen(false); if (insDdTrigger) insDdTrigger.focus(); }
  });

  // ---- Icon dropdown: shows a native <select> as a dropdown with an SVG icon per option.
  // The select stays in the form (hidden) and keeps the value; call .sync() after setting it in code.
  function svgIcon(paths) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }
  var DD_CHEVRON = '<svg class="ins-dd-caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6l6-6"/></svg>';
  var DD_CHECK = '<svg class="ins-dd-check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5l9-10"/></svg>';

  function enhanceIconSelect(select, icons) {
    if (!select) return null;
    select.classList.add('ins-taken-select');
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');

    var dd = document.createElement('div');
    dd.className = 'ins-dd ins-dd--icons';
    var labelId = select.id + 'DdLabel';
    var label = document.querySelector('label[for="' + select.id + '"]');
    if (label) label.id = labelId;

    var iconHtml = function (value) {
      var ic = icons[value];
      return ic ? '<span class="ins-dd-icon" style="background:' + ic.bg + ';color:' + ic.color + ';">' + svgIcon(ic.paths) + '</span>' : '';
    };

    dd.innerHTML =
      '<button type="button" class="ins-dd-trigger" aria-haspopup="listbox" aria-expanded="false"' + (label ? ' aria-labelledby="' + labelId + '"' : '') + '>' +
        '<span class="ins-dd-current"></span><span class="ins-dd-value"></span>' + DD_CHEVRON +
      '</button>' +
      '<div class="ins-dd-menu" role="listbox">' +
        Array.prototype.map.call(select.options, function (o) {
          if (!o.value) return '';   // the placeholder is shown on the trigger only
          return '<button type="button" class="ins-dd-opt" role="option" data-value="' + escapeHtml(o.value) + '">' +
            iconHtml(o.value) + '<span class="ins-dd-opt-text"><strong>' + escapeHtml(o.textContent) + '</strong></span>' + DD_CHECK +
          '</button>';
        }).join('') +
      '</div>';
    select.parentNode.insertBefore(dd, select.nextSibling);

    var trigger = dd.querySelector('.ins-dd-trigger');
    var opts = dd.querySelectorAll('.ins-dd-opt');
    var setOpen = function (open) {
      dd.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    var sync = function () {
      var opt = select.options[select.selectedIndex];
      dd.classList.toggle('is-placeholder', !select.value);
      dd.querySelector('.ins-dd-current').innerHTML = iconHtml(select.value);
      dd.querySelector('.ins-dd-value').textContent = opt ? opt.textContent : '';
      opts.forEach(function (b) {
        var on = b.getAttribute('data-value') === select.value;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    };

    trigger.addEventListener('click', function () { setOpen(!dd.classList.contains('open')); });
    opts.forEach(function (b) {
      b.addEventListener('click', function () {
        select.value = b.getAttribute('data-value');
        select.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        setOpen(false);
        trigger.focus();
      });
    });
    document.addEventListener('click', function (e) { if (dd.classList.contains('open') && !dd.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dd.classList.contains('open')) { setOpen(false); trigger.focus(); } });
    sync();
    return { sync: sync, focus: function () { trigger.focus(); } };
  }

  var VEHICLE_PATHS = '<path d="M5 17h-1a1 1 0 0 1-1-1v-4l2-5h14l2 5v4a1 1 0 0 1-1 1h-1"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/>';
  var insuranceTypeDd = enhanceIconSelect(leadInsuranceType, {
    'Car Insurance - Comprehensive': { bg: '#dbeafe', color: '#2563eb', paths: VEHICLE_PATHS },
    'Car Insurance - Third Party':   { bg: '#e0e7ff', color: '#4f46e5', paths: VEHICLE_PATHS },
    'Two Wheeler Insurance':         { bg: '#ffedd5', color: '#ea580c', paths: '<circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M7.5 14h5l4-4h-3.5"/><path d="M14.5 17h-6.5l4-7"/><path d="M15 6h2l3 7"/>' },
    'Commercial Vehicle Insurance':  { bg: '#fef3c7', color: '#d97706', paths: '<circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h-2v-11a1 1 0 0 1 1-1h9v12m-4 0h6m4 0h2v-6h-8m0-5h5l3 5"/>' },
    'Health Insurance':              { bg: '#fee2e2', color: '#dc2626', paths: '<path d="M19.5 12.6l-7.5 7.4l-7.5-7.4a5 5 0 1 1 7.5-6.6a5 5 0 1 1 7.5 6.6"/><path d="M8 12h2l2-3l2 6l2-3h2"/>' },
    'Life & Term Insurance':         { bg: '#dcfce7', color: '#16a34a', paths: '<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10c-4-1.5-7-5.5-7-10V6z"/><path d="M9 12l2 2l4-4"/>' },
    'Travel Insurance':              { bg: '#ede9fe', color: '#7c3aed', paths: '<path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2-7h-4l-2 2h-3l2-4l-2-4h3l2 2h4l-2-7h3z"/>' },
    '__custom__':                    { bg: '#f2f4f7', color: '#475467', paths: '<path d="M12 5v14M5 12h14"/>' }
  });
  var leadInsurancePremium = document.getElementById('leadInsurancePremium');

  // Travel Form Elements
  var leadTravelDestination = document.getElementById('leadTravelDestination');
  var leadTravelPax = document.getElementById('leadTravelPax');
  var leadTravelDate = document.getElementById('leadTravelDate');
  var leadTravelReturnDate = document.getElementById('leadTravelReturnDate');
  var leadTravelBudget = document.getElementById('leadTravelBudget');

  // Convert Modal Elements
  var confirmConvertBtn = document.getElementById('confirmConvertBtn');
  var convertLeadAvatar = document.getElementById('convertLeadAvatar');
  var convertLeadName = document.getElementById('convertLeadName');
  var convertLeadPhone = document.getElementById('convertLeadPhone');

  // Follow-up Modal Elements
  var followUpForm = document.getElementById('followUpForm');
  var fuLeadId = document.getElementById('fuLeadId');
  var fuLeadName = document.getElementById('fuLeadName');
  var fuLeadContact = document.getElementById('fuLeadContact');
  var fuLeadStatusBadge = document.getElementById('fuLeadStatusBadge');
  var fuType = document.getElementById('fuType');
  var fuStatus = document.getElementById('fuStatus');
  var fuNotes = document.getElementById('fuNotes');
  var fuNextDate = document.getElementById('fuNextDate');
  var fuTimeline = document.getElementById('fuTimeline');
  var fuHistoryCount = document.getElementById('fuHistoryCount');
  var fuEmptyHistory = document.getElementById('fuEmptyHistory');
  var saveFollowUpBtn = document.getElementById('saveFollowUpBtn');
  var openLeadFollowUpsFromEditBtn = document.getElementById('openLeadFollowUpsFromEditBtn');

  if (!tableBody) return;

  var currentCategory = 'detailing'; // 'detailing' | 'insurance' | 'travel'
  var currentEditingLeadId = null;
  var PAGE_SIZE = 15;
  var currentPage = 1;
  var LEADS = [];
  var STATS = {};
  var INSURANCE_ALERTS = null;
  var SERVICES = [];
  var activeConvertingLead = null;
  var activeFollowUpLead = null;
  var searchTimer = null;
  var alertDismissed = false;

  var STATUS_LABELS = {
    new: 'New Inquiry',
    contacted: 'Contacted',
    in_discussion: 'In Discussion',
    quote_sent: 'Quote Sent',
    converted: 'Converted / Won',
    lost: 'Lost'
  };

  var SOURCE_CLASS_MAP = {
    'Walk-in': 'source-walkin',
    'WhatsApp': 'source-whatsapp',
    'Phone Call': 'source-phone',
    'Instagram': 'source-instagram',
    'Google': 'source-google',
    'Website': 'source-website',
    'Referral': 'source-referral',
    'Other': 'source-other'
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatCurrency(amount) {
    var val = parseFloat(amount) || 0;
    return '₹' + val.toLocaleString('en-IN');
  }

  function formatPhone(phone) {
    if (!phone) return '';
    var clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      return clean.slice(0, 5) + ' ' + clean.slice(5);
    }
    return phone;
  }

  function cleanPhoneForWhatsApp(phone) {
    if (!phone) return '';
    var digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 10) {
      return '91' + digits; // Default India prefix
    }
    return digits;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
      var day = String(d.getDate()).padStart(2, '0');
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return day + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    } catch (e) {
      return dateStr;
    }
  }

  // Lead details cell: initials avatar + name, phone and email with icons (shared by all categories)
  var ICON_PHONE = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"/></svg>';
  var ICON_MAIL = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6l9 -6"/></svg>';

  function leadInitials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] || ''))).toUpperCase();
  }

  function contactCellHtml(lead) {
    return '<div class="lead-contact-cell">' +
      '<span class="lead-avatar" aria-hidden="true">' + escapeHtml(leadInitials(lead.name)) + '</span>' +
      '<div class="lead-contact-info">' +
        '<div class="lead-name">' + escapeHtml(lead.name) + '</div>' +
        (lead.phone ? '<a href="tel:' + escapeHtml(lead.phone) + '" class="lead-phone">' + ICON_PHONE + escapeHtml(formatPhone(lead.phone)) + '</a>' : '') +
        (lead.email ? '<a href="mailto:' + escapeHtml(lead.email) + '" class="lead-email">' + ICON_MAIL + escapeHtml(lead.email) + '</a>' : '') +
      '</div>' +
    '</div>';
  }

  // Source badge with a small icon per source
  var SOURCE_ICONS = {
    'WhatsApp': '<i class="ti ti-brand-whatsapp"></i>',
    'Phone Call': '<i class="ti ti-phone"></i>',
    'Google': '<i class="ti ti-brand-google"></i>',
    'Referral': '<i class="ti ti-users"></i>',
    'Instagram': '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/><path d="M16.5 7.5v.01"/></svg>',
    'Website': '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18"/></svg>',
    'Walk-in': '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M7 21l3 -4"/><path d="M16 21l-2 -4l-3 -3l1 -6"/><path d="M6 12l2 -3l4 -1l3 3l3 1"/></svg>'
  };
  function sourceBadgeHtml(sourceKey, sourceClass) {
    return '<span class="lead-source-badge ' + sourceClass + '">' + (SOURCE_ICONS[sourceKey] || '') + escapeHtml(sourceKey) + '</span>';
  }

  function getFollowUpBadge(dateStr, status, followUps, leadId) {
    var count = (followUps && followUps.length) ? followUps.length : 0;
    var countHtml = '<div class="lead-followup-count" data-fu-lead-id="' + leadId + '" title="Click to view follow-up history & notes">' +
      '<i class="ti ti-clock-hour-4"></i> ' + (count > 0 ? (count + ' update' + (count > 1 ? 's' : '')) : 'Log Follow-Up') +
      '</div>';

    var statusHtml = '';
    if (!dateStr) {
      statusHtml = '<span style="color:#94a3b8;font-size:12px;">Not scheduled</span>';
    } else if (status === 'converted' || status === 'lost') {
      statusHtml = '<span class="lead-followup-done">' + formatDate(dateStr) + '</span>';
    } else {
      var todayStr = new Date().toISOString().slice(0, 10);
      var dStr = String(dateStr).slice(0, 10);
      if (dStr < todayStr) {
        statusHtml = '<span class="lead-followup-due" title="Overdue!"><i class="ti ti-alert-triangle"></i> ' + formatDate(dateStr) + ' (Overdue)</span>';
      } else if (dStr === todayStr) {
        statusHtml = '<span class="lead-followup-due" title="Due Today!"><i class="ti ti-clock-hour-4"></i> Today</span>';
      } else {
        statusHtml = '<span class="lead-followup-upcoming"><i class="ti ti-calendar-event"></i> ' + formatDate(dateStr) + '</span>';
      }
    }

    return '<div style="display:flex;flex-direction:column;gap:2px;">' + statusHtml + countHtml + '</div>';
  }

  // ---------- Category Tab Switching ----------
  function switchCategory(cat) {
    if (currentCategory === cat) return;
    currentCategory = cat;

    // Update active tab buttons
    var tabs = [
      { btn: tabBtnDetailing, cat: 'detailing' },
      { btn: tabBtnInsurance, cat: 'insurance' },
      { btn: tabBtnTravel, cat: 'travel' }
    ];

    tabs.forEach(function (t) {
      if (t.btn) {
        if (t.cat === currentCategory) {
          t.btn.classList.add('active');
        } else {
          t.btn.classList.remove('active');
        }
      }
    });

    // Update Search Placeholder based on active category
    if (searchInput) {
      if (currentCategory === 'insurance') {
        searchInput.placeholder = 'Search by name, phone, insurance type, or policy no...';
      } else if (currentCategory === 'travel') {
        searchInput.placeholder = 'Search by name, phone, destination, or dates...';
      } else {
        searchInput.placeholder = 'Search by name, phone, vehicle, or service...';
      }
    }

    currentPage = 1;
    renderTableHeader();
    loadLeads();
  }

  if (tabBtnDetailing) {
    tabBtnDetailing.addEventListener('click', function () { switchCategory('detailing'); });
  }
  if (tabBtnInsurance) {
    tabBtnInsurance.addEventListener('click', function () { switchCategory('insurance'); });
  }
  if (tabBtnTravel) {
    tabBtnTravel.addEventListener('click', function () { switchCategory('travel'); });
  }

  // ---------- Dynamic Table Header ----------
  function renderTableHeader() {
    if (!tableHead) return;
    if (currentCategory === 'insurance') {
      tableHead.innerHTML =
        '<tr>' +
          '<th class="col-sl">#</th>' +
          '<th>Customer Details</th>' +
          '<th>Insurance Type & Policy</th>' +
          '<th>Validity Period & Expiry</th>' +
          '<th>Policy Status</th>' +
          '<th>Lead Status</th>' +
          '<th>Premium</th>' +
          '<th>Follow-up</th>' +
          '<th style="text-align:right;padding-right:16px;">Actions</th>' +
        '</tr>';
    } else if (currentCategory === 'travel') {
      tableHead.innerHTML =
        '<tr>' +
          '<th class="col-sl">#</th>' +
          '<th>Customer Details</th>' +
          '<th>Destination / Tour</th>' +
          '<th>Travel Dates</th>' +
          '<th>Pax</th>' +
          '<th>Status</th>' +
          '<th>Est. Budget</th>' +
          '<th>Follow-up</th>' +
          '<th style="text-align:right;padding-right:16px;">Actions</th>' +
        '</tr>';
    } else {
      tableHead.innerHTML =
        '<tr>' +
          '<th class="col-sl">#</th>' +
          '<th>Lead Details</th>' +
          '<th>Vehicle / Plate</th>' +
          '<th>Interested Service</th>' +
          '<th>Source</th>' +
          '<th>Status</th>' +
          '<th>Est. Value</th>' +
          '<th>Follow-up</th>' +
          '<th style="text-align:right;padding-right:16px;">Actions</th>' +
        '</tr>';
    }
  }

  // ---------- API Data Fetching ----------
  async function loadLeads() {
    try {
      var params = new URLSearchParams();
      params.append('category', currentCategory);

      if (statusFilter && statusFilter.value !== 'all') {
        params.append('status', statusFilter.value);
      }
      if (sourceFilter && sourceFilter.value !== 'all') {
        params.append('source', sourceFilter.value);
      }
      if (searchInput && searchInput.value.trim()) {
        params.append('search', searchInput.value.trim());
      }

      var res = await fetch('/api/leads?' + params.toString(), {
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) throw new Error('Failed to fetch leads');
      var data = await res.json();

      LEADS = data.leads || [];
      STATS = data.stats || {};
      INSURANCE_ALERTS = data.insurance_alerts || null;

      updateCategoryTabCounts();
      updateInsuranceAlertBanner();
      updateKpis();
      renderTable();
    } catch (err) {
      console.error('Error loading leads:', err);
      if (window.SW && window.SW.showToast) {
        window.SW.showToast('Could not load leads. Please check connection.');
      }
    }
  }

  function updateCategoryTabCounts() {
    if (STATS.category_counts) {
      if (tabCountDetailing) tabCountDetailing.textContent = STATS.category_counts.detailing || 0;
      if (tabCountInsurance) tabCountInsurance.textContent = STATS.category_counts.insurance || 0;
      if (tabCountTravel) tabCountTravel.textContent = STATS.category_counts.travel || 0;
    }
  }

  function updateInsuranceAlertBanner() {
    if (!insuranceAlertBanner) return;

    if (!INSURANCE_ALERTS || alertDismissed) {
      insuranceAlertBanner.style.display = 'none';
      if (tabInsuranceExpiredBadge) tabInsuranceExpiredBadge.style.display = 'none';
      return;
    }

    var expiredCount = INSURANCE_ALERTS.expired_count || 0;
    var expiringSoonCount = INSURANCE_ALERTS.expiring_soon_count || 0;

    if (expiredCount > 0) {
      insuranceAlertBanner.style.display = 'flex';
      if (insuranceAlertCountBadge) {
        insuranceAlertCountBadge.textContent = expiredCount + ' Expired';
        insuranceAlertCountBadge.classList.remove('insurance-alert-pill--soon');
      }
      if (insuranceAlertTitle) {
        insuranceAlertTitle.textContent = 'Action Required: ' + expiredCount + ' Insurance Policy' + (expiredCount > 1 ? 's Have' : ' Has') + ' Expired!';
      }
      if (insuranceAlertDesc) {
        var names = (INSURANCE_ALERTS.expired_leads || []).slice(0, 2).map(function (l) { return l.name; }).join(', ');
        var more = expiredCount > 2 ? ' and ' + (expiredCount - 2) + ' more' : '';
        insuranceAlertDesc.textContent = 'Expired policies (' + names + more + '). Contact customers now for policy renewal to protect coverage and retain business.';
      }

      if (tabInsuranceExpiredBadge) {
        tabInsuranceExpiredBadge.textContent = expiredCount + ' Expired';
        tabInsuranceExpiredBadge.style.display = 'inline-flex';
      }
    } else if (expiringSoonCount > 0) {
      insuranceAlertBanner.style.display = 'flex';
      if (insuranceAlertCountBadge) {
        insuranceAlertCountBadge.textContent = expiringSoonCount + ' Expiring Soon';
        insuranceAlertCountBadge.classList.add('insurance-alert-pill--soon');
      }
      if (insuranceAlertTitle) {
        insuranceAlertTitle.textContent = 'Upcoming Renewals: ' + expiringSoonCount + ' Policy' + (expiringSoonCount > 1 ? 'ies' : 'y') + ' Expiring Within 30 Days';
      }
      if (insuranceAlertDesc) {
        insuranceAlertDesc.textContent = 'Proactively follow up with customers before their policies expire to ensure seamless renewal.';
      }
      if (tabInsuranceExpiredBadge) {
        tabInsuranceExpiredBadge.textContent = expiringSoonCount + ' Due Soon';
        tabInsuranceExpiredBadge.style.display = 'inline-flex';
      }
    } else {
      insuranceAlertBanner.style.display = 'none';
      if (tabInsuranceExpiredBadge) tabInsuranceExpiredBadge.style.display = 'none';
    }
  }

  if (btnViewExpiredInsurance) {
    btnViewExpiredInsurance.addEventListener('click', function () {
      if (currentCategory !== 'insurance') {
        switchCategory('insurance');
      }
      var tw = document.querySelector('.table-wrap');
      if (tw) tw.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (btnDismissInsuranceAlert) {
    btnDismissInsuranceAlert.addEventListener('click', function () {
      alertDismissed = true;
      if (insuranceAlertBanner) insuranceAlertBanner.style.display = 'none';
    });
  }

  async function loadServicesList() {
    try {
      var res = await fetch('/api/services', { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        SERVICES = await res.json();
        renderServiceOptions();
      }
    } catch (err) {
      console.error('Error loading services for dropdown:', err);
    }
  }

  function renderServiceOptions() {
    if (!leadServiceSelect) return;
    var currentVal = leadServiceSelect.value;
    leadServiceSelect.innerHTML = '<option value="">Select an interested service...</option>';

    SERVICES.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s.name;
      opt.setAttribute('data-price', s.price || 0);
      var priceLabel = s.price ? ' — ₹' + Number(s.price).toLocaleString('en-IN') : '';
      opt.textContent = s.name + priceLabel;
      leadServiceSelect.appendChild(opt);
    });

    var customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = '+ Other / Custom Service...';
    leadServiceSelect.appendChild(customOpt);

    if (currentVal) {
      leadServiceSelect.value = currentVal;
    }
  }

  function updateKpis() {
    var totalEl = document.getElementById('kpiTotalLeads');
    var totalLabelEl = document.getElementById('kpiTotalLabel');
    var pipelineEl = document.getElementById('kpiPipelineValue');
    var newEl = document.getElementById('kpiNewLeads');
    var dueEl = document.getElementById('kpiFollowUpDue');
    var dueSubEl = document.getElementById('kpiFollowUpSub');
    var dueIconEl = document.getElementById('kpiFollowUpIcon');
    var convertedEl = document.getElementById('kpiConvertedLeads');
    var rateEl = document.getElementById('kpiConversionRate');

    var catTitle = currentCategory === 'insurance' ? 'Insurance Leads' : (currentCategory === 'travel' ? 'Travel Leads' : 'Detailing Leads');
    if (totalLabelEl) totalLabelEl.textContent = 'Total ' + catTitle;

    if (totalEl) totalEl.textContent = STATS.total || 0;
    if (pipelineEl) pipelineEl.textContent = formatCurrency(STATS.pipeline_value || 0);
    if (newEl) newEl.textContent = STATS.new || 0;

    var followUpCount = STATS.follow_up_scheduled != null ? STATS.follow_up_scheduled : (STATS.follow_up_due || 0);
    if (followUpCount === 0 && (STATS.total_followups_logged || 0) > 0) {
      followUpCount = STATS.total_followups_logged;
    }

    if (dueEl) dueEl.textContent = followUpCount;

    if (dueSubEl) {
      var dueToday = STATS.follow_up_due || 0;
      var logged = STATS.total_followups_logged || 0;
      if (dueToday > 0) {
        dueSubEl.innerHTML = '<span style="color:#dc2626;font-weight:600;">' + dueToday + ' action' + (dueToday > 1 ? 's' : '') + ' due today</span>';
        if (dueIconEl) dueIconEl.className = 'leads-kpi-icon leads-kpi-red';
      } else if (followUpCount > 0) {
        var loggedText = logged > 0 ? (' • ' + logged + ' logged') : '';
        dueSubEl.innerHTML = '<span style="color:#059669;font-weight:600;">Scheduled active</span>' + loggedText;
        if (dueIconEl) dueIconEl.className = 'leads-kpi-icon leads-kpi-purple';
      } else {
        dueSubEl.textContent = 'All caught up!';
        if (dueIconEl) dueIconEl.className = 'leads-kpi-icon leads-kpi-purple';
      }
    }

    if (convertedEl) convertedEl.textContent = STATS.converted || 0;
    if (rateEl) rateEl.textContent = (STATS.conversion_rate || 0) + '%';
    if (totalBadge) totalBadge.textContent = (STATS.total || 0) + ' ' + (currentCategory === 'insurance' ? 'policies/inquiries' : (currentCategory === 'travel' ? 'trips/inquiries' : 'leads'));
  }

  // ---------- Render Table Rows ----------
  function renderTable() {
    var totalPages = Math.max(1, Math.ceil(LEADS.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * PAGE_SIZE;
    var pageItems = LEADS.slice(start, start + PAGE_SIZE);

    tableBody.innerHTML = '';

    if (LEADS.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
    }

    pageItems.forEach(function (lead, idx) {
      var tr = document.createElement('tr');
      var statusKey = lead.status || 'new';
      var statusLabel = STATUS_LABELS[statusKey] || statusKey;
      var sourceKey = lead.source || 'Walk-in';
      var sourceClass = SOURCE_CLASS_MAP[sourceKey] || 'source-other';
      var waPhone = cleanPhoneForWhatsApp(lead.phone);
      var todayStr = new Date().toISOString().slice(0, 10);

      // WhatsApp message customization per category
      var waGreeting = '';
      if (currentCategory === 'insurance') {
        var isExpired = lead.validity_to_date && (String(lead.validity_to_date).slice(0, 10) <= todayStr);
        if (isExpired) {
          waGreeting = encodeURIComponent(
            'Hello ' + lead.name + ', your ' + (lead.insurance_type || 'Insurance') +
            (lead.policy_number ? ' (Policy/Reg: ' + lead.policy_number + ')' : '') +
            ' expired on ' + formatDate(lead.validity_to_date) +
            '. Would you like us to assist you with renewing your policy today?'
          );
        } else {
          waGreeting = encodeURIComponent(
            'Hello ' + lead.name + ', following up regarding your ' + (lead.insurance_type || 'insurance') +
            ' inquiry. How can we assist you with the policy details?'
          );
        }
      } else if (currentCategory === 'travel') {
        waGreeting = encodeURIComponent(
          'Hello ' + lead.name + ', following up regarding your travel trip to ' + (lead.destination || 'your destination') +
          '. How can we help you plan your itinerary, bookings, and visa?'
        );
      } else {
        waGreeting = encodeURIComponent(
          'Hello ' + lead.name + ', thank you for your interest in our ' +
          (lead.service_interested || 'detailing services') +
          ' at polishpanda! How can we assist you today?'
        );
      }

      var waUrl = 'https://wa.me/' + waPhone + '?text=' + waGreeting;

      if (currentCategory === 'insurance') {
        // Insurance columns
        var valHtml = '';
        var toDateStr = lead.validity_to_date ? String(lead.validity_to_date).slice(0, 10) : '';
        var fromDateStr = lead.validity_from_date ? String(lead.validity_from_date).slice(0, 10) : '';

        if (!toDateStr) {
          valHtml = '<span style="color:#94a3b8;">No dates set</span>';
        } else {
          var dateRange = (fromDateStr ? formatDate(fromDateStr) + ' → ' : '') + formatDate(toDateStr);
          if (toDateStr <= todayStr) {
            var expLabel = (toDateStr === todayStr) ? 'Expires Today' : ('Expired (' + formatDate(toDateStr) + ')');
            valHtml = '<div style="display:flex;flex-direction:column;gap:3px;">' +
              '<span class="badge-ins-expired"><i class="ti ti-alert-triangle"></i> ' + expLabel + '</span>' +
              '<span style="font-size:11.5px;color:#64748b;">' + dateRange + '</span>' +
              '</div>';
          } else {
            var diffTime = new Date(toDateStr).getTime() - new Date(todayStr).getTime();
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) {
              valHtml = '<div style="display:flex;flex-direction:column;gap:3px;">' +
                '<span class="badge-ins-warning"><i class="ti ti-clock"></i> Expiring in ' + diffDays + ' days</span>' +
                '<span style="font-size:11.5px;color:#64748b;">' + dateRange + '</span>' +
                '</div>';
            } else {
              valHtml = '<div style="display:flex;flex-direction:column;gap:3px;">' +
                '<span class="badge-ins-active"><i class="ti ti-shield-check"></i> Active</span>' +
                '<span style="font-size:11.5px;color:#64748b;">' + dateRange + '</span>' +
                '</div>';
            }
          }
        }

        var policyTakenHtml = lead.insurance_taken
          ? '<span class="badge-ins-taken-yes"><i class="ti ti-check"></i> Taken / Active</span>'
          : '<span class="badge-ins-taken-no"><i class="ti ti-clock"></i> Quote / Inquiry</span>';

        tr.innerHTML =
          '<td class="col-sl">' + (start + idx + 1) + '</td>' +
          '<td>' + contactCellHtml(lead) + '</td>' +
          '<td>' +
            '<div style="display:flex;flex-direction:column;gap:3px;">' +
              '<span class="lead-service-pill" style="font-weight:600;" title="' + escapeHtml(lead.insurance_type) + '">' + escapeHtml(lead.insurance_type || 'General Insurance') + '</span>' +
              (lead.policy_number ? '<span style="font-size:11.5px;font-family:monospace;color:#475569;">No: ' + escapeHtml(lead.policy_number) + '</span>' : '') +
            '</div>' +
          '</td>' +
          '<td>' + valHtml + '</td>' +
          '<td>' + policyTakenHtml + '</td>' +
          '<td><span class="lead-status-pill status-' + escapeHtml(statusKey) + '">' + escapeHtml(statusLabel) + '</span></td>' +
          '<td><strong style="font-weight:600;color:#0f172a;">' + (lead.estimated_value > 0 ? formatCurrency(lead.estimated_value) : '—') + '</strong></td>' +
          '<td>' + getFollowUpBadge(lead.follow_up_date, lead.status, lead.follow_ups, lead.id) + '</td>' +
          '<td>' +
            '<div class="lead-actions">' +
              (lead.phone ? '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-action" title="Chat / Send Renewal on WhatsApp" aria-label="WhatsApp"><i class="ti ti-brand-whatsapp"></i></a>' : '') +
              '<button type="button" class="btn-followup-action" data-id="' + lead.id + '" title="Follow-up History & Updates" aria-label="Follow-ups"><i class="ti ti-calendar-event"></i></button>' +
              '<button type="button" class="row-edit-btn" data-id="' + lead.id + '" title="Edit Lead" aria-label="Edit">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
              '</button>' +
            '</div>' +
          '</td>';

      } else if (currentCategory === 'travel') {
        // Travel columns
        var datesStr = '—';
        if (lead.travel_date || lead.return_date) {
          datesStr = (lead.travel_date ? formatDate(lead.travel_date) : '?') + ' → ' + (lead.return_date ? formatDate(lead.return_date) : '?');
        }

        tr.innerHTML =
          '<td class="col-sl">' + (start + idx + 1) + '</td>' +
          '<td>' + contactCellHtml(lead) + '</td>' +
          '<td>' +
            (lead.destination ? '<span class="lead-dest-badge"><i class="ti ti-map-pin"></i> ' + escapeHtml(lead.destination) + '</span>' : '<span style="color:#94a3b8;">Not specified</span>') +
          '</td>' +
          '<td><span style="font-size:12.5px;color:#334155;">' + datesStr + '</span></td>' +
          '<td>' + (lead.passengers_count ? '<span class="lead-pax-badge"><i class="ti ti-users"></i> ' + lead.passengers_count + ' Pax</span>' : '<span style="color:#94a3b8;">—</span>') + '</td>' +
          '<td><span class="lead-status-pill status-' + escapeHtml(statusKey) + '">' + escapeHtml(statusLabel) + '</span></td>' +
          '<td><strong style="font-weight:600;color:#0f172a;">' + (lead.estimated_value > 0 ? formatCurrency(lead.estimated_value) : '—') + '</strong></td>' +
          '<td>' + getFollowUpBadge(lead.follow_up_date, lead.status, lead.follow_ups, lead.id) + '</td>' +
          '<td>' +
            '<div class="lead-actions">' +
              (lead.phone ? '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-action" title="Chat on WhatsApp" aria-label="WhatsApp"><i class="ti ti-brand-whatsapp"></i></a>' : '') +
              '<button type="button" class="btn-followup-action" data-id="' + lead.id + '" title="Follow-up History & Updates" aria-label="Follow-ups"><i class="ti ti-calendar-event"></i></button>' +
              '<button type="button" class="row-edit-btn" data-id="' + lead.id + '" title="Edit Lead" aria-label="Edit">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
              '</button>' +
            '</div>' +
          '</td>';

      } else {
        // Detailing columns
        tr.innerHTML =
          '<td class="col-sl">' + (start + idx + 1) + '</td>' +
          '<td>' + contactCellHtml(lead) + '</td>' +
          '<td>' +
            '<div class="lead-vehicle-cell">' +
              (lead.vehicle ? '<div class="lead-vehicle-name">' + escapeHtml(lead.vehicle) + '</div>' : '<span style="color:#94a3b8;">No vehicle</span>') +
              (lead.vehicle_plate ? '<div class="lead-plate-badge">' + escapeHtml(lead.vehicle_plate) + '</div>' : '') +
            '</div>' +
          '</td>' +
          '<td>' +
            (lead.service_interested ? '<span class="lead-service-pill" title="' + escapeHtml(lead.service_interested) + '">' + escapeHtml(lead.service_interested) + '</span>' : '<span style="color:#94a3b8;">General</span>') +
          '</td>' +
          '<td>' + sourceBadgeHtml(sourceKey, sourceClass) + '</td>' +
          '<td><span class="lead-status-pill status-' + escapeHtml(statusKey) + '">' + escapeHtml(statusLabel) + '</span></td>' +
          '<td><strong style="font-weight:600;color:#0f172a;">' + (lead.estimated_value > 0 ? formatCurrency(lead.estimated_value) : '—') + '</strong></td>' +
          '<td>' + getFollowUpBadge(lead.follow_up_date, lead.status, lead.follow_ups, lead.id) + '</td>' +
          '<td>' +
            '<div class="lead-actions">' +
              (lead.phone ? '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-action" title="Chat on WhatsApp" aria-label="WhatsApp"><i class="ti ti-brand-whatsapp"></i></a>' : '') +
              '<button type="button" class="btn-followup-action" data-id="' + lead.id + '" title="Follow-up History & Updates" aria-label="Follow-ups"><i class="ti ti-calendar-event"></i></button>' +
              (lead.status !== 'converted' ? '<button type="button" class="btn-convert-action" data-id="' + lead.id + '" title="Convert to Customer" aria-label="Convert"><i class="ti ti-user-plus"></i></button>' : '<span title="Customer Created" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;color:#059669;font-size:16px;"><i class="ti ti-circle-check"></i></span>') +
              '<button type="button" class="row-edit-btn" data-id="' + lead.id + '" title="Edit Lead" aria-label="Edit">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
              '</button>' +
            '</div>' +
          '</td>';
      }

      // Wire row actions
      var editBtn = tr.querySelector('.row-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', function (e) {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          openEditModal(lead);
        });
      }

      var convertBtn = tr.querySelector('.btn-convert-action');
      if (convertBtn) {
        convertBtn.addEventListener('click', function (e) {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          openConvertModal(lead);
        });
      }

      var fuBtn = tr.querySelector('.btn-followup-action');
      if (fuBtn) {
        fuBtn.addEventListener('click', function (e) {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          openFollowUpModal(lead);
        });
      }

      var fuPill = tr.querySelector('.lead-followup-count');
      if (fuPill) {
        fuPill.addEventListener('click', function (e) {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          openFollowUpModal(lead);
        });
      }

      tableBody.appendChild(tr);
    });

    // Label each cell with its column heading (used by the card layout on tablets/phones)
    var headings = tableHead ? Array.prototype.map.call(tableHead.querySelectorAll('th'), function (th) { return th.textContent.trim(); }) : [];
    tableBody.querySelectorAll('tr').forEach(function (row) {
      Array.prototype.forEach.call(row.children, function (td, i) {
        if (headings[i]) td.setAttribute('data-label', headings[i]);
      });
    });

    // Update pagination
    if (pageInfo) {
      var total = LEADS.length;
      var from = total === 0 ? 0 : start + 1;
      var to = Math.min(start + PAGE_SIZE, total);
      pageInfo.textContent = 'Showing ' + from + '–' + to + ' of ' + total + ' leads';
    }

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    if (window.SW && SW.renderPager) SW.renderPager(prevBtn, nextBtn, currentPage, totalPages, function (p) { currentPage = p; renderTable(); });
  }

  // ---------- Modal Category Fieldset Visibility ----------
  function setModalCategory(category) {
    var radios = document.querySelectorAll('input[name="leadCategory"]');
    radios.forEach(function (r) {
      r.checked = (r.value === category);
    });

    if (sectionDetailingFields) sectionDetailingFields.style.display = (category === 'detailing') ? 'block' : 'none';
    if (sectionInsuranceFields) sectionInsuranceFields.style.display = (category === 'insurance') ? 'block' : 'none';
    if (sectionTravelFields) sectionTravelFields.style.display = (category === 'travel') ? 'block' : 'none';
  }

  categoryRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (this.checked) {
        setModalCategory(this.value);
      }
    });
  });

  if (leadInsuranceType) {
    leadInsuranceType.addEventListener('change', function () {
      if (this.value === '__custom__') {
        if (customInsuranceTypeWrap) customInsuranceTypeWrap.style.display = 'block';
        if (leadCustomInsuranceType) leadCustomInsuranceType.focus();
      } else {
        if (customInsuranceTypeWrap) customInsuranceTypeWrap.style.display = 'none';
        if (leadCustomInsuranceType) leadCustomInsuranceType.value = '';
      }
    });
  }

  // ---------- Modal Management ----------
  function openAddModal() {
    currentEditingLeadId = null;
    leadForm.reset();
    leadIdInput.value = '';
    leadModalTitle.textContent = 'Add New ' + (currentCategory === 'insurance' ? 'Insurance Lead' : (currentCategory === 'travel' ? 'Travel Lead' : 'Detailing Lead'));
    saveLeadBtn.innerHTML = '<i class="ti ti-plus"></i>Save Lead';
    deleteLeadBtn.style.display = 'none';

    setModalCategory(currentCategory);

    // Scroll modal to top so all fields are clearly visible
    var mb = document.querySelector('#leadModal .modal-body');
    if (mb) mb.scrollTop = 0;

    // Set default follow-up to tomorrow
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('leadFollowUp').value = tomorrow.toISOString().slice(0, 10);
    document.getElementById('leadStatus').value = 'new';
    document.getElementById('leadSource').value = 'Walk-in';

    // Defaults for Insurance
    if (leadInsuranceFromDate) {
      var today = new Date();
      leadInsuranceFromDate.value = today.toISOString().slice(0, 10);
      var oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      leadInsuranceToDate.value = oneYearLater.toISOString().slice(0, 10);
    }
    if (leadInsuranceTaken) leadInsuranceTaken.value = '1';
    syncInsuranceTakenToggle();
    if (insuranceTypeDd) insuranceTypeDd.sync();

    // Defaults for Detailing
    if (leadServiceSelect) leadServiceSelect.value = '';
    if (customServiceWrap) customServiceWrap.style.display = 'none';
    if (leadCustomService) leadCustomService.value = '';

    // Defaults for Travel
    if (leadTravelDestination) leadTravelDestination.value = '';
    if (leadTravelPax) leadTravelPax.value = '2';
    if (leadTravelBudget) leadTravelBudget.value = '';

    if (openLeadFollowUpsFromEditBtn) openLeadFollowUpsFromEditBtn.style.display = 'none';

    window.SW.openModal('leadModal');
    setTimeout(function () {
      var nameEl = document.getElementById('leadName');
      if (nameEl) nameEl.focus();
    }, 100);
  }

  function openEditModal(lead) {
    if (!lead) return;
    currentEditingLeadId = lead.id;
    leadForm.reset();
    leadIdInput.value = lead.id;
    leadModalTitle.textContent = 'Edit Lead: ' + (lead.name || 'Details');
    saveLeadBtn.innerHTML = '<i class="ti ti-check"></i>Save Changes';
    deleteLeadBtn.style.display = 'inline-flex';

    var leadCat = lead.category || currentCategory || 'detailing';
    setModalCategory(leadCat);

    // Scroll modal to top so user sees all fields from start
    var mb = document.querySelector('#leadModal .modal-body');
    if (mb) mb.scrollTop = 0;

    if (openLeadFollowUpsFromEditBtn) {
      openLeadFollowUpsFromEditBtn.style.display = 'inline-flex';
      openLeadFollowUpsFromEditBtn.onclick = function () {
        window.SW.closeModal('leadModal');
        openFollowUpModal(lead);
      };
    }

    document.getElementById('leadName').value = lead.name || '';
    document.getElementById('leadPhone').value = lead.phone || '';
    document.getElementById('leadEmail').value = lead.email || '';
    document.getElementById('leadSource').value = lead.source || 'Walk-in';
    document.getElementById('leadStatus').value = lead.status || 'new';
    document.getElementById('leadFollowUp').value = lead.follow_up_date ? String(lead.follow_up_date).slice(0, 10) : '';
    document.getElementById('leadNotes').value = lead.notes || '';

    // Detailing fields
    document.getElementById('leadVehicle').value = lead.vehicle || '';
    document.getElementById('leadPlate').value = lead.vehicle_plate || '';
    document.getElementById('leadValue').value = lead.estimated_value || '';

    var sName = (lead.service_interested || '').trim();
    if (leadServiceSelect) {
      var found = false;
      for (var i = 0; i < leadServiceSelect.options.length; i++) {
        if (leadServiceSelect.options[i].value && leadServiceSelect.options[i].value.toLowerCase() === sName.toLowerCase() && sName !== '') {
          leadServiceSelect.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found && sName) {
        leadServiceSelect.value = '__custom__';
        if (customServiceWrap) customServiceWrap.style.display = 'block';
        if (leadCustomService) leadCustomService.value = sName;
      } else {
        if (customServiceWrap) customServiceWrap.style.display = 'none';
        if (leadCustomService) leadCustomService.value = '';
      }
    }

    // Insurance fields
    var insType = (lead.insurance_type || '').trim();
    if (leadInsuranceType) {
      var insFound = false;
      for (var j = 0; j < leadInsuranceType.options.length; j++) {
        if (leadInsuranceType.options[j].value && leadInsuranceType.options[j].value.toLowerCase() === insType.toLowerCase() && insType !== '') {
          leadInsuranceType.selectedIndex = j;
          insFound = true;
          break;
        }
      }
      if (!insFound && insType) {
        leadInsuranceType.value = '__custom__';
        if (customInsuranceTypeWrap) customInsuranceTypeWrap.style.display = 'block';
        if (leadCustomInsuranceType) leadCustomInsuranceType.value = insType;
      } else {
        if (customInsuranceTypeWrap) customInsuranceTypeWrap.style.display = 'none';
        if (leadCustomInsuranceType) leadCustomInsuranceType.value = '';
      }
    }

    if (leadPolicyNumber) leadPolicyNumber.value = lead.policy_number || '';
    if (leadInsuranceFromDate) leadInsuranceFromDate.value = lead.validity_from_date ? String(lead.validity_from_date).slice(0, 10) : '';
    if (leadInsuranceToDate) leadInsuranceToDate.value = lead.validity_to_date ? String(lead.validity_to_date).slice(0, 10) : '';
    if (leadInsuranceTaken) leadInsuranceTaken.value = lead.insurance_taken ? '1' : '0';
    syncInsuranceTakenToggle();
    if (insuranceTypeDd) insuranceTypeDd.sync();
    if (leadInsurancePremium) leadInsurancePremium.value = lead.estimated_value || '';

    // Travel fields
    if (leadTravelDestination) leadTravelDestination.value = lead.destination || '';
    if (leadTravelPax) leadTravelPax.value = lead.passengers_count || '';
    if (leadTravelDate) leadTravelDate.value = lead.travel_date ? String(lead.travel_date).slice(0, 10) : '';
    if (leadTravelReturnDate) leadTravelReturnDate.value = lead.return_date ? String(lead.return_date).slice(0, 10) : '';
    if (leadTravelBudget) leadTravelBudget.value = lead.estimated_value || '';

    window.SW.openModal('leadModal');
  }

  function openConvertModal(lead) {
    activeConvertingLead = lead;
    var initials = lead.name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2) || 'L';
    if (convertLeadAvatar) convertLeadAvatar.textContent = initials;
    if (convertLeadName) convertLeadName.textContent = lead.name;
    if (convertLeadPhone) {
      var extra = lead.vehicle || lead.insurance_type || lead.destination || '';
      convertLeadPhone.textContent = formatPhone(lead.phone) + (extra ? ' • ' + extra : '');
    }

    window.SW.openModal('convertLeadModal');
  }

  // ---------- Follow-up History & Logging ----------
  function openFollowUpModal(lead) {
    activeFollowUpLead = lead;
    if (fuLeadId) fuLeadId.value = lead.id;
    if (fuLeadName) fuLeadName.textContent = lead.name;
    if (fuLeadContact) {
      var parts = [];
      parts.push(formatPhone(lead.phone));
      if (lead.category === 'insurance') {
        if (lead.insurance_type) parts.push(lead.insurance_type);
        if (lead.policy_number) parts.push('Policy: ' + lead.policy_number);
        if (lead.validity_to_date) parts.push('Exp: ' + formatDate(lead.validity_to_date));
      } else if (lead.category === 'travel') {
        if (lead.destination) parts.push(lead.destination);
        if (lead.travel_date) parts.push('Dep: ' + formatDate(lead.travel_date));
        if (lead.passengers_count) parts.push(lead.passengers_count + ' Pax');
      } else {
        if (lead.vehicle) parts.push(lead.vehicle);
        if (lead.service_interested) parts.push(lead.service_interested);
      }
      fuLeadContact.textContent = parts.filter(Boolean).join(' • ');
    }
    if (fuLeadStatusBadge) {
      var sk = lead.status || 'new';
      fuLeadStatusBadge.innerHTML = '<span class="lead-status-pill status-' + escapeHtml(sk) + '">' + escapeHtml(STATUS_LABELS[sk] || sk) + '</span>';
    }

    if (followUpForm) followUpForm.reset();
    if (fuType) fuType.value = 'Phone Call';
    if (fuStatus) fuStatus.value = '';

    if (fuNextDate) {
      var d = new Date();
      d.setDate(d.getDate() + 2);
      fuNextDate.value = d.toISOString().slice(0, 10);
    }

    renderFollowUpTimeline(lead.follow_ups || []);
    window.SW.openModal('leadFollowUpModal');
  }

  function renderFollowUpTimeline(followUps) {
    if (!fuTimeline) return;
    fuTimeline.innerHTML = '';
    var count = followUps ? followUps.length : 0;
    if (fuHistoryCount) fuHistoryCount.textContent = count;

    if (count === 0) {
      if (fuEmptyHistory) fuEmptyHistory.style.display = 'block';
      return;
    }
    if (fuEmptyHistory) fuEmptyHistory.style.display = 'none';

    var TYPE_MAP = {
      'Phone Call': { icon: 'ti-phone', class: 'fu-type-call' },
      'WhatsApp': { icon: 'ti-brand-whatsapp', class: 'fu-type-whatsapp' },
      'Store Visit': { icon: 'ti-building-store', class: 'fu-type-visit' },
      'Email': { icon: 'ti-mail', class: 'fu-type-email' },
      'Note': { icon: 'ti-notes', class: 'fu-type-note' },
    };

    followUps.forEach(function (fu) {
      var item = document.createElement('div');
      item.className = 'fu-timeline-item';

      var tMeta = TYPE_MAP[fu.interaction_type] || { icon: 'ti-message-dots', class: 'fu-type-note' };
      var createdStr = fu.created_at ? new Date(fu.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
      }) : '—';

      var nextDateStr = fu.next_follow_up_date ? ('<i class="ti ti-calendar-event"></i> Next follow-up: ' + formatDate(fu.next_follow_up_date)) : '';
      var statusBadge = fu.status ? ('<span class="lead-status-pill status-' + escapeHtml(fu.status) + '" style="font-size:10px;padding:1px 6px;">' + escapeHtml(STATUS_LABELS[fu.status] || fu.status) + '</span>') : '';

      item.innerHTML =
        '<div class="fu-timeline-dot">●</div>' +
        '<div class="fu-timeline-header">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span class="fu-type-badge ' + tMeta.class + '">' +
              escapeHtml(fu.interaction_type) +
            '</span>' +
            statusBadge +
          '</div>' +
          '<span class="fu-timeline-time">' + createdStr + '</span>' +
        '</div>' +
        '<div class="fu-timeline-notes">' + escapeHtml(fu.notes) + '</div>' +
        (nextDateStr ? ('<div class="fu-timeline-footer">' + nextDateStr + '</div>') : '');

      fuTimeline.appendChild(item);
    });
  }

  if (followUpForm) {
    followUpForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!activeFollowUpLead) return;

      var leadId = activeFollowUpLead.id;
      var notes = fuNotes.value.trim();
      var type = fuType.value;
      var statusVal = fuStatus.value;
      var nextDate = fuNextDate.value;

      if (!notes) {
        alert('Please describe what happened in this follow-up.');
        return;
      }

      saveFollowUpBtn.disabled = true;

      try {
        var res = await fetch('/api/leads/' + leadId + '/follow-ups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            interaction_type: type,
            notes: notes,
            status: statusVal || null,
            next_follow_up_date: nextDate || null
          })
        });

        if (!res.ok) {
          var errData = await res.json();
          throw new Error(errData.message || 'Failed to log follow-up');
        }

        var result = await res.json();
        if (window.SW && window.SW.showToast) {
          window.SW.showToast('Follow-up saved');
        }

        activeFollowUpLead = result.lead;

        fuNotes.value = '';
        if (fuStatus) fuStatus.value = '';

        renderFollowUpTimeline(result.lead.follow_ups || []);

        var sk = result.lead.status || 'new';
        if (fuLeadStatusBadge) {
          fuLeadStatusBadge.innerHTML = '<span class="lead-status-pill status-' + escapeHtml(sk) + '">' + escapeHtml(STATUS_LABELS[sk] || sk) + '</span>';
        }

        await loadLeads();
      } catch (err) {
        console.error('Error logging follow-up:', err);
        alert('Error: ' + err.message);
      } finally {
        saveFollowUpBtn.disabled = false;
      }
    });
  }

  // ---------- Form Submission & Saving ----------
  async function handleLeadFormSubmit(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    var leadId = currentEditingLeadId || (leadIdInput ? leadIdInput.value.trim() : '');
    var name = (document.getElementById('leadName').value || '').trim();
    var phone = (document.getElementById('leadPhone').value || '').trim();
    var email = (document.getElementById('leadEmail').value || '').trim();

    // Read selected category radio
    var selectedCatRadio = document.querySelector('input[name="leadCategory"]:checked');
    var category = selectedCatRadio ? selectedCatRadio.value : (currentCategory || 'detailing');

    var source = document.getElementById('leadSource').value;
    var status = document.getElementById('leadStatus').value;
    var followUp = document.getElementById('leadFollowUp').value;
    var notes = document.getElementById('leadNotes').value.trim();

    if (!name || !phone) {
      alert('Please fill in required fields (Customer Name and Phone Number).');
      var mb = document.querySelector('#leadModal .modal-body');
      if (mb) mb.scrollTop = 0;
      var nameEl = document.getElementById('leadName');
      if (nameEl) nameEl.focus();
      return;
    }

    var payload = {
      category: category,
      name: name,
      phone: phone,
      email: email || null,
      source: source,
      status: status,
      follow_up_date: followUp || null,
      notes: notes || null
    };

    if (category === 'insurance') {
      var insType = '';
      if (leadInsuranceType && leadInsuranceType.value === '__custom__') {
        insType = leadCustomInsuranceType ? leadCustomInsuranceType.value.trim() : '';
      } else if (leadInsuranceType) {
        insType = leadInsuranceType.value.trim();
      }

      var fromDate = leadInsuranceFromDate ? leadInsuranceFromDate.value : '';
      var toDate = leadInsuranceToDate ? leadInsuranceToDate.value : '';

      if (!insType) {
        alert('Please select or specify the Insurance Type.');
        if (insuranceTypeDd) insuranceTypeDd.focus(); else if (leadInsuranceType) leadInsuranceType.focus();
        return;
      }

      if (!fromDate || !toDate) {
        alert('Please specify both Insurance Validity From Date and To Date.');
        return;
      }

      payload.insurance_type = insType;
      payload.policy_number = (leadPolicyNumber && leadPolicyNumber.value) ? leadPolicyNumber.value.trim() : null;
      payload.validity_from_date = fromDate;
      payload.validity_to_date = toDate;
      payload.insurance_taken = leadInsuranceTaken ? (leadInsuranceTaken.value === '1') : false;
      payload.estimated_value = parseFloat(leadInsurancePremium ? leadInsurancePremium.value : 0) || 0;

    } else if (category === 'travel') {
      var dest = leadTravelDestination ? leadTravelDestination.value.trim() : '';
      if (!dest) {
        alert('Please enter Destination / Tour Package for Travel lead.');
        if (leadTravelDestination) leadTravelDestination.focus();
        return;
      }

      payload.destination = dest;
      payload.passengers_count = parseInt(leadTravelPax ? leadTravelPax.value : '') || null;
      payload.travel_date = (leadTravelDate && leadTravelDate.value) ? leadTravelDate.value : null;
      payload.return_date = (leadTravelReturnDate && leadTravelReturnDate.value) ? leadTravelReturnDate.value : null;
      payload.estimated_value = parseFloat(leadTravelBudget ? leadTravelBudget.value : 0) || 0;

    } else {
      // Detailing
      var service = '';
      if (leadServiceSelect) {
        if (leadServiceSelect.value === '__custom__') {
          service = leadCustomService ? leadCustomService.value.trim() : '';
        } else {
          service = leadServiceSelect.value.trim();
        }
      }

      var veh = document.getElementById('leadVehicle');
      var plt = document.getElementById('leadPlate');
      var val = document.getElementById('leadValue');

      payload.vehicle = veh ? veh.value.trim() : null;
      payload.vehicle_plate = plt ? plt.value.trim().toUpperCase() : null;
      payload.service_interested = service || null;
      payload.estimated_value = parseFloat(val ? val.value : 0) || 0;
    }

    if (saveLeadBtn) {
      saveLeadBtn.disabled = true;
      saveLeadBtn.innerHTML = '<i class="ti ti-loader"></i> Saving...';
    }

    try {
      var url = leadId ? ('/api/leads/' + leadId) : '/api/leads';
      var method = leadId ? 'PUT' : 'POST';

      var res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        var errData = {};
        try {
          errData = await res.json();
        } catch (parseErr) {}
        var msg = errData.message;
        if (errData.errors) {
          msg = Object.values(errData.errors).flat().join('\n');
        }
        throw new Error(msg || 'Failed to save lead');
      }

      // Close modal reliably
      if (window.SW && window.SW.closeModal) {
        window.SW.closeModal('leadModal');
      } else {
        var m = document.getElementById('leadModal');
        if (m) m.classList.remove('active');
      }

      if (window.SW && window.SW.showToast) {
        window.SW.showToast(leadId ? 'Lead updated successfully' : 'New ' + category + ' lead created');
      }

      currentEditingLeadId = null;

      // If newly created lead belongs to a different category, switch tab to view it
      if (!leadId && currentCategory !== category) {
        switchCategory(category);
      } else {
        await loadLeads();
      }
    } catch (err) {
      console.error('Error saving lead:', err);
      alert('Error: ' + err.message);
    } finally {
      if (saveLeadBtn) {
        saveLeadBtn.disabled = false;
        saveLeadBtn.innerHTML = leadId ? '<i class="ti ti-check"></i>Save Changes' : '<i class="ti ti-plus"></i>Save Lead';
      }
    }
  }

  // Bind save action to both form submit and direct button click
  if (leadForm) {
    leadForm.addEventListener('submit', handleLeadFormSubmit);
  }
  if (saveLeadBtn) {
    saveLeadBtn.addEventListener('click', handleLeadFormSubmit);
  }

  // ---------- Delete Lead ----------
  if (deleteLeadBtn) {
    deleteLeadBtn.addEventListener('click', async function () {
      var leadId = currentEditingLeadId || (leadIdInput ? leadIdInput.value : '');
      if (!leadId) return;

      if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
        return;
      }

      try {
        var res = await fetch('/api/leads/' + leadId, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) throw new Error('Failed to delete lead');

        if (window.SW && window.SW.closeModal) {
          window.SW.closeModal('leadModal');
        } else {
          var m = document.getElementById('leadModal');
          if (m) m.classList.remove('active');
        }

        if (window.SW && window.SW.showToast) {
          window.SW.showToast('Lead deleted');
        }

        currentEditingLeadId = null;
        await loadLeads();
      } catch (err) {
        console.error('Error deleting lead:', err);
        alert('Error: ' + err.message);
      }
    });
  }

  // ---------- Convert Lead Confirmation ----------
  if (confirmConvertBtn) {
    confirmConvertBtn.addEventListener('click', async function () {
      if (!activeConvertingLead) return;

      confirmConvertBtn.disabled = true;
      try {
        var res = await fetch('/api/leads/' + activeConvertingLead.id + '/convert', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          var errData = await res.json();
          throw new Error(errData.message || 'Conversion failed');
        }

        if (window.SW && window.SW.closeModal) {
          window.SW.closeModal('convertLeadModal');
        } else {
          var cm = document.getElementById('convertLeadModal');
          if (cm) cm.classList.remove('active');
        }

        if (window.SW && window.SW.showToast) {
          window.SW.showToast('Lead converted to Customer: ' + activeConvertingLead.name);
        }

        activeConvertingLead = null;
        await loadLeads();
      } catch (err) {
        console.error('Error converting lead:', err);
        alert('Conversion failed: ' + err.message);
      } finally {
        confirmConvertBtn.disabled = false;
      }
    });
  }

  // ---------- Export to CSV ----------
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      if (LEADS.length === 0) {
        alert('No leads to export.');
        return;
      }

      var header = [];
      var rows = [];

      if (currentCategory === 'insurance') {
        header = ['ID', 'Category', 'Customer Name', 'Phone', 'Email', 'Insurance Type', 'Policy Number', 'Validity From', 'Validity To (Expiry)', 'Insurance Taken', 'Premium (₹)', 'Source', 'Status', 'Follow-up Date', 'Notes', 'Created At'];
        rows = LEADS.map(function (lead) {
          return [
            lead.id,
            lead.category,
            lead.name,
            lead.phone,
            lead.email || '',
            lead.insurance_type || '',
            lead.policy_number || '',
            lead.validity_from_date || '',
            lead.validity_to_date || '',
            lead.insurance_taken ? 'Yes' : 'No',
            lead.estimated_value || 0,
            lead.source || '',
            lead.status || '',
            lead.follow_up_date || '',
            (lead.notes || '').replace(/[\r\n]+/g, ' '),
            lead.created_at ? new Date(lead.created_at).toLocaleString() : ''
          ];
        });
      } else if (currentCategory === 'travel') {
        header = ['ID', 'Category', 'Customer Name', 'Phone', 'Email', 'Destination', 'Passengers (Pax)', 'Departure Date', 'Return Date', 'Estimated Budget (₹)', 'Source', 'Status', 'Follow-up Date', 'Notes', 'Created At'];
        rows = LEADS.map(function (lead) {
          return [
            lead.id,
            lead.category,
            lead.name,
            lead.phone,
            lead.email || '',
            lead.destination || '',
            lead.passengers_count || '',
            lead.travel_date || '',
            lead.return_date || '',
            lead.estimated_value || 0,
            lead.source || '',
            lead.status || '',
            lead.follow_up_date || '',
            (lead.notes || '').replace(/[\r\n]+/g, ' '),
            lead.created_at ? new Date(lead.created_at).toLocaleString() : ''
          ];
        });
      } else {
        header = ['ID', 'Category', 'Name', 'Phone', 'Email', 'Vehicle', 'Plate', 'Service Interested', 'Source', 'Status', 'Estimated Value (₹)', 'Follow-up Date', 'Notes', 'Created At'];
        rows = LEADS.map(function (lead) {
          return [
            lead.id,
            lead.category || 'detailing',
            lead.name,
            lead.phone,
            lead.email || '',
            lead.vehicle || '',
            lead.vehicle_plate || '',
            lead.service_interested || '',
            lead.source || '',
            lead.status || '',
            lead.estimated_value || 0,
            lead.follow_up_date || '',
            (lead.notes || '').replace(/[\r\n]+/g, ' '),
            lead.created_at ? new Date(lead.created_at).toLocaleString() : ''
          ];
        });
      }

      var csvContent = [header].concat(rows).map(function (row) {
        return row.map(function (cell) {
          return '"' + String(cell).replace(/"/g, '""') + '"';
        }).join(',');
      }).join('\r\n');

      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = currentCategory + '-leads-export-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.SW && window.SW.showToast) {
        window.SW.showToast('Exported ' + LEADS.length + ' ' + currentCategory + ' leads');
      }
    });
  }

  // ---------- Event Listeners for Filters ----------
  if (addLeadBtn) {
    addLeadBtn.addEventListener('click', openAddModal);
  }

  if (leadServiceSelect) {
    leadServiceSelect.addEventListener('change', function () {
      var selectedVal = leadServiceSelect.value;
      if (selectedVal === '__custom__') {
        if (customServiceWrap) customServiceWrap.style.display = 'block';
        if (leadCustomService) leadCustomService.focus();
      } else {
        if (customServiceWrap) customServiceWrap.style.display = 'none';
        if (leadCustomService) leadCustomService.value = '';

        var selectedOpt = leadServiceSelect.options[leadServiceSelect.selectedIndex];
        if (selectedOpt && selectedOpt.hasAttribute('data-price')) {
          var price = parseFloat(selectedOpt.getAttribute('data-price')) || 0;
          var valInput = document.getElementById('leadValue');
          if (valInput && price > 0 && (!valInput.value || parseFloat(valInput.value) === 0)) {
            valInput.value = price;
          }
        }
      }
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', function () {
      currentPage = 1;
      loadLeads();
    });
  }

  if (sourceFilter) {
    sourceFilter.addEventListener('change', function () {
      currentPage = 1;
      loadLeads();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        currentPage = 1;
        loadLeads();
      }, 300);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      var totalPages = Math.ceil(LEADS.length / PAGE_SIZE);
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    });
  }

  // Expose global interface
  window.LeadManager = {
    openAddModal: openAddModal,
    openEditModal: openEditModal,
    openConvertModal: openConvertModal,
    openFollowUpModal: openFollowUpModal,
    switchCategory: switchCategory,
    refresh: loadLeads
  };

  // Initial load
  renderTableHeader();
  loadServicesList();
  loadLeads();
})();
