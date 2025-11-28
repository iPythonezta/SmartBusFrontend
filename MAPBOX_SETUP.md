# 🗺️ Mapbox API Setup Guide

This guide will help you get a **free** Mapbox access token for the bus live location feature.

## Why Mapbox?

- ✅ **Completely FREE** for development
- ✅ **200,000 free static map requests/month** (very generous!)
- ✅ **No credit card required** for free tier
- ✅ Beautiful, customizable maps
- ✅ Much simpler than Google Maps (no complex billing setup)

## Step-by-Step Setup

### 1️⃣ Create Mapbox Account

1. Go to [Mapbox Sign Up](https://account.mapbox.com/auth/signup/)
2. Sign up with:
   - Email address
   - Or use GitHub/Google login (faster!)
3. Verify your email if required

### 2️⃣ Get Your Access Token

1. After signing in, you'll be taken to your [Account Dashboard](https://account.mapbox.com/)
2. Click on **"Access tokens"** in the left sidebar
3. You'll see a **Default public token** already created
4. Click the **copy icon** to copy the token
5. It looks like: `pk.eyJ1Ijoi...` (starts with `pk.`)

### 3️⃣ Add Token to Your Project

1. Open your `.env` file in the project root
2. Replace the placeholder:
   ```env
   VITE_MAPBOX_API_KEY=pk.eyJ1IjoieW91cl91c2VybmFtZSIsImEiOiJjbHh4eHh4eHgifQ.xxxxxxxxxxxxxxxxxxxx
   ```
3. Save the file
4. Restart your dev server:
   ```bash
   npm run dev
   ```

### 4️⃣ Test It!

1. Open your browser at `http://localhost:5173`
2. Log in with admin credentials
3. Go to **Buses** page
4. Click **View Details** on any active bus
5. You should see a beautiful Mapbox static map showing the bus location! 🎉

## 🔒 Token Security

### ✅ Safe Practices:
- Your `.env` file is already in `.gitignore` (won't be committed)
- Public tokens (starting with `pk.`) are safe for frontend use
- Mapbox public tokens are designed to be exposed

### 🔐 Optional: Restrict Token (Recommended for Production)

1. Go to [Access Tokens](https://account.mapbox.com/access-tokens/)
2. Click on your token
3. Scroll to **URL restrictions**
4. Add allowed URLs:
   - `http://localhost:*` (for development)
   - `https://yourdomain.com/*` (for production)
5. Click **Update token**

## 💰 Free Tier Limits

| Feature | Free Tier Limit |
|---------|----------------|
| Static Images API | **200,000 requests/month** |
| Map Loads (JS API) | **50,000 loads/month** |
| Geocoding | **100,000 requests/month** |

**For this project**, we only use **Static Images API** which gives you **200,000 requests/month FREE** - more than enough for development and even small production deployments!

## 🎨 Customization (Optional)

The bus location uses Mapbox's `streets-v12` style. You can change it to:

```typescript
// In BusDetailPage.tsx
// Change 'streets-v12' to any of these:
- 'streets-v12'        // Default street map
- 'outdoors-v12'       // Outdoors style
- 'light-v11'          // Light theme
- 'dark-v11'           // Dark theme
- 'satellite-v9'       // Satellite imagery
- 'satellite-streets-v12' // Satellite with labels
```

Example:
```typescript
src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/...`}
```

## 🆘 Troubleshooting

### Problem: Map shows broken image icon
**Solution**: 
1. Check if your token is correctly set in `.env`
2. Make sure the token starts with `pk.`
3. Restart dev server after adding token
4. Check browser console for error messages

### Problem: Token not working
**Solution**:
1. Verify the token is active at [mapbox.com/account/access-tokens](https://account.mapbox.com/access-tokens/)
2. Make sure you copied the entire token (they're long!)
3. Remove any extra spaces or quotes in `.env`

### Problem: Want to use Leaflet instead
**Solution**: 
The project **already uses Leaflet** for all other maps (dashboard, stops, routes). Mapbox is only for the bus detail static image. If you prefer, you can remove the Mapbox integration entirely and the app will still work perfectly!

## 📚 Additional Resources

- [Mapbox Documentation](https://docs.mapbox.com/)
- [Static Images API Reference](https://docs.mapbox.com/api/maps/static-images/)
- [Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [Pricing](https://www.mapbox.com/pricing/)

## 🎓 For Students

Mapbox doesn't have a specific student program, but the free tier is **extremely generous** and perfect for academic projects!

---

**Need Help?** Open an issue or check the [Mapbox Community](https://community.mapbox.com/)
