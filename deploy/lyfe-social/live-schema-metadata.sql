BEGIN READ ONLY;
SELECT json_build_object(
'columns', (SELECT json_agg(c) FROM (SELECT table_name,column_name,is_nullable,data_type,udt_name,column_default,character_maximum_length,numeric_precision,numeric_scale,datetime_precision FROM information_schema.columns WHERE table_schema='public') c),
'indexes', (SELECT json_agg(i) FROM (SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public') i),
'enums', (SELECT json_object_agg(typname,labels) FROM (SELECT t.typname,json_agg(e.enumlabel ORDER BY e.enumsortorder) labels FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' GROUP BY t.typname) e));
ROLLBACK;
