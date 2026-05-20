-- DropForeignKey
ALTER TABLE "ItemCandidate" DROP CONSTRAINT "ItemCandidate_assetId_fkey";

-- AlterTable
ALTER TABLE "ItemCandidate" ALTER COLUMN "assetId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ItemCandidate" ADD CONSTRAINT "ItemCandidate_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
