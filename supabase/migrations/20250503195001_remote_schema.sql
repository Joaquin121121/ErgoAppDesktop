

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "athlete";


ALTER SCHEMA "athlete" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "coach";


ALTER SCHEMA "coach" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."set_last_changed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.last_changed = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_last_changed"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "athlete"."athletes" (
    "athlete_id" integer NOT NULL,
    "uid" "uuid" NOT NULL,
    "first_name" character varying(50) NOT NULL,
    "last_name" character varying(50) NOT NULL,
    "discipline" character varying(100) NOT NULL,
    "category" character varying(100),
    "birthdate" "date",
    "height" numeric(5,2),
    "height_unit" character varying(2),
    "weight" numeric(5,2),
    "weight_unit" character varying(2),
    "email" character varying(100) NOT NULL,
    "institution" character varying(150),
    "country" character varying(100),
    "state" character varying(100),
    "gender" character varying(15),
    CONSTRAINT "athletes_height_unit_check" CHECK ((("height_unit")::"text" = ANY ((ARRAY['cm'::character varying, 'in'::character varying, 'm'::character varying, 'ft'::character varying])::"text"[]))),
    CONSTRAINT "athletes_weight_unit_check" CHECK ((("weight_unit")::"text" = ANY ((ARRAY['kg'::character varying, 'lb'::character varying])::"text"[])))
);


ALTER TABLE "athlete"."athletes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "athlete"."athletes_athlete_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "athlete"."athletes_athlete_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "athlete"."athletes_athlete_id_seq" OWNED BY "athlete"."athletes"."athlete_id";



CREATE TABLE IF NOT EXISTS "public"."athlete" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "birth_date" "date",
    "country" "text",
    "state" "text",
    "gender" "text",
    "height" "text",
    "height_unit" "text",
    "weight" "text",
    "weight_unit" "text",
    "discipline" "text",
    "category" "text",
    "institution" "text",
    "comments" "text",
    "last_changed" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "athlete_gender_check" CHECK (("gender" = ANY (ARRAY['M'::"text", 'F'::"text", 'O'::"text", ''::"text"]))),
    CONSTRAINT "athlete_height_unit_check" CHECK (("height_unit" = ANY (ARRAY['cm'::"text", 'ft'::"text"]))),
    CONSTRAINT "athlete_weight_unit_check" CHECK (("weight_unit" = ANY (ARRAY['kgs'::"text", 'lbs'::"text"])))
);


ALTER TABLE "public"."athlete" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."base_result" (
    "id" bigint NOT NULL,
    "takeoff_foot" "text" NOT NULL,
    "sensitivity" double precision NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "deleted_at" timestamp with time zone,
    "last_changed" timestamp with time zone DEFAULT "now"() NOT NULL,
    "athlete_id" "uuid" NOT NULL,
    CONSTRAINT "base_result_takeofffoot_check" CHECK (("takeoff_foot" = ANY (ARRAY[('right'::character varying)::"text", ('left'::character varying)::"text", ('both'::character varying)::"text"])))
);


ALTER TABLE "public"."base_result" OWNER TO "postgres";


ALTER TABLE "public"."base_result" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."base_result_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."basic_result" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_changed" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "type" "text" NOT NULL,
    "load" double precision NOT NULL,
    "loadunit" "text" NOT NULL,
    "base_result_id" bigint NOT NULL,
    "bosco_result_id" bigint,
    CONSTRAINT "basic_result_loadunit_check" CHECK (("loadunit" = ANY (ARRAY['kgs'::"text", 'lbs'::"text"]))),
    CONSTRAINT "basic_result_type_check" CHECK (("type" = ANY (ARRAY['cmj'::"text", 'abalakov'::"text", 'squatJump'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."basic_result" OWNER TO "postgres";


ALTER TABLE "public"."basic_result" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."basic_result_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."bosco_result" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_changed" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "athlete_id" "uuid"
);


ALTER TABLE "public"."bosco_result" OWNER TO "postgres";


ALTER TABLE "public"."bosco_result" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."bosco_result_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."coach" (
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "info" "text",
    "specialty" "text",
    "uid" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "last_changed" timestamp with time zone NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."coach" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drop_jump_result" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_changed" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "height" "text" NOT NULL,
    "stiffness" numeric NOT NULL,
    "base_result_id" bigint NOT NULL
);


ALTER TABLE "public"."drop_jump_result" OWNER TO "postgres";


ALTER TABLE "public"."drop_jump_result" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."drop_jump_result_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."event" (
    "id" bigint NOT NULL,
    "event_type" "text" NOT NULL,
    "event_name" "text" NOT NULL,
    "event_date" timestamp with time zone NOT NULL,
    "duration" integer,
    "last_changed" timestamp with time zone,
    "coach_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "athlete_id" "uuid" NOT NULL
);


ALTER TABLE "public"."event" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."event_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."event_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."event_id_seq" OWNED BY "public"."event"."id";



CREATE TABLE IF NOT EXISTS "public"."jump_time" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "base_result_id" bigint NOT NULL,
    "index" smallint NOT NULL,
    "time" real NOT NULL,
    "deleted" boolean NOT NULL,
    "floor_time" real,
    "stiffness" real,
    "performance" real,
    "last_changed" timestamp with time zone NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."jump_time" OWNER TO "postgres";


ALTER TABLE "public"."jump_time" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."jumpTime_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."multiple_drop_jump_result" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_changed" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "height_unit" "text" NOT NULL,
    "takeoff_foot" "text" NOT NULL,
    "best_height" "text" NOT NULL,
    "athlete_id" "uuid" NOT NULL,
    CONSTRAINT "multiple_drop_jump_result_height_unit_check" CHECK (("height_unit" = ANY (ARRAY['cm'::"text", 'ft'::"text"]))),
    CONSTRAINT "multiple_drop_jump_result_takeoff_foot_check" CHECK (("takeoff_foot" = ANY (ARRAY['right'::"text", 'left'::"text", 'both'::"text"])))
);


