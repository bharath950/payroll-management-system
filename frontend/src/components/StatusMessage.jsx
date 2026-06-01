import React from "react";

export default function StatusMessage({ type = "info", message }) {
  if (!message) return null;

  return <div className={`status-message ${type}`}>{message}</div>;
}
