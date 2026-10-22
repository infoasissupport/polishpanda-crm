// Controller for Manager Accounts view
(function () {
  var addBtn = document.getElementById('addManagerBtn');
  var modal = document.getElementById('managerModal');
  var form = document.getElementById('managerForm');
  var tableBody = document.getElementById('managersTableBody');
  var emptyState = document.getElementById('managersEmptyState');
  var searchInput = document.getElementById('managerSearchInput');
  var modalTitle = document.getElementById('managerModalTitle');
  var pwdNotice = document.getElementById('pwdNotice');
  var branchSelect = document.getElementById('mBranch');
  var deleteBtn = document.getElementById('deleteManagerBtn');
  var countSub = document.getElementById('managersCountSub');

  if (!tableBody) return;

  var MANAGERS = [];
  var editingId = null;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderTable() {
    var query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    var filtered = MANAGERS.filter(function (m) {
      if (!query) return true;
      var nameMatch = (m.name || '').toLowerCase().includes(query);
      var emailMatch = (m.email || '').toLowerCase().includes(query);
      var branchMatch = m.assigned_branch && m.assigned_branch.name.toLowerCase().includes(query);
      return nameMatch || emailMatch || branchMatch;
    });

    if (countSub) {
      countSub.textContent = MANAGERS.length + ' manager account' + (MANAGERS.length === 1 ? '' : 's');
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    var html = '';
    filtered.forEach(function (m, idx) {
      var branchLabel = m.assigned_branch ? escapeHtml(m.assigned_branch.name) + ' (' + escapeHtml(m.assigned_branch.code) + ')' : '<span style="color:var(--text-3);">All Branches</span>';
      var createdDate = m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

      html += '<tr data-id="' + m.id + '">' +
        '<td class="col-sl">' + (idx + 1) + '</td>' +
        '<td>' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div style="width:34px;height:34px;border-radius:50%;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">' +
              escapeHtml((m.name || 'M')[0].toUpperCase()) +
            '</div>' +
            '<div style="font-weight:600;font-size:13.5px;">' + escapeHtml(m.name) + '</div>' +
          '</div>' +
        '</td>' +
        '<td><span class="mono" style="font-size:12.5px;">' + escapeHtml(m.email) + '</span></td>' +
        '<td>' + branchLabel + '</td>' +
        '<td><span class="tag" style="background:var(--surface-2);color:var(--text-2);font-weight:600;"><i class="ti ti-shield" style="font-size:11px;margin-right:2px;"></i>Branch Manager</span></td>' +
        '<td>' + escapeHtml(createdDate) + '</td>' +
        '<td style="text-align:right;">' +
          '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
            '<button type="button" class="btn btn-secondary btn-sm edit-mgr-btn" data-id="' + m.id + '" style="padding:4px 10px;font-size:12px;"><i class="ti ti-edit"></i> Edit</button>' +
            '<button type="button" class="btn btn-danger btn-sm del-mgr-btn" data-id="' + m.id + '" style="padding:4px 8px;font-size:12px;background:var(--danger-bg);color:var(--danger-text);border:none;"><i class="ti ti-trash"></i></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    tableBody.innerHTML = html;

    tableBody.querySelectorAll('.edit-mgr-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = Number(btn.getAttribute('data-id'));
        openEditModal(id);
      });
    });

    tableBody.querySelectorAll('.del-mgr-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = Number(btn.getAttribute('data-id'));
        confirmDeleteManager(id);
      });
    });
  }

  async function loadBranchesDropdown() {
    if (!branchSelect) return;
    try {
      var res = await fetch('/api/global');
      if (res.ok) {
        var data = await res.json();
        branchSelect.innerHTML = '<option value="">All Branches</option>';
        (data.branches || []).forEach(function (b) {
          var opt = document.createElement('option');
          opt.value = b.id;
          opt.textContent = b.name + ' (' + b.code + ')';
          branchSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error('Failed to load branches:', e);
    }
  }

  async function loadManagers() {
    try {
      var res = await fetch('/api/managers');
      if (res.ok) {
        MANAGERS = await res.json();
        renderTable();
      }
    } catch (e) {
      console.error('Failed to load managers:', e);
    }
  }

  function openAddModal() {
    editingId = null;
    if (form) form.reset();
    if (modalTitle) modalTitle.textContent = 'Add Manager Account';
    if (pwdNotice) pwdNotice.textContent = '(min 6 characters) *';
    document.getElementById('mPassword').required = true;
    if (deleteBtn) deleteBtn.style.display = 'none';
    window.SW.openModal('managerModal');
  }

  function openEditModal(id) {
    var mgr = MANAGERS.find(function (m) { return m.id === id; });
    if (!mgr) return;
    editingId = id;

    document.getElementById('mName').value = mgr.name || '';
    document.getElementById('mEmail').value = mgr.email || '';
    document.getElementById('mPassword').value = '';
    document.getElementById('mPassword').required = false;
    if (branchSelect) branchSelect.value = mgr.assigned_branch_id || '';

    if (modalTitle) modalTitle.textContent = 'Edit Manager Account';
    if (pwdNotice) pwdNotice.textContent = '(leave blank to keep unchanged)';
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';

    window.SW.openModal('managerModal');
  }

  async function confirmDeleteManager(id) {
    var mgr = MANAGERS.find(function (m) { return m.id === id; });
    if (!mgr) return;
    if (!confirm('Are you sure you want to delete the manager account for "' + mgr.name + '"?')) return;

    try {
      var res = await fetch('/api/managers/' + id, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        window.SW.closeModal('managerModal');
        window.SW.showToast('Manager account removed');
        await loadManagers();
      } else {
        alert('Could not delete manager account.');
      }
    } catch (err) {
      console.error(err);
      alert('A connection error occurred.');
    }
  }

  if (addBtn) {
    addBtn.addEventListener('click', function () {
      openAddModal();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function () {
      if (editingId) confirmDeleteManager(editingId);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      renderTable();
    });
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('mName').value.trim();
      var email = document.getElementById('mEmail').value.trim();
      var password = document.getElementById('mPassword').value;
      var branchId = document.getElementById('mBranch').value;

      var submitBtn = document.getElementById('saveManagerBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
      }

      var payload = {
        name: name,
        email: email,
        assigned_branch_id: branchId ? Number(branchId) : null
      };
      if (password) {
        payload.password = password;
      }

      var url = editingId ? '/api/managers/' + editingId : '/api/managers';
      var method = editingId ? 'PUT' : 'POST';

      try {
        var res = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          window.SW.closeModal('managerModal');
          window.SW.showToast(editingId ? 'Manager account updated' : 'Manager account created successfully');
          form.reset();
          await loadManagers();
        } else {
          var err = await res.json();
          alert('Error: ' + (err.message || 'Could not save manager account.'));
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
        }
      }
    });
  }

  loadBranchesDropdown();
  loadManagers();
})();
