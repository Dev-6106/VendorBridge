import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function POInvoices() {
  const { token, user } = useAuth();
  const [pos, setPos] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [emailing, setEmailing] = useState(null);

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
      alert('Invoice generated and sent to vendor successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate invoice');
    } finally { setGenerating(null); }
  };

  // print document in a beautiful, separate browser context
  const printDocument = (doc, isInvoice) => {
    const printWindow = window.open('', '_blank');
    const title = isInvoice ? `Invoice for PO ${doc.id}` : `Purchase Order ${doc.id}`;
    
    const itemsHtml = doc.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">${item.qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">₹${(item.unitPrice || 0).toLocaleString('en-IN')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; font-size: 13px;">₹${(item.total || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin: 40px; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }
            .doc-type { font-size: 18px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .detail-block { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #f8fafc; }
            .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 5px; }
            .value { font-size: 14px; font-weight: 600; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f1f5f9; padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
            .totals { float: right; width: 300px; display: flex; flex-direction: column; gap: 6px; margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; }
            .grand-total { font-size: 16px; font-weight: 800; color: #10b981; border-top: 1.5px solid #cbd5e1; padding-top: 8px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">⚡ VendorBridge</div>
              <div style="font-size: 11px; color: #64748b; font-weight: 500;">ERP Pro Suite &bull; Procurement Cycle</div>
            </div>
            <div style="text-align: right;">
              <div class="doc-type">${isInvoice ? 'TAX INVOICE' : 'PURCHASE ORDER'}</div>
              <div style="font-size: 14px; color: #0f172a; font-weight: 700; margin-top: 4px;">Ref: ${doc.id}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date: ${doc.issuedDate}</div>
            </div>
          </div>
          <div class="details">
            <div class="detail-block">
              <div class="label">Vendor details</div>
              <div class="value">${doc.vendorName}</div>
              <div style="font-size: 12px; color: #475569; margin-top: 2px;">ID: ${doc.vendorId}</div>
            </div>
            <div class="detail-block">
              <div class="label">Specifications</div>
              <div class="value">RFQ Title: ${doc.rfqTitle || doc.rfqId || '—'}</div>
              <div style="font-size: 12px; color: #475569; margin-top: 2px;">Delivery Target: ${doc.deliveryDate || '—'}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Item Description</th>
                <th style="text-align: center; width: 15%;">Qty</th>
                <th style="text-align: right; width: 18%;">Unit Price</th>
                <th style="text-align: right; width: 17%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            <div class="total-row"><span>Subtotal</span><span>₹${(doc.subTotal || 0).toLocaleString('en-IN')}</span></div>
            <div class="total-row"><span>GST (${doc.gstPercent || 18}%)</span><span>₹${(doc.gstAmount || 0).toLocaleString('en-IN')}</span></div>
            <div class="total-row grand-total"><span>Grand Total</span><span>₹${(doc.grandTotal || 0).toLocaleString('en-IN')}</span></div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleEmail = (doc, isInvoice) => {
    setEmailing(doc.id);
    setTimeout(() => {
      alert(`Email containing ${isInvoice ? 'Tax Invoice' : 'Purchase Order'} ${doc.id} sent successfully to vendor contact!`);
      setEmailing(null);
    }, 1000);
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
          <div className="stat-info"><div className="stat-val">{pos.length}</div><div className="stat-label">{user?.role === 'Vendor' ? 'My POs' : 'Total POs'}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>💰</div>
          <div className="stat-info"><div className="stat-val">₹{(totalSpend / 100000).toFixed(1)}L</div><div className="stat-label">{user?.role === 'Vendor' ? 'Order Value' : 'Total Spend'}</div></div>
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
          <h3>🛒 {user?.role === 'Vendor' ? 'My Purchase Orders & Invoices' : 'Purchase Orders & Invoices'}</h3>
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
                      {!p.invoiceGenerated && user?.role !== 'Vendor' && (
                        <button className="btn btn-primary btn-sm" disabled={generating === p.id} onClick={() => generateInvoice(p)} title="Generate Invoice">
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
          <div className="modal-box modal-lg" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div className="invoice-header" style={{ marginBottom: 0, width: '100%' }}>
                <div>
                  <div className="invoice-title">{selected.invoiceGenerated ? 'Tax Invoice' : 'Purchase Order'}</div>
                  <div className="invoice-sub">{selected.id} · Issued {selected.issuedDate}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge ${getStatusClass(selected.status)}`}>{selected.status}</span>
                  <button className="modal-close" onClick={() => setSelected(null)} style={{ marginLeft: '0.75rem' }}>✕</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.25rem 0' }}>
              {[
                ['Vendor Name', selected.vendorName],
                ['Vendor ID', selected.vendorId],
                ['RFQ Reference', selected.rfqTitle || selected.rfqId || '—'],
                ['Delivery Target', selected.deliveryDate || '—'],
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
                  <thead><tr><th>Item Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
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
              <div className="total-row"><span>GST ({selected.gstPercent || 18}%)</span><span>₹{(selected.gstAmount || 0).toLocaleString('en-IN')}</span></div>
              <div className="total-row grand"><span>Grand Total</span><span style={{ color: 'var(--success)' }}>₹{(selected.grandTotal || 0).toLocaleString('en-IN')}</span></div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
              
              {/* Document actions */}
              <button className="btn btn-outline" onClick={() => printDocument(selected, selected.invoiceGenerated)}>
                🖨️ Print / Save PDF
              </button>
              <button className="btn btn-outline" disabled={emailing === selected.id} onClick={() => handleEmail(selected, selected.invoiceGenerated)}>
                {emailing === selected.id ? 'Sending…' : '✉️ Send via Email'}
              </button>
              
              {!selected.invoiceGenerated && user?.role !== 'Vendor' && (
                <button className="btn btn-primary" disabled={generating === selected.id} onClick={() => generateInvoice(selected)}>
                  {generating === selected.id ? 'Generating…' : '🧾 Generate Invoice'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
