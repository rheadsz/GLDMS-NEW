import React from "react";

function TestsInfo({ data, onChange, testTypes = [], numSamples = 2 }) {
  // Helper to handle changes for a specific test
  const handleTestDetailChange = (index, field, value) => {
    const updated = [...(data.selectedTestDetails || testTypes.map(test => ({
      testTypeId: test.id,
      method: test.methods && test.methods.length > 0 ? test.methods[0] : '',
      sampleNumber: 1,
      quantity: 1,
      selected: false
    })))];
    updated[index][field] = value;
    onChange({ ...data, selectedTestDetails: updated });
  };

  const handleToggleTestSelection = (index) => {
    const updated = [...(data.selectedTestDetails || testTypes.map(test => ({
      testTypeId: test.id,
      method: test.methods && test.methods.length > 0 ? test.methods[0] : '',
      sampleNumber: 1,
      quantity: 1,
      selected: false
    })))];
    updated[index].selected = !updated[index].selected;
    onChange({ ...data, selectedTestDetails: updated });
  };

  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold">Tests</div>
      <div className="card-body pb-2">
        <div className="table-responsive mb-3">
          <table className="table table-bordered align-middle small">
            <thead className="table-light">
              <tr>
                <th>Test Name</th>
                <th>Method</th>
                <th>Sample</th>
              </tr>
            </thead>
            <tbody>
              {testTypes.map((test, index) => {
                const testDetail = (data.selectedTestDetails && data.selectedTestDetails[index]) || {
                  testTypeId: test.id,
                  method: test.methods && test.methods.length > 0 ? test.methods[0] : '',
                  sampleNumber: 1,
                  quantity: 1,
                  selected: false
                };
                return (
                  <tr key={index}>
                    <td>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={testDetail.selected}
                          onChange={() => handleToggleTestSelection(index)}
                          id={`test-select-${test.id}`}
                        />
                        <label className="form-check-label" htmlFor={`test-select-${test.id}`}>
                          {test.name}
                        </label>
                      </div>
                    </td>
                    <td>
                      {test.methods && test.methods.length === 1 ? (
                        // If there's only one method, show it as text
                        <div className={`form-control-plaintext form-control-sm ${!testDetail.selected ? 'text-muted' : ''}`}>
                          {test.methods[0]}
                        </div>
                      ) : (
                        // Otherwise show dropdown for multiple methods
                        <select
                          className="form-select form-select-sm"
                          value={testDetail.method}
                          onChange={e => handleTestDetailChange(index, 'method', e.target.value)}
                          disabled={!testDetail.selected}
                        >
                          {test.methods && test.methods.map((method, i) => (
                            <option key={i} value={method}>{method}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={testDetail.sampleNumber}
                        onChange={e => handleTestDetailChange(index, 'sampleNumber', parseInt(e.target.value))}
                        disabled={!testDetail.selected}
                      >
                        {[...Array(numSamples)].map((_, n) => (
                          <option key={n} value={n+1}>Sample {n + 1}</option>
                        ))}
                      </select>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TestsInfo; 