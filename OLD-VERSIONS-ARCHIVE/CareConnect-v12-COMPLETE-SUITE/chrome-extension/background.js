// Improved background service worker using Chrome Tabs API

// Tab pool for managing concurrent extractions
class TabPool {
    constructor(maxTabs = 3) {
        this.maxTabs = maxTabs;
        this.activeTabs = new Map();
        this.queue = [];
    }
    
    async processUrl(url, extractFunc) {
        // Wait if we're at capacity
        while (this.activeTabs.size >= this.maxTabs) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        let tab;
        try {
            // Create a new tab in the background
            tab = await chrome.tabs.create({ 
                url: url, 
                active: false,
                pinned: true  // Pin to avoid cluttering tab bar
            });
            
            this.activeTabs.set(tab.id, true);
            
            // Wait for tab to fully load
            await this.waitForTabLoad(tab.id);
            
            // Extract data from the tab
            const result = await extractFunc(tab.id, url);
            return result;
            
        } catch (error) {
            console.error(`Error processing ${url}:`, error);
            throw error;
        } finally {
            // Clean up tab
            if (tab && tab.id) {
                this.activeTabs.delete(tab.id);
                try {
                    await chrome.tabs.remove(tab.id);
                } catch (e) {
                    console.error('Error removing tab:', e);
                }
            }
        }
    }
    
    async waitForTabLoad(tabId, timeout = 15000) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            
            const listener = (updatedTabId, changeInfo) => {
                if (updatedTabId === tabId && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    clearTimeout(timeoutId);
                    resolve();
                }
            };
            
            chrome.tabs.onUpdated.addListener(listener);
            
            // Set timeout
            timeoutId = setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(listener);
                reject(new Error('Tab load timeout'));
            }, timeout);
        });
    }
}

// Cache for extracted data
class ExtractorCache {
    constructor() {
        this.memCache = new Map();
        this.maxAge = 1000 * 60 * 60; // 1 hour
    }
    
    async get(url) {
        // Check memory cache first
        const cached = this.memCache.get(url);
        if (cached && Date.now() - cached.timestamp < this.maxAge) {
            return cached.data;
        }
        
        // Check chrome.storage
        try {
            const storageKey = `cache_${this.hashUrl(url)}`;
            const result = await chrome.storage.local.get(storageKey);
            if (result[storageKey]) {
                const { data, timestamp } = result[storageKey];
                if (Date.now() - timestamp < this.maxAge) {
                    // Update memory cache
                    this.memCache.set(url, { data, timestamp });
                    return data;
                }
            }
        } catch (error) {
            console.error('Cache retrieval error:', error);
        }
        
        return null;
    }
    
    async set(url, data) {
        // Save to memory cache
        this.memCache.set(url, {
            data,
            timestamp: Date.now()
        });
        
        // Save to chrome.storage
        try {
            const storageKey = `cache_${this.hashUrl(url)}`;
            await chrome.storage.local.set({
                [storageKey]: { data, timestamp: Date.now() }
            });
        } catch (error) {
            console.error('Cache storage error:', error);
        }
    }
    
    hashUrl(url) {
        // Simple hash for URL to use as storage key
        return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }
}

// Initialize globals
const tabPool = new TabPool(3);
const cache = new ExtractorCache();

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Family First Program Extractor (Improved) installed');
});

// Main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        chrome.tabs.create({ url: 'http://localhost:8000' });
        return;
    }
    
    if (request.action === 'fetchRelatedPages') {
        handleImprovedMultiPageFetch(request.links || [])
            .then(result => sendResponse(result))
            .catch(error => {
                console.error('Background fetch error:', error);
                sendResponse({ error: error.message });
            });
        return true; // Keep message channel open
    }
});

// Improved multi-page fetch using Chrome Tabs API
async function handleImprovedMultiPageFetch(links) {
    const uniqueLinks = [...new Set(links)].slice(0, 25); // Allow more pages
    const results = [];
    let successCount = 0;
    let cachedCount = 0;
    
    // Process links with smart ordering
    const scoredLinks = await scoreAndSortLinks(uniqueLinks);
    
    for (let i = 0; i < scoredLinks.length; i++) {
        const { url, score } = scoredLinks[i];
        const progress = 25 + Math.round(((i + 1) / scoredLinks.length) * 50);
        
        try {
            // Check cache first
            const cachedData = await cache.get(url);
            if (cachedData) {
                cachedCount++;
                results.push({ url, html: cachedData, fromCache: true });
                
                chrome.runtime.sendMessage({
                    action: 'extractionProgress',
                    message: `💾 Retrieved from cache: ${url}`,
                    progress,
                    details: {
                        current: i + 1,
                        total: scoredLinks.length,
                        url,
                        score,
                        cached: true
                    }
                });
                continue;
            }
            
            // Send progress update
            chrome.runtime.sendMessage({
                action: 'extractionProgress',
                message: `🌐 Loading page ${i + 1}/${scoredLinks.length}: ${url} (relevance: ${score})`,
                progress,
                details: {
                    current: i + 1,
                    total: scoredLinks.length,
                    url,
                    score
                }
            });
            
            // Extract using tab pool
            const html = await tabPool.processUrl(url, extractFromTab);
            
            if (html) {
                results.push({ url, html });
                await cache.set(url, html); // Cache the result
                successCount++;
                
                chrome.runtime.sendMessage({
                    action: 'extractionProgress',
                    message: `✅ Successfully extracted: ${url}`,
                    progress,
                    details: {
                        current: i + 1,
                        total: scoredLinks.length,
                        url,
                        success: true
                    }
                });
            }
            
        } catch (error) {
            console.error(`Failed to process ${url}:`, error);
            chrome.runtime.sendMessage({
                action: 'extractionProgress',
                message: `⚠️ Failed: ${url} - ${error.message}`,
                progress,
                details: {
                    current: i + 1,
                    total: scoredLinks.length,
                    url,
                    error: error.message
                }
            });
        }
    }
    
    // Final summary
    chrome.runtime.sendMessage({
        action: 'extractionProgress',
        message: `🎉 Extraction complete! Processed ${successCount} pages (${cachedCount} from cache)`,
        progress: 75,
        details: {
            totalProcessed: results.length,
            successCount,
            cachedCount,
            totalRequested: scoredLinks.length
        }
    });
    
    return { 
        pages: results,
        stats: {
            requested: scoredLinks.length,
            successful: successCount,
            cached: cachedCount,
            failed: scoredLinks.length - results.length
        }
    };
}

