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

// 동적 라우팅 설정
const pages = ['signup', 'login', 'post-list', 'post-detail'];

// 각 페이지에 대해 정적 파일 서빙과 HTML 라우팅 설정
pages.forEach(page => {
  // 정적 파일 서빙 (CSS, JS 파일)
  app.use(`/${page}`, express.static(path.join(__dirname, 'public', 'pages', page)));
  
  // HTML 페이지 라우팅
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', page, `${page}.html`));
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});