CREATE TYPE "public"."attention_type" AS ENUM('DIAGNOSTICO', 'REPARACION', 'DIAGNOSTICO_GARANTIA');--> statement-breakpoint
CREATE TYPE "public"."diagnostic_status" AS ENUM('EN_ESPERA', 'EN_DIAGNOSTICO', 'DIAGNOSTICO_TERMINADO', 'PENDIENTE_VALIDACION_GERENTE', 'VALIDADO', 'DEVUELTO_CORRECCION');--> statement-breakpoint
CREATE TYPE "public"."external_service_status" AS ENUM('AT_VENDOR', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."priority_catalog" AS ENUM('DIAGNOSTICO', 'REPARACION');--> statement-breakpoint
CREATE TYPE "public"."repair_status" AS ENUM('EN_ESPERA', 'EN_REPARACION', 'EN_ESPERA_REFACCIONES', 'REPARACION_TERMINADA', 'SIN_REPARACION');--> statement-breakpoint
CREATE TYPE "public"."warranty_decision" AS ENUM('GARANTIA_VALIDA', 'GARANTIA_NO_PROCEDENTE');--> statement-breakpoint
ALTER TYPE "public"."equi_custody_status" ADD VALUE 'AT_EXTERNAL_VENDOR';--> statement-breakpoint
ALTER TYPE "public"."physical_movement_type" ADD VALUE 'EXTERNAL_OUT';--> statement-breakpoint
ALTER TYPE "public"."physical_movement_type" ADD VALUE 'EXTERNAL_RETURN';--> statement-breakpoint
CREATE TABLE "diagnostics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"attention_id" uuid NOT NULL,
	"folio_number" integer NOT NULL,
	"status" "diagnostic_status" DEFAULT 'EN_ESPERA' NOT NULL,
	"assigned_user_id" uuid,
	"technical_result" text,
	"warranty_decision" "warranty_decision",
	"frozen_priority_label" text NOT NULL,
	"frozen_price_mxn" integer DEFAULT 0 NOT NULL,
	"frozen_increment_pct" integer DEFAULT 0 NOT NULL,
	"frozen_sla_max_days" integer NOT NULL,
	"sla_started_at" timestamp with time zone,
	"sla_due_at" timestamp with time zone,
	"validation_return_reason" text,
	"validated_by_user_id" uuid,
	"validated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_service_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"diagnostic_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"status" "external_service_status" DEFAULT 'AT_VENDOR' NOT NULL,
	"vendor_document_ref" text,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_attentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"equi_id" uuid,
	"motor_id" uuid,
	"attention_type" "attention_type" NOT NULL,
	"reported_failure" text NOT NULL,
	"priority_code" text NOT NULL,
	"warranty_source_work_order_id" uuid,
	"peer_attention_id" uuid,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_priority_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"catalog" "priority_catalog" NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"price_mxn" integer DEFAULT 0 NOT NULL,
	"increment_pct" integer DEFAULT 0 NOT NULL,
	"target_min_days" integer,
	"target_max_days" integer,
	"sla_max_days" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technical_log_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"diagnostic_id" uuid,
	"work_order_id" uuid,
	"body" text NOT NULL,
	"author_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "attention_id" uuid;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "diagnostic_id" uuid;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "repair_status" "repair_status" DEFAULT 'EN_ESPERA' NOT NULL;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "assigned_user_id" uuid;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "technical_result" text;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "frozen_priority_label" text;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "frozen_increment_pct" integer;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "frozen_sla_max_days" integer;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "sla_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_attention_id_service_attentions_id_fk" FOREIGN KEY ("attention_id") REFERENCES "public"."service_attentions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_validated_by_user_id_users_id_fk" FOREIGN KEY ("validated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_service_cases" ADD CONSTRAINT "external_service_cases_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_service_cases" ADD CONSTRAINT "external_service_cases_diagnostic_id_diagnostics_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_service_cases" ADD CONSTRAINT "external_service_cases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_service_cases" ADD CONSTRAINT "external_service_cases_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_attentions" ADD CONSTRAINT "service_attentions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_attentions" ADD CONSTRAINT "service_attentions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_attentions" ADD CONSTRAINT "service_attentions_equi_id_equi_units_id_fk" FOREIGN KEY ("equi_id") REFERENCES "public"."equi_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_attentions" ADD CONSTRAINT "service_attentions_motor_id_motors_id_fk" FOREIGN KEY ("motor_id") REFERENCES "public"."motors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_attentions" ADD CONSTRAINT "service_attentions_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_priority_configs" ADD CONSTRAINT "service_priority_configs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_log_entries" ADD CONSTRAINT "technical_log_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_log_entries" ADD CONSTRAINT "technical_log_entries_diagnostic_id_diagnostics_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_log_entries" ADD CONSTRAINT "technical_log_entries_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "diagnostics_company_folio_unique" ON "diagnostics" USING btree ("company_id","folio_number");--> statement-breakpoint
CREATE UNIQUE INDEX "service_priority_company_catalog_code" ON "service_priority_configs" USING btree ("company_id","catalog","code");--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_attention_id_service_attentions_id_fk" FOREIGN KEY ("attention_id") REFERENCES "public"."service_attentions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_diagnostic_id_diagnostics_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;