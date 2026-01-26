import { MemoryBank, UserReflections, AssessmentResponses } from "../types";
import { generateStructured, generateText } from "./gemini";
import { UserReflectionsSchema } from "./schemas";

const MEMORY_BANK_KEY = "wardrobe_memory_bank";
const ASSESSMENT_KEY = "wardrobe_assessment";
const REFLECTIONS_UPDATE_INTERVAL = 5;
const MAX_STORED_QUERIES = 50;

/**
 * Get the current memory bank from storage
 */
export function getMemoryBank(): MemoryBank {
  const raw = localStorage.getItem(MEMORY_BANK_KEY);
  if (!raw) {
    return {
      queries: [],
      reflections: null,
      totalQueryCount: 0,
    };
  }
  return JSON.parse(raw) as MemoryBank;
}

/**
 * Save memory bank to storage
 */
function saveMemoryBank(memoryBank: MemoryBank): void {
  localStorage.setItem(MEMORY_BANK_KEY, JSON.stringify(memoryBank));
}

/**
 * Get assessment responses from storage
 */
export function getAssessmentResponses(): AssessmentResponses | null {
  const raw = localStorage.getItem(ASSESSMENT_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as AssessmentResponses;
}

/**
 * Save assessment responses to storage
 */
export function saveAssessmentResponses(responses: AssessmentResponses): void {
  localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(responses));
}

/**
 * Record a user query and potentially update reflections
 */
export async function recordQuery(
  query: string,
  source: "stylist" | "builder",
): Promise<void> {
  const memoryBank = getMemoryBank();

  // Add the new query
  memoryBank.queries.push({
    query,
    timestamp: new Date().toISOString(),
    source,
  });

  // Keep only recent queries
  if (memoryBank.queries.length > MAX_STORED_QUERIES) {
    memoryBank.queries = memoryBank.queries.slice(-MAX_STORED_QUERIES);
  }

  memoryBank.totalQueryCount++;

  // Check if we should update reflections
  if (memoryBank.totalQueryCount % REFLECTIONS_UPDATE_INTERVAL === 0) {
    try {
      const newReflections = await generateReflections(memoryBank.queries);
      memoryBank.reflections = newReflections;
    } catch (error) {
      console.error("Failed to update reflections:", error);
    }
  }

  saveMemoryBank(memoryBank);
}

/**
 * Generate reflections based on user queries
 */
async function generateReflections(
  queries: MemoryBank["queries"],
): Promise<UserReflections> {
  const queriesText = queries.map((q) => `[${q.source}] ${q.query}`).join("\n");

  const prompt = `Analyze these user queries about their wardrobe and style to create reflections about them.

USER QUERIES:
${queriesText}

Based on these queries, provide reflections in this exact JSON format:
{
  "purposeAndContext": "What is the user trying to achieve with their style? What's driving their interest?",
  "currentState": "Where are they in their style journey? What do they seem confident about vs uncertain?",
  "approachAndPatterns": "What patterns do you see in how they think about clothes and style? What preferences emerge?"
}

Be insightful and read between the lines. Keep each section to 2-3 sentences.`;

  const result = await generateStructured({
    prompt: prompt,
    schema: UserReflectionsSchema,
  });

  return {
    purposeAndContext: result.purposeAndContext || "",
    currentState: result.currentState || "",
    approachAndPatterns: result.approachAndPatterns || "",
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate assessment summary from user answers
 */
export async function generateAssessmentSummary(
  answers: Record<string, string>,
): Promise<string> {
  const answersText = Object.entries(answers)
    .map(([questionId, answer]) => `${questionId}: ${answer}`)
    .join("\n\n");

  const prompt = `You are a personal style advisor analyzing a client's style assessment responses.

ASSESSMENT RESPONSES:
${answersText}

Based on these answers, write a thoughtful summary that:
1. Captures their lifestyle and how it relates to their wardrobe needs
2. Identifies their style aspirations and what's holding them back
3. Notes their inspirations and what that reveals about their aesthetic preferences
4. Reads between the lines to understand their deeper style desires

Write in second person ("You...") and keep it warm but sophisticated.
Keep the summary to 3-4 short paragraphs.`;

  const textResponse = await generateText(prompt);
  return textResponse.trim();
}

/**
 * Build context string for AI calls including reflections and assessment
 */
export function buildUserContext(): string {
  const memoryBank = getMemoryBank();
  const assessment = getAssessmentResponses();

  let context = "";

  if (assessment) {
    context += `USER STYLE PROFILE:\n${assessment.summary}\n\n`;
  }

  if (memoryBank.reflections) {
    context += `USER REFLECTIONS (based on conversation history):\n`;
    context += `- Purpose & Context: ${memoryBank.reflections.purposeAndContext}\n`;
    context += `- Current State: ${memoryBank.reflections.currentState}\n`;
    context += `- Approach & Patterns: ${memoryBank.reflections.approachAndPatterns}\n\n`;
  }

  return context;
}
