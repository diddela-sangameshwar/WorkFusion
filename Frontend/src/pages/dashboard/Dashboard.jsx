import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { analyticsAPI, taskAPI, scoringAPI } from '../../api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  FiCheckSquare, FiClock, FiAlertTriangle, FiTrendingUp,
  FiUsers, FiActivity, FiAward, FiTarget
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from 'recharts';
import './Dashboard.css';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

const Dashboard = () => {
  const { user, isEmployee, isManagement } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [taskDist, setTaskDist] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [scoring, setScoring] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, distRes, trendRes, taskRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getTaskDistribution(),
          analyticsAPI.getProductivityTrends({ period: '30' }),
          taskAPI.getAll({ limit: 5 }),
        ]);

        setStats(dashRes.data.data);
        setTaskDist(distRes.data.data);
        setTrends(trendRes.data.data.trends);
        setRecentTasks(taskRes.data.data.tasks);

        if (isEmployee) {
          try {
            const scoreRes = await scoringAPI.getScore(user._id);
            setScoring(scoreRes.data.data);
          } catch (e) { /* no score yet */ }
        }

        if (isManagement) {
          const dRes = await analyticsAPI.getDepartmentStats();
          setDeptStats(dRes.data.data.departments);
        }
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Real-time: refresh dashboard on socket events
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      analyticsAPI.getDashboard().then(r => setStats(r.data.data)).catch(() => {});
      taskAPI.getAll({ limit: 5 }).then(r => setRecentTasks(r.data.data.tasks)).catch(() => {});
    };
    socket.on('task:statusChanged', refresh);
    socket.on('progress:logged', refresh);
    socket.on('score:updated', refresh);
    return () => {
      socket.off('task:statusChanged', refresh);
      socket.off('progress:logged', refresh);
      socket.off('score:updated', refresh);
    };
  }, [socket]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const pieData = taskDist?.statusDistribution?.map((d) => ({
    name: d._id === 'in-progress' ? 'In Progress' : d._id?.charAt(0).toUpperCase() + d._id?.slice(1),
    value: d.count,
  })) || [];

  const trendData = trends.map((t) => ({
    date: t._id?.slice(5),
    hours: Math.round(t.totalHours * 10) / 10,
    completion: Math.round(t.avgCompletion),
  }));

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>{isEmployee ? 'Your productivity overview' : 'Organization-wide insights'}</p>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          icon={<FiCheckSquare />}
          color="#6366f1"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats?.completionRate || 0}%`}
          icon={<FiTarget />}
          color="#10b981"
          trend={stats?.completionRate > 60 ? 'up' : 'down'}
          trendValue={`${stats?.completionRate || 0}%`}
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueTasks || 0}
          icon={<FiAlertTriangle />}
          color="#ef4444"
          trend={stats?.overdueTasks > 0 ? 'down' : 'up'}
          trendValue={stats?.overdueTasks || 0}
        />
        <StatCard
          title={isEmployee ? 'My Score' : 'Avg. Score'}
          value={stats?.avgScore || 0}
          icon={<FiAward />}
          color="#f59e0b"
          subtitle="out of 100"
        />
        {isManagement && (
          <>
            <StatCard
              title="Active Employees"
              value={stats?.totalEmployees || 0}
              icon={<FiUsers />}
              color="#8b5cf6"
            />
            <StatCard
              title="Active Alerts"
              value={stats?.activeAlerts || 0}
              icon={<FiActivity />}
              color="#ec4899"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Productivity Trends */}
        <div className="chart-card wide">
          <h3 className="chart-title">Productivity Trends (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gradHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,20,40,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Area type="monotone" dataKey="hours" stroke="#6366f1" fill="url(#gradHours)" name="Hours" />
              <Line type="monotone" dataKey="completion" stroke="#10b981" name="Completion %" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task Distribution */}
        <div className="chart-card">
          <h3 className="chart-title">Task Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,20,40,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Stats (Management only) */}
      {isManagement && deptStats.length > 0 && (
        <div className="chart-card full-width">
          <h3 className="chart-title">Department Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="department" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,20,40,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="avgScore" fill="#6366f1" radius={[6, 6, 0, 0]} name="Avg Score" />
              <Bar dataKey="completionRate" fill="#10b981" radius={[6, 6, 0, 0]} name="Completion %" />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Scoring Breakdown (Employee only) */}
      {isEmployee && scoring && (
        <div className="chart-card full-width">
          <h3 className="chart-title">My Productivity Score Breakdown</h3>
          <div className="score-breakdown">
            {Object.entries(scoring.breakdown).map(([key, val]) => (
              <div key={key} className="score-item">
                <div className="score-item-header">
                  <span className="score-item-label">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="score-item-value">{val.score}/
                    {key === 'taskCompletion' ? 40 : key === 'onTimeDelivery' ? 30 : key === 'quality' ? 20 : 10}
                  </span>
                </div>
                <div className="score-bar-bg">
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${val.rate || val.factor || 0}%`,
                      background: val.rate > 70 || val.factor > 70 ? '#10b981' :
                                  val.rate > 40 || val.factor > 40 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="total-score">
              <span>Total Score</span>
              <span className="total-score-value">{scoring.score}/100</span>
            </div>
            <div className="score-trend">
              Trend: <span className={`trend-label ${scoring.trend}`}>{scoring.trend}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="chart-card full-width">
        <h3 className="chart-title">Recent Tasks</h3>
        <div className="recent-tasks-list">
          {recentTasks.map((task) => (
            <div key={task._id} className="recent-task-item">
              <div className="task-info">
                <h4>{task.title}</h4>
                <p>
                  {task.assignedTo?.name} • Due: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="task-meta">
                <StatusBadge status={task.priority} />
                <StatusBadge status={task.status} />
                <div className="task-progress-bar">
                  <div
                    className="task-progress-fill"
                    style={{ width: `${task.completionPercentage}%` }}
                  />
                  <span>{task.completionPercentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
