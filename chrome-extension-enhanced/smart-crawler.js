// smart-crawler.js - Intelligent multi-page crawler with adaptive depth
// Prioritizes relevant pages and efficiently extracts data

class SmartCrawler {
    constructor() {
        this.visitedUrls = new Set();
        this.pageQueue = [];
        this.extractedData = new Map();
        this.siteMap = new Map();
        this.maxDepth = 3;
        this.maxPages = 50;
        this.concurrentFetches = 3;
        this.requestDelay = 300; // ms between requests
    }
    
    async crawlSite(startUrl, options = {}) {
        // Reset state
        this.visitedUrls.clear();
        this.pageQueue = [];
        this.extractedData.clear();
        
        // Apply options
        Object.assign(this, options);
        
        // Analyze starting page
        const startPage = await this.analyzePage(startUrl);
        if (!startPage) return null;
        
        // Identify site structure
        const pageTypes = this.identifyPageTypes(startPage);
        const crawlPlan = this.createCrawlPlan(pageTypes, startPage);
        
        // Execute crawl
        const results = await this.executeCrawl(crawlPlan);
        
        return {
            pages: results,
            siteStructure: this.siteMap,
            summary: this.summarizeCrawl()
        };
    }
    
    async analyzePage(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            return {
                url,
                document: doc,
                links: this.extractLinks(doc, url),
                metadata: this.extractMetadata(doc),
                structure: this.analyzeStructure(doc)
            };
        } catch (error) {
            console.error(`Failed to analyze ${url}:`, error);
            return null;
        }
    }
    
    identifyPageTypes(page) {
        const pageTypes = {
            navigation: [],
            content: [],
            utility: []
        };
        
        // Check for sitemap
        const sitemapLink = page.document.querySelector('link[rel="sitemap"], a[href*="sitemap"]');
        if (sitemapLink) {
            pageTypes.utility.push({
                url: sitemapLink.href,
                type: 'sitemap',
                priority: 1.0
            });
        }
        
        // Analyze navigation links
        page.links.forEach(link => {
            const score = this.scorePageRelevance(link);
            
            if (score.category === 'content' && score.value > 0.5) {
                pageTypes.content.push({
                    url: link.url,
                    type: score.type,
                    priority: score.value
                });
            } else if (score.category === 'navigation') {
                pageTypes.navigation.push({
                    url: link.url,
                    type: score.type,
                    priority: score.value
                });
            }
        });
        
        return pageTypes;
    }
    
    scorePageRelevance(link) {
        const url = link.url.toLowerCase();
        const text = link.text.toLowerCase();
        const title = link.title?.toLowerCase() || '';
        
        // High-priority content pages
        const contentPatterns = {
            programs: { patterns: ['/program', '/treatment', '/services', 'program', 'treatment'], score: 0.9 },
            clinical: { patterns: ['/clinical', '/therapy', '/modalities', 'clinical', 'therapy'], score: 0.85 },
            approach: { patterns: ['/approach', '/philosophy', '/method', 'approach', 'philosophy'], score: 0.8 },
            about: { patterns: ['/about', '/who-we-are', '/mission', 'about', 'who we are'], score: 0.75 },
            admissions: { patterns: ['/admission', '/intake', '/enroll', 'admission', 'intake'], score: 0.85 },
            staff: { patterns: ['/staff', '/team', '/clinicians', 'staff', 'team'], score: 0.7 },
            insurance: { patterns: ['/insurance', '/payment', '/cost', 'insurance', 'payment'], score: 0.8 }
        };
        
        // Check URL and text against patterns
        for (const [type, config] of Object.entries(contentPatterns)) {
            const matchesUrl = config.patterns.some(pattern => url.includes(pattern));
            const matchesText = config.patterns.some(pattern => 
                text.includes(pattern) || title.includes(pattern)
            );
            
            if (matchesUrl || matchesText) {
                return {
                    category: 'content',
                    type,
                    value: matchesUrl ? config.score : config.score * 0.8
                };
            }
        }
        
        // Low-priority pages
        const lowPriorityPatterns = [
            'blog', 'news', 'events', 'careers', 'privacy', 'terms',
            'contact', 'resources', 'testimonials', 'gallery'
        ];
        
        if (lowPriorityPatterns.some(pattern => url.includes(pattern) || text.includes(pattern))) {
            return {
                category: 'utility',
                type: 'low-priority',
                value: 0.3
            };
        }
        
        return {
            category: 'navigation',
            type: 'unknown',
            value: 0.5
        };
    }
    
    createCrawlPlan(pageTypes, startPage) {
        const plan = [];
        
        // Add high-priority content pages first
        const contentPages = pageTypes.content
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 20); // Limit to top 20 content pages
        
        plan.push(...contentPages);
        
        // Add some navigation pages if needed
        if (plan.length < 10) {
            const navPages = pageTypes.navigation
                .filter(page => page.priority > 0.6)
                .slice(0, 5);
            plan.push(...navPages);
        }
        
        // Check for sitemap
        const sitemap = pageTypes.utility.find(page => page.type === 'sitemap');
        if (sitemap) {
            plan.unshift(sitemap); // Process sitemap first
        }
        
        // Calculate optimal depth based on site structure
        this.maxDepth = this.calculateOptimalDepth(pageTypes, startPage);
        
        return plan;
    }
    
    calculateOptimalDepth(pageTypes, startPage) {
        // Factors to consider
        const factors = {
            hasSitemap: pageTypes.utility.some(p => p.type === 'sitemap'),
            contentPageCount: pageTypes.content.length,
            siteSize: startPage.links.length,
            hasGoodNavigation: pageTypes.navigation.filter(p => p.priority > 0.7).length > 3
        };
        
        // Calculate depth
        let depth = 2; // Default
        
        if (factors.hasSitemap) depth = 1; // Sitemap provides all links
        else if (factors.contentPageCount > 10) depth = 2; // Many direct content links
        else if (factors.siteSize < 20) depth = 3; // Small site, go deeper
        else if (!factors.hasGoodNavigation) depth = 3; // Poor navigation, need to dig
        
        return Math.min(depth, 4); // Cap at 4 levels
    }
    
    async executeCrawl(crawlPlan) {
        const results = [];
        const queue = [...crawlPlan];
        
        // Add start URL if not in plan
        if (!queue.some(item => item.url === window.location.href)) {
            queue.unshift({
                url: window.location.href,
                type: 'start',
                priority: 1.0
            });
        }
        
        // Process queue with concurrent fetching
        while (queue.length > 0 && results.length < this.maxPages) {
            const batch = queue.splice(0, this.concurrentFetches);
            
            const batchPromises = batch.map(async (item) => {
                if (this.visitedUrls.has(item.url)) return null;
                
                this.visitedUrls.add(item.url);
                
                // Delay between requests
                await this.delay(this.requestDelay);
                
                const page = await this.fetchAndExtract(item);
                
                if (page) {
                    // Discover new pages from this one
                    const newPages = this.discoverPages(page, item.depth || 0);
                    queue.push(...newPages);
                }
                
                return page;
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults.filter(r => r !== null));
        }
        
        return results;
    }
    
    async fetchAndExtract(pageInfo) {
        try {
            const response = await fetch(pageInfo.url);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract data using appropriate strategy
            const extractedData = this.extractPageData(doc, pageInfo);
            
            // Store in map
            this.extractedData.set(pageInfo.url, extractedData);
            
            return {
                url: pageInfo.url,
                type: pageInfo.type,
                data: extractedData,
                links: this.extractLinks(doc, pageInfo.url),
                depth: pageInfo.depth || 0
            };
        } catch (error) {
            console.error(`Failed to fetch ${pageInfo.url}:`, error);
            return null;
        }
    }
    
    extractPageData(doc, pageInfo) {
        // This would integrate with the main extractor
        // For now, return basic structure analysis
        return {
            title: doc.title,
            headers: Array.from(doc.querySelectorAll('h1, h2, h3')).map(h => ({
                level: h.tagName,
                text: h.textContent.trim()
            })),
            hasStructuredData: !!doc.querySelector('script[type="application/ld+json"]'),
            mainContent: this.identifyMainContent(doc),
            pageType: pageInfo.type
        };
    }
    
    identifyMainContent(doc) {
        // Try to identify main content area
        const contentSelectors = [
            'main', '[role="main"]', '.main-content', '#main-content',
            '.content', '#content', 'article', '.article'
        ];
        
        for (const selector of contentSelectors) {
            const element = doc.querySelector(selector);
            if (element) {
                return {
                    found: true,
                    selector,
                    textLength: element.textContent.length
                };
            }
        }
        
        return { found: false };
    }
    
    discoverPages(page, currentDepth) {
        if (currentDepth >= this.maxDepth) return [];
        
        const newPages = [];
        
        page.links.forEach(link => {
            if (this.visitedUrls.has(link.url)) return;
            
            const score = this.scorePageRelevance(link);
            
            // Only add relevant pages
            if (score.value > 0.5) {
                newPages.push({
                    url: link.url,
                    type: score.type,
                    priority: score.value * (1 - currentDepth / this.maxDepth), // Reduce priority with depth
                    depth: currentDepth + 1
                });
            }
        });
        
        // Sort by priority and limit
        return newPages
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 10);
    }
    
    extractLinks(doc, baseUrl) {
        const links = [];
        const linkElements = doc.querySelectorAll('a[href]');
        
        linkElements.forEach(element => {
            const href = element.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
            
            try {
                const url = new URL(href, baseUrl);
                
                // Only internal links
                if (url.hostname !== new URL(baseUrl).hostname) return;
                
                links.push({
                    url: url.href,
                    text: element.textContent.trim(),
                    title: element.getAttribute('title')
                });
            } catch (error) {
                // Invalid URL
            }
        });
        
        return links;
    }
    
    extractMetadata(doc) {
        return {
            title: doc.title,
            description: doc.querySelector('meta[name="description"]')?.content,
            ogTitle: doc.querySelector('meta[property="og:title"]')?.content,
            ogDescription: doc.querySelector('meta[property="og:description"]')?.content,
            canonical: doc.querySelector('link[rel="canonical"]')?.href
        };
    }
    
    analyzeStructure(doc) {
        return {
            hasNav: !!doc.querySelector('nav, [role="navigation"]'),
            hasMain: !!doc.querySelector('main, [role="main"]'),
            hasSidebar: !!doc.querySelector('aside, .sidebar, #sidebar'),
            hasFooter: !!doc.querySelector('footer, [role="contentinfo"]'),
            hasStructuredData: !!doc.querySelector('script[type="application/ld+json"]')
        };
    }
    
    summarizeCrawl() {
        return {
            pagesVisited: this.visitedUrls.size,
            dataExtracted: this.extractedData.size,
            pageTypes: this.categorizeVisitedPages(),
            coverage: this.estimateSiteCoverage()
        };
    }
    
    categorizeVisitedPages() {
        const categories = {};
        
        this.extractedData.forEach((data, url) => {
            const type = data.pageType || 'unknown';
            categories[type] = (categories[type] || 0) + 1;
        });
        
        return categories;
    }
    
    estimateSiteCoverage() {
        // Estimate based on common page types found
        const expectedPages = [
            'programs', 'clinical', 'about', 'admissions',
            'staff', 'approach', 'insurance'
        ];
        
        const foundPages = Object.keys(this.categorizeVisitedPages());
        const coverage = expectedPages.filter(page => foundPages.includes(page)).length;
        
        return {
            percentage: (coverage / expectedPages.length) * 100,
            missing: expectedPages.filter(page => !foundPages.includes(page))
        };
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Parse sitemap if found
    async parseSitemap(sitemapUrl) {
        try {
            const response = await fetch(sitemapUrl);
            const text = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'application/xml');
            
            const urls = Array.from(doc.querySelectorAll('url > loc')).map(loc => ({
                url: loc.textContent,
                priority: parseFloat(loc.parentElement.querySelector('priority')?.textContent || '0.5'),
                changefreq: loc.parentElement.querySelector('changefreq')?.textContent
            }));
            
            return urls;
        } catch (error) {
            console.error('Failed to parse sitemap:', error);
            return [];
        }
    }
}

// Export for use in extractor
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartCrawler;
}
