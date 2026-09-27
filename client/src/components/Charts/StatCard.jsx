// src/components/Charts/StatCard.jsx
import './StatCard.css';

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-card__value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}

export default StatCard;
