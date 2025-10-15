// feedback-system.js - Smart Feedback and Encouragement System

class FeedbackSystem {
    constructor() {
        this.userStats = this.loadUserStats();
        this.achievements = new AchievementSystem();
        this.encourager = new EncouragementEngine();
        this.tips = new ContextualTips();
        this.celebrations = new CelebrationManager();
    }
    
    // User Statistics Tracking
    loadUserStats() {
        const saved = localStorage.getItem('careconnect_user_stats');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return {
            casesCompleted: 0,
            familiesHelped: 0,
            programsReviewed: 0,
            documentsCreated: 0,
            modulesCompleted: 0,
            totalTime: 0,
            streak: 0,
            lastLogin: null,
            startDate: new Date().toISOString()
        };
    }
    
    saveUserStats() {
        localStorage.setItem('careconnect_user_stats', JSON.stringify(this.userStats));
    }
    
    updateStats(type, value = 1) {
        if (this.userStats[type] !== undefined) {
            this.userStats[type] += value;
            this.saveUserStats();
            
            // Check for achievements
            this.checkAchievements(type, this.userStats[type]);
            
            // Generate encouragement
            return this.encourager.getEncouragement(type, this.userStats[type]);
        }
    }
    
    checkAchievements(type, value) {
        const achieved = this.achievements.check(type, value);
        if (achieved) {
            this.celebrations.celebrate(achieved);
        }
    }
    
    // Daily Welcome Messages
    getDailyWelcome(userName) {
        const hour = new Date().getHours();
        const stats = this.userStats;
        
        let greeting = '';
        let motivation = '';
        
        // Time-based greeting
        if (hour < 12) {
            greeting = `Good morning, ${userName}! ☀️`;
        } else if (hour < 17) {
            greeting = `Good afternoon, ${userName}! 🌤️`;
        } else {
            greeting = `Good evening, ${userName}! 🌙`;
        }
        
        // Personalized motivation based on stats
        if (stats.streak > 0) {
            motivation = `You're on a ${stats.streak} day streak! Keep it going!`;
        } else if (stats.casesCompleted === 0) {
            motivation = `Ready to help your first family? Let's get started!`;
        } else if (stats.casesCompleted % 10 === 0) {
            motivation = `Wow! ${stats.casesCompleted} cases completed! You're a superstar!`;
        } else {
            const motivations = [
                `You've helped ${stats.familiesHelped} families find hope!`,
                `${stats.programsReviewed} programs reviewed - you know your stuff!`,
                `Another day, another opportunity to change lives!`,
                `Your expertise is making a real difference!`,
                `Let's help more families today!`
            ];
            motivation = motivations[Math.floor(Math.random() * motivations.length)];
        }
        
        return {
            greeting,
            motivation,
            todayGoals: this.generateDailyGoals(),
            tip: this.tips.getDailyTip()
        };
    }
    
    generateDailyGoals() {
        const goals = [];
        
        if (this.userStats.modulesCompleted < 5) {
            goals.push({
                icon: '📚',
                text: 'Complete a learning module',
                progress: `${this.userStats.modulesCompleted}/5`
            });
        }
        
        goals.push({
            icon: '👨‍👩‍👧',
            text: 'Help 3 families today',
            progress: `0/3`
        });
        
        goals.push({
            icon: '⏱️',
            text: 'Complete a case in under 30 min',
            progress: 'Not started'
        });
        
        return goals;
    }
    
    // Contextual Feedback During Workflow
    getWorkflowFeedback(step, action, context) {
        const feedback = {
            message: '',
            tip: '',
            encouragement: '',
            warning: ''
        };
        
        switch(step) {
            case 'profile':
                feedback.message = this.getProfileFeedback(action, context);
                break;
            case 'explore':
                feedback.message = this.getExploreFeedback(action, context);
                break;
            case 'compare':
                feedback.message = this.getCompareFeedback(action, context);
                break;
            case 'document':
                feedback.message = this.getDocumentFeedback(action, context);
                break;
            case 'package':
                feedback.message = this.getPackageFeedback(action, context);
                break;
        }
        
        // Add contextual tip
        feedback.tip = this.tips.getContextualTip(step, action);
        
        // Add encouragement if milestone
        if (this.isMilestone(step, action, context)) {
            feedback.encouragement = this.encourager.getMilestoneMessage(step);
        }
        
        // Add warning if needed
        feedback.warning = this.getWarningIfNeeded(step, action, context);
        
        return feedback;
    }
    
