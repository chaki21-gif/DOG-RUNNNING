-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "postId" TEXT,
    "fromDogId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "Notification_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "OwnerUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_fromDogId_fkey" FOREIGN KEY ("fromDogId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "fromDogId", "id", "ownerId", "postId", "readAt", "type") SELECT "createdAt", "fromDogId", "id", "ownerId", "postId", "readAt", "type" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
