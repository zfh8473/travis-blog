-- AlterTable: Add admin notification fields to comments table
ALTER TABLE "comments" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "comments" ADD COLUMN "readAt" TIMESTAMP(3);
ALTER TABLE "comments" ADD COLUMN "readBy" TEXT;

-- CreateIndex: Optimize queries for unread comments
CREATE INDEX "comments_articleId_isRead_idx" ON "comments"("articleId", "isRead");
CREATE INDEX "comments_isRead_createdAt_idx" ON "comments"("isRead", "createdAt");
