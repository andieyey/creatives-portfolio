# 🎨 Craftfolio

**Build your professional portfolio in minutes—no coding required.**

Craftfolio is a free, web-based portfolio builder that lets creatives showcase their work with a clean, modern design. Create, customize, and share your portfolio through an intuitive visual editor.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://craftfolio.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Features

- 🎨 **Visual Editor** - Real-time preview as you build
- 🚀 **No Coding Required** - Intuitive drag-and-drop interface
- 📱 **Fully Responsive** - Looks great on all devices
- 🔗 **Instant Sharing** - Get a shareable link immediately
- 💾 **Auto-Save** - Never lose your work
- 🎯 **Multiple Templates** - Professional, minimal, creative, and colorful designs
- 🌈 **Customizable Colors** - Personalize your brand
- 📸 **Image Upload** - Add your photos directly in the editor
- ⚡ **Fast & Lightweight** - Built with vanilla JavaScript

---

## 🚀 Quick Start

### For Users
1. Visit [Craftfolio](https://craftfolio.vercel.app)
2. Click "Start Building Free"
3. Choose a template
4. Customize with your content
5. Click "Generate Link" to share

That's it! Your portfolio is live.

### For Developers
Want to run your own instance or contribute?

```bash
# Clone the repository
git clone https://github.com/andieyey/creatives-portfolio.git
cd creatives-portfolio

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Redis URL to .env.local

# Run locally
npm run dev
```

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Vercel Serverless Functions
- **Database**: Redis (via Upstash)
- **Hosting**: Vercel
- **Fonts**: Google Fonts (Poppins)

---

## 📁 Project Structure

```
creatives-portfolio/
├── api/                    # Serverless API endpoints
│   ├── get-portfolio.js    # Retrieve portfolio data
│   ├── save-portfolio.js   # Save portfolio data
│   └── list-portfolios.js  # List user portfolios
├── src/                    # Application source
│   ├── editor.html         # Portfolio editor
│   ├── editor.js           # Editor logic
│   ├── editor-styles.css   # Editor styles
│   ├── portfolio-view.html # Portfolio viewer
│   ├── templates.js        # Portfolio templates
│   ├── styles.css          # Shared styles
│   └── script.js           # Shared scripts
├── public/                 # Landing page assets
│   ├── landing-styles.css
│   └── landing-script.js
├── docs/                   # Documentation
│   ├── README.md
│   └── LICENSE
├── index.html              # Landing page
├── package.json            # Dependencies
└── vercel.json             # Deployment config
```

---

## 🌐 Deployment

### Deploy Your Own Instance

#### Vercel (Recommended)
1. Fork this repository
2. Sign up at [Vercel](https://vercel.com)
3. Import your forked repository
4. Set up environment variables:
   - `REDIS_URL` - Your Redis connection string
5. Deploy

#### Other Platforms
This app uses Vercel Serverless Functions. To deploy elsewhere, you'll need to adapt the API routes to your platform's serverless function format.

---

## 🔧 Environment Variables

Create a `.env.local` file with:

```env
REDIS_URL=your_redis_connection_string
```

**Get Redis for free**: [Upstash](https://upstash.com)

---

## 📖 How It Works

1. **Editor**: Users build portfolios in a visual editor with real-time preview
2. **Save**: Portfolio data is stored in Redis with a unique ID
3. **Share**: Users get a shareable link with optional edit token
4. **View**: Portfolios are rendered on-demand from stored data

---

## 📄 License

This project is licensed under the MIT License - feel free to use it for personal or commercial projects. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with ❤️ for creatives who want to showcase their work without the hassle.

If you find this useful, give it a ⭐!
