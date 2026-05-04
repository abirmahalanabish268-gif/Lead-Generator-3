# Quick Start Guide

## Project Overview
**Byters Lead Finder** - A sleek, modern lead generation tool for Indian local businesses.

## What's Been Built

### ✅ Completed Features
1. **Search Section** - City & category dropdowns with "Find Leads" button
2. **Stats Row** - Shows total leads, pitched count, and new leads
3. **Results Grid** - Card-based display with WhatsApp integration
4. **Empty States** - Friendly messages for no results / initial state
5. **Loading State** - Skeleton cards during API calls
6. **WhatsApp Integration** - Pre-filled wa.me links with template message
7. **Mock Data System** - 6 sample leads for demo purposes
8. **Supabase Setup** - Configured but using mock data (ready for real DB)
9. **Groq LLM Ready** - Placeholder for AI template matching

### 🎨 Design Specs
- **Background**: `#0F0F14` (dark charcoal)
- **Cards**: `#1A1A23` (elevated dark)
- **Borders**: `#32323F` (subtle separators)
- **Accent**: `#0A84FF` (electric blue)
- **Font**: System UI / Inter
- **Style**: Minimal, dev-tool aesthetic

### 📦 Files Created/Modified
- `src/App.jsx` - Main component with all logic
- `src/App.css` - Complete styling
- `src/index.css` - Reset and base styles
- `index.html` - Updated title
- `.env.example` - Environment template
- `README.md` - Full documentation

## How to Use

1. **Start Dev Server**
   ```bash
   cd byters-lead-finder
   npm run dev
   ```

2. **Open Browser**
   - Navigate to http://localhost:5173

3. **Search for Leads**
   - Select a city (e.g., "Kolkata")
   - Select a category (e.g., "Salon")
   - Click "Find Leads"

4. **Send WhatsApp Pitch**
   - Click "📲 Send on WhatsApp" on any new lead
   - Opens WhatsApp with pre-filled message
   - Lead automatically marked as "pitched"

## Mock Data Examples

The app includes 6 sample leads:
- Glamour Studio (Salon) - New
- Brew & Bean Cafe (Cafe) - Already pitched
- Iron Paradise Gym (Gym) - New
- Urban Canvas Interiors (Interior Designer) - New
- Lens & Light Photography (Photographer) - Already pitched
- Curl Up & Dye Salon (Salon) - New

## Next Steps for Production

### 1. Backend Scraper (JustDial)
```javascript
// Add to App.jsx or create separate service
const fetchJustDialLeads = async (city, category) => {
  const response = await axios.post('/api/scrape', { city, category });
  return response.data;
};
```

### 2. Groq AI Integration
```javascript
const matchTemplate = async (business) => {
  const response = await axios.post('https://api.groq.com/...', {
    model: 'llama3-8b-8192',
    messages: [/* template matching prompt */]
  });
  return response.data;
};
```

### 3. Supabase Database
```javascript
// Create supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Check/pitch leads
const { data, error } = await supabase
  .from('pitched_leads')
  .insert([{ /* lead data */ }]);
```

## Environment Variables

Copy `.env.example` → `.env`:
```bash
VITE_GROQ_KEY=sk-xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## Testing

The build completes successfully:
```
dist/index.html        0.46 kB (gzip: 0.30 kB)
dist/index.css         7.29 kB (gzip: 2.27 kB)
dist/index.js         195.90 kB (gzip: 61.61 kB)
```

## Key Features

✅ **Dark theme** with electric blue accent  
✅ **Responsive design** (mobile → desktop)  
✅ **Skeleton loading** states  
✅ **No CSS frameworks** (pure custom CSS)  
✅ **WhatsApp integration** with wa.me links  
✅ **Mock data system** for immediate demo  
✅ **Supabase-ready** architecture  
✅ **Build successful** (no errors)  

## Category Colors

- **Salon**: `#FF6B9D` (pink)
- **Cafe**: `#4ECDC4` (teal)
- **Gym**: `#FFD93D` (yellow)
- **Interior Designer**: `#6BCF7F` (green)
- **Photographer**: `#A855F7` (purple)

## Status Badges

- **New lead**: Green dot with pulse animation
- **Pitched**: Grey dot (static)

## WhatsApp Message Template

```
Hi, I'm Abir from Byters. I made a free demo website for {biz_name}. 
I can make it live in 2 days for just ₹5,000. 
Interested? Here's a preview: [demo link]
```

---

**Built with**: React 19, Vite, Tailwind-inspired CSS, Supabase-ready 🚀