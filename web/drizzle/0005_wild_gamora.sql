CREATE TYPE "public"."equipment_sale_status" AS ENUM('ABIERTA', 'PARCIAL', 'CERRADA');--> statement-breakpoint
CREATE TYPE "public"."quote_origin" AS ENUM('VENDEDOR', 'DIAGNOSTICO_VALIDADO', 'REPARACION_TERMINADA', 'GARANTIA_COBRAR', 'MOT_BASE_SERVOMOTORES');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('PENDIENTE_COTIZAR', 'PENDIENTE_DECISION', 'AUTORIZADA', 'AUTORIZADA_PENDIENTE_INGRESO', 'NO_AUTORIZADA');--> statement-breakpoint
CREATE TYPE "public"."quote_type" AS ENUM('DIAGNOSTICO', 'REPARACION_SERVICIO', 'SERVICIO_CAMPO', 'VENTA_EQUIPO');--> statement-breakpoint
CREATE TABLE "client_first_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"attributed_user_id" uuid NOT NULL,
	"quote_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercial_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"category_id" uuid,
	"category_label" text,
	"client_id" uuid,
	"prospect_id" uuid,
	"title" text NOT NULL,
	"notes" text,
	"evidence_url" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercial_activity_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"counts_for_goals" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercial_goal_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_type_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"target_value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercial_goal_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"source_kind" text DEFAULT 'ACTIVITIES' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_sale_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"quote_line_id" uuid NOT NULL,
	"quantity_sold" integer NOT NULL,
	"quantity_received" integer DEFAULT 0 NOT NULL,
	"quantity_delivered" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"folio_number" integer NOT NULL,
	"quote_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"status" "equipment_sale_status" DEFAULT 'ABIERTA' NOT NULL,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_contact_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"concept" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_mxn" integer,
	"line_authorized" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_price_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"note" text,
	"subtotal_mxn" integer,
	"total_mxn" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"folio_number" integer NOT NULL,
	"client_id" uuid NOT NULL,
	"vendor_user_id" uuid NOT NULL,
	"quote_type" "quote_type" NOT NULL,
	"quote_origin" "quote_origin" NOT NULL,
	"status" "quote_status" DEFAULT 'PENDIENTE_COTIZAR' NOT NULL,
	"diagnostic_id" uuid,
	"work_order_id" uuid,
	"equi_id" uuid,
	"motor_id" uuid,
	"prelim_equipment_type" text,
	"prelim_brand" text,
	"prelim_model" text,
	"prelim_serial" text,
	"commercial_reference" text,
	"complement_notes" text,
	"repair_base_mxn" integer,
	"frozen_increment_pct" integer,
	"subtotal_mxn" integer,
	"discount_pct" integer,
	"discount_mxn" integer,
	"price_before_iva_mxn" integer,
	"iva_mxn" integer,
	"total_mxn" integer,
	"credit_days" integer,
	"linked_quote_id" uuid,
	"intercompany_base_total_mxn" integer,
	"priced_by_user_id" uuid,
	"priced_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"next_follow_up_at" timestamp with time zone,
	"decision_by_user_id" uuid,
	"decision_at" timestamp with time zone,
	"authorized_at" timestamp with time zone,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_first_operations" ADD CONSTRAINT "client_first_operations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_first_operations" ADD CONSTRAINT "client_first_operations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_first_operations" ADD CONSTRAINT "client_first_operations_attributed_user_id_users_id_fk" FOREIGN KEY ("attributed_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_first_operations" ADD CONSTRAINT "client_first_operations_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_activities" ADD CONSTRAINT "commercial_activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_activities" ADD CONSTRAINT "commercial_activities_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_activities" ADD CONSTRAINT "commercial_activities_category_id_commercial_activity_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."commercial_activity_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_activities" ADD CONSTRAINT "commercial_activities_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_activities" ADD CONSTRAINT "commercial_activities_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_activity_categories" ADD CONSTRAINT "commercial_activity_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_goal_targets" ADD CONSTRAINT "commercial_goal_targets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_goal_targets" ADD CONSTRAINT "commercial_goal_targets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_goal_targets" ADD CONSTRAINT "commercial_goal_targets_goal_type_id_commercial_goal_types_id_fk" FOREIGN KEY ("goal_type_id") REFERENCES "public"."commercial_goal_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_goal_types" ADD CONSTRAINT "commercial_goal_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_sale_lines" ADD CONSTRAINT "equipment_sale_lines_sale_id_equipment_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."equipment_sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_sale_lines" ADD CONSTRAINT "equipment_sale_lines_quote_line_id_quote_lines_id_fk" FOREIGN KEY ("quote_line_id") REFERENCES "public"."quote_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_sales" ADD CONSTRAINT "equipment_sales_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_sales" ADD CONSTRAINT "equipment_sales_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_sales" ADD CONSTRAINT "equipment_sales_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_sales" ADD CONSTRAINT "equipment_sales_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_contact_recipients" ADD CONSTRAINT "quote_contact_recipients_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_contact_recipients" ADD CONSTRAINT "quote_contact_recipients_contact_id_client_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."client_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_price_revisions" ADD CONSTRAINT "quote_price_revisions_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_price_revisions" ADD CONSTRAINT "quote_price_revisions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vendor_user_id_users_id_fk" FOREIGN KEY ("vendor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_diagnostic_id_diagnostics_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_equi_id_equi_units_id_fk" FOREIGN KEY ("equi_id") REFERENCES "public"."equi_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_motor_id_motors_id_fk" FOREIGN KEY ("motor_id") REFERENCES "public"."motors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_priced_by_user_id_users_id_fk" FOREIGN KEY ("priced_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_decision_by_user_id_users_id_fk" FOREIGN KEY ("decision_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_activity_categories_company_name" ON "commercial_activity_categories" USING btree ("company_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_goal_targets_unique" ON "commercial_goal_targets" USING btree ("company_id","user_id","goal_type_id","year","month");--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_goal_types_company_code" ON "commercial_goal_types" USING btree ("company_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_sales_company_folio_unique" ON "equipment_sales" USING btree ("company_id","folio_number");--> statement-breakpoint
CREATE UNIQUE INDEX "quote_contact_recipients_unique" ON "quote_contact_recipients" USING btree ("quote_id","contact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_company_folio_unique" ON "quotes" USING btree ("company_id","folio_number");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_diagnostic_unique" ON "quotes" USING btree ("diagnostic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_work_order_unique" ON "quotes" USING btree ("work_order_id");