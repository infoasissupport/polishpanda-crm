// Page-specific behavior for staff.html
(function () {
  var tableBody = document.getElementById('staffTableBody');
  var emptyState = document.getElementById('staffEmptyState');
  var searchInput = document.getElementById('staffSearchInput');
  var filterSelect = document.getElementById('staffFilterSelect');
  var prevBtn = document.getElementById('staffPrevBtn');
  var nextBtn = document.getElementById('staffNextBtn');
  var pageInfo = document.getElementById('staffPageInfo');
  var pageNumbers = document.getElementById('staffPageNumbers');
  var exportBtn = document.getElementById('exportStaffBtn');
  var form = document.getElementById('staffForm');
  var modalTitle = document.getElementById('staffModalTitle');
  var submitBtn = document.getElementById('staffSubmitBtn');
  var attendanceDateInput = document.getElementById('attendanceDate');
  var staffSection = document.getElementById('staff');
  var staffTabs = document.querySelectorAll('.stf-tab');
  var employeeGrid = document.getElementById('employeeGrid');
  var employeeEmptyState = document.getElementById('employeeEmptyState');
  if (!tableBody) return;

  function switchTab(name) {
    staffTabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === name); });
    if (staffSection) {
      staffSection.classList.remove('tab-employee', 'tab-attendance');
      staffSection.classList.add('tab-' + name);
    }
  }

  if (staffTabs.length) {
    staffTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchTab(tab.getAttribute('data-tab'));
      });
    });
    if (staffSection) staffSection.classList.add('tab-employee');
  }

  // Initialize date selector to today's local date
  if (attendanceDateInput) {
    var todayStr = new Date().toLocaleDateString('en-CA');
    attendanceDateInput.value = todayStr;
    attendanceDateInput.addEventListener('change', function () {
      currentPage = 1;
      loadStaff();
    });
  }

  var PAGE_SIZE = 10;
  var activeFilter = 'all';
  var currentPage = 1;
  var editingId = null;
  var pendingProfilePhotoFile = null;
  var currentAttendanceDate = attendanceDateInput ? attendanceDateInput.value : new Date().toLocaleDateString('en-CA');

  var STAFF = [];

  var AVATAR_THEMES = [
    { bg: '#EFF6FF', color: '#1D4ED8' },
    { bg: '#ECFDF5', color: '#15803D' },
    { bg: '#F5F3FF', color: '#6D28D9' },
    { bg: '#FFF7ED', color: '#C2410C' },
    { bg: '#FDF2F8', color: '#BE185D' },
    { bg: '#F0FDFA', color: '#0F766E' },
    { bg: '#ECFEFF', color: '#0E7490' },
    { bg: '#EEF2FF', color: '#4338CA' }
  ];

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatJoinedDate(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  var PHONE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
  var EMP_PENCIL_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
  var EMP_TRASH_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>';

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function findStaff(id) {
    return STAFF.filter(function (s) { return s.id === id; })[0];
  }

  function avatarThemeFor(s) {
    var key = String(s.id != null ? s.id : s.name || '');
    var hash = 0;
    for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return AVATAR_THEMES[hash % AVATAR_THEMES.length];
  }

  function parseShiftHours(shift) {
    if (!shift) return null;
    var parts = shift.split(/[–-]/).map(function (p) { return p.trim(); });
    if (parts.length !== 2) return null;
    var start = parseClockTime(parts[0]);
    var end = parseClockTime(parts[1]);
    if (start == null || end == null) return null;
    var diff = end - start;
    if (diff <= 0) diff += 24;
    return diff;
  }

  function parseClockTime(str) {
    var m = str.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (!m) return null;
    var hours = parseInt(m[1], 10) % 12;
    var minutes = m[2] ? parseInt(m[2], 10) : 0;
    if (/pm/i.test(m[3])) hours += 12;
    return hours + minutes / 60;
  }

  function attendanceMeta(s) {
    if (s.attendance === 'present') {
      return { cls: 'present', label: 'Present', sub: s.check_in ? 'Check in: ' + s.check_in : 'Check in: —' };
    }
    if (s.attendance === 'late') {
      return { cls: 'late', label: 'Late', sub: s.check_in ? 'Check in: ' + s.check_in : 'Late arrival' };
    }
    if (s.attendance === 'on_leave') {
      return { cls: 'leave', label: 'On Leave', sub: s.leave_type || 'On leave' };
    }
    return { cls: 'absent', label: 'Absent', sub: 'No check in' };
  }

  function updateFilterCounts() {
    // no-op placeholder for future counts on chips
  }

  function matchesFilter(s) {
    return activeFilter === 'all' || s.attendance === activeFilter;
  }

  function matchesSearch(s, query) {
    if (!query) return true;
    return s.name.toLowerCase().indexOf(query) !== -1 || (s.phone || '').toLowerCase().indexOf(query) !== -1;
  }

  function getFiltered() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    return STAFF.filter(function (s) { return matchesFilter(s) && matchesSearch(s, query); });
  }

  function getEmployeeFiltered() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    return STAFF.filter(function (s) { return matchesSearch(s, query); });
  }

  function employeeCode(s) {
    return s.employee_id || ('EMP' + String(s.id).padStart(3, '0'));
  }

  function employeeCardHtml(s) {
    var theme = avatarThemeFor(s);
    var initial = (s.name || '?').trim().charAt(0).toUpperCase();
    var joined = formatJoinedDate(s.joined_at);
    var avatarHtml = s.photo
      ? '<div class="emp-avatar" style="background-image:url(\'/' + s.photo + '?t=' + new Date(s.updated_at).getTime() + '\');background-size:cover;background-position:center;"></div>'
      : '<div class="emp-avatar" style="background:' + theme.bg + ';color:' + theme.color + ';">' + escapeHtml(initial) + '</div>';

    return (
      '<div class="emp-card" data-id="' + s.id + '">' +
        '<div class="emp-card-actions">' +
          '<button type="button" class="emp-action-btn view-cal" data-action="calendar" data-id="' + s.id + '" title="View Attendance"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></button><button type="button" class="emp-action-btn edit" data-action="edit" data-id="' + s.id + '" title="Edit employee">' + EMP_PENCIL_SVG + '</button>' +
          '<button type="button" class="emp-action-btn delete" data-action="delete" data-id="' + s.id + '" title="Remove employee">' + EMP_TRASH_SVG + '</button>' +
        '</div>' +
        '<div class="emp-card-top">' +
          avatarHtml +
          '<div>' +
            '<div class="emp-name">' + escapeHtml(s.name) + '</div>' +
            '<div class="emp-code">' + employeeCode(s) + '</div>' +
            (s.job_title ? '<span class="emp-title-badge">' + escapeHtml(s.job_title) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="emp-detail-row">' + PHONE_SVG + '<span>' + escapeHtml(s.phone || '—') + '</span></div>' +
        (s.email ? '<div class="emp-detail-row"><i class="ti ti-mail"></i><span>' + escapeHtml(s.email) + '</span></div>' : '') +
        '<div class="emp-detail-row"><i class="ti ti-users"></i><span>' + escapeHtml(s.department || s.branch || '—') + '</span></div>' +
        (s.native_place ? '<div class="emp-detail-row"><i class="ti ti-map-pin"></i><span>' + escapeHtml(s.native_place) + '</span></div>' : '') +
        (joined ? '<div class="emp-detail-row"><i class="ti ti-calendar-event"></i><span>Joined ' + joined + '</span></div>' : '') +
        '<div class="emp-card-footer" style="flex-direction:column; align-items:stretch; gap:6px;">' +
          '<div style="display:flex; justify-content:space-between;">' +
            '<span class="emp-salary-label">Base Salary</span>' +
            '<span class="emp-salary-value">₹' + Number(s.base_salary || 0).toLocaleString('en-IN') + '/mo</span>' +
          '</div>' +
          (Number(s.paid_this_month) > 0 ? 
            '<div style="display:flex; justify-content:space-between; font-size:11.5px;">' +
              '<span style="color:#64748b; font-weight:500;">Advance / Daily given</span>' +
              '<span style="color:#f59e0b; font-weight:600;">-₹' + Number(s.paid_this_month).toLocaleString('en-IN') + '</span>' +
            '</div>' +
            '<div style="display:flex; justify-content:space-between; font-size:12.5px;">' +
              '<span style="color:#101828; font-weight:600;">Remaining</span>' +
              '<span style="color:#10b981; font-weight:700;">₹' + Math.max(0, Number(s.base_salary || 0) - Number(s.paid_this_month)).toLocaleString('en-IN') + '</span>' +
            '</div>'
          : '') +
        '</div>' +
      '</div>'
    );
  }

  function renderEmployeeGrid() {
    if (!employeeGrid) return;
    var filtered = getEmployeeFiltered();
    // all employees on one list (no pager) — the page area scrolls
    employeeGrid.innerHTML = filtered.map(employeeCardHtml).join('');

    if (employeeEmptyState) employeeEmptyState.style.display = filtered.length ? 'none' : 'block';
  }

  function rowHtml(s, slNo) {
    var theme = avatarThemeFor(s);
    var initial = (s.name || '?').trim().charAt(0).toUpperCase();
    var hours = parseShiftHours(s.shift);
    var att = attendanceMeta(s);
    var avatarHtml = s.profile_photo
      ? '<div class="stf-avatar" style="background-image:url(\'/' + s.profile_photo + '?t=' + new Date(s.updated_at).getTime() + '\');background-size:cover;background-position:center;"></div>'
      : '<div class="stf-avatar" style="background:' + theme.bg + ';color:' + theme.color + ';">' + escapeHtml(initial) + '</div>';

    return (
      '<tr data-id="' + s.id + '">' +
        '<td class="col-sl">' + slNo + '</td>' +
        '<td><div class="stf-name-cell">' +
          avatarHtml +
          '<div><div class="stf-name">' + escapeHtml(s.name) + (s.role === 'manager' ? ' <span class="stf-role-badge">Manager</span>' : '') + '</div><div class="stf-sub">' + escapeHtml(s.phone || '') + '</div></div>' +
        '</div></td>' +
        '<td><div class="stf-shift">' + escapeHtml(s.shift) + '</div><div class="stf-sub">' + (hours ? hours + ' hrs' : '') + '</div></td>' +
        '<td><div class="stf-date">' + formatDate(currentAttendanceDate) + '</div></td>' +
        '<td><div class="stf-att stf-att-' + att.cls + '"><span class="stf-att-dot"></span>' + att.label + '</div><div class="stf-sub">' + escapeHtml(att.sub) + '</div></td>' +
        '<td><div class="stf-jobs-today">' + Number(s.jobs_today || 0) + '</div></td>' +
        '<td><div class="stf-row-actions"><button type="button" class="stf-edit-btn stf-calendar-btn" data-id="' + s.id + '" title="View Attendance" aria-label="View Attendance"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></button><button type="button" class="stf-edit-btn" data-id="' + s.id + '" title="Edit staff" aria-label="Edit staff">' +
          '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
        '</button></div></td>' +
      '</tr>'
    );
  }

  function renderPagination(totalItems, totalPages, start) {
    if (!pageInfo) return;
    if (totalItems === 0) {
      pageInfo.textContent = 'No staff';
    } else {
      var rangeStart = start + 1;
      var rangeEnd = Math.min(start + PAGE_SIZE, totalItems);
      pageInfo.textContent = 'Showing ' + rangeStart + ' to ' + rangeEnd + ' of ' + totalItems + ' staff';
    }

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (window.SW && SW.renderPager) SW.renderPager(prevBtn, nextBtn, currentPage, totalPages, function (p) { currentPage = p; renderTable(); });
  }

  function renderTable() {
    var filtered = getFiltered();
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * PAGE_SIZE;
    var pageItems = filtered.slice(start, start + PAGE_SIZE);

    tableBody.innerHTML = pageItems.map(function (s, idx) { return rowHtml(s, start + idx + 1); }).join('');

    if (emptyState) emptyState.style.display = filtered.length ? 'none' : 'block';
    renderPagination(filtered.length, totalPages, start);
    updateFilterCounts();
  }

  tableBody.addEventListener('click', function (e) {
    var calBtn = e.target.closest('.stf-calendar-btn');
    if (calBtn) {
      openCalendar(Number(calBtn.getAttribute('data-id')));
      return;
    }
    var btn = e.target.closest('.stf-edit-btn');
    if (!btn) return;
    openEdit(Number(btn.getAttribute('data-id')));
  });

  if (employeeGrid) {
    employeeGrid.addEventListener('click', function (e) {
      var actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        var action = actionBtn.getAttribute('data-action');
        var actionId = Number(actionBtn.getAttribute('data-id'));
        if (action === 'delete') {
          removeStaff(actionId);
        } else {
          openEdit(actionId);
        }
        return;
      }

      var card = e.target.closest('.emp-card');
      if (!card) return;
      openEdit(Number(card.getAttribute('data-id')));
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', function () {
      activeFilter = filterSelect.value;
      currentPage = 1;
      renderTable();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      currentPage = 1;
      renderTable();
      renderEmployeeGrid();
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { if (currentPage > 1) { currentPage--; renderTable(); } });
  if (nextBtn) nextBtn.addEventListener('click', function () { currentPage++; renderTable(); });

  function setPhotoPreview(src) {
    var img = document.getElementById('stfPhotoPreview');
    var icon = document.getElementById('stfPhotoPlaceholderIcon');
    if (!img || !icon) return;
    if (src) {
      img.src = src;
      img.style.display = 'block';
      icon.style.display = 'none';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
      icon.style.display = '';
    }
  }

  function resetForm() {
    form.reset();
    if (document.getElementById('stfSalary')) {
      document.getElementById('stfSalary').value = 0;
    }
    if (document.getElementById('stfAttendance')) {
      document.getElementById('stfAttendance').value = 'present';
    }
    if (document.getElementById('stfLeaveType')) {
      document.getElementById('stfLeaveType').value = '';
    }
    pendingProfilePhotoFile = null;
    setPhotoPreview(null);
    pendingDocFiles = { id_proof: null, pcc: null };
    setDocStatus('id_proof', 'No file uploaded', null);
    setDocStatus('pcc', 'No file uploaded', null);
  }

  var stfPhotoPicker = document.getElementById('stfPhotoPicker');
  var stfPhotoInput = document.getElementById('stfPhotoInput');
  if (stfPhotoPicker && stfPhotoInput) {
    stfPhotoPicker.addEventListener('click', function () { stfPhotoInput.click(); });
    stfPhotoInput.addEventListener('change', function () {
      var file = stfPhotoInput.files && stfPhotoInput.files[0];
      if (!file) return;
      pendingProfilePhotoFile = file;
      var reader = new FileReader();
      reader.onload = function (e) { setPhotoPreview(e.target.result); };
      reader.readAsDataURL(file);
    });
  }

  // Resize/compress a picked photo, then upload it as a staff member's
  // profile picture. Resolves with the updated staff record.
  function uploadStaffPhoto(staffId, file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function (event) {
        var img = new Image();
        img.src = event.target.result;
        img.onload = function () {
          var canvas = document.createElement('canvas');
          var max_size = 500;
          var width = img.width;
          var height = img.height;
          if (width > height) {
            if (width > max_size) { height *= max_size / width; width = max_size; }
          } else {
            if (height > max_size) { width *= max_size / height; height = max_size; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);

          canvas.toBlob(async function (blob) {
            var formData = new FormData();
            formData.append('photo', blob, 'photo.jpg');
            try {
              var response = await fetch('/api/staff/' + staffId + '/photo', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
              });
              if (response.ok) {
                resolve(await response.json());
              } else {
                reject('Failed to upload photo');
              }
            } catch (err) {
              reject(err);
            }
          }, 'image/jpeg', 0.85);
        };
      };
    });
  }

  // ---------- ID proof / PCC certificate uploads ----------
  var pendingDocFiles = { id_proof: null, pcc: null };
  var DOC_CONFIG = {
    id_proof: { btn: 'stfIdProofBtn', input: 'stfIdProofInput', status: 'stfIdProofStatus', link: 'stfIdProofLink', field: 'id_proof' },
    pcc: { btn: 'stfPccBtn', input: 'stfPccInput', status: 'stfPccStatus', link: 'stfPccLink', field: 'pcc_certificate' }
  };

  function setDocStatus(type, text, url) {
    var cfg = DOC_CONFIG[type];
    var statusEl = document.getElementById(cfg.status);
    var linkEl = document.getElementById(cfg.link);
    if (statusEl) statusEl.textContent = text;
    if (linkEl) {
      if (url) {
        linkEl.href = url;
        linkEl.style.display = '';
      } else {
        linkEl.removeAttribute('href');
        linkEl.style.display = 'none';
      }
    }
  }

  Object.keys(DOC_CONFIG).forEach(function (type) {
    var cfg = DOC_CONFIG[type];
    var btn = document.getElementById(cfg.btn);
    var input = document.getElementById(cfg.input);
    if (!btn || !input) return;
    btn.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      pendingDocFiles[type] = file;
      setDocStatus(type, 'Selected: ' + file.name + ' (uploads on save)', null);
    });
  });

  async function uploadStaffDocument(staffId, type, file) {
    var formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);
    var response = await fetch('/api/staff/' + staffId + '/document', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to upload document');
    return response.json();
  }

  // Branch is no longer an editable field in the staff form (hidden input).
  // Defaults new staff to the first configured branch; openEdit() overwrites
  // this with the staff member's existing branch right after.
  async function populateBranches() {
    var input = document.getElementById('stfBranch');
    if (!input || input.value) return;
    try {
      var res = await fetch('/api/global');
      if (res.ok) {
        var data = await res.json();
        var branches = data.branches || [];
        if (branches.length) input.value = branches[0].name;
      }
    } catch (e) {
      console.error('Failed to default staff branch:', e);
    }
  }

  // Existing staff created before first_name/last_name existed only have a
  // combined `name` — split it on the first space as a best-effort fallback.
  function splitName(s) {
    var full = (s.name || '').trim();
    var spaceIdx = full.indexOf(' ');
    if (spaceIdx === -1) return { firstName: full, lastName: '' };
    return { firstName: full.slice(0, spaceIdx), lastName: full.slice(spaceIdx + 1) };
  }

  async function openCreate(role) {
    editingId = null;
    var isManager = role === 'manager';
    modalTitle.textContent = isManager ? 'Add Manager' : 'Add staff';
    submitBtn.innerHTML = isManager ? '<i class="ti ti-shield"></i>Add manager' : '<i class="ti ti-user-plus"></i>Add staff';
    resetForm();
    if (document.getElementById('stfRole')) {
      document.getElementById('stfRole').value = isManager ? 'manager' : 'staff';
    }
    if (window.generateNextEmpId) window.generateNextEmpId();
    if (window.toggleManagerFields) window.toggleManagerFields();
    await populateBranches();
    window.SW.openModal('staffModal');
  }

  var addEmployeeBtn = document.getElementById('addEmployeeBtn');
  if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', function () {
      openCreate('staff');
    });
  }

  async function openEdit(id) {
    var s = findStaff(id);
    if (!s) return;
    editingId = id;
    modalTitle.textContent = s.role === 'manager' ? 'Edit Manager' : 'Edit staff';
    submitBtn.innerHTML = '<i class="ti ti-check"></i>Save changes';

    if (window.toggleManagerFields) window.toggleManagerFields();
    await populateBranches();

    pendingProfilePhotoFile = null;
    setPhotoPreview(s.photo ? '/' + s.photo + '?t=' + new Date(s.updated_at).getTime() : null);

    pendingDocFiles = { id_proof: null, pcc: null };
    setDocStatus('id_proof', s.id_proof_path ? 'Uploaded' : 'No file uploaded', s.id_proof_path ? '/' + s.id_proof_path : null);
    setDocStatus('pcc', s.pcc_certificate_path ? 'Uploaded' : 'No file uploaded', s.pcc_certificate_path ? '/' + s.pcc_certificate_path : null);

    var nameParts = splitName(s);
    document.getElementById('stfFirstName').value = s.first_name || nameParts.firstName;
    document.getElementById('stfLastName').value = s.last_name || nameParts.lastName;
    document.getElementById('stfPhone').value = s.phone;
    if (document.getElementById('stfEmail')) {
      document.getElementById('stfEmail').value = s.email || '';
    }
    if (document.getElementById('stfEmployeeId')) {
      document.getElementById('stfEmployeeId').value = s.employee_id || '';
    }
    if (document.getElementById('stfNativePlace')) {
      document.getElementById('stfNativePlace').value = s.native_place || '';
    }
    if (document.getElementById('stfGender')) {
      document.getElementById('stfGender').value = s.gender || '';
    }
    if (document.getElementById('stfAge')) {
      document.getElementById('stfAge').value = s.age || '';
    }
    if (document.getElementById('stfMaritalStatus')) {
      document.getElementById('stfMaritalStatus').value = s.marital_status || '';
    }
    if (document.getElementById('stfHighestEducation')) {
      document.getElementById('stfHighestEducation').value = s.highest_education || '';
    }
    if (document.getElementById('stfJoinedAt')) {
      document.getElementById('stfJoinedAt').value = s.joined_at ? String(s.joined_at).slice(0, 10) : '';
    }
    if (document.getElementById('stfRole')) {
      document.getElementById('stfRole').value = s.role || 'staff';
    }
    document.getElementById('stfBranch').value = s.branch;
    document.getElementById('stfShift').value = s.shift;
    document.getElementById('stfAttendance').value = s.attendance;
    if (document.getElementById('stfSalary')) {
      document.getElementById('stfSalary').value = s.base_salary || 0;
    }
    if (document.getElementById('stfLeaveType')) {
      document.getElementById('stfLeaveType').value = s.attendance === 'on_leave' ? (s.leave_type || 'Casual Leave') : '';
    }

    window.SW.openModal('staffModal');
  }


  function csvField(value) {
    var str = String(value == null ? '' : value);
    return /[",\r\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var onAttendanceTab = staffSection && staffSection.classList.contains('tab-attendance');
      var filtered = onAttendanceTab ? getFiltered() : getEmployeeFiltered();
      var lines = onAttendanceTab
        ? ['Name,Phone,Role,Branch,Shift,Date,Attendance']
        : ['Name,Phone,Role,Branch,Job Title,Department,Base Salary'];

      filtered.forEach(function (s) {
        var row = onAttendanceTab
          ? [s.name, s.phone, s.role || 'staff', s.branch, s.shift, currentAttendanceDate, attendanceMeta(s).label]
          : [s.name, s.phone, s.role || 'staff', s.branch, s.job_title, s.department, s.base_salary || 0];
        lines.push(row.map(csvField).join(','));
      });

      var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = (onAttendanceTab ? 'attendance-' + currentAttendanceDate : 'staff-' + new Date().toLocaleDateString('en-CA')) + '.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.SW) window.SW.showToast(onAttendanceTab ? 'Attendance exported' : 'Staff exported');
    });
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (submitBtn && submitBtn.disabled) return;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Saving...';
      }

      var firstName = document.getElementById('stfFirstName').value.trim();
      var lastName = document.getElementById('stfLastName').value.trim();
      var name = [firstName, lastName].filter(Boolean).join(' ');
      var employeeId = document.getElementById('stfEmployeeId') ? document.getElementById('stfEmployeeId').value.trim() : '';
      var nativePlace = document.getElementById('stfNativePlace') ? document.getElementById('stfNativePlace').value.trim() : '';
      var gender = document.getElementById('stfGender') ? document.getElementById('stfGender').value : '';
      var age = document.getElementById('stfAge') && document.getElementById('stfAge').value ? parseInt(document.getElementById('stfAge').value, 10) : null;
      var maritalStatus = document.getElementById('stfMaritalStatus') ? document.getElementById('stfMaritalStatus').value : '';
      var highestEducation = document.getElementById('stfHighestEducation') ? document.getElementById('stfHighestEducation').value.trim() : '';
      var joinedAt = document.getElementById('stfJoinedAt') ? document.getElementById('stfJoinedAt').value : '';
      var phone = document.getElementById('stfPhone').value.trim();
      var email = document.getElementById('stfEmail') ? document.getElementById('stfEmail').value.trim() : '';
      var role = document.getElementById('stfRole') ? document.getElementById('stfRole').value : 'staff';
      var password = document.getElementById('stfPassword') ? document.getElementById('stfPassword').value.trim() : '';
      var branch = document.getElementById('stfBranch').value;
      var shift = document.getElementById('stfShift').value;
      var attendance = document.getElementById('stfAttendance').value;
      var leaveType = attendance === 'on_leave' ? document.getElementById('stfLeaveType').value : null;
      var baseSalary = document.getElementById('stfSalary') ? (parseInt(document.getElementById('stfSalary').value) || 0) : 0;
      var selectedDate = attendanceDateInput ? attendanceDateInput.value : null;

      var payload = { name: name, first_name: firstName, last_name: lastName, employee_id: employeeId, native_place: nativePlace, gender: gender, age: age, marital_status: maritalStatus, highest_education: highestEducation, joined_at: joinedAt || null, phone: phone, email: email, password: password, role: role, branch: branch, shift: shift, attendance: attendance, leave_type: leaveType, base_salary: baseSalary, date: selectedDate };

      try {
        var res;
        if (editingId) {
          res = await fetch('/api/staff/' + editingId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        if (res.ok) {
          var saved = await res.json();
          if (pendingProfilePhotoFile) {
            try {
              await uploadStaffPhoto(saved.id, pendingProfilePhotoFile);
            } catch (photoErr) {
              console.error('Profile photo upload failed:', photoErr);
              window.SW.showToast('Staff saved, but photo upload failed');
            }
            pendingProfilePhotoFile = null;
          }
          for (var docType in pendingDocFiles) {
            if (pendingDocFiles[docType]) {
              try {
                await uploadStaffDocument(saved.id, docType, pendingDocFiles[docType]);
              } catch (docErr) {
                console.error('Document upload failed:', docErr);
                window.SW.showToast('Staff saved, but a document upload failed');
              }
              pendingDocFiles[docType] = null;
            }
          }
          window.SW.closeModal('staffModal');
          window.SW.showToast(editingId ? 'Updated ' + name : 'Staff added: ' + name);
          await loadStaff();
        } else {
          var err = await res.json();
          alert('Error: ' + (err.message || 'Could not save staff.'));
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.originalHtml || submitBtn.innerHTML;
        }
      }
    });
  }

  async function removeStaff(id) {
    var s = findStaff(id);
    if (!s) return;
    if (!confirm('Are you sure you want to remove "' + s.name + '"?')) return;

    try {
      var res = await fetch('/api/staff/' + id, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        if (editingId === id) window.SW.closeModal('staffModal');
        window.SW.showToast('Staff removed: ' + s.name);
        await loadStaff();
      } else {
        alert('Could not remove staff member.');
      }
    } catch (err) {
      console.error(err);
      alert('A connection error occurred.');
    }
  }

  async function loadStaff() {
    try {
      var selectedDate = attendanceDateInput ? attendanceDateInput.value : new Date().toLocaleDateString('en-CA');
      currentAttendanceDate = selectedDate;
      var res = await fetch('/api/staff?date=' + selectedDate);
      if (res.ok) {
        STAFF = await res.json();
        STAFF.forEach(function (st) {
          st.jobsToday = Number(st.jobs_today || 0);
          st.commission = Number(st.commission || 0);
          st.performance = Number(st.performance || 0);
        });
        renderTable();
        renderEmployeeGrid();
        updateStaffKpis();
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  }

  function updateStaffKpis() {
    var totalEl = document.getElementById('kpiTotalStaff');
    var presentEl = document.getElementById('kpiPresentToday');
    var absentEl = document.getElementById('kpiAbsentToday');
    var lateEl = document.getElementById('kpiLateToday');
    if (!totalEl) return;

    totalEl.textContent = STAFF.length;
    presentEl.textContent = STAFF.filter(function (s) { return s.attendance === 'present'; }).length;
    absentEl.textContent = STAFF.filter(function (s) { return s.attendance === 'absent'; }).length;
    lateEl.textContent = STAFF.filter(function (s) { return s.attendance === 'late'; }).length;
  }
  // Daily Attendance Modal Logic
  var dailyAttendanceBtn = document.getElementById('dailyAttendanceBtn');
  var attendanceModal = document.getElementById('attendanceModal');
  var attendanceForm = document.getElementById('attendanceForm');
  var attendanceStaffList = document.getElementById('attendanceStaffList');

  if (dailyAttendanceBtn) {
    dailyAttendanceBtn.addEventListener('click', function () {
      if (!STAFF.length) {
        alert('No staff members available.');
        return;
      }

      var selectedDate = attendanceDateInput ? attendanceDateInput.value : new Date().toLocaleDateString('en-CA');
      var modalTitleEl = document.querySelector('#attendanceModal .modal-title');
      if (modalTitleEl) {
        modalTitleEl.textContent = 'Daily Attendance (' + selectedDate + ')';
      }

      attendanceStaffList.innerHTML = '';
      STAFF.forEach(function (s) {
        var row = document.createElement('div');
        row.className = 'attendance-row';
        row.innerHTML =
          '<div class="attendance-staff-info">' +
            '<div class="attendance-staff-name">' + escapeHtml(s.name) + '</div>' +
            '<div class="attendance-staff-meta">' + escapeHtml(s.branch) + ' · ' + escapeHtml(s.shift) + '</div>' +
          '</div>' +
          '<div class="attendance-segmented" data-staff-id="' + s.id + '">' +
            '<label class="present-label ' + (s.attendance === 'present' ? 'active-present' : '') + '">' +
              '<input type="radio" name="att_' + s.id + '" value="present" ' + (s.attendance === 'present' ? 'checked' : '') + '> Present' +
            '</label>' +
            '<label class="late-label ' + (s.attendance === 'late' ? 'active-late' : '') + '">' +
              '<input type="radio" name="att_' + s.id + '" value="late" ' + (s.attendance === 'late' ? 'checked' : '') + '> Late' +
            '</label>' +
            '<label class="absent-label ' + (s.attendance === 'absent' ? 'active-absent' : '') + '">' +
              '<input type="radio" name="att_' + s.id + '" value="absent" ' + (s.attendance === 'absent' ? 'checked' : '') + '> Absent' +
            '</label>' +
          '</div>';

        var labels = row.querySelectorAll('.attendance-segmented label');
        labels.forEach(function (label) {
          var radio = label.querySelector('input');
          radio.addEventListener('change', function () {
            labels.forEach(function (lbl) {
              lbl.classList.remove('active-present', 'active-late', 'active-absent', 'active-leave');
            });
            if (this.checked) {
              if (this.value === 'present') label.classList.add('active-present');
              else if (this.value === 'late') label.classList.add('active-late');
              else if (this.value === 'absent') label.classList.add('active-absent');
              else label.classList.add('active-leave');
            }
          });
        });

        attendanceStaffList.appendChild(row);
      });

      window.SW.openModal('attendanceModal');
    });
  }

  if (attendanceForm) {
    attendanceForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = attendanceForm.querySelector('button[type="submit"]');
      if (btn && btn.disabled) return;
      if (btn) {
        btn.disabled = true;
        btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = 'Saving...';
      }

      var attendanceData = [];
      var controls = attendanceStaffList.querySelectorAll('.attendance-segmented');
      controls.forEach(function (ctrl) {
        var id = parseInt(ctrl.getAttribute('data-staff-id'));
        var checkedRadio = ctrl.querySelector('input[type="radio"]:checked');
        var timeIn = document.querySelector('.time-in-input[data-staff-id="' + id + '"]');
        var timeOut = document.querySelector('.time-out-input[data-staff-id="' + id + '"]');
        if (checkedRadio) {
          attendanceData.push({ 
            id: id, 
            status: checkedRadio.value,
            check_in_time: timeIn ? timeIn.value : null,
            check_out_time: timeOut ? timeOut.value : null
          });
        }
      });

      var selectedDate = attendanceDateInput ? attendanceDateInput.value : new Date().toLocaleDateString('en-CA');
      try {
        var res = await fetch('/api/staff/attendance/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ date: selectedDate, attendance: attendanceData })
        });

        if (res.ok) {
          window.SW.closeModal('attendanceModal');
          window.SW.showToast('Daily attendance saved successfully!');
          await loadStaff();
        } else {
          var err = await res.json();
          alert('Error: ' + (err.message || 'Could not save daily attendance.'));
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred.');
      } finally {
        var btn = attendanceForm.querySelector('button[type="submit"]');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
        }
      }
    });
  }

  var currentCalStaffId = null;
  var currentCalDate = new Date();

  window.openCalendar = async function(id) {
    var staff = findStaff(id);
    if (!staff) return;
    currentCalStaffId = id;
    currentCalDate = new Date();
    document.getElementById('calendarModalTitle').textContent = staff.name + ' - Attendance';
    window.SW.openModal('calendarModal');
    renderCalendar();
  };

  async function renderCalendar() {
    var grid = document.getElementById('calendarDays');
    var display = document.getElementById('calendarMonthDisplay');
    var loading = document.getElementById('calendarLoading');
    if (!grid || !display || !loading) return;

    var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var year = currentCalDate.getFullYear();
    var month = currentCalDate.getMonth();
    var monthStr = year + '-' + String(month + 1).padStart(2, '0');
    display.textContent = monthNames[month] + ' ' + year;

    grid.style.display = 'none';
    loading.style.display = 'block';

    try {
      var res = await fetch('/api/staff/' + currentCalStaffId + '/attendance?month=' + monthStr);
      var records = [];
      if (res.ok) records = await res.json();
      
      var recordMap = {};
      records.forEach(function(r) { recordMap[r.date] = r; });

      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();

      var html = '';
      for (var i = 0; i < firstDay; i++) {
        html += '<div></div>';
      }

      for (var d = 1; d <= daysInMonth; d++) {
        var dStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var r = recordMap[dStr];
        var bg = '#f8fafc';
        var color = '#64748b';
        var label = '-';
        var timeStr = '';
        if (r) {
          if (r.status === 'present') { bg = '#ecfdf5'; color = '#10b981'; label = 'P'; }
          else if (r.status === 'absent') { bg = '#fef2f2'; color = '#ef4444'; label = 'A'; }
          else if (r.status === 'late') { bg = '#fffbeb'; color = '#f59e0b'; label = 'L'; }
          else if (r.status === 'half-day') { bg = '#fff7ed'; color = '#ea580c'; label = 'HD'; }
          else if (r.status === 'on_leave') { bg = '#f3e8ff'; color = '#a855f7'; label = 'LV'; }
          
          if (r.check_in_time) {
            timeStr = '<div style="font-size:0.6rem; margin-top:2px; color:#64748b;">' + r.check_in_time.substring(0,5) + '</div>';
          }
        }
        
        var isToday = dStr === new Date().toLocaleDateString('en-CA');
        var todayStyle = isToday ? 'border:1px solid #1D4ED8;' : 'border:1px solid transparent;';
        
        html += '<div style="background:'+bg+'; color:'+color+'; padding:8px 4px; border-radius:6px; ' + todayStyle + '"><div style="font-size:0.7rem; font-weight:600; margin-bottom:4px; color:#0f172a;">' + d + '</div><div style="font-weight:bold; font-size:0.9rem;">' + label + '</div>' + timeStr + '</div>';
      }
      
      grid.innerHTML = html;
      loading.style.display = 'none';
      grid.style.display = 'grid';

    } catch (e) {
      console.error(e);
      loading.textContent = 'Error loading attendance.';
    }
  }

  var prevCalBtn = document.getElementById('prevMonthBtn');
  var nextCalBtn = document.getElementById('nextMonthBtn');
  if (prevCalBtn) prevCalBtn.addEventListener('click', function() { currentCalDate.setMonth(currentCalDate.getMonth() - 1); renderCalendar(); });
  if (nextCalBtn) nextCalBtn.addEventListener('click', function() { currentCalDate.setMonth(currentCalDate.getMonth() + 1); renderCalendar(); });


  loadStaff();
})();
