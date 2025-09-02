import React, { useState, useEffect } from "react";
import RequesterInfo from "./RequesterInfo";
import ProjectInfo from "./ProjectInfo";
import ChargingCode from "./ChargingCode";
import SampleInfo from "./SampleInfo";
import TestsInfo from "./TestsInfo";
import CommentsSection from "./CommentsSection";

const sections = [
  { label: "Project Information" },
  { label: "Sample Information" },
  { label: "Tests" },
];

function CreateProjectWizard({ userName, userEmail, userPhone, supervisors = [], officeOptions = [], branchOptions = [], districtOptions = [], countyOptions = [], testTypes = [] }) {
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState({
    RequesterInfo: {
      requesterName: userName || "",
      requesterEmail: userEmail || "",
      requesterPhone: userPhone || "",
      officeOptions,
      branchOptions,
      supervisorName: "",
      supervisorEmail: "",
      supervisorPhone: "",
      testResultsDueDate: ""
    },
    ProjectInfo: { districtOptions, countyOptions },
    ChargingCode: {},
    SampleInfoSets: [{}],  // Array of sample info sets, each containing 3 samples
    TestsInfo: {},
    Comments: {}
  });
  const [comments, setComments] = useState("");

  // Keep requester info in sync with logged-in user
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      RequesterInfo: {
        ...prev.RequesterInfo,
        requesterName: userName || "",
        requesterEmail: userEmail || "",
        requesterPhone: userPhone || ""
      }
    }));
  }, [userName, userEmail, userPhone]);

  const handleSectionChange = (idx) => setActiveSection(idx);
  const handleSectionDataChange = (section, data) => {
    setFormData(prev => ({ ...prev, [section]: data }));
  };

  const handleAddSample = () => {
    setFormData(prev => {
      // Add a new empty SampleInfo set to the array
      return {
        ...prev,
        SampleInfoSets: [...prev.SampleInfoSets, {}]
      };
    });
  };

  const handleDeleteSample = (index) => {
    setFormData(prev => {
      // Create a copy of the sample sets array and remove the specified index
      const updatedSets = [...prev.SampleInfoSets];
      updatedSets.splice(index, 1);
      return {
        ...prev,
        SampleInfoSets: updatedSets
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // You can handle the full form submission here
    alert("Form submitted!\n" + JSON.stringify({ ...formData, comments }, null, 2));
  };

  return (
    <div className="container py-4">
      <div className="d-flex gap-2 mb-4 justify-content-center">
        {sections.map((s, idx) => (
          <button
            key={s.label}
            className={`btn btn-outline-primary${activeSection === idx ? " active" : ""}`}
            onClick={() => handleSectionChange(idx)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="card shadow p-4">
        {activeSection === 0 && (
          <>
            <ProjectInfo
              data={formData.ProjectInfo}
              onChange={data => handleSectionDataChange("ProjectInfo", data)}
            />
          </>
        )}
        {activeSection === 1 && (
          <>
            <RequesterInfo
              data={formData.RequesterInfo}
              onChange={data => handleSectionDataChange("RequesterInfo", data)}
              supervisors={supervisors}
            />
            {formData.SampleInfoSets.map((sampleInfoSet, index) => (
              <SampleInfo
                key={index}
                data={sampleInfoSet}
                onChange={data => {
                  const updatedSets = [...formData.SampleInfoSets];
                  updatedSets[index] = data;
                  handleSectionDataChange("SampleInfoSets", updatedSets);
                }}
                onAddSample={handleAddSample}
                onDeleteSample={handleDeleteSample}
                index={index}
              />
            ))}
          </>
        )}
        {activeSection === 2 && (
          <form onSubmit={handleSubmit}>
            <RequesterInfo
              data={formData.RequesterInfo}
              onChange={data => handleSectionDataChange("RequesterInfo", data)}
              supervisors={supervisors}
            />
            <ChargingCode
              data={formData.ChargingCode}
              onChange={data => handleSectionDataChange("ChargingCode", data)}
            />
            <TestsInfo
              data={formData.TestsInfo}
              onChange={data => handleSectionDataChange("TestsInfo", data)}
              testTypes={testTypes}
              numSamples={formData.SampleInfoSets.reduce((total, set) => total + 3, 0)} // Each set has 3 fixed samples
            />
            <CommentsSection
              data={{ comments }}
              onChange={d => setComments(d.comments)}
            />
            <button type="submit" className="btn btn-success">Submit</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateProjectWizard; 