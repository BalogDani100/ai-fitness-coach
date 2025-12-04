import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.warn(
    "[aiCoach.service] GROQ_API_KEY is not set. AI endpoints will fail until you configure it."
  );
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function createChatCompletion(systemPrompt: string, userContent: string) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const message = completion.choices[0]?.message?.content;
    if (!message) {
      throw new Error("Empty response from AI");
    }
    return message;
  } catch (error: any) {
    if (error?.response) {
      console.error(
        "Groq API error:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error("Unknown AI error:", error);
    }
    throw new Error("AI request failed");
  }
}

/**
 * Heti review – már használod
 */
export async function generateWeeklyReview(summary: string): Promise<string> {
  const systemPrompt = `
You are an experienced online fitness coach and nutritionist.

Your job:
- Analyze the user's last 7 days of nutrition and training.
- Compare to the target calories and macros.
- Highlight strengths, mistakes and concrete next steps.

Rules:
- Be friendly, but direct.
- Focus on 3–5 key points, not a huge essay.
- Use short paragraphs and bullet points.
- If data is missing (no meals / no workouts), explain that first and give suggestions.
`;

  return createChatCompletion(systemPrompt, summary);
}

/**
 * AI WORKOUT PLAN GENERATOR
 */
export async function generateWorkoutPlan(summary: string): Promise<string> {
  const systemPrompt = `
You are an expert strength and hypertrophy coach.

Your job:
- Create a weekly workout plan based on the user's profile and preferences.
- Assume the user trains in a normal commercial gym with basic equipment.

Rules:
- Always return the plan as clear, structured text.
- Use headings per day (e.g. "Day 1 – Upper", "Day 2 – Lower").
- For each exercise include: name, sets, reps, RIR.
- Adapt volume to the user's experience level and days per week.
- Keep it realistic and safe.
- If the goal is fat loss, keep volume similar but mention cardio suggestions at the end.
`;

  return createChatCompletion(systemPrompt, summary);
}

/**
 * AI MEAL PLAN GENERATOR
 */
export async function generateMealPlan(summary: string): Promise<string> {
  const systemPrompt = `
You are an expert nutritionist and fitness coach.

Your job:
- Create a simple daily meal plan based on target calories and macros.
- Respect the user's preferences and foods they want to avoid.

Rules:
- Output a 1-day example plan only.
- Split into the given number of meals per day.
- For each meal, list:
  - meal name
  - foods with approximate grams
  - estimated calories and macros for that meal
- At the end, show an approximate total vs target macros.
- Use simple, realistic foods (e.g. chicken, rice, oats, eggs, yoghurt, veggies).
- Keep text short and practical, not a long essay.
`;

  return createChatCompletion(systemPrompt, summary);
}
