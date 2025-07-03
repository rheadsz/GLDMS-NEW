import React, { useEffect, useState } from "react";

function DummyTab() {
  const [testTypes, setTestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch test types from backend API
  useEffect(() => {
    fetch("http://localhost:3001/api/test-types")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setTestTypes(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Show loading, error, or data
  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;

  return (
    <div>
      <h2 className="h4 mb-3">Test Types</h2>
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Table Name</th>
            <th>Abbreviation</th>
            <th>Method</th>
          </tr>
        </thead>
        <tbody>
          {testTypes.map((type) => (
            <tr key={type.TestTypeID}>
              <td>{type.TestTypeID}</td>
              <td>{type.TestName}</td>
              <td>{type.TableName}</td>
              <td>{type.Abbreviation}</td>
              <td>{type.Method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DummyTab; 

