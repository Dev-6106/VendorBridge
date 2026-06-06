import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Quotations() {
  const { token, user } = useAuth();
  const routeLocation = useLocation();
  const [quotations, setQuotations] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  
  // Officer state
  const [compareRfqId, setCompareRfqId] = useState(routeLocation.state?.rfqId || '');
  const [sortBy, setSortBy] = useState('price'); // price, delivery, rating
  const [approving, setApproving] = useState(false);
  const [approvalMsg, setApprovalMsg] = useState('');

  // Vendor state
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [bidItems, setBidItems] = useState([]);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [editQuoteId, setEditQuoteId] = useState(null);
  const [biddingError, setBiddingError] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [qRes, rRes] = await Promise.all([
        axios.get('http://localhost:3000/api/quotations', { headers }),
        axios.get('http://localhost:3000/api/rfqs', { headers }),
      ]);
      setQuotations(qRes.data.quotations || []);
      setRfqs(rRes.data.rfqs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const rfqTitle = (id) => rfqs.find(r => r.id === id)?.title || id;

  const getStatusClass = (s) => {
    if (!s) return 'status-neutral';
    const l = s.toLowerCase();
    if (l === 'accepted' || l === 'approved') return 'status-success';
    if (l === 'rejected') return 'status-danger';
    if (l === 'submitted') return 'status-warning';
    if (l === 'draft') return 'status-info';
    return 'status-neutral';
  };

  // Compare quotes for comparison matrix
  const compareQuotes = quotations.filter(q => q.rfqId === compareRfqId && q.status !== 'Draft');
  
  // Find highlights in compareQuotes
  const lowestPriceQuote = compareQuotes.length > 0
    ? [...compareQuotes].sort((a, b) => a.grandTotal - b.grandTotal)[0]
    : null;
  const fastestDeliveryQuote = compareQuotes.length > 0
    ? [...compareQuotes].sort((a, b) => a.deliveryDays - b.deliveryDays)[0]
    : null;

  // Sorting logic for comparison list
  const sortedQuotes = [...compareQuotes].sort((a, b) => {
    if (sortBy === 'price') return a.grandTotal - b.grandTotal;
    if (sortBy === 'delivery') return a.deliveryDays - b.deliveryDays;
    // rating (we need to resolve vendor rating, mock 4.5 if not found)
    const ratingA = a.rating || 4.2;
    const ratingB = b.rating || 4.2;
    return ratingB - ratingA;
  });

  // Submit quotation for manager approval
  const handleRequestApproval = async (quote) => {
    setApproving(true);
    setApprovalMsg('');
    const targetRfq = rfqs.find(r => r.id === quote.rfqId);
    try {
      const payload = {
        refId: quote.id,
        type: 'Quotation',
        title: `Approval request for Quote ${quote.id} (RFQ: ${targetRfq?.title || quote.rfqId})`,
        amount: quote.grandTotal,
        requestedBy: user?.name || user?.email || 'Officer',
        department: 'Procurement',
        totalStages: 3,
        stage: 1,
        stages: ['Request Submitted', 'Manager Review', 'PO Generation'],
        remarks: `Selected quote from ${quote.vendorName} with grand total of ₹${quote.grandTotal.toLocaleString('en-IN')} and delivery in ${quote.deliveryDays} days.`
      };
      
      const res = await axios.post('http://localhost:3000/api/approvals', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        // Update rfq status to Under Review
        await axios.patch(`http://localhost:3000/api/rfqs/${quote.rfqId}/status`, { status: 'Under Review' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Quotation submitted to Manager for approval successfully!');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit approval request');
    } finally {
      setApproving(false);
    }
  };

  // Vendor bidding handlers
  const openBidForm = (rfq, existingQuote = null) => {
    setSelectedRfq(rfq);
    setBiddingError('');
    if (existingQuote) {
      setEditQuoteId(existingQuote.id);
      setBidItems(existingQuote.items.map(item => ({ ...item })));
      setDeliveryDays(existingQuote.deliveryDays);
      setNotes(existingQuote.notes || '');
    } else {
      setEditQuoteId(null);
      setBidItems(rfq.items.map(item => ({ name: item.name, qty: item.qty, unitPrice: 0, total: 0 })));
      setDeliveryDays(7);
      setNotes('');
    }
    setShowBidModal(true);
  };

  const handleUnitPriceChange = (idx, val) => {
    const updated = [...bidItems];
    const unitPrice = parseFloat(val) || 0;
    updated[idx].unitPrice = unitPrice;
    updated[idx].total = updated[idx].qty * unitPrice;
    setBidItems(updated);
  };

  const submitBid = async (status) => {
    setSubmittingBid(true);
    setBiddingError('');

    const subTotal = bidItems.reduce((acc, item) => acc + item.total, 0);
    const gstPercent = 18;
    const gstAmount = Math.round(subTotal * (gstPercent / 100));
    const grandTotal = subTotal + gstAmount;

    const payload = {
      rfqId: selectedRfq.id,
      items: bidItems,
      deliveryDays: parseInt(deliveryDays) || 7,
      gstPercent,
      gstAmount,
      subTotal,
      grandTotal,
      notes,
      status // 'Draft' or 'Submitted'
    };

    try {
      const headers = { Authorization: `Bearer ${token}` };
      let res;
      if (editQuoteId) {
        res = await axios.put(`http://localhost:3000/api/quotations/${editQuoteId}`, payload, { headers });
      } else {
        res = await axios.post('http://localhost:3000/api/quotations', payload, { headers });
      }

      if (res.data.success) {
        alert(status === 'Submitted' ? 'Quotation submitted successfully!' : 'Quotation draft saved.');
        setShowBidModal(false);
        fetchData();
      }
    } catch (err) {
      setBiddingError(err.response?.data?.message || 'Failed to submit bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  const filtered = quotations.filter(q => {
    const s = search.toLowerCase();
    return !s || q.id?.toLowerCase().includes(s) || q.vendorName?.toLowerCase().includes(s) || q.rfqId?.toLowerCase().includes(s);
  });

  return (
    <section className="page" id="page-quotations">
      
      {/* ── Procurement Officer / Admin View ── */}
      {user?.role !== 'Vendor' && (
        <>
          <div className="page-toolbar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="search-filter" style={{ flex: 1 }}>
              <select className="filter-sel" style={{ width: '100%', maxWidth: '300px' }} value={compareRfqId} onChange={e => setCompareRfqId(e.target.value)}>
                <option value="">-- Select RFQ to Compare Bids --</option>
                {rfqs.map(r => <option key={r.id} value={r.id}>{r.id} · {r.title} ({r.status})</option>)}
              </select>
            </div>
            {compareRfqId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Sort Matrix:</span>
                <select className="filter-sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="price">Lowest Price First</option>
                  <option value="delivery">Fastest Delivery First</option>
                  <option value="rating">Highest Rating First</option>
                </select>
              </div>
            )}
          </div>

          {/* Comparison Side-by-Side Matrix */}
          {compareRfqId && (
            <div className="section-card" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
              <div className="section-head" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 Comparison Matrix — {compareRfqId}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '2px' }}>{rfqTitle(compareRfqId)}</p>
                </div>
                <span className="chip">{compareQuotes.length} Bid(s) Received</span>
              </div>
              <div style={{ overflowX: 'auto', padding: '1rem' }}>
                {compareQuotes.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">📊</div>
                    <div className="empty-state-text">No bids submitted for this RFQ yet</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '1.25rem', minWidth: 'max-content' }}>
                    {sortedQuotes.map(q => {
                      const isLowestPrice = lowestPriceQuote?.id === q.id;
                      const isFastestDelivery = fastestDeliveryQuote?.id === q.id;
                      return (
                        <div key={q.id} style={{
                          width: '240px',
                          background: 'rgba(255,255,255,0.02)',
                          border: isLowestPrice 
                            ? '2px solid var(--success)' 
                            : isFastestDelivery 
                              ? '1.5px dashed var(--info)' 
                              : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '12px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          position: 'relative'
                        }}>
                          {isLowestPrice && (
                            <span className="status-badge status-success" style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '0.68rem', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }}>
                              💎 Lowest Price
                            </span>
                          )}
                          {!isLowestPrice && isFastestDelivery && (
                            <span className="status-badge status-info" style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '0.68rem' }}>
                              ⚡ Fastest Delivery
                            </span>
                          )}

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-50)' }}>{q.vendorName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: '2px' }}>ID: {q.vendorId}</div>
                            <div style={{ color: 'var(--warning)', marginTop: '4px', fontSize: '0.85rem' }}>
                              ⭐ {q.vendorId === 'V001' ? '4.8' : q.vendorId === 'V002' ? '4.2' : q.vendorId === 'V003' ? '4.6' : '4.4'}
                            </div>
                          </div>

                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                              <span style={{ color: 'var(--gray-500)' }}>Subtotal:</span>
                              <span style={{ fontWeight: 500 }}>₹{q.subTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                              <span style={{ color: 'var(--gray-500)' }}>GST (18%):</span>
                              <span style={{ fontWeight: 500 }}>₹{q.gstAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
                              <span style={{ color: 'var(--gray-200)', fontWeight: 600 }}>Grand Total:</span>
                              <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{q.grandTotal.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: 'var(--gray-500)' }}>Timeline:</span>
                              <span style={{ fontWeight: 600, color: 'var(--gray-200)' }}>{q.deliveryDays} Days</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--gray-500)' }}>Status:</span>
                              <span className={`status-badge ${getStatusClass(q.status)}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{q.status}</span>
                            </div>
                          </div>

                          {q.notes && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '4px', fontStyle: 'italic', border: '1px solid rgba(255,255,255,0.03)' }}>
                              "{q.notes}"
                            </div>
                          )}

                          <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                            {q.status === 'Submitted' ? (
                              <button className="btn btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem' }} disabled={approving} onClick={() => handleRequestApproval(q)}>
                                {approving ? 'Submitting…' : '✅ Request Approval'}
                              </button>
                            ) : q.status === 'Accepted' ? (
                              <div style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center', padding: '6px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px' }}>
                                ✓ Accepted (PO Generated)
                              </div>
                            ) : (
                              <div style={{ color: 'var(--gray-500)', fontSize: '0.82rem', textAlign: 'center', padding: '6px' }}>
                                {q.status}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quotations Directory */}
          <div className="section-card">
            <div className="section-head">
              <h3>💬 All Quotations</h3>
              <div className="search-filter">
                <input className="search-inp" placeholder="🔍 Search quotations…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
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
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{q.grandTotal.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--gray-400)' }}>{q.deliveryDays} days</td>
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
        </>
      )}

      {/* ── Vendor View ── */}
      {user?.role === 'Vendor' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            
            {/* RFQ Invitations */}
            <div className="section-card">
              <div className="section-head">
                <h3>📋 Active RFQ Invitations</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Open for bidding</span>
              </div>
              <div style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr><th>RFQ ID</th><th>Title</th><th>Category</th><th>Items</th><th>Deadline</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {rfqs.filter(r => r.status === 'Open').map(r => {
                      const existingQuote = quotations.find(q => q.rfqId === r.id);
                      return (
                        <tr key={r.id}>
                          <td className="td-id">{r.id}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--gray-200)' }}>{r.title}</div>
                            {r.description && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{r.description}</div>}
                          </td>
                          <td><span className="chip">{r.category}</span></td>
                          <td>{r.items?.length || 0} Item(s)</td>
                          <td style={{ color: 'var(--gray-400)' }}>{r.deadline}</td>
                          <td>
                            {existingQuote ? (
                              existingQuote.status === 'Draft' ? (
                                <button className="btn btn-outline btn-sm" onClick={() => openBidForm(r, existingQuote)}>
                                  ✏️ Edit Draft Bid
                                </button>
                              ) : (
                                <span style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600 }}>✓ Bid Submitted ({existingQuote.id})</span>
                              )
                            ) : (
                              <button className="btn btn-primary btn-sm" onClick={() => openBidForm(r)}>
                                💬 Submit Bid
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {rfqs.filter(r => r.status === 'Open').length === 0 && (
                      <tr><td colSpan="6"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No active invitations for you</div></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submitted/Draft Bids */}
            <div className="section-card">
              <div className="section-head">
                <h3>💬 My Bid Submissions</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Your drafts and submissions</span>
              </div>
              <div style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Bid ID</th><th>RFQ ID</th><th>RFQ Title</th><th>Grand Total</th><th>Delivery</th><th>Submitted</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {quotations.map(q => (
                      <tr key={q.id}>
                        <td className="td-id">{q.id}</td>
                        <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{q.rfqId}</td>
                        <td className="td-name">{rfqTitle(q.rfqId)}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{q.grandTotal.toLocaleString('en-IN')}</td>
                        <td>{q.deliveryDays} Days</td>
                        <td style={{ color: 'var(--gray-500)' }}>{q.submittedAt}</td>
                        <td><span className={`status-badge ${getStatusClass(q.status)}`}>{q.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => setSelected(q)}>View</button>
                            {q.status === 'Draft' && (
                              <button className="btn btn-primary btn-sm" onClick={() => {
                                const rfq = rfqs.find(r => r.id === q.rfqId);
                                if (rfq) openBidForm(rfq, q);
                              }}>✏️ Edit</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {quotations.length === 0 && (
                      <tr><td colSpan="8"><div className="empty-state"><div className="empty-state-icon">💬</div><div className="empty-state-text">No bids submitted yet</div></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal-box modal-lg">
            <div className="modal-header">
              <div>
                <h3>💬 Quotation Details — {selected.id}</h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '3px' }}>For RFQ: {rfqTitle(selected.rfqId)} ({selected.rfqId})</div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                ['Vendor Name', selected.vendorName],
                ['Vendor ID', selected.vendorId],
                ['RFQ ID', selected.rfqId],
                ['Submitted On', selected.submittedAt],
                ['Delivery timeline', `${selected.deliveryDays} Days`],
                ['Quotation Status', selected.status],
              ].map(([label, val]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{label}</div>
                  <div style={{ color: 'var(--gray-200)', fontSize: '0.875rem', fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>

            {selected.items?.length > 0 && (
              <div className="invoice-items">
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Line Items pricing</div>
                <table>
                  <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {selected.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>{item.qty} {item.unit || 'pcs'}</td>
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

      {/* Vendor Bidding Modal */}
      {showBidModal && selectedRfq && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBidModal(false)}>
          <div className="modal-box modal-lg" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3>💬 Bid Submission</h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '2px' }}>RFQ: {selectedRfq.title} ({selectedRfq.id})</div>
              </div>
              <button className="modal-close" onClick={() => setShowBidModal(false)}>✕</button>
            </div>
            {biddingError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠️</span><span>{biddingError}</span></div>}

            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.5rem', background: 'rgba(0,0,0,0.1)', marginBottom: '1rem' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead><tr><th>Item Name</th><th>Qty</th><th>Unit Price (₹) *</th><th>Line Total (₹)</th></tr></thead>
                <tbody>
                  {bidItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--gray-200)' }}>{item.name}</td>
                      <td>{item.qty}</td>
                      <td>
                        <input className="modal-inp" style={{ width: '120px', padding: '4px 8px' }} type="number" min="0" step="0.01" value={item.unitPrice || ''} onChange={e => handleUnitPriceChange(idx, e.target.value)} required />
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        ₹{(item.total || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Delivery Timeline (Days) *</label>
                <input className="modal-inp" type="number" min="1" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} required />
              </div>
              <div className="invoice-total" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                <div className="total-row" style={{ fontSize: '0.82rem' }}>
                  <span>Subtotal:</span>
                  <span>₹{bidItems.reduce((acc, item) => acc + item.total, 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="total-row" style={{ fontSize: '0.82rem' }}>
                  <span>GST (18%):</span>
                  <span>₹{Math.round(bidItems.reduce((acc, item) => acc + item.total, 0) * 0.18).toLocaleString('en-IN')}</span>
                </div>
                <div className="total-row grand" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--success)' }}>
                    ₹{Math.round(bidItems.reduce((acc, item) => acc + item.total, 0) * 1.18).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Bid Notes / Remarks</label>
              <textarea className="modal-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter delivery terms, warranty, or additional notes here…" style={{ height: '60px' }} />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowBidModal(false)}>Cancel</button>
              <button type="button" className="btn btn-outline" style={{ borderColor: 'var(--info)', color: 'var(--info)' }} disabled={submittingBid} onClick={() => submitBid('Draft')}>
                💾 Save as Draft
              </button>
              <button type="button" className="btn btn-primary" disabled={submittingBid} onClick={() => submitBid('Submitted')}>
                {submittingBid ? 'Submitting…' : '💬 Submit Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
