import { useState, useEffect } from 'react';
import { alertAPI } from '../../api';
import { useSocket } from '../../context/SocketContext';
import { FiBell, FiCheck, FiCheckCircle, FiAlertTriangle, FiClock, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../tasks/Tasks.css';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { socket } = useSocket();

  useEffect(() => { fetchAlerts(); }, [filter]);

  // Real-time: refresh alerts on socket events
  useEffect(() => {
    if (!socket) return;
    const onNewAlert = (data) => {
      toast('New alert received!', { icon: '🔔' });
      fetchAlerts();
    };
    socket.on('alert:new', onNewAlert);
    return () => socket.off('alert:new', onNewAlert);
  }, [socket]);

  const fetchAlerts = async () => {
    try {
      const params = { limit: 50 };
      if (filter) params.type = filter;
      const res = await alertAPI.getAll(params);
      setAlerts(res.data.data.alerts);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    await alertAPI.markAsRead(id);
    fetchAlerts();
  };

  const handleMarkAllRead = async () => {
    await alertAPI.markAllAsRead();
    toast.success('All marked as read');
    fetchAlerts();
  };

  const typeIcons = {
    delay: <FiAlertTriangle style={{ color: '#ef4444' }} />,
    'low-productivity': <FiClock style={{ color: '#f59e0b' }} />,
    milestone: <FiAward style={{ color: '#10b981' }} />,
    reminder: <FiBell style={{ color: '#3b82f6' }} />,
  };

  const sevColors = { low: '#10b981', medium: '#f59e0b', high: '#ea580c', critical: '#ef4444' };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div><h1>Alerts</h1><p>{alerts.filter(a => !a.isRead).length} unread</p></div>
        <button className="btn btn-primary" onClick={handleMarkAllRead}><FiCheckCircle /> Mark All Read</button>
      </div>
      <div className="filters-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="delay">Delay</option>
          <option value="low-productivity">Low Productivity</option>
          <option value="milestone">Milestone</option>
          <option value="reminder">Reminder</option>
        </select>
      </div>
      <div className="task-list">
        {alerts.length === 0 ? (
          <div className="empty-state"><FiBell className="empty-icon" /><h3>No alerts</h3></div>
        ) : alerts.map((a) => (
          <div key={a._id} className="task-card" style={{ opacity: a.isRead ? 0.6 : 1, borderLeft: `4px solid ${sevColors[a.severity]}` }}>
            <div className="task-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {typeIcons[a.type]}<h3 className="task-card-title">{a.title}</h3>
              </div>
              {!a.isRead && <button className="icon-btn" onClick={() => handleMarkRead(a._id)}><FiCheck /></button>}
            </div>
            <p className="task-card-desc">{a.message}</p>
            <div className="task-card-meta">
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: `${sevColors[a.severity]}20`, color: sevColors[a.severity], textTransform: 'uppercase' }}>{a.severity}</span>
              <span className="meta-date">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
