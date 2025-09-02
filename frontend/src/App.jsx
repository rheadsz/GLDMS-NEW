import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import SignInBox from "./components/SignInBox";
import RequestMenu from "./components/RequestMenu";
import TabsDashboard from "./components/TabsDashboard";
import DummyTab from "./components/DummyTab";
import RaiseRequestForm from "./components/RaiseRequestForm";
import SupervisorMenu from "./components/SupervisorMenu";
import ManageRequests from "./components/MangageResquestSupervisor";
import CreateProjectWizard from "./components/CreateProjectWizard";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectsTable from "./components/ProjectsTable";

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
      <p>Manage projects and related data.</p>
      <div className="mt-3">
        <a href="/projects" className="btn btn-primary">View Projects</a>
      </div>
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

function AppRoutes({ signedIn, setSignedIn, userRole, setUserRole, userName, setUserName, userEmail, setUserEmail, userPhone, setUserPhone }) {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  // Simulate login with role selection (replace with real login logic)
  const handleSignIn = (role = "staff", name = "", email = "", phone = "") => {
    setSignedIn(true);
    setUserRole(role);
    setUserName(name);
    setUserEmail(email);
    setUserPhone(phone);
    // Persist to localStorage
    localStorage.setItem('signedIn', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userPhone', phone);
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
        <Route
        path="/manage-requests"
        element={
          <div className="min-vh-100 bg-light">
            <Header
              showSignOut={true}
              onSignOut={() => {
                setSignedIn(false);
                setUserRole(null);
                navigate("/");
              }}
            />
            <ManageRequests />
          </div>
        }
      />

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
          <div className="container py-4">
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="m-0">Projects</h4>
                </div>
                <div className="card shadow">
                  <div className="card-body p-0">
                    <ProjectsTable />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      } />
      <Route path="/projects" element={
        <div className="min-vh-100 bg-light">
          <Header showSignOut={true} onSignOut={() => { setSignedIn(false); setUserRole(null); navigate("/"); }} />
          <ProjectsPage />
        </div>
      } />
      <Route path="/create-project" element={
        <div className="min-vh-100 bg-light">
          <Header showSignOut={true} onSignOut={() => { setSignedIn(false); setUserRole(null); navigate("/"); }} />
          <CreateProjectWizard
            userName={userName}
            userEmail={userEmail}
            userPhone={userPhone}
            supervisors={[]} // TODO: fetch and pass supervisors as in RaiseRequestForm
            officeOptions={["Central Office", "North Branch", "South Branch"]}
            branchOptions={["Branch A", "Branch B", "Branch C"]}
            districtOptions={["District 1", "District 2", "District 3"]}
            countyOptions={["County A", "County B", "County C"]}
            testTypes={[
              { id: 1, name: "Moisture Content", methods: ["ASTM D2216"] },
              { id: 2, name: "Unit Weight", methods: ["ASTM D7263-B"] },
              { id: 3, name: "Particle Size Analysis", methods: ["ASTM D422", "ASTM D6913"] },
              { id: 4, name: "Plasticity Index", methods: ["ASTM D4318"] },
              { id: 5, name: "Specific Gravity", methods: ["ASTM D854", "AASHTO T100"] },
              { id: 6, name: "Compaction", methods: ["CTM 216", "ASTM D1557"] },
              { id: 7, name: "Consolidation", methods: ["ASTM D2435"] },
              { id: 8, name: "Direct Shear", methods: ["ASTM D3080"] },
              { id: 9, name: "Triaxial (CU)", methods: ["ASTM D4767"] },
              { id: 10, name: "Triaxial (UU)", methods: ["ASTM D2850"] },
              { id: 11, name: "Unconfined Compression (Soil) (qu)", methods: ["ASTM D2166"] },
              { id: 12, name: "Point Load Index", methods: ["ASTM D5731"] },
              { id: 13, name: "Unconfined Compression (Rock)", methods: ["ASTM D7012-C"] },
              { id: 14, name: "Hydraulic Conductivity", methods: ["ASTM D5084"] },
              { id: 15, name: "Corrosion", methods: ["CTM 643", "CTM 417", "CTM 422"] }
            ]}
          />
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
  // Initialize state from localStorage
  const [signedIn, setSignedIn] = useState(localStorage.getItem('signedIn') === 'true');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || "");
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || "");
  const [userPhone, setUserPhone] = useState(localStorage.getItem('userPhone') || "");

  // Keep localStorage in sync if state changes (optional, for robustness)
  useEffect(() => {
    localStorage.setItem('signedIn', signedIn ? 'true' : 'false');
    if (userRole) localStorage.setItem('userRole', userRole);
    if (userName) localStorage.setItem('userName', userName);
    if (userEmail) localStorage.setItem('userEmail', userEmail);
    if (userPhone) localStorage.setItem('userPhone', userPhone);
  }, [signedIn, userRole, userName, userEmail, userPhone]);

  return (
    <Router>
      <AppRoutes
        signedIn={signedIn}
        setSignedIn={setSignedIn}
        userRole={userRole}
        setUserRole={setUserRole}
        userName={userName}
        setUserName={setUserName}
        userEmail={userEmail}
        setUserEmail={setUserEmail}
        userPhone={userPhone}
        setUserPhone={setUserPhone}
      />
    </Router>
  );
}

export default App;
