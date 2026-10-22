// ==========================================================================
// SHINEWISE MOBILE-OPTIMIZED MANAGER PORTAL JS
// Dynamic state management, API synchronization, and clean micro-interactions.
// ==========================================================================

(function () {
  // Global configuration and cache
  var STATE = {
    branches: [],
    services: [],
    staff: [],
    selectedBranch: null,
    activeTab: 'queue',
    jobcards: [],
    bookings: [],
    invoices: []
  };

  // Utilities
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatPrice(amount) {
    var num = parseFloat(amount);
    return isNaN(num) ? '₹0.00' : '₹' + num.toFixed(2);
  }

  function showToast(message, icon) {
    if (window.SW && typeof window.SW.showToast === 'function') {
      window.SW.showToast(message, icon);
      return;
    }
    var stack = document.getElementById('toastStack');
    if (!stack) return;
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<i class="ti ' + (icon || 'ti-circle-check') + '"></i><span></span>';
    toast.querySelector('span').textContent = message;
    stack.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3200);
  }

  function openModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('open');
      modal.style.display = 'flex';
    }
  }

  function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
    }
  }
  window.openModal = openModal;
  window.closeModal = closeModal;

  // Authentication logout integration
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      if (confirm('Are you sure you want to log out?')) {
        try {
          var res = await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() }
          });
          if (res.ok) {
            localStorage.removeItem('sw_user');
            window.location.href = '/login';
          }
        } catch (e) {
          window.location.href = '/login';
        }
      }
    });
  }

  function getCsrfToken() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  // Active Branch Switcher
  var branchToggle = document.getElementById('branchToggle');
  var branchMenu = document.getElementById('branchMenu');
  var branchLabel = document.getElementById('branchLabel');

  if (branchToggle && branchMenu) {
    branchToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      branchMenu.classList.toggle('open');
    });
    document.addEventListener('click', function () {
      branchMenu.classList.remove('open');
    });
  }

  function selectBranch(branch) {
    STATE.selectedBranch = branch;
    if (branchLabel) {
      branchLabel.textContent = branch.name;
    }
    localStorage.setItem('sw_branch', branch.code ? branch.code + ' · ' + branch.name : branch.name);
    localStorage.setItem('sw_branch_id', branch.id);
    localStorage.setItem('sw_branch_raw', branch.code ? branch.code + ' · ' + branch.name : branch.name);
    
    // Highlight active branch in menu list
    document.querySelectorAll('.dropdown-item[data-branch-id]').forEach(function (el) {
      el.classList.toggle('active', parseInt(el.getAttribute('data-branch-id')) === branch.id);
    });

    // Reload all data
    loadAllData();
  }

  // Tab Navigation Switching
  var tabItems = document.querySelectorAll('.m-tab-bar .m-tab-item');
  tabItems.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  function switchTab(tabName) {
    STATE.activeTab = tabName;
    tabItems.forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.m-tab-view').forEach(function (view) {
      view.classList.toggle('active', view.getAttribute('id') === 'view-' + tabName);
    });

    // Refresh layout data
    renderActiveTab();
  }

  // Core Data Fetchers
  async function initGlobalState() {
    try {
      var res = await fetch('/api/global');
      if (!res.ok) return;
      var data = await res.json();
      
      STATE.branches = data.branches || [];
      STATE.services = data.services || [];
      STATE.staff = data.staff || [];

      // Render branch selection menu
      if (branchMenu) {
        branchMenu.innerHTML = '';
        STATE.branches.forEach(function (b) {
          var item = document.createElement('div');
          item.className = 'dropdown-item';
          item.setAttribute('data-branch-id', b.id);
          item.innerHTML = '<strong>' + escapeHtml(b.name) + '</strong><span style="font-size:11px;color:var(--text-3);">' + escapeHtml(b.location || '') + '</span>';
          item.addEventListener('click', function () {
            selectBranch(b);
          });
          branchMenu.appendChild(item);
        });
      }

      // Populate services dropdown in new wash modal
      var nwServiceSelect = document.getElementById('nwService');
      if (nwServiceSelect) {
        nwServiceSelect.innerHTML = '<option value="">Select service</option>';
        STATE.services.forEach(function (s) {
          var opt = document.createElement('option');
          opt.value = s.name;
          opt.textContent = s.name + ' (' + formatPrice(s.price) + ')';
          nwServiceSelect.appendChild(opt);
        });
      }

      // Populate staff dropdown in start wash modal
      populateStaffDropdown();

      // Restore active branch
      var savedBranchName = localStorage.getItem('sw_branch');
      var matchedBranch = null;
      if (savedBranchName) {
        matchedBranch = STATE.branches.find(function (b) {
          var text = b.code ? b.code + ' · ' + b.name : b.name;
          return text === savedBranchName;
        });
      }
      if (!matchedBranch && STATE.branches.length > 0) {
        matchedBranch = STATE.branches[0];
      }
      if (matchedBranch) {
        selectBranch(matchedBranch);
      } else {
        loadAllData();
      }
    } catch (e) {
      console.error('Failed to initialize global options:', e);
    }
  }

  function populateStaffDropdown() {
    var swStaffSelect = document.getElementById('swStaff');
    if (!swStaffSelect) return;
    swStaffSelect.innerHTML = '<option value="">Select staff</option>';
    if (Array.isArray(STATE.staff)) {
      STATE.staff.forEach(function (st) {
        var opt = document.createElement('option');
        opt.value = st.name;
        opt.textContent = st.name;
        swStaffSelect.appendChild(opt);
      });
    }
  }

  async function loadAllData() {
    await Promise.all([
      loadDashboardStats(),
      loadBookings(),
      loadJobcards(),
      loadInvoices(),
      loadStaff()
    ]);
    renderActiveTab();
  }

  async function loadStaff() {
    try {
      var res = await fetch('/api/staff');
      if (res.ok) {
        var data = await res.json();
        STATE.staff = Array.isArray(data) ? data : [];
        populateStaffDropdown();
      }
    } catch (e) {
      console.error('Failed to load staff list:', e);
    }
  }

  async function loadDashboardStats() {
    try {
      var res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        var data = await res.json();
        document.getElementById('statCompletedToday').textContent = data.completedToday || 0;
        document.getElementById('statWaitingList').textContent = data.carsWaiting || 0;
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadBookings() {
    try {
      var res = await fetch('/api/bookings');
      if (res.ok) {
        STATE.bookings = await res.json();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadJobcards() {
    try {
      var res = await fetch('/api/jobcards');
      if (res.ok) {
        STATE.jobcards = await res.json();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadInvoices() {
    try {
      var res = await fetch('/api/invoices');
      if (res.ok) {
        STATE.invoices = await res.json();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Render logic based on Active Tab
  function renderActiveTab() {
    if (STATE.activeTab === 'queue') {
      renderQueueTab();
    } else if (STATE.activeTab === 'jobcards') {
      renderJobCardsTab();
    } else if (STATE.activeTab === 'services') {
      renderServicesTab();
    } else if (STATE.activeTab === 'billing') {
      renderBillingTab();
    }
  }

  // QUEUE RENDERING
  function renderQueueTab() {
    var baysGrid = document.getElementById('baysGrid');
    var waitlistRows = document.getElementById('waitlistRows');
    var waitlistCountBadge = document.getElementById('waitlistCountBadge');

    if (!baysGrid || !waitlistRows) return;

    // 1. Bays Layout
    var activeBays = { 'Bay 1': null, 'Bay 2': null, 'Bay 3': null, 'Bay 4': null };
    STATE.jobcards.forEach(function (card) {
      if (card.stage !== 'completed' && card.stage !== 'cancelled' && activeBays[card.bay] === null) {
        // Filter by branch scope
        if (!STATE.selectedBranch || card.branch_id === STATE.selectedBranch.id) {
          activeBays[card.bay] = card;
        }
      }
    });

    baysGrid.innerHTML = '';
    Object.keys(activeBays).forEach(function (bayName) {
      var card = activeBays[bayName];
      var el = document.createElement('div');
      el.className = 'm-bay-card';
      if (card) {
        var statusClass = card.stage === 'inprogress' ? 'washing' : 'starting';
        var statusLabel = card.stage === 'inprogress' ? 'Washing' : 'Check In';
        el.innerHTML =
          '<div class="m-bay-info">' +
            '<div class="m-bay-name">' + bayName + '</div>' +
            '<div class="m-bay-sub">' + escapeHtml(card.vehicle) + ' · ' + (escapeHtml(card.staff) || 'No Staff') + '</div>' +
            '<div style="font-size:11px;color:var(--text-3);">' + escapeHtml(card.service) + '</div>' +
          '</div>' +
          '<div class="m-bay-status ' + statusClass + '">' + statusLabel + '</div>';
        
        // Let user tap active bay card to view/update the job card
        el.addEventListener('click', function () {
          showJobCardDetails(card.id);
        });
      } else {
        el.innerHTML =
          '<div class="m-bay-info">' +
            '<div class="m-bay-name">' + bayName + '</div>' +
            '<div class="m-bay-sub" style="color:var(--text-3);">Bay Ready</div>' +
          '</div>' +
          '<div class="m-bay-status empty">Empty</div>';
      }
      baysGrid.appendChild(el);
    });

    // 2. Waitlist Layout
    var waitingBookings = STATE.bookings.filter(function (b) {
      // Filter by waiting status and active branch scope
      var matchBranch = !STATE.selectedBranch || b.branch_id === STATE.selectedBranch.id;
      return matchBranch && (b.status === 'waiting' || b.status === 'confirmed');
    });

    if (waitlistCountBadge) {
      waitlistCountBadge.textContent = waitingBookings.length;
    }

    waitlistRows.innerHTML = '';
    if (waitingBookings.length === 0) {
      waitlistRows.innerHTML = '<div style="padding:24px 0;text-align:center;color:var(--text-3);font-size:13px;">No bookings in waitlist</div>';
    } else {
      waitingBookings.forEach(function (b) {
        var initials = b.customer.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
        var isVip = b.customer.includes('Priya') || b.customer.includes('Thomas');
        var avatarClass = isVip ? 'm-item-avatar vip' : 'm-item-avatar';

        var el = document.createElement('div');
        el.className = 'm-list-item';
        el.innerHTML =
          '<div class="' + avatarClass + '">' + initials + '</div>' +
          '<div class="m-item-content">' +
            '<div class="m-item-title">' + escapeHtml(b.customer) + '</div>' +
            '<div class="m-item-sub">' + escapeHtml(b.service) + (b.vehicle ? ' · ' + escapeHtml(b.vehicle) : '') + '</div>' +
          '</div>' +
          '<div class="m-item-action">' +
            '<button type="button" class="btn btn-accent btn-sm start-wash-btn" data-id="' + b.id + '" onclick="window.SW_openStartWash(' + b.id + ')">Start Work</button>' +
          '</div>';
        
        el.querySelector('.start-wash-btn').addEventListener('click', function (e) {
          e.stopPropagation();
          initStartWashModal(b);
        });

        waitlistRows.appendChild(el);
      });
    }
  }

  // JOB CARDS RENDERING
  var activeJobcardFilter = 'active';
  var jobcardFilters = document.getElementById('jobcardFilters');
  if (jobcardFilters) {
    jobcardFilters.querySelectorAll('.m-filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        jobcardFilters.querySelectorAll('.m-filter-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeJobcardFilter = btn.getAttribute('data-stage');
        renderJobCardsTab();
      });
    });
  }

  function renderJobCardsTab() {
    var list = document.getElementById('jobcardsList');
    if (!list) return;

    var filtered = STATE.jobcards.filter(function (card) {
      var matchBranch = !STATE.selectedBranch || card.branch_id === STATE.selectedBranch.id;
      if (!matchBranch) return false;

      if (activeJobcardFilter === 'active') {
        return card.stage !== 'completed' && card.stage !== 'cancelled';
      }
      return card.stage === activeJobcardFilter;
    });

    list.innerHTML = '';
    if (filtered.length === 0) {
      list.innerHTML = '<div style="padding:32px 0;text-align:center;color:var(--text-3);font-size:13px;">No job cards in this stage</div>';
    } else {
      filtered.forEach(function (card) {
        var progressCount = 0;
        var totalCount = 0;
        if (card.checklist) {
          totalCount = card.checklist.length;
          progressCount = card.checklist.filter(function (item) { return item.done; }).length;
        }

        var el = document.createElement('div');
        el.className = 'm-jobcard-item';
        el.innerHTML =
          '<div class="m-jobcard-header">' +
            '<span class="m-jobcard-plate">' + escapeHtml(card.vehicle) + '</span>' +
            '<span class="m-jobcard-stage ' + card.stage + '">' + escapeHtml(card.stage) + '</span>' +
          '</div>' +
          '<div style="font-size:13px;font-weight:600;color:var(--text-1);">' + escapeHtml(card.service) + '</div>' +
          '<div class="m-jobcard-meta">' +
            '<div><i class="ti ti-id-badge-2"></i>' + escapeHtml(card.staff || 'No Staff') + '</div>' +
            '<div><i class="ti ti-map-pin"></i>' + escapeHtml(card.bay || 'No Bay') + '</div>' +
            '<div><i class="ti ti-checklist"></i>Task ' + progressCount + '/' + totalCount + '</div>' +
            '<div><i class="ti ti-photo"></i>' + (card.photos || 0) + ' Photos</div>' +
          '</div>';
        
        el.addEventListener('click', function () {
          showJobCardDetails(card.id);
        });

        list.appendChild(el);
      });
    }
  }

  // SERVICES RENDERING
  function renderServicesTab() {
    var list = document.getElementById('servicesList');
    if (!list) return;

    list.innerHTML = '';
    if (STATE.services.length === 0) {
      list.innerHTML = '<div style="padding:24px 0;text-align:center;color:var(--text-3);font-size:13px;">No services defined</div>';
    } else {
      STATE.services.forEach(function (s) {
        var el = document.createElement('div');
        el.className = 'm-service-card';
        el.innerHTML =
          '<div>' +
            '<div class="m-service-name">' + escapeHtml(s.name) + '</div>' +
            '<div class="m-service-dur"><i class="ti ti-clock-hour-4" style="font-size:12px;margin-right:4px;"></i>' + s.duration + ' mins</div>' +
          '</div>' +
          '<div class="m-service-price">' + formatPrice(s.price) + '</div>';
        list.appendChild(el);
      });
    }
  }

  // BILLING RENDERING
  function renderBillingTab() {
    var list = document.getElementById('billingInvoicesList');
    if (!list) return;

    // Filter invoices by branch scope
    var filtered = STATE.invoices.filter(function (inv) {
      return !STATE.selectedBranch || inv.branch_id === STATE.selectedBranch.id;
    });

    list.innerHTML = '';
    if (filtered.length === 0) {
      list.innerHTML = '<div style="padding:32px 0;text-align:center;color:var(--text-3);font-size:13px;">No invoices found</div>';
    } else {
      filtered.forEach(function (inv) {
        var statusLabel = inv.status === 'paid' ? 'Paid' : 'Pending Payment';
        var isPending = inv.status === 'pending';

        var el = document.createElement('div');
        el.className = 'm-invoice-card';
        el.innerHTML =
          '<div class="m-invoice-header">' +
            '<span class="m-invoice-id">' + escapeHtml(inv.invoice_number || inv.id) + '</span>' +
            '<span class="m-invoice-status ' + inv.status + '">' + statusLabel + '</span>' +
          '</div>' +
          '<div style="font-size:13px;color:var(--text-1);line-height:1.4;">' +
            '<strong>' + escapeHtml(inv.customer) + '</strong> · ' + escapeHtml(inv.phone) +
            '<div style="font-size:11.5px;color:var(--text-2);margin-top:2px;">' + escapeHtml(inv.service) + '</div>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:4px;">' +
            '<span style="font-size:11.5px;color:var(--text-3);">' + (inv.payment_method || inv.method || '—') + '</span>' +
            '<strong style="font-size:15px;color:var(--accent);">' + formatPrice(inv.amount) + '</strong>' +
          '</div>' +
          '<div class="m-invoice-actions">' +
            '<!-- <button type="button" class="m-action-btn wa" data-act="wa"><i class="ti ti-brand-whatsapp"></i> WhatsApp</button> -->' +
            '<!-- <button type="button" class="m-action-btn email" data-act="email"><i class="ti ti-mail"></i> Email</button> -->' +
            '<button type="button" class="m-action-btn pdf" data-act="pdf"><i class="ti ti-printer"></i> PDF</button>' +
            (isPending ? '<button type="button" class="m-action-btn pay" data-act="pay"><i class="ti ti-check"></i> Collect Payment</button>' : '') +
          '</div>';

        // Action Handlers
        var pdfActionBtn = el.querySelector('[data-act="pdf"]');
        if (pdfActionBtn) {
          pdfActionBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            shareInvoicePDF(inv);
          });
        }

        if (isPending) {
          var payActionBtn = el.querySelector('[data-act="pay"]');
          if (payActionBtn) {
            payActionBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              initCheckoutFlow(inv);
            });
          }
        }

        list.appendChild(el);
      });
    }
  }

  // INVOICE SHARING HELPERS
  function getProfileName() {
    try {
      var swUser = localStorage.getItem('sw_user');
      if (swUser) {
        var userObj = JSON.parse(swUser);
        if (userObj && userObj.name) return userObj.name;
      }
    } catch (e) {
      console.error(e);
    }
    return 'Shinewise Auto Care';
  }

  async function shareInvoiceWhatsApp(inv) {
    var rawPhone = (inv.phone || '').replace(/\D/g, '');
    if (!rawPhone) {
      rawPhone = prompt('Enter customer phone number for WhatsApp sharing:', '');
      if (!rawPhone) return;
      rawPhone = rawPhone.replace(/\D/g, '');
    }

    var profileName = getProfileName();
    var instagram = '';
    var google_business = '';
    try {
      var setRes = await fetch('/api/settings?t=' + new Date().getTime());
      if (setRes.ok) {
        var settings = await setRes.json();
        if (settings && settings.company_name) profileName = settings.company_name;
        if (settings && settings.instagram_url) instagram = settings.instagram_url;
        if (settings && settings.google_business_url) google_business = settings.google_business_url;
      }
    } catch (e) {}

    var subtotal = Number(inv.subtotal || inv.amount || 0);
    var taxRate = Number(inv.tax_rate || 18);
    var gst = Number(inv.tax_amount || (subtotal * (taxRate / 100)));
    var discount = Number(inv.discount_amount || 0);
    var total = Number(inv.amount || (subtotal + gst - discount));
    // GST-inclusive invoices: the price already contains the GST, so the subtotal shown is the GST-exclusive base
    if (inv.tax_inclusive) subtotal = Math.round((total + discount - gst) * 100) / 100;

    var msg = 'Hello ' + inv.customer + ',\n\n' +
              'Here is your invoice from *' + profileName + '*:\n\n' +
              '*Invoice ID:* ' + (inv.invoice_number || inv.id) + '\n' +
              '*Service:* ' + inv.service + '\n' +
              '*Subtotal:* ' + formatPrice(subtotal) + '\n' +
              '*GST (' + taxRate + '%):* ' + formatPrice(gst) + '\n' +
              (discount > 0 ? '*Discount:* -' + formatPrice(discount) + '\n' : '') +
              '*Total:* ' + formatPrice(total) + '\n' +
              '*Status:* ' + inv.status.toUpperCase();

    if (instagram) msg += '\n\n*Follow us on Instagram:* ' + instagram;
    if (google_business) msg += '\n\n*Review us on Google:* ' + google_business;

    msg += '\n\nThank you for your business!';

    window.open('https://wa.me/' + rawPhone + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  }

  function shareInvoiceEmail(inv) {
    var email = prompt('Enter customer email address:', inv.email || '');
    if (!email) return;

    var profileName = getProfileName();
    var subtotal = Number(inv.subtotal || inv.amount || 0);
    var taxRate = Number(inv.tax_rate || 18);
    var gst = Number(inv.tax_amount || (subtotal * (taxRate / 100)));
    var discount = Number(inv.discount_amount || 0);
    var total = Number(inv.amount || (subtotal + gst - discount));
    // GST-inclusive invoices: the price already contains the GST, so the subtotal shown is the GST-exclusive base
    if (inv.tax_inclusive) subtotal = Math.round((total + discount - gst) * 100) / 100;

    var body = 'Hello ' + inv.customer + ',\n\n' +
               'Here is your invoice summary from ' + profileName + ':\n\n' +
               'Invoice ID: ' + (inv.invoice_number || inv.id) + '\n' +
               'Service: ' + inv.service + '\n' +
               'Subtotal: ' + formatPrice(subtotal) + '\n' +
               'GST (' + taxRate + '%): ' + formatPrice(gst) + '\n' +
               (discount > 0 ? 'Discount: -' + formatPrice(discount) + '\n' : '') +
               'Total Amount: ' + formatPrice(total) + '\n' +
               'Status: ' + inv.status.toUpperCase() + '\n\n' +
               'Best regards,\n' + profileName;

    var mailtoLink = 'mailto:' + encodeURIComponent(email) +
                     '?subject=' + encodeURIComponent('Invoice ' + (inv.invoice_number || inv.id) + ' - ' + profileName) +
                     '&body=' + encodeURIComponent(body);

    window.open(mailtoLink, '_self');
  }

  function shareInvoicePDF(inv) {
    var profileName = getProfileName();
    var subtotal = Number(inv.subtotal || inv.amount || 0);
    var taxRate = (inv.tax_rate !== undefined && inv.tax_rate !== null) ? Number(inv.tax_rate) : (inv.tax_amount > 0 ? 18 : 0);
    var gst = taxRate > 0 ? Number(inv.tax_amount !== undefined && inv.tax_amount !== null ? inv.tax_amount : (subtotal * (taxRate / 100))) : 0;
    var discount = Number(inv.discount_amount || 0);
    var total = Number(inv.amount || (subtotal + gst - discount));
    // GST-inclusive invoices: the price already contains the GST, so the subtotal shown is the GST-exclusive base
    if (inv.tax_inclusive) subtotal = Math.round((total + discount - gst) * 100) / 100;

    var html =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
        '<title>Invoice ' + (inv.invoice_number || inv.id) + '</title>' +
        '<style>' +
          'body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 30px; margin: 0; line-height: 1.5; }' +
          '.header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }' +
          '.brand { font-size: 22px; font-weight: 700; color: #0f172a; }' +
          '.title { font-size: 18px; font-weight: 600; color: #64748b; }' +
          '.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }' +
          '.details-block h3 { margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; color: #64748b; }' +
          '.details-block p { margin: 3px 0; font-size: 14px; }' +
          'table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }' +
          'th { background: #f8fafc; text-align: left; padding: 10px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; }' +
          'td { padding: 14px 10px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }' +
          '.summary-box { width: 280px; margin-left: auto; border-top: 2px solid #e2e8f0; padding-top: 12px; }' +
          '.summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }' +
          '.summary-row.total { font-weight: 700; font-size: 17px; color: #0f172a; border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: 10px; }' +
        '</style>' +
      '</head>' +
      '<body>' +
        '<div class="header">' +
          '<div><div class="brand">' + escapeHtml(profileName) + '</div><p style="margin:4px 0 0 0;font-size:13px;color:#64748b;">Professional Car Wash & Detailing</p></div>' +
          '<div style="text-align:right;"><div class="title">INVOICE</div><p style="margin:4px 0 0 0;font-weight:600;">' + (inv.invoice_number || inv.id) + '</p></div>' +
        '</div>' +
        '<div class="details-grid">' +
          '<div class="details-block"><h3>Billed To</h3><p><strong>' + escapeHtml(inv.customer) + '</strong></p><p>Phone: ' + escapeHtml(inv.phone) + '</p></div>' +
          '<div class="details-block"><h3>Invoice Info</h3><p>Date: ' + (inv.date || new Date().toISOString().split('T')[0]) + '</p><p>Status: <strong>' + inv.status.toUpperCase() + '</strong></p></div>' +
        '</div>' +
        '<table>' +
          '<thead><tr><th>Service Description</th><th style="text-align:right;">Amount</th></tr></thead>' +
          '<tbody><tr><td>' + escapeHtml(inv.service) + '</td><td style="text-align:right;">' + formatPrice(subtotal) + '</td></tr></tbody>' +
        '</table>' +
        '<div class="summary-box">' +
          '<div class="summary-row"><span>Subtotal:</span><span>' + formatPrice(subtotal) + '</span></div>' +
          (taxRate > 0 ? '<div class="summary-row"><span>GST (' + taxRate + '%):</span><span>' + formatPrice(gst) + '</span></div>' : '') +
          (discount > 0 ? '<div class="summary-row"><span>Discount:</span><span>-' + formatPrice(discount) + '</span></div>' : '') +
          '<div class="summary-row total"><span>Total Paid/Due:</span><span>' + formatPrice(total) + '</span></div>' +
        '</div>' +
      '</body>' +
      '</html>';

    var printWin = window.open('', '_blank');
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(function () {
      printWin.print();
    }, 400);
  }

  // MODAL ACTIONS: NEW WASH
  var newWashFab = document.getElementById('newWashFab');
  var newWashForm = document.getElementById('newWashForm');

  if (newWashFab) {
    newWashFab.addEventListener('click', function () {
      if (newWashForm) newWashForm.reset();
      openModal('newWashModal');
    });
  }

  if (newWashForm) {
    newWashForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var submitBtn = newWashForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      var originalHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span style="font-size:12px;">Checking In...</span>';

      var customer = document.getElementById('nwCustomer').value;
      var phone = document.getElementById('nwPhone').value;
      var vehicleName = document.getElementById('nwVehicle') ? document.getElementById('nwVehicle').value.trim() : '';
      var plate = document.getElementById('nwVehiclePlate').value.toUpperCase();
      var type = document.getElementById('nwVehicleType').value;
      var service = document.getElementById('nwService').value;
      var notes = document.getElementById('nwNotes').value;

      // Format time label like main application
      var now = new Date();
      var hh = now.getHours();
      var mm = now.getMinutes();
      var timeString = (hh < 10 ? '0' + hh : hh) + ':' + (mm < 10 ? '0' + mm : mm);

      var vehicleDisplay = vehicleName ? vehicleName + ' (' + plate + ')' : type + ' (' + plate + ')';

      var payload = {
        customer: customer,
        phone: phone,
        vehicle: vehicleDisplay,
        vehicle_name: vehicleName,
        vehicle_plate: plate,
        vehicle_type: type,
        service: service,
        source: 'walkin',
        status: 'waiting',
        time: timeString,
        booking_date: now.toISOString().split('T')[0],
        pickup_required: false,
        whatsapp_opt_in: true,
        notes: notes,
        branch_id: STATE.selectedBranch ? STATE.selectedBranch.id : null
      };

      try {
        var res = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Customer checked in successfully!', 'ti-circle-check');
          closeModal('newWashModal');
          newWashForm.reset();
          loadAllData();
        } else {
          var errData = await res.json();
          showToast(errData.message || 'Check-in failed. Please verify fields.', 'ti-alert-circle');
        }
      } catch (err) {
        showToast('Connection error. Please try again.', 'ti-alert-circle');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  }

  // MODAL ACTIONS: START WASH
  var startWashForm = document.getElementById('startWashForm');

  async function initStartWashModal(booking) {
    if (!booking) return;

    try {
      if (!STATE.staff || STATE.staff.length === 0) {
        await loadStaff();
      } else {
        populateStaffDropdown();
      }

      var bookingIdEl = document.getElementById('swBookingId');
      if (bookingIdEl) bookingIdEl.value = booking.id || '';

      var vehicleTextEl = document.getElementById('swVehicleText');
      if (vehicleTextEl) {
        var vPlate = booking.vehicle_plate || '';
        var vName = booking.vehicle_name || booking.vehicle || '';
        var displayVeh = (vPlate && vName && vName.indexOf(vPlate) === -1) ? vPlate + ' (' + vName + ')' : (vName || vPlate || 'Vehicle');
        vehicleTextEl.value = displayVeh;
      }

      var serviceTextEl = document.getElementById('swServiceText');
      if (serviceTextEl) serviceTextEl.value = booking.service || '';

      openModal('startWashModal');
    } catch (err) {
      console.error('Error initializing start wash modal:', err);
      openModal('startWashModal');
    }
  }

  window.SW_openStartWash = function (bookingId) {
    var booking = STATE.bookings.find(function (b) { return String(b.id) === String(bookingId); });
    if (booking) {
      initStartWashModal(booking);
    } else {
      openModal('startWashModal');
    }
  };

  if (startWashForm) {
    startWashForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var submitBtn = startWashForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.pointerEvents = 'none';
      }

      var bookingId = document.getElementById('swBookingId').value;
      var bay = document.getElementById('swBay').value;
      var staff = document.getElementById('swStaff').value;

      var booking = STATE.bookings.find(function (b) { return b.id === parseInt(bookingId); });
      if (!booking) return;

      var payload = {
        booking_id: booking.id,
        customer: booking.customer,
        phone: booking.phone,
        vehicle: booking.vehicle_plate ? booking.vehicle_plate + ' (' + booking.vehicle + ')' : booking.vehicle,
        service: booking.service,
        staff: staff,
        bay: bay,
        branch_id: booking.branch_id
      };

      try {
        var res = await fetch('/api/jobcards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          // Update booking status on waitlist to in progress
          await fetch('/api/bookings/' + booking.id, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({ status: 'inprogress' })
          });

          showToast('Wash job started on ' + bay + '!', 'ti-play');
          closeModal('startWashModal');
          loadAllData();
        } else {
          var errData = await res.json();
          showToast(errData.message || 'Failed to start work.', 'ti-alert-circle');
        }
      } catch (err) {
        showToast('Connection error starting wash.', 'ti-alert-circle');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.style.pointerEvents = 'auto';
        }
      }
    });
  }

  // MODAL ACTIONS: JOB CARD DETAIL & CHECKLIST UPDATE
  var completeWashBtn = document.getElementById('completeWashBtn');
  var photoUploadInput = document.getElementById('photoUploadInput');
  var uploadPhotoBtn = document.getElementById('uploadPhotoBtn');

  async function showJobCardDetails(cardId) {
    var card = STATE.jobcards.find(function (jc) { return jc.id === cardId; });
    if (!card) return;

    document.getElementById('detJobcardId').value = card.id;
    document.getElementById('detPlate').textContent = card.vehicle;
    document.getElementById('detService').textContent = card.service;
    document.getElementById('detStaff').textContent = card.staff || 'No Staff';
    document.getElementById('detBay').textContent = card.bay || 'No Bay';
    document.getElementById('detNotes').textContent = card.note || '—';

    // Set stage badge styling
    var stageEl = document.getElementById('detStage');
    stageEl.textContent = card.stage;
    stageEl.className = 'm-jobcard-stage ' + card.stage;

    // Show/hide Complete Wash button
    if (card.stage === 'completed' || card.stage === 'cancelled') {
      completeWashBtn.style.display = 'none';
      if (uploadPhotoBtn) uploadPhotoBtn.style.display = 'none';
    } else {
      completeWashBtn.style.display = 'inline-flex';
      if (uploadPhotoBtn) uploadPhotoBtn.style.display = 'inline-flex';
    }

    // Render Checklist
    var checklistGrid = document.getElementById('detChecklistGrid');
    checklistGrid.innerHTML = '';
    if (card.checklist && card.checklist.length > 0) {
      card.checklist.forEach(function (item, index) {
        var row = document.createElement('div');
        row.className = 'm-checklist-row';
        var checkedAttr = item.done ? 'checked' : '';
        row.innerHTML =
          '<input type="checkbox" id="chk-' + index + '" ' + checkedAttr + '>' +
          '<label for="chk-' + index + '" style="font-size:13px;color:var(--text-2);">' + escapeHtml(item.label) + '</label>';
        
        row.querySelector('input').addEventListener('change', function () {
          updateChecklistItem(card.id, index, this.checked);
        });

        checklistGrid.appendChild(row);
      });
    } else {
      checklistGrid.innerHTML = '<div style="color:var(--text-3);font-size:12.5px;">No checklist items active</div>';
    }

    // Render Photos
    renderJobcardPhotosGrid(card);

    openModal('jobcardDetailsModal');
  }

  async function updateChecklistItem(cardId, index, isChecked) {
    var card = STATE.jobcards.find(function (jc) { return jc.id === cardId; });
    if (!card) return;

    var updatedChecklist = JSON.parse(JSON.stringify(card.checklist));
    if (updatedChecklist[index]) {
      updatedChecklist[index].done = isChecked;
    }

    try {
      var res = await fetch('/api/jobcards/' + cardId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken()
        },
        body: JSON.stringify({ checklist: updatedChecklist })
      });

      if (res.ok) {
        // Refresh local cache and UI active tab state
        var updatedCard = await res.json();
        var localIndex = STATE.jobcards.findIndex(function (jc) { return jc.id === cardId; });
        if (localIndex !== -1) {
          STATE.jobcards[localIndex] = updatedCard;
        }
        renderActiveTab();
      }
    } catch (e) {
      showToast('Checklist update connection failed.', 'ti-alert-circle');
    }
  }

  function renderJobcardPhotosGrid(card) {
    var grid = document.getElementById('detPhotosGrid');
    if (!grid) return;

    grid.innerHTML = '';
    if (card.photos && card.photos > 0) {
      for (var i = 1; i <= card.photos; i++) {
        var el = document.createElement('div');
        el.className = 'm-photo-item';
        // The filenames are stored locally in public/uploads/jobcards/jc_{cardId}_{index}.jpg
        var url = '/uploads/jobcards/jc_' + card.id + '_' + i + '.jpg?v=' + Date.now();
        el.innerHTML = '<img src="' + url + '" alt="Job card photo">';
        grid.appendChild(el);
      }
    } else {
      grid.innerHTML = '<div style="color:var(--text-3);font-size:12.5px;grid-column:1/-1;">No photos uploaded yet</div>';
    }
  }

  // COMPLETE WASH action
  if (completeWashBtn) {
    completeWashBtn.addEventListener('click', async function () {
      var cardId = document.getElementById('detJobcardId').value;
      completeWashBtn.disabled = true;

      try {
        var res = await fetch('/api/jobcards/' + cardId, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: JSON.stringify({ stage: 'completed' })
        });

        if (res.ok) {
          showToast('Wash job completed successfully!', 'ti-circle-check');
          closeModal('jobcardDetailsModal');
          var responseData = await res.json().catch(function () { return null; });
          await loadAllData();
          if (window.SW && window.SW.loadGlobal) window.SW.loadGlobal();

          // Switch to billing tab and automatically pop up the bill / PDF invoice!
          switchTab('billing');

          var createdInvoice = (responseData && responseData.billing_invoice) ? responseData.billing_invoice : null;
          if (!createdInvoice && STATE.invoices && STATE.invoices.length > 0) {
            createdInvoice = STATE.invoices.filter(function (inv) {
              return String(inv.job_card_id) === String(cardId);
            })[0] || STATE.invoices[0];
          }

          if (createdInvoice) {
            shareInvoicePDF(createdInvoice);
          }
        } else {
          showToast('Error completing job card.', 'ti-alert-circle');
        }
      } catch (err) {
        showToast('Connection error completing wash.', 'ti-alert-circle');
      } finally {
        completeWashBtn.disabled = false;
      }
    });
  }

  // PHOTO UPLOADER action
  if (uploadPhotoBtn && photoUploadInput) {
    uploadPhotoBtn.addEventListener('click', function () {
      photoUploadInput.click();
    });

    photoUploadInput.addEventListener('change', async function () {
      if (!photoUploadInput.files || photoUploadInput.files.length === 0) return;
      var file = photoUploadInput.files[0];
      var cardId = document.getElementById('detJobcardId').value;

      var formData = new FormData();
      formData.append('photo', file);

      uploadPhotoBtn.disabled = true;
      var originalHtml = uploadPhotoBtn.innerHTML;
      uploadPhotoBtn.innerHTML = 'Uploading photo...';

      try {
        var res = await fetch('/api/jobcards/' + cardId + '/photos', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
          },
          body: formData
        });

        if (res.ok) {
          showToast('Photo uploaded successfully!', 'ti-camera');
          var updatedCard = await res.json();
          
          // Update details view photo grid
          var localIndex = STATE.jobcards.findIndex(function (jc) { return jc.id === parseInt(cardId); });
          if (localIndex !== -1) {
            STATE.jobcards[localIndex] = updatedCard;
          }
          renderJobcardPhotosGrid(updatedCard);
          renderActiveTab();
        } else {
          showToast('Photo upload failed.', 'ti-alert-circle');
        }
      } catch (e) {
        showToast('Photo upload connection failed.', 'ti-alert-circle');
      } finally {
        uploadPhotoBtn.disabled = false;
        uploadPhotoBtn.innerHTML = originalHtml;
        photoUploadInput.value = ''; // Reset input selection
      }
    });
  }

  // BILLING CHECKOUT FLOW
  async function initCheckoutFlow(invoice) {
    var amountText = formatPrice(invoice.amount);
    var confirmed = confirm('Mark Invoice ' + (invoice.invoice_number || invoice.id) + ' (' + amountText + ') for customer ' + invoice.customer + ' as PAID?');
    if (!confirmed) return;

    var method = prompt('Select payment method:\nEnter: cash, upi, or card', 'upi');
    if (!method) return;
    method = method.toLowerCase().trim();
    if (method !== 'cash' && method !== 'upi' && method !== 'card') {
      alert('Invalid method entered. Cancelled.');
      return;
    }

    try {
      var res = await fetch('/api/invoices/' + invoice.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken()
        },
        body: JSON.stringify({ status: 'paid', method: method })
      });

      if (res.ok) {
        showToast('Payment recorded successfully!', 'ti-circle-check');
        loadAllData();
      } else {
        showToast('Failed to record payment.', 'ti-alert-circle');
      }
    } catch (e) {
      showToast('Connection error updating payment.', 'ti-alert-circle');
    }
  }

  // Initialize
  initGlobalState();

})();
