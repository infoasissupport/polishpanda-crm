// Page-specific behavior for services.html
(function () {
  var grid = document.getElementById('servicesGrid');
  var addBtn = document.getElementById('addServiceBtn');
  var form = document.getElementById('serviceForm');
  var modalTitle = document.getElementById('serviceModalTitle');
  var submitBtn = document.getElementById('serviceSubmitBtn');
  var deleteBtn = document.getElementById('deleteServiceBtn');
  var emptyState = document.getElementById('servicesEmptyState');
  if (!grid) return;

  var sortSelect = document.getElementById('svcSortSelect');
  var searchInput = document.getElementById('servicesSearchInput');
  var viewButtons = document.querySelectorAll('.svc-view-btn');
  var searchTerm = '';

  var statTotalServices = document.getElementById('statTotalServices');
  var statTotalDuration = document.getElementById('statTotalDuration');
  var statTotalStaff = document.getElementById('statTotalStaff');

  var editingId = null;
  var currentView = 'grid';

  var prodQuickSelect = document.getElementById('svcProductQuickSelect');
  var addCustomProdBtn = document.getElementById('svcAddCustomProdRowBtn');
  var productsList = document.getElementById('svcProductsList');
  var productsEmpty = document.getElementById('svcProductsEmpty');
  var productsHeader = document.getElementById('svcProductsHeader');
  var AVAILABLE_PRODUCTS = [];

  async function loadAvailableProducts() {
    if (!prodQuickSelect) return;
    try {
      var res = await fetch('/api/products?t=' + new Date().getTime());
      if (res.ok) {
        AVAILABLE_PRODUCTS = await res.json();
        prodQuickSelect.innerHTML = '<option value="">+ Add from existing products...</option>' +
          AVAILABLE_PRODUCTS.map(function(p) {
            return '<option value="' + p.id + '">' + escapeHtml(p.name) + ' (₹' + (p.unit_cost || 0) + ')</option>';
          }).join('');
      }
    } catch(e) {
      console.error('Could not load products for dropdown:', e);
    }
  }

  // ---- Service charge & pricing breakdown ----
  // Service price includes GST: taxable = price ÷ (1 + GST%);
  // service charge = taxable × Service Charge % (configured per service);
  // products must fit in taxable − service charge; remainder is billed as the service itself.
  var PRICING = { gstRate: 0 };
  var svcPriceInput = document.getElementById('svcPrice');
  var svcServiceChargeInput = document.getElementById('svcServiceCharge');
  var productsHint = productsHeader ? productsHeader.parentNode.querySelector('div[style*="font-size: 11.5px"]') : null;
  var productsHintDefault = productsHint ? productsHint.textContent : '';
  var pricingError = '';

  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

  function getServiceChargeRate() {
    return svcServiceChargeInput ? Math.min(100, Math.max(0, Number(svcServiceChargeInput.value) || 0)) : 0;
  }

  async function loadPricingSettings() {
    try {
      var res = await fetch('/api/settings?t=' + new Date().getTime());
      if (res.ok) {
        var st = await res.json();
        PRICING.gstRate = Math.max(0, (Number(st.cgst_rate) || 0) + (Number(st.sgst_rate) || 0));
      }
    } catch (e) {
      console.error('Could not load tax settings:', e);
    }
    recalculatePercentageProducts();
    updatePricingSummary();
  }

  function updatePricingSummary() {
    if (!productsHint) return;
    var price = round2(Math.max(0, Number(svcPriceInput ? svcPriceInput.value : 0) || 0));
    var scRate = getServiceChargeRate();
    var taxableExact = PRICING.gstRate > 0 ? price / (1 + PRICING.gstRate / 100) : price;
    var taxable = round2(taxableExact);
    var serviceCharge = round2(taxableExact * scRate / 100);
    var available = round2(taxable - serviceCharge);
    var entered = 0;
    (productsList ? productsList.querySelectorAll('.svc-prod-row') : []).forEach(function (row) {
      if (!row.querySelector('.svc-prod-name').value.trim()) return;
      var rawQty = (row.querySelector('.svc-prod-qty') ? row.querySelector('.svc-prod-qty').value : '').trim();
      var isPct = rawQty.indexOf('%') !== -1;
      var qtyNum = isPct ? 1 : Math.max(0.01, Number(rawQty) || 1);
      entered += qtyNum * (Number(row.querySelector('.svc-prod-price').value) || 0);
    });
    entered = round2(entered);

    pricingError = entered - available > 0.005
      ? 'Products ₹' + entered.toFixed(2) + ' are more than the ₹' + available.toFixed(2) + ' left after GST and the ' +
        scRate + '% service charge (₹' + serviceCharge.toFixed(2) + '). Lower the product prices or raise the service price.'
      : '';
    productsHint.style.color = pricingError ? '#dc2626' : '';
    productsHint.textContent = pricingError || (price > 0
      ? (scRate > 0 ? ('Service charge ' + scRate + '%: ₹' + serviceCharge.toFixed(2) + ' · ') : '') +
        'Available for products: ₹' + available.toFixed(2) + ' · Entered: ₹' + entered.toFixed(2)
      : productsHintDefault);
  }

  function getTaxableServicePrice() {
    var price = round2(Math.max(0, Number(svcPriceInput ? svcPriceInput.value : 0) || 0));
    return PRICING.gstRate > 0 ? (price / (1 + PRICING.gstRate / 100)) : price;
  }

  function recalculatePercentageProducts() {
    if (!productsList) return;
    var taxablePrice = getTaxableServicePrice();
    var rows = productsList.querySelectorAll('.svc-prod-row');
    rows.forEach(function(row) {
      var qtyInput = row.querySelector('.svc-prod-qty');
      var priceInput = row.querySelector('.svc-prod-price');
      if (qtyInput && priceInput) {
        var raw = qtyInput.value.trim();
        if (raw.indexOf('%') !== -1) {
          var pct = parseFloat(raw.replace(/%/g, '').trim());
          if (!isNaN(pct) && pct >= 0) {
            priceInput.value = round2(taxablePrice * (pct / 100));
          }
        }
      }
    });
  }

  if (svcPriceInput) {
    svcPriceInput.addEventListener('input', function() {
      recalculatePercentageProducts();
      updatePricingSummary();
    });
  }
  if (svcServiceChargeInput) svcServiceChargeInput.addEventListener('input', updatePricingSummary);
  if (productsList) productsList.addEventListener('input', updatePricingSummary);

  function updateProductsSectionState() {
    if (!productsList) return;
    var count = productsList.querySelectorAll('.svc-prod-row').length;
    if (productsEmpty) productsEmpty.style.display = count === 0 ? 'block' : 'none';
    if (productsHeader) productsHeader.style.display = count === 0 ? 'none' : 'grid';
    updatePricingSummary();
  }

  function addProductRow(data) {
    if (!productsList) return;
    data = data || {};
    var row = document.createElement('div');
    row.className = 'svc-prod-row';
    if (data.product_id) row.setAttribute('data-product-id', data.product_id);

    var rawQty = data.quantity != null ? data.quantity : 1;

    row.innerHTML =
      '<input type="text" class="svc-prod-name" placeholder="Product name" required value="' + escapeHtml(data.name || '') + '">' +
      '<input type="text" class="svc-prod-qty" placeholder="Qty or %" required value="' + escapeHtml(String(rawQty)) + '" title="Enter quantity (e.g. 1) or percentage of taxable service price (e.g. 10%)">' +
      '<input type="number" class="svc-prod-price" min="0" step="0.01" placeholder="Price (₹)" value="' + (data.price != null && data.price !== '' ? data.price : '') + '">' +
      '<input type="text" class="svc-prod-hsn" placeholder="HSN/SAC" value="' + escapeHtml(data.hsn_sac || '') + '">' +
      '<button type="button" class="svc-prod-del-btn" title="Remove product"><i class="ti ti-trash"></i></button>';

    var qtyInput = row.querySelector('.svc-prod-qty');
    var priceInput = row.querySelector('.svc-prod-price');

    qtyInput.addEventListener('input', function() {
      var raw = qtyInput.value.trim();
      if (raw.indexOf('%') !== -1) {
        var pct = parseFloat(raw.replace(/%/g, '').trim());
        if (!isNaN(pct) && pct >= 0) {
          var taxablePrice = getTaxableServicePrice();
          priceInput.value = round2(taxablePrice * (pct / 100));
        }
      }
      updatePricingSummary();
    });

    row.querySelector('.svc-prod-del-btn').addEventListener('click', function() {
      row.remove();
      updateProductsSectionState();
    });

    productsList.appendChild(row);
    updateProductsSectionState();
  }

  if (prodQuickSelect) {
    prodQuickSelect.addEventListener('change', function() {
      var id = Number(this.value);
      if (!id) return;
      var p = AVAILABLE_PRODUCTS.filter(function(item) { return item.id === id; })[0];
      if (p) {
        addProductRow({
          name: p.name,
          quantity: 1,
          price: p.unit_cost != null ? p.unit_cost : 0,
          hsn_sac: p.hsn_sac || '',
          product_id: p.id
        });
      }
      this.value = '';
    });
  }

  if (addCustomProdBtn) {
    addCustomProdBtn.addEventListener('click', function() {
      addProductRow({});
    });
  }

  var SERVICES = [];

  var CARD_THEMES = [
    { icon: 'ti-car', color: 'blue' },
    { icon: 'ti-wash', color: 'purple' },
    { icon: 'ti-sparkles', color: 'orange' },
    { icon: 'ti-wind', color: 'red' },
    { icon: 'ti-engine', color: 'teal' },
    { icon: 'ti-shield', color: 'indigo' },
    { icon: 'ti-crown', color: 'pink' },
    { icon: 'ti-bulb', color: 'yellow' },
    { icon: 'ti-droplet', color: 'cyan' },
    { icon: 'ti-star', color: 'green' }
  ];

  var SORTERS = {
    'price-asc': function (a, b) { return a.price - b.price; },
    'price-desc': function (a, b) { return b.price - a.price; },
    'name-asc': function (a, b) { return a.name.localeCompare(b.name); },
    'duration-asc': function (a, b) { return a.durationMinutes - b.durationMinutes; }
  };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatPrice(value) {
    return '₹' + Number(value).toLocaleString('en-IN');
  }

  function formatDurationLabel(mins) {
    if (mins >= 60) {
      var hrs = mins / 60;
      return (hrs % 1 === 0 ? hrs : hrs.toFixed(1)) + ' hr';
    }
    return mins + ' min';
  }

  function formatTotalDuration(totalMins) {
    var hrs = Math.floor(totalMins / 60);
    var mins = totalMins % 60;
    if (hrs && mins) return hrs + 'h ' + mins + 'm';
    if (hrs) return hrs + 'h';
    return mins + 'm';
  }

  function findService(id) {
    return SERVICES.filter(function (s) { return s.id === id; })[0];
  }

  function cardThemeFor(svc) {
    var key = String(svc.id != null ? svc.id : svc.name || '');
    var hash = 0;
    for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return CARD_THEMES[hash % CARD_THEMES.length];
  }

  function matchesSearch(svc, term) {
    if (!term) return true;
    var haystack = [svc.name, svc.desc, svc.category].filter(Boolean).join(' ').toLowerCase();
    return haystack.indexOf(term.toLowerCase()) !== -1;
  }

  function getFilteredSorted() {
    var sorter = SORTERS[sortSelect ? sortSelect.value : ''] || SORTERS['price-asc'];
    return SERVICES.filter(function (svc) {
      return matchesSearch(svc, searchTerm);
    }).sort(sorter);
  }

  function renderStats() {
    var totalStaff = 0, totalMins = 0;
    SERVICES.forEach(function (svc) {
      totalStaff += Number(svc.staff) || 1;
      totalMins += Number(svc.durationMinutes) || 0;
    });
    
    if (statTotalServices) statTotalServices.textContent = SERVICES.length;
    if (statTotalDuration) statTotalDuration.textContent = formatTotalDuration(totalMins);
    if (statTotalStaff) statTotalStaff.textContent = totalStaff;
  }

  function cardHtml(svc) {
    var theme = cardThemeFor(svc);
    var isActive = svc.active !== false;
    var staffCount = Number(svc.staff) || 1;
    var prodCount = svc.products && svc.products.length ? svc.products.length : 0;
    var prodHtml = prodCount > 0 ? ('<span><i class="ti ti-package"></i>' + prodCount + ' ' + (prodCount === 1 ? 'Product' : 'Products') + '</span>') : '';
    var scCount = Number(svc.service_charge_rate) || 0;
    var scHtml = scCount > 0 ? ('<span><i class="ti ti-receipt-tax"></i>SC: ' + scCount + '%</span>') : '';
    var metaHtml = '<span><i class="ti ti-hourglass"></i>' + escapeHtml(formatDurationLabel(svc.durationMinutes)) + '</span>' +
                   '<span><i class="ti ti-users"></i>' + staffCount + ' Staff</span>' +
                   scHtml +
                   prodHtml +
                   '<span class="service-status ' + (isActive ? 'active' : 'inactive') + '">' + (isActive ? 'Active' : 'Inactive') + '</span>';
                 
    var actionsHtml = '<div class="service-actions">' +
        '<button type="button" class="btn service-edit-btn" data-action="edit" data-id="' + svc.id + '">' +
          '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
          'Edit' +
        '</button>' +
        '<button type="button" class="btn service-delete-btn" data-action="delete" data-id="' + svc.id + '"><i class="ti ti-x"></i>Delete</button>' +
      '</div>';

    return (
      '<div class="service-card" data-id="' + svc.id + '">' +
        '<div class="service-card-top">' +
          '<div class="service-icon svc-badge-' + theme.color + '"><i class="ti ' + theme.icon + '"></i></div>' +
          '<div class="service-price">' + formatPrice(svc.price) + '</div>' +
        '</div>' +
        '<div class="service-name-row">' +
          '<span class="service-name">' + escapeHtml(svc.name) + '</span>' +
          '<span class="service-price-inline">' + formatPrice(svc.price) + '</span>' +
        '</div>' +
        '<div class="service-desc">' + escapeHtml(svc.desc || '') + '</div>' +
        '<div class="service-meta">' + metaHtml + '</div>' +
        actionsHtml +
      '</div>'
    );
  }

  function renderGrid() {
    var filtered = getFilteredSorted();

    grid.className = 'svc-grid' + (currentView === 'list' ? ' list-view' : '');
    grid.innerHTML = filtered.map(cardHtml).join('');

    emptyState.style.display = filtered.length === 0 ? '' : 'none';
    emptyState.textContent = searchTerm ? 'No services match your search.' : 'No services match your filters.';

    renderStats();
  }

  grid.addEventListener('click', function (e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;
    var id = Number(target.getAttribute('data-id'));
    if (target.getAttribute('data-action') === 'edit') openEdit(id);
    if (target.getAttribute('data-action') === 'delete') removeService(id);
  });

  function resetForm() {
    form.reset();
    document.getElementById('svcStaff').value = 1;
    document.getElementById('svcCategory').value = 'Exterior';
    if (svcServiceChargeInput) svcServiceChargeInput.value = 0;
    if (productsList) productsList.innerHTML = '';
    updateProductsSectionState();
  }

  function openCreate() {
    editingId = null;
    modalTitle.textContent = 'Add service';
    submitBtn.innerHTML = '<i class="ti ti-plus"></i>Add service';
    deleteBtn.style.display = 'none';
    resetForm();
    loadAvailableProducts();
    loadPricingSettings();
    window.SW.openModal('serviceModal');
  }

  function openEdit(id) {
    var svc = findService(id);
    if (!svc) return;
    editingId = id;
    modalTitle.textContent = 'Edit service';
    submitBtn.innerHTML = '<i class="ti ti-check"></i>Save changes';
    deleteBtn.style.display = 'inline-flex';

    document.getElementById('svcName').value = svc.name;
    document.getElementById('svcDesc').value = svc.desc || '';
    document.getElementById('svcCategory').value = svc.category || 'Other';
    document.getElementById('svcPrice').value = svc.price;
    if (svcServiceChargeInput) svcServiceChargeInput.value = (svc.service_charge_rate != null ? svc.service_charge_rate : 0);
    document.getElementById('svcDuration').value = formatDurationLabel(svc.durationMinutes);
    document.getElementById('svcStaff').value = svc.staff;

    if (productsList) productsList.innerHTML = '';
    if (svc.products && Array.isArray(svc.products)) {
      svc.products.forEach(function(p) {
        addProductRow(p);
      });
    }
    updateProductsSectionState();
    loadAvailableProducts();
    loadPricingSettings();

    window.SW.openModal('serviceModal');
  }

  async function removeService(id) {
    var svc = findService(id);
    if (!svc) return;
    if (!confirm('Are you sure you want to delete this service?')) return;

    var btn = document.querySelector('.service-delete-btn[data-id="'+id+'"]');
    if (btn) btn.disabled = true;

    try {
      var res = await fetch('/api/services/' + id, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
        },
        body: JSON.stringify({ _method: 'DELETE' })
      });

      if (res.ok) {
        window.SW.showToast('Service removed: ' + svc.name);
        if (editingId === id) window.SW.closeModal('serviceModal');
        await loadServices();
      } else {
        try {
            var err = await res.json();
            alert('Could not delete service. Error: ' + (err.message || res.statusText || res.status));
        } catch(e) {
            alert('Could not delete service. Status: ' + res.status);
        }
      }
    } catch (err) {
      console.error(err);
      alert('A network error occurred.');
    }
  }

  addBtn.addEventListener('click', openCreate);

  if (sortSelect) sortSelect.addEventListener('change', renderGrid);

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchTerm = searchInput.value.trim();
      renderGrid();
    });
  }

  viewButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      viewButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentView = btn.getAttribute('data-view');
      renderGrid();
    });
  });

  function parseDurationToMinutes(str) {
    str = String(str).toLowerCase().trim();
    var num = parseFloat(str) || 0;
    if (str.indexOf('hr') !== -1 || str.indexOf('hour') !== -1) {
      return Math.round(num * 60);
    }
    return Math.round(num);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var name = document.getElementById('svcName').value.trim();
    var desc = document.getElementById('svcDesc').value.trim() || 'No description yet.';
    var category = document.getElementById('svcCategory').value;
    var price = Number(document.getElementById('svcPrice').value);
    var duration = document.getElementById('svcDuration').value.trim();
    var staff = Number(document.getElementById('svcStaff').value) || 1;

    var minutes = parseDurationToMinutes(duration);

    updatePricingSummary();
    if (pricingError) {
      alert(pricingError);
      return;
    }
    var productRows = productsList ? productsList.querySelectorAll('.svc-prod-row') : [];
    var serviceProducts = [];
    productRows.forEach(function (row) {
      var pName = row.querySelector('.svc-prod-name').value.trim();
      if (pName) {
        var rawQty = (row.querySelector('.svc-prod-qty').value || '').trim();
        var isPct = rawQty.indexOf('%') !== -1;
        serviceProducts.push({
          name: pName,
          quantity: isPct ? rawQty : (Math.max(0.01, Number(rawQty) || 1)),
          price: Number(row.querySelector('.svc-prod-price').value) || 0,
          hsn_sac: (row.querySelector('.svc-prod-hsn').value || '').trim(),
          product_id: row.getAttribute('data-product-id') ? Number(row.getAttribute('data-product-id')) : null
        });
      }
    });

    var payload = {
      name: name,
      desc: desc,
      category: category,
      price: price,
      service_charge_rate: getServiceChargeRate(),
      duration: minutes,
      staff: staff,
      products: serviceProducts
    };

    try {
      var url = editingId ? '/api/services/' + editingId : '/api/services';
      var method = editingId ? 'PUT' : 'POST';

      var res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.SW.showToast(editingId ? 'Updated ' + name : 'Service added: ' + name);
        window.SW.closeModal('serviceModal');
        await loadServices();
      } else {
        var err = await res.json();
        alert('Error: ' + (err.message || 'Could not save service.'));
      }
    } catch (err) {
      console.error(err);
      alert('A network error occurred.');
    }
  });

  deleteBtn.addEventListener('click', function () {
    if (!editingId) return;
    removeService(editingId);
  });

  async function loadServices() {
    try {
      var res = await fetch('/api/services?t=' + new Date().getTime());
      if (res.ok) {
        var servicesData = await res.json();
        servicesData.forEach(function (svc) {
          svc.type = 'service';
          svc.durationMinutes = Number(svc.duration) || 0;
          svc.staff = Number(svc.staff) || 1;
        });
        SERVICES = servicesData;
        renderGrid();
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  }
  loadServices();
})();
