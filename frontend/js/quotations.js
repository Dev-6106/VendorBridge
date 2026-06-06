/* ============================
   quotations.js — Quotation Submission + Comparison
   ============================ */

/* ─── Quotation Submission ─── */

window.populateQTSelects = function() {
  const rfqs    = Store.getRFQs().filter(r => ['Open','Quoted','Under Review'].includes(r.status));
  const vendors = Store.getVendors().filter(v => v.status === 'Active');

  const qtRFQOpt = rfqs.map(r => `<option value="${r.id}">${r.id} — ${r.title}</option>`).join('');
  const qtRFQFil = rfqs.map(r => `<option value="${r.id}">${r.id} — ${r.title}</option>`).join('');
  const vOpts    = vendors.map(v => `<option value="${v.id}">${v.name}</option>`).join('');

  if (document.getElementById('qtRFQSelect'))  document.getElementById('qtRFQSelect').innerHTML  = '<option value="">Choose RFQ…</option>' + qtRFQOpt;
  if (document.getElementById('qtVendorSelect')) document.getElementById('qtVendorSelect').innerHTML = '<option value="">Choose Vendor…</option>' + vOpts;
  if (document.getElementById('qtRFQFilter'))  document.getElementById('qtRFQFilter').innerHTML  = '<option value="">All RFQs</option>' + qtRFQFil;
};

