const fs = require("fs");
const puppeteer = require("puppeteer-core");
const { formatPayrollLabel } = require("../utils/date");

function currency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function browserExecutablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);

  const match = candidates.find((candidate) => fs.existsSync(candidate));

  if (!match) {
    throw new Error(
      "No Chrome/Edge executable found for PDF generation. Set PUPPETEER_EXECUTABLE_PATH in backend/.env."
    );
  }

  return match;
}

function buildSlipHtml(salaryRecord) {
  const companyName = salaryRecord.company_name || process.env.COMPANY_NAME || "Company";
  const primaryColor = process.env.COMPANY_PRIMARY_COLOR || "#1c4e80";
  const secondaryColor = process.env.COMPANY_SECONDARY_COLOR || "#f4b183";
  const payrollLabel = formatPayrollLabel(salaryRecord.month, salaryRecord.year);
  const generatedDate = new Date().toLocaleDateString("en-IN");

  const identityRows = [
    ["Employee Name", salaryRecord.name],
    ["Employee Code", salaryRecord.employee_code],
    ["Father's Name", salaryRecord.father_name],
    ["Department", salaryRecord.department],
    ["Designation", salaryRecord.designation],
    ["Section", salaryRecord.section_name],
    ["Skill Category", salaryRecord.skill_category],
    ["Gender", salaryRecord.gender],
    ["Date of Joining", salaryRecord.join_date ? new Date(salaryRecord.join_date).toLocaleDateString("en-IN") : ""],
    ["Date of Birth", salaryRecord.dob ? new Date(salaryRecord.dob).toLocaleDateString("en-IN") : ""],
    ["Bank Name", salaryRecord.bank_name],
    ["A/C Number", salaryRecord.bank_account],
    ["IFSC", salaryRecord.bank_ifsc],
    ["UAN No", salaryRecord.uan_no],
    ["ESI No", salaryRecord.esi_no]
  ];

  const earningsRows = [
    ["Basic", currency(salaryRecord.basic)],
    ["HRA", currency(salaryRecord.hra)],
    ["Allowances", currency(salaryRecord.allowances)],
    ["Conveyance", currency(salaryRecord.conveyance)],
    ["Bonus Pay", currency(salaryRecord.bonus_pay)],
    ["Arrears", currency(salaryRecord.arrears)]
  ];

  const summaryRows = [
    ["Total Days", Number(salaryRecord.total_days || 0).toFixed(2)],
    ["Paid Days", Number(salaryRecord.paid_days || 0).toFixed(2)],
    ["Deductions", currency(salaryRecord.deductions)],
    ["Net Salary", currency(salaryRecord.net_salary)]
  ];

  const totalEarnings =
    Number(salaryRecord.basic || 0) +
    Number(salaryRecord.hra || 0) +
    Number(salaryRecord.allowances || 0) +
    Number(salaryRecord.conveyance || 0) +
    Number(salaryRecord.bonus_pay || 0) +
    Number(salaryRecord.arrears || 0);

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Salary Slip</title>
      <style>
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: "Segoe UI", Arial, sans-serif;
          color: #1f2937;
          background: white;
        }
        .slip {
          border: 2px solid ${primaryColor};
          min-height: 100%;
        }
        .hero {
          background: linear-gradient(135deg, ${primaryColor}, #143d59);
          color: white;
          padding: 18px 22px 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .hero h1 {
          margin: 0;
          font-size: 28px;
          letter-spacing: 0.02em;
        }
        .hero p {
          margin: 6px 0 0;
          font-size: 12px;
          opacity: 0.92;
        }
        .badge {
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 999px;
          padding: 9px 14px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .period-bar {
          background: ${secondaryColor};
          padding: 9px 22px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          color: #5b3414;
          border-bottom: 2px solid ${primaryColor};
        }
        .section {
          padding: 16px 18px 0;
        }
        .section-title {
          margin: 0 0 10px;
          padding: 7px 12px;
          background: #edf4fb;
          border-left: 6px solid ${primaryColor};
          color: ${primaryColor};
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .identity-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 18px;
          padding-bottom: 6px;
        }
        .identity-row {
          display: grid;
          grid-template-columns: 145px 1fr;
          gap: 8px;
          font-size: 12px;
          border-bottom: 1px dotted #ccd8e5;
          padding: 4px 0;
        }
        .identity-row .label {
          color: #5a6a7a;
          font-weight: 700;
        }
        .identity-row .value {
          font-weight: 600;
        }
        .financial-grid {
          display: grid;
          grid-template-columns: 1.35fr 0.8fr;
          gap: 16px;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        .salary-table th {
          background: ${primaryColor};
          color: white;
          font-size: 12px;
          padding: 10px 12px;
          text-align: left;
        }
        .salary-table td {
          border: 1px solid #d7e1eb;
          padding: 9px 12px;
          font-size: 12px;
        }
        .salary-table td:last-child,
        .summary-table td:last-child {
          text-align: right;
          font-weight: 700;
        }
        .salary-table .alt td {
          background: #f8fbfe;
        }
        .summary-card {
          border: 1px solid #d7e1eb;
          background: linear-gradient(180deg, #fffefa, #f9fcff);
        }
        .summary-card h3 {
          margin: 0;
          background: #fff2e5;
          color: #8b4c14;
          padding: 10px 12px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .summary-table td {
          border: 1px solid #d7e1eb;
          padding: 10px 12px;
          font-size: 12px;
        }
        .summary-table .net td {
          background: #e9f2fb;
          color: ${primaryColor};
          font-size: 13px;
          font-weight: 800;
        }
        .total-band {
          margin-top: 10px;
          border: 2px solid ${primaryColor};
          background: #f0f7ff;
          display: flex;
          justify-content: space-between;
          padding: 11px 14px;
          font-size: 13px;
          font-weight: 800;
          color: ${primaryColor};
        }
        .footer {
          padding: 16px 18px 18px;
          display: grid;
          grid-template-columns: 1fr 180px;
          gap: 22px;
          align-items: end;
        }
        .footer-note {
          border-top: 1px dashed #b8c6d3;
          padding-top: 10px;
          font-size: 11px;
          color: #546375;
          line-height: 1.6;
        }
        .signature {
          text-align: center;
          font-size: 11px;
          color: #546375;
        }
        .signature .line {
          margin-top: 48px;
          border-top: 1px solid #7b8b9a;
          padding-top: 8px;
          font-weight: 700;
          color: #263746;
        }
      </style>
    </head>
    <body>
      <div class="slip">
        <div class="hero">
          <div>
            <h1>${escapeHtml(companyName)}</h1>
            <p>Payroll Salary Slip generated for salary disbursement and employee record use.</p>
          </div>
          <div class="badge">Salary Slip</div>
        </div>
        <div class="period-bar">
          <span>Payroll Month: ${escapeHtml(payrollLabel)}</span>
          <span>Generated On: ${escapeHtml(generatedDate)}</span>
        </div>

        <div class="section">
          <h2 class="section-title">Employee Information</h2>
          <div class="identity-grid">
            ${identityRows
              .map(
                ([label, value]) => `
                  <div class="identity-row">
                    <div class="label">${escapeHtml(label)}</div>
                    <div class="value">${escapeHtml(value || "-")}</div>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Salary Breakdown</h2>
          <div class="financial-grid">
            <div>
              <table class="salary-table">
                <thead>
                  <tr>
                    <th>Earnings</th>
                    <th>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${earningsRows
                    .map(
                      ([label, value], index) => `
                        <tr class="${index % 2 === 1 ? "alt" : ""}">
                          <td>${escapeHtml(label)}</td>
                          <td>${escapeHtml(value)}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
              <div class="total-band">
                <span>Total Earnings</span>
                <span>${escapeHtml(currency(totalEarnings))}</span>
              </div>
            </div>
            <div class="summary-card">
              <h3>Summary</h3>
              <table class="summary-table">
                <tbody>
                  ${summaryRows
                    .map(
                      ([label, value], index) => `
                        <tr class="${index === summaryRows.length - 1 ? "net" : ""}">
                          <td>${escapeHtml(label)}</td>
                          <td>${escapeHtml(value)}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-note">
            This is a computer-generated salary slip and does not require a manual signature.
            Please verify employee details, payroll period, and net payable amount before filing.
          </div>
          <div class="signature">
            <div class="line">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

async function generateSalarySlipPdfBuffer(salaryRecord) {
  const browser = await puppeteer.launch({
    executablePath: browserExecutablePath(),
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(buildSlipHtml(salaryRecord), { waitUntil: "networkidle0" });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true
    });
  } finally {
    await browser.close();
  }
}

async function buildSalarySlipPdf(res, salaryRecord) {
  const pdfBuffer = Buffer.from(await generateSalarySlipPdfBuffer(salaryRecord));

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${salaryRecord.employee_code}-${salaryRecord.year}-${String(salaryRecord.month).padStart(2, "0")}-salary-slip.pdf"`
  );
  res.setHeader("Content-Length", pdfBuffer.length);

  res.send(pdfBuffer);
}

module.exports = {
  buildSalarySlipPdf,
  generateSalarySlipPdfBuffer
};
