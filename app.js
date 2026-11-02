// Global application state
let allPosts = [];
let allPitches = [];
let currentCategory = 'all';

// Force manual scroll restoration immediately
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Current Date Display in Header
const dateEl = document.getElementById('currentDate');
if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}

// Dark/Light Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        if (body.getAttribute('data-theme') === 'dark') {
            body.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    });
}

// Subscriptions & Modals
const subModal = document.getElementById('subModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeSubModalBtn = document.getElementById('closeSubModalBtn');

if (openModalBtn && subModal) {
    openModalBtn.addEventListener('click', () => subModal.classList.add('active'));
}
if (closeSubModalBtn && subModal) {
    closeSubModalBtn.addEventListener('click', () => subModal.classList.remove('active'));
}

// --- Community Pitch Modal Management ---
const pitchModal = document.getElementById('pitchModal');
const openPitchModalBtn = document.getElementById('openPitchModalBtn');
const closePitchModalBtn = document.getElementById('closePitchModalBtn');

if (openPitchModalBtn && pitchModal) {
    openPitchModalBtn.addEventListener('click', () => pitchModal.classList.add('active'));
}
if (closePitchModalBtn && pitchModal) {
    closePitchModalBtn.addEventListener('click', () => pitchModal.classList.remove('active'));
}

if (pitchModal) {
    pitchModal.addEventListener('click', (e) => {
        if (e.target === pitchModal) {
            pitchModal.classList.remove('active');
        }
    });
}

// --- CSS STYLING FOR BOTTOM-LEFT BADGE & CLEAN CARDS ---
const dynamicStyle = document.createElement('style');
dynamicStyle.textContent = `
    .card-image-wrapper {
        position: relative;
        overflow: hidden;
    }
    .card-image-wrapper .category-tag {
        position: absolute !important;
        bottom: 12px !important;
        left: 12px !important;
        top: auto !important;
        right: auto !important;
        z-index: 2;
        margin-bottom: 0 !important;
        width: auto !important;
        height: auto !important;
        display: inline-block !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .article-card.card {
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .article-card.card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
`;
document.head.appendChild(dynamicStyle);

// --- HELPER TO EXTRACT & TRUNCATE TEXT FROM SANITY PORTABLE TEXT OR STRINGS ---
function extractTextFromPortableText(item, maxLength = 160) {
    let plainText = "";
    
    const raw = item?.body || item?.excerpt || item?.text || item?.description || item;

    if (!raw) {
        plainText = "A reader-submitted satirical article approved by the editors...";
    } else if (typeof raw === 'string') {
        plainText = raw;
    } else if (Array.isArray(raw)) {
        plainText = raw
            .map(block => {
                if (block._type === 'block' && block.children) {
                    return block.children.map(child => child.text || '').join('');
                }
                return '';
            })
            .join(' ')
            .trim();
    }

    if (!plainText) {
        plainText = "A reader-submitted satirical article approved by the editors...";
    }

    if (plainText.length > maxLength) {
        return plainText.substring(0, maxLength).trim() + '...';
    }
    
    return plainText;
}

// --- HELPER TO FORMAT DATE STRICTLY AS M/D/YYYY ---
function formatArticleDate(rawDateString) {
    if (!rawDateString) {
        return new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    }
    return new Date(rawDateString).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

// --- RENDER FEED FUNCTION ---
function renderFeed(searchTerm = '') {
    const articlesGrid = document.getElementById('articlesGrid');
    const heroArticle = document.querySelector('.hero-article');
    
    if (!articlesGrid) return;
    articlesGrid.innerHTML = '';

    // Handle Community Pitches tab view (Only Pitches)
    if (currentCategory === 'pitches') {
        if (heroArticle) heroArticle.style.display = 'none';
        
        const filteredPitches = allPitches.filter(p => {
            const headline = (p.headline || '').toLowerCase();
            return headline.includes(searchTerm);
        });

        if (filteredPitches.length === 0) {
            articlesGrid.innerHTML = '<p style="padding: 20px; color: var(--text-secondary);">No community articles found.</p>';
        }

        filteredPitches.forEach((pitch) => {
            const pitchSlug = (pitch.headline || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || pitch._id;
            const pitchImage = pitch.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80";
            const pitchTitle = pitch.headline || "Untitled Article";
            const pitchDate = formatArticleDate(pitch.submittedAt || pitch.publishedAt);
            const articleUrl = "/article/" + pitchSlug;
            const pitchExcerpt = extractTextFromPortableText(pitch);

            const pitchCard = document.createElement('article');
            pitchCard.className = 'article-card card';
            pitchCard.innerHTML = `
                <div class="card-image-wrapper">
                    <span class="category-tag">Community Pitch</span>
                    <img src="${pitchImage}" alt="Article thumbnail">
                </div>
                <div class="card-content">
                    <div class="article-meta">
                        <span><i class="fa-regular fa-clock"></i> ${pitchDate}</span>
                    </div>
                    <h3 class="article-headline">${pitchTitle}</h3>
                    <p class="article-excerpt">${pitchExcerpt}</p>
                </div>
            `;
            pitchCard.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
                window.location.href = articleUrl;
            });
            articlesGrid.appendChild(pitchCard);
        });

        return;
    }

    // Standard feed / Category filtering (or Home/All view)
    if (heroArticle) {
        heroArticle.style.display = (currentCategory === 'all' || currentCategory === 'home') ? 'block' : 'none';
    }

    const filteredPosts = allPosts.filter(post => {
        const postCategory = (post.category || '').trim().toLowerCase();
        const title = (post.title || '').toLowerCase();
        const matchesSearch = title.includes(searchTerm);
        
        if (currentCategory === 'all' || currentCategory === 'home') {
            return matchesSearch;
        }

        const isMatch = postCategory === currentCategory || postCategory.includes(currentCategory);
        return matchesSearch && isMatch;
    });

    // 1. Render regular articles first
    filteredPosts.forEach((post, index) => {
        const articleSlug = post.slug?.current || post._id || index + 1;
        const postTitle = post.title || "Untitled Satire";
        const postCategory = post.category || "General Satire";
        const postDate = formatArticleDate(post.publishedAt || post.submittedAt);
        const postImage = post.imageUrl || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80";
        const articleUrl = "/article/" + articleSlug;
        const postExcerpt = extractTextFromPortableText(post);

        const newCard = document.createElement('article');
        newCard.className = 'article-card card';
        newCard.innerHTML = `
            <div class="card-image-wrapper">
                <span class="category-tag">${postCategory}</span>
                <img src="${postImage}" alt="Article thumbnail">
            </div>
            <div class="card-content">
                <div class="article-meta">
                    <span><i class="fa-regular fa-clock"></i> ${postDate}</span>
                </div>
                <h3 class="article-headline">${postTitle}</h3>
                <p class="article-excerpt">${postExcerpt}</p>
            </div>
        `;
        newCard.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
            window.location.href = articleUrl;
        });
        articlesGrid.appendChild(newCard);
    });

    // 2. If we are on Home / All, also append community pitches into the grid
    if (currentCategory === 'all' || currentCategory === 'home') {
        const filteredPitches = allPitches.filter(p => {
            const headline = (p.headline || '').toLowerCase();
            return headline.includes(searchTerm);
        });

        filteredPitches.forEach((pitch) => {
            const pitchSlug = (pitch.headline || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || pitch._id;
            const pitchImage = pitch.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80";
            const pitchTitle = pitch.headline || "Untitled Article";
            const pitchDate = formatArticleDate(pitch.submittedAt || pitch.publishedAt);
            const articleUrl = "/article/" + pitchSlug;
            const pitchExcerpt = extractTextFromPortableText(pitch);

            const pitchCard = document.createElement('article');
            pitchCard.className = 'article-card card';
            pitchCard.innerHTML = `
                <div class="card-image-wrapper">
                    <span class="category-tag">Community Pitch</span>
                    <img src="${pitchImage}" alt="Article thumbnail">
                </div>
                <div class="card-content">
                    <div class="article-meta">
                        <span><i class="fa-regular fa-clock"></i> ${pitchDate}</span>
                    </div>
                    <h3 class="article-headline">${pitchTitle}</h3>
                    <p class="article-excerpt">${pitchExcerpt}</p>
                </div>
            `;
            pitchCard.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
                window.location.href = articleUrl;
            });
            articlesGrid.appendChild(pitchCard);
        });
    }

    if (filteredPosts.length === 0 && allPitches.length === 0) {
        articlesGrid.innerHTML = '<p style="padding: 20px; color: var(--text-secondary);">No articles found.</p>';
    }
}

// --- SANITY CMS DYNAMIC FETCHING ---
async function fetchArticlesFromSanity() {
    try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        allPosts = data.result || [];
        allPitches = data.pitches || []; 
        const factCheckData = data.factCheck; 

        const factCheckContainer = document.getElementById('factCheckContainer');
        if (factCheckContainer && factCheckData) {
            const claimText = factCheckData.claim || "";
            const verdictText = factCheckData.verdict || "";
            factCheckContainer.innerHTML = 
                '<p><strong>Claim:</strong> "' + claimText + '"</p>' +
                '<p style="margin-top: 8px;"><strong>Verdict:</strong> <span style="color:var(--accent-color); font-weight:bold;">' + verdictText + '</span></p>';
        } else if (factCheckContainer) {
            factCheckContainer.innerHTML = '<p>No fact checks published yet.</p>';
        }
        
        renderFeed();
        window.scrollTo(0, 0);
    } catch (error) {
        console.error("Error fetching live articles from Sanity proxy:", error);
    }
}

// ---
