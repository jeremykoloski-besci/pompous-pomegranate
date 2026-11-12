// --- IMMEDIATE SCROLL FIX ---
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// --- SANITY IMAGE BUILDER HELPER ---
function urlForSanityImage(source, width = 1200, height = 630) {
    if (!source) return '';
    if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
        return source;
    }
    
    // Handle Sanity image object or reference
    const imageAsset = source.asset || source;
    const ref = imageAsset._ref || imageAsset._id;
    if (!ref) return '';

    const parts = ref.split('-');
    if (parts.length < 4) return '';
    
    const assetId = parts[1];
    const dimensions = parts[2];
    const extension = parts[3];

    const projectId = "5hfaqqg7"; 
    const dataset = "production";

    // Base CDN URL
    let baseUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${dimensions}.${extension}`;
    
    // If your API passed crop/hotspot object data directly into mainImage, 
    // Sanity's CDN automatically respects crop if we use crop parameters or if we pass the asset correctly.
    return `${baseUrl}?auto=format&fit=crop&w=${width}&h=${height}&fm=jpg`;
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

        // Process image safely using the Sanity asset URL builder with explicit crop dimensions (1200x630 for 1.91:1 ratio)
        const rawImageSource = post.mainImage || post.imageUrl || post.imageURL || post.image;
        const imageSource = urlForSanityImage(rawImageSource, 1200, 630);
        const imageHtml = imageSource ? `
            <div style="width: 100%; aspect-ratio: 1.91 / 1; overflow: hidden; border-radius: 6px; margin-bottom: 24px;">
                <img src="${imageSource}" alt="Article image" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'">
            </div>
        ` : '';

        // --- SOCIAL SHARE LINKS GENERATOR (Onion Style) ---
        const currentUrl = encodeURIComponent(window.location.href);
        const shareTitle = encodeURIComponent(post.title || post.headline || 'The Pompous Pomegranate');

        const socialShareHTML = `
          <div class="article-share-container">
              <span class="share-label">Share</span>
              <div class="share-buttons">
                  <a href="https://www.facebook.com/sharer/sharer.php?u=${currentUrl}" target="_blank" rel="noopener noreferrer" class="share-btn" title="Share on Facebook">
                      <i class="fa-brands fa-facebook-f"></i>
                  </a>
                  <a href="https://twitter.com/intent/tweet?url=${currentUrl}&text=${shareTitle}" target="_blank" rel="noopener noreferrer" class="share-btn" title="Share on X">
                      <i class="fa-brands fa-twitter"></i>
                  </a>
                  <a href="mailto:?subject=${shareTitle}&body=Check out this satirical piece: ${currentUrl}" class="share-btn" title="Share via Email">
                      <i class="fa-solid fa-envelope"></i>
                  </a>
                  <button onclick="navigator.clipboard.writeText(window.location.href); showToast('Article link copied to clipboard!');" class="share-btn" title="Copy Link">
                      <i class="fa-solid fa-link"></i>
                  </button>
              </div>
          </div>
        `;

        // --- PREVIOUS & NEXT ARTICLE NAVIGATION COMPONENTS ---
        const prevNav = post.prevPost ? `
          <a href="/article/${post.prevPost.slug}" class="nav-card prev-card">
            ${post.prevPost.imageUrl ? `<img src="${urlForSanityImage(post.prevPost.imageUrl, 400, 250)}" alt="">` : ''}
            <div>
              <span class="nav-label">&larr; PREVIOUS</span>
              <h4>${post.prevPost.title}</h4>
            </div>
          </a>
        ` : '<div></div>';

        const nextNav = post.nextPost ? `
          <a href="/article/${post.nextPost.slug}" class="nav-card next-card">
            ${post.nextPost.imageUrl ? `<img src="${urlForSanityImage(post.nextPost.imageUrl, 400, 250)}" alt="">` : ''}
            <div>
              <span class="nav-label">NEXT &rarr;</span>
              <h4>${post.nextPost.title}</h4>
            </div>
          </a>
        ` : '<div></div>';

        const paginationHTML = `
          <div class="article-pagination">
            ${prevNav}
            ${nextNav}
          </div>
        `;

        // --- COMMUNITY PITCH CALLOUT BOX ---
        const pitchCalloutHTML = `
          <div class="pitch-section card" style="margin-top: 40px; text-align: center;">
              <div class="pitch-header">
                  <h2 style="font-family: 'Merriweather', serif; font-size: 1.3rem; margin-bottom: 5px;"><i class="fa-solid fa-lightbulb"></i> Got a Satirical Scoop?</h2>
                  <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px;">Think you can out-satire us? Send your headline and full article to our editors.</p>
              </div>
              <button onclick="document.getElementById('pitchModal').classList.add('active')" class="submit-pitch-btn" style="max-width: 400px; margin: 0 auto;">
                  <i class="fa-solid fa-pen-nib"></i> Submit a Community Article
              </button>
          </div>
        `;

        // Check if it's a community pitch by looking at the URL path, fallback properties, or feed array
        const isPitch = window.location.pathname.includes('/pitch/') || 
                        (window.allPitches && window.allPitches.some(p => p._id === post._id)) || 
                        post.category === 'pitch' || 
                        !post.category;

        const categoryLabel = isPitch ? "COMMUNITY PITCH" : post.category.toUpperCase();

        if (articleView) {
            articleView.innerHTML = `
                <button onclick="goHome()" style="margin-bottom: 16px; cursor: pointer; padding: 6px 12px; background:var(--text-primary); color:var(--card-bg); border:none; border-radius:4px; font-weight:500; font-size: 13px;">&larr; Back to Home</button>
                
                <h1 style="font-size: 28px; line-height: 1.15; margin-bottom: 10px; font-weight: 700; font-family: 'Zilla Slab', serif; color: var(--text-primary);">${post.title || post.headline}</h1>
                
                <div style="color: var(--text-secondary); margin-bottom: 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                    <span style="color: var(--accent-color);">${categoryLabel}</span> &bull; <span>${formatArticleDate(post.publishedAt || post.submittedAt)}</span>
                </div>

                ${imageHtml}

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    ${socialShareHTML}
                    
                    <!-- Like Button Component -->
                    <button id="likeArticleBtn" onclick="handleLike('${post._id}')" ${hasLiked ? 'data-liked="true" style="background: transparent; border: 1px solid var(--accent-color); color: var(--accent-color); padding: 4px 10px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600; font-size: 13px;"' : 'data-liked="false" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 4px 10px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600; font-size: 13px;"'}>
                        <i class="fa-solid fa-heart" style="color: var(--accent-color);"></i> 
                        <span id="likeCount">${post.likes || 0}</span> Likes
                    </button>
                </div>

                <div style="font-size: 18px; color: var(--text-primary); line-height: 1.7;">${htmlContent}</div>
                ${paginationHTML}
                ${pitchCalloutHTML}
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
        const response = await fetch('/api/like', {
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
        return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return new Date(rawDateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
            const pitchImage = urlForSanityImage(pitch.mainImage || pitch.imageUrl || pitch.image, 600, 315) || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80";
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
                    <div class="article-meta">${pitchDate}</div>
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
        const postImage = urlForSanityImage(post.mainImage || post.imageUrl || post.image, 600, 315) || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80";
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
                <div class="article-meta">${postDate}</div>
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
            const pitchImage = urlForSanityImage(pitch.mainImage || pitch.imageUrl || pitch.image, 600, 315) || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80";
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
                    <div class="article-meta">${pitchDate}</div>
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
    const navLink = e.target.closest('.main-nav .nav-link, .footer-col ul a[data-category], .mobile-nav-links a');
    
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

        // Update active states across both desktop and mobile navs
        document.querySelectorAll('.main-nav .nav-link, .mobile-nav-links a').forEach(l => {
            if (l.getAttribute('data-category') === currentCategory) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });

        if (navLink.closest('.site-footer')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
    // FORCE HARD RESET TO TOP INSTANTLY ON LOAD
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }

    // --- STICKY HEADER SHRINK ON SCROLL ---
    const siteHeader = document.getElementById('siteHeader');
    if (siteHeader) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                siteHeader.classList.add('scrolled');
            } else {
                siteHeader.classList.remove('scrolled');
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const targetCategory = urlParams.get('category');
    if (targetCategory) {
        currentCategory = targetCategory.trim().toLowerCase();
        
        document.querySelectorAll('.main-nav .nav-link, .mobile-nav-links a').forEach(l => {
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

    const headerLinks = document.querySelectorAll('header a.site-title-link, .logo-area a, .mobile-header-logo');
    headerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/';
        });
    });

    // --- BEE-STYLE MOBILE MENU DRAWER TOGGLE ---
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenuDrawer = document.getElementById('mobileMenuDrawer');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileBackdrop = document.getElementById('mobileBackdrop');

    function toggleMobileMenu() {
        if (mobileMenuDrawer && mobileBackdrop) {
            mobileMenuDrawer.classList.toggle('open');
            mobileBackdrop.classList.toggle('active');
        }
    }

    if (menuToggle) menuToggle.addEventListener('click', toggleMobileMenu);
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', toggleMobileMenu);
    if (mobileBackdrop) mobileBackdrop.addEventListener('click', toggleMobileMenu);

    // Close drawer when clicking mobile nav links
    document.querySelectorAll('.mobile-nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            toggleMobileMenu();
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

    // FORCE SCROLL TO TOP AGAIN AFTER SANITY DATA RENDERS TO CATCH ANY LAYOT SHIFTS
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // 2. Route based on URL path
    const path = window.location.pathname;
    console.log("Current path on load:", path);
    if (path.startsWith('/article/')) {
        const slug = path.split('/article/')[1];
        console.log("Extracted slug:", slug);
        await renderSingleArticle(slug);
        window.scrollTo(0, 0); // Extra check for article view routes
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
