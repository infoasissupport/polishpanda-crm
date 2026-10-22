// Page-specific behavior for products.blade.php
(function () {
  var grid = document.getElementById('productsGrid');
  var addBtn = document.getElementById('addProductBtn');
  var form = document.getElementById('productForm');
  var modalTitle = document.getElementById('productModalTitle');
  var submitBtn = document.getElementById('productSubmitBtn');
  var deleteBtn = document.getElementById('deleteProductBtn');
  var emptyState = document.getElementById('productsEmptyState');
  if (!grid) return;

  var searchInput = document.getElementById('productsSearchInput');
  var viewButtons = document.querySelectorAll('.svc-view-btn');
  var searchTerm = '';

  var editingId = null;
  var currentView = 'grid';
  var PRODUCTS = [];

  var CARD_THEMES = [
    { icon: 'ti-box', color: 'blue' },
    { icon: 'ti-spray', color: 'purple' },
    { icon: 'ti-sparkles', color: 'orange' },
    { icon: 'ti-bottle', color: 'red' },
    { icon: 'ti-droplet', color: 'teal' },
    { icon: 'ti-shield', color: 'indigo' },
    { icon: 'ti-crown', color: 'pink' },
    { icon: 'ti-bulb', color: 'yellow' },
    { icon: 'ti-tool', color: 'cyan' },
    { icon: 'ti-star', color: 'green' }
  ];

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatPrice(value) {
    return '₹' + Number(value || 0).toLocaleString('en-IN');
  }

  function findProduct(id) {
    return PRODUCTS.filter(function (p) { return p.id === id; })[0];
  }

  function cardThemeFor(p) {
    var key = String(p.id != null ? p.id : p.name || '');
    var hash = 0;
    for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return CARD_THEMES[hash % CARD_THEMES.length];
  }

  function matchesSearch(p, term) {
    if (!term) return true;
    var haystack = [p.name, p.description, p.supplier].filter(Boolean).join(' ').toLowerCase();
    return haystack.indexOf(term.toLowerCase()) !== -1;
  }

  function getFilteredSorted() {
    return PRODUCTS.filter(function (p) {
      return matchesSearch(p, searchTerm);
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  }

  function cardHtml(prod) {
    var theme = cardThemeFor(prod);
    var isActive = prod.active !== false;
    var price = prod.unit_cost != null ? prod.unit_cost : 0;
    var stock = prod.stock != null ? prod.stock : 0;

    var metaHtml = '<span><i class="ti ti-box"></i>Stock: ' + stock + '</span>' +
                   '<span class="service-status ' + (isActive ? 'active' : 'inactive') + '">' + (isActive ? 'Active' : 'Inactive') + '</span>';

    var actionsHtml = '<div class="service-actions">' +
        '<button type="button" class="btn service-edit-btn" data-action="edit" data-id="' + prod.id + '">' +
          '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
          'Edit' +
        '</button>' +
        '<button type="button" class="btn service-delete-btn" data-action="delete" data-id="' + prod.id + '"><i class="ti ti-x"></i>Delete</button>' +
      '</div>';

    return (
      '<div class="service-card" data-id="' + prod.id + '">' +
        '<div class="service-card-top">' +
          '<div class="service-icon svc-badge-' + theme.color + '"><i class="ti ' + theme.icon + '"></i></div>' +
          '<div class="service-price">' + formatPrice(price) + '</div>' +
        '</div>' +
        '<div class="service-name-row">' +
          '<span class="service-name">' + escapeHtml(prod.name) + '</span>' +
          '<span class="service-price-inline">' + formatPrice(price) + '</span>' +
        '</div>' +
        '<div class="service-desc">' + escapeHtml(prod.description || '') + '</div>' +
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
    emptyState.textContent = searchTerm ? 'No products match your search.' : 'No products added yet.';
  }

  grid.addEventListener('click', function (e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;
    var id = Number(target.getAttribute('data-id'));
    if (target.getAttribute('data-action') === 'edit') openEdit(id);
    if (target.getAttribute('data-action') === 'delete') removeProduct(id);
  });

  function resetForm() {
    form.reset();
    document.getElementById('prodStock').value = 10;
  }

  function openCreate() {
    editingId = null;
    modalTitle.textContent = 'Add Product';
    submitBtn.innerHTML = '<i class="ti ti-plus"></i>Save Product';
    deleteBtn.style.display = 'none';
    resetForm();
    window.SW.openModal('productModal');
  }

  function openEdit(id) {
    var prod = findProduct(id);
    if (!prod) return;
    editingId = id;
    modalTitle.textContent = 'Edit Product';
    submitBtn.innerHTML = '<i class="ti ti-check"></i>Save changes';
    deleteBtn.style.display = 'inline-flex';

    document.getElementById('prodName').value = prod.name || '';
    document.getElementById('prodDesc').value = prod.description || '';
    document.getElementById('prodPrice').value = prod.unit_cost != null ? prod.unit_cost : 0;
    document.getElementById('prodStock').value = prod.stock != null ? prod.stock : 0;

    window.SW.openModal('productModal');
  }

  async function removeProduct(id) {
    var prod = findProduct(id);
    if (!prod) return;
    if (!confirm('Are you sure you want to delete this product?')) return;

    var btn = document.querySelector('.service-delete-btn[data-id="' + id + '"]');
    if (btn) btn.disabled = true;

    try {
      var res = await fetch('/api/products/' + id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ _method: 'DELETE' })
      });

      if (res.ok) {
        window.SW.showToast('Product removed: ' + prod.name);
        if (editingId === id) window.SW.closeModal('productModal');
        await loadProducts();
      } else {
        var err = await res.json();
        alert('Could not delete product. Error: ' + (err.message || res.statusText || res.status));
      }
    } catch (err) {
      console.error(err);
      alert('A network error occurred.');
    }
  }

  if (addBtn) addBtn.addEventListener('click', openCreate);

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

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var name = document.getElementById('prodName').value.trim();
    var desc = document.getElementById('prodDesc').value.trim();
    var price = Number(document.getElementById('prodPrice').value);
    var stock = Number(document.getElementById('prodStock').value);

    if (!name || isNaN(price)) {
      alert('Please fill out Product name and Price.');
      return;
    }

    var payload = {
      name: name,
      description: desc,
      unit_cost: price,
      stock: stock,
      icon: 'ti-box',
      supplier: 'Internal',
      reorder: 5,
      unit: 'pcs',
      active: true
    };

    try {
      var url = editingId ? ('/api/products/' + editingId) : '/api/products';
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
        window.SW.showToast(editingId ? 'Updated ' + name : 'Product added: ' + name);
        window.SW.closeModal('productModal');
        await loadProducts();
      } else {
        var err = await res.json();
        alert('Error: ' + (err.message || 'Could not save product.'));
      }
    } catch (err) {
      console.error(err);
      alert('A network error occurred.');
    }
  });

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function () {
      if (!editingId) return;
      removeProduct(editingId);
    });
  }

  async function loadProducts() {
    try {
      var res = await fetch('/api/products?t=' + new Date().getTime());
      if (res.ok) {
        PRODUCTS = await res.json();
        renderGrid();
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }

  loadProducts();
})();
