// Enhanced Background Service Worker v2.0
// Handles aggressive multi-page extraction with intelligent crawling

// Track fetch operations
const fetchCache = new Map();
const fetchQueue = [];
let isProcessing = false;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request.action);
    
    if (request.action === 'fetchRelatedPages') {
        handleMultiPageFetch(request.links, sender.tab?.id)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Keep channel open for async response
    }
    
    if (request.action === 'openPopup') {
        chrome.action.openPopup();
        sendResponse({ success: true });
    }
    
    if (request.action === 'clearCache') {
        fetchCache.clear();
        sendResponse({ success: true });
    }
});

// Enhanced multi-page fetching with intelligent crawling
async function handleMultiPageFetch(links, tabId) {
    console.log(`Starting enhanced fetch for ${links.length} pages`);
    
    const results = {
        pages: [],
        errors: [],
        stats: {
            requested: links.length,
            fetched: 0,
            cached: 0,
            failed: 0
        }
    };
    
    // Prioritize and score links
    const scoredLinks = prioritizeLinks(links);
    
    // Process links in parallel batches for speed
    const batchSize = 5; // Process 5 pages at a time
    const batches = [];
    
    for (let i = 0; i < scoredLinks.length; i += batchSize) {
        batches.push(scoredLinks.slice(i, i + batchSize));
    }
    
    // Process each batch
    for (const batch of batches) {
        try {
            // Send progress update
            if (tabId) {
                try {
                    chrome.tabs.sendMessage(tabId, {
                        action: 'fetchProgress',
                        progress: Math.round((results.pages.length / links.length) * 100),
                        message: `Fetching batch ${Math.floor(results.pages.length / batchSize) + 1}/${Math.ceil(links.length / batchSize)}`
                    });
                } catch (e) {
                    // Tab might be closed
                }
            }
            
            const batchResults = await Promise.allSettled(
                batch.map(item => fetchPageWithRetry(item.url))
            );
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    results.pages.push(result.value);
                    results.stats.fetched++;
                } else {
                    results.errors.push({
                        url: batch[index].url,
                        error: result.reason?.message || 'Failed to fetch'
                    });
                    results.stats.failed++;
                }
            });
            
            // Add small delay between batches to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error('Batch processing error:', error);
        }
    }
    
    // Perform second-level crawling for high-value pages
    const secondLevelPages = await performSecondLevelCrawl(results.pages, tabId);
    results.pages.push(...secondLevelPages);
    results.stats.fetched += secondLevelPages.length;
    
    console.log(`Fetch complete. Stats:`, results.stats);
    return results;
}

