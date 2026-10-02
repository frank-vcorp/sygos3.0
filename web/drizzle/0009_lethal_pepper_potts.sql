CREATE TABLE "test_mode_session_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "user_role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_mode_session_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_mode_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_by_user_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD COLUMN "fiscal_simulated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "test_mode_session_roles" ADD CONSTRAINT "test_mode_session_roles_session_id_test_mode_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."test_mode_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_mode_session_users" ADD CONSTRAINT "test_mode_session_users_session_id_test_mode_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."test_mode_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_mode_session_users" ADD CONSTRAINT "test_mode_session_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_mode_sessions" ADD CONSTRAINT "test_mode_sessions_started_by_user_id_users_id_fk" FOREIGN KEY ("started_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "test_mode_session_roles_unique" ON "test_mode_session_roles" USING btree ("session_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "test_mode_session_users_unique" ON "test_mode_session_users" USING btree ("session_id","user_id");