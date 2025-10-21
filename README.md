# TLDRR: Too Long; Didn't Read? Refined.

*Translating chaos into clarity.*

A Chrome extension that enhances Reddit readability with AI-powered summaries, translations, and explanations for Hindi/Hinglish content.

## ✨ Features

- **📝 TL;DR Summaries**: Get concise summaries of long posts and comments
- **🌐 Translation**: Translate Hindi/Hinglish content to English
- **🧒 ELI5 Explanations**: Simplify complex topics for easy understanding
- **📊 Thread Analysis**: Comprehensive summaries of entire discussion threads
- **🎨 Reddit-Themed UI**: Matches Reddit's black and red color scheme
- **⚡ Instant Actions**: Inline buttons on posts and comments

## 🚀 How It Works

TLDRR uses Google's Gemini AI to process Reddit content:

1. **Content Extraction**: Smartly extracts actual post/comment text (ignores usernames, metadata)
2. **AI Processing**: Sends content to Gemini API with specific prompts for each action
3. **Inline Display**: Shows results in elegant overlays that match Reddit's design
4. **Fallback Mode**: TL;DR works without API key for basic functionality

## 📦 Installation

### Chrome Web Store (Coming Soon)
*Extension will be available on Chrome Web Store*

### Manual Installation (Development)

1. **Clone or Download**
   ```bash
   git clone https://github.com/OnlyNandan/TLDRR.git
   cd tldrr
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the TLDRR folder

3. **Configure API Key (Optional but Recommended)**
   - Click extension icon in toolbar
   - Enter your [Gemini API key](https://makersuite.google.com/app/apikey)
   - Click "Save"

## 🎯 Usage

### On Reddit Posts
- Hover over any post to see inline buttons
- **TL;DR**: Get summary of the post
- **Translate**: Convert Hindi/Hinglish to English
- **ELI5**: Explain complex topics simply
- **TL;DR ALL**: Summarize entire thread

### On Comments/Replies
- Inline buttons appear on comments
- Same actions as posts but focused on comment content

### Extension Popup
- Access settings and API key management
- Toggle features on/off
- Dark mode support

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. **Prerequisites**
   - Node.js (for any build tools if added later)
   - Chrome browser
   - Gemini API key for testing

2. **Local Development**
   ```bash
   # Make changes to files
   # Test by loading unpacked extension in Chrome
   # Reload extension after changes (chrome://extensions/)
   ```

3. **Testing**
   - Visit reddit.com or old.reddit.com
   - Test all features on various posts/comments
   - Check browser console for errors
   - Verify on different Reddit layouts

### Guidelines

- **Code Style**: Clean, commented JavaScript
- **Features**: Test thoroughly before submitting
- **Bugs**: Include steps to reproduce
- **Pull Requests**: Describe changes clearly

### File Structure
```
TLDRR/
├── manifest.json      # Extension configuration
├── content.js         # Main content script
├── background.js      # API communication
├── popup.html         # Extension popup UI
├── popup.js           # Popup functionality
├── popup.css          # Popup styles
├── styles.css         # Content styles
└── icons/             # Extension icons
```

## 🔧 Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension format
- **Content Scripts**: Inject functionality into Reddit pages
- **Background Service Worker**: Handles API requests
- **Popup Interface**: Settings and configuration

### API Integration
- Uses Google Gemini 1.5 Flash model
- Secure API key storage in Chrome storage
- Fallback functionality for TL;DR without API key

### Content Processing
- Smart DOM selectors for accurate content extraction
- Handles both new Reddit (shreddit) and old Reddit layouts
- Ignores UI elements, focuses on actual content

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini for AI processing
- Reddit community for inspiration
- Chrome Extensions documentation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/OnlyNandan/tdlrr/issues)
- **Discussions**: [GitHub Discussions](https://github.com/OnlyNandan/tdlrr/discussions)

---

**Made with ❤️ for better Reddit reading experiences**
