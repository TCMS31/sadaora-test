-- Enforce one like per user per profile in the database. The application
-- previously did a SELECT-then-INSERT, which two concurrent requests could
-- both pass, producing duplicate like rows and an inflated like count.
DELETE FROM "Like" a
USING "Like" b
WHERE a.ctid < b.ctid
  AND a."profileId" = b."profileId"
  AND a."likedById" = b."likedById";

CREATE UNIQUE INDEX "Like_profileId_likedById_key" ON "Like"("profileId", "likedById");

-- Foreign-key lookup indexes. Counting likes for a profile and removing a
-- user's likes both scanned the whole table without these.
CREATE INDEX "Like_profileId_idx" ON "Like"("profileId");
CREATE INDEX "Like_likedById_idx" ON "Like"("likedById");

-- The feed orders by createdAt DESC on every page.
CREATE INDEX "Profile_createdAt_idx" ON "Profile"("createdAt" DESC);

-- Deleting a profile previously failed with a foreign-key violation whenever
-- anyone had liked it, because both relations were ON DELETE RESTRICT.
ALTER TABLE "Like" DROP CONSTRAINT "Like_profileId_fkey";
ALTER TABLE "Like" ADD CONSTRAINT "Like_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Like" DROP CONSTRAINT "Like_likedById_fkey";
ALTER TABLE "Like" ADD CONSTRAINT "Like_likedById_fkey"
  FOREIGN KEY ("likedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
