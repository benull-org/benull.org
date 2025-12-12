// Read-only storage module
const DATA_URL = '/data/articles.json';

export async function getArticles() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            console.warn('Failed to fetch articles');
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading articles:', error);
        return [];
    }
}
