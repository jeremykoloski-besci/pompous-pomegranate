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

// --- HELPER TO EXTRACT & TRUNCATE TEXT ---
function extractTextFromPortableText(item, maxLength = 160) {
    if (!item) return "A reader-submitted satirical article approved by the editors...";
    
    let plainText = "";
    const raw = item.body || item.excerpt || item.headline || item.text || item.description;

    if (!raw) {
        plainText = item.title || item.headline || "A reader-submitted satirical article approved by the editors...";
    } else if (typeof raw === 'string') {
        plainText = raw;
    } else if (Array.isArray(raw)) {
        plainText = raw
            .map(block => {
                if (block && block._type === 'block' && Array.isArray(block.children)) {
                    return block.children.map(child => child ? (child.text || '') : '').join('');
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

// --- HELPER TO FORMAT DATE ---
function formatArticleDate(rawDateString) {
    if (!rawDateString) {
        return new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    }
    return new Date(rawDateString).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

// --- RENDER FEED FUNCTION ---
function renderFeed(searchTerm = '') {
    const articlesGrid = document.getElementById('articlesGrid');
    const heroArticle = document.getElementById('heroArticle');
    
    // Hide unused hero container to prevent layout gaps
    if (heroArticle) heroArticle.style.display = 'none';
    if (!articlesGrid) return;
    
    articlesGrid.innerHTML = '';

    // Handle Community Pitches view
    if (currentCategory === 'pitches') {
        const filteredPitches = allPitches.filter(p => {
            if (!p) return false;
            const headline = (p.headline || '').toLowerCase();
            return headline.includes(searchTerm);
        });

        if (filteredPitches.length === 0) {
            articlesGrid.innerHTML = '<p style="padding: 20px; color: var(--text-secondary);">No community articles found.</p>';
            return;
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
            pitchCard.addEventListener('click', () => {
                window.location.href = articleUrl;
            });
            articlesGrid.appendChild(pitchCard);
        });
        return;
    }

    // Filter standard posts
    const filteredPosts = allPosts.filter(post => {
        if (!post) return false;
        const postCategory = (post.category || '').trim().toLowerCase();
        const title = (post.title || '').toLowerCase();
        const matchesSearch = title.includes(searchTerm);
        
        if (currentCategory === 'all' || currentCategory === 'home') {
            return matchesSearch;
        }
        return matchesSearch && (postCategory === currentCategory || postCategory.
