/* ============================
   navigation.js — Auth, Routing, UI Shell
   ============================ */

/* ── Auth Guard ── */
(function() {
  const t = localStorage.getItem('erp_token') || sessionStorage.getItem('erp_token');
  if (!t) window.location.href = 'index.html';
})();

/* ── Current user ── */
function getUser() {
  try {
    const raw = localStorage.getItem('erp_user') || sessionStorage.getItem('erp_user');
    return raw ? JSON.parse(raw) : { name:'User', role:'Officer', avatar:'https://i.pravatar.cc/100?img=47' };
  } catch { return { name:'User', role:'Officer', avatar:'https://i.pravatar.cc/100?img=47' }; }
}

/* ── Render user info ── */
(function renderUser() {
  const u = getUser();
  document.getElementById('sidebarName').textContent  = u.name;
  document.getElementById('sidebarRole').textContent  = u.role;
  document.getElementById('topbarName').textContent   = u.name;
  document.getElementById('topbarRole').textContent   = u.role;
  if (u.avatar) {
    document.getElementById('sidebarAvatar').src = u.avatar;
    document.getElementById('topbarAvatar').src  = u.avatar;
  }
})();

/* ── Live clock ── */
function updateClock() {
  const el = document.getElementById('liveClock');
  if (el) el.textContent = new Date().toLocaleString('en-IN', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:true });
}
updateClock(); setInterval(updateClock, 1000);

/* ── Navigation ── */
const PAGE_TITLES = { home:'Dashboard', vendors:'Vendor Management', rfq:'RFQ Management', quotations:'Quotations', comparison:'Quotation Comparison', approvals:'Approval Workflow', 'po-invoice':'Purchase Orders & Invoices', activity:'Activity & Logs', reports:'Reports & Analytics' };

window.navigateTo = function(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (nav) nav.classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[pageId] || pageId;

  // Lazy init per page
  if (pageId === 'home')        renderHome();
  if (pageId === 'vendors')     renderVendors();
  if (pageId === 'rfq')         renderRFQs();
  if (pageId === 'quotations')  { populateQTSelects(); renderQuotationList(); }
  if (pageId === 'comparison')  populateCompRFQ();
  if (pageId === 'approvals')   renderApprovals();
  if (pageId === 'po-invoice')  { renderPOList(); }
  if (pageId === 'activity')    renderActivity();
  if (pageId === 'reports')     initReports();
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.page));
});

/* ── Logout ── */
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('erp_token'); localStorage.removeItem('erp_user');
  sessionStorage.removeItem('erp_token'); sessionStorage.removeItem('erp_user');
  window.location.href = 'index.html';
});

