import { useEffect, useState } from "react";
import SummaryCard from "../components/SummaryCard";
import { api } from "../services/api";

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.getAnalytics().then(setAnalytics).catch(console.error);
  }, []);

  if (!analytics) {
    return <p className="text-muted">Loading analytics...</p>;
  }

  const peak = Math.max(...analytics.weeklyTraffic.map((item) => item.value), 1);

  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold mt-0 mb-1">Site Analytics</h2>
      <p className="text-muted text-sm mt-0 mb-5">Live summary from backend analytics events and post performance.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {analytics.cards.map((card) => (
          <SummaryCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="mt-0 mb-4 font-semibold text-base">Weekly Traffic</h3>
        <div className="h-44 grid grid-cols-7 gap-2 items-end">
          {analytics.weeklyTraffic.map((item) => (
            <div key={item.day} className="flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-xl rounded-b-sm bar-gradient"
                style={{ height: `${Math.round((item.value / peak) * 100)}%`, minHeight: "10%" }}
                title={String(item.value)}
              />
              <span className="text-xs text-muted">{item.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
        <h3 className="mt-0 mb-3 font-semibold text-base">Top Posts</h3>
        <ul className="list-none p-0 m-0">
          {analytics.topPosts.map((post) => (
            <li
              key={post.id}
              className="flex justify-between items-center border-b border-border py-2.5 last:border-0 text-sm gap-4"
            >
              <strong className="font-medium">{post.title}</strong>
              <span className="text-muted shrink-0">{post.views || 0} views</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default AnalyticsPage;
