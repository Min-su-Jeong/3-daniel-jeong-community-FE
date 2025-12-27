---
name: Documentation
about: 문서 개선이나 추가를 제안하세요
title: '[Docs]: '
labels: documentation
assignees: ''
---

## Description
문서 개선이나 추가에 대한 명확하고 간결한 설명을 작성해주세요.

## Current State
현재 문서의 상태나 문제점을 설명해주세요.

## Proposed Changes
제안하는 변경 사항을 설명해주세요.

## Related Documentation
관련된 문서나 섹션을 링크해주세요.

## Additional Context
기타 참고할 자료나 정보를 작성해주세요.

---

## Example

**Title:** `[Docs]: README에 CloudFront + S3 배포 가이드 추가`

**Description:**
프로젝트를 처음 시작하는 개발자들을 위해 README에 CloudFront + S3 배포 설정 가이드를 추가하고 싶습니다.

**Current State:**
현재 README에는 프로젝트 설명만 있고, 실제로 프로젝트를 배포하는 방법에 대한 정보가 부족합니다. 새로운 개발자가 배포 프로세스를 이해하기 어려운 상황입니다.

**Proposed Changes:**
1. 필수 요구사항 섹션 추가 (Node.js 20, AWS CLI 등)
2. 설치 방법 상세 설명
   - 저장소 클론
   - 의존성 설치 (`npm install`)
   - 환경 변수 설정
3. 배포 방법 설명
   - 로컬 빌드 및 테스트 (`./build-static.sh`)
   - GitHub Actions를 통한 자동 배포
   - CloudFront 캐시 무효화
4. 프로젝트 구조 설명
5. 주요 스크립트 설명

**Related Documentation:**
- README.md
- CONTRIBUTING.md
- .github/workflows/ci-cd.yml

**Related Commit:**
```
docs: README에 CloudFront + S3 배포 가이드 추가 (#123)
```
