import React from "react";

function SamplesTab({ selectedRequest }) {
  return (
    <div>
      <h5>Requested Tests</h5>
      <div style={{ overflowX: "auto" }}>
        <table className="table table-bordered table-sm">
          <thead className="table-light">
            <tr>
              <th>Sample #</th>
              <th>Borehole ID</th>
              <th>Depth</th>
              <th>Test</th>
              {/* <th>Qty</th> */}
              <th>Sample Type</th>
              <th>Assign To</th>
              {/* <th>Due Date</th> */}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(selectedRequest.details || []).map((d, idx) => (
              <tr key={idx}>
                <td>{d.SampleNumber}</td>
                <td>{d.BoreholeID}</td>
                <td>{d.DepthFrom} - {d.DepthTo}</td>
                <td>{d.TestTypeName || `ID ${d.TestTypeID}`}</td>
                {/* <td>{d.Quantity}</td> */}
                <td>{d.TubeJar}</td>
                <td><input type="text" className="form-control form-control-sm" placeholder="Staff name" /></td>
                {/* <><input type="date" className="form-control form-control-sm" /></>td */}
                <td><button className="btn btn-sm btn-outline-primary">Assign</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SamplesTab;
