create type "public"."relation types" as enum ('one-to-one', 'one-to-various', 'various-to-one', 'various-to-various', 'one-to-another (symmetric)', 'various-to-each-other (symmetric)', 'various-to-each-other-in-groups (equivalence)');

drop view if exists "public"."Kinds of Value";

drop view if exists "public"."Kinds";

drop view if exists "public"."Rulebook Assertions";

alter table "public"."Relations" add column "relation_relates_kind" bigint not null default '500'::bigint;

alter table "public"."Relations" add column "relation_relates_to_kind" bigint not null default '500'::bigint;

alter table "public"."Relations" add column "relation_reversed_verb" text[];

alter table "public"."Relations" add column "relation_type" public."relation types" not null default 'one-to-one'::public."relation types";

alter table "public"."Relations" alter column "relation_verb" set data type text[] using "relation_verb"::text[];

alter table "public"."Relations" add constraint "Relations_relation_relates_kind_fkey" FOREIGN KEY (relation_relates_kind) REFERENCES public."All Kinds"(kind_id) ON UPDATE CASCADE not valid;

alter table "public"."Relations" validate constraint "Relations_relation_relates_kind_fkey";

alter table "public"."Relations" add constraint "Relations_relation_relates_to_kind_fkey" FOREIGN KEY (relation_relates_to_kind) REFERENCES public."All Kinds"(kind_id) ON UPDATE CASCADE not valid;

alter table "public"."Relations" validate constraint "Relations_relation_relates_to_kind_fkey";

set check_function_bodies = off;

create or replace view "public"."Relation Verb Assertions" as  SELECT ((((('The verb '::text || t.individual_verb) || ' means the '::text) || t.marker) || lower(r.relation_name)) || ' relation.'::text) AS relation_verb_assertion,
    r.relation_id,
    r.relation_name,
    r.relation_verb,
    r.relation_reversed_verb
   FROM (public."Relations" r
     CROSS JOIN LATERAL ( SELECT v.marker,
            v.individual_verb
           FROM ( SELECT ''::text AS marker,
                    unnest(r.relation_verb) AS individual_verb
                UNION ALL
                 SELECT 'reversed '::text AS marker,
                    unnest(r.relation_reversed_verb) AS individual_verb) v) t);


