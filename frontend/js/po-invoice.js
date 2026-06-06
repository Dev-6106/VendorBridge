/* ============================
   po-invoice.js — PO & Invoice Generation
   ============================ */

window.renderPOList = function() {
  const q  = (document.getElementById('poSearch')?.value||'').toLowerCase();
  const st = document.getElementById('poStatusFilter')?.value||'';
  let pos  = Store.getPOs().filter(p =>
    (!q  || p.id.toLowerCase().includes(q) || p.vendorName.toLowerCase().includes(q) || p.rfqTitle.toLowerCase().includes(q)) &&
    (!st || p.status === st)
  );

  const rows = pos.map(p => `
    <tr>
      <td class="td-code">${p.id}</td>
      <td class="td-primary">${p.rfqTitle}</td>
      <td>${p.vendorName}</td>
      <td style="font-weight:600;">${fmtMoney(p.grandTotal)}</td>
      <td>${fmtDate(p.issuedDate)}</td>
      <td>${statusBadge(p.status)}</td>
      <td>${p.invoiceGenerated ? '<span class="badge badge-success">Generated</span>' : '<span class="badge badge-gray">Pending</span>'}</td>
      <td class="td-actions">
        <button class="btn btn-outline btn-sm" onclick="viewPO('${p.id}')">📄 View</button>
        ${!p.invoiceGenerated ? `<button class="btn btn-primary btn-sm" onclick="generateInvoice('${p.id}')">🧾 Invoice</button>` : ''}
      </td>
    </tr>`).join('') || `<tr><td colspan="8" class="empty-state">No purchase orders found.</td></tr>`;

  document.getElementById('poTableContainer').innerHTML = `
    <table class="data-table">
      <thead><tr><th>PO Number</th><th>RFQ</th><th>Vendor</th><th>Amount</th><th>Date</th><th>Status</th><th>Invoice</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
};

window.viewPO = function(id) {
  const po   = Store.getPOs().find(p => p.id === id);
  if (!po) return;
  document.getElementById('po-list-view').classList.add('hidden');
  document.getElementById('po-detail-view').classList.remove('hidden');
  document.getElementById('poDetailCard').innerHTML = buildPOHTML(po);
};

function buildPOHTML(po) {
  const rows = po.items.map(it => `
    <tr>
      <td>${it.name}</td>
      <td style="text-align:center;">${it.qty}</td>
      <td style="text-align:right;">${fmtMoney(it.unitPrice)}</td>
      <td style="text-align:right;font-weight:600;">${fmtMoney(it.total)}</td>
    </tr>`).join('');

  const statusSel = ['Draft','Issued','Delivered','Paid'].map(s=>
    `<option value="${s}" ${po.status===s?'selected':''}>${s}</option>`).join('');

  return `<div class="po-detail" id="po-printable">
    <div class="po-header-row">
      <div class="po-branding">
        <div class="po-company">⚡ ERP Pro</div>
        <div class="po-number">Procurement Suite — Odoo × KSV</div>
        <div style="margin-top:.5rem;font-size:.75rem;color:var(--gray-500);">Generated: ${fmtDate(new Date().toISOString())}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:1.5rem;font-weight:800;color:var(--gray-900);">PURCHASE ORDER</div>
        <div class="td-code" style="font-size:1rem;margin-top:.25rem;">${po.id}</div>
        <div style="margin-top:.5rem;">${statusBadge(po.status)}</div>
      </div>
    </div>
    <div class="po-meta-grid">
      <div class="po-meta-item"><label>Vendor</label><span>${po.vendorName}</span></div>
      <div class="po-meta-item"><label>RFQ Reference</label><span>${po.rfqId||'—'}</span></div>
      <div class="po-meta-item"><label>Issue Date</label><span>${fmtDate(po.issuedDate)}</span></div>
      <div class="po-meta-item"><label>RFQ Title</label><span>${po.rfqTitle}</span></div>
      <div class="po-meta-item"><label>GST Rate</label><span>${po.gstPercent}%</span></div>
      <div class="po-meta-item"><label>Invoice Status</label><span>${po.invoiceGenerated?'✅ Generated':'⏳ Pending'}</span></div>
    </div>
    <table class="data-table" style="margin-bottom:1.5rem;">
      <thead><tr><th>Item Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals-box" style="max-width:340px;margin-left:auto;">
      <div class="totals-row"><span>Sub-Total</span><span>${fmtMoney(po.subTotal)}</span></div>
      <div class="totals-row"><span>GST (${po.gstPercent}%)</span><span>${fmtMoney(po.gstAmount)}</span></div>
      <div class="totals-row grand"><span>Grand Total</span><span>${fmtMoney(po.grandTotal)}</span></div>
    </div>
    <div class="po-actions-bar" style="margin-top:1.5rem;">
      <button class="btn btn-outline" onclick="backToPOList()">← Back</button>
      <div style="display:flex;gap:.5rem;align-items:center;">
        <label style="font-size:.8rem;font-weight:600;color:var(--gray-700);">Status:</label>
        <select class="filter-sel" id="poStatusUpdate" onchange="updatePOStatus('${po.id}',this.value)">${statusSel}</select>
      </div>
      <button class="btn btn-outline" onclick="window.print()">🖨️ Print</button>
      <button class="btn btn-primary" onclick="emailPO('${po.id}')">📧 Email</button>
      ${!po.invoiceGenerated ? `<button class="btn btn-success" onclick="generateInvoice('${po.id}')">🧾 Generate Invoice</button>` : ''}
    </div>
  </div>`;
}

window.backToPOList = function() {
  document.getElementById('po-detail-view').classList.add('hidden');
  document.getElementById('po-list-view').classList.remove('hidden');
  renderPOList();
};

window.updatePOStatus = function(id, status) {
  const pos = Store.getPOs();
  const idx = pos.findIndex(p => p.id === id);
  if (idx > -1) { pos[idx].status = status; Store.savePOs(pos); }
  Store.addActivity('PO','🛒',`PO ${id} status updated to ${status}.`, getUser()?.name||'Admin');
  showToast(`PO status updated to ${status}`);
};

window.generateInvoice = function(id) {
  const pos = Store.getPOs();
  const idx = pos.findIndex(p => p.id === id);
  if (idx < 0) return;
  pos[idx].invoiceGenerated = true;
  Store.savePOs(pos);
  Store.addActivity('Invoice','🧾',`Invoice generated for PO ${id} (${fmtMoney(pos[idx].grandTotal)}).`, getUser()?.name||'Admin');
  showToast(`Invoice generated for ${id}!`);
  renderPOList();
  // Refresh detail view if open
  const detailView = document.getElementById('po-detail-view');
  if (!detailView.classList.contains('hidden')) viewPO(id);
};

window.emailPO = function(id) {
  const po = Store.getPOs().find(p => p.id === id);
  if (po) {
    Store.addActivity('PO','📧',`PO ${id} emailed to ${po.vendorName}.`, getUser()?.name||'Admin');
    showToast(`PO ${id} emailed to ${po.vendorName}!`);
  }
};

window.showGeneratePO = function() {
  const rfqs = Store.getRFQs().filter(r => r.status === 'Awarded').map(r=>`<option value="${r.id}">${r.id} — ${r.title}</option>`).join('');
  const vendors = Store.getVendors().filter(v=>v.status==='Active').map(v=>`<option value="${v.id}">${v.name}</option>`).join('');
  openModal('🛒 Generate Purchase Order',`
    <div class="form-group"><label>RFQ Reference</label>
      <select class="form-inp" id="gpoRFQ">${rfqs||'<option>No awarded RFQs</option>'}</select></div>
    <div class="form-group"><label>Vendor *</label><select class="form-inp" id="gpoVendor">${vendors}</select></div>
    <div class="form-row-2">
      <div class="form-group"><label>Amount (Sub-Total ₹) *</label><input type="number" class="form-inp" id="gpoAmount" placeholder="0" /></div>
      <div class="form-group"><label>GST %</label>
        <select class="form-inp" id="gpoGST"><option value="5">5%</option><option value="12">12%</option><option value="18" selected>18%</option><option value="28">28%</option></select></div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="createPO()">Create PO</button>`);
};

window.createPO = function() {
  const rfqId   = document.getElementById('gpoRFQ')?.value;
  const vendorId= document.getElementById('gpoVendor').value;
  const sub     = parseFloat(document.getElementById('gpoAmount').value)||0;
  const gstPct  = parseFloat(document.getElementById('gpoGST').value)||18;
  if (!vendorId||!sub) { showToast('Fill Vendor and Amount.','error'); return; }

  const vendor  = Store.getVendors().find(v=>v.id===vendorId);
  const rfq     = rfqId ? Store.getRFQs().find(r=>r.id===rfqId) : null;
  const gst     = sub*gstPct/100;
  const grand   = sub+gst;
  const pos     = Store.getPOs();
  const num     = Store.nextID('po');
  const poId    = `PO-${String(num+2000).slice(-4)}`;
  const user    = getUser()?.name||'Admin';

  pos.push({ id:poId, rfqId:rfqId||'—', rfqTitle:rfq?.title||'Manual PO', vendorId, vendorName:vendor.name, items:[{name:'General Order',qty:1,unitPrice:sub,total:sub}], subTotal:sub, gstPercent:gstPct, gstAmount:gst, grandTotal:grand, status:'Draft', issuedDate:new Date().toISOString().split('T')[0], deliveryDate:'', invoiceGenerated:false });
  Store.savePOs(pos);
  Store.addActivity('PO','🛒',`PO ${poId} created manually.`, user);
  showToast(`PO ${poId} created!`);
  closeModal(); renderPOList();
};
