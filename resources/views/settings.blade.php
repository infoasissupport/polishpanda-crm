@extends('layouts.app')
@section('title', 'Company Settings')
@section('page-id', 'settings')
@section('styles')
<style>
/* Company Settings — same design as the other pages (Queue, Branches, Expenses) */
section#settings.view { padding: 0 !important; }

/* Header: light background + shared pattern (shell.css), 10px 15px padding, 34px title */
#settings .view-header {
  position: sticky; top: 0; z-index: 6; align-items: center; margin: 0; padding: 10px 15px; min-height: auto;
  background: linear-gradient(180deg, #fbfbfb 0%, #f6f6f7 100%);
}
#settings .view-header .view-title { font-size: 34px; font-weight: 800; color: #0b0b0c; letter-spacing: -.4px; line-height: 1.15; }

/* Scroll area under the fixed header */
#settings .fixedScrolldivCommon { padding: 0px 15px 15px; overflow-y: auto; overflow-x: hidden; height: calc(100dvh - 163px - var(--shell-extra, 0px)) !important; }

.settings-container { display: flex; flex-direction: column; gap: 14px; }
.settings-container form { display: flex; flex-direction: column; gap: 14px; }

/* Each section is a card */
.settings-section {
  margin: 0; padding: 20px; background: #fff; border: 1px solid #e6e8ec; border-radius: 16px;
  box-shadow: 0 12px 28px -22px rgba(16,24,40,.4);
}
.settings-section h3 {
  display: flex; align-items: center; gap: 10px; margin: 0 0 18px; padding: 0 0 14px;
  font-size: 18px; font-weight: 700; color: #0b0b0c; border-bottom: 1px dashed #e6e8ec;
}
.settings-section h3::before { content: ""; width: 4px; height: 22px; border-radius: 4px; background: var(--accent); flex-shrink: 0; }

.form-row { display: flex; gap: 16px; margin-bottom: 16px; }
.form-row .field { flex: 1; }
.form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.form-grid .field-full { grid-column: 1 / -1; }
@media (max-width: 1024px) { .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

/* Fields */
#settings .field { margin: 0; }
#settings .field label { display: block; font-size: 13px; font-weight: 600; color: #344054; margin-bottom: 6px; }
#settings .field input, #settings .field textarea {
  width: 100%; padding: 0 14px; border: 1px solid #d0d5dd; border-radius: 10px; background: #fff;
  font-size: 14px; color: #101828; transition: border-color .15s ease, box-shadow .15s ease;
}
#settings .field input { height: 42px; }
#settings .field textarea { padding: 10px 14px; min-height: 90px; resize: vertical; line-height: 1.5; }
#settings .field input::placeholder, #settings .field textarea::placeholder { color: #98a2b3; }
#settings .field input:hover, #settings .field textarea:hover { border-color: #98a2b3; }
#settings .field input:focus, #settings .field textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(227,18,27,.12); }
/* file pickers */
#settings .field input[type="file"] { height: auto; padding: 6px; font-size: 13px; color: #475467; border-style: dashed; cursor: pointer; }
#settings .field input[type="file"]::file-selector-button {
  margin-right: 10px; height: 32px; padding: 0 14px; border: none; border-radius: 8px;
  background: #fff1f1; color: var(--accent); font-weight: 600; cursor: pointer;
}
#settings .field input[type="file"]::file-selector-button:hover { background: #ffe0e0; }

