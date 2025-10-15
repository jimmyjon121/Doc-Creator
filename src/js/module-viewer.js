// module-viewer.js - Interactive Module Viewer and Learning Experience

class ModuleViewer {
    constructor() {
        this.currentModule = null;
        this.currentLesson = 0;
        this.lessonProgress = {};
        this.quizAnswers = {};
    }
    
    openModule(moduleId) {
        const module = window.learningModules.modules[moduleId];
        if (!module) return;
        
        this.currentModule = module;
        this.currentLesson = 0;
        this.showModuleInterface();
    }
    
    showModuleInterface() {
        const container = document.querySelector('.main-content');
        
        const moduleHTML = `
            <div class="module-viewer">
                <div class="module-viewer-header">
                    <button class="btn-back" onclick="moduleViewer.closeModule()">
                        ← Back to Learning Center
                    </button>
                    <div class="module-viewer-progress">
                        Lesson ${this.currentLesson + 1} of ${this.currentModule.lessons.length}
                    </div>
                </div>
                
                <div class="module-viewer-content">
                    <div class="lesson-sidebar">
                        ${this.renderLessonsList()}
                    </div>
                    
                    <div class="lesson-main">
                        ${this.renderCurrentLesson()}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = moduleHTML;
        this.initializeInteractiveElements();
    }
    
    renderLessonsList() {
        return `
            <div class="lessons-list">
                <h3 class="module-title-sidebar">
                    <span class="module-icon">${this.currentModule.icon}</span>
                    ${this.currentModule.title}
                </h3>
                <div class="module-duration">${this.currentModule.duration} total</div>
                
                <div class="lessons">
                    ${this.currentModule.lessons.map((lesson, index) => `
                        <div class="lesson-item ${index === this.currentLesson ? 'active' : ''} ${this.lessonProgress[lesson.id] ? 'completed' : ''}"
                             onclick="moduleViewer.goToLesson(${index})">
                            <div class="lesson-number">${index + 1}</div>
                            <div class="lesson-info">
                                <div class="lesson-title">${lesson.title}</div>
                                <div class="lesson-type">${this.getLessonTypeLabel(lesson.type)}</div>
                            </div>
                            ${this.lessonProgress[lesson.id] ? '<div class="lesson-check">✓</div>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderCurrentLesson() {
        const lesson = this.currentModule.lessons[this.currentLesson];
        
        let content = '';
        
        switch(lesson.type) {
            case 'interactive':
                content = this.renderInteractiveLesson(lesson);
                break;
            case 'exercise':
                content = this.renderExerciseLesson(lesson);
                break;
            case 'quiz':
                content = this.renderQuizLesson(lesson);
                break;
            case 'cases':
                content = this.renderCaseStudyLesson(lesson);
                break;
            case 'roleplay':
                content = this.renderRoleplayLesson(lesson);
                break;
            case 'scenarios':
                content = this.renderScenariosLesson(lesson);
                break;
            default:
                content = this.renderDefaultLesson(lesson);
        }
        
        return `
            <div class="lesson-content">
                <h2 class="lesson-main-title">${lesson.title}</h2>
                ${content}
                
                <div class="lesson-navigation">
                    ${this.currentLesson > 0 ? `
                        <button class="btn btn-secondary" onclick="moduleViewer.previousLesson()">
                            ← Previous
                        </button>
                    ` : '<div></div>'}
                    
                    ${this.currentLesson < this.currentModule.lessons.length - 1 ? `
                        <button class="btn btn-primary" onclick="moduleViewer.nextLesson()">
                            Next Lesson →
                        </button>
                    ` : `
                        <button class="btn btn-success" onclick="moduleViewer.completeModule()">
                            Complete Module! 🎉
                        </button>
                    `}
                </div>
            </div>
        `;
    }
    
    renderInteractiveLesson(lesson) {
        if (lesson.content.sections) {
            return this.renderVisualHierarchy(lesson.content);
        }
        
        return `
            <div class="interactive-lesson">
                <p>Interactive content for: ${lesson.title}</p>
            </div>
        `;
    }
    
    renderVisualHierarchy(content) {
        if (!content.sections || content.sections.length === 0) return '';
        
        const levelData = content.sections[0];
        if (!levelData.levels) return '';
        
        return `
            <div class="visual-hierarchy">
                <h3>${levelData.title}</h3>
                <div class="treatment-ladder">
                    ${levelData.levels.map(level => `
                        <div class="ladder-level" data-intensity="${level.intensity}">
                            <div class="level-header">
                                <h4>${level.name}</h4>
                                <span class="intensity-badge">Intensity: ${level.intensity}%</span>
                            </div>
                            <div class="level-body">
                                <p class="level-description">${level.description}</p>
                                <div class="level-details">
                                    <div class="detail-item">
                                        <strong>When to Use:</strong> ${level.whenToUse}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Duration:</strong> ${level.duration}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Cost:</strong> ${level.cost}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderExerciseLesson(lesson) {
        const content = lesson.content;
        
        if (content.scenarios) {
            return `
                <div class="matching-exercise">
                    <h3>${content.title}</h3>
                    <p class="instructions">${content.instructions}</p>
                    
                    <div class="drag-drop-exercise">
                        <div class="scenarios-list">
                            ${content.scenarios.map(scenario => `
                                <div class="scenario-card draggable" data-id="${scenario.id}">
                                    <strong>${scenario.name}</strong>
                                    <p>${scenario.description}</p>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="drop-zones">
                            ${content.levels.map(level => `
                                <div class="drop-zone" data-level="${level}">
                                    <h4>${level}</h4>
                                    <div class="drop-area">Drop patient here</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <button class="btn btn-primary" onclick="moduleViewer.checkMatching()">
                        Check My Answers
                    </button>
                </div>
            `;
        }
        
        return '<div>Exercise content</div>';
    }
    
    renderQuizLesson(lesson) {
        const quiz = lesson.content;
        
        return `
            <div class="quiz-lesson">
                <h3>${quiz.title}</h3>
                <p class="quiz-info">Pass with ${quiz.passingScore}% or higher</p>
                
                <div class="quiz-questions">
                    ${quiz.questions.map((q, index) => `
                        <div class="quiz-question" data-question="${index}">
                            <div class="question-header">
                                <span class="question-number">Question ${index + 1}</span>
                            </div>
                            <div class="question-text">${q.question}</div>
                            <div class="question-options">
                                ${q.options.map((option, optIndex) => `
                                    <label class="quiz-option">
                                        <input type="radio" 
                                               name="quiz_${index}" 
                                               value="${optIndex}"
                                               onchange="moduleViewer.answerQuestion(${index}, ${optIndex})">
                                        <span>${option}</span>
                                    </label>
                                `).join('')}
                            </div>
                            <div class="question-feedback" id="feedback_${index}" style="display: none;"></div>
                        </div>
                    `).join('')}
                </div>
                
                <button class="btn btn-primary" onclick="moduleViewer.submitQuiz()" id="submitQuizBtn">
                    Submit Quiz
                </button>
                
                <div id="quizResults" style="display: none;"></div>
            </div>
        `;
    }
    
    renderCaseStudyLesson(lesson) {
        const cases = lesson.content.cases || [];
        
        return `
            <div class="case-study-lesson">
                <h3>${lesson.content.title}</h3>
                
                ${cases.map((caseStudy, index) => `
                    <div class="case-study-card">
                        <h4 class="case-title">Case ${index + 1}: ${caseStudy.title}</h4>
                        
                        <div class="case-section">
                            <strong>Patient:</strong> ${caseStudy.patient}
                        </div>
                        
                        <div class="case-section">
                            <strong>Initial Plan:</strong> ${caseStudy.initialPlan}
                        </div>
                        
                        <div class="case-section challenge">
                            <strong>Challenge:</strong> ${caseStudy.challenge}
                        </div>
                        
                        <div class="case-section intervention">
                            <strong>Intervention:</strong> ${caseStudy.intervention}
                        </div>
                        
                        <div class="case-section outcome">
                            <strong>Outcome:</strong> ${caseStudy.outcome}
                        </div>
                        
                        <div class="case-lesson">
                            💡 <strong>Key Lesson:</strong> ${caseStudy.lesson}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderRoleplayLesson(lesson) {
        return `
            <div class="roleplay-lesson">
                <h3>${lesson.content.title}</h3>
                <p>Practice different communication styles</p>
                
                ${(lesson.content.styles || []).map(style => `
                    <div class="communication-style">
                        <h4>${style.type}</h4>
                        <div class="style-characteristics">
                            <strong>Characteristics:</strong>
                            <ul>
                                ${style.characteristics.map(c => `<li>${c}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="style-approach">
                            <strong>Your Approach:</strong>
                            <ul>
                                ${style.approach.map(a => `<li>${a}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="style-sample">
                            <strong>Example:</strong>
                            <div class="sample-text">"${style.sample}"</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderScenariosLesson(lesson) {
        return `
            <div class="scenarios-lesson">
                <h3>${lesson.content.title}</h3>
                
                ${(lesson.content.scenarios || []).map(scenario => `
                    <div class="scenario-card">
                        <h4 class="scenario-situation">${scenario.situation}</h4>
                        <div class="scenario-reaction">
                            <strong>Family Says:</strong> "${scenario.familyReaction}"
                        </div>
                        <div class="scenario-response">
                            <strong>Your Response:</strong>
                            <ol>
                                <li><strong>Acknowledge:</strong> "${scenario.response.acknowledge}"</li>
                                <li><strong>Action:</strong> "${scenario.response.action}"</li>
                                <li><strong>Follow-up:</strong> "${scenario.response.followUp}"</li>
                            </ol>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderDefaultLesson(lesson) {
        return `
            <div class="default-lesson">
                <p>Content for ${lesson.title}</p>
            </div>
        `;
    }
    
    getLessonTypeLabel(type) {
        const labels = {
            'interactive': '🎮 Interactive',
            'exercise': '✏️ Exercise',
            'quiz': '📝 Quiz',
            'cases': '📚 Case Studies',
            'roleplay': '🎭 Role Play',
            'scenarios': '💬 Scenarios',
            'reference': '📖 Reference'
        };
        
        return labels[type] || type;
    }
    
    initializeInteractiveElements() {
        // Initialize drag and drop
        this.initializeDragDrop();
        
        // Initialize hover tooltips
        this.initializeTooltips();
        
        // Initialize animations
        this.initializeAnimations();
    }
    
    initializeDragDrop() {
        const draggables = document.querySelectorAll('.draggable');
        const dropZones = document.querySelectorAll('.drop-zone');
        
        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', draggable.dataset.id);
                draggable.classList.add('dragging');
            });
            
            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('dragging');
            });
        });
        
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });
            
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                const scenarioId = e.dataTransfer.getData('text/plain');
                const dropArea = zone.querySelector('.drop-area');
                dropArea.textContent = scenarioId;
                dropArea.dataset.scenarioId = scenarioId;
            });
        });
    }
    
    initializeTooltips() {
        // Add hover tooltips for terms
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }
    
    initializeAnimations() {
        // Stagger animations for lesson items
        const items = document.querySelectorAll('.lesson-item');
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('fade-in');
        });
    }
    
    nextLesson() {
        // Mark current lesson complete
        const currentLessonId = this.currentModule.lessons[this.currentLesson].id;
        this.lessonProgress[currentLessonId] = true;
        
        if (this.currentLesson < this.currentModule.lessons.length - 1) {
            this.currentLesson++;
            this.showModuleInterface();
            
            // Smooth scroll to top
            document.querySelector('.lesson-main').scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    previousLesson() {
        if (this.currentLesson > 0) {
            this.currentLesson--;
            this.showModuleInterface();
        }
    }
    
    goToLesson(index) {
        this.currentLesson = index;
        this.showModuleInterface();
    }
    
    answerQuestion(questionIndex, answerIndex) {
        if (!this.quizAnswers[this.currentModule.id]) {
            this.quizAnswers[this.currentModule.id] = {};
        }
        
        this.quizAnswers[this.currentModule.id][questionIndex] = answerIndex;
    }
    
    submitQuiz() {
        const quiz = this.currentModule.lessons[this.currentLesson].content;
        const answers = this.quizAnswers[this.currentModule.id] || {};
        
        let correct = 0;
        let total = quiz.questions.length;
        
        // Check answers and show feedback
        quiz.questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correct;
            
            if (isCorrect) correct++;
            
            // Show feedback for each question
            const feedback = document.getElementById(`feedback_${index}`);
            if (feedback) {
                feedback.style.display = 'block';
                feedback.className = `question-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
                feedback.innerHTML = `
                    <strong>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</strong>
                    <p>${question.explanation}</p>
                `;
            }
        });
        
        const score = Math.round((correct / total) * 100);
        const passed = score >= quiz.passingScore;
        
        // Show results
        const resultsDiv = document.getElementById('quizResults');
        resultsDiv.style.display = 'block';
        resultsDiv.className = `quiz-results ${passed ? 'passed' : 'failed'}`;
        resultsDiv.innerHTML = `
            <div class="results-header">
                <h3>${passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}</h3>
                <div class="results-score">Score: ${score}%</div>
            </div>
            <p>${passed ? 
                'You passed! Great job mastering this material!' :
                `You scored ${score}%. Review the material and try again to pass (${quiz.passingScore}% needed).`
            }</p>
            ${passed ? `
                <button class="btn btn-success" onclick="moduleViewer.nextLesson()">
                    Continue to Next Lesson →
                </button>
            ` : `
                <button class="btn btn-primary" onclick="moduleViewer.retakeQuiz()">
                    Review & Retake Quiz
                </button>
            `}
        `;
        
        // Hide submit button
        document.getElementById('submitQuizBtn').style.display = 'none';
    }
    
    retakeQuiz() {
        // Clear answers
        this.quizAnswers[this.currentModule.id] = {};
        
        // Reset quiz display
        document.querySelectorAll('.question-feedback').forEach(f => f.style.display = 'none');
        document.querySelectorAll('input[type="radio"]').forEach(input => input.checked = false);
        document.getElementById('quizResults').style.display = 'none';
        document.getElementById('submitQuizBtn').style.display = 'block';
    }
    
    checkMatching() {
        // Check drag-and-drop matching exercise
        const dropZones = document.querySelectorAll('.drop-zone');
        const lesson = this.currentModule.lessons[this.currentLesson];
        const scenarios = lesson.content.scenarios;
        
        let allCorrect = true;
        
        dropZones.forEach(zone => {
            const dropArea = zone.querySelector('.drop-area');
            const scenarioId = dropArea.dataset.scenarioId;
            const level = zone.dataset.level;
            
            if (!scenarioId) return;
            
            const scenario = scenarios.find(s => s.id === scenarioId);
            const isCorrect = scenario && scenario.correctLevel === level;
            
            if (!isCorrect) allCorrect = false;
            
            // Show feedback
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = `drop-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
            feedbackDiv.textContent = isCorrect ? 
                `✅ ${scenario.feedback}` : 
                `❌ Not quite. ${scenario.name} needs ${scenario.correctLevel}`;
            
            zone.appendChild(feedbackDiv);
        });
        
        if (allCorrect) {
            this.showSuccess('Perfect! You matched all scenarios correctly! 🎉');
        }
    }
    
    completeModule() {
        // Mark module as complete
        this.currentModule.completed = true;
        this.currentModule.progress = 100;
        
        // Generate certificate
        const certificate = this.generateCertificate();
        
        // Show completion celebration
        this.showModuleCompletion(certificate);
        
        // Update progress
        if (window.feedbackSystem) {
            window.feedbackSystem.updateStats('modulesCompleted');
        }
        
        // Save progress
        this.saveModuleProgress();
    }
    
    generateCertificate() {
        return {
            moduleName: this.currentModule.title,
            completedDate: new Date().toLocaleDateString(),
            clinicianName: window.currentUser?.name || 'Clinician',
            certificateId: `CERT-${Date.now()}`
        };
    }
    
    showModuleCompletion(certificate) {
        const container = document.querySelector('.main-content');
        
        container.innerHTML = `
            <div class="module-completion">
                <div class="completion-animation">🎉</div>
                <h2>Module Complete!</h2>
                <h3>${this.currentModule.title}</h3>
                
                <div class="completion-stats">
                    <div class="completion-stat">
                        <span class="stat-label">Time Invested</span>
                        <span class="stat-value">${this.currentModule.duration}</span>
                    </div>
                    <div class="completion-stat">
                        <span class="stat-label">Lessons Completed</span>
                        <span class="stat-value">${this.currentModule.lessons.length}</span>
                    </div>
                    <div class="completion-stat">
                        <span class="stat-label">Knowledge Gained</span>
                        <span class="stat-value">Expert Level</span>
                    </div>
                </div>
                
                <div class="certificate-preview">
                    <h4>🏆 Certificate of Completion</h4>
                    <p>${certificate.clinicianName}</p>
                    <p>${certificate.moduleName}</p>
                    <p>${certificate.completedDate}</p>
                </div>
                
                <div class="completion-actions">
                    <button class="btn btn-secondary" onclick="moduleViewer.closeModule()">
                        Back to Learning Center
                    </button>
                    <button class="btn btn-primary" onclick="moduleViewer.nextModule()">
                        Next Module →
                    </button>
                </div>
            </div>
        `;
    }
    
    nextModule() {
        // Find next incomplete module
        const moduleIds = Object.keys(window.learningModules.modules);
        const currentIndex = moduleIds.indexOf(this.currentModule.id);
        
        for (let i = currentIndex + 1; i < moduleIds.length; i++) {
            const nextMod = window.learningModules.modules[moduleIds[i]];
            if (!nextMod.completed) {
                this.openModule(moduleIds[i]);
                return;
            }
        }
        
        // All modules complete!
        this.showAllModulesComplete();
    }
    
    showAllModulesComplete() {
        const container = document.querySelector('.main-content');
        
        container.innerHTML = `
            <div class="all-complete">
                <div class="completion-animation">👑</div>
                <h2>All Modules Complete!</h2>
                <h3>You're now a CareConnect Expert!</h3>
                
                <p>You've mastered all 5 learning modules. Your families are lucky to have such a dedicated professional!</p>
                
                <button class="btn btn-primary" onclick="switchView('profile')">
                    Start Planning! →
                </button>
            </div>
        `;
    }
    
    closeModule() {
        switchView('learn');
    }
    
    saveModuleProgress() {
        // Save to localStorage
        const progress = {
            moduleId: this.currentModule.id,
            progress: this.currentModule.progress,
            completed: this.currentModule.completed,
            lessonProgress: this.lessonProgress
        };
        
        localStorage.setItem(`module_progress_${this.currentModule.id}`, JSON.stringify(progress));
    }
    
    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
    
    showTooltip(element, text) {
        // Implementation for tooltips
    }
    
    hideTooltip() {
        // Implementation for hiding tooltips
    }
}

// Initialize module viewer globally
window.moduleViewer = new ModuleViewer();
