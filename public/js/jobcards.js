// Page-specific behavior for jobcards.html
(function () {
  var newBtn = document.getElementById('newJobCardBtn');
  var newForm = document.getElementById('newJobCardForm');
  var detailBody = document.getElementById('jobCardModalBody');
  var detailFooter = document.getElementById('jobCardModalFooter');
  var detailTitle = document.getElementById('jobCardModalTitle');
  var tableRows = document.getElementById('jcTableRows');
  if (!tableRows) return;

  var STAGE_ORDER = ['assigned', 'inprogress', 'completed'];
  var STAGE_LABEL = { assigned: 'Assigned', inprogress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
  var STAGE_COLOR = {
    assigned: { bg: '#EFF6FF', text: '#1D4ED8' },
    inprogress: { bg: '#FFF4E0', text: '#92400E' },
    completed: { bg: '#E7F7EE', text: '#166534' }
  };
  var PAGE_SIZE = 8;
  var CAR_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle><path d="M9 17h6"></path></svg>';

  var JOBCARDS = [];
  var currentPage = 1;
  var appliedFilters = { search: '', bay: '', service: '', date: todayDateString() };

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function toDateKey(date) { return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()); }
  function todayDateString() { return toDateKey(new Date()); }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function findCard(id) {
    return JOBCARDS.filter(function (c) { return c.id === id; })[0];
  }

  function stageColor(stage) {
    return STAGE_COLOR[stage] || STAGE_COLOR.assigned;
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

  function getJobStartDate(card) {
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
    if (card.created_at) {
      var fromCreated = new Date(card.created_at);
      if (!isNaN(fromCreated.getTime())) return fromCreated;
    }
    return null;
  }

  function jobCardSubLabel(card) {
    if (card.stage === 'completed') {
      var completedDate = card.completed_at_at ? new Date(card.completed_at_at) : null;
      var t = (completedDate && !isNaN(completedDate.getTime())) ? formatTime12(completedDate) : (card.signedOffTime || '');
      return 'Completed' + (t ? ' ' + t : '');
    }
    if (card.stage === 'inprogress') {
      var startDate = getJobStartDate(card);
      return 'Started' + (startDate ? ' ' + formatTime12(startDate) : '');
    }
    var createdDate = card.created_at ? new Date(card.created_at) : null;
    return 'Created' + ((createdDate && !isNaN(createdDate.getTime())) ? ' ' + formatTime12(createdDate) : '');
  }

  function assignedToLabel(card) {
    if (card.stage === 'completed') return card.signedOffBy || 'Customer';
    return card.staff || 'Unassigned';
  }

  function applyFilters(cards) {
    return cards.filter(function (card) {
      if (appliedFilters.bay && card.bay !== appliedFilters.bay) return false;
      if (appliedFilters.service && String(card.service || '').toLowerCase().indexOf(appliedFilters.service.toLowerCase()) === -1) return false;
      if (appliedFilters.date) {
        var ref = card.created_at ? new Date(card.created_at) : null;
        if (!ref || isNaN(ref.getTime()) || toDateKey(ref) !== appliedFilters.date) return false;
      }
      if (appliedFilters.search) {
        var term = appliedFilters.search.toLowerCase();
        var haystack = [card.id, card.vehicle, card.customer].filter(Boolean).join(' ').toLowerCase();
        if (haystack.indexOf(term) === -1) return false;
      }
      return true;
    });
  }

  function paymentBadgeHtml(card) {
    if (!card.invoice) return '';
    var paid = card.invoice.status === 'paid';
    return '<div style="margin-top:4px;"><span class="tag" style="' + (paid ? 'background:#E7F7EE;color:#166534;' : 'background:#fdecec;color:#991b1b;') + '">' + (paid ? 'Paid' : 'Payment Pending') + '</span></div>';
  }

  function rowActionHtml(card, color) {
    if (card.stage === 'cancelled') return '<span style="color:#94a3b8; font-size:12px; font-weight:600;">Cancelled</span>';
    if (card.stage === 'assigned') {
      return '<button type="button" class="btn jc-action-btn" data-action="start" style="color:' + color.text + ';border-color:' + color.text + ';"><i class="ti ti-check"></i>Start Job</button>';
    }
    if (card.stage === 'inprogress') {
      return '<button type="button" class="btn jc-action-btn" data-action="view" style="color:' + color.text + ';border-color:' + color.text + ';">View Progress<i class="ti ti-chevron-down" style="transform:rotate(-90deg);display:inline-block;"></i></button>';
    }
    return '<button type="button" class="btn jc-action-btn" data-action="pay" style="color:' + color.text + ';border-color:' + color.text + ';"><i class="ti ti-credit-card"></i>Make Payment</button>';
  }

  // Job card note, falling back to the note written on the original booking
  function noteCellHtml(card) {
    var clean = function (v) { v = String(v == null ? '' : v).trim(); return v.toLowerCase() === 'null' ? '' : v; };
    var note = clean(card.note).replace(/\[CANCELLED REASON\]\s*/g, 'Cancelled: ');
    var fromBooking = false;
    if (!note) { note = clean(card.booking_notes); fromBooking = !!note; }
    if (!note) return '<span class="jc-note-empty">—</span>';
    return '<div class="jc-note" title="' + escapeHtml(note) + '">' +
      (fromBooking ? '<span class="jc-note-src">Booking</span>' : '') + escapeHtml(note) + '</div>';
  }

  function rowHtml(card, slNo) {
    var color = stageColor(card.stage);
    var rowStyle = card.stage === 'cancelled' ? 'opacity: 0.5; pointer-events: auto; background-color: #f9fafb;' : '';
    var services = String(card.service || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var serviceHtml = services.map(function (s) { return '<div class="jc-service-item">&bull; ' + escapeHtml(s) + '</div>'; }).join('');
    var serviceCellHtml = services.length
      ? '<div class="jc-service-clamp" title="' + escapeHtml(services.join(', ')) + '">' + serviceHtml + '</div>'
      : '—';
    var startDate = getJobStartDate(card);

    return '<tr data-id="' + escapeHtml(card.id) + '" style="' + rowStyle + '" class="' + (card.stage === 'cancelled' ? 'cancelled-row' : '') + '">' +
      '<td class="jc-td-sl">' + slNo + '</td>' +
      '<td><div class="jc-id" style="color:' + color.text + ';">#' + escapeHtml(card.id) + '</div><div class="jc-row-sub">' + escapeHtml(jobCardSubLabel(card)) + '</div></td>' +
      '<td><div class="jc-vc-cell"><div class="jc-vc-icon">' + CAR_ICON_SVG + '</div><div><div class="jc-row-primary">' + escapeHtml(card.vehicle) + '</div><div class="jc-row-sub"><i class="ti ti-users"></i>' + escapeHtml(card.customer || '—') + '</div></div></div></td>' +
      '<td>' + serviceCellHtml + '</td>' +
      '<td><span class="jc-bay-pill" style="background:' + color.bg + ';color:' + color.text + ';">' + escapeHtml(card.bay || '—') + '</span></td>' +
      '<td><div class="jc-row-primary"><i class="ti ti-users"></i>' + escapeHtml(assignedToLabel(card)) + '</div></td>' +
      '<td><div class="jc-row-primary"><i class="ti ti-clock-hour-4"></i>' + (startDate ? formatTime12(startDate) : '—') + '</div></td>' +
      '<td class="jc-td-note">' + noteCellHtml(card) + '</td>' +
      '<td><span class="status-pill" style="background:' + color.bg + ';color:' + color.text + ';">' + STAGE_LABEL[card.stage] + '</span>' + (card.stage === 'completed' ? paymentBadgeHtml(card) : '') + '</td>' +
      '<td><div class="jc-actions">' + rowActionHtml(card, color) +
        (card.stage === 'assigned' ?
          '<button type="button" class="jc-edit-btn" data-id="' + escapeHtml(card.id) + '" title="Edit job card" aria-label="Edit job card">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
          '</button>' +
          '<button type="button" class="jc-delete-btn" data-id="' + escapeHtml(card.id) + '" title="Cancel job" aria-label="Cancel job">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>' +
          '</button>'
        : '') +
      '</div></td>' +
    '</tr>';
  }

  var jcPagePrevBtn = document.getElementById('jcPagePrev');
  var jcPageNextBtn = document.getElementById('jcPageNext');
  if (jcPagePrevBtn) jcPagePrevBtn.addEventListener('click', function () { if (currentPage > 1) { currentPage--; renderTable(); } });
  if (jcPageNextBtn) jcPageNextBtn.addEventListener('click', function () { currentPage++; renderTable(); });

  function renderPager(totalCount, totalPages, start) {
    var pageInfo = document.getElementById('jcPageInfo');
    if (pageInfo) {
      if (totalCount === 0) {
        pageInfo.textContent = 'Showing 0 of 0 entries';
      } else {
        var rangeStart = start + 1;
        var rangeEnd = Math.min(start + PAGE_SIZE, totalCount);
        pageInfo.textContent = 'Showing ' + rangeStart + ' to ' + rangeEnd + ' of ' + totalCount + ' entries';
      }
    }

    if (window.SW && SW.renderPager) {
      SW.renderPager(document.getElementById('jcPagePrev'), document.getElementById('jcPageNext'), currentPage, totalPages, function (p) { currentPage = p; renderTable(); });
    }
  }

  function renderTable() {
    var filtered = applyFilters(JOBCARDS);
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * PAGE_SIZE;
    var pageCards = filtered.slice(start, start + PAGE_SIZE);

    if (filtered.length === 0) {
      tableRows.innerHTML = '<tr class="jc-empty-row"><td colspan="10"><div class="jc-empty">' +
        '<span class="jc-empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h5"/><path d="M15 4.5h2a2 2 0 0 1 2 2V12"/><rect x="9" y="3" width="6" height="3.2" rx="1"/><path d="M9 10.5h6M9 14h3.5"/></svg>' +
        '<span class="jc-empty-badge"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></span></span>' +
        '<div class="jc-empty-title">No Job Cards Found.</div>' +
        '<div class="jc-empty-sub">Try adjusting your search or filter options.</div>' +
      '</div></td></tr>';
    } else {
      tableRows.innerHTML = pageCards.map(function (card, i) { return rowHtml(card, start + i + 1); }).join('');
    }

    renderPager(filtered.length, totalPages, start);
  }

  tableRows.addEventListener('click', async function (e) {
    var deleteBtn = e.target.closest('.jc-delete-btn');
    if (deleteBtn) {
      e.stopPropagation();
      var deleteCard = findCard(deleteBtn.getAttribute('data-id'));
      if (!deleteCard) return;
      
      var reason = prompt('Please enter a reason for cancelling Job #' + deleteCard.id + ':');
      if (reason === null) return; // User clicked Cancel
      
      deleteCard.stage = 'cancelled';
      deleteCard.note = '[CANCELLED REASON] ' + (reason.trim() || 'No reason provided') + '\n' + (deleteCard.note || '');
      
      try {
          var res = await fetch('/api/jobcards/' + deleteCard.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ stage: 'cancelled', note: deleteCard.note,  })
          });
          if (res.ok) {
              window.SW.showToast('Job cancelled: #' + deleteCard.id);
              loadJobCards();
          } else {
              alert('Failed to cancel job card.');
          }
      } catch (err) {
          console.error(err);
          alert('Error cancelling job.');
      }
      return;
    }
    
    var cancelledRow = e.target.closest('.cancelled-row');
    if (cancelledRow && !e.target.closest('.jc-action-btn') && !e.target.closest('.jc-edit-btn') && !e.target.closest('.jc-delete-btn')) {
      e.stopPropagation();
      var card = findCard(cancelledRow.getAttribute('data-id'));
      if (card && card.note && card.note.includes('[CANCELLED REASON]')) {
         var reasonMatch = card.note.match(/\[CANCELLED REASON\] (.*)/);
         var reasonText = reasonMatch ? reasonMatch[1] : 'Unknown';
         alert('Cancellation Reason: ' + reasonText);
      } else {
         alert('This job was cancelled.');
      }
      return;
    }


    var editBtn = e.target.closest('.jc-edit-btn');
    if (editBtn) {
      e.stopPropagation();
      var editCard = findCard(editBtn.getAttribute('data-id'));
      if (editCard) openEditJobCardModal(editCard);
      return;
    }

    var row = e.target.closest('tr[data-id]');
    if (!row) return;
    var card = findCard(row.getAttribute('data-id'));
    if (!card) return;

    var actionBtn = e.target.closest('.jc-action-btn');
    if (actionBtn) {
      var action = actionBtn.getAttribute('data-action');
      if (action === 'start') {
        if (actionBtn.disabled) return;
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="ti ti-loader"></i>Starting...';
        fetch('/api/jobcards/' + card.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ stage: 'inprogress', })
        }).then(function(res) {
          if (res.ok) {
            window.SW.showToast('#' + card.id + ' moved to In Progress');
            loadJobCards();
          } else {
            actionBtn.disabled = false;
            actionBtn.innerHTML = '<i class="ti ti-check"></i>Start Job';
            res.json().then(function(errData) {
              alert(errData.message || 'Could not start the job.');
            });
          }
        }).catch(function(err) {
          console.error(err);
          actionBtn.disabled = false;
          actionBtn.innerHTML = '<i class="ti ti-check"></i>Start Job';
          alert('A connection error occurred.');
        });
        return;
      }
      if (action === 'pay') {
        if (card.invoice && card.invoice.id) {
          localStorage.setItem('sw_focus_invoice', card.invoice.id);
        }
        window.location.href = '/payments';
        return;
      }
      openDetail(card.id);
      return;
    }
    // Clicking blank row space does nothing — the popup only opens from an
    // explicit action button (View / View Progress), not just-loading a row.
  });

  // Resize/compress one file with a canvas, then upload it to a job card.
  // Resolves with the updated card, or rejects with a message, and never
  // rejects with a thrown error (callers loop over many files and shouldn't
  // stop early). type is 'before', 'after', or null/undefined for the
  // general photo bucket.
  function resizeAndUploadPhoto(cardId, type, file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function (event) {
        var img = new Image();
        img.src = event.target.result;
        img.onload = function () {
          var canvas = document.createElement('canvas');
          var max_size = 1200; // maximum width or height
          var width = img.width;
          var height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(async function (blob) {
            var formData = new FormData();
            formData.append('photo', blob, 'photo.jpg');
            if (type) formData.append('type', type);

            try {
              var response = await fetch('/api/jobcards/' + cardId + '/photos', {
                method: 'POST',
                body: formData,
                headers: {
                  'Accept': 'application/json'
                }
              });

              if (response.ok) {
                resolve(await response.json());
              } else {
                var errMsg = 'Failed to upload photo';
                try {
                  var errRes = await response.json();
                  if (errRes && errRes.message) errMsg = errRes.message;
                } catch (e) {}
                reject(errMsg);
              }
            } catch (err) {
              console.error('Photo upload error:', err);
              reject('An error occurred during photo upload.');
            }
          }, 'image/jpeg', 0.85); // 85% quality JPEG
        };
      };
    });
  }

  // Runs a multi-file <input type="file"> picker, uploading each selected
  // file to cardId one at a time (sequential — the server increments the
  // photo counter per call, so parallel requests would race on it). Calls
  // onDone(uploadedCount, failedCount, lastUpdatedCard) once all finish.
  function buildPhotoTilesHtml(cardId, photoCount, updatedAt) {
    var html = '';
    for (var i = 1; i <= photoCount; i++) {
      var imgSrc = '/uploads/jobcards/jc_' + cardId + '_' + i + '.jpg?t=' + (updatedAt ? new Date(updatedAt).getTime() : '');
      html += '<div class="photo-ph" style="background-image: url(\'' + imgSrc + '\'); background-size: cover; background-position: center;"></div>';
    }
    return html;
  }

  function buildTypedPhotoTilesHtml(cardId, type, photoCount, updatedAt) {
    var html = '';
    for (var i = 1; i <= photoCount; i++) {
      var imgSrc = '/uploads/jobcards/jc_' + cardId + '_' + type + '_' + i + '.jpg?t=' + (updatedAt ? new Date(updatedAt).getTime() : '');
      html += '<div class="photo-ph" style="background-image: url(\'' + imgSrc + '\'); background-size: cover; background-position: center;"></div>';
    }
    return html;
  }

  function pickAndUploadPhotos(cardId, type, capture, onDone) {
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

    input.addEventListener('change', async function () {
      var files = input.files ? Array.prototype.slice.call(input.files) : [];
      document.body.removeChild(input);
      if (!files.length) return;

      var uploaded = 0;
      var failed = 0;
      var updatedCard = null;

      for (var i = 0; i < files.length; i++) {
        try {
          updatedCard = await resizeAndUploadPhoto(cardId, type, files[i]);
          uploaded++;
        } catch (errMsg) {
          failed++;
          console.error('Photo upload error:', errMsg);
        }
      }

      onDone(uploaded, failed, updatedCard);
    });

    input.click();
  }

  function openDetail(id) {
    var card = findCard(id);
    if (!card) return false;
    renderDetail(card);
    return true;
  }

  function renderDetail(card) {
    var color = stageColor(card.stage);
    var rowStyle = card.stage === 'cancelled' ? 'opacity: 0.5; pointer-events: auto; background-color: #f9fafb;' : '';
    detailTitle.innerHTML =
      '<span class="jc-modal-id">#' + escapeHtml(card.id) + '</span>' +
      '<span class="status-pill" style="background:' + color.bg + ';color:' + color.text + ';">' + STAGE_LABEL[card.stage] + '</span>';

    function metaItem(icon, label, value) {
      return '<span class="jc-meta-item"><i class="ti ' + icon + '"></i><span class="jc-meta-label">' + label + '</span><span class="jc-meta-value">' + escapeHtml(value) + '</span></span>';
    }
    var metaParts = [];
    if (card.staff) metaParts.push(metaItem('ti-users', 'Staff', card.staff));
    if (card.bay) metaParts.push(metaItem('ti-map-pin', 'Bay', card.bay));
    if (card.startedAt) metaParts.push(metaItem('ti-clock-hour-4', 'Started', card.startedAt));
    if (card.invoice) {
      var paid = card.invoice.status === 'paid';
      metaParts.push('<span class="jc-meta-item"><i class="ti ti-credit-card"></i><span class="jc-meta-label">Payment</span><span class="jc-meta-value" style="color:' + (paid ? '#166534' : '#991b1b') + ';">' + (paid ? 'Paid' : 'Pending') + '</span></span>');
    }

    var doneCount = card.checklist.filter(function (item) { return item.done; }).length;
    var totalCount = card.checklist.length;
    var progressPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

    var checklistHtml = card.checklist.map(function (item, i) {
      return '<div class="jc-checklist-row' + (item.done ? ' done' : '') + '" data-index="' + i + '">' +
        '<span class="jc-check"><i class="ti ti-check"></i></span>' +
        '<span class="jc-checklist-label">' + escapeHtml(item.label) + '</span>' +
        '<button type="button" class="jc-checklist-delete" data-index="' + i + '" title="Remove item"><i class="ti ti-x"></i></button>' +
      '</div>';
    }).join('');

    detailBody.innerHTML =
      '<div class="jc-modal-vehicle">' +
        '<div class="jc-vc-icon">' + CAR_ICON_SVG + '</div>' +
        '<div><div class="jcard-name">' + escapeHtml(card.vehicle) + '</div><div class="jc-row-sub">' + escapeHtml(card.service) + '</div></div>' +
      '</div>' +
      '<div class="jc-meta">' + metaParts.join('') + '</div>' +
      '<div class="section-block jc-modal-section">' +
        '<div class="jc-modal-section-head"><h3>Checklist</h3><span class="jc-checklist-count">' + doneCount + '/' + totalCount + '</span></div>' +
        '<div class="jc-progress-track"><div class="jc-progress-fill" style="width:' + progressPct + '%;"></div></div>' +
        '<div id="jcChecklistBox">' + checklistHtml + '</div>' +
        '<div class="jc-checklist-add">' +
          '<input type="text" id="jcNewChecklistItem" placeholder="Add checklist item...">' +
          '<button type="button" class="btn btn-accent" id="jcAddChecklistBtn"><i class="ti ti-plus"></i>Add</button>' +
        '</div>' +
      '</div>' +
      '<div class="section-block jc-modal-section">' +
        '<h3>Before Photos</h3>' +
        '<div class="jc-photo-grid" id="jcBeforeGrid">' + 
          buildPhotoTilesHtml(card.id, card.photos || 0, card.updated_at) +
          buildTypedPhotoTilesHtml(card.id, 'before', card.photos_before || 0, card.updated_at) + 
          '<button type="button" class="jc-add-photo" id="jcAddBeforePhoto" title="Upload from gallery"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 9l5 -5l5 5" /><path d="M12 4l0 12" /></svg></button>' +
          '<button type="button" class="jc-add-photo" id="jcCaptureBeforePhoto" title="Take photo directly"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" /><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg></button>' +
        '</div>' +
      '</div>' +
      '<div class="section-block jc-modal-section">' +
        '<h3>After Photos</h3>' +
        '<div class="jc-photo-grid" id="jcAfterGrid">' + buildTypedPhotoTilesHtml(card.id, 'after', card.photos_after || 0, card.updated_at) + '<button type="button" class="jc-add-photo" id="jcAddAfterPhoto" title="Upload from gallery"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 9l5 -5l5 5" /><path d="M12 4l0 12" /></svg></button><button type="button" class="jc-add-photo" id="jcCaptureAfterPhoto" title="Take photo directly"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" /><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg></button></div>' +
      '</div>' +
      '<div class="jc-modal-section">' +
        '<h3>Damage note</h3>' +
        '<div class="field"><textarea id="jcNote" placeholder="No damage reported">' + escapeHtml(card.note) + '</textarea></div>' +
      '</div>';

    detailBody.querySelectorAll('#jcChecklistBox .jc-checklist-row').forEach(function (row) {
      row.addEventListener('click', async function () {
        var i = Number(row.getAttribute('data-index'));
        card.checklist[i].done = !card.checklist[i].done;
        row.classList.toggle('done', card.checklist[i].done);
        await saveCard(card);
      });
    });

    detailBody.querySelectorAll('.jc-checklist-delete').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var i = Number(btn.getAttribute('data-index'));
        card.checklist.splice(i, 1);
        renderDetail(card);
        saveCard(card);
      });
    });

    var addChecklistBtn = document.getElementById('jcAddChecklistBtn');
    var newChecklistInput = document.getElementById('jcNewChecklistItem');
    function addChecklistItem() {
      var label = newChecklistInput.value.trim();
      if (!label) return;
      card.checklist.push({ label: label, done: false });
      renderDetail(card);
      saveCard(card);
    }
    if (addChecklistBtn) addChecklistBtn.addEventListener('click', addChecklistItem);
    if (newChecklistInput) {
      newChecklistInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addChecklistItem();
        }
      });
    }

    function bindTypedPhotoButton(btnId, type, capture, fieldName) {
      var btn = document.getElementById(btnId);
      if (!btn) return;
      btn.addEventListener('click', function () {
        pickAndUploadPhotos(card.id, type, capture, function (uploaded, failed, updatedCard) {
          if (updatedCard) {
            card[fieldName] = updatedCard[fieldName];
            card.updated_at = updatedCard.updated_at;
            var localIdx = JOBCARDS.findIndex(function (c) { return c.id === card.id; });
            if (localIdx !== -1) {
              JOBCARDS[localIdx] = updatedCard;
            }
            renderTable();
            openDetail(card.id);
          }

          if (uploaded && !failed) {
            window.SW.showToast(uploaded === 1 ? 'Photo added' : uploaded + ' photos added');
          } else if (uploaded && failed) {
            window.SW.showToast(uploaded + ' added, ' + failed + ' failed');
          } else {
            alert('Failed to upload photo.');
          }
        });
      });
    }

    bindTypedPhotoButton('jcAddBeforePhoto', 'before', false, 'photos_before');
    bindTypedPhotoButton('jcCaptureBeforePhoto', 'before', true, 'photos_before');
    bindTypedPhotoButton('jcAddAfterPhoto', 'after', false, 'photos_after');
    bindTypedPhotoButton('jcCaptureAfterPhoto', 'after', true, 'photos_after');

    renderFooter(card);
    window.SW.openModal('jobCardModal');
  }

  function saveNoteAndChecklist(card) {
    var noteEl = document.getElementById('jcNote');
    if (noteEl) card.note = noteEl.value.trim();
  }

  function renderFooter(card) {
    var html = '<button type="button" class="btn jc-cancel-btn" id="jcCancelBtn"><i class="ti ti-x"></i>Cancel job</button>';
    html += '<span style="flex:1;"></span>';
    if (card.stage === 'cancelled') return '<span style="color:#94a3b8; font-size:12px; font-weight:600;">Cancelled</span>';
    if (card.stage === 'assigned') {
      html += '<button type="button" class="btn btn-accent" id="jcAdvanceBtn"><i class="ti ti-check"></i>Start job</button>';
    } else if (card.stage === 'inprogress') {
      html += '<button type="button" class="btn btn-accent" id="jcAdvanceBtn"><i class="ti ti-check"></i>Completed</button>';
    } else if (card.stage === 'completed') {
      html += '<button type="button" class="btn btn-accent" id="jcPayBtn"><i class="ti ti-credit-card"></i>Make Payment</button>';
    }
    detailFooter.innerHTML = html;
    detailFooter.style.display = 'flex';
    detailFooter.style.alignItems = 'center';

    var cancelBtn = document.getElementById('jcCancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', async function () {
        saveNoteAndChecklist(card);
        card.stage = 'cancelled';
        await saveCard(card);
        window.SW.closeModal('jobCardModal');
        window.SW.showToast('Job cancelled: #' + card.id);
        renderTable();
      });
    }

    var advanceBtn = document.getElementById('jcAdvanceBtn');
    if (advanceBtn) {
      advanceBtn.addEventListener('click', async function () {
        if (advanceBtn.disabled) return;
        advanceBtn.disabled = true;
        advanceBtn.style.opacity = '0.6';
        advanceBtn.style.pointerEvents = 'none';

        try {
          saveNoteAndChecklist(card);
          var idx = STAGE_ORDER.indexOf(card.stage);
          card.stage = STAGE_ORDER[idx + 1];
          if (card.stage === 'completed') {
            card.signedOffBy = 'Customer';
            card.signedOffTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          }
          await saveCard(card);
          window.SW.closeModal('jobCardModal');
          window.SW.showToast('#' + card.id + ' moved to ' + STAGE_LABEL[card.stage]);
          renderTable();
          if (card.stage === 'completed' && window.SW && window.SW.loadGlobal) {
            window.SW.loadGlobal();
          }
        } finally {
          advanceBtn.disabled = false;
          advanceBtn.style.opacity = '1';
          advanceBtn.style.pointerEvents = 'auto';
        }
      });
    }

    var payBtn = document.getElementById('jcPayBtn');
    if (payBtn) {
      payBtn.addEventListener('click', function () {
        if (card.invoice && card.invoice.id) {
          localStorage.setItem('sw_focus_invoice', card.invoice.id);
        }
        window.location.href = '/payments';
      });
    }
  }

  async function populateDropdowns() {
    var svcDropdown = document.getElementById('njService');
    var staffDropdown = document.getElementById('njStaff');

    if (svcDropdown) {
      try {
        var res = await fetch('/api/services?t=' + new Date().getTime());
        if (res.ok) {
          var services = await res.json();
          svcDropdown.innerHTML = '<option value="">Select a service</option>';
          services.forEach(function (s) {
            var opt = document.createElement('option');
            opt.value = s.name;
            opt.textContent = s.name;
            svcDropdown.appendChild(opt);
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (staffDropdown) {
      try {
        var res = await fetch('/api/staff?t=' + new Date().getTime());
        if (res.ok) {
          var staff = await res.json();
          staffDropdown.innerHTML = '<option value="">Select staff</option>';
          staff.forEach(function (st) {
            var opt = document.createElement('option');
            opt.value = st.name;
            opt.textContent = st.name;
            staffDropdown.appendChild(opt);
          });
          if (staff.length === 0) {
            staffDropdown.innerHTML = '<option value="">No staff configured</option>';
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (newBtn) {
    newBtn.addEventListener('click', async function () {
      await populateDropdowns();
      window.SW.openModal('newJobCardModal');
    });
  }

  if (newForm) {
    newForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var customer = document.getElementById('njCustomer').value.trim();
      var vehicle = document.getElementById('njVehicle').value.trim();
      var service = document.getElementById('njService').value;
      var bay = document.getElementById('njBay').value;
      var staff = document.getElementById('njStaff').value;

      try {
        var res = await fetch('/api/jobcards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ customer, vehicle, service, bay, staff,  })
        });

        if (res.ok) {
          window.SW.closeModal('newJobCardModal');
          window.SW.showToast('Job card created successfully');
          newForm.reset();
          await loadJobCards();
        } else {
          var err = await res.json();
          alert('Error: ' + (err.message || 'Could not create job card.'));
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred.');
      }
    });
  }

  // ---------- Start Job popup — capture a starting-condition photo, then confirm ----------
  var sjJobIdInput = document.getElementById('sjJobId');
  var sjPhotoGrid = document.getElementById('sjPhotoGrid');
  var sjAddPhotoBtn = document.getElementById('sjAddPhotoBtn');
  var sjTakePhotoBtn = document.getElementById('sjTakePhotoBtn');
  var sjConfirmBtn = document.getElementById('sjConfirmBtn');

  function openStartJobModal(card) {
    if (sjJobIdInput) sjJobIdInput.value = card.id;
    if (sjPhotoGrid && sjAddPhotoBtn) {
      sjPhotoGrid.innerHTML = buildTypedPhotoTilesHtml(card.id, 'before', card.photos_before || 0, card.updated_at);
      sjPhotoGrid.appendChild(sjAddPhotoBtn);
      if (sjTakePhotoBtn) sjPhotoGrid.appendChild(sjTakePhotoBtn);
    }
    window.SW.openModal('startJobModal');
  }

  function handleSjPhoto(capture) {
    var cardId = sjJobIdInput.value;
    if (!cardId) return;
    pickAndUploadPhotos(cardId, 'before', capture, function (uploaded, failed, updatedCard) {
      if (updatedCard) {
        var localIdx = JOBCARDS.findIndex(function (c) { return c.id === updatedCard.id; });
        if (localIdx !== -1) JOBCARDS[localIdx] = updatedCard;
        sjPhotoGrid.innerHTML = buildTypedPhotoTilesHtml(updatedCard.id, 'before', updatedCard.photos_before || 0, updatedCard.updated_at);
        sjPhotoGrid.appendChild(sjAddPhotoBtn);
        if (sjTakePhotoBtn) sjPhotoGrid.appendChild(sjTakePhotoBtn);
      }
      if (uploaded && !failed) {
        window.SW.showToast(uploaded === 1 ? 'Photo added' : uploaded + ' photos added');
      } else if (uploaded && failed) {
        window.SW.showToast(uploaded + ' added, ' + failed + ' failed');
      } else {
        alert('Failed to upload photo.');
      }
    });
  }

  if (sjAddPhotoBtn) sjAddPhotoBtn.addEventListener('click', function () { handleSjPhoto(false); });
  if (sjTakePhotoBtn) sjTakePhotoBtn.addEventListener('click', function () { handleSjPhoto(true); });

  if (sjConfirmBtn) {
    sjConfirmBtn.addEventListener('click', async function () {
      var id = sjJobIdInput.value;
      if (!id || sjConfirmBtn.disabled) return;
      sjConfirmBtn.disabled = true;
      try {
        var res = await fetch('/api/jobcards/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ stage: 'inprogress',  })
        });
        if (res.ok) {
          window.SW.closeModal('startJobModal');
          window.SW.showToast('#' + id + ' moved to In Progress');
          await loadJobCards();
        } else {
          var errData = await res.json().catch(function() { return {}; });
          alert(errData.message || 'Could not start the job. Please try again.');
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred.');
      } finally {
        sjConfirmBtn.disabled = false;
      }
    });
  }

  // ---------- Edit job card — vehicle/customer/service/staff/bay ----------
  async function openEditJobCardModal(card) {
    document.getElementById('ejId').value = card.id;
    document.getElementById('ejCustomer').value = card.customer || '';
    document.getElementById('ejVehicle').value = card.vehicle || '';
    document.getElementById('ejService').value = card.service || '';

    var baySelect = document.getElementById('ejBay');
    var staffSelect = document.getElementById('ejStaff');

    try {
      var bayRes = await fetch('/api/bays?t=' + new Date().getTime());
      if (bayRes.ok) {
        var bays = await bayRes.json();
        baySelect.innerHTML = '<option value="">Select bay</option>' + bays.map(function (b) {
          return '<option value="' + escapeHtml(b.name) + '"' + (b.name === card.bay ? ' selected' : '') + '>' + escapeHtml(b.name) + '</option>';
        }).join('');
      }
    } catch (e) {
      console.error(e);
    }

    try {
      var staffRes = await fetch('/api/staff?t=' + new Date().getTime());
      if (staffRes.ok) {
        var staffList = await staffRes.json();
        staffSelect.innerHTML = '<option value="">Select staff</option>' + staffList.map(function (s) {
          return '<option value="' + escapeHtml(s.name) + '"' + (s.name === card.staff ? ' selected' : '') + '>' + escapeHtml(s.name) + '</option>';
        }).join('');
      }
    } catch (e) {
      console.error(e);
    }

    window.SW.openModal('editJobCardModal');
  }

  var editJobCardForm = document.getElementById('editJobCardForm');
  if (editJobCardForm) {
    editJobCardForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var id = document.getElementById('ejId').value;
      var payload = {
        customer: document.getElementById('ejCustomer').value.trim(),
        vehicle: document.getElementById('ejVehicle').value.trim(),
        service: document.getElementById('ejService').value.trim(),
        bay: document.getElementById('ejBay').value,
        staff: document.getElementById('ejStaff').value
      };

      try {
        var res = await fetch('/api/jobcards/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          window.SW.closeModal('editJobCardModal');
          window.SW.showToast('Job card updated successfully');
          await loadJobCards();
        } else {
          var editErr = await res.json().catch(function () { return {}; });
          alert('Error: ' + (editErr.message || 'Could not update job card.'));
        }
      } catch (err) {
        console.error(err);
        alert('A connection error occurred.');
      }
    });
  }

  async function saveCard(card) {
    try {
      var noteEl = document.getElementById('jcNote');
      var noteText = noteEl ? noteEl.value.trim() : card.note;

      var res = await fetch('/api/jobcards/' + card.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          stage: card.stage,
          checklist: card.checklist,
          note: noteText,
          photos: card.photos,
          signed_off_by: card.signedOffBy,
          signed_off_time: card.signedOffTime,
          service: card.service
        , })
      });
      if (!res.ok) {
        var err = await res.json().catch(function() { return {}; });
        alert(err.message || 'Failed to save job card.');
        await loadJobCards();
        renderTable();
        throw new Error(err.message || 'Failed to save');
      }
      var data = await res.json();
      await loadJobCards();
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  var searchInput = document.getElementById('jcSearchInput');
  var baySelect = document.getElementById('jcFilterBay');
  var serviceSelect = document.getElementById('jcFilterService');
  var dateInput = document.getElementById('jcFilterDate');
  var applyBtn = document.getElementById('jcApplyFilters');
  var clearBtn = document.getElementById('jcClearFilters');
  var filterToggle = document.getElementById('jcFilterToggle');
  var filterFields = document.getElementById('jcFilterFields');
  var filterBadge = document.getElementById('jcFilterBadge');

  if (dateInput) dateInput.value = appliedFilters.date;

  function updateFilterBadge() {
    if (!filterBadge) return;
    var count = [baySelect && baySelect.value, serviceSelect && serviceSelect.value, dateInput && dateInput.value]
      .filter(Boolean).length;
    filterBadge.textContent = String(count);
    filterBadge.style.display = count > 0 ? '' : 'none';
  }

  if (filterToggle && filterFields) {
    filterToggle.addEventListener('click', function () {
      var open = filterFields.classList.toggle('open');
      filterToggle.classList.toggle('open', open);
    });
  }

  async function populateFilterDropdowns() {
    if (baySelect) {
      try {
        var bayRes = await fetch('/api/bays?t=' + new Date().getTime());
        if (bayRes.ok) {
          var bays = await bayRes.json();
          baySelect.innerHTML = '<option value="">All Bays</option>' + bays.map(function (b) {
            return '<option value="' + escapeHtml(b.name) + '">' + escapeHtml(b.name) + '</option>';
          }).join('');
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (serviceSelect) {
      try {
        var svcRes = await fetch('/api/services?t=' + new Date().getTime());
        if (svcRes.ok) {
          var services = await svcRes.json();
          serviceSelect.innerHTML = '<option value="">All Services</option>' + services.map(function (s) {
            return '<option value="' + escapeHtml(s.name) + '">' + escapeHtml(s.name) + '</option>';
          }).join('');
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  function applyFilterInputs() {
    appliedFilters = {
      search: searchInput ? searchInput.value.trim() : '',
      bay: baySelect ? baySelect.value : '',
      service: serviceSelect ? serviceSelect.value : '',
      date: dateInput ? dateInput.value : ''
    };
    currentPage = 1;
    updateFilterBadge();
    if (filterFields && filterFields.classList.contains('open')) {
      filterFields.classList.remove('open');
      if (filterToggle) filterToggle.classList.remove('open');
    }
    renderTable();
  }

  if (applyBtn) applyBtn.addEventListener('click', applyFilterInputs);
  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') applyFilterInputs();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      if (baySelect) baySelect.value = '';
      if (serviceSelect) serviceSelect.value = '';
      if (dateInput) dateInput.value = '';
      appliedFilters = { search: '', bay: '', service: '', date: '' };
      currentPage = 1;
      updateFilterBadge();
      renderTable();
    });
  }

  async function loadJobCards() {
    try {
      var res = await fetch('/api/jobcards?t=' + new Date().getTime());
      if (res.ok) {
        JOBCARDS = await res.json();
        JOBCARDS = JOBCARDS.filter(function (c) {
          // Normalize API camelCase format if needed
          c.startedAt = c.started_at;
          c.signedOffBy = c.signed_off_by;
          c.signedOffTime = c.signed_off_time;
          return true;
        });
        renderTable();
      }
    } catch (err) {
      console.error('Failed to load jobcards:', err);
    }
  }

  var refreshBtn = document.getElementById('jcRefreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async function () {
      if (refreshBtn.disabled) return;
      refreshBtn.disabled = true;
      await loadJobCards();
      refreshBtn.disabled = false;
      window.SW.showToast('Job cards refreshed');
    });
  }

  populateFilterDropdowns();
  loadJobCards();
  setInterval(loadJobCards, 5000);
  var njVehicle = document.getElementById('njVehicle');
  var njVehicleLoyalty = document.getElementById('njVehicleLoyalty');
  if (njVehicle && njVehicleLoyalty) {
    var loyaltyTimeout;
    njVehicle.addEventListener('input', function() {
      clearTimeout(loyaltyTimeout);
      njVehicleLoyalty.style.color = '#10B981';
      njVehicleLoyalty.style.display = 'none';
      var val = njVehicle.value.trim();
      if (val.length < 3) return;
      
      loyaltyTimeout = setTimeout(async function() {
        try {
          var res = await fetch('/api/loyalty?vehicle=' + encodeURIComponent(val));
          if (res.ok) {
            var data = await res.json();
            if (data.count > 0) {
              njVehicleLoyalty.textContent = '🌟 Loyalty: Washed ' + data.count + ' times previously';
              njVehicleLoyalty.style.display = 'block';
            } else {
              njVehicleLoyalty.textContent = 'New Vehicle';
              njVehicleLoyalty.style.color = '#64748B';
              njVehicleLoyalty.style.display = 'block';
            }
          }
        } catch (e) {}
      }, 600);
    });
  }
})();