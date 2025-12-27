---
name: Bug Report
about: 버그를 발견하셨나요? 알려주세요
title: '[Bug]: '
labels: bug
assignees: ''
---

## Description
버그에 대한 명확하고 간결한 설명을 작성해주세요.

## Steps to Reproduce
버그를 재현하는 단계:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
예상했던 동작을 설명해주세요.

## Actual Behavior
실제로 발생한 동작을 설명해주세요.

## Screenshots
가능하다면 스크린샷을 추가해주세요.

## Environment
- OS: [e.g. macOS 14.0, Windows 11]
- Browser: [e.g. Chrome 120, Safari 17]
- Version: [e.g. 1.0.0]

## Additional Context
기타 추가 정보나 컨텍스트를 작성해주세요.

---

## Example

**Title:** `[Bug]: 로그인 버튼 클릭 시 500 에러 발생`

**Description:**
로그인 페이지에서 로그인 버튼을 클릭하면 서버에서 500 에러가 발생합니다.

**Steps to Reproduce:**
1. `/login` 페이지로 이동
2. 이메일과 비밀번호 입력
3. 로그인 버튼 클릭
4. 콘솔에서 500 에러 확인

**Expected Behavior:**
로그인이 정상적으로 완료되고 홈 페이지로 리다이렉트되어야 합니다.

**Actual Behavior:**
서버에서 500 Internal Server Error가 발생하고 로그인되지 않습니다.

**Environment:**
- OS: macOS 14.0
- Browser: Chrome 120
- Version: 1.0.0

**Related Commit:**
```
fix(login): 로그인 API 호출 시 500 에러 수정 (#123)
```
