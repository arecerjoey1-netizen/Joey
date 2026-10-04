import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '25mb' }));

  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Multi-turn Gemini Chatbot Endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const {
        messages = [],
        systemInstruction = 'You are WhisperPulse AI, a discreet, helpful WhatsApp-style conversational assistant. Keep responses engaging, concise, and formatted with markdown when helpful.',
        model = 'gemini-3.8-flash',
      } = req.body;

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured in the environment.',
        });
      }

      // Convert messages to genai format
      const formattedContents = messages.map(
        (m: { role: 'user' | 'model'; content: string }) => ({
          role: m.role,
          parts: [{ text: m.content }],
        })
      );

      // Select valid model or default
      const allowedModels = [
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro-preview',
      ];
      const selectedModel = allowedModels.includes(model)
        ? model
        : 'gemini-3.8-flash';

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: formattedContents,
        config: {
          systemInstruction,
        },
      });

      const responseText = response.text || '';
      return res.json({ text: responseText, model: selectedModel });
    } catch (err: any) {
      console.error('Chat error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to generate chat response',
      });
    }
  });

  // Text-To-Speech with gemini-3.8-flash-tts
  app.post('/api/tts', async (req: Request, res: Response) => {
    try {
      const {
        text,
        voiceName = 'Zephyr',
        style = 'Natural, friendly WhatsApp voice note',
      } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text prompt is required.' });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured.',
        });
      }

      // Voice personas: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
      const chosenVoice = validVoices.includes(voiceName)
        ? voiceName
        : 'Zephyr';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.slice(0, 1000),
                speechMetadata: {
                  style,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        return res.status(500).json({
          error: 'No audio returned from Gemini TTS',
        });
      }

      return res.json({
        audio: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (err: any) {
      console.error('TTS error:', err);
      // Fallback try with gemini-3.8-flash-lite-tts if flagship tts is busy
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [{ text: (req.body.text || '').slice(0, 600) }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });
        const fallbackAudio =
          fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (fallbackAudio) {
          return res.json({
            audio: fallbackAudio,
            mimeType: 'audio/wav',
          });
        }
      } catch (fallbackErr) {
        console.error('TTS fallback error:', fallbackErr);
      }

      return res.status(500).json({
        error: err.message || 'TTS generation failed',
      });
    }
  });

  // Real-time Encrypted Voice Call AI Turn
  app.post('/api/voice-call-turn', async (req: Request, res: Response) => {
    try {
      const { userTranscript, callerName = 'Caller', chatContext = [] } = req.body;

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
      }

      // Generate a spoken conversational response
      const systemInstruction = `You are on a live end-to-end encrypted voice call in WhisperPulse as ${callerName}. Keep your answer conversational, natural, brief (1-3 sentences maximum like someone talking on the phone), and realistic. No markdown formatting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          ...chatContext.slice(-6).map((c: any) => ({
            role: c.role === 'user' ? 'user' : 'model',
            parts: [{ text: c.content }],
          })),
          {
            role: 'user',
            parts: [{ text: userTranscript || 'Hello? Can you hear me?' }],
          },
        ],
        config: { systemInstruction },
      });

      const replyText = response.text || 'I hear you loud and clear. Everything is securely encrypted.';

      // Synthesize spoken voice response using gemini-3.8-flash-tts
      let base64Audio: string | undefined;
      try {
        const ttsResp = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: replyText,
                  speechMetadata: {
                    style: 'Warm, natural telephone voice',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Zephyr' },
              },
            },
          },
        });
        base64Audio = ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      } catch (audioErr) {
        console.warn('Voice call TTS audio failed:', audioErr);
      }

      return res.json({
        replyText,
        audio: base64Audio || null,
        mimeType: base64Audio ? 'audio/wav' : null,
      });
    } catch (err: any) {
      console.error('Voice call turn error:', err);
      return res.status(500).json({ error: err.message || 'Voice call turn failed' });
    }
  });

  // Fast autocorrect suggestions endpoint
  app.post('/api/autocorrect', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text || text.trim().length === 0) {
        return res.json({ corrected: text, suggestions: [] });
      }

      if (!apiKey) {
        return res.json({ corrected: text, suggestions: [] });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Fix any typos, spelling errors, or punctuation in this typed chat snippet: "${text}". Return ONLY the corrected string, nothing else. If there are no mistakes, return the original text exactly.`,
              },
            ],
          },
        ],
      });

      const corrected = response.text ? response.text.trim() : text;
      return res.json({ corrected });
    } catch (err) {
      return res.json({ corrected: req.body.text });
    }
  });

  // Mount Vite middleware in dev or static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WhisperPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
