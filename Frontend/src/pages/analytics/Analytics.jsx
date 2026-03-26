import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI } from '../../api';
import StatCard from '../../components/common/StatCard';
import { FiAward, FiTarget, FiUsers, FiActivity } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import '../dashboard/Dashboard.css';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

const Analytics = () => {
  const { isEmployee } = useAuth();
  const [stats, setStats] = useState(null);
  const [dept, setDept] = useState([]);
  const [taskDist, setTaskDist] = useState(null);
  const [topPerf, setTopPerf] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dRes, depRes, tDistRes, tpRes, trRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getDepartmentStats(),
          analyticsAPI.getTaskDistribution(),
          analyticsAPI.getTopPerformers({ limit: 10 }),
          analyticsAPI.getProductivityTrends({ period: '30' }),
        ]);
        setStats(dRes.data.data);
        setDept(depRes.data.data.departments);
        setTaskDist(tDistRes.data.data);
        setTopPerf(tpRes.data.data.topPerformers);
        setTrends(trRes.data.data.trends);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const statusData = taskDist?.statusDistribution?.map(d => ({
    name: d._id === 'in-progress' ? 'In Progress' : d._id?.charAt(0).toUpperCase() + d._id?.slice(1),
    value: d.count,
  })) || [];

  const priorityData = taskDist?.priorityDistribution?.map(d => ({
    name: d._id?.charAt(0).toUpperCase() + d._id?.slice(1),
    value: d.count,
  })) || [];

  const trendData = trends.map(t => ({
    date: t._id?.slice(5),
    hours: Math.round(t.totalHours * 10) / 10,
    completion: Math.round(t.avgCompletion),
  }));

  const radarData = dept.map(d => ({
    department: d.department,
    score: d.avgScore,
    completion: d.completionRate,
    employees: d.totalEmployees * 10,
  }));

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Deep dive into productivity metrics and team performance</p>
      </div>

      <div className="stat-grid">
        <StatCard title="Total Tasks" value={stats?.totalTasks || 0} icon={<FiTarget />} color="#6366f1" />
        <StatCard title="Completion Rate" value={`${stats?.completionRate || 0}%`} icon={<FiActivity />} color="#10b981" />
        <StatCard title="Avg Score" value={stats?.avgScore || 0} icon={<FiAward />} color="#f59e0b" />
        {!isEmployee && <StatCard title="Team Size" value={stats?.totalEmployees || 0} icon={<FiUsers />} color="#8b5cf6" />}
      </div>

      <div className="charts-row">
        <div className="chart-card wide">
          <h3 className="chart-title">Productivity Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'rgba(15,20,40,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Hours" />
              <Line type="monotone" dataKey="completion" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Completion %" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value">
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(15,20,40,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3 className="chart-title">Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={(e) => e.name}>
                {priorityData.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(15,20,40,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card wide">
          <h3 className="chart-title">Department Performance Radar</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="department" stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <PolarRadiusAxis stroke="rgba(255,255,255,0.2)" />
              <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              <Radar name="Completion" dataKey="completion" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Legend />
              <Tooltip contentStyle={{ background: 'rgba(15,20,40,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      {!isEmployee && topPerf.length > 0 && (
        <div className="chart-card full-width">
          <h3 className="chart-title">🏆 Top Performers Leaderboard</h3>
          <div className="leaderboard">
            {topPerf.map((p, i) => (
              <div key={p._id} className="leader-item">
                <span className={`leader-rank rank-${i + 1}`}>{i + 1}</span>
                <div className="leader-avatar">{p.name.charAt(0)}</div>
                <div className="leader-info">
                  <span className="leader-name">{p.name}</span>
                  <span className="leader-dept">{p.department}</span>
                </div>
                <div className="leader-score">
                  <div className="leader-score-bar">
                    <div className="leader-score-fill" style={{ width: `${p.productivityScore}%` }} />
                  </div>
                  <span className="leader-score-val">{p.productivityScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
