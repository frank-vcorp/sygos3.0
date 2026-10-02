CREATE TYPE "public"."payroll_run_kind" AS ENUM('SEMANAL', 'AGUINALDO');--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "bonus_punctuality_mxn" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "bonus_productivity_mxn" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bonuses_eligible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD COLUMN "line_kind" text DEFAULT 'SYSTEM' NOT NULL;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD COLUMN "run_kind" "payroll_run_kind" DEFAULT 'SEMANAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;