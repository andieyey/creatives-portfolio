# 🎨 Creative Portfolio Template

A modern, fully responsive portfolio website template perfect for designers, developers, and creative professionals. **Super easy to customize** - just edit one file (config.js) and you're done! No coding knowledge required.

Built with vanilla HTML, CSS, and JavaScript - no frameworks required!

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://github.com/andieyey/creatives-portfolio)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Portfolio Preview](https://via.placeholder.com/800x400/667eea/ffffff?text=Portfolio+Template+Preview)

## ✨ Features

- 🎨 **Modern Design** - Clean, professional aesthetic with smooth animations
- 📱 **Fully Responsive** - Looks great on mobile, tablet, and desktop
- 🚀 **Fast & Lightweight** - No frameworks, pure vanilla JavaScript
- 🎯 **Easy Customization** - Simple to personalize with your own content
- 💼 **Portfolio Grid** - Showcase up to 6+ projects with expandable layout
- 📧 **Contact Form** - Ready-to-integrate contact section
- 🌈 **Customizable Colors** - Easy color scheme customization via CSS variables
- ⚡ **Smooth Scrolling** - Elegant navigation with scroll animations

## 📸 Sections

- **Hero** - Eye-catching introduction with gradient background
- **About** - Personal bio and skills showcase
- **Portfolio** - Grid layout for project showcases
- **Contact** - Contact information and form

## 🚀 Quick Start (3 Steps!)

### 1️⃣ Download
Click the green "Code" button → "Download ZIP"
Extract the files to any folder

### 2️⃣ Customize
Open **config.js** in any text editor and add your information:
- Your name and title
- About section
- Your projects
- Contact details

### 3️⃣ View
Double-click **index.html** to open in your browser. Done! ✨

📖 **Need detailed instructions?** Check out [QUICK-START.md](QUICK-START.md)

## 🎨 Easy Customization

**Everything is in one file: `config.js`** 

Just edit this file - no need to touch HTML or CSS!

### Personal Information
```javascript
name: "Your Name",
title: "Your Professional Title",
description: "Your tagline"
```

### About Section
```javascript
about: {
    heading: "Your heading",
    bio: [
        "First paragraph about you",
        "Second paragraph"
    ],
    skills: ["Skill 1", "Skill 2", "Skill 3"]
}
```

### Projects (Add Unlimited!)
```javascript
projects: [
    {
        title: "Project Name",
        category: "Type of work",
        image: "images/project1.jpg",
        link: "https://project-link.com"
    }
]
```

### Contact & Social
```javascript
contact: {
    email: "your@email.com",
    phone: "+123 456 7890",
    location: "Your City",
    social: [
        { name: "LinkedIn", url: "your-linkedin-url" }
    ]
}
```

### Colors (Optional)
```javascript
colors: {
    primary: "#6366f1",    // Your brand color
    secondary: "#8b5cf6"   // Accent color
}
```

## 🌐 Deployment Options

### GitHub Pages (Free)

1. Go to repository Settings → Pages
2. Select branch: `main` or `master`
3. Click Save
4. Your site will be live at `https://yourusername.github.io/repository-name`

### Netlify (Free)

1. Sign up at [Netlify](https://www.netlify.com)
2. Drag and drop your project folder
3. Get instant deployment with custom domain support

### Vercel (Free)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts

## 🛠️ Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Grid, Flexbox, CSS Variables, Animations
- **JavaScript** - Smooth scrolling, mobile menu, intersection observer
- **Google Fonts** - Poppins font family

## 📁 Project Structure

```
creatives-portfolio/
├── index.html          # Main HTML file
├── styles.css          # All styles
├── script.js           # Interactive features
├── README.md           # Documentation
└── .gitignore         # Git ignore rules
```

## 💡 Tips

- **Test Responsiveness**: Use browser DevTools to test on different screen sizes
- **Optimize Images**: Compress images before adding (use TinyPNG or similar)
- **SEO**: Update meta tags in `<head>` section for better search visibility
- **Analytics**: Add Google Analytics tracking code before `</body>` tag
- **Performance**: Consider lazy loading images for better load times

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is licensed under the MIT License - feel free to use it for personal or commercial projects.

## 🌟 Showcase

Using this template? I'd love to see it! Open an issue with your portfolio link and I'll add it to the showcase section.

## 📞 Support

If you have questions or need help customizing your portfolio:
- Open an [issue](https://github.com/andieyey/creatives-portfolio/issues)
- Check existing issues for solutions

---

**Made with ❤️ for the creative community**

If you found this template helpful, please give it a ⭐!
