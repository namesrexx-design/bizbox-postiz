-- Task 8593. Apply explicitly, after backup/review; never from app startup.
-- Existing Page rows are unaffected. No Post/publishDate/provider data is rewritten.
BEGIN;
CREATE OR REPLACE FUNCTION bizbox_profile_integration_guard_v1() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND OLD."internalId" = 'bizbox:facebook-profile:v1' THEN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Profile lane cannot be deleted' USING ERRCODE = '23514'; END IF;
    IF (NEW.id, NEW."organizationId", NEW."internalId", NEW."providerIdentifier", NEW.type, NEW.token)
      IS DISTINCT FROM (OLD.id, OLD."organizationId", OLD."internalId", OLD."providerIdentifier", OLD.type, OLD.token)
    THEN RAISE EXCEPTION 'Profile lane identity is immutable' USING ERRCODE = '23514'; END IF;
  END IF;
  IF TG_OP <> 'DELETE' AND NEW."internalId" = 'bizbox:facebook-profile:v1' THEN
    IF TG_OP = 'UPDATE' AND OLD."internalId" <> NEW."internalId" THEN
      RAISE EXCEPTION 'Cannot reclassify a Page as a profile lane' USING ERRCODE = '23514';
    END IF;
    IF NEW."providerIdentifier" <> 'facebook' OR NEW.type <> 'social' OR NEW.token <> 'external-pc-only:no-native-publisher' OR NEW."tokenExpiration" IS NOT NULL OR NEW."refreshToken" IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid external profile lane' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION bizbox_profile_post_guard_v1() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  old_profile boolean := false;
  new_profile boolean := false;
  metadata jsonb;
  old_metadata jsonb;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    SELECT "internalId" = 'bizbox:facebook-profile:v1' INTO old_profile FROM "Integration" WHERE id = OLD."integrationId";
  END IF;
  IF TG_OP <> 'DELETE' THEN
    SELECT "internalId" = 'bizbox:facebook-profile:v1' INTO new_profile FROM "Integration" WHERE id = NEW."integrationId" AND "organizationId" = NEW."organizationId";
  END IF;
  IF old_profile AND TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Frozen profile item requires reconciliation' USING ERRCODE = '23514'; END IF;
  IF NOT coalesce(new_profile, false) THEN
    IF old_profile OR (TG_OP <> 'DELETE' AND NEW.settings LIKE '%"bizboxFacebookProfile"%') THEN
      RAISE EXCEPTION 'Profile metadata requires its dedicated integration' USING ERRCODE = '23514';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  metadata := NEW.settings::jsonb -> 'bizboxFacebookProfile';
  IF NEW.state <> 'DRAFT' OR NEW."releaseId" IS NOT NULL OR NEW."parentPostId" IS NOT NULL OR NEW."intervalInDays" IS NOT NULL OR NEW."deletedAt" IS NOT NULL OR metadata IS NULL OR metadata ->> 'lane' IS DISTINCT FROM 'facebook-profile' THEN
    RAISE EXCEPTION 'External profile lane must remain an exact root DRAFT, never native QUEUE/PUBLISHED' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF current_setting('bizbox.profile_draft_v1', true) IS DISTINCT FROM 'on' OR metadata ? 'native' OR NEW."releaseURL" IS NOT NULL THEN
      RAISE EXCEPTION 'Profile item creation requires validated draft transaction' USING ERRCODE = '23514';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW."organizationId" || ':facebook-profile', 0));
    IF EXISTS (SELECT 1 FROM "Post" p WHERE p."organizationId" = NEW."organizationId" AND p."integrationId" = NEW."integrationId" AND p."deletedAt" IS NULL AND p.settings::jsonb #>> '{bizboxFacebookProfile,approvalId}' = metadata ->> 'approvalId' AND p.settings::jsonb #>> '{bizboxFacebookProfile,itemId}' = metadata ->> 'itemId') THEN
      RAISE EXCEPTION 'Duplicate profile item' USING ERRCODE = '23505';
    END IF;
  ELSE
    old_metadata := OLD.settings::jsonb -> 'bizboxFacebookProfile';
    IF NOT old_profile OR current_setting('bizbox.profile_result_v1', true) IS DISTINCT FROM 'on'
      OR (to_jsonb(NEW) - ARRAY['settings','releaseURL','updatedAt']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['settings','releaseURL','updatedAt'])
      OR (NEW.settings::jsonb #- '{bizboxFacebookProfile,native}') IS DISTINCT FROM (OLD.settings::jsonb #- '{bizboxFacebookProfile,native}')
      OR (old_metadata ? 'native' AND old_metadata -> 'native' IS DISTINCT FROM metadata -> 'native')
      OR metadata #>> '{native,status}' IS DISTINCT FROM 'scheduled'
      OR metadata #>> '{native,url}' IS DISTINCT FROM NEW."releaseURL"
      OR NEW."releaseURL" IS NULL THEN
      RAISE EXCEPTION 'Frozen profile item/result conflict; reconcile without republishing' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS bizbox_profile_integration_v1 ON "Integration";
CREATE TRIGGER bizbox_profile_integration_v1 BEFORE INSERT OR UPDATE OR DELETE ON "Integration" FOR EACH ROW EXECUTE FUNCTION bizbox_profile_integration_guard_v1();
ALTER TABLE "Integration" ENABLE ALWAYS TRIGGER bizbox_profile_integration_v1;
DROP TRIGGER IF EXISTS bizbox_profile_post_v1 ON "Post";
CREATE TRIGGER bizbox_profile_post_v1 BEFORE INSERT OR UPDATE OR DELETE ON "Post" FOR EACH ROW EXECUTE FUNCTION bizbox_profile_post_guard_v1();
ALTER TABLE "Post" ENABLE ALWAYS TRIGGER bizbox_profile_post_v1;
COMMIT;
