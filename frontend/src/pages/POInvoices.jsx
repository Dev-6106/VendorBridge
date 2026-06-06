import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function POInvoices() {
  const { token } = useAuth();
  const [pos, setPos] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [generating, setGenerating] = useState(null);

  useEffect(() => { fetchPOs(); }, []);

  const fetchPOs = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/pos', { headers: { Authorization: `Bearer ${token}` } });
      setPos(res.data.pos || []);
    } catch (err) { console.error(err); }
  };

  const generateInvoice = async (po) => {
    setGenerating(po.id);
    try {
      await axios.patch(`http://localhost:3000/api/pos/${po.id}/invoice`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchPOs();
      setSelected(prev => prev?.id === po.id ? { ...prev, invoiceGenerated: true, status: 'Invoice Sent' } : prev);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate invoice');
    } finally { setGenerating(null); }
  };

  const getStatusClass = (s) => {
    if (!s) return 'status-neutral';
    const l = s.toLowerCase();
    if (l === 'issued' || l === 'delivered') return 'status-success';
    if (l === 'invoice sent') return 'status-info';
    if (l === 'pending') return 'status-warning';
    return 'status-neutral';
  };

  const filtered = pos.filter(p => {
    const q = search.toLowerCase();
    const mS = !q || p.id?.toLowerCase().includes(q) || p.vendorName?.toLowerCase().includes(q) || p.rfqId?.toLowerCase().includes(q);
    const mSt = !statusFilter || p.status === statusFilter;
    return mS && mSt;
  });

  const totalSpend = pos.reduce((s, p) => s + (p.grandTotal || 0), 0);
  const statuses = ['Issued', 'Invoice Sent', 'Delivered'];

  return (
    <section className="page" id="page-pos">
      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-info"><div className="stat-val">{pos.length}</div><div className="stat-label">Total POs</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>💰</div>
          <div className="stat-info"><div className="stat-val">₹{(totalSpend / 100000).toFixed(1)}L</div><div className="stat-label">Total Spend</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>🧾</div>
          <div className="stat-info"><div className="stat-val">{pos.filter(p => p.invoiceGenerated).length}</div><div className="stat-label">Invoices Sent</div></div>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-filter">
          <input className="search-inp" placeholder="🔍 Search POs, vendor, RFQ…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="section-card">
        <div className="section-head">
          <h3>🛒 Purchase Orders & Invoices</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{filtered.length} PO{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr><th>PO ID</th><th>RFQ</th><th>Vendor</th><th>Grand Total</th><th>Issued</th><th>Delivery</th><th>Invoice</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="td-id">{p.id}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>{p.rfqId || '—'}</td>
                  <td className="td-name">{p.vendorName}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{(p.grandTotal || 0).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.82rem' }}>{p.issuedDate}</td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.82rem' }}>{p.deliveryDate || '—'}</td>
                  <td>
                    {p.invoiceGenerated
                      ? <span className="status-badge status-info">🧾 Sent</span>
                      : <span className="status-badge status-neutral">Not Generated</span>
                    }
                  </td>
                  <td><span className={`status-badge ${getStatusClass(p.status)}`}>{p.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setSelected(p)}>View</button>
                      {!p.invoiceGenerated && (
                        <button className="btn btn-primary btn-sm" disabled={generating === p.id} onClick={() => generateInvoice(p)}>
                          {generating === p.id ? '…' : '🧾'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon">🛒</div><div className="empty-state-text">No purchase orders found</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal-box modal-lg">
            <div className="modal-header">
              <div className="invoice-header" style={{ marginBottom: 0, width: '100%' }}>
                <div>
                  <div className="invoice-title">Purchase Order</div>
                  <div className="invoice-sub">{selected.id} · {selected.issuedDate}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge ${getStatusClass(selected.status)}`}>{selected.status}</span>
                  <button className="modal-close" onClick={() => setSelected(null)} style={{ marginLeft: '0.75rem' }}>✕</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.25rem 0' }}>
              {[
                ['Vendor', selected.vendorName],
                ['Vendor ID', selected.vendorId],
                ['RFQ', selected.rfqTitle || selected.rfqId || '—'],
                ['Delivery Date', selected.deliveryDate || '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{label}</div>
                  <div style={{ color: 'var(--gray-200)', fontWeight: 500, fontSize: '0.875rem' }}>{val}</div>
                </div>
              ))}
            </div>

            {selected.items?.length > 0 && (
              <div className="invoice-items">
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Line Items</div>
                <table>
                  <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {selected.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>{item.qty}</td>
                        <td>₹{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 600 }}>₹{(item.total || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="invoice-total" style={{ marginTop: '1rem' }}>
              <div className="total-row"><span>Subtotal</span><span>₹{(selected.subTotal || 0).toLocaleString('en-IN')}</span></div>
              <div className="total-row"><span>GST ({selected.gstPercent || 0}%)</span><span>₹{(selected.gstAmount || 0).toLocaleString('en-IN')}</span></div>
              <div className="total-row grand"><span>Grand Total</span><span style={{ color: 'var(--success)' }}>₹{(selected.grandTotal || 0).toLocaleString('en-IN')}</span></div>
            </div>

            {!selected.invoiceGenerated && (
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
                <button className="btn btn-primary" disabled={generating === selected.id} onClick={() => generateInvoice(selected)}>
                  {generating === selected.id ? 'Generating…' : '🧾 Generate Invoice'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
