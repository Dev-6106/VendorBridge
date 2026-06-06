import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EMPTY_FORM = { title: '', category: '', description: '', deadline: '' };

export default function RFQs() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  
  // Custom states for items & vendors & files
  const [rfqItems, setRfqItems] = useState([{ name: '', qty: 1, unit: 'pcs' }]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [mockFileName, setMockFileName] = useState('');
  const [fileAttachments, setFileAttachments] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRFQs();
    if (user?.role !== 'Vendor') {
      fetchVendors();
    }
  }, [token]);

  const fetchRFQs = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/rfqs', { headers: { Authorization: `Bearer ${token}` } });
      setRfqs(res.data.rfqs || []);
    } catch (err) { console.error(err); }
  };

  const fetchVendors = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/vendors', { headers: { Authorization: `Bearer ${token}` } });
      setVendors(res.data.vendors || []);
    } catch (err) { console.error(err); }
  };

  const addItemRow = () => {
    setRfqItems([...rfqItems, { name: '', qty: 1, unit: 'pcs' }]);
  };

  const removeItemRow = (index) => {
    if (rfqItems.length === 1) return;
    setRfqItems(rfqItems.filter((_, i) => i !== index));
  };

  const updateItemRow = (index, field, value) => {
    const updated = [...rfqItems];
    updated[index][field] = value;
    setRfqItems(updated);
  };

  const toggleVendor = (vendorId) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]
    );
  };

  const addAttachment = () => {
    if (!mockFileName.trim()) return;
    setFileAttachments([...fileAttachments, mockFileName.trim()]);
    setMockFileName('');
  };

  const removeAttachment = (index) => {
    setFileAttachments(fileAttachments.filter((_, i) => i !== index));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); 
    setError('');

    // Validations
    if (selectedVendors.length === 0) {
      setError('Please assign at least one vendor to this RFQ.');
      setSaving(false);
      return;
    }
    const invalidItem = rfqItems.some(item => !item.name.trim() || item.qty <= 0);
    if (invalidItem) {
      setError('Please fill out all item names and set positive quantities.');
      setSaving(false);
      return;
    }

    try {
      const payload = { 
        ...form, 
        items: rfqItems,
        assignedVendors: selectedVendors,
        attachments: fileAttachments,
        createdBy: user?.name || user?.email || 'User' 
      };
      await axios.post('http://localhost:3000/api/rfqs', payload, { headers: { Authorization: `Bearer ${token}` } });
      await fetchRFQs();
      setShowModal(false);
      setForm(EMPTY_FORM);
      setRfqItems([{ name: '', qty: 1, unit: 'pcs' }]);
      setSelectedVendors([]);
      setFileAttachments([]);
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
        {user?.role !== 'Vendor' && (
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setError(''); setRfqItems([{ name: '', qty: 1, unit: 'pcs' }]); setSelectedVendors([]); setFileAttachments([]); setShowModal(true); }}>📋 Create RFQ</button>
        )}
      </div>

      <div className="section-card">
        <div className="section-head">
          <h3>📋 {user?.role === 'Vendor' ? 'RFQ Invitations' : 'Request for Quotations'}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{filtered.length} RFQ{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="section-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Items Count</th>
                <th>Deadline</th>
                <th>Attachments</th>
                {user?.role !== 'Vendor' && <th>Created By</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
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
                  <td style={{ color: 'var(--gray-300)', fontWeight: 500 }}>
                    {r.items?.length || 0} item{r.items?.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ color: 'var(--gray-400)' }}>{r.deadline || '—'}</td>
                  <td>
                    {r.attachments && r.attachments.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {r.attachments.map((f, i) => (
                          <span key={i} className="chip" style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '4px' }} title={f}>
                            📎 {f.length > 12 ? f.substring(0, 10) + '...' : f}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--gray-600)', fontSize: '0.8rem' }}>None</span>
                    )}
                  </td>
                  {user?.role !== 'Vendor' && <td style={{ fontSize: '0.82rem' }}>{r.createdBy || '—'}</td>}
                  <td><span className={`status-badge ${getStatusClass(r.status)}`}>{r.status}</span></td>
                  <td>
                    {user?.role === 'Vendor' ? (
                      r.status === 'Open' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/quotations', { state: { rfqId: r.id } })}>
                          💬 Bid Now
                        </button>
                      ) : (
                        <span style={{ color: 'var(--gray-600)', fontSize: '0.8rem', fontStyle: 'italic' }}>Closed</span>
                      )
                    ) : (
                      <select
                        value={r.status}
                        onChange={e => updateStatus(r, e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--gray-300)', padding: '4px 8px', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No RFQs found</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create RFQ Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box modal-lg" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3>📋 Create New Request for Quotation</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠️</span><span>{error}</span></div>}
            <form className="modal-form" onSubmit={handleCreate}>
              <div>
                <label>RFQ Title *</label>
                <input className="modal-inp" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Procurement of IT Laptops for Development Team" required />
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
                <textarea className="modal-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the technical requirements in detail…" style={{ height: '70px' }} />
              </div>

              {/* Items List */}
              <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--gray-400)' }}>Required items/services *</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addItemRow}>+ Add Item</button>
                </div>
                <div style={{ maxH: '180px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.5rem', background: 'rgba(0,0,0,0.1)' }}>
                  {rfqItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                      <input className="modal-inp" style={{ flex: 2 }} value={item.name} onChange={e => updateItemRow(idx, 'name', e.target.value)} placeholder="Item / service name" required />
                      <input className="modal-inp" style={{ width: '80px' }} type="number" min="1" value={item.qty} onChange={e => updateItemRow(idx, 'qty', parseInt(e.target.value) || 1)} placeholder="Qty" required />
                      <input className="modal-inp" style={{ width: '80px' }} value={item.unit} onChange={e => updateItemRow(idx, 'unit', e.target.value)} placeholder="unit (e.g. pcs)" required />
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItemRow(idx)} disabled={rfqItems.length === 1}>🗑️</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendor Selection checklist */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--gray-400)', display: 'block', marginBottom: '0.35rem' }}>Assign Vendors *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '100px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.5rem', background: 'rgba(0,0,0,0.1)' }}>
                  {vendors.map(v => (
                    <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--gray-300)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedVendors.includes(v.id)} onChange={() => toggleVendor(v.id)} />
                      <span>{v.name} ({v.id})</span>
                    </label>
                  ))}
                  {vendors.length === 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>No active vendors found</div>
                  )}
                </div>
              </div>

              {/* File Attachment */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--gray-400)', display: 'block', marginBottom: '0.35rem' }}>File Attachments</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
                  <input className="modal-inp" style={{ flex: 1 }} value={mockFileName} onChange={e => setMockFileName(e.target.value)} placeholder="e.g. technical_specs.pdf" />
                  <button type="button" className="btn btn-outline" onClick={addAttachment}>Attach File</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {fileAttachments.map((f, i) => (
                    <span key={i} className="chip" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '999px' }}>
                      📎 {f}
                      <button type="button" onClick={() => removeAttachment(i)} style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}>✕</button>
                    </span>
                  ))}
                </div>
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
