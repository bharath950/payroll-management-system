const db = require("../config/db");

async function upsertSalary(salary, client = db) {
  const query = `
    insert into salaries (
      employee_code, month, year, basic, hra, allowances, deductions, net_salary
    ) values ($1, $2, $3, $4, $5, $6, $7, $8)
    on conflict (employee_code, month, year)
    do update set
      basic = excluded.basic,
      hra = excluded.hra,
      allowances = excluded.allowances,
      deductions = excluded.deductions,
      net_salary = excluded.net_salary
    returning *
  `;

  const values = [
    salary.employeeCode,
    salary.month,
    salary.year,
    salary.basic,
    salary.hra,
    salary.allowances,
    salary.deductions,
    salary.netSalary
  ];

  const result = await client.query(query, values);
  return result.rows[0];
}

async function findSalaryByEmployeeAndMonth(employeeCode, month, year) {
  const result = await db.query(
    `
      select
        e.employee_code,
        e.name,
        e.father_name,
        e.department,
        e.designation,
        e.section_name,
        e.skill_category,
        e.bank_name,
        e.bank_account,
        e.bank_ifsc,
        e.gender,
        e.join_date,
        e.dob,
        e.uan_no,
        e.esi_no,
        e.aadhaar_no,
        c.company_name,
        sp.payroll_month as month,
        sp.payroll_year as year,
        coalesce(sr.earned_basic, sr.expected_basic, 0) as basic,
        coalesce(sr.earned_hra, sr.expected_hra, 0) as hra,
        coalesce(sr.earned_allowances, sr.expected_allowances, 0) as allowances,
        sr.deductions,
        sr.net_salary,
        sr.bonus_pay,
        sr.arrears,
        sr.total_days,
        sr.paid_days,
        coalesce(sr.earned_conveyance, sr.expected_conveyance, 0) as conveyance
      from salary_records sr
      join employees e on e.id = sr.employee_id
      join companies c on c.id = sr.company_id
      join salary_periods sp on sp.id = sr.salary_period_id
      where e.employee_code = $1
        and sp.payroll_month = $2
        and sp.payroll_year = $3
      order by sr.created_at desc
      limit 1
    `,
    [employeeCode, month, year]
  );

  return result.rows[0] || null;
}

module.exports = {
  upsertSalary,
  findSalaryByEmployeeAndMonth
};
