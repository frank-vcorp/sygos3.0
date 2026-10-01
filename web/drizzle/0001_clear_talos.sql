CREATE TYPE "public"."client_classification" AS ENUM('NORMAL', 'PREMIUM');--> statement-breakpoint
CREATE TYPE "public"."prospect_status" AS ENUM('NUEVO', 'EN_SEGUIMIENTO', 'CONVERTIDO', 'DESCARTADO');--> statement-breakpoint
CREATE TABLE "client_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"job_title" text,
	"email" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"classification" "client_classification",
	"commercial_responsible_user_id" uuid NOT NULL,
	"requires_invoice" boolean DEFAULT false NOT NULL,
	"credit_days" integer,
	"delivery_address" text,
	"tax_legal_name" text,
	"tax_rfc" text,
	"tax_regime" text,
	"tax_zip" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"origin_prospect_id" uuid,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "folio_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"folio_type" text NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"responsible_user_id" uuid NOT NULL,
	"source" text,
	"notes" text,
	"status" "prospect_status" DEFAULT 'NUEVO' NOT NULL,
	"converted_client_id" uuid,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"contact_name" text,
	"phone" text,
	"email" text,
	"credit_days" integer,
	"emits_fiscal_invoice" boolean DEFAULT true NOT NULL,
	"category" text,
	"tax_rfc" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system_fixed" boolean DEFAULT false NOT NULL,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_commercial_responsible_user_id_users_id_fk" FOREIGN KEY ("commercial_responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_sequences" ADD CONSTRAINT "folio_sequences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_converted_client_id_clients_id_fk" FOREIGN KEY ("converted_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_company_legal_name_unique" ON "clients" USING btree ("company_id","legal_name");--> statement-breakpoint
CREATE UNIQUE INDEX "folio_sequences_company_type_unique" ON "folio_sequences" USING btree ("company_id","folio_type");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_company_legal_name_unique" ON "suppliers" USING btree ("company_id","legal_name");