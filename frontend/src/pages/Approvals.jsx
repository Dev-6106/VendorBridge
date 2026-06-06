import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Approvals() {
  const { token } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => { fetchApprovals(); }, []);

  const fetchApprovals = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/approvals', { headers: { Authorization: `Bearer ${token}` } });
      setApprovals(res.data.approvals || []);
    } catch (err) { console.error(err); }
  };

  const handleAction = async (id, action) => {
    try {
      const endpoint = action === 'approve' ? `/api/approvals/${id}/approve` : `/api/approvals/${id}/reject`;
      await axios.patch(`http://localhost:3000${endpoint}`, { remarks }, { headers: { Authorization: `Bearer ${token}` } });
      setActing(null);
      setRemarks('');
      await fetchApprovals();
    } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
  };

  const getStatusClass = (s) => {
    if (!s) return 'status-neutral';
    const l = s.toLowerCase();
    if (l === 'approved') return 'status-success';
    if (l === 'rejected') return 'status-danger';
    if (l === 'pending') return 'status-warning';
    return 'status-neutral';
  };

  const filtered = approvals.filter(a => {
    const q = search.toLowerCase();
    const mS = !q || a.title?.toLowerCase().includes(q) || a.id?.toLowerCase().includes(q) || a.requestedBy?.toLowerCase().includes(q);
    const mF = !filter || a.status === filter;
    return mS && mF;
  });

  const counts = {
    total: approvals.length,
    pending: approvals.filter(a => a.status === 'Pending').length,
    approved: approvals.filter(a => a.status === 'Approved').length,
    rejected: approvals.filter(a => a.status === 'Rejected').length,
  };

  return (
    <section className="page" id="page-approvals">
      {/* Summary stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.25rem' }}>
        {[
          { icon: '📋', val: counts.total, label: 'Total', color: '#6366f1' },
          { icon: '⏳', val: counts.pending, label: 'Pending', color: '#f59e0b' },
          { icon: '✅', val: counts.approved, label: 'Approved', color: '#10b981' },
          { icon: '❌', val: counts.rejected, label: 'Rejected', color: '#ef4444' },
        ].map((c, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: `${c.color}20` }}>{c.icon}</div>
            <div className="stat-info"><div className="stat-val">{c.val}</div><div className="stat-label">{c.label}</div></div>
          </div>
        ))}
      </div>

      <div className="page-toolbar">
        <div className="search-filter">
          <input className="search-inp" placeholder="🔍 Search approvals…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-sel" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option>Pending</option><option>Approved</option><option>Rejected</option>
          </select>
        </div>
      </div>

      <div className="section-card">
        <div className="section-head">
          <h3>✅ Approval Workflows</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Title</th><th>Type</th><th>Amount</th><th>Requested By</th><th>Dept.</th><th>Progress</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const totalStages = a.totalStages || 3;
                const stage = a.stage || 0;
                return (
                  <tr key={a.id}>
                    <td className="td-id">{a.id}</td>
                    <td>
                      <div className="td-name">{a.title}</div>
                      {a.refId && <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>Ref: {a.refId}</div>}
                    </td>
                    <td><span className="chip">{a.type || '—'}</span></td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{(a.amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: '0.82rem' }}>{a.requestedBy}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>{a.department || '—'}</td>
                    <td style={{ width: 120 }}>
                      <div style={{ marginBottom: '4px' }}>
                        <div className="stage-track">
                          {Array.from({ length: totalStages }).map((_, i) => (
                            <>
                              <div key={`dot-${i}`} className={`stage-dot ${i < stage ? 'done' : i === stage && a.status === 'Pending' ? 'current' : ''}`}>
                                {i < stage ? '✓' : i + 1}
                              </div>
                              {i < totalStages - 1 && <div key={`line-${i}`} className={`stage-line ${i < stage - 1 ? 'done' : ''}`}></div>}
                            </>
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-600)' }}>Stage {stage}/{totalStages}</div>
                    </td>
                    <td><span className={`status-badge ${getStatusClass(a.status)}`}>{a.status}</span></td>
                    <td>
                      {a.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-success btn-sm" onClick={() => setActing({ ...a, action: 'approve' })}>✓ Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setActing({ ...a, action: 'reject' })}>✕ Reject</button>
                        </div>
                      )}
                      {a.status !== 'Pending' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontStyle: 'italic' }}>{a.remarks || a.status}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">No approvals found</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {acting && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setActing(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>{acting.action === 'approve' ? '✅ Approve' : '❌ Reject'} — {acting.id}</h3>
              <button className="modal-close" onClick={() => setActing(null)}>✕</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--gray-200)', marginBottom: '4px' }}>{acting.title}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                {acting.requestedBy} · {acting.department} · ₹{(acting.amount || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.35rem' }}>Remarks (optional)</label>
              <textarea className="modal-textarea" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder={`Reason for ${acting.action === 'approve' ? 'approval' : 'rejection'}…`} style={{ marginBottom: '1rem' }} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setActing(null)}>Cancel</button>
              <button
                className={`btn ${acting.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={() => handleAction(acting.id, acting.action)}
              >
                {acting.action === 'approve' ? '✅ Confirm Approve' : '❌ Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
