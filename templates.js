// Portfolio Templates
const portfolioTemplates = {
    modern: {
        name: "Modern Gradient",
        colors: {
            primary: "#6366f1",
            secondary: "#8b5cf6",
            text: "#374151",
            background: "#ffffff",
            heroColor1: "#667eea",
            heroColor2: "#764ba2"
        },
        heroImage: "",
        darkMode: false
    },
    
    minimal: {
        name: "Minimal Dark",
        colors: {
            primary: "#10b981",
            secondary: "#06b6d4",
            text: "#e5e7eb",
            background: "#111827",
            heroColor1: "#1e293b",
            heroColor2: "#0f172a"
        },
        heroImage: "",
        darkMode: true
    },
    
    sunset: {
        name: "Sunset Vibes",
        colors: {
            primary: "#f97316",
            secondary: "#ec4899",
            text: "#374151",
            background: "#ffffff",
            heroColor1: "#fb923c",
            heroColor2: "#f43f5e"
        },
        heroImage: "",
        darkMode: false
    },
    
    ocean: {
        name: "Ocean Blue",
        colors: {
            primary: "#0ea5e9",
            secondary: "#06b6d4",
            text: "#f3f4f6",
            background: "#0c4a6e",
            heroColor1: "#0369a1",
            heroColor2: "#164e63"
        },
        heroImage: "",
        darkMode: true
    },
    
    forest: {
        name: "Forest Green",
        colors: {
            primary: "#10b981",
            secondary: "#14b8a6",
            text: "#374151",
            background: "#f0fdf4",
            heroColor1: "#047857",
            heroColor2: "#0d9488"
        },
        heroImage: "",
        darkMode: false
    }
};

// Function to apply template (will be called by editor.js)
window.applyTemplate = function(templateKey) {
    const template = portfolioTemplates[templateKey];
    if (!template || !window.currentConfig) return;
    
    // Update current config
    window.currentConfig.colors = { ...window.currentConfig.colors, ...template.colors };
    window.currentConfig.heroImage = template.heroImage || "";
    window.currentConfig.darkMode = template.darkMode || false;
    
    // Call global functions if they exist
    if (typeof window.populateForm === 'function') {
        window.populateForm();
    }
    if (typeof window.applyConfiguration === 'function') {
        window.applyConfiguration();
    }
    
    // Save to localStorage
    if (typeof window.saveToLocalStorage === 'function') {
        window.saveToLocalStorage();
    }
};
