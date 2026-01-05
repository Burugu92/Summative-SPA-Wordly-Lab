
// DOM Elements

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const savedWordsList = document.getElementById('savedWordsList');

// API Configuration

const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';


// Event Listeners

searchForm.addEventListener('submit', handleSearch);

// Event delegation for synonyms and save buttons
resultsSection.addEventListener('click', (e) => {
    if (e.target.classList.contains('synonym')) {
        const word = e.target.dataset.word;
        searchWord(word);
    }
    if (e.target.classList.contains('save-btn')) {
        const word = e.target.dataset.word;
        saveWord(word);
    }
});


// Main Functions

async function handleSearch(e) {
    e.preventDefault();
    const word = searchInput.value.trim();
    
    if (!word) {
        showError('Please enter a word to search.');
        return;
    }

    clearResults();
    hideError();
    showLoading();

    try {
        const data = await fetchWordData(word);
        hideLoading();
        displayResults(data);
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

async function fetchWordData(word) {
    const response = await fetch(`${API_URL}${word}`);
    if (!response.ok) {
        if (response.status === 404) throw new Error('Word not found. Check your spelling.');
        throw new Error('Failed to fetch data. Please try again later.');
    }
    return await response.json();
}

function displayResults(data) {
    const wordData = data[0];
    const word = wordData.word;
    const phonetics = wordData.phonetics;
    const meanings = wordData.meanings;
    const sourceUrls = wordData.sourceUrls;

    const audioUrl = phonetics.find(p => p.audio)?.audio || '';
    const phoneticText = phonetics.find(p => p.text)?.text || '';

    let html = `
        <div class="word-header">
            <h2 class="word-title">${word}</h2>
            ${phoneticText ? `<span class="phonetic">${phoneticText}</span>` : ''}
            ${audioUrl ? `<button class="audio-btn" data-audio="${audioUrl}" aria-label="Play pronunciation">🔊</button>` : ''}
            <button class="save-btn" data-word="${word}" aria-label="Save word">💾 Save Word</button>
        </div>
    `;

    // Meanings
    meanings.forEach(meaning => {
        html += `<div class="meaning"><h3 class="part-of-speech">${meaning.partOfSpeech}</h3>`;
        meaning.definitions.slice(0, 5).forEach((def, index) => {
            html += `
                <div class="definition">
                    <p class="definition-text"><strong>${index + 1}.</strong> ${def.definition}</p>
                    ${def.example ? `<p class="example">"${def.example}"</p>` : ''}
                </div>
            `;
        });

        if (meaning.synonyms && meaning.synonyms.length) {
            html += `
                <div class="synonyms-section">
                    <p class="synonyms-title">Synonyms:</p>
                    <div class="synonyms-list">
                        ${meaning.synonyms.slice(0, 10).map(syn => 
                            `<span class="synonym" data-word="${syn}">${syn}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        html += `</div>`;
    });

    // Source link
    if (sourceUrls && sourceUrls.length) {
        html += `<div class="source-link">
                    <p>Source: <a href="${sourceUrls[0]}" target="_blank" rel="noopener noreferrer">View on Wiktionary</a></p>
                 </div>`;
    }

    resultsSection.innerHTML = html;
    resultsSection.classList.add('show');

    // Audio button listener
    const audioBtn = resultsSection.querySelector('.audio-btn');
    if (audioBtn) {
        audioBtn.addEventListener('click', () => playAudio(audioBtn.dataset.audio));
    }
}

// ================================
// Audio Playback
// ================================
function playAudio(url) {
    const audio = new Audio(url);
    audio.play().catch(() => showError('Unable to play audio.'));
}

// ================================
// Saved Words
// ================================
function saveWord(word) {
    let savedWords = JSON.parse(localStorage.getItem('savedWords')) || [];
    if (!savedWords.includes(word)) {
        savedWords.push(word);
        localStorage.setItem('savedWords', JSON.stringify(savedWords));
        alert(`"${word}" saved!`);
        renderSavedWords(savedWords);
    } else {
        alert(`"${word}" is already saved.`);
    }
}

function renderSavedWords(words) {
    if (!words.length) {
        savedWordsList.innerHTML = '<p>No words saved yet.</p>';
        return;
    }
    savedWordsList.innerHTML = words.map(word => 
        `<span class="saved-word" onclick="searchWord('${word}')">${word}</span>`
    ).join(' ');
}

function loadSavedWords() {
    const savedWords = JSON.parse(localStorage.getItem('savedWords')) || [];
    renderSavedWords(savedWords);
}

// ================================
// Utility Functions
// ================================
function searchWord(word) {
    searchInput.value = word;
    searchForm.dispatchEvent(new Event('submit'));
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

function showLoading() {
    loading.classList.add('show');
    searchBtn.disabled = true;
}

function hideLoading() {
    loading.classList.remove('show');
    searchBtn.disabled = false;
}

function clearResults() {
    resultsSection.classList.remove('show');
    resultsSection.innerHTML = '';
}

// ================================
// On Page Load
// ================================
window.addEventListener('load', () => {
    searchInput.focus();
    loadSavedWords();
});

