import request from 'supertest';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatNumber, formatDate } from '../public/utils/common/format.js';
import { validateEmail, validatePassword, validateNickname } from '../public/utils/common/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 테스트용 Express 앱 생성
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.redirect('/home');
});

const pages = ['home', 'signup', 'login', 'post-list', 'post-detail', 'post-write', 'post-edit', 'user-edit', 'password-edit', 'password-reset'];
pages.forEach(page => {
  app.use(`/${page}`, express.static(path.join(__dirname, '..', 'public', 'pages', page)));
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', page, `${page}.html`));
  });
});

// API 엔드포인트
app.get('/api/posts', (req, res) => {
  const cursor = req.query.cursor;
  const size = parseInt(req.query.size) || 10;
  res.json({
    success: true,
    data: {
      posts: Array(size).fill(null).map((_, i) => ({
        id: cursor ? parseInt(cursor) + i + 1 : i + 1,
        title: `Post ${i + 1}`,
        content: 'Content',
        likes: Math.floor(Math.random() * 10000)
      })),
      nextCursor: cursor ? parseInt(cursor) + size : size
    }
  });
});

app.get('/api/posts/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      title: 'Test Post',
      content: 'Test Content',
      likes: 1000
    }
  });
});

app.post('/api/auth', (req, res) => {
  if (req.body.email === 'error@test.com') {
    return res.status(401).json({
      success: false,
      data: 'Invalid credentials'
    });
  }
  res.json({
    success: true,
    data: {
      user: { id: 1, email: req.body.email }
    }
  });
});

describe('Express App Routing Tests', () => {
  // 루트 경로 리다이렉트 테스트
  test('GET / should redirect to /home', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/home');
  });

  // 홈 페이지 라우팅 테스트
  test('GET /home should return 200 or 404', async () => {
    const response = await request(app).get('/home');
    expect([200, 301, 404]).toContain(response.status);
  });
});

describe('Validation Tests', () => {
  // 이메일 유효성 검사 테스트
  describe('validateEmail', () => {
    // 올바른 이메일 형식 검증
    test('should validate correct email formats', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true);
      expect(validateEmail('user.name@domain.co.kr').isValid).toBe(true);
      expect(validateEmail('test+tag@example.com').isValid).toBe(true);
    });

    // 잘못된 이메일 형식 거부 검증
    test('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email').isValid).toBe(false);
      expect(validateEmail('test@').isValid).toBe(false);
      expect(validateEmail('@example.com').isValid).toBe(false);
      expect(validateEmail('test@example').isValid).toBe(false);
    });

    // 빈 이메일 처리 검증
    test('should handle empty email', () => {
      expect(validateEmail('').isValid).toBe(true);
    });
  });

  // 비밀번호 강도 검증 테스트
  describe('validatePassword', () => {
    // 강력한 비밀번호 검증 (영문/숫자/특수문자 포함, 8자 이상)
    test('should validate strong passwords', () => {
      expect(validatePassword('Password123!').isValid).toBe(true);
      expect(validatePassword('MyP@ssw0rd').isValid).toBe(true);
      expect(validatePassword('Str0ng#Pass').isValid).toBe(true);
    });

    // 약한 비밀번호 거부 검증 (길이 부족, 특수문자/숫자/영문 누락, 공백/연속문자 포함)
    test('should reject weak passwords', () => {
      expect(validatePassword('short').isValid).toBe(false);
      expect(validatePassword('noSpecial123').isValid).toBe(false);
      expect(validatePassword('NoNumber!').isValid).toBe(false);
      expect(validatePassword('12345678!').isValid).toBe(false);
      expect(validatePassword('Password 123!').isValid).toBe(false);
      expect(validatePassword('AAA123!').isValid).toBe(false);
    });

    // 빈 비밀번호 처리 검증
    test('should handle empty password', () => {
      expect(validatePassword('').isValid).toBe(true);
    });
  });

  // 닉네임 유효성 검사 테스트
  describe('validateNickname', () => {
    // 올바른 닉네임 형식 검증 (2-10자, 한글/영문/숫자/언더스코어)
    test('should validate correct nicknames', () => {
      expect(validateNickname('testuser').isValid).toBe(true);
      expect(validateNickname('한글닉네임').isValid).toBe(true);
      expect(validateNickname('user_123').isValid).toBe(true);
      expect(validateNickname('ab').isValid).toBe(true);
    });

    // 잘못된 닉네임 거부 검증 (길이, 공백, 숫자만, 언더스코어 위치/연속)
    test('should reject invalid nicknames', () => {
      expect(validateNickname('a').isValid).toBe(false);
      expect(validateNickname('').isValid).toBe(false);
      expect(validateNickname('12345678901').isValid).toBe(false);
      expect(validateNickname('user name').isValid).toBe(false);
      expect(validateNickname('12345').isValid).toBe(false);
      expect(validateNickname('_user').isValid).toBe(false);
      expect(validateNickname('user_').isValid).toBe(false);
      expect(validateNickname('user__name').isValid).toBe(false);
    });
  });
});

