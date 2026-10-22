// Page-specific behavior for inventory.html
(function () {
  var tableBody = document.getElementById('invTableBody');
  var emptyState = document.getElementById('invEmptyState');
  var searchInput = document.getElementById('invSearchInput');
  var chips = document.querySelectorAll('.toolbar .chip');
  var prevBtn = document.getElementById('invPrevBtn');
  var nextBtn = document.getElementById('invNextBtn');
  var pageInfo = document.getElementById('invPageInfo');
  var countSub = document.getElementById('invCountSub');
  var addBtn = document.getElementById('addInventoryBtn');
  var form = document.getElementById('inventoryForm');
  var modalTitle = document.getElementById('inventoryModalTitle');
  var submitBtn = document.getElementById('inventorySubmitBtn');
  var deleteBtn = document.getElementById('deleteInventoryBtn');
  if (!tableBody) return;

  var PAGE_SIZE = 10;
  var activeFilter = 'all';
  var currentPage = 1;
  var nextId = 19;
  var editingId = null;

  var INVENTORY = [];

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function findItem(id) {
    return INVENTORY.filter(function (i) { return i.id === id; })[0];
  }

  function isLow(item) {
    return item.stock <= item.reorder;
  }

  function statusTag(item) {
    return isLow(item)
      ? '<span class="status-pill" style="background:var(--danger-bg);color:var(--danger-text);">Low stock</span>'
      : '<span class="status-pill" style="background:var(--success-bg);color:var(--success-text);">In stock</span>';
  }

  function updateCountSub() {
    if (!countSub) return;
    var lowCount = INVENTORY.filter(isLow).length;
    countSub.textContent = lowCount + (lowCount === 1 ? ' item below reorder level' : ' items below reorder level');
  }

  function matchesFilter(item) {
    if (activeFilter === 'low') return isLow(item);
    if (activeFilter === 'ok') return !isLow(item);
    return true;
  }

  function matchesSearch(item, query) {
    if (!query) return true;
    return (item.name + ' ' + item.supplier).toLowerCase().indexOf(query) !== -1;
  }

  function getFiltered() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    return INVENTORY.filter(function (i) { return matchesFilter(i) && matchesSearch(i, query); });
  }

  function renderTable() {
    var filtered = getFiltered();
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * PAGE_SIZE;
    var pageItems = filtered.slice(start, start + PAGE_SIZE);

    tableBody.innerHTML = '';
    pageItems.forEach(function (item, idx) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="col-sl">' + (start + idx + 1) + '</td>' +
        '<td class="cell-primary"><i class="ti ' + item.icon + ' inline-icon"></i>' + escapeHtml(item.name) + '</td>' +
        '<td class="mono">' + item.stock + '</td>' +
        '<td class="mono">' + item.reorder + '</td>' +
        '<td>' + escapeHtml(item.supplier) + '</td>' +
        '<td>' + statusTag(item) + '</td>' +
        '<td><button type="button" class="row-edit-btn" title="Edit item" aria-label="Edit item">' +
          '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
        '</button></td>';
      tr.querySelector('.row-edit-btn').addEventListener('click', function () { openEdit(item.id); });
      tableBody.appendChild(tr);
    });

    if (emptyState) emptyState.style.display = filtered.length ? 'none' : 'block';
    if (pageInfo) {
      if (filtered.length === 0) {
        pageInfo.textContent = 'No items';
      } else {
        var rangeStart = start + 1;
        var rangeEnd = Math.min(start + PAGE_SIZE, filtered.length);
        pageInfo.textContent = 'Showing ' + rangeStart + '–' + rangeEnd + ' of ' + filtered.length + ' items';
      }
    }
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (window.SW && SW.renderPager) SW.renderPager(prevBtn, nextBtn, currentPage, totalPages, function (p) { currentPage = p; renderTable(); });
    updateCountSub();
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      currentPage = 1;
      renderTable();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      currentPage = 1;
      renderTable();
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { currentPage--; renderTable(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { currentPage++; renderTable(); });

  function resetForm() {
    form.reset();
    document.getElementById('invIcon').value = 'ti-droplet';
    if (document.getElementById('invUnitCost')) {
      document.getElementById('invUnitCost').value = 0;
    }
  }

  function openCreate() {
    editingId = null;
    modalTitle.textContent = 'New purchase order';
    submitBtn.innerHTML = '<i class="ti ti-plus"></i>Add item';
    deleteBtn.style.display = 'none';
    resetForm();
    window.SW.openModal('inventoryModal');
  }

  function openEdit(id) {
    var item = findItem(id);
    if (!item) return;
    editingId = id;
    modalTitle.textContent = 'Edit item';
    submitBtn.innerHTML = '<i class="ti ti-check"></i>Save changes';
    deleteBtn.style.display = 'inline-flex';

    document.getElementById('invName').value = item.name;
    document.getElementById('invStock').value = item.stock;
    document.getElementById('invReorder').value = item.reorder;
    document.getElementById('invSupplier').value = item.supplier;
    document.getElementById('invIcon').value = item.icon;
    if (document.getElementById('invUnitCost')) {
      document.getElementById('invUnitCost').value = item.unit_cost || 0;
    }

    window.SW.openModal('inventoryModal');
  }

  if (addBtn) addBtn.addEventListener('click', openCreate);

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('invName').value.trim();
      var stock = Number(document.getElementById('invStock').value) || 0;
      var reorder = Number(document.getElementById('invReorder').value) || 0;
      var supplier = document.getElementById('invSupplier').value.trim() || 'Unassigned';
      var icon = document.getElementById('invIcon').value;
      var unitCost = document.getElementById('invUnitCost') ? (parseInt(document.getElementById('invUnitCost').value) || 0) : 0;

      try {
        var res;
        if (editingId) {
          res = await fetch('/api/inventory/' + editingId, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ name, icon, stock, reorder, supplier, unit_cost: unitCost })
          });
        } else {
          res = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ name, icon, stock, reorder, supplier, unit_cost: unitCost })
          });
        }

        if (res.ok) {
          window.SW.closeModal('inventoryModal');
          window.SW.showToast(editingId ? 'Updated ' + name : 'Item added: ' + name);
          await loadInventory();
        } else {
          var err = await res.json().catch(function () { return {}; });
          console.error('Inventory save failed:', err);
          alert('Could not save the inventory item right now. Please check the form and try again.');
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred. Please try again.');
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async function () {
      if (!editingId) return;
      var item = findItem(editingId);
      if (!item) return;

      try {
        var res = await fetch('/api/inventory/' + editingId, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (res.ok) {
          window.SW.closeModal('inventoryModal');
          window.SW.showToast('Item removed: ' + item.name);
          await loadInventory();
        } else {
          alert('Could not remove the inventory item right now.');
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred. Please try again.');
      }
    });
  }

  async function loadInventory() {
    try {
      var res = await fetch('/api/inventory');
      if (res.ok) {
        INVENTORY = await res.json();
        renderTable();
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }
  loadInventory();
})();
