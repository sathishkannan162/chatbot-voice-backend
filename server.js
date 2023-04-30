import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import multer from 'multer';
import {Readable} from 'stream';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// print the request endpoint and req method in console
app.use((req, _res, next) => {
  console.log(req.method, req.url);
  next();
});

app.get('/', (_req, res) => {
  res.send('Hello World!');
});


// Handle POST requests to /api/record
app.post('/api/record', upload.single('audioData'), async (req, res) => {
  const buffer = req.file.buffer;
  const audioStream = Readable.from(buffer);
  audioStream.path = req.file.originalname;
  let transcript;
  try {
    transcript = await openai.createTranscription(
      audioStream,
      'whisper-1',
      '',
      'json',
      0,
      'en'
    );
  } catch (e) {
    console.log(e);
  }

  res.json({ transcript: transcript.data.text });
});

// chatcompletion endpoint
app.post('/api/complete', async (req, res) => {
  const messages = [{role: 'system', content: 'You are helpful assistant.'}];
  messages.push(...req.body.messages);
  // Generate response using the OpenAI chatcompletion endpoint
  let response;
  try {
    response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });
  } catch (e) {
    console.log('error from completion',e);
  }
  res.json({ response: response.data.choices[0].message.content });
});

// return 404 if no route is matched
app.use('*',(_req, res) => {
  res.status(404).send('404 Not Found');
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
