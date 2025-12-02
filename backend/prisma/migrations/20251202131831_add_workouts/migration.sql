/*
  Warnings:

  - You are about to drop the column `createdAt` on the `FitnessProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `FitnessProfile` table. All the data in the column will be lost.
  - You are about to alter the column `heightCm` on the `FitnessProfile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `weightKg` on the `FitnessProfile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."FitnessProfile" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "heightCm" SET DATA TYPE INTEGER,
ALTER COLUMN "weightKg" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "public"."WorkoutTemplate" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutExerciseTemplate" (
    "id" SERIAL NOT NULL,
    "workoutTemplateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "rir" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "WorkoutExerciseTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "workoutTemplateId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."WorkoutTemplate" ADD CONSTRAINT "WorkoutTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutExerciseTemplate" ADD CONSTRAINT "WorkoutExerciseTemplate_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "public"."WorkoutTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutLog" ADD CONSTRAINT "WorkoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutLog" ADD CONSTRAINT "WorkoutLog_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "public"."WorkoutTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
