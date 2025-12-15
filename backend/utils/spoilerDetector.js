class SpoilerDetector {
    constructor() {
        this.patterns = [
            /dies?|death|killed|dead/i,
            /ending|finale|final episode/i,
            /plot twist|revealed|turns out/i,
            /spoiler alert|spoilers?/i,
            /betrays?|betrayal/i,
            /survives?|survivor/i,
            /marries|married|wedding/i,
            /pregnant|baby|child/i
        ];

        this.contextWords = [
            'episode', 'season', 'chapter', 'movie',
            'show', 'series', 'character', 'protagonist'
        ];
    }

    detect(text, userKeywords = []) {
        let score = 0;
        const lowercaseText = text.toLowerCase();
        const detectedKeywords = [];

        // Check patterns (3 points each)
        this.patterns.forEach(pattern => {
            if (pattern.test(text)) {
                score += 3;
                // Extract the matching part for display
                const match = text.match(pattern);
                if (match && !detectedKeywords.includes(match[0])) {
                    detectedKeywords.push(match[0]);
                }
            }
        });

        // Check context words (1 point each)
        this.contextWords.forEach(word => {
            if (lowercaseText.includes(word)) score += 1;
        });

        // Check user keywords (5 points each)
        // Assuming userKeywords is an array of strings or { keyword: string } objects
        userKeywords.forEach(item => {
            const keyword = typeof item === 'string' ? item : item.keyword;
            if (lowercaseText.includes(keyword.toLowerCase())) {
                score += 5;
                if (!detectedKeywords.includes(keyword)) {
                    detectedKeywords.push(keyword);
                }
            }
        });

        // Character + action pattern (4 points)
        const charAction = /(\w+)\s+(dies|survives|betrays)/i;
        if (charAction.test(text)) score += 4;

        // Calculate confidence (max 100%)
        const confidence = Math.min(score * 10, 100);

        // Determine if spoiler (threshold: 5)
        // Strictness could be adjustable based on user settings in future
        const isSpoiler = score >= 5;

        // Risk level
        let riskLevel = 'low';
        if (confidence > 70) riskLevel = 'high';
        else if (confidence > 40) riskLevel = 'medium';

        return {
            isSpoiler,
            confidence,
            score,
            detectedKeywords,
            riskLevel,
            message: isSpoiler
                ? '⚠️ Spoiler detected! This content has been blocked.'
                : '✅ No spoilers detected. Safe to read!'
        };
    }
}

module.exports = new SpoilerDetector();
