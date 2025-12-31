// Portfolio Editor - Live customization and link generation
(function() {
    'use strict';

    // Check if URL has parameters (shared portfolio)
    const urlParams = new URLSearchParams(window.location.search);
    const hasSharedConfig = urlParams.has('config');

    // Load configuration from URL or localStorage or default
    let currentConfig = loadConfiguration();

    // Onboarding
    let currentStep = 1;
    const onboardingOverlay = document.getElementById('onboardingOverlay');
    
    // Show onboarding if first visit and not shared
    if (!hasSharedConfig && !localStorage.getItem('onboardingCompleted')) {
        showOnboarding();
    } else if (onboardingOverlay) {
        onboardingOverlay.classList.add('hidden');
    }
    
    window.nextOnboardingStep = function() {
        const steps = document.querySelectorAll('.onboarding-step');
        steps[currentStep - 1].classList.remove('active');
        currentStep++;
        if (currentStep <= steps.length) {
            steps[currentStep - 1].classList.add('active');
        }
    };
    
    window.skipOnboarding = function() {
        closeOnboarding();
    };
    
    window.closeOnboarding = function() {
        if (onboardingOverlay) {
            onboardingOverlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                onboardingOverlay.classList.add('hidden');
                localStorage.setItem('onboardingCompleted', 'true');
            }, 300);
        }
    };
    
    function showOnboarding() {
        if (onboardingOverlay) {
            onboardingOverlay.classList.remove('hidden');
        }
    }

    // Tab functionality
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
    
    // Color input listeners
    const primaryColorInput = document.getElementById('edit-primary-color');
    const secondaryColorInput = document.getElementById('edit-secondary-color');
    
    if (primaryColorInput) {
        const primaryValue = primaryColorInput.nextElementSibling;
        primaryColorInput.addEventListener('input', (e) => {
            if (primaryValue) primaryValue.textContent = e.target.value;
        });
    }
    
    if (secondaryColorInput) {
        const secondaryValue = secondaryColorInput.nextElementSibling;
        secondaryColorInput.addEventListener('input', (e) => {
            if (secondaryValue) secondaryValue.textContent = e.target.value;
        });
    }

    // Editor elements
    const editorPanel = document.getElementById('editorPanel');
    const editorToggle = document.getElementById('editorToggle');
    const floatBtn = document.getElementById('floatBtn');
    const openEditorBtn = document.getElementById('openEditor');
    const generateLinkBtn = document.getElementById('generateLink');
    const downloadConfigBtn = document.getElementById('downloadConfig');
    const resetConfigBtn = document.getElementById('resetConfig');
    const copyLinkBtn = document.getElementById('copyLink');
    const linkResult = document.getElementById('linkResult');
    const generatedLink = document.getElementById('generatedLink');

    // Form inputs
    const inputs = {
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
        secondaryColor: document.getElementById('edit-secondary-color')
    };

    // Initialize
    function init() {
        populateForm();
        applyConfiguration();
        
        // If it's a shared portfolio, completely hide the editor
        if (hasSharedConfig) {
            editorPanel.style.display = 'none';
            floatBtn.style.display = 'none';
            if (openEditorBtn) {
                openEditorBtn.style.display = 'none';
            }
            // Update badge to show it's a portfolio
            const badge = document.querySelector('.template-badge span');
            if (badge) {
                badge.textContent = '👤 Portfolio';
            }
        } else {
            attachEventListeners();
        }
    }

    // Load configuration
    function loadConfiguration() {
        // First, check URL parameters (shared portfolio)
        if (hasSharedConfig) {
            try {
                const encoded = urlParams.get('config');
                const decoded = atob(encoded);
                return JSON.parse(decoded);
            } catch (e) {
                console.error('Invalid shared configuration');
            }
        }

        // Second, check localStorage (user's saved work)
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
                secondary: "#8b5cf6"
            }
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
    }

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
        
        // Apply colors
        document.documentElement.style.setProperty('--primary-color', currentConfig.colors.primary);
        document.documentElement.style.setProperty('--secondary-color', currentConfig.colors.secondary);
    }

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
                secondary: inputs.secondaryColor.value
            }
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
    }

    // Toggle editor panel
    function toggleEditor() {
        editorPanel.classList.toggle('collapsed');
        floatBtn.style.display = editorPanel.classList.contains('collapsed') ? 'block' : 'none';
    }

    // Generate shareable link
    function generateShareableLink() {
        const configString = JSON.stringify(currentConfig);
        const encoded = btoa(configString);
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?config=${encoded}`;
        
        generatedLink.value = shareUrl;
        linkResult.style.display = 'block';
        
        // Scroll to show the link
        linkResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