window.renderQuotationList = function() {
  const rfqId = document.getElementById('qtRFQFilter')?.value||'';
  let qts = Store.getQuotations().filter(q => !rfqId || q.rfqId === rfqId);

  const rows = qts.map(q => `
    <tr>
      <td class="td-code">${q.id}</td>
      <td class="td-code">${q.rfqId}</td>
      <td class="td-primary">${q.vendorName}</td>
      <td>${fmtMoney(q.subTotal)}</td>
      <td>${fmtMoney(q.grandTotal)}</td>
      <td>${q.deliveryDays} days</td>
      <td>${statusBadge(q.status)}</td>
      <td class="td-actions">
        <button class="btn btn-outline btn-sm" onclick="viewQuotation('${q.id}')">👁️</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="8" class="empty-state">No quotations found.</td></tr>`;

  document.getElementById('qtTableContainer').innerHTML = `
    <table class="data-table">
      <thead><tr><th>QT ID</th><th>RFQ</th><th>Vendor</th><th>Sub-Total</th><th>Grand Total</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
};

window.showQuotationForm = function() {
  document.getElementById('qt-list-view').classList.add('hidden');
  document.getElementById('qt-form-view').classList.remove('hidden');
  document.getElementById('qtItemsGroup').style.display = 'none';
  document.getElementById('qtTotals').style.display = 'none';
};

window.hideQuotationForm = function() {
  document.getElementById('qt-form-view').classList.add('hidden');
  document.getElementById('qt-list-view').classList.remove('hidden');
};

window.loadRFQItems = function() {
  const rfqId = document.getElementById('qtRFQSelect').value;
  if (!rfqId) { document.getElementById('qtItemsGroup').style.display='none'; return; }
  const rfq = Store.getRFQs().find(r => r.id === rfqId);
  if (!rfq) return;
  document.getElementById('qtItemsGroup').style.display = '';
  document.getElementById('qtItemsBody').innerHTML = rfq.items.map((it,i) => `
    <tr>
      <td>${it.name}</td>
      <td>${it.qty} ${it.unit}</td>
      <td><input type="number" class="form-inp" id="unitPrice_${i}" placeholder="0" min="0" oninput="calcQTTotals()" style="width:120px;" data-qty="${it.qty}" data-name="${it.name}" /></td>
      <td id="rowTotal_${i}">₹0</td>
    </tr>`).join('');
  document.getElementById('qtTotals').style.display = '';
  calcQTTotals();
};

window.calcQTTotals = function() {
  let sub = 0;
  document.querySelectorAll('#qtItemsBody input[id^="unitPrice_"]').forEach((inp,i) => {
    const qty   = parseInt(inp.dataset.qty)||0;
    const price = parseFloat(inp.value)||0;
    const total = qty * price;
    sub += total;
    const el = document.getElementById(`rowTotal_${i}`);
    if (el) el.textContent = fmtMoney(total);
  });
  const gstPct = parseFloat(document.getElementById('qtGST')?.value)||18;
  const gst    = sub * gstPct / 100;
  const grand  = sub + gst;
  document.getElementById('qtTotals').innerHTML = `
    <div class="totals-row"><span>Sub-Total</span><span>${fmtMoney(sub)}</span></div>
    <div class="totals-row"><span>GST (${gstPct}%)</span><span>${fmtMoney(gst)}</span></div>
    <div class="totals-row grand"><span>Grand Total</span><span>${fmtMoney(grand)}</span></div>`;
};

window.submitQuotation = function() {
  const rfqId    = document.getElementById('qtRFQSelect').value;
  const vendorId = document.getElementById('qtVendorSelect').value;
  const delivery = parseInt(document.getElementById('qtDelivery').value)||0;
  const gstPct   = parseFloat(document.getElementById('qtGST').value)||18;
  const notes    = document.getElementById('qtNotes').value.trim();

  if (!rfqId || !vendorId || !delivery) {
    showToast('Fill RFQ, Vendor, and Delivery days.', 'error'); return;
  }

  const rfq    = Store.getRFQs().find(r => r.id === rfqId);
  const vendor = Store.getVendors().find(v => v.id === vendorId);
  const inputs = document.querySelectorAll('#qtItemsBody input[id^="unitPrice_"]');
  if (!inputs.length) { showToast('Select RFQ to load items.', 'error'); return; }

  let sub = 0;
  const items = rfq.items.map((it,i) => {
    const up    = parseFloat(inputs[i]?.value)||0;
    const total = it.qty * up;
    sub += total;
    return { name:it.name, qty:it.qty, unitPrice:up, total };
  });
  const gst   = sub * gstPct / 100;
  const grand = sub + gst;

  const qts = Store.getQuotations();
  const num = Store.nextID('qt');
  const id  = `QT-${String(num).padStart(3,'0')}`;
  const user = getUser()?.name || 'Admin';

  qts.push({ id, rfqId, vendorId, vendorName:vendor.name, items, deliveryDays:delivery, gstPercent:gstPct, gstAmount:gst, subTotal:sub, grandTotal:grand, notes, status:'Submitted', submittedAt:new Date().toISOString().split('T')[0] });
  Store.saveQuotations(qts);

  // Update RFQ status to Quoted
  const rfqs = Store.getRFQs();
  const ri   = rfqs.findIndex(r => r.id === rfqId);
  if (ri > -1 && rfqs[ri].status === 'Open') { rfqs[ri].status = 'Quoted'; Store.saveRFQs(rfqs); }

  Store.addActivity('Quotation','💬',`Quotation ${id} submitted by ${vendor.name} for ${rfqId}.`, user);
  showToast(`Quotation ${id} submitted!`);
  hideQuotationForm();
  renderQuotationList();
  updateBadges();
};

window.viewQuotation = function(id) {
  const q = Store.getQuotations().find(x => x.id === id);
  if (!q) return;
  openModal(`💬 ${q.id} — ${q.rfqId}`, `
    <div class="approval-meta">
      <div class="approval-meta-item"><strong>Vendor:</strong> ${q.vendorName}</div>
      <div class="approval-meta-item"><strong>Delivery:</strong> ${q.deliveryDays} days</div>
      <div class="approval-meta-item"><strong>Status:</strong> ${statusBadge(q.status)}</div>
    </div>
    <table class="data-table" style="margin:1rem 0;">
      <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
      <tbody>${q.items.map(it=>`<tr><td>${it.name}</td><td>${it.qty}</td><td>${fmtMoney(it.unitPrice)}</td><td>${fmtMoney(it.total)}</td></tr>`).join('')}</tbody>
    </table>
    <div class="totals-box">
      <div class="totals-row"><span>Sub-Total</span><span>${fmtMoney(q.subTotal)}</span></div>
      <div class="totals-row"><span>GST (${q.gstPercent}%)</span><span>${fmtMoney(q.gstAmount)}</span></div>
      <div class="totals-row grand"><span>Grand Total</span><span>${fmtMoney(q.grandTotal)}</span></div>
    </div>
    ${q.notes ? `<p style="font-size:.8rem;color:var(--gray-600);"><strong>Notes:</strong> ${q.notes}</p>`:''}
  `);
};

/* ─── Quotation Comparison ─── */

window.populateCompRFQ = function() {
  const rfqs = Store.getRFQs();
  const sel  = document.getElementById('compRFQSelect');
  if (!sel) return;
  const cur  = sel.value;
  sel.innerHTML = '<option value="">Select RFQ…</option>' + rfqs.map(r=>`<option value="${r.id}"${r.id===cur?' selected':''}>${r.id} — ${r.title}</option>`).join('');
};

window.renderComparison = function() {
  const rfqId = document.getElementById('compRFQSelect')?.value;
  const sort  = document.getElementById('compSort')?.value || 'price';
  const box   = document.getElementById('comparisonContainer');

  if (!rfqId) { box.innerHTML='<div class="empty-state">Select an RFQ to compare quotations.</div>'; return; }

  let qts = Store.getQuotations().filter(q => q.rfqId === rfqId);
  if (!qts.length) { box.innerHTML='<div class="empty-state">No quotations submitted for this RFQ.</div>'; return; }

  // Sort
  if (sort === 'price')    qts.sort((a,b) => a.grandTotal - b.grandTotal);
  if (sort === 'delivery') qts.sort((a,b) => a.deliveryDays - b.deliveryDays);
  if (sort === 'rating')   qts.sort((a,b) => { const va=Store.getVendors().find(v=>v.id===a.vendorId); const vb=Store.getVendors().find(v=>v.id===b.vendorId); return (vb?.rating||0)-(va?.rating||0); });

  const minPrice    = Math.min(...qts.map(q=>q.grandTotal));
  const minDelivery = Math.min(...qts.map(q=>q.deliveryDays));

  const rows = qts.map((q,i) => {
    const vendor = Store.getVendors().find(v => v.id === q.vendorId);
    const isWinner = q.grandTotal === minPrice;
    return `<tr class="${isWinner?'winner':''}">
      <td><strong>${q.vendorName}</strong>${isWinner?'<span class="winner-badge">🏆 Best Price</span>':''}</td>
      <td>${q.items.map(it=>`${it.qty}× ${it.name}`).join('<br>')}</td>
      <td class="${q.grandTotal===minPrice?'lowest-price':''}">${fmtMoney(q.grandTotal)}</td>
      <td>${fmtMoney(q.subTotal)}</td>
      <td>${q.gstPercent}% (${fmtMoney(q.gstAmount)})</td>
      <td class="${q.deliveryDays===minDelivery?'lowest-price':''}">${q.deliveryDays} days</td>
      <td>⭐ ${vendor?.rating||'—'}</td>
      <td>${q.notes||'—'}</td>
      <td><button class="action-select" onclick="awardQuotation('${q.id}','${rfqId}')">🏆 Award</button></td>
    </tr>`;
  }).join('');

  box.innerHTML = `<table class="comparison-table">
    <thead><tr><th>Vendor</th><th>Items</th><th>Grand Total</th><th>Sub-Total</th><th>GST</th><th>Delivery</th><th>Rating</th><th>Notes</th><th>Action</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
};

window.awardQuotation = function(qtId, rfqId) {
  const qt = Store.getQuotations().find(q => q.id === qtId);
  if (!qt) return;
  confirmModal(
    `Award quotation to <strong>${qt.vendorName}</strong> for <strong>${fmtMoney(qt.grandTotal)}</strong>?<br><small style="color:var(--gray-500);">A Purchase Order will be created automatically.</small>`,
    function() {
      const rfqs = Store.getRFQs();
      const ri   = rfqs.findIndex(r => r.id === rfqId);
      if (ri > -1) { rfqs[ri].status = 'Awarded'; Store.saveRFQs(rfqs); }

      const pos = Store.getPOs();
      const num = Store.nextID('po');
      const poId= `PO-${String(num + 2000).slice(-4)}`;
      pos.push({ id:poId, rfqId, rfqTitle:rfqs[ri]?.title||rfqId, vendorId:qt.vendorId, vendorName:qt.vendorName, items:qt.items, subTotal:qt.subTotal, gstPercent:qt.gstPercent, gstAmount:qt.gstAmount, grandTotal:qt.grandTotal, status:'Draft', issuedDate:new Date().toISOString().split('T')[0], deliveryDate:'', invoiceGenerated:false });
      Store.savePOs(pos);
      Store.addActivity('PO','🛒',`PO ${poId} created from quotation ${qtId}.`, getUser()?.name||'Admin');
      showToast(`Quotation awarded! PO ${poId} created.`);
      renderComparison();
      updateBadges();
    }
  );
};