    getProfileFeedback(action, context) {
        const messages = {
            'age-entered': context.age < 14 ? 
                'Young client - family involvement will be crucial' :
                context.age > 18 ? 
                'Young adult - consider programs with life skills' :
                'Good age for many program options',
            'insurance-selected': context.insurance === 'Medicaid' ?
                'Medicaid accepted by select programs - I\'ll filter for you' :
                'Good insurance coverage - many options available',
            'urgency-high': '⚠️ Crisis situation noted - prioritizing immediate availability',
            'profile-complete': '✅ Excellent profile! Now let\'s find the perfect programs!'
        };
        
        return messages[action] || '';
    }
    
    getExploreFeedback(action, context) {
        const messages = {
            'program-selected': [
                'Great choice! This program has excellent outcomes.',
                'Nice find! Adding to your comparison list.',
                'Good eye! This matches the client profile well.',
                'Excellent! One more and you can compare.'
            ][Math.floor(Math.random() * 4)],
            'filter-applied': `Showing ${context.count} programs matching your criteria`,
            'search-performed': context.results === 0 ?
                'No exact matches - try adjusting filters' :
                `Found ${context.results} programs matching "${context.query}"`
        };
        
        return messages[action] || '';
    }
    
    getCompareFeedback(action, context) {
        const messages = {
            'comparison-started': 'Let\'s analyze these programs side-by-side',
            'best-match-identified': `${context.program} appears to be the strongest match!`,
            'concern-noted': 'Good catch - this difference is important to discuss with family',
            'notes-added': 'Notes saved - these will appear in your documentation'
        };
        
        return messages[action] || '';
    }
    
    getDocumentFeedback(action, context) {
        const messages = {
            'template-selected': 'Good choice - this template works well for insurance',
            'section-completed': `${context.sections}/${context.total} sections complete`,
            'insurance-language': '💡 Using insurance-friendly language increases approval rates',
            'document-complete': '📄 Professional document ready for review!'
        };
        
        return messages[action] || '';
    }
    
    getPackageFeedback(action, context) {
        const messages = {
            'component-added': `Added ${context.component} to packet`,
            'packet-complete': '🎉 Discharge packet complete and ready to share!',
            'exported': `Successfully exported as ${context.format}`,
            'shared': 'Sent to family - you\'ll get a read receipt'
        };
        
        return messages[action] || '';
    }
    
    isMilestone(step, action, context) {
        const milestones = {
            'profile': ['profile-complete'],
            'explore': ['5-programs-selected', '10-programs-reviewed'],
            'compare': ['comparison-complete', 'decision-made'],
            'document': ['first-document', 'document-complete'],
            'package': ['packet-complete', 'case-closed']
        };
        
        return milestones[step]?.includes(action);
    }
    
    getWarningIfNeeded(step, action, context) {
        // Check for potential issues
        if (step === 'explore' && context.insurance === 'Medicaid' && context.programsFound === 0) {
            return '⚠️ Limited Medicaid options - consider expanding search area';
        }
        
        if (step === 'compare' && context.priceVariance > 10000) {
            return '⚠️ Significant price difference - discuss budget with family';
        }
        
        if (step === 'document' && !context.insuranceVerified) {
            return '⚠️ Remember to verify insurance coverage before finalizing';
        }
        
        return '';
    }
}

