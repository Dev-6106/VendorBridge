import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TYPE_COLORS = {
  RFQ: '#6366f1',
  Quotation: '#8b5cf6',
  Approval: '#10b981',
  PO: '#f59e0b',
};

export default function ActivityLogs() {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/api/activities', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setActivities(res.data.activities || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const types = ['RFQ', 'Quotation', 'Approval', 'PO'];

  const filtered = activities.filter(a => {
    const q = search.toLowerCase();
    const mS = !q || a.text?.toLowerCase().includes(q) || a.user?.toLowerCase().includes(q);
    const mF = !filter || a.type === filter;
    return mS && mF;
  });

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return ts; }
  };

  // Group by date
  const grouped = filtered.reduce((acc, a) => {
    const date = a.timestamp ? new Date(a.timestamp).toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'Unknown';
    if (!acc[date]) acc[date] = [];
    acc[date].push(a);
    return acc;
  }, {});

  return (
    <section className="page" id="page-activity">
      <div className="page-toolbar">
        <div className="search-filter">
          <input className="search-inp" placeholder="🔍 Search activities, user…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-sel" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Types</option>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="section-card">
          <div className="empty-state" style={{ padding: '4rem 1rem' }}>
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-text">No activity logs found</div>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
              {date}
            </div>
            <div className="section-card">
              <div className="activity-list">
                {items.map(a => {
                  const color = TYPE_COLORS[a.type] || '#6366f1';
                  return (
                    <div className="activity-item" key={a.id}>
                      <div className="activity-icon" style={{ background: `${color}18`, fontSize: '1.1rem' }}>
                        {a.icon || '🔔'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">{a.text}</div>
                        <div className="activity-meta">
                          <span className="activity-time">🕐 {formatTime(a.timestamp)}</span>
                          {a.user && <span className="activity-user">👤 {a.user}</span>}
                          {a.type && (
                            <span style={{ fontSize: '0.7rem', color: color, fontWeight: 600, padding: '1px 6px', background: `${color}15`, borderRadius: '999px' }}>{a.type}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
