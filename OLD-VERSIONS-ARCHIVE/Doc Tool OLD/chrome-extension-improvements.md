# Chrome Extension Improvements

## Current Issues
- Background fetch approach has CORS limitations
- Timeout mechanism may be cutting off valid requests
- No fallback mechanisms for different site structures
- Limited error recovery

## Suggested Improvements (Beyond Codex)

### 1. **Use Chrome Tabs API Instead of Fetch**
Instead of fetching HTML via background worker, use Chrome's built-in tab navigation:

```javascript
// In background.js
async function crawlWithTabs(links) {
    const results = [];
    
    for (const url of links) {
        try {
            // Create a new tab
            const tab = await chrome.tabs.create({
                url: url,
                active: false
            });
            
            // Wait for tab to load
            await new Promise(resolve => {
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                    if (tabId === tab.id && changeInfo.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                });
            });
            
            // Inject extraction script
            const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: extractPageContent,
                args: []
            });
            
            results.push({
                url: url,
                data: result.result
            });
            
            // Close the tab
            await chrome.tabs.remove(tab.id);
            
        } catch (error) {
            console.error(`Failed to crawl ${url}:`, error);
        }
    }
    
    return results;
}
```

### 2. **Implement Iframe Injection for Same-Origin Pages**
For pages on the same domain, use iframes:

```javascript
// In content.js
async function fetchViaIframe(url) {
    return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        
        iframe.onload = () => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                const html = doc.documentElement.outerHTML;
                document.body.removeChild(iframe);
                resolve(html);
            } catch (error) {
                document.body.removeChild(iframe);
                reject(error);
            }
        };
        
        iframe.onerror = () => {
            document.body.removeChild(iframe);
            reject(new Error('Failed to load iframe'));
        };
        
        document.body.appendChild(iframe);
        
        // Timeout
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
                reject(new Error('Iframe load timeout'));
            }
        }, 10000);
    });
}
```

### 3. **Smart Link Detection with Priority Scoring**
Improve link relevance detection:

```javascript
function scoreLinkRelevance(link, baseUrl) {
    let score = 0;
    const href = link.href.toLowerCase();
    const text = link.textContent.toLowerCase();
    
    // High priority keywords
    const highPriority = ['program', 'treatment', 'therapy', 'service', 'residential', 
                         'adolescent', 'teen', 'youth', 'about', 'overview'];
    
    // Medium priority keywords  
    const mediumPriority = ['approach', 'model', 'care', 'admission', 'FAQ', 'philosophy'];
    
    // Low priority (avoid)
    const lowPriority = ['blog', 'news', 'contact', 'careers', 'privacy', 'terms'];
    
    // Score based on URL
    highPriority.forEach(word => {
        if (href.includes(word)) score += 10;
    });
    
    mediumPriority.forEach(word => {
        if (href.includes(word)) score += 5;
    });
    
    lowPriority.forEach(word => {
        if (href.includes(word)) score -= 5;
    });
    
    // Score based on link text
    highPriority.forEach(word => {
        if (text.includes(word)) score += 8;
    });
    
    // Bonus for same domain
    if (new URL(href).hostname === new URL(baseUrl).hostname) {
        score += 3;
    }
    
    // Penalty for external links
    if (href.includes('facebook.com') || href.includes('twitter.com')) {
        score -= 10;
    }
    
    return score;
}
```

### 4. **Implement WebDriver Approach via Chrome Debugging Protocol**
For complex sites that require JavaScript rendering:

```javascript
// In background.js
async function debuggerExtract(tabId, url) {
    // Attach debugger
    await chrome.debugger.attach({ tabId }, '1.3');
    
    try {
        // Navigate to page
        await chrome.debugger.sendCommand(tabId, 'Page.navigate', { url });
        
        // Wait for load
        await chrome.debugger.sendCommand(tabId, 'Page.loadEventFired');
        
        // Get document
        const { root } = await chrome.debugger.sendCommand(tabId, 'DOM.getDocument');
        
        // Get HTML
        const { outerHTML } = await chrome.debugger.sendCommand(
            tabId, 
            'DOM.getOuterHTML', 
            { nodeId: root.nodeId }
        );
        
        return outerHTML;
        
    } finally {
        await chrome.debugger.detach({ tabId });
    }
}
```

### 5. **Parallel Processing with Worker Pool**
Process multiple pages simultaneously:

