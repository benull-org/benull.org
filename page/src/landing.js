import { getArticles } from './storage.js';

const previewContainer = document.getElementById('article-previews');

async function renderPreviews() {
    if (!previewContainer) return;

    const allArticles = await getArticles();
    const articles = allArticles
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3); // Top 3 latest

    if (articles.length === 0) {
        previewContainer.innerHTML = `
            <div class="col-span-full text-center text-[#666]">
                <p>No articles published yet.</p>
            </div>
        `;
        return;
    }

    previewContainer.innerHTML = '';
    articles.forEach(article => {
        const card = document.createElement('a');
        const link = article.slug ? `/articles/?s=${article.slug}` : `/articles/?id=${article.id}`;
        card.href = link;
        card.className = 'group block p-6 rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-[#39FF14]/30 hover:bg-[#111] transition-all';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="text-xs font-bold text-[#39FF14] uppercase tracking-wider">Article</span>
                <span class="text-xs text-[#666]">${new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
            <h3 class="text-xl font-bold text-white mb-2 group-hover:text-[#39FF14] transition-colors">${article.title}</h3>
            <p class="text-[#86868b] text-sm line-clamp-3">${article.content}</p>
        `;
        previewContainer.appendChild(card);
    });
}

renderPreviews();
