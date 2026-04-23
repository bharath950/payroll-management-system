import React, { useEffect, useState } from "react";
import api from "./api/client";
import StatusMessage from "./components/StatusMessage";
import EmployeeSlipPage from "./components/EmployeeSlipPage";
import companyLogo from "./assets/inserva-logo.png";

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
  const initialEmployeeView = getEmployeeViewState();
  const [currentView, setCurrentView] = useState(initialEmployeeView.view);
  const [employeeCode, setEmployeeCode] = useState(initialEmployeeView.code);
  const [payrollMonth, setPayrollMonth] = useState(initialEmployeeView.month);
  const [salaryData, setSalaryData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [employeeStatus, setEmployeeStatus] = useState({ type: "info", message: "" });
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [enquiryForm, setEnquiryForm] = useState({ name: "", phone: "", email: "" });
  const [enquiryStatus, setEnquiryStatus] = useState({ type: "info", message: "" });
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

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

  async function handleSearch(event) {
    event.preventDefault();

    if (!employeeCode || !payrollMonth) {
      setEmployeeStatus({ type: "error", message: "Please enter Employee ID and select Month" });
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

  async function handleEnquirySubmit() {
    if (!enquiryForm.name || !enquiryForm.phone || !enquiryForm.email) {
      setEnquiryStatus({ type: "error", message: "Please fill all details" });
      return;
    }

    setIsSubmittingEnquiry(true);
    setEnquiryStatus({ type: "info", message: "Submitting details..." });

    try {
      await api.post("/enquiry", enquiryForm);
      setEnquiryStatus({ type: "success", message: "Details submitted successfully" });
      setEnquiryForm({ name: "", phone: "", email: "" });
    } catch (error) {
      setEnquiryStatus({
        type: "error",
        message: error.response?.data?.message || "Error submitting details"
      });
    } finally {
      setIsSubmittingEnquiry(false);
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
    <div className="classic-page">
      <header>
        <div className="header-brand">
          <img src={companyLogo} alt="Inserva Logo" />
          
        </div>
        <nav>
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#salary">Salary Slip</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="hero-content">
          <h1>Trusted Manpower Solutions</h1>
          <p>Providing Skilled &amp; Unskilled Workforce with Safety &amp; Trust</p>
          <a href="#contact" className="btn">
            Contact Us
          </a>
        </div>
      </section>

      <section id="about" className="about">
        <div className="about-text">
          <h2>About Us</h2>
          <p>
            <strong>Inserva Enterprises LLP</strong> is a professional manpower solutions provider
            delivering reliable and compliant workforce services across industrial sectors. With
            200+ employees across multiple plant locations, we support large-scale operations with
            efficiency and discipline.
          </p>

          <p>Our expertise spans across multiple workforce categories:</p>

          <ul className="about-list">
            <li>
              <strong>Technical Roles:</strong> CNC operators, welders, machinists, brazing
              gunners, and ITI/polytechnic-trained technicians.
            </li>
            <li>
              <strong>Quality &amp; Maintenance:</strong> Quality controllers, inspectors, and
              maintenance engineers ensuring consistency and reduced downtime.
            </li>
            <li>
              <strong>Supervision &amp; Engineering:</strong> Production planners and engineers
              optimizing workflows.
            </li>
            <li>
              <strong>Adaptability:</strong> Workforce trained to work with advanced robotics and
              automated systems.
            </li>
          </ul>

          <p>
            We maintain strict compliance with <strong>PF, ESI, and labour regulations</strong>,
            while ensuring employee welfare through safe working environments and hostel facilities.
            We are currently working as a client partner for Amber Enterprises India Limited across
            two plants with around 200+ members.
          </p>

          <a href="#contact" className="btn">
            Get in Touch
          </a>
        </div>

        <div className="about-image">
          <img
            src="https://images.unsplash.com/photo-1581090700227-1e8a3f41a1d6?auto=format&fit=crop&w=1200&q=80"
            alt="Workforce Image"
          />

          <div className="workforce-box">
            <h3>200+</h3>
            <p>Active Workforce</p>
          </div>
        </div>
      </section>

      <section id="services">
        <h2 className="section-title">Our Services</h2>
        <div className="services">
          <div className="card">Manpower Supply</div>
          <div className="card">Skilled Labour Hiring</div>
          <div className="card">Unskilled Labour</div>
          <div className="card">PF &amp; ESI Management</div>
          <div className="card">Hostel Facility</div>
        </div>
      </section>

      <section id="salary" className="salary">
        <h2>Download Salary Slip</h2>

        <div className="salary-box">
          <div className="salary-field">
            <label>Employee ID</label>
            <input
              type="text"
              placeholder="Enter Employee ID"
              id="empId"
              value={employeeCode}
              onChange={(event) => setEmployeeCode(event.target.value)}
            />
          </div>

          <div className="salary-field">
            <label>Month</label>
            <input
              type="month"
              id="month"
              value={payrollMonth}
              onChange={(event) => setPayrollMonth(event.target.value)}
            />
          </div>

          <button className="btn salary-btn" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Fetching..." : "Fetch Details"}
          </button>

          <StatusMessage type={employeeStatus.type} message={employeeStatus.message} />
        </div>
      </section>

      <section id="contact" className="contact-section">
        <h2>Contact Us</h2>
        <p>Email: inservaenterprisesllp@gmail.com</p>
        <p>Phone: 9063338875 / 7815844141</p>

        <div className="contact-box">
          <h3>New Employee Enquiry</h3>

          <input
            type="text"
            id="name"
            placeholder="Full Name"
            value={enquiryForm.name}
            onChange={(event) =>
              setEnquiryForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <input
            type="text"
            id="phone"
            placeholder="Phone Number"
            value={enquiryForm.phone}
            onChange={(event) =>
              setEnquiryForm((current) => ({ ...current, phone: event.target.value }))
            }
          />
          <input
            type="email"
            id="email"
            placeholder="Email"
            value={enquiryForm.email}
            onChange={(event) =>
              setEnquiryForm((current) => ({ ...current, email: event.target.value }))
            }
          />

          <button className="btn contact-btn" onClick={handleEnquirySubmit} disabled={isSubmittingEnquiry}>
            {isSubmittingEnquiry ? "Submitting..." : "Submit"}
          </button>

          <StatusMessage type={enquiryStatus.type} message={enquiryStatus.message} />
        </div>
      </section>

      <footer>
        <p>{"\u00A9 2026 Inserva Enterprises LLP | All Rights Reserved"}</p>
      </footer>
    </div>
  );
}

