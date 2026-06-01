import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Visitor Management System</p>
        <h1>Gate-ready visitor scheduling</h1>
        <p>
          Register a visitor for any of the three plants, then let security
          check them in directly at the gate without an approval step.
        </p>
        <Link className="primary-link" to="/dashboard">
          Open dashboard
        </Link>
      </section>
    </div>
  );
}
