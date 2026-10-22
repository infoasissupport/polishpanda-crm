@extends('layouts.app')

@section('title', 'Lead Management')

@section('page-id', 'leads')

@section('styles')
  <link rel="stylesheet" href="{{ asset('css/leads.css') }}?v={{ file_exists(public_path('css/leads.css')) ? filemtime(public_path('css/leads.css')) : time() }}">
@endsection

@section('content')
<section class="view" id="leadsView">

  <!-- Header -->
  <div class="leads-header">
    <div class="leads-header-left">
      <div class="view-title">Lead management</div>
     
    </div>

    <div class="leads-header-actions">
      <button type="button" class="btn" id="exportLeadsBtn" title="Export to CSV">
        <i class="ti ti-download"></i>Export
      </button>

      <button type="button" class="btn btn-accent" id="addLeadBtn">
        <i class="ti ti-plus"></i>Add Lead
      </button>
    </div>
  </div>

  <!-- Everything below the header scrolls in one area; the header stays fixed -->
  <div class="fixedScrolldivCommon" id="leadsScrollArea">
  <!-- KPI Cards Grid -->
  <div class="leads-kpi-grid">
    <!-- Card 1: Total Leads -->
    <div class="leads-kpi-card">
      <div class="leads-kpi-icon leads-kpi-blue">
        <i class="ti ti-user-plus"></i>
      </div>
      <div class="leads-kpi-body">
        <div class="leads-kpi-label" id="kpiTotalLabel">Total Leads</div>
        <div class="leads-kpi-value" id="kpiTotalLeads">0</div>
        <div class="leads-kpi-sub">Pipeline: <span id="kpiPipelineValue" style="color:#0284c7;font-weight:600;">₹0</span></div>
      </div>
    </div>

    <!-- Card 2: New Inquiries -->
    <div class="leads-kpi-card">
      <div class="leads-kpi-icon leads-kpi-amber">
        <i class="ti ti-clock-hour-4"></i>
      </div>
      <div class="leads-kpi-body">
        <div class="leads-kpi-label">New Inquiries</div>
        <div class="leads-kpi-value" id="kpiNewLeads">0</div>
        <div class="leads-kpi-sub">Awaiting first follow-up</div>
      </div>
    </div>

    <!-- Card 3: Follow-ups -->
    <div class="leads-kpi-card">
      <div class="leads-kpi-icon leads-kpi-purple" id="kpiFollowUpIcon">
        <i class="ti ti-calendar-event"></i>
      </div>
      <div class="leads-kpi-body">
        <div class="leads-kpi-label">Follow-ups</div>
        <div class="leads-kpi-value" id="kpiFollowUpDue">0</div>
        <div class="leads-kpi-sub" id="kpiFollowUpSub">0 scheduled</div>
      </div>
    </div>

    <!-- Card 4: Converted Leads -->
    <div class="leads-kpi-card">
      <div class="leads-kpi-icon leads-kpi-teal">
        <i class="ti ti-circle-check"></i>
      </div>
      <div class="leads-kpi-body">
        <div class="leads-kpi-label" id="kpiConvertedLabel">Converted Leads</div>
        <div class="leads-kpi-value" id="kpiConvertedLeads">0</div>
        <div class="leads-kpi-sub">Win Rate: <span id="kpiConversionRate" style="color:#059669;font-weight:600;">0%</span></div>
      </div>
    </div>
  </div>

  <!-- Category Tabs -->
  <div class="lead-tabs-bar">
    <button type="button" class="lead-tab-btn active" data-category="detailing" id="tabBtnDetailing">
      <span class="lead-tab-icon"><i class="ti ti-car"></i></span>
      <span class="lead-tab-text">Detailing Leads</span>
      <span class="lead-tab-count" id="tabCountDetailing">0</span>
    </button>
    <button type="button" class="lead-tab-btn" data-category="insurance" id="tabBtnInsurance">
      <span class="lead-tab-icon"><i class="ti ti-shield-check"></i></span>
      <span class="lead-tab-text">Insurance Leads</span>
      <span class="lead-tab-count" id="tabCountInsurance">0</span>
      <span class="lead-tab-alert-pill" id="tabInsuranceExpiredBadge" style="display:none;" title="Expired Policies">0 Expired</span>
    </button>
    <button type="button" class="lead-tab-btn" data-category="travel" id="tabBtnTravel">
      <span class="lead-tab-icon"><i class="ti ti-plane"></i></span>
      <span class="lead-tab-text">Travel Leads</span>
      <span class="lead-tab-count" id="tabCountTravel">0</span>
    </button>
  </div>

  <!-- Insurance Expiry Alert Banner -->
  <div class="insurance-alert-banner" id="insuranceAlertBanner" style="display:none;">
    <div class="insurance-alert-left">
      <div class="insurance-alert-pulse">
        <i class="ti ti-alert-triangle"></i>
      </div>
      <div class="insurance-alert-content">
        <div class="insurance-alert-heading">
          <span id="insuranceAlertTitle">Insurance Policy Expiry Alert</span>
          <span class="insurance-alert-pill" id="insuranceAlertCountBadge">0 Expired</span>
        </div>
        <div class="insurance-alert-sub" id="insuranceAlertDesc">
          Some customer insurance policies have expired. Follow up promptly for renewals.
        </div>
      </div>
    </div>
    <div class="insurance-alert-actions">
      <button type="button" class="btn btn-warning-solid btn-sm" id="btnViewExpiredInsurance">
        <i class="ti ti-shield-x"></i> View Expired Policies
      </button>
      <button type="button" class="insurance-alert-dismiss" id="btnDismissInsuranceAlert" title="Dismiss Alert" aria-label="Close">
        <i class="ti ti-x"></i>
      </button>
    </div>
  </div>

  <!-- Table toolbar: search + filters -->
  <div class="leads-toolbar">
    <div class="leads-search-box">
      <i class="ti ti-search"></i>
      <input type="text" id="leadSearchInput" placeholder="Search by name, phone, vehicle, or service..." aria-label="Search leads" autocomplete="off">
    </div>

    <div class="leads-filter-group">
      <select id="leadStatusFilter" aria-label="Filter by Status" class="leads-select">
        <option value="all">All Statuses</option>
        <option value="new">New Inquiry</option>
        <option value="contacted">Contacted</option>
        <option value="in_discussion">In Discussion</option>
        <option value="quote_sent">Quote Sent</option>
        <option value="converted">Converted</option>
        <option value="lost">Lost</option>
      </select>

      <select id="leadSourceFilter" aria-label="Filter by Source" class="leads-select">
        <option value="all">All Sources</option>
        <option value="Walk-in">Walk-in</option>
        <option value="WhatsApp">WhatsApp</option>
        <option value="Phone Call">Phone Call</option>
        <option value="Instagram">Instagram</option>
        <option value="Google">Google</option>
        <option value="Website">Website</option>
        <option value="Referral">Referral</option>
        <option value="Other">Other</option>
      </select>
    </div>
  </div>

  <!-- Table Container -->
  <div class="table-wrap">
    <div class="table-scroll">
      <table class="leads-table">
        <thead id="leadsTableHead">
          <tr>
            <th class="col-sl">#</th>
            <th>Lead Details</th>
            <th>Vehicle / Plate</th>
            <th>Interested Service</th>
            <th>Source</th>
            <th>Status</th>
            <th>Est. Value</th>
            <th>Follow-up</th>
            <th style="text-align:right;padding-right:16px;">Actions</th>
          </tr>
        </thead>
        <tbody id="leadsTableBody">
          <!-- Dynamically populated -->
        </tbody>
      </table>
      <div class="leads-empty-state" id="leadsEmptyState" style="display:none;">
        <div class="empty-icon"><i class="ti ti-user-plus"></i></div>
        <div class="empty-title">No leads found</div>
        <div class="empty-desc">Create your first sales lead or adjust your filter criteria.</div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="table-pagination">
      <span id="leadsPageInfo">Showing 0 of 0</span>
      <div class="pagination-btns">
        <button type="button" class="btn" id="leadsPrevBtn" disabled>Prev</button>
        <button type="button" class="btn" id="leadsNextBtn" disabled>Next</button>
      </div>
    </div>
  </div>
  </div>