```javascript
class TabPool {
    constructor(maxTabs = 3) {
        this.maxTabs = maxTabs;
        this.activeTabs = new Map();
        this.queue = [];
    }
    
    async process(urls, extractFunc) {
        const results = [];
        const promises = [];
        
        for (const url of urls) {
            const promise = this.addToQueue(url, extractFunc);
            promises.push(promise);
        }
        
        return Promise.all(promises);
    }
    
    async addToQueue(url, extractFunc) {
        while (this.activeTabs.size >= this.maxTabs) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const tab = await chrome.tabs.create({ url, active: false });
        this.activeTabs.set(tab.id, true);
        
        try {
            const result = await extractFunc(tab.id, url);
            return result;
        } finally {
            this.activeTabs.delete(tab.id);
            await chrome.tabs.remove(tab.id).catch(() => {});
        }
    }
}
```

### 6. **Implement Caching Layer**
Cache extracted data to avoid re-crawling:

```javascript
class ExtractorCache {
    constructor() {
        this.cache = new Map();
        this.maxAge = 1000 * 60 * 60; // 1 hour
    }
    
    async get(url) {
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.timestamp < this.maxAge) {
            return cached.data;
        }
        return null;
    }
    
    set(url, data) {
        this.cache.set(url, {
            data,
            timestamp: Date.now()
        });
        
        // Also save to chrome.storage.local
        chrome.storage.local.set({
            [`cache_${url}`]: { data, timestamp: Date.now() }
        });
    }
}
```

### 7. **Add Visual Scraping Indicators**
Show users what's being extracted in real-time:

```javascript
// In content.js
function highlightExtractedElements() {
    const style = document.createElement('style');
    style.textContent = `
        .ff-extracted {
            outline: 2px solid #4f46e5 !important;
            outline-offset: 2px !important;
            animation: ff-pulse 1s ease-in-out;
        }
        
        @keyframes ff-pulse {
            0% { outline-color: #4f46e5; }
            50% { outline-color: #10b981; }
            100% { outline-color: #4f46e5; }
        }
        
        .ff-extraction-tooltip {
            position: absolute;
            background: #4f46e5;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
        }
    `;
    document.head.appendChild(style);
    
    // Highlight extracted elements
    document.querySelectorAll('[data-extracted]').forEach(el => {
        el.classList.add('ff-extracted');
    });
}
```

### 8. **Implement Fallback Extraction Methods**
Multiple approaches for different site types:

```javascript
const extractionStrategies = {
    // Strategy 1: Direct DOM parsing
    domParsing: async (doc) => {
        return extractFromDOM(doc);
    },
    
    // Strategy 2: Schema.org/JSON-LD
    structuredData: async (doc) => {
        const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
        const data = [];
        scripts.forEach(script => {
            try {
                data.push(JSON.parse(script.textContent));
            } catch (e) {}
        });
        return parseStructuredData(data);
    },
    
    // Strategy 3: Meta tags
    metaTags: async (doc) => {
        const metas = doc.querySelectorAll('meta[property], meta[name]');
        const data = {};
        metas.forEach(meta => {
            const key = meta.getAttribute('property') || meta.getAttribute('name');
            const value = meta.getAttribute('content');
            if (key && value) data[key] = value;
        });
        return parseMetaData(data);
    },
    
    // Strategy 4: Heuristic text analysis
    textAnalysis: async (doc) => {
        const text = doc.body.innerText;
        return analyzeTextPatterns(text);
    }
};
```

### 9. **Add Site-Specific Adapters**
Custom extraction for known sites:

```javascript
const siteAdapters = {
    'whetstone.org': {
        getProgramLinks: (doc) => {
            return Array.from(doc.querySelectorAll('a[href*="/programs/"], a[href*="/treatment/"]'));
        },
        extractProgramInfo: (doc) => {
            // Custom extraction logic for Whetstone
            const info = {};
            const programHeader = doc.querySelector('.program-header, h1');
            if (programHeader) info.name = programHeader.textContent;
            // ... more custom logic
            return info;
        }
    },
    // Add more site-specific adapters
};
```

### 10. **Permissions Enhancement**
Add these permissions to manifest.json for better functionality:

```json
{
  "permissions": [
    "activeTab",
    "storage",
    "scripting",
    "tabs",
    "webNavigation",
    "debugger"
  ],
  "optional_permissions": [
    "downloads",
    "clipboardWrite"
  ]
}
```

## Implementation Priority

1. **Chrome Tabs API** - Most reliable for cross-origin
2. **Smart Link Scoring** - Better page selection
3. **Parallel Processing** - Faster extraction
4. **Site Adapters** - Handle specific sites better
5. **Visual Indicators** - Better user feedback

These improvements should significantly enhance the extraction capabilities beyond what you're currently experiencing.