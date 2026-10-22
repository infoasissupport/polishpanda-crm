// Page-specific behavior for display.html — live clock and queue status
(function () {
  var clockEl = document.getElementById('displayClock');
  var dateEl = document.getElementById('displayDate');
  if (clockEl && dateEl) {
    function tick() {
      var now = new Date();
      clockEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      dateEl.textContent = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    tick();
    setInterval(tick, 1000);
  }

  var baysGrid = document.getElementById('displayBaysGrid');
  var waitList = document.getElementById('displayWaitList');

  async function loadDisplayData() {
    try {
      var jcRes = await fetch('/api/jobcards');
      var bkRes = await fetch('/api/bookings');
      if (!jcRes.ok || !bkRes.ok) return;

      var jobcards = await jcRes.json();
      var bookings = await bkRes.json();

      var activeBays = {
        'Bay 1': null,
        'Bay 2': null,
        'Bay 3': null,
        'Bay 4': null
      };

      jobcards.forEach(function (card) {
        if (card.stage !== 'completed' && card.stage !== 'cancelled' && activeBays[card.bay] === null) {
          activeBays[card.bay] = card;
        }
      });

      if (baysGrid) {
        baysGrid.innerHTML = '';
        Object.keys(activeBays).forEach(function (bayName) {
          var card = activeBays[bayName];
          var el = document.createElement('div');
          el.className = 'display-bay';
          if (card) {
            var statusStyle = card.stage === 'inprogress'
              ? 'background:var(--success-bg);color:var(--success-text);'
              : 'background:var(--warn-bg);color:var(--warn-text);';
            var stageLabel = card.stage === 'inprogress' ? 'Washing' : 'Starting';
            el.innerHTML =
              '<div class="display-bay-head">' + bayName + '<span class="status-pill" style="' + statusStyle + '">' + stageLabel + '</span></div>' +
              '<div class="display-bay-car">' + card.vehicle + '</div>' +
              '<div class="display-bay-meta">' + card.service + '</div>';
          } else {
            el.innerHTML =
              '<div class="display-bay-head">' + bayName + '<span class="status-pill" style="background:var(--surface-2);color:var(--text-3);">Empty</span></div>' +
              '<div class="display-bay-car" style="color:var(--text-3);">No vehicle</div>' +
              '<div class="display-bay-meta">Ready for next car</div>';
          }
          baysGrid.appendChild(el);
        });
      }

      if (waitList) {
        waitList.innerHTML = '';
        var waitingBookings = bookings.filter(function (b) {
          return b.status === 'waiting' || b.status === 'confirmed';
        });

        if (waitingBookings.length === 0) {
          waitList.innerHTML = '<div style="padding:24px;color:var(--text-3);text-align:center;font-size:16px;">No vehicles in waitlist</div>';
        } else {
          waitingBookings.forEach(function (b) {
            var initials = b.customer.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
            var isVip = b.customer.includes('Priya') || b.customer.includes('Thomas');
            var vipBadge = isVip ? ' <i class="ti ti-star-filled" style="font-size:13px;color:var(--accent);margin-left:4px;"></i> VIP' : '';
            var avatarStyle = isVip ? 'background:var(--accent-dim);color:var(--accent);' : '';

            var el = document.createElement('div');
            el.className = 'display-wait-row';
            el.innerHTML =
              '<div class="qav" style="width:48px;height:48px;font-size:16px;' + avatarStyle + '">' + initials + '</div>' +
              '<div class="display-wait-meta">' +
                '<div class="display-wait-name">' + b.customer + vipBadge + '</div>' +
                '<div class="display-wait-sub">' + b.service + '</div>' +
              '</div>' +
              '<span class="status-pill" style="background:var(--info-bg);color:var(--info-text);">Waiting</span>';
            waitList.appendChild(el);
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  loadDisplayData();
  setInterval(loadDisplayData, 5000);
})();
