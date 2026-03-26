import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import './StatCard.css';

const StatCard = ({ title, value, icon, color = '#3b82f6', trend, trendValue, subtitle }) => {
  const trendIcon = trend === 'up' ? <FiTrendingUp /> : trend === 'down' ? <FiTrendingDown /> : <FiMinus />;
  const trendClass = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-neutral';

  return (
    <div className="stat-card" style={{ '--card-accent': color }}>
      <div className="stat-card-header">
        <div className="stat-icon" style={{ background: `${color}15`, color }}>
          {icon}
        </div>
        {trend && (
          <div className={`stat-trend ${trendClass}`}>
            {trendIcon}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
      <div className="stat-card-accent" />
    </div>
  );
};

export default StatCard;
