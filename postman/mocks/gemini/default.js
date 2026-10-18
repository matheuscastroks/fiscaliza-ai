// Local GenerateContent contract fixture; not an image classifier.
// Based on https://ai.google.dev/gemini-api/docs/generate-content/image-understanding
const http = require('node:http');
const { Buffer } = require('node:buffer');
http
  .createServer(async (req, res) => {
    res.setHeader('content-type', 'application/json');
    if (
      req.method !== 'POST' ||
      !/^\/v1beta\/models\/[^/]+:generateContent$/.test(req.url)
    ) {
      res.writeHead(501);
      return res.end(
        JSON.stringify({ error: { message: 'Endpoint outside this fixture' } }),
      );
    }
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const request = JSON.parse(raw);
      const parts = request.contents?.[0]?.parts || [];
      const image = parts.find((part) => part.inline_data)?.inline_data;
      if (
        !image ||
        image.mime_type !== 'image/webp' ||
        Buffer.from(image.data, 'base64').toString('ascii', 0, 4) !== 'RIFF'
      ) {
        res.writeHead(400);
        return res.end(
          JSON.stringify({
            error: { message: 'Expected normalized inline WebP photo' },
          }),
        );
      }
      if (parts[0].text.includes('SIMULATE_UNAVAILABLE')) {
        res.writeHead(503);
        return res.end(
          JSON.stringify({ error: { message: 'Fixture unavailable' } }),
        );
      }
      const result = {
        suggestedTitle: 'Iluminação no trajeto de pedestres',
        suggestedDescription:
          'Há postes de iluminação junto ao percurso. Descreva qual ponto apresenta falha para orientar a vistoria.',
        suggestedCategory: 'lighting',
        suggestedPriority: 'medium',
        confidence: 0.8,
      };
      res.end(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(result) }] } },
          ],
        }),
      );
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ error: { message: 'Invalid JSON' } }));
    }
  })
  .listen(process.env.PORT);
