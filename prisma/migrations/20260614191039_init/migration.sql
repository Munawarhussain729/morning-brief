-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "author" TEXT,
    "publishedAt" DATETIME,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawSummary" TEXT,
    "contentHash" TEXT NOT NULL,
    "relevanceScore" REAL NOT NULL DEFAULT 0,
    "importanceScore" REAL NOT NULL DEFAULT 0,
    "duplicateOfId" TEXT,
    "isMarketing" BOOLEAN NOT NULL DEFAULT false,
    "isLowValue" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Article_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyBrief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "briefDate" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BriefItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "briefId" TEXT NOT NULL,
    "articleId" TEXT,
    "section" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "url" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "BriefItem_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "DailyBrief" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BriefItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentIdea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "briefId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentIdea_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "DailyBrief" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefreshRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "status" TEXT NOT NULL,
    "articlesSeen" INTEGER NOT NULL DEFAULT 0,
    "articlesStored" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_name_key" ON "Source"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");

-- CreateIndex
CREATE INDEX "Article_category_publishedAt_idx" ON "Article"("category", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_relevanceScore_idx" ON "Article"("relevanceScore");

-- CreateIndex
CREATE INDEX "Article_contentHash_idx" ON "Article"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBrief_briefDate_key" ON "DailyBrief"("briefDate");

-- CreateIndex
CREATE INDEX "BriefItem_briefId_section_rank_idx" ON "BriefItem"("briefId", "section", "rank");

-- CreateIndex
CREATE INDEX "ContentIdea_briefId_kind_idx" ON "ContentIdea"("briefId", "kind");
