// Page-specific behavior for queue
(function () {
  var btn = document.getElementById('openDisplayBtn');
  if (btn) {
    btn.addEventListener('click', function () {
      window.open('/display', 'shinewise_display', 'noopener');
    });
  }

  var baysGrid = document.getElementById('queueBaysGrid');
  var waitlistRows = document.getElementById('queueWaitlistRows');
  var completedRows = document.getElementById('queueCompletedRows');
  var waitlistSearchInput = document.getElementById('waitlistSearchInput');
  var waitlistPageInfo = document.getElementById('waitlistPageInfo');
  var waitlistPrevBtn = document.getElementById('waitlistPrevBtn');
  var waitlistNextBtn = document.getElementById('waitlistNextBtn');
  var WAITLIST_PAGE_SIZE = 8;
  var waitlistCurrentPage = 1;
  var waitlistSearchTerm = '';
  var lastWaitingBookings = [];
  var baySortMode = 'default';

  var completedSearchInput = document.getElementById('completedSearchInput');
  var completedPageInfo = document.getElementById('completedPageInfo');
  var completedPrevBtn = document.getElementById('completedPrevBtn');
  var completedNextBtn = document.getElementById('completedNextBtn');
  var completedCountBadge = document.getElementById('completedCountBadge');
  var completedTitleText = document.getElementById('completedTitleText');
  var COMPLETED_PAGE_SIZE = 8;
  var completedCurrentPage = 1;
  var completedSearchTerm = '';
  var completedTabMode = 'today';
  var lastCompletedToday = [];
  var lastCompletedAll = [];

  function matchesWaitlistSearch(b, term) {
    if (!term) return true;
    var haystack = [b.customer, b.vehicle, b.vehicle_plate, b.service].filter(Boolean).join(' ').toLowerCase();
    return haystack.indexOf(term.toLowerCase()) !== -1;
  }

  function renderWaitlist() {
    if (!waitlistRows) return;
    waitlistRows.innerHTML = '';
    var filtered = lastWaitingBookings.filter(function (b) {
      return matchesWaitlistSearch(b, waitlistSearchTerm);
    });

    if (filtered.length === 0) {
      waitlistRows.innerHTML = waitlistSearchTerm
        ? queueEmptyRowHtml(Q_EMPTY_SEARCH_SVG, 'No waitlist entries match your search', 'Try a different vehicle, customer or service.')
        : queueEmptyRowHtml(Q_EMPTY_CAR_SVG, 'No vehicles in waitlist', 'New bookings will appear here.');
      if (waitlistPageInfo) waitlistPageInfo.textContent = 'No waitlist entries';
      if (window.SW && SW.renderPager) SW.renderPager(waitlistPrevBtn, waitlistNextBtn, 1, 1);
      return;
    }

    var totalPages = Math.max(1, Math.ceil(filtered.length / WAITLIST_PAGE_SIZE));
    if (waitlistCurrentPage > totalPages) waitlistCurrentPage = totalPages;
    if (waitlistCurrentPage < 1) waitlistCurrentPage = 1;

    var start = (waitlistCurrentPage - 1) * WAITLIST_PAGE_SIZE;
    var pageBookings = filtered.slice(start, start + WAITLIST_PAGE_SIZE);

    pageBookings.forEach(function (b, idx) {
      var isVip = b.customer.includes('Priya') || b.customer.includes('Thomas');
      var vipBadge = isVip ? ' <i class="ti ti-star-filled" style="font-size:13px;color:var(--accent);margin-left:4px;"></i> VIP' : '';
      var vehicleLine = [b.vehicle_plate, b.vehicle].filter(Boolean).join(' · ');

      var timeString = '';
      var waitString = '--';
      if (b.created_at) {
        var dateObj = new Date(b.created_at);
        if (!isNaN(dateObj.getTime())) {
          timeString = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
          waitString = formatWaitTime(Date.now() - dateObj.getTime());
        }
      }

      var el = document.createElement('tr');
      el.className = 'wl-row';
      el.setAttribute('data-id', b.id);
      el.setAttribute('data-customer', b.customer);
      el.setAttribute('data-phone', b.phone || '');
      el.setAttribute('data-vehicle', b.vehicle || '');
      el.setAttribute('data-vehicle-plate', b.vehicle_plate || '');
      el.setAttribute('data-service', b.service);
      el.setAttribute('data-branch-id', b.branch_id || '');

      el.innerHTML =
        '<td class="wl-td-num">' + (start + idx + 1) + '</td>' +
        '<td class="wl-td-vehicle"><div class="wl-cell"><div class="wl-icon">' + WL_CAR_ICON_SVG + '</div><div class="wl-vehicle">' + (vehicleLine ? escapeHtml(vehicleLine) : '—') + '</div></div></td>' +
        '<td class="wl-td-customer"><div class="wl-customer">' + escapeHtml(b.customer) + vipBadge + '</div></td>' +
        '<td class="wl-td-service"><div class="wl-service">' + escapeHtml(b.service) + '</div></td>' +
        '<td class="wl-td-arrival"><span class="wl-arrival">' + (timeString ? WL_CLOCK_ICON_SVG + timeString : '--') + '</span></td>' +
        '<td class="wl-td-wait"><span class="wl-wait">' + waitString + '</span></td>' +
        '<td class="wl-td-actions"><div class="wl-actions">' +
          '<button type="button" class="btn btn-accent start-wash-btn"><i class="ti ti-droplet"></i>Start Work</button>' +
          '<button type="button" class="btn wl-edit-btn edit-booking-btn" title="Edit booking"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>' +
          '<button type="button" class="btn wl-delete-btn delete-booking-btn" title="Delete booking"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg></button>' +
        '</div></td>';
      waitlistRows.appendChild(el);
    });

    if (waitlistPageInfo) {
      var rangeStart = start + 1;
      var rangeEnd = Math.min(start + WAITLIST_PAGE_SIZE, filtered.length);
      waitlistPageInfo.textContent = 'Showing ' + rangeStart + '–' + rangeEnd + ' of ' + filtered.length + ' waitlist entries';
    }
    if (waitlistPrevBtn) waitlistPrevBtn.disabled = waitlistCurrentPage <= 1;
    if (waitlistNextBtn) waitlistNextBtn.disabled = waitlistCurrentPage >= totalPages;
    if (window.SW && SW.renderPager) SW.renderPager(waitlistPrevBtn, waitlistNextBtn, waitlistCurrentPage, totalPages, function (p) { waitlistCurrentPage = p; renderWaitlist(); });
  }

  if (waitlistSearchInput) {
    waitlistSearchInput.addEventListener('input', function () {
      waitlistSearchTerm = waitlistSearchInput.value.trim();
      waitlistCurrentPage = 1;
      renderWaitlist();
    });
  }

  if (waitlistPrevBtn) {
    waitlistPrevBtn.addEventListener('click', function () {
      waitlistCurrentPage--;
      renderWaitlist();
    });
  }
  if (waitlistNextBtn) {
    waitlistNextBtn.addEventListener('click', function () {
      waitlistCurrentPage++;
      renderWaitlist();
    });
  }

  function bayRank(card, mode) {
    var stage = card ? (card.stage === 'inprogress' ? 'washing' : 'starting') : 'empty';
    if (mode === 'washing') return stage === 'washing' ? 0 : (stage === 'starting' ? 1 : 2);
    if (mode === 'starting') return stage === 'starting' ? 0 : (stage === 'washing' ? 1 : 2);
    if (mode === 'empty') return stage === 'empty' ? 0 : 1;
    return 0;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var WL_CAR_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle><path d="M9 17h6"></path></svg>';
  var CW_CALENDAR_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/></svg>';
  var CW_EYE_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';


  // Empty-state row for the waitlist / completed tables: pink circle + red icon, title, hint
  var Q_EMPTY_CAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.2 10.2 6.9 5.6A2.4 2.4 0 0 1 9.1 4h5.8a2.4 2.4 0 0 1 2.2 1.6l1.7 4.6A2.6 2.6 0 0 1 21 12.8V17a1 1 0 0 1-1 1h-1v1.2a1.3 1.3 0 0 1-2.6 0V18H7.6v1.2a1.3 1.3 0 0 1-2.6 0V18H4a1 1 0 0 1-1-1v-4.2a2.6 2.6 0 0 1 2.2-2.6zm2.1-.2h9.4l-1.3-3.6a.9.9 0 0 0-.8-.6H9.4a.9.9 0 0 0-.8.6L7.3 10zM7 15.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm10 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z"/></svg>';
  var Q_EMPTY_CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>';
  var Q_EMPTY_SEARCH_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>';

  function queueEmptyRowHtml(iconSvg, title, sub) {
    return '<tr class="q-empty-row"><td colspan="7"><div class="q-empty">' +
      '<span class="q-empty-icon">' + iconSvg + '</span>' +
      '<div class="q-empty-title">' + escapeHtml(title) + '</div>' +
      '<div class="q-empty-sub">' + escapeHtml(sub) + '</div>' +
    '</div></td></tr>';
  }
  var WL_CLOCK_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  // Waitlist "Wait time": how long since the booking arrived (refreshes with the 5s queue poll)
  function formatWaitTime(ms) {
    if (!(ms >= 0)) return '--';
    var mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + ' min';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ' + (mins % 60) + 'm';
    return Math.floor(hours / 24) + 'd ' + (hours % 24) + 'h';
  }
  var BAY_TRASH_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>';

  function parseVehicleString(vehicle) {
    var match = /^(.*?)\(([^)]+)\)\s*$/.exec(vehicle || '');
    if (match) return { plate: match[1].trim(), model: match[2].trim() };
    return { plate: vehicle || '', model: '' };
  }

  function formatTime12(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
  }

  function formatDateShort(date) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return date.getDate() + ' ' + months[date.getMonth()];
  }

  function formatDateTime(date) {
    return formatDateShort(date) + ', ' + formatTime12(date);
  }

  function isToday(date) {
    if (!date || isNaN(date.getTime())) return false;
    var now = new Date();
    return date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
  }

  function matchesCompletedSearch(card, term) {
    if (!term) return true;
    var vehicleParts = parseVehicleString(card.vehicle);
    var haystack = [card.customer, vehicleParts.plate, vehicleParts.model, card.service, card.staff].filter(Boolean).join(' ').toLowerCase();
    return haystack.indexOf(term.toLowerCase()) !== -1;
  }

  function renderCompletedTable() {
    if (!completedRows) return;

    var source = completedTabMode === 'total' ? lastCompletedAll : lastCompletedToday;
    var filtered = source.filter(function (card) {
      return matchesCompletedSearch(card, completedSearchTerm);
    });

    completedRows.innerHTML = '';

    if (filtered.length === 0) {
      if (completedSearchTerm) {
        completedRows.innerHTML = queueEmptyRowHtml(Q_EMPTY_SEARCH_SVG, 'No completed washes match your search', 'Try a different vehicle, customer or service.');
      } else {
        completedRows.innerHTML = queueEmptyRowHtml(Q_EMPTY_CHECK_SVG, completedTabMode === 'total' ? 'No completed washes yet' : 'No washes completed yet today', 'Finished washes will appear here.');
      }
      if (completedPageInfo) completedPageInfo.textContent = 'No completed washes';
      if (window.SW && SW.renderPager) SW.renderPager(completedPrevBtn, completedNextBtn, 1, 1);
      return;
    }

    var totalPages = Math.max(1, Math.ceil(filtered.length / COMPLETED_PAGE_SIZE));
    if (completedCurrentPage > totalPages) completedCurrentPage = totalPages;
    if (completedCurrentPage < 1) completedCurrentPage = 1;

    var start = (completedCurrentPage - 1) * COMPLETED_PAGE_SIZE;
    var pageItems = filtered.slice(start, start + COMPLETED_PAGE_SIZE);

    pageItems.forEach(function (card, idx) {
      var vehicleParts = parseVehicleString(card.vehicle);
      var vehicleLabel = [vehicleParts.plate, vehicleParts.model].filter(Boolean).join(' · ');
      var completedTime = formatDateTime(new Date(card.completed_at_at));

      var el = document.createElement('tr');
      el.className = 'cw-row';
      el.innerHTML =
        '<td class="cw-td-num">' + (start + idx + 1) + '</td>' +
        '<td class="cw-td-vehicle"><div class="wl-cell"><div class="wl-icon">' + WL_CAR_ICON_SVG + '</div><div class="wl-vehicle">' + (vehicleLabel ? escapeHtml(vehicleLabel) : '—') + '</div></div></td>' +
        '<td class="cw-td-customer"><div class="wl-customer">' + escapeHtml(card.customer || '—') + '</div></td>' +
        '<td class="cw-td-service"><div class="wl-service">' + escapeHtml(card.service || '—') + '</div></td>' +
        '<td class="cw-td-staff"><div class="wl-service">' + escapeHtml(card.staff || 'Unassigned') + '</div></td>' +
        '<td class="cw-td-completed"><span class="cw-completed-pill">' + CW_CALENDAR_ICON_SVG + escapeHtml(completedTime) + '</span></td>' +
        '<td class="cw-td-action"><button type="button" class="btn view-job-btn-sm" data-view-job="' + escapeHtml(card.id) + '">' + CW_EYE_ICON_SVG + 'View</button></td>';
      completedRows.appendChild(el);
    });

    if (completedPageInfo) {
      var rangeStart = start + 1;
      var rangeEnd = Math.min(start + COMPLETED_PAGE_SIZE, filtered.length);
      completedPageInfo.textContent = 'Showing ' + rangeStart + '–' + rangeEnd + ' of ' + filtered.length + ' completed washes';
    }
    if (completedPrevBtn) completedPrevBtn.disabled = completedCurrentPage <= 1;
    if (completedNextBtn) completedNextBtn.disabled = completedCurrentPage >= totalPages;
    if (window.SW && SW.renderPager) SW.renderPager(completedPrevBtn, completedNextBtn, completedCurrentPage, totalPages, function (p) { completedCurrentPage = p; renderCompletedTable(); });
  }

  function updateCompletedBadge() {
    if (completedTitleText) {
      completedTitleText.textContent = completedTabMode === 'total' ? 'Total Completed Wash' : 'Today Completed Wash';
    }
    if (!completedCountBadge) return;
    var count = (completedTabMode === 'total' ? lastCompletedAll : lastCompletedToday).length;
    completedCountBadge.textContent = count + (count === 1 ? ' wash' : ' washes');
  }

  function renderCompleted(jobcards) {
    lastCompletedAll = jobcards.filter(function (card) {
      return card.stage === 'completed' && card.completed_at_at;
    }).sort(function (a, b) {
      return new Date(b.completed_at_at) - new Date(a.completed_at_at);
    });
    lastCompletedToday = lastCompletedAll.filter(function (card) {
      return isToday(new Date(card.completed_at_at));
    });

    updateCompletedBadge();
    renderCompletedTable();
  }

  var completedTabChips = document.querySelectorAll('.chip[data-completed-tab]');
  completedTabChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      completedTabChips.forEach(function (c) { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      completedTabMode = chip.getAttribute('data-completed-tab');
      completedCurrentPage = 1;
      updateCompletedBadge();
      renderCompletedTable();
    });
  });

  if (completedSearchInput) {
    completedSearchInput.addEventListener('input', function () {
      completedSearchTerm = completedSearchInput.value.trim();
      completedCurrentPage = 1;
      renderCompletedTable();
    });
  }

  if (completedPrevBtn) {
    completedPrevBtn.addEventListener('click', function () {
      completedCurrentPage--;
      renderCompletedTable();
    });
  }
  if (completedNextBtn) {
    completedNextBtn.addEventListener('click', function () {
      completedCurrentPage++;
      renderCompletedTable();
    });
  }

  if (completedRows) {
    completedRows.addEventListener('click', function (e) {
      var viewJobBtn = e.target.closest('[data-view-job]');
      if (!viewJobBtn) return;
      openCompletedJobModal(viewJobBtn.getAttribute('data-view-job'));
    });
  }

  var CHECK_ICON_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  var currentCompletedJobId = null;

  function buildTypedPhotoTilesHtml(cardId, type, count, updatedAt) {
    if (!count) return '<div style="color:var(--text-3);font-size:12.5px;">No photos added.</div>';
    var html = '';
    for (var i = 1; i <= count; i++) {
      var imgSrc = '/uploads/jobcards/jc_' + cardId + '_' + type + '_' + i + '.jpg?t=' + (updatedAt ? new Date(updatedAt).getTime() : '');
      html += '<div class="cjm-photo-tile" style="background-image: url(\'' + imgSrc + '\'); background-size: cover; background-position: center;"></div>';
    }
    return html;
  }

  function openCompletedJobModal(id) {
    var card = lastCompletedAll.filter(function (c) { return c.id === id; })[0];
    if (!card) return;

    currentCompletedJobId = card.id;

    var vehicleParts = parseVehicleString(card.vehicle);
    var vehicleLabel = [vehicleParts.plate, vehicleParts.model].filter(Boolean).join(' · ') || card.vehicle || '—';
    var completedTime = card.completed_at_at ? formatDateTime(new Date(card.completed_at_at)) : '—';
    var checklist = card.checklist || [];
    var doneCount = checklist.filter(function (item) { return item.done; }).length;

    var checklistHtml = checklist.length
      ? checklist.map(function (item) {
          return '<div class="cjm-checklist-row' + (item.done ? ' done' : '') + '"><span class="cjm-check">' + (item.done ? CHECK_ICON_SVG : '') + '</span><span>' + escapeHtml(item.label) + '</span></div>';
        }).join('')
      : '<div style="color:var(--text-3);font-size:12.5px;">No checklist recorded.</div>';

    var titleEl = document.getElementById('completedJobModalTitle');
    if (titleEl) {
      titleEl.innerHTML = '<span class="jc-modal-id">#' + escapeHtml(card.id) + '</span> <span class="status-pill" style="background:#E7F7EE;color:#166534;">Completed</span>';
    }

    var bodyEl = document.getElementById('completedJobModalBody');
    if (bodyEl) {
      bodyEl.innerHTML =
        '<div class="cjm-vehicle">' +
          '<div class="cjm-vc-icon">' + WL_CAR_ICON_SVG + '</div>' +
          '<div><div class="cjm-vehicle-name">' + escapeHtml(vehicleLabel) + '</div><div class="wl-service">' + escapeHtml(card.service || '—') + '</div></div>' +
        '</div>' +
        '<div class="cjm-meta">' +
          '<span><i class="ti ti-users"></i>' + escapeHtml(card.customer || '—') + '</span>' +
          '<span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" stroke-linejoin="round"/></svg>' + escapeHtml(card.phone || '—') + '</span>' +
          '<span><i class="ti ti-map-pin"></i>' + escapeHtml(card.bay || '—') + '</span>' +
          '<span><i class="ti ti-id-badge-2"></i>' + escapeHtml(card.staff || 'Unassigned') + '</span>' +
          '<span><i class="ti ti-clock-hour-4"></i>Completed ' + escapeHtml(completedTime) + '</span>' +
        '</div>' +
        '<div class="cjm-section">' +
          '<div class="cjm-section-head"><h4>Checklist</h4><span class="cjm-checklist-count">' + doneCount + '/' + checklist.length + '</span></div>' +
          checklistHtml +
        '</div>' +
        '<div class="cjm-section">' +
          '<h4>Before Photos</h4>' +
          '<div class="cjm-photo-grid" id="cjmBeforeGrid">' +
            buildTypedPhotoTilesHtml(card.id, 'before', card.photos_before || 0, card.updated_at) +
          '</div>' +
        '</div>' +
        '<div class="cjm-section">' +
          '<h4>After Photos</h4>' +
          '<div class="cjm-photo-grid" id="cjmAfterGrid">' +
            buildTypedPhotoTilesHtml(card.id, 'after', card.photos_after || 0, card.updated_at) +
          '</div>' +
        '</div>' +
        (card.note ? '<div class="cjm-section"><h4>Damage note</h4><p class="cjm-note">' + escapeHtml(card.note) + '</p></div>' : '');
    }

    var fullLink = document.getElementById('completedJobFullLink');
    if (fullLink) fullLink.href = '/jobcards?id=' + encodeURIComponent(card.id);

    window.SW.openModal('completedJobModal');
  }

  function getBayStartDate(card) {
    if (card.started_at_at) {
      var fromTimestamp = new Date(card.started_at_at);
      if (!isNaN(fromTimestamp.getTime())) return fromTimestamp;
    }
    if (card.started_at) {
      var parts = String(card.started_at).split(':');
      var hh = parseInt(parts[0], 10);
      var mm = parseInt(parts[1], 10);
      if (!isNaN(hh) && !isNaN(mm)) {
        var fromTimeString = new Date();
        fromTimeString.setHours(hh, mm, 0, 0);
        return fromTimeString;
      }
    }
    return null;
  }

  function formatElapsedMinutes(startDate) {
    if (!startDate) return '';
    var minutes = Math.max(0, Math.round((Date.now() - startDate.getTime()) / 60000));
    if (minutes < 1) return 'Just started';
    if (minutes < 60) return minutes + ' min';
    var hours = Math.floor(minutes / 60);
    var remainder = minutes % 60;
    return hours + 'h ' + remainder + 'm';
  }

  // Summary cards above the bays: waiting, in bays, free bays, completed today
  function updateQueueStats(activeBays) {
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    var names = Object.keys(activeBays);
    var starting = 0, washing = 0, free = 0;
    names.forEach(function (n) {
      if (!activeBays[n].length) { free++; return; }
      activeBays[n].forEach(function (c) { if (c.stage === 'inprogress') washing++; else starting++; });
    });
    set('qStatWaiting', lastWaitingBookings.length);
    set('waitlistCountBadge', lastWaitingBookings.length);
    set('qStatActive', starting + washing);
    set('qStatActiveSub', washing + ' washing · ' + starting + ' starting');
    set('qStatFree', free + ' / ' + names.length);
    set('qStatCompleted', lastCompletedToday.length);
  }

  async function loadQueue() {
    try {
      var jcRes = await fetch('/api/jobcards');
      var bkRes = await fetch('/api/bookings');
      var bayRes = await fetch('/api/bays');
      if (!jcRes.ok || !bkRes.ok || !bayRes.ok) {
        var queueWaitlistRows = document.getElementById('queueWaitlistRows');
        if (queueWaitlistRows) {
          queueWaitlistRows.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;padding:2rem;">Failed to load data. The database connection might be down.</td></tr>';
        }
        return;
      }

      var jobcards = await jcRes.json();
      var bookings = await bkRes.json();
      var bays = await bayRes.json();

      window._bayTabsState = window._bayTabsState || {};
      
      var activeBays = {};
      var bayIdByName = {};
      bays.forEach(function (bay) {
        activeBays[bay.name] = [];
        bayIdByName[bay.name] = bay.id;
      });

      jobcards.forEach(function (card) {
        if (card.stage !== 'completed' && card.stage !== 'cancelled' && activeBays[card.bay] !== undefined) {
          activeBays[card.bay].push(card);
        }
      });

      if (baysGrid) {
        baysGrid.innerHTML = '';
        var bayNames = Object.keys(activeBays);
        if (baySortMode !== 'default') {
          bayNames = bayNames.slice().sort(function (a, b) {
            var cA = activeBays[a].length ? activeBays[a][0] : null;
            var cB = activeBays[b].length ? activeBays[b][0] : null;
            return bayRank(cA, baySortMode) - bayRank(cB, baySortMode);
          });
        }
        bayNames.forEach(function (bayName) {
          var cards = activeBays[bayName];
          if (cards.length) {
            // Sort them so oldest is first (index 0) if desired. The array is currently newest first because of getJobCards order.
            // Let's reverse it so the oldest is first, or keep newest. We will just keep the array as is.
          }
          
          if (window._bayTabsState[bayName] === undefined || window._bayTabsState[bayName] >= cards.length) {
             window._bayTabsState[bayName] = 0;
          }
          var activeIndex = window._bayTabsState[bayName];
          var card = cards.length > 0 ? cards[activeIndex] : null;
          
          var bayId = bayIdByName[bayName];
          var el = document.createElement('div');
          el.className = 'card bay-card';
          el.setAttribute('data-bay-id', bayId);
          el.setAttribute('data-bay-name', bayName);
          var bayActionsHtml =
            '<span class="bay-actions">' +
              '<button type="button" class="bay-action-btn delete" data-bay-action="delete-bay" title="Delete bay">' + BAY_TRASH_SVG + '</button>' +
            '</span>';
            
          if (card) {
            var isWashing = card.stage === 'inprogress';
            el.classList.add(isWashing ? 'bay-card--washing' : 'bay-card--starting');
            var statusStyle = isWashing
              ? 'background:#E7F7EE;color:#166534;'
              : 'background:#FFF4E0;color:#92400E;';
            var dotColor = isWashing ? '#16a34a' : '#d97706';
            var heroStyle = isWashing
              ? 'background:#E7F7EE;color:#16a34a;'
              : 'background:#FFF4E0;color:#d97706;';
            var stageLabel = isWashing ? 'Washing' : 'Starting';
            var vehicleParts = parseVehicleString(card.vehicle);
            var bayStartDate = getBayStartDate(card);
            var startTimeLabel = bayStartDate ? formatTime12(bayStartDate) : '—';
            var elapsedLabel = bayStartDate ? formatElapsedMinutes(bayStartDate) : '—';
            el.innerHTML =
              '<div class="bay-head">' +
                '<span class="bay-name"><span class="bay-dot" style="background:' + dotColor + ';"></span>' + escapeHtml(bayName) + '</span>' +
                '<span class="status-pill" style="' + statusStyle + '">' + stageLabel.toUpperCase() + '</span>' +
                bayActionsHtml +
              '</div>' +
              '<div class="bay-body">' +
                '<div class="bay-hero" style="' + heroStyle + '">' + WL_CAR_ICON_SVG + '</div>' +
                '<div class="bay-info">' +
                  '<div class="bay-vehicle">' + escapeHtml(vehicleParts.plate) + '</div>' +
                  (vehicleParts.model ? '<div class="bay-model">' + escapeHtml(vehicleParts.model) + '</div>' : '') +
                  '<div class="bay-service" title="' + escapeHtml(card.service) + '">' + escapeHtml(card.service) + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="bay-footer"><i class="ti ti-id-badge-2"></i>Staff: ' + escapeHtml(card.staff || 'Unassigned') + '</div>' +
              '<div class="bay-meta">' +
                '<span class="bay-meta-item"><i class="ti ti-calendar-event"></i>Started: ' + escapeHtml(startTimeLabel) + '</span>' +
                '<span class="bay-meta-item"><i class="ti ti-clock-hour-4"></i>' + escapeHtml(elapsedLabel) + '</span>' +
              '</div>' +
              '<button type="button" class="btn view-job-btn" data-view-job="' + escapeHtml(card.id) + '" style="margin-bottom:8px;"><i class="ti ti-clipboard-check"></i>View Job Card</button>';
              
            // Add tabs if multiple
            if (cards.length > 1) {
               var tabsHtml = '<div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:4px;margin-top:4px;">';
               cards.forEach(function(c, idx) {
                  var isActive = idx === activeIndex;
                  var bg = isActive ? '#f97316' : '#f1f5f9';
                  var fg = isActive ? '#fff' : '#64748b';
                  var plate = parseVehicleString(c.vehicle).plate || c.id;
                  tabsHtml += '<button type="button" class="bay-tab-btn" data-bay-name="'+escapeHtml(bayName)+'" data-tab-index="'+idx+'" style="flex:1;font-size:11px;padding:4px 8px;border:none;border-radius:4px;background:'+bg+';color:'+fg+';cursor:pointer;white-space:nowrap;font-weight:600;">' + escapeHtml(plate) + '</button>';
               });
               tabsHtml += '</div>';
               el.innerHTML += tabsHtml;
            }
          } else {
            el.classList.add('bay-card--empty');
            el.innerHTML =
              '<div class="bay-header-row"><span class="bay-name"><span class="bay-dot" style="background:#94a3b8;"></span>' + escapeHtml(bayName) + '</span><span class="status-pill" style="background:#F1F2F4;color:#475569;">Empty</span>' + bayActionsHtml + '</div>' +
              '<div class="bay-empty-state">' +
                '<div class="bay-empty-icon">' + WL_CAR_ICON_SVG + '</div>' +
                '<div class="bay-empty-title">No vehicle</div>' +
                '<div class="bay-empty-sub">Bay is available</div>' +
              '</div>';
          }
          baysGrid.appendChild(el);
        });
      }

      lastWaitingBookings = bookings.filter(function (b) {
        return b.status === 'waiting' || b.status === 'confirmed';
      });
      renderWaitlist();
      renderCompleted(jobcards);
      updateQueueStats(activeBays);

    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  }

  async function populateStaffDropdown() {
    var dropdown = document.getElementById('abStaff');
    if (!dropdown) return;
    try {
      var res = await fetch('/api/staff');
      if (res.ok) {
        var staff = await res.json();
        dropdown.innerHTML = '<option value="">Select staff</option>';
        staff.forEach(function (st) {
          var opt = document.createElement('option');
          opt.value = st.name;
          opt.textContent = st.name;
          dropdown.appendChild(opt);
        });
        if (staff.length === 0) {
          dropdown.innerHTML = '<option value="">No staff configured</option>';
        }
      }
    } catch (e) {
      console.error('Failed to populate staff dropdown:', e);
    }
  }

  async function populateBayDropdown() {
    var dropdown = document.getElementById('abBay');
    if (!dropdown) return;
    try {
      var res = await fetch('/api/bays');
      if (res.ok) {
        var bays = await res.json();
        dropdown.innerHTML = '<option value="">Select bay</option>';
        bays.forEach(function (bay) {
          var opt = document.createElement('option');
          opt.value = bay.name;
          opt.textContent = bay.name;
          dropdown.appendChild(opt);
        });
        if (bays.length === 0) {
          dropdown.innerHTML = '<option value="">No bays configured</option>';
        }
      }
    } catch (e) {
      console.error('Failed to populate bay dropdown:', e);
    }
  }

  async function openAssignModal(id, vehicle, vehiclePlate, service, customer, phone, branchId) {
    document.getElementById('abBookingId').value = id;
    var displayVal = vehiclePlate ? vehiclePlate + ' (' + vehicle + ')' : vehicle;
    document.getElementById('abVehicle').value = displayVal;
    document.getElementById('abService').value = service;
    document.getElementById('abCustomer').value = customer || '';
    document.getElementById('abPhone').value = phone || '';
    document.getElementById('abBranchId').value = branchId || '';
    await populateStaffDropdown();
    await populateBayDropdown();
    window.SW.openModal('assignBookingModal');
  }

  async function removeBay(bayId, bayName) {
    if (!confirm('Are you sure you want to delete bay "' + bayName + '"?')) return;
    try {
      var res = await fetch('/api/bays/' + bayId, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        if (window.SW) window.SW.showToast('Bay removed: ' + bayName);
        loadQueue();
      } else {
        alert('Could not delete bay.');
      }
    } catch (err) {
      console.error(err);
      alert('A connection error occurred.');
    }
  }

  if (baysGrid) {
    baysGrid.addEventListener('click', function (e) {
      var tabBtn = e.target.closest('.bay-tab-btn');
      if (tabBtn) {
        var bName = tabBtn.getAttribute('data-bay-name');
        var tIdx = parseInt(tabBtn.getAttribute('data-tab-index'), 10);
        window._bayTabsState[bName] = tIdx;
        loadQueue(); // re-render quickly
        return;
      }

      var viewJobBtn = e.target.closest('[data-view-job]');
      if (viewJobBtn) {
        window.location.href = '/jobcards?id=' + encodeURIComponent(viewJobBtn.getAttribute('data-view-job'));
        return;
      }

      var target = e.target.closest('[data-bay-action]');
      if (!target) return;
      var cardEl = target.closest('.bay-card');
      if (!cardEl) return;
      var bayId = cardEl.getAttribute('data-bay-id');
      var bayName = cardEl.getAttribute('data-bay-name');
      if (target.getAttribute('data-bay-action') === 'delete-bay') {
        removeBay(bayId, bayName);
      }
    });
  }

  var baySortToggle = document.getElementById('baySortToggle');
  var baySortMenu = document.getElementById('baySortMenu');
  if (baySortToggle && baySortMenu) {
    baySortToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !baySortMenu.classList.contains('open');
      document.querySelectorAll('.dropdown-menu.open').forEach(function (menu) {
        menu.classList.remove('open');
      });
      if (willOpen) baySortMenu.classList.add('open');
    });
    baySortMenu.addEventListener('click', function (e) {
      e.stopPropagation();
      var item = e.target.closest('.dropdown-item[data-sort]');
      if (!item) return;
      baySortMode = item.getAttribute('data-sort');
      baySortMenu.querySelectorAll('.dropdown-item').forEach(function (opt) {
        opt.classList.toggle('active', opt === item);
      });
      baySortMenu.classList.remove('open');
      loadQueue();
    });
  }

  var addBayBtn = document.getElementById('addBayBtn');
  var addBayForm = document.getElementById('addBayForm');
  if (addBayBtn) {
    addBayBtn.addEventListener('click', function () {
      document.getElementById('newBayName').value = '';
      window.SW.openModal('addBayModal');
    });
  }
  if (addBayForm) {
    addBayForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('newBayName').value.trim();
      if (!name) return;
      try {
        var res = await fetch('/api/bays', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ name: name })
        });
        if (res.ok) {
          window.SW.closeModal('addBayModal');
          window.SW.showToast('Bay added successfully');
          addBayForm.reset();
          loadQueue();
        } else {
          var errData = await res.json().catch(()=>({}));
          alert(errData.message || 'Could not add the bay. Please try again.');
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred. Please try again.');
      }
    });
  }

  var editWaitlistForm = document.getElementById('editWaitlistForm');
  if (editWaitlistForm) {
    editWaitlistForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var id = document.getElementById('ewId').value;
      var payload = {
        customer: document.getElementById('ewCustomer').value.trim(),
        phone: document.getElementById('ewPhone').value.trim(),
        vehicle_plate: document.getElementById('ewVehiclePlate').value.trim(),
        vehicle: document.getElementById('ewVehicle').value.trim(),
        service: document.getElementById('ewService').value.trim()
      };

      try {
        var res = await fetch('/api/bookings/' + id, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          window.SW.closeModal('editWaitlistModal');
          window.SW.showToast('Booking updated successfully');
          await loadQueue();
        } else {
          alert('Could not update the booking. Please try again.');
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred. Please try again.');
      }
    });
  }

  if (waitlistRows) {
    waitlistRows.addEventListener('click', async function (e) {
      var startBtn = e.target.closest('.start-wash-btn');
      var deleteBtn = e.target.closest('.delete-booking-btn');
      var editBtn = e.target.closest('.edit-booking-btn');

      if (!startBtn && !deleteBtn && !editBtn) return;

      var row = e.target.closest('.wl-row');
      if (!row) return;

      var id = row.getAttribute('data-id');
      var customer = row.getAttribute('data-customer');

      if (editBtn) {
        document.getElementById('ewId').value = id;
        document.getElementById('ewCustomer').value = customer || '';
        document.getElementById('ewPhone').value = row.getAttribute('data-phone') || '';
        document.getElementById('ewVehiclePlate').value = row.getAttribute('data-vehicle-plate') || '';
        document.getElementById('ewVehicle').value = row.getAttribute('data-vehicle') || '';
        document.getElementById('ewService').value = row.getAttribute('data-service') || '';
        window.SW.openModal('editWaitlistModal');
        return;
      }

      if (deleteBtn) {
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
            await loadQueue();
          } else {
            alert('Could not delete booking.');
          }
        } catch (err) {
          console.error(err);
          alert('A connection error occurred.');
        }
        return;
      }

      if (startBtn) {
        var phone = row.getAttribute('data-phone');
        var vehicle = row.getAttribute('data-vehicle') || customer;
        var vehiclePlate = row.getAttribute('data-vehicle-plate') || '';
            var service = row.getAttribute('data-service');
        var branchId = row.getAttribute('data-branch-id');

        openAssignModal(id, vehicle, vehiclePlate, service, customer, phone, branchId);
      }
    });
  }

  var assignForm = document.getElementById('assignBookingForm');
  if (assignForm) {
    assignForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var submitBtn = assignForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.pointerEvents = 'none';
      }

      var id = document.getElementById('abBookingId').value;
      var vehicle = document.getElementById('abVehicle').value.trim();
      var service = document.getElementById('abService').value;
      var bay = document.getElementById('abBay').value;
      var staff = document.getElementById('abStaff').value;
      var customer = document.getElementById('abCustomer').value.trim();
      var phone = document.getElementById('abPhone').value.trim();
      var branchId = document.getElementById('abBranchId').value;

      try {
        // 1. Create Job Card
        var jcRes = await fetch('/api/jobcards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            booking_id: id || null,
            customer: customer,
            phone: phone,
            vehicle: vehicle,
            service: service,
            bay: bay,
            staff: staff,
            branch_id: branchId || null
          })
        });

        if (!jcRes.ok) {
          var err = await jcRes.json().catch(function () { return {}; });
          alert(err.message || 'Could not start the wash right now. Please check the form and try again.');
          console.error('Error creating job card:', err);
          return;
        }

        // 2. Update Booking Status to checked_in (removed from waitlist) — only when
        // this wash came from an existing booking, not a walk-in started from a bay card.
        if (id) {
          var bkRes = await fetch('/api/bookings/' + id, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ status: 'checked_in' })
          });

          if (!bkRes.ok) {
            alert('Failed to update booking status');
            return;
          }
        }

        window.SW.closeModal('assignBookingModal');
        window.SW.showToast('Wash started for ' + vehicle);
        assignForm.reset();
        loadQueue();
      } catch (err) {
        console.error(err);
        alert('A connection error occurred. Please try again.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.style.pointerEvents = 'auto';
        }
      }
    });
  }

  loadQueue();
  setInterval(loadQueue, 5000);
})();
