@extends('layouts.app')

@section('title', 'Managers')

@section('page-id', 'managers')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/managers.css') }}?v={{ time() }}">
@endsection

@section('content')
<section class="view" id="managers">
  <div class="view-header">
    <div>
      <div class="view-title">Manager Accounts</div>
      <div class="view-sub" id="managersCountSub">0 manager accounts</div>
    </div>
    <button class="btn btn-accent" id="addManagerBtn"><i class="ti ti-plus"></i>Add manager</button>
  </div>

  <div class="table-wrap">
    <div class="toolbar">
      <input id="managerSearchInput" aria-label="Search managers by name or email" placeholder="Search managers by name or email..." autocomplete="off">
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="col-sl">#</th>
            <th>Manager Name</th>
            <th>Email Address</th>
            <th>Assigned Branch</th>
            <th>Role</th>
            <th>Date Added</th>
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody id="managersTableBody">
          <!-- Loaded dynamically -->
        </tbody>
      </table>
      <div class="dropdown-empty" id="managersEmptyState" style="display:none; padding: 24px; text-align: center; color: var(--text-3);">
        No manager accounts found. Click <strong>+ Add manager</strong> to create an account for mobile app access.
      </div>
    </div>
  </div>
</section>

<!-- ============ ADD/EDIT MANAGER MODAL ============ -->
<div class="modal-overlay" id="managerModal">
  <div class="modal" style="max-width: 520px;">
    <div class="modal-header">
      <div class="modal-title" id="managerModalTitle">Add Manager Account</div>
      <button class="icon-btn" onclick="window.SW.closeModal('managerModal')" aria-label="Close modal"><i class="ti ti-x"></i></button>
    </div>
    <form id="managerForm">
      <div class="modal-body">
        <p style="margin-bottom: 1.25rem; color: var(--text-muted); font-size: 0.85rem; line-height: 1.4;">
          Create login credentials for branch managers to access the <strong>Shinewise Manager Flutter Mobile App</strong>.
        </p>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label for="mName" style="font-size: 0.825rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Full Name *</label>
            <input type="text" id="mName" required placeholder="e.g. John Doe" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text); outline: none; font-size: 0.9rem;">
          </div>

          <div>
            <label for="mEmail" style="font-size: 0.825rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Email Address *</label>
            <input type="email" id="mEmail" required placeholder="e.g. manager@shinewise.com" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text); outline: none; font-size: 0.9rem;">
          </div>

          <div>
            <label for="mPassword" style="font-size: 0.825rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Password <span id="pwdNotice" style="font-weight:normal;color:var(--text-3);">(min 6 characters)</span> *</label>
            <input type="password" id="mPassword" placeholder="••••••••" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text); outline: none; font-size: 0.9rem;">
          </div>

          <div>
            <label for="mBranch" style="font-size: 0.825rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 4px;">Assigned Shop Branch</label>
            <select id="mBranch" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text); outline: none; font-size: 0.9rem;">
              <option value="">All Branches</option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
        <button type="button" class="btn btn-danger" id="deleteManagerBtn" style="display:none; background:var(--danger-bg); color:var(--danger-text); border:none;"><i class="ti ti-trash"></i>Delete Account</button>
        <div style="display: flex; gap: 8px; margin-left: auto;">
          <button type="button" class="btn" onclick="window.SW.closeModal('managerModal')">Cancel</button>
          <button type="submit" class="btn btn-accent" id="saveManagerBtn"><i class="ti ti-check"></i>Save Manager Account</button>
        </div>
      </div>
    </form>
  </div>
</div>
@endsection

@section('scripts')
  <script src="{{ asset('js/managers.js') }}?v={{ time() }}"></script>
@endsection
