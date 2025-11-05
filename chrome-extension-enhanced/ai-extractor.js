// ai-extractor.js - AI-Powered Clinical Data Extraction v8.0
// Uses Google Gemini API (free tier) or OpenAI GPT-3.5 for intelligent extraction

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__FF_AI_EXTRACTOR__) {
        console.log('[WARNING] AI extractor already loaded');
        return;
    }
    window.__FF_AI_EXTRACTOR__ = true;
    
    console.log('[INFO] AI-Powered Clinical Extractor v8.0 Loaded');
    
    // Configuration for AI providers
    const AI_CONFIG = {
        // Option 1: Google Gemini (Free tier - 60 requests per minute)
        GEMINI: {
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            apiKey: null, // Will be loaded from storage
            model: 'gemini-pro'
        },
        // Option 2: OpenAI GPT-3.5 (Requires API key with credits)
        OPENAI: {
            endpoint: 'https://api.openai.com/v1/chat/completions',
            apiKey: null, // Will be loaded from storage
            model: 'gpt-3.5-turbo'
        },
        // Option 3: Local Gemini Nano (Chrome built-in, experimental)
        GEMINI_NANO: {
            available: false
        }
    };
    
    // Listen for extraction requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extract') {
            console.log('[INFO] Starting AI-powered extraction...');
            performAIExtraction().then(result => {
                console.log('[SUCCESS] AI extraction complete:', result.meta);
                sendResponse({ success: true, data: result });
            }).catch(error => {
                console.error('[ERROR] AI extraction failed:', error);
                // Fallback to rule-based extraction
                const fallbackResult = performRuleBasedExtraction();
                sendResponse({ success: true, data: fallbackResult });
            });
            return true;
        }
        
        if (request.action === 'setApiKey') {
            // Store API key securely
            chrome.storage.local.set({ 
                [`${request.provider}_api_key`]: request.apiKey 
            }, () => {
                sendResponse({ success: true });
            });
            return true;
        }
    });
    
    // Main AI extraction function
    async function performAIExtraction() {
        const startTime = Date.now();
        
        // Check for Chrome's built-in AI first (Gemini Nano) - NO API KEY NEEDED!
        if (typeof window.ai !== 'undefined' && window.ai?.languageModel) {
            console.log('[INFO] Using Chrome built-in Gemini Nano - FREE, no API key needed!');
            try {
                return await extractWithGeminiNano();
            } catch (error) {
                console.log('[INFO] Chrome AI not available, trying API keys...');
            }
        }
        
        // Check for Chrome's experimental AI API
        if (typeof window.ai !== 'undefined' && window.ai?.createTextSession) {
            console.log('[INFO] Using Chrome experimental AI API');
            try {
                return await extractWithChromeAI();
            } catch (error) {
                console.log('[INFO] Chrome experimental AI not available, trying API keys...');
            }
        }
        
        // Load API configuration for external APIs
        await loadAPIConfig();
        
        // Gather page content
        const pageContent = gatherPageContent();
        
        // Try Gemini API first (free tier)
        if (AI_CONFIG.GEMINI.apiKey) {
            console.log('[INFO] Using Google Gemini API');
            return await extractWithGemini(pageContent);
        }
        
        // Try OpenAI as fallback
        if (AI_CONFIG.OPENAI.apiKey) {
            console.log('[INFO] Using OpenAI GPT-3.5');
            return await extractWithOpenAI(pageContent);
        }
        
        // If no AI available, use rule-based extraction
        console.log('[WARNING] No AI API configured, using rule-based extraction');
        throw new Error('No AI API configured');
    }
    
    // Load API keys from storage
    async function loadAPIConfig() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['gemini_api_key', 'openai_api_key'], (result) => {
                AI_CONFIG.GEMINI.apiKey = result.gemini_api_key;
                AI_CONFIG.OPENAI.apiKey = result.openai_api_key;
                resolve();
            });
        });
    }
    
    // Gather and clean page content
    function gatherPageContent() {
        // Get main content areas
        const mainContent = document.querySelector('main, article, [role="main"], .content, #content') || document.body;
        
        // Get text content
        let text = mainContent.innerText || '';
        
        // Also get structured data if available
        const structuredData = {};
        
        // Check for JSON-LD
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
            try {
                structuredData.jsonLd = JSON.parse(jsonLd.textContent);
            } catch (e) {}
        }
        
        // Get meta tags
        structuredData.meta = {};
        document.querySelectorAll('meta[property], meta[name]').forEach(meta => {
            const key = meta.getAttribute('property') || meta.getAttribute('name');
            const content = meta.getAttribute('content');
            if (key && content) {
                structuredData.meta[key] = content;
            }
        });
        
        // Limit text length for API calls (most APIs have token limits)
        const maxLength = 15000; // ~3750 tokens
        if (text.length > maxLength) {
            // Take beginning and end of content
            text = text.substring(0, maxLength/2) + '\n...\n' + text.substring(text.length - maxLength/2);
        }
        
        return {
            url: window.location.href,
            title: document.title,
            text: text,
            structuredData: structuredData
        };
    }
    
    // Extract using Chrome's built-in Gemini Nano
    async function extractWithGeminiNano() {
        const pageContent = gatherPageContent();
        
        try {
            const session = await window.ai.languageModel.create();
            
            const prompt = createExtractionPrompt(pageContent);
            const response = await session.prompt(prompt);
            
            // Parse the AI response
            return parseAIResponse(response);
        } catch (error) {
            console.error('[ERROR] Gemini Nano extraction failed:', error);
            throw error;
        }
    }
    
    // Extract using Chrome's experimental AI API
    async function extractWithChromeAI() {
        const pageContent = gatherPageContent();
        
        try {
            const session = await window.ai.createTextSession();
            
            const prompt = createExtractionPrompt(pageContent);
            const response = await session.prompt(prompt);
            
            // Parse the AI response
            return parseAIResponse(response);
        } catch (error) {
            console.error('[ERROR] Chrome AI extraction failed:', error);
            throw error;
        }
    }
    
    // Extract using Google Gemini API
    async function extractWithGemini(pageContent) {
        const prompt = createExtractionPrompt(pageContent);
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.2,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048,
            }
        };
        
        try {
            const response = await fetch(`${AI_CONFIG.GEMINI.endpoint}?key=${AI_CONFIG.GEMINI.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }
            
            const data = await response.json();
            const aiText = data.candidates[0].content.parts[0].text;
            
            return parseAIResponse(aiText);
        } catch (error) {
            console.error('[ERROR] Gemini API call failed:', error);
            throw error;
        }
    }
    
    // Extract using OpenAI GPT-3.5
    async function extractWithOpenAI(pageContent) {
        const prompt = createExtractionPrompt(pageContent);
        
        const requestBody = {
            model: AI_CONFIG.OPENAI.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a clinical documentation specialist extracting treatment program information for aftercare recommendations.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 2000
        };
        
        try {
            const response = await fetch(AI_CONFIG.OPENAI.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_CONFIG.OPENAI.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }
            
            const data = await response.json();
            const aiText = data.choices[0].message.content;
            
            return parseAIResponse(aiText);
        } catch (error) {
            console.error('[ERROR] OpenAI API call failed:', error);
            throw error;
        }
    }
    
    // Create extraction prompt for AI
    function createExtractionPrompt(pageContent) {
        return `Extract treatment program information from this webpage for clinical aftercare documentation.

WEBPAGE CONTENT:
URL: ${pageContent.url}
Title: ${pageContent.title}

${pageContent.text}

EXTRACT THE FOLLOWING INFORMATION:
Return ONLY a JSON object with these exact fields. If information is not found, use empty string "" or empty array [].

{
  "name": "program name",
  "city": "city name",
  "state": "state abbreviation (2 letters)",
  "levelsOfCare": ["Residential", "PHP", "IOP", "Outpatient"],
  "population": {
    "ages": "age range (e.g., '13-17' or 'Young Adults')",
    "gender": "Males Only, Females Only, or Co-ed",
    "specificPopulations": ["LGBTQ+", "Adopted Youth", etc.]
  },
  "overview": "2-3 sentence program overview",
  "philosophy": "treatment philosophy if mentioned",
  "approach": "treatment approach if mentioned",
  "clinical": {
    "evidenceBased": ["CBT", "DBT", "EMDR", etc.],
    "experiential": ["Art Therapy", "Equine Therapy", etc.],
    "specializations": ["Trauma/PTSD", "Anxiety", "Depression", etc.],
    "individualTherapy": "hours per week if mentioned",
    "groupTherapy": "hours per week if mentioned",
    "psychiatricServices": true/false,
    "medicationManagement": true/false,
    "traumaInformed": true/false
  },
  "structure": {
    "los": "length of stay (e.g., '30-90 days')",
    "ratio": "staff to client ratio (e.g., '1:4')",
    "phases": ["Phase 1", "Phase 2", etc.],
    "groupSize": "typical group size",
    "academics": {
      "hasProgram": true/false,
      "accreditation": "accreditation name if mentioned"
    }
  },
  "family": {
    "weeklyTherapy": true/false,
    "workshops": true/false,
    "familyWeekend": true/false,
    "parentSupport": true/false,
    "visitationPolicy": "visitation policy if mentioned"
  },
  "staff": {
    "credentials": ["LCSW", "PhD", "MD", etc.],
    "leadership": ["Clinical Director", "Medical Director", etc.]
  },
  "facilities": {
    "setting": "Mountain, Beach, Rural, or Urban",
    "campus": "campus size if mentioned",
    "amenities": ["pool", "gym", etc.],
    "rooms": "Private, Semi-private, or Shared"
  },
  "admissions": {
    "insurance": ["Aetna", "BCBS", "Cigna", etc.],
    "financing": true/false,
    "phone": "phone number",
    "email": "email address"
  },
  "quality": {
    "accreditations": ["Joint Commission", "CARF", "NATSAP", etc.]
  }
}

IMPORTANT: Return ONLY the JSON object, no other text or explanation.`;
    }
    
    // Parse AI response into structured data
    function parseAIResponse(aiText) {
        try {
            // Try to extract JSON from the response
            let jsonStr = aiText;
            
            // If response contains markdown code blocks, extract the JSON
            const jsonMatch = aiText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1];
            }
            
            // Parse the JSON
            const extractedData = JSON.parse(jsonStr);
            
            // Add metadata
            extractedData.meta = {
                sourcesAnalyzed: 1,
                pagesScanned: [window.location.href],
                confidence: calculateAIConfidence(extractedData),
                extractionTime: Date.now(),
                extractionMethod: 'AI'
            };
            
            return extractedData;
        } catch (error) {
            console.error('[ERROR] Failed to parse AI response:', error);
            console.log('AI Response:', aiText);
            throw new Error('Failed to parse AI response');
        }
    }
    
    // Calculate confidence score for AI extraction
    function calculateAIConfidence(data) {
        let score = 0;
        let checks = 0;
        
        // Check key fields
        if (data.name && data.name !== '') { score += 15; }
        checks += 15;
        
        if (data.city && data.state) { score += 10; }
        checks += 10;
        
        if (data.levelsOfCare && data.levelsOfCare.length > 0) { score += 10; }
        checks += 10;
        
        if (data.population?.ages) { score += 10; }
        checks += 10;
        
        if (data.clinical?.evidenceBased?.length > 0) { score += 15; }
        checks += 15;
        
        if (data.clinical?.specializations?.length > 0) { score += 10; }
        checks += 10;
        
        if (data.admissions?.insurance?.length > 0) { score += 10; }
        checks += 10;
        
        if (data.admissions?.phone || data.admissions?.email) { score += 10; }
        checks += 10;
        
        if (data.quality?.accreditations?.length > 0) { score += 5; }
        checks += 5;
        
        if (data.overview || data.philosophy) { score += 5; }
        checks += 5;
        
        return Math.round((score / checks) * 100);
    }
    
    // Fallback rule-based extraction
    function performRuleBasedExtraction() {
        const pageText = document.body?.innerText || '';
        
        const data = {
            name: document.title.split(/[-|]/)[0].trim() || 'Treatment Program',
            city: '',
            state: '',
            levelsOfCare: [],
            population: { ages: '', gender: '', specificPopulations: [] },
            overview: '',
            philosophy: '',
            approach: '',
            clinical: {
                evidenceBased: [],
                experiential: [],
                specializations: [],
                individualTherapy: '',
                groupTherapy: '',
                psychiatricServices: false,
                medicationManagement: false,
                traumaInformed: false
            },
            structure: {
                los: '',
                ratio: '',
                phases: [],
                groupSize: '',
                academics: { hasProgram: false, accreditation: '' }
            },
            family: {
                weeklyTherapy: false,
                workshops: false,
                familyWeekend: false,
                parentSupport: false,
                visitationPolicy: ''
            },
            staff: {
                credentials: [],
                leadership: []
            },
            facilities: {
                setting: '',
                campus: '',
                amenities: [],
                rooms: ''
            },
            admissions: {
                insurance: [],
                financing: false,
                phone: pageText.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0] || '',
                email: pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || ''
            },
            quality: {
                accreditations: []
            },
            meta: {
                sourcesAnalyzed: 1,
                pagesScanned: [window.location.href],
                confidence: 30,
                extractionTime: 100,
                extractionMethod: 'Rule-based (Fallback)'
            }
        };
        
        // Basic extraction rules
        if (/residential/i.test(pageText)) data.levelsOfCare.push('Residential');
        if (/\bPHP\b/i.test(pageText)) data.levelsOfCare.push('PHP');
        if (/\bIOP\b/i.test(pageText)) data.levelsOfCare.push('IOP');
        
        // Extract some therapies
        if (/\bCBT\b/i.test(pageText)) data.clinical.evidenceBased.push('CBT');
        if (/\bDBT\b/i.test(pageText)) data.clinical.evidenceBased.push('DBT');
        if (/\bEMDR\b/i.test(pageText)) data.clinical.evidenceBased.push('EMDR');
        
        return data;
    }
    
})();
