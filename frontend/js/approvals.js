/* ============================
   approvals.js — Approval Workflow Screen
   ============================ */

window.renderApprovals = function() {
  const filter = document.getElementById('approvalFilter')?.value || '';
  let approvals = Store.getApprovals().filter(a => !filter || a.status === filter);

  const container = document.getElementById('approvalsContainer');
  if (!approvals.length) {
    container.innerHTML = '<div class="empty-state">No approval requests found.</div>';
    return;
  }

  container.innerHTML = approvals.map(a => {
    const stages = a.stages || ['Dept Head','Finance','MD'];
    const dots   = stages.map((s,i) => {
      const cls = i < a.stage ? 'done' : (i === a.stage-1 ? (a.status==='Pending'?'current':'done') : 'pending');
      const line = i < stages.length-1 ? `<div class="timeline-line ${i<a.stage-1?'done':''}"></div>` : '';
      return `<div class="timeline-step"><div class="timeline-dot ${cls}" title="${s}">${i+1}</div>${line}</div>`;
    }).join('');

    const isEditable = a.status === 'Pending';
    const actionHtml = isEditable ? `
      <textarea class="form-inp" id="remarks_${a.id}" placeholder="Add remarks…" rows="2" style="flex:1;"></textarea>
      <button class="btn btn-success" onclick="processApproval('${a.id}','Approved')">✅ Approve</button>
      <button class="btn btn-danger"  onclick="processApproval('${a.id}','Rejected')">❌ Reject</button>` : `
      <div style="font-size:.8rem;color:var(--gray-600);"><strong>Remarks:</strong> ${a.remarks||'—'}</div>`;

    return `<div class="approval-card">
      <div class="approval-header">
        <div>
          <div style="font-weight:700;font-size:.95rem;color:var(--gray-900);">${a.title}</div>
          <div style="font-size:.75rem;color:var(--gray-500);margin-top:2px;">${a.id} · ${a.type}</div>
        </div>
        <div>${statusBadge(a.status)}</div>
      </div>
      <div class="approval-meta">
        <div class="approval-meta-item"><strong>Amount:</strong> ${fmtMoney(a.amount)}</div>
        <div class="approval-meta-item"><strong>Requested By:</strong> ${a.requestedBy}</div>
        <div class="approval-meta-item"><strong>Department:</strong> ${a.department}</div>
        <div class="approval-meta-item"><strong>Ref:</strong> ${a.refId}</div>
        <div class="approval-meta-item"><strong>Date:</strong> ${fmtDate(a.requestedAt)}</div>
      </div>
      <div style="margin-bottom:.75rem;">
        <div style="font-size:.72rem;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.5rem;">Approval Timeline</div>
        <div class="approval-timeline">${dots}</div>
        <div style="display:flex;gap:1.5rem;margin-top:.375rem;">
          ${stages.map((s,i)=>`<div style="font-size:.7rem;color:${i<a.stage?'var(--primary)':'var(--gray-400)'};">${s}</div>`).join('')}
        </div>
      </div>
      <div class="approval-actions">${actionHtml}</div>
    </div>`;
  }).join('');

  updateBadges();
};

window.processApproval = function(id, decision) {
  const approvals = Store.getApprovals();
  const idx       = approvals.findIndex(a => a.id === id);
  if (idx < 0) return;

  const a       = approvals[idx];
  const remarks = document.getElementById(`remarks_${id}`)?.value.trim() || '';
  const user    = getUser()?.name || 'Admin';

  if (decision === 'Approved' && a.stage < a.totalStages) {
    approvals[idx].stage++;
    if (approvals[idx].stage >= approvals[idx].totalStages) {
      approvals[idx].status = 'Approved';
      approvals[idx].remarks = remarks;
    }
  } else if (decision === 'Rejected') {
    approvals[idx].status  = 'Rejected';
    approvals[idx].remarks = remarks;
  } else if (decision === 'Approved') {
    approvals[idx].status  = 'Approved';
    approvals[idx].remarks = remarks;
  }

  Store.saveApprovals(approvals);
  Store.addActivity('Approval', decision==='Approved'?'✅':'❌',
    `Approval ${id} ${decision.toLowerCase()} by ${user}. ${remarks ? 'Remarks: '+remarks : ''}`, user);

  showToast(`${a.title} ${decision.toLowerCase()}!`, decision==='Approved' ? 'success' : 'error');
  renderApprovals();
};

window.showNewApprovalModal = function() {
  const rfqs = Store.getRFQs().map(r => `<option value="${r.id}">${r.id} — ${r.title}</option>`).join('');
  openModal('✅ New Approval Request',`
    <div class="form-group"><label>Type</label>
      <select class="form-inp" id="aprType"><option value="RFQ">RFQ</option><option value="Quotation">Quotation</option><option value="PO">Purchase Order</option></select>
    </div>
    <div class="form-group"><label>Reference</label><select class="form-inp" id="aprRef">${rfqs}</select></div>
    <div class="form-group"><label>Amount (₹)</label><input type="number" class="form-inp" id="aprAmount" placeholder="0" /></div>
    <div class="form-group"><label>Department</label><input class="form-inp" id="aprDept" placeholder="e.g. IT, Finance, Operations" /></div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="createApproval()">Submit</button>`);
};

window.createApproval = function() {
  const type   = document.getElementById('aprType').value;
  const refId  = document.getElementById('aprRef').value;
  const amount = parseFloat(document.getElementById('aprAmount').value)||0;
  const dept   = document.getElementById('aprDept').value.trim();
  const user   = getUser()?.name || 'Admin';

  if (!refId || !dept) { showToast('Fill all fields.','error'); return; }

  const ref    = type === 'RFQ' ? Store.getRFQs().find(r=>r.id===refId) : null;
  const title  = ref ? ref.title : refId;
  const approvals = Store.getApprovals();
  const num    = Store.nextID('apr');
  const id     = `APR-${String(num).padStart(3,'0')}`;

  approvals.push({ id, refId, type, title, amount, requestedBy:user, department:dept, status:'Pending', stage:1, totalStages:3, stages:['Dept Head','Finance','MD'], remarks:'', requestedAt:new Date().toISOString().split('T')[0] });
  Store.saveApprovals(approvals);
  Store.addActivity('Approval','⏳',`Approval request ${id} submitted for ${title}.`, user);
  showToast(`Approval request ${id} submitted!`);
  closeModal(); renderApprovals(); updateBadges();
};
