require("dotenv").config();
const db = require("../src/config/db");

const company = {
  companyCode: "COMP001",
  companyName: "Acme Manpower Solutions"
};

const employees = [
  {
    employeeCode: "EMP001",
    name: "Rahul Sharma",
    fatherName: "Mahesh Sharma",
    department: "Operations",
    designation: "Supervisor",
    sectionName: "Payroll Site A",
    skillCategory: "Skilled",
    bankName: "State Bank of India",
    bankAccount: "12345678901",
    bankIfsc: "SBIN0001234",
    gender: "Male",
    joinDate: "2024-01-15",
    dob: "1995-05-12"
  },
  {
    employeeCode: "EMP002",
    name: "Neha Verma",
    fatherName: "Suresh Verma",
    department: "Administration",
    designation: "Executive",
    sectionName: "Payroll Site A",
    skillCategory: "Highly Skilled",
    bankName: "HDFC Bank",
    bankAccount: "98765432101",
    bankIfsc: "HDFC0004567",
    gender: "Female",
    joinDate: "2023-09-10",
    dob: "1997-11-03"
  },
  {
    employeeCode: "EMP003",
    name: "Arjun Patel",
    fatherName: "Rakesh Patel",
    department: "Field Services",
    designation: "Technician",
    sectionName: "Payroll Site B",
    skillCategory: "Semi Skilled",
    bankName: "ICICI Bank",
    bankAccount: "45678912345",
    bankIfsc: "ICIC0007890",
    gender: "Male",
    joinDate: "2022-06-22",
    dob: "1994-02-19"
  }
];

const salaryRows = [
  {
    employeeCode: "EMP001",
    payrollMonth: 3,
    payrollYear: 2026,
    expectedBasic: 25000,
    expectedHra: 12000,
    expectedAllowances: 5000,
    expectedConveyance: 2000,
    expectedGross: 44000,
    totalDays: 31,
    paidDays: 31,
    arrears: 0,
    earnedBasic: 25000,
    earnedHra: 12000,
    earnedConveyance: 2000,
    earnedAllowances: 5000,
    bonusPay: 0,
    deductions: 3000,
    netSalary: 41000
  },
  {
    employeeCode: "EMP002",
    payrollMonth: 3,
    payrollYear: 2026,
    expectedBasic: 28000,
    expectedHra: 14000,
    expectedAllowances: 4500,
    expectedConveyance: 1500,
    expectedGross: 48000,
    totalDays: 31,
    paidDays: 30,
    arrears: 0,
    earnedBasic: 27100,
    earnedHra: 13550,
    earnedConveyance: 1450,
    earnedAllowances: 4350,
    bonusPay: 1000,
    deductions: 3500,
    netSalary: 43950
  },
  {
    employeeCode: "EMP003",
    payrollMonth: 3,
    payrollYear: 2026,
    expectedBasic: 22000,
    expectedHra: 10000,
    expectedAllowances: 4000,
    expectedConveyance: 1000,
    expectedGross: 37000,
    totalDays: 31,
    paidDays: 31,
    arrears: 500,
    earnedBasic: 22000,
    earnedHra: 10000,
    earnedConveyance: 1000,
    earnedAllowances: 4000,
    bonusPay: 500,
    deductions: 2500,
    netSalary: 35500
  }
];

