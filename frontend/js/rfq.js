/* ============================
   rfq.js — RFQ Management Screen
   ============================ */

window.renderRFQs = function() {
  const q  = (document.getElementById('rfqSearch')?.value||'').toLowerCase();
  const st = document.getElementById('rfqStatusFilter')?.value||'';
  let rfqs = Store.getRFQs().filter(r =>
    (!q  || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)) &&
    (!st || r.status === st)
  );

  const rows = rfqs.map(r => `
    <tr>
      <td class="td-code">${r.id}</td>
      <td class="td-primary">${r.title}</td>
      <td>${r.category}</td>
      <td>${r.items.map(i=>`${i.qty} ${i.unit} ${i.name}`).join('<br>')}</td>
      <td>${fmtDate(r.deadline)}</td>
      <td>${r.assignedVendors.length} vendors</td>
      <td>${statusBadge(r.status)}</td>
      <td class="td-actions">
        <button class="btn btn-outline btn-sm" onclick="viewRFQ('${r.id}')">👁️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRFQ('${r.id}')">🗑️</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="8" class="empty-state">No RFQs found.</td></tr>`;

  document.getElementById('rfqTableContainer').innerHTML = `
    <table class="data-table">
      <thead><tr><th>RFQ ID</th><th>Title</th><th>Category</th><th>Items</th><th>Deadline</th><th>Vendors</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
};

window.showRFQForm = function() {
  document.getElementById('rfq-list-view').classList.add('hidden');
  document.getElementById('rfq-form-view').classList.remove('hidden');
  // Set min date to today
  document.getElementById('rfqDeadline').min = new Date().toISOString().split('T')[0];
  // Populate vendor checkboxes
  const vendors = Store.getVendors().filter(v => v.status === 'Active');
  document.getElementById('rfqVendorCheckboxes').innerHTML = vendors.map(v =>
    `<label><input type="checkbox" value="${v.id}" />${v.name} (${v.category})</label>`
  ).join('');
  // Reset form
  document.getElementById('rfqTitle').value = '';
  document.getElementById('rfqCategory').value = '';
  document.getElementById('rfqDesc').value = '';
  document.getElementById('rfqItems').innerHTML = `
    <div class="item-row">
      <input type="text" class="form-inp" placeholder="Item name" name="itemName" />
      <input type="number" class="form-inp w-20" placeholder="Qty" name="itemQty" min="1" oninput="calcTotals()" />
      <select class="form-inp w-20" name="itemUnit"><option>Pcs</option><option>Meters</option><option>Kg</option><option>Liters</option><option>Box</option></select>
      <button class="btn-icon-del" onclick="removeItemRow(this)">🗑️</button>
    </div>`;
};

window.hideRFQForm = function() {
  document.getElementById('rfq-form-view').classList.add('hidden');
  document.getElementById('rfq-list-view').classList.remove('hidden');
};

window.addItemRow = function() {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input type="text" class="form-inp" placeholder="Item name" name="itemName" />
    <input type="number" class="form-inp w-20" placeholder="Qty" name="itemQty" min="1" />
    <select class="form-inp w-20" name="itemUnit"><option>Pcs</option><option>Meters</option><option>Kg</option><option>Liters</option><option>Box</option></select>
    <button class="btn-icon-del" onclick="removeItemRow(this)">🗑️</button>`;
  document.getElementById('rfqItems').appendChild(row);
};

window.removeItemRow = function(btn) {
  const rows = document.querySelectorAll('#rfqItems .item-row');
  if (rows.length > 1) btn.closest('.item-row').remove();
};

