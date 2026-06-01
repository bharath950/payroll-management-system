const path = require("path");
const XLSX = require("xlsx");

const rows = [
  {
    EmployeeCode: "EMP001",
    Name: "Rahul Sharma",
    Basic: 25000,
    HRA: 12000,
    Allowances: 5000,
    Deductions: 3000,
    NetSalary: 39000,
    Month: "2026-03"
  },
  {
    EmployeeCode: "EMP002",
    Name: "Neha Verma",
    Basic: 28000,
    HRA: 14000,
    Allowances: 4500,
    Deductions: 3500,
    NetSalary: 43000,
    Month: "2026-03"
  },
  {
    EmployeeCode: "EMP003",
    Name: "Arjun Patel",
    Basic: 22000,
    HRA: 10000,
    Allowances: 4000,
    Deductions: 2500,
    NetSalary: 33500,
    Month: "2026-03"
  }
];

const worksheet = XLSX.utils.json_to_sheet(rows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Salaries");

const outputPath = path.join(__dirname, "sample-salary-data.xlsx");
XLSX.writeFile(workbook, outputPath);

console.log(`Created ${outputPath}`);

