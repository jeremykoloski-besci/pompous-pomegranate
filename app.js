import { client } from './sanityClient.js';

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

// --- SANITY CMS DYNAMIC FETCHING ---
let articlesData = {};

async function fetchArticlesFromSanity() {
    const query = `*[_type == "post"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        body,
        "category": categories[0]->title,
        "author": author->name,
        "imageUrl": mainImage.asset->url,
        publishedAt
    }`;

    try {
        const posts = await client.fetch(query);
        const articlesGrid = document.getElementById('articlesGrid');
        if (!articlesGrid) return;

        articlesData = {};
        articlesGrid.innerHTML = '';

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
        console.error("Error fetching live articles from Sanity:", error);
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

        const category = link.getAttribute('data-category');
        const heroArticle = document.querySelector('.hero-article');
        const articlesGrid = document.getElementById('articlesGrid');
        const pitchSection = document.getElementById('pitchSection');

        if (category === 'pitches') {
            if (heroArticle) heroArticle.style.display = 'none';
            if (articlesGrid) articlesGrid.style.display = 'none';
            if (pitchSection) pitchSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            if (heroArticle) heroArticle.style.display = 'block';
            if (articlesGrid) articlesGrid.style.display = 'grid';
        }
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

// Community Pitch Form Submission
const pitchForm = document.getElementById('pitchForm');
if (pitchForm) {
    pitchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const author = document.getElementById('pitchAuthor').value;
        const headline = document.getElementById('pitchHeadline').value;

        const articlesGrid = document.getElementById('articlesGrid');
        
        const newCard = document.exports = document.createElement('article'); // fixed
        newCard.className = 'article-card card';
        newCard.innerHTML = `
            <div class="card-image-wrapper">
                <span class="category-tag">Community Pitch</span>
                <img src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80" alt="Pitch">
            </div>
            <div class="card-content">
                <div class="article-meta">
                    <span><i class="fa-regular fa-user"></i> Submitted by ${author}</span>
                    <span><i class="fa-regular fa-clock"></i> Just now</span>
                </div>
                <h3 class="article-headline">${headline}</h3>
                <p class="article-excerpt">A fresh satirical submission from our readers currently under peer review for maximum pomposity.</p>
                <div class="card-footer">
                    <span style="color:var(--gold-color); font-weight:700;"><i class="fa-solid fa-star"></i> Community Favorite</span>
                </div>
            </div>
        `;

        if (articlesGrid) {
            articlesGrid.prepend(newCard);
        }
        alert('Your headline pitch has been published to the feed!');
        pitchForm.reset();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchArticlesFromSanity();
});
