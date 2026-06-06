import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Quotations() {
  const { token } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get('http://localhost:3000/api/quotations', { headers }),
      axios.get('http://localhost:3000/api/rfqs', { headers }),
    ]).then(([qRes, rRes]) => {
      setQuotations(qRes.data.quotations || []);
      setRfqs(rRes.data.rfqs || []);
    }).catch(console.error);
  }, [token]);

  const rfqTitle = (id) => rfqs.find(r => r.id === id)?.title || id;

  const getStatusClass = (s) => {
    if (!s) return 'status-neutral';
    const l = s.toLowerCase();
    if (l === 'accepted') return 'status-success';
    if (l === 'rejected') return 'status-danger';
    if (l === 'submitted') return 'status-warning';
    return 'status-neutral';
  };

  const filtered = quotations.filter(q => {
    const s = search.toLowerCase();
    return !s || q.id?.toLowerCase().includes(s) || q.vendorName?.toLowerCase().includes(s) || q.rfqId?.toLowerCase().includes(s);
  });

  return (
    <section className="page" id="page-quotations">
      <div className="page-toolbar">
        <div className="search-filter">
          <input className="search-inp" placeholder="🔍 Search quotations, vendor, RFQ…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="section-card">
        <div className="section-head">
          <h3>💬 Quotations</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{filtered.length} quotation{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>RFQ</th><th>Vendor</th><th>Grand Total</th><th>Delivery</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id}>
                  <td className="td-id">{q.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-200)' }}>{rfqTitle(q.rfqId)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{q.rfqId}</div>
                  </td>
                  <td className="td-name">{q.vendorName}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{(q.grandTotal || 0).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--gray-400)' }}>{q.deliveryDays ? `${q.deliveryDays} days` : '—'}</td>
                  <td><span className={`status-badge ${getStatusClass(q.status)}`}>{q.status}</span></td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>{q.submittedAt}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelected(q)}>View</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8"><div className="empty-state"><div className="empty-state-icon">💬</div><div className="empty-state-text">No quotations found</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal-box modal-lg">
            <div className="modal-header">
              <div>
                <h3>💬 Quotation — {selected.id}</h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '3px' }}>For RFQ: {rfqTitle(selected.rfqId)}</div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                ['Vendor', selected.vendorName],
                ['Vendor ID', selected.vendorId],
                ['RFQ ID', selected.rfqId],
                ['Submitted', selected.submittedAt],
                ['Delivery', selected.deliveryDays ? `${selected.deliveryDays} days` : '—'],
                ['Status', selected.status],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{label}</div>
                  <div style={{ color: 'var(--gray-200)', fontSize: '0.875rem' }}>{val}</div>
                </div>
              ))}
            </div>

            {selected.items?.length > 0 && (
              <div className="invoice-items">
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Line Items</div>
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

            {selected.notes && (
              <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Notes</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-300)', lineHeight: 1.6 }}>{selected.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
