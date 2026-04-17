import React, { useEffect, useState } from "react";
import api, { getAdminToken, setAdminToken } from "./api/client";
import SectionCard from "./components/SectionCard";
import StatusMessage from "./components/StatusMessage";
import UploadLogTable from "./components/UploadLogTable";
import SalaryDetails from "./components/SalaryDetails";
import EmployeeSlipPage from "./components/EmployeeSlipPage";

function getEmployeeViewState() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const code = params.get("code") || "";
  const month = params.get("month") || "";

  return {
    view: view === "employee-slip" ? "employee-slip" : "home",
    code,
    month
  };
}

export default function App() {
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [adminUser, setAdminUser] = useState(null);
  const [adminStatus, setAdminStatus] = useState({ type: "info", message: "" });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ type: "info", message: "" });
  const [uploadLog, setUploadLog] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);

  const initialEmployeeView = getEmployeeViewState();
  const [currentView, setCurrentView] = useState(initialEmployeeView.view);
  const [employeeCode, setEmployeeCode] = useState(initialEmployeeView.code);
  const [payrollMonth, setPayrollMonth] = useState(initialEmployeeView.month);
  const [salaryData, setSalaryData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [employeeStatus, setEmployeeStatus] = useState({ type: "info", message: "" });
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    hydrateAdminSession();
  }, []);

  useEffect(() => {
    function handlePopState() {
      const state = getEmployeeViewState();
      setCurrentView(state.view);
      setEmployeeCode(state.code);
      setPayrollMonth(state.month);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (currentView === "employee-slip" && employeeCode && payrollMonth) {
      fetchEmployeeSalary(employeeCode, payrollMonth, { navigateOnSuccess: false });
    }
  }, [currentView, employeeCode, payrollMonth]);

  async function hydrateAdminSession() {
    if (!getAdminToken()) return;

    try {
      const { data } = await api.get("/auth/me");
      setAdminUser(data.admin);
      setAdminStatus({ type: "success", message: `Signed in as ${data.admin.username}` });
      fetchUploadLogs();
    } catch {
      setAdminToken(null);
      setAdminUser(null);
    }
  }

  async function fetchUploadLogs() {
    try {
      const { data } = await api.get("/upload-logs?limit=5");
      setRecentLogs(data);
    } catch {
      setRecentLogs([]);
    }
  }

  async function handleAdminLogin(event) {
    event.preventDefault();

    setIsAuthenticating(true);
    setAdminStatus({ type: "info", message: "Signing in..." });

    try {
      const { data } = await api.post("/auth/login", adminCredentials);
      setAdminToken(data.token);
      setAdminUser(data.admin);
      setAdminStatus({ type: "success", message: `Signed in as ${data.admin.username}` });
      setAdminCredentials({ username: data.admin.username, password: "" });
      fetchUploadLogs();
    } catch (error) {
      setAdminStatus({
        type: "error",
        message: error.response?.data?.message || "Unable to sign in."
      });
    } finally {
      setIsAuthenticating(false);
    }
  }

  function handleAdminLogout() {
    setAdminToken(null);
    setAdminUser(null);
    setRecentLogs([]);
    setUploadLog(null);
    setUploadFile(null);
    setAdminStatus({ type: "info", message: "Signed out." });
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!uploadFile) {
      setUploadStatus({ type: "error", message: "Please choose an .xlsx file to upload." });
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);

    setIsUploading(true);
    setUploadStatus({ type: "info", message: "Uploading and processing salary data..." });
    setUploadLog(null);

    try {
      const { data } = await api.post("/upload-salary", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadLog(data.log);
      setUploadStatus({ type: "success", message: data.message });
      setUploadFile(null);
      fetchUploadLogs();
    } catch (error) {
      setUploadStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Upload failed. Please check your session and try again."
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();

    if (!employeeCode || !payrollMonth) {
      setEmployeeStatus({ type: "error", message: "Employee code and month are required." });
      return;
    }

    await fetchEmployeeSalary(employeeCode, payrollMonth, { navigateOnSuccess: true });
  }

  async function fetchEmployeeSalary(code, month, options = {}) {
    const { navigateOnSuccess = false } = options;

    setIsSearching(true);
    setEmployeeStatus({ type: "info", message: "Fetching salary record..." });
    setSalaryData(null);
    setEmployeeData(null);

    try {
      const normalizedCode = code.trim().toUpperCase();
      const [employeeResponse, salaryResponse] = await Promise.allSettled([
        api.get(`/employee/${normalizedCode}`),
        api.get(`/salary/${normalizedCode}/${month}`)
      ]);

      if (employeeResponse.status === "fulfilled") {
        setEmployeeData(employeeResponse.value.data);
      }

      if (salaryResponse.status === "fulfilled") {
        setSalaryData(salaryResponse.value.data);
        setEmployeeStatus({ type: "success", message: "Salary record found." });
        if (navigateOnSuccess) {
          const params = new URLSearchParams({
            view: "employee-slip",
            code: normalizedCode,
            month
          });
          window.history.pushState({}, "", `?${params.toString()}`);
          setCurrentView("employee-slip");
          setEmployeeCode(normalizedCode);
          setPayrollMonth(month);
        }
        return;
      }

      if (employeeResponse.status === "fulfilled") {
        setEmployeeStatus({
          type: "error",
          message:
            salaryResponse.reason?.response?.data?.message ||
            "Employee found, but no salary record exists for the selected month."
        });
        return;
      }

      setEmployeeStatus({
        type: "error",
        message:
          salaryResponse.reason?.response?.data?.message ||
          employeeResponse.reason?.response?.data?.message ||
          "Unable to fetch salary details."
      });
    } catch (error) {
      setEmployeeStatus({
        type: "error",
        message: error.response?.data?.message || "Unable to fetch salary details."
      });
    } finally {
      setIsSearching(false);
    }
  }

  async function fetchPdfBlob() {
    const normalizedCode = employeeCode.trim().toUpperCase();

    const response = await api.get(`/salary-slip/${normalizedCode}/${payrollMonth}`, {
      responseType: "blob"
    });

    return response.data;
  }

  async function handlePreviewPdf() {
    try {
      setIsDownloadingPdf(true);
      const pdfBlob = await fetchPdfBlob();
      const fileUrl = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
    } catch (error) {
      setEmployeeStatus({
        type: "error",
        message: error.response?.data?.message || "Unable to preview salary slip PDF."
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      setIsDownloadingPdf(true);
      const normalizedCode = employeeCode.trim().toUpperCase();
      const pdfBlob = await fetchPdfBlob();
      const fileUrl = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = `${normalizedCode}-${payrollMonth}-salary-slip.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      setEmployeeStatus({
        type: "error",
        message: error.response?.data?.message || "Unable to download salary slip PDF."
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  function handleBackToSearch() {
    window.history.pushState({}, "", window.location.pathname);
    setCurrentView("home");
  }

  if (currentView === "employee-slip") {
    return (
      <div className="app-shell">
        <EmployeeSlipPage
          employeeCode={employeeCode}
          payrollMonth={payrollMonth}
          employeeStatus={employeeStatus}
          employeeData={employeeData}
          salaryData={salaryData}
          isDownloadingPdf={isDownloadingPdf}
          onBack={handleBackToSearch}
          onPreviewPdf={handlePreviewPdf}
          onDownloadPdf={handleDownloadPdf}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">Payroll Management System</p>
          <h1>Salary operations for high-volume workforce teams.</h1>
          <p className="hero-copy">
            Upload monthly payroll in Excel, store salary history securely, and let employees
            retrieve salary slips instantly with their employee code.
          </p>
        </div>
        <div className="hero-panel">
          <div className="hero-stat">
            <span>Protected Admin Area</span>
            <strong>JWT Login</strong>
          </div>
          <div className="hero-stat">
            <span>Employee Access</span>
            <strong>Self-Service Search</strong>
          </div>
          <div className="hero-stat">
            <span>Slip Delivery</span>
            <strong>Instant PDF</strong>
          </div>
        </div>
      </header>

      <main className="main-grid">
        <SectionCard
          title="Admin Workspace"
          subtitle="Sign in to upload payroll sheets and review recent processing activity."
        >
          {!adminUser ? (
            <>
              <form className="stack" onSubmit={handleAdminLogin}>
                <label className="field">
                  <span>Admin Username</span>
                  <input
                    type="text"
                    placeholder="admin"
                    value={adminCredentials.username}
                    onChange={(event) =>
                      setAdminCredentials((current) => ({
                        ...current,
                        username: event.target.value
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    placeholder="Enter admin password"
                    value={adminCredentials.password}
                    onChange={(event) =>
                      setAdminCredentials((current) => ({
                        ...current,
                        password: event.target.value
                      }))
                    }
                  />
                </label>

                <button className="primary-button" type="submit" disabled={isAuthenticating}>
                  {isAuthenticating ? "Signing In..." : "Sign In to Admin Workspace"}
                </button>
              </form>
              <StatusMessage type={adminStatus.type} message={adminStatus.message} />
            </>
          ) : (
            <>
              <div className="admin-toolbar">
                <div>
                  <p className="admin-label">Signed in</p>
                  <strong>{adminUser.username}</strong>
                </div>
                <button className="ghost-button" type="button" onClick={handleAdminLogout}>
                  Sign Out
                </button>
              </div>

              <form className="stack" onSubmit={handleUpload}>
                <label className="field">
                  <span>Salary Excel File</span>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  />
                </label>

                <button className="primary-button" type="submit" disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Upload Salary Sheet"}
                </button>
              </form>

              <StatusMessage type={uploadStatus.type} message={uploadStatus.message} />
              <UploadLogTable log={uploadLog} />
              {recentLogs.length > 0 ? (
                <div className="recent-logs">
                  <h3>Recent Uploads</h3>
                  <div className="recent-log-list">
                    {recentLogs.map((logItem) => (
                      <div className="recent-log-item" key={logItem.id}>
                        <strong>{logItem.file_name}</strong>
                        <span>
                          {logItem.success_count} success / {logItem.failure_count} failed
                        </span>
                        <span>{new Date(logItem.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state-panel">No upload history yet.</div>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard
          title="Employee Portal"
          subtitle="Search with employee code and payroll month to view salary details and download a PDF slip."
        >
          <form className="stack" onSubmit={handleSearch}>
            <label className="field">
              <span>Employee Code</span>
              <input
                type="text"
                placeholder="EMP001"
                value={employeeCode}
                onChange={(event) => setEmployeeCode(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Month</span>
              <input
                type="month"
                value={payrollMonth}
                onChange={(event) => setPayrollMonth(event.target.value)}
              />
            </label>

            <button className="primary-button" type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Fetch Salary Details"}
            </button>
          </form>

          <StatusMessage type={employeeStatus.type} message={employeeStatus.message} />
          <SalaryDetails data={salaryData} employee={employeeData} />
        </SectionCard>
      </main>
    </div>
  );
}
