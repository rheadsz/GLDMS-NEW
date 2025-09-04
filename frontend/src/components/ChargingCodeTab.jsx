import React from "react";

function ChargingCodeTab({ selectedRequest }) {
  return (
    <div className="text-muted">
      Charging Code: {selectedRequest.ChargingCode || "—"}
    </div>
  );
}

export default ChargingCodeTab;
