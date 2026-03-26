import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { progressAPI, taskAPI } from '../../api';
import { FiPlus, FiClock, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import '../tasks/Tasks.css';

const Progress = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    taskId: '', hoursWorked: '', completionPercentage: '', notes: '', blockers: '', mood: 'neutral',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          progressAPI.getAll({ limit: 50 }),
          taskAPI.getAll({ status: 'in-progress', limit: 50 }),
        ]);
        setEntries(pRes.data.data.progress);
        setTasks(tRes.data.data.tasks);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await progressAPI.log({
        ...form,
        hoursWorked: parseFloat(form.hoursWorked),
        completionPercentage: parseInt(form.completionPercentage),
      });
      toast.success('Progress logged!');
      setShowModal(false);
      setForm({ taskId: '', hoursWorked: '', completionPercentage: '', notes: '', blockers: '', mood: 'neutral' });
      const res = await progressAPI.getAll({ limit: 50 });
      setEntries(res.data.data.progress);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log progress');
    }
  };

  const moodEmoji = { great: '🚀', good: '😊', neutral: '😐', struggling: '😟', blocked: '🛑' };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Progress Tracker</h1>
          <p>Log and review daily work progress</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Log Progress
        </button>
      </div>

      <div className="task-list">
        {entries.length === 0 ? (
          <div className="empty-state">
            <FiClock className="empty-icon" />
            <h3>No progress entries yet</h3>
            <p>Start logging your daily progress!</p>
          </div>
        ) : (
          entries.map((e) => (
            <div key={e._id} className="task-card">
              <div className="task-card-header">
                <h3 className="task-card-title">
                  {moodEmoji[e.mood]} {e.taskId?.title || 'Task'}
                </h3>
                <span className="meta-date">
                  <FiCalendar style={{ marginRight: 4 }} />
                  {new Date(e.date).toLocaleDateString()}
                </span>
              </div>
              <div className="task-card-meta">
                <div className="meta-item">
                  <FiClock /> {e.hoursWorked}h worked
                </div>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: e.completionPercentage >= 75 ? '#d1fae5' : e.completionPercentage >= 40 ? '#fef3c7' : '#fee2e2',
                  color: e.completionPercentage >= 75 ? '#059669' : e.completionPercentage >= 40 ? '#d97706' : '#dc2626',
                }}>
                  {e.completionPercentage}% complete
                </span>
                <span className="meta-item">{e.userId?.name}</span>
              </div>
              {e.notes && <p className="task-card-desc">{e.notes}</p>}
              {e.blockers && (
                <p className="task-card-desc" style={{ color: '#ef4444' }}>
                  ⚠️ Blocker: {e.blockers}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Log Progress</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Task</label>
                <select value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value })} required>
                  <option value="">Select a task</option>
                  {tasks.map((t) => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Hours Worked</label>
                  <input type="number" step="0.25" min="0.25" max="24" value={form.hoursWorked}
                    onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Completion %</label>
                  <input type="number" min="0" max="100" value={form.completionPercentage}
                    onChange={(e) => setForm({ ...form, completionPercentage: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Mood</label>
                <select value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })}>
                  <option value="great">🚀 Great</option>
                  <option value="good">😊 Good</option>
                  <option value="neutral">😐 Neutral</option>
                  <option value="struggling">😟 Struggling</option>
                  <option value="blocked">🛑 Blocked</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Blockers (if any)</label>
                <textarea rows={2} value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;
