CREATE TYPE "public"."payroll_fiscal_status" AS ENUM('NO_APLICA', 'PENDIENTE', 'TIMBRADA', 'ERROR', 'SIMULADA');--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "tax_rfc" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "tax_curp" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "tax_zip" text;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD COLUMN "fiscal_status" "payroll_fiscal_status" DEFAULT 'NO_APLICA' NOT NULL;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD COLUMN "last_fiscal_error" text;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD COLUMN "stamp_idempotency_key" text;--> statement-breakpoint
CREATE TABLE "payroll_fiscal_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"amount_stamped_mxn" integer NOT NULL,
	"status" "payroll_fiscal_status" DEFAULT 'PENDIENTE' NOT NULL,
	"facturapi_receipt_id" text,
	"facturapi_uuid" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payroll_fiscal_receipts" ADD CONSTRAINT "payroll_fiscal_receipts_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_fiscal_receipts" ADD CONSTRAINT "payroll_fiscal_receipts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