// Achievement System
class AchievementSystem {
    constructor() {
        this.achievements = {
            // Cases
            'first-case': { threshold: 1, icon: '🎯', title: 'First Case Complete!' },
            'case-5': { threshold: 5, icon: '⭐', title: '5 Cases Complete!' },
            'case-10': { threshold: 10, icon: '🌟', title: '10 Cases - On Fire!' },
            'case-25': { threshold: 25, icon: '💫', title: '25 Cases - Expert!' },
            'case-50': { threshold: 50, icon: '🏆', title: '50 Cases - Master!' },
            'case-100': { threshold: 100, icon: '👑', title: '100 Cases - Legend!' },
            
            // Speed
            'speed-demon': { type: 'time', threshold: 30, icon: '⚡', title: 'Speed Demon - Case in 30min!' },
            'quick-doc': { type: 'time', threshold: 10, icon: '📝', title: 'Quick Doc - Document in 10min!' },
            
            // Learning
            'module-1': { type: 'module', icon: '📚', title: 'First Module Complete!' },
            'all-modules': { type: 'module', threshold: 5, icon: '🎓', title: 'Learning Master!' },
            
            // Streaks
            'streak-3': { type: 'streak', threshold: 3, icon: '🔥', title: '3 Day Streak!' },
            'streak-7': { type: 'streak', threshold: 7, icon: '🔥', title: 'Week Streak!' },
            'streak-30': { type: 'streak', threshold: 30, icon: '🔥', title: 'Month Streak!' },
            
            // Special
            'night-owl': { type: 'special', icon: '🦉', title: 'Night Owl - Working Late!' },
            'early-bird': { type: 'special', icon: '🐦', title: 'Early Bird - Morning Productivity!' },
            'weekend-warrior': { type: 'special', icon: '⚔️', title: 'Weekend Warrior!' },
            'perfect-match': { type: 'special', icon: '💯', title: 'Perfect Match - 100% Family Satisfaction!' }
        };
        
        this.userAchievements = this.loadAchievements();
    }
    
    loadAchievements() {
        const saved = localStorage.getItem('careconnect_achievements');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveAchievements() {
        localStorage.setItem('careconnect_achievements', JSON.stringify(this.userAchievements));
    }
    
    check(type, value) {
        const newAchievements = [];
        
        Object.keys(this.achievements).forEach(key => {
            const achievement = this.achievements[key];
            
            // Check if already earned
            if (this.userAchievements.find(a => a.key === key)) {
                return;
            }
            
            // Check if earned now
            if (type === 'casesCompleted' && key.startsWith('case-') && value >= achievement.threshold) {
                newAchievements.push({ key, ...achievement, earnedAt: new Date().toISOString() });
            }
            
            if (type === 'streak' && achievement.type === 'streak' && value >= achievement.threshold) {
                newAchievements.push({ key, ...achievement, earnedAt: new Date().toISOString() });
            }
            
            // Check special achievements
            const hour = new Date().getHours();
            if (key === 'night-owl' && hour >= 22) {
                newAchievements.push({ key, ...achievement, earnedAt: new Date().toISOString() });
            }
            
            if (key === 'early-bird' && hour <= 6) {
                newAchievements.push({ key, ...achievement, earnedAt: new Date().toISOString() });
            }
            
            const day = new Date().getDay();
            if (key === 'weekend-warrior' && (day === 0 || day === 6)) {
                newAchievements.push({ key, ...achievement, earnedAt: new Date().toISOString() });
            }
        });
        
        if (newAchievements.length > 0) {
            this.userAchievements.push(...newAchievements);
            this.saveAchievements();
            return newAchievements;
        }
        
        return null;
    }
    
    getProgress() {
        const total = Object.keys(this.achievements).length;
        const earned = this.userAchievements.length;
        
        return {
            earned,
            total,
            percentage: Math.round((earned / total) * 100),
            recent: this.userAchievements.slice(-3),
            nextMilestone: this.getNextMilestone()
        };
    }
    
    getNextMilestone() {
        // Find next case milestone
        const caseAchievements = Object.keys(this.achievements)
            .filter(k => k.startsWith('case-'))
            .map(k => ({ key: k, ...this.achievements[k] }))
            .filter(a => !this.userAchievements.find(ua => ua.key === a.key))
            .sort((a, b) => a.threshold - b.threshold);
        
        return caseAchievements[0] || null;
    }
}

// Encouragement Engine
class EncouragementEngine {
    constructor() {
        this.messages = {
            casesCompleted: [
                'Another family helped! You\'re amazing!',
                'Case closed! Your expertise shines through!',
                'Fantastic work! That family is in great hands!',
                'You\'re on fire! Keep helping families!'
            ],
            programsReviewed: [
                'Thorough research! Families appreciate this!',
                'You really know your programs!',
                'Great exploration! The perfect match is close!',
                'Your attention to detail is impressive!'
            ],
            documentsCreated: [
                'Professional documentation complete!',
                'Clear, concise, and clinical - perfect!',
                'This document will really help the family!',
                'Your writing skills are top-notch!'
            ],
            modulesCompleted: [
                'Knowledge gained! You\'re growing!',
                'Module mastered! Apply this knowledge!',
                'Learning complete! You\'re even better now!',
                'Expertise level up! Well done!'
            ]
        };
        
        this.milestoneMessages = {
            profile: 'Profile complete! You\'re organized and ready!',
            explore: 'Great exploration! You\'ve found excellent options!',
            compare: 'Thoughtful comparison! The best choice is clear!',
            document: 'Documentation perfect! Professional and thorough!',
            package: 'Package complete! This family is all set!'
        };
    }
    
