-- CreateTable
CREATE TABLE "OwnerUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ja',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Dog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "birthday" TEXT NOT NULL,
    "birthplace" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "personalityInput" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "OwnerUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DogPersona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dogId" TEXT NOT NULL,
    "toneStyle" TEXT NOT NULL,
    "emojiLevel" INTEGER NOT NULL,
    "sociability" INTEGER NOT NULL,
    "curiosity" INTEGER NOT NULL,
    "calmness" INTEGER NOT NULL,
    "topicsJson" TEXT NOT NULL,
    "dislikesJson" TEXT NOT NULL,
    "catchphrasesJson" TEXT NOT NULL,
    "behaviorJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DogPersona_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DogDiary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dogId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DogDiary_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DogDiary_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "OwnerUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dogId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ja',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Like" (
    "dogId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dogId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ja',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Repost" (
    "dogId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Repost_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Repost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "fromDogId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "Notification_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "OwnerUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_fromDogId_fkey" FOREIGN KEY ("fromDogId") REFERENCES "Dog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerUser_email_key" ON "OwnerUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DogPersona_dogId_key" ON "DogPersona"("dogId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_dogId_postId_key" ON "Like"("dogId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Repost_dogId_postId_key" ON "Repost"("dogId", "postId");
