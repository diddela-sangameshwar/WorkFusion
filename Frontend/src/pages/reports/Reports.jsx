import { useState, useEffect } from 'react';
import { reportAPI } from '../../api';
import StatusBadge from '../../components/common/StatusBadge';
import { FiFileText, FiPlus, FiDownload, FiTrash2, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import '../tasks/Tasks.css';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const res = await reportAPI.getAll();
      setReports(res.data.data.reports);
    } catch (err) { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const handleGenerate = async (type) => {
    setGenerating(true);
    try {
      await reportAPI.generate({ type });
      toast.success(`${type} report generated!`);
      fetchReports();
    } catch (err) { toast.error('Report generation failed'); }
    finally { setGenerating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await reportAPI.delete(id);
      toast.success('Report deleted');
      fetchReports();
    } catch (err) { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Generated reports and analytics summaries</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => handleGenerate('daily')} disabled={generating}>
            <FiPlus /> Daily
          </button>
          <button className="btn btn-primary" onClick={() => handleGenerate('weekly')} disabled={generating}>
            <FiPlus /> Weekly
          </button>
          <button className="btn btn-primary" onClick={() => handleGenerate('monthly')} disabled={generating}>
            <FiPlus /> Monthly
          </button>
        </div>
      </div>

      <div className="task-list">
        {reports.length === 0 ? (
          <div className="empty-state">
            <FiFileText className="empty-icon" />
            <h3>No reports generated yet</h3>
            <p>Click the buttons above to generate reports.</p>
          </div>
        ) : (
          reports.map((r) => (
            <div key={r._id} className="task-card">
              <div className="task-card-header">
                <h3 className="task-card-title">{r.title}</h3>
                <div className="task-card-actions">
                  <StatusBadge status={r.type} />
                  {isAdmin && (
                    <button className="icon-btn danger" onClick={() => handleDelete(r._id)}><FiTrash2 /></button>
                  )}
                </div>
              </div>
              <div className="task-card-meta">
                <div className="meta-item"><FiCalendar /> {new Date(r.createdAt).toLocaleDateString()}</div>
                <span className="meta-date">Department: {r.department}</span>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12, marginTop: 12,
              }}>
                <div className="report-metric">
                  <span className="rm-label">Total Tasks</span>
                  <span className="rm-value">{r.data?.totalTasks ?? 0}</span>
                </div>
                <div className="report-metric">
                  <span className="rm-label">Completed</span>
                  <span className="rm-value" style={{ color: '#10b981' }}>{r.data?.completedTasks ?? 0}</span>
                </div>
                <div className="report-metric">
                  <span className="rm-label">Overdue</span>
                  <span className="rm-value" style={{ color: '#ef4444' }}>{r.data?.overdueTasks ?? 0}</span>
                </div>
                <div className="report-metric">
                  <span className="rm-label">Avg Score</span>
                  <span className="rm-value" style={{ color: '#6366f1' }}>{r.data?.averageScore ?? 0}</span>
                </div>
                <div className="report-metric">
                  <span className="rm-label">Hours Logged</span>
                  <span className="rm-value">{r.data?.totalHoursLogged ?? 0}</span>
                </div>
                <div className="report-metric">
                  <span className="rm-label">Alerts</span>
                  <span className="rm-value" style={{ color: '#f59e0b' }}>{r.data?.alerts ?? 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
