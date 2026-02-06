/**
 * Normalizes a string by removing accents and converting to lowercase.
 * Useful for search comparisons.
 * @param {string} str - The string to normalize
 * @returns {string} - The normalized string
 */
export const normalizeString = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

/**
 * Filters an array of items based on a search query.
 * Matches against multiple keys in the item object.
 * @param {Array} items - Array of objects to filter
 * @param {string} query - The search query
 * @param {Array<string>} keys - Keys to search in (e.g. ['name', 'email'])
 * @returns {Array} - Filtered array
 */
export const searchItems = (items, query, keys) => {
    if (!query) return items;

    const normalizedQuery = normalizeString(query);

    return items.filter(item => {
        return keys.some(key => {
            const value = item[key];
            if (!value) return false;
            // Handle nested objects if needed, but keeping it simple for now (strings only found at key)
            return normalizeString(String(value)).includes(normalizedQuery);
        });
    });
};
