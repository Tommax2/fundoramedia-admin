import { NavLink, Route, Routes } from "react-router-dom";
import BlogManagerPage from "./pages/BlogManagerPage";
import AnalyticsPage from "./pages/AnalyticsPage";

const linkCls = ({ isActive }) =>
  `px-3 py-2 rounded-xl text-sm whitespace-nowrap no-underline transition-colors ${
    isActive ? "bg-sidebar-active text-white" : "text-[#d6deea] hover:bg-white/10"
  }`;

function App() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <aside className="bg-sidebar text-white sticky top-0 z-10 md:w-64 md:h-screen md:overflow-y-auto">
        <div className="flex items-center gap-4 px-4 py-3 md:flex-col md:items-start md:gap-0 md:p-6">
          <span className="font-bold whitespace-nowrap shrink-0 text-base md:text-xl md:mb-6">
            Fundora Admin
          </span>
          <nav className="flex flex-row gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0 md:flex-col md:overflow-visible md:w-full md:gap-2.5">
            <NavLink to="/" end className={linkCls}>Blog Manager</NavLink>
            <NavLink to="/analytics" className={linkCls}>Analytics</NavLink>
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-7 min-w-0">
        <Routes>
          <Route path="/" element={<BlogManagerPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
