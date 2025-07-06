import React from 'react';
import { useNavigate } from 'react-router-dom';

const SupervisorMenu = () => {
  const navigate = useNavigate();

  const handleManageRequests = () => {
    navigate('/manage-requests');
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-lg p-4 d-flex align-items-center" style={{ width: 350, borderRadius: 16 }}>
        
        <button
          className="btn btn-primary w-100"
          style={{ height: 48 }}
          onClick={handleManageRequests}
        >
          Manage Requests
        </button>
      </div>
    </div>
  );
};

export default SupervisorMenu; 