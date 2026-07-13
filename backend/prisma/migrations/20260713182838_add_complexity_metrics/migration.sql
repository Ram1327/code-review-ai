-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "review_type" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "total_loc" INTEGER NOT NULL DEFAULT 0,
    "class_count" INTEGER NOT NULL DEFAULT 0,
    "function_count" INTEGER NOT NULL DEFAULT 0,
    "complexity_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_reviews" ("created_at", "id", "overall_score", "project_id", "review_type", "summary") SELECT "created_at", "id", "overall_score", "project_id", "review_type", "summary" FROM "reviews";
DROP TABLE "reviews";
ALTER TABLE "new_reviews" RENAME TO "reviews";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
