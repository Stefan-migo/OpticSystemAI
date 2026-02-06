/**
 * Evolutionary Insights System
 *
 * Manages the evolution of AI prompts and insights based on organizational maturity
 * and user feedback. This system ensures that the AI's advice grows with the business.
 *
 * @module lib/ai/insights/evolutionary
 */

import { MaturityLevel } from "../memory/organizational";

export type InsightTone =
  | "encouraging"
  | "directive"
  | "analytical"
  | "strategic";
export type InsightDetailLevel = "basic" | "intermediate" | "advanced";

export interface PromptEvolutionConfig {
  tone: InsightTone;
  detailLevel: InsightDetailLevel;
  focusAreas: string[];
  forbiddenTopics: string[];
}

/**
 * Determines the appropriate prompt configuration based on organizational maturity
 */
export function getEvolutionaryConfig(
  maturity: MaturityLevel,
): PromptEvolutionConfig {
  switch (maturity.level) {
    case "new":
      return {
        tone: "encouraging",
        detailLevel: "basic",
        focusAreas: ["setup", "first_steps", "basics"],
        forbiddenTopics: ["advanced_analytics", "optimization", "trends"],
      };

    case "starting":
      return {
        tone: "directive",
        detailLevel: "basic",
        focusAreas: [
          "sales_recording",
          "customer_acquisition",
          "catalog_completion",
        ],
        forbiddenTopics: ["complex_forecasting", "advanced_segmentation"],
      };

    case "growing":
      return {
        tone: "analytical",
        detailLevel: "intermediate",
        focusAreas: ["retention", "efficiency", "inventory_management"],
        forbiddenTopics: [],
      };

    case "established":
      return {
        tone: "strategic",
        detailLevel: "advanced",
        focusAreas: ["profitability", "market_trends", "long_term_strategy"],
        forbiddenTopics: ["basic_setup_reminders"],
      };

    default:
      return {
        tone: "encouraging",
        detailLevel: "basic",
        focusAreas: ["general"],
        forbiddenTopics: [],
      };
  }
}

/**
 * Decorates a base prompt with evolutionary instructions
 */
export function evolvePrompt(
  basePrompt: string,
  config: PromptEvolutionConfig,
): string {
  const toneInstruction = getToneInstruction(config.tone);
  const detailInstruction = getDetailInstruction(config.detailLevel);
  const focusInstruction = `FOCUS AREAS: ${config.focusAreas.join(", ")}. Prioritize insights in these areas.`;
  const forbiddenInstruction =
    config.forbiddenTopics.length > 0
      ? `DO NOT discuss: ${config.forbiddenTopics.join(", ")} as they are not relevant for this stage.`
      : "";

  return `
${basePrompt}

=== EVOLUTIONARY INSTRUCTIONS ===
TONE: ${toneInstruction}
DEPTH: ${detailInstruction}
${focusInstruction}
${forbiddenInstruction}
=================================
`;
}

function getToneInstruction(tone: InsightTone): string {
  const instructions: Record<InsightTone, string> = {
    encouraging:
      "Use a warm, welcoming, and encouraging tone. Celebrate small wins. Be patient and guiding.",
    directive:
      "Be direct and clear. Give specific, step-by-step instructions. Focus on 'how-to'.",
    analytical:
      "Be objective and data-driven. Use numbers and percentages to back up claims. Focus on 'why'.",
    strategic:
      "Be visionary and executive. Focus on long-term impact, ROI, and competitive advantage.",
  };
  return instructions[tone];
}

function getDetailInstruction(level: InsightDetailLevel): string {
  const instructions: Record<InsightDetailLevel, string> = {
    basic:
      "Keep explanations simple. Avoid jargon. Focus on the 'what' and 'how'. Max 1 sentence per insight.",
    intermediate:
      "Provide context. Explain the 'why'. Use industry standard terms where appropriate.",
    advanced:
      "Deep dive into correlations. Connect multiple data points. Use advanced optical industry metrics.",
  };
  return instructions[level];
}

/**
 * Adapts feedback to fine-tune future prompts (Mock implementation)
 * In a real system, this would store preferences in a DB.
 */
export class FeedbackLoop {
  private static userPreferences: Map<string, string[]> = new Map();

  static recordFeedback(
    userId: string,
    insightId: string,
    isPositive: boolean,
    topic: string,
  ) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, []);
    }

    const prefs = this.userPreferences.get(userId)!;
    if (isPositive) {
      prefs.push(`User likes insights about ${topic}`);
    } else {
      prefs.push(`User dislikes insights about ${topic}`);
    }
  }

  static getPersonalizationContext(userId: string): string {
    const prefs = this.userPreferences.get(userId);
    if (!prefs || prefs.length === 0) return "";

    return `
=== USER PREFERENCES ===
The user has provided the following feedback history:
- ${prefs.join("\n- ")}
Adjust your response accordingly.
========================
`;
  }
}