</section>

<!-- Add / Edit Lead Modal -->
<div class="modal-overlay" id="leadModal">
  <div class="modal" style="max-width: 660px;">
    <div class="modal-header">
      <div class="modal-title" id="leadModalTitle">Add New Lead</div>
      <button type="button" class="icon-btn" onclick="window.SW.closeModal('leadModal')" aria-label="Close modal">
        <i class="ti ti-x"></i>
      </button>
    </div>
    <form id="leadForm" novalidate onsubmit="return false;">
      <input type="hidden" id="leadId" value="">
      <div class="modal-body">
        
        <!-- Category Selector -->
        <div class="lead-modal-category-group">
          <label class="modal-section-label">Lead Category <span class="req">*</span></label>
          <div class="lead-category-pills">
            <label class="lead-cat-pill">
              <input type="radio" name="leadCategory" value="detailing" checked>
              <span class="pill-btn"><i class="ti ti-car"></i> Detailing</span>
            </label>
            <label class="lead-cat-pill">
              <input type="radio" name="leadCategory" value="insurance">
              <span class="pill-btn"><i class="ti ti-shield-check"></i> Insurance</span>
            </label>
            <label class="lead-cat-pill">
              <input type="radio" name="leadCategory" value="travel">
              <span class="pill-btn"><i class="ti ti-plane"></i> Travel</span>
            </label>
          </div>
        </div>

        <!-- Contact Information (Common) -->
        <div class="modal-row">
          <div class="field">
            <label for="leadName">Customer Name <span class="req">*</span></label>
            <input type="text" id="leadName" required placeholder="e.g. Rahul Sharma" autocomplete="off">
          </div>
          <div class="field">
            <label for="leadPhone">Phone Number <span class="req">*</span></label>
            <input type="tel" id="leadPhone" required placeholder="e.g. 9876543210" autocomplete="off">
          </div>
        </div>

        <div class="field">
          <label for="leadEmail">Email Address</label>
          <input type="email" id="leadEmail" placeholder="e.g. rahul@example.com" autocomplete="off">
        </div>

        <!-- Section: Detailing Specific Fields -->
        <div id="sectionDetailingFields" class="category-fields-block">
          <div class="modal-row">
            <div class="field">
              <label for="leadVehicle">Vehicle Make / Model</label>
              <input type="text" id="leadVehicle" placeholder="e.g. BMW 3 Series, Tata Safari" autocomplete="off">
            </div>
            <div class="field">
              <label for="leadPlate">Vehicle Number / Plate</label>
              <input type="text" id="leadPlate" placeholder="e.g. KL 07 CD 1234" style="text-transform:uppercase;" autocomplete="off">
            </div>
          </div>

          <div class="modal-row">
            <div class="field">
              <label for="leadService">Interested Service</label>
              <select id="leadService">
                <option value="">Select a service...</option>
              </select>
            </div>
            <div class="field">
              <label for="leadValue">Estimated Value (₹)</label>
              <input type="number" id="leadValue" min="0" step="100" placeholder="e.g. 15000">
            </div>
          </div>

          <div class="field" id="customServiceWrap" style="display:none;">
            <label for="leadCustomService">Custom Service Name</label>
            <input type="text" id="leadCustomService" placeholder="e.g. Paint Protection Film (PPF)" autocomplete="off">
          </div>
        </div>

        <!-- Section: Insurance Specific Fields -->
        <div id="sectionInsuranceFields" class="category-fields-block" style="display:none;">
          <div class="modal-row">
            <div class="field">
              <label for="leadInsuranceType">Insurance Type <span class="req">*</span></label>
              <!-- shown as an icon dropdown by leads.js (enhanceIconSelect); the select keeps the value -->
              <select id="leadInsuranceType">
                <option value="">Select insurance type...</option>
                <option value="Car Insurance - Comprehensive">Car Insurance (Comprehensive / Zero Dep)</option>
                <option value="Car Insurance - Third Party">Car Insurance (Third Party Only)</option>
                <option value="Two Wheeler Insurance">Two Wheeler / Bike Insurance</option>
                <option value="Commercial Vehicle Insurance">Commercial Vehicle Insurance</option>
                <option value="Health Insurance">Health / Mediclaim Insurance</option>
                <option value="Life & Term Insurance">Life / Term Insurance</option>
                <option value="Travel Insurance">Travel Insurance</option>
                <option value="__custom__">Other / Custom Insurance Type...</option>
              </select>
            </div>
            <div class="field">
              <label for="leadPolicyNumber">Policy / Reg. Number</label>
              <input type="text" id="leadPolicyNumber" placeholder="e.g. POL-892147 or KL07CD1234" autocomplete="off">
            </div>
          </div>

          <div class="field" id="customInsuranceTypeWrap" style="display:none;">
            <label for="leadCustomInsuranceType">Custom Insurance Type Name <span class="req">*</span></label>
            <input type="text" id="leadCustomInsuranceType" placeholder="e.g. Marine Cargo / Business Asset" autocomplete="off">
          </div>

          <div class="modal-row">
            <div class="field">
              <label for="leadInsuranceFromDate">Validity From Date <span class="req">*</span></label>
              <input type="date" id="leadInsuranceFromDate">
            </div>
            <div class="field">
              <label for="leadInsuranceToDate">Validity To Date (Expiry) <span class="req">*</span></label>
              <input type="date" id="leadInsuranceToDate">
            </div>
          </div>

          <div class="modal-row">
            <div class="field">
              <label id="leadInsuranceTakenLabel">Has Customer Taken Insurance? <span class="req">*</span></label>
              <!-- the select keeps the value (read/written by leads.js); the custom dropdown below drives it -->
              <select id="leadInsuranceTaken" class="ins-taken-select" tabindex="-1" aria-hidden="true">
                <option value="1">Yes - Policy Issued / Taken</option>
                <option value="0">No - Inquiry / Quote Stage Only</option>
              </select>
              <div class="ins-dd" id="leadInsuranceTakenDd">
                <button type="button" class="ins-dd-trigger" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="leadInsuranceTakenLabel">
                  <span class="ins-dd-icon ins-dd-icon--yes" data-icon-for="1"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10c-4-1.5-7-5.5-7-10V6z"/><path d="M9 12l2 2l4-4"/></svg></span>
                  <span class="ins-dd-icon ins-dd-icon--no" data-icon-for="0"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
                  <span class="ins-dd-value">Yes - Policy Issued / Taken</span>
                  <svg class="ins-dd-caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6l6-6"/></svg>
                </button>
                <div class="ins-dd-menu" role="listbox" aria-labelledby="leadInsuranceTakenLabel">
                  <button type="button" class="ins-dd-opt" role="option" data-value="1" aria-selected="true">
                    <span class="ins-dd-icon ins-dd-icon--yes"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10c-4-1.5-7-5.5-7-10V6z"/><path d="M9 12l2 2l4-4"/></svg></span>
                    <span class="ins-dd-opt-text"><strong>Yes - Policy Issued / Taken</strong><small>Customer already has the policy</small></span>
                    <svg class="ins-dd-check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5l9-10"/></svg>
                  </button>
                  <button type="button" class="ins-dd-opt" role="option" data-value="0" aria-selected="false">
                    <span class="ins-dd-icon ins-dd-icon--no"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
                    <span class="ins-dd-opt-text"><strong>No - Inquiry / Quote Stage Only</strong><small>Still deciding or awaiting a quote</small></span>
                    <svg class="ins-dd-check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5l9-10"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="field">
              <label for="leadInsurancePremium">Premium / Value (₹)</label>
              <input type="number" id="leadInsurancePremium" min="0" step="100" placeholder="e.g. 18500">
            </div>
          </div>
        </div>

        <!-- Section: Travel Specific Fields -->
        <div id="sectionTravelFields" class="category-fields-block" style="display:none;">
          <div class="modal-row">
            <div class="field">
              <label for="leadTravelDestination">Travel Destination / Package <span class="req">*</span></label>
              <input type="text" id="leadTravelDestination" placeholder="e.g. Dubai 5D4N, Bali, Kashmir Tour" autocomplete="off">
            </div>
            <div class="field">
              <label for="leadTravelPax">Passengers (Pax)</label>
              <input type="number" id="leadTravelPax" min="1" max="100" placeholder="e.g. 2 adults, 1 child">
            </div>
          </div>

          <div class="modal-row">
            <div class="field">
              <label for="leadTravelDate">Departure Date</label>
              <input type="date" id="leadTravelDate">
            </div>
            <div class="field">
              <label for="leadTravelReturnDate">Return Date</label>
              <input type="date" id="leadTravelReturnDate">
            </div>
          </div>

          <div class="field">
            <label for="leadTravelBudget">Estimated Budget / Value (₹)</label>
            <input type="number" id="leadTravelBudget" min="0" step="500" placeholder="e.g. 85000">
          </div>
        </div>

        <!-- Source, Status & Follow-up (Common) -->
        <div class="modal-row">
          <div class="field">
            <label for="leadSource">Lead Source</label>
            <select id="leadSource">
              <option value="Walk-in">Walk-in</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Instagram">Instagram</option>
              <option value="Google">Google Search / Maps</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral / Word of Mouth</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="field">
            <label for="leadStatus">Lead Status</label>
            <select id="leadStatus">
              <option value="new">New Inquiry</option>
              <option value="contacted">Contacted</option>
              <option value="in_discussion">In Discussion</option>
              <option value="quote_sent">Quote Sent</option>
              <option value="converted">Converted / Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label for="leadFollowUp">Follow-up Date</label>
          <input type="date" id="leadFollowUp">
        </div>

        <div class="field">
          <label for="leadNotes">Notes & Customer Requirements</label>
          <textarea id="leadNotes" rows="3" placeholder="Customer requirements, preferred dates, follow-up notes..."></textarea>
        </div>

      </div>

      <div class="modal-footer">
        <button type="button" class="btn danger" id="deleteLeadBtn" style="display:none;margin-right:auto;">
          <i class="ti ti-x"></i>Delete Lead
        </button>
        <button type="button" class="btn" id="openLeadFollowUpsFromEditBtn" style="display:none;">
          <i class="ti ti-calendar-event"></i> Follow-ups
        </button>
        <button type="button" class="btn" onclick="window.SW.closeModal('leadModal')">Cancel</button>
        <button type="button" class="btn btn-accent" id="saveLeadBtn">
          <i class="ti ti-plus"></i>Save Lead
        </button>
      </div>
    </form>
  </div>
