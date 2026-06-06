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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}>
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <section className="page" id="page-reports">
      {/* KPI Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-info"><div className="stat-val">₹{(totalSpend/100000).toFixed(1)}L</div><div className="stat-label">Total Spend</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>📋</div><div className="stat-info"><div className="stat-val">{data.rfqs.length}</div><div className="stat-label">Total RFQs</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>📈</div><div className="stat-info"><div className="stat-val">{approvalRate}%</div><div className="stat-label">Approval Rate</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>🛒</div><div className="stat-info"><div className="stat-val">₹{(avgPOValue/1000).toFixed(0)}K</div><div className="stat-label">Avg PO Value</div></div></div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid" style={{ marginBottom: '1rem' }}>
        <div className="chart-card">
          <div className="chart-title">📋 RFQ Status Distribution</div>
          <canvas ref={rfqStatusRef} height="220"></canvas>
        </div>
        <div className="chart-card">
          <div className="chart-title">✅ Approval Status</div>
          <canvas ref={approvalRef} height="220"></canvas>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid" style={{ marginBottom: '1rem' }}>
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-title">📈 Monthly Procurement Spend</div>
          <canvas ref={monthlyPoRef} height="120"></canvas>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">🏢 Vendors by Category</div>
        <canvas ref={categoryRef} height="130"></canvas>
      </div>

      {/* Vendor Rating Table */}
      <div className="section-card" style={{ marginTop: '1rem' }}>
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
                      <div className="progress-bar-wrap" style={{ width: 80 }}>
                        <div className="progress-bar-fill" style={{ width: `${(v.rating / 5) * 100}%` }}></div>
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
