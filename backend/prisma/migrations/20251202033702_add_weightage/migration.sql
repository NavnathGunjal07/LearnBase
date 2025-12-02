-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "skill_level" TEXT NOT NULL DEFAULT 'beginner',
    "current_language" TEXT DEFAULT 'English',
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "background" TEXT,
    "goals" TEXT,
    "learning_interests" TEXT,
    "onboarding_step" TEXT NOT NULL DEFAULT 'AUTH_EMAIL',
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "onboarding_attempts" INTEGER NOT NULL DEFAULT 0,
    "onboarding_locked_until" TIMESTAMP(3),
    "has_completed_onboarding" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_topics" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER DEFAULT 0,
    "weightage" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_topics" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "master_topic_id" INTEGER NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtopics" (
    "id" SERIAL NOT NULL,
    "master_topic_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty_level" TEXT NOT NULL DEFAULT 'basic',
    "weightage" INTEGER NOT NULL DEFAULT 10,
    "order_index" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subtopics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" SERIAL NOT NULL,
    "subtopic_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "starter_code" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'basic',
    "ai_generated" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" SERIAL NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "input" JSONB NOT NULL,
    "expected_output" JSONB NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'failed',
    "score" INTEGER NOT NULL DEFAULT 0,
    "feedback" TEXT,
    "runtime" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_topic_id" INTEGER NOT NULL,
    "subtopic_id" INTEGER,
    "completed_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_exercise_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB,
    "icon_url" TEXT,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" INTEGER NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_topic_id" INTEGER NOT NULL,
    "subtopic_id" INTEGER,
    "title" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completion_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "ai_summary" TEXT,
    "difficulty_level" TEXT NOT NULL DEFAULT 'basic',

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "chat_id" TEXT NOT NULL,
    "user_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT NOT NULL,
    "code_snippet" TEXT,
    "exercise_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_logs" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" INTEGER,
    "input_prompt" TEXT NOT NULL,
    "ai_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "master_topics_name_key" ON "master_topics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "master_topics_slug_key" ON "master_topics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_topics_user_id_master_topic_id_key" ON "user_topics"("user_id", "master_topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "progress_user_id_user_topic_id_subtopic_id_key" ON "progress"("user_id", "user_topic_id", "subtopic_id");

-- AddForeignKey
ALTER TABLE "user_topics" ADD CONSTRAINT "user_topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topics" ADD CONSTRAINT "user_topics_master_topic_id_fkey" FOREIGN KEY ("master_topic_id") REFERENCES "master_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtopics" ADD CONSTRAINT "subtopics_master_topic_id_fkey" FOREIGN KEY ("master_topic_id") REFERENCES "master_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "subtopics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_topic_id_fkey" FOREIGN KEY ("user_topic_id") REFERENCES "user_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "subtopics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_topic_id_fkey" FOREIGN KEY ("user_topic_id") REFERENCES "user_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "subtopics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