CREATE OR REPLACE FUNCTION public.pluralize_noun(singular text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    word text := lower(singular);
    len int := length(word);
    last_char text := substring(word from len for 1);
    second_to_last text := substring(word from len-1 for 1);
    last_two text := substring(word from len-1 for 2);
    last_three text := substring(word from len-2 for 3);
BEGIN
    -- [1] Handle irregular words (classic Conway/Inflector overrides)
    CASE word
        WHEN 'man' THEN RETURN 'men';
        WHEN 'woman' THEN RETURN 'women';
        WHEN 'child' THEN RETURN 'children';
        WHEN 'foot' THEN RETURN 'feet';
        WHEN 'tooth' THEN RETURN 'teeth';
        WHEN 'mouse' THEN RETURN 'mice';
        WHEN 'goose' THEN RETURN 'geese';
        ELSE END CASE;

    -- [2] Words ending in -y
    IF last_char = 'y' THEN
        IF second_to_last IN ('a', 'e', 'i', 'o', 'u') THEN
            RETURN word || 's';
        ELSE
            RETURN substring(word from 1 for len-1) || 'ies';
        END IF;

    -- [3] Words ending in sibilant sounds (-s, -x, -z, -sh, -ch)
    ELSIF last_char IN ('s', 'x', 'z') OR last_two IN ('sh', 'ch') THEN
        RETURN word || 'es';

    -- [4] Words ending in -f or -fe
    ELSIF last_char = 'f' THEN
        RETURN substring(word from 1 for len-1) || 'ves';
    ELSIF last_two = 'fe' THEN
        RETURN substring(word from 1 for len-2) || 'ves';

    -- [5] Words ending in -o preceded by a consonant
    ELSIF last_char = 'o' AND second_to_last NOT IN ('a', 'e', 'i', 'o', 'u') THEN
        RETURN word || 'es';

    -- [6] Default Rule
    ELSE
        RETURN word || 's';
    END IF;

END;
$function$
;

create or replace view "public"."Kinds of Value" as  SELECT (((((initcap(public.get_indefinite_article(a.kind_name)) || ' '::text) || lower(a.kind_name)) || ' is a kind'::text) ||
        CASE
            WHEN (k.kind_name <> 'Kind'::text) THEN (' of '::text || lower(k.kind_name))
            ELSE ''::text
        END) || '.'::text) AS kind_assertion,
    a.kind_id,
    a.kind_name,
    k.kind_name AS parent_kind_name,
    a.kind_properties
   FROM (public."All Kinds" a
     LEFT JOIN public."All Kinds" k ON ((k.kind_id = a.parent_kind_id)))
  WHERE ((a.kind_id >= 501) AND (a.kind_id <= 1000));


create or replace view "public"."Kinds" as  SELECT (((((initcap(public.get_indefinite_article(a.kind_name)) || ' '::text) || lower(a.kind_name)) || ' is a kind'::text) ||
        CASE
            WHEN (k.kind_name <> 'Kind'::text) THEN (' of '::text || lower(k.kind_name))
            ELSE ''::text
        END) || '.'::text) AS kind_assertion,
    a.kind_id,
    a.kind_name,
    k.kind_name AS parent_kind_name,
    a.kind_properties
   FROM (public."All Kinds" a
     LEFT JOIN public."All Kinds" k ON ((k.kind_id = a.parent_kind_id)))
  WHERE ((a.kind_id >= 1) AND (a.kind_id <= 499));


create or replace view "public"."Rulebook Assertions" as  SELECT ((((((((("Rulebooks".rulebook_name || ' rules is '::text) ||
        CASE
            WHEN ("Rulebooks".rulebook_basis IS NOT NULL) THEN (((public.get_indefinite_article(k.kind_name) || ' '::text) || lower(k.kind_name)) || ' based '::text)
            ELSE 'a '::text
        END) || 'rulebook'::text) ||
        CASE
            WHEN ("Rulebooks".rulebook_result_kind IS NOT NULL) THEN (((' producing '::text || public.get_indefinite_article(k2.kind_name)) || ' '::text) || lower(k2.kind_name))
            ELSE ''::text
        END) ||
        CASE
            WHEN (("Rulebooks".rulebook_named_outcomes_success IS NOT NULL) OR ("Rulebooks".rulebook_named_outcomes_failure IS NOT NULL)) THEN ' with outcomes '::text
            ELSE ''::text
        END) ||
        CASE
            WHEN ("Rulebooks".rulebook_named_outcomes_success IS NOT NULL) THEN (array_to_string("Rulebooks".rulebook_named_outcomes_success, ', '::text) || ' (success)'::text)
            ELSE ''::text
        END) ||
        CASE
            WHEN (("Rulebooks".rulebook_named_outcomes_success && "Rulebooks".rulebook_named_outcomes_failure) IS NOT NULL) THEN ' and '::text
            ELSE ''::text
        END) ||
        CASE
            WHEN ("Rulebooks".rulebook_named_outcomes_failure IS NOT NULL) THEN (array_to_string("Rulebooks".rulebook_named_outcomes_failure, ', '::text) || ' (failure)'::text)
            ELSE ''::text
        END) || '.'::text) AS rulebook_assertion,
    "Rulebooks".rulebook_id,
    "Rulebooks".rulebook_name,
    k.kind_name AS rulebook_basis_name,
    k2.kind_name AS rulebook_result_kind_name,
    "Rulebooks".rulebook_named_outcomes_success,
    "Rulebooks".rulebook_named_outcomes_failure,
    "Rulebooks".rulebook_default_outcome
   FROM ((public."Rulebooks"
     LEFT JOIN public."All Kinds" k ON ((k.kind_id = "Rulebooks".rulebook_basis)))
     LEFT JOIN public."All Kinds" k2 ON ((k2.kind_id = "Rulebooks".rulebook_result_kind)));


create or replace view "public"."Relation Assertions" as  SELECT (((((initcap("Relations".relation_name) || ' relates '::text) ||
        CASE
            WHEN ("Relations".relation_type = ANY (ARRAY['one-to-one'::public."relation types", 'one-to-various'::public."relation types", 'one-to-another (symmetric)'::public."relation types"])) THEN ('one '::text || lower(k.kind_name))
            WHEN ("Relations".relation_type = ANY (ARRAY['various-to-one'::public."relation types", 'various-to-various'::public."relation types", 'various-to-each-other (symmetric)'::public."relation types", 'various-to-each-other-in-groups (equivalence)'::public."relation types"])) THEN ('various '::text || public.pluralize_noun(lower(k.kind_name)))
            ELSE NULL::text
        END) || ' to '::text) ||
        CASE
            WHEN ("Relations".relation_type = ANY (ARRAY['one-to-one'::public."relation types", 'various-to-one'::public."relation types", 'one-to-another (symmetric)'::public."relation types"])) THEN ('one '::text || lower(k2.kind_name))
            WHEN ("Relations".relation_type = ANY (ARRAY['one-to-various'::public."relation types", 'various-to-various'::public."relation types", 'various-to-each-other (symmetric)'::public."relation types", 'various-to-each-other-in-groups (equivalence)'::public."relation types"])) THEN ('various '::text || public.pluralize_noun(lower(k2.kind_name)))
            ELSE NULL::text
        END) || '.'::text) AS rulebook_assertion,
    "Relations".relation_id,
    "Relations".relation_name,
    k.kind_name AS relation_relates_kind_name,
    k2.kind_name AS relation_relates_to_kind_name
   FROM ((public."Relations"
     LEFT JOIN public."All Kinds" k ON ((k.kind_id = "Relations".relation_relates_kind)))
     LEFT JOIN public."All Kinds" k2 ON ((k2.kind_id = "Relations".relation_relates_to_kind)));



