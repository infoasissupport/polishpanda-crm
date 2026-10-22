// Auth check at the very top of the script
(function() {
    var originalFetch = window.fetch;
    window.fetch = async function(resource, config) {
        if (typeof resource === 'string' && resource.startsWith('/api/')) {
            try {
                var savedBranch = localStorage.getItem('sw_branch');
                if (savedBranch) {
                    var branchCode = savedBranch.split(' · ')[0].trim();
                    if (branchCode) {
                        var url = new URL(resource, window.location.origin);
                        if (!url.searchParams.has('branch_code')) {
                            url.searchParams.set('branch_code', branchCode);
                            resource = url.toString().replace(window.location.origin, '');
                        }
                    }
                }
            } catch(e) {
                console.error("Fetch intercept error:", e);
            }
        }
        return originalFetch(resource, config);
    };
})();

(async function () {
  var path = window.location.pathname;
  var pageName = path.substring(path.lastIndexOf('/') + 1);
  if (pageName === 'login' || pageName === 'sign-up' || pageName === 'display' || pageName === '') {
    return;
  }

  try {
    var res = await fetch('/api/user', {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (res.status === 401) {
      if (path.startsWith('/manager')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(path);
      } else {
        window.location.href = '/login';
      }
    } else if (res.ok) {
      var data = await res.json();
      if (data.status === 'success' && data.user) {
        localStorage.setItem('sw_user', JSON.stringify(data.user));
      }
    }
  } catch (err) {
    console.error('Auth verification skipped due to connection error:', err);
  }
})();

// Global listener: Restrict all phone input fields to numeric digits only (0-9)
document.addEventListener('input', function (e) {
  var t = e.target;
  if (t && (t.type === 'tel' || (t.id && t.id.toLowerCase().indexOf('phone') !== -1))) {
    t.value = t.value.replace(/[^0-9]/g, '');
  }
});
document.addEventListener('paste', function (e) {
  var t = e.target;
  if (t && (t.type === 'tel' || (t.id && t.id.toLowerCase().indexOf('phone') !== -1))) {
    setTimeout(function () {
      t.value = t.value.replace(/[^0-9]/g, '');
    }, 0);
  }
});

// Global listener: make the entire box of every date/time input open its native
// picker on click, not just the small calendar-icon hitbox in the corner.
document.addEventListener('click', function (e) {
  var t = e.target;
  if (t && (t.type === 'date' || t.type === 'time' || t.type === 'datetime-local') && typeof t.showPicker === 'function') {
    try { t.showPicker(); } catch (err) { /* picker may already be open or input disabled */ }
  }
});

// Shared across all pages: sidebar highlighting + topbar (search, branch switcher,
// notifications, WhatsApp, user menu). Uses localStorage so state persists across pages.
(function () {
  var page = document.body.getAttribute('data-page');
  if (!page) return;
  document.querySelectorAll('.nav-item[data-page]').forEach(function (item) {
    item.classList.toggle('active', item.getAttribute('data-page') === page);
  });
})();

(function () {
  var BRANCHES = [];
  var NOTIFICATIONS = [];
  var WHATSAPP_CHATS = [];
  var SEARCH_DATA = [];

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function closeAllDropdowns(except) {
    document.querySelectorAll('.dropdown-menu.open').forEach(function (menu) {
      if (menu !== except) menu.classList.remove('open');
    });
    var results = document.getElementById('searchResults');
    if (results && except !== results) results.classList.remove('open');
  }

  function openModal(id) {
    closeAllDropdowns();
    var overlay = document.getElementById(id);
    if (!overlay || overlay.classList.contains('open')) return;
    overlay.classList.add('open');
    var firstField = overlay.querySelector('input, select, textarea');
    if (firstField) firstField.focus();
  }

  function closeModal(id) {
    var overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('open');
  }
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.open').forEach(function (overlay) {
      overlay.classList.remove('open');
    });
  }

  function initModals() {
    document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal(btn.getAttribute('data-modal-close'));
      });
    });
  }

  // Clicking any uploaded photo thumbnail (job card photos, before/after
  // shots, etc.) opens it enlarged in a shared lightbox.
  function initPhotoLightbox() {
    document.addEventListener('click', function (e) {
      var tile = e.target.closest('.photo-ph, .cjm-photo-tile');
      if (!tile) return;
      var match = /url\((['"]?)(.*?)\1\)/.exec(tile.style.backgroundImage);
      if (!match) return;
      var img = document.getElementById('photoLightboxImg');
      if (img) img.src = match[2];
      openModal('photoLightboxModal');
    });
  }

  function showToast(message, icon) {
    var stack = document.getElementById('toastStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.id = 'toastStack';
      document.body.appendChild(stack);
    }
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<i class="ti ' + (icon || 'ti-circle-check') + '"></i><span></span>';
    toast.querySelector('span').textContent = message;
    stack.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 3200);
  }

  window.SW = window.SW || {};
  window.SW.openModal = openModal;
  window.SW.closeModal = closeModal;
  window.SW.showToast = showToast;

  // Shared table pagination used by every list page:  [‹ Prev] [1] [2] [3] [Next ›]
  // Keeps the page's own Prev/Next buttons (and their click handlers), and fills a
  // sliding window of at most 3 page numbers between them.
  var PAGER_CHEVRON_LEFT = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6"/></svg>';
  var PAGER_CHEVRON_RIGHT = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6"/></svg>';
  var PAGER_WINDOW = 3;

  function renderPager(prevBtn, nextBtn, page, totalPages, onPage) {
    if (!prevBtn || !nextBtn) return;
    totalPages = Math.max(1, Math.floor(Number(totalPages) || 1));
    page = Math.min(Math.max(1, Math.floor(Number(page) || 1)), totalPages);

    var group = prevBtn.parentNode;
    if (group && group.classList) group.classList.add('sw-pager');

    if (!prevBtn.dataset.swPager) {
      prevBtn.innerHTML = PAGER_CHEVRON_LEFT + '<span class="sw-pager-label">Prev</span>';
      nextBtn.innerHTML = '<span class="sw-pager-label">Next</span>' + PAGER_CHEVRON_RIGHT;
      prevBtn.setAttribute('aria-label', 'Previous page');
      nextBtn.setAttribute('aria-label', 'Next page');
      prevBtn.dataset.swPager = nextBtn.dataset.swPager = '1';
    }
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;

    // number container sits between Prev and Next
    var pages = prevBtn.nextElementSibling;
    if (!pages || pages === nextBtn || !pages.classList.contains('pagination-pages')) {
      pages = document.createElement('div');
      prevBtn.parentNode.insertBefore(pages, nextBtn);
    }
    pages.className = 'pagination-pages';

    var first = Math.max(1, Math.min(page - 1, totalPages - PAGER_WINDOW + 1));
    var last = Math.min(totalPages, first + PAGER_WINDOW - 1);
    pages.innerHTML = '';
    for (var p = first; p <= last; p++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'page-num' + (p === page ? ' active' : '');
      b.textContent = p;
      b.setAttribute('aria-label', 'Page ' + p);
      if (p === page) b.setAttribute('aria-current', 'page');
      else b.addEventListener('click', (function (target) {
        return function () { if (typeof onPage === 'function') onPage(target); };
      })(p));
      pages.appendChild(b);
    }
  }
  window.SW.renderPager = renderPager;

  function setupDropdown(toggleId, menuId) {
    var toggle = document.getElementById(toggleId);
    var menu = document.getElementById(menuId);
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !menu.classList.contains('open');
      closeAllDropdowns();
      if (willOpen) menu.classList.add('open');
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  function initBranchSwitcher() {
    var menu = document.getElementById('branchMenu');
    var label = document.getElementById('branchLabel');
    if (!menu || !label) return;

    var saved = localStorage.getItem('sw_branch') || label.textContent.trim();
    
    var validTexts = BRANCHES.map(function(b) {
      return b.code ? b.code + ' · ' + b.name : b.name;
    });
    
    if (validTexts.length > 0 && !validTexts.includes(saved)) {
      saved = validTexts[0];
      localStorage.setItem('sw_branch', saved);
      writeJSON('sw_branch_raw', saved);
    }

    menu.innerHTML = '';
    BRANCHES.forEach(function (branch) {
      var text = branch.code ? branch.code + ' · ' + branch.name : branch.name;
      var item = document.createElement('div');
      item.className = 'dropdown-item';
      item.setAttribute('data-branch', text);
      item.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:2px;">' +
          '<strong style="font-size:13px;">' + escapeHtml(branch.name) + '</strong>' +
          '<span style="font-size:11px;color:var(--text-3);">' +
            escapeHtml((branch.code ? branch.code + ' · ' : '') + (branch.location || branch.city || '')) +
          '</span>' +
        '</div>';
      if (text === saved) item.classList.add('active');
      item.addEventListener('click', function () {
        label.textContent = text;
        writeJSON('sw_branch_raw', text);
        localStorage.setItem('sw_branch', text);
        menu.querySelectorAll('.dropdown-item[data-branch]').forEach(function (i) {
          i.classList.toggle('active', i === item);
        });
        closeAllDropdowns();
        window.location.reload(); // Reload to fetch the new branch's data
      });
      menu.appendChild(item);
    });

    if (saved && saved !== label.textContent.trim()) {
      label.textContent = saved;
    }
  }

  function initNotifications() {
    var list = document.getElementById('notifList');
    var dot = document.getElementById('notifDot');
    var markAllBtn = document.getElementById('markAllRead');
    var clearAllBtn = document.getElementById('clearAllNotifs');
    if (!list || !dot) return;

    var read = readJSON('sw_notifs_read', []);
    var cleared = readJSON('sw_notifs_cleared', []);

    function visibleNotifications() {
      return NOTIFICATIONS.filter(function (n) { return cleared.indexOf(n.id) === -1; });
    }

    function render() {
      list.innerHTML = '';
      var visible = visibleNotifications();

      if (!visible.length) {
        list.innerHTML = '<div class="dropdown-empty">No notifications</div>';
        updateDot();
        return;
      }

      visible.forEach(function (n) {
        var isUnread = read.indexOf(n.id) === -1;
        var row = document.createElement('div');
        row.className = 'notif-item' + (isUnread ? ' unread' : '');
        var iconClass = n.icon && n.icon.indexOf('ti-') === 0 ? n.icon : 'ti-' + n.icon;
        row.innerHTML =
          '<div class="notif-icon"><i class="ti ' + iconClass + '"></i></div>' +
          '<div><div class="notif-title">' + escapeHtml(n.title) + '</div>' +
          '<div class="notif-time">' + escapeHtml(n.time) + '</div></div>';
        row.addEventListener('click', function () {
          if (read.indexOf(n.id) === -1) {
            read.push(n.id);
            writeJSON('sw_notifs_read', read);
            updateDot();
          }
          row.classList.remove('unread');
          if (n.link) {
            window.location.href = n.link;
          }
        });
        list.appendChild(row);
      });
      updateDot();
    }

    function updateDot() {
      var anyUnread = visibleNotifications().some(function (n) { return read.indexOf(n.id) === -1; });
      dot.classList.toggle('hidden', !anyUnread);
    }

    if (markAllBtn) {
      markAllBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        read = NOTIFICATIONS.map(function (n) { return n.id; });
        writeJSON('sw_notifs_read', read);
        render();
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        cleared = NOTIFICATIONS.map(function (n) { return n.id; });
        writeJSON('sw_notifs_cleared', cleared);
        render();
      });
    }

    render();
  }

  function initWhatsapp() {
    var list = document.getElementById('waList');
    var dot = document.getElementById('waDot');
    if (dot) dot.style.display = WHATSAPP_CHATS.length ? 'block' : 'none';
    if (!list) return;
    list.innerHTML = '';
    WHATSAPP_CHATS.forEach(function (chat) {
      var row = document.createElement('div');
      row.className = 'wa-item';
      row.innerHTML =
        '<div class="wa-avatar">' + escapeHtml(chat.initials) + '</div>' +
        '<div><div class="wa-name">' + escapeHtml(chat.name) + '</div>' +
        '<div class="wa-msg">' + escapeHtml(chat.msg) + '</div></div>';
      row.addEventListener('click', function () {
        window.open('https://wa.me/' + encodeURIComponent(chat.phone), '_blank', 'noopener');
        closeAllDropdowns();
      });
      list.appendChild(row);
    });
  }

  function initUserMenu() {
    var logout = document.getElementById('logoutBtn');
    if (!logout) return;

    try {
      var rawUser = localStorage.getItem('sw_user');
      if (rawUser) {
        var user = JSON.parse(rawUser);

        var nameLabel = document.getElementById('userNameLabel');
        var emailLabel = document.getElementById('userEmailLabel');
        var toggleAvatar = document.querySelector('#userToggle .avatar') || document.getElementById('userToggle');
        var dropdownAvatar = document.querySelector('#userMenu .avatar');
        var dropdownName = document.querySelector('#userMenu .dropdown-user-name');
        var dropdownEmail = document.querySelector('#userMenu .dropdown-user-email');

        if (nameLabel) nameLabel.textContent = user.name;
        if (emailLabel) emailLabel.textContent = user.email;
        var roleLabel = document.getElementById('userRoleLabel');
        if (roleLabel) roleLabel.textContent = user.role === 'manager' ? 'Manager' : 'Admin';
        if (dropdownName) dropdownName.textContent = user.name;
        if (dropdownEmail) dropdownEmail.textContent = user.email;

        var initials = user.name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
        if (toggleAvatar) toggleAvatar.textContent = initials;
        if (dropdownAvatar) dropdownAvatar.textContent = initials;
      }
    } catch (e) {
      console.error(e);
    }

    var profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', function (e) {
        e.preventDefault();
        closeAllDropdowns();

        try {
          var rawUser = localStorage.getItem('sw_user');
          if (rawUser) {
            var user = JSON.parse(rawUser);
            var joinedDate = 'July 2026';
            if (user.created_at) {
              var date = new Date(user.created_at);
              var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              joinedDate = months[date.getMonth()] + ' ' + date.getFullYear();
            }

            var profName = document.getElementById('profileName');
            var profEmail = document.getElementById('profileEmail');
            var profJoined = document.getElementById('profileJoined');
            var profAvatar = document.querySelector('#profileModal .avatar');
            var initials = user.name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);

            if (profName) profName.textContent = user.name;
            if (profEmail) profEmail.textContent = user.email;
            if (profJoined) profJoined.textContent = joinedDate;
            if (profAvatar) profAvatar.textContent = initials;
          }
        } catch (err) {
          console.error(err);
        }

        openModal('profileModal');
      });
    }

    logout.addEventListener('click', async function (e) {
      e.preventDefault();
      closeAllDropdowns();
      try {
        var res = await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          localStorage.removeItem('sw_user');
          localStorage.removeItem('sw_branch');
          localStorage.removeItem('sw_branch_raw');
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Logout failed:', err);
        window.location.href = '/login';
      }
    });
  }

  function initSearch() {
    var input = document.getElementById('globalSearchInput');
    var results = document.getElementById('searchResults');
    if (!input || !results) return;

    function render(query) {
      var q = query.trim().toLowerCase();
      if (!q) {
        results.classList.remove('open');
        results.innerHTML = '';
        return;
      }
      var matches = SEARCH_DATA.filter(function (item) {
        return item.title.toLowerCase().indexOf(q) !== -1 || item.sub.toLowerCase().indexOf(q) !== -1;
      });

      if (!matches.length) {
        results.innerHTML = '<div class="search-empty">No results for “' + escapeHtml(query.trim()) + '”</div>';
        results.classList.add('open');
        return;
      }

      var groups = {};
      matches.forEach(function (item) {
        groups[item.type] = groups[item.type] || [];
        if (groups[item.type].length < 5) groups[item.type].push(item);
      });

      var html = '';
      Object.keys(groups).forEach(function (type) {
        html += '<div class="search-group-label">' + escapeHtml(type) + '</div>';
        groups[type].forEach(function (item) {
          html +=
            '<div class="search-result" data-href="' + item.href + '">' +
            '<i class="ti ' + item.icon + '"></i>' +
            '<div><div class="search-result-title">' + escapeHtml(item.title) + '</div>' +
            '<div class="search-result-sub">' + escapeHtml(item.sub) + '</div></div></div>';
        });
      });
      results.innerHTML = html;
      results.classList.add('open');

      results.querySelectorAll('.search-result').forEach(function (row) {
        row.addEventListener('click', function () {
          window.location.href = row.getAttribute('data-href');
        });
      });
    }

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('focus', function (e) {
      e.stopPropagation();
      if (input.value.trim()) render(input.value);
    });
    input.addEventListener('click', function (e) { e.stopPropagation(); });
    results.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  document.addEventListener('click', function () { closeAllDropdowns(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeAllModals();
      var input = document.getElementById('globalSearchInput');
      if (input) input.blur();
    }
  });

  setupDropdown('branchToggle', 'branchMenu');
  setupDropdown('notifToggle', 'notifMenu');
  setupDropdown('waToggle', 'waMenu');
  setupDropdown('userToggle', 'userMenu');
  initUserMenu();
  initModals();
  initPhotoLightbox();

  (function initSidebarToggle() {
    var toggleBtn = document.getElementById('sidebarToggleBtn');
    var closeBtn = document.getElementById('sidebarCloseBtn');
    var sidebar = document.querySelector('.sidebar');
    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        sidebar.classList.remove('open');
      });
    }

    document.addEventListener('click', function (e) {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  })();

  // Desktop: the menu button at the top of the sidebar collapses it to icons only (remembered)
  (function initSidebarCollapse() {
    var btn = document.getElementById('sidebarCollapseBtn');
    if (!btn) return;
    var KEY = 'sw_sidebar_collapsed';
    function apply(collapsed) {
      document.body.classList.toggle('sidebar-collapsed', collapsed);
      // icon-only mode: show each item's name as a tooltip
      document.querySelectorAll('.sidebar .nav-item').forEach(function (a) {
        if (collapsed) a.setAttribute('title', a.textContent.trim()); else a.removeAttribute('title');
      });
      btn.setAttribute('aria-label', collapsed ? 'Expand navigation menu' : 'Collapse navigation menu');
      btn.setAttribute('aria-expanded', String(!collapsed));
    }
    var saved = false;
    try { saved = localStorage.getItem(KEY) === '1'; } catch (e) {}
    apply(saved);
    btn.addEventListener('click', function () {
      var collapsed = !document.body.classList.contains('sidebar-collapsed');
      apply(collapsed);
      try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch (e) {}
    });
  })();

  // Ctrl + K (Cmd + K on Mac) focuses the global search
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      var input = document.getElementById('globalSearchInput');
      if (!input) return;
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  async function loadGlobalData() {
    try {
      const res = await fetch('/api/global');
      if (!res.ok) return;
      const data = await res.json();
      BRANCHES = data.branches || [];
      NOTIFICATIONS = data.notifications;
      WHATSAPP_CHATS = data.whatsapp;

      const [bookings, customers, vehicles] = await Promise.all([
        fetch('/api/bookings').then(r => r.json()),
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/vehicles').then(r => r.json())
      ]);

      SEARCH_DATA = [];
      customers.forEach(function (c) {
        var vehicleText = c.vehicles && c.vehicles.length ? c.vehicles.map(v => v.brand).join(', ') : 'No vehicle';
        SEARCH_DATA.push({
          type: 'Customers',
          icon: 'ti-users',
          title: c.name,
          sub: vehicleText + ' · ' + c.points + ' pts',
          href: '/crm'
        });
      });
      vehicles.forEach(function (v) {
        SEARCH_DATA.push({
          type: 'Vehicles',
          icon: 'ti-car',
          title: v.brand,
          sub: v.plate + ' · ' + v.colour,
          href: '/crm'
        });
      });
      bookings.forEach(function (b) {
        SEARCH_DATA.push({
          type: 'Bookings',
          icon: 'ti-calendar-event',
          title: '#BK-' + b.id,
          sub: b.customer + ' · ' + b.service,
          href: '/bookings'
        });
      });

      initBranchSwitcher();
      initNotifications();
      initWhatsapp();
      initSearch();
    } catch (err) {
      console.error('Failed to load global data:', err);
      initBranchSwitcher();
      initNotifications();
      initWhatsapp();
      initSearch();
    }
  }
  window.SW.loadGlobal = loadGlobalData;
  loadGlobalData();
})();
