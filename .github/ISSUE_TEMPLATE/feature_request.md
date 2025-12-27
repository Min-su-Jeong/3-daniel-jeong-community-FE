---
name: Feature Request
about: 새로운 기능을 제안해주세요
title: '[Feature]: '
labels: enhancement
assignees: ''
---

## Description
제안하는 기능에 대한 명확하고 간결한 설명을 작성해주세요.

## Problem / Motivation
이 기능이 해결할 문제나 필요성을 설명해주세요.
예: 현재 [...] 때문에 불편합니다.

## Proposed Solution
구현하고 싶은 기능에 대한 설명을 작성해주세요.

## Alternatives Considered
고려한 다른 해결책이나 기능이 있다면 설명해주세요.

## Additional Context
기타 스크린샷, 참고 자료, 관련 이슈 등을 추가해주세요.

---

## Example

**Title:** `[Feature]: 사용자 프로필 이미지 업로드 기능 추가`

**Description:**
사용자가 자신의 프로필 이미지를 업로드하고 변경할 수 있는 기능을 추가하고 싶습니다.

**Problem / Motivation:**
현재 사용자 프로필에는 기본 아바타만 표시되어 개인화가 부족합니다. 사용자들이 자신의 프로필 이미지를 설정할 수 있으면 더 나은 사용자 경험을 제공할 수 있습니다.

**Proposed Solution:**
1. 프로필 설정 페이지에 이미지 업로드 UI 추가
2. 이미지 파일 크기 및 형식 검증 (최대 5MB, JPG/PNG만 허용)
3. 이미지 업로드 API 엔드포인트 구현
4. 업로드된 이미지를 S3에 저장하고 URL을 DB에 저장

**Alternatives Considered:**
- 외부 이미지 호스팅 서비스 사용 (Imgur 등) - 보안 및 프라이버시 문제로 제외
- 기본 아바타만 사용 - 사용자 경험 개선 필요

**Related Commit:**
```
feat(profile): 사용자 프로필 이미지 업로드 기능 추가 (#45)
```
