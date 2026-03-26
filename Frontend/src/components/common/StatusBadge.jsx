const StatusBadge = ({ status, size = 'sm' }) => {
  const statusConfig = {
    pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
    'in-progress': { bg: '#dbeafe', color: '#2563eb', label: 'In Progress' },
    completed: { bg: '#d1fae5', color: '#059669', label: 'Completed' },
    overdue: { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' },
    low: { bg: '#d1fae5', color: '#059669', label: 'Low' },
    medium: { bg: '#fef3c7', color: '#d97706', label: 'Medium' },
    high: { bg: '#fed7aa', color: '#ea580c', label: 'High' },
    critical: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' },
    running: { bg: '#dbeafe', color: '#2563eb', label: 'Running' },
    failed: { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
  };

  const config = statusConfig[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };

  return (
    <span
      className={`status-badge ${size}`}
      style={{
        background: config.bg,
        color: config.color,
        padding: size === 'sm' ? '3px 10px' : '5px 14px',
        borderRadius: '20px',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 600,
        display: 'inline-block',
        lineHeight: 1.4,
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
