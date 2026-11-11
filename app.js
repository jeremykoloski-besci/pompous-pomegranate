// --- SANITY IMAGE BUILDER HELPER ---
function urlForSanityImage(source) {
    if (!source) return '';
    if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
        return source;
    }
    
    const imageAsset = source.asset || source;
    const ref = imageAsset._ref || imageAsset._id;
    if (!ref) return '';

    const parts = ref.split('-');
    if (parts.length < 4) return '';
    
    const assetId = parts[1];
    const dimensions = parts[2];
    const extension = parts[3];

    // Configured with your exact Project ID
    const projectId = "5hfaqqg7"; 
    const dataset = "production";

    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${dimensions}.${extension}`;
}

// --- 1. SINGLE ARTICLE ROUTER (Executes on page load if visiting /article/...) ---
async function renderSingleArticle(slug) {
    console.log("Attempting to render article with slug:", slug);
    try {
        const response = await fetch(`/api/posts?slug=${slug}`);
        if (!response.ok) throw new Error('Failed to fetch article');
        
        const data = await response.json();
        const post = data.result;

        // BULLETPROOF HIDE: Hide everything inside the content feed except our article view
        const contentFeed = document.querySelector('.content-feed');
        if (contentFeed) {
            Array.from(contentFeed.children).forEach(child => {
                if (child.id !== 'singleArticleView') {
                    child.style.setProperty('display', 'none', 'important');
                }
            });
        }

        // Activate the single article container
        let articleView = document.getElementById('singleArticleView');
        if (articleView) {
            articleView.style.setProperty('display', 'block', 'important');
        }

        if (!post) {
            if (articleView) {
                articleView.innerHTML = `
                    <button onclick="goHome()" style="margin-bottom: 20px; cursor: pointer; padding: 8px 16px; background:var(--text-primary); color:var(--card-bg); border:none; border-radius:4px; font-weight:500;">&larr; Back to Home</button>
                    <h1>Article Not Found</h1>
                    <p>This satire piece couldn't be found or is still awaiting publication.</p>
                `;
            }
            return;
        }

        let htmlContent = '<p>No content provided.</p>';
        const rawBody = post.body || post.text || post.description;

        if (Array.isArray(rawBody)) {
            htmlContent = rawBody.map(block => {
                if (block._type === 'block' && block.children) {
                    return `<p style="margin-bottom: 16px; line-height: 1.8;">${block.children.map(c => c.text).join('')}</p>`;
                }
                return '';
            }).join('');
        } else if (typeof rawBody === 'string' && rawBody.trim() !== '') {
            htmlContent = `<p style="margin-bottom: 16px; line-height: 1.8;">${rawBody}</p>`;
        }

        const hasLiked = checkIfLiked(post._id);

        // Process image safely using the Sanity asset URL builder
        const rawImageSource = post.imageUrl || post.imageURL || post.image;
        const imageSource = urlForSanityImage(rawImageSource);
        const imageHtml = imageSource ? `
            <img src="${imageSource}" alt="Article image" style="width: 100%; max-height: 450px; object-fit: cover; border-radius: 6px; margin-bottom: 24px;" onerror="this.style.display='none'">
        ` : '';

        if (articleView) {
            articleView.innerHTML = `
                <button onclick="goHome()" style="margin-bottom: 20px; cursor: pointer; padding: 8px 16px; background:var(--text-primary); color:var(--card-bg); border:none; border-radius:4px; font-weight:500;">&larr; Back to Home</button>
                <h1 style="font-size: 36px; margin-bottom: 12px; font-weight: 700; font-family: 'Zilla Slab', serif; color: var(--text-primary);">${post.title || post.headline}</h1>
                <div style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span>By ${post.author || 'Anonymous Pomp'} • ${new Date(post.publishedAt || post.submittedAt).toLocaleDateString()}</span>
                    
                    <!-- Like Button Component -->
                    <button id="likeArticleBtn" onclick="handleLike('${post._id}')" ${hasLiked ? 'data-liked="true" style="background: transparent; border: 1px solid var(--accent-color); color: var(--accent-color); padding: 6px 12px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600;"' : 'data-liked="false" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 6px 12px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600;"'}>
                        <i class="fa-solid fa-heart" style="color: var(--accent-color);"></i> 
                        <span id="likeCount">${post.likes || 0}</span> Likes
                    </button>
                </div>
                ${imageHtml}
                <div style="font-size: 18px; color: var(--text-primary); line-height: 1.7;">${htmlContent}</div>
            `;
        }

    } catch (err) {
        console.error("Error loading article:", err);
    }
}

function checkIfLiked(postId) {
    const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    return likedPosts.includes(postId);
}

function markAsLiked(postId) {
    const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    if (!likedPosts.includes(postId)) {
        likedPosts.push(postId);
        localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
    }
}

async function handleLike(postId) {
    const likeBtn = document.getElementById('likeArticleBtn');
    const likeCountSpan = document.getElementById('likeCount');
    if (!likeBtn || likeBtn.dataset.liked === "true") {
        showToast("You've already liked this piece of fine journalism!");
        return;
    }

    // Optimistically update UI immediately for instant feedback
    likeBtn.dataset.liked = "true";
    likeBtn.style.borderColor = "var(--accent-color)";
    likeBtn.style.color = "var(--accent-color)";
    let currentLikes = parseInt(likeCountSpan.textContent) || 0;
    likeCountSpan.textContent = currentLikes + 1;
    markAsLiked(postId);

    try {
        const response = await fetch('/api/like-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId })
        });

        if (!response.ok) {
            throw new Error('Failed to record like');
        }
    } catch (err) {
        console.error("Error liking article:", err);
        // Revert UI if server request fails
        likeCountSpan.textContent = currentLikes;
        likeBtn.dataset.liked = "false";
        likeBtn.style.borderColor = "var(--border-color)";
        likeBtn.style.color = "var(--text-primary)";
    }
}

function goHome() {
    window.location.href = '/';
}

// Global application state
let allPosts = [];
let allPitches = [];
let currentCategory = 'all';

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const dateEl = document.getElementById('currentDate');
if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}

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

const subModal = document.getElementById('subModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeSubModalBtn = document.getElementById('closeSubModalBtn');

if (openModalBtn && subModal) {
    openModalBtn.addEventListener('click', () => subModal.classList.add('active'));
}
if (closeSubModalBtn && subModal) {
    closeSubModalBtn.addEventListener('click', () => subModal.classList.remove('active'));
}

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

function formatArticleDate(rawDateString) {
    if (!rawDateString) {
        return new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    }
    return new Date(rawDateString).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

function renderFeed(searchTerm = '') {
    const articlesGrid = document.getElementById('articlesGrid');
    const heroArticle = document.querySelector('.hero-article');
    
    if (!articlesGrid) return;
    articlesGrid.innerHTML = '';

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
            const pitchImage = urlForSanityImage(pitch.imageUrl || pitch.image) || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80";
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

    filteredPosts.forEach((post, index) => {
        const articleSlug = post.slug?.current || post._id || index + 1;
        const postTitle = post.title || "Untitled Satire";
        const postCategory = post.category || "General Satire";
        const postDate = formatArticleDate(post.publishedAt || post.submittedAt);
        const postImage = urlForSanityImage(post.imageUrl || post.image) || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80";
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

    if (currentCategory === 'all' || currentCategory === 'home') {
        const filteredPitches = allPitches.filter(p => {
            const headline = (p.headline || '').toLowerCase();
            return headline.includes(searchTerm);
        });

        filteredPitches.forEach((pitch) => {
            const pitchSlug = (pitch.headline || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || pitch._id;
            const pitchImage = urlForSanityImage(pitch.imageUrl || pitch.image) || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80";
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

async function fetchArticlesFromSanity() {
    try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        allPosts = data.result || [];
        allPitches = data.pitches || []; 
        const factCheckData = data.factCheck; 
        const breakingData = data.breaking;

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

        const trendingList = document.getElementById('trendingList');
        if (trendingList) {
            if (allPosts.length > 0) {
                const topTrending = allPosts.slice(0, 3);
                trendingList.innerHTML = topTrending.map((post, index) => {
                    const postSlug = post.slug?.current || post._id || index + 1;
                    const postTitle = post.title || "Untitled Satire";
                    return `
                        <li>
                            <span class="trend-number">${index + 1}</span>
                            <a href="/article/${postSlug}">${postTitle}</a>
                        </li>
                    `;
                }).join('');
            } else {
                trendingList.innerHTML = '<li><span class="trend-number">1</span> <span style="color:var(--text-secondary); font-size:0.9rem;">Awaiting published articles...</span></li>';
            }
        }
        
        if (!window.location.pathname.startsWith('/article/')) {
            renderFeed();
            window.scrollTo(0, 0);
        }
    } catch (error) {
        console.error("Error fetching live articles from Sanity proxy:", error);
    }
}

document.addEventListener('click', (e) => {
    const navLink = e.target.closest('.main-nav .nav-link, .footer-col ul a[data-category]');
    
    if (navLink) {
        const catAttr = navLink.getAttribute('data-category');
        const targetCat = catAttr ? catAttr.trim().toLowerCase() : 'all';

        if (window.location.pathname.startsWith('/article/')) {
            e.preventDefault();
            window.location.href = `/?category=${targetCat}`;
            return;
        }

        e.preventDefault();
        currentCategory = targetCat;

        if (navLink.closest('.site-footer')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const matchingNav = document.querySelector(`.main-nav .nav-link[data-category="${currentCategory}"]`);
            if (matchingNav) {
                document.querySelectorAll('.main-nav .nav-link').forEach(l => l.classList.remove('active'));
                matchingNav.classList.add('active');
            }
        } else if (navLink.closest('.main-nav')) {
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

// Unified DOMContentLoaded Initialization
window.addEventListener('DOMContentLoaded', async () => {
    window.scrollTo(0, 0);
    
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const targetCategory = urlParams.get('category');
    if (targetCategory) {
        currentCategory = targetCategory.trim().toLowerCase();
        
        document.querySelectorAll('.main-nav .nav-link').forEach(l => {
            if (l.getAttribute('data-category') === currentCategory) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });
    }

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
            window.location.href = '/';
        });
    });

    // --- Newsletter Subscription Handler ---
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('newsletterEmail');
            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            
            if (emailInput && emailInput.value) {
                const email = emailInput.value;
                if (submitBtn) submitBtn.disabled = true;

                try {
                    const response = await fetch('/api/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });

                    const text = await response.text();
                    let result;
                    try {
                        result = JSON.parse(text);
                    } catch (parseErr) {
                        console.error('Server response was not JSON:', text);
                        throw new Error('Server returned an invalid response (500 Error). Check Vercel logs.');
                    }

                    if (response.ok) {
                        showToast('Subscribed successfully! Check your inbox for confirmation.');
                        newsletterForm.reset();
                    } else {
                        showToast('Error: ' + (result.error || 'Please try again.'));
                    }
                } catch (err) {
                    console.error('Newsletter submission error:', err);
                    showToast(err.message || 'Something went wrong. Please try again.');
                } finally {
                    if (submitBtn) submitBtn.disabled = false;
                }
            }
        });
    }

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

    // 1. Fetch data first so sidebar widgets populate properly everywhere
    await fetchArticlesFromSanity();

    // 2. Route based on URL path
    const path = window.location.pathname;
    console.log("Current path on load:", path);
    if (path.startsWith('/article/')) {
        const slug = path.split('/article/')[1];
        console.log("Extracted slug:", slug);
        await renderSingleArticle(slug);
    }
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

window.allPosts = allPosts;
window.allPitches = allPitches;
window.renderFeed = renderFeed;
window.renderSingleArticle = renderSingleArticle;
