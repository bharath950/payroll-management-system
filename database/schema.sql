create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  company_code varchar(50) unique not null,
  company_name varchar(200) not null,
  contact_email varchar(150),
  contact_phone varchar(30),
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_code varchar(50) not null,
  name varchar(150) not null,
  father_name varchar(150),
  department varchar(150),
  designation varchar(150),
  section_name varchar(150),
  skill_category varchar(150),
  aadhaar_no varchar(20),
  uan_no varchar(20),
  esi_no varchar(20),
  bank_name varchar(150),
  bank_account varchar(50),
  bank_ifsc varchar(20),
  gender varchar(20),
  join_date date,
  dob date,
  employment_status varchar(30) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_company_employee_code_unique unique (company_id, employee_code)
);

create table if not exists salary_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  payroll_month smallint not null check (payroll_month between 1 and 12),
  payroll_year integer not null check (payroll_year >= 2000),
  period_label varchar(20) not null,
  status varchar(30) not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salary_periods_company_month_year_unique unique (company_id, payroll_month, payroll_year)
);

create table if not exists salary_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  salary_period_id uuid not null references salary_periods(id) on delete cascade,

  expected_basic numeric(12,2) not null default 0,
  expected_hra numeric(12,2) not null default 0,
  expected_allowances numeric(12,2) not null default 0,
  expected_conveyance numeric(12,2) not null default 0,
  expected_gross numeric(12,2) not null default 0,

  total_days numeric(5,2) not null default 0,
  paid_days numeric(5,2) not null default 0,
  arrears numeric(12,2) not null default 0,

  earned_basic numeric(12,2) not null default 0,
  earned_hra numeric(12,2) not null default 0,
  earned_conveyance numeric(12,2) not null default 0,
  earned_allowances numeric(12,2) not null default 0,
  bonus_pay numeric(12,2) not null default 0,

  deductions numeric(12,2) not null default 0,
  net_salary numeric(12,2) not null default 0,

  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint salary_records_company_employee_period_unique unique (company_id, employee_id, salary_period_id)
);

create table if not exists upload_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
  file_name varchar(255) not null,
  total_rows integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  status varchar(30) not null default 'completed',
  error_summary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists companies_set_updated_at on companies;
create trigger companies_set_updated_at
before update on companies
for each row
execute procedure set_updated_at();

drop trigger if exists employees_set_updated_at on employees;
create trigger employees_set_updated_at
before update on employees
for each row
execute procedure set_updated_at();

drop trigger if exists salary_periods_set_updated_at on salary_periods;
create trigger salary_periods_set_updated_at
before update on salary_periods
for each row
execute procedure set_updated_at();

drop trigger if exists salary_records_set_updated_at on salary_records;
create trigger salary_records_set_updated_at
before update on salary_records
for each row
execute procedure set_updated_at();

create index if not exists idx_employees_company_id on employees(company_id);
create index if not exists idx_employees_employee_code on employees(employee_code);
create index if not exists idx_salary_periods_company_id on salary_periods(company_id);
create index if not exists idx_salary_periods_month_year on salary_periods(payroll_year, payroll_month);
create index if not exists idx_salary_records_company_id on salary_records(company_id);
create index if not exists idx_salary_records_employee_id on salary_records(employee_id);
create index if not exists idx_salary_records_salary_period_id on salary_records(salary_period_id);
create index if not exists idx_upload_logs_created_at on upload_logs(created_at desc);
