import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
const API_URL = `${API_BASE_URL.replace(/\/$/, "")}/api/visitors/`;

const emptyForm = {
  full_name: "",
  email: "",
  mobile: "",
  company_name: "",
  purpose: "",
  plant: "Plant 1",
  employee_name: "",
  visit_date: "",
  visit_time: "",
};

export default function Dashboard() {
  const [form, setForm] = useState(emptyForm);
  const [visitors, setVisitors] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    return {
      scheduled: visitors.filter((visitor) => visitor.status === "Scheduled").length,
      checkedIn: visitors.filter((visitor) => visitor.status === "Checked In").length,
      checkedOut: visitors.filter((visitor) => visitor.status === "Checked Out").length,
    };
  }, [visitors]);

  const loadVisitors = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Unable to load visitors");
      }
      setVisitors(await response.json());
    } catch (error) {
      setMessage("Backend is not reachable. Start Django on port 8000.");
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const scheduleVisitor = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Visitor could not be scheduled");
      }

      setForm(emptyForm);
      setMessage("Visitor scheduled. Security can check in at the gate.");
      await loadVisitors();
    } catch (error) {
      setMessage("Please check the visitor details and backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const updateVisitStatus = async (visitorId, action) => {
    setMessage("");
    try {
      const response = await fetch(`${API_URL}${visitorId}/${action}/`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Status update failed");
      }
      await loadVisitors();
    } catch (error) {
      setMessage("Could not update visitor status.");
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Three plant access desk</p>
          <h1>Visitor Management System</h1>
        </div>
        <button type="button" onClick={loadVisitors}>
          Refresh
        </button>
      </header>

      <section className="stats-grid">
        <article>
          <span>Scheduled</span>
          <strong>{stats.scheduled}</strong>
        </article>
        <article>
          <span>Inside plant</span>
          <strong>{stats.checkedIn}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>{stats.checkedOut}</strong>
        </article>
      </section>

      <section className="workspace">
        <form className="visitor-form" onSubmit={scheduleVisitor}>
          <h2>Schedule visitor</h2>
          <label>
            Full name
            <input name="full_name" value={form.full_name} onChange={updateField} required />
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={updateField} required />
          </label>
          <label>
            Mobile
            <input name="mobile" value={form.mobile} onChange={updateField} required />
          </label>
          <label>
            Company
            <input name="company_name" value={form.company_name} onChange={updateField} required />
          </label>
          <label>
            Purpose
            <textarea name="purpose" value={form.purpose} onChange={updateField} required />
          </label>
          <label>
            Plant
            <select name="plant" value={form.plant} onChange={updateField}>
              <option>Plant 1</option>
              <option>Plant 2</option>
              <option>Plant 3</option>
            </select>
          </label>
          <label>
            Employee to meet
            <input name="employee_name" value={form.employee_name} onChange={updateField} required />
          </label>
          <div className="two-column">
            <label>
              Visit date
              <input type="date" name="visit_date" value={form.visit_date} onChange={updateField} required />
            </label>
            <label>
              Visit time
              <input type="time" name="visit_time" value={form.visit_time} onChange={updateField} required />
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Scheduling..." : "Schedule visitor"}
          </button>
          {message && <p className="status-message">{message}</p>}
        </form>

        <section className="visitor-list">
          <h2>Gate register</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Plant</th>
                  <th>Host</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Gate action</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((visitor) => (
                  <tr key={visitor.id}>
                    <td>
                      <strong>{visitor.full_name}</strong>
                      <span>{visitor.company_name}</span>
                    </td>
                    <td>{visitor.plant}</td>
                    <td>{visitor.employee_name}</td>
                    <td>
                      {visitor.visit_date} {visitor.visit_time}
                    </td>
                    <td>
                      <span className="pill">{visitor.status}</span>
                    </td>
                    <td className="actions">
                      <button type="button" onClick={() => updateVisitStatus(visitor.id, "check-in")}>
                        Check in
                      </button>
                      <button type="button" onClick={() => updateVisitStatus(visitor.id, "check-out")}>
                        Check out
                      </button>
                    </td>
                  </tr>
                ))}
                {visitors.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No visitors scheduled yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
