/*
  Warnings:

  - Added the required column `department` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Level" AS ENUM ('L100', 'L200', 'L300', 'L400', 'L500');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "level" "Level" NOT NULL;
