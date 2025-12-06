import { validateEmail, validatePassword, validateNickname, createPasswordMatchValidator } from '../public/utils/common/validation.js';
import { getUserFromStorage, saveUserToStorage, requireLogin } from '../public/utils/common/user.js';

const createStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
};

global.localStorage = createStorageMock();
global.sessionStorage = createStorageMock();

describe('입력 검증', () => {
  describe('validateEmail', () => {
    test('유효한 이메일 주소 검증', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.kr'];
      validEmails.forEach(email => {
        expect(validateEmail(email).isValid).toBe(true);
      });
    });

    test('유효하지 않은 이메일 주소 거부', () => {
      const invalidEmails = ['invalid-email', 'test@', '@example.com'];
      invalidEmails.forEach(email => {
        expect(validateEmail(email).isValid).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    test('요구사항을 만족하는 비밀번호 검증', () => {
      const validPasswords = ['Password123!', 'MyP@ssw0rd'];
      validPasswords.forEach(password => {
        expect(validatePassword(password).isValid).toBe(true);
      });
    });

    test('요구사항을 만족하지 않는 비밀번호 거부', () => {
      const invalidPasswords = [
        'short',
        'noSpecial123',
        'NoNumber!',
        '12345678!',
        'Password 123!'
      ];
      invalidPasswords.forEach(password => {
        expect(validatePassword(password).isValid).toBe(false);
      });
    });
  });

  describe('validateNickname', () => {
    test('유효한 닉네임 검증', () => {
      const validNicknames = ['testuser', '한글닉네임', 'user_123'];
      validNicknames.forEach(nickname => {
        expect(validateNickname(nickname).isValid).toBe(true);
      });
    });

    test('유효하지 않은 닉네임 거부', () => {
      const invalidNicknames = ['a', 'user name', '12345', '_user', 'user_'];
      invalidNicknames.forEach(nickname => {
        expect(validateNickname(nickname).isValid).toBe(false);
      });
    });
  });
});

describe('비밀번호 확인', () => {
  test('일치하는 비밀번호 검증', () => {
    const passwordInput = { value: 'Password123!' };
    const validator = createPasswordMatchValidator(passwordInput);
    const result = validator('Password123!');

    expect(result.isValid).toBe(true);
    expect(result.message).toBe('');
  });

  test('불일치하는 비밀번호 거부', () => {
    const passwordInput = { value: 'Password123!' };
    const validator = createPasswordMatchValidator(passwordInput);
    const result = validator('Different123!');

    expect(result.isValid).toBe(false);
    expect(result.message).toBe('비밀번호가 일치하지 않습니다');
  });
});

describe('사용자 정보 관리', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('localStorage에 사용자 정보 저장 및 조회', () => {
    const userData = { id: 1, email: 'test@example.com', nickname: 'testuser' };
    saveUserToStorage(userData, true);
    const retrieved = getUserFromStorage();

    expect(retrieved).toEqual(userData);
  });

  test('sessionStorage에 사용자 정보 저장 및 조회', () => {
    const userData = { id: 1, email: 'test@example.com', nickname: 'testuser' };
    saveUserToStorage(userData, false);
    const retrieved = getUserFromStorage();

    expect(retrieved).toEqual(userData);
  });

  test('로그인 상태에서 requireLogin이 true 반환', () => {
    const userData = { id: 1, email: 'test@example.com' };
    saveUserToStorage(userData, true);
    const { isLoggedIn, user } = requireLogin();

    expect(isLoggedIn).toBe(true);
    expect(user).toEqual(userData);
  });

  test('비로그인 상태에서 requireLogin이 false 반환', () => {
    const { isLoggedIn, user } = requireLogin();

    expect(isLoggedIn).toBe(false);
    expect(user).toBe(null);
  });
});

describe('보안', () => {
  test('SQL injection 패턴 포함 이메일 거부', () => {
    const sqlInjection = "test@example.com'; DROP TABLE users; --";
    const result = validateEmail(sqlInjection);

    expect(result.isValid).toBe(false);
  });

  test('XSS 공격 패턴 포함 닉네임 거부', () => {
    const maliciousNickname = 'user<script>alert("XSS")</script>';
    const result = validateNickname(maliciousNickname);

    expect(result.isValid).toBe(false);
  });
});
