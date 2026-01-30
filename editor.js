// Portfolio Editor - Live customization and link generation
(function() {
    'use strict';

    // Check if URL has parameters (shared portfolio or edit token)
    const urlParams = new URLSearchParams(window.location.search);
    const portfolioId = urlParams.get('id');
    const editToken = urlParams.get('token');
    const hasSharedConfig = !!portfolioId;
    const hasEditToken = !!editToken;
    const isPublicView = hasSharedConfig && !hasEditToken; // Public view = has ID but no token
    const isEditMode = hasSharedConfig && hasEditToken; // Edit mode = has both ID and token
    
    // Store current portfolio ID and edit token
    let currentPortfolioId = portfolioId || localStorage.getItem('portfolioId') || null;
    let currentEditToken = editToken || localStorage.getItem('editToken') || null;
    
    // Save to localStorage if provided in URL
    if (portfolioId) {
        localStorage.setItem('portfolioId', portfolioId);
    }
    if (editToken) {
        localStorage.setItem('editToken', editToken);
    }

    // Declare variables that will be initialized after DOM is ready
    let currentConfig = null;
    let currentUser = null;
    let userPortfolios = [];
    let editorPanel, editorToggle, floatBtn, openEditorBtn, saveConfigBtn;
    let generateLinkBtn, downloadConfigBtn, resetConfigBtn, copyLinkBtn;
    let linkResult, generatedLink, saveNotification;
    let inputs = {};
    let addProjectBtn, projectsList;
    let projects = [];

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', async function() {
        // Now query all DOM elements
        editorPanel = document.getElementById('editorPanel');
        editorToggle = document.getElementById('editorToggle');
        floatBtn = document.getElementById('floatBtn');
        openEditorBtn = document.getElementById('openEditor');
        saveConfigBtn = document.getElementById('saveConfig');
        generateLinkBtn = document.getElementById('generateLink');
        downloadConfigBtn = document.getElementById('downloadConfig');
        resetConfigBtn = document.getElementById('resetConfig');
        copyLinkBtn = document.getElementById('copyLink');
        linkResult = document.getElementById('linkResult');
        generatedLink = document.getElementById('generatedLink');
        saveNotification = document.getElementById('saveNotification');

        // Form inputs
        inputs = {
            name: document.getElementById('edit-name'),
            title: document.getElementById('edit-title'),
            description: document.getElementById('edit-description'),
            aboutHeading: document.getElementById('edit-about-heading'),
            bio1: document.getElementById('edit-bio1'),
            bio2: document.getElementById('edit-bio2'),
            skills: document.getElementById('edit-skills'),
            email: document.getElementById('edit-email'),
            phone: document.getElementById('edit-phone'),
            location: document.getElementById('edit-location'),
            primaryColor: document.getElementById('edit-primary-color'),
            secondaryColor: document.getElementById('edit-secondary-color'),
            textColor: document.getElementById('edit-text-color'),
            bgColor: document.getElementById('edit-bg-color'),
            heroColor1: document.getElementById('edit-hero-color1'),
            heroColor2: document.getElementById('edit-hero-color2'),
            heroImage: document.getElementById('edit-hero-image')
        };

        // Projects management
        addProjectBtn = document.getElementById('addProjectBtn');
        projectsList = document.getElementById('projectsList');
        
        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', addNewProject);
        }

        // Load configuration and initialize
        currentConfig = await loadConfiguration();
        window.currentConfig = currentConfig;
        await checkAuth();
        init();
        
        // Set up UI after init
        setupOnboarding();
        setupTabs();
        setupColorListeners();
    });

    // Check authentication status
    async function checkAuth() {
        try {
            const response = await fetch('/api/auth?action=session');
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    currentUser = data.user;
                    updateUserUI();
                    // Load user's portfolios
                    await loadUserPortfolios();
                    return true;
                }
            }
        } catch (error) {
            console.log('Not authenticated:', error);
        }
        
        // Allow anonymous access if user has edit token
        if (hasEditToken || currentEditToken) {
            console.log('Anonymous mode with edit token');
            updateAnonymousUI();
            return true;
        }
        
        // Allow access without authentication (anonymous portfolio creation)
        console.log('Anonymous mode - new portfolio');
        updateAnonymousUI();
        return true;
    }

    // Update user UI for authenticated users
    function updateUserUI() {
        if (currentUser) {
            const userInfo = document.getElementById('userInfo');
            const userAvatar = document.getElementById('userAvatar');
            const userName = document.getElementById('userName');
            
            if (userInfo && userAvatar && userName) {
                userInfo.style.display = 'flex';
                userInfo.style.alignItems = 'center';
                userAvatar.src = currentUser.picture || '';
                userName.textContent = currentUser.name || currentUser.email;
            }
        }
    }
    
    // Update UI for anonymous users
    function updateAnonymousUI() {
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.style.alignItems = 'center';
            userInfo.innerHTML = `
                <span style="font-size: 0.9rem; color: #64748b; margin-right: 8px;">Anonymous</span>
                <a href="/auth.html" style="font-size: 0.85rem; color: #6366f1; text-decoration: none;">Sign in to save</a>
            `;
        }
    }

    // Load user's portfolio list
    async function loadUserPortfolios() {
        try {
            const response = await fetch('/api/list-portfolios');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    userPortfolios = data.portfolios;
                }
            }
        } catch (error) {
            console.error('Failed to load user portfolios:', error);
        }
    }

    // Onboarding
    let currentStep = 0;
    let onboardingTooltip, onboardingHighlight, restartTourBtn;
    
    const onboardingSteps = [
        {
            title: "Welcome to Craftfolio!",
            text: "Edit your portfolio details in the sidebar. Everything updates live on the right.",
            target: ".editor-panel",
            position: "left"
        },
        {
            title: "Live Preview",
            text: "Watch your changes appear instantly here. What you see is what you get.",
            target: "#preview",
            position: "right"
        },
        {
            title: "Generate Your Link",
            text: "When you're ready, click this button to get a shareable link to your portfolio.",
            target: "#generateLink",
            position: "top"
        }
    ];

    function setupOnboarding() {
        onboardingTooltip = document.getElementById('onboardingTooltip');
        onboardingHighlight = document.getElementById('onboardingHighlight');
        restartTourBtn = document.getElementById('restartTourBtn');
        
        // Show onboarding if first visit and not in public view mode
        if (!isPublicView && !localStorage.getItem('onboardingCompleted')) {
            setTimeout(() => showOnboarding(), 800);
        } else {
            // Show restart tour button if onboarding was completed
            if (localStorage.getItem('onboardingCompleted') && restartTourBtn) {
                restartTourBtn.classList.remove('hidden');
            }
        }
    }
    
    function showOnboarding() {
        currentStep = 0;
        showStep(currentStep);
        if (restartTourBtn) {
            restartTourBtn.classList.add('hidden');
        }
    }
    
    function showStep(stepIndex) {
        if (stepIndex >= onboardingSteps.length) {
            closeOnboarding();
            return;
        }
        
        const step = onboardingSteps[stepIndex];
        const targetElement = document.querySelector(step.target);
        
        if (!targetElement) {
            console.warn('Onboarding target not found:', step.target);
            // Try next step after a delay
            setTimeout(() => {
                currentStep++;
                if (currentStep < onboardingSteps.length) {
                    showStep(currentStep);
                } else {
                    closeOnboarding();
                }
            }, 500);
            return;
        }
        
        // Update tooltip content
        document.getElementById('onboardingTitle').textContent = step.title;
        document.getElementById('onboardingText').textContent = step.text;
        document.getElementById('onboardingBtnText').textContent = stepIndex < onboardingSteps.length - 1 ? 'Next' : 'Done';
        
        // Update step indicators
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === stepIndex);
            dot.classList.toggle('completed', i < stepIndex);
        });
        
        // Position tooltip and highlight
        setTimeout(() => {
            positionTooltip(targetElement, step.position);
            highlightElement(targetElement);
        }, 50);
        
        // Show tooltip
        if (onboardingTooltip) {
            onboardingTooltip.classList.remove('hidden');
        }
    }
    
    function positionTooltip(targetElement, position) {
        if (!targetElement || !onboardingTooltip) return;
        
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = onboardingTooltip.getBoundingClientRect();
        const offset = 20;
        
        let top, left;
        
        switch(position) {
            case 'left':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left - tooltipRect.width - offset;
                break;
            case 'right':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + offset;
                break;
            case 'top':
                top = rect.top - tooltipRect.height - offset;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = rect.bottom + offset;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
        }
        
        // Keep tooltip in viewport
        top = Math.max(20, Math.min(top, window.innerHeight - tooltipRect.height - 20));
        left = Math.max(20, Math.min(left, window.innerWidth - tooltipRect.width - 20));
        
        onboardingTooltip.style.top = top + 'px';
        onboardingTooltip.style.left = left + 'px';
    }
    
    function highlightElement(element) {
        if (!element || !onboardingHighlight) return;
        
        const rect = element.getBoundingClientRect();
        
        onboardingHighlight.style.top = (rect.top - 8) + 'px';
        onboardingHighlight.style.left = (rect.left - 8) + 'px';
        onboardingHighlight.style.width = (rect.width + 16) + 'px';
        onboardingHighlight.style.height = (rect.height + 16) + 'px';
        onboardingHighlight.classList.remove('hidden');
    }
    
    window.nextOnboardingStep = function() {
        currentStep++;
        if (currentStep < onboardingSteps.length) {
            showStep(currentStep);
        } else {
            closeOnboarding();
        }
    };
    
    window.skipOnboarding = function() {
        closeOnboarding();
    };
    
    window.restartOnboarding = function() {
        showOnboarding();
    };
    
    window.closeOnboarding = function() {
        if (onboardingTooltip) {
            onboardingTooltip.classList.add('hidden');
        }
        if (onboardingHighlight) {
            onboardingHighlight.classList.add('hidden');
        }
        if (restartTourBtn) {
            restartTourBtn.classList.remove('hidden');
        }
        localStorage.setItem('onboardingCompleted', 'true');
    };

    // Tab functionality
    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // Update buttons
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update content
                tabContents.forEach(content => {
                    if (content.dataset.content === tabName) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
            });
        });
    }
    
    // Color input listeners
    function setupColorListeners() {
        const primaryColorInput = document.getElementById('edit-primary-color');
        const secondaryColorInput = document.getElementById('edit-secondary-color');
        const textColorInput = document.getElementById('edit-text-color');
        const bgColorInput = document.getElementById('edit-bg-color');
        const heroColor1Input = document.getElementById('edit-hero-color1');
        const heroColor2Input = document.getElementById('edit-hero-color2');
        const heroImageInput = document.getElementById('edit-hero-image');
        const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (primaryColorInput) {
        const primaryValue = primaryColorInput.nextElementSibling;
        primaryColorInput.addEventListener('input', (e) => {
            if (primaryValue) primaryValue.textContent = e.target.value;
            currentConfig.colors.primary = e.target.value;
            applyConfiguration();
        });
    }
    
    if (secondaryColorInput) {
        const secondaryValue = secondaryColorInput.nextElementSibling;
        secondaryColorInput.addEventListener('input', (e) => {
            if (secondaryValue) secondaryValue.textContent = e.target.value;
            currentConfig.colors.secondary = e.target.value;
            applyConfiguration();
        });
    }
    
    if (textColorInput) {
        const textValue = textColorInput.nextElementSibling;
        textColorInput.addEventListener('input', (e) => {
            if (textValue) textValue.textContent = e.target.value;
            currentConfig.colors.text = e.target.value;
            applyConfiguration();
        });
    }
    
    if (bgColorInput) {
        const bgValue = bgColorInput.nextElementSibling;
        bgColorInput.addEventListener('input', (e) => {
            if (bgValue) bgValue.textContent = e.target.value;
            currentConfig.colors.background = e.target.value;
            applyConfiguration();
        });
    }
    
    if (heroColor1Input) {
        const heroColor1Value = heroColor1Input.nextElementSibling;
        heroColor1Input.addEventListener('input', (e) => {
            if (heroColor1Value) heroColor1Value.textContent = e.target.value;
            currentConfig.colors.heroColor1 = e.target.value;
            applyConfiguration();
        });
    }
    
    if (heroColor2Input) {
        const heroColor2Value = heroColor2Input.nextElementSibling;
        heroColor2Input.addEventListener('input', (e) => {
            if (heroColor2Value) heroColor2Value.textContent = e.target.value;
            currentConfig.colors.heroColor2 = e.target.value;
            applyConfiguration();
        });
    }
    
    if (heroImageInput) {
        heroImageInput.addEventListener('input', (e) => {
            currentConfig.heroImage = e.target.value;
            applyConfiguration();
        });
    }
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            currentConfig.darkMode = e.target.checked;
            if (e.target.checked) {
                // Set dark mode colors if not customized
                if (!currentConfig.colors.text || currentConfig.colors.text === '#374151') {
                    currentConfig.colors.text = '#e5e7eb';
                    if (textColorInput) {
                        textColorInput.value = '#e5e7eb';
                        if (textColorInput.nextElementSibling) {
                            textColorInput.nextElementSibling.textContent = '#e5e7eb';
                        }
                    }
                }
                if (!currentConfig.colors.background || currentConfig.colors.background === '#ffffff') {
                    currentConfig.colors.background = '#111827';
                    if (bgColorInput) {
                        bgColorInput.value = '#111827';
                        if (bgColorInput.nextElementSibling) {
                            bgColorInput.nextElementSibling.textContent = '#111827';
                        }
                    }
                }
            } else {
                // Reset to light mode colors
                if (currentConfig.colors.text === '#e5e7eb') {
                    currentConfig.colors.text = '#374151';
                    if (textColorInput) {
                        textColorInput.value = '#374151';
                        if (textColorInput.nextElementSibling) {
                            textColorInput.nextElementSibling.textContent = '#374151';
                        }
                    }
                }
                if (currentConfig.colors.background === '#111827') {
                    currentConfig.colors.background = '#ffffff';
                    if (bgColorInput) {
                        bgColorInput.value = '#ffffff';
                        if (bgColorInput.nextElementSibling) {
                            bgColorInput.nextElementSibling.textContent = '#ffffff';
                        }
                    }
                }
            }
            applyConfiguration();
        });
    }
    } // End of setupColorListeners

    // Initialize
    function init() {
        populateForm();
        applyConfiguration();
        
        // Show user info if authenticated
        if (currentUser) {
            showUserInfo();
            renderPortfoliosList();
        }
        
        // Hide editor only for public view (ID without token)
        // If user has edit token, show the editor for editing
        if (isPublicView) {
            editorPanel.style.display = 'none';
            floatBtn.style.display = 'none';
            document.body.classList.add('editor-collapsed');
            if (openEditorBtn) {
                openEditorBtn.style.display = 'none';
            }
            // Update badge to show it's a portfolio
            const badge = document.querySelector('.template-badge span');
            if (badge) {
                badge.textContent = 'Portfolio';
            }
        } else {
            // Editor is open by default for new portfolios or edit mode
            document.body.classList.remove('editor-collapsed');
            attachEventListeners();
        }
    }

    // Load configuration
    async function loadConfiguration() {
        // First, check if there's a portfolio ID (from URL or localStorage)
        if (currentPortfolioId) {
            try {
                const response = await fetch(`/api/get-portfolio?id=${currentPortfolioId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.config) {
                        return data.config;
                    }
                }
            } catch (e) {
                console.error('Failed to load portfolio from database:', e);
            }
        }

        // Fallback to localStorage
        const saved = localStorage.getItem('portfolioConfig');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Invalid saved configuration');
            }
        }

        // Default configuration
        return {
            name: "Your Name",
            title: "Creative Designer & Developer",
            description: "Crafting beautiful digital experiences through design and code",
            about: {
                heading: "Creative Professional",
                bio: [
                    "I'm a passionate creative professional with expertise in design and development. I love bringing ideas to life through innovative solutions and beautiful designs.",
                    "With years of experience in the creative industry, I've worked on diverse projects ranging from branding to web development, always pushing the boundaries of what's possible."
                ],
                skills: ["UI/UX Design", "Web Development", "Graphic Design", "Branding", "Photography", "Video Editing"]
            },
            contact: {
                email: "your.email@example.com",
                phone: "+123 456 7890",
                location: "Your City, Country"
            },
            colors: {
                primary: "#6366f1",
                secondary: "#8b5cf6",
                text: "#374151",
                background: "#ffffff",
                heroColor1: "#667eea",
                heroColor2: "#764ba2"
            },
            darkMode: false,
            heroImage: "",
            projects: []
        };
    }

    // Populate form with current configuration
    function populateForm() {
        inputs.name.value = currentConfig.name;
        inputs.title.value = currentConfig.title;
        inputs.description.value = currentConfig.description;
        inputs.aboutHeading.value = currentConfig.about.heading;
        inputs.bio1.value = currentConfig.about.bio[0];
        inputs.bio2.value = currentConfig.about.bio[1];
        inputs.skills.value = currentConfig.about.skills.join(', ');
        inputs.email.value = currentConfig.contact.email;
        inputs.phone.value = currentConfig.contact.phone;
        inputs.location.value = currentConfig.contact.location;
        inputs.primaryColor.value = currentConfig.colors.primary;
        inputs.secondaryColor.value = currentConfig.colors.secondary;
        inputs.textColor.value = currentConfig.colors.text || '#374151';
        inputs.bgColor.value = currentConfig.colors.background || '#ffffff';
        inputs.heroColor1.value = currentConfig.colors.heroColor1 || '#667eea';
        inputs.heroColor2.value = currentConfig.colors.heroColor2 || '#764ba2';
        inputs.heroImage.value = currentConfig.heroImage || '';
        
        // Update color value displays
        if (inputs.primaryColor.nextElementSibling) {
            inputs.primaryColor.nextElementSibling.textContent = currentConfig.colors.primary;
        }
        if (inputs.secondaryColor.nextElementSibling) {
            inputs.secondaryColor.nextElementSibling.textContent = currentConfig.colors.secondary;
        }
        if (inputs.textColor.nextElementSibling) {
            inputs.textColor.nextElementSibling.textContent = currentConfig.colors.text || '#374151';
        }
        if (inputs.bgColor.nextElementSibling) {
            inputs.bgColor.nextElementSibling.textContent = currentConfig.colors.background || '#ffffff';
        }
        if (inputs.heroColor1.nextElementSibling) {
            inputs.heroColor1.nextElementSibling.textContent = currentConfig.colors.heroColor1 || '#667eea';
        }
        if (inputs.heroColor2.nextElementSibling) {
            inputs.heroColor2.nextElementSibling.textContent = currentConfig.colors.heroColor2 || '#764ba2';
        }
        if (inputs.bgColor.nextElementSibling) {
            inputs.bgColor.nextElementSibling.textContent = currentConfig.colors.background || '#ffffff';
        }
        
        // Set dark mode toggle
        if (darkModeToggle) {
            darkModeToggle.checked = currentConfig.darkMode || false;
        }
        
        // Show hero image preview if exists
        if (currentConfig.heroImage && currentConfig.heroImage.trim() !== '') {
            const previewContainer = document.getElementById('hero-image-preview');
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <div class="image-preview" style="margin-top: 0.75rem; position: relative;">
                        <img src="${currentConfig.heroImage}" alt="Hero preview" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px;">
                        <button class="remove-image" onclick="removeHeroImage()" style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem;">Remove</button>
                    </div>
                `;
            }
        }
    }
    
    // Expose for templates
    window.populateForm = populateForm;

    // Apply configuration to the page
    function applyConfiguration() {
        // Update personal info
        document.querySelector('.hero-title .name').textContent = currentConfig.name;
        document.querySelector('.hero-subtitle').textContent = currentConfig.title;
        document.querySelector('.hero-description').textContent = currentConfig.description;
        
        // Update about section
        document.querySelector('.about-text h3').textContent = currentConfig.about.heading;
        const aboutParagraphs = document.querySelectorAll('.about-text p');
        aboutParagraphs[0].textContent = currentConfig.about.bio[0];
        aboutParagraphs[1].textContent = currentConfig.about.bio[1];
        
        // Update skills
        const skillsContainer = document.querySelector('.skill-tags');
        skillsContainer.innerHTML = '';
        currentConfig.about.skills.forEach(skill => {
            const skillTag = document.createElement('span');
            skillTag.className = 'skill-tag';
            skillTag.textContent = skill;
            skillsContainer.appendChild(skillTag);
        });
        
        // Update contact info
        const contactItems = document.querySelectorAll('.contact-item');
        if (contactItems[0]) {
            contactItems[0].querySelector('p a').href = `mailto:${currentConfig.contact.email}`;
            contactItems[0].querySelector('p a').textContent = currentConfig.contact.email;
        }
        if (contactItems[1]) {
            contactItems[1].querySelector('p a').href = `tel:${currentConfig.contact.phone.replace(/\s/g, '')}`;
            contactItems[1].querySelector('p a').textContent = currentConfig.contact.phone;
        }
        if (contactItems[2]) {
            contactItems[2].querySelector('p').textContent = currentConfig.contact.location;
        }
        
        // Update footer
        document.querySelector('.footer p').textContent = `© ${new Date().getFullYear()} ${currentConfig.name}. All rights reserved.`;
        
        // Update projects
        const portfolioGrid = document.querySelector('.portfolio-grid');
        if (portfolioGrid && currentConfig.projects) {
            portfolioGrid.innerHTML = '';
            currentConfig.projects.forEach(project => {
                const projectCard = document.createElement('div');
                projectCard.className = 'portfolio-item';
                
                const imageHtml = project.image 
                    ? `<img src="${project.image}" alt="${project.title}">`
                    : `<div class="project-placeholder" style="background: linear-gradient(135deg, ${currentConfig.colors.primary} 0%, ${currentConfig.colors.secondary} 100%);"></div>`;
                
                const linkAttr = project.link && project.link !== '#' 
                    ? `href="${project.link}" target="_blank" rel="noopener noreferrer"` 
                    : 'href="#"';
                
                projectCard.innerHTML = `
                    <a ${linkAttr}>
                        <div class="portfolio-image">
                            ${imageHtml}
                            <div class="portfolio-overlay">
                                <span class="view-project">View Project →</span>
                            </div>
                        </div>
                        <div class="portfolio-info">
                            <h3>${project.title || 'Untitled Project'}</h3>
                            <p>${project.category || 'Uncategorized'}</p>
                        </div>
                    </a>
                `;
                
                portfolioGrid.appendChild(projectCard);
            });
        }
        
        // Apply colors
        document.documentElement.style.setProperty('--primary-color', currentConfig.colors.primary);
        document.documentElement.style.setProperty('--secondary-color', currentConfig.colors.secondary);
        
        // Apply hero colors and image
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            const heroColor1 = currentConfig.colors.heroColor1 || '#667eea';
            const heroColor2 = currentConfig.colors.heroColor2 || '#764ba2';
            
            if (currentConfig.heroImage && currentConfig.heroImage.trim() !== '') {
                heroSection.style.background = `linear-gradient(135deg, ${heroColor1}cc 0%, ${heroColor2}cc 100%), url('${currentConfig.heroImage}')`;
                heroSection.style.backgroundSize = 'cover';
                heroSection.style.backgroundPosition = 'center';
                heroSection.style.backgroundBlendMode = 'multiply';
            } else {
                heroSection.style.background = `linear-gradient(135deg, ${heroColor1} 0%, ${heroColor2} 100%)`;
                heroSection.style.backgroundSize = '';
                heroSection.style.backgroundPosition = '';
                heroSection.style.backgroundBlendMode = '';
            }
        }
        
        // Apply dark mode class first
        if (currentConfig.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Apply custom colors (these override dark mode defaults)
        const textColor = currentConfig.colors.text || (currentConfig.darkMode ? '#e5e7eb' : '#374151');
        const bgColor = currentConfig.colors.background || (currentConfig.darkMode ? '#111827' : '#ffffff');
        
        document.documentElement.style.setProperty('--text-color', textColor);
        document.documentElement.style.setProperty('--bg-color', bgColor);
        document.body.style.backgroundColor = bgColor;
        document.body.style.color = textColor;
        
        // Apply to all sections
        const sections = document.querySelectorAll('.about, .portfolio, .contact');
        sections.forEach(section => {
            if (currentConfig.darkMode) {
                section.style.backgroundColor = bgColor === '#111827' ? '#1f2937' : bgColor;
            } else {
                section.style.backgroundColor = bgColor === '#ffffff' ? '#f9fafb' : bgColor;
            }
        });
        
        // Update text colors
        document.querySelectorAll('.about-text p, .portfolio-info p, .contact-item p').forEach(el => {
            el.style.color = textColor;
        });
    }
    
    // Expose for templates
    window.applyConfiguration = applyConfiguration;

    // Update configuration from form inputs
    function updateConfiguration() {
        currentConfig = {
            name: inputs.name.value,
            title: inputs.title.value,
            description: inputs.description.value,
            about: {
                heading: inputs.aboutHeading.value,
                bio: [
                    inputs.bio1.value,
                    inputs.bio2.value
                ],
                skills: inputs.skills.value.split(',').map(s => s.trim()).filter(s => s)
            },
            contact: {
                email: inputs.email.value,
                phone: inputs.phone.value,
                location: inputs.location.value
            },
            colors: {
                primary: inputs.primaryColor.value,
                secondary: inputs.secondaryColor.value,
                text: inputs.textColor.value,
                background: inputs.bgColor.value,
                heroColor1: inputs.heroColor1.value,
                heroColor2: inputs.heroColor2.value
            },
            heroImage: inputs.heroImage.value,
            darkMode: darkModeToggle ? darkModeToggle.checked : false,
            projects: currentConfig.projects || []
        };

        // Save to localStorage
        localStorage.setItem('portfolioConfig', JSON.stringify(currentConfig));
        
        // Apply changes immediately
        applyConfiguration();
    }

    // Attach event listeners
    function attachEventListeners() {
        // Toggle editor
        if (editorToggle) {
            editorToggle.addEventListener('click', toggleEditor);
        }
        if (floatBtn) {
            floatBtn.addEventListener('click', toggleEditor);
        }
        if (openEditorBtn) {
            openEditorBtn.addEventListener('click', () => {
                editorPanel.classList.remove('collapsed');
                floatBtn.style.display = 'none';
            });
        }

        // Save configuration
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', saveConfiguration);
        }

        // Live updates as user types
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', updateConfiguration);
        });

        // Generate shareable link
        if (generateLinkBtn) {
            generateLinkBtn.addEventListener('click', generateShareableLink);
        }

        // Download config
        if (downloadConfigBtn) {
            downloadConfigBtn.addEventListener('click', downloadConfiguration);
        }

        // Reset config
        if (resetConfigBtn) {
            resetConfigBtn.addEventListener('click', resetConfiguration);
        }

        // Copy link
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', copyToClipboard);
        }
        
        // New Portfolio button
        const newPortfolioBtn = document.getElementById('newPortfolioBtn');
        if (newPortfolioBtn) {
            newPortfolioBtn.addEventListener('click', () => {
                if (confirm('Create a new portfolio? Current unsaved changes will be lost.')) {
                    localStorage.removeItem('portfolioId');
                    localStorage.removeItem('editToken');
                    window.location.href = '/editor.html';
                }
            });
        }
        
        // Sign out button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn && currentUser) {
            signOutBtn.style.display = 'block';
            signOutBtn.addEventListener('click', signOut);
        }
    }

    // Toggle editor panel
    function toggleEditor() {
        editorPanel.classList.toggle('collapsed');
        document.body.classList.toggle('editor-collapsed', editorPanel.classList.contains('collapsed'));
        floatBtn.style.display = editorPanel.classList.contains('collapsed') ? 'block' : 'none';
    }

    // Generate shareable link
    async function generateShareableLink() {
        // First save to get/create portfolio ID
        if (!currentPortfolioId) {
            await saveConfiguration();
        }
        
        // If we just created a new portfolio, the modal was already shown
        // Otherwise, show the links modal for existing portfolio
        if (currentPortfolioId && currentEditToken) {
            showEditLinkModal(currentPortfolioId, currentEditToken);
        } else if (currentPortfolioId) {
            // For authenticated users without edit token, just show public link
            const baseUrl = window.location.origin;
            const publicLink = `${baseUrl}/p/${currentPortfolioId}`;
            showPublicLinkModal(publicLink);
        }
    }

    // Save configuration
    async function saveConfiguration() {
        try {
            // Save to API
            const response = await fetch('/api/save-portfolio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    portfolioId: currentPortfolioId,
                    config: currentConfig,
                    editToken: currentEditToken
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.portfolioId) {
                    currentPortfolioId = data.portfolioId;
                    localStorage.setItem('portfolioId', currentPortfolioId);
                    
                    // Store edit token if this is a new portfolio
                    if (data.isNew && data.editToken) {
                        currentEditToken = data.editToken;
                        localStorage.setItem('editToken', data.editToken);
                        
                        // Show edit link modal for first-time save
                        showEditLinkModal(currentPortfolioId, currentEditToken);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to save to database:', error);
        }

        // Also save to localStorage as backup
        localStorage.setItem('portfolioConfig', JSON.stringify(currentConfig));
        
        // Auto-regenerate the shareable link if it was previously generated
        if (linkResult && linkResult.style.display === 'block') {
            await generateShareableLink();
        }
        
        // Show save notification
        if (saveNotification) {
            saveNotification.classList.add('show');
            saveNotification.style.display = 'flex';
            
            // Hide after 3 seconds
            setTimeout(() => {
                saveNotification.classList.remove('show');
                setTimeout(() => {
                    saveNotification.style.display = 'none';
                }, 300);
            }, 3000);
        }
    }

    // Download configuration as JSON
    function downloadConfiguration() {
        const dataStr = JSON.stringify(currentConfig, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'portfolio-config.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Reset to default configuration
    function resetConfiguration() {
        if (confirm('Reset to default configuration? This will clear your changes.')) {
            localStorage.removeItem('portfolioConfig');
            currentConfig = loadConfiguration();
            populateForm();
            applyConfiguration();
            linkResult.style.display = 'none';
        }
    }

    // Copy link to clipboard
    function copyToClipboard() {
        generatedLink.select();
        document.execCommand('copy');
        
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            copyLinkBtn.textContent = originalText;
        }, 2000);
    }

    // ===== PROJECTS MANAGEMENT =====
    
    function addNewProject() {
        const projectId = Date.now();
        const project = {
            id: projectId,
            title: '',
            category: '',
            image: '',
            link: ''
        };
        
        projects.push(project);
        renderProject(project, projects.length - 1);
        updateProjectsInConfig();
    }
    
    function renderProject(project, index) {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        projectItem.dataset.projectId = project.id;
        
        projectItem.innerHTML = `
            <div class="project-header">
                <span class="project-number">Project ${index + 1}</span>
                <div class="project-actions">
                    <button class="btn-icon toggle" onclick="toggleProject(${project.id})" title="Collapse/Expand">−</button>
                    <button class="btn-icon delete" onclick="deleteProject(${project.id})" title="Delete">×</button>
                </div>
            </div>
            <div class="project-fields">
                <div class="form-group">
                    <label>Project Title</label>
                    <input type="text" class="project-title" value="${project.title}" placeholder="My Awesome Project" onchange="updateProject(${project.id})">
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" class="project-category" value="${project.category}" placeholder="Web Design, Branding, etc." onchange="updateProject(${project.id})">
                </div>
                <div class="form-group">
                    <label>Project Image</label>
                    <div class="image-upload-area">
                        <input type="file" accept="image/*" class="project-image-input" onchange="handleImageUpload(${project.id}, event)">
                        <div class="upload-placeholder">
                            <div class="upload-icon">📷</div>
                            <div>Click to upload or paste image URL below</div>
                        </div>
                    </div>
                    <input type="url" class="project-image-url" value="${project.image}" placeholder="Or paste image URL here" onchange="updateProject(${project.id})" style="margin-top: 0.5rem;">
                    ${project.image ? `<div class="image-preview"><img src="${project.image}" alt="Preview"><button class="remove-image" onclick="removeProjectImage(${project.id})">Remove</button></div>` : ''}
                </div>
                <div class="form-group">
                    <label>Project Link (optional)</label>
                    <input type="url" class="project-link" value="${project.link}" placeholder="https://example.com" onchange="updateProject(${project.id})">
                </div>
            </div>
        `;
        
        projectsList.appendChild(projectItem);
    }
    
    window.updateProject = function(projectId) {
        const projectItem = document.querySelector(`[data-project-id="${projectId}"]`);
        const project = projects.find(p => p.id === projectId);
        
        if (project && projectItem) {
            project.title = projectItem.querySelector('.project-title').value;
            project.category = projectItem.querySelector('.project-category').value;
            project.image = projectItem.querySelector('.project-image-url').value;
            project.link = projectItem.querySelector('.project-link').value;
            
            updateProjectsInConfig();
            applyConfiguration();
        }
    };
    
    window.toggleProject = function(projectId) {
        const projectItem = document.querySelector(`[data-project-id="${projectId}"]`);
        const toggleBtn = projectItem.querySelector('.toggle');
        
        if (projectItem.classList.contains('collapsed')) {
            projectItem.classList.remove('collapsed');
            toggleBtn.textContent = '−';
        } else {
            projectItem.classList.add('collapsed');
            toggleBtn.textContent = '+';
        }
    };
    
    window.deleteProject = function(projectId) {
        if (confirm('Delete this project?')) {
            projects = projects.filter(p => p.id !== projectId);
            const projectItem = document.querySelector(`[data-project-id="${projectId}"]`);
            projectItem.remove();
            
            // Renumber remaining projects
            document.querySelectorAll('.project-item').forEach((item, index) => {
                item.querySelector('.project-number').textContent = `Project ${index + 1}`;
            });
            
            updateProjectsInConfig();
            applyConfiguration();
        }
    };
    
    window.handleImageUpload = function(projectId, event) {
        const file = event.target.files[0];
        if (file) {
            // Check file size (warn if > 100KB)
            if (file.size > 102400) {
                alert('⚠️ Large images may create URLs that are too long to share.\n\nTip: Use a smaller image or host it online and paste the URL instead.');
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                const projectItem = document.querySelector(`[data-project-id="${projectId}"]`);
                const imageUrlInput = projectItem.querySelector('.project-image-url');
                imageUrlInput.value = e.target.result;
                
                // Add preview
                const existingPreview = projectItem.querySelector('.image-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button class="remove-image" onclick="removeProjectImage(${projectId})">Remove</button>
                `;
                projectItem.querySelector('.image-upload-area').parentNode.appendChild(preview);
                
                updateProject(projectId);
            };
            reader.readAsDataURL(file);
        }
    };
    
    window.removeProjectImage = function(projectId) {
        const projectItem = document.querySelector(`[data-project-id="${projectId}"]`);
        const imageUrlInput = projectItem.querySelector('.project-image-url');
        imageUrlInput.value = '';
        
        const preview = projectItem.querySelector('.image-preview');
        if (preview) {
            preview.remove();
        }
        
        updateProject(projectId);
    };
    
    // Handle hero image upload
    window.handleHeroImageUpload = function(event) {
        const file = event.target.files[0];
        if (file) {
            // Check file size (warn if > 100KB)
            if (file.size > 102400) {
                alert('⚠️ Large images may create URLs that are too long to share.\n\nTip: Use a smaller image or host it online and paste the URL instead.');
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                const heroImageInput = document.getElementById('edit-hero-image');
                heroImageInput.value = e.target.result;
                
                // Update config and preview
                currentConfig.heroImage = e.target.result;
                applyConfiguration();
                
                // Show preview
                const previewContainer = document.getElementById('hero-image-preview');
                previewContainer.innerHTML = `
                    <div class="image-preview" style="margin-top: 0.75rem;">
                        <img src="${e.target.result}" alt="Hero preview" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px;">
                        <button class="remove-image" onclick="removeHeroImage()" style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem;">Remove</button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }
    };
    
    window.removeHeroImage = function() {
        const heroImageInput = document.getElementById('edit-hero-image');
        heroImageInput.value = '';
        currentConfig.heroImage = '';
        applyConfiguration();
        
        const previewContainer = document.getElementById('hero-image-preview');
        previewContainer.innerHTML = '';
        
        // Reset file input
        const fileInput = document.getElementById('hero-image-file');
        if (fileInput) {
            fileInput.value = '';
        }
    };
    
    function updateProjectsInConfig() {
        currentConfig.projects = projects.map(p => ({
            title: p.title,
            category: p.category,
            image: p.image,
            link: p.link || '#'
        }));
        
        localStorage.setItem('portfolioConfig', JSON.stringify(currentConfig));
    }
    
    function loadProjects() {
        if (currentConfig.projects && Array.isArray(currentConfig.projects)) {
            projects = currentConfig.projects.map((p, index) => ({
                id: Date.now() + index,
                title: p.title || '',
                category: p.category || '',
                image: p.image || '',
                link: p.link || ''
            }));
            
            projectsList.innerHTML = '';
            projects.forEach((project, index) => {
                renderProject(project, index);
            });
        }
    }
    
    // Load projects when initializing
    if (projectsList && !isPublicView) {
        loadProjects();
    }

    // Auth UI Functions
    function showUserInfo() {
        if (!currentUser) return;
        
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const signOutBtn = document.getElementById('signOutBtn');
        
        if (userInfo && userName) {
            userName.textContent = currentUser.name || currentUser.email;
            if (userAvatar && currentUser.image) {
                userAvatar.src = currentUser.image;
                userAvatar.style.display = 'inline-block';
            }
            userInfo.style.display = 'flex';
            userInfo.style.alignItems = 'center';
        }
        
        if (signOutBtn) {
            signOutBtn.style.display = 'inline-block';
            signOutBtn.addEventListener('click', signOut);
        }
    }
    
    function signOut() {
        if (confirm('Sign out? Your portfolios will remain saved in your account.')) {
            window.location.href = '/api/auth/signout?callbackUrl=/';
        }
    }
    
    // Show edit link modal for new portfolios
    function showEditLinkModal(portfolioId, editToken) {
        const baseUrl = window.location.origin;
        const publicLink = `${baseUrl}/p/${portfolioId}`;
        const editLink = `${baseUrl}/editor.html?id=${portfolioId}&token=${editToken}`;
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'linksModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; max-width: 600px; width: 100%;">
                <h2 style="margin: 0 0 16px 0; color: #0f172a;">🎉 Portfolio Saved!</h2>
                <p style="margin: 0 0 24px 0; color: #64748b;">Your portfolio has been created. Here are your important links:</p>
                
                <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 2px solid #e5e7eb;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #0f172a; font-size: 0.9rem;">📱 Public Link (Share this)</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" value="${publicLink}" readonly style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: monospace; font-size: 0.85rem;">
                        <button class="copy-public-link" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap;">Copy</button>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px; padding: 16px; background: #fef3c7; border-radius: 8px; border: 2px solid #fbbf24;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #92400e; font-size: 0.9rem;">✏️ Edit Link (Keep this private!)</label>
                    <p style="margin: 0 0 12px 0; font-size: 0.85rem; color: #92400e;">⚠️ Anyone with this link can edit your portfolio. Save it somewhere safe!</p>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" value="${editLink}" readonly style="flex: 1; padding: 10px; border: 1px solid #fbbf24; border-radius: 6px; font-family: monospace; font-size: 0.75rem; background: white;">
                        <button class="copy-edit-link" style="padding: 10px 20px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap;">Copy</button>
                    </div>
                </div>
                
                <button class="close-modal-btn" style="width: 100%; padding: 14px; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                    Got it!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Copy buttons handlers
        modal.querySelector('.copy-public-link').addEventListener('click', function() {
            navigator.clipboard.writeText(publicLink);
            this.textContent = 'Copied!';
            setTimeout(() => this.textContent = 'Copy', 2000);
        });
        
        modal.querySelector('.copy-edit-link').addEventListener('click', function() {
            navigator.clipboard.writeText(editLink);
            this.textContent = 'Copied!';
            setTimeout(() => this.textContent = 'Copy', 2000);
        });
        
        // Close modal handler
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Show public link only modal (for authenticated users)
    function showPublicLinkModal(publicLink) {
        const modal = document.createElement('div');
        modal.id = 'publicLinkModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 32px; max-width: 500px; width: 100%;">
                <h2 style="margin: 0 0 16px 0; color: #0f172a;">🎉 Portfolio Ready!</h2>
                <p style="margin: 0 0 24px 0; color: #64748b;">Share this link to show your portfolio:</p>
                
                <div style="margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 2px solid #e5e7eb;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #0f172a; font-size: 0.9rem;">📱 Public Link</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" value="${publicLink}" readonly style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: monospace; font-size: 0.85rem;">
                        <button class="copy-link-btn" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap;">Copy</button>
                    </div>
                </div>
                
                <button class="close-modal-btn" style="width: 100%; padding: 14px; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                    Got it!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Copy button handler
        modal.querySelector('.copy-link-btn').addEventListener('click', function() {
            navigator.clipboard.writeText(publicLink);
            this.textContent = 'Copied!';
            setTimeout(() => this.textContent = 'Copy', 2000);
        });
        
        // Close modal handler
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    function renderPortfoliosList() {
        const portfoliosList = document.getElementById('portfoliosList');
        if (!portfoliosList) return;
        
        if (userPortfolios.length === 0) {
            portfoliosList.innerHTML = '<p style="color: #64748b; text-align: center; padding: 2rem;">No portfolios yet. Create your first one!</p>';
            return;
        }
        
        portfoliosList.innerHTML = userPortfolios.map(portfolio => `
            <div class="portfolio-item" data-id="${portfolio.id}" style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 4px 0; font-size: 1rem;">${portfolio.name}</h4>
                        <p style="margin: 0; font-size: 0.85rem; color: #64748b;">Updated: ${new Date(portfolio.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <button class="load-portfolio-btn" data-id="${portfolio.id}" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Load
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        portfoliosList.querySelectorAll('.load-portfolio-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                window.location.href = `/editor.html?id=${id}`;
            });
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
