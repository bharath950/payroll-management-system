function parsePayrollMonth(value) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    if (month >= 1 && month <= 12) {
      return { month, year, label: `${year}-${String(month).padStart(2, "0")}` };
    }
  }

  const parsed = new Date(`${value} 01`);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      month: parsed.getMonth() + 1,
      year: parsed.getFullYear(),
      label: `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`
    };
  }

  return null;
}

function formatPayrollLabel(month, year) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

module.exports = {
  parsePayrollMonth,
  formatPayrollLabel
};