</div>

<!-- Convert Lead to Customer Modal -->
<div class="modal-overlay" id="convertLeadModal">
  <div class="modal" style="max-width: 460px;">
    <div class="modal-header">
      <div class="modal-title">Convert Lead to Customer</div>
      <button type="button" class="icon-btn" onclick="window.SW.closeModal('convertLeadModal')" aria-label="Close modal">
        <i class="ti ti-x"></i>
      </button>
    </div>
    <div class="modal-body" style="padding: 20px 24px;">
      <div class="convert-summary-box">
        <div class="convert-avatar" id="convertLeadAvatar">--</div>
        <div class="convert-info">
          <div class="convert-name" id="convertLeadName">Lead Name</div>
          <div class="convert-sub" id="convertLeadPhone">Phone Number</div>
        </div>
      </div>
      <p style="font-size:13.5px;color:#475569;margin-top:16px;line-height:1.5;">
        Converting this lead will automatically:
      </p>
      <ul class="convert-checklist">
        <li><i class="ti ti-check"></i> Create an active profile in <strong>Customers</strong></li>
        <li><i class="ti ti-check"></i> Register the vehicle under their profile</li>
        <li><i class="ti ti-check"></i> Mark this lead as <strong>Converted</strong></li>
      </ul>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn" onclick="window.SW.closeModal('convertLeadModal')">Cancel</button>
      <button type="button" class="btn btn-accent" id="confirmConvertBtn">
        <i class="ti ti-user-plus"></i>Convert Now
      </button>
    </div>
  </div>
