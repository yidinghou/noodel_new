# NOODEL Word Game - Railway Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository

Your project is now ready for Railway deployment! The following files have been added:

- `package.json` - Node.js dependencies and scripts
- `server.js` - Express server for static file serving
- `railway.toml` - Railway deployment configuration
- `.gitignore` - Files to ignore in version control
- `README.md` - Project documentation

### 2. Deploy to Railway

#### Option A: Deploy from GitHub (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Railway deployment configuration"
   git push origin main
   ```

2. **Deploy on Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect it's a Node.js app and deploy!

#### Option B: Deploy from Local Directory

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

### 3. Configuration (Optional)

In the Railway dashboard, you can set environment variables:
- `NODE_ENV=production` (automatically set)
- Custom domain configuration

### 4. Access Your Game

Once deployed, Railway will provide you with a URL like:
`https://your-app-name.up.railway.app`

## 🎮 Game Features

Your NOODEL word game includes:

- ✅ Responsive web design
- ✅ Smooth animations and transitions  
- ✅ Word detection and scoring
- ✅ Grid-based letter placement
- ✅ Debug mode with URL parameters
- ✅ Mobile-friendly interface

## 🛠️ Local Development

To run locally:

```bash
npm install
npm start
```

Visit: `http://localhost:3000`

## 🔧 Debug Features

Add URL parameters for debugging:
- `?debug=true` - Enable debug console
- `?skipAnimations=true` - Skip all animations
- `?debugGrid=true` - Show grid overlay

## 📁 File Structure

The project is organized as a modern JavaScript application:

```
noodel/
├── server.js           # Express server (for Railway)
├── package.json        # Dependencies & scripts  
├── railway.toml        # Railway configuration
├── index.html          # Main game page
├── js/                 # JavaScript modules
├── styles/             # CSS stylesheets
└── word_list/          # Game dictionaries
```

## 🎯 Next Steps

1. **Test Deployment**: Make sure the game works correctly on Railway
2. **Custom Domain**: Configure a custom domain if desired
3. **Analytics**: Add Google Analytics or similar if needed
4. **Monitoring**: Set up error tracking (Railway provides basic monitoring)

## 📞 Support

If you encounter any issues:
- Check Railway deployment logs
- Ensure all dependencies are in `package.json`
- Verify static files are served correctly

---

Your NOODEL word game is ready for the world! 🎉