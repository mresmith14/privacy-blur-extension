# 🔒 Auto Blur Sensitive Info

A Chrome extension that automatically detects and blurs sensitive information (emails, phone numbers, passwords) on web pages to protect your privacy while browsing.

## Features

- **🔐 Automatic Detection**: Instantly identifies emails, phone numbers, and password fields
- **👆 Hover to Reveal**: Simply hover or click to temporarily reveal blurred content
- **⚡ Real-time Protection**: Works on dynamic content and SPAs (Single Page Applications)
- **🎨 Customizable**: Toggle different types of sensitive data on/off
- **♿ Accessible**: Keyboard navigation and screen reader friendly
- **🔒 Privacy First**: All processing happens locally - no data is sent to any server


![Extension Preview](/preview.png)



## Installation

### Method 1: Load Unpacked (Developer Mode)

1. Download and extract this extension folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the `auto-blur-sensitive-info` folder
6. The extension icon should appear in your toolbar

### Method 2: Chrome Web Store (Coming Soon)

*Pending publication*

## Usage

### Automatic Protection
Once installed, the extension automatically:
- Blurs all email addresses on web pages
- Blurs phone numbers (US and international formats)
- Adds extra blur to password input fields
- Detects new content as you scroll or navigate

### Manual Controls
Click the extension icon to access the popup:

- **Main Toggle**: Enable/disable all protection
- **Email Addresses**: Toggle email blurring
- **Phone Numbers**: Toggle phone number blurring  
- **Password Fields**: Toggle password field blurring
- **Credit Cards**: Toggle credit card number detection (optional)
- **Scan Now**: Manually trigger a re-scan of the page
- **Reset**: Restore default settings

### Interacting with Blurred Content

- **Hover**: Temporarily reveal blurred text
- **Click**: Toggle blur on/off for individual elements
- **Focus**: Tab to blurred elements and press Enter to reveal

## Technical Details

### Detection Patterns

- **Emails**: Standard email format validation
- **Phone Numbers**: US formats (XXX) XXX-XXXX, XXX-XXX-XXXX, +1 XXX XXX XXXX
- **International Phones**: +XX XXXX XXXX format
- **Passwords**: All `<input type="password">` fields
- **Credit Cards**: Major card format patterns (optional)

### Performance

- Uses efficient MutationObserver for dynamic content
- Processes text nodes in batches to avoid blocking
- WeakSet tracking to prevent re-processing elements
- Debounced scanning for SPA navigation

### Privacy & Security

- **100% Local**: No network requests, no data collection
- **No Permissions Abuse**: Only requests necessary permissions
- **Open Source**: Full transparency in detection logic
- **No Tracking**: No analytics, no telemetry

## File Structure

```
auto-blur-sensitive-info/
├── manifest.json          # Extension configuration
├── content/
│   ├── content.js         # Main detection & blur logic
│   └── content.css        # Blur styling and animations
├── popup/
│   ├── popup.html         # Extension popup UI
│   └── popup.js           # Popup interaction logic
├── icons/
│   ├── icon16.png         # Toolbar icon (16x16)
│   ├── icon32.png         # Toolbar icon (32x32)
│   ├── icon48.png         # Extension icon (48x48)
│   └── icon128.png        # Store icon (128x128)
└── README.md              # This file
```

## Browser Support

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Brave 1.20+
- Opera 74+
- Other Chromium-based browsers

## Permissions Explained

- `storage`: Save your preferences
- `activeTab`: Interact with current page for manual scan
- `scripting`: Inject blur protection into pages
- `host_permissions`: Access page content for detection

## Development

### To Modify

1. Edit files in the extension folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on this extension
4. Changes apply immediately

### Debug

- Content script logs: Open DevTools (F12) → Console
- Popup logs: Right-click extension icon → "Inspect popup"
- Background logs: Enable "Developer mode" → "background page"

## Troubleshooting

**Extension not working?**
- Check if it's enabled in `chrome://extensions/`
- Try clicking "Scan Now" in the popup
- Refresh the page

**False positives?**
- Disable specific detection types in popup
- Contact us with examples for pattern improvement

**Performance issues?**
- Disable credit card detection (most intensive)
- Disable on specific sites via Chrome's site settings

## License

MIT License - Feel free to modify and distribute.

## Support

- Report issues: [GitHub Issues]
- Feature requests: [GitHub Discussions]
- Star the repo if you find it useful! ⭐

---

**Stay private. Browse safely.** 🔒
