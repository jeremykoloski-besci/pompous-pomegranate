// --- 1. SINGLE ARTICLE ROUTER (Executes on page load if visiting /article/...) ---
async function renderSingleArticle(slug) {
    console.log("Attempting to render article with slug:", slug);
    try {
        const response = await fetch(`/api/posts?slug=${slug}`);
        if (!response.ok) throw new Error('Failed to fetch article');
        
        const data = await response.json();
        console.log("Article API response:", data);
        
        const post = data.result;

        // Hide all home feed sections & articles grid
        const homeElements = document.querySelectorAll('main, .hero-section, .feed-container, .trending-section, #articlesGrid');
        homeElements.forEach(el => {
            if (el) el.style.setProperty('display', 'none', 'important');
        });

        let articleView = document.getElementById('singleArticleView');
        if (!articleView) {
            articleView = document.createElement('div');
            articleView.id = 'singleArticleView';
            articleView.style.cssText = 'max-width: 800px; margin: 40px auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);';
            document.body.appendChild(articleView);
        }
        articleView.style.setProperty('display', 'block', 'important');

        if (!post) {
            articleView.innerHTML = `
                <button onclick="goHome()" style="margin-bottom: 20px; cursor: pointer; padding: 8px 16px;">&larr; Back to Home</button>
                <h1>Article Not Found</h1>
                <p>This satire piece couldn't be found or is still awaiting publication.</p>
            `;
            return;
        }

        let htmlContent = '<p>No content provided.</p>';
        if (Array.isArray(post.body)) {
            htmlContent = post.body.map(block => {
                if (block._type === 'block' && block.children) {
                    return `<p style="margin-bottom: 16px; line-height: 1.8;">${block.children.map(c => c.text).join('')}</p>`;
                }
                return '';
            }).join('');
        }

        articleView.innerHTML = `
            <button onclick="goHome()" style="margin-bottom: 20px; cursor: pointer; padding: 8px 16px; background:#18181b; color:#fff; border:none; border-radius:4px; font-weight:500;">&larr; Back to Home</button>
            <h1 style="font-size: 32px; margin-bottom: 12px; font-weight: 700;">${post.title}</h1>
            <div style="color: #666; margin-bottom: 24px; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 12px;">
                By ${post.author \vert{}\vert{} 'Anonymous Pomp'} •${new Date(post.publishedAt).toLocaleDateString()}
            </div>
            ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Article image" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 6px; margin-bottom: 24px;">` : ''}
            <div style="font-size: 18px; color: #27272a;">${htmlContent}</div>
        `;

    } catch (err) {
        console.error("Error loading article:", err);
    }
}

function goHome() {
    window.location.href = '/';
}

window.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.startsWith('/article/')) {
        const slug = path.split('/article/')[1];
        renderSingleArticle(slug);
    }
});

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

// --- Legal & About Modals Management ---
const legalModal = document.getElementById('legalAboutModal');
const closeLegalModalBtn = document.getElementById('closeLegalModalBtn');
const legalModalContentBody = document.getElementById('legalModalContentBody');

const legalContentData = {
    about: {
        badge: "About Us",
        title: "The Pompous Pomegranate",
        text: "Founded during a particularly tedious Zoom call in 2026, The Pompous Pomegranate is dedicated to delivering hard-hitting, entirely fabricated news that cures the blues and infuriates people who read only headlines. We don't have sources; we have vivid imaginations."
    },
    standards: {
        badge: "Editorial Standards",
        title: "Our Code of Pomposity",
        text: "We hold ourselves to the absolute highest standards of fiction. If a story is even remotely plausible or resembles real life by sheer coincidence, we rewrite it until it sounds sufficiently absurd. Fact-checking is strictly handled by a golden retriever who just wants a treat."
    },
    privacy: {
        badge: "Privacy Policy",
        title: "Your Data Is Safe With Us",
        text: "We collect your email only if you sign up for The Daily Seed newsletter. We promise never to sell your data to evil corporate overlords—unless they offer us really good pastries. Your browsing habits remain between you, your browser history, and existential dread."
    },
    contact: {
        badge: "Contact Desk",
        title: "Drop Us a Line",
        text: "Have a complaint? Take it up with our complaint department (which is currently a shredder under the desk). For pitches, please use our Community Desk modal rather than emailing us directly, because reading emails sounds like work."
    }
};

function openLegalModal(type) {
    const data = legalContentData[type];
    if (!data || !legalModal || !legalModalContentBody) return;

    legalModalContentBody.innerHTML = `
        <span class="badge-gold"><i class="fa-solid fa-scroll"></i> ${data.badge}</span>
        <h2 style="margin-top: 10px; font-family: 'Zilla Slab', serif;">${data.title}</h2>
        <p style="color: var(--text-secondary); line-height: 1.8; margin-top: 15px;">${data.text}</p>
    `;
    legalModal.classList.add('active');
}

if (closeLegalModalBtn && legalModal) {
    closeLegalModalBtn.addEventListener('click', () => legalModal.classList.remove('active'));
}

if (legalModal) {
    legalModal.addEventListener('click', (e) => {
        if (e.target === legalModal) legalModal.classList.remove('active');
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
                    <span><i class="
