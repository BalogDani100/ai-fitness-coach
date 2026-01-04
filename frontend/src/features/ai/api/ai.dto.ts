export type AiFeedback = {
  id: number;
  userId: number;
  dateFrom: string;
  dateTo: string;
  feedbackType: string;
  inputSummary: string;
  resultText: string;
  createdAt: string;
};

export type GetAiFeedbacksResponse = {
  feedbacks: AiFeedback[];
};

export type CreateWeeklyReviewResponse = {
  feedback: AiFeedback;
};

export type CreateWorkoutPlanResponse = {
  feedback: AiFeedback;
};

export type CreateMealPlanResponse = {
  feedback: AiFeedback;
};
