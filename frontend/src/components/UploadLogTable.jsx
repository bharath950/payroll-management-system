import React from "react";

export default function UploadLogTable({ log }) {
  if (!log) return null;

  return (
    <div className="log-card">
      <div className="log-grid">
        <div>
          <span>File</span>
          <strong>{log.file_name}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{log.status}</strong>
        </div>
        <div>
          <span>Total Rows</span>
          <strong>{log.total_rows}</strong>
        </div>
        <div>
          <span>Success</span>
          <strong>{log.success_count}</strong>
        </div>
        <div>
          <span>Failures</span>
          <strong>{log.failure_count}</strong>
        </div>
        <div>
          <span>Uploaded At</span>
          <strong>{new Date(log.created_at).toLocaleString()}</strong>
        </div>
      </div>

      {Array.isArray(log.error_summary) && log.error_summary.length > 0 ? (
        <div className="error-table-wrap">
          <h3>Row Errors</h3>
          <table>
            <thead>
              <tr>
                <th>Row</th>
                <th>Employee Code</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              {log.error_summary.map((error) => (
                <tr key={`${error.rowNumber}-${error.employeeCode || "na"}`}>
                  <td>{error.rowNumber}</td>
                  <td>{error.employeeCode || "-"}</td>
                  <td>{error.errors.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
