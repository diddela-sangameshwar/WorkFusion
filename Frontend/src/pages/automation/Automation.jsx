import { useState, useEffect } from 'react';
import { automationAPI } from '../../api';
import StatusBadge from '../../components/common/StatusBadge';
import { FiCpu, FiPlay, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../tasks/Tasks.css';

const Automation = () => {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        automationAPI.getStatus(),
        automationAPI.getLogs({ limit: 20 }),
      ]);
      setStatus(sRes.data.data);
      setLogs(lRes.data.data.logs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const triggerWorkflow = async (name) => {
    try {
      toast.loading(`Running ${name}...`, { id: name });
      await automationAPI.trigger(name);
      toast.success(`${name} completed!`, { id: name });
      fetchData();
    } catch (err) {
      toast.error(`${name} failed`, { id: name });
    }
  };

  const workflows = [
    { name: 'hourly-deadline-check', label: 'Deadline Check', desc: 'Check tasks due within 24h' },
    { name: 'daily-overdue-check', label: 'Overdue Detection', desc: 'Find and flag overdue tasks' },
    { name: 'weekly-scoring', label: 'Score Calculation', desc: 'Calculate all scores' },
    { name: 'monthly-report', label: 'Monthly Report', desc: 'Generate monthly report' },
    { name: 'daily-productivity-check', label: 'Productivity Check', desc: 'Check low scores' },
  ];

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div><h1>Automation Engine</h1><p>RPA workflow management and monitoring</p></div>
      </div>

      {/* Workflow triggers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        {workflows.map((w) => (
          <div key={w.name} className="task-card" style={{ cursor: 'pointer' }} onClick={() => triggerWorkflow(w.name)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#6366f115', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiCpu />
              </div>
              <h4 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>{w.label}</h4>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{w.desc}</p>
            <button className="btn btn-primary" style={{ marginTop: 12, fontSize: 12, padding: '6px 14px' }}>
              <FiPlay /> Run Now
            </button>
          </div>
        ))}
      </div>

      {/* Workflow Stats */}
      {status?.workflowStats?.length > 0 && (
        <div className="chart-card full-width" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Workflow Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {status.workflowStats.map((ws) => (
              <div key={ws._id} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-primary)' }}>{ws._id}</h4>
                <p style={{ margin: '2px 0', fontSize: 12, color: 'var(--text-secondary)' }}>Runs: {ws.totalRuns}</p>
                <p style={{ margin: '2px 0', fontSize: 12, color: 'var(--text-secondary)' }}>Failed: {ws.failedRuns}</p>
                <p style={{ margin: '2px 0', fontSize: 12, color: 'var(--text-secondary)' }}>Avg: {Math.round(ws.avgDuration || 0)}ms</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="chart-card full-width">
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Logs</h3>
        <div className="task-list">
          {logs.length === 0 ? (
            <div className="empty-state"><FiClock className="empty-icon" /><h3>No logs yet</h3></div>
          ) : logs.map((log) => (
            <div key={log._id} className="task-card">
              <div className="task-card-header">
                <h3 className="task-card-title">{log.workflowName}</h3>
                <StatusBadge status={log.status} />
              </div>
              <div className="task-card-meta">
                <span className="meta-date"><FiClock style={{ marginRight: 4 }} />{new Date(log.triggeredAt).toLocaleString()}</span>
                <span className="meta-date">Duration: {log.duration}ms</span>
                <span className="meta-date">Affected: {log.affectedRecords}</span>
              </div>
              {log.error && <p style={{ color: '#ef4444', fontSize: 12, margin: '8px 0 0' }}>Error: {log.error}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Automation;
