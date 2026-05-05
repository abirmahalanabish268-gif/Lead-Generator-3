import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline } from './pipeline.js';
import { getCategoryNames } from './ingest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 3000;
const LEAD_LIMIT = 30;
const DEFAULT_CATEGORIES = [
  'Cafe', 'Salon', 'Photographer', 'Restaurant', 'Gym',
  'Dentist', 'Spa', 'Bakery', 'Coaching Center', 'Boutique',
];

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 Byters Lead Engine is running. Use the frontend at http://localhost:5173 or check /api/health.');
});

const DEMO_DIR = path.resolve(__dirname, '..', 'public', 'demo');
app.use('/demo', express.static(DEMO_DIR));

app.get('/api/categories', (_req, res) => {
  res.json({ categories: getCategoryNames() });
});

app.post('/api/generate-leads', async (req, res) => {
  try {
    const { category, city = 'India' } = req.body;
    const categories = category
      ? (Array.isArray(category) ? category : [category])
      : DEFAULT_CATEGORIES;
    console.log(`📡 API: Generate Leads — ${categories.join(', ')} in ${city} (exact: ${LEAD_LIMIT})`);

    const result = await runPipeline(categories, city, LEAD_LIMIT);

    res.json({
      success: true,
      message: 'Pipeline completed successfully',
      stats:     result.stats,
      topLeads:  result.topLeads,
    });
  } catch (error) {
    console.error('API Error /api/generate-leads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Byters Lead Engine running → http://localhost:${PORT}`);
  console.log(`📂 Demo sites served at  → http://localhost:${PORT}/demo/<slug>.html`);
  console.log(`🎯 Fixed limit: ${LEAD_LIMIT} local businesses in India per run`);
});
