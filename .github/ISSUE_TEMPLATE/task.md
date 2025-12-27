---
name: Task
about: 개선 작업이나 리팩토링을 등록하세요
title: '[Task]: '
labels: task
assignees: ''
---

## Description
작업에 대한 명확하고 간결한 설명을 작성해주세요.

## Goal
이 작업을 통해 달성하고자 하는 목표를 설명해주세요.

## Tasks
- [ ] 작업 항목 1
- [ ] 작업 항목 2
- [ ] 작업 항목 3

## Related Issues
관련된 다른 이슈가 있다면 링크해주세요.

## Additional Notes
기타 참고할 자료나 정보를 작성해주세요.

---

## Example

**Title:** `[Task]: API 호출 로직 모듈화`

**Description:**
현재 각 페이지에서 개별적으로 API를 호출하는 로직을 공통 모듈로 추출하여 재사용성을 높이고 유지보수를 개선합니다.

**Goal:**
- API 호출 로직의 중복 제거
- 에러 처리 통일
- 코드 가독성 및 유지보수성 향상

**Tasks:**
- [ ] `utils/api/` 디렉토리에 공통 API 모듈 생성
- [ ] 인증 토큰 관리 로직 통합
- [ ] 에러 핸들링 공통 함수 구현
- [ ] 기존 페이지들의 API 호출 로직을 새 모듈로 마이그레이션
- [ ] 테스트 코드 작성

**Related Issues:**
- Related to #67 (API 에러 처리 개선)
- Related to #89 (코드 리팩토링)

**Related Commit:**
```
refactor(api): API 호출 로직 모듈화 (#89)
```
