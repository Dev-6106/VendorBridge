/* ============================
   vendors.js — Vendor Management Screen
   ============================ */

window.renderVendors = function() {
  const q   = (document.getElementById('vendorSearch')?.value||'').toLowerCase();
  const cat = document.getElementById('vendorCatFilter')?.value||'';
  const st  = document.getElementById('vendorStatusFilter')?.value||'';

  let vendors = Store.getVendors().filter(v =>
    (!q  || v.name.toLowerCase().includes(q) || v.gst.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)) &&
    (!cat || v.category === cat) &&
    (!st  || v.status === st)
  );

  const stars = r => '⭐'.repeat(Math.round(r)) + ` ${r}`;

  const rows = vendors.map(v => `
    <tr>
      <td class="td-primary">${v.name}</td>
      <td>${v.category}</td>
      <td style="font-size:.75rem;font-family:monospace;">${v.gst}</td>
      <td>${v.email}<br><span style="color:var(--gray-500);font-size:.72rem;">${v.phone}</span></td>
      <td>${stars(v.rating)}</td>
      <td>${statusBadge(v.status)}</td>
      <td class="td-actions">
        <button class="btn btn-outline btn-sm" onclick="showVendorModal('${v.id}')">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteVendor('${v.id}')">🗑️</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="7" class="empty-state">No vendors found.</td></tr>`;

  document.getElementById('vendorTableContainer').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Vendor Name</th><th>Category</th><th>GST Number</th><th>Contact</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
};

window.showVendorModal = function(id) {
  const vendor = id ? Store.getVendors().find(v => v.id === id) : null;
  const title  = vendor ? '✏️ Edit Vendor' : '🏢 Add New Vendor';

  const body = `
    <div class="form-row-2">
      <div class="form-group"><label>Vendor Name *</label><input class="form-inp" id="vName" value="${vendor?.name||''}" placeholder="Company name" /></div>
      <div class="form-group"><label>Category *</label>
        <select class="form-inp" id="vCat">
          ${['IT Equipment','Office Materials','Manufacturing','Infrastructure','Logistics','Other'].map(c=>`<option ${vendor?.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row-2">
      <div class="form-group"><label>GST Number *</label><input class="form-inp" id="vGST" value="${vendor?.gst||''}" placeholder="e.g. 22AABCT1332L1ZV" /></div>
      <div class="form-group"><label>Status</label>
        <select class="form-inp" id="vStatus">
          ${['Active','Pending','Suspended'].map(s=>`<option ${vendor?.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row-2">
      <div class="form-group"><label>Email *</label><input type="email" class="form-inp" id="vEmail" value="${vendor?.email||''}" placeholder="contact@vendor.com" /></div>
      <div class="form-group"><label>Phone *</label><input class="form-inp" id="vPhone" value="${vendor?.phone||''}" placeholder="9876543210" /></div>
    </div>
    <div class="form-group"><label>Rating (1–5)</label><input type="number" class="form-inp" id="vRating" value="${vendor?.rating||4.0}" min="1" max="5" step="0.1" /></div>
    <p id="vErr" style="color:var(--danger);font-size:.78rem;min-height:16px;"></p>`;

  openModal(title, body, `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveVendor('${id||''}')">💾 Save Vendor</button>`);
};

window.saveVendor = function(id) {
  const name   = document.getElementById('vName').value.trim();
  const cat    = document.getElementById('vCat').value;
  const gst    = document.getElementById('vGST').value.trim();
  const status = document.getElementById('vStatus').value;
  const email  = document.getElementById('vEmail').value.trim();
  const phone  = document.getElementById('vPhone').value.trim();
  const rating = parseFloat(document.getElementById('vRating').value)||4.0;

  if (!name || !gst || !email || !phone) {
    document.getElementById('vErr').textContent = 'Please fill all required fields.';
    return;
  }

  const vendors = Store.getVendors();
  if (id) {
    const idx = vendors.findIndex(v => v.id === id);
    if (idx > -1) vendors[idx] = { ...vendors[idx], name, category:cat, gst, status, email, phone, rating };
    Store.addActivity('Vendor','🏢',`Vendor "${name}" details updated.`);
    showToast('Vendor updated successfully!');
  } else {
    const newId = 'V' + String(Store.nextID('vendor')).padStart(3,'0');
    vendors.push({ id:newId, name, category:cat, gst, email, phone, status, rating, addedDate: new Date().toISOString().split('T')[0] });
    Store.addActivity('Vendor','🏢',`New vendor "${name}" registered.`);
    showToast('Vendor added successfully!');
  }
  Store.saveVendors(vendors);
  closeModal();
  renderVendors();
  updateBadges();
};

window.deleteVendor = function(id) {
  const vendor = Store.getVendors().find(v => v.id === id);
  if (!vendor) return;
  confirmModal(
    `Delete vendor <strong>${vendor.name}</strong>?<br><small style="color:var(--gray-500);">This action cannot be undone.</small>`,
    function() {
      Store.saveVendors(Store.getVendors().filter(v => v.id !== id));
      Store.addActivity('Vendor', '🗑️', `Vendor "${vendor.name}" (${id}) removed.`, getUser()?.name || 'Admin');
      showToast('Vendor deleted.', 'info');
      renderVendors();
    }
  );
};
