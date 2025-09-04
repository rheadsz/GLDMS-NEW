import React, { useState } from "react";
import SamplesTab from "./SamplesTab";
import ProjectInfoTab from "./ProjectInfoTab";
import RequesterInfoTab from "./RequesterInfoTab";
import ChargingCodeTab from "./ChargingCodeTab";

function LabManagerTab({ selectedRequest }) {
  const [activeTab, setActiveTab] = useState("samples");

  const renderTabContent = () => {
    switch (activeTab) {
      case "samples":
        return <SamplesTab selectedRequest={selectedRequest} />;
      case "project":
        return <ProjectInfoTab selectedRequest={selectedRequest} />;
      case "requester":
        return <RequesterInfoTab selectedRequest={selectedRequest} />;
      case "charging":
        return <ChargingCodeTab selectedRequest={selectedRequest} />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "samples" ? "active" : ""}`}
            onClick={() => setActiveTab("samples")}
          >
            Samples/Tests/Tester
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "project" ? "active" : ""}`}
            onClick={() => setActiveTab("project")}
          >
            Project Info
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "requester" ? "active" : ""}`}
            onClick={() => setActiveTab("requester")}
          >
            Requester Info
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "charging" ? "active" : ""}`}
            onClick={() => setActiveTab("charging")}
          >
            Charging Code
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
}

export default LabManagerTab;