window.submitRFQ = function() {
  const title    = document.getElementById('rfqTitle').value.trim();
  const category = document.getElementById('rfqCategory').value;
  const desc     = document.getElementById('rfqDesc').value.trim();
  const deadline = document.getElementById('rfqDeadline').value;

  if (!title || !category || !deadline) {
    showToast('Please fill Title, Category, and Deadline.', 'error'); return;
  }

  // Collect items
  const names = [...document.querySelectorAll('[name="itemName"]')].map(i => i.value.trim());
  const qtys  = [...document.querySelectorAll('[name="itemQty"]')].map(i => parseInt(i.value)||0);
  const units = [...document.querySelectorAll('[name="itemUnit"]')].map(i => i.value);
  const items = names.map((n,i) => ({ name:n, qty:qtys[i], unit:units[i] })).filter(it => it.name && it.qty > 0);
  if (!items.length) { showToast('Add at least one item.', 'error'); return; }

  // Collect assigned vendors
  const assignedVendors = [...document.querySelectorAll('#rfqVendorCheckboxes input:checked')].map(c => c.value);

  const rfqs = Store.getRFQs();
  const num  = Store.nextID('rfq');
  const id   = `RFQ-${num}`;
  const user = getUser()?.name || 'Admin';
  rfqs.unshift({ id, title, category, description:desc, items, deadline, status:'Open', assignedVendors, createdBy:user, createdAt: new Date().toISOString().split('T')[0] });
  Store.saveRFQs(rfqs);
  Store.addActivity('RFQ','📋',`RFQ ${id} "${title}" created.`, user);

  showToast(`RFQ ${id} created successfully!`);
  hideRFQForm();
  renderRFQs();
  updateBadges();
};

window.viewRFQ = function(id) {
  const rfq = Store.getRFQs().find(r => r.id === id);
  if (!rfq) return;
  const qts = Store.getQuotations().filter(q => q.rfqId === id);
  openModal(`📋 ${rfq.id} — ${rfq.title}`, `
    <div class="form-group"><div class="approval-meta">
      <div class="approval-meta-item"><strong>Category:</strong> ${rfq.category}</div>
      <div class="approval-meta-item"><strong>Status:</strong> ${statusBadge(rfq.status)}</div>
      <div class="approval-meta-item"><strong>Deadline:</strong> ${fmtDate(rfq.deadline)}</div>
      <div class="approval-meta-item"><strong>Created By:</strong> ${rfq.createdBy}</div>
    </div></div>
    <div class="form-group"><label>Items</label>
      <table class="data-table"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th></tr></thead>
      <tbody>${rfq.items.map(it=>`<tr><td>${it.name}</td><td>${it.qty}</td><td>${it.unit}</td></tr>`).join('')}</tbody></table>
    </div>
    <div class="form-group"><label>Quotations Received (${qts.length})</label>
      ${qts.length ? `<table class="data-table"><thead><tr><th>Vendor</th><th>Amount</th><th>Delivery</th><th>Status</th></tr></thead>
      <tbody>${qts.map(q=>`<tr><td>${q.vendorName}</td><td>${fmtMoney(q.grandTotal)}</td><td>${q.deliveryDays} days</td><td>${statusBadge(q.status)}</td></tr>`).join('')}</tbody></table>`
      : '<p style="color:var(--gray-400);font-size:.8rem;">No quotations yet.</p>'}
    </div>`);
};

window.deleteRFQ = function(id) {
  const rfq = Store.getRFQs().find(r => r.id === id);
  if (!rfq) return;
  confirmModal(
    `Delete <strong>${rfq.id} — ${rfq.title}</strong>?<br><small style="color:var(--gray-500);">This will also remove associated quotations and cannot be undone.</small>`,
    function() {
      Store.saveRFQs(Store.getRFQs().filter(r => r.id !== id));
      Store.saveQuotations(Store.getQuotations().filter(q => q.rfqId !== id));
      Store.addActivity('RFQ', '🗑️', `RFQ ${id} "${rfq.title}" deleted.`, getUser()?.name || 'Admin');
      showToast(`RFQ ${id} deleted.`, 'info');
      renderRFQs();
      updateBadges();
    }
  );
};
