// DOM Elements
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');

// API Configuration
const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Event Listeners
searchForm.addEventListener('submit', handleSearch);

/**
 * Handle form submission and initiate word search
 * @param {Event} e - Form submit event
 */
async function handleSearch(e) {
    e.preventDefault();
    
    const word = searchInput.value.trim();
    
    // Validate input
    if (!word) {
        showError('Please enter a word to search.');
        return;
    }

    // Clear previous results and errors
    clearResults();
    hideError();
    showLoading();

    try {
        // Fetch data from API
        const data = await fetchWordData(word);
        
        // Hide loading and display results
        hideLoading();
        displayResults(data);
    } catch (error) {
        hideLoading();
        handleError(error);
    }
}

/**
 * Fetch word data from Dictionary API
 * @param {string} word - The word to search for
 * @returns {Promise<Array>} - API response data
 */
async function fetchWordData(word) {
    const response = await fetch(`${API_URL}${word}`);
    
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Word not found. Please check your spelling and try again.');
        }
        throw new Error('Failed to fetch data. Please try again later.');
    }
    
    return await response.json();
}

/**
 * Display word results on the page
 * @param {Array} data - API response data
 */
function displayResults(data) {
    const wordData = data[0];
    
    // Extract word information
    const word = wordData.word;
    const phonetics = wordData.phonetics;
    const meanings = wordData.meanings;
    const sourceUrls = wordData.sourceUrls;

    // Find audio URL and phonetic text
    const audioUrl = phonetics.find(p => p.audio)?.audio || '';
    const phoneticText = phonetics.find(p => p.text)?.text || '';

    // Build HTML for results
    let html = `
        <div class="word-header">
            <h2 class="word-title">${word}</h2>
            ${phoneticText ? `<span class="phonetic">${phoneticText}</span>` : ''}
            ${audioUrl ? `<button class="audio-btn" onclick="playAudio('${audioUrl}')" aria-label="Play pronunciation">🔊</button>` : ''}
        </div>
    `;

    // Add meanings
    meanings.forEach(meaning => {
        html += `
            <div class="meaning">
                <h3 class="part-of-speech">${meaning.partOfSpeech}</h3>
        `;

        // Add definitions (limit to 5 per part of speech)
        meaning.definitions.forEach((def, index) => {
            if (index < 5) {
                html += `
                    <div class="definition">
                        <p class="definition-text"><strong>${index + 1}.</strong> ${def.definition}</p>
                        ${def.example ? `<p class="example">"${def.example}"</p>` : ''}
                    </div>
                `;
            }
        });

        // Add synonyms if available
        if (meaning.synonyms && meaning.synonyms.length > 0) {
            html += `
                <div class="synonyms-section">
                    <p class="synonyms-title">Synonyms:</p>
                    <div class="synonyms-list">
                        ${meaning.synonyms.slice(0, 10).map(syn => 
                            `<span class="synonym" onclick="searchWord('${syn}')">${syn}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        html += `</div>`;
    });

    // Add source link
    if (sourceUrls && sourceUrls.length > 0) {
        html += `
            <div class="source-link">
                <p>Source: <a href="${sourceUrls[0]}" target="_blank" rel="noopener noreferrer">View on Wiktionary</a></p>
            </div>
        `;
    }

    resultsSection.innerHTML = html;
    resultsSection.classList.add('show');
}

/**
 * Play audio pronunciation
 * @param {string} url - Audio file URL
 */
function playAudio(url) {
    const audio = new Audio(url);
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
        showError('Unable to play audio pronunciation.');
    });
}

/**
 * Search for a new word (used for synonym clicks)
 * @param {string} word - Word to search
 */
function searchWord(word) {
    searchInput.value = word;
    searchForm.dispatchEvent(new Event('submit'));
}

/**
 * Handle errors during API fetch
 * @param {Error} error - Error object
 */
function handleError(error) {
    showError(error.message);
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.classList.remove('show');
}

/**
 * Show loading indicator
 */
function showLoading() {
    loading.classList.add('show');
    searchBtn.disabled = true;
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    loading.classList.remove('show');
    searchBtn.disabled = false;
}

/**
 * Clear results section
 */
function clearResults() {
    resultsSection.classList.remove('show');
    resultsSection.innerHTML = '';
}

/**
 * Focus on input when page loads
 */
window.addEventListener('load', () => {
    searchInput.focus();
});