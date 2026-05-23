function SummaryCard({ label, value }) {
  return (
    <div className="card metric-card">
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );
}

export default SummaryCard;
