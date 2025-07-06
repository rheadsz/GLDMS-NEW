import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import SignInBox from "./components/SignInBox";
import RequestMenu from "./components/RequestMenu";
import TabsDashboard from "./components/TabsDashboard";
import DummyTab from "./components/DummyTab";
import RaiseRequestForm from "./components/RaiseRequestForm";
import SupervisorMenu from "./components/SupervisorMenu";

function SupervisorDashboard() {
  return (
    <div className="container py-4">
      <div className="card shadow p-4 mb-4">
        <h3>Supervisor Dashboard</h3>
        <p>This is a placeholder for supervisor-specific features (e.g., request tickets, approvals).</p>
      </div>
    </div>
  );
}

function TestManagement() {
  return (
    <div>
      <h2 className="h2 mb-3">Test Management</h2>
      <p>View and manage test results. This tab will contain test data management functionality.</p>
    </div>
  );
}
function ProjectManagement() {
  return (
    <div>
      <h2 className="h2 mb-3">Project Management</h2>
      <p>Manage projects and related data. This tab will contain project management functionality.</p>
    </div>
  );
}
function ProductionManagement() {
  return (
    <div>
      <h2 className="h2 mb-3">Production Management</h2>
      <p>Oversee production workflows. This tab will contain production management functionality.</p>
    </div>
  );
}
function DBManagement() {
  return (
    <div>
      <h2 className="h2 mb-3">DB Management</h2>
      <p>Database administration tools. This tab will contain DB management functionality.</p>
    </div>
  );
}

const tabs = [
  { label: "Test Management", content: <TestManagement />, icon: "bi bi-clipboard-data" },
  { label: "Project Management", content: <ProjectManagement />, icon: "bi bi-folder2-open" },
  { label: "Production Management", content: <ProductionManagement />, icon: "bi bi-bar-chart" },
  { label: "DB Management", content: <DBManagement />, icon: "bi bi-table" },
  { label: "Dummy Tab", content: <DummyTab /> },
];

function AppRoutes({ signedIn, setSignedIn, userRole, setUserRole }) {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  // Simulate login with role selection (replace with real login logic)
  const handleSignIn = (role = "staff") => {
    setSignedIn(true);
    setUserRole(role);
    if (role === "supervisor") {
      navigate("/supervisor");
    } else {
      navigate("/menu");
    }
  };

  if (!signedIn) {
    return (
      <Routes>
        <Route path="/*" element={
          <div className="min-vh-100 bg-light">
            <Header showSignOut={false} />
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 72px)' }}>
              <SignInBox onSignIn={handleSignIn} />
            </div>
          </div>
        } />
      </Routes>
    );
  }

  // Supervisor view
  if (userRole === "supervisor") {
    return (
      <Routes>
        <Route path="/supervisor" element={
          <div className="min-vh-100 bg-light">
            <Header showSignOut={true} onSignOut={() => { setSignedIn(false); setUserRole(null); navigate("/"); }} />
            <SupervisorMenu />
          </div>
        } />
        <Route path="/*" element={<Navigate to="/supervisor" />} />
      </Routes>
    );
  }

  // Staff view
  return (
    <Routes>
      <Route path="/menu" element={
        <div className="min-vh-100 bg-light">
          <Header showSignOut={true} onSignOut={() => { setSignedIn(false); setUserRole(null); navigate("/"); }} />
          <RequestMenu onMain={() => navigate("/main")} onRaiseRequest={() => navigate("/raise-request")} />
        </div>
      } />
      <Route path="/raise-request" element={
        <div className="min-vh-100 bg-light">
          <Header showSignOut={true} onSignOut={() => { setSignedIn(false); setUserRole(null); navigate("/"); }} />
          <RaiseRequestForm />
        </div>
      } />
      <Route path="/main" element={
        <div className="min-vh-100 bg-light text-dark">
          <Header showSignOut={true} onSignOut={() => { setSignedIn(false); setUserRole(null); navigate("/"); }} />
          <TabsDashboard tab={tab} setTab={setTab} tabs={tabs} />
        </div>
      } />
      <Route path="/*" element={<Navigate to="/menu" />} />
    </Routes>
  );
}

function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'staff' or 'supervisor'
  return (
    <Router>
      <AppRoutes signedIn={signedIn} setSignedIn={setSignedIn} userRole={userRole} setUserRole={setUserRole} />
    </Router>
  );
}

export default App;
