@extends('layouts.app')

@section('title', 'Products')

@section('page-id', 'products')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/services.css') }}?v={{ filemtime(public_path('css/services.css')) }}">
@endsection

@section('content')
<section class="view" id="products">

  <div class="svc-toolbar">
    <div class="view-header">
      <div class="view-title">Products</div>
    </div>
  
    <div class="sortedByFlex">
      <div class="svc-search-box">
        <i class="ti ti-search"></i>
        <input type="text" id="productsSearchInput" placeholder="Search products..." aria-label="Search products">
      </div>
      <div class="svc-view-toggle">
        <button type="button" class="svc-view-btn active" data-view="grid" title="Grid view" aria-label="Grid view">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>
        </button>
        <button type="button" class="svc-view-btn" data-view="list" title="List view" aria-label="List view">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
        </button>
      </div>
      <button class="btn btn-accent" id="addProductBtn"><i class="ti ti-plus"></i>Add Product</button>
    </div>
  </div>

  <div class="scrollingMainall1">
    <div class="svc-grid" id="productsGrid"></div>
  </div>

  <div class="svc-empty" id="productsEmptyState" style="display:none;">No products match your filters.</div>

</section>

<div class="modal-overlay" id="productModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="productModalTitle">Add Product</div>
      <button class="icon-btn" onclick="window.SW.closeModal('productModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="productForm">
      <div class="modal-body">
        <div class="field">
          <label for="prodName">Product name</label>
          <input type="text" id="prodName" required placeholder="e.g. Car Wax">
        </div>
        <div class="field">
          <label for="prodDesc">Description</label>
          <input type="text" id="prodDesc" placeholder="e.g. Premium car wax">
        </div>
        <div class="modal-row">
          <div class="field">
            <label for="prodPrice">Price (₹)</label>
            <input type="number" id="prodPrice" min="0" required placeholder="e.g. 150">
          </div>
          <div class="field">
            <label for="prodStock">Stock</label>
            <input type="number" id="prodStock" min="0" value="10" required placeholder="10">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn danger" id="deleteProductBtn" style="display:none;margin-right:auto;"><i class="ti ti-x"></i>Delete product</button>
        <button type="button" class="btn" onclick="window.SW.closeModal('productModal')">Cancel</button>
        <button type="submit" class="btn btn-accent" id="productSubmitBtn"><i class="ti ti-plus"></i>Save Product</button>
      </div>
    </form>
  </div>
</div>
@endsection

@section('scripts')
  <script src="{{ asset('js/products.js') }}?v={{ time() }}"></script>
@endsection
