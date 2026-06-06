import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [rfqs, setRfqs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [rfqRes, aprRes, poRes, venRes] = await Promise.all([
          axios.get('http://localhost:3000/api/rfqs', { headers }),
          axios.get('http://localhost:3000/api/approvals', { headers }),
          axios.get('http://localhost:3000/api/pos', { headers }),
          axios.get('http://localhost:3000/api/vendors', { headers }),
        ]);
        setRfqs(rfqRes.data.rfqs || []);
        setApprovals(aprRes.data.approvals || []);
        setPos(poRes.data.pos || []);
        setVendors(venRes.data.vendors || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const totalSpend = pos.reduce((s, p) => s + (p.grandTotal || 0), 0);

  const statCards = [
    { icon: '🏢', val: vendors.length, label: 'Active Vendors', color: '#6366f1' },
    { icon: '📋', val: rfqs.length, label: 'Total RFQs', color: '#8b5cf6' },
    { icon: '✅', val: approvals.filter(a => a.status === 'Pending').length, label: 'Pending Approvals', color: '#f59e0b' },
    { icon: '🛒', val: pos.length, label: 'Purchase Orders', color: '#10b981' },
  ];

  const getStatusClass = (status) => {
    if (!status) return 'status-neutral';
    const s = status.toLowerCase();
    if (s === 'open' || s === 'active' || s === 'approved' || s === 'issued') return 'status-success';
    if (s === 'pending' || s === 'submitted') return 'status-warning';
    if (s === 'closed' || s === 'rejected') return 'status-danger';
    return 'status-neutral';
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}>
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <section className="page" id="page-home">
      {/* Stats */}
      <div className="stats-grid" id="homeStats">
        {statCards.map((c, i) => (
          <div className="stat-card" key={i} style={{ '--card-color': c.color }}>
            <div className="stat-icon" style={{ background: `${c.color}20` }}>{c.icon}</div>
            <div className="stat-info">
              <div className="stat-val">{c.val}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Spend card */}
      <div className="stat-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', borderColor: 'rgba(99,102,241,0.3)' }}>
        <div className="stat-icon" style={{ fontSize: '1.5rem' }}>💰</div>
        <div className="stat-info">
          <div className="stat-val">₹{totalSpend.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Procurement Spend</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="qa-btn" onClick={() => navigate('/rfqs')}>📋 Create RFQ</button>
        <button className="qa-btn" onClick={() => navigate('/vendors')}>🏢 Add Vendor</button>
        <button className="qa-btn" onClick={() => navigate('/approvals')}>✅ View Approvals</button>
        <button className="qa-btn" onClick={() => navigate('/reports')}>📈 Analytics</button>
        <button className="qa-btn" onClick={() => navigate('/pos')}>🛒 PO & Invoices</button>
      </div>

      {/* Two column */}
      <div className="two-col">
        {/* Recent RFQs */}
        <div className="section-card">
          <div className="section-head">
            <h3>📋 Recent RFQs</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/rfqs')}>View All</button>
          </div>
          <div className="section-body">
            {rfqs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">No RFQs yet</div>
              </div>
            ) : rfqs.slice(0, 5).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--gray-200)', fontSize: '0.875rem' }}>{r.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>{r.id} · {r.category}</div>
                </div>
                <span className={`status-badge ${getStatusClass(r.status)}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="section-card">
          <div className="section-head">
            <h3>✅ Pending Approvals</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/approvals')}>View All</button>
          </div>
          <div className="section-body">
            {approvals.filter(a => a.status === 'Pending').length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-text">All caught up!</div>
              </div>
            ) : approvals.filter(a => a.status === 'Pending').slice(0, 5).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--gray-200)', fontSize: '0.875rem' }}>{a.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>{a.id} · {a.requestedBy}</div>
                </div>
                <span className="status-badge status-warning">Pending</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent POs */}
      <div className="section-card" style={{ marginTop: '1rem' }}>
        <div className="section-head">
          <h3>🛒 Recent Purchase Orders</h3>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/pos')}>View All</button>
        </div>
        <div className="section-body">
          {pos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-text">No purchase orders yet</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO ID</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {pos.slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td className="td-id">{p.id}</td>
                    <td className="td-name">{p.vendorName}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{(p.grandTotal || 0).toLocaleString('en-IN')}</td>
                    <td><span className={`status-badge ${getStatusClass(p.status)}`}>{p.status}</span></td>
                    <td style={{ color: 'var(--gray-500)' }}>{p.issuedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
