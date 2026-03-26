import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taskAPI, userAPI } from '../../api';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/common/StatusBadge';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiMessageSquare, FiCheckSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Tasks.css';

const Tasks = () => {
  const { user, isManagement, isAdmin } = useAuth();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', assignedTo: '', priority: 'medium',
    dueDate: '', estimatedHours: '', category: 'General',
  });

  useEffect(() => {
    fetchTasks();
    if (isManagement) {
      userAPI.getAll({ role: 'employee', limit: 100 }).then(res => setUsers(res.data.data.users));
    }
  }, [filter.status, filter.priority]);

  // Real-time: refresh tasks on socket events
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchTasks();
    socket.on('task:created', refresh);
    socket.on('task:updated', refresh);
    socket.on('task:statusChanged', refresh);
    return () => {
      socket.off('task:created', refresh);
      socket.off('task:updated', refresh);
      socket.off('task:statusChanged', refresh);
    };
  }, [socket]);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.search) params.search = filter.search;
      const res = await taskAPI.getAll(params);
      setTasks(res.data.data.tasks);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (editTask) {
        await taskAPI.update(editTask._id, form);
        toast.success('Task updated!');
      } else {
        await taskAPI.create(form);
        toast.success('Task created!');
      }
      setShowModal(false);
      setEditTask(null);
      setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', estimatedHours: '', category: 'General' });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      toast.success('Status updated!');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(taskId);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority,
      dueDate: task.dueDate?.split('T')[0],
      estimatedHours: task.estimatedHours,
      category: task.category || 'General',
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Manage and track all assigned tasks</p>
        </div>
        {isManagement && (
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', estimatedHours: '', category: 'General' }); setShowModal(true); }}>
            <FiPlus /> Create Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </form>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
        <select value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Task List */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <FiCheckSquare className="empty-icon" />
            <h3>No tasks found</h3>
            <p>Tasks will appear here once created.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className="task-card">
              <div className="task-card-header">
                <h3 className="task-card-title">{task.title}</h3>
                <div className="task-card-actions">
                  {(isManagement || task.assignedTo?._id === user._id) && (
                    <select
                      className="status-select"
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  )}
                  {isManagement && (
                    <button className="icon-btn" onClick={() => openEdit(task)}><FiEdit2 /></button>
                  )}
                  {isAdmin && (
                    <button className="icon-btn danger" onClick={() => handleDelete(task._id)}><FiTrash2 /></button>
                  )}
                </div>
              </div>
              <p className="task-card-desc">{task.description}</p>
              <div className="task-card-meta">
                <div className="meta-item person">
                  <span className="meta-avatar">{task.assignedTo?.name?.charAt(0)}</span>
                  {task.assignedTo?.name}
                </div>
                <StatusBadge status={task.priority} />
                <StatusBadge status={task.status} />
                <span className="meta-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="task-card-progress">
                <div className="progress-info">
                  <span>Progress</span>
                  <span>{task.completionPercentage}%</span>
                </div>
                <div className="prog-bar-bg">
                  <div className="prog-bar-fill" style={{ width: `${task.completionPercentage}%` }} />
                </div>
                <div className="task-hours">
                  Est: {task.estimatedHours}h | Actual: {task.actualHours}h
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editTask ? 'Edit Task' : 'Create New Task'}</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-group">
                <label>Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign To</label>
                  <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} required>
                    <option value="">Select Employee</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.name} ({u.department})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Estimated Hours</label>
                  <input type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTask ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
