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

// --- CSS STYLING FOR CARDS ---
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
    
    if (!articlesGrid) return;
    articlesGrid.innerHTML = '';

    // If Community Pitches tab is selected
    if (currentCategory === 'pitches') {
        if (heroArticle) heroArticle.style.display = 'none';
        
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
        return matchesSearch && (postCategory === currentCategory || postCategory.includes(currentCategory));
    });

    // Render Hero Article on Home / All view
    if (heroArticle) {
        if ((currentCategory === 'all' || currentCategory === 'home') && filteredPosts.length > 0 && !searchTerm) {
            const hero = filteredPosts[0];
            const heroSlug = hero.slug?.current || hero._id;
            const heroTitle = hero.title || "Untitled Satire";
            const heroCategory = hero.category || "General Satire";
            const heroDate = formatArticleDate(hero.publishedAt);
            const heroImage = hero.imageUrl || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80";
            const heroExcerpt = extractTextFromPortableText(hero, 220);

            heroArticle.style.display = 'block';
            heroArticle.innerHTML = `
                <div class="card-image-wrapper" style="cursor: pointer;">
                    <span class="category-tag">${heroCategory}</span>
                    <img src="${heroImage}" alt="Hero thumbnail" style="width:100%; height:auto; display:block;">
                </div>
                <div class="card-content" style="cursor: pointer; padding: 20px;">
                    <div class="article-meta">
                        <span><i class="fa-regular fa-clock"></i> ${heroDate}</span>
                    </div>
                    <h2 class="article-headline" style="font-size: 1.8rem; margin: 10px 0;">${heroTitle}</h2>
                    <p class="article-excerpt">${heroExcerpt}</p>
                </div>
            `;
            heroArticle.onclick = () => {
                window.location.href = "/article/" + heroSlug;
            };

            filteredPosts.shift(); // Remove first post since it's in the hero
        } else {
            heroArticle.style.display = 'none';
        }
    }

    // Render remaining standard posts into grid
    filteredPosts.forEach((post, index) => {
        const articleSlug = post.slug?.current || post._id || index + 1;
        const postTitle = post.title || "Untitled Satire";
        const postCategory = post.category || "General Satire";
        const postDate = formatArticleDate(post.publishedAt || post.submittedAt || post._createdAt);
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
        newCard.addEventListener('click', () => {
            window.location.href = articleUrl;
        });
        articlesGrid.appendChild(newCard);
    });

    // Also append community pitches on Home / All view
    if (currentCategory === 'all' || currentCategory === 'home') {
        const filteredPitches = allPitches.filter(p => {
            if (!p) return false;
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
            pitchCard.addEventListener('click', () => {
                window.location.href = articleUrl;
            });
            articlesGrid.appendChild(pitchCard);
        });
    }

    if (articlesGrid.children.length === 0) {
        articlesGrid.innerHTML = '<p style="padding: 20px; color: var(--text-secondary);">No articles found.</p>';
    }
}

// --- FETCH FROM SANITY ---
async function fetchArticlesFromSanity() {
    try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        allPosts = data.result || [];
        allPitches = data.pitches || []; 
        const factCheckData = data.factCheck; 
        const breakingData = data.breaking;

        // Fact Check Widget
        const factCheckContainer = document.getElementById('factCheckContainer');
        if (factCheckContainer && factCheckData) {
            factCheckContainer.innerHTML = 
                '<p><strong>Claim:</strong> "' + (factCheckData.claim || '') + '"</p>' +
                '<p style="margin-top: 8px;"><strong>Verdict:</strong> <span style="color:var(--accent-color); font-weight:bold;">' + (factCheckData.verdict || '') + '</span></p>';
        } else if (factCheckContainer) {
            factCheckContainer.innerHTML = '<p>No fact checks published yet.</p>';
        }

        // Breaking News Banner
        const breakingBar = document.getElementById('breakingBar');
        const breakingContent = document.getElementById('breakingContent');
        if (breakingBar && breakingContent && breakingData) {
            const breakingSlug = breakingData.slug?.current || '#';
            const breakingTitle = breakingData.title || "Breaking Satirical Update";
            breakingContent.innerHTML = 
                '🚨 BREAKING: ' + breakingTitle + 
                ' <a href="/article/' + breakingSlug + '">Read Story &rarr;</a>';
            breakingBar.style.display = 'block';
        } else if (breakingBar) {
            breakingBar.style.display = 'none';
        }
        
        renderFeed();
    } catch (error) {
        console.error("Error fetching live articles from Sanity proxy:", error);
    }
}

// --- TAB & NAV EVENT DELEGATION ---
document.addEventListener('click', (e) => {
    const navLink = e.target.closest('.main-nav .nav-link, .footer-col ul a[data-category]');
    
    if (navLink) {
        e.preventDefault();
        const catAttr = navLink.getAttribute('data-category');
        currentCategory = catAttr ? catAttr.trim().toLowerCase() : 'all';

        if (navLink.closest('.main-nav')) {
            document.querySelectorAll('.main-nav .nav-link').forEach(l => l.classList.remove('active'));
            navLink.classList.add('active');
        }
        
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        renderFeed(searchTerm);
    }

    if (e.target.id === 'openAboutModal') { e.preventDefault(); openLegalModal('about'); }
    if (e.target.id === 'openStandardsModal') { e.preventDefault(); openLegalModal('standards'); }
    if (e.target.id === 'openPrivacyModal') { e.preventDefault(); openLegalModal('privacy'); }
    if (e.target.id === 'openContactModal') { e.preventDefault(); openLegalModal('contact'); }
});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderFeed(e.target.value.toLowerCase());
        });
    }

    const headerLinks = document.querySelectorAll('header a.site-title-link, .logo-area a');
    headerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const homeNav = document.querySelector('.main-nav .nav-link[data-category="all"]');
            if (homeNav) {
                document.querySelectorAll('.main-nav .nav-link').forEach(l => l.classList.remove('active'));
                homeNav.classList.add('active');
            }
            currentCategory = 'all';
            renderFeed();
        });
    });

    const pitchForm = document.getElementById('pitchForm');
    if (pitchForm) {
        pitchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const author = document.getElementById('pitchAuthor').value;
            const email = document.getElementById('pitchEmail').value;
            const headline = document.getElementById('pitchHeadline').value;
            const body = document.getElementById('pitchBody').value;

            try {
                const response = await fetch('/api/submit-pitch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ author, email, headline, body })
                });

                const result = await response.json();

                if (response.ok) {
                    showToast('Your satirical article has been submitted to the editors for peer review!');
                    pitchForm.reset();
                    if (pitchModal) pitchModal.classList.remove('active');
                } else {
                    showToast('Error submitting article: ' + (result.error || 'Please try again.'));
                }
            } catch (err) {
                console.error('Submission error:', err);
                showToast('Something went wrong. Please try again later.');
            }
        });
    }

    fetchArticlesFromSanity();
});

function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    if (!toast) return;

    if (toastMsg) toastMsg.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
