import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectDetailsModal.css';

function ProjectDetailsModal({ projectId, onClose, isPanel = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [expandedStructures, setExpandedStructures] = useState(new Set());
  const [expandedBoreholes, setExpandedBoreholes] = useState(new Set());
  const [expandedSamples, setExpandedSamples] = useState(new Set());

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching project details for ID:', projectId);
        const response = await axios.get(`/api/projects/${projectId}/details`);
        console.log('Project details response:', response.data);
        
        // Debug: Log test counts
        if (response.data.structures) {
          response.data.structures.forEach((structure, sIdx) => {
            console.log(`Structure ${sIdx + 1}: ${structure.boreholes?.length || 0} boreholes`);
            structure.boreholes?.forEach((borehole, bIdx) => {
              console.log(`  Borehole ${bIdx + 1}: ${borehole.samples?.length || 0} samples`);
              borehole.samples?.forEach((sample, sampIdx) => {
                console.log(`    Sample ${sampIdx + 1}: ${sample.tests?.length || 0} tests`, sample.tests);
              });
            });
          });
        }
        
        setProjectData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching project details:', err);
        console.error('Error response:', err.response?.data);
        setError(err.response?.data?.message || 'Failed to load project details: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const toggleStructure = (structureId) => {
    const newExpanded = new Set(expandedStructures);
    if (newExpanded.has(structureId)) {
      newExpanded.delete(structureId);
    } else {
      newExpanded.add(structureId);
    }
    setExpandedStructures(newExpanded);
  };

  const toggleBorehole = (boreholeId) => {
    const newExpanded = new Set(expandedBoreholes);
    if (newExpanded.has(boreholeId)) {
      newExpanded.delete(boreholeId);
    } else {
      newExpanded.add(boreholeId);
    }
    setExpandedBoreholes(newExpanded);
  };

  const toggleSample = (sampleId) => {
    const newExpanded = new Set(expandedSamples);
    if (newExpanded.has(sampleId)) {
      newExpanded.delete(sampleId);
    } else {
      newExpanded.add(sampleId);
    }
    setExpandedSamples(newExpanded);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'badge bg-success';
      case 'in progress':
      case 'in-progress':
        return 'badge bg-warning text-dark';
      case 'requested':
        return 'badge bg-info';
      case 'failed':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  };

  if (!projectId) return null;

  // Content to be rendered (shared between modal and panel)
  const renderContent = () => (
    <>
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading project details...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

            {!loading && !error && projectData && (
              <>
                {/* Project Information */}
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Project Information
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Project ID:</strong> {projectData.project.EfisProjectId || projectData.project.ProjectID}</p>
                        <p><strong>Project Name:</strong> {projectData.project.ProjectName || 'N/A'}</p>
                        <p><strong>EA:</strong> {projectData.project.EA || 'N/A'}</p>
                        <p><strong>District:</strong> {projectData.project.District || 'N/A'}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>County:</strong> {projectData.project.County || 'N/A'}</p>
                        <p><strong>Route:</strong> {projectData.project.Route || 'N/A'}</p>
                        <p><strong>PM:</strong> {projectData.project.PMFrom || 'N/A'} - {projectData.project.PMTo || 'N/A'}</p>
                        <p><strong>Created By:</strong> {projectData.project.CreatedBy || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Structures Tree */}
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">
                      Project Components & Structures
                    </h6>
                  </div>
                  <div className="card-body">
                    {projectData.structures && projectData.structures.length > 0 ? (
                      <div className="tree-structure" style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                        {/* Structures Column */}
                        <div style={{ minWidth: '250px', flex: '0 0 auto' }}>
                          <div className="fw-bold mb-2 p-2 bg-light border-bottom">Structures</div>
                          {projectData.structures.map((structure) => (
                            <div 
                              key={structure.StructureID}
                              className="p-2 border rounded mb-2 cursor-pointer"
                              style={{ 
                                cursor: 'pointer',
                                backgroundColor: expandedStructures.has(structure.StructureID) ? '#e7f3ff' : '#fff'
                              }}
                              onClick={() => toggleStructure(structure.StructureID)}
                            >
                              <i className={`bi ${expandedStructures.has(structure.StructureID) ? 'bi-chevron-right' : 'bi-chevron-right'} me-2`}></i>
                              <strong>{structure.StructureNumber || 'N/A'}</strong>
                              <div className="small text-muted">
                                {structure.ProjectComponent || 'No component'}
                              </div>
                              <span className="badge bg-secondary mt-1">
                                {structure.boreholes?.length || 0} Borehole(s)
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Boreholes Column (shown when a structure is expanded) */}
                        {Array.from(expandedStructures).map(structureId => {
                          const structure = projectData.structures.find(s => s.StructureID === structureId);
                          if (!structure || !structure.boreholes) return null;
                          
                          return (
                            <div key={`boreholes-${structureId}`} style={{ minWidth: '250px', flex: '0 0 auto' }}>
                              <div className="fw-bold mb-2 p-2 bg-light border-bottom">Boreholes</div>
                              {structure.boreholes.length > 0 ? (
                                structure.boreholes.map((borehole) => (
                                  <div 
                                    key={borehole.BoreholeID}
                                    className="p-2 border rounded mb-2 cursor-pointer"
                                    style={{ 
                                      cursor: 'pointer',
                                      backgroundColor: expandedBoreholes.has(borehole.BoreholeID) ? '#e7f3ff' : '#fff'
                                    }}
                                    onClick={() => toggleBorehole(borehole.BoreholeID)}
                                  >
                                    <i className={`bi ${expandedBoreholes.has(borehole.BoreholeID) ? 'bi-chevron-right' : 'bi-chevron-right'} me-2`}></i>
                                    <strong>{borehole.BoreholeNumber}</strong>
                                    {borehole.Latitude && borehole.Longitude && (
                                      <div className="small text-muted">
                                        Lat: {borehole.Latitude}, Long: {borehole.Longitude}
                                      </div>
                                    )}
                                    <span className="badge bg-secondary mt-1">
                                      {borehole.samples?.length || 0} Sample(s)
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted small p-2">
                                  No boreholes
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Samples Column (shown when a borehole is expanded) */}
                        {Array.from(expandedBoreholes).map(boreholeId => {
                          let borehole = null;
                          for (const structure of projectData.structures) {
                            const found = structure.boreholes?.find(b => b.BoreholeID === boreholeId);
                            if (found) {
                              borehole = found;
                              break;
                            }
                          }
                          if (!borehole || !borehole.samples) return null;
                          
                          return (
                            <div key={`samples-${boreholeId}`} style={{ minWidth: '250px', flex: '0 0 auto' }}>
                              <div className="fw-bold mb-2 p-2 bg-light border-bottom">Samples</div>
                              {borehole.samples.length > 0 ? (
                                borehole.samples.map((sample) => (
                                  <div 
                                    key={sample.SampleID}
                                    className="p-2 border rounded mb-2 cursor-pointer"
                                    style={{ 
                                      cursor: 'pointer',
                                      backgroundColor: expandedSamples.has(sample.SampleID) ? '#e7f3ff' : '#fff'
                                    }}
                                    onClick={() => toggleSample(sample.SampleID)}
                                  >
                                    <i className={`bi ${expandedSamples.has(sample.SampleID) ? 'bi-chevron-right' : 'bi-chevron-right'} me-2`}></i>
                                    <strong>Sample: {sample.SampleNumber}</strong>
                                    <div className="small text-muted">
                                      Depth: {sample.DepthFrom || '?'} - {sample.DepthTo || '?'} ft
                                    </div>
                                    {sample.TL101Number && (
                                      <div className="small text-muted">
                                        TL101: {sample.TL101Number}
                                      </div>
                                    )}
                                    <span className="badge bg-secondary mt-1">
                                      {sample.tests?.length || 0} Test(s)
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted small p-2">
                                  No samples
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Tests Column (shown when a sample is expanded) */}
                        {Array.from(expandedSamples).map(sampleId => {
                          let sample = null;
                          for (const structure of projectData.structures) {
                            for (const borehole of structure.boreholes || []) {
                              const found = borehole.samples?.find(s => s.SampleID === sampleId);
                              if (found) {
                                sample = found;
                                break;
                              }
                            }
                            if (sample) break;
                          }
                          if (!sample || !sample.tests) return null;
                          
                          return (
                            <div key={`tests-${sampleId}`} style={{ minWidth: '300px', flex: '0 0 auto' }}>
                              <div className="fw-bold mb-2 p-2 bg-light border-bottom">Tests</div>
                              {sample.tests.length > 0 ? (
                                sample.tests.map((test) => (
                                  <div 
                                    key={test.TestID}
                                    className="p-2 border rounded mb-2"
                                  >
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="flex-grow-1">
                                        <strong>{test.TestName}</strong>
                                        <div className="small text-muted">
                                          Requested by: {test.RequestingUser || 'N/A'}
                                        </div>
                                        {test.RequestedDate && (
                                          <div className="small text-muted">
                                            Date: {new Date(test.RequestedDate).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                      <span className={getStatusBadgeClass(test.Status)}>
                                        {test.Status || 'Unknown'}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted small p-2">
                                  No tests
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-muted text-center py-4">
                        No structures found for this project
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
    </>
  );

  // If it's a panel, render without modal wrapper
  if (isPanel) {
    return (
      <div style={{ padding: '20px', paddingTop: '50px', height: '100%', overflow: 'auto' }}>
        <div className="mb-3">
          <h5 className="text-primary">
            Project Details
          </h5>
        </div>
        {renderContent()}
      </div>
    );
  }

  // Otherwise render as modal
  return (
    <div 
      className="modal show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-xl modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              Project Details
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            {renderContent()}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsModal;
