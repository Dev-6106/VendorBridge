import { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

Chart.register(...registerables);

function useChart(ref, config, deps) {
  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, config);
    return () => chart.destroy();
  }, deps);
}

export default function Reports() {
  const { token } = useAuth();
  const [data, setData] = useState({ rfqs: [], vendors: [], pos: [], approvals: [], quotations: [] });
  const [loading, setLoading] = useState(true);

  const rfqStatusRef = useRef(null);
  const categoryRef   = useRef(null);
  const monthlyPoRef  = useRef(null);
  const approvalRef   = useRef(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get('http://localhost:3000/api/rfqs',        { headers }),
      axios.get('http://localhost:3000/api/vendors',     { headers }),
      axios.get('http://localhost:3000/api/pos',         { headers }),
      axios.get('http://localhost:3000/api/approvals',   { headers }),
      axios.get('http://localhost:3000/api/quotations',  { headers }),
    ]).then(([r, v, p, a, q]) => {
      setData({
        rfqs: r.data.rfqs || [],
        vendors: v.data.vendors || [],
        pos: p.data.pos || [],
        approvals: a.data.approvals || [],
        quotations: q.data.quotations || [],
      });
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [token]);

  // RFQ Status Pie
  const rfqStatusCounts = data.rfqs.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  useChart(rfqStatusRef, {
    type: 'doughnut',
    data: {
      labels: Object.keys(rfqStatusCounts),
      datasets: [{ data: Object.values(rfqStatusCounts), backgroundColor: ['#6366f1','#f59e0b','#10b981','#ef4444'], borderWidth: 0 }]
    },
    options: { plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } } }, cutout: '65%' }
  }, [data.rfqs]);

  // Vendor Category Bar
  const catCounts = data.vendors.reduce((acc, v) => { const c = v.category || 'Other'; acc[c] = (acc[c] || 0) + 1; return acc; }, {});
  useChart(categoryRef, {
    type: 'bar',
    data: {
      labels: Object.keys(catCounts),
      datasets: [{ label: 'Vendors', data: Object.values(catCounts), backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 6 }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#64748b', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  }, [data.vendors]);

  // Monthly PO Spend Line
  const monthlySpend = data.pos.reduce((acc, p) => {
    const month = p.issuedDate ? p.issuedDate.substring(0, 7) : 'Unknown';
    acc[month] = (acc[month] || 0) + (p.grandTotal || 0);
    return acc;
  }, {});
  const months = Object.keys(monthlySpend).sort();
  useChart(monthlyPoRef, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'PO Spend (₹)',
        data: months.map(m => monthlySpend[m]),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 5,
      }]
    },
    options: {
      plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } } },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#64748b', callback: v => `₹${(v/1000).toFixed(0)}K` }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  }, [data.pos]);

  // Approvals Status Pie
  const aprCounts = data.approvals.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
  useChart(approvalRef, {
    type: 'pie',
    data: {
      labels: Object.keys(aprCounts),
      datasets: [{ data: Object.values(aprCounts), backgroundColor: ['#f59e0b','#10b981','#ef4444'], borderWidth: 0 }]
    },
    options: { plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } } } }
  }, [data.approvals]);

  const totalSpend = data.pos.reduce((s, p) => s + (p.grandTotal || 0), 0);
  const avgPOValue = data.pos.length ? Math.round(totalSpend / data.pos.length) : 0;
  const approvalRate = data.approvals.length
    ? Math.round((data.approvals.filter(a => a.status === 'Approved').length / data.approvals.length) * 100)
    : 0;

  // CSV Export utility
  const exportToCSV = (dataType) => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (dataType === 'spend') {
      headers = ['PO ID', 'Vendor ID', 'Vendor Name', 'RFQ Reference', 'Subtotal (INR)', 'GST Amount (INR)', 'Grand Total (INR)', 'Issued Date', 'Status'];
      rows = data.pos.map(p => [
        p.id,
        p.vendorId || '',
        p.vendorName || '',
        p.rfqId || '',
        p.subTotal || 0,
        p.gstAmount || 0,
        p.grandTotal || 0,
        p.issuedDate || '',
        p.status || ''
      ]);
      filename = `Spend_Report_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (dataType === 'vendors') {
      headers = ['Vendor ID', 'Name', 'Category', 'GST IN', 'Email', 'Phone', 'Rating', 'Status', 'Registered Date'];
      rows = data.vendors.map(v => [
        v.id,
        v.name || '',
        v.category || '',
        v.gst || '',
        v.email || '',
        v.phone || '',
        v.rating || 0,
        v.status || '',
        v.addedDate || ''
      ]);
      filename = `Vendors_Report_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (dataType === 'rfqs') {
      headers = ['RFQ ID', 'Title', 'Category', 'Deadline', 'Status', 'Items Count', 'Assigned Vendors Count', 'Created By'];
      rows = data.rfqs.map(r => [
        r.id,
        r.title || '',
        r.category || '',
        r.deadline || '',
        r.status || '',
        r.items?.length || 0,
        r.assignedVendors?.length || 0,
        r.createdBy || ''
      ]);
      filename = `RFQs_Report_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}>
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <section className="page" id="page-reports">
      {/* Export Toolbar */}
      <div className="page-toolbar" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-400)', alignSelf: 'center', marginRight: '0.5rem' }}>
          📥 Export Reports:
        </span>
        <button className="btn btn-outline btn-sm" onClick={() => exportToCSV('spend')}>
          📊 Spend Data (CSV)
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => exportToCSV('vendors')}>
          🏢 Vendors Registry (CSV)
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => exportToCSV('rfqs')}>
          📋 RFQs Log (CSV)
        </button>
        <button className="btn btn-primary btn-sm" onClick={handlePrintPDF} style={{ marginLeft: 'auto' }}>
          🖨️ Print PDF Summary
        </button>
      </div>

      {/* KPI Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-info"><div className="stat-val">₹{(totalSpend/100000).toFixed(1)}L</div><div className="stat-label">Total Spend</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>📋</div><div className="stat-info"><div className="stat-val">{data.rfqs.length}</div><div className="stat-label">Total RFQs</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>📈</div><div className="stat-info"><div className="stat-val">{approvalRate}%</div><div className="stat-label">Approval Rate</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>🛒</div><div className="stat-info"><div className="stat-val">₹{(avgPOValue/1000).toFixed(0)}K</div><div className="stat-label">Avg PO Value</div></div></div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="chart-card" style={{ background: 'var(--gray-900)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.25rem' }}>
          <div className="chart-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-400)', marginBottom: '1rem' }}>📋 RFQ Status Distribution</div>
          <canvas ref={rfqStatusRef} height="200"></canvas>
        </div>
        <div className="chart-card" style={{ background: 'var(--gray-900)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.25rem' }}>
          <div className="chart-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-400)', marginBottom: '1rem' }}>✅ Approval Status</div>
          <canvas ref={approvalRef} height="200"></canvas>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="chart-card" style={{ background: 'var(--gray-900)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.25rem' }}>
          <div className="chart-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-400)', marginBottom: '1rem' }}>📈 Monthly Procurement Spend</div>
          <canvas ref={monthlyPoRef} height="100"></canvas>
        </div>
      </div>

      <div className="chart-card" style={{ background: 'var(--gray-900)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="chart-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-400)', marginBottom: '1rem' }}>🏢 Vendors by Category</div>
        <canvas ref={categoryRef} height="100"></canvas>
      </div>

      {/* Vendor Rating Table */}
      <div className="section-card">
        <div className="section-head">
          <h3>⭐ Top Rated Vendors</h3>
        </div>
        <div style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Vendor</th><th>Category</th><th>Rating</th><th>Status</th></tr></thead>
            <tbody>
              {[...data.vendors].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8).map(v => (
                <tr key={v.id}>
                  <td className="td-name">{v.name}</td>
                  <td><span className="chip">{v.category}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="progress-bar-wrap" style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div className="progress-bar-fill" style={{ height: '100%', background: 'var(--warning)', width: `${(v.rating / 5) * 100}%` }}></div>
                      </div>
                      <span style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.82rem' }}>{v.rating}</span>
                    </div>
                  </td>
                  <td><span className={`status-badge ${v.status === 'Active' ? 'status-success' : 'status-warning'}`}>{v.status}</span></td>
                </tr>
              ))}
              {data.vendors.length === 0 && (
                <tr><td colSpan="4"><div className="empty-state"><div className="empty-state-icon">⭐</div><div className="empty-state-text">No vendor data</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
