const db = require("../config/db");

async function upsertEmployee(employee, client = db) {
  const query = `
    insert into employees (employee_code, name, department, designation, bank_details)
    values ($1, $2, $3, $4, $5)
    on conflict (employee_code)
    do update set
      name = excluded.name,
      department = coalesce(excluded.department, employees.department),
      designation = coalesce(excluded.designation, employees.designation),
      bank_details = coalesce(excluded.bank_details, employees.bank_details)
    returning *
  `;

  const values = [
    employee.employeeCode,
    employee.name,
    employee.department || null,
    employee.designation || null,
    employee.bankDetails || null
  ];

  const result = await client.query(query, values);
  return result.rows[0];
}

async function findEmployeeByCode(employeeCode) {
  const result = await db.query(
    `
      select
        e.*,
        c.company_name
      from employees e
      join companies c on c.id = e.company_id
      where e.employee_code = $1
      order by e.created_at desc
      limit 1
    `,
    [employeeCode]
  );

  return result.rows[0] || null;
}

module.exports = {
  upsertEmployee,
  findEmployeeByCode
};
