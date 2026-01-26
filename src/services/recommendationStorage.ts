import { RecommendationPreferences, RecommendationSession } from "../types";

const PREFERENCES_KEY = "wardrobe_recommendation_preferences";
const SESSION_KEY = "wardrobe_recommendation_session";

/**
 * Storage utilities for recommendation preferences and session state
 */
export const recommendationStorage = {
  /**
   * Get stored recommendation preferences
   */
  getPreferences(): RecommendationPreferences | null {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as RecommendationPreferences;
  },

  /**
   * Save recommendation preferences
   */
  savePreferences(preferences: RecommendationPreferences): void {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  },

  /**
   * Get stored recommendation session
   */
  getSession(): RecommendationSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as RecommendationSession;
  },

  /**
   * Save recommendation session
   */
  saveSession(session: RecommendationSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  /**
   * Clear recommendation session
   */
  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
  },
};
