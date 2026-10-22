@extends('layouts.app')

@section('title', 'Inventory')

@section('page-id', 'inventory')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/inventory.css') }}">
@endsection

@section('content')
<section class="view" id="inventory">
  <div class="view-header">
    <div class="view-title">Inventory</div>
    <button class="btn btn-accent" id="addInventoryBtn"><i class="ti ti-plus"></i>New purchase order</button>
  </div>
  <div class="table-wrap">
    <div class="toolbar">
      <input id="invSearchInput" aria-label="Search item or supplier" placeholder="Search item or supplier" autocomplete="off">
      <div class="chip active" data-filter="all">All</div>
      <div class="chip" data-filter="low">Low stock</div>
      <div class="chip" data-filter="ok">In stock</div>
    </div>
    <div class="table-scroll">
      <table>
        <thead><tr><th class="col-sl">#</th><th>Item</th><th>In stock</th><th>Reorder level</th><th>Supplier</th><th>Status</th><th></th></tr></thead>
        <tbody id="invTableBody"></tbody>
      </table>
      <div class="dropdown-empty" id="invEmptyState" style="display:none;">No items match your search.</div>
    </div>
    <div class="table-pagination">
      <span id="invPageInfo"></span>
      <div class="pagination-btns">
        <button type="button" class="btn" id="invPrevBtn"><i class="ti ti-chevron-down" style="transform:rotate(90deg);display:inline-block;"></i>Prev</button>
        <button type="button" class="btn" id="invNextBtn">Next<i class="ti ti-chevron-down" style="transform:rotate(-90deg);display:inline-block;"></i></button>
      </div>
    </div>
  </div>
</section>

<div class="modal-overlay" id="inventoryModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="inventoryModalTitle">New purchase order</div>
      <button class="icon-btn" onclick="window.SW.closeModal('inventoryModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="inventoryForm">
      <div class="modal-body">
        <div class="field"><label for="invName">Item name</label><input type="text" id="invName" required placeholder="e.g. Foam shampoo (5L)"></div>
        <div class="modal-row">
          <div class="field"><label for="invStock">In stock</label><input type="number" id="invStock" min="0" required placeholder="e.g. 20"></div>
          <div class="field"><label for="invReorder">Reorder level</label><input type="number" id="invReorder" min="0" required placeholder="e.g. 10"></div>
        </div>
        <div class="modal-row">
          <div class="field"><label for="invSupplier">Supplier</label><input type="text" id="invSupplier" placeholder="e.g. AutoChem Supplies"></div>
          <div class="field"><label for="invUnitCost">Unit Cost (₹)</label><input type="number" id="invUnitCost" min="0" value="0" placeholder="e.g. 250"></div>
        </div>
        <div class="field"><label for="invIcon">Icon</label>
          <select id="invIcon">
            <option value="ti-droplet">Droplet</option>
            <option value="ti-square">Square</option>
            <option value="ti-brush">Brush</option>
            <option value="ti-shield">Shield</option>
            <option value="ti-wind">Wind</option>
            <option value="ti-sparkles">Sparkles</option>
            <option value="ti-atom-2">Atom</option>
            <option value="ti-gift">Gift</option>
            <option value="ti-package">Package</option>
            <option value="ti-target-arrow">Target</option>
            <option value="ti-engine">Engine</option>
            <option value="ti-bulb">Bulb</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn danger" id="deleteInventoryBtn" style="display:none;margin-right:auto;"><i class="ti ti-x"></i>Remove item</button>
        <button type="button" class="btn" onclick="window.SW.closeModal('inventoryModal')">Cancel</button>
        <button type="submit" class="btn btn-accent" id="inventorySubmitBtn"><i class="ti ti-plus"></i>Add item</button>
      </div>
    </form>
  </div>
</div>
@endsection

@section('scripts')
  <script src="{{ asset('js/inventory.js') }}?v={{ filemtime(public_path('js/inventory.js')) }}"></script>
@endsection
