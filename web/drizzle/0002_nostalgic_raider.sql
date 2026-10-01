CREATE TABLE "company_settings" (
	"company_id" uuid PRIMARY KEY NOT NULL,
	"trade_name" text,
	"tax_legal_name" text,
	"tax_rfc" text,
	"tax_regime" text,
	"tax_zip" text,
	"address" text,
	"contact_email" text,
	"contact_phone" text,
	"logo_url" text,
	"direct_purchase_monthly_limit_mxn" integer DEFAULT 5000 NOT NULL,
	"direct_purchase_individual_limit_mxn" integer DEFAULT 2000 NOT NULL,
	"servomotores_inventory_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vendor_discount_limit_pct" integer;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;