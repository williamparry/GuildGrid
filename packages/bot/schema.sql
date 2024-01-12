-- Create these tables in supabase postgres
-- Then make the RLS policies
-- Then enable realtime on gg_guild_memberships and gg_cells



----------------------------------------------------------
-- gg_cells
----------------------------------------------------------

CREATE TABLE "public"."gg_cells" (
    "id" int4 NOT NULL,
    "gg_row" int4 NOT NULL,
    "gg_column" int4 NOT NULL,
    "gg_value" text,
    "guild_id" varchar NOT NULL,
    "grid_id" int4,
    CONSTRAINT "gg_cells_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."gg_guilds"("id"),
    CONSTRAINT "gg_cells_grid_id_fkey" FOREIGN KEY ("grid_id") REFERENCES "public"."gg_grids"("id"),
    PRIMARY KEY ("id")
);

-- RLS "gg_cells_policy"
-- USING expression & WITH CHECK expression
(EXISTS ( SELECT 1
   FROM gg_guild_memberships
  WHERE (((gg_guild_memberships.user_id)::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'sub'::text)) AND ((gg_guild_memberships.guild_id)::text = (gg_cells.guild_id)::text))))



----------------------------------------------------------
-- gg_grids
----------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS gg_grids_id_seq;

CREATE TABLE "public"."gg_grids" (
    "id" int4 NOT NULL DEFAULT nextval('gg_grids_id_seq'::regclass),
    "guild_id" varchar(255) NOT NULL,
    "grid_name" varchar NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by_id" varchar NOT NULL,
    "created_by_username" varchar NOT NULL,
    "grid_slug" varchar NOT NULL,
    "has_password" bool NOT NULL DEFAULT false,
    CONSTRAINT "gg_grids_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."gg_guilds"("id"),
    PRIMARY KEY ("id")
);

-- RLS "Can read grids as a user"
-- USING expression
(EXISTS ( SELECT 1
   FROM gg_guild_memberships
  WHERE ((gg_guild_memberships.user_id)::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'sub'::text))))

-- RLS "update_has_password
-- USING expression & WITH CHECK expression
(((auth.jwt() -> 'user_metadata'::text) ->> 'sub'::text) = (created_by_id)::text)



----------------------------------------------------------
-- gg_guild_memberships
----------------------------------------------------------

CREATE TABLE "public"."gg_guild_memberships" (
    "user_id" varchar(255) NOT NULL,
    "guild_id" varchar(255) NOT NULL,
    CONSTRAINT "gg_guild_memberships_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."gg_guilds"("id"),
    PRIMARY KEY ("user_id","guild_id")
);

-- RLS "User can check if exists"
-- USING expression
(((auth.jwt() -> 'user_metadata'::text) ->> 'sub'::text) = (user_id)::text)



----------------------------------------------------------
-- gg_guilds
----------------------------------------------------------

CREATE TABLE "public"."gg_guilds" (
    "id" varchar(255) NOT NULL,
    "is_updating" bool NOT NULL DEFAULT false,
    PRIMARY KEY ("id")
);

-- RLS "deny_all"
-- USING expression
false