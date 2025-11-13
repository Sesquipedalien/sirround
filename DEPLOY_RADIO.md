# 🎵 Tribal Productions Radio - Deployed to sirround.me!

## ✅ Radio App Added Successfully!

Your Tribal Productions Radio web app has been copied to:
```
/Users/shawnowens/Documents/CascadeProjects/sirround-me/public/radio/
```

## 🌐 Deploy to Netlify

### Option 1: Push to GitHub/GitLab (Recommended)

If you haven't set up a Git remote yet:

```bash
cd /Users/shawnowens/Documents/CascadeProjects/sirround-me

# Add your GitHub/GitLab repository
git remote add origin https://github.com/YOUR_USERNAME/sirround-me.git

# Push to deploy
git push -u origin main
```

Netlify will automatically:
1. Detect the push
2. Build your Next.js site
3. Deploy everything including `/radio`
4. Your radio app will be live at **https://sirround.me/radio**

### Option 2: Netlify CLI (Quick Deploy)

```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from sirround-me directory
cd /Users/shawnowens/Documents/CascadeProjects/sirround-me
netlify deploy --prod
```

### Option 3: Drag & Drop (Netlify Dashboard)

1. Go to https://app.netlify.com
2. Drag the `sirround-me` folder to Netlify
3. Site deploys automatically

---

## 🔄 Future Updates

Whenever you update the radio app:

```bash
cd /Users/shawnowens/Documents/CascadeProjects/tribal-productions-radio-mobile

# Run the deploy script
./deploy-to-sirround.sh

# Then push to Netlify
cd ../sirround-me
git add public/radio
git commit -m "Update radio app"
git push
```

---

## 📍 Your Radio App URLs

Once deployed, your radio app will be accessible at:

- **Main site**: https://sirround.me/radio
- **Direct link**: https://sirround.me/radio/index.html

---

## 🎯 What's Deployed

- ✅ Full web version of Tribal Productions Radio
- ✅ Live streaming functionality
- ✅ Beautiful dark UI with gradients
- ✅ Play/pause controls
- ✅ Now playing display
- ✅ Responsive design (works on all devices)

---

## 🔧 Files Deployed

```
public/radio/
├── index.html                    # Main app page
├── metadata.json                 # App metadata
├── _expo/
│   └── static/js/web/
│       └── index-[hash].js      # App bundle (883 KB)
└── assets/                       # Navigation icons
```

---

## 📱 Mobile Apps

Don't forget - you also have:

- **Android APK**: Building now (check `eas build:list`)
- **iOS IPA**: Can build with Apple Developer account

---

## 🚀 Quick Deploy Commands

```bash
# From radio project - build and copy
cd /Users/shawnowens/Documents/CascadeProjects/tribal-productions-radio-mobile
./deploy-to-sirround.sh

# From sirround-me - deploy to Netlify
cd /Users/shawnowens/Documents/CascadeProjects/sirround-me
git add .
git commit -m "Update radio app"
git push  # (after setting up remote)
```

---

## 🌟 Next Steps

1. **Set up Git remote** for sirround-me (GitHub/GitLab)
2. **Push to deploy** - Netlify will auto-deploy
3. **Test at** https://sirround.me/radio
4. **Share the link** with your audience!

---

**🎉 Your radio app is ready to go live on sirround.me!**

Just push to your Git repository and Netlify will handle the rest!
