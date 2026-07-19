-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "github_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "review_type" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "total_loc" INTEGER NOT NULL DEFAULT 0,
    "class_count" INTEGER NOT NULL DEFAULT 0,
    "function_count" INTEGER NOT NULL DEFAULT 0,
    "complexity_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_findings" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "suggested_fix" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,

    CONSTRAINT "review_findings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_findings" ADD CONSTRAINT "review_findings_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