// Extract content from a tab
async function extractFromTab(tabId, url) {
    try {
        // Inject extraction function into the tab
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: extractPageContent,
            args: [url]
        });
        
        if (results && results[0] && results[0].result) {
            return results[0].result;
        }
        
        throw new Error('No content extracted');
        
    } catch (error) {
        console.error('Extraction error:', error);
        
        // Try fallback extraction
        try {
            const fallbackResults = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: fallbackExtraction
            });
            
            if (fallbackResults && fallbackResults[0] && fallbackResults[0].result) {
                return fallbackResults[0].result;
            }
        } catch (fallbackError) {
            console.error('Fallback extraction failed:', fallbackError);
        }
        
        throw error;
    }
}

// Extraction function to inject into pages
function extractPageContent(url) {
    try {
        // Mark extraction start
        document.body.setAttribute('data-ff-extraction', 'active');
        
        // Get the entire HTML
        const html = document.documentElement.outerHTML;
        
        // Also extract key metadata
        const metadata = {
            title: document.title,
            url: url,
            description: document.querySelector('meta[name="description"]')?.content || '',
            hasStructuredData: !!document.querySelector('script[type="application/ld+json"]'),
            bodyText: document.body.innerText.substring(0, 5000), // First 5k chars for analysis
            extractedAt: new Date().toISOString()
        };
        
        // Log extraction
        console.log(`[FF Extractor] Extracted ${url}:`, {
            htmlLength: html.length,
            title: metadata.title
        });
        
        return html;
        
    } catch (error) {
        console.error('[FF Extractor] Extraction error:', error);
        return null;
    }
}

// Fallback extraction for problematic pages
function fallbackExtraction() {
    try {
        // Try to get at least basic content
        const content = {
            title: document.title || '',
            text: document.body?.innerText || '',
            links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
                href: a.href,
                text: a.textContent
            })).slice(0, 100)
        };
        
        // Convert to minimal HTML
        return `
            <html>
            <head><title>${content.title}</title></head>
            <body>
                <h1>${content.title}</h1>
                <div id="extracted-content">${content.text}</div>
                <div id="extracted-links">${JSON.stringify(content.links)}</div>
            </body>
            </html>
        `;
    } catch (error) {
        return null;
    }
}

// Score and sort links by relevance
async function scoreAndSortLinks(links) {
    const scoredLinks = links.map(url => {
        let score = 0;
        const lowerUrl = url.toLowerCase();
        
        // High value paths
        const highValue = [
            '/program', '/treatment', '/services', '/therapy', '/residential',
            '/adolescent', '/teen', '/youth', '/approach', '/model',
            '/about', '/overview', '/admission', '/iop', '/php'
        ];
        
        // Medium value paths
        const mediumValue = [
            '/faq', '/philosophy', '/care', '/support', '/clinical',
            '/behavioral', '/mental-health', '/substance', '/addiction'
        ];
        
        // Low value paths (penalize)
        const lowValue = [
            '/blog', '/news', '/contact', '/career', '/job', '/privacy',
            '/terms', '/sitemap', '/search', '/login', '/register'
        ];
        
        // Score based on URL content
        highValue.forEach(term => {
            if (lowerUrl.includes(term)) score += 10;
        });
        
        mediumValue.forEach(term => {
            if (lowerUrl.includes(term)) score += 5;
        });
        
        lowValue.forEach(term => {
            if (lowerUrl.includes(term)) score -= 5;
        });
        
        // Bonus for shorter URLs (usually more important)
        const pathLength = new URL(url).pathname.split('/').filter(p => p).length;
        if (pathLength <= 2) score += 5;
        if (pathLength >= 4) score -= 3;
        
        // Penalty for file extensions
        if (/\.(pdf|doc|docx|xls|xlsx)$/i.test(url)) score -= 10;
        
        return { url, score };
    });
    
    // Sort by score (highest first)
    return scoredLinks.sort((a, b) => b.score - a.score);
}

// Keep original context menu and handlers
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'extractProgramInfo',
        title: 'Extract Program Info for Family First',
        contexts: ['page', 'selection']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'extractProgramInfo') {
        chrome.action.openPopup();
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    chrome.action.openPopup();
});