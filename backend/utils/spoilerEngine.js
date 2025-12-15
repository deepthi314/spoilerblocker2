/**
 * Spoiler Detection Engine
 * Uses regex patterns and keyword weighting to assign confidence scores.
 */

const COMMON_SPOILER_TERMS = [
    'dies', 'died', 'killed', 'kills', 'death', 'murdered',
    'ending', 'finale', 'spoiler', 'revealed', 'alive', 'resurrected',
    'plot twist', 'secret', 'identity', 'father'
];

exports.detectSpoiler = (text, userPreferences = {}) => {
    const { blockedKeywords = [], protectedShows = [] } = userPreferences;

    let confidence = 0;
    let detectedTerms = [];

    const lowerText = text.toLowerCase();

    // 1. Check for User-Specific Blocked Keywords (High Impact)
    blockedKeywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            confidence += 0.8;
            detectedTerms.push(keyword);
        }
    });

    // 2. Check for Protected Shows Context (Medium Impact)
    // If a show name is mentioned, we lower the threshold for other spoiler terms
    let contextActive = false;
    protectedShows.forEach(show => {
        if (lowerText.includes(show.toLowerCase())) {
            confidence += 0.3;
            contextActive = true;
            detectedTerms.push(show);
        }
    });

    // 3. Logic: Specific Actions (Actions + Names)
    // "X kills Y" pattern
    const deathRegex = /(\w+)\s+(kills|murders|assassinates|shoots|stabs)\s+(\w+)/i;
    if (deathRegex.test(text)) {
        confidence += 0.6;
        detectedTerms.push("death_pattern");
    }

    // 4. General Spoiler Vocabulary
    COMMON_SPOILER_TERMS.forEach(term => {
        if (lowerText.includes(term)) {
            // If context is active (show mentioned), these words carry more weight
            confidence += contextActive ? 0.4 : 0.15;
            if (contextActive) detectedTerms.push(term);
        }
    });

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return {
        isSpoiler: confidence > 0.6, // Threshold
        confidence,
        detectedTerms: [...new Set(detectedTerms)] // Unique
    };
};
