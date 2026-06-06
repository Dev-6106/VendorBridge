/* ============================
   activity.js — Activity Logs & Notifications
   ============================ */

window.renderActivity = function() {
  const typeFilter = document.getElementById('activityTypeFilter')?.value || '';
  const dateFilter = document.getElementById('activityDateFilter')?.value || '';

  let activities = Store.getActivities().filter(a => {
    const matchType = !typeFilter || a.type === typeFilter;
    const matchDate = !dateFilter || a.timestamp.startsWith(dateFilter);
    return matchType && matchDate;
  });

  // Timeline
  const timeline = document.getElementById('activityTimeline');
  if (!activities.length) {
    timeline.innerHTML = '<div class="empty-state">No activity found.</div>';
  } else {
    timeline.innerHTML = activities.map(a => `
      <div class="activity-entry">
        <div class="activity-dot">${a.icon}</div>
        <div class="activity-content">
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${a.user} · ${timeSince(a.timestamp)} · <span class="badge badge-gray" style="font-size:.65rem;">${a.type}</span></div>
        </div>
      </div>`).join('');
  }

  // Notifications panel (unread = latest 5)
  const recent = Store.getActivities().slice(0, 5);
  document.getElementById('notificationsPanel').innerHTML = recent.map(a => `
    <div class="notif-item unread">
      <strong>${a.icon} ${a.type}</strong><br>
      <span style="font-size:.75rem;">${a.text.substring(0,80)}${a.text.length>80?'…':''}</span>
      <div style="font-size:.7rem;color:var(--gray-400);margin-top:2px;">${timeSince(a.timestamp)}</div>
    </div>`).join('');

  // Audit log (full table)
  const allActs = Store.getActivities();
  document.getElementById('auditLogContainer').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Log ID</th><th>Type</th><th>Description</th><th>User</th><th>Timestamp</th></tr></thead>
      <tbody>${allActs.map(a=>`
        <tr>
          <td class="td-code">${a.id}</td>
          <td><span class="badge badge-info">${a.type}</span></td>
          <td style="font-size:.8rem;">${a.text}</td>
          <td style="font-size:.78rem;">${a.user||'System'}</td>
          <td style="font-size:.75rem;color:var(--gray-500);">${new Date(a.timestamp).toLocaleString('en-IN')}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
};


/* ============================
   reports.js — Reports & Analytics
   ============================ */

let _chartsInit = false;
let _chartInstances = {};

window.initReports = function() {
  // Stats
  const vendors   = Store.getVendors();
  const rfqs      = Store.getRFQs();
  const pos       = Store.getPOs();
  const qts       = Store.getQuotations();
  const totalSpend= pos.reduce((s,p)=>s+p.grandTotal,0);
  const avgCycle  = rfqs.length ? Math.round(rfqs.reduce((s,r)=>s+7,0)/rfqs.length) : 0;

  document.getElementById('reportStats').innerHTML = `
    <div class="stat-card"><div class="stat-card-left"><div class="stat-card-label">Total Vendors</div><div class="stat-card-value">${vendors.length}</div><div class="stat-card-trend trend-up">▲ ${vendors.filter(v=>v.status==='Active').length} Active</div></div><div class="stat-card-icon icon-blue">🏢</div></div>
    <div class="stat-card"><div class="stat-card-left"><div class="stat-card-label">Total RFQs</div><div class="stat-card-value">${rfqs.length}</div><div class="stat-card-trend trend-up">▲ ${rfqs.filter(r=>r.status==='Open').length} Open</div></div><div class="stat-card-icon icon-amber">📋</div></div>
    <div class="stat-card"><div class="stat-card-left"><div class="stat-card-label">Total Spend</div><div class="stat-card-value">${fmtMoney(totalSpend)}</div><div class="stat-card-trend trend-up">▲ This quarter</div></div><div class="stat-card-icon icon-green">💰</div></div>
    <div class="stat-card"><div class="stat-card-left"><div class="stat-card-label">Quotations</div><div class="stat-card-value">${qts.length}</div><div class="stat-card-trend">Received</div></div><div class="stat-card-icon icon-purple">💬</div></div>`;

  // Procurement Summary
  document.getElementById('procSummary').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Active Vendors</td><td class="td-primary">${vendors.filter(v=>v.status==='Active').length}</td></tr>
        <tr><td>Open RFQs</td><td class="td-primary">${rfqs.filter(r=>r.status==='Open').length}</td></tr>
        <tr><td>Awarded RFQs</td><td class="td-primary">${rfqs.filter(r=>r.status==='Awarded').length}</td></tr>
        <tr><td>Purchase Orders</td><td class="td-primary">${pos.length}</td></tr>
        <tr><td>Invoices Generated</td><td class="td-primary">${pos.filter(p=>p.invoiceGenerated).length}</td></tr>
        <tr><td>Total Quotations</td><td class="td-primary">${qts.length}</td></tr>
        <tr><td>Avg Vendor Rating</td><td class="td-primary">${(vendors.reduce((s,v)=>s+v.rating,0)/vendors.length||0).toFixed(1)} ⭐</td></tr>
        <tr><td>Total Spend</td><td class="td-primary">${fmtMoney(totalSpend)}</td></tr>
      </tbody>
    </table>`;

  if (_chartsInit) return; // charts only initialize once
  _chartsInit = true;

  const chartDefaults = { responsive:true, plugins:{ legend:{ position:'bottom', labels:{ font:{ family:'Inter', size:11 }, padding:12 } } } };

  // 1. Monthly Spending Bar Chart
  const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
  _chartInstances.monthly = new Chart(monthlyCtx, {
    type: 'bar',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun'],
      datasets: [{
        label: 'Spend (₹)',
        data: [420000, 680000, 390000, 820000, 560000, totalSpend||350000],
        backgroundColor: 'rgba(79,70,229,0.75)',
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend:{display:false} }, scales:{ y:{ ticks:{ callback:v=>'₹'+Number(v/1000).toFixed(0)+'K' }, grid:{ color:'rgba(0,0,0,.04)' } }, x:{ grid:{display:false} } } }
  });

  // 2. Category Doughnut
  const cats = {};
  pos.forEach(p => { const rfq = Store.getRFQs().find(r=>r.id===p.rfqId); const cat=rfq?.category||'Other'; cats[cat]=(cats[cat]||0)+p.grandTotal; });
  const catLabels = Object.keys(cats).length ? Object.keys(cats) : ['IT Equipment','Office Materials','Manufacturing','Logistics'];
  const catData   = Object.keys(cats).length ? Object.values(cats) : [450000,180000,320000,120000];
  const catCtx    = document.getElementById('categoryChart').getContext('2d');
  _chartInstances.category = new Chart(catCtx, {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{ data: catData, backgroundColor: ['#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6'], borderWidth:2, borderColor:'#fff', hoverOffset:6 }]
    },
    options: { ...chartDefaults, cutout:'65%' }
  });

  // 3. Vendor Performance Horizontal Bar
  const topVendors = [...Store.getVendors()].sort((a,b)=>b.rating-a.rating).slice(0,5);
  const vendorCtx  = document.getElementById('vendorChart').getContext('2d');
  _chartInstances.vendor = new Chart(vendorCtx, {
    type: 'bar',
    data: {
      labels: topVendors.map(v=>v.name.split(' ')[0]),
      datasets: [{
        label: 'Rating',
        data: topVendors.map(v=>v.rating),
        backgroundColor: topVendors.map((_,i)=>['#4f46e5','#0ea5e9','#10b981','#f59e0b','#8b5cf6'][i%5]),
        borderRadius: 6,
      }]
    },
    options: { ...chartDefaults, indexAxis:'y', plugins:{...chartDefaults.plugins,legend:{display:false}}, scales:{ x:{ min:0, max:5, ticks:{stepSize:1}, grid:{color:'rgba(0,0,0,.04)'} }, y:{ grid:{display:false} } } }
  });
};

window.exportChart = function(canvasId, filename) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const a = document.createElement('a');
  a.href     = canvas.toDataURL('image/png');
  a.download = filename + '.png';
  a.click();
  showToast('Chart exported as PNG!');
};
