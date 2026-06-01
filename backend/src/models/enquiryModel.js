const db = require("../config/db");

async function createEnquiry({ name, phone, email }) {
  await db.query(`
    create table if not exists enquiries (
      id uuid primary key default gen_random_uuid(),
      name varchar(150) not null,
      phone varchar(30) not null,
      email varchar(150) not null,
      created_at timestamptz not null default now()
    )
  `);

  const result = await db.query(
    `
      insert into enquiries (name, phone, email)
      values ($1, $2, $3)
      returning *
    `,
    [name, phone, email]
  );

  return result.rows[0];
}

module.exports = {
  createEnquiry
};

