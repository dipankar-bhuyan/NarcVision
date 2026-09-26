import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'drug-analysis-api',
        configureServer(server) {
          server.middlewares.use('/api/analyze-drug', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
              try {
                const { image, location } = JSON.parse(body);
                if (!image) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Image is required' }));
                  return;
                }

                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
                const prompt = `
                  Analyze this field drug test image. 
                  The image contains a test tube with a colored chemical reaction and a reference color calibration card.
                  1. Identify the color of the reaction in the test tube.
                  2. Match this color with the most similar color on the reference card.
                  3. Based on standard reagent test colors (Marquis, Mecke, Mandelin, etc.), predict the likely substance.
                  4. Provide a confidence score.
                  5. Include a brief technical explanation of the reaction.

                  Return the result as a JSON object with these fields:
                  {
                    "substance": "Name of drug",
                    "colorCode": "Reference card code",
                    "confidence": 0.95,
                    "explanation": "Brief description",
                    "detectedColor": "Hex or descriptive color",
                    "reagentType": "Likely reagent used"
                  }
                `;

                const response = await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: [
                    {
                      role: 'user',
                      parts: [
                        { text: prompt },
                        {
                          inlineData: {
                            data: image.split(',')[1],
                            mimeType: 'image/jpeg',
                          },
                        },
                      ],
                    },
                  ],
                });

                const text = response.response.text();
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const analysis = JSON.parse(jsonStr);

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  ...analysis,
                  timestamp: new Date().toISOString(),
                  location: location || 'Unknown',
                }));
              } catch (error) {
                console.error('Drug analysis error:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to analyze drug test' }));
              }
            });
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
