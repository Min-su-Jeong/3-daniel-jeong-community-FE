import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT;

app.use(express.static(path.join(__dirname, 'public')));

// 회원가입 페이지 - 정적 파일 서빙 (Issue #1)
app.use('/signup', express.static(path.join(__dirname, 'public', 'pages', 'signup')));

// 회원가입 페이지
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'signup', 'signup.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});