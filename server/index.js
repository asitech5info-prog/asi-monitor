import express from 'express';
import cors from 'cors';
import { fetchFacebookPageData } from './fbService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'ASI Monitor Server', timestamp: new Date().toISOString() });
});

// Single page info endpoint
app.get('/api/page-info', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const data = await fetchFacebookPageData(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch Facebook page data' });
  }
});

// Batch page info endpoint
app.post('/api/batch-info', async (req, res) => {
  const { urls } = req.body;
  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: 'urls must be an array' });
  }

  try {
    const results = await Promise.all(urls.map(u => fetchFacebookPageData(u)));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to process batch URLs' });
  }
});

export default app;

if (process.env.NODE_ENV !== 'test' && !process.env.VITE) {
  app.listen(PORT, () => {
    console.log(`[ASI Monitor API] Running on http://localhost:${PORT}`);
  });
}
