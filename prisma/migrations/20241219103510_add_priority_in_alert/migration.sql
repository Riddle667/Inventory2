-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER,
    "client_id" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'LOW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alert_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("client_id", "createdAt", "id", "is_read", "message", "product_id", "type", "updatedAt", "user_id") SELECT "client_id", "createdAt", "id", "is_read", "message", "product_id", "type", "updatedAt", "user_id" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE UNIQUE INDEX "Alert_type_user_id_product_id_client_id_key" ON "Alert"("type", "user_id", "product_id", "client_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
