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

const ALLOWED_TEST_NAMES = [
  "Moisture Content",
  "Unit Weight",
  "Specific Gravity",
  "Particle Size Analysis",
  "Plasticity Index",
  "No. 200 Sieve Wash",
  "Particle Size Distribution - Sieve Analysis",
  "Particle Size Distribution - Hydrometer",
  "Consolidation",
  "Direct Shear",
  "Triaxial - CUe",
  "Triaxial - UU",
  "Unconfined Compression – Soil",
  "Unconfined Compression – Rock",
  "Point Load",
  "Permeability/Hydraulic Conductivity",
  "Swell/Collapse Potential",
  "Expansion Index",
  "Compaction Curve",
  "Sand Equivalent",
  "Corrosion"
];

const normalizeTestType = (entry) => {
  if (!entry) return null;
  const name = (entry.TestName || entry.name || entry.label || "").trim();
  if (!name) return null;
  return {
    id: entry.TestTypeID ?? entry.id ?? name,
    name,
    method: entry.Method || entry.method || (Array.isArray(entry.methods) ? entry.methods.join(", ") : entry.methods) || ""
  };
};

function CreateProjectWizard({ userName, userEmail, userPhone, supervisors = [], officeOptions = [], branchOptions = [], districtOptions = [], countyOptions = [], testTypes = [] }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);
  
  // Initialize formData from localStorage if available
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('projectWizardDraft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Merge with default structure to ensure all fields exist
        return {
          RequesterInfo: {
            requesterName: userName || "",
            requesterEmail: userEmail || "",
            requesterPhone: userPhone || "",
            officeOptions,
            branchOptions,
            ...parsed.RequesterInfo
          },
          ProjectInfo: { districtOptions, countyOptions, ...parsed.ProjectInfo },
          Boreholes: parsed.Boreholes || { structures: [] },
          ChargingCode: parsed.ChargingCode || {},
          SampleInfoSets: parsed.SampleInfoSets || [{}],
          TestsInfo: parsed.TestsInfo || {},
          Comments: parsed.Comments || {}
        };
      } catch (e) {
        console.error('Error loading draft from localStorage:', e);
      }
    }
    // Default initial state
    return {
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
      SampleInfoSets: [{}],
      TestsInfo: {},
      Comments: {}
    };
  });
  
  const [comments, setComments] = useState("");
  const [testTypeOptions, setTestTypeOptions] = useState(ALLOWED_TEST_NAMES);
  const derivedChargingProjectId = formData.TestsInfo?.chargingProjectID ??
    formData.ProjectInfo?.projectID ??
    formData.ProjectInfo?.efisProjectId ??
    "";
  
  // Save formData to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('projectWizardDraft', JSON.stringify(formData));
  }, [formData]);

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

  useEffect(() => {
    const fetchTestTypes = async () => {
      try {
        const { data } = await axios.get("/api/test-types");
        const normalized = (data || [])
          .map(normalizeTestType)
          .filter(Boolean);

        const names = new Set(normalized.map(({ name }) => name));
        const filtered = ALLOWED_TEST_NAMES.filter(name => names.has(name));

        if (filtered.length === ALLOWED_TEST_NAMES.length) {
          setTestTypeOptions(filtered);
        } else {
          const missing = ALLOWED_TEST_NAMES.filter(name => !names.has(name));
          if (missing.length) {
            console.warn("Some allowed tests are not in the backend list:", missing);
          }
          setTestTypeOptions(ALLOWED_TEST_NAMES);
        }
      } catch (err) {
        console.error("Failed to load test types", err);
      }
    };

    fetchTestTypes();
  }, []);

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

  const handleChargingCodeCommentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      TestsInfo: {
        ...prev.TestsInfo,
        chargingCodeComment: value
      }
    }));
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
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Convert testAssignments to testRows format for backend
      const testRows = [];
      const testAssignments = formData.TestsInfo?.testAssignments || {};
      const samples = formData.SampleInfoSets?.flatMap(set => set.samples || []) || [];
      const boreholes = formData.Boreholes?.boreholes || [];
      const structures = formData.ProjectInfo?.structures || [];
      
      Object.entries(testAssignments).forEach(([sampleId, tests]) => {
        if (tests && tests.length > 0) {
          // Find the sample to get its details
          const sample = samples.find(s => s.id === sampleId);
          if (sample) {
            // Find the borehole for this sample
            const borehole = boreholes.find(b => b.boreholeId === sample.boreholeId);
            if (borehole) {
              // Find the structure for this borehole
              const structure = structures.find(s => s.id === borehole.structureId);
              
              testRows.push({
                id: sampleId,
                structure: structure?.id || '',
                // Use borehole NUMBER instead of ID for backend lookup
                boreholeSample: `${borehole.boreholeNumber || borehole.boreholeId} - ${sample.depthFrom}-${sample.depthTo}`,
                tests: tests
              });
            }
          }
        }
      });
      
      // Create a copy of the form data with properly structured boreholes and tests
      const submitData = {
        ...formData,
        // Ensure boreholes are passed correctly
        Boreholes: formData.Boreholes || {},
        // Convert testAssignments to testRows for backend compatibility
        TestsInfo: {
          ...formData.TestsInfo,
          testRows: testRows
        },
        // Add charging code info from the Tests tab textarea
        chargingCodeComment: formData.TestsInfo?.chargingCodeComment || "",
        chargingProjectID: derivedChargingProjectId,
        // Add the userName to be stored as CreatedBy
        userName: userName
      };

      console.log('About to submit data:', submitData);
      
      // Submit form data to backend
      const response = await axios.post('/api/projects/wizard', submitData);
      console.log('Form submitted successfully', response.data);
      setSubmitSuccess(true);
      
      // Clear the draft from localStorage after successful submission
      localStorage.removeItem('projectWizardDraft');
      
      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        'An error occurred while submitting your request.'
      );
      alert(`Error: ${error.response?.data?.message || 'Failed to submit project'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Left Sidebar Navigation */}
        <div className="col-md-3 col-lg-2">
          <div className="card shadow-sm position-sticky" style={{ top: '110px' }}>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {sections.map((s, idx) => (
                  <button
                    key={s.label}
                    className={`list-group-item list-group-item-action border-0 ${activeSection === idx ? "active" : ""}`}
                    onClick={() => handleSectionChange(idx)}
                  >
                    <i className={`bi ${
                      idx === 0 ? 'bi-info-circle' :
                      idx === 1 ? 'bi-geo-alt' :
                      idx === 2 ? 'bi-box' :
                      'bi-clipboard-check'
                    } me-2`}></i>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="col-md-9 col-lg-10">
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
              data={formData} /* Pass the complete formData so Boreholes can access structures from ProjectInfo */
              onChange={data => handleSectionDataChange("Boreholes", data)}
            />
          </>
        )}
        {activeSection === 2 && (
          <>
            {formData.SampleInfoSets.map((sampleInfoSet, index) => (
              <SampleInfo
                key={index}
                data={{
                  ...sampleInfoSet,
                  // Add project data needed for email
                  projectID: formData.ProjectInfo?.projectID || formData.ProjectInfo?.efisProjectId,
                  ea: formData.ProjectInfo?.ea,
                  projectName: formData.ProjectInfo?.projectName,
                  district: formData.ProjectInfo?.district
                }}
                boreholes={formData.Boreholes?.boreholes || []}
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
                structures: formData.ProjectInfo.structures || [],
                samples: formData.SampleInfoSets.flatMap(set => set.samples || []),
                projectInfo: {
                  ...formData.ProjectInfo,
                  requesterName: formData.RequesterInfo?.requesterName || userName
                },
                boreholes: formData.Boreholes?.boreholes || [],
                chargingCodeComment: formData.TestsInfo?.chargingCodeComment || "",
                testOptions: testTypeOptions
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
            {(formData.ProjectInfo?.structures && formData.ProjectInfo.structures.length > 0) && (
              <div className="mt-4">
                <h5 className="fw-semibold mb-3">Charging Code</h5>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label htmlFor="chargingProjectID" className="form-label">Project ID</label>
                    <input
                      type="text"
                      id="chargingProjectID"
                      className="form-control"
                      placeholder="Enter Project ID"
                      value={derivedChargingProjectId}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        TestsInfo: { ...prev.TestsInfo, chargingProjectID: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="chargingUnit" className="form-label">Unit</label>
                    <input
                      type="text"
                      id="chargingUnit"
                      className="form-control"
                      placeholder="Enter Unit"
                      value={formData.TestsInfo?.chargingUnit || ""}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        TestsInfo: { ...prev.TestsInfo, chargingUnit: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="chargingReportingCode" className="form-label">Reporting Code</label>
                    <input
                      type="text"
                      id="chargingReportingCode"
                      className="form-control"
                      placeholder="Enter Reporting Code"
                      value={formData.TestsInfo?.chargingReportingCode || ""}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        TestsInfo: { ...prev.TestsInfo, chargingReportingCode: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="chargingPhase" className="form-label">Phase</label>
                    <input
                      type="text"
                      id="chargingPhase"
                      className="form-control"
                      placeholder="Enter Phase"
                      value={formData.TestsInfo?.chargingPhase || ""}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        TestsInfo: { ...prev.TestsInfo, chargingPhase: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="chargingSubObject" className="form-label">Sub Object</label>
                    <input
                      type="text"
                      id="chargingSubObject"
                      className="form-control"
                      placeholder="Enter Sub Object"
                      value={formData.TestsInfo?.chargingSubObject || ""}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        TestsInfo: { ...prev.TestsInfo, chargingSubObject: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="chargingActivity" className="form-label">Activity</label>
                    <input
                      type="text"
                      id="chargingActivity"
                      className="form-control"
                      placeholder="Enter Activity"
                      value={formData.TestsInfo?.chargingActivity || ""}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        TestsInfo: { ...prev.TestsInfo, chargingActivity: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="chargingSubActivity" className="form-label">Sub Activity</label>
                    <input
                      type="text"
                      id="chargingSubActivity"
                      className="form-control"
                      placeholder="Enter Sub Activity"
                      value={formData.TestsInfo?.chargingSubActivity || ""}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        TestsInfo: { ...prev.TestsInfo, chargingSubActivity: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}
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
      </div>
    </div>
  );
}

export default CreateProjectWizard; 