import re

with open('resources/views/crm.blade.php', 'r') as f:
    html = f.read()

export_modal_html = """
<div class="modal" id="exportModal">
  <div class="modal-dialog">
    <div class="modal-header">
      <div class="modal-title">Export Customers</div>
      <button class="close-modal" onclick="window.SW.closeModal('exportModal')">&times;</button>
    </div>
    <div class="modal-body">
      <div class="field">
        <label for="exportScope">Export Scope</label>
        <select id="exportScope" onchange="document.getElementById('exportCustomerField').style.display = this.value === 'single' ? 'block' : 'none'">
          <option value="all">Export All Customers</option>
          <option value="single">Export Specific Customer</option>
        </select>
      </div>
      <div class="field" id="exportCustomerField" style="display:none; margin-top: 15px;">
        <label for="exportCustomerSelect">Select Customer</label>
        <select id="exportCustomerSelect">
           <!-- Populated dynamically -->
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn" onclick="window.SW.closeModal('exportModal')">Cancel</button>
      <button type="button" class="btn btn-accent" id="confirmExportBtn"><i class="ti ti-download"></i>Download CSV</button>
    </div>
  </div>
</div>
"""

# inject right before @endsection before scripts
html = html.replace('@endsection\n\n@section(\'scripts\')', export_modal_html + '\n@endsection\n\n@section(\'scripts\')')

with open('resources/views/crm.blade.php', 'w') as f:
    f.write(html)
print('Injected export modal HTML')
