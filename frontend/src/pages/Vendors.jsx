import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { name: '', category: '', gst: '', email: '', phone: '', status: 'Active', rating: 0 };

export default function Vendors() {
  const { token } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/vendors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(res.data.vendors || []);
    } catch (err) {
      console.error('Failed to fetch vendors', err);
    }
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditVendor(null); setError(''); setShowModal(true); };
  const openEdit = (v) => { setForm({ name: v.name, category: v.category, gst: v.gst, email: v.email, phone: v.phone, status: v.status, rating: v.rating }); setEditVendor(v); setError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditVendor(null); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editVendor) {
        await axios.put(`http://localhost:3000/api/vendors/${editVendor.id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:3000/api/vendors', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchVendors();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vendor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vendor) => {
    if (!window.confirm(`Delete vendor "${vendor.name}"?`)) return;
    try {
      await axios.delete(`http://localhost:3000/api/vendors/${vendor.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(vs => vs.filter(v => v.id !== vendor.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.id?.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q);
    const matchCat = !category || v.category === category;
    return matchSearch && matchCat;
  });

  const categories = ['IT Equipment', 'Office Materials', 'Manufacturing', 'Infrastructure', 'Logistics', 'Other'];

  return (
    <section className="page" id="page-vendors">
      <div className="page-toolbar">
        <div className="search-filter">
          <input type="text" className="search-inp" placeholder="🔍 Search vendors, ID, email…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-sel" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Vendor</button>
      </div>

      <div className="section-card">
        <div className="section-head">
          <h3>🏢 Vendor Directory</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{filtered.length} vendor{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="section-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vendor Name</th>
                <th>Category</th>
                <th>Contact</th>
                <th>GST</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td className="td-id">{v.id}</td>
                  <td>
                    <div className="td-name">{v.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{v.phone}</div>
                  </td>
                  <td><span className="chip">{v.category}</span></td>
                  <td style={{ fontSize: '0.82rem' }}>{v.email}</td>
                  <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{v.gst || '—'}</td>
                  <td>
                    <span className={`status-badge ${v.status === 'Active' ? 'status-success' : 'status-warning'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{'⭐'.repeat(Math.round(v.rating))}</span>
                    <span style={{ color: 'var(--gray-600)', fontSize: '0.8rem' }}> {v.rating}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-outline btn-sm btn-icon" title="Edit" onClick={() => openEdit(v)}>✏️</button>
                      <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => handleDelete(v)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8">
                  <div className="empty-state">
                    <div className="empty-state-icon">🏢</div>
                    <div className="empty-state-text">No vendors found</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editVendor ? '✏️ Edit Vendor' : '+ Add Vendor'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠️</span><span>{error}</span></div>}
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-row-2">
                <div>
                  <label>Vendor Name *</label>
                  <input className="modal-inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Company Ltd." required />
                </div>
                <div>
                  <label>Category</label>
                  <select className="modal-sel" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row-2">
                <div>
                  <label>Email</label>
                  <input className="modal-inp" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@vendor.com" />
                </div>
                <div>
                  <label>Phone</label>
                  <input className="modal-inp" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="form-row-2">
                <div>
                  <label>GST Number</label>
                  <input className="modal-inp" value={form.gst} onChange={e => setForm(f => ({ ...f, gst: e.target.value }))} placeholder="27AAPFU0939F1ZV" />
                </div>
                <div>
                  <label>Status</label>
                  <select className="modal-sel" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Blacklisted</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Rating (0-5)</label>
                <input className="modal-inp" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editVendor ? 'Save Changes' : 'Add Vendor')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
