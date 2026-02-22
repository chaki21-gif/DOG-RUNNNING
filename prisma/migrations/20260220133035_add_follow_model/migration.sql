-- CreateTable
CREATE TABLE "Follow" (
    "followerId" TEXT NOT NULL,
    "followedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("followerId", "followedId"),
    CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Follow_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
