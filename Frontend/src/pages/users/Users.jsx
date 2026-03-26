import { useState, useEffect } from 'react';
import { userAPI } from '../../api';
import StatusBadge from '../../components/common/StatusBadge';
import { FiSearch, FiTrash2, FiMail, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import '../tasks/Tasks.css';

const Users = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = { limit: 100 };
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await userAPI.getAll(params);
      setUsers(res.data.data.users);
    } catch (err) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await userAPI.delete(id);
      toast.success('User deactivated');
      fetchUsers();
    } catch (err) { toast.error('Failed to deactivate'); }
  };

  const roleColors = { admin: '#ef4444', hr: '#8b5cf6', employee: '#3b82f6' };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>{users.length} users in the system</p>
        </div>
      </div>

      <div className="filters-bar">
        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="search-form">
          <FiSearch className="search-icon" />
          <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="employee">Employee</option>
          <option value="hr">HR</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="task-list">
        {users.map((u) => (
          <div key={u._id} className="task-card">
            <div className="task-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', background: roleColors[u.role] || '#6366f1',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700
                }}>
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h3 className="task-card-title">{u.name}</h3>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.designation || u.department}</span>
                </div>
              </div>
              <div className="task-card-actions">
                <span style={{
                  padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: `${roleColors[u.role]}20`, color: roleColors[u.role],
                  textTransform: 'uppercase',
                }}>
                  {u.role}
                </span>
                {isAdmin && u.role !== 'admin' && (
                  <button className="icon-btn danger" onClick={() => handleDeactivate(u._id)}><FiTrash2 /></button>
                )}
              </div>
            </div>
            <div className="task-card-meta">
              <div className="meta-item"><FiMail /> {u.email}</div>
              {u.phone && <div className="meta-item"><FiPhone /> {u.phone}</div>}
              <span className="meta-date">Joined: {new Date(u.joinDate || u.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="task-card-progress">
              <div className="progress-info">
                <span>Productivity Score</span>
                <span>{u.productivityScore}/100</span>
              </div>
              <div className="prog-bar-bg">
                <div className="prog-bar-fill" style={{
                  width: `${u.productivityScore}%`,
                  background: u.productivityScore > 70 ? '#10b981' : u.productivityScore > 40 ? '#f59e0b' : '#ef4444',
                }} />
              </div>
              <span style={{
                display: 'inline-block', marginTop: 6,
                padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: u.isActive ? '#d1fae5' : '#fee2e2',
                color: u.isActive ? '#059669' : '#dc2626',
              }}>
                {u.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
