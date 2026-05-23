import { useEffect, useState } from "react";
import SummaryCard from "../components/SummaryCard";
import { api } from "../services/api";

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.getAnalytics().then(setAnalytics);
  }, []);

  if (!analytics) {
    return <p>Loading analytics...</p>;
  }

  const peak = Math.max(...analytics.weeklyTraffic.map((item) => item.value), 1);

  return (
    <section>
      <h2>Site Analytics</h2>
      <p className="subtle">Live summary from backend analytics events and post performance.</p>

      <div className="metrics-grid">
        {analytics.cards.map((card) => (
          <SummaryCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      <div className="card chart-card">
        <h3>Weekly Traffic</h3>
        <div className="chart">
          {analytics.weeklyTraffic.map((item) => (
            <div key={item.day} className="bar-wrap">
              <div className="bar" style={{ height: `${Math.round((item.value / peak) * 100)}%` }} title={String(item.value)} />
              <span>{item.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Top Posts</h3>
        <ul className="top-list">
          {analytics.topPosts.map((post) => (
            <li key={post.id}>
              <strong>{post.title}</strong>
              <span>{post.views || 0} views</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default AnalyticsPage;
