import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

if (!process.env.KAKAO_MAP_JAVASCRIPT_KEY) {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT;

app.use(express.static(path.join(__dirname, 'public')));

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 환경 변수 API 엔드포인트
app.get('/config', (req, res) => {
  res.json({
    KAKAO_MAP_JAVASCRIPT_KEY: process.env.KAKAO_MAP_JAVASCRIPT_KEY || ''
  });
});

// 루트 경로 - 메인 페이지로 리다이렉트
app.get('/', (req, res) => {
  res.redirect('/home');
});

// 폴더 기반으로 동적 라우팅 설정
const pagesDir = path.join(__dirname, 'public', 'pages');

const pages = fs
  .readdirSync(pagesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  // HTML 파일이 실제로 존재하는 폴더만 사용
  .filter((page) => {
    const htmlPath = path.join(pagesDir, page, `${page}.html`);
    return fs.existsSync(htmlPath);
  });

// 각 페이지에 대해 정적 파일 서빙과 HTML 라우팅 설정
pages.forEach((page) => {
  // 정적 파일 서빙 (CSS, JS 파일)
  app.use(`/${page}`, express.static(path.join(pagesDir, page)));
  
  // HTML 페이지 라우팅
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(pagesDir, page, `${page}.html`));
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Registered pages:', pages);
});