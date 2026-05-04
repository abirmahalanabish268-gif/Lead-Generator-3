# Template Management Feature

## Overview
A comprehensive message template system for managing WhatsApp pitches to local Indian businesses. Create, edit, and reuse message templates for different business categories.

## Key Features

### 1. Dual Tab Navigation
- **Lead Finder Tab**: Search for leads and send messages
- **Manage Templates Tab**: Create and customize templates per category

### 2. Per-Category Templates
Each business category has its own customizable template:
- **Salon**  
- **Cafe**  
- **Gym**  
- **Interior Designer**  
- **Photographer**  

### 3. Smart Variable System
Use variables that auto-populate when sending messages:

| Variable | Description | Example |
|----------|-------------|---------|
| `{name}` | Contact person name | Abir |
| `{biz_name}` | Business name | Glamour Studio |
| `{demo_link}` | Demo website link | [demo link] |

### 4. Default Templates (Pre-installed)

#### Salon Template
```
Hi {name}, I'm Abir from Byters. I made a free demo website for {biz_name}. I can make it live in 2 days for just ₹5,000. Interested? Here's a preview: {demo_link}
```

#### Cafe Template
```
Hi {name}, I'm from Byters. We create beautiful websites for cafes like yours. Let's get your business online in 48 hours for just ₹5,000. Preview: {demo_link}
```

#### Gym Template
```
Hi {name}, I'm from Byters. Your gym deserves an online presence! I'll build a demo website in 2 days for ₹5,000. Check it out: {demo_link}
```

#### Interior Designer Template
```
Hi {name}, I'm from Byters. Showcase your design portfolio online! I'll create a demo website in 2 days for ₹5,000. Preview: {demo_link}
```

#### Photographer Template
```
Hi {name}, I'm from Byters. Display your best shots online! I'll build a portfolio website in 2 days for ₹5,000. See demo: {demo_link}
```

## UI Components

### Template Cards
Each template is displayed as an elegant card showing:
- Category badge (color-coded)
- Message preview with line-number styling
- Variable tags at the bottom
- Edit and Reset buttons

### Edit Modal
A modal dialog for editing templates:
- Large text area for full message view
- Variable reference panel
- Save and Reset options

### Visual Design
- **Glassmorphism**: Frosted glass effects on cards
- **Gradient Borders**: Accent gradient on hover
- **Staggered Animations**: Cards slide in with delays
- **Variable Tags**: Distinctive pill-style tags
- **Line Preview**: Subtle line-number background in preview area

## Workflow

### Editing a Template
1. Switch to "Manage Templates" tab
2. Click "Edit" button on any category card
3. Modify the message in the modal
4. Use variables `{name}`, `{biz_name}`, `{demo_link}`
5. Click "Save Template" or "Reset to Default"

### Using Templates
1. Go to "Lead Finder" tab
2. Search for leads by city and category
3. Click "Send on WhatsApp"
4. Variables auto-replace with actual values
5. WhatsApp opens with personalized message

## Technical Details

### State Management
```javascript
const [templates, setTemplates] = useState(defaultTemplates)
const [editingTemplate, setEditingTemplate] = useState(null)
const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
```

### Template Variables Replacement
```javascript
const message = template
  .replace(/{name}/g, contactName)
  .replace(/{biz_name}/g, businessName)
  .replace(/{demo_link}/g, demoUrl)
```

### Persistence
- Templates stored in React state (in-memory)
- Future: Will sync with Supabase database
- Future: Export/import as JSON

## Future Enhancements

1. **A/B Testing**: Save multiple template versions and track conversion rates
2. **AI Suggestions**: Groq LLM can suggest template improvements
3. **Bulk Operations**: Apply template changes across multiple categories
4. **Version History**: Track template changes over time
5. **Analytics**: Track which templates get most responses
6. **Category Expansion**: Add more business categories
7. **Multi-language**: Support for Hindi and regional languages
8. **Template Sharing**: Share successful templates with team

## Responsive Design

- **Desktop**: Grid layout with 3-4 columns
- **Tablet**: 2-column grid
- **Mobile**: Single column stack
- **Modal**: Full-screen on mobile, centered on desktop

## Accessibility

- Focus management in modal
- High contrast text
- Clear visual hierarchy
- Keyboard navigable
- Screen reader friendly labels

## Color Coding

| Category | Color | Hex |
|----------|-------|-----|
| Salon | Pink | `#FF6B9D` |
| Cafe | Teal | `#4ECDC4` |
| Gym | Yellow | `#FFD93D` |
| Interior Designer | Green | `#6BCF7F` |
| Photographer | Purple | `#A855F7` |

## CSS Highlights

```css
/* Glassmorphism effect */
background: linear-gradient(145deg, var(--bg-secondary), var(--bg-card));
backdrop-filter: blur(10px);

/* Template preview lines */
background: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 28px,
  rgba(10, 132, 255, 0.03) 28px,
  rgba(10, 132, 255, 0.03) 29px
);

/* Variable tags */
background: rgba(10, 132, 255, 0.12);
border: 1px solid rgba(10, 132, 255, 0.2);
```

## File Structure

```
src/
  ├── App.jsx          # Template state and logic
  ├── App.css          # Template UI styles
  └── main.jsx         # Entry point
```

## Benefits

✅ **Reusable** - Write once, use for hundreds of leads  
✅ **Customizable** - Tailor messages per business type  
✅ **Fast** - Instant WhatsApp generation  
✅ **Professional** - Consistent messaging  
✅ **Scalable** - Easy to add new categories  
✅ **Team-friendly** - Share templates with team members  

## Usage Example

**Before:**  
Manually typing similar messages for 50 leads → 2 hours  

**After:**  
Template + automation → 50 leads in 10 minutes  

**Time Saved:** 92% ⏱️🚀