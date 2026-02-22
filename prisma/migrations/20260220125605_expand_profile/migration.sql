-- AlterTable
ALTER TABLE "Dog" ADD COLUMN "iconUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DogPersona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dogId" TEXT NOT NULL,
    "toneStyle" TEXT NOT NULL,
    "emojiLevel" INTEGER NOT NULL,
    "sociability" INTEGER NOT NULL,
    "curiosity" INTEGER NOT NULL,
    "calmness" INTEGER NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "topicsJson" TEXT NOT NULL,
    "dislikesJson" TEXT NOT NULL,
    "catchphrasesJson" TEXT NOT NULL,
    "behaviorJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DogPersona_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DogPersona" ("behaviorJson", "calmness", "catchphrasesJson", "curiosity", "dislikesJson", "dogId", "emojiLevel", "id", "sociability", "toneStyle", "topicsJson", "updatedAt") SELECT "behaviorJson", "calmness", "catchphrasesJson", "curiosity", "dislikesJson", "dogId", "emojiLevel", "id", "sociability", "toneStyle", "topicsJson", "updatedAt" FROM "DogPersona";
DROP TABLE "DogPersona";
ALTER TABLE "new_DogPersona" RENAME TO "DogPersona";
CREATE UNIQUE INDEX "DogPersona_dogId_key" ON "DogPersona"("dogId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
