// ============================================
// PORTFOLIO CONFIGURATION
// Edit this file to customize your portfolio
// ============================================

const portfolioConfig = {
    // ===== PERSONAL INFORMATION =====
    name: "Your Name",
    title: "Creative Designer & Developer",
    description: "Crafting beautiful digital experiences through design and code",
    
    // ===== ABOUT SECTION =====
    about: {
        heading: "Creative Professional",
        bio: [
            "I'm a passionate creative professional with expertise in design and development. I love bringing ideas to life through innovative solutions and beautiful designs.",
            "With years of experience in the creative industry, I've worked on diverse projects ranging from branding to web development, always pushing the boundaries of what's possible."
        ],
        photo: "images/profile.jpg", // Add your photo path here
        skills: [
            "UI/UX Design",
            "Web Development",
            "Graphic Design",
            "Branding",
            "Photography",
            "Video Editing"
        ]
    },
    
    // ===== PORTFOLIO PROJECTS =====
    projects: [
        {
            title: "Project Title 1",
            category: "Brand Identity & Web Design",
            image: "images/project1.jpg",
            link: "#"
        },
        {
            title: "Project Title 2",
            category: "UI/UX Design",
            image: "images/project2.jpg",
            link: "#"
        },
        {
            title: "Project Title 3",
            category: "Web Development",
            image: "images/project3.jpg",
            link: "#"
        },
        {
            title: "Project Title 4",
            category: "Graphic Design",
            image: "images/project4.jpg",
            link: "#"
        },
        {
            title: "Project Title 5",
            category: "Photography",
            image: "images/project5.jpg",
            link: "#"
        },
        {
            title: "Project Title 6",
            category: "Video Production",
            image: "images/project6.jpg",
            link: "#"
        }
    ],
    
    // ===== CONTACT INFORMATION =====
    contact: {
        email: "your.email@example.com",
        phone: "+123 456 7890",
        location: "Your City, Country",
        social: [
            { name: "LinkedIn", url: "https://linkedin.com/in/yourprofile" },
            { name: "GitHub", url: "https://github.com/yourusername" },
            { name: "Dribbble", url: "https://dribbble.com/yourprofile" },
            { name: "Instagram", url: "https://instagram.com/yourprofile" }
        ]
    },
    
    // ===== COLOR SCHEME (Optional - Advanced) =====
    colors: {
        primary: "#6366f1",
        secondary: "#8b5cf6",
        dark: "#1f2937",
        light: "#f9fafb",
        text: "#374151",
        background: "#ffffff",
        heroColor1: "#667eea",
        heroColor2: "#764ba2"
    },
    
    // ===== THEME SETTINGS =====
    darkMode: false,
    
    // ===== HERO CUSTOMIZATION =====
    heroImage: ""
};

// ============================================
// DO NOT EDIT BELOW THIS LINE
// ============================================

// Apply configuration when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Update personal info
    document.querySelector('.name').textContent = portfolioConfig.name;
    document.querySelector('.hero-subtitle').textContent = portfolioConfig.title;
    document.querySelector('.hero-description').textContent = portfolioConfig.description;
    
    // Update about section
    document.querySelector('.about-text h3').textContent = portfolioConfig.about.heading;
    const aboutParagraphs = document.querySelectorAll('.about-text p');
    portfolioConfig.about.bio.forEach((text, index) => {
        if (aboutParagraphs[index]) {
            aboutParagraphs[index].textContent = text;
        }
    });
    
    // Update skills
    const skillsContainer = document.querySelector('.skill-tags');
    skillsContainer.innerHTML = '';
    portfolioConfig.about.skills.forEach(skill => {
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.textContent = skill;
        skillsContainer.appendChild(skillTag);
    });
    
    // Update projects
    const projectsContainer = document.querySelector('.portfolio-grid');
    projectsContainer.innerHTML = '';
    portfolioConfig.projects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'portfolio-item';
        projectItem.innerHTML = `
            <div class="portfolio-image">
                <div class="image-placeholder" style="background-image: url('${project.image}'); background-size: cover; background-position: center;">
                    ${project.image.includes('images/') ? '' : project.title}
                </div>
            </div>
            <div class="portfolio-info">
                <h3>${project.title}</h3>
                <p>${project.category}</p>
                <a href="${project.link}" class="portfolio-link">View Project →</a>
            </div>
        `;
        projectsContainer.appendChild(projectItem);
    });
    
    // Update contact info
    const contactItems = document.querySelectorAll('.contact-item');
    if (contactItems[0]) {
        contactItems[0].querySelector('p a').href = `mailto:${portfolioConfig.contact.email}`;
        contactItems[0].querySelector('p a').textContent = portfolioConfig.contact.email;
    }
    if (contactItems[1]) {
        contactItems[1].querySelector('p a').href = `tel:${portfolioConfig.contact.phone.replace(/\s/g, '')}`;
        contactItems[1].querySelector('p a').textContent = portfolioConfig.contact.phone;
    }
    if (contactItems[2]) {
        contactItems[2].querySelector('p').textContent = portfolioConfig.contact.location;
    }
    
    // Update social links
    const socialContainer = document.querySelector('.social-links');
    socialContainer.innerHTML = '';
    portfolioConfig.contact.social.forEach(social => {
        const link = document.createElement('a');
        link.href = social.url;
        link.target = '_blank';
        link.textContent = social.name;
        socialContainer.appendChild(link);
    });
    
    // Update footer
    document.querySelector('.footer p').textContent = `© ${new Date().getFullYear()} ${portfolioConfig.name}. All rights reserved.`;
    
    // Apply color scheme if specified
    if (portfolioConfig.colors) {
        document.documentElement.style.setProperty('--primary-color', portfolioConfig.colors.primary);
        document.documentElement.style.setProperty('--secondary-color', portfolioConfig.colors.secondary);
        document.documentElement.style.setProperty('--dark-color', portfolioConfig.colors.dark);
        document.documentElement.style.setProperty('--light-color', portfolioConfig.colors.light);
    }
});
