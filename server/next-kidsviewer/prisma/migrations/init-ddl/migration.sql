-- CreateTable
CREATE TABLE "sys_tenant" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "remark" VARCHAR(255),
    "properties" JSONB,
    "create_date" TIMESTAMPTZ(3) NOT NULL,
    "update_date" TIMESTAMPTZ(3) NOT NULL,
    "create_by" BIGINT NOT NULL DEFAULT 1,
    "update_by" BIGINT NOT NULL DEFAULT 1,
    "del_flag" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sys_tenant_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "sys_user" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(64),
    "email" VARCHAR(64),
    "password" VARCHAR(256),
    "github_openid" VARCHAR(128),
    "wallets" JSONB,
    "tenant_id" BIGINT NOT NULL,
    "user_type" INTEGER NOT NULL DEFAULT 1,
    "create_date" TIMESTAMPTZ(3) NOT NULL,
    "update_date" TIMESTAMPTZ(3) NOT NULL,
    "create_by" BIGINT NOT NULL DEFAULT 1,
    "update_by" BIGINT NOT NULL DEFAULT 1,
    "del_flag" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sys_user_pkey1" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "sys_invitation_code" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "creator_id" BIGINT NOT NULL,
    "max_uses" INTEGER NOT NULL DEFAULT 100,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "create_date" TIMESTAMPTZ(3) NOT NULL,
    "update_date" TIMESTAMPTZ(3) NOT NULL,
    "create_by" BIGINT NOT NULL DEFAULT 1,
    "update_by" BIGINT NOT NULL DEFAULT 1,
    "del_flag" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sys_invitation_code_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "sys_invitation_usage" (
    "id" BIGSERIAL NOT NULL,
    "invitation_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "used_at" TIMESTAMPTZ(3) NOT NULL,
    "create_date" TIMESTAMPTZ(3) NOT NULL,
    "update_date" TIMESTAMPTZ(3) NOT NULL,
    "create_by" BIGINT NOT NULL DEFAULT 1,
    "update_by" BIGINT NOT NULL DEFAULT 1,
    "del_flag" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sys_invitation_usage_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "t_family" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "idcard" VARCHAR(20),
    "address" VARCHAR(255),
    "create_date" TIMESTAMPTZ(3) NOT NULL,
    "update_date" TIMESTAMPTZ(3) NOT NULL,
    "create_by" BIGINT NOT NULL DEFAULT 1,
    "update_by" BIGINT NOT NULL DEFAULT 1,
    "del_flag" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "t_family_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "sys_user_tenant_id_idx" ON "sys_user"("tenant_id");
-- CreateIndex
CREATE UNIQUE INDEX "sys_invitation_code_code_key" ON "sys_invitation_code"("code");
-- CreateIndex
CREATE INDEX "sys_invitation_code_creator_id_idx" ON "sys_invitation_code"("creator_id");
-- CreateIndex
CREATE INDEX "sys_invitation_code_code_idx" ON "sys_invitation_code"("code");
-- CreateIndex
CREATE INDEX "sys_invitation_usage_invitation_id_idx" ON "sys_invitation_usage"("invitation_id");
-- CreateIndex
CREATE INDEX "sys_invitation_usage_user_id_idx" ON "sys_invitation_usage"("user_id");
-- CreateIndex
CREATE INDEX "t_family_tenant_id_idx" ON "t_family"("tenant_id");
-- AddForeignKey
ALTER TABLE "sys_user"
ADD CONSTRAINT "sys_user_tenant_id_fkey1" FOREIGN KEY ("tenant_id") REFERENCES "sys_tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
-- AddForeignKey
ALTER TABLE "sys_invitation_code"
ADD CONSTRAINT "sys_invitation_code_creator_fkey" FOREIGN KEY ("creator_id") REFERENCES "sys_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "sys_invitation_usage"
ADD CONSTRAINT "sys_invitation_usage_invitation_fkey" FOREIGN KEY ("invitation_id") REFERENCES "sys_invitation_code"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "sys_invitation_usage"
ADD CONSTRAINT "sys_invitation_usage_user_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "t_family"
ADD CONSTRAINT "sys_user_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "sys_tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;