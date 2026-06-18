import StatusBadge from './StatusBadge.jsx';

export default function EmployeeCard({ employee }) {
  return (
    <article className="card employee-card">
      <div>
        <h3>{employee.name}</h3>
        <p className="muted small">{employee.department || 'No department'}</p>
      </div>
      <StatusBadge status={employee.current_status} />
      <p className="muted small">
        Last check: {employee.last_checked_at ? new Date(employee.last_checked_at).toLocaleTimeString() : 'Never'}
      </p>
    </article>
  );
}
