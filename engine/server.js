import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline } from './pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Root Route ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('🚀 Byters Lead Engine is running. Use the frontend at http://localhost:5173 or check /api/health.');
});

// ── Serve generated demo sites statically ──────────────────────────────────
// Files written to /public/demo/*.html are served at /demo/*.html
// e.g. http://localhost:3000/demo/brew-haven-cafe.html
const DEMO_DIR = path.resolve(__dirname, '..', 'public', 'demo');
app.use('/demo', express.static(DEMO_DIR));

// ── Lead Generation Endpoint ───────────────────────────────────────────────
app.post('/api/generate-leads', async (req, res) => {
  try {
    const { category = 'Business', city = 'India', limit = 30 } = req.body;
    console.log(`📡 API: Generate Leads — ${category} in ${city} (max: ${limit})`);

    const result = await runPipeline(category, city, limit);

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

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Byters Lead Engine running → http://localhost:${PORT}`);
  console.log(`📂 Demo sites served at  → http://localhost:${PORT}/demo/<slug>.html`);
});
