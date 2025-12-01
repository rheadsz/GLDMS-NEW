import React, { useState } from "react";
import axios from "axios";

function TestsInfo({ data, onChange }) {
  // Extract data from props (data is already flattened in CreateProjectWizard)
  const structures = data?.structures || [];
  const boreholes = data?.boreholes || [];
  const samples = data?.samples || [];
  
  // State for tree expansion
  const [expandedStructures, setExpandedStructures] = useState(new Set());
  const [expandedBoreholes, setExpandedBoreholes] = useState(new Set());
  
  // State for selected samples (multiple selection)
  const [selectedSamples, setSelectedSamples] = useState(new Set());
  
  // State for test assignments: { sampleId: [testNames] }
  const initialTestAssignments = data?.testAssignments || {};
  const [testAssignments, setTestAssignments] = useState(initialTestAssignments);
  const [rockDescriptions, setRockDescriptions] = useState(data?.rockDescriptions || {});
  const [triaxialDetails, setTriaxialDetails] = useState(data?.triaxialDetails || {});
  const [directShearDetails, setDirectShearDetails] = useState(data?.directShearDetails || {});
  const [swellCollapseDetails, setSwellCollapseDetails] = useState(data?.swellCollapseDetails || {});
  const [consolidationDetails, setConsolidationDetails] = useState(data?.consolidationDetails || {});
  const [permeabilityDetails, setPermeabilityDetails] = useState(data?.permeabilityDetails || {});

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showRockModal, setShowRockModal] = useState(false);
  const [rockDescriptionInput, setRockDescriptionInput] = useState("");
  const [rockModalError, setRockModalError] = useState("");
  const [rockModalSampleIds, setRockModalSampleIds] = useState([]);
  const [showTriaxialModal, setShowTriaxialModal] = useState(false);
  const [triaxialModalSampleIds, setTriaxialModalSampleIds] = useState([]);
  const [triaxialModalTestName, setTriaxialModalTestName] = useState(null);
  const [triaxialConfiningPressure, setTriaxialConfiningPressure] = useState('');
  const [triaxialSampleType, setTriaxialSampleType] = useState('');
  const [triaxialRelativeCompaction, setTriaxialRelativeCompaction] = useState('');
  const [triaxialModalError, setTriaxialModalError] = useState('');
  const DIRECT_SHEAR_SET_COUNT = 6;
  const createEmptyDirectShearSet = () => ({
    normalLoad: '',
    sampleType: '',
    relativeCompaction: ''
  });
  const [showDirectShearModal, setShowDirectShearModal] = useState(false);
  const [directShearModalSampleIds, setDirectShearModalSampleIds] = useState([]);
  const [directShearSets, setDirectShearSets] = useState(
    Array.from({ length: DIRECT_SHEAR_SET_COUNT }, () => createEmptyDirectShearSet())
  );
  const [directShearModalError, setDirectShearModalError] = useState('');

  const resetDirectShearSets = () => {
    setDirectShearSets(Array.from({ length: DIRECT_SHEAR_SET_COUNT }, () => createEmptyDirectShearSet()));
  };

  const updateDirectShearSet = (index, changes) => {
    setDirectShearSets(prev => prev.map((set, idx) => idx === index ? { ...set, ...changes } : set));
  };
  const [showSwellModal, setShowSwellModal] = useState(false);
  const [swellModalSampleIds, setSwellModalSampleIds] = useState([]);
  const [swellInundationLoad, setSwellInundationLoad] = useState('');
  const [swellSampleType, setSwellSampleType] = useState('');
  const [swellRelativeCompaction, setSwellRelativeCompaction] = useState('');
  const [swellModalError, setSwellModalError] = useState('');
  const [showConsolidationModal, setShowConsolidationModal] = useState(false);
  const [consolidationModalSampleIds, setConsolidationModalSampleIds] = useState([]);
  const [consolidationSampleType, setConsolidationSampleType] = useState('');
  const [consolidationRelativeCompaction, setConsolidationRelativeCompaction] = useState('');
  const [consolidationModalError, setConsolidationModalError] = useState('');
  const [showPermeabilityModal, setShowPermeabilityModal] = useState(false);
  const [permeabilityModalSampleIds, setPermeabilityModalSampleIds] = useState([]);
  const [permeabilityConfiningPressure, setPermeabilityConfiningPressure] = useState('');
  const [permeabilitySampleType, setPermeabilitySampleType] = useState('');
  const [permeabilityRelativeCompaction, setPermeabilityRelativeCompaction] = useState('');
  const [permeabilityModalError, setPermeabilityModalError] = useState('');

  // Check if any sample has Sand Equivalent or Corrosion tests assigned
  const hasRelevantTests = Object.values(testAssignments).some(tests => 
    tests && (tests.includes('Sand Equivalent') || tests.includes('Corrosion'))
  );

  // Test options
  const ROCK_TEST_NAME = 'Unconfined Compression – Rock';

  const defaultTestOptions = [
    'Moisture Content',
    'Unit Weight',
    'Specific Gravity',
    'Particle Size Analysis',
    'Plasticity Index',
    'No. 200 Sieve Wash',
    'Particle Size Distribution - Sieve Analysis',
    'Particle Size Distribution - Hydrometer',
    'Consolidation',
    'Direct Shear',
    'Triaxial - CUe',
    'Triaxial - UU',
    'Unconfined Compression – Soil',
    ROCK_TEST_NAME,
    'Point Load',
    'Permeability/Hydraulic Conductivity',
    'Swell/Collapse Potential',
    'Expansion Index',
    'Compaction Curve',
    'Sand Equivalent',
    'Corrosion'
  ];

  const testOptions = defaultTestOptions;

  // Toggle structure expansion
  const toggleStructure = (structureId) => {
    const newExpanded = new Set(expandedStructures);
    if (newExpanded.has(structureId)) {
      newExpanded.delete(structureId);
    } else {
      newExpanded.add(structureId);
    }
    setExpandedStructures(newExpanded);
  };

  // Toggle borehole expansion
  const toggleBorehole = (boreholeId) => {
    const newExpanded = new Set(expandedBoreholes);
    if (newExpanded.has(boreholeId)) {
      newExpanded.delete(boreholeId);
    } else {
      newExpanded.add(boreholeId);
    }
    setExpandedBoreholes(newExpanded);
  };

  // Toggle sample selection
  const toggleSampleSelection = (sampleId) => {
    const newSelected = new Set(selectedSamples);
    if (newSelected.has(sampleId)) {
      newSelected.delete(sampleId);
    } else {
      newSelected.add(sampleId);
    }
    setSelectedSamples(newSelected);
  };

  // Get boreholes for a structure
  const getBoreholesByStructure = (structureId) => {
    return boreholes.filter(b => b.structureId === structureId);
  };

  // Get samples for a borehole
  const getSamplesByBorehole = (boreholeInternalId) => {
    // Find the borehole to get its boreholeId (user-entered identifier)
    const borehole = boreholes.find(b => b.id === boreholeInternalId);
    if (!borehole) return [];
    
    // Samples store boreholeId as the user-entered identifier (e.g., "BH-001")
    return samples.filter(s => s.boreholeId === borehole.boreholeId);
  };

  // Get structure name
  const getStructureName = (structure) => {
    if (structure.structureNo) {
      return `${structure.projectComponent} (${structure.structureNo})`;
    }
    return structure.projectComponent || 'Unknown Structure';
  };

  // Get borehole name
  const getBoreholeName = (borehole) => {
    return borehole.boreholeId || 'Unknown Borehole';
  };

  // Get sample name
  const getSampleName = (sample) => {
    const depthDisplay = sample.depthFrom && sample.depthTo
      ? `${sample.depthFrom}-${sample.depthTo} ft`
      : sample.depthFrom || sample.depthTo || 'Unknown depth';
    return `${sample.sampleId || 'Sample'} (${depthDisplay})`;
  };
  
  // Handle PDF generation
  const handleGenerateTestForms = async () => {
    setIsGeneratingPDF(true);
    try {
      // Get the parent formData from window or pass it through props
      // For now, we'll need to access it from the parent component
      console.log('Data available in TestsInfo:', data);
      
      // Convert testAssignments to testRows format for PDF generation
      const testRows = [];
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
                boreholeSample: `${sample.boreholeId} - ${sample.depthFrom}-${sample.depthTo}`,
                tests: tests
              });
            }
          }
        }
      });
      
      // Prepare the data to send to backend
      const requestData = {
        testRows: testRows,
        projectInfo: data.projectInfo || {},
        boreholes: boreholes || [],
        samples: samples
      };
      
      console.log('Sending request data:', requestData);

      const response = await axios.post('/api/pdf/generate-test-form', requestData, {
        responseType: 'blob' // Important for downloading files
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'test-form.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Test form generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating test form: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Handle test toggle for selected samples
  const handleTestToggle = (testName) => {
    if (selectedSamples.size === 0) return;

    const selectedIds = Array.from(selectedSamples);
    const allSelectedHaveTest = selectedIds.every(sampleId => {
      const tests = testAssignments[sampleId] || [];
      return tests.includes(testName);
    });

    if (testName === ROCK_TEST_NAME) {
      if (allSelectedHaveTest) {
        const updatedAssignments = { ...testAssignments };
        selectedIds.forEach(sampleId => {
          const remaining = (updatedAssignments[sampleId] || []).filter(t => t !== testName);
          if (remaining.length) {
            updatedAssignments[sampleId] = remaining;
          } else {
            delete updatedAssignments[sampleId];
          }
        });

        const nextRockDescriptions = { ...rockDescriptions };
        selectedIds.forEach(sampleId => {
          delete nextRockDescriptions[sampleId];
        });

        setRockDescriptions(nextRockDescriptions);
        setTestAssignments(updatedAssignments);
        onChange({
          ...data,
          testAssignments: updatedAssignments,
          rockDescriptions: nextRockDescriptions,
          triaxialDetails,
          directShearDetails,
          swellCollapseDetails,
          consolidationDetails,
          permeabilityDetails
        });
      } else {
        setRockDescriptionInput(selectedIds.length === 1 ? (rockDescriptions[selectedIds[0]] || "") : "");
        setRockModalError("");
        setRockModalSampleIds(selectedIds);
        setShowRockModal(true);
      }
      return;
    }

    if (testName === 'Triaxial - CUe' || testName === 'Triaxial - UU') {
      if (allSelectedHaveTest) {
        const updatedAssignments = { ...testAssignments };
        selectedIds.forEach(sampleId => {
          const remaining = (updatedAssignments[sampleId] || []).filter(t => t !== testName);
          if (remaining.length) {
            updatedAssignments[sampleId] = remaining;
          } else {
            delete updatedAssignments[sampleId];
          }
        });

        const nextDetails = { ...triaxialDetails };
        selectedIds.forEach(sampleId => {
          if (nextDetails[sampleId]) {
            delete nextDetails[sampleId][testName];
            if (Object.keys(nextDetails[sampleId]).length === 0) {
              delete nextDetails[sampleId];
            }
          }
        });

        setTriaxialDetails(nextDetails);
        setTestAssignments(updatedAssignments);
        onChange({
          ...data,
          testAssignments: updatedAssignments,
          rockDescriptions,
          triaxialDetails: nextDetails,
          directShearDetails,
          swellCollapseDetails,
          consolidationDetails,
          permeabilityDetails
        });
      } else {
        setTriaxialModalSampleIds(selectedIds);
        setTriaxialModalTestName(testName);
        setTriaxialConfiningPressure('');
        setTriaxialSampleType('');
        setTriaxialRelativeCompaction('');
        setTriaxialModalError('');
        setShowTriaxialModal(true);
      }
      return;
    }

    if (testName === 'Direct Shear') {
      if (allSelectedHaveTest) {
        const updatedAssignments = { ...testAssignments };
        selectedIds.forEach(sampleId => {
          const remaining = (updatedAssignments[sampleId] || []).filter(t => t !== testName);
          if (remaining.length) {
            updatedAssignments[sampleId] = remaining;
          } else {
            delete updatedAssignments[sampleId];
          }
        });

        const nextDetails = { ...directShearDetails };
        selectedIds.forEach(sampleId => {
          if (nextDetails[sampleId]) {
            delete nextDetails[sampleId][testName];
            if (Object.keys(nextDetails[sampleId]).length === 0) {
              delete nextDetails[sampleId];
            }
          }
        });

        setDirectShearDetails(nextDetails);
        setTestAssignments(updatedAssignments);
        onChange({
          ...data,
          testAssignments: updatedAssignments,
          rockDescriptions,
          triaxialDetails,
          directShearDetails: nextDetails,
          swellCollapseDetails,
          consolidationDetails,
          permeabilityDetails
        });
      } else {
        setDirectShearModalSampleIds(selectedIds);
        if (selectedIds.length === 1) {
          const existing = directShearDetails[selectedIds[0]]?.[testName];
          const existingSets = existing?.sets || (existing ? [existing] : []);
          const paddedSets = Array.from({ length: DIRECT_SHEAR_SET_COUNT }, (_, idx) => (
            existingSets[idx]
              ? {
                  normalLoad: existingSets[idx].normalLoad || '',
                  sampleType: existingSets[idx].sampleType || '',
                  relativeCompaction: existingSets[idx].sampleType === 'Remolded'
                    ? existingSets[idx].relativeCompaction || ''
                    : ''
                }
              : createEmptyDirectShearSet()
          ));
          setDirectShearSets(paddedSets);
        } else {
          resetDirectShearSets();
        }
        setShowDirectShearModal(true);
      }
      return;
    }

    if (testName === 'Swell/Collapse Potential') {
      if (allSelectedHaveTest) {
        const updatedAssignments = { ...testAssignments };
        selectedIds.forEach(sampleId => {
          const remaining = (updatedAssignments[sampleId] || []).filter(t => t !== testName);
          if (remaining.length) {
            updatedAssignments[sampleId] = remaining;
          } else {
            delete updatedAssignments[sampleId];
          }
        });

        const nextDetails = { ...swellCollapseDetails };
        selectedIds.forEach(sampleId => {
          if (nextDetails[sampleId]) {
            delete nextDetails[sampleId][testName];
            if (Object.keys(nextDetails[sampleId]).length === 0) {
              delete nextDetails[sampleId];
            }
          }
        });

        setSwellCollapseDetails(nextDetails);
        setTestAssignments(updatedAssignments);
        onChange({
          ...data,
          testAssignments: updatedAssignments,
          rockDescriptions,
          triaxialDetails,
          directShearDetails,
          swellCollapseDetails: nextDetails,
          consolidationDetails,
          permeabilityDetails
        });
      } else {
        setSwellModalSampleIds(selectedIds);
        if (selectedIds.length === 1) {
          const existing = swellCollapseDetails[selectedIds[0]]?.[testName];
          setSwellInundationLoad(existing?.inundationLoad || '');
          setSwellSampleType(existing?.sampleType || '');
          setSwellRelativeCompaction(existing?.sampleType === 'Remolded' ? existing?.relativeCompaction || '' : '');
        } else {
          setSwellInundationLoad('');
          setSwellSampleType('');
          setSwellRelativeCompaction('');
        }
        setSwellModalError('');
        setShowSwellModal(true);
      }
      return;
    }

    if (testName === 'Permeability/Hydraulic Conductivity') {
      if (allSelectedHaveTest) {
        const updatedAssignments = { ...testAssignments };
        selectedIds.forEach(sampleId => {
          const remaining = (updatedAssignments[sampleId] || []).filter(t => t !== testName);
          if (remaining.length) {
            updatedAssignments[sampleId] = remaining;
          } else {
            delete updatedAssignments[sampleId];
          }
        });

        const nextDetails = { ...permeabilityDetails };
        selectedIds.forEach(sampleId => {
          if (nextDetails[sampleId]) {
            delete nextDetails[sampleId][testName];
            if (Object.keys(nextDetails[sampleId]).length === 0) {
              delete nextDetails[sampleId];
            }
          }
        });

        setPermeabilityDetails(nextDetails);
        setTestAssignments(updatedAssignments);
        onChange({
          ...data,
          testAssignments: updatedAssignments,
          rockDescriptions,
          triaxialDetails,
          directShearDetails,
          swellCollapseDetails,
          consolidationDetails,
          permeabilityDetails: nextDetails
        });
      } else {
        setPermeabilityModalSampleIds(selectedIds);
        if (selectedIds.length === 1) {
          const existing = permeabilityDetails[selectedIds[0]]?.[testName];
          setPermeabilityConfiningPressure(existing?.confiningPressure || '');
          setPermeabilitySampleType(existing?.sampleType || '');
          setPermeabilityRelativeCompaction(existing?.sampleType === 'Remolded' ? existing?.relativeCompaction || '' : '');
        } else {
          setPermeabilityConfiningPressure('');
          setPermeabilitySampleType('');
          setPermeabilityRelativeCompaction('');
        }
        setPermeabilityModalError('');
        setShowPermeabilityModal(true);
      }
      return;
    }

    if (testName === 'Consolidation') {
      if (allSelectedHaveTest) {
        const updatedAssignments = { ...testAssignments };
        selectedIds.forEach(sampleId => {
          const remaining = (updatedAssignments[sampleId] || []).filter(t => t !== testName);
          if (remaining.length) {
            updatedAssignments[sampleId] = remaining;
          } else {
            delete updatedAssignments[sampleId];
          }
        });

        const nextDetails = { ...consolidationDetails };
        selectedIds.forEach(sampleId => {
          if (nextDetails[sampleId]) {
            delete nextDetails[sampleId][testName];
            if (Object.keys(nextDetails[sampleId]).length === 0) {
              delete nextDetails[sampleId];
            }
          }
        });

        setConsolidationDetails(nextDetails);
        setTestAssignments(updatedAssignments);
        onChange({
          ...data,
          testAssignments: updatedAssignments,
          rockDescriptions,
          triaxialDetails,
          directShearDetails,
          swellCollapseDetails,
          consolidationDetails: nextDetails,
          permeabilityDetails
        });
      } else {
        setConsolidationModalSampleIds(selectedIds);
        if (selectedIds.length === 1) {
          const existing = consolidationDetails[selectedIds[0]]?.[testName];
          setConsolidationSampleType(existing?.sampleType || '');
          setConsolidationRelativeCompaction(existing?.sampleType === 'Remolded' ? existing?.relativeCompaction || '' : '');
        } else {
          setConsolidationSampleType('');
          setConsolidationRelativeCompaction('');
        }
        setConsolidationModalError('');
        setShowConsolidationModal(true);
      }
      return;
    }

    if (allSelectedHaveTest) {
      const updatedAssignments = { ...testAssignments };
      selectedIds.forEach(sampleId => {
        const remaining = (updatedAssignments[sampleId] || []).filter(t => t !== testName);
        if (remaining.length) {
          updatedAssignments[sampleId] = remaining;
        } else {
          delete updatedAssignments[sampleId];
        }
      });

      setTestAssignments(updatedAssignments);
      onChange({
        ...data,
        testAssignments: updatedAssignments,
        rockDescriptions,
        triaxialDetails,
        directShearDetails,
        swellCollapseDetails,
        consolidationDetails,
        permeabilityDetails
      });
    } else {
      const updatedAssignments = { ...testAssignments };
      selectedIds.forEach(sampleId => {
        const current = new Set(updatedAssignments[sampleId] || []);
        current.add(testName);
        updatedAssignments[sampleId] = Array.from(current);
      });

      setTestAssignments(updatedAssignments);
      onChange({
        ...data,
        testAssignments: updatedAssignments,
        rockDescriptions,
        triaxialDetails,
        directShearDetails,
        swellCollapseDetails,
        consolidationDetails,
        permeabilityDetails
      });
    }
  };

  // Check if a test is selected for any of the selected samples
  const isTestChecked = (testName) => {
    if (selectedSamples.size === 0) return false;
    
    // Check if ALL selected samples have this test
    return Array.from(selectedSamples).every(sampleId => {
      const tests = testAssignments[sampleId] || [];
      return tests.includes(testName);
    });
  };

  const renderRockDescriptionTag = (sampleId) => {
    const description = rockDescriptions?.[sampleId];
    if (!description) return null;
    const sample = samples.find(s => s.id === sampleId);
    const sampleLabel = sample ? getSampleName(sample) : `Sample ${sampleId}`;

    return (
      <div className="mt-2 p-2 border rounded bg-light" style={{ maxHeight: '120px', overflowY: 'auto' }}>
        <strong>{sampleLabel} lithologic description:</strong>
        <div className="mt-1 small" style={{ whiteSpace: 'pre-wrap' }}>{description}</div>
      </div>
    );
  };

  const renderConsolidationDetailTag = (sampleId) => {
    const detail = consolidationDetails?.[sampleId]?.['Consolidation'];
    if (!detail) return null;

    const sample = samples.find(s => s.id === sampleId);
    const sampleLabel = sample ? getSampleName(sample) : `Sample ${sampleId}`;

    return (
      <div className="mt-2 p-2 border rounded bg-light" style={{ maxHeight: '140px', overflowY: 'auto' }}>
        <strong>{sampleLabel} consolidation details:</strong>
        <ul className="small mb-0 mt-1" style={{ paddingLeft: '1rem' }}>
          <li>Sample Type: {detail.sampleType}</li>
          {detail.sampleType === 'Remolded' && (
            <li>Relative Compaction: {detail.relativeCompaction}%</li>
          )}
        </ul>
      </div>
    );
  };

  const renderPermeabilityDetailTag = (sampleId) => {
    const detail = permeabilityDetails?.[sampleId]?.['Permeability/Hydraulic Conductivity'];
    if (!detail) return null;

    const sample = samples.find(s => s.id === sampleId);
    const sampleLabel = sample ? getSampleName(sample) : `Sample ${sampleId}`;

    return (
      <div className="mt-2 p-2 border rounded bg-light" style={{ maxHeight: '140px', overflowY: 'auto' }}>
        <strong>{sampleLabel} permeability details:</strong>
        <ul className="small mb-0 mt-1" style={{ paddingLeft: '1rem' }}>
          <li>Confining Pressure: {detail.confiningPressure}</li>
          <li>Sample Type: {detail.sampleType}</li>
          {detail.sampleType === 'Remolded' && (
            <li>Relative Compaction: {detail.relativeCompaction}%</li>
          )}
        </ul>
      </div>
    );
  };

  const renderSwellDetailTag = (sampleId) => {
    const detail = swellCollapseDetails?.[sampleId]?.['Swell/Collapse Potential'];
    if (!detail) return null;

    const sample = samples.find(s => s.id === sampleId);
    const sampleLabel = sample ? getSampleName(sample) : `Sample ${sampleId}`;

    return (
      <div className="mt-2 p-2 border rounded bg-light" style={{ maxHeight: '140px', overflowY: 'auto' }}>
        <strong>{sampleLabel} swell/collapse details:</strong>
        <ul className="small mb-0 mt-1" style={{ paddingLeft: '1rem' }}>
          <li>Inundation Load: {detail.inundationLoad}</li>
          <li>Sample Type: {detail.sampleType}</li>
          {detail.sampleType === 'Remolded' && (
            <li>Relative Compaction: {detail.relativeCompaction}%</li>
          )}
        </ul>
      </div>
    );
  };

  const renderDirectShearDetailTag = (sampleId) => {
    const detail = directShearDetails?.[sampleId]?.['Direct Shear'];
    if (!detail) return null;

    const sample = samples.find(s => s.id === sampleId);
    const sampleLabel = sample ? getSampleName(sample) : `Sample ${sampleId}`;

    const entries = Array.isArray(detail.sets) && detail.sets.length
      ? detail.sets
      : [detail];

    return (
      <div className="mt-2 p-2 border rounded bg-light" style={{ maxHeight: '140px', overflowY: 'auto' }}>
        <strong>{sampleLabel} direct shear details:</strong>
        <div className="small mt-1" style={{ paddingLeft: '1rem' }}>
          {entries.map((entry, idx) => (
            <ul key={idx} className="mb-1">
              <li><strong>Test #{idx + 1}</strong></li>
              <li>Normal Load: {entry.normalLoad}</li>
              <li>Sample Type: {entry.sampleType}</li>
              {entry.sampleType === 'Remolded' && (
                <li>Relative Compaction: {entry.relativeCompaction}%</li>
              )}
            </ul>
          ))}
        </div>
      </div>
    );
  };

  const renderTriaxialDetailTag = (sampleId, testName) => {
    const sampleDetails = triaxialDetails?.[sampleId]?.[testName];
    if (!sampleDetails) return null;

    const sample = samples.find(s => s.id === sampleId);
    const sampleLabel = sample ? getSampleName(sample) : `Sample ${sampleId}`;

    return (
      <div className="mt-2 p-2 border rounded bg-light" style={{ maxHeight: '140px', overflowY: 'auto' }}>
        <strong>{sampleLabel} triaxial details:</strong>
        <ul className="small mb-0 mt-1" style={{ paddingLeft: '1rem' }}>
          <li>Confining Pressure: {sampleDetails.confiningPressure}</li>
          <li>Sample Type: {sampleDetails.sampleType}</li>
          {sampleDetails.sampleType === 'Remolded' && (
            <li>Relative Compaction: {sampleDetails.relativeCompaction}%</li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div className="card mb-3">
      <style>
        {`
          .form-control,
          .form-select,
          .form-check-input {
            border-color: #495057 !important;
            border-width: 2px !important;
          }
          .form-control:focus,
          .form-select:focus,
          .form-check-input:focus {
            border-color: #212529 !important;
            border-width: 2px !important;
            box-shadow: 0 0 0 0.2rem rgba(33, 37, 41, 0.25) !important;
          }
          input[type='number']::-webkit-inner-spin-button,
          input[type='number']::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type='number'] {
            -moz-appearance: textfield;
          }
        `}
      </style>
      <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
        <span>Tests</span>
        {selectedSamples.size > 0 && (
          <small className="text-muted">
            {selectedSamples.size} sample{selectedSamples.size > 1 ? 's' : ''} selected
          </small>
        )}
      </div>
      <div className="card-body pb-2">
        
        {structures.length === 0 ? (
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Please add structures, boreholes, and samples in the previous steps before assigning tests.
          </div>
        ) : (
          <div className="row">
            {/* Left Column: Tree Structure */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-header bg-light">
                  <strong>Select Project Component (Structure Number)</strong>
                </div>
                <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {structures.map(structure => {
                    const structureBoreholes = getBoreholesByStructure(structure.id);
                    const isStructureExpanded = expandedStructures.has(structure.id);
                    
                    return (
                      <div key={structure.id} className="mb-2">
                        {/* Structure Level */}
                        <div 
                          className="d-flex align-items-center p-2 border rounded bg-light"
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleStructure(structure.id)}
                        >
                          <i className={`bi bi-chevron-${isStructureExpanded ? 'down' : 'right'} me-2`}></i>
                          <span className="me-2 fw-bold">Structure:</span>
                          <strong>{getStructureName(structure)}</strong>
                          <span className="ms-2 badge bg-secondary">{structureBoreholes.length}</span>
                        </div>
                        
                        {/* Boreholes (shown when structure is expanded) */}
                        {isStructureExpanded && (
                          <div className="ms-4 mt-2">
                            {structureBoreholes.length === 0 ? (
                              <div className="text-muted small">No boreholes for this structure</div>
                            ) : (
                              structureBoreholes.map(borehole => {
                                const boreholeSamples = getSamplesByBorehole(borehole.id);
                                const isBoreholeExpanded = expandedBoreholes.has(borehole.id);
                                
                                return (
                                  <div key={borehole.id} className="mb-2">
                                    {/* Borehole Level */}
                                    <div 
                                      className="d-flex align-items-center p-2 border rounded"
                                      style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                                      onClick={() => toggleBorehole(borehole.id)}
                                    >
                                      <i className={`bi bi-chevron-${isBoreholeExpanded ? 'down' : 'right'} me-2`}></i>
                                      <span className="me-2 fw-bold">Borehole:</span>
                                      <span>{getBoreholeName(borehole)}</span>
                                      <span className="ms-2 badge bg-info">{boreholeSamples.length}</span>
                                    </div>
                                    
                                    {/* Samples (shown when borehole is expanded) */}
                                    {isBoreholeExpanded && (
                                      <div className="ms-4 mt-2">
                                        {boreholeSamples.length === 0 ? (
                                          <div className="text-muted small">No samples for this borehole</div>
                                        ) : (
                                          boreholeSamples.map(sample => {
                                            const isSelected = selectedSamples.has(sample.id);
                                            
                                            return (
                                              <div 
                                                key={sample.id} 
                                                className={`d-flex align-items-center p-2 border rounded mb-1 ${isSelected ? 'bg-primary text-white' : ''}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => toggleSampleSelection(sample.id)}
                                              >
                                                <input
                                                  type="checkbox"
                                                  className="form-check-input me-2"
                                                  checked={isSelected}
                                                  onChange={() => {}}
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                                <span className="me-2 fw-bold">Sample:</span>
                                                <span>{getSampleName(sample)}</span>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Right Column: Test Selection */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-header bg-light">
                  <strong>Available Tests</strong>
                </div>
                <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {selectedSamples.size === 0 ? (
                    <div className="text-muted text-center py-5">
                      <i className="bi bi-arrow-left me-2"></i>
                      Select one or more samples from the left to assign tests
                    </div>
                  ) : (
                    <div>
                      {testOptions.map((testName, index) => (
                        <div key={index} className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`test-${index}`}
                            checked={isTestChecked(testName)}
                            onChange={() => handleTestToggle(testName)}
                          />
                          <label className="form-check-label" htmlFor={`test-${index}`}>
                            {testName}
                            {(testName === 'Sand Equivalent' || testName === 'Corrosion') && isTestChecked(testName) && (
                              <button 
                                type="button" 
                                className="btn btn-sm btn-primary ms-2" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateTestForms();
                                }}
                                disabled={isGeneratingPDF}
                                style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                              >
                                {isGeneratingPDF ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" style={{ width: '0.6rem', height: '0.6rem' }}></span>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-file-pdf me-1"></i> Generate TL-101
                                  </>
                                )}
                              </button>
                            )}
                          </label>
                          {testName === ROCK_TEST_NAME && selectedSamples.size > 0 && (
                            <div className="mt-2">
                              {Array.from(selectedSamples).map(sampleId => (
                                <div key={sampleId}>
                                  {renderRockDescriptionTag(sampleId)}
                                </div>
                              ))}
                            </div>
                          )}
                          {(testName === 'Triaxial - CUe' || testName === 'Triaxial - UU') && selectedSamples.size > 0 && (
                            <div className="mt-2">
                              {Array.from(selectedSamples).map(sampleId => (
                                <div key={`${sampleId}-${testName}`}>
                                  {renderTriaxialDetailTag(sampleId, testName)}
                                </div>
                              ))}
                            </div>
                          )}
                          {testName === 'Direct Shear' && selectedSamples.size > 0 && (
                            <div className="mt-2">
                              {Array.from(selectedSamples).map(sampleId => (
                                <div key={`${sampleId}-directshear`}>
                                  {renderDirectShearDetailTag(sampleId)}
                                </div>
                              ))}
                            </div>
                          )}
                          {testName === 'Swell/Collapse Potential' && selectedSamples.size > 0 && (
                            <div className="mt-2">
                              {Array.from(selectedSamples).map(sampleId => (
                                <div key={`${sampleId}-swell`}>
                                  {renderSwellDetailTag(sampleId)}
                                </div>
                              ))}
                            </div>
                          )}
                          {testName === 'Permeability/Hydraulic Conductivity' && selectedSamples.size > 0 && (
                            <div className="mt-2">
                              {Array.from(selectedSamples).map(sampleId => (
                                <div key={`${sampleId}-permeability`}>
                                  {renderPermeabilityDetailTag(sampleId)}
                                </div>
                              ))}
                            </div>
                          )}
                          {testName === 'Consolidation' && selectedSamples.size > 0 && (
                            <div className="mt-2">
                              {Array.from(selectedSamples).map(sampleId => (
                                <div key={`${sampleId}-consolidation`}>
                                  {renderConsolidationDetailTag(sampleId)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        
        {/* Navigation buttons */}
        <div className="row mt-4">
          <div className="col-12">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => onChange({ 
                ...data, 
                testAssignments: testAssignments,
                _prevStep: true
              })}
            >
              <i className="bi bi-arrow-left me-1"></i> Previous
            </button>
          </div>
        </div>
      </div>

      {/* Rock description modal */}
      {showRockModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Lithologic description required</h5>
                <button type="button" className="btn-close" onClick={() => { setShowRockModal(false); setRockModalSampleIds([]); }}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Please provide the lithologic description of rock for Unconfined Compression – Rock.</label>
                {rockModalSampleIds.length > 1 && (
                  <div className="alert alert-info py-2">
                    This description will be applied to {rockModalSampleIds.length} selected samples.
                  </div>
                )}
                <textarea
                  className="form-control"
                  rows="4"
                  value={rockDescriptionInput}
                  onChange={e => {
                    setRockDescriptionInput(e.target.value);
                    if (e.target.value.trim()) {
                      setRockModalError("");
                    }
                  }}
                  placeholder="Enter description"
                ></textarea>
                {rockModalError && <div className="text-danger mt-2">{rockModalError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowRockModal(false); setRockModalSampleIds([]); }}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!rockDescriptionInput.trim()) {
                      setRockModalError('Description is required.');
                      return;
                    }
                    const descriptionText = rockDescriptionInput.trim();
                    const updatedDescriptions = { ...rockDescriptions };
                    rockModalSampleIds.forEach(sampleId => {
                      updatedDescriptions[sampleId] = descriptionText;
                    });
                    setRockDescriptions(updatedDescriptions);
                    setShowRockModal(false);
                    const updatedAssignments = { ...testAssignments };
                    rockModalSampleIds.forEach(sampleId => {
                      const currentTests = updatedAssignments[sampleId] || [];
                      if (!currentTests.includes(ROCK_TEST_NAME)) {
                        updatedAssignments[sampleId] = [...currentTests, ROCK_TEST_NAME];
                      }
                    });
                    setTestAssignments(updatedAssignments);
                    setRockModalSampleIds([]);
                    onChange({
                      ...data,
                      testAssignments: updatedAssignments,
                      rockDescriptions: updatedDescriptions
                    });
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permeability/Hydraulic Conductivity modal */}
      {showPermeabilityModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Permeability/Hydraulic Conductivity details</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowPermeabilityModal(false);
                  setPermeabilityModalSampleIds([]);
                  setPermeabilityModalError('');
                }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Confining Pressure (psi)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={permeabilityConfiningPressure}
                    onChange={e => {
                      setPermeabilityConfiningPressure(e.target.value);
                      if (permeabilityModalError) setPermeabilityModalError('');
                    }}
                    placeholder="Enter confining pressure"
                    min="0"
                    step="any"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label d-block">Sample Type</label>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="permeabilitySampleType"
                      id="permeability-undisturbed"
                      value="Undisturbed"
                      checked={permeabilitySampleType === 'Undisturbed'}
                      onChange={e => {
                        setPermeabilitySampleType(e.target.value);
                        setPermeabilityRelativeCompaction('');
                        if (permeabilityModalError) setPermeabilityModalError('');
                      }}
                    />
                    <label className="form-check-label" htmlFor="permeability-undisturbed">Undisturbed</label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="permeabilitySampleType"
                      id="permeability-remolded"
                      value="Remolded"
                      checked={permeabilitySampleType === 'Remolded'}
                      onChange={e => {
                        setPermeabilitySampleType(e.target.value);
                        if (permeabilityModalError) setPermeabilityModalError('');
                      }}
                    />
                    <label className="form-check-label" htmlFor="permeability-remolded">Remolded</label>
                  </div>
                </div>
                {permeabilitySampleType === 'Remolded' && (
                  <div className="mb-3">
                    <label className="form-label">Relative Compaction (nearest whole %)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={permeabilityRelativeCompaction}
                      onChange={e => {
                        setPermeabilityRelativeCompaction(e.target.value);
                        if (permeabilityModalError) setPermeabilityModalError('');
                      }}
                      placeholder="Enter relative compaction"
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                )}
                {permeabilityModalError && <div className="text-danger mt-2">{permeabilityModalError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowPermeabilityModal(false);
                  setPermeabilityModalSampleIds([]);
                  setPermeabilityModalError('');
                  setPermeabilityConfiningPressure('');
                  setPermeabilitySampleType('');
                  setPermeabilityRelativeCompaction('');
                }}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!permeabilityConfiningPressure || Number(permeabilityConfiningPressure) <= 0) {
                      setPermeabilityModalError('Confining pressure must be a positive number.');
                      return;
                    }
                    if (!permeabilitySampleType) {
                      setPermeabilityModalError('Select sample type (Remolded or Undisturbed).');
                      return;
                    }
                    if (permeabilitySampleType === 'Remolded') {
                      const compactionValue = Number(permeabilityRelativeCompaction);
                      if (!permeabilityRelativeCompaction || Number.isNaN(compactionValue) || compactionValue < 0 || compactionValue > 100) {
                        setPermeabilityModalError('Enter relative compaction between 0 and 100.');
                        return;
                      }
                    }

                    const updatedAssignments = { ...testAssignments };
                    const updatedDetails = { ...permeabilityDetails };

                    permeabilityModalSampleIds.forEach(sampleId => {
                      const current = new Set(updatedAssignments[sampleId] || []);
                      current.add('Permeability/Hydraulic Conductivity');
                      updatedAssignments[sampleId] = Array.from(current);

                      if (!updatedDetails[sampleId]) {
                        updatedDetails[sampleId] = {};
                      }
                      updatedDetails[sampleId]['Permeability/Hydraulic Conductivity'] = {
                        confiningPressure: permeabilityConfiningPressure,
                        sampleType: permeabilitySampleType,
                        relativeCompaction: permeabilitySampleType === 'Remolded' ? permeabilityRelativeCompaction : null
                      };
                    });

                    setTestAssignments(updatedAssignments);
                    setPermeabilityDetails(updatedDetails);
                    setShowPermeabilityModal(false);
                    setPermeabilityModalSampleIds([]);
                    setPermeabilityModalError('');
                    setPermeabilityConfiningPressure('');
                    setPermeabilitySampleType('');
                    setPermeabilityRelativeCompaction('');

                    onChange({
                      ...data,
                      testAssignments: updatedAssignments,
                      rockDescriptions,
                      triaxialDetails,
                      directShearDetails,
                      swellCollapseDetails,
                      consolidationDetails,
                      permeabilityDetails: updatedDetails
                    });
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Triaxial details modal */}
      {showTriaxialModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{triaxialModalTestName} details</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowTriaxialModal(false);
                  setTriaxialModalSampleIds([]);
                  setTriaxialModalTestName(null);
                }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Confining Pressure (psi)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={triaxialConfiningPressure}
                    onChange={e => {
                      setTriaxialConfiningPressure(e.target.value);
                      if (triaxialModalError) setTriaxialModalError('');
                    }}
                    placeholder="Enter confining pressure"
                    min="0"
                    step="any"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label d-block">Sample Type</label>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="triaxialSampleType"
                      id="triaxial-undisturbed"
                      value="Undisturbed"
                      checked={triaxialSampleType === 'Undisturbed'}
                      onChange={e => {
                        setTriaxialSampleType(e.target.value);
                        setTriaxialRelativeCompaction('');
                        if (triaxialModalError) setTriaxialModalError('');
                      }}
                    />
                    <label className="form-check-label" htmlFor="triaxial-undisturbed">Undisturbed</label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="triaxialSampleType"
                      id="triaxial-remolded"
                      value="Remolded"
                      checked={triaxialSampleType === 'Remolded'}
                      onChange={e => {
                        setTriaxialSampleType(e.target.value);
                        if (triaxialModalError) setTriaxialModalError('');
                      }}
                    />
                    <label className="form-check-label" htmlFor="triaxial-remolded">Remolded</label>
                  </div>
                </div>
                {triaxialSampleType === 'Remolded' && (
                  <div className="mb-3">
                    <label className="form-label">Relative Compaction (nearest whole %)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={triaxialRelativeCompaction}
                      onChange={e => {
                        setTriaxialRelativeCompaction(e.target.value);
                        if (triaxialModalError) setTriaxialModalError('');
                      }}
                      placeholder="Enter relative compaction"
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                )}
                {triaxialModalError && <div className="text-danger mt-2">{triaxialModalError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowTriaxialModal(false);
                  setTriaxialModalSampleIds([]);
                  setTriaxialModalTestName(null);
                  setTriaxialModalError('');
                }}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!triaxialConfiningPressure || Number(triaxialConfiningPressure) <= 0) {
                      setTriaxialModalError('Confining pressure must be a positive number.');
                      return;
                    }
                    if (!triaxialSampleType) {
                      setTriaxialModalError('Select sample type (Remolded or Undisturbed).');
                      return;
                    }
                    if (triaxialSampleType === 'Remolded') {
                      const compactionValue = Number(triaxialRelativeCompaction);
                      if (!triaxialRelativeCompaction || Number.isNaN(compactionValue) || compactionValue < 0 || compactionValue > 100) {
                        setTriaxialModalError('Enter relative compaction between 0 and 100.');
                        return;
                      }
                    }

                    const updatedAssignments = { ...testAssignments };
                    const updatedDetails = { ...triaxialDetails };

                    triaxialModalSampleIds.forEach(sampleId => {
                      const current = new Set(updatedAssignments[sampleId] || []);
                      current.add(triaxialModalTestName);
                      updatedAssignments[sampleId] = Array.from(current);

                      if (!updatedDetails[sampleId]) {
                        updatedDetails[sampleId] = {};
                      }
                      updatedDetails[sampleId][triaxialModalTestName] = {
                        confiningPressure: triaxialConfiningPressure,
                        sampleType: triaxialSampleType,
                        relativeCompaction: triaxialSampleType === 'Remolded' ? triaxialRelativeCompaction : null
                      };
                    });

                    setTestAssignments(updatedAssignments);
                    setTriaxialDetails(updatedDetails);
                    setShowTriaxialModal(false);
                    setTriaxialModalSampleIds([]);
                    setTriaxialModalTestName(null);
                    setTriaxialModalError('');
                    setTriaxialConfiningPressure('');
                    setTriaxialSampleType('');
                    setTriaxialRelativeCompaction('');

                    onChange({
                      ...data,
                      testAssignments: updatedAssignments,
                      rockDescriptions,
                      triaxialDetails: updatedDetails
                    });
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct shear details modal */}
      {showDirectShearModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Direct Shear details</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowDirectShearModal(false);
                  setDirectShearModalSampleIds([]);
                  setDirectShearModalError('');
                  resetDirectShearSets();
                }}></button>
              </div>
              <div className="modal-body">
                {directShearSets.map((setValues, index) => (
                  <div key={index} className="mb-4 border rounded p-3">
                    <h6 className="fw-semibold mb-3">Direct Shear Test #{index + 1}</h6>
                    <div className="mb-3">
                      <label className="form-label">Normal Load (psi)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={setValues.normalLoad}
                        onChange={e => {
                          updateDirectShearSet(index, { normalLoad: e.target.value });
                          if (directShearModalError) setDirectShearModalError('');
                        }}
                        placeholder="Enter normal load"
                        min="0"
                        step="any"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label d-block">Sample Type</label>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name={`directShearSampleType-${index}`}
                          id={`directshear-undisturbed-${index}`}
                          value="Undisturbed"
                          checked={setValues.sampleType === 'Undisturbed'}
                          onChange={e => {
                            updateDirectShearSet(index, { sampleType: e.target.value, relativeCompaction: '' });
                            if (directShearModalError) setDirectShearModalError('');
                          }}
                        />
                        <label className="form-check-label" htmlFor={`directshear-undisturbed-${index}`}>Undisturbed</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name={`directShearSampleType-${index}`}
                          id={`directshear-remolded-${index}`}
                          value="Remolded"
                          checked={setValues.sampleType === 'Remolded'}
                          onChange={e => {
                            updateDirectShearSet(index, { sampleType: e.target.value });
                            if (directShearModalError) setDirectShearModalError('');
                          }}
                        />
                        <label className="form-check-label" htmlFor={`directshear-remolded-${index}`}>Remolded</label>
                      </div>
                    </div>
                    {setValues.sampleType === 'Remolded' && (
                      <div className="mb-3">
                        <label className="form-label">Relative Compaction (nearest whole %)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={setValues.relativeCompaction}
                          onChange={e => {
                            updateDirectShearSet(index, { relativeCompaction: e.target.value });
                            if (directShearModalError) setDirectShearModalError('');
                          }}
                          placeholder="Enter relative compaction"
                          min="0"
                          max="100"
                          step="1"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {directShearModalError && <div className="text-danger mt-2">{directShearModalError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowDirectShearModal(false);
                  setDirectShearModalSampleIds([]);
                  setDirectShearModalError('');
                  resetDirectShearSets();
                }}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    for (let i = 0; i < DIRECT_SHEAR_SET_COUNT; i += 1) {
                      const entry = directShearSets[i];
                      if (!entry.normalLoad || Number(entry.normalLoad) <= 0) {
                        setDirectShearModalError(`Normal load for Direct Shear Test #${i + 1} must be a positive number.`);
                        return;
                      }
                      if (!entry.sampleType) {
                        setDirectShearModalError(`Select a sample type for Direct Shear Test #${i + 1}.`);
                        return;
                      }
                      if (entry.sampleType === 'Remolded') {
                        const compactionValue = Number(entry.relativeCompaction);
                        if (!entry.relativeCompaction || Number.isNaN(compactionValue) || compactionValue < 0 || compactionValue > 100) {
                          setDirectShearModalError(`Enter relative compaction between 0 and 100 for Direct Shear Test #${i + 1}.`);
                          return;
                        }
                      }
                    }

                    const updatedAssignments = { ...testAssignments };
                    const updatedDetails = { ...directShearDetails };

                    directShearModalSampleIds.forEach(sampleId => {
                      const current = new Set(updatedAssignments[sampleId] || []);
                      current.add('Direct Shear');
                      updatedAssignments[sampleId] = Array.from(current);

                      if (!updatedDetails[sampleId]) {
                        updatedDetails[sampleId] = {};
                      }
                      updatedDetails[sampleId]['Direct Shear'] = {
                        sets: directShearSets.map(entry => ({
                          normalLoad: entry.normalLoad,
                          sampleType: entry.sampleType,
                          relativeCompaction: entry.sampleType === 'Remolded' ? entry.relativeCompaction : null
                        }))
                      };
                    });

                    setTestAssignments(updatedAssignments);
                    setDirectShearDetails(updatedDetails);
                    setShowDirectShearModal(false);
                    setDirectShearModalSampleIds([]);
                    setDirectShearModalError('');
                    resetDirectShearSets();

                    onChange({
                      ...data,
                      testAssignments: updatedAssignments,
                      rockDescriptions,
                      triaxialDetails,
                      directShearDetails: updatedDetails,
                      swellCollapseDetails,
                      consolidationDetails,
                      permeabilityDetails
                    });
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swell/Collapse potential modal */}
      {showSwellModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Swell/Collapse Potential details</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowSwellModal(false);
                  setSwellModalSampleIds([]);
                  setSwellModalError('');
                }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Inundation Load (psi)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={swellInundationLoad}
                    onChange={e => {
                      setSwellInundationLoad(e.target.value);
                      if (swellModalError) setSwellModalError('');
                    }}
                    placeholder="Enter inundation load"
                    min="0"
                    step="any"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label d-block">Sample Type</label>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="swellSampleType"
                      id="swell-undisturbed"
                      value="Undisturbed"
                      checked={swellSampleType === 'Undisturbed'}
                      onChange={e => {
                        setSwellSampleType(e.target.value);
                        setSwellRelativeCompaction('');
                        if (swellModalError) setSwellModalError('');
                      }}
                    />
                    <label className="form-check-label" htmlFor="swell-undisturbed">Undisturbed</label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="swellSampleType"
                      id="swell-remolded"
                      value="Remolded"
                      checked={swellSampleType === 'Remolded'}
                      onChange={e => {
                        setSwellSampleType(e.target.value);
                        if (swellModalError) setSwellModalError('');
                      }}
                    />
                    <label className="form-check-label" htmlFor="swell-remolded">Remolded</label>
                  </div>
                </div>
                {swellSampleType === 'Remolded' && (
                  <div className="mb-3">
                    <label className="form-label">Relative Compaction (nearest whole %)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={swellRelativeCompaction}
                      onChange={e => {
                        setSwellRelativeCompaction(e.target.value);
                        if (swellModalError) setSwellModalError('');
                      }}
                      placeholder="Enter relative compaction"
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                )}
                {swellModalError && <div className="text-danger mt-2">{swellModalError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowSwellModal(false);
                  setSwellModalSampleIds([]);
                  setSwellModalError('');
                  setSwellInundationLoad('');
                  setSwellSampleType('');
                  setSwellRelativeCompaction('');
                }}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!swellInundationLoad || Number(swellInundationLoad) <= 0) {
                      setSwellModalError('Inundation load must be a positive number.');
                      return;
                    }
                    if (!swellSampleType) {
                      setSwellModalError('Select sample type (Remolded or Undisturbed).');
                      return;
                    }
                    if (swellSampleType === 'Remolded') {
                      const compactionValue = Number(swellRelativeCompaction);
                      if (!swellRelativeCompaction || Number.isNaN(compactionValue) || compactionValue < 0 || compactionValue > 100) {
                        setSwellModalError('Enter relative compaction between 0 and 100.');
                        return;
                      }
                    }

                    const updatedAssignments = { ...testAssignments };
                    const updatedDetails = { ...swellCollapseDetails };

                    swellModalSampleIds.forEach(sampleId => {
                      const current = new Set(updatedAssignments[sampleId] || []);
                      current.add('Swell/Collapse Potential');
                      updatedAssignments[sampleId] = Array.from(current);

                      if (!updatedDetails[sampleId]) {
                        updatedDetails[sampleId] = {};
                      }
                      updatedDetails[sampleId]['Swell/Collapse Potential'] = {
                        inundationLoad: swellInundationLoad,
                        sampleType: swellSampleType,
                        relativeCompaction: swellSampleType === 'Remolded' ? swellRelativeCompaction : null
                      };
                    });

                    setTestAssignments(updatedAssignments);
                    setSwellCollapseDetails(updatedDetails);
                    setShowSwellModal(false);
                    setSwellModalSampleIds([]);
                    setSwellModalError('');
                    setSwellInundationLoad('');
                    setSwellSampleType('');
                    setSwellRelativeCompaction('');

                    onChange({
                      ...data,
                      testAssignments: updatedAssignments,
                      rockDescriptions,
                      triaxialDetails,
                      directShearDetails,
                      swellCollapseDetails: updatedDetails,
                      consolidationDetails,
                      permeabilityDetails
                    });
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consolidation modal */}
      {showConsolidationModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Consolidation details</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowConsolidationModal(false);
                  setConsolidationModalSampleIds([]);
                  setConsolidationModalError('');
                }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label d-block">Sample Type</label>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="consolidationSampleType"
                      id="consolidation-undisturbed"
                      value="Undisturbed"
                      checked={consolidationSampleType === 'Undisturbed'}
                      onChange={e => {
                        setConsolidationSampleType(e.target.value);
                        setConsolidationRelativeCompaction('');
                        if (consolidationModalError) setConsolidationModalError('');
                      }}
                    />
                    <label className="form-check-label" htmlFor="consolidation-undisturbed">Undisturbed</label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="consolidationSampleType"
                      id="consolidation-remolded"
                      value="Remolded"
                      checked={consolidationSampleType === 'Remolded'}
                      onChange={e => {
                        setConsolidationSampleType(e.target.value);
                        if (consolidationModalError) setConsolidationModalError('');
                      }}
                    />
                    <label className="form-check-label" htmlFor="consolidation-remolded">Remolded</label>
                  </div>
                </div>
                {consolidationSampleType === 'Remolded' && (
                  <div className="mb-3">
                    <label className="form-label">Relative Compaction (nearest whole %)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={consolidationRelativeCompaction}
                      onChange={e => {
                        setConsolidationRelativeCompaction(e.target.value);
                        if (consolidationModalError) setConsolidationModalError('');
                      }}
                      placeholder="Enter relative compaction"
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                )}
                {consolidationModalError && <div className="text-danger mt-2">{consolidationModalError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowConsolidationModal(false);
                  setConsolidationModalSampleIds([]);
                  setConsolidationModalError('');
                  setConsolidationSampleType('');
                  setConsolidationRelativeCompaction('');
                }}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!consolidationSampleType) {
                      setConsolidationModalError('Select sample type (Remolded or Undisturbed).');
                      return;
                    }
                    if (consolidationSampleType === 'Remolded') {
                      const compactionValue = Number(consolidationRelativeCompaction);
                      if (!consolidationRelativeCompaction || Number.isNaN(compactionValue) || compactionValue < 0 || compactionValue > 100) {
                        setConsolidationModalError('Enter relative compaction between 0 and 100.');
                        return;
                      }
                    }

                    const updatedAssignments = { ...testAssignments };
                    const updatedDetails = { ...consolidationDetails };

                    consolidationModalSampleIds.forEach(sampleId => {
                      const current = new Set(updatedAssignments[sampleId] || []);
                      current.add('Consolidation');
                      updatedAssignments[sampleId] = Array.from(current);

                      if (!updatedDetails[sampleId]) {
                        updatedDetails[sampleId] = {};
                      }
                      updatedDetails[sampleId]['Consolidation'] = {
                        sampleType: consolidationSampleType,
                        relativeCompaction: consolidationSampleType === 'Remolded' ? consolidationRelativeCompaction : null
                      };
                    });

                    setTestAssignments(updatedAssignments);
                    setConsolidationDetails(updatedDetails);
                    setShowConsolidationModal(false);
                    setConsolidationModalSampleIds([]);
                    setConsolidationModalError('');
                    setConsolidationSampleType('');
                    setConsolidationRelativeCompaction('');

                    onChange({
                      ...data,
                      testAssignments: updatedAssignments,
                      rockDescriptions,
                      triaxialDetails,
                      directShearDetails,
                      swellCollapseDetails,
                      consolidationDetails: updatedDetails,
                      permeabilityDetails
                    });
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TestsInfo;
