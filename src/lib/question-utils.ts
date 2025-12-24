/**
 * Utility functions for question ID generation and management
 */

/**
 * Converts a question string to a URL-friendly ID
 * - Replaces spaces with hyphens
 * - Removes special characters
 * - Converts to lowercase
 * - Trims and removes duplicate hyphens
 */
export function questionToId(question: string): string {
    return question
        .toLowerCase()
        .trim()
        // Replace spaces with hyphens
        .replace(/\s+/g, '-')
        // Remove all special characters except hyphens
        .replace(/[^a-z0-9-]/g, '')
        // Remove duplicate hyphens
        .replace(/-+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '');
}

/**
 * Converts a question ID back to a readable question format
 */
export function idToQuestion(id: string): string {
    return id
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
