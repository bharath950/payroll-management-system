import React from "react";
import SalaryDetails from "./SalaryDetails";
import StatusMessage from "./StatusMessage";

export default function EmployeeSlipPage({
  employeeCode,
  payrollMonth,
  employeeStatus,
  employeeData,
  salaryData,
  isDownloadingPdf,
  onBack,
  onPreviewPdf,
  onDownloadPdf
}) {
  return (
    <div className="details-page">
      <div className="details-header">
        <button className="ghost-button" type="button" onClick={onBack}>
          Back to Search
        </button>
        <div className="details-header-copy">
          <p className="eyebrow">Employee Salary Details</p>
          <h1>
            {employeeCode} <span>{payrollMonth}</span>
          </h1>
          <p>
            Review the salary breakdown on a dedicated page and then preview or download the
            salary slip PDF.
          </p>
        </div>
      </div>

      <div className="details-card">
        <StatusMessage type={employeeStatus.type} message={employeeStatus.message} />
        <SalaryDetails data={salaryData} employee={employeeData} />

        {salaryData ? (
          <div className="action-row">
            <button className="secondary-button" type="button" onClick={onPreviewPdf}>
              Preview PDF
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? "Preparing PDF..." : "Download Salary Slip PDF"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

