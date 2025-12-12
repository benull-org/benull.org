import { getArticles } from './storage.js';

const viewList = document.getElementById('view-list');
const articlesGrid = document.getElementById('articles-grid');
const articleDetail = document.getElementById('article-detail');
const backToHomeBtn = document.getElementById('back-to-home');
const backToListBtn = document.getElementById('back-to-list');

async function renderList() {
    const allArticles = await getArticles();
    const articles = allArticles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    articlesGrid.innerHTML = '';

    if (articles.length === 0) {
        articlesGrid.innerHTML = '<div class="text-[#666] text-center py-10">No articles available.</div>';
        return;
    }

    articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'article-card group cursor-pointer';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold text-white group-hover:text-[#39FF14] transition-colors">${article.title}</h3>
                <span class="text-xs text-[#666]">${new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
            <p class="text-[#86868b] line-clamp-3">${article.content}</p>
        `;
        card.addEventListener('click', () => {
            // Update URL to reflect deep link
            const url = new URL(window.location);
            if (article.slug) {
                url.searchParams.set('s', article.slug);
            } else {
                url.searchParams.set('id', article.id);
            }
            window.history.pushState({}, '', url);
            openArticle(article);
        });
        articlesGrid.appendChild(card);
    });
}

function openArticle(article) {
    viewList.classList.add('hidden');
    articleDetail.classList.remove('hidden');
    backToHomeBtn.classList.add('hidden');

    document.getElementById('detail-title').textContent = article.title;
    document.getElementById('detail-date').textContent = new Date(article.createdAt).toLocaleDateString();

    // Linkify and format content
    let content = article.content.replace(/\n/g, '<br />');

    // Render Images (Markdown syntax: ![alt](url))
    content = content.replace(
        /!\[(.*?)\]\((.*?)\)/g,
        '<img src="$2" alt="$1" class="article-image" loading="lazy" />'
    );

    // Render Links (Auto-linkify http/https)
    // Note: We use a lookbehind or verify we aren't inside the img src
    // A simpler way for this restricted subset is to just run linkify on things that don't look like our base64 data
    // But since we already replaced images with <img> tags, we need to be careful not to linkify the src="..." part.
    // However, our previous linkify regex matches "https://" which IS inside src.

    // Better strategy: Split by unique token or just avoid matching inside tags?
    // For simplicity given the inputs: We will use a stricter linkify that ensures space/start before.

    const linkifiedContent = content.replace(
        /(?<!src=")(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#39FF14] hover:underline break-words">$1</a>'
    );

    document.getElementById('detail-content').innerHTML = linkifiedContent;
}

function showList() {
    articleDetail.classList.add('hidden');
    viewList.classList.remove('hidden');
    backToHomeBtn.classList.remove('hidden');
}

// Event Listeners
if (backToListBtn) backToListBtn.addEventListener('click', () => {
    // Clear URL param without reloading
    const url = new URL(window.location);
    url.searchParams.delete('s');
    url.searchParams.delete('id');
    window.history.pushState({}, '', url);
    showList();
});

// Initial Load
(async function init() {
    await renderList();

    // Check URL params for deep linking
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('s');
    const id = params.get('id');

    if (slug || id) {
        const allArticles = await getArticles();
        const article = allArticles.find(a => (slug && a.slug === slug) || (id && a.id === id));
        if (article) {
            openArticle(article);
        }
    }
})();
