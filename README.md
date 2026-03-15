# Tuition Manager - PWA

A Progressive Web App (PWA) for managing tuition classes, built with React and Vite.

## Features

✨ **Key Features**
- 📱 Fully responsive and mobile-friendly design
- 🔐 Mock login system (Username: `admin`, Password: `admin`)
- 💾 Session persistence using localStorage
- 🔄 Automatic login session recovery on page refresh
- 👤 Secure logout functionality
- 📲 PWA ready - installable on mobile devices
- 🚀 Offline support with service worker
- ⚡ Fast performance with Vite
- 🎨 Clean and modern UI with CSS

## Project Structure

```
src/
├── components/
│   └── Header.jsx              # Header component with logout button
├── pages/
│   ├── Login.jsx               # Login page with mock authentication
│   └── Dashboard.jsx           # Main dashboard with 4 feature cards
├── styles/
│   ├── index.css               # Global styles
│   ├── components/
│   │   └── Header.css          # Header styles
│   └── pages/
│       ├── Login.css           # Login page styles
│       └── Dashboard.css       # Dashboard styles
├── App.jsx                     # Main app component with routing
└── main.jsx                    # React DOM entry point

public/
├── manifest.json               # PWA manifest file
└── sw.js                       # Service worker for offline support

vite.config.js                  # Vite configuration with PWA plugin
package.json                    # Project dependencies
index.html                      # HTML entry point
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Setup Steps

1. Navigate to the project directory:
```bash
cd RelisantSmartClass
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## Usage

### Login
- Username: **admin**
- Password: **admin**

After login, you'll be redirected to the Dashboard.

### Dashboard
The dashboard displays 4 main feature cards:
- **Students** - Manage student information
- **Attendance** - Track student attendance
- **Fees** - Manage fee collection
- **Reports** - View analytics & reports

### Logout
Click the **Logout** button in the header to log out. Your session will be cleared, and you'll be redirected to the login page.

### Session Persistence
- Your login session is saved in the browser's localStorage
- If you refresh the page while logged in, you'll remain logged in
- Close the browser or manually log out to end the session

## PWA Installation

### On Desktop (Chrome/Edge)
1. Visit the application in your browser
2. Click the install button in the address bar
3. Click "Install"

### On Mobile (Android Chrome)
1. Visit the application in Chrome
2. Tap the menu (⋮) → "Install app" or "Add to home screen"
3. Follow the prompts to install

### On iOS (Safari)
1. Visit the application in Safari
2. Tap the share button
3. Tap "Add to Home Screen"
4. Name the app and add it

## Development

### Available Scripts

**Start development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

### Technology Stack

- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Vite** - Build tool and dev server
- **Vite PWA Plugin** - PWA configuration
- **CSS3** - Styling (no external CSS framework)

### Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Features Explained

### Authentication
- Simple mock login system for demonstration
- Credentials are validated on the client-side
- Session token stored in localStorage

### Session Management
- `localStorage` is used to persist login state
- `isLoggedIn` flag is checked on app initialization
- On refresh, users remain logged in if session exists

### PWA Configuration
- **Service Worker** - Enables offline functionality and asset caching
- **Manifest.json** - Contains app metadata for installation
- **Icons** - SVG icons generated dynamically
- **Cache Strategy** - Network-first for APIs, cache-first for assets

### Responsive Design
- Mobile-first approach
- CSS Grid and Flexbox for layouts
- Breakpoints: 768px, 480px
- Touch-friendly buttons and inputs

## Performance

- ⚡ Fast initial load with Vite
- 📦 Small bundle size (~100KB gzipped)
- 🔄 Automatic asset caching via service worker
- 📱 Optimized for mobile devices

## Offline Support

The PWA continues to work offline:
- Cached pages and assets remain accessible
- Service worker handles network failures gracefully
- User can navigate between cached pages

## Troubleshooting

### Service Worker Not Updating
- Clear browser cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
- Go to DevTools → Application → Service Workers
- Unregister and refresh the page

### PWA Not Installing
- Ensure HTTPS is used (or localhost for development)
- Check browser console for errors
- Try a different browser

### Login Issues
- Make sure you're using exactly: `admin` / `admin`
- Check browser console for error messages
- Ensure localStorage is enabled

## Future Enhancements

- Backend API integration
- Real authentication with JWT tokens
- Database for storing class data
- Student and attendance management features
- Report generation and export
- Notifications system
- Dark mode support

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please check the console logs and ensure all dependencies are correctly installed.

---

**Happy Teaching! 📚**
