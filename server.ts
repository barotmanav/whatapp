import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes - must come FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Background WhatsApp Proxy Dispatcher
  app.post('/api/send-whatsapp', async (req, res) => {
    const { phone, message, gatewayUrl, gatewayMethod, gatewayHeaders, gatewayBodyTemplate, gatewayEnabled, gatewayType } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Recipient phone and message text are required.' });
    }

    console.log(`[WhatsApp Backend] Preparing dispatch to ${phone}: "${message.substring(0, 40)}..."`);

    // If using custom background API Gateway, perform server-to-server proxy dispatch to bypass CORS
    if (gatewayEnabled && gatewayType === 'custom-api' && gatewayUrl) {
      try {
        let finalUrl = gatewayUrl;
        let finalBody = gatewayBodyTemplate || '';
        const method = gatewayMethod || 'POST';

        // Parse custom headers
        let headersObj: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (gatewayHeaders) {
          try {
            headersObj = { ...headersObj, ...JSON.parse(gatewayHeaders) };
          } catch (e) {
            console.warn('[WhatsApp Backend] Custom headers JSON parsing failed, using default JSON content-type.');
          }
        }

        // Perform template substitutions
        finalUrl = finalUrl.replace(/\{\{phone\}\}/g, phone).replace(/\{\{message\}\}/g, encodeURIComponent(message));
        if (finalBody) {
          const isJsonBody = headersObj['Content-Type']?.includes('json') || finalBody.trim().startsWith('{');
          if (isJsonBody) {
            const escapedMessage = JSON.stringify(message).slice(1, -1);
            finalBody = finalBody.replace(/\{\{phone\}\}/g, phone).replace(/\{\{message\}\}/g, escapedMessage);
          } else {
            finalBody = finalBody.replace(/\{\{phone\}\}/g, phone).replace(/\{\{message\}\}/g, message);
          }
        }

        console.log(`[WhatsApp Backend Proxy] Forwarding request to external gateway: ${method} ${finalUrl}`);

        const fetchOptions: RequestInit = {
          method: method,
          headers: headersObj,
        };

        if (method === 'POST') {
          fetchOptions.body = finalBody;
        }

        const externalResponse = await fetch(finalUrl, fetchOptions);
        const responseBody = await externalResponse.text();

        console.log(`[WhatsApp Backend Proxy] External gateway returned status ${externalResponse.status}`);

        if (externalResponse.ok) {
          return res.status(200).json({
            success: true,
            gateway: 'external',
            status: externalResponse.status,
            data: responseBody
          });
        } else {
          let parsedErrorMsg = `Gateway returned status ${externalResponse.status}`;
          try {
            const errJson = JSON.parse(responseBody);
            if (errJson.error?.message) {
              parsedErrorMsg = `Meta API Error (${errJson.error.code || externalResponse.status}): ${errJson.error.message}`;
            }
          } catch (e) {
            // fallback
          }

          return res.status(externalResponse.status).json({
            success: false,
            gateway: 'external',
            status: externalResponse.status,
            error: parsedErrorMsg,
            details: responseBody
          });
        }
      } catch (err: any) {
        console.error('[WhatsApp Backend Error] Server proxy failed:', err);
        return res.status(502).json({
          success: false,
          gateway: 'external',
          error: `External connection exception: ${err.message || 'Unknown error'}`
        });
      }
    }

    // Default simulated background dispatch with realistic processing latency
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`[WhatsApp Backend] Simulated dispatch success to ${phone}`);

    return res.status(200).json({
      success: true,
      gateway: 'simulated',
      messageId: `msg-sim-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString()
    });
  });

  // Vite integration middleware for asset hosting
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Vite Dev Server] Mounted successfully.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express Server] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
