// Page-specific behavior for dashboard.html
(function () {
  var btn = document.getElementById('newBookingBtn');
  var form = document.getElementById('newBookingForm');
  if (!btn || !form) return;

  window.nbSelectedPhotos = [];
  var nbPhotosPreview = document.getElementById('nbPhotosPreview');
  
  function renderNbPhotosPreview() {
    if (!nbPhotosPreview) return;
    nbPhotosPreview.innerHTML = '';
    window.nbSelectedPhotos.forEach(function(file) {
      var reader = new FileReader();
      reader.onload = function(evt) {
        var div = document.createElement('div');
        div.className = 'photo-ph';
        div.style.backgroundImage = 'url(' + evt.target.result + ')';
        div.style.backgroundSize = 'cover';
        div.style.backgroundPosition = 'center';
        nbPhotosPreview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleNbPhotoPick(capture) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) {
      input.capture = 'environment';
    } else {
      input.multiple = true;
    }
    input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = async function () {
      var files = input.files;
      if (files && files.length > 0) {
        for (var i = 0; i < files.length; i++) {
          await new Promise(function(resolve) {
            var reader = new FileReader();
            reader.readAsDataURL(files[i]);
            reader.onload = function(event) {
              var img = new Image();
              img.src = event.target.result;
              img.onload = function() {
                var canvas = document.createElement('canvas');
                var max_size = 1200;
                var width = img.width;
                var height = img.height;
                if (width > height) {
                  if (width > max_size) { height *= max_size / width; width = max_size; }
                } else {
                  if (height > max_size) { width *= max_size / height; height = max_size; }
                }
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(function(blob) {
                  window.nbSelectedPhotos.push(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
                  resolve();
                }, 'image/jpeg', 0.85);
              };
            };
          });
        }
        renderNbPhotosPreview();
      }
      document.body.removeChild(input);
    };
    input.click();
  }

  var btnGal = document.getElementById('nbAddBeforePhotoGallery');
  var btnCam = document.getElementById('nbAddBeforePhotoCamera');
  if (btnGal) btnGal.addEventListener('click', function() { handleNbPhotoPick(false); });
  if (btnCam) btnCam.addEventListener('click', function() { handleNbPhotoPick(true); });

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

  async function populateStaffDropdown() {
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
        dropdown.appendChild(opt);
      });
    } catch (e) {
      console.error(e);
    }
  }

  btn.addEventListener('click', async function () {
    form.reset();
    var loyaltyEl = document.getElementById('nbVehicleLoyalty');
    if (loyaltyEl) {
      loyaltyEl.textContent = '';
      loyaltyEl.style.display = 'none';
    }
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

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var customer = document.getElementById('nbCustomer').value.trim();
    var phone = document.getElementById('nbPhone') ? document.getElementById('nbPhone').value.trim() : '';
    var vehicle = document.getElementById('nbVehicle') ? document.getElementById('nbVehicle').value.trim() : '';
    var vehiclePlate = document.getElementById('nbVehiclePlate') ? document.getElementById('nbVehiclePlate').value.trim() : '';
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
    var time = document.getElementById('nbTime').value;
    var source = document.getElementById('nbSource').value || 'walkin';
    var bookingDate = document.getElementById('nbDate') ? document.getElementById('nbDate').value : '';
    var pickupRequired = document.getElementById('nbPickup') ? document.getElementById('nbPickup').checked : false;
    var whatsappOptIn = document.getElementById('nbWhatsappOptIn') ? document.getElementById('nbWhatsappOptIn').checked : true;
    var notes = document.getElementById('nbNotes') ? document.getElementById('nbNotes').value.trim() : '';
    var reminderType = document.getElementById('nbReminderType') ? document.getElementById('nbReminderType').value : 'none';
    var reminderDate = document.getElementById('nbReminderDate') ? document.getElementById('nbReminderDate').value : '';
    var reminderNote = document.getElementById('nbReminderNote') ? document.getElementById('nbReminderNote').value.trim() : '';
    var status = 'confirmed'; // Default status

    try {
      var formData = new FormData();
      formData.append('customer', customer);
      if (phone) formData.append('phone', phone);
      if (vehicle) formData.append('vehicle', vehicle);
      if (vehiclePlate) formData.append('vehicle_plate', vehiclePlate);
      if (vehicleType) formData.append('vehicle_type', vehicleType);
      formData.append('service', service);
      if (staff) formData.append('staff', staff);
      if (bay) formData.append('bay', bay);
      formData.append('time', time);
      formData.append('source', source);
      formData.append('status', status);
      if (bookingDate) formData.append('booking_date', bookingDate);
      formData.append('pickup_required', pickupRequired ? '1' : '0');
      formData.append('whatsapp_opt_in', whatsappOptIn ? '1' : '0');
      if (notes) formData.append('notes', notes);
      if (reminderType && reminderType !== 'none') {
        formData.append('reminder_type', reminderType);
        if (reminderDate) formData.append('reminder_date', reminderDate);
        if (reminderNote) formData.append('reminder_note', reminderNote);
      }

      if (window.nbSelectedPhotos && window.nbSelectedPhotos.length > 0) {
        for (var i = 0; i < window.nbSelectedPhotos.length; i++) {
          formData.append('photos_before[]', window.nbSelectedPhotos[i]);
        }
      }

      var res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      });

      if (res.ok) {
        window.SW.closeModal('newBookingModal');
        window.SW.showToast('Booking created for ' + customer);
        
        // Reload dashboard stats to update numbers and chart
        if (window.loadDashboardStats) {
          window.loadDashboardStats();
        }
        form.reset();
    var loyaltyEl = document.getElementById('nbVehicleLoyalty');
    if (loyaltyEl) {
      loyaltyEl.textContent = '';
      loyaltyEl.style.display = 'none';
    }
    if (document.getElementById('nbPhotosPreview')) {
      document.getElementById('nbPhotosPreview').innerHTML = '';
    }
    window.nbSelectedPhotos = [];
      } else {
        var err = await res.json();
        alert('Error: ' + (err.message || 'Could not create booking.'));
      }
    } catch (err) {
      console.error(err);
      alert('A connection error occurred.');
    }
  });
})();

