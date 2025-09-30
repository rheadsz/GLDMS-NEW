import React from "react";

export default function SamplesDetails({
  // List + details mode
  samples = [],                 // array of sample objects
  selectedSample,               // selected sample object
  onSelectSample = () => {},    // row click handler
  sidebarOpen = true,           // from global hamburger

  // (Optional) details-only fallback
  sample,
}) {
  const SIDEBAR_OPEN_PX = 640;
  const SIDEBAR_CLOSED_PX = 0;

  const active = selectedSample || sample || null;

  const statusTextClass = (status) => {
    if (!status) return "text-muted";
    const s = String(status).toLowerCase();
    if (["not received", "rejected"].includes(s)) return "text-danger";
    if (["accepted", "completed", "complete"].includes(s)) return "text-success";
    return "text-primary";
  };

  return (
    <div className="lm-main">
      <style>{`
        .lm-sidebar {
          width: ${sidebarOpen ? `${SIDEBAR_OPEN_PX}px` : `${SIDEBAR_CLOSED_PX}px`};
          transition: width 240ms ease;
          overflow: hidden;
          border-right: 1px solid var(--bs-border-color, #dee2e6);
          background: var(--bs-light);
        }
        .lm-content { flex: 1 1 auto; min-width: 0; }
        .lm-sticky-head { position: sticky; top: 0; z-index: 1; background: #fff; }
        .tbl-samples { table-layout: fixed; }
        .tbl-samples th, .tbl-samples td {
          padding: 10px 12px !important; vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mono {
          font-variant-numeric: tabular-nums;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .linklike { color: var(--bs-primary); text-decoration: none; }
        .linklike:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          .lm-sidebar { position: absolute; z-index: 1040; height: calc(100% - 52px); }
          .lm-content { flex-basis: 100%; }
        }
      `}</style>

      {/* LEFT: structure-only table with four columns */}
      <aside className="lm-sidebar d-flex flex-column">
        <div className="lm-sticky-head p-3 border-bottom bg-white">
          <h6 className="m-0">Samples</h6>
        </div>

        <div className="flex-grow-1 overflow-auto">
          <table className="table table-sm table-hover table-striped mb-0 align-middle tbl-samples">
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <thead className="table-light sticky-top" style={{ top: 0 }}>
              <tr>
                <th className="text-start">Sample ID</th>
                <th className="text-start">Project ID</th>
                <th className="text-start">Submitter</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {samples.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted text-center py-4">
                    No samples.
                  </td>
                </tr>
              ) : (
                samples.map((s) => {
                  const key = s.SampleID ?? `${s.EfisProjectId}-${s.CreatedBy}`;
                  const isActive =
                    (selectedSample?.SampleID ?? selectedSample?.id) ===
                    (s.SampleID ?? s.id);

                  return (
                    <tr
                      key={key}
                      className={isActive ? "table-primary" : ""}
                      style={{ cursor: "pointer" }}
                      onClick={() => onSelectSample(s)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectSample(s);
                        }
                      }}
                      aria-selected={isActive}
                    >
                      <td className="mono text-start">
                        <span className="linklike">{s.SampleID ?? "—"}</span>
                      </td>
                      <td className="mono text-start">{s.EfisProjectId ?? "—"}</td>
                      <td className="text-start">{s.CreatedBy ?? "—"}</td>
                      <td className={`text-center ${statusTextClass(s.Status)}`}>
                        {s.Status ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </aside>

      {/* RIGHT: minimal details (same four fields) */}
      <section className="lm-content">
        <div className="p-4 h-100 overflow-auto">
          {!active ? (
            <div className="text-muted">Select a sample to view its details.</div>
          ) : (
            <div>
              <h5 className="mb-3">Sample Details</h5>
              <div className="table-responsive">
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th style={{ width: 220 }}>Sample ID</th>
                      <td className="mono">{active.SampleID ?? "—"}</td>
                    </tr>
                    <tr>
                      <th>Project ID</th>
                      <td className="mono">{active.EfisProjectId ?? "—"}</td>
                    </tr>
                    <tr>
                      <th>Submitter</th>
                      <td>{active.CreatedBy ?? "—"}</td>
                    </tr>
                    <tr>
                      <th>Status</th>
                      <td className={statusTextClass(active.Status)}>{active.Status ?? "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
