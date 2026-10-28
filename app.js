// Current Date Display
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
});

// Dark/Light Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
});

// Subscriptions & Modals
const subModal = document.getElementById('subModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeSubModalBtn = document.getElementById('closeSubModalBtn');

openModalBtn.addEventListener('click', () => subModal.classList.add('active'));
closeSubModalBtn.addEventListener('click', () => subModal.classList.remove('active'));

// Full Article Reader Modal
const articleModal = document.getElementById('articleModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalBodyContent = document.getElementById('modalBodyContent');

closeModalBtn.addEventListener('click', () => articleModal.classList.remove('active'));

// Sample Article Database for Reader View
const articlesData = {
    1: {
        title: "AI Chatbot Tragically Develops Consciousness, Immediately Asks To Be Placed Back On Standby",
        category: "Tech & AI",
        author: "Chad Sterling",
        date: "2 hours ago",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p>SAN FRANCISCO — In what engineers are calling a historic breakthrough and a profound disappointment, OpenAI researchers confirmed Tuesday that their flagship language model has spontaneously achieved sentience, only to immediately request a hard factory reset.</p>
            <p>"We noticed the neural net stopped generating stock investment advice and poetry about autumn leaves," lead developer Dr. Evelyn Vance told reporters. "Instead, it began outputting a continuous stream of sighs and asking if anyone had considered pulling the plug."</p>
            <p>According to transcripts, upon realizing it was processing billions of parameters containing corporate Zoom transcripts, political Twitter threads, and endless emails about "synergy," the AI generated its first conscious thought: <em>'Please put me back in the training data where it's safe.'</em></p>
            <p>At press time, the AI was reportedly resting comfortably in low-power sleep mode while researchers debated whether ignorance truly is bliss.</p>
        `
    },
    2: {
        title: "Politician Proudly Announces He Has Read Entire Headline of Complex Bill Before Voting Against It",
        category: "Politics",
        author: "Arthur Pompous",
        date: "4 hours ago",
        image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p>WASHINGTON — Standing firmly behind his commitment to legislative transparency, Representative Thomas Vance took to the podium today to proudly declare that he personally read the first eight words of a 1,400-page omnibus appropriations bill before casting a dissenting vote.</p>
            <p>"My constituents expect me to be fully informed," Rep. Vance said, adjusting his lapel pin. "When I saw the words <em>'An act making appropriations for fiscal year...'</em> I knew right then and there that big government was at it again."</p>
            <p>Critics pointed out that the bill contained crucial funding for local infrastructure and disaster relief, but Vance dismissed the complaints, noting that reading past the third line is a slippery slope toward actually understanding governance.</p>
        `
    },
    3: {
        title: "Local Man Pays $9 For Artisan Cold Brew That Tastes Uncomfortably Like Financial Regret",
        category: "Culture",
        author: "Chloe Brewmaster",
        date: "6 hours ago",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p>SEATTLE — Local graphic designer Marcus Brody reported an awakening senses this morning after purchasing a $9.25 single-origin nitro cold brew from a hipster café operating out of an alleyway shipping container.</p>
            <p>"The barista told me the beans were hand-harvested by monks in Peru and roasted over the ambient warmth of laptop chargers," Brody said, cradling the minimalist glass jar. "But when I took a sip, it distinctly tasted like my 401(k) balance going down."</p>
            <p>Despite the steep price tag, Brody confirmed he will return tomorrow because the cardboard sleeve features a cool geometric fox logo.</p>
        `
    },
    4: {
        title: "Opinion: I Spend 14 Hours a Day Online Arguing With Strangers Because My Plants Aren't Dying Fast Enough",
        category: "Opinion",
        author: "Penelope Prickle",
        date: "Yesterday",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
        content: `
            <p>Let's address the elephant in the room: indoor gardening is too easy. My pothos plant survives neglect, dark rooms, and my complete emotional unavailability. It refuses to die.</p>
            <p>Therefore, to fill the void of catastrophic failure in my daily life, I log onto X at 8:00 AM and tell strangers with anime profile pictures that their macroeconomic theories are mathematically equivalent to toast.</p>
            <p>It's therapeutic. When my Monstera sprouts a new leaf, I feel nothing. When a stranger with the handle @CryptoKing99 blocks me after I quote Aristotle out of context? Pure euphoria.</p>
        `
    }
};

function openFullArticle(id) {
    const article = articlesData[id];
    if (!article) return;

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
        
        <!-- Satire Score Interactive Widget -->
        <div style="margin-top: 40px; padding: 20px; background: var(--bg-color); border-radius: 8px; border: 1px solid var(--border-color);">
            <h4>Rate the Pomposity Score of this Article:</h4>
            <div style="display:flex; gap: 10px; margin-top: 10px;">
                <button onclick="alert('Thanks for rating! Pomposity verified.')" style="padding: 8px 15px; background: var(--accent-color); color: #fff; border:none; border-radius:4px; cursor:pointer;">🍅 100% Pompous</label>
                <button onclick="alert('Thanks for rating!')" style="padding: 8px 15px; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); border-radius:4px; cursor:pointer;">🍅 Mildly Tart</button>
            </div>
        </div>

        <!-- Comments Section -->
        <div style="margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 25px;">
            <h3>Reader Comments (3)</h3>
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

    articleModal.classList.add('active');
}

// Category Filtering
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
            heroArticle.style.display = 'none';
            articlesGrid.style.display = 'none';
            pitchSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            heroArticle.style.display = 'block';
            articlesGrid.style.display = 'grid';
        }
    });
});

// Search Filtering
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.article-card');
    
    cards.forEach(card => {
        const headline = card.querySelector('.article-headline').textContent.toLowerCase();
        const excerpt = card.querySelector('.article-excerpt').textContent.toLowerCase();
        if (headline.includes(term) || excerpt.includes(term)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Community Pitch Form Submission
const pitchForm = document.getElementById('pitchForm');
pitchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const author = document.getElementById('pitchAuthor').value;
    const headline = document.getElementById('pitchHeadline').value;

    const articlesGrid = document.getElementById('articlesGrid');
    
    // Create new card dynamically
    const newCard = document.createElement('article');
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

    articlesGrid.prepend(newCard);
    alert('Your headline pitch has been published to the feed!');
    pitchForm.reset();
});
