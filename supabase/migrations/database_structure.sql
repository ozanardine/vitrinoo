

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


CREATE SCHEMA IF NOT EXISTS "auth";


ALTER SCHEMA "auth" OWNER TO "supabase_admin";


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";


CREATE TYPE "auth"."aal_level" AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE "auth"."aal_level" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."code_challenge_method" AS ENUM (
    's256',
    'plain'
);


ALTER TYPE "auth"."code_challenge_method" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_status" AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE "auth"."factor_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_type" AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE "auth"."factor_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."one_time_token_type" AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE "auth"."one_time_token_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "public"."component_type" AS ENUM (
    'kit_item',
    'raw_material',
    'manufactured_part'
);


ALTER TYPE "public"."component_type" OWNER TO "postgres";


CREATE TYPE "public"."downgrade_status" AS ENUM (
    'pending',
    'completed',
    'failed',
    'partial'
);


ALTER TYPE "public"."downgrade_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'payment_success',
    'payment_failed',
    'payment_past_due',
    'payment_unpaid',
    'subscription_canceled',
    'subscription_created',
    'subscription_renewed',
    'trial_started',
    'trial_ending',
    'trial_ended',
    'plan_changed',
    'system_message',
    'feature_update',
    'store_visit_milestone',
    'product_view_milestone'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."product_type" AS ENUM (
    'simple',
    'variable',
    'kit',
    'manufactured',
    'service'
);


ALTER TYPE "public"."product_type" OWNER TO "postgres";


CREATE TYPE "public"."service_modality" AS ENUM (
    'presential',
    'online',
    'hybrid'
);


ALTER TYPE "public"."service_modality" OWNER TO "postgres";


CREATE TYPE "public"."social_network_type" AS ENUM (
    'website',
    'instagram',
    'facebook',
    'twitter',
    'youtube',
    'tiktok',
    'linkedin',
    'whatsapp',
    'telegram',
    'pinterest',
    'email'
);


ALTER TYPE "public"."social_network_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "auth"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION "auth"."email"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."email"() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';



CREATE OR REPLACE FUNCTION "auth"."is_owner"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_user_id uuid;
  is_service_role boolean;
BEGIN
  -- Obter ID do usuário atual
  current_user_id := auth.uid();
  
  -- Verificar se é service_role
  SELECT EXISTS (
    SELECT 1 
    FROM pg_roles 
    WHERE rolname = current_user 
    AND rolsuper = true
  ) INTO is_service_role;

  -- Retornar true apenas se for service_role
  RETURN is_service_role;
END;
$$;


ALTER FUNCTION "auth"."is_owner"() OWNER TO "postgres";


COMMENT ON FUNCTION "auth"."is_owner"() IS 'Verifica se o usuário atual tem permissões de OWNER';



CREATE OR REPLACE FUNCTION "auth"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION "auth"."jwt"() OWNER TO "supabase_auth_admin";


CREATE OR REPLACE FUNCTION "auth"."log_deletion_attempt"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  is_owner boolean;
BEGIN
  -- Verificar se é OWNER
  is_owner := auth.is_owner();

  -- Registrar tentativa
  INSERT INTO auth.deletion_attempts (
    user_id,
    attempted_by,
    success,
    reason
  ) VALUES (
    OLD.id,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    is_owner OR OLD.id = auth.uid(),
    CASE 
      WHEN is_owner THEN 'Exclusão autorizada pelo OWNER'
      WHEN OLD.id = auth.uid() THEN 'Auto-exclusão pelo usuário'
      ELSE 'Tentativa não autorizada de exclusão'
    END
  );
  
  RETURN OLD;
END;
$$;


ALTER FUNCTION "auth"."log_deletion_attempt"() OWNER TO "postgres";


COMMENT ON FUNCTION "auth"."log_deletion_attempt"() IS 'Registra tentativas de exclusão no log de auditoria';



CREATE OR REPLACE FUNCTION "auth"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION "auth"."role"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."role"() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';



CREATE OR REPLACE FUNCTION "auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION "auth"."uid"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."uid"() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';



CREATE OR REPLACE FUNCTION "public"."admin_delete_user"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."admin_delete_user"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_sync_subscription_plans"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM sync_subscription_plans();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_sync_subscription_plans"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_product_cost"("product_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_cost numeric := 0;
  component record;
BEGIN
  FOR component IN
    SELECT pc.quantity, p.price
    FROM product_components pc
    JOIN products p ON p.id = pc.component_id
    WHERE pc.product_id = product_id
  LOOP
    total_cost := total_cost + (component.quantity * component.price);
  END LOOP;

  RETURN total_cost;
END;
$$;


ALTER FUNCTION "public"."calculate_product_cost"("product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_erp_integration"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM erp_integrations
    WHERE store_id = NEW.store_id
    AND provider = 'tiny'
    AND active = true
  ) THEN
    RAISE EXCEPTION 'Não é possível modificar produtos manualmente quando há integração com ERP ativa';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_erp_integration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_plan_downgrade_excess"("p_store_id" "uuid", "p_to_plan" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_plan text;
    v_product_limit integer;
    v_category_limit integer;
    v_image_limit integer;
    v_excess jsonb := '{}'::jsonb;
    v_product_count integer;
    v_category_count integer;
    v_images_excess jsonb := '[]'::jsonb;
BEGIN
    -- Obter plano atual
    SELECT plan_type INTO v_current_plan
    FROM subscriptions
    WHERE store_id = p_store_id
    AND active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Se não encontrou plano ou o plano é igual, retornar vazio
    IF v_current_plan IS NULL OR v_current_plan = p_to_plan THEN
        RETURN '{}'::jsonb;
    END IF;
    
    -- Obter limites do novo plano
    SELECT 
        (get_plan_limits(p_to_plan)->>'products')::integer,
        (get_plan_limits(p_to_plan)->>'categories')::integer,
        (get_plan_limits(p_to_plan)->>'images_per_product')::integer
    INTO v_product_limit, v_category_limit, v_image_limit;
    
    -- Verificar excesso de produtos
    SELECT COUNT(*) INTO v_product_count 
    FROM products 
    WHERE store_id = p_store_id 
    AND parent_id IS NULL; -- Contar apenas produtos pai
    
    IF v_product_count > v_product_limit THEN
        v_excess := jsonb_set(v_excess, '{products}', jsonb_build_object(
            'count', v_product_count,
            'limit', v_product_limit,
            'excess', v_product_count - v_product_limit
        ));
    END IF;
    
    -- Verificar excesso de categorias
    SELECT COUNT(*) INTO v_category_count 
    FROM categories 
    WHERE store_id = p_store_id
    AND parent_id IS NULL; -- Contar apenas categorias principais
    
    IF v_category_count > v_category_limit THEN
        v_excess := jsonb_set(v_excess, '{categories}', jsonb_build_object(
            'count', v_category_count,
            'limit', v_category_limit,
            'excess', v_category_count - v_category_limit
        ));
    END IF;
    
    -- Verificar produtos com excesso de imagens
    SELECT jsonb_agg(p)
    INTO v_images_excess
    FROM (
        SELECT id, title, array_length(images, 1) as image_count
        FROM products
        WHERE store_id = p_store_id
        AND array_length(images, 1) > v_image_limit
    ) p;
    
    IF v_images_excess IS NOT NULL AND jsonb_array_length(v_images_excess) > 0 THEN
        v_excess := jsonb_set(v_excess, '{images}', v_images_excess);
    END IF;
    
    RETURN v_excess;
END;
$$;


