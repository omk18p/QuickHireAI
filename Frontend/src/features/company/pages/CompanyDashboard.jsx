import { Outlet } from "react-router-dom";
import CompanySidebar from "../components/CompanySidebar";
import "../styles/CompanyDashboard.css";

const CompanyDashboard = () => {
  return (
    <div className="dashboard-container">
      <CompanySidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default CompanyDashboard; 