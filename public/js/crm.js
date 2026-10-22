// Page-specific behavior for the combined Customers + Vehicles page (crm.html)
(function () {
  var tableBody = document.getElementById('crmTableBody');
  var emptyState = document.getElementById('crmEmptyState');
  var searchInput = document.getElementById('crmSearchInput');
  var addBtn = document.getElementById('addCustomerBtn');
  var addForm = document.getElementById('addCustomerForm');
  var exportBtn = document.getElementById('crmExportBtn');
  var prevBtn = document.getElementById('crmPrevBtn');
  var nextBtn = document.getElementById('crmNextBtn');
  var pageInfo = document.getElementById('crmPageInfo');
  if (!tableBody) return;

  var PAGE_SIZE = 10;
  var currentPage = 1;
  var VEHICLES = [];

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

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function matchesSearch(vehicle, query) {
    if (!query) return true;
    var ownerName = vehicle.customer ? vehicle.customer.name : '';
    var ownerPhone = vehicle.customer ? vehicle.customer.phone : '';
    var haystack = [vehicle.plate, vehicle.brand, ownerName, ownerPhone].filter(Boolean).join(' ').toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function getFiltered() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    return VEHICLES.filter(function (v) { return matchesSearch(v, query); });
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
      var customerName = vehicle.customer ? vehicle.customer.name : '—';
      var customerPhone = vehicle.customer ? vehicle.customer.phone : '';

      tr.innerHTML =
        '<td class="col-sl">' + (start + idx + 1) + '</td>' +
        '<td class="cell-primary">' + escapeHtml(customerName) +
          (customerPhone ? '<div class="qsub">' + escapeHtml(customerPhone) + '</div>' : '') + '</td>' +
        '<td>' + escapeHtml(vehicle.brand) + '</td>' +
        '<td class="mono">' + escapeHtml(vehicle.plate) + '</td>' +
        '<td>' + escapeHtml(vehicle.brand) + '</td>' +
        '<td>' + getVehicleTypeLabel(vehicle.type) + '</td>' +
        '<td>' + (vehicle.services && vehicle.services.length ? escapeHtml(vehicle.services.join(', ')) : '—') + '</td>' +
        '<td>' + escapeHtml(vehicle.last_wash || '—') + (vehicle.loyalty_count > 0 ? '<br><span style="font-size:11.5px;color:#10B981;font-weight:600;">⭐ Washed ' + vehicle.loyalty_count + ' times</span>' : '') + '</td>' +
        '<td>' +
          '<div style="display:flex;gap:6px;">' +
            '<button type="button" class="row-edit-btn edit-btn" title="Edit vehicle" aria-label="Edit vehicle">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
            '</button>' +
            '<button type="button" class="row-delete-btn delete-btn" title="Delete vehicle" aria-label="Delete vehicle">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>' +
            '</button>' +
          '</div>' +
        '</td>';

      tr.querySelector('.edit-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        openEdit(vehicle);
      });

      tr.querySelector('.delete-btn').addEventListener('click', async function (e) {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete vehicle "' + vehicle.plate + '"?')) return;

        try {
          var res = await fetch('/api/vehicles/' + vehicle.id, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ _method: 'DELETE' })
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
        pageInfo.textContent = 'No customers or vehicles';
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
      var scopeSelect = document.getElementById('exportScope');
      var custSelect = document.getElementById('exportCustomerSelect');
      if (scopeSelect) scopeSelect.value = 'all';
      if (document.getElementById('exportCustomerField')) document.getElementById('exportCustomerField').style.display = 'none';
      
      // Populate customers dropdown with unique customers
      var uniqueCustomers = {};
      VEHICLES.forEach(function(v) {
        if (v.customer) uniqueCustomers[v.customer.id] = v.customer.name;
      });
      
      if (custSelect) {
        custSelect.innerHTML = '';
        for (var cid in uniqueCustomers) {
          var opt = document.createElement('option');
          opt.value = cid;
          opt.textContent = uniqueCustomers[cid];
          custSelect.appendChild(opt);
        }
      }
      
      window.SW.openModal('exportModal');
    });
  }
  
  var confirmExportBtn = document.getElementById('confirmExportBtn');
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener('click', function() {
      var scope = document.getElementById('exportScope').value;
      var selectedCustomerId = document.getElementById('exportCustomerSelect').value;
      
      var filtered = getFiltered();
      if (scope === 'single') {
        filtered = filtered.filter(function(v) {
          return v.customer && String(v.customer.id) === String(selectedCustomerId);
        });
      }
      
      if (filtered.length === 0) {
        alert('No records found to export for the selected criteria.');
        return;
      }
      
      var header = ['Customer', 'Phone', 'Vehicle Name', 'Vehicle Number', 'Brand / Model', 'Car Type', 'Services', 'Last Wash Detail'];
      var rows = filtered.map(function (v) {
        return [
          v.customer ? v.customer.name : '—',
          v.customer ? v.customer.phone : '—',
          v.brand, v.plate, v.brand, getVehicleTypeLabel(v.type),
          v.services && v.services.length ? v.services.join(', ') : '—',
          v.last_wash || '—'
        ];
      });
      var csv = [header].concat(rows).map(function (row) {
        return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
      }).join('\r\n');

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = scope === 'single' ? ('customer-' + selectedCustomerId + '-export.csv') : 'customers-export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.SW) {
        window.SW.closeModal('exportModal');
        window.SW.showToast('Exported ' + filtered.length + ' records');
      }
    });
  }

  var editingVehicleId = null;
  var editingCustomerId = null;

  function openEdit(vehicle) {
    editingVehicleId = vehicle.id;
    editingCustomerId = vehicle.customer ? vehicle.customer.id : null;
    document.getElementById('evCustomerName').value = vehicle.customer ? (vehicle.customer.name || '') : '';
    document.getElementById('evCustomerPhone').value = vehicle.customer ? (vehicle.customer.phone || '') : '';
    document.getElementById('evPlate').value = vehicle.plate || '';
    document.getElementById('evBrand').value = vehicle.brand || '';
    document.getElementById('evType').value = vehicle.type || 'sedan';
    document.getElementById('evLastWash').value = vehicle.last_wash || '';
    window.SW.openModal('editVehicleModal');
  }

  var editForm = document.getElementById('editVehicleForm');
  if (editForm) {
    editForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!editingVehicleId) return;

      var customerName = document.getElementById('evCustomerName').value.trim();
      var customerPhone = document.getElementById('evCustomerPhone').value.trim();
      var brand = document.getElementById('evBrand').value.trim();
      var type = document.getElementById('evType').value;
      var lastWash = document.getElementById('evLastWash').value.trim();

      try {
        var res = await fetch('/api/vehicles/' + editingVehicleId, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            brand: brand,
            type: type,
            last_wash: lastWash
          })
        });

        if (res.ok) {
          var customerFailed = false;
          if (editingCustomerId) {
            var custRes = await fetch('/api/customers/' + editingCustomerId, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ name: customerName, phone: customerPhone })
            });
            customerFailed = !custRes.ok;
          }
          window.SW.showToast(customerFailed ? 'Vehicle saved, but customer update failed' : 'Vehicle updated successfully');
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

  if (addBtn) {
    addBtn.addEventListener('click', function () {
      window.SW.openModal('addCustomerModal');
    });
  }

  if (addForm) {
    addForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('acName').value.trim();
      var phone = document.getElementById('acPhone').value.trim() || 'Not provided';
      var district = document.getElementById('acDistrict').value.trim();
      var vehicleName = document.getElementById('acVehicle').value.trim();
      var plate = document.getElementById('acPlate').value.trim();
      var plan = document.getElementById('acPlan').value;
      var gstin = document.getElementById('acGstin').value.trim();
      var followUp = document.getElementById('acFollowUp').value;
      var loyaltyPoints = Number(document.getElementById('acLoyalty').value) || 0;
      var notes = document.getElementById('acNotes').value.trim() || 'No notes yet.';

      var vehiclesArr = [];
      if (vehicleName) {
        vehiclesArr.push({ brand: vehicleName, plate: plate || 'Not on file' });
      }

      try {
        var res = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            phone: phone,
            plan: plan,
            district: district,
            gstin: gstin,
            follow_up_due_at: followUp || null,
            loyalty_points: loyaltyPoints,
            notes: notes,
            vehicles: vehiclesArr
          })
        });

        if (res.ok) {
          if (searchInput) searchInput.value = '';
          currentPage = 1;

          await loadVehicles();

          window.SW.closeModal('addCustomerModal');
          window.SW.showToast('Customer added: ' + name);
          addForm.reset();
        } else {
          var err = await res.json();
          alert('Error: ' + (err.message || 'Could not add customer.'));
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred.');
      }
    });
  }

  async function loadVehicles() {
    try {
      var res = await fetch('/api/vehicles');
      if (res.ok) {
        VEHICLES = await res.json();
        renderTable();
      }
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  }
  loadVehicles();
})();
