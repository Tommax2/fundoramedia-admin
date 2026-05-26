function SummaryCard({ label, value }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
      <p className="m-0 text-sm text-muted">{label}</p>
      <h3 className="mt-2 mb-0 text-2xl font-bold">{value}</h3>
    </div>
  );
}

export default SummaryCard;
