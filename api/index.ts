import express from 'express';
import cors from 'cors';
import { Readable } from 'stream';

const app = express();

app.use(cors());
app.use(express.json());

// API constraints check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Loader API Proxy - Initialization
app.get("/api/loader/init", async (req, res) => {
  try {
    const { url, format } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    
    const fetchUrl = `https://loader.to/ajax/download.php?format=${format || '1080'}&url=${encodeURIComponent(url as string)}`;
    const response = await fetch(fetchUrl);
    const data = await response.json();
    
    res.json(data);
  } catch (e: any) {
    console.error('Loader init error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Loader API Proxy - Progress Polling
app.get("/api/loader/progress", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }
    
    const fetchUrl = `https://p.savenow.to/api/progress?id=${id}`;
    const response = await fetch(fetchUrl);
    const data = await response.json();
    
    res.json(data);
  } catch (e: any) {
    console.error('Loader progress error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Loader API Proxy - File Stream Streaming
app.get("/api/loader/download", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    
    const response = await fetch(url as string);
    if (!response.ok) {
      throw new Error(`Failed to fetch from remote: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    let contentDisposition = response.headers.get('content-disposition');
    const contentLength = response.headers.get('content-length');

    // Force attachment so browsers download it instead of navigating to or playing the video
    if (!contentDisposition || !contentDisposition.includes('attachment')) {
      contentDisposition = `attachment; filename="video-${Date.now()}.mp4"`;
    }

    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    if (response.body) {
      // dynamic import or require to stream it properly? 
      // We can just use the Readable polyfill provided in server environments
      const nodeStream = Readable.fromWeb(response.body as any);
      nodeStream.pipe(res);
    } else {
      res.status(500).send('No body in response');
    }
  } catch (e: any) {
    console.error('Loader download proxy error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
});

export default app;