// Prioritize links based on relevance
function prioritizeLinks(links) {
    const scored = links.map(url => {
        let score = 0;
        const lower = url.toLowerCase();
        
        // High priority pages (score 20-30)
        if (lower.includes('/treatment') || lower.includes('/program')) score += 25;
        if (lower.includes('/approach') || lower.includes('/philosophy')) score += 22;
        if (lower.includes('/clinical') || lower.includes('/therapy')) score += 20;
        if (lower.includes('/staff') || lower.includes('/team')) score += 20;
        if (lower.includes('/admission') || lower.includes('/enrollment')) score += 18;
        
        // Medium priority (score 10-19)
        if (lower.includes('/about')) score += 15;
        if (lower.includes('/service')) score += 14;
        if (lower.includes('/residential') || lower.includes('/outpatient')) score += 14;
        if (lower.includes('/specialty') || lower.includes('/specialize')) score += 13;
        if (lower.includes('/parent') || lower.includes('/family')) score += 12;
        if (lower.includes('/academic') || lower.includes('/education')) score += 11;
        if (lower.includes('/facility') || lower.includes('/campus')) score += 10;
        
        // Specific condition pages (score 15)
        const conditions = ['trauma', 'anxiety', 'depression', 'adhd', 'autism', 'substance', 'eating'];
        if (conditions.some(c => lower.includes(c))) score += 15;
        
        // Lower priority (negative scores)
        if (lower.includes('/blog') || lower.includes('/news')) score -= 10;
        if (lower.includes('/career') || lower.includes('/employment')) score -= 15;
        if (lower.includes('/privacy') || lower.includes('/terms')) score -= 20;
        if (lower.includes('.pdf') || lower.includes('.doc')) score -= 5;
        
        // Penalize very long URLs (likely deep pages)
        const depth = (url.match(/\//g) || []).length;
        if (depth > 5) score -= (depth - 5) * 2;
        
        return { url, score };
    });
    
    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
}

// Fetch page with retry logic and caching
async function fetchPageWithRetry(url, maxRetries = 2) {
    // Check cache first
    if (fetchCache.has(url)) {
        console.log(`Using cached result for ${url}`);
        return fetchCache.get(url);
    }
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Cache-Control': 'no-cache'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            
            // Validate that we got actual HTML content
            if (!html || html.length < 100 || !html.includes('<')) {
                throw new Error('Invalid HTML content received');
            }
            
            const result = {
                url: url,
                html: html,
                fetchedAt: new Date().toISOString()
            };
            
            // Cache the result
            fetchCache.set(url, result);
            
            // Clean cache if it gets too large
            if (fetchCache.size > 100) {
                const oldestKey = fetchCache.keys().next().value;
                fetchCache.delete(oldestKey);
            }
            
            return result;
            
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt + 1} failed for ${url}:`, error.message);
            
            if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
    
    throw lastError;
}

// Perform second-level crawling for high-value pages
async function performSecondLevelCrawl(firstLevelPages, tabId) {
    const secondLevelLinks = new Set();
    
    // Extract links from high-value pages
    firstLevelPages.forEach(page => {
        if (!page.html) return;
        
        // Only crawl deeper from high-value pages
        const isHighValue = 
            page.url.includes('/treatment') ||
            page.url.includes('/program') ||
            page.url.includes('/approach') ||
            page.url.includes('/clinical');
        
        if (!isHighValue) return;
        
        // Extract links using regex (simpler than parsing DOM)
        const linkPattern = /href=["']([^"']+)["']/g;
        let match;
        
        while ((match = linkPattern.exec(page.html)) !== null) {
            const link = match[1];
            
            // Only internal links
            if (link.startsWith('http') && !link.includes(new URL(page.url).hostname)) {
                continue;
            }
            
            // Resolve relative URLs
            let fullUrl;
            try {
                fullUrl = new URL(link, page.url).href;
            } catch (e) {
                continue;
            }
            
            // Check if this is a valuable second-level link
            const valuable = 
                fullUrl.includes('/condition') ||
                fullUrl.includes('/specialize') ||
                fullUrl.includes('/modality') ||
                fullUrl.includes('/approach') ||
                fullUrl.includes('/method');
            
            if (valuable && !fetchCache.has(fullUrl)) {
                secondLevelLinks.add(fullUrl);
            }
        }
    });
    
    // Limit second-level crawling
    const limitedLinks = Array.from(secondLevelLinks).slice(0, 10);
    
    if (limitedLinks.length === 0) {
        return [];
    }
    
    console.log(`Performing second-level crawl of ${limitedLinks.length} pages`);
    
    // Send progress update
    if (tabId) {
        try {
            chrome.tabs.sendMessage(tabId, {
                action: 'fetchProgress',
                progress: 90,
                message: `Deep crawling ${limitedLinks.length} additional pages...`
            });
        } catch (e) {
            // Tab might be closed
        }
    }
    
    const results = [];
    const fetchPromises = limitedLinks.map(url => fetchPageWithRetry(url, 1));
    const fetchResults = await Promise.allSettled(fetchPromises);
    
    fetchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
        }
    });
    
    return results;
}

// Clean up old cache entries periodically
setInterval(() => {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    
    fetchCache.forEach((value, key) => {
        const age = now - new Date(value.fetchedAt).getTime();
        if (age > maxAge) {
            fetchCache.delete(key);
        }
    });
}, 5 * 60 * 1000); // Run every 5 minutes

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Try to inject content script if not already present
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['improved-extractor.js', 'clinical-extractor.js', 'content.js']
    }).catch(err => {
        console.error('Failed to inject content script:', err);
    });
});

// Handle context menu creation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'extract-program-info',
        title: 'Extract Program Information',
        contexts: ['page']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'extract-program-info') {
        chrome.tabs.sendMessage(tab.id, { action: 'extractInfo' });
    }
});

console.log('Enhanced Background Service Worker v2.0 loaded');
