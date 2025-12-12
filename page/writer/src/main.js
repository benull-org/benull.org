// Storage Key for the Writer app (Shared with local tests if needed, but intended for standalone use)
const STORAGE_KEY = 'benull_writer_drafts';

// --- DATA LAYER ---
function getArticles() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveArticle(article) {
    const articles = getArticles();
    const index = articles.findIndex(a => a.id === article.id);
    const now = new Date().toISOString();

    if (index >= 0) {
        articles[index] = { ...articles[index], ...article, updatedAt: now };
    } else {
        articles.push({
            ...article,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

function deleteArticle(id) {
    const articles = getArticles();
    const newArticles = articles.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newArticles));
}

function exportData() {
    const articles = getArticles();
    const blob = new Blob([JSON.stringify(articles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'articles.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- UI LAYER ---
const viewList = document.getElementById('view-list');
const viewEditor = document.getElementById('view-editor');
const listContainer = document.getElementById('article-list');

const titleInput = document.getElementById('editor-title');
const slugInput = document.getElementById('editor-slug');
const contentInput = document.getElementById('editor-content');

let currentArticleId = null;

// Slugify helper
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

function renderList() {
    const articles = getArticles().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    listContainer.innerHTML = '';

    if (articles.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; color:#666;">No articles. Create one!</div>';
        return;
    }

    articles.forEach(article => {
        const item = document.createElement('div');
        item.className = 'article-item';
        item.innerHTML = `
            <div>
                <div style="font-weight:bold; font-size:1.1rem; margin-bottom:0.25rem;">${article.title || 'Untitled'}</div>
                <div style="font-size:0.8rem; color:#86868b;">/${article.slug || '#'}</div>
                <div style="font-size:0.8rem; color:#666;">Updated: ${new Date(article.updatedAt).toLocaleDateString()}</div>
            </div>
            <button class="edit-btn">Edit</button>
        `;
        item.querySelector('.edit-btn').addEventListener('click', () => openEditor(article));
        listContainer.appendChild(item);
    });
}

function openEditor(article = null) {
    viewList.classList.add('hidden');
    viewEditor.classList.remove('hidden');

    if (article) {
        currentArticleId = article.id;
        titleInput.value = article.title || '';
        slugInput.value = article.slug || '';
        contentInput.value = article.content || '';
    } else {
        currentArticleId = null;
        titleInput.value = '';
        slugInput.value = '';
        contentInput.value = '';
    }
}

// Auto-generate slug from title
titleInput.addEventListener('input', () => {
    if (!currentArticleId || !slugInput.value) { // Only auto-gen for new articles or empty slug
        slugInput.value = slugify(titleInput.value);
    }
});

function closeEditor() {
    viewEditor.classList.add('hidden');
    viewList.classList.remove('hidden');
    renderList();
}

// Event Listeners
document.getElementById('create-btn').addEventListener('click', () => openEditor());
document.getElementById('back-btn').addEventListener('click', closeEditor);

document.getElementById('save-btn').addEventListener('click', () => {
    const title = titleInput.value.trim();
    let slug = slugInput.value.trim();
    const content = contentInput.value;

    if (!title) {
        alert('Title is required');
        return;
    }

    if (!slug) {
        slug = slugify(title);
    }

    saveArticle({
        id: currentArticleId,
        title,
        slug,
        content
    });
    closeEditor();
});

document.getElementById('delete-btn').addEventListener('click', () => {
    if (currentArticleId && confirm('Delete this article?')) {
        deleteArticle(currentArticleId);
        closeEditor();
    }
});

document.getElementById('export-btn').addEventListener('click', exportData);

// Image Upload Logic
const imageUpload = document.getElementById('image-upload');
const insertImageBtn = document.getElementById('insert-image-btn');

insertImageBtn.addEventListener('click', () => {
    imageUpload.click();
});

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // processing notification (optional, but good for UX)
    const originalBtnText = insertImageBtn.textContent;
    insertImageBtn.textContent = 'Processing...';
    insertImageBtn.disabled = true;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Resize Logic
            const MAX_WIDTH = 1000; // Max width for article images
            const MAX_HEIGHT = 1000;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.7 quality (good balance)
            // Note: JPEG doesn't support transparency (it turns black), 
            // if transparency is transparent, maybe convert to PNG? 
            // But PNG can be large. Let's stick to JPEG for strict optimization unless it's a small icon.
            // For now, simple JPEG compression.
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            const markdown = `![Image](${dataUrl})`;

            // Insert at cursor
            const startPos = contentInput.selectionStart;
            const endPos = contentInput.selectionEnd;
            const text = contentInput.value;

            contentInput.value = text.substring(0, startPos) + markdown + text.substring(endPos);

            // Reset cursor
            contentInput.selectionStart = contentInput.selectionEnd = startPos + markdown.length;
            contentInput.focus();

            // Reset UI
            insertImageBtn.textContent = originalBtnText;
            insertImageBtn.disabled = false;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    imageUpload.value = ''; // Reset input
});

// Init
renderList();
