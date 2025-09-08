import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import RequesterInfo from "../RequesterInfo";
import ProjectInfo from "./ProjectInfo";
import Boreholes from "./Boreholes";
import ChargingCode from "../ChargingCode";
import SampleInfo from "./SampleInfo";
import TestsInfo from "./TestsInfo";
import CommentsSection from "./CommentsSection";

const sections = [
  { label: "Project Information" },
  { label: "Boreholes" },
  { label: "Samples" },
  { label: "Tests" },
];

function CreateProjectWizard({ userName, userEmail, userPhone, supervisors = [], officeOptions = [], branchOptions = [], districtOptions = [], countyOptions = [], testTypes = [] }) {
  const navigate = useNavigate();
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
    Boreholes: { structures: [] },
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
    // Check if the data contains navigation flags
    if (data._nextStep || data._prevStep) {
      // Create a clean copy of the data without navigation flags
      const { _nextStep, _prevStep, ...cleanData } = data;
      setFormData(prev => ({ ...prev, [section]: cleanData }));
      
      // Navigate to the next or previous section
      if (data._nextStep) {
        setActiveSection(prevSection => prevSection + 1);
      } else if (data._prevStep) {
        setActiveSection(prevSection => Math.max(0, prevSection - 1));
      }
    } else {
      setFormData(prev => ({ ...prev, [section]: data }));
    }
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      // Send the form data to the backend
      const response = await axios.post('/api/project-wizard/wizard', {
        ...formData,
        comments,
        userName: userName // Include the current user's name
      });
      
      console.log('Project submitted successfully:', response.data);
      setSubmitSuccess(true);
      
      // Show success message
      alert(`Project created successfully! Project ID: ${response.data.projectId}`);
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error submitting project:', error);
      setSubmitError(error.response?.data?.message || 'An error occurred while submitting the project');
      alert(`Error: ${error.response?.data?.message || 'Failed to submit project'}`);
    } finally {
      setIsSubmitting(false);
    }
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
            <Boreholes
              data={formData.Boreholes}
              onChange={data => handleSectionDataChange("Boreholes", data)}
            />
          </>
        )}
        {activeSection === 2 && (
          <>
            {formData.SampleInfoSets.map((sampleInfoSet, index) => (
              <SampleInfo
                key={index}
                data={sampleInfoSet}
                onChange={data => {
                  // Check if the data contains navigation flags
                  if (data._nextStep || data._prevStep) {
                    // Extract navigation flags
                    const { _nextStep, _prevStep, ...cleanData } = data;
                    
                    // Update the data without navigation flags
                    const updatedSets = [...formData.SampleInfoSets];
                    updatedSets[index] = cleanData;
                    setFormData(prev => ({ ...prev, SampleInfoSets: updatedSets }));
                    
                    // Handle navigation
                    if (_nextStep) {
                      setActiveSection(3); // Go to Tests tab
                    } else if (_prevStep) {
                      setActiveSection(1); // Go to Boreholes tab
                    }
                  } else {
                    // Normal data update without navigation
                    const updatedSets = [...formData.SampleInfoSets];
                    updatedSets[index] = data;
                    setFormData(prev => ({ ...prev, SampleInfoSets: updatedSets }));
                  }
                }}
                onAddSample={handleAddSample}
                onDeleteSample={handleDeleteSample}
                index={index}
              />
            ))}
          </>
        )}
        {activeSection === 3 && (
          <form onSubmit={handleSubmit}>
            <TestsInfo
              data={{
                ...formData.TestsInfo,
                structures: formData.Boreholes.structures,
                samples: formData.SampleInfoSets.flatMap(set => set.samples || [])
              }}
              onChange={data => {
                // Check if the data contains navigation flags
                if (data._nextStep || data._prevStep) {
                  // Extract navigation flags
                  const { _nextStep, _prevStep, ...cleanData } = data;
                  
                  // Update the data without navigation flags
                  setFormData(prev => ({ ...prev, TestsInfo: cleanData }));
                  
                  // Handle navigation
                  if (_prevStep) {
                    setActiveSection(2); // Go to Samples tab
                  }
                  // No _nextStep handling needed here as it's the last tab before submission
                } else {
                  // Normal data update without navigation
                  handleSectionDataChange("TestsInfo", data);
                }
              }}
            />
            <div className="d-flex justify-content-center mt-4">
              <button 
                type="submit" 
                className="btn btn-success" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : 'Submit'}
              </button>
            </div>
            {submitError && (
              <div className="alert alert-danger mt-3">{submitError}</div>
            )}
            {submitSuccess && (
              <div className="alert alert-success mt-3">Project submitted successfully!</div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateProjectWizard; 