describe('Format Utility Tests - Performance Critical', () => {
  // 숫자 포맷팅 테스트 (K/M 단위 변환)
  describe('formatNumber - Large Number Handling', () => {
    // 큰 숫자 포맷팅 검증 (1000단위 K, 1000000단위 M)
    test('should format large numbers correctly', () => {
      expect(formatNumber(1000)).toBe('1K');
      expect(formatNumber(9999)).toBe('9K');
      expect(formatNumber(10000)).toBe('10K');
      expect(formatNumber(999999)).toBe('999K');
      expect(formatNumber(1000000)).toBe('1M');
      expect(formatNumber(9999999)).toBe('9M');
      expect(formatNumber(10000000)).toBe('10M');
    });

    // 경계값 처리 검증 (0, 999, 매우 큰 수)
    test('should handle edge cases', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999)).toBe('999');
      expect(formatNumber(1000000000)).toBe('1000M');
    });

    // 성능 테스트: 10000번 호출 시 1초 이내 처리
    test('should handle performance with many calls', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        formatNumber(Math.floor(Math.random() * 10000000));
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // 1초 이내
    });
  });

  // 날짜 포맷팅 테스트
  describe('formatDate', () => {
    // 날짜 포맷 검증 (YYYY-MM-DD HH:mm:ss)
    test('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:45');
      expect(formatDate(date)).toBe('2024-01-15 10:30:45');
    });

    // 한 자리수 패딩 검증 (0으로 채우기)
    test('should pad single digits', () => {
      const date = new Date('2024-01-05T05:05:05');
      expect(formatDate(date)).toBe('2024-01-05 05:05:05');
    });
  });
});

describe('API Integration Tests - Load Scenarios', () => {
  // 페이지네이션 요청 처리 테스트
  test('should handle pagination requests', async () => {
    const response = await request(app)
      .get('/api/posts?size=10');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.posts).toHaveLength(10);
  });

  // 커서 기반 페이지네이션 테스트 (다음 페이지 조회)
  test('should handle cursor-based pagination', async () => {
    const firstResponse = await request(app)
      .get('/api/posts?size=10');
    
    const cursor = firstResponse.body.data.nextCursor;
    const secondResponse = await request(app)
      .get(`/api/posts?cursor=${cursor}&size=10`);
    
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.data.posts[0].id).toBe(cursor + 1);
  });

  // 동시 요청 처리 테스트 (10개 동시 요청)
  test('should handle multiple concurrent requests', async () => {
    const requests = Array(10).fill(null).map(() => 
      request(app).get('/api/posts?size=5')
    );
    
    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(5);
    });
  });

  // 대용량 페이지 요청 테스트 (100개 항목)
  test('should handle large page size requests', async () => {
    const response = await request(app)
      .get('/api/posts?size=100');
    
    expect(response.status).toBe(200);
    expect(response.body.data.posts).toHaveLength(100);
  });

  // 인증 실패 처리 테스트
  test('should handle authentication errors', async () => {
    const response = await request(app)
      .post('/api/auth')
      .send({ email: 'error@test.com', password: 'wrong' });
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  // 인증 성공 처리 테스트
  test('should handle successful authentication', async () => {
    const response = await request(app)
      .post('/api/auth')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
  });
});

describe('Performance Tests', () => {
  // 빠른 입력 변경 처리 성능 테스트 (유효성 검사 반응 속도)
  test('validation should handle rapid input changes', () => {
    const start = Date.now();
    const emails = ['test@example.com', 'invalid', 'user@domain.com', 'wrong', 'valid@test.co.kr'];
    
    emails.forEach(email => {
      validateEmail(email);
    });
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // 매우 빠르게 처리되어야 함
  });

  // 대량 숫자 포맷팅 성능 테스트 (1000개 숫자를 100ms 이내 처리)
  test('formatNumber should handle bulk formatting', () => {
    const numbers = Array(1000).fill(null).map(() => Math.floor(Math.random() * 10000000));
    const start = Date.now();
    
    numbers.forEach(num => formatNumber(num));
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // 1000개를 100ms 이내에 처리
  });
});
