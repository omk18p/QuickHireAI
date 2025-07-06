import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Home from "../components/Home";
import Interview from "../components/Interview";
import StudentProfile from "../../interview/components/StudentProfile";
// import Practice from "../components/Practice";
// import Results from "../components/Results";
// import Profile from "../components/Profile";
import "../styles/StudentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("home");

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <Home />;
      case "interviews":
        return <Interview />;
      case "profile":
        return <StudentProfile />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        setActiveSection={setActiveSection} 
        activeSection={activeSection}
        navigate={navigate}
      />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default StudentDashboard; 