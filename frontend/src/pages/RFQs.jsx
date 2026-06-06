import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { title: '', category: '', description: '', deadline: '', assignedVendors: '', createdBy: '' };

export default function RFQs() {
  const { token, user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchRFQs(); }, []);

  const fetchRFQs = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/rfqs', { headers: { Authorization: `Bearer ${token}` } });
      setRfqs(res.data.rfqs || []);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form, assignedVendors: form.assignedVendors.split(',').map(s => s.trim()).filter(Boolean), createdBy: user?.name || user?.email || 'User' };
      await axios.post('http://localhost:3000/api/rfqs', payload, { headers: { Authorization: `Bearer ${token}` } });
      await fetchRFQs();
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create RFQ');
    } finally { setSaving(false); }
  };

  const updateStatus = async (rfq, status) => {
    try {
      await axios.patch(`http://localhost:3000/api/rfqs/${rfq.id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setRfqs(rs => rs.map(r => r.id === rfq.id ? { ...r, status } : r));
    } catch (err) { alert('Failed to update status'); }
  };

  const getStatusClass = (s) => {
    if (!s) return 'status-neutral';
    const l = s.toLowerCase();
    if (l === 'open') return 'status-success';
    if (l === 'closed') return 'status-danger';
    if (l === 'under review') return 'status-info';
    return 'status-neutral';
  };

  const filtered = rfqs.filter(r => {
    const q = search.toLowerCase();
    const mS = !q || r.title?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q);
    const mSt = !statusFilter || r.status === statusFilter;
    return mS && mSt;
  });

  const statuses = ['Open', 'Under Review', 'Closed'];

  return (
    <section className="page" id="page-rfqs">
      <div className="page-toolbar">
        <div className="search-filter">
          <input className="search-inp" placeholder="🔍 Search RFQs…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setError(''); setShowModal(true); }}>📋 Create RFQ</button>
      </div>

      <div className="section-card">
        <div className="section-head">
          <h3>📋 Request for Quotations</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{filtered.length} RFQ{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="section-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Title</th><th>Category</th><th>Deadline</th><th>Created By</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="td-id">{r.id}</td>
                  <td>
                    <div className="td-name">{r.title}</div>
                    {r.description && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>}
                  </td>
                  <td><span className="chip">{r.category || '—'}</span></td>
                  <td style={{ color: 'var(--gray-400)' }}>{r.deadline || '—'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{r.createdBy || '—'}</td>
                  <td><span className={`status-badge ${getStatusClass(r.status)}`}>{r.status}</span></td>
                  <td>
                    <select
                      value={r.status}
                      onChange={e => updateStatus(r, e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--gray-300)', padding: '4px 8px', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No RFQs found</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create RFQ Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>📋 Create New RFQ</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠️</span><span>{error}</span></div>}
            <form className="modal-form" onSubmit={handleCreate}>
              <div>
                <label>RFQ Title *</label>
                <input className="modal-inp" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Procurement of Office Supplies Q3" required />
              </div>
              <div className="form-row-2">
                <div>
                  <label>Category</label>
                  <select className="modal-sel" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Select category</option>
                    {['IT Equipment', 'Office Materials', 'Manufacturing', 'Infrastructure', 'Logistics', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label>Deadline</label>
                  <input className="modal-inp" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <div>
                <label>Description</label>
                <textarea className="modal-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the requirements in detail…" />
              </div>
              <div>
                <label>Assigned Vendors (comma-separated IDs)</label>
                <input className="modal-inp" value={form.assignedVendors} onChange={e => setForm(f => ({ ...f, assignedVendors: e.target.value }))} placeholder="V001, V002, V003" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create RFQ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
