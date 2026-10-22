// Page-specific behavior for branches.html
(function () {
  var grid = document.getElementById('branchesGrid');
  var emptyState = document.getElementById('branchesEmptyState');
  var countSub = document.getElementById('branchCountSub');
  var addBtn = document.getElementById('addBranchBtn');
  var form = document.getElementById('branchForm');
  var modalTitle = document.getElementById('branchModalTitle');
  var submitBtn = document.getElementById('branchSubmitBtn');
  var deleteBtn = document.getElementById('deleteBranchBtn');
  if (!grid) return;

  var BRANCHES = [];
  var editingId = null;

  var TRASH_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>';
  var PENCIL_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function findBranch(id) {
    return BRANCHES.filter(function (b) { return b.id === id; })[0];
  }

  function cardHtml(b) {
    var isActive = b.active !== false;
    var cityState = [b.city, b.state || 'Kerala'].filter(Boolean).join(', ');
    return (
      '<div class="branch-card" data-id="' + b.id + '">' +
        '<div class="branch-card-top">' +
          '<div class="branch-icon"><i class="ti ti-building-store"></i></div>' +
          '<span class="branch-status ' + (isActive ? 'active' : 'inactive') + '">' + (isActive ? 'Active' : 'Inactive') + '</span>' +
        '</div>' +
        '<div class="branch-name">' + escapeHtml(b.name) + '</div>' +
        '<div class="branch-meta">' +
          '<span><i class="ti ti-map-pin"></i>' + escapeHtml(b.location || cityState || '—') + '</span>' +
          '<span><i class="ti ti-id-badge-2"></i>' + escapeHtml(b.code || '—') + '</span>' +
        '</div>' +
        '<div class="branch-detail-row"><span>Phone</span><span>' + escapeHtml(b.phone || '—') + '</span></div>' +
        '<div class="branch-detail-row"><span>GST</span><span>' + escapeHtml(b.gst_number || 'Not set') + '</span></div>' +
        '<div class="branch-actions">' +
          '<button type="button" class="btn branch-edit-btn" data-action="edit" data-id="' + b.id + '">' + PENCIL_SVG + 'Edit</button>' +
          '<button type="button" class="btn branch-delete-btn" data-action="delete" data-id="' + b.id + '">' + TRASH_SVG + 'Delete</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderGrid() {
    grid.innerHTML = BRANCHES.map(cardHtml).join('');
    if (emptyState) emptyState.style.display = BRANCHES.length ? 'none' : 'block';
    if (countSub) countSub.textContent = BRANCHES.length + ' branches configured';
  }

  grid.addEventListener('click', function (e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;
    var id = Number(target.getAttribute('data-id'));
    if (target.getAttribute('data-action') === 'edit') openEdit(id);
    if (target.getAttribute('data-action') === 'delete') removeBranch(id);
  });

  function resetForm() {
    form.reset();
    document.getElementById('brState').value = 'Kerala';
  }

  function openCreate() {
    editingId = null;
    modalTitle.textContent = 'Add branch';
    submitBtn.innerHTML = '<i class="ti ti-plus"></i>Add branch';
    deleteBtn.style.display = 'none';
    resetForm();
    window.SW.openModal('branchModal');
  }

  function openEdit(id) {
    var b = findBranch(id);
    if (!b) return;
    editingId = id;
    modalTitle.textContent = 'Edit branch';
    submitBtn.innerHTML = '<i class="ti ti-check"></i>Save changes';
    deleteBtn.style.display = 'inline-flex';

    document.getElementById('brName').value = b.name || '';
    document.getElementById('brCode').value = b.code || '';
    document.getElementById('brCity').value = b.city || '';
    document.getElementById('brLocation').value = b.location || '';
    document.getElementById('brPhone').value = b.phone || '';
    document.getElementById('brGst').value = b.gst_number || '';
    document.getElementById('brState').value = b.state || 'Kerala';

    window.SW.openModal('branchModal');
  }

  async function removeBranch(id) {
    var b = findBranch(id);
    if (!b) return;
    if (!confirm('Are you sure you want to delete branch "' + b.name + '"?')) return;

    try {
      var res = await fetch('/api/branches/' + id, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        window.SW.showToast('Branch removed: ' + b.name);
        if (editingId === id) window.SW.closeModal('branchModal');
        await loadBranches();
        if (window.SW && typeof window.SW.loadGlobal === 'function') {
          await window.SW.loadGlobal();
        }
      } else {
        alert('Could not delete branch.');
      }
    } catch (err) {
      console.error(err);
      alert('A connection error occurred.');
    }
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function () {
      if (editingId) removeBranch(editingId);
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', openCreate);
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('brName').value.trim();
      var location = document.getElementById('brLocation').value.trim();
      var code = document.getElementById('brCode').value.trim();
      var city = document.getElementById('brCity').value.trim();
      var phone = document.getElementById('brPhone').value.trim();
      var gstNumber = document.getElementById('brGst').value.trim();
      var state = document.getElementById('brState').value.trim();

      var payload = {
        name: name,
        location: location,
        code: code,
        city: city,
        phone: phone,
        gst_number: gstNumber,
        state: state
      };

      try {
        var res;
        if (editingId) {
          res = await fetch('/api/branches/' + editingId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch('/api/branches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        if (res.ok) {
          window.SW.closeModal('branchModal');
          window.SW.showToast(editingId ? 'Branch updated: ' + name : 'Branch added: ' + name);
          form.reset();
          await loadBranches();
          if (window.SW && typeof window.SW.loadGlobal === 'function') {
            await window.SW.loadGlobal();
          }
        } else {
          var err = await res.json();
          alert('Error: ' + (err.message || 'Could not save branch.'));
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred.');
      }
    });
  }

  async function loadBranches() {
    try {
      var res = await fetch('/api/branches');
      if (res.ok) {
        BRANCHES = await res.json();
        renderGrid();
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  }

  loadBranches();
})();
