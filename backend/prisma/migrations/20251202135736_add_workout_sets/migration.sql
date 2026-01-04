-- CreateTable
CREATE TABLE "public"."WorkoutSet" (
    "id" SERIAL NOT NULL,
    "workoutLogId" INTEGER NOT NULL,
    "exerciseTemplateId" INTEGER NOT NULL,
    "setIndex" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "rir" INTEGER,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "public"."WorkoutLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutSet" ADD CONSTRAINT "WorkoutSet_exerciseTemplateId_fkey" FOREIGN KEY ("exerciseTemplateId") REFERENCES "public"."WorkoutExerciseTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