/* ── Toast Notifications ── */
window.showToast = function(msg, type = 'success') {
  const c   = document.getElementById('toastContainer');
  const t   = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  t.innerHTML = `<span>${icons[type]||'📢'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(20px)'; t.style.transition='all .3s'; setTimeout(()=>t.remove(), 300); }, 3000);
};

/* ── Modal ── */
window.openModal = function(title, bodyHTML, footer) {
  document.getElementById('modalHead').innerHTML = `<h3>${title}</h3><button class="modal-close" onclick="closeModal()">✕</button>`;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  if (footer) document.getElementById('modalBody').insertAdjacentHTML('beforeend', `<div class="modal-footer">${footer}</div>`);
  document.getElementById('modalOverlay').classList.remove('hidden');
};
window.closeModal = function(e) {
  if (!e || e.target === document.getElementById('modalOverlay')) {
    document.getElementById('modalOverlay').classList.add('hidden');
  }
};

/* ── Confirm Modal (replaces window.confirm to avoid browser suppression) ── */
let _pendingConfirmCb = null;
window.confirmModal = function(message, onConfirm) {
  _pendingConfirmCb = onConfirm;
  openModal('⚠️ Confirm Action',
    `<p style="font-size:.9rem;color:var(--gray-700);line-height:1.6;">${message}</p>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="_pendingConfirmCb && _pendingConfirmCb(); closeModal();">Yes, Delete</button>`);
};

/* ── Badge updater ── */
window.updateBadges = function() {
  const pendingRFQ = Store.getRFQs().filter(r => r.status === 'Open').length;
  const pendingAPR = Store.getApprovals().filter(a => a.status === 'Pending').length;
  document.getElementById('rfqBadge').textContent     = pendingRFQ;
  document.getElementById('approvalBadge').textContent = pendingAPR;
  document.getElementById('rfqBadge').style.display     = pendingRFQ ? '' : 'none';
  document.getElementById('approvalBadge').style.display = pendingAPR ? '' : 'none';
};

/* ── Formatters ── */
window.fmtMoney = n => '₹' + Number(n).toLocaleString('en-IN');
window.fmtDate  = s => s ? new Date(s).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
window.timeSince = iso => {
  const diff = Date.now() - new Date(iso);
  const mins = Math.floor(diff/60000);
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs/24) + 'd ago';
};
window.statusBadge = s => {
  const m = { Active:'success', Approved:'success', Issued:'success', Paid:'success', Delivered:'success', Open:'info', Quoted:'info', Pending:'warning', Draft:'warning', 'Under Review':'warning', 'Pending Approval':'warning', Suspended:'danger', Rejected:'danger', Awarded:'purple', Closed:'gray' };
  return `<span class="badge badge-${m[s]||'gray'}">${s}</span>`;
};

/* ── Dashboard Home ── */
window.renderHome = function() {
  const vendors = Store.getVendors();
  const rfqs    = Store.getRFQs();
  const pos     = Store.getPOs();
  const approvals = Store.getApprovals();

  const totalSpend = pos.reduce((s,p)=>s+p.grandTotal,0);
  document.getElementById('homeStats').innerHTML = `
    <div class="stat-card"><div class="stat-card-left"><div class="stat-card-label">Total Vendors</div><div class="stat-card-value">${vendors.filter(v=>v.status==='Active').length}</div><div class="stat-card-trend trend-up">▲ Active vendors</div></div><div class="stat-card-icon icon-blue">🏢</div></div>
    <div class="stat-card"><div class="stat-card-left"><div class="stat-card-label">Open RFQs</div><div class="stat-card-value">${rfqs.filter(r=>r.status==='Open').length}</div><div class="stat-card-trend trend-up">▲ Awaiting quotes</div></div><div class="stat-card-icon icon-amber">📋</div></div>
    <div class="stat-card"><div class="stat-card-left"><div class="stat-card-label">Pending Approvals</div><div class="stat-card-value">${approvals.filter(a=>a.status==='Pending').length}</div><div class="stat-card-trend trend-down">▼ Action needed</div></div><div class="stat-card-icon icon-rose">✅</div></div>
    <div class="stat-card"><div class="stat-card-left"><div class="stat-card-label">Total Spend</div><div class="stat-card-value">${fmtMoney(totalSpend)}</div><div class="stat-card-trend trend-up">▲ This month</div></div><div class="stat-card-icon icon-green">💰</div></div>`;

  document.getElementById('homeRFQs').innerHTML = `<table class="data-table">
    <thead><tr><th>RFQ ID</th><th>Title</th><th>Deadline</th><th>Status</th></tr></thead>
    <tbody>${rfqs.slice(0,4).map(r=>`<tr><td class="td-code">${r.id}</td><td class="td-primary">${r.title}</td><td>${fmtDate(r.deadline)}</td><td>${statusBadge(r.status)}</td></tr>`).join('')}</tbody></table>`;

  const pending = approvals.filter(a=>a.status==='Pending');
  document.getElementById('homePendingApprovals').innerHTML = pending.length
    ? pending.map(a=>`<div style="padding:.75rem 1rem;border-bottom:1px solid var(--gray-50);">
        <div style="font-weight:600;font-size:.82rem;color:var(--gray-900)">${a.title}</div>
        <div style="font-size:.75rem;color:var(--gray-500);margin-top:2px">${a.type} · ${fmtMoney(a.amount)} · ${a.requestedBy}</div>
      </div>`).join('')
    : '<div class="empty-state">No pending approvals 🎉</div>';

  document.getElementById('homePOs').innerHTML = `<table class="data-table">
    <thead><tr><th>PO Number</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
    <tbody>${pos.slice(0,4).map(p=>`<tr><td class="td-code">${p.id}</td><td class="td-primary">${p.vendorName}</td><td style="font-weight:600;">${fmtMoney(p.grandTotal)}</td><td>${statusBadge(p.status)}</td></tr>`).join('')}</tbody></table>`;

  updateBadges();
};

/* ── Initial load ── */
navigateTo('home');
