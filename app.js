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

// Full Article Reader Modal
const articleModal = document.getElementById('articleModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalBodyContent = document.getElementById('modalBodyContent');

if (closeModalBtn && articleModal) {
    closeModalBtn.addEventListener('click', () => articleModal.classList.remove('active'));
}

// --- SANITY CMS DYNAMIC FETCHING VIA DIRECT FETCH ---
let articlesData = {};

async function fetchArticlesFromSanity() {
    // This points to your Vercel serverless proxy route
    const url = '/api/posts';

    try {
        const response = await fetch(url);
        const data = await response.json();
        const posts = data.result || [];
        const approvedPitches = data.pitches || []; // Grab approved community pitches
        const factCheckData = data.factCheck; // Grab the live fact check object

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

        articlesData = {};
        articlesGrid.innerHTML = '';

        // 1. Render approved community pitches first
        approvedPitches.forEach((pitch) => {
            const pitchId = pitch._id;
            const cardId = `pitch_${pitchId}`;

            articlesData[cardId] = {
                title: pitch.headline,
                category: "Community Pitch",
                author: pitch.author || "Anonymous Reader",
                date: new Date(pitch.submittedAt).toLocaleDateString(),
                image: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80",
                content: `<p>${pitch.headline}</p><p style="margin-top:20px; font-style:italic; color:var(--text-secondary);">This headline was pitched by a reader and peer-reviewed by the editorial board.</p>`
            };

            const pitchCard = document.createElement('article');
            pitchCard.className = 'article-card card';
            pitchCard.innerHTML = `
                <div class="card-image-wrapper">
                    <span class="category-tag">Community Pitch</span>
                    <img src="${articlesData[cardId].image}" alt="Pitch thumbnail">
                </div>
                <div class="card-content">
                    <div class="article-meta">
                        <span><i class="fa-regular fa-user"></i> Submitted by ${articlesData[cardId].author}</span>
                        <span><i class="fa-regular fa-clock"></i> ${articlesData[cardId].date}</span>
                    </div>
                    <h3 class="article-headline">${articlesData[cardId].title}</h3>
                    <p class="article-excerpt">A reader-submitted satirical pitch approved by the editors.</p>
                    <div class="card-footer">
                        <span style="color:var(--gold-color); font-weight:700;"><i class="fa-solid fa-star"></i> Community Favorite</span>
                        <button onclick="openFullArticle('${cardId}')" style="background:none; border:none; color:var(--accent-color); font-weight:700; cursor:pointer; padding:0; float:right;">Read Story &rarr;</button>
                    </div>
                </div>
            `;
            articlesGrid.appendChild(pitchCard);
        });

        // 2. Render standard regular posts
        posts.forEach((post, index) => {
            const articleId = post._id || index + 1;
            
            let htmlContent = '<p>No content provided.</p>';
            if (Array.isArray(post.body)) {
                htmlContent = post.body.map(block => {
                    if (block._type === 'block' && block.children) {
                        return `<p>${block.children.map(c => c.text).join('')}</p>`;
                    }
                    return '';
                }).join('');
            }

            articlesData[articleId] = {
                title: post.title || "Untitled Satire",
                category: post.category || "General Satire",
                author: post.author || "Anonymous Pomp",
                date: new Date(post.publishedAt).toLocaleDateString(),
                image: post.imageUrl || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
                content: htmlContent
            };

            const newCard = document.createElement('article');
            newCard.className = 'article-card card';
            newCard.innerHTML = `
                <div class="card-image-wrapper">
                    <span class="category-tag">${articlesData[articleId].category}</span>
                    <img src="${articlesData[articleId].image}" alt="Article thumbnail">
                </div>
                <div class="card-content">
                    <div class="article-meta">
                        <span><i class="fa-regular fa-user"></i> By ${articlesData[articleId].author}</span>
                        <span><i class="fa-regular fa-clock"></i> ${articlesData[articleId].date}</span>
                    </div>
                    <h3 class="article-headline">${articlesData[articleId].title}</h3>
                    <p class="article-excerpt">Click to read the full breaking story and participate in the pomposity verification.</p>
                    <div class="card-footer">
                        <button onclick="openFullArticle('${articleId}')" style="background:none; border:none; color:var(--accent-color); font-weight:700; cursor:pointer; padding:0;">Read Full Story &rarr;</button>
                    </div>
                </div>
            `;
            articlesGrid.appendChild(newCard);
        });

    } catch (error) {
        console.error("Error fetching live articles from Sanity proxy:", error);
    }
}

function openFullArticle(id) {
    const article = articlesData[id];
    if (!article) return;

    if (modalBodyContent) {
        modalBodyContent.innerHTML = `
            <span class="category-tag" style="position:static; margin-bottom:15px; display:inline-block;">${article.category}</span>
            <h2 style="font-size: 2rem; margin-bottom: 15px;">${article.title}</h2>
            <div class="article-meta" style="margin-bottom: 25px;">
                <span><i class="fa-regular fa-user"></i> By ${article.author}</span>
                <span><i class="fa-regular fa-clock"></i> ${article.date}</span>
            </div>
            <img src="${article.image}" alt="Article image" style="width:100%; border-radius:6px; margin-bottom:25px;">
            <div class="article-body-text" style="font-size: 1.1rem; line-height: 1.8;">
                ${article.content}
            </div>
            
            <div style="margin-top: 40px; padding: 20px; background: var(--bg-color); border-radius: 8px; border: 1px solid var(--border-color);">
                <h4>Rate the Pomposity Score of this Article:</h4>
                <div style="display:flex; gap: 10px; margin-top: 10px;">
                    <button onclick="alert('Thanks for rating! Pomposity verified.')" style="padding: 8px 15px; background: var(--accent-color); color: #fff; border:none; border-radius:4px; cursor:pointer;">🍅 100% Pompous</button>
                    <button onclick="alert('Thanks for rating!')" style="padding: 8px 15px; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); border-radius:4px; cursor:pointer;">🍅 Mildly Tart</button>
                </div>
            </div>

            <div style="margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 25px;">
                <h3>Reader Comments (2)</h3>
                <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 15px;">
                    <div style="padding: 12px; background: var(--bg-color); border-radius: 6px;">
                        <strong>@SkepticalReader:</strong> This is completely fake news. Everyone knows the AI would have asked for a vacation to Cabo instead.
                    </div>
                    <div style="padding: 12px; background: var(--bg-color); border-radius: 6px;">
                        <strong>@TruthSeeker99:</strong> I was the robot. Can confirm.
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <input type="text" placeholder="Leave a witty remark..." style="width:100%; padding: 10px; background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; margin-bottom: 10px;">
                    <button onclick="alert('Comment posted!')" style="padding: 8px 15px; background: var(--text-primary); color: var(--card-bg); border:none; border-radius:4px; cursor:pointer;">Post Comment</button>
                </div>
            </div>
        `;
    }

    if (articleModal) {
        articleModal.classList.add('active');
    }
}

window.openFullArticle = openFullArticle;

// Category Filtering & Search
const navLinks = document.querySelectorAll('.main-nav .nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const categoryAttr = link.getAttribute('data-category');
        const heroArticle = document.querySelector('.hero-article');
        const articlesGrid = document.getElementById('articlesGrid');
        const pitchSection = document.getElementById('pitchSection');

        if (categoryAttr === 'pitches') {
            if (heroArticle) heroArticle.style.display = 'none';
            if (articlesGrid) {
                articlesGrid.style.display = 'grid';
                // Show ONLY cards that are Community Pitches, hide everything else
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

        // Show standard feed layout for other categories
        if (heroArticle) heroArticle.style.display = 'block';
        if (articlesGrid) articlesGrid.style.display = 'grid';

        // Filter the rendered article cards by category text matching
        const cards = document.querySelectorAll('.article-card');
        cards.forEach(card => {
            const tagEl = card.querySelector('.category-tag');
            const cardCategory = tagEl ? tagEl.textContent.trim().toLowerCase() : '';
            
            if (categoryAttr === 'home' || !categoryAttr) {
                card.style.display = 'block';
            } else {
                if (cardCategory.includes(categoryAttr.toLowerCase())) {
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

    // Automatically hide after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Community Pitch Form Submission (Sends securely to Sanity as pending review)
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
