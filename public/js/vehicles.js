// Page-specific behavior for vehicles.html
(function () {
  var tableBody = document.getElementById('vehTableBody');
  var emptyState = document.getElementById('vehEmptyState');
  var searchInput = document.getElementById('vehSearchInput');
  var chips = document.querySelectorAll('.toolbar .chip');
  var prevBtn = document.getElementById('vehPrevBtn');
  var nextBtn = document.getElementById('vehNextBtn');
  var pageInfo = document.getElementById('vehPageInfo');
  var exportBtn = document.getElementById('vehExportBtn');
  var countSub = document.getElementById('vehCountSub');
  if (!tableBody) return;

  var PAGE_SIZE = 10;
  var activeFilter = 'all';
  var currentPage = 1;

  var TYPE_LABEL = { 
    sedan: 'Sedan', 
    suv: 'SUV', 
    hatchback: 'Hatchback',
    luxury: 'Luxury',
    'two-wheeler': '2-Wheeler'
  };

  function getVehicleTypeLabel(type) {
    if (!type) return '—';
    var lower = String(type).toLowerCase();
    return TYPE_LABEL[lower] || (lower.charAt(0).toUpperCase() + lower.slice(1));
  }

  var VEHICLES = [];

  if (countSub) countSub.textContent = VEHICLES.length + ' vehicles on file';

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function matchesFilter(vehicle) {
    return activeFilter === 'all' || vehicle.type === activeFilter;
  }

  function matchesSearch(vehicle, query) {
    if (!query) return true;
    var ownerName = vehicle.customer ? vehicle.customer.name : '';
    var haystack = (vehicle.number + ' ' + vehicle.brand + ' ' + ownerName).toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function getFiltered() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    return VEHICLES.filter(function (v) { return matchesFilter(v) && matchesSearch(v, query); });
  }

  function renderTable() {
    var filtered = getFiltered();
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * PAGE_SIZE;
    var pageItems = filtered.slice(start, start + PAGE_SIZE);

    tableBody.innerHTML = '';
    pageItems.forEach(function (vehicle, idx) {
      var tr = document.createElement('tr');
      var nextCell = vehicle.next === 'Overdue'
        ? '<span style="color:var(--danger-text);">Overdue</span>'
        : escapeHtml(vehicle.next);
      tr.innerHTML =
        '<td class="col-sl">' + (start + idx + 1) + '</td>' +
        '<td class="cell-primary mono">' + escapeHtml(vehicle.number) + '</td>' +
        '<td>' + escapeHtml(vehicle.brand) + '</td>' +
        '<td>' + (vehicle.customer ? escapeHtml(vehicle.customer.name) : '—') + '</td>' +
        '<td>' + escapeHtml(vehicle.colour) + '</td>' +
        '<td>' + getVehicleTypeLabel(vehicle.type) + '</td>' +
        '<td>' + escapeHtml(vehicle.fuel) + '</td>' +
        '<td>' + escapeHtml(vehicle.lastWash) + '</td>' +
        '<td>' + nextCell + '</td>' +
        '<td>' +
          '<div style="display:flex;gap:4px;">' +
            '<button type="button" class="icon-btn edit-btn" style="color:var(--text-2);padding:4px;" title="Edit vehicle"><i class="ti ti-edit"></i></button>' +
            '<button type="button" class="icon-btn delete-btn" style="color:var(--danger-text);padding:4px;" title="Delete vehicle"><i class="ti ti-trash"></i></button>' +
          '</div>' +
        '</td>';

      tr.querySelector('.edit-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        openEdit(vehicle);
      });

      tr.querySelector('.delete-btn').addEventListener('click', async function (e) {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete vehicle "' + vehicle.number + '"?')) return;

        try {
          var res = await fetch('/api/vehicles/' + vehicle.id, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json'
            }
          });

          if (res.ok) {
            if (window.SW) window.SW.showToast('Vehicle deleted successfully');
            await loadVehicles();
          } else {
            alert('Could not delete vehicle.');
          }
        } catch (err) {
          console.error(err);
          alert('A connection error occurred.');
        }
      });

      tableBody.appendChild(tr);
    });

    if (emptyState) emptyState.style.display = filtered.length ? 'none' : 'block';

    if (pageInfo) {
      if (filtered.length === 0) {
        pageInfo.textContent = 'No vehicles';
      } else {
        var rangeStart = start + 1;
        var rangeEnd = Math.min(start + PAGE_SIZE, filtered.length);
        pageInfo.textContent = 'Showing ' + rangeStart + '–' + rangeEnd + ' of ' + filtered.length + ' vehicles';
      }
    }
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (window.SW && SW.renderPager) SW.renderPager(prevBtn, nextBtn, currentPage, totalPages, function (p) { currentPage = p; renderTable(); });
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

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var filtered = getFiltered();
      var header = ['Number', 'Brand / model', 'Owner', 'Colour', 'Type', 'Fuel', 'Last wash', 'Next recommended'];
      var rows = filtered.map(function (v) {
        return [v.number, v.brand, v.customer ? v.customer.name : '—', v.colour, TYPE_LABEL[v.type], v.fuel, v.lastWash, v.next];
      });
      var csv = [header].concat(rows).map(function (row) {
        return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
      }).join('\r\n');

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'vehicles-export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.SW) window.SW.showToast('Exported ' + filtered.length + ' vehicles');
    });
  }

  var editingVehicleId = null;

  function openEdit(vehicle) {
    editingVehicleId = vehicle.id;
    document.getElementById('evPlate').value = vehicle.number || '';
    document.getElementById('evBrand').value = vehicle.brand || '';
    document.getElementById('evColour').value = vehicle.colour || '';
    document.getElementById('evFuel').value = vehicle.fuel || 'Petrol';
    document.getElementById('evType').value = vehicle.type || 'sedan';
    window.SW.openModal('editVehicleModal');
  }

  var editForm = document.getElementById('editVehicleForm');
  if (editForm) {
    editForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!editingVehicleId) return;

      var brand = document.getElementById('evBrand').value.trim();
      var colour = document.getElementById('evColour').value.trim();
      var fuel = document.getElementById('evFuel').value;
      var type = document.getElementById('evType').value;

      try {
        var res = await fetch('/api/vehicles/' + editingVehicleId, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            brand: brand,
            colour: colour,
            fuel: fuel,
            type: type
          })
        });

        if (res.ok) {
          window.SW.showToast('Vehicle updated successfully');
          window.SW.closeModal('editVehicleModal');
          await loadVehicles();
        } else {
          var err = await res.json();
          alert('Error: ' + (err.message || 'Could not update vehicle.'));
        }
      } catch (err) {
        console.error(err);
        alert('A network error occurred.');
      }
    });
  }

  async function loadVehicles() {
    try {
      var res = await fetch('/api/vehicles');
      if (res.ok) {
        VEHICLES = await res.json();
        VEHICLES.forEach(function (v) {
          v.number = v.plate;
          v.lastWash = v.last_wash;
        });
        if (countSub) countSub.textContent = VEHICLES.length + ' vehicles on file';
        renderTable();
      }
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  }
  loadVehicles();
})();
