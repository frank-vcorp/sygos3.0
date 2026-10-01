CREATE TYPE "public"."equi_custody_status" AS ENUM('AWAITING_ENTRY', 'IN_CUSTODY', 'OUT', 'TRIAL_OUT');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_kind" AS ENUM('RECEIPT', 'ISSUE', 'ADJUSTMENT', 'IMPORT');--> statement-breakpoint
CREATE TYPE "public"."motor_origin" AS ENUM('SYSTRON', 'SERVOMOTORES_DIRECT');--> statement-breakpoint
CREATE TYPE "public"."physical_entity_type" AS ENUM('EQUI', 'MOT');--> statement-breakpoint
CREATE TYPE "public"."physical_movement_type" AS ENUM('ENTRY', 'EXIT', 'TRIAL_OUT', 'TRIAL_RETURN', 'DEFINITIVE_EXIT', 'INGRESO', 'EGRESO');--> statement-breakpoint
CREATE TYPE "public"."servomotores_intake_status" AS ENUM('NOT_APPLICABLE', 'PENDING_INTAKE', 'IN_CUSTODY', 'OUT', 'TRIAL_OUT');--> statement-breakpoint
CREATE TYPE "public"."spare_part_request_status" AS ENUM('SOLICITADA', 'EN_TRANSITO', 'EN_ALMACEN', 'SURTIDA');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TABLE "equi_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"folio_number" integer NOT NULL,
	"type_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"model" text NOT NULL,
	"description" text,
	"serial_number" text,
	"custody_status" "equi_custody_status" DEFAULT 'AWAITING_ENTRY' NOT NULL,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_folio_sequences" (
	"folio_type" text PRIMARY KEY NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"kind" "inventory_movement_kind" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"reference" text,
	"performed_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"part_number" text NOT NULL,
	"description" text NOT NULL,
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"min_qty" integer,
	"max_qty" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio_number" integer NOT NULL,
	"origin" "motor_origin" NOT NULL,
	"origin_company_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"identification" text NOT NULL,
	"brand" text,
	"model" text,
	"serial_number" text,
	"notes" text,
	"servomotores_intake_status" "servomotores_intake_status" DEFAULT 'NOT_APPLICABLE' NOT NULL,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "motors_folio_number_unique" UNIQUE("folio_number")
);
--> statement-breakpoint
CREATE TABLE "physical_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"entity_type" "physical_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"movement_type" "physical_movement_type" NOT NULL,
	"motive" text,
	"receiver_name" text,
	"receiver_notes" text,
	"enabling_document_ref" text,
	"performed_by_actor_user_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spare_part_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"part_number" text NOT NULL,
	"description" text NOT NULL,
	"link_url" text,
	"quantity_requested" integer NOT NULL,
	"quantity_fulfilled" integer DEFAULT 0 NOT NULL,
	"status" "spare_part_request_status" DEFAULT 'SOLICITADA' NOT NULL,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"folio_number" integer NOT NULL,
	"equi_id" uuid,
	"motor_id" uuid,
	"status" "work_order_status" DEFAULT 'OPEN' NOT NULL,
	"summary" text,
	"created_by_actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "equi_units" ADD CONSTRAINT "equi_units_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equi_units" ADD CONSTRAINT "equi_units_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equi_units" ADD CONSTRAINT "equi_units_type_id_equipment_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."equipment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equi_units" ADD CONSTRAINT "equi_units_brand_id_equipment_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."equipment_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equi_units" ADD CONSTRAINT "equi_units_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_brands" ADD CONSTRAINT "equipment_brands_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_types" ADD CONSTRAINT "equipment_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_part_id_inventory_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."inventory_parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_performed_by_actor_user_id_users_id_fk" FOREIGN KEY ("performed_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_parts" ADD CONSTRAINT "inventory_parts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motors" ADD CONSTRAINT "motors_origin_company_id_companies_id_fk" FOREIGN KEY ("origin_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motors" ADD CONSTRAINT "motors_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motors" ADD CONSTRAINT "motors_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_movements" ADD CONSTRAINT "physical_movements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_movements" ADD CONSTRAINT "physical_movements_performed_by_actor_user_id_users_id_fk" FOREIGN KEY ("performed_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_part_requests" ADD CONSTRAINT "spare_part_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_part_requests" ADD CONSTRAINT "spare_part_requests_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_part_requests" ADD CONSTRAINT "spare_part_requests_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_equi_id_equi_units_id_fk" FOREIGN KEY ("equi_id") REFERENCES "public"."equi_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_motor_id_motors_id_fk" FOREIGN KEY ("motor_id") REFERENCES "public"."motors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_actor_user_id_users_id_fk" FOREIGN KEY ("created_by_actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "equi_units_company_folio_unique" ON "equi_units" USING btree ("company_id","folio_number");--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_brands_company_name_unique" ON "equipment_brands" USING btree ("company_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_types_company_name_unique" ON "equipment_types" USING btree ("company_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_parts_company_part_unique" ON "inventory_parts" USING btree ("company_id","part_number");--> statement-breakpoint
CREATE UNIQUE INDEX "work_orders_company_folio_unique" ON "work_orders" USING btree ("company_id","folio_number");