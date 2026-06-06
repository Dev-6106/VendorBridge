import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [rfqs, setRfqs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [rfqRes, aprRes, poRes, venRes, qRes] = await Promise.all([
          axios.get('http://localhost:3000/api/rfqs', { headers }),
          axios.get('http://localhost:3000/api/approvals', { headers }),
          axios.get('http://localhost:3000/api/pos', { headers }),
          axios.get('http://localhost:3000/api/vendors', { headers }),
          axios.get('http://localhost:3000/api/quotations', { headers }),
        ]);
        setRfqs(rfqRes.data.rfqs || []);
        setApprovals(aprRes.data.approvals || []);
        setPos(poRes.data.pos || []);
        setVendors(venRes.data.vendors || []);
        setQuotations(qRes.data.quotations || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const totalSpend = pos.reduce((s, p) => s + (p.grandTotal || 0), 0);

  const getStatCards = () => {
    const role = user?.role;
    if (role === 'Vendor') {
      return [
        { icon: '📋', val: rfqs.filter(r => r.status === 'Open').length, label: 'RFQ Invitations', color: '#8b5cf6' },
        { icon: '💬', val: quotations.filter(q => q.status === 'Submitted').length, label: 'Submitted Bids', color: '#10b981' },
        { icon: '📝', val: quotations.filter(q => q.status === 'Draft').length, label: 'Draft Bids', color: '#3b82f6' },
        { icon: '🛒', val: pos.length, label: 'Purchase Orders', color: '#f59e0b' },
      ];
    } else if (role === 'Finance Manager') {
      return [
        { icon: '⏳', val: approvals.filter(a => a.status === 'Pending').length, label: 'Pending Approvals', color: '#f59e0b' },
        { icon: '🛒', val: pos.length, label: 'Total POs', color: '#10b981' },
        { icon: '✅', val: approvals.filter(a => a.status === 'Approved').length, label: 'Approved Requests', color: '#8b5cf6' },
        { icon: '🧾', val: pos.filter(p => p.invoiceGenerated).length, label: 'Invoices Issued', color: '#3b82f6' },
      ];
    } else {
      // Procurement Officer or Admin
      return [
        { icon: '🏢', val: vendors.filter(v => v.status === 'Active').length, label: 'Active Vendors', color: '#6366f1' },
        { icon: '📋', val: rfqs.length, label: 'Total RFQs', color: '#8b5cf6' },
        { icon: '✅', val: approvals.filter(a => a.status === 'Pending').length, label: 'Pending Approvals', color: '#f59e0b' },
        { icon: '🛒', val: pos.length, label: 'Purchase Orders', color: '#10b981' },
      ];
    }
  };

  const renderQuickActions = () => {
    const role = user?.role;
    if (role === 'Vendor') {
      return (
        <div className="quick-actions">
          <button className="qa-btn" onClick={() => navigate('/rfqs')}>📋 RFQ Invitations</button>
          <button className="qa-btn" onClick={() => navigate('/quotations')}>💬 Submit / Edit Bids</button>
          <button className="qa-btn" onClick={() => navigate('/pos')}>🛒 View Purchase Orders</button>
        </div>
      );
    } else if (role === 'Finance Manager') {
      return (
        <div className="quick-actions">
          <button className="qa-btn" onClick={() => navigate('/approvals')}>⏳ View Pending Approvals</button>
          <button className="qa-btn" onClick={() => navigate('/pos')}>🛒 View PO & Invoices</button>
          <button className="qa-btn" onClick={() => navigate('/reports')}>📈 View Analytics</button>
        </div>
      );
    } else {
      return (
        <div className="quick-actions">
          <button className="qa-btn" onClick={() => navigate('/rfqs')}>📋 Create RFQ</button>
          <button className="qa-btn" onClick={() => navigate('/vendors')}>🏢 Add Vendor</button>
          <button className="qa-btn" onClick={() => navigate('/approvals')}>✅ View Approvals</button>
          <button className="qa-btn" onClick={() => navigate('/reports')}>📈 Analytics</button>
          <button className="qa-btn" onClick={() => navigate('/pos')}>🛒 PO & Invoices</button>
        </div>
      );
    }
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-neutral';
    const s = status.toLowerCase();
    if (s === 'open' || s === 'active' || s === 'approved' || s === 'issued' || s === 'accepted') return 'status-success';
    if (s === 'pending' || s === 'submitted' || s === 'draft') return 'status-warning';
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
        {getStatCards().map((c, i) => (
          <div className="stat-card" key={i} style={{ '--card-color': c.color }}>
            <div className="stat-icon" style={{ background: `${c.color}20` }}>{c.icon}</div>
            <div className="stat-info">
              <div className="stat-val">{c.val}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Spend card (hidden or customized for Vendor) */}
      {user?.role !== 'Vendor' ? (
        <div className="stat-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', borderColor: 'rgba(99,102,241,0.3)' }}>
          <div className="stat-icon" style={{ fontSize: '1.5rem' }}>💰</div>
          <div className="stat-info">
            <div className="stat-val">₹{totalSpend.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Procurement Spend</div>
          </div>
        </div>
      ) : (
        <div className="stat-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.1))', borderColor: 'rgba(16,185,129,0.3)' }}>
          <div className="stat-icon" style={{ fontSize: '1.5rem' }}>💰</div>
          <div className="stat-info">
            <div className="stat-val">₹{totalSpend.toLocaleString('en-IN')}</div>
            <div className="stat-label">Your Active Business Value</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Two column */}
      <div className="two-col">
        {/* Recent RFQs */}
        <div className="section-card">
          <div className="section-head">
            <h3>📋 {user?.role === 'Vendor' ? 'RFQ Invitations' : 'Recent RFQs'}</h3>
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

        {/* Dynamic Column 2 */}
        {user?.role === 'Vendor' ? (
          /* Vendor Bids Summary */
          <div className="section-card">
            <div className="section-head">
              <h3>💬 My Recent Bids</h3>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/quotations')}>View All</button>
            </div>
            <div className="section-body">
              {quotations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💬</div>
                  <div className="empty-state-text">No bids submitted yet</div>
                </div>
              ) : quotations.slice(0, 5).map(q => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--gray-200)', fontSize: '0.875rem' }}>Quotation {q.id}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>RFQ: {q.rfqId} · Value: ₹{q.grandTotal?.toLocaleString('en-IN')}</div>
                  </div>
                  <span className={`status-badge ${getStatusClass(q.status)}`}>{q.status}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Pending Approvals (for Manager, Officer, Admin) */
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
        )}
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