(function () {
  // KPIs, live queue and panels load even if the chart library is unavailable; only the chart needs Highcharts
  var container = document.getElementById('revenueChart');
  if (!container) return;

  function themeColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  function trimmed(value, decimals) {
    var factor = Math.pow(10, decimals);
    return String(Math.round(value * factor) / factor);
  }

  function formatRupees(value) {
    if (value >= 100000) return '₹' + trimmed(value / 100000, 2) + 'L';
    if (value >= 1000) return '₹' + trimmed(value / 1000, 1) + 'k';
    return '₹' + value;
  }

  var accent = themeColor('--accent');
  var accentDim = themeColor('--accent-dim');
  var borderColor = themeColor('--border');
  var textColor = themeColor('--text-3');
  var text1 = themeColor('--text-1');
  var surface2 = themeColor('--surface-2');

  var chart;
  var selectedChartType = 'column';
  var latestCategories = [];
  var latestData = [];

  function renderChart(categories, dataSeries) {
    latestCategories = categories;
    latestData = dataSeries;
    if (!window.Highcharts) return;
    // brand red bars, fading to a darker red at the base
    var barColor = { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, '#ff2d2d'], [1, '#d10f17']] };
    var formattedData = dataSeries.map(function (value) { return { y: value, color: barColor }; });

    if (chart) {
      chart.destroy();
    }

    chart = Highcharts.chart('revenueChart', {
      chart: {
        type: selectedChartType,
        backgroundColor: 'transparent',
        style: { fontFamily: 'Inter, -apple-system, sans-serif' },
        spacing: [16, 8, 8, 8]
      },
      title: { text: null },
      credits: { enabled: false },
      exporting: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories: categories,
        lineColor: '#ddd',
        tickColor: '#ddd',
        labels: { style: { color: textColor, fontSize: '10.5px' } }
      },
      yAxis: {
        title: { text: null },
        gridLineColor: '#e5e7eb',
        gridLineDashStyle: 'Dash',
        labels: {
          style: { color: textColor, fontSize: '10.5px' },
          formatter: function () { return formatRupees(this.value); }
        }
      },
      tooltip: {
        backgroundColor: surface2,
        borderColor: borderColor,
        borderRadius: 8,
        style: { color: text1, fontSize: '12.5px' },
        formatter: function () {
          return '<b>' + this.key + '</b><br>' + formatRupees(this.y);
        }
      },
      plotOptions: {
        series: {
          color: '#e3121b',
          dataLabels: {
            enabled: true,
            crop: false,
            overflow: 'allow',
            style: { color: '#101828', fontSize: '12px', fontWeight: '700', textOutline: 'none' },
            formatter: function () { return this.y > 0 ? formatRupees(this.y) : null; }
          }
        },
        area: { fillOpacity: 0.12, marker: { radius: 3 } },
        column: {
          borderRadius: 4,
          borderWidth: 0,
          pointPadding: 0.2,
          groupPadding: 0.12,
          maxPointWidth: 64,
          states: { hover: { brightness: 0.15 } }
        }
      },
      series: [{ data: formattedData }]
    });
  }

  var chartTypeSelect = document.getElementById('revenueChartType');
  if (chartTypeSelect) {
    chartTypeSelect.addEventListener('change', function () {
      selectedChartType = this.value;
      var chartTypeLabel = document.getElementById('revenueChartTypeLabel');
      if (chartTypeLabel) chartTypeLabel.textContent = this.options[this.selectedIndex].text;
      if (latestCategories.length) renderChart(latestCategories, latestData);
    });
  }

  var rangeSelect = document.getElementById('revenueRange');
  if (rangeSelect) {
    rangeSelect.addEventListener('change', function () {
      var text = this.options[this.selectedIndex].text;
      var rangeLabel = document.getElementById('revenueRangeLabel');
      var rangeTitle = document.getElementById('revenueRangeTitle');
      if (rangeLabel) rangeLabel.textContent = text;
      if (rangeTitle) rangeTitle.textContent = text;
      if (window.loadDashboardStats) window.loadDashboardStats();
    });
  }


  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var WL_CAR_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle><path d="M9 17h6"></path></svg>';

  // Empty-state markup lives in dashboard.blade.php; keep a copy to restore when the queue empties
  // "12 min", "1 h 05 min" since a timestamp
  function waitingTime(since) {
    var d = since ? new Date(since) : null;
    if (!d || isNaN(d.getTime())) return '—';
    var mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
    if (mins < 60) return mins + ' min';
    var h = Math.floor(mins / 60);
    if (h < 24) return h + ' h ' + String(mins % 60).padStart(2, '0') + ' min';
    return Math.floor(h / 24) + ' d';
  }

  var dashQueueNewBtn = document.getElementById('dashQueueNewBtn');
  if (dashQueueNewBtn) dashQueueNewBtn.addEventListener('click', function () {
    var b = document.getElementById('newBookingBtn'); if (b) b.click();
  });

  // "↑ 12% vs yesterday" (green), "↓ 5% vs yesterday" (red), "— 0% vs yesterday" (grey)
  function renderDelta(el, today, yesterday) {
    if (!el) return;
    today = Number(today) || 0; yesterday = Number(yesterday) || 0;
    var pct = yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : (today > 0 ? 100 : 0);
    var dir = pct > 0 ? 'up' : (pct < 0 ? 'down' : 'flat');
    var arrow = dir === 'down'
      ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6l6-6"/></svg>'
      : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6l6 6"/></svg>';
    el.className = 'dash-kpi-delta dash-kpi-delta--' + dir;
    el.innerHTML = '<span class="dash-kpi-delta-pct">' + arrow + Math.abs(pct) + '%</span><span class="dash-kpi-delta-sub">vs yesterday</span>';
  }

  function statusPill(status) {
    var s = String(status || '').toLowerCase();
    var label = s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '—';
    return '<span class="dash-pill dash-pill--' + escapeHtml(s.replace(/[^a-z]/g, '')) + '">' + escapeHtml(label) + '</span>';
  }

  function fillPanel(tbodyId, emptyId, items, rowFn) {
    var tbody = document.getElementById(tbodyId);
    var empty = document.getElementById(emptyId);
    if (!tbody) return;
    items = Array.isArray(items) ? items : [];
    tbody.innerHTML = items.map(rowFn).join('');
    if (empty) empty.style.display = items.length ? 'none' : '';
  }

  function renderBottomPanels(stats) {
    fillPanel('dashRecentPayments', 'dashRecentPaymentsEmpty', stats.recentPayments, function (p) {
      return '<tr><td class="dash-td-strong">' + escapeHtml(p.invoice_number || p.id) + '</td><td>' + escapeHtml(p.customer || '—') + '</td>' +
        '<td class="dash-td-strong">₹' + Number(p.amount || 0).toLocaleString('en-IN') + '</td><td>' + escapeHtml(p.date || '—') + '</td><td>' + statusPill(p.status) + '</td></tr>';
    });
    fillPanel('dashTopServices', 'dashTopServicesEmpty', stats.topServicesMonth, function (s) {
      return '<tr><td class="dash-td-strong">' + escapeHtml(s.name || '—') + '</td><td>' + s.count + '</td><td class="dash-td-strong">₹' + Number(s.revenue || 0).toLocaleString('en-IN') + '</td></tr>';
    });
  }

  async function loadLiveQueue() {
    var queueContainer = document.getElementById('dashboardQueueRows');
    if (!queueContainer) return;

    try {
      var jcRes = await fetch('/api/jobcards');
      var bkRes = await fetch('/api/bookings');
      if (!jcRes.ok || !bkRes.ok) {
        var dashQueueBody = document.getElementById('dashQueueBody');
        var dashActiveBody = document.getElementById('dashActiveBody');
        if (dashQueueBody) dashQueueBody.innerHTML = '<tr><td colspan="4" style="color:red;text-align:center;">Failed to load data (Database down?)</td></tr>';
        if (dashActiveBody) dashActiveBody.innerHTML = '<tr><td colspan="4" style="color:red;text-align:center;">Failed to load data (Database down?)</td></tr>';
        return;
      }

      var jobcards = await jcRes.json();
      var bookings = await bkRes.json();

      // Queue rows: waiting bookings first, then job cards starting, then washing
      var rows = [];
      bookings.forEach(function (b) {
        if (b.status !== 'waiting' && b.status !== 'confirmed') return;
        rows.push({ order: 0, vehicle: [b.vehicle_plate, b.vehicle].filter(Boolean).join(' · '), customer: b.customer,
          service: b.service, since: b.created_at, status: 'Waiting', cls: 'waiting' });
      });
      jobcards.forEach(function (card) {
        if (card.stage === 'completed' || card.stage === 'cancelled') return;
        var washing = card.stage === 'inprogress';
        rows.push({ order: washing ? 2 : 1, vehicle: card.vehicle, customer: card.customer, service: card.service,
          since: card.started_at_at || card.created_at, status: washing ? 'Washing' : 'Starting', cls: washing ? 'washing' : 'starting' });
      });
      rows.sort(function (a, b) { return a.order - b.order; });

      var emptyEl = document.getElementById('dashQueueEmpty');
      if (emptyEl) emptyEl.style.display = rows.length ? 'none' : '';
      queueContainer.innerHTML = rows.map(function (r, i) {
        return '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td class="dash-td-strong">' + escapeHtml(r.vehicle || '—') + '</td>' +
          '<td>' + escapeHtml(r.customer || '—') + '</td>' +
          '<td>' + escapeHtml(r.service || '—') + '</td>' +
          '<td>' + waitingTime(r.since) + '</td>' +
          '<td><span class="dash-pill dash-pill--' + r.cls + '">' + r.status + '</span></td>' +
        '</tr>';
      }).join('');

    } catch (err) {
      console.error('Failed to load dashboard queue:', err);
    }
  }

  async function loadDashboardStats() {
    try {
      var rangeSelect = document.getElementById('revenueRange');
      var days = rangeSelect ? rangeSelect.value : '7';
      var res = await fetch('/api/dashboard/stats?days=' + encodeURIComponent(days));
      if (!res.ok) return;
      var stats = await res.json();

      // Update KPI cards with real computed data
      var kpiBookings = document.getElementById('kpiTodayBookings');
      if (kpiBookings) kpiBookings.textContent = stats.todayBookings;

      var kpiWaiting = document.getElementById('kpiCarsWaiting');
      if (kpiWaiting) kpiWaiting.textContent = stats.carsWaiting;

      var kpiCompleted = document.getElementById('kpiCompletedToday');
      if (kpiCompleted) kpiCompleted.textContent = stats.completedToday;

      var kpiRevenue = document.getElementById('kpiRevenueToday');
      if (kpiRevenue) kpiRevenue.textContent = formatRupees(stats.revenueToday);

      var kpiWeekly = document.getElementById('kpiRevenueWeekly');
      if (kpiWeekly) kpiWeekly.textContent = formatRupees(stats.revenueWeekly);

      var kpiMonthly = document.getElementById('kpiRevenueMonthly');
      if (kpiMonthly) kpiMonthly.textContent = formatRupees(stats.revenueMonthly);

      var kpiPending = document.getElementById('kpiPendingPayments');
      if (kpiPending) kpiPending.textContent = formatRupees(stats.pendingPayments);

      var pendingDelta = document.getElementById('kpiPendingDeltaText');
      if (pendingDelta) pendingDelta.textContent = stats.pendingCount + ' invoices';

      renderDelta(document.getElementById('kpiTodayBookingsDelta'), stats.todayBookings, stats.yesterdayBookings);
      renderDelta(document.getElementById('kpiCompletedTodayDelta'), stats.completedToday, stats.yesterdayCompleted);
      renderDelta(document.getElementById('kpiRevenueTodayDelta'), stats.revenueToday, stats.yesterdayRevenue);
      renderBottomPanels(stats);

      // Render Highcharts chart with real revenue data
      renderChart(stats.revenueChart.categories, stats.revenueChart.data);

    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  }

  window.loadDashboardStats = loadDashboardStats;
  loadDashboardStats();
  loadLiveQueue();
  setInterval(loadLiveQueue, 5000);
  var nbVehiclePlate = document.getElementById('nbVehiclePlate');
  var nbVehicleLoyalty = document.getElementById('nbVehicleLoyalty');
  if (nbVehiclePlate && nbVehicleLoyalty) {
    var nbLoyaltyTimeout;
    nbVehiclePlate.addEventListener('input', function() {
      clearTimeout(nbLoyaltyTimeout);
      nbVehicleLoyalty.style.color = '#10B981';
      nbVehicleLoyalty.style.display = 'none';
      var val = nbVehiclePlate.value.trim();
      if (val.length < 3) return;
      
      nbLoyaltyTimeout = setTimeout(async function() {
        try {
          var res = await fetch('/api/loyalty?vehicle=' + encodeURIComponent(val));
          if (res.ok) {
            var data = await res.json();
            if (data.count > 0) {
              nbVehicleLoyalty.textContent = '🌟 Loyalty: Washed ' + data.count + ' times previously';
              nbVehicleLoyalty.style.display = 'block';
            } else {
              nbVehicleLoyalty.textContent = 'New Vehicle';
              nbVehicleLoyalty.style.color = '#64748B';
              nbVehicleLoyalty.style.display = 'block';
            }
          }
        } catch (e) {}
      }, 600);
    });
  }

  // Autocomplete logic for New Booking Customer/Phone
  var CUSTOMERS_DATA = [];
  var hasFetchedCustomers = false;
  
  async function fetchCustomersForAutocomplete() {
    if (hasFetchedCustomers) return;
    try {
      var res = await fetch('/api/customers');
      if (res.ok) {
        CUSTOMERS_DATA = await res.json();
        hasFetchedCustomers = true;
      }
    } catch(e) {}
  }

  var nbCustomerInput = document.getElementById('nbCustomer');
  var nbPhoneInput = document.getElementById('nbPhone');
  var nbCustomerDropdown = document.getElementById('nbCustomerDropdown');
  var nbPhoneDropdown = document.getElementById('nbPhoneDropdown');

  function getMatches(query) {
    if (!query) return [];
    var q = query.toLowerCase();
    var matches = [];
    CUSTOMERS_DATA.forEach(function(c) {
      if ((c.name && c.name.toLowerCase().includes(q)) || (c.phone && c.phone.includes(q))) {
        if (c.vehicles && c.vehicles.length > 0) {
          c.vehicles.forEach(function(v) {
            matches.push({ customer: c, vehicle: v });
          });
        } else {
          matches.push({ customer: c, vehicle: null });
        }
      }
    });
    return matches.slice(0, 10);
  }

  function renderDropdown(dropdown, matches, inputEl) {
    if (matches.length === 0) {
      dropdown.style.display = 'none';
      return;
    }
    dropdown.innerHTML = '';
    matches.forEach(function(m) {
      var item = document.createElement('div');
      item.className = 'autocomplete-item';
      
      var nameHtml = '<div class="autocomplete-item-name">' + escapeHtml(m.customer.name) + ' (' + escapeHtml(m.customer.phone) + ')</div>';
      var descHtml = '';
      if (m.vehicle) {
        descHtml = '<div class="autocomplete-item-desc">Vehicle: ' + escapeHtml(m.vehicle.brand || 'Car') + ' - ' + escapeHtml(m.vehicle.plate || '') + '</div>';
      }
      item.innerHTML = nameHtml + descHtml;
      
      item.addEventListener('click', function() {
        if (nbCustomerInput) nbCustomerInput.value = m.customer.name || '';
        if (nbPhoneInput) nbPhoneInput.value = m.customer.phone || '';
        if (m.vehicle) {
          var nbVehicleInput = document.getElementById('nbVehicle');
          var nbVehiclePlateInput = document.getElementById('nbVehiclePlate');
          var nbVehicleTypeInput = document.getElementById('nbVehicleType');
          
          if (nbVehicleInput) nbVehicleInput.value = m.vehicle.brand || '';
          if (nbVehiclePlateInput) nbVehiclePlateInput.value = m.vehicle.plate || '';
          if (nbVehicleTypeInput && m.vehicle.type) {
             nbVehicleTypeInput.value = m.vehicle.type.toLowerCase();
          }
        }
        dropdown.style.display = 'none';
        
        var nbVehiclePlateInput = document.getElementById('nbVehiclePlate');
        if (nbVehiclePlateInput) {
            nbVehiclePlateInput.dispatchEvent(new Event('input'));
        }
      });
      
      dropdown.appendChild(item);
    });
    dropdown.style.display = 'block';
  }

  function handleInput(e, dropdown) {
    fetchCustomersForAutocomplete();
    var query = e.target.value.trim();
    if (query.length < 2) {
      dropdown.style.display = 'none';
      return;
    }
    var matches = getMatches(query);
    renderDropdown(dropdown, matches, e.target);
  }

  if (nbCustomerInput) {
    nbCustomerInput.addEventListener('input', function(e) { handleInput(e, nbCustomerDropdown); });
    nbCustomerInput.addEventListener('focus', function(e) { handleInput(e, nbCustomerDropdown); });
  }
  if (nbPhoneInput) {
    nbPhoneInput.addEventListener('input', function(e) { handleInput(e, nbPhoneDropdown); });
    nbPhoneInput.addEventListener('focus', function(e) { handleInput(e, nbPhoneDropdown); });
  }

  document.addEventListener('click', function(e) {
    if (nbCustomerInput && !nbCustomerInput.contains(e.target) && !nbCustomerDropdown.contains(e.target)) {
      nbCustomerDropdown.style.display = 'none';
    }
    if (nbPhoneInput && !nbPhoneInput.contains(e.target) && !nbPhoneDropdown.contains(e.target)) {
      nbPhoneDropdown.style.display = 'none';
    }
  });

})();
// KPI cards open the page behind each number (click, Enter or Space)
(function () {
  document.querySelectorAll('#dashboard .dash-stat-card[data-href]').forEach(function (card) {
    function go() { window.location.href = card.dataset.href; }
    card.addEventListener('click', go);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });
})();
