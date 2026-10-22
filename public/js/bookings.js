// Page-specific behavior for bookings
(function () {
  var newBookingBtn = document.getElementById('newBookingBtn');
  var form = document.getElementById('newBookingForm');
  var tableBody = document.getElementById('bookingsTableBody');
  var emptyState = document.getElementById('bookingsEmptyState');
  var pageInfo = document.getElementById('bookingsPageInfo');
  var prevBtn = document.getElementById('bookingsPrevBtn');
  var nextBtn = document.getElementById('bookingsNextBtn');
  var tabChips = document.querySelectorAll('.toolbar .chip[data-tab]');
  var sourceChips = document.querySelectorAll('.toolbar .chip[data-source]');
  var listView = document.getElementById('bookingsListView');
  var calendarView = document.getElementById('bookingsCalendarView');
  var timeline = document.getElementById('bookingsTimeline');
  if (!tableBody) return;

  var PAGE_SIZE = 10;
  var activeTab = 'list';
  var activeSource = 'all';
  var currentPage = 1;

  var editingBookingId = null;
  var deleteBookingBtn = document.getElementById('deleteBookingBtn');
  var bookingModalTitle = document.getElementById('bookingModalTitle');
  var bookingSubmitBtn = document.getElementById('bookingSubmitBtn');

  var SOURCE = {
    online: { label: 'Online', style: 'background:var(--info-bg);color:var(--info-text);' },
    walkin: { label: 'Walk-in', style: 'background:var(--surface-2);color:var(--text-2);' },
    phone: { label: 'Phone', style: 'background:var(--accent-dim);color:var(--accent);' }
  };

  var STATUS = {
    completed: { label: 'Completed', style: 'background:var(--success-bg);color:var(--success-text);' },
    inprogress: { label: 'In progress', style: 'background:var(--warn-bg);color:var(--warn-text);' },
    waiting: { label: 'Waiting', style: 'background:var(--surface-2);color:var(--text-2);' },
    confirmed: { label: 'Confirmed', style: 'background:var(--info-bg);color:var(--info-text);' },
    cancelled: { label: 'Cancelled', style: 'background:var(--danger-bg);color:var(--danger-text);' },
    checked_in: { label: 'Checked In', style: 'background:var(--success-bg);color:var(--success-text);' }
  };

  var BOOKINGS = [];

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function sortedBySource() {
    var list = BOOKINGS.slice().sort(function (a, b) { return a.minutes - b.minutes; });
    if (activeSource === 'all') return list;
    return list.filter(function (b) { return b.source === activeSource; });
  }

  function renderList() {
    var filtered = sortedBySource();
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * PAGE_SIZE;
    var pageItems = filtered.slice(start, start + PAGE_SIZE);

    tableBody.innerHTML = '';
    pageItems.forEach(function (b, idx) {
      var src = SOURCE[b.source] || { label: b.source, style: '' };
      var st = STATUS[b.status] || { label: b.status, style: '' };
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="col-sl">' + (start + idx + 1) + '</td>' +
        '<td class="mono">' + escapeHtml(b.time_label || b.timeLabel) + '</td>' +
        '<td class="cell-primary">' + escapeHtml(b.customer) +
          (b.vehicle ? ' <span style="color:var(--text-3);font-weight:400;">· ' + escapeHtml(b.vehicle) + (b.vehicle_plate ? ' (' + escapeHtml(b.vehicle_plate) + ')' : '') + '</span>' : '') + '</td>' +
        '<td>' + escapeHtml(b.service) + '</td>' +
        '<td><span class="tag" style="' + src.style + '">' + src.label + '</span></td>' +
        '<td><span class="status-pill" style="' + st.style + '">' + st.label + '</span></td>' +
        '<td>' +
          '<div class="dropdown" style="display:inline-block;">' +
            '<button type="button" class="icon-btn dots-btn" style="padding:4px;color:var(--text-3);"><i class="ti ti-dots"></i></button>' +
            '<div class="dropdown-menu" style="min-width:120px;right:0;left:auto;top:100%;">' +
              '<div class="dropdown-item edit-btn" style="cursor:pointer;"><i class="ti ti-edit"></i>Edit</div>' +
              '<div class="dropdown-item danger delete-btn" style="cursor:pointer;"><i class="ti ti-trash"></i>Delete</div>' +
            '</div>' +
          '</div>' +
        '</td>';

      var dotsBtn = tr.querySelector('.dots-btn');
      var dropMenu = tr.querySelector('.dropdown-menu');

      dotsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = dropMenu.classList.contains('open');
        document.querySelectorAll('.dropdown-menu.open').forEach(function (menu) {
          menu.classList.remove('open');
        });
        if (!isOpen) {
          dropMenu.classList.add('open');
        }
      });

      tr.querySelector('.edit-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        dropMenu.classList.remove('open');
        openEdit(b);
      });

      tr.querySelector('.delete-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        dropMenu.classList.remove('open');
        triggerDelete(b.id, b.customer);
      });

      tableBody.appendChild(tr);
    });

    if (emptyState) emptyState.style.display = filtered.length ? 'none' : 'block';
    if (pageInfo) {
      if (filtered.length === 0) {
        pageInfo.textContent = 'No bookings';
      } else {
        var rangeStart = start + 1;
        var rangeEnd = Math.min(start + PAGE_SIZE, filtered.length);
        pageInfo.textContent = 'Showing ' + rangeStart + '–' + rangeEnd + ' of ' + filtered.length + ' bookings';
      }
    }
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (window.SW && SW.renderPager) SW.renderPager(prevBtn, nextBtn, currentPage, totalPages, function (p) { currentPage = p; renderList(); });
  }

  function renderTimeline() {
    if (!timeline) return;
    var filtered = sortedBySource();
    var byHour = {};
    filtered.forEach(function (b) {
      var hour = Math.floor(b.minutes / 60);
      byHour[hour] = byHour[hour] || [];
      byHour[hour].push(b);
    });

    var html = '';
    for (var hour = 8; hour <= 19; hour++) {
      var items = byHour[hour] || [];
      var hourLabel = (hour % 12 || 12) + (hour >= 12 ? ' PM' : ' AM');
      html += '<div class="timeline-hour"><div class="timeline-hour-label">' + hourLabel + '</div><div class="timeline-hour-slot">';
      if (!items.length) {
        html += '<div class="timeline-hour-empty">No bookings</div>';
      } else {
        items.forEach(function (b) {
          var src = SOURCE[b.source] || { label: b.source, style: '' };
          var st = STATUS[b.status] || { label: b.status, style: '' };
          html +=
            '<div class="timeline-card" style="cursor:pointer;" data-id="' + b.id + '">' +
              '<div class="timeline-card-time">' + escapeHtml(b.time_label || b.timeLabel) + ' · ' + src.label + '</div>' +
              '<div class="timeline-card-name">' + escapeHtml(b.customer) + '</div>' +
              '<div class="timeline-card-service">' + escapeHtml(b.service) + '</div>' +
              '<span class="status-pill" style="' + st.style + '">' + st.label + '</span>' +
            '</div>';
        });
      }
      html += '</div></div>';
    }
    timeline.innerHTML = html;

    timeline.querySelectorAll('.timeline-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = parseInt(card.getAttribute('data-id'));
        var b = BOOKINGS.filter(function (x) { return x.id === id; })[0];
        if (b) openEdit(b);
      });
    });
  }

  function renderAll() {
    renderList();
    renderTimeline();
  }

  tabChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      tabChips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeTab = chip.getAttribute('data-tab');
      if (listView) listView.style.display = activeTab === 'list' ? '' : 'none';
      if (calendarView) calendarView.style.display = activeTab === 'calendar' ? '' : 'none';
    });
  });

  sourceChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      sourceChips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeSource = chip.getAttribute('data-source');
      currentPage = 1;
      renderAll();
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', function () { currentPage--; renderList(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { currentPage++; renderList(); });

  async function populateServices(preserveSelection) {
    var container = document.getElementById('nbServicesContainer');
    if (!container) return;
    var previouslyChecked = [];
    if (preserveSelection) {
      document.querySelectorAll('input[name="nbServices"]:checked').forEach(function (cb) {
        previouslyChecked.push(cb.value);
      });
    }
    try {
      var res = await fetch('/api/services');
      if (res.ok) {
        var services = await res.json();
        container.innerHTML = '';
        services.forEach(function (s) {
          var label = document.createElement('label');
          label.className = 'svc-option';
          label.setAttribute('data-name', s.name.toLowerCase());

          var checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.name = 'nbServices';
          checkbox.value = s.name;
          checkbox.checked = previouslyChecked.includes(s.name);

          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(s.name + ' (₹' + s.price + ')'));
          container.appendChild(label);
        });
      }
    } catch (e) {
      console.error(e);
    }
    renderServiceChips();
    applyServiceFilter(document.getElementById('nbServiceSearch') ? document.getElementById('nbServiceSearch').value : '');
  }

  function renderServiceChips() {
    var chipList = document.getElementById('nbSvcChips');
    if (!chipList) return;
    var checked = Array.prototype.slice.call(document.querySelectorAll('input[name="nbServices"]:checked'));
    if (checked.length === 0) {
      chipList.innerHTML = '<span class="svc-placeholder" id="nbSvcPlaceholder">Search and select services…</span>';
      return;
    }
    chipList.innerHTML = checked.map(function (cb) {
      return '<span class="svc-chip" data-service="' + cb.value.replace(/"/g, '&quot;') + '">' + cb.value + '<span class="svc-chip-remove" title="Remove">&times;</span></span>';
    }).join('');
  }

  function applyServiceFilter(query) {
    var normalized = (query || '').trim().toLowerCase();
    var emptyState = document.getElementById('nbSvcEmpty');
    var options = document.querySelectorAll('#nbServicesContainer .svc-option');
    var visibleCount = 0;
    options.forEach(function (opt) {
      var matches = !normalized || opt.getAttribute('data-name').indexOf(normalized) !== -1;
      opt.classList.toggle('svc-option-hidden', !matches);
      if (matches) visibleCount++;
    });
    if (emptyState) emptyState.style.display = (normalized && visibleCount === 0) ? 'block' : 'none';
  }

  var svcSelect = document.getElementById('nbSvcSelect');
  var svcControl = document.getElementById('nbSvcControl');
  var svcDropdown = document.getElementById('nbSvcDropdown');
  var svcSearchInput = document.getElementById('nbServiceSearch');
  var svcServicesContainer = document.getElementById('nbServicesContainer');
  var svcChipsEl = document.getElementById('nbSvcChips');

  if (svcControl && svcDropdown) {
    svcControl.addEventListener('click', function () {
      var willOpen = !svcDropdown.classList.contains('open');
      if (willOpen) {
        svcDropdown.classList.add('open');
        if (svcSearchInput) svcSearchInput.focus();
      } else {
        svcDropdown.classList.remove('open');
        if (svcSearchInput) svcSearchInput.value = '';
        applyServiceFilter('');
      }
    });
  }

  if (svcSearchInput) {
    svcSearchInput.addEventListener('input', function () {
      applyServiceFilter(svcSearchInput.value);
    });
  }

  if (svcServicesContainer) {
    svcServicesContainer.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'nbServices') renderServiceChips();
    });
  }

  if (svcChipsEl) {
    svcChipsEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.svc-chip-remove');
      if (!chip) return;
      var serviceName = chip.parentElement.getAttribute('data-service');
      var cb = document.querySelector('input[name="nbServices"][value="' + CSS.escape(serviceName) + '"]');
      if (cb) cb.checked = false;
      renderServiceChips();
    });
  }

  document.addEventListener('click', function (e) {
    if (svcSelect && svcDropdown && svcDropdown.classList.contains('open') && !svcSelect.contains(e.target)) {
      svcDropdown.classList.remove('open');
      if (svcSearchInput) svcSearchInput.value = '';
      applyServiceFilter('');
    }
  });

  async function populateStaffDropdown(selectedName) {
    var dropdown = document.getElementById('nbStaff');
    if (!dropdown) return;
    try {
      var res = await fetch('/api/staff');
      if (!res.ok) return;
      var staff = await res.json();
      dropdown.innerHTML = '<option value="">Select staff</option>';
      staff.forEach(function (st) {
        var opt = document.createElement('option');
        opt.value = st.name;
        opt.textContent = st.name;
        if (selectedName && selectedName === st.name) opt.selected = true;
        dropdown.appendChild(opt);
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (newBookingBtn && form) {
    newBookingBtn.addEventListener('click', async function () {
      editingBookingId = null;
      if (bookingModalTitle) bookingModalTitle.textContent = 'New booking';
      if (bookingSubmitBtn) bookingSubmitBtn.innerHTML = '<i class="ti ti-plus"></i>Create booking';
      if (deleteBookingBtn) deleteBookingBtn.style.display = 'none';

      form.reset();
    if (document.getElementById('nbPhotosPreview')) {
      document.getElementById('nbPhotosPreview').innerHTML = '';
    }
    window.nbSelectedPhotos = [];
      var dateInput = document.getElementById('nbDate');
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

      var timeInput = document.getElementById('nbTime');
      if (timeInput) {
        var now = new Date();
        var hrs = now.getHours();
        var mins = now.getMinutes();
        timeInput.value = (hrs < 10 ? '0' + hrs : hrs) + ':' + (mins < 10 ? '0' + mins : mins);
      }

      var pickupInput = document.getElementById('nbPickup');
      if (pickupInput) pickupInput.checked = false;
      var waInput = document.getElementById('nbWhatsappOptIn');
      if (waInput) waInput.checked = true;
      var vehicleTypeInput = document.getElementById('nbVehicleType');
      if (vehicleTypeInput) vehicleTypeInput.value = 'sedan';

      resetReminderFields();
      await populateStaffDropdown();
      await populateServices();
      window.SW.openModal('newBookingModal');
    });
  }

  async function openEdit(b) {
    editingBookingId = b.id;
    if (bookingModalTitle) bookingModalTitle.textContent = 'Edit booking';
    if (bookingSubmitBtn) bookingSubmitBtn.innerHTML = '<i class="ti ti-check"></i>Save changes';
    if (deleteBookingBtn) deleteBookingBtn.style.display = 'inline-flex';

    await populateServices();
    await populateStaffDropdown(b.staff);

    document.getElementById('nbCustomer').value = b.customer || '';
    document.getElementById('nbPhone').value = b.phone || '';
    document.getElementById('nbVehicle').value = b.vehicle || '';
    document.getElementById('nbVehiclePlate').value = b.vehicle_plate || '';
    if (document.getElementById('nbVehicleColor')) {
      document.getElementById('nbVehicleColor').value = b.vehicle_color || '';
    }
    if (document.getElementById('nbVehicleType')) {
      document.getElementById('nbVehicleType').value = b.vehicle_type || 'sedan';
    }
    var selectedServices = b.service ? b.service.split(', ') : [];
    document.querySelectorAll('input[name="nbServices"]').forEach(function (cb) {
      cb.checked = selectedServices.indexOf(cb.value) !== -1;
    });
    renderServiceChips();

    var srcVal = 'Walk-in';
    if (b.source === 'online') srcVal = 'Online';
    if (b.source === 'phone') srcVal = 'Phone';
    document.getElementById('nbSource').value = srcVal;

    var hrs = Math.floor(b.minutes / 60);
    var mins = b.minutes % 60;
    var timeVal = (hrs < 10 ? '0' + hrs : hrs) + ':' + (mins < 10 ? '0' + mins : mins);
    document.getElementById('nbTime').value = timeVal;

    var dateInput = document.getElementById('nbDate');
    if (dateInput) {
      if (b.created_at) {
        dateInput.value = b.created_at.slice(0, 10);
      } else {
        dateInput.value = new Date().toISOString().slice(0, 10);
      }
    }

    var bayInput = document.getElementById('nbBay');
    if (bayInput) bayInput.value = b.bay || '';
    var pickup = document.getElementById('nbPickup');
    if (pickup) pickup.checked = !!b.pickup_required;
    var waOptIn = document.getElementById('nbWhatsappOptIn');
    if (waOptIn) waOptIn.checked = b.whatsapp_opt_in !== false;

    var notesInput = document.getElementById('nbNotes');
    if (notesInput) notesInput.value = b.notes || '';

    // Reminder fields
    var nbReminderType = document.getElementById('nbReminderType');
    var nbReminderDate = document.getElementById('nbReminderDate');
    var nbReminderNote = document.getElementById('nbReminderNote');
    if (nbReminderType) {
      nbReminderType.value = b.reminder_type || 'none';
      if (nbReminderDate) nbReminderDate.value = b.reminder_date ? String(b.reminder_date).slice(0, 10) : '';
      if (nbReminderNote) nbReminderNote.value = b.reminder_note || '';
      updateReminderDateFromType();
    }

    window.SW.openModal('newBookingModal');
  }

  // Follow-up reminder helper functions
  function resetReminderFields() {
    var nbReminderType = document.getElementById('nbReminderType');
    var nbReminderDateWrap = document.getElementById('nbReminderDateWrap');
    var nbReminderDate = document.getElementById('nbReminderDate');
    var nbReminderNoteWrap = document.getElementById('nbReminderNoteWrap');
    var nbReminderNote = document.getElementById('nbReminderNote');
    if (nbReminderType) nbReminderType.value = 'none';
    if (nbReminderDateWrap) nbReminderDateWrap.style.display = 'none';
    if (nbReminderNoteWrap) nbReminderNoteWrap.style.display = 'none';
    if (nbReminderDate) nbReminderDate.value = '';
    if (nbReminderNote) nbReminderNote.value = '';
  }

  function updateReminderDateFromType() {
    var nbReminderType = document.getElementById('nbReminderType');
    var nbReminderDateWrap = document.getElementById('nbReminderDateWrap');
    var nbReminderDate = document.getElementById('nbReminderDate');
    var nbReminderNoteWrap = document.getElementById('nbReminderNoteWrap');
    var nbDateInput = document.getElementById('nbDate');
    if (!nbReminderType) return;

    var type = nbReminderType.value;
    if (type === 'none') {
      if (nbReminderDateWrap) nbReminderDateWrap.style.display = 'none';
      if (nbReminderNoteWrap) nbReminderNoteWrap.style.display = 'none';
      if (nbReminderDate) nbReminderDate.value = '';
    } else {
      if (nbReminderDateWrap) nbReminderDateWrap.style.display = 'block';
      if (nbReminderNoteWrap) nbReminderNoteWrap.style.display = 'block';

      var baseStr = (nbDateInput && nbDateInput.value) ? nbDateInput.value : new Date().toISOString().slice(0, 10);
      var baseParts = baseStr.split('-');
      var baseDate = new Date(parseInt(baseParts[0], 10), parseInt(baseParts[1], 10) - 1, parseInt(baseParts[2], 10));

      if (type === '1_week') {
        var d = new Date(baseDate);
        d.setDate(d.getDate() + 7);
        if (nbReminderDate) nbReminderDate.value = formatDateForInput(d);
      } else if (type === '1_month') {
        var d2 = new Date(baseDate);
        d2.setMonth(d2.getMonth() + 1);
        if (nbReminderDate) nbReminderDate.value = formatDateForInput(d2);
      } else if (type === 'custom') {
        if (nbReminderDate && !nbReminderDate.value) {
          nbReminderDate.value = baseStr;
        }
      }
    }
  }

  function formatDateForInput(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  var nbReminderTypeEl = document.getElementById('nbReminderType');
  if (nbReminderTypeEl) {
    nbReminderTypeEl.addEventListener('change', updateReminderDateFromType);
  }
  var nbDateEl = document.getElementById('nbDate');
  if (nbDateEl) {
    nbDateEl.addEventListener('change', function () {
      var rt = document.getElementById('nbReminderType');
      if (rt && (rt.value === '1_week' || rt.value === '1_month')) {
        updateReminderDateFromType();
      }
    });
  }

  async function triggerDelete(id, customer) {
    if (!confirm('Are you sure you want to delete the booking for "' + customer + '"?')) return;
    try {
      var res = await fetch('/api/bookings/' + id, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        window.SW.showToast('Booking deleted successfully');
        await loadBookings();
      } else {
        alert('Could not delete booking.');
      }
    } catch (e) {
      console.error(e);
      alert('A connection error occurred.');
    }
  }

  if (deleteBookingBtn) {
    deleteBookingBtn.addEventListener('click', async function () {
      if (!editingBookingId) return;
      var b = BOOKINGS.filter(function (x) { return x.id === editingBookingId; })[0];
      if (!b) return;
      triggerDelete(editingBookingId, b.customer);
      window.SW.closeModal('newBookingModal');
    });
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('nbCustomer').value.trim();
      var phone = document.getElementById('nbPhone').value.trim();
      var vehicle = document.getElementById('nbVehicle').value.trim();
      var vehiclePlate = document.getElementById('nbVehiclePlate').value.trim();
      var vehicleColor = document.getElementById('nbVehicleColor') ? document.getElementById('nbVehicleColor').value.trim() : '';
      var servicesList = [];
      document.querySelectorAll('input[name="nbServices"]:checked').forEach(function (cb) {
        servicesList.push(cb.value);
      });
      if (servicesList.length === 0) {
        alert('Please select at least one service.');
        return;
      }
      var service = servicesList.join(', ');
      var vehicleType = document.getElementById('nbVehicleType') ? document.getElementById('nbVehicleType').value : 'sedan';
      var staff = document.getElementById('nbStaff') ? document.getElementById('nbStaff').value : '';
      var bay = document.getElementById('nbBay') ? document.getElementById('nbBay').value : '';
      var sourceValue = document.getElementById('nbSource').value;
      var time = document.getElementById('nbTime').value;
      var bookingDate = document.getElementById('nbDate') ? document.getElementById('nbDate').value : '';
      var pickupRequired = document.getElementById('nbPickup') ? document.getElementById('nbPickup').checked : false;
      var whatsappOptIn = document.getElementById('nbWhatsappOptIn') ? document.getElementById('nbWhatsappOptIn').checked : true;
      var notes = document.getElementById('nbNotes') ? document.getElementById('nbNotes').value.trim() : '';
      var reminderType = document.getElementById('nbReminderType') ? document.getElementById('nbReminderType').value : 'none';
      var reminderDate = document.getElementById('nbReminderDate') ? document.getElementById('nbReminderDate').value : '';
      var reminderNote = document.getElementById('nbReminderNote') ? document.getElementById('nbReminderNote').value.trim() : '';

      var sourceKey = sourceValue.toLowerCase().replace('-', '');

      try {
        var url = editingBookingId ? '/api/bookings/' + editingBookingId : '/api/bookings';
        var method = editingBookingId ? 'PUT' : 'POST';

        var payload = {
          customer: name,
          phone: phone,
          vehicle: vehicle,
          vehicle_plate: vehiclePlate,
          vehicle_color: vehicleColor,
          vehicle_type: vehicleType,
          service: service,
          staff: staff || null,
          bay: bay || null,
          source: SOURCE[sourceKey] ? sourceKey : 'walkin',
          time: time || '12:00',
          notes: notes,
          booking_date: bookingDate || null,
          pickup_required: pickupRequired,
          whatsapp_opt_in: whatsappOptIn,
          reminder_type: reminderType,
          reminder_date: (reminderType !== 'none' && reminderDate) ? reminderDate : null,
          reminder_note: (reminderType !== 'none' && reminderNote) ? reminderNote : null
        };

        if (!editingBookingId) {
          payload.status = 'confirmed';
        }

        var res = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          window.SW.closeModal('newBookingModal');
          window.SW.showToast(editingBookingId ? 'Booking updated successfully' : 'Booking created for ' + name);
          form.reset();
    if (document.getElementById('nbPhotosPreview')) {
      document.getElementById('nbPhotosPreview').innerHTML = '';
    }
    window.nbSelectedPhotos = [];
          await loadBookings();
        } else {
          var err = await res.json();
          alert('Error: ' + (err.message || 'Could not save booking.'));
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred.');
      }
    });
  }

  async function loadBookings() {
    try {
      var res = await fetch('/api/bookings');
      if (res.ok) {
        BOOKINGS = await res.json();
        renderAll();
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  }
  loadBookings();
  setInterval(loadBookings, 5000);
})();
