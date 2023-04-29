import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + originalExtension);
  },
});

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

// Handle POST requests to /api/record
app.post('/api/record', upload.single('audioData'), async (req, res) => {
  // TODO: you shouldn't save the file. Just use the buffer. Make change.
  const filePath = req.file.path;
  let transcript;
  try {
    transcript = await openai.createTranscription(
      // you can also use buffer instad of file path
      fs.createReadStream(filePath),
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
// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