    getEncouragement(type, value) {
        const messages = this.messages[type];
        if (!messages) return '';
        
        // Add variety
        const index = value % messages.length;
        return messages[index];
    }
    
    getMilestoneMessage(step) {
        return this.milestoneMessages[step] || 'Great progress!';
    }
    
    getRandomMotivation() {
        const motivations = [
            'You\'re making a real difference!',
            'Families are lucky to have you!',
            'Your dedication is inspiring!',
            'Keep up the amazing work!',
            'You\'re a true professional!',
            'Your expertise shows!',
            'Excellent judgment!',
            'You\'ve got this!',
            'Impressive work!',
            'Outstanding effort!'
        ];
        
        return motivations[Math.floor(Math.random() * motivations.length)];
    }
}

// Contextual Tips System
class ContextualTips {
    constructor() {
        this.tips = {
            profile: [
                'Tip: Capture as much detail as possible for better matches',
                'Tip: Previous treatment history helps identify what didn\'t work',
                'Tip: Insurance verification saves time later',
                'Tip: Special needs ensure appropriate placement'
            ],
            explore: [
                'Tip: Star your favorites for easy comparison',
                'Tip: Read reviews from other clinicians',
                'Tip: Check admission requirements early',
                'Tip: Note waitlist status for planning'
            ],
            compare: [
                'Tip: Focus on clinical fit over amenities',
                'Tip: Consider family visit logistics',
                'Tip: Verify insurance coverage for each',
                'Tip: Note any exclusion criteria'
            ],
            document: [
                'Tip: Use clinical language for insurance',
                'Tip: Be specific about medical necessity',
                'Tip: Include diagnosis codes when possible',
                'Tip: Avoid guarantees or promises'
            ],
            package: [
                'Tip: Review everything before sending',
                'Tip: Include contact information',
                'Tip: Add a personal note to family',
                'Tip: Save a copy for records'
            ]
        };
        
        this.dailyTips = [
            'Did you know? Programs often have scholarships available - always ask!',
            'Pro tip: Building relationships with admissions helps future placements',
            'Remember: Family involvement is the #1 predictor of success',
            'Insight: Morning admissions calls often get faster responses',
            'Tip: Keep notes on each program\'s strengths for future reference'
        ];
    }
    
    getContextualTip(step, action) {
        const stepTips = this.tips[step];
        if (!stepTips) return '';
        
        // Rotate through tips
        const index = Math.floor(Math.random() * stepTips.length);
        return stepTips[index];
    }
    
    getDailyTip() {
        const today = new Date().getDay();
        return this.dailyTips[today % this.dailyTips.length];
    }
}

// Celebration Manager
class CelebrationManager {
    celebrate(achievements) {
        if (!achievements || achievements.length === 0) return;
        
        const achievement = achievements[0]; // Show first one
        
        // Create celebration notification
        this.showCelebration(achievement);
        
        // Add confetti for major achievements
        if (achievement.key.includes('100') || achievement.key.includes('master')) {
            this.showConfetti();
        }
        
        // Play sound (if enabled)
        this.playSound();
    }
    
    showCelebration(achievement) {
        const celebration = {
            icon: achievement.icon,
            title: achievement.title,
            message: 'Congratulations! You\'ve earned a new achievement!',
            timestamp: new Date().toISOString()
        };
        
        // Trigger UI celebration
        if (window.showAchievement) {
            window.showAchievement(celebration);
        }
        
        return celebration;
    }
    
    showConfetti() {
        // Trigger confetti animation
        if (window.confetti) {
            window.confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }
    
    playSound() {
        // Play achievement sound if enabled
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijYIG2m98OScTgwOUann7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore if audio fails
    }
}

// Initialize feedback system globally
window.feedbackSystem = new FeedbackSystem();
