-- ===========================================
-- Lifebook Database Initialization DML
-- ===========================================

-- ----------------------------
-- Records of sys_tenant
-- ----------------------------
DELETE FROM "public"."sys_tenant" WHERE 1=1;
INSERT INTO "public"."sys_tenant" ("id", "name", "remark", "properties", "create_date", "update_date", "create_by", "update_by", "del_flag") VALUES (1, 'Barry Family', NULL, '{"familyId": "47"}', '2025-10-05 09:49:40', '2025-10-05 09:49:42.000+08', 1, 1, 0);

-- ----------------------------
-- Records of sys_user
-- ----------------------------
DELETE FROM "public"."sys_user" WHERE 1=1;
INSERT INTO "public"."sys_user" ("id", "name", "email", "password", "github_openid", "tenant_id", "user_type", "create_date", "update_date", "create_by", "update_by", "del_flag") VALUES (1, 'James', 'lyra@kidsviewer.app', '3c2a6eb64cc629de76c419308830c53bbe63b874f6a526f7cd784182b33a2f5f3daaab47b5bde5868b82e4dd3b521d147a7542292b689acdf60122b97e99523f', NULL, 1, 1, '2025-10-15 21:05:56+08', '2025-10-05 21:05:58+08', 1, 1, 0);
INSERT INTO "public"."sys_user" ("id", "name", "email", "password", "github_openid", "tenant_id", "user_type", "create_date", "update_date", "create_by", "update_by", "del_flag") VALUES (2, 'Zzx', 'barry@kidsviewer.app', '3c2a6eb64cc629de76c419308830c53bbe63b874f6a526f7cd784182b33a2f5f3daaab47b5bde5868b82e4dd3b521d147a7542292b689acdf60122b97e99523f', NULL, 1, 2, '2025-10-15 21:05:56+08', '2025-10-05 21:05:58+08', 1, 1, 0);

-- ----------------------------
-- Records of t_family
-- ----------------------------
DELETE FROM "public"."t_family" WHERE 1=1;
INSERT INTO "public"."t_family" ("id", "tenant_id", "name", "idcard", "address", "create_date", "update_date", "create_by", "update_by", "del_flag") VALUES (1, 1, 'Tom', NULL, NULL, '2021-01-17 00:00:00', '2021-01-17 00:00:00', 1, 1, 0);