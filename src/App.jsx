import { NavLink, Route, Routes } from "react-router-dom";
import BlogManagerPage from "./pages/BlogManagerPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Fundora Admin</h1>
        <nav>
          <NavLink to="/" end>
            Blog Manager
          </NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<BlogManagerPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