ALTER FUNCTION "public"."check_plan_downgrade_excess"("p_store_id" "uuid", "p_to_plan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_trial_expiration"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Atualizar assinaturas com trial expirado
  UPDATE subscriptions
  SET
    plan_type = 'free',
    plan_name = 'Plano Gratuito',
    plan_description = 'Comece gratuitamente com recursos básicos',
    status = 'active',
    price_id = (
      SELECT id 
      FROM stripe_prices 
      WHERE product_id = (
        SELECT id 
        FROM stripe_products 
        WHERE product_id = 'prod_RlG2OrPzfx2qhZ'
      )
    ),
    amount = 0,
    trial_ends_at = NULL,
    updated_at = now()
  WHERE 
    status = 'trialing' 
    AND trial_ends_at <= now();

  -- Atualizar plano das lojas
  UPDATE stores s
  SET 
    plan_type = 'free',
    updated_at = now()
  FROM subscriptions sub
  WHERE 
    sub.store_id = s.id
    AND sub.status = 'active'
    AND sub.plan_type = 'free';
END;
$$;


ALTER FUNCTION "public"."check_trial_expiration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_unused_images"("p_store_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_used_images text[];
    v_orphaned_count integer;
    v_result jsonb;
BEGIN
    -- Verificar permissão
    IF NOT (EXISTS (
        SELECT 1 FROM stores 
        WHERE id = p_store_id AND user_id = auth.uid()
    ) OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Permissão negada';
    END IF;
    
    -- Coletar todas as imagens em uso nesta loja
    WITH all_product_images AS (
        SELECT unnest(images) AS image_url
        FROM products
        WHERE store_id = p_store_id
        AND images IS NOT NULL
        AND array_length(images, 1) > 0
    ),
    store_images AS (
        SELECT logo_url AS image_url FROM stores WHERE id = p_store_id AND logo_url IS NOT NULL
        UNION ALL
        SELECT header_image AS image_url FROM stores WHERE id = p_store_id AND header_image IS NOT NULL
    )
    SELECT array_agg(DISTINCT image_url) INTO v_used_images
    FROM (
        SELECT image_url FROM all_product_images
        UNION ALL
        SELECT image_url FROM store_images
    ) all_images;
    
    -- Registrar imagens órfãs (implementação simplificada - a lógica real dependeria
    -- de como imagens são armazenadas no seu sistema)
    INSERT INTO orphaned_images (
        store_id,
        url,
        detected_at,
        status
    )
    SELECT
        p_store_id,
        url,
        now(),
        'detected'
    FROM store_image_uploads
    WHERE store_id = p_store_id
    AND url NOT IN (SELECT unnest(v_used_images))
    AND created_at < now() - interval '1 day'
    RETURNING COUNT(*) INTO v_orphaned_count;
    
    -- Construir resultado
    v_result := jsonb_build_object(
        'used_images_count', array_length(v_used_images, 1),
        'orphaned_images_count', v_orphaned_count
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."cleanup_unused_images"("p_store_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_unread_notifications"() RETURNS integer
    LANGUAGE "sql"
    AS $$
    SELECT COUNT(*) FROM "public"."notifications"
    WHERE "user_id" = auth.uid()
    AND "read" = false;
$$;


ALTER FUNCTION "public"."count_unread_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_trial_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  trial_price_id uuid;
BEGIN
  -- Buscar preço do trial
  SELECT id INTO trial_price_id
  FROM stripe_prices
  WHERE price_id = 'price_1QrjzJKOdXEklortWB5gBFDo'
  LIMIT 1;

  -- Criar assinatura de demonstração
  INSERT INTO subscriptions (
    store_id,
    plan_type,
    plan_name,
    plan_description,
    price_id,
    amount,
    currency,
    status,
    active,
    trial_ends_at
  ) VALUES (
    NEW.id,
    'plus',
    'Plano Demonstração',
    'Experimente todos os recursos do plano Plus gratuitamente por 7 dias',
    trial_price_id,
    0,
    'brl',
    'trialing',
    true,
    now() + interval '7 days'
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_trial_subscription"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_trial_subscription"() IS 'Cria assinatura de demonstração para nova loja';



CREATE OR REPLACE FUNCTION "public"."create_user_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_content" "text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_id uuid;
BEGIN
    INSERT INTO "public"."notifications" (
        "user_id",
        "type",
        "title",
        "content",
        "read",
        "metadata",
        "created_at"
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_content,
        false,
        COALESCE(p_metadata, '{}'::jsonb),
        now()
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."create_user_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_content" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_function_key"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  chars text[] := ARRAY['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
                       'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
                       '0','1','2','3','4','5','6','7','8','9'];
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || chars[1 + floor(random() * array_length(chars, 1))];
  END LOOP;
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."generate_function_key"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."store_themes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "colors" "jsonb" NOT NULL,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "store_themes_category_check" CHECK (("category" = ANY (ARRAY['light'::"text", 'dark'::"text", 'branded'::"text"])))
);


ALTER TABLE "public"."store_themes" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_themes"() RETURNS SETOF "public"."store_themes"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT * FROM "public"."store_themes" ORDER BY "category", "name";
$$;


ALTER FUNCTION "public"."get_available_themes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cached_category_tree"("p_store_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_cache record;
    v_tree jsonb;
BEGIN
    -- Tentar obter do cache
    SELECT * INTO v_cache 
    FROM category_tree_cache
    WHERE store_id = p_store_id
    AND last_updated > now() - interval '1 hour';
    
    -- Se existe cache recente, retornar
    IF FOUND THEN
        RETURN v_cache.tree_data;
    END IF;
    
    -- Caso contrário, reconstruir e salvar
    v_tree := get_category_tree(p_store_id);
    
    -- Atualizar ou inserir no cache
    INSERT INTO category_tree_cache (store_id, tree_data)
    VALUES (p_store_id, v_tree)
    ON CONFLICT (store_id) 
    DO UPDATE SET 
        tree_data = EXCLUDED.tree_data,
        last_updated = now(),
        version = category_tree_cache.version + 1;
    
    RETURN v_tree;
END;
$$;


ALTER FUNCTION "public"."get_cached_category_tree"("p_store_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_category_full_path"("category_id_param" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "level" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY WITH RECURSIVE category_path AS (
    -- Base case: categoria atual
    SELECT c.id, c.name, 0 as level
    FROM categories c
    WHERE c.id = category_id_param

    UNION ALL

    -- Caso recursivo: busca os pais
    SELECT c.id, c.name, cp.level + 1
    FROM category_path cp
    JOIN categories c ON c.id = (
      SELECT parent_id 
      FROM categories 
      WHERE id = cp.id
    )
  )
  SELECT * FROM category_path
  ORDER BY level DESC;
END;
$$;


ALTER FUNCTION "public"."get_category_full_path"("category_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_category_path"("category_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    path text[];
    current_id uuid := category_id;
    current_name text;
BEGIN
    WHILE current_id IS NOT NULL LOOP
        SELECT name, parent_id 
        INTO current_name, current_id
        FROM categories 
        WHERE id = current_id;
        
        path := array_prepend(current_name, path);
    END LOOP;
    
    RETURN path;
END;
$$;


ALTER FUNCTION "public"."get_category_path"("category_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_category_tree"("p_store_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result jsonb;
BEGIN
    WITH RECURSIVE category_tree AS (
        -- Consulta inicial (categorias raiz)
        SELECT 
            id, 
            name, 
            slug, 
            parent_id
        FROM categories
        WHERE store_id = p_store_id AND parent_id IS NULL
        
        UNION ALL
        
        -- Consulta recursiva para encontrar categorias filhas
        SELECT 
            c.id, 
            c.name, 
            c.slug, 
            c.parent_id
        FROM categories c
        JOIN category_tree ct ON ct.id = c.parent_id
        WHERE c.store_id = p_store_id
    ),
    tree_json AS (
        -- Montar estrutura JSON para categorias sem filhas
        SELECT 
            id,
            jsonb_build_object(
                'id', id,
                'name', name,
                'slug', slug,
                'parent_id', parent_id,
                'children', '[]'::jsonb
            ) AS node,
            parent_id
        FROM category_tree
    ),
    tree_with_children AS (
        -- Versão inicial (categorias sem filhas)
        SELECT 
            id,
            node,
            parent_id
        FROM tree_json
        
        UNION ALL
        
        -- Juntar iterativamente com os pais para construir a hierarquia
        SELECT 
            p.id,
            jsonb_set(
                p.node,
                '{children}',
                COALESCE(
                    (SELECT jsonb_agg(c.node)
                     FROM tree_with_children c
                     WHERE c.parent_id = p.id),
                    '[]'::jsonb
                )
            ) AS node,
            p.parent_id
        FROM tree_json p
        WHERE EXISTS (
            SELECT 1 FROM tree_json c WHERE c.parent_id = p.id
        )
        AND NOT EXISTS (
            SELECT 1 FROM tree_with_children t WHERE t.id = p.id
            AND jsonb_array_length(t.node->'children') > 0
        )
    )
    -- Selecionar apenas categorias raiz com toda a hierarquia montada
    SELECT jsonb_agg(node)
    INTO v_result
    FROM (
        SELECT DISTINCT ON (id) node
        FROM tree_with_children
        WHERE parent_id IS NULL
        ORDER BY id, jsonb_array_length(node->'children') DESC
    ) root_categories;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_category_tree"("p_store_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_formatted_social_links"("p_store_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'type', sl.network_id,
                'url', 
                    CASE
                        WHEN snt.format_type = 'phone' THEN 
                            snt.url_template || regexp_replace(sl.value, '[^0-9]', '', 'g')
                        WHEN snt.format_type = 'username' THEN 
                            snt.url_template || regexp_replace(sl.value, '^@', '', 'g')
                        ELSE 
                            snt.url_template || sl.value
                    END,
                'displayValue', sl.value,
                'icon', snt.icon,
                'label', snt.label
            )
        ) INTO v_result
    FROM 
        "public"."store_social_links" sl
    JOIN 
        "public"."social_network_types" snt ON sl.network_id = snt.id
    WHERE 
        sl.store_id = p_store_id
        AND sl.active = true
        AND snt.active = true
    ORDER BY 
        sl.display_order, snt.display_order;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_formatted_social_links"("p_store_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_plan_limits"("plan_type" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN CASE plan_type
    WHEN 'free' THEN jsonb_build_object(
      'products', 100,
      'categories', 10,
      'images_per_product', 3,
      'name', 'Gratuito',
      'price', 0
    )
    WHEN 'basic' THEN jsonb_build_object(
      'products', 1000,
      'categories', 50,
      'images_per_product', 5,
      'name', 'Básico',
      'price', 47
    )
    WHEN 'plus' THEN jsonb_build_object(
      'products', 10000,
      'categories', 200,
      'images_per_product', 10,
      'name', 'Plus',
      'price', 97
    )
    ELSE jsonb_build_object(
      'products', 100,
      'categories', 10,
      'images_per_product', 3,
      'name', 'Gratuito',
      'price', 0
    )
  END;
END;
$$;


ALTER FUNCTION "public"."get_plan_limits"("plan_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_plan_type_from_name"("product_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN CASE 
    WHEN product_name ILIKE '%plus%' THEN 'plus'
    WHEN product_name ILIKE '%basic%' THEN 'basic'
    ELSE 'free'
  END;
END;
$$;


ALTER FUNCTION "public"."get_plan_type_from_name"("product_name" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "sku" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "promotional_price" numeric(10,2),
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "category_id" "uuid",
    "brand" "text" DEFAULT ''::"text" NOT NULL,
    "images" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "meta_title" "text",
    "meta_description" "text",
    "status" boolean DEFAULT true NOT NULL,
    "parent_id" "uuid",
    "attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "variation_attributes" "text"[] DEFAULT '{}'::"text"[],
    "duration" interval,
    "availability" "jsonb" DEFAULT '{}'::"jsonb",
    "service_location" "text",
    "service_modality" "public"."service_modality",
    "type" "public"."product_type" DEFAULT 'simple'::"public"."product_type" NOT NULL,
    "meta_keywords" "text"[],
    "meta_image" "text",
    CONSTRAINT "check_price_positive" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "check_promotional_price" CHECK ((("promotional_price" IS NULL) OR ("promotional_price" < "price"))),
    CONSTRAINT "check_service_fields" CHECK (((("type" = 'service'::"public"."product_type") AND ("service_modality" IS NOT NULL)) OR ("type" <> 'service'::"public"."product_type"))),
    CONSTRAINT "check_variation_attributes" CHECK (((("parent_id" IS NOT NULL) AND ("variation_attributes" IS NULL)) OR ("parent_id" IS NULL)))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_products_with_variations"("p_store_id" "uuid", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."products"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    -- Consulta principal para produtos pai
    WITH parent_products AS (
        SELECT *
        FROM "public"."products"
        WHERE "store_id" = p_store_id
        AND "parent_id" IS NULL
        ORDER BY "created_at" DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    -- Retornar produtos com suas variações via consulta lateral
    SELECT p.*
    FROM parent_products p
    LEFT JOIN LATERAL (
        -- Esta subconsulta atualiza o campo children do produto
        SELECT json_agg(v.*) AS children
        FROM "public"."products" v
        WHERE v.parent_id = p.id
    ) variations ON true;
$$;


ALTER FUNCTION "public"."get_products_with_variations"("p_store_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_root_categories_count"("store_id_param" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM categories
    WHERE store_id = store_id_param
    AND parent_id IS NULL
  );
END;
$$;


ALTER FUNCTION "public"."get_root_categories_count"("store_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_store_from_checkout_session"("session_id" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  store_id uuid;
BEGIN
  -- Buscar store_id do metadata da sessão
  SELECT s.id INTO store_id
  FROM stores s
  JOIN subscriptions sub ON sub.store_id = s.id
  JOIN stripe_subscriptions ss ON ss.id = sub.stripe_subscription_id
  WHERE ss.subscription_id = session_id;

  RETURN store_id;
END;
$$;


ALTER FUNCTION "public"."get_store_from_checkout_session"("session_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_store_subscription"("store_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  sub_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'plan_type', s.plan_type,
    'active', s.active,
    'status', s.status,
    'trial_ends_at', s.trial_ends_at,
    'next_payment_at', s.next_payment_at
  ) INTO sub_data
  FROM subscriptions s
  WHERE s.store_id = get_store_subscription.store_id
  AND s.active = true
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN COALESCE(sub_data, jsonb_build_object(
    'plan_type', 'free',
    'active', true,
    'status', 'active',
    'trial_ends_at', null,
    'next_payment_at', null
  ));
END;
$$;


ALTER FUNCTION "public"."get_store_subscription"("store_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_store_subscription"("store_id" "uuid") IS 'Retorna dados da assinatura ativa de uma loja';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notifications"() RETURNS SETOF "public"."notifications"
    LANGUAGE "sql"
    AS $$
    SELECT * FROM "public"."notifications"
    WHERE "user_id" = auth.uid()
    AND "read" = false
    ORDER BY "created_at" DESC;
$$;


ALTER FUNCTION "public"."get_unread_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_app_theme"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_theme text;
BEGIN
    -- Obter tema global
    SELECT theme INTO v_theme
    FROM "public"."app_settings"
    WHERE user_id = p_user_id;
    
    -- Valor padrão se não houver preferência salva
    RETURN COALESCE(v_theme, 'light');
END;
$$;


ALTER FUNCTION "public"."get_user_app_theme"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_expired_excess_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Se um item expirado está sendo arquivado permanentemente
    IF NEW.status = 'archived' AND OLD.status = 'pending' AND NEW.expires_at <= now() THEN
        -- Notificar o usuário
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            read,
            metadata,
            created_at
        ) VALUES (
            (SELECT user_id FROM stores WHERE id = NEW.store_id),
            'excess_item_archived',
            'Item arquivado permanentemente',
            'Um item arquivado durante o downgrade de plano foi movido para o arquivo permanente.',
            false,
            jsonb_build_object(
                'item_id', NEW.id,
                'resource_type', NEW.resource_type,
                'resource_id', NEW.resource_id
            ),
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_expired_excess_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO "public"."user_profiles" (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invalidate_category_cache"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Incrementar a versão do cache (para operações READ)
    UPDATE category_tree_cache
    SET version = version + 1
    WHERE store_id = NEW.store_id OR store_id = OLD.store_id;
    
    -- Agendar reconstrução do cache
    PERFORM pg_notify(
        'rebuild_category_cache', 
        json_build_object(
            'store_id', COALESCE(NEW.store_id, OLD.store_id)::text
        )::text
    );
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."invalidate_category_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_subscription_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (NEW.plan_type != OLD.plan_type OR NEW.status != OLD.status) THEN
    INSERT INTO subscription_history (
      subscription_id,
      previous_plan,
      new_plan,
      previous_status,
      new_status,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      OLD.plan_type,
      NEW.plan_type,
      OLD.status,
      NEW.status,
      CASE 
        WHEN NEW.status = 'canceled' THEN NEW.canceled_reason
        ELSE NULL
      END,
      jsonb_build_object(
        'changed_by', current_user,
        'changed_at', now(),
        'previous_active', OLD.active,
        'new_active', NEW.active
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_subscription_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."manage_product_with_variations"("p_store_id" "uuid", "p_product" "jsonb", "p_variations" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_product_id uuid;
    v_current_plan text;
    v_product_limit integer;
    v_image_limit integer;
    v_product_count integer;
    v_is_update boolean;
    v_result jsonb;
BEGIN
    -- Verificar permissão
    IF NOT EXISTS (
        SELECT 1 FROM stores 
        WHERE id = p_store_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Permissão negada';
    END IF;
    
    -- Obter limites do plano atual
    SELECT plan_type INTO v_current_plan
    FROM subscriptions
    WHERE store_id = p_store_id AND active = true
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Definir limites baseados no plano
    SELECT 
        (get_plan_limits(v_current_plan)->>'products')::integer,
        (get_plan_limits(v_current_plan)->>'images_per_product')::integer
    INTO v_product_limit, v_image_limit;
    
    -- Verificar se é atualização ou criação
    v_is_update := p_product->>'id' IS NOT NULL;
    v_product_id := (p_product->>'id')::uuid;
    
    -- Validar limites apenas para novos produtos
    IF NOT v_is_update THEN
        -- Contar produtos existentes
        SELECT COUNT(*) INTO v_product_count
        FROM products
        WHERE store_id = p_store_id
        AND parent_id IS NULL;
        
        -- Verificar se atingiu limite
        IF v_product_count >= v_product_limit THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Limite de produtos atingido para o plano atual',
                'limit', v_product_limit,
                'current', v_product_count
            );
        END IF;
    END IF;
    
    -- Validar número de imagens
    IF jsonb_array_length(p_product->'images') > v_image_limit THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Número de imagens excede o limite para o plano atual',
            'limit', v_image_limit,
            'current', jsonb_array_length(p_product->'images')
        );
    END IF;
    
    -- Criar ou atualizar produto principal
    IF v_is_update THEN
        -- Atualizar produto existente
        UPDATE products
        SET 
            title = p_product->>'title',
            description = p_product->>'description',
            brand = p_product->>'brand',
            sku = p_product->>'sku',
            price = (p_product->>'price')::numeric,
            promotional_price = NULLIF(p_product->>'promotional_price', '')::numeric,
            category_id = NULLIF(p_product->>'category_id', '')::uuid,
            images = COALESCE(array(SELECT jsonb_array_elements_text(p_product->'images')), ARRAY[]::text[]),
            tags = COALESCE(array(SELECT jsonb_array_elements_text(p_product->'tags')), ARRAY[]::text[]),
            status = COALESCE((p_product->>'status')::boolean, true),
            type = p_product->>'type',
            variation_attributes = CASE 
                WHEN p_product->>'type' = 'variable' 
                THEN COALESCE(array(SELECT jsonb_array_elements_text(p_product->'variation_attributes')), ARRAY[]::text[])
                ELSE NULL
            END,
            attributes = COALESCE(p_product->'attributes', '{}'::jsonb),
            duration = p_product->>'duration',
            availability = COALESCE(p_product->'availability', '{}'::jsonb),
            service_location = p_product->>'service_location',
            service_modality = p_product->>'service_modality',
            updated_at = now()
        WHERE id = v_product_id
        AND store_id = p_store_id;
    ELSE
        -- Criar novo produto
        INSERT INTO products (
            store_id,
            title,
            description,
            brand,
            sku,
            price,
            promotional_price,
            category_id,
            images,
            tags,
            status,
            type,
            variation_attributes,
            attributes,
            duration,
            availability,
            service_location,
            service_modality
        ) VALUES (
            p_store_id,
            p_product->>'title',
            p_product->>'description',
            p_product->>'brand',
            p_product->>'sku',
            (p_product->>'price')::numeric,
            NULLIF(p_product->>'promotional_price', '')::numeric,
            NULLIF(p_product->>'category_id', '')::uuid,
            COALESCE(array(SELECT jsonb_array_elements_text(p_product->'images')), ARRAY[]::text[]),
            COALESCE(array(SELECT jsonb_array_elements_text(p_product->'tags')), ARRAY[]::text[]),
            COALESCE((p_product->>'status')::boolean, true),
            p_product->>'type',
            CASE 
                WHEN p_product->>'type' = 'variable' 
                THEN COALESCE(array(SELECT jsonb_array_elements_text(p_product->'variation_attributes')), ARRAY[]::text[])
                ELSE NULL
            END,
            COALESCE(p_product->'attributes', '{}'::jsonb),
            p_product->>'duration',
            COALESCE(p_product->'availability', '{}'::jsonb),
            p_product->>'service_location',
            p_product->>'service_modality'
        )
        RETURNING id INTO v_product_id;
    END IF;
    
    -- Processar variações se for produto variável
    IF p_product->>'type' = 'variable' AND p_variations IS NOT NULL AND jsonb_array_length(p_variations) > 0 THEN
        -- Remover variações existentes se for atualização
        IF v_is_update THEN
            DELETE FROM products 
            WHERE parent_id = v_product_id;
        END IF;
        
        -- Inserir novas variações
        FOR i IN 0..jsonb_array_length(p_variations)-1 LOOP
            DECLARE
                v_variation jsonb := p_variations->i;
                v_variation_id uuid;
            BEGIN
                INSERT INTO products (
                    store_id,
                    parent_id,
                    title,
                    description,
                    brand,
                    sku,
                    price,
                    promotional_price,
                    images,
                    status,
                    type,
                    attributes
                ) VALUES (
                    p_store_id,
                    v_product_id,
                    (p_product->>'title') || ' - ' || (
                        SELECT string_agg(value, ' / ')
                        FROM jsonb_each_text(v_variation->'attributes')
                    ),
                    p_product->>'description',
                    p_product->>'brand',
                    v_variation->>'sku',
                    COALESCE((v_variation->>'price')::numeric, (p_product->>'price')::numeric),
                    CASE
                        WHEN (v_variation->>'promotional_price') IS NOT NULL AND (v_variation->>'promotional_price') != ''
                        THEN (v_variation->>'promotional_price')::numeric
                        ELSE NULLIF(p_product->>'promotional_price', '')::numeric
                    END,
                    COALESCE(array(SELECT jsonb_array_elements_text(v_variation->'images')), ARRAY[]::text[]),
                    true,
                    'simple',
                    COALESCE(v_variation->'attributes', '{}'::jsonb)
                )
                RETURNING id INTO v_variation_id;
            END;
        END LOOP;
    END IF;
    
    -- Retornar resultado bem-sucedido
    v_result := jsonb_build_object(
        'success', true,
        'product_id', v_product_id,
        'message', CASE 
            WHEN v_is_update THEN 'Produto atualizado com sucesso'
            ELSE 'Produto criado com sucesso'
        END
    );
    
    RETURN v_result;
EXCEPTION
    WHEN check_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Um ou mais campos têm valores inválidos: ' || SQLERRM
        );
    WHEN others THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;


ALTER FUNCTION "public"."manage_product_with_variations"("p_store_id" "uuid", "p_product" "jsonb", "p_variations" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notifications_read"("p_notification_ids" "uuid"[] DEFAULT NULL::"uuid"[]) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_count integer;
BEGIN
    IF p_notification_ids IS NULL THEN
        -- Marcar todas como lidas
        UPDATE "public"."notifications"
        SET "read" = true,
            "read_at" = now()
        WHERE "user_id" = auth.uid()
        AND "read" = false
        RETURNING COUNT(*) INTO v_count;
    ELSE
        -- Marcar notificações específicas como lidas
        UPDATE "public"."notifications"
        SET "read" = true,
            "read_at" = now()
        WHERE "id" = ANY(p_notification_ids)
        AND "user_id" = auth.uid()
        RETURNING COUNT(*) INTO v_count;
    END IF;
    
    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."mark_notifications_read"("p_notification_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_store_theme_settings"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO "public"."store_theme_settings" (
        "store_id",
        "primary_color",
        "secondary_color",
        "accent_color",
        "background",
        "header_background",
        "surface_color",
        "border_color",
        "muted_color",
        "header_style",
        "header_height",
        "header_image",
        "header_gradient",
        "header_overlay_opacity",
        "header_alignment",
        "header_visibility",
        "logo_size",
        "title_size",
        "description_size",
        "title_font",
        "body_font",
        "product_card_style",
        "grid_columns",
        "grid_gap",
        "container_width",
        "selected_preset"
    )
    SELECT
        "id",
        "primary_color",
        "secondary_color",
        "accent_color",
        "background",
        "header_background",
        "surface_color",
        "border_color",
        COALESCE("muted_color", '#6b7280'),
        COALESCE("header_style", 'solid'),
        COALESCE("header_height", '200px'),
        "header_image",
        "header_gradient",
        COALESCE("header_overlay_opacity", '0.5'),
        COALESCE("header_alignment", 'center'),
        COALESCE("header_visibility", '{"logo": true, "title": true, "description": true, "socialLinks": true}'),
        COALESCE("logo_size", '48px'),
        COALESCE("title_size", '36px'),
        COALESCE("description_size", '16px'),
        COALESCE("title_font", 'Inter'),
        COALESCE("body_font", 'Inter'),
        COALESCE("product_card_style", 'default'),
        COALESCE("grid_columns", '4'),
        COALESCE("grid_gap", '24'),
        COALESCE("container_width", '1200px'),
        "selected_preset"
    FROM "public"."stores"
    ON CONFLICT DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."migrate_store_theme_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_plan_downgrade"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_store_id uuid;
    v_user_id uuid;
    v_from_plan text;
    v_to_plan text;
    v_excess_count integer;
BEGIN
    -- Obter informações
    v_store_id := NEW.store_id;
    v_from_plan := NEW.from_plan;
    v_to_plan := NEW.to_plan;
    
    -- Obter usuário da loja
    SELECT user_id INTO v_user_id
    FROM stores
    WHERE id = v_store_id;
    
    -- Contar itens em excesso
    SELECT COUNT(*) INTO v_excess_count
    FROM plan_downgrade_excess
    WHERE store_id = v_store_id
    AND status = 'pending'
    AND previous_plan = v_from_plan
    AND new_plan = v_to_plan;
    
    -- Se o downgrade foi concluído e há itens em excesso, criar notificação
    IF NEW.status = 'completed' AND v_excess_count > 0 THEN
        -- Inserir notificação para o usuário
        INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            read,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            'plan_downgrade',
            'Downgrade de plano realizado',
            'Seu plano foi alterado de ' || v_from_plan || ' para ' || v_to_plan || '. Alguns itens foram arquivados devido aos limites do novo plano.',
            false,
            jsonb_build_object(
                'excess_count', v_excess_count,
                'from_plan', v_from_plan,
                'to_plan', v_to_plan,
                'operation_id', NEW.id
            ),
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_plan_downgrade"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_plan_downgrade"("p_store_id" "uuid", "p_to_plan" "text", "p_handle_excess" "text" DEFAULT 'archive'::"text", "p_initiated_by" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_operation_id uuid;
    v_current_plan text;
    v_excess jsonb;
    v_product_limit integer;
    v_category_limit integer;
    v_image_limit integer;
    v_processed_items jsonb := '{}'::jsonb;
    v_product_ids uuid[];
    v_category_ids uuid[];
    v_image_updates jsonb[];
    v_sub_id uuid;
BEGIN
    -- Iniciar uma operação de downgrade
    INSERT INTO plan_downgrade_operations (
        store_id,
        from_plan,
        to_plan,
        status,
        initiated_by
    )
    VALUES (
        p_store_id,
        (SELECT plan_type FROM subscriptions WHERE store_id = p_store_id AND active = true LIMIT 1),
        p_to_plan,
        'pending',
        COALESCE(p_initiated_by, auth.uid())
    )
    RETURNING id INTO v_operation_id;
    
    -- Obter ID da assinatura
    SELECT id INTO v_sub_id
    FROM subscriptions
    WHERE store_id = p_store_id AND active = true
    LIMIT 1;
    
    -- Atualizar operação com ID da assinatura
    UPDATE plan_downgrade_operations
    SET subscription_id = v_sub_id
    WHERE id = v_operation_id;
    
    -- Verificar excessos
    v_excess := check_plan_downgrade_excess(p_store_id, p_to_plan);
    
    -- Se não há excessos, realizar downgrade direto
    IF v_excess = '{}'::jsonb THEN
        -- Atualizar assinatura
        UPDATE subscriptions
        SET plan_type = p_to_plan,
            updated_at = now()
        WHERE store_id = p_store_id AND active = true;
        
        -- Atualizar loja
        UPDATE stores
        SET plan_type = p_to_plan,
            updated_at = now()
        WHERE id = p_store_id;
        
        -- Finalizar operação
        UPDATE plan_downgrade_operations
        SET status = 'completed',
            completed_at = now(),
            metadata = jsonb_build_object('excess', false)
        WHERE id = v_operation_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'operation_id', v_operation_id,
            'excess', false
        );
    END IF;
    
    -- Obter limites do novo plano
    SELECT 
        (get_plan_limits(p_to_plan)->>'products')::integer,
        (get_plan_limits(p_to_plan)->>'categories')::integer,
        (get_plan_limits(p_to_plan)->>'images_per_product')::integer
    INTO v_product_limit, v_category_limit, v_image_limit;
    
    -- Tratar excesso de produtos
    IF v_excess ? 'products' THEN
        -- Selecionar produtos excedentes (os mais antigos primeiro)
        SELECT array_agg(id) INTO v_product_ids
        FROM (
            SELECT id
            FROM products
            WHERE store_id = p_store_id
            AND parent_id IS NULL
            ORDER BY created_at DESC
            LIMIT (v_excess->'products'->>'excess')::integer
        ) p;
        
        -- Processar produtos excedentes
        IF p_handle_excess = 'archive' THEN
            -- Mover para tabela de excesso
            INSERT INTO plan_downgrade_excess (
                store_id,
                resource_type,
                resource_id,
                previous_plan,
                new_plan,
                expires_at,
                status
            )
            SELECT 
                p_store_id,
                'product',
                id,
                (SELECT plan_type FROM subscriptions WHERE store_id = p_store_id AND active = true LIMIT 1),
                p_to_plan,
                now() + interval '30 days',
                'pending'
            FROM products
            WHERE id = ANY(v_product_ids);
            
            -- Desativar produtos (não excluir)
            UPDATE products
            SET status = false,
                updated_at = now()
            WHERE id = ANY(v_product_ids);
            
            v_processed_items := jsonb_set(v_processed_items, '{products}', jsonb_build_object(
                'action', 'archived',
                'count', array_length(v_product_ids, 1)
            ));
            
        ELSIF p_handle_excess = 'delete' THEN
            -- Registrar exclusão
            INSERT INTO plan_downgrade_excess (
                store_id,
                resource_type,
                resource_id,
                previous_plan,
                new_plan,
                status
            )
            SELECT 
                p_store_id,
                'product',
                id,
                (SELECT plan_type FROM subscriptions WHERE store_id = p_store_id AND active = true LIMIT 1),
                p_to_plan,
                'deleted'
            FROM products
            WHERE id = ANY(v_product_ids);
            
            -- Excluir produtos
            DELETE FROM products
            WHERE id = ANY(v_product_ids);
            
            v_processed_items := jsonb_set(v_processed_items, '{products}', jsonb_build_object(
                'action', 'deleted',
                'count', array_length(v_product_ids, 1)
            ));
        END IF;
    END IF;
    
    -- Tratar excesso de categorias
    IF v_excess ? 'categories' THEN
        -- Selecionar categorias excedentes (as mais recentes primeiro)
        SELECT array_agg(id) INTO v_category_ids
        FROM (
            SELECT id
            FROM categories
            WHERE store_id = p_store_id
            AND parent_id IS NULL
            ORDER BY created_at DESC
            LIMIT (v_excess->'categories'->>'excess')::integer
        ) c;
        
        -- Processar categorias excedentes
        IF p_handle_excess = 'archive' THEN
            -- Mover para tabela de excesso
            INSERT INTO plan_downgrade_excess (
                store_id,
                resource_type,
                resource_id,
                previous_plan,
                new_plan,
                expires_at,
                status
            )
            SELECT 
                p_store_id,
                'category',
                id,
                (SELECT plan_type FROM subscriptions WHERE store_id = p_store_id AND active = true LIMIT 1),
                p_to_plan,
                now() + interval '30 days',
                'pending'
            FROM categories
            WHERE id = ANY(v_category_ids);
            
            -- Desativar categorias
            UPDATE categories
            SET status = false,
                updated_at = now()
            WHERE id = ANY(v_category_ids);
            
            v_processed_items := jsonb_set(v_processed_items, '{categories}', jsonb_build_object(
                'action', 'archived',
                'count', array_length(v_category_ids, 1)
            ));
            
        ELSIF p_handle_excess = 'delete' THEN
            -- Registrar exclusão
            INSERT INTO plan_downgrade_excess (
                store_id,
                resource_type,
                resource_id,
                previous_plan,
                new_plan,
                status
            )
            SELECT 
                p_store_id,
                'category',
                id,
                (SELECT plan_type FROM subscriptions WHERE store_id = p_store_id AND active = true LIMIT 1),
                p_to_plan,
                'deleted'
            FROM categories
            WHERE id = ANY(v_category_ids);
            
            -- Excluir categorias
            DELETE FROM categories
            WHERE id = ANY(v_category_ids);
            
            v_processed_items := jsonb_set(v_processed_items, '{categories}', jsonb_build_object(
                'action', 'deleted',
                'count', array_length(v_category_ids, 1)
            ));
        END IF;
    END IF;
    
    -- Tratar imagens excedentes
    IF v_excess ? 'images' THEN
        -- Processar produtos com excesso de imagens
        FOR i IN 0..jsonb_array_length(v_excess->'images')-1 LOOP
            DECLARE
                v_product_id uuid := (v_excess->'images'->i->>'id')::uuid;
                v_image_count integer := (v_excess->'images'->i->>'image_count')::integer;
                v_excess_images text[];
                v_remaining_images text[];
            BEGIN
                -- Obter imagens atuais
                SELECT images INTO v_excess_images
                FROM products
                WHERE id = v_product_id;
                
                -- Separar imagens para manter e remover
                v_remaining_images := v_excess_images[:v_image_limit];
                v_excess_images := v_excess_images[v_image_limit+1:];
                
                -- Registrar imagens excedentes
                INSERT INTO plan_downgrade_excess (
                    store_id,
                    resource_type,
                    resource_id,
                    previous_plan,
                    new_plan,
                    expires_at,
                    status,
                    metadata
                ) VALUES (
                    p_store_id,
                    'product_images',
                    v_product_id,
                    (SELECT plan_type FROM subscriptions WHERE store_id = p_store_id AND active = true LIMIT 1),
                    p_to_plan,
                    now() + interval '30 days',
                    CASE WHEN p_handle_excess = 'delete' THEN 'deleted' ELSE 'pending' END,
                    jsonb_build_object(
                        'removed_images', v_excess_images,
                        'original_count', v_image_count,
                        'removed_count', array_length(v_excess_images, 1)
                    )
                );
                
                -- Atualizar produto com imagens restantes
                UPDATE products
                SET images = v_remaining_images,
                    updated_at = now()
                WHERE id = v_product_id;
                
                -- Adicionar às estatísticas
                v_image_updates := array_append(v_image_updates, jsonb_build_object(
                    'product_id', v_product_id,
                    'removed_count', array_length(v_excess_images, 1),
                    'remaining_count', array_length(v_remaining_images, 1)
                ));
            END;
        END LOOP;
        
        v_processed_items := jsonb_set(v_processed_items, '{images}', to_jsonb(v_image_updates));
    END IF;
    
    -- Atualizar plano da assinatura
    UPDATE subscriptions
    SET plan_type = p_to_plan,
        updated_at = now()
    WHERE store_id = p_store_id AND active = true;
    
    -- Atualizar plano da loja
    UPDATE stores
    SET plan_type = p_to_plan,
        updated_at = now()
    WHERE id = p_store_id;
    
    -- Registrar transição de plano
    INSERT INTO subscription_history (
        subscription_id,
        previous_plan,
        new_plan,
        previous_status,
        new_status,
        reason,
        metadata
    ) VALUES (
        v_sub_id,
        (SELECT plan_type FROM subscriptions WHERE id = v_sub_id),
        p_to_plan,
        (SELECT status FROM subscriptions WHERE id = v_sub_id),
        (SELECT status FROM subscriptions WHERE id = v_sub_id),
        'downgrade',
        jsonb_build_object(
            'excess_handled', p_handle_excess,
            'processed_items', v_processed_items
        )
    );
    
    -- Finalizar operação
    UPDATE plan_downgrade_operations
    SET status = 'completed',
        completed_at = now(),
        metadata = jsonb_build_object(
            'excess', true,
            'processed_items', v_processed_items
        )
    WHERE id = v_operation_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'operation_id', v_operation_id,
        'excess', true,
        'processed_items', v_processed_items
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Registrar falha
    UPDATE plan_downgrade_operations
    SET status = 'failed',
        completed_at = now(),
        metadata = jsonb_build_object(
            'error', SQLERRM,
            'error_detail', SQLSTATE
        )
    WHERE id = v_operation_id;
    
    RETURN jsonb_build_object(
        'success', false,
        'operation_id', v_operation_id,
        'error', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."process_plan_downgrade"("p_store_id" "uuid", "p_to_plan" "text", "p_handle_excess" "text", "p_initiated_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_store_view"("p_store_id" "uuid", "p_page" "text", "p_session_id" "text", "p_user_agent" "text" DEFAULT NULL::"text", "p_referrer" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_id uuid;
    v_device_type text;
BEGIN
    -- Detectar tipo de dispositivo com base no user agent
    IF p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' OR p_user_agent ILIKE '%iphone%' THEN
        v_device_type := 'mobile';
    ELSIF p_user_agent ILIKE '%tablet%' OR p_user_agent ILIKE '%ipad%' THEN
        v_device_type := 'tablet';
    ELSE
        v_device_type := 'desktop';
    END IF;
    
    -- Inserir visualização
    INSERT INTO "public"."store_views" (
        "store_id",
        "user_id",
        "session_id",
        "referrer_source",
        "user_agent",
        "device_type",
        "page"
    ) VALUES (
        p_store_id,
        auth.uid(),
        p_session_id,
        p_referrer,
        p_user_agent,
        v_device_type,
        p_page
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."record_store_view"("p_store_id" "uuid", "p_page" "text", "p_session_id" "text", "p_user_agent" "text", "p_referrer" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_categories"("p_store_id" "uuid", "p_category_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_order integer := 1;
  v_id uuid;
BEGIN
  FOREACH v_id IN ARRAY p_category_ids
  LOOP
    UPDATE categories 
    SET display_order = v_order 
    WHERE id = v_id AND store_id = p_store_id;
    v_order := v_order + 1;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."reorder_categories"("p_store_id" "uuid", "p_category_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_downgrade_excess_item"("p_excess_id" "uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_store_id uuid;
    v_resource_type text;
    v_resource_id uuid;
    v_status text;
    v_result jsonb;
BEGIN
    -- Verificar se o item existe e pertence ao usuário
    SELECT 
        store_id, resource_type, resource_id, status
    INTO 
        v_store_id, v_resource_type, v_resource_id, v_status
    FROM plan_downgrade_excess
    WHERE id = p_excess_id
    AND (
        EXISTS (
            SELECT 1 FROM stores WHERE id = store_id AND user_id = COALESCE(p_user_id, auth.uid())
        ) OR 
        auth.role() = 'service_role'
    );
    
    -- Verificar se o item foi encontrado
    IF v_store_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item não encontrado ou sem permissão'
        );
    END IF;
    
    -- Verificar se já foi restaurado
    IF v_status = 'restored' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item já foi restaurado'
        );
    END IF;
    
    -- Se foi deletado, não pode ser restaurado
    IF v_status = 'deleted' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item foi excluído e não pode ser restaurado'
        );
    END IF;
    
    -- Processar restauração baseado no tipo
    IF v_resource_type = 'product' THEN
        -- Reativar produto
        UPDATE products
        SET status = true,
            updated_at = now()
        WHERE id = v_resource_id;
        
        v_result := jsonb_build_object(
            'type', 'product',
            'id', v_resource_id
        );
        
    ELSIF v_resource_type = 'category' THEN
        -- Reativar categoria
        UPDATE categories
        SET status = true,
            updated_at = now()
        WHERE id = v_resource_id;
        
        v_result := jsonb_build_object(
            'type', 'category',
            'id', v_resource_id
        );
        
    ELSIF v_resource_type = 'product_images' THEN
        -- Restaurar imagens
        DECLARE
            v_excess_record plan_downgrade_excess;
            v_current_images text[];
            v_restored_images text[];
        BEGIN
            -- Obter dados do item de excesso
            SELECT * INTO v_excess_record
            FROM plan_downgrade_excess
            WHERE id = p_excess_id;
            
            -- Obter imagens atuais do produto
            SELECT images INTO v_current_images
            FROM products
            WHERE id = v_resource_id;
            
            -- Adicionar imagens excedentes de volta
            v_restored_images := v_excess_record.metadata->'removed_images';
            v_current_images := array_cat(v_current_images, v_restored_images);
            
            -- Atualizar produto
            UPDATE products
            SET images = v_current_images,
                updated_at = now()
            WHERE id = v_resource_id;
            
            v_result := jsonb_build_object(
                'type', 'product_images',
                'product_id', v_resource_id,
                'restored_count', jsonb_array_length(v_excess_record.metadata->'removed_images'),
                'total_count', array_length(v_current_images, 1)
            );
        END;
    END IF;
    
    -- Atualizar status do item
    UPDATE plan_downgrade_excess
    SET status = 'restored',
        updated_at = now()
    WHERE id = p_excess_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'item', v_result
    );
END;
$$;


ALTER FUNCTION "public"."restore_downgrade_excess_item"("p_excess_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_store_customization"("p_store_id" "uuid", "p_customization" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
    v_updated_store stores;
    v_result jsonb;
BEGIN
    -- Verificar permissão
    SELECT user_id INTO v_user_id 
    FROM stores 
    WHERE id = p_store_id;
    
    IF v_user_id != auth.uid() AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Permissão negada';
    END IF;
    
    -- Extrair e validar campos
    -- Este bloco depende da estrutura exata do jsonb de customização
    DECLARE
        v_name text := p_customization->>'name';
        v_slug text := p_customization->>'slug';
        v_description text := p_customization->>'description';
        v_logo_url text := p_customization->>'logoUrl';
        v_primary_color text := p_customization->>'primaryColor';
        v_secondary_color text := p_customization->>'secondaryColor';
        v_accent_color text := p_customization->>'accentColor';
        v_header_background text := p_customization->>'headerBackground';
        v_background text := p_customization->>'background';
        v_surface_color text := p_customization->>'surfaceColor';
        v_border_color text := p_customization->>'borderColor';
        v_header_style text := p_customization->>'headerStyle';
        v_header_height text := p_customization->>'headerHeight';
        v_header_image text := p_customization->>'headerImage';
        v_header_gradient text := p_customization->>'headerGradient';
        v_header_overlay_opacity text := p_customization->>'headerOverlayOpacity';
        v_header_alignment text := p_customization->>'headerAlignment';
        v_header_visibility jsonb := p_customization->'headerVisibility';
        v_logo_size text := p_customization->>'logoSize';
        v_title_size text := p_customization->>'titleSize';
        v_description_size text := p_customization->>'descriptionSize';
        v_title_font text := p_customization->>'titleFont';
        v_body_font text := p_customization->>'bodyFont';
        v_product_card_style text := p_customization->>'productCardStyle';
        v_grid_columns text := p_customization->>'gridColumns';
        v_grid_gap text := p_customization->>'gridGap';
        v_container_width text := p_customization->>'containerWidth';
        v_social_links jsonb := p_customization->'socialLinks';
        v_social_settings jsonb := p_customization->'socialSettings';
        v_selected_preset text := p_customization->>'selectedPreset';
    BEGIN
        -- Validar slug se estiver sendo alterado
        IF v_slug IS NOT NULL AND v_slug != '' THEN
            -- Verificar se slug já existe para outra loja
            IF EXISTS (
                SELECT 1 FROM stores 
                WHERE slug = v_slug 
                AND id != p_store_id
            ) THEN
                RAISE EXCEPTION 'Este slug já está em uso';
            END IF;
        END IF;
        
        -- Atualizar loja com todas as customizações
        UPDATE stores
        SET 
            name = COALESCE(v_name, name),
            slug = COALESCE(v_slug, slug),
            description = COALESCE(v_description, description),
            logo_url = COALESCE(v_logo_url, logo_url),
            primary_color = COALESCE(v_primary_color, primary_color),
            secondary_color = COALESCE(v_secondary_color, secondary_color),
            accent_color = COALESCE(v_accent_color, accent_color),
            header_background = COALESCE(v_header_background, header_background),
            background = COALESCE(v_background, background),
            surface_color = COALESCE(v_surface_color, surface_color),
            border_color = COALESCE(v_border_color, border_color),
            header_style = COALESCE(v_header_style, header_style),
            header_height = COALESCE(v_header_height || 'px', header_height),
            header_image = COALESCE(v_header_image, header_image),
            header_gradient = COALESCE(v_header_gradient, header_gradient),
            header_overlay_opacity = COALESCE(v_header_overlay_opacity, header_overlay_opacity),
            header_alignment = COALESCE(v_header_alignment, header_alignment),
            header_visibility = COALESCE(v_header_visibility, header_visibility),
            logo_size = COALESCE(v_logo_size || 'px', logo_size),
            title_size = COALESCE(v_title_size || 'px', title_size),
            description_size = COALESCE(v_description_size || 'px', description_size),
            title_font = COALESCE(v_title_font, title_font),
            body_font = COALESCE(v_body_font, body_font),
            product_card_style = COALESCE(v_product_card_style, product_card_style),
            grid_columns = COALESCE(v_grid_columns, grid_columns),
            grid_gap = COALESCE(v_grid_gap, grid_gap),
            container_width = COALESCE(v_container_width, container_width),
            social_links = COALESCE(v_social_links, social_links),
            social_settings = COALESCE(v_social_settings, social_settings),
            selected_preset = v_selected_preset,
            updated_at = now()
        WHERE id = p_store_id
        RETURNING * INTO v_updated_store;
        
        -- Construir objeto de resultado
        v_result := jsonb_build_object(
            'success', true,
            'message', 'Customização salva com sucesso',
            'store', to_jsonb(v_updated_store)
        );
    EXCEPTION
        WHEN unique_violation THEN
            v_result := jsonb_build_object(
                'success', false,
                'error', 'Este slug já está em uso por outra loja'
            );
        WHEN check_violation THEN
            v_result := jsonb_build_object(
                'success', false,
                'error', 'Um ou mais campos têm valores inválidos'
            );
        WHEN others THEN
            v_result := jsonb_build_object(
                'success', false,
                'error', SQLERRM
            );
    END;
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."save_store_customization"("p_store_id" "uuid", "p_customization" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_user_app_theme"("p_theme" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Validar tema
    IF p_theme != 'light' AND p_theme != 'dark' THEN
        RAISE EXCEPTION 'Tema inválido. Use "light" ou "dark".';
    END IF;
    
    -- Salvar tema global
    INSERT INTO "public"."app_settings" (user_id, theme)
    VALUES (v_user_id, p_theme)
    ON CONFLICT (user_id) DO
    UPDATE SET 
        theme = EXCLUDED.theme,
        updated_at = now();
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."save_user_app_theme"("p_theme" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."schedule_subscription_sync"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM sync_all_subscriptions();
END;
$$;


ALTER FUNCTION "public"."schedule_subscription_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_products"("p_store_id" "uuid", "p_search" "text" DEFAULT NULL::"text", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_min_price" numeric DEFAULT NULL::numeric, "p_max_price" numeric DEFAULT NULL::numeric, "p_has_promotion" boolean DEFAULT NULL::boolean, "p_selected_tags" "text"[] DEFAULT NULL::"text"[], "p_brand" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."products"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY 
    SELECT p.*
    FROM products p
    WHERE p.store_id = p_store_id
    AND p.parent_id IS NULL
    -- Filtro de pesquisa por texto
    AND (
        p_search IS NULL 
        OR to_tsvector('portuguese', 
            COALESCE(p.title, '') || ' ' || 
            COALESCE(p.description, '') || ' ' || 
            COALESCE(p.sku, '')
        ) @@ plainto_tsquery('portuguese', p_search)
    )
    -- Filtro de categoria
    AND (
        p_category_id IS NULL 
        OR p.category_id = p_category_id 
        OR p.category_id IN (
            SELECT id FROM categories 
            WHERE parent_id = p_category_id
        )
    )
    -- Filtros de preço mínimo
    AND (
        p_min_price IS NULL 
        OR p_min_price <= 0
        OR p.price >= p_min_price 
        OR COALESCE(p.promotional_price, p.price) >= p_min_price
    )
    -- Filtros de preço máximo
    AND (
        p_max_price IS NULL 
        OR p_max_price <= 0
        OR p.price <= p_max_price 
        OR COALESCE(p.promotional_price, p.price) <= p_max_price
    )
    -- Filtro de promoção
    AND (
        p_has_promotion IS NULL
        OR (p_has_promotion = true AND p.promotional_price IS NOT NULL)
        OR (p_has_promotion = false)
    )
    -- Filtro de tags
    AND (
        p_selected_tags IS NULL 
        OR array_length(p_selected_tags, 1) IS NULL
        OR p.tags @> p_selected_tags
    )
    -- Filtro de marca
    AND (
        p_brand IS NULL 
        OR p_brand = ''
        OR p.brand = p_brand
    )
    -- Produtos ativos
    AND p.status = true
    -- Ordenação e paginação
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."search_products"("p_store_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_min_price" numeric, "p_max_price" numeric, "p_has_promotion" boolean, "p_selected_tags" "text"[], "p_brand" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_products_v2"("p_store_id" "uuid", "p_search" "text" DEFAULT NULL::"text", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_min_price" numeric DEFAULT NULL::numeric, "p_max_price" numeric DEFAULT NULL::numeric, "p_has_promotion" boolean DEFAULT NULL::boolean, "p_tags" "text"[] DEFAULT NULL::"text"[], "p_brand" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."products"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM products p
  WHERE p.store_id = p_store_id
    AND p.status = true
    AND (
      p_search IS NULL
      OR p.title ILIKE '%' || p_search || '%'
      OR p.description ILIKE '%' || p_search || '%'
      OR p.brand ILIKE '%' || p_search || '%'
      OR p.sku ILIKE '%' || p_search || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(p.tags) tag
        WHERE tag ILIKE '%' || p_search || '%'
      )
    )
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (
      p_has_promotion IS NULL
      OR (p_has_promotion = true AND p.promotional_price IS NOT NULL)
      OR (p_has_promotion = false AND p.promotional_price IS NULL)
    )
    AND (
      p_tags IS NULL
      OR EXISTS (
        SELECT 1 FROM unnest(p.tags) tag
        WHERE tag = ANY(p_tags)
      )
    )
    AND (p_brand IS NULL OR p.brand = p_brand)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."search_products_v2"("p_store_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_min_price" numeric, "p_max_price" numeric, "p_has_promotion" boolean, "p_tags" "text"[], "p_brand" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_all_subscriptions"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  sub record;
  product_name text;
BEGIN
  FOR sub IN 
    SELECT ss.*, sp.name as product_name
    FROM stripe_subscriptions ss
    JOIN stripe_prices p ON ss.price_id = p.id
    JOIN stripe_products sp ON p.product_id = sp.id
    WHERE ss.status = 'active'
  LOOP
    -- Atualizar subscription usando o nome do produto
    UPDATE subscriptions
    SET 
      plan_type = get_plan_type_from_name(sub.product_name),
      active = sub.status = 'active',
      status = sub.status,
      next_payment_at = sub.current_period_end
    WHERE stripe_subscription_id = sub.id;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."sync_all_subscriptions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_subscription_limits"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Get product features
  WITH product_info AS (
    SELECT sp.features
    FROM stripe_subscriptions ss
    JOIN stripe_prices spr ON ss.price_id = spr.id
    JOIN stripe_products sp ON spr.product_id = sp.id
    WHERE ss.id = NEW.stripe_subscription_id
  )
  UPDATE subscriptions
  SET limits = (SELECT features FROM product_info)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_subscription_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_subscription_plan"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  plan_type text;
  product_name text;
BEGIN
  -- Buscar nome do produto
  SELECT sp.name INTO product_name
  FROM stripe_prices p
  JOIN stripe_products sp ON p.product_id = sp.id
  WHERE p.id = NEW.price_id;

  -- Determinar o tipo do plano do metadata
  SELECT sp.metadata->>'plan_type' INTO plan_type
  FROM stripe_prices p
  JOIN stripe_products sp ON p.product_id = sp.id
  WHERE p.id = NEW.price_id;

  -- Fallback para determinação por nome se metadata não existir
  IF plan_type IS NULL THEN
    plan_type := CASE 
      WHEN product_name ILIKE '%plus%' THEN 'plus'
      WHEN product_name ILIKE '%basic%' THEN 'basic'
      ELSE 'free'
    END;
  END IF;

  -- Atualizar subscription
  UPDATE subscriptions
  SET 
    plan_type = COALESCE(plan_type, 'free'),
    active = NEW.status = 'active',
    status = NEW.status,
    next_payment_at = NEW.current_period_end,
    updated_at = NOW()
  WHERE stripe_subscription_id = NEW.id;

  -- Atualizar store
  IF NEW.store_id IS NOT NULL THEN
    UPDATE stores
    SET 
      plan_type = COALESCE(plan_type, 'free'),
      updated_at = NOW()
    WHERE id = NEW.store_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_subscription_plan"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_subscription_plans"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Atualizar plano_type nas subscriptions baseado nos produtos do Stripe
  UPDATE subscriptions s
  SET plan_type = COALESCE(p.metadata->>'plan_type', 'basic')
  FROM stripe_subscriptions ss
  JOIN stripe_prices sp ON ss.price_id = sp.id
  JOIN stripe_products p ON sp.product_id = p.id
  WHERE s.stripe_subscription_id = ss.id
  AND s.status = 'active';

  -- Propagar plano_type para stores
  UPDATE stores st
  SET plan_type = s.plan_type
  FROM subscriptions s
  WHERE s.store_id = st.id
  AND s.status = 'active';

  -- Definir plano gratuito para lojas sem assinatura ativa
  UPDATE stores
  SET plan_type = 'free'
  WHERE id NOT IN (
    SELECT store_id 
    FROM subscriptions 
    WHERE status = 'active'
  );
END;
$$;


ALTER FUNCTION "public"."sync_subscription_plans"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_subscription_store"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Atualizar store_id na stripe_subscription
  UPDATE stripe_subscriptions
  SET store_id = (
    SELECT store_id 
    FROM subscriptions 
    WHERE stripe_subscription_id = NEW.id
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_subscription_store"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_category_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Se não foi especificada uma ordem, coloca no final
  IF NEW.display_order IS NULL THEN
    SELECT COALESCE(MAX(display_order), 0) + 1 
    INTO NEW.display_order 
    FROM categories 
    WHERE store_id = NEW.store_id 
    AND parent_id IS NOT DISTINCT FROM NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_category_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_cost"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Atualizar preço de custo do produto
  UPDATE products
  SET attributes = jsonb_set(
    COALESCE(attributes, '{}'::jsonb),
    '{cost_price}',
    to_jsonb(calculate_product_cost(NEW.product_id))
  )
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_product_cost"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_product_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_store_active_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Se a subscription foi ativada, atualiza a store
  IF NEW.active = true AND (OLD.active = false OR OLD.active IS NULL) THEN
    UPDATE stores
    SET active_subscription_id = NEW.id
    WHERE id = NEW.store_id;
  
  -- Se a subscription foi desativada, remove referência se for a ativa
  ELSIF NEW.active = false AND OLD.active = true THEN
    UPDATE stores
    SET 
      active_subscription_id = (
        SELECT id 
        FROM subscriptions 
        WHERE store_id = NEW.store_id 
          AND active = true 
          AND id != NEW.id
        ORDER BY created_at DESC 
        LIMIT 1
      )
    WHERE id = NEW.store_id 
      AND active_subscription_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_store_active_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_store_plan"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE stores 
  SET 
    plan_type = NEW.plan_type,
    updated_at = NOW()
  WHERE id = NEW.store_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_store_plan"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_last_active"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Atualizar apenas se houver uma sessão atual
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO "public"."user_profiles" (id, last_active)
        VALUES (auth.uid(), now())
        ON CONFLICT (id) DO
        UPDATE SET last_active = EXCLUDED.last_active;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_user_last_active"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_category_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  store_plan text;
  category_limit integer;
  current_count integer;
BEGIN
  -- Só valida se for categoria pai
  IF NEW.parent_id IS NULL THEN
    -- Obtém o plano da loja
    SELECT plan_type INTO store_plan
    FROM subscriptions
    WHERE store_id = NEW.store_id
    AND active = true
    LIMIT 1;

    -- Define o limite baseado no plano
    category_limit := CASE store_plan
      WHEN 'free' THEN 10
      WHEN 'basic' THEN 50
      WHEN 'plus' THEN 200
      ELSE 10 -- Padrão para plano free
    END;

    -- Se houver limite, valida
    IF category_limit IS NOT NULL THEN
      current_count := get_root_categories_count(NEW.store_id);
      
      IF current_count >= category_limit THEN
        RAISE EXCEPTION 'Limite de categorias pai atingido para o plano %', store_plan;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."validate_category_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_erp_credentials"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Se a integração estiver ativa, todos os campos são obrigatórios
  IF NEW.active = true THEN
    IF NEW.client_id IS NULL OR 
       NEW.client_secret IS NULL OR 
       NEW.access_token IS NULL OR 
       NEW.refresh_token IS NULL OR 
       NEW.expires_at IS NULL THEN
      RAISE EXCEPTION 'Todos os campos são obrigatórios para uma integração ativa';
    END IF;
  END IF;

  -- Verificar se a loja tem plano Plus
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE store_id = NEW.store_id 
    AND plan_type = 'plus' 
    AND active = true
  ) THEN
    RAISE EXCEPTION 'Apenas lojas com plano Plus podem ter integrações com ERP';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_erp_credentials"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_image_url"("url" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN
    -- Verificar se URL é válida e termina com extensão de imagem
    RETURN url ~* '^https?://.*\.(jpe?g|png|gif|webp|svg)(\?.*)?$';
END;
$_$;


ALTER FUNCTION "public"."validate_image_url"("url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_product_attributes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  parent_attrs text[];
  missing_attrs text;
BEGIN
  -- Validar hierarquia pai/filho
  IF NEW.parent_id IS NOT NULL THEN
    -- Verificar se o pai existe e é do tipo 'variable'
    IF NOT EXISTS (
      SELECT 1 FROM products 
      WHERE id = NEW.parent_id 
      AND type = 'variable'
    ) THEN
      RAISE EXCEPTION 'O produto pai deve ser do tipo variable';
    END IF;

    -- Se é uma variação, deve ter atributos definidos
    IF NEW.attributes IS NULL OR NEW.attributes = '{}'::jsonb THEN
      RAISE EXCEPTION 'Variações devem ter atributos definidos';
    END IF;

    -- Se é uma variação, validar que tem todos os atributos do pai
    SELECT variation_attributes INTO parent_attrs
    FROM products 
    WHERE id = NEW.parent_id;

    SELECT string_agg(attr, ', ')
    INTO missing_attrs
    FROM (
      SELECT unnest(parent_attrs) as attr
      EXCEPT
      SELECT jsonb_object_keys(NEW.attributes)
    ) missing;

    IF missing_attrs IS NOT NULL THEN
      RAISE EXCEPTION 'A variação deve ter todos os atributos definidos no produto pai. Faltando: %', missing_attrs;
    END IF;
  END IF;

  -- Validar atributos para produtos variáveis
  IF NEW.type = 'variable' THEN
    IF array_length(NEW.variation_attributes, 1) IS NULL THEN
      RAISE EXCEPTION 'Produtos variáveis precisam ter pelo menos um atributo de variação';
    END IF;

    -- Verificar se os atributos existem
    IF NOT EXISTS (
      SELECT 1 FROM product_attributes
      WHERE store_id = NEW.store_id
      AND name = ANY(NEW.variation_attributes)
    ) THEN
      RAISE EXCEPTION 'Um ou mais atributos de variação não existem';
    END IF;
  END IF;

  -- Validações específicas por tipo
  CASE NEW.type
    WHEN 'simple' THEN
      -- Produtos simples podem ser variações se tiverem parent_id
      NULL;
    WHEN 'variable' THEN
      IF NEW.parent_id IS NOT NULL THEN
        RAISE EXCEPTION 'Produtos variáveis não podem ser variações';
      END IF;
    WHEN 'kit' THEN
      IF NEW.parent_id IS NOT NULL THEN
        RAISE EXCEPTION 'Produtos do tipo kit não podem ser variações';
      END IF;
    WHEN 'manufactured' THEN
      IF NEW.parent_id IS NOT NULL THEN
        RAISE EXCEPTION 'Produtos fabricados não podem ser variações';
      END IF;
    WHEN 'service' THEN
      IF NEW.parent_id IS NOT NULL THEN
        RAISE EXCEPTION 'Serviços não podem ser variações';
      END IF;
      -- Validar campos específicos de serviço
      IF NEW.duration IS NULL THEN
        RAISE EXCEPTION 'Duração é obrigatória para serviços';
      END IF;
  END CASE;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_product_attributes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_product_components"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  has_cycle boolean;
BEGIN
  -- Validar tipo do produto
  IF NOT EXISTS (
    SELECT 1 FROM products
    WHERE id = NEW.product_id
    AND type IN ('kit', 'manufactured')
  ) THEN
    RAISE EXCEPTION 'Apenas produtos do tipo kit ou fabricado podem ter componentes';
  END IF;

  -- Validar quantidade
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'A quantidade deve ser maior que zero';
  END IF;

  -- Validar ciclos (evitar referência circular)
  WITH RECURSIVE component_tree AS (
    -- Base case: componentes diretos
    SELECT component_id, ARRAY[NEW.product_id] as path
    FROM product_components
    WHERE product_id = NEW.component_id
    
    UNION ALL
    
    -- Caso recursivo
    SELECT pc.component_id, ct.path || pc.product_id
    FROM product_components pc
    JOIN component_tree ct ON pc.product_id = ct.component_id
    WHERE NOT pc.component_id = ANY(ct.path)
    AND array_length(ct.path, 1) < 10
  )
  SELECT EXISTS (
    SELECT 1 FROM component_tree 
    WHERE component_id = NEW.product_id
  ) INTO has_cycle;

  IF has_cycle THEN
    RAISE EXCEPTION 'Referência circular detectada nos componentes';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_product_components"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_product_images"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    url text;
    valid boolean := true;
BEGIN
    -- Se não há imagens, a validação passa
    IF NEW.images IS NULL OR array_length(NEW.images, 1) = 0 THEN
        RETURN NEW;
    END IF;
    
    -- Verificar cada URL no array
    FOREACH url IN ARRAY NEW.images
    LOOP
        IF NOT validate_image_url(url) THEN
            valid := false;
            EXIT;
        END IF;
    END LOOP;
    
    -- Se alguma URL for inválida, gerar erro
    IF NOT valid THEN
        RAISE EXCEPTION 'Uma ou mais URLs de imagem têm formato inválido';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_product_images"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_product_limits"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  store_plan text;
  plan_limits jsonb;
  product_count integer;
BEGIN
  -- Get store's plan
  SELECT plan_type INTO store_plan
  FROM subscriptions
  WHERE store_id = NEW.store_id
  AND active = true
  LIMIT 1;

  -- Get plan limits
  plan_limits := get_plan_limits(store_plan);

  -- Count existing products
  SELECT COUNT(*) INTO product_count
  FROM products
  WHERE store_id = NEW.store_id
  AND parent_id IS NULL; -- Only count parent products

  -- Validate product limit
  IF product_count >= (plan_limits->>'products')::integer 
  AND NEW.parent_id IS NULL -- Only check for parent products
  THEN
    RAISE EXCEPTION 'Limite de produtos atingido para o plano %', plan_limits->>'name';
  END IF;

  -- Validate images limit
  IF NEW.images IS NOT NULL AND 
     array_length(NEW.images, 1) > (plan_limits->>'images_per_product')::integer 
  THEN
    RAISE EXCEPTION 'Limite de imagens por produto atingido para o plano %', plan_limits->>'name';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_product_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_social_links"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT (
    SELECT bool_and(
      (value->>'type') IS NOT NULL AND
      (value->>'url') IS NOT NULL AND
      (value->>'type')::social_network_type IS NOT NULL
    )
    FROM jsonb_array_elements(NEW.social_links)
  ) THEN
    RAISE EXCEPTION 'Invalid social links format';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_social_links"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_subscription_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Validate status transitions
  IF NEW.status NOT IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid') THEN
    RAISE EXCEPTION 'Invalid subscription status: %', NEW.status;
  END IF;

  -- Set ended_at when status changes to canceled
  IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
    NEW.ended_at = CURRENT_TIMESTAMP;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_subscription_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_subscription_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Validar transições de status permitidas
  IF OLD.status = 'active' AND NEW.status NOT IN ('active', 'canceled', 'past_due') THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status;
  END IF;

  IF OLD.status = 'canceled' AND NEW.status != 'canceled' THEN
    RAISE EXCEPTION 'Não é possível reativar uma assinatura cancelada';
  END IF;

  -- Validar datas
  IF NEW.next_payment_at IS NOT NULL AND NEW.next_payment_at <= now() THEN
    RAISE EXCEPTION 'Data de próximo pagamento deve ser futura';
  END IF;

  IF NEW.grace_period_end IS NOT NULL AND NEW.grace_period_end <= now() THEN
    RAISE EXCEPTION 'Data de fim do período de carência deve ser futura';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_subscription_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "auth"."audit_log_entries" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "payload" "json",
    "created_at" timestamp with time zone,
    "ip_address" character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "auth"."audit_log_entries" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."audit_log_entries" IS 'Auth: Audit trail for user actions.';



CREATE TABLE IF NOT EXISTS "auth"."deletion_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "attempted_by" "uuid" NOT NULL,
    "attempted_at" timestamp with time zone DEFAULT "now"(),
    "success" boolean NOT NULL,
    "reason" "text"
);


ALTER TABLE "auth"."deletion_attempts" OWNER TO "postgres";


COMMENT ON TABLE "auth"."deletion_attempts" IS 'Registra tentativas de exclusão de usuários';



CREATE TABLE IF NOT EXISTS "auth"."flow_state" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "auth_code" "text" NOT NULL,
    "code_challenge_method" "auth"."code_challenge_method" NOT NULL,
    "code_challenge" "text" NOT NULL,
    "provider_type" "text" NOT NULL,
    "provider_access_token" "text",
    "provider_refresh_token" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "authentication_method" "text" NOT NULL,
    "auth_code_issued_at" timestamp with time zone
);


ALTER TABLE "auth"."flow_state" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."flow_state" IS 'stores metadata for pkce logins';



CREATE TABLE IF NOT EXISTS "auth"."identities" (
    "provider_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "identity_data" "jsonb" NOT NULL,
    "provider" "text" NOT NULL,
    "last_sign_in_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "email" "text" GENERATED ALWAYS AS ("lower"(("identity_data" ->> 'email'::"text"))) STORED,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "auth"."identities" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."identities" IS 'Auth: Stores identities associated to a user.';



COMMENT ON COLUMN "auth"."identities"."email" IS 'Auth: Email is a generated column that references the optional email property in the identity_data';



CREATE TABLE IF NOT EXISTS "auth"."instances" (
    "id" "uuid" NOT NULL,
    "uuid" "uuid",
    "raw_base_config" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "auth"."instances" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."instances" IS 'Auth: Manages users across multiple sites.';



CREATE TABLE IF NOT EXISTS "auth"."mfa_amr_claims" (
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "authentication_method" "text" NOT NULL,
    "id" "uuid" NOT NULL
);


ALTER TABLE "auth"."mfa_amr_claims" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_amr_claims" IS 'auth: stores authenticator method reference claims for multi factor authentication';



CREATE TABLE IF NOT EXISTS "auth"."mfa_challenges" (
    "id" "uuid" NOT NULL,
    "factor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "ip_address" "inet" NOT NULL,
    "otp_code" "text",
    "web_authn_session_data" "jsonb"
);


ALTER TABLE "auth"."mfa_challenges" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_challenges" IS 'auth: stores metadata about challenge requests made';



CREATE TABLE IF NOT EXISTS "auth"."mfa_factors" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friendly_name" "text",
    "factor_type" "auth"."factor_type" NOT NULL,
    "status" "auth"."factor_status" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "secret" "text",
    "phone" "text",
    "last_challenged_at" timestamp with time zone,
    "web_authn_credential" "jsonb",
    "web_authn_aaguid" "uuid"
);


ALTER TABLE "auth"."mfa_factors" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_factors" IS 'auth: stores metadata about factors';



CREATE TABLE IF NOT EXISTS "auth"."one_time_tokens" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "auth"."one_time_token_type" NOT NULL,
    "token_hash" "text" NOT NULL,
    "relates_to" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "one_time_tokens_token_hash_check" CHECK (("char_length"("token_hash") > 0))
);


ALTER TABLE "auth"."one_time_tokens" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."refresh_tokens" (
    "instance_id" "uuid",
    "id" bigint NOT NULL,
    "token" character varying(255),
    "user_id" character varying(255),
    "revoked" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "parent" character varying(255),
    "session_id" "uuid"
);


ALTER TABLE "auth"."refresh_tokens" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."refresh_tokens" IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';



CREATE SEQUENCE IF NOT EXISTS "auth"."refresh_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "auth"."refresh_tokens_id_seq" OWNER TO "supabase_auth_admin";


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNED BY "auth"."refresh_tokens"."id";



CREATE TABLE IF NOT EXISTS "auth"."saml_providers" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "metadata_xml" "text" NOT NULL,
    "metadata_url" "text",
    "attribute_mapping" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "name_id_format" "text",
    CONSTRAINT "entity_id not empty" CHECK (("char_length"("entity_id") > 0)),
    CONSTRAINT "metadata_url not empty" CHECK ((("metadata_url" = NULL::"text") OR ("char_length"("metadata_url") > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK (("char_length"("metadata_xml") > 0))
);


ALTER TABLE "auth"."saml_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_providers" IS 'Auth: Manages SAML Identity Provider connections.';



CREATE TABLE IF NOT EXISTS "auth"."saml_relay_states" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "request_id" "text" NOT NULL,
    "for_email" "text",
    "redirect_to" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "flow_state_id" "uuid",
    CONSTRAINT "request_id not empty" CHECK (("char_length"("request_id") > 0))
);


ALTER TABLE "auth"."saml_relay_states" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_relay_states" IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';



CREATE TABLE IF NOT EXISTS "auth"."schema_migrations" (
    "version" character varying(255) NOT NULL
);


ALTER TABLE "auth"."schema_migrations" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."schema_migrations" IS 'Auth: Manages updates to the auth system.';



CREATE TABLE IF NOT EXISTS "auth"."sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "factor_id" "uuid",
    "aal" "auth"."aal_level",
    "not_after" timestamp with time zone,
    "refreshed_at" timestamp without time zone,
    "user_agent" "text",
    "ip" "inet",
    "tag" "text"
);


ALTER TABLE "auth"."sessions" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sessions" IS 'Auth: Stores session data associated to a user.';



COMMENT ON COLUMN "auth"."sessions"."not_after" IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';



CREATE TABLE IF NOT EXISTS "auth"."sso_domains" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK (("char_length"("domain") > 0))
);


ALTER TABLE "auth"."sso_domains" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_domains" IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';



CREATE TABLE IF NOT EXISTS "auth"."sso_providers" (
    "id" "uuid" NOT NULL,
    "resource_id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK ((("resource_id" = NULL::"text") OR ("char_length"("resource_id") > 0)))
);


ALTER TABLE "auth"."sso_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_providers" IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';



COMMENT ON COLUMN "auth"."sso_providers"."resource_id" IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';



CREATE TABLE IF NOT EXISTS "auth"."users" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "aud" character varying(255),
    "role" character varying(255),
    "email" character varying(255),
    "encrypted_password" character varying(255),
    "email_confirmed_at" timestamp with time zone,
    "invited_at" timestamp with time zone,
    "confirmation_token" character varying(255),
    "confirmation_sent_at" timestamp with time zone,
    "recovery_token" character varying(255),
    "recovery_sent_at" timestamp with time zone,
    "email_change_token_new" character varying(255),
    "email_change" character varying(255),
    "email_change_sent_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "raw_app_meta_data" "jsonb",
    "raw_user_meta_data" "jsonb",
    "is_super_admin" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "phone" "text" DEFAULT NULL::character varying,
    "phone_confirmed_at" timestamp with time zone,
    "phone_change" "text" DEFAULT ''::character varying,
    "phone_change_token" character varying(255) DEFAULT ''::character varying,
    "phone_change_sent_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST("email_confirmed_at", "phone_confirmed_at")) STORED,
    "email_change_token_current" character varying(255) DEFAULT ''::character varying,
    "email_change_confirm_status" smallint DEFAULT 0,
    "banned_until" timestamp with time zone,
    "reauthentication_token" character varying(255) DEFAULT ''::character varying,
    "reauthentication_sent_at" timestamp with time zone,
    "is_sso_user" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_email_change_confirm_status_check" CHECK ((("email_change_confirm_status" >= 0) AND ("email_change_confirm_status" <= 2)))
);


ALTER TABLE "auth"."users" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."users" IS 'Auth: Stores user login data within a secure schema.';



COMMENT ON COLUMN "auth"."users"."is_sso_user" IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';



CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'light'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "app_settings_theme_check" CHECK (("theme" = ANY (ARRAY['light'::"text", 'dark'::"text"])))
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" boolean DEFAULT true NOT NULL,
    "display_order" integer,
    "meta_title" "text",
    "meta_description" "text",
    CONSTRAINT "check_valid_category_slug" CHECK (("slug" ~* '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'::"text"))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category_tree_cache" (
    "store_id" "uuid" NOT NULL,
    "tree_data" "jsonb" NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."category_tree_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."erp_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid",
    "provider" "text" DEFAULT 'tiny'::"text" NOT NULL,
    "api_key" "text",
    "api_token" "text",
    "active" boolean DEFAULT false,
    "last_sync" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "client_id" "text",
    "client_secret" "text",
    "access_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."erp_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."function_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."function_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."function_logs" (
    "id" integer NOT NULL,
    "function_name" "text",
    "executed_at" timestamp without time zone DEFAULT "now"(),
    "executed_by" "uuid"
);


ALTER TABLE "public"."function_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."function_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."function_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."function_logs_id_seq" OWNED BY "public"."function_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."plan_downgrade_excess" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid",
    "resource_type" "text" NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "previous_plan" "text" NOT NULL,
    "new_plan" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    CONSTRAINT "plan_downgrade_excess_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'archived'::"text", 'restored'::"text", 'deleted'::"text"])))
);


ALTER TABLE "public"."plan_downgrade_excess" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_downgrade_operations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid",
    "subscription_id" "uuid",
    "from_plan" "text" NOT NULL,
    "to_plan" "text" NOT NULL,
    "initiated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "status" "public"."downgrade_status" DEFAULT 'pending'::"public"."downgrade_status",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "initiated_by" "uuid"
);


ALTER TABLE "public"."plan_downgrade_operations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_attributes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "options" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_attributes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_components" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "component_id" "uuid",
    "component_type" "public"."component_type" NOT NULL,
    "quantity" numeric(10,3) DEFAULT 1 NOT NULL,
    "unit" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_components" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."social_network_types" (
    "id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "url_template" "text" NOT NULL,
    "format_type" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "active" boolean DEFAULT true,
    CONSTRAINT "social_network_types_format_type_check" CHECK (("format_type" = ANY (ARRAY['phone'::"text", 'username'::"text", 'email'::"text", 'url'::"text"])))
);


ALTER TABLE "public"."social_network_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_social_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "network_id" "text" NOT NULL,
    "value" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."store_social_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_theme_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "primary_color" "text" DEFAULT '#FFFFFF'::"text",
    "secondary_color" "text" DEFAULT '#000000'::"text",
    "accent_color" "text" DEFAULT '#3b82f6'::"text",
    "background" "text" DEFAULT '#FFFFFF'::"text",
    "header_background" "text" DEFAULT '#FFFFFF'::"text",
    "surface_color" "text" DEFAULT '#FFFFFF'::"text",
    "border_color" "text" DEFAULT '#e5e7eb'::"text",
    "muted_color" "text" DEFAULT '#6b7280'::"text",
    "header_style" "text" NOT NULL,
    "header_height" "text" DEFAULT '200px'::"text",
    "header_image" "text",
    "header_gradient" "text",
    "header_overlay_opacity" "text" DEFAULT '0.5'::"text",
    "header_alignment" "text" NOT NULL,
    "header_visibility" "jsonb" DEFAULT '{"logo": true, "title": true, "description": true, "socialLinks": true}'::"jsonb",
    "logo_size" "text" DEFAULT '48px'::"text",
    "title_size" "text" DEFAULT '36px'::"text",
    "description_size" "text" DEFAULT '16px'::"text",
    "title_font" "text" DEFAULT 'Inter'::"text",
    "body_font" "text" DEFAULT 'Inter'::"text",
    "product_card_style" "text" NOT NULL,
    "grid_columns" "text" DEFAULT '4'::"text",
    "grid_gap" "text" DEFAULT '24'::"text",
    "container_width" "text" DEFAULT '1200px'::"text",
    "selected_preset" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "store_theme_settings_header_alignment_check" CHECK (("header_alignment" = ANY (ARRAY['left'::"text", 'center'::"text", 'right'::"text"]))),
    CONSTRAINT "store_theme_settings_header_style_check" CHECK (("header_style" = ANY (ARRAY['solid'::"text", 'gradient'::"text", 'image'::"text"]))),
    CONSTRAINT "store_theme_settings_product_card_style_check" CHECK (("product_card_style" = ANY (ARRAY['default'::"text", 'compact'::"text", 'minimal'::"text"])))
);


ALTER TABLE "public"."store_theme_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "referrer_source" "text",
    "user_agent" "text",
    "device_type" "text",
    "page" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."store_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "primary_color" "text" DEFAULT '#000000'::"text",
    "secondary_color" "text" DEFAULT '#ffffff'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "social_links" "jsonb" DEFAULT '[]'::"jsonb",
    "description_size" "text" DEFAULT '18px'::"text",
    "header_style" "text" DEFAULT 'solid'::"text",
    "header_image" "text",
    "header_gradient" "text" DEFAULT 'to bottom'::"text",
    "header_height" "text" DEFAULT '400px'::"text",
    "logo_size" "text" DEFAULT '160px'::"text",
    "title_size" "text" DEFAULT '48px'::"text",
    "accent_color" "text" DEFAULT '#0066FF'::"text",
    "header_overlay_opacity" "text" DEFAULT '50'::"text",
    "header_alignment" "text" DEFAULT 'center'::"text",
    "title_font" "text" DEFAULT 'sans'::"text",
    "body_font" "text" DEFAULT 'sans'::"text",
    "product_card_style" "text" DEFAULT 'default'::"text",
    "grid_columns" "text" DEFAULT '4'::"text",
    "grid_gap" "text" DEFAULT '24'::"text",
    "container_width" "text" DEFAULT 'max-w-7xl'::"text",
    "social_settings" "jsonb" DEFAULT '{"displayFormat": "username", "contactsPosition": "above"}'::"jsonb",
    "header_visibility" "jsonb" DEFAULT "jsonb_build_object"('logo', true, 'title', true, 'description', true, 'socialLinks', true),
    "plan_type" "text" DEFAULT 'free'::"text",
    "active_subscription_id" "uuid",
    "allow_theme_toggle" boolean DEFAULT true,
    "header_background" "text" DEFAULT '#ffffff'::"text",
    "title_font_category" character varying(10) DEFAULT 'sans'::character varying,
    "body_font_category" character varying(10) DEFAULT 'sans'::character varying,
    "surface_color" character varying(7),
    "border_color" character varying(7),
    "muted_color" character varying(7),
    "header_text_color" character varying(7),
    "background" "text",
    "selected_preset" "text",
    CONSTRAINT "body_font_category_check" CHECK ((("body_font_category")::"text" = ANY ((ARRAY['sans'::character varying, 'serif'::character varying, 'mono'::character varying])::"text"[]))),
    CONSTRAINT "check_valid_store_slug" CHECK ((("slug" ~* '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'::"text") AND ("length"("slug") >= 3) AND ("length"("slug") <= 63))),
    CONSTRAINT "stores_container_width_check" CHECK (("container_width" = ANY (ARRAY['max-w-5xl'::"text", 'max-w-6xl'::"text", 'max-w-7xl'::"text", 'max-w-full'::"text"]))),
    CONSTRAINT "stores_grid_columns_check" CHECK (("grid_columns" = ANY (ARRAY['2'::"text", '3'::"text", '4'::"text", '5'::"text"]))),
    CONSTRAINT "stores_header_alignment_check" CHECK (("header_alignment" = ANY (ARRAY['left'::"text", 'center'::"text", 'right'::"text"]))),
    CONSTRAINT "stores_product_card_style_check" CHECK (("product_card_style" = ANY (ARRAY['default'::"text", 'compact'::"text", 'minimal'::"text"]))),
    CONSTRAINT "title_font_category_check" CHECK ((("title_font_category")::"text" = ANY ((ARRAY['sans'::character varying, 'serif'::character varying, 'mono'::character varying, 'display'::character varying])::"text"[])))
);


ALTER TABLE "public"."stores" OWNER TO "postgres";


COMMENT ON COLUMN "public"."stores"."description_size" IS 'Size of the store description text in pixels';



COMMENT ON COLUMN "public"."stores"."header_style" IS 'Header style type: solid, gradient, or image';



COMMENT ON COLUMN "public"."stores"."header_image" IS 'URL of the header background image';



COMMENT ON COLUMN "public"."stores"."header_gradient" IS 'Direction of the header gradient';



COMMENT ON COLUMN "public"."stores"."header_height" IS 'Height of the header in pixels';



COMMENT ON COLUMN "public"."stores"."logo_size" IS 'Size of the store logo in pixels';



COMMENT ON COLUMN "public"."stores"."title_size" IS 'Size of the store title in pixels';



COMMENT ON COLUMN "public"."stores"."accent_color" IS 'Cor de destaque para botões e elementos importantes';



COMMENT ON COLUMN "public"."stores"."header_overlay_opacity" IS 'Opacidade da sobreposição do cabeçalho (0-100)';



COMMENT ON COLUMN "public"."stores"."header_alignment" IS 'Alinhamento do conteúdo do cabeçalho (left, center, right)';



COMMENT ON COLUMN "public"."stores"."title_font" IS 'Fonte usada para títulos (sans, serif, display)';



COMMENT ON COLUMN "public"."stores"."body_font" IS 'Fonte usada para textos (sans, serif, mono)';



COMMENT ON COLUMN "public"."stores"."product_card_style" IS 'Estilo dos cards de produto (default, compact, minimal)';



COMMENT ON COLUMN "public"."stores"."grid_columns" IS 'Número de colunas na grade de produtos (2-5)';



COMMENT ON COLUMN "public"."stores"."grid_gap" IS 'Espaçamento entre os produtos em pixels';



COMMENT ON COLUMN "public"."stores"."container_width" IS 'Largura máxima do conteúdo (max-w-5xl, max-w-6xl, max-w-7xl, max-w-full)';



COMMENT ON COLUMN "public"."stores"."active_subscription_id" IS 'ID da assinatura ativa atual da loja';



CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "customer_id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "phone" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_customers" OWNER TO "postgres";


COMMENT ON TABLE "public"."stripe_customers" IS 'Clientes do Stripe vinculados aos usuários';



CREATE TABLE IF NOT EXISTS "public"."stripe_prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "price_id" "text" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "unit_amount" integer NOT NULL,
    "currency" "text" DEFAULT 'brl'::"text" NOT NULL,
    "interval" "text" DEFAULT 'month'::"text" NOT NULL,
    "interval_count" integer DEFAULT 1 NOT NULL,
    "trial_period_days" integer,
    "active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "positive_amount" CHECK (("unit_amount" >= 0)),
    CONSTRAINT "valid_interval" CHECK (("interval" = ANY (ARRAY['day'::"text", 'week'::"text", 'month'::"text", 'year'::"text"]))),
    CONSTRAINT "valid_trial" CHECK ((("trial_period_days" IS NULL) OR ("trial_period_days" > 0)))
);


ALTER TABLE "public"."stripe_prices" OWNER TO "postgres";


COMMENT ON TABLE "public"."stripe_prices" IS 'Preços dos planos no Stripe';



CREATE TABLE IF NOT EXISTS "public"."stripe_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_metadata" CHECK ((("metadata" ? 'plan_type'::"text") AND (("metadata" ->> 'plan_type'::"text") = ANY (ARRAY['free'::"text", 'basic'::"text", 'plus'::"text"]))))
);


ALTER TABLE "public"."stripe_products" OWNER TO "postgres";


COMMENT ON TABLE "public"."stripe_products" IS 'Produtos/Planos cadastrados no Stripe';



CREATE TABLE IF NOT EXISTS "public"."stripe_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "text" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "price_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false,
    "canceled_at" timestamp with time zone,
    "cancel_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_dates" CHECK ((("current_period_start" < "current_period_end") AND (("trial_start" IS NULL) OR ("trial_end" IS NULL) OR ("trial_start" < "trial_end")) AND (("canceled_at" IS NULL) OR ("canceled_at" <= "ended_at")))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['incomplete'::"text", 'incomplete_expired'::"text", 'trialing'::"text", 'active'::"text", 'past_due'::"text", 'canceled'::"text", 'unpaid'::"text"])))
);


ALTER TABLE "public"."stripe_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."stripe_subscriptions" IS 'Assinaturas ativas no Stripe';



CREATE TABLE IF NOT EXISTS "public"."stripe_webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "error_message" "text",
    "processed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['processing'::"text", 'success'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."stripe_webhook_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."stripe_webhook_logs" IS 'Logs de webhooks do Stripe';



CREATE TABLE IF NOT EXISTS "public"."subscription_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "previous_plan" "text",
    "new_plan" "text",
    "previous_status" "text",
    "new_status" "text",
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "valid_plans" CHECK (((("previous_plan" IS NULL) OR ("previous_plan" = ANY (ARRAY['free'::"text", 'basic'::"text", 'plus'::"text"]))) AND (("new_plan" IS NULL) OR ("new_plan" = ANY (ARRAY['free'::"text", 'basic'::"text", 'plus'::"text"]))))),
    CONSTRAINT "valid_statuses" CHECK (((("previous_status" IS NULL) OR ("previous_status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'past_due'::"text", 'canceled'::"text"]))) AND (("new_status" IS NULL) OR ("new_status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'past_due'::"text", 'canceled'::"text"])))))
);


ALTER TABLE "public"."subscription_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscription_history" IS 'Histórico de mudanças em assinaturas';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_id" "uuid" NOT NULL,
    "stripe_subscription_id" "uuid",
    "plan_type" "text" DEFAULT 'free'::"text" NOT NULL,
    "plan_name" "text" DEFAULT 'Gratuito'::"text" NOT NULL,
    "plan_description" "text",
    "price_id" "uuid",
    "amount" integer,
    "currency" "text" DEFAULT 'brl'::"text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "trial_ends_at" timestamp with time zone,
    "next_payment_at" timestamp with time zone,
    "grace_period_end" timestamp with time zone,
    "canceled_reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_amount" CHECK ((("amount" IS NULL) OR ("amount" >= 0))),
    CONSTRAINT "valid_dates" CHECK (((("trial_ends_at" IS NULL) OR ("trial_ends_at" > "created_at")) AND (("next_payment_at" IS NULL) OR ("next_payment_at" > "created_at")) AND (("grace_period_end" IS NULL) OR ("grace_period_end" > "created_at")))),
    CONSTRAINT "valid_plan_type" CHECK (("plan_type" = ANY (ARRAY['free'::"text", 'basic'::"text", 'plus'::"text"]))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'past_due'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'Assinaturas das lojas';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "avatar_url" "text",
    "preferred_language" "text" DEFAULT 'pt-BR'::"text",
    "marketing_opt_in" boolean DEFAULT true,
    "last_active" timestamp with time zone,
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text"
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";


ALTER TABLE ONLY "auth"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"auth"."refresh_tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."function_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."function_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "amr_id_pk" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."audit_log_entries"
    ADD CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."deletion_attempts"
    ADD CONSTRAINT "deletion_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."flow_state"
    ADD CONSTRAINT "flow_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_provider_id_provider_unique" UNIQUE ("provider_id", "provider");



ALTER TABLE ONLY "auth"."instances"
    ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_authentication_method_pkey" UNIQUE ("session_id", "authentication_method");



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_last_challenged_at_key" UNIQUE ("last_challenged_at");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_entity_id_key" UNIQUE ("entity_id");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_providers"
    ADD CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_store_id_name_parent_id_key" UNIQUE ("store_id", "name", "parent_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_store_id_slug_key" UNIQUE ("store_id", "slug");



ALTER TABLE ONLY "public"."category_tree_cache"
    ADD CONSTRAINT "category_tree_cache_pkey" PRIMARY KEY ("store_id");



ALTER TABLE ONLY "public"."erp_integrations"
    ADD CONSTRAINT "erp_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."function_keys"
    ADD CONSTRAINT "function_keys_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."function_keys"
    ADD CONSTRAINT "function_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."function_logs"
    ADD CONSTRAINT "function_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_downgrade_excess"
    ADD CONSTRAINT "plan_downgrade_excess_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_downgrade_operations"
    ADD CONSTRAINT "plan_downgrade_operations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_attributes"
    ADD CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_attributes"
    ADD CONSTRAINT "product_attributes_store_id_name_key" UNIQUE ("store_id", "name");



ALTER TABLE ONLY "public"."product_components"
    ADD CONSTRAINT "product_components_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_components"
    ADD CONSTRAINT "product_components_product_id_component_id_key" UNIQUE ("product_id", "component_id");



ALTER TABLE ONLY "public"."product_views"
    ADD CONSTRAINT "product_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_network_types"
    ADD CONSTRAINT "social_network_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_social_links"
    ADD CONSTRAINT "store_social_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_social_links"
    ADD CONSTRAINT "store_social_links_store_id_network_id_key" UNIQUE ("store_id", "network_id");



ALTER TABLE ONLY "public"."store_theme_settings"
    ADD CONSTRAINT "store_theme_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_themes"
    ADD CONSTRAINT "store_themes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_views"
    ADD CONSTRAINT "store_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_prices"
    ADD CONSTRAINT "stripe_prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_prices"
    ADD CONSTRAINT "stripe_prices_price_id_key" UNIQUE ("price_id");



ALTER TABLE ONLY "public"."stripe_products"
    ADD CONSTRAINT "stripe_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_products"
    ADD CONSTRAINT "stripe_products_product_id_key" UNIQUE ("product_id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_subscription_id_key" UNIQUE ("subscription_id");



ALTER TABLE ONLY "public"."stripe_webhook_logs"
    ADD CONSTRAINT "stripe_webhook_logs_event_id_key" UNIQUE ("event_id");



ALTER TABLE ONLY "public"."stripe_webhook_logs"
    ADD CONSTRAINT "stripe_webhook_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "unique_sku_per_store" UNIQUE ("store_id", "sku");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");



CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING "btree" ("instance_id");



CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" USING "btree" ("confirmation_token") WHERE (("confirmation_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" USING "btree" ("email_change_token_current") WHERE (("email_change_token_current")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" USING "btree" ("email_change_token_new") WHERE (("email_change_token_new")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING "btree" ("user_id", "created_at");



CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING "btree" ("created_at" DESC);



CREATE INDEX "identities_email_idx" ON "auth"."identities" USING "btree" ("email" "text_pattern_ops");



COMMENT ON INDEX "auth"."identities_email_idx" IS 'Auth: Ensures indexed queries on the email column';



CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING "btree" ("user_id");



CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING "btree" ("auth_code");



CREATE INDEX "idx_deletion_attempts_attempted_by" ON "auth"."deletion_attempts" USING "btree" ("attempted_by");



CREATE INDEX "idx_deletion_attempts_user" ON "auth"."deletion_attempts" USING "btree" ("user_id");



CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING "btree" ("user_id", "authentication_method");



CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" USING "btree" ("friendly_name", "user_id") WHERE (TRIM(BOTH FROM "friendly_name") <> ''::"text");



CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING "btree" ("user_id");



CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("relates_to");



CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("token_hash");



CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" USING "btree" ("user_id", "token_type");



CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" USING "btree" ("reauthentication_token") WHERE (("reauthentication_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" USING "btree" ("recovery_token") WHERE (("recovery_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id");



CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id", "user_id");



CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING "btree" ("parent");



CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING "btree" ("session_id", "revoked");



CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING "btree" ("updated_at" DESC);



CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING "btree" ("sso_provider_id");



CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING "btree" ("created_at" DESC);



CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING "btree" ("for_email");



CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING "btree" ("sso_provider_id");



CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING "btree" ("not_after" DESC);



CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" USING "btree" ("lower"("domain"));



CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING "btree" ("sso_provider_id");



CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" USING "btree" ("lower"("resource_id"));



CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" USING "btree" ("user_id", "phone");



CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING "btree" ("user_id", "created_at");



CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" USING "btree" ("email") WHERE ("is_sso_user" = false);



COMMENT ON INDEX "auth"."users_email_partial_key" IS 'Auth: A partial unique index that applies only when is_sso_user is false';



CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING "btree" ("instance_id", "lower"(("email")::"text"));



CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING "btree" ("instance_id");



CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING "btree" ("is_anonymous");



CREATE INDEX "idx_categories_display_order" ON "public"."categories" USING "btree" ("display_order");



CREATE INDEX "idx_categories_parent_id" ON "public"."categories" USING "btree" ("parent_id");



CREATE INDEX "idx_categories_status" ON "public"."categories" USING "btree" ("status");



CREATE INDEX "idx_categories_store_id" ON "public"."categories" USING "btree" ("store_id");



CREATE INDEX "idx_categories_store_parent" ON "public"."categories" USING "btree" ("store_id", "parent_id");



CREATE INDEX "idx_erp_integrations_store_id" ON "public"."erp_integrations" USING "btree" ("store_id");



CREATE INDEX "idx_erp_integrations_store_provider" ON "public"."erp_integrations" USING "btree" ("store_id", "provider");



CREATE INDEX "idx_function_keys_name" ON "public"."function_keys" USING "btree" ("name");



CREATE INDEX "idx_notifications_created" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id", "read");



CREATE INDEX "idx_plan_downgrade_excess_resource" ON "public"."plan_downgrade_excess" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_plan_downgrade_excess_status" ON "public"."plan_downgrade_excess" USING "btree" ("status");



CREATE INDEX "idx_plan_downgrade_excess_store" ON "public"."plan_downgrade_excess" USING "btree" ("store_id");



CREATE INDEX "idx_plan_downgrade_operations_status" ON "public"."plan_downgrade_operations" USING "btree" ("status");



CREATE INDEX "idx_plan_downgrade_operations_store" ON "public"."plan_downgrade_operations" USING "btree" ("store_id");



CREATE INDEX "idx_product_attributes_store" ON "public"."product_attributes" USING "btree" ("store_id", "name");



CREATE INDEX "idx_product_attributes_store_id" ON "public"."product_attributes" USING "btree" ("store_id");



CREATE INDEX "idx_product_attributes_store_name" ON "public"."product_attributes" USING "btree" ("store_id", "name");



CREATE INDEX "idx_product_components_component_id" ON "public"."product_components" USING "btree" ("component_id");



CREATE INDEX "idx_product_components_product" ON "public"."product_components" USING "btree" ("product_id");



CREATE INDEX "idx_product_components_product_id" ON "public"."product_components" USING "btree" ("product_id");



CREATE INDEX "idx_products_attributes" ON "public"."products" USING "gin" ("attributes");



CREATE INDEX "idx_products_brand" ON "public"."products" USING "btree" ("brand");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_products_category_id" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_products_common_filters" ON "public"."products" USING "btree" ("store_id", "status", "brand");



CREATE INDEX "idx_products_created_at" ON "public"."products" USING "btree" ("created_at");



CREATE INDEX "idx_products_fulltext_search" ON "public"."products" USING "gin" ("to_tsvector"('"portuguese"'::"regconfig", ((((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("description", ''::"text")) || ' '::"text") || COALESCE("sku", ''::"text"))));



CREATE INDEX "idx_products_parent" ON "public"."products" USING "btree" ("parent_id");



CREATE INDEX "idx_products_parent_id" ON "public"."products" USING "btree" ("parent_id");



CREATE INDEX "idx_products_parent_type" ON "public"."products" USING "btree" ("parent_id") WHERE ("parent_id" IS NOT NULL);



CREATE INDEX "idx_products_price" ON "public"."products" USING "btree" ("price", "promotional_price");



CREATE INDEX "idx_products_service_modality" ON "public"."products" USING "btree" ("service_modality") WHERE ("type" = 'service'::"public"."product_type");



CREATE INDEX "idx_products_sku" ON "public"."products" USING "btree" ("sku");



CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status");



CREATE INDEX "idx_products_store_status" ON "public"."products" USING "btree" ("store_id", "status");



CREATE INDEX "idx_products_tags" ON "public"."products" USING "gin" ("tags");



CREATE INDEX "idx_products_type" ON "public"."products" USING "btree" ("type");



CREATE INDEX "idx_stores_header_alignment" ON "public"."stores" USING "btree" ("header_alignment");



CREATE INDEX "idx_stores_header_style" ON "public"."stores" USING "btree" ("header_style");



CREATE INDEX "idx_stores_plan_type" ON "public"."stores" USING "btree" ("plan_type");



CREATE INDEX "idx_stores_product_card_style" ON "public"."stores" USING "btree" ("product_card_style");



CREATE INDEX "idx_stores_social_links" ON "public"."stores" USING "gin" ("social_links");



CREATE INDEX "idx_stripe_customers_customer" ON "public"."stripe_customers" USING "btree" ("customer_id");



CREATE INDEX "idx_stripe_customers_user" ON "public"."stripe_customers" USING "btree" ("user_id");



CREATE INDEX "idx_stripe_prices_active" ON "public"."stripe_prices" USING "btree" ("active");



CREATE INDEX "idx_stripe_prices_product" ON "public"."stripe_prices" USING "btree" ("product_id");



CREATE INDEX "idx_stripe_products_active" ON "public"."stripe_products" USING "btree" ("active");



CREATE INDEX "idx_stripe_subscriptions_customer" ON "public"."stripe_subscriptions" USING "btree" ("customer_id");



CREATE INDEX "idx_stripe_subscriptions_status" ON "public"."stripe_subscriptions" USING "btree" ("status");



CREATE INDEX "idx_stripe_subscriptions_store" ON "public"."stripe_subscriptions" USING "btree" ("store_id");



CREATE INDEX "idx_subscription_history_changed_at" ON "public"."subscription_history" USING "btree" ("changed_at");



CREATE INDEX "idx_subscription_history_subscription" ON "public"."subscription_history" USING "btree" ("subscription_id");



CREATE INDEX "idx_subscriptions_plan_type" ON "public"."subscriptions" USING "btree" ("plan_type");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_store" ON "public"."subscriptions" USING "btree" ("store_id");



CREATE INDEX "idx_subscriptions_store_active" ON "public"."subscriptions" USING "btree" ("store_id", "active");



CREATE INDEX "idx_subscriptions_stripe" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_subscriptions_trial_ends" ON "public"."subscriptions" USING "btree" ("trial_ends_at") WHERE ("status" = 'trialing'::"text");



CREATE INDEX "idx_webhook_logs_event" ON "public"."stripe_webhook_logs" USING "btree" ("event_id");



CREATE INDEX "idx_webhook_logs_status" ON "public"."stripe_webhook_logs" USING "btree" ("status");



CREATE INDEX "product_views_created_at_idx" ON "public"."product_views" USING "btree" ("created_at");



CREATE INDEX "product_views_product_id_idx" ON "public"."product_views" USING "btree" ("product_id");



CREATE INDEX "product_views_store_id_created_at_idx" ON "public"."product_views" USING "btree" ("store_id", "created_at");



CREATE INDEX "product_views_store_id_idx" ON "public"."product_views" USING "btree" ("store_id");



CREATE INDEX "store_social_links_store_id_idx" ON "public"."store_social_links" USING "btree" ("store_id");



CREATE INDEX "store_theme_settings_store_id_idx" ON "public"."store_theme_settings" USING "btree" ("store_id");



CREATE INDEX "store_views_created_at_idx" ON "public"."store_views" USING "btree" ("created_at");



CREATE INDEX "store_views_store_id_created_at_idx" ON "public"."store_views" USING "btree" ("store_id", "created_at");



CREATE INDEX "store_views_store_id_idx" ON "public"."store_views" USING "btree" ("store_id");



CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");



CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");



CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");



CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");



CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");



CREATE OR REPLACE TRIGGER "log_user_deletion_attempt" BEFORE DELETE ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "auth"."log_deletion_attempt"();



CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();



CREATE OR REPLACE TRIGGER "check_erp_integration_trigger" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."check_erp_integration"();



CREATE OR REPLACE TRIGGER "create_trial_subscription_trigger" AFTER INSERT ON "public"."stores" FOR EACH ROW EXECUTE FUNCTION "public"."create_trial_subscription"();



CREATE OR REPLACE TRIGGER "invalidate_category_cache_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."invalidate_category_cache"();



CREATE OR REPLACE TRIGGER "log_subscription_change_trigger" AFTER UPDATE OF "plan_type", "status" ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."log_subscription_change"();



CREATE OR REPLACE TRIGGER "set_category_order" BEFORE INSERT ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_category_order"();



CREATE OR REPLACE TRIGGER "trigger_handle_expired_excess_items" AFTER UPDATE OF "status" ON "public"."plan_downgrade_excess" FOR EACH ROW EXECUTE FUNCTION "public"."handle_expired_excess_items"();



CREATE OR REPLACE TRIGGER "trigger_notify_plan_downgrade" AFTER UPDATE OF "status" ON "public"."plan_downgrade_operations" FOR EACH ROW WHEN ((("new"."status" = 'completed'::"public"."downgrade_status") AND ("old"."status" = 'pending'::"public"."downgrade_status"))) EXECUTE FUNCTION "public"."notify_plan_downgrade"();



CREATE OR REPLACE TRIGGER "update_erp_integrations_updated_at" BEFORE UPDATE ON "public"."erp_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_function_keys_updated_at" BEFORE UPDATE ON "public"."function_keys" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_product_attributes_updated_at" BEFORE UPDATE ON "public"."product_attributes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_product_components_updated_at" BEFORE UPDATE ON "public"."product_components" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_product_cost_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."product_components" FOR EACH ROW EXECUTE FUNCTION "public"."update_product_cost"();



CREATE OR REPLACE TRIGGER "update_product_timestamp" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_product_timestamp"();



CREATE OR REPLACE TRIGGER "update_store_plan_trigger" AFTER INSERT OR UPDATE OF "plan_type" ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_store_plan"();



CREATE OR REPLACE TRIGGER "validate_category_limit_trigger" BEFORE INSERT ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."validate_category_limit"();



CREATE OR REPLACE TRIGGER "validate_erp_credentials_trigger" BEFORE INSERT OR UPDATE ON "public"."erp_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."validate_erp_credentials"();



CREATE OR REPLACE TRIGGER "validate_product_attributes_trigger" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."validate_product_attributes"();



CREATE OR REPLACE TRIGGER "validate_product_components_trigger" BEFORE INSERT OR UPDATE ON "public"."product_components" FOR EACH ROW EXECUTE FUNCTION "public"."validate_product_components"();



CREATE OR REPLACE TRIGGER "validate_product_images_trigger" BEFORE INSERT OR UPDATE OF "images" ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."validate_product_images"();



CREATE OR REPLACE TRIGGER "validate_product_limits_trigger" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."validate_product_limits"();



CREATE OR REPLACE TRIGGER "validate_social_links_trigger" BEFORE INSERT OR UPDATE ON "public"."stores" FOR EACH ROW EXECUTE FUNCTION "public"."validate_social_links"();



CREATE OR REPLACE TRIGGER "validate_subscription_transition_trigger" BEFORE UPDATE OF "status", "next_payment_at", "grace_period_end" ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."validate_subscription_transition"();



CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_tree_cache"
    ADD CONSTRAINT "category_tree_cache_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."erp_integrations"
    ADD CONSTRAINT "erp_integrations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_downgrade_excess"
    ADD CONSTRAINT "plan_downgrade_excess_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_downgrade_operations"
    ADD CONSTRAINT "plan_downgrade_operations_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."plan_downgrade_operations"
    ADD CONSTRAINT "plan_downgrade_operations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_attributes"
    ADD CONSTRAINT "product_attributes_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_components"
    ADD CONSTRAINT "product_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."product_components"
    ADD CONSTRAINT "product_components_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_views"
    ADD CONSTRAINT "product_views_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_views"
    ADD CONSTRAINT "product_views_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_views"
    ADD CONSTRAINT "product_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_social_links"
    ADD CONSTRAINT "store_social_links_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."social_network_types"("id");



ALTER TABLE ONLY "public"."store_social_links"
    ADD CONSTRAINT "store_social_links_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_theme_settings"
    ADD CONSTRAINT "store_theme_settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_views"
    ADD CONSTRAINT "store_views_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_views"
    ADD CONSTRAINT "store_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_prices"
    ADD CONSTRAINT "stripe_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."stripe_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."stripe_customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "public"."stripe_prices"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "public"."stripe_prices"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_fkey" FOREIGN KEY ("stripe_subscription_id") REFERENCES "public"."stripe_subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;



CREATE POLICY "Apenas OWNER pode excluir usuários" ON "auth"."users" FOR DELETE USING ((( SELECT "auth"."is_owner"() AS "is_owner") OR ("auth"."uid"() = "id")));



COMMENT ON POLICY "Apenas OWNER pode excluir usuários" ON "auth"."users" IS 'Permite exclusão apenas pelo OWNER ou auto-exclusão';



ALTER TABLE "auth"."audit_log_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."flow_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_amr_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_factors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."one_time_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_relay_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."schema_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow authenticated user create access" ON "public"."stores" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated user delete access" ON "public"."stores" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated user update access" ON "public"."stores" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow public read access" ON "public"."stores" FOR SELECT USING (true);



CREATE POLICY "Apenas service_role pode ver todos os logs" ON "public"."stripe_webhook_logs" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Manage ERP integrations for own stores" ON "public"."erp_integrations" TO "authenticated" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"())))) WITH CHECK (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Public can view active products" ON "public"."products" FOR SELECT TO "anon" USING ((("active" = true) AND ("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE true))));



CREATE POLICY "Public can view active stores" ON "public"."stores" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public can view categories" ON "public"."categories" FOR SELECT TO "anon" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE true)));



CREATE POLICY "Public can view product attributes" ON "public"."product_attributes" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public can view product components" ON "public"."product_components" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Qualquer um pode adicionar visualização de loja" ON "public"."store_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "Qualquer um pode adicionar visualização de produto" ON "public"."product_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can manage downgrade operations" ON "public"."plan_downgrade_operations" TO "service_role" USING (true);



CREATE POLICY "Service role can manage excess items" ON "public"."plan_downgrade_excess" TO "service_role" USING (true);



CREATE POLICY "Service role pode gerenciar histórico" ON "public"."subscription_history" TO "service_role" USING (true);



CREATE POLICY "Store owners can manage their categories" ON "public"."categories" TO "authenticated" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"())))) WITH CHECK (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Store owners can manage their product attributes" ON "public"."product_attributes" TO "authenticated" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"())))) WITH CHECK (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Store owners can manage their product components" ON "public"."product_components" TO "authenticated" USING (("product_id" IN ( SELECT "p"."id"
   FROM ("public"."products" "p"
     JOIN "public"."stores" "s" ON (("s"."id" = "p"."store_id")))
  WHERE ("s"."user_id" = "auth"."uid"())))) WITH CHECK (("product_id" IN ( SELECT "p"."id"
   FROM ("public"."products" "p"
     JOIN "public"."stores" "s" ON (("s"."id" = "p"."store_id")))
  WHERE ("s"."user_id" = "auth"."uid"()))));



CREATE POLICY "Store owners can manage their products" ON "public"."products" TO "authenticated" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"())))) WITH CHECK (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Todos podem ver temas" ON "public"."store_themes" FOR SELECT USING (true);



CREATE POLICY "Users can create attributes for their stores" ON "public"."product_attributes" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."stores" "s"
  WHERE (("s"."id" = "product_attributes"."store_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create components for their products" ON "public"."product_components" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."stores" "s" ON (("s"."id" = "p"."store_id")))
  WHERE (("p"."id" = "product_components"."product_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create integrations for their stores" ON "public"."erp_integrations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."stores" "s"
  WHERE (("s"."id" = "erp_integrations"."store_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their product components" ON "public"."product_components" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."stores" "s" ON (("s"."id" = "p"."store_id")))
  WHERE (("p"."id" = "product_components"."product_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their store's attributes" ON "public"."product_attributes" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stores" "s"
  WHERE (("s"."id" = "product_attributes"."store_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their store's integrations" ON "public"."erp_integrations" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stores" "s"
  WHERE (("s"."id" = "erp_integrations"."store_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own stores" ON "public"."stores" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their product components" ON "public"."product_components" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."stores" "s" ON (("s"."id" = "p"."store_id")))
  WHERE (("p"."id" = "product_components"."product_id") AND ("s"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."stores" "s" ON (("s"."id" = "p"."store_id")))
  WHERE (("p"."id" = "product_components"."product_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their store's attributes" ON "public"."product_attributes" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stores" "s"
  WHERE (("s"."id" = "product_attributes"."store_id") AND ("s"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."stores" "s"
  WHERE (("s"."id" = "product_attributes"."store_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their store's integrations" ON "public"."erp_integrations" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stores" "s"
  WHERE (("s"."id" = "erp_integrations"."store_id") AND ("s"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."stores" "s"
  WHERE (("s"."id" = "erp_integrations"."store_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their downgrade operations" ON "public"."plan_downgrade_operations" FOR SELECT TO "authenticated" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their excess items" ON "public"."plan_downgrade_excess" FOR SELECT TO "authenticated" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their store's attributes" ON "public"."product_attributes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stores" "s"
  WHERE (("s"."id" = "product_attributes"."store_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their store's components" ON "public"."product_components" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."products" "p"
     JOIN "public"."stores" "s" ON (("s"."id" = "p"."store_id")))
  WHERE (("p"."id" = "product_components"."product_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their store's integrations" ON "public"."erp_integrations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stores" "s"
  WHERE (("s"."id" = "erp_integrations"."store_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Usuários não podem excluir notificações" ON "public"."notifications" FOR DELETE USING (false);



CREATE POLICY "Usuários podem atualizar suas próprias notificações" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem gerenciar seus próprios atributos" ON "public"."product_attributes" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Usuários podem gerenciar seus próprios componentes" ON "public"."product_components" USING (("product_id" IN ( SELECT "products"."id"
   FROM "public"."products"
  WHERE ("products"."store_id" IN ( SELECT "stores"."id"
           FROM "public"."stores"
          WHERE ("stores"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Usuários podem gerenciar seus próprios links sociais" ON "public"."store_social_links" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Usuários podem gerenciar seus próprios perfis" ON "public"."user_profiles" USING (("id" = "auth"."uid"()));



CREATE POLICY "Usuários podem gerenciar suas próprias configurações de app" ON "public"."app_settings" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem gerenciar suas próprias configurações de tem" ON "public"."store_theme_settings" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Usuários podem gerenciar suas próprias customizações de loj" ON "public"."stores" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem ver analytics de produtos de suas próprias loj" ON "public"."product_views" FOR SELECT USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Usuários podem ver analytics de suas próprias lojas" ON "public"."store_views" FOR SELECT USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Usuários podem ver histórico de suas assinaturas" ON "public"."subscription_history" FOR SELECT USING (("subscription_id" IN ( SELECT "subscriptions"."id"
   FROM "public"."subscriptions"
  WHERE ("subscriptions"."store_id" IN ( SELECT "stores"."id"
           FROM "public"."stores"
          WHERE ("stores"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Usuários podem ver logs de suas próprias assinaturas" ON "public"."stripe_webhook_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."stripe_subscriptions" "ss"
     JOIN "public"."stores" "s" ON (("s"."id" = "ss"."store_id")))
  WHERE (("s"."user_id" = "auth"."uid"()) AND ("stripe_webhook_logs"."event_type" ~~ 'customer.subscription.%'::"text") AND (("ss"."metadata" ->> 'subscription_id'::"text") = "ss"."subscription_id")))));



CREATE POLICY "Usuários podem ver preços ativos" ON "public"."stripe_prices" FOR SELECT USING (("active" = true));



CREATE POLICY "Usuários podem ver produtos ativos" ON "public"."stripe_products" FOR SELECT USING (("active" = true));



CREATE POLICY "Usuários podem ver seus próprios dados" ON "public"."stripe_customers" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON "public"."subscriptions" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Usuários podem ver suas próprias assinaturas Stripe" ON "public"."stripe_subscriptions" FOR SELECT USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Usuários podem ver suas próprias lojas" ON "public"."stores" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem ver suas próprias notificações" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."erp_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."function_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_downgrade_excess" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_downgrade_operations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_attributes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_components" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_social_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_theme_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_themes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_webhook_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "auth" TO "anon";
GRANT USAGE ON SCHEMA "auth" TO "authenticated";
GRANT USAGE ON SCHEMA "auth" TO "service_role";
GRANT ALL ON SCHEMA "auth" TO "supabase_auth_admin";
GRANT ALL ON SCHEMA "auth" TO "dashboard_user";
GRANT ALL ON SCHEMA "auth" TO "postgres";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON SCHEMA "storage" TO "postgres";
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin";
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."email"() TO "dashboard_user";
GRANT ALL ON FUNCTION "auth"."email"() TO "service_role";



GRANT ALL ON FUNCTION "auth"."is_owner"() TO "service_role";



GRANT ALL ON FUNCTION "auth"."jwt"() TO "postgres";
GRANT ALL ON FUNCTION "auth"."jwt"() TO "dashboard_user";
GRANT ALL ON FUNCTION "auth"."jwt"() TO "service_role";



GRANT ALL ON FUNCTION "auth"."log_deletion_attempt"() TO "service_role";



GRANT ALL ON FUNCTION "auth"."role"() TO "dashboard_user";
GRANT ALL ON FUNCTION "auth"."role"() TO "service_role";



GRANT ALL ON FUNCTION "auth"."uid"() TO "dashboard_user";
GRANT ALL ON FUNCTION "auth"."uid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_sync_subscription_plans"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_sync_subscription_plans"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_sync_subscription_plans"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_product_cost"("product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_product_cost"("product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_product_cost"("product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_erp_integration"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_erp_integration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_erp_integration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_plan_downgrade_excess"("p_store_id" "uuid", "p_to_plan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_plan_downgrade_excess"("p_store_id" "uuid", "p_to_plan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_plan_downgrade_excess"("p_store_id" "uuid", "p_to_plan" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_trial_expiration"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_trial_expiration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_trial_expiration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_unused_images"("p_store_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_unused_images"("p_store_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_unused_images"("p_store_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_unread_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_unread_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_unread_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_trial_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_trial_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_trial_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_content" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_content" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_content" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_function_key"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_function_key"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_function_key"() TO "service_role";



GRANT ALL ON TABLE "public"."store_themes" TO "anon";
GRANT ALL ON TABLE "public"."store_themes" TO "authenticated";
GRANT ALL ON TABLE "public"."store_themes" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_themes"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_themes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_themes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cached_category_tree"("p_store_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_cached_category_tree"("p_store_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cached_category_tree"("p_store_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_category_full_path"("category_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_category_full_path"("category_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_category_full_path"("category_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_category_path"("category_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_category_path"("category_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_category_path"("category_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_category_tree"("p_store_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_category_tree"("p_store_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_category_tree"("p_store_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_formatted_social_links"("p_store_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_formatted_social_links"("p_store_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_formatted_social_links"("p_store_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_plan_limits"("plan_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_plan_limits"("plan_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_plan_limits"("plan_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_plan_type_from_name"("product_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_plan_type_from_name"("product_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_plan_type_from_name"("product_name" "text") TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_products_with_variations"("p_store_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_with_variations"("p_store_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_with_variations"("p_store_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_root_categories_count"("store_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_root_categories_count"("store_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_root_categories_count"("store_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_store_from_checkout_session"("session_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_store_from_checkout_session"("session_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_store_from_checkout_session"("session_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_store_subscription"("store_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_store_subscription"("store_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_store_subscription"("store_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_app_theme"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_app_theme"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_app_theme"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_expired_excess_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_expired_excess_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_expired_excess_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."invalidate_category_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."invalidate_category_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."invalidate_category_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_subscription_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_subscription_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_subscription_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."manage_product_with_variations"("p_store_id" "uuid", "p_product" "jsonb", "p_variations" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."manage_product_with_variations"("p_store_id" "uuid", "p_product" "jsonb", "p_variations" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_product_with_variations"("p_store_id" "uuid", "p_product" "jsonb", "p_variations" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notifications_read"("p_notification_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notifications_read"("p_notification_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notifications_read"("p_notification_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_store_theme_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_store_theme_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_store_theme_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_plan_downgrade"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_plan_downgrade"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_plan_downgrade"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_plan_downgrade"("p_store_id" "uuid", "p_to_plan" "text", "p_handle_excess" "text", "p_initiated_by" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_plan_downgrade"("p_store_id" "uuid", "p_to_plan" "text", "p_handle_excess" "text", "p_initiated_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_plan_downgrade"("p_store_id" "uuid", "p_to_plan" "text", "p_handle_excess" "text", "p_initiated_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_plan_downgrade"("p_store_id" "uuid", "p_to_plan" "text", "p_handle_excess" "text", "p_initiated_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_store_view"("p_store_id" "uuid", "p_page" "text", "p_session_id" "text", "p_user_agent" "text", "p_referrer" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_store_view"("p_store_id" "uuid", "p_page" "text", "p_session_id" "text", "p_user_agent" "text", "p_referrer" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_store_view"("p_store_id" "uuid", "p_page" "text", "p_session_id" "text", "p_user_agent" "text", "p_referrer" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reorder_categories"("p_store_id" "uuid", "p_category_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_categories"("p_store_id" "uuid", "p_category_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_categories"("p_store_id" "uuid", "p_category_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."restore_downgrade_excess_item"("p_excess_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_downgrade_excess_item"("p_excess_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_downgrade_excess_item"("p_excess_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_downgrade_excess_item"("p_excess_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_store_customization"("p_store_id" "uuid", "p_customization" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_store_customization"("p_store_id" "uuid", "p_customization" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_store_customization"("p_store_id" "uuid", "p_customization" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_user_app_theme"("p_theme" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."save_user_app_theme"("p_theme" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_user_app_theme"("p_theme" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."schedule_subscription_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."schedule_subscription_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."schedule_subscription_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_products"("p_store_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_min_price" numeric, "p_max_price" numeric, "p_has_promotion" boolean, "p_selected_tags" "text"[], "p_brand" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_products"("p_store_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_min_price" numeric, "p_max_price" numeric, "p_has_promotion" boolean, "p_selected_tags" "text"[], "p_brand" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_products"("p_store_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_min_price" numeric, "p_max_price" numeric, "p_has_promotion" boolean, "p_selected_tags" "text"[], "p_brand" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_products_v2"("p_store_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_min_price" numeric, "p_max_price" numeric, "p_has_promotion" boolean, "p_tags" "text"[], "p_brand" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_products_v2"("p_store_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_min_price" numeric, "p_max_price" numeric, "p_has_promotion" boolean, "p_tags" "text"[], "p_brand" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_products_v2"("p_store_id" "uuid", "p_search" "text", "p_category_id" "uuid", "p_min_price" numeric, "p_max_price" numeric, "p_has_promotion" boolean, "p_tags" "text"[], "p_brand" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_all_subscriptions"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_all_subscriptions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_all_subscriptions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_subscription_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_subscription_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_subscription_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_subscription_plan"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_subscription_plan"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_subscription_plan"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_subscription_plans"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_subscription_plans"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_subscription_plans"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_subscription_store"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_subscription_store"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_subscription_store"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_category_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_category_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_category_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product_cost"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_cost"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_cost"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_store_active_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_store_active_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_store_active_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_store_plan"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_store_plan"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_store_plan"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_last_active"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_last_active"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_last_active"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_category_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_category_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_category_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_erp_credentials"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_erp_credentials"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_erp_credentials"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_image_url"("url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_image_url"("url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_image_url"("url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_product_attributes"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_product_attributes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_product_attributes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_product_components"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_product_components"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_product_components"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_product_images"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_product_images"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_product_images"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_product_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_product_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_product_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_social_links"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_social_links"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_social_links"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_subscription_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_subscription_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_subscription_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_subscription_transition"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_subscription_transition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_subscription_transition"() TO "service_role";



GRANT ALL ON TABLE "auth"."audit_log_entries" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."audit_log_entries" TO "postgres";
GRANT SELECT ON TABLE "auth"."audit_log_entries" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."audit_log_entries" TO "service_role";



GRANT ALL ON TABLE "auth"."deletion_attempts" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."flow_state" TO "postgres";
GRANT SELECT ON TABLE "auth"."flow_state" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."flow_state" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."flow_state" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."identities" TO "postgres";
GRANT SELECT ON TABLE "auth"."identities" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."identities" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."identities" TO "service_role";



GRANT ALL ON TABLE "auth"."instances" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."instances" TO "postgres";
GRANT SELECT ON TABLE "auth"."instances" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."instances" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_amr_claims" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_amr_claims" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_amr_claims" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."mfa_amr_claims" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_challenges" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_challenges" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_challenges" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."mfa_challenges" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_factors" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_factors" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_factors" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."mfa_factors" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."one_time_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."one_time_tokens" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."one_time_tokens" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."one_time_tokens" TO "service_role";



GRANT ALL ON TABLE "auth"."refresh_tokens" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."refresh_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."refresh_tokens" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."refresh_tokens" TO "service_role";



GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "dashboard_user";
GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."saml_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_providers" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."saml_providers" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."saml_relay_states" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_relay_states" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_relay_states" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."saml_relay_states" TO "service_role";



GRANT ALL ON TABLE "auth"."schema_migrations" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."schema_migrations" TO "postgres";
GRANT SELECT ON TABLE "auth"."schema_migrations" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."schema_migrations" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sessions" TO "postgres";
GRANT SELECT ON TABLE "auth"."sessions" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sessions" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."sessions" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sso_domains" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_domains" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_domains" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."sso_domains" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sso_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_providers" TO "dashboard_user";
GRANT ALL ON TABLE "auth"."sso_providers" TO "service_role";



GRANT ALL ON TABLE "auth"."users" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."users" TO "postgres";
GRANT SELECT ON TABLE "auth"."users" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."users" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."category_tree_cache" TO "anon";
GRANT ALL ON TABLE "public"."category_tree_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."category_tree_cache" TO "service_role";



GRANT ALL ON TABLE "public"."erp_integrations" TO "anon";
GRANT ALL ON TABLE "public"."erp_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."erp_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."function_keys" TO "anon";
GRANT ALL ON TABLE "public"."function_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."function_keys" TO "service_role";



GRANT ALL ON TABLE "public"."function_logs" TO "anon";
GRANT ALL ON TABLE "public"."function_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."function_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."function_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."function_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."function_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."plan_downgrade_excess" TO "anon";
GRANT ALL ON TABLE "public"."plan_downgrade_excess" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_downgrade_excess" TO "service_role";



GRANT ALL ON TABLE "public"."plan_downgrade_operations" TO "anon";
GRANT ALL ON TABLE "public"."plan_downgrade_operations" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_downgrade_operations" TO "service_role";



GRANT ALL ON TABLE "public"."product_attributes" TO "anon";
GRANT ALL ON TABLE "public"."product_attributes" TO "authenticated";
GRANT ALL ON TABLE "public"."product_attributes" TO "service_role";



GRANT ALL ON TABLE "public"."product_components" TO "anon";
GRANT ALL ON TABLE "public"."product_components" TO "authenticated";
GRANT ALL ON TABLE "public"."product_components" TO "service_role";



GRANT ALL ON TABLE "public"."product_views" TO "anon";
GRANT ALL ON TABLE "public"."product_views" TO "authenticated";
GRANT ALL ON TABLE "public"."product_views" TO "service_role";



GRANT ALL ON TABLE "public"."social_network_types" TO "anon";
GRANT ALL ON TABLE "public"."social_network_types" TO "authenticated";
GRANT ALL ON TABLE "public"."social_network_types" TO "service_role";



GRANT ALL ON TABLE "public"."store_social_links" TO "anon";
GRANT ALL ON TABLE "public"."store_social_links" TO "authenticated";
GRANT ALL ON TABLE "public"."store_social_links" TO "service_role";



GRANT ALL ON TABLE "public"."store_theme_settings" TO "anon";
GRANT ALL ON TABLE "public"."store_theme_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."store_theme_settings" TO "service_role";



GRANT ALL ON TABLE "public"."store_views" TO "anon";
GRANT ALL ON TABLE "public"."store_views" TO "authenticated";
GRANT ALL ON TABLE "public"."store_views" TO "service_role";



GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_customers" TO "anon";
GRANT ALL ON TABLE "public"."stripe_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_customers" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_prices" TO "anon";
GRANT ALL ON TABLE "public"."stripe_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_prices" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_products" TO "anon";
GRANT ALL ON TABLE "public"."stripe_products" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_products" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."stripe_webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_webhook_logs" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_history" TO "anon";
GRANT ALL ON TABLE "public"."subscription_history" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_history" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres";



GRANT ALL ON TABLE "storage"."migrations" TO "anon";
GRANT ALL ON TABLE "storage"."migrations" TO "authenticated";
GRANT ALL ON TABLE "storage"."migrations" TO "service_role";
GRANT ALL ON TABLE "storage"."migrations" TO "postgres";



GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "postgres";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES  TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS  TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES  TO "dashboard_user";



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






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "service_role";



RESET ALL;