ALTER TABLE "public"."multiple_drop_jump_result" OWNER TO "postgres";


ALTER TABLE "public"."multiple_drop_jump_result" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."multiple_drop_jump_result_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."multiple_jumps_result" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_changed" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "criteria" "text" NOT NULL,
    "criteria_value" numeric,
    "base_result_id" bigint NOT NULL,
    CONSTRAINT "multiple_jumps_result_criteria_check" CHECK (("criteria" = ANY (ARRAY['numberOfJumps'::"text", 'stiffness'::"text", 'time'::"text"])))
);


ALTER TABLE "public"."multiple_jumps_result" OWNER TO "postgres";


ALTER TABLE "public"."multiple_jumps_result" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."multiple_jumps_result_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "athlete"."athletes" ALTER COLUMN "athlete_id" SET DEFAULT "nextval"('"athlete"."athletes_athlete_id_seq"'::"regclass");



ALTER TABLE ONLY "athlete"."athletes"
    ADD CONSTRAINT "athletes_email_key" UNIQUE ("email");



ALTER TABLE ONLY "athlete"."athletes"
    ADD CONSTRAINT "athletes_pkey" PRIMARY KEY ("athlete_id");



ALTER TABLE ONLY "public"."athlete"
    ADD CONSTRAINT "athlete_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."base_result"
    ADD CONSTRAINT "base_result_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."basic_result"
    ADD CONSTRAINT "basic_result_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bosco_result"
    ADD CONSTRAINT "bosco_result_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach"
    ADD CONSTRAINT "coach_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."coach"
    ADD CONSTRAINT "coach_pkey" PRIMARY KEY ("uid");



ALTER TABLE ONLY "public"."coach"
    ADD CONSTRAINT "coach_uid_key" UNIQUE ("uid");



ALTER TABLE ONLY "public"."drop_jump_result"
    ADD CONSTRAINT "drop_jump_result_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jump_time"
    ADD CONSTRAINT "jumpTime_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."multiple_drop_jump_result"
    ADD CONSTRAINT "multiple_drop_jump_result_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."multiple_jumps_result"
    ADD CONSTRAINT "multiple_jumps_result_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_athletes_uid" ON "athlete"."athletes" USING "btree" ("uid");



CREATE OR REPLACE TRIGGER "set_last_changed_athlete" BEFORE INSERT OR UPDATE ON "public"."athlete" FOR EACH ROW EXECUTE FUNCTION "public"."set_last_changed"();



CREATE OR REPLACE TRIGGER "set_last_changed_base_result" BEFORE INSERT OR UPDATE ON "public"."base_result" FOR EACH ROW EXECUTE FUNCTION "public"."set_last_changed"();



CREATE OR REPLACE TRIGGER "set_last_changed_basic_result" BEFORE INSERT OR UPDATE ON "public"."basic_result" FOR EACH ROW EXECUTE FUNCTION "public"."set_last_changed"();



CREATE OR REPLACE TRIGGER "set_last_changed_bosco_result" BEFORE INSERT OR UPDATE ON "public"."bosco_result" FOR EACH ROW EXECUTE FUNCTION "public"."set_last_changed"();



CREATE OR REPLACE TRIGGER "set_last_changed_coach" BEFORE INSERT OR UPDATE ON "public"."coach" FOR EACH ROW EXECUTE FUNCTION "public"."set_last_changed"();



CREATE OR REPLACE TRIGGER "set_last_changed_drop_jump_result" BEFORE INSERT OR UPDATE ON "public"."drop_jump_result" FOR EACH ROW EXECUTE FUNCTION "public"."set_last_changed"();



CREATE OR REPLACE TRIGGER "set_last_changed_event" BEFORE INSERT OR UPDATE ON "public"."event" FOR EACH ROW EXECUTE FUNCTION "public"."set_last_changed"();



CREATE OR REPLACE TRIGGER "set_last_changed_jump_time" BEFORE INSERT OR UPDATE ON "public"."jump_time" FOR EACH ROW EXECUTE FUNCTION "public"."set_last_changed"();