async function seed() {
  const client = await db.getClient();

  try {
    await client.query("begin");

    const companyResult = await client.query(
      `
        insert into companies (company_code, company_name)
        values ($1, $2)
        on conflict (company_code)
        do update set company_name = excluded.company_name
        returning id, company_name
      `,
      [company.companyCode, company.companyName]
    );

    const companyId = companyResult.rows[0].id;

    const employeeIdByCode = new Map();

    for (const employee of employees) {
      const result = await client.query(
        `
          insert into employees (
            company_id,
            employee_code,
            name,
            father_name,
            department,
            designation,
            section_name,
            skill_category,
            bank_name,
            bank_account,
            bank_ifsc,
            gender,
            join_date,
            dob
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          on conflict (company_id, employee_code)
          do update set
            name = excluded.name,
            father_name = excluded.father_name,
            department = excluded.department,
            designation = excluded.designation,
            section_name = excluded.section_name,
            skill_category = excluded.skill_category,
            bank_name = excluded.bank_name,
            bank_account = excluded.bank_account,
            bank_ifsc = excluded.bank_ifsc,
            gender = excluded.gender,
            join_date = excluded.join_date,
            dob = excluded.dob
          returning id, employee_code
        `,
        [
          companyId,
          employee.employeeCode,
          employee.name,
          employee.fatherName,
          employee.department,
          employee.designation,
          employee.sectionName,
          employee.skillCategory,
          employee.bankName,
          employee.bankAccount,
          employee.bankIfsc,
          employee.gender,
          employee.joinDate,
          employee.dob
        ]
      );

      employeeIdByCode.set(result.rows[0].employee_code, result.rows[0].id);
    }

    const periodIdByKey = new Map();

    for (const salary of salaryRows) {
      const periodKey = `${salary.payrollYear}-${salary.payrollMonth}`;

      if (!periodIdByKey.has(periodKey)) {
        const periodResult = await client.query(
          `
            insert into salary_periods (company_id, payroll_month, payroll_year, period_label, status)
            values ($1, $2, $3, $4, 'processed')
            on conflict (company_id, payroll_month, payroll_year)
            do update set period_label = excluded.period_label, status = excluded.status
            returning id
          `,
          [
            companyId,
            salary.payrollMonth,
            salary.payrollYear,
            `${salary.payrollYear}-${String(salary.payrollMonth).padStart(2, "0")}`
          ]
        );

        periodIdByKey.set(periodKey, periodResult.rows[0].id);
      }

      await client.query(
        `
          insert into salary_records (
            company_id,
            employee_id,
            salary_period_id,
            expected_basic,
            expected_hra,
            expected_allowances,
            expected_conveyance,
            expected_gross,
            total_days,
            paid_days,
            arrears,
            earned_basic,
            earned_hra,
            earned_conveyance,
            earned_allowances,
            bonus_pay,
            deductions,
            net_salary
          )
          values (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
          )
          on conflict (company_id, employee_id, salary_period_id)
          do update set
            expected_basic = excluded.expected_basic,
            expected_hra = excluded.expected_hra,
            expected_allowances = excluded.expected_allowances,
            expected_conveyance = excluded.expected_conveyance,
            expected_gross = excluded.expected_gross,
            total_days = excluded.total_days,
            paid_days = excluded.paid_days,
            arrears = excluded.arrears,
            earned_basic = excluded.earned_basic,
            earned_hra = excluded.earned_hra,
            earned_conveyance = excluded.earned_conveyance,
            earned_allowances = excluded.earned_allowances,
            bonus_pay = excluded.bonus_pay,
            deductions = excluded.deductions,
            net_salary = excluded.net_salary
        `,
        [
          companyId,
          employeeIdByCode.get(salary.employeeCode),
          periodIdByKey.get(periodKey),
          salary.expectedBasic,
          salary.expectedHra,
          salary.expectedAllowances,
          salary.expectedConveyance,
          salary.expectedGross,
          salary.totalDays,
          salary.paidDays,
          salary.arrears,
          salary.earnedBasic,
          salary.earnedHra,
          salary.earnedConveyance,
          salary.earnedAllowances,
          salary.bonusPay,
          salary.deductions,
          salary.netSalary
        ]
      );
    }

    await client.query("commit");

    console.log("Dummy payroll data inserted successfully.");
    console.log("Sample employee codes: EMP001, EMP002, EMP003");
    console.log("Sample month: 2026-03");
  } catch (error) {
    await client.query("rollback");
    console.error("Failed to seed dummy data", error);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

seed();
