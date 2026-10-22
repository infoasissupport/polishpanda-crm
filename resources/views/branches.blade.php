@extends('layouts.app')

@section('title', 'Branches')

@section('page-id', 'branches')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/branches.css') }}?v={{ filemtime(public_path('css/branches.css')) }}">
@endsection

@section('content')
<section class="view" id="branches">
  <div class="view-header">
    <div>
      <div class="view-title">Branches</div>
     
    </div>
    <button class="btn btn-accent" id="addBranchBtn"><i class="ti ti-plus"></i>Add branch</button>
  </div>
  <div class="fixedScrolldivCommon">
  <div class="branch-grid" id="branchesGrid"></div>
  <div class="branch-empty" id="branchesEmptyState" style="display:none;">No branches configured yet.</div>
  </div>
</section>

<div class="modal-overlay" id="branchModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="branchModalTitle">Add branch</div>
      <button class="icon-btn" onclick="window.SW.closeModal('branchModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="branchForm">
      <div class="modal-body">
        <div class="field">
          <label class="label" for="brName">Branch Name</label>
          <input type="text" id="brName" required placeholder="e.g. Kozhikode — Calicut branch">
        </div>
        <div class="modal-row">
          <div class="field"><label class="label" for="brCode">Branch code</label><input type="text" id="brCode" placeholder="e.g. CLT-01"></div>
          <div class="field"><label class="label" for="brCity">City</label><input type="text" id="brCity" placeholder="e.g. Kozhikode"></div>
        </div>
        <div class="field">
          <label class="label" for="brLocation">Location</label>
          <input type="text" id="brLocation" required placeholder="e.g. Kozhikode">
        </div>
        <div class="modal-row">
          <div class="field"><label class="label" for="brPhone">Phone</label><input type="tel" id="brPhone" inputmode="numeric" pattern="[0-9]*" maxlength="15" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="e.g. 9876543210"></div>
          <div class="field"><label class="label" for="brGst">GST number</label><input type="text" id="brGst" placeholder="32ABCDE1234F1Z5"></div>
        </div>
        <div class="modal-row">
          <div class="field"><label class="label" for="brState">State</label><input type="text" id="brState" value="Kerala"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn danger" id="deleteBranchBtn" style="display:none;margin-right:auto;"><i class="ti ti-x"></i>Delete branch</button>
        <button type="button" class="btn" onclick="window.SW.closeModal('branchModal')">Cancel</button>
        <button type="submit" class="btn btn-accent" id="branchSubmitBtn"><i class="ti ti-plus"></i>Add branch</button>
      </div>
    </form>
  </div>
</div>
@endsection

@section('scripts')
  <script src="{{ asset('js/branches.js') }}?v={{ time() }}"></script>
@endsection
