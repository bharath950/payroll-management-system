import React from "react";

function formatCurrency(value) {
  return Number(value).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  });
}

export default function SalaryDetails({ data, employee }) {
  if (!data && !employee) return null;

  const payrollMonth = data ? `${data.year}-${String(data.month).padStart(2, "0")}` : "-";
  const displayEmployee = employee || data;

  if (!displayEmployee) return null;

  return (
    <div className="salary-details">
      <div className="summary-grid">
        <div>
          <span>Employee</span>
          <strong>{displayEmployee.name}</strong>
        </div>
        <div>
          <span>Employee Code</span>
          <strong>{displayEmployee.employee_code}</strong>
        </div>
        <div>
          <span>Department</span>
          <strong>{displayEmployee.department || "-"}</strong>
        </div>
        <div>
          <span>Designation</span>
          <strong>{displayEmployee.designation || "-"}</strong>
        </div>
        <div>
          <span>Payroll Month</span>
          <strong>{payrollMonth}</strong>
        </div>
        <div>
          <span>Net Salary</span>
          <strong>{data ? formatCurrency(data.net_salary) : "-"}</strong>
        </div>
      </div>

      {data ? (
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic</td>
              <td>{formatCurrency(data.basic)}</td>
            </tr>
            <tr>
              <td>HRA</td>
              <td>{formatCurrency(data.hra)}</td>
            </tr>
            <tr>
              <td>Allowances</td>
              <td>{formatCurrency(data.allowances)}</td>
            </tr>
            <tr>
              <td>Deductions</td>
              <td>{formatCurrency(data.deductions)}</td>
            </tr>
            <tr className="net-row">
              <td>Net Salary</td>
              <td>{formatCurrency(data.net_salary)}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <div className="empty-state-panel">
          Salary record is not available for the selected month yet.
        </div>
      )}
    </div>
  );
}
