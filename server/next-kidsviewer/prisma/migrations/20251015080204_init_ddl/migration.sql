-- CreateTable
CREATE TABLE "t_platform" (
    "id" BIGSERIAL NOT NULL,
    "name_en" VARCHAR(255) NOT NULL,
    "name_cn" VARCHAR(255) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "description" VARCHAR(1000),
    "age_groups" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "create_date" TIMESTAMPTZ(3) NOT NULL,
    "update_date" TIMESTAMPTZ(3) NOT NULL,
    "create_by" BIGINT NOT NULL DEFAULT 1,
    "update_by" BIGINT NOT NULL DEFAULT 1,
    "del_flag" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "t_platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_question" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(50) NOT NULL,
    "difficulty" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "options" TEXT[],
    "correct_answer" VARCHAR(500) NOT NULL,
    "explanation_en" TEXT,
    "explanation_cn" TEXT,
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "age_groups" TEXT[],
    "tags" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "create_date" TIMESTAMPTZ(3) NOT NULL,
    "update_date" TIMESTAMPTZ(3) NOT NULL,
    "create_by" BIGINT NOT NULL DEFAULT 1,
    "update_by" BIGINT NOT NULL DEFAULT 1,
    "del_flag" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "t_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_person" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "parental_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "alias" VARCHAR(100) NOT NULL,
    "age_group" VARCHAR(20) NOT NULL,
    "avatar" VARCHAR(500),
    "difficulty" VARCHAR(20),
    "max_daily_time" INTEGER,
    "parental_password" VARCHAR(255),
    "settings" JSONB,
    "statistics" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "create_date" TIMESTAMPTZ(3) NOT NULL,
    "update_date" TIMESTAMPTZ(3) NOT NULL,
    "create_by" BIGINT NOT NULL DEFAULT 1,
    "update_by" BIGINT NOT NULL DEFAULT 1,
    "del_flag" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "t_person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_question_subject_idx" ON "t_question"("subject");

-- CreateIndex
CREATE INDEX "t_question_difficulty_idx" ON "t_question"("difficulty");

-- CreateIndex
CREATE INDEX "t_question_age_groups_idx" ON "t_question"("age_groups");

-- CreateIndex
CREATE INDEX "t_question_is_active_idx" ON "t_question"("is_active");

-- CreateIndex
CREATE INDEX "t_person_user_id_idx" ON "t_person"("user_id");

-- CreateIndex
CREATE INDEX "t_person_parental_id_idx" ON "t_person"("parental_id");

-- CreateIndex
CREATE INDEX "t_person_is_active_idx" ON "t_person"("is_active");