/* Buttons */
.btn-save {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 42px; padding: 0 20px;
  border: none; border-radius: 12px; background: var(--accent); color: #fff; font-weight: 600; font-size: 14px; cursor: pointer;
  box-shadow: 0 6px 14px -8px rgba(227,18,27,.8); transition: background-color .15s ease;
}
.btn-save:hover { background: #c0111a; }
#settings #exportAllDataBtn { background: #fff !important; color: #101828; border: 1px solid #d0d5dd; box-shadow: none; }
#settings #exportAllDataBtn:hover { background: #f5f6f8 !important; }

/* Save + backup bar stays pinned to the bottom while the form scrolls */
.settings-footer {
  position: sticky; bottom: 0; z-index: 5; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
  margin: 0; padding: 16px 20px; background: #fff; border: 1px solid #e6e8ec; border-radius: 16px;
  box-shadow: 0 -10px 24px -18px rgba(16,24,40,.35);
}
.settings-footer-backup h3 { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 700; color: #0b0b0c; margin: 0 0 6px; }
.settings-footer-backup h3::before { content: ""; width: 4px; height: 18px; border-radius: 4px; background: var(--accent); flex-shrink: 0; }
.settings-footer-backup p { margin-bottom: 10px !important; }

@media (max-width: 1199px) {
  #settings .view-header .view-title { font-size: 28px; }
.settings-footer-backup p{
  display: none;
}
  #settings .fixedScrolldivCommon { height: calc(100dvh - 190px - var(--shell-extra, 0px)) !important; }
}

@media (max-width: 768px) {
  #settings .view-header { padding: 10px 12px; }
  #settings .view-header .view-title { font-size: 24px; }
  #settings .fixedScrolldivCommon { padding: 10px 12px 15px; }
  .settings-section { padding: 16px; }
  .settings-footer { flex-direction: column-reverse; align-items: stretch; }
  .settings-footer .btn-save { width: 100%; }
}
</style>
@endsection
@section('content')
<section class="view" id="settings">
  <div class="view-header"><div class="view-title">Company Settings</div></div>
  <div class="fixedScrolldivCommon">
    <div class="settings-container">
      <form id="settingsForm">
        <div class="settings-section">
          <h3>Basic Details</h3>
          <div class="form-grid">
            <div class="field"><label>Company Name</label><input type="text" id="company_name"></div>
            <div class="field"><label>Tagline</label><input type="text" id="company_tagline"></div>
            <div class="field"><label>Email</label><input type="email" id="company_email"></div>
            <div class="field"><label>Phone</label><input type="text" id="company_phone"></div>
            <div class="field"><label>Website</label><input type="text" id="company_website"></div>
            <div class="field"><label>GSTIN</label><input type="text" id="company_gstin"></div>
            <div class="field"><label>CGST Rate (%)</label><input type="number" id="cgst_rate" step="0.01" min="0" max="50" placeholder="e.g. 9"></div>
            <div class="field"><label>SGST Rate (%)</label><input type="number" id="sgst_rate" step="0.01" min="0" max="50" placeholder="e.g. 9"></div>
            <div class="field"><label>Instagram URL</label><input type="url" id="instagram_url" placeholder="https://instagram.com/..."></div>
            <div class="field"><label>Google Business URL</label><input type="url" id="google_business_url" placeholder="https://g.page/..."></div>
            <div class="field field-full"><label>Address</label><textarea id="company_address" rows="3"></textarea></div>
          </div>
        </div>
        <div class="settings-section">
          <h3>Bank Details (For Invoices)</h3>
          <div class="form-grid">
            <div class="field"><label>Account Name</label><input type="text" id="bank_account_name"></div>
            <div class="field"><label>Account Number</label><input type="text" id="bank_account_number"></div>
            <div class="field"><label>Bank Name</label><input type="text" id="bank_name"></div>
            <div class="field"><label>Branch Name</label><input type="text" id="bank_branch"></div>
            <div class="field"><label>IFSC Code</label><input type="text" id="bank_ifsc"></div>
            <div class="field"><label>Upload Company Logo</label><input type="file" id="company_logo" accept="image/*"></div>
            <div class="field"><label>Upload UPI QR Code</label><input type="file" id="upi_qr_code" accept="image/*"></div>
            <div class="field"><label>Upload Signature Photo</label><input type="file" id="signature" accept="image/*"></div>
          </div>
        </div>
        <div class="settings-footer">
          <div class="settings-footer-backup">
            <h3>System Backup & Export</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Download a complete backup of all your data (Customers, Vehicles, Job Cards, Invoices, etc.) as an Excel file.</p>
            <button type="button" class="btn-save" style="background: #000;" id="exportAllDataBtn"><i class="ti ti-download" style="margin-right: 6px;"></i>Export All Data to Excel</button>
          </div>
          <button type="submit" class="btn-save">Save Settings</button>
        </div>

      </form>
    </div>
  </div>
</section>
@endsection
@section('scripts')
<script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', async function() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('company_name').value = data.company_name || '';
      document.getElementById('company_tagline').value = data.company_tagline || '';
      document.getElementById('company_email').value = data.company_email || '';
      document.getElementById('company_phone').value = data.company_phone || '';
      document.getElementById('company_website').value = data.company_website || '';
      document.getElementById('company_gstin').value = data.company_gstin || '';
      document.getElementById('cgst_rate').value = (data.cgst_rate !== null && data.cgst_rate !== undefined) ? data.cgst_rate : '';
      document.getElementById('sgst_rate').value = (data.sgst_rate !== null && data.sgst_rate !== undefined) ? data.sgst_rate : '';
      document.getElementById('instagram_url').value = data.instagram_url || '';
      document.getElementById('google_business_url').value = data.google_business_url || '';
      document.getElementById('company_address').value = data.company_address || '';
      document.getElementById('bank_name').value = data.bank_name || '';
      document.getElementById('bank_branch').value = data.bank_branch || '';
      document.getElementById('bank_account_name').value = data.bank_account_name || '';
      document.getElementById('bank_account_number').value = data.bank_account_number || '';
      document.getElementById('bank_ifsc').value = data.bank_ifsc || '';
      
    }
  } catch (e) {}

  document.getElementById('settingsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('company_name', document.getElementById('company_name').value);
    formData.append('company_tagline', document.getElementById('company_tagline').value);
    formData.append('company_email', document.getElementById('company_email').value);
    formData.append('company_phone', document.getElementById('company_phone').value);
    formData.append('company_website', document.getElementById('company_website').value);
    formData.append('company_gstin', document.getElementById('company_gstin').value);
    formData.append('cgst_rate', document.getElementById('cgst_rate').value);
    formData.append('sgst_rate', document.getElementById('sgst_rate').value);
    formData.append('instagram_url', document.getElementById('instagram_url').value);
    formData.append('google_business_url', document.getElementById('google_business_url').value);
    formData.append('company_address', document.getElementById('company_address').value);
    formData.append('bank_name', document.getElementById('bank_name').value);
    formData.append('bank_branch', document.getElementById('bank_branch').value);
    formData.append('bank_account_name', document.getElementById('bank_account_name').value);
    formData.append('bank_account_number', document.getElementById('bank_account_number').value);
    formData.append('bank_ifsc', document.getElementById('bank_ifsc').value);
    
    const logoInput = document.getElementById('company_logo');
    if (logoInput.files.length > 0) formData.append('company_logo', logoInput.files[0]);
    
    const qrInput = document.getElementById('upi_qr_code');
    if (qrInput.files.length > 0) formData.append('upi_qr_code', qrInput.files[0]);

    const sigInput = document.getElementById('signature');
    if (sigInput.files.length > 0) formData.append('signature', sigInput.files[0]);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        body: formData
      });
      if (res.ok) alert('Settings saved successfully!');
      else alert('Failed to save settings.');
    } catch (err) { alert('Error saving settings.'); }
  });

  const exportBtn = document.getElementById('exportAllDataBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async function() {
      try {
        exportBtn.disabled = true;
        exportBtn.innerHTML = '<i class="ti ti-loader" style="margin-right: 6px;"></i>Exporting...';
        
        // Fetch all important datasets
        const endpoints = [
          { name: 'Customers', url: '/api/customers' },
          { name: 'Vehicles', url: '/api/vehicles' },
          { name: 'JobCards', url: '/api/jobcards' },
          { name: 'Invoices', url: '/api/invoices' },
          { name: 'Expenses', url: '/api/expenses' },
          { name: 'Services', url: '/api/services' },
          { name: 'Staff', url: '/api/staff' },
          { name: 'Inventory', url: '/api/inventory' },
          { name: 'Bays', url: '/api/bays' },
          { name: 'Branches', url: '/api/branches' }
        ];
        
        // Fetch all data first so we can cross-reference
        const allData = {};
        for (let ep of endpoints) {
          try {
            const res = await fetch(ep.url);
            if (res.ok) {
              let data = await res.json();
              allData[ep.name] = Array.isArray(data) ? data : [data];
            } else {
              allData[ep.name] = [];
            }
          } catch(err) {
            console.error('Failed to fetch ' + ep.name, err);
            allData[ep.name] = [];
          }
        }

        const wb = XLSX.utils.book_new();
        
        for (let ep of endpoints) {
          const data = allData[ep.name];
          
          const cleanData = data.map(row => {
            const newRow = {};
            for (let key in row) {
              // Exclude specific columns for Customers
              if (ep.name === 'Customers' && ['plan', 'points', 'loyalty_points', 'membership'].includes(key)) {
                continue;
              }
              
              if (row[key] !== null && typeof row[key] === 'object') {
                if (ep.name === 'Customers' && key === 'vehicles') continue; // Skip vehicles JSON dump
                newRow[key] = JSON.stringify(row[key]);
              } else {
                newRow[key] = row[key];
              }
            }
            
            // Add custom calculated columns
            if (ep.name === 'Customers') {
              const invoices = allData['Invoices'] || [];
              const washCount = invoices.filter(inv => inv.phone === row.phone && inv.status === 'paid').length;
              newRow['total_washes'] = washCount;
            }
            
            return newRow;
          });
          
          if (cleanData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(cleanData);
            XLSX.utils.book_append_sheet(wb, ws, ep.name);
          } else {
            const ws = XLSX.utils.json_to_sheet([{ Message: 'No data found' }]);
            XLSX.utils.book_append_sheet(wb, ws, ep.name);
          }
        }
        
        // Create file name with current date
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `Carwash_System_Backup_${dateStr}.xlsx`;
        
        // Trigger download
        XLSX.writeFile(wb, fileName);
        
        exportBtn.disabled = false;
        exportBtn.innerHTML = '<i class="ti ti-download" style="margin-right: 6px;"></i>Export All Data to Excel';
        alert('Export completed successfully!');
        
      } catch (err) {
        console.error(err);
        exportBtn.disabled = false;
        exportBtn.innerHTML = '<i class="ti ti-download" style="margin-right: 6px;"></i>Export All Data to Excel';
        alert('An error occurred during export.');
      }
    });
  }

});
</script>
@endsection
