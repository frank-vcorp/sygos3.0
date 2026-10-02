CREATE TYPE "public"."attendance_punch_type" AS ENUM('ENTRADA', 'SALIDA');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('DEVENGADA', 'PAGADA');--> statement-breakpoint
CREATE TYPE "public"."employee_hire_type" AS ENUM('NUEVO', 'MIGRADO');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('ACTIVO', 'BAJA');--> statement-breakpoint
CREATE TYPE "public"."hr_request_status" AS ENUM('PENDIENTE', 'PENDIENTE_JEFE', 'PENDIENTE_CEO', 'AUTORIZADA', 'RECHAZADA', 'PAGADA');--> statement-breakpoint
CREATE TYPE "public"."overtime_rate" AS ENUM('DOBLE', 'TRIPLE');--> statement-breakpoint
CREATE TYPE "public"."payroll_run_status" AS ENUM('BORRADOR', 'AUTORIZADA', 'PAGADA');--> statement-breakpoint
CREATE TABLE "attendance_punches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"punch_type" "attendance_punch_type" NOT NULL,
	"punched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'KIOSCO' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_accruals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"vendor_user_id" uuid NOT NULL,
	"quote_id" uuid,
	"period_key" text NOT NULL,
	"amount_mxn" integer NOT NULL,
	"status" "commission_status" DEFAULT 'DEVENGADA' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid,
	"legal_name" text NOT NULL,
	"hire_type" "employee_hire_type" DEFAULT 'NUEVO' NOT NULL,
	"hire_date" timestamp with time zone NOT NULL,
	"status" "employee_status" DEFAULT 'ACTIVO' NOT NULL,
	"manager_employee_id" uuid,
	"daily_salary_stamped_mxn" integer DEFAULT 0 NOT NULL,
	"daily_salary_cash_mxn" integer DEFAULT 0 NOT NULL,
	"vacation_balance_days" integer DEFAULT 0 NOT NULL,
	"kiosk_enabled" boolean DEFAULT true NOT NULL,
	"attendance_exempt" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overtime_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"work_date" timestamp with time zone NOT NULL,
	"hours" integer NOT NULL,
	"rate_kind" "overtime_rate" NOT NULL,
	"status" "hr_request_status" DEFAULT 'PENDIENTE_JEFE' NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"boss_approved_by_user_id" uuid,
	"ceo_approved_by_user_id" uuid,
	"amount_mxn" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"concept" text NOT NULL,
	"amount_mxn" integer NOT NULL,
	"vacation_request_id" uuid,
	"overtime_request_id" uuid
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"week_key" text NOT NULL,
	"folio_number" integer NOT NULL,
	"status" "payroll_run_status" DEFAULT 'BORRADOR' NOT NULL,
	"authorized_by_user_id" uuid,
	"authorized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"technician_user_id" uuid NOT NULL,
	"hours_tenths" integer NOT NULL,
	"note" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"weekday_days" integer NOT NULL,
	"status" "hr_request_status" DEFAULT 'PENDIENTE' NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"resolved_by_user_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "test_mode_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_accruals" ADD CONSTRAINT "commission_accruals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_accruals" ADD CONSTRAINT "commission_accruals_vendor_user_id_users_id_fk" FOREIGN KEY ("vendor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_accruals" ADD CONSTRAINT "commission_accruals_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_boss_approved_by_user_id_users_id_fk" FOREIGN KEY ("boss_approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_ceo_approved_by_user_id_users_id_fk" FOREIGN KEY ("ceo_approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_vacation_request_id_vacation_requests_id_fk" FOREIGN KEY ("vacation_request_id") REFERENCES "public"."vacation_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_overtime_request_id_overtime_requests_id_fk" FOREIGN KEY ("overtime_request_id") REFERENCES "public"."overtime_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_authorized_by_user_id_users_id_fk" FOREIGN KEY ("authorized_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_entries" ADD CONSTRAINT "production_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_entries" ADD CONSTRAINT "production_entries_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_entries" ADD CONSTRAINT "production_entries_technician_user_id_users_id_fk" FOREIGN KEY ("technician_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employees_company_user_unique" ON "employees" USING btree ("company_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_runs_company_week_unique" ON "payroll_runs" USING btree ("company_id","week_key");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_runs_company_folio_unique" ON "payroll_runs" USING btree ("company_id","folio_number");