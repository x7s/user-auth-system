import { Runware } from '@runware/sdk-js';
import WebSocket from 'ws';

const runware = new Runware({
  apiKey: process.env.RUNWARE_API_KEY,
  options: {
    constructor: WebSocket
  }
});

export const renderImageForm = (req, res) => {
  res.render('ai-generate', {
    title: 'Генерирай изображение с AI',
    imageUrl: null,
    error: null,
  });
};

export const generateImage = async (req, res) => {
  const { prompt } = req.body;

  try {
    const images = await runware.requestImages({
      positivePrompt: prompt,
      model: 'runware:101@1',
      width: 512,
      height: 512
    });

    const imageUrl = images[0]?.imageURL;

    res.render('ai-generate', {
      title: 'Резултат от AI генерация',
      imageUrl,
      error: null
    });
  } catch (err) {
    console.error('[Runware Error]', err.message || err);

    res.render('ai-generate', {
      title: 'Грешка при AI генерация',
      imageUrl: null,
      error: 'Възникна грешка при генериране на изображението. Моля, опитай отново.'
    });
  }
};