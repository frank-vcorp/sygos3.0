ALTER TABLE "diagnostics" ADD COLUMN IF NOT EXISTS "warranty_commercial_override" boolean DEFAULT false NOT NULL;
ALTER TABLE "diagnostics" ADD COLUMN IF NOT EXISTS "warranty_commercial_override_by_user_id" uuid REFERENCES "users"("id");
ALTER TABLE "diagnostics" ADD COLUMN IF NOT EXISTS "warranty_commercial_override_at" timestamp with time zone;
ALTER TABLE "diagnostics" ADD COLUMN IF NOT EXISTS "test_session_id" uuid REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE;

ALTER TABLE "work_orders" ADD COLUMN IF NOT EXISTS "paid_physical_exit_at" timestamp with time zone;
ALTER TABLE "work_orders" ADD COLUMN IF NOT EXISTS "is_warranty_repair" boolean DEFAULT false NOT NULL;
ALTER TABLE "work_orders" ADD COLUMN IF NOT EXISTS "test_session_id" uuid REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE;

ALTER TABLE "service_attentions" ADD COLUMN IF NOT EXISTS "test_session_id" uuid REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "test_session_id" uuid REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE;
ALTER TABLE "fiscal_documents" ADD COLUMN IF NOT EXISTS "test_session_id" uuid REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "test_session_id" uuid REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE;
ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "test_session_id" uuid REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE;
ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "test_session_id" uuid REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE;
ALTER TABLE "direct_purchases" ADD COLUMN IF NOT EXISTS "test_session_id" uuid REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE;

ALTER TABLE "financial_movements" ADD COLUMN IF NOT EXISTS "payroll_run_id" uuid REFERENCES "payroll_runs"("id");
ALTER TABLE "financial_movements" ADD COLUMN IF NOT EXISTS "test_session_id" uuid REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE;

ALTER TABLE "commission_accruals" ADD COLUMN IF NOT EXISTS "quote_total_mxn" integer;
ALTER TABLE "commission_accruals" ADD COLUMN IF NOT EXISTS "rate_percent" integer DEFAULT 3 NOT NULL;

ALTER TABLE "test_mode_sessions" ADD COLUMN IF NOT EXISTS "folio_snapshot" jsonb;

CREATE TYPE "public"."attendance_day_classification" AS ENUM(
  'NORMAL',
  'RETARDO',
  'AUSENCIA',
  'VACACIONES',
  'PERMISO',
  'SALIDA_FALTANTE'
);

CREATE TABLE IF NOT EXISTS "attendance_daily" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "work_date" date NOT NULL,
  "classification" "attendance_day_classification" NOT NULL,
  "vacation_request_id" uuid REFERENCES "vacation_requests"("id") ON DELETE SET NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "attendance_daily_employee_date_unique" UNIQUE("employee_id","work_date")
);

CREATE TABLE IF NOT EXISTS "functional_history_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "entity_type" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "action" text NOT NULL,
  "detail" text,
  "actor_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "test_mode_folio_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE,
  "company_id" uuid NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "folio_type" text NOT NULL,
  "last_value" integer NOT NULL,
  CONSTRAINT "test_mode_folio_snapshots_unique" UNIQUE("session_id","company_id","folio_type")
);

CREATE TABLE IF NOT EXISTS "test_mode_overlays" (
  "session_id" uuid NOT NULL REFERENCES "test_mode_sessions"("id") ON DELETE CASCADE,
  "entity_key" text NOT NULL,
  "payload" jsonb NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("session_id","entity_key")
);

CREATE INDEX IF NOT EXISTS "functional_history_entity_idx" ON "functional_history_entries" ("entity_type","entity_id");