</div>

<!-- Follow-up History & Log Modal -->
<div class="modal-overlay" id="leadFollowUpModal">
  <div class="modal" style="max-width: 660px;">
    <div class="modal-header">
      <div class="modal-title">Follow-up History & Activity</div>
      <button type="button" class="icon-btn" onclick="window.SW.closeModal('leadFollowUpModal')" aria-label="Close modal">
        <i class="ti ti-x"></i>
      </button>
    </div>
    <div class="modal-body fu-modal-body">
      
      <!-- Lead Summary Header -->
      <div class="fu-lead-card">
        <div class="fu-lead-main">
          <div class="fu-lead-name" id="fuLeadName">Lead Name</div>
          <div class="fu-lead-contact" id="fuLeadContact">Phone • Vehicle • Service</div>
        </div>
        <div class="fu-lead-status" id="fuLeadStatusBadge">
          <span class="lead-status-pill status-new">New Inquiry</span>
        </div>
      </div>

      <!-- Log New Follow-up Section -->
      <div class="fu-new-box">
        <div class="fu-new-head">
          <span class="fu-new-icon"><i class="ti ti-notes"></i></span>
          <div>
            <div class="fu-new-title">Log What Happened in Follow-up</div>
            <div class="fu-new-sub">Record the call, message or visit and set the next reminder.</div>
          </div>
        </div>
        <form id="followUpForm">
          <input type="hidden" id="fuLeadId" value="">

          <div class="modal-row">
            <div class="field">
              <label for="fuType">Channel / Type <span class="req">*</span></label>
              <select id="fuType">
                <option value="Phone Call">📞 Phone Call</option>
                <option value="WhatsApp">💬 WhatsApp Message</option>
                <option value="Store Visit">🏢 In-Person / Store Visit</option>
                <option value="Email">✉️ Email</option>
                <option value="Note">📝 Note / Update</option>
              </select>
            </div>
            <div class="field">
              <label for="fuStatus">Update Lead Status</label>
              <select id="fuStatus">
                <option value="">Keep Current Status</option>
                <option value="contacted">Contacted</option>
                <option value="in_discussion">In Discussion</option>
                <option value="quote_sent">Quote Sent</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="fuNotes">What happened during this interaction? <span class="req">*</span></label>
            <textarea id="fuNotes" rows="3" required placeholder="Describe conversation details, customer questions, quotation given, pricing discussed, etc..."></textarea>
          </div>

          <div class="modal-row fu-actions-row">
            <div class="field">
              <label for="fuNextDate">Next Follow-up Date <span class="fu-optional">(optional)</span></label>
              <input type="date" id="fuNextDate">
            </div>
            <button type="submit" class="btn btn-accent fu-save-btn" id="saveFollowUpBtn">
              <i class="ti ti-check"></i> Save Follow-up
            </button>
          </div>
        </form>
      </div>

      <!-- Timeline History Section -->
      <div class="fu-history-box">
        <div class="fu-section-title">
          <i class="ti ti-clock-hour-4"></i> Interaction History (<span id="fuHistoryCount">0</span>)
        </div>
        <div class="fu-timeline" id="fuTimeline">
          <!-- Populated dynamically -->
        </div>
        <div class="fu-empty-history" id="fuEmptyHistory" style="display:none;">
          <p>No follow-up interactions recorded yet. Use the form above to log your first call or message.</p>
        </div>
      </div>

    </div>
    <div class="modal-footer">
      <button type="button" class="btn" onclick="window.SW.closeModal('leadFollowUpModal')">Close</button>
    </div>
  </div>
</div>

@endsection

@section('scripts')
  <script src="{{ asset('js/leads.js') }}?v={{ file_exists(public_path('js/leads.js')) ? filemtime(public_path('js/leads.js')) : time() }}"></script>
@endsection
