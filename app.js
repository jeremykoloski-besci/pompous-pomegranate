// Current Date Display
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

// --- SANITY CMS DYNAMIC FETCHING VIA DIRECT FETCH ---
async function fetchArticlesFromSanity() {
    const url = '/api/posts';

    try {
        const response = await fetch(url);
        const data = await response.json();
        const posts = data.result || [];
        const approvedPitches = data.pitches || []; 
        const factCheckData = data.factCheck; 

        // Populate the Fact Check sidebar widget dynamically
        const factCheckContainer = document.getElementById('factCheckContainer');
        if (factCheckContainer && factCheckData) {
            factCheckContainer.innerHTML = `
                <p><strong>Claim:</strong> "${factCheckData.claim}"</p>
                <p style="margin-top: 8px;"><strong>Verdict:</strong> <span style="color:var(--accent-color); font-weight:bold;">${factCheckData.verdict}</span></p>
            `;
        } else if (factCheckContainer) {
            factCheckContainer.innerHTML = `<p>No fact checks published yet.</p>`;
        }
        
        const articlesGrid = document.getElementById('articlesGrid');
        if (!articlesGrid) return;

        articlesGrid.innerHTML = '';

        // 1. Render approved community pitches using clean generated slugs
        approvedPitches.forEach((pitch) => {
            // Generate clean slug from headline dynamically
            const pitchSlug = pitch.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const pitchImage = pitch.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80";
            const pitchTitle = pitch.headline;
            const pitchAuthor = pitch.author || "Anonymous Reader";
            const pitchDate = new Date(pitch.submittedAt).toLocaleDateString();

            const pitchCard = document.createElement('article');
            pitchCard.className = 'article-card card';
            pitchCard.innerHTML = `
                <div class="card-image-wrapper">
                    <span class="category-tag">Community Pitch</span>
                    <img src="${pitchImage}" alt="Pitch thumbnail">
                </div>
                <div class="card-content">
                    <div class="article-meta">
                        <span><i class="fa-regular fa-user"></i> Submitted by ${pitchAuthor}</span>
                        <span><i class="fa-regular fa-clock"></i> ${pitchDate}</span>
                    </div>
                    <h3 class="article-headline">${pitchTitle}</h3>
                    <p class="article-excerpt">A reader-submitted satirical pitch approved by the editors.</p>
                    <div class="card-footer">
                        <span style="color:var(--gold-color); font-weight:700;"><i class="fa-solid fa-star"></i> Community Favorite</span>
                        <a href="/article/${pitchSlug}" style="text-decoration:none; color:var(--accent-color); font-weight:700; float:right;">Read Story &rarr;</a>
                    </div>
                </div>
            `;
            articlesGrid.appendChild(pitchCard);
        });

        // 2. Render standard regular posts using clean URL slugs
        posts.forEach((post, index) => {
            const articleSlug = post.slug?.current || post._id || index + 1;
            const postTitle = post.title || "Untitled Satire";
            const postCategory = post.category || "General Satire";
            const postAuthor = post.author || "Anonymous Pomp";
            const postDate = new Date(post.publishedAt).toLocaleDateString();
            const postImage = post.imageUrl || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80";

            const newCard = document.createElement('article');
            newCard.className = 'article-card card';
            newCard.innerHTML = `
                <div class="card-image-wrapper">
                    <span class="category-tag">${postCategory}</span>
                    <img src="${postImage}" alt="Article thumbnail">
                </div>
                <div class="card-content">
                    <div class="article-meta">
                        <span><i class="fa-regular fa-user"></i> By ${postAuthor}</span>
                        <span><i class="fa-regular fa-clock"></i> ${postDate}</span>
                    </div>
                    <h3 class="article-headline">${postTitle}</h3>
                    <p class="article-excerpt">Click to read the full breaking story and participate in the pomposity verification.</p>
                    <div class="card-footer">
                        <a href="/article/${articleSlug}" style="text-decoration:none; color:var(--accent-color); font-weight:700;">Read Full Story &rarr;</a>
                    </div>
                </div>
            `;
            articlesGrid.appendChild(newCard);
        });

    } catch (error) {
        console.error("Error fetching live articles from Sanity proxy:", error);
    }
}

// Category Filtering & Search
const navLinks = document.querySelectorAll('.main-nav .nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const categoryAttr = (link.getAttribute('data-category') || '').trim().toLowerCase();
        const heroArticle = document.querySelector('.hero-article');
        const articlesGrid = document.getElementById('articlesGrid');
        const pitchSection = document.getElementById('pitchSection');

        if (categoryAttr === 'pitches') {
            if (heroArticle) heroArticle.style.display = 'none';
            if (articlesGrid) {
                articlesGrid.style.display = 'grid';
                const cards = articlesGrid.querySelectorAll('.article-card');
                cards.forEach(card => {
                    const tagEl = card.querySelector('.category-tag');
                    const isPitch = tagEl && tagEl.textContent.trim().toLowerCase() === 'community pitch';
                    card.style.display = isPitch ? 'block' : 'none';
                });
            }
            if (pitchSection) pitchSection.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Show standard feed layout for home/all or other categories
        if (heroArticle) heroArticle.style.display = 'block';
        if (articlesGrid) articlesGrid.style.display = 'grid';

        const cards = document.querySelectorAll('.article-card');
        cards.forEach(card => {
            const tagEl = card.querySelector('.category-tag');
            const cardCategory = tagEl ? tagEl.textContent.trim().toLowerCase() : '';
            
            if (categoryAttr === 'all' || categoryAttr === 'home' || categoryAttr === '') {
                card.style.display = 'block';
            } else {
                if (cardCategory.includes(categoryAttr)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    });
});

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.article-card');
        
        cards.forEach(card => {
            const headline = card.querySelector('.article-headline').textContent.toLowerCase();
            const excerpt = card.querySelector('.article-excerpt') ? card.querySelector('.article-excerpt').textContent.toLowerCase() : '';
            if (headline.includes(term) || excerpt.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Custom Toast Notification Helper
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

// Community Pitch Form Submission
const pitchForm = document.getElementById('pitchForm');
if (pitchForm) {
    pitchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const author = document.getElementById('pitchAuthor').value;
        const headline = document.getElementById('pitchHeadline').value;

        try {
            const response = await fetch('/api/submit-pitch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, headline })
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Your headline pitch has been submitted to the editors for peer review!');
                pitchForm.reset();
            } else {
                showToast('Error submitting pitch: ' + (result.error || 'Please try again.'));
            }
        } catch (err) {
            console.error('Submission error:', err);
            showToast('Something went wrong. Please try again later.');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchArticlesFromSanity();
});