CREATE OR REPLACE TRIGGER "set_last_changed_multiple_drop_jump_result" BEFORE INSERT OR UPDATE ON "public"."multiple_drop_jump_result" FOR EACH ROW EXECUTE FUNCTION "public"."set_last_changed"();



CREATE OR REPLACE TRIGGER "set_last_changed_multiple_jumps_result" BEFORE INSERT OR UPDATE ON "public"."multiple_jumps_result" FOR EACH ROW EXECUTE FUNCTION "public"."set_last_changed"();



ALTER TABLE ONLY "athlete"."athletes"
    ADD CONSTRAINT "athletes_uid_fkey" FOREIGN KEY ("uid") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."athlete"
    ADD CONSTRAINT "athlete_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("uid") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."base_result"
    ADD CONSTRAINT "base_result_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id");



ALTER TABLE ONLY "public"."basic_result"
    ADD CONSTRAINT "basic_result_base_result_id_fkey" FOREIGN KEY ("base_result_id") REFERENCES "public"."base_result"("id");



ALTER TABLE ONLY "public"."basic_result"
    ADD CONSTRAINT "basic_result_bosco_result_id_fkey" FOREIGN KEY ("bosco_result_id") REFERENCES "public"."bosco_result"("id");



ALTER TABLE ONLY "public"."bosco_result"
    ADD CONSTRAINT "bosco_result_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id");



ALTER TABLE ONLY "public"."drop_jump_result"
    ADD CONSTRAINT "drop_jump_result_base_result_id_fkey" FOREIGN KEY ("base_result_id") REFERENCES "public"."base_result"("id");



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id");



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("uid");



ALTER TABLE ONLY "public"."jump_time"
    ADD CONSTRAINT "jump_time_base_result_id_fkey" FOREIGN KEY ("base_result_id") REFERENCES "public"."base_result"("id");



ALTER TABLE ONLY "public"."multiple_drop_jump_result"
    ADD CONSTRAINT "multiple_drop_jump_result_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id");



ALTER TABLE ONLY "public"."multiple_jumps_result"
    ADD CONSTRAINT "multiple_jumps_result_base_result_id_fkey" FOREIGN KEY ("base_result_id") REFERENCES "public"."base_result"("id");



ALTER TABLE "public"."jump_time" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."set_last_changed"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_last_changed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_last_changed"() TO "service_role";


















GRANT ALL ON TABLE "public"."athlete" TO "anon";
GRANT ALL ON TABLE "public"."athlete" TO "authenticated";
GRANT ALL ON TABLE "public"."athlete" TO "service_role";



GRANT ALL ON TABLE "public"."base_result" TO "anon";
GRANT ALL ON TABLE "public"."base_result" TO "authenticated";
GRANT ALL ON TABLE "public"."base_result" TO "service_role";



GRANT ALL ON SEQUENCE "public"."base_result_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."base_result_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."base_result_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."basic_result" TO "anon";
GRANT ALL ON TABLE "public"."basic_result" TO "authenticated";
GRANT ALL ON TABLE "public"."basic_result" TO "service_role";



GRANT ALL ON SEQUENCE "public"."basic_result_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."basic_result_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."basic_result_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bosco_result" TO "anon";
GRANT ALL ON TABLE "public"."bosco_result" TO "authenticated";
GRANT ALL ON TABLE "public"."bosco_result" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bosco_result_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bosco_result_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bosco_result_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."coach" TO "anon";
GRANT ALL ON TABLE "public"."coach" TO "authenticated";
GRANT ALL ON TABLE "public"."coach" TO "service_role";



GRANT ALL ON TABLE "public"."drop_jump_result" TO "anon";
GRANT ALL ON TABLE "public"."drop_jump_result" TO "authenticated";
GRANT ALL ON TABLE "public"."drop_jump_result" TO "service_role";



GRANT ALL ON SEQUENCE "public"."drop_jump_result_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."drop_jump_result_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."drop_jump_result_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event" TO "anon";
GRANT ALL ON TABLE "public"."event" TO "authenticated";
GRANT ALL ON TABLE "public"."event" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."jump_time" TO "anon";
GRANT ALL ON TABLE "public"."jump_time" TO "authenticated";
GRANT ALL ON TABLE "public"."jump_time" TO "service_role";



GRANT ALL ON SEQUENCE "public"."jumpTime_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."jumpTime_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."jumpTime_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."multiple_drop_jump_result" TO "anon";
GRANT ALL ON TABLE "public"."multiple_drop_jump_result" TO "authenticated";
GRANT ALL ON TABLE "public"."multiple_drop_jump_result" TO "service_role";



GRANT ALL ON SEQUENCE "public"."multiple_drop_jump_result_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."multiple_drop_jump_result_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."multiple_drop_jump_result_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."multiple_jumps_result" TO "anon";
GRANT ALL ON TABLE "public"."multiple_jumps_result" TO "authenticated";
GRANT ALL ON TABLE "public"."multiple_jumps_result" TO "service_role";



GRANT ALL ON SEQUENCE "public"."multiple_jumps_result_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."multiple_jumps_result_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."multiple_jumps_result_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
