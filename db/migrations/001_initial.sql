create extension if not exists "uuid-ossp";
do $$ begin create type status_code as enum ('VERIFIED','AWAY','UNKNOWN_FACE','CAMERA_ERROR'); exception when duplicate_object then null; end $$;
create table if not exists employees (id uuid primary key default uuid_generate_v4(), name text not null, email text unique not null, role text not null check (role in ('employee','manager','admin')), department text, manager_id uuid references employees(id), created_at timestamptz not null default now());
create table if not exists face_embeddings (id uuid primary key default uuid_generate_v4(), employee_id uuid not null references employees(id) on delete cascade, embedding_encrypted bytea not null, iv text not null, created_at timestamptz not null default now());
create table if not exists status_logs (id uuid primary key default uuid_generate_v4(), employee_id uuid not null references employees(id) on delete cascade, status status_code not null, checked_at timestamptz not null default now());
create table if not exists alerts (id uuid primary key default uuid_generate_v4(), employee_id uuid not null references employees(id) on delete cascade, triggered_at timestamptz not null default now(), acknowledged boolean not null default false, acknowledged_at timestamptz);
create index if not exists idx_status_logs_employee_checked on status_logs(employee_id, checked_at desc);
