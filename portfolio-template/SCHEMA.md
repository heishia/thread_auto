# Portfolio Meta.json 스키마

GitHub에서 자동으로 받아오는 정보를 **제외**한, 직접 관리하는 커스텀 메타데이터 필드입니다.

---

## 기본 정보

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `title` | string | ✅ | 프로젝트 표시 제목 |
| `subtitle` | string | | 부제목 |
| `detailed_description` | string | | 상세 설명 (마크다운 가능) |

---

## 분류

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `project_type` | string[] | ✅ | 프로젝트 유형 |
| `status` | string | | `completed`, `in_progress`, `archived` |
| `priority` | number | | 표시 우선순위 (높을수록 먼저) |

---

## 일정

| 필드 | 타입 | 설명 |
|------|------|------|
| `start_date` | date | 시작일 (YYYY-MM-DD) |
| `end_date` | date | 종료일 |
| `is_ongoing` | boolean | 진행 중 여부 |

---

## 기술 스택 (technologies)

```json
{
  "technologies": [
    {
      "name": "React",        // 필수
      "category": "Frontend", // 필수
      "version": "18.2"       // 선택
    }
  ]
}
```

---

## 기능 목록 (features)

```json
{
  "features": [
    {
      "title": "실시간 동기화",     // 필수
      "description": "부제목/요약",  // 필수
      "sub_description": "상세 설명" // 선택
    }
  ]
}
```

---

## 스크린샷 (screenshots)

```json
{
  "screenshots": [
    {
      "file": "main.png",    // 필수: portfolio/screenshots/ 내 파일명
      "caption": "메인 화면", // 필수
      "type": "desktop"      // 선택: desktop | mobile | video
    }
  ]
}
```

---

## 역할 (roles)

```json
{
  "roles": [
    {
      "role_name": "Full Stack Developer",
      "responsibility": "전체 개발 담당",
      "contribution_percentage": 100
    }
  ]
}
```

---

## 링크

| 필드 | 타입 | 설명 |
|------|------|------|
| `demo_url` | string | 데모 사이트 URL |
| `documentation_url` | string | 문서 URL |

---

## 스토리 (레거시)

| 필드 | 타입 | 설명 |
|------|------|------|
| `challenges` | string | 어려웠던 점, 도전 과제 (레거시) |
| `achievements` | string | 성과, 결과물 (레거시) |

---

## 기타

| 필드 | 타입 | 설명 |
|------|------|------|
| `client_name` | string | 클라이언트명 (외주) |
| `lines_of_code` | number | 코드 라인 수 |
| `commit_count` | number | 커밋 수 |
| `contributor_count` | number | 기여자 수 |

---

# 🆕 상세 페이지 전용 필드

프로젝트 상세 페이지에서 풍부한 정보를 표시하기 위한 추가 필드입니다.

---

## 아키텍처 (architecture)

프로젝트의 구조와 설계를 상세하게 기술합니다.

```json
{
  "architecture": {
    "overview": "PPOP Link는 Linktree의 대안으로 개발된 Link in Bio SaaS 서비스입니다...",
    
    "system_components": [
      {
        "name": "Backend (FastAPI)",
        "description": "RESTful API, OAuth 처리, 비즈니스 로직"
      },
      {
        "name": "Frontend (Next.js 14)",
        "description": "App Router 기반 SSR/CSR 하이브리드"
      }
    ],
    
    "core_principles": [
      {
        "title": "SSO (Single Sign-On)",
        "description": "PPOP Auth를 통한 통합 인증"
      },
      {
        "title": "Stateless 인증",
        "description": "JWKS 기반 JWT 검증으로 서버 세션 불필요"
      }
    ],
    
    "auth_flow": [
      "사용자 → Frontend → PPOP Auth (로그인)",
      "PPOP Auth → Frontend (Authorization Code)",
      "Frontend → Backend (코드 교환 요청)",
      "Backend → PPOP Auth (토큰 교환)",
      "Backend → Frontend (HttpOnly 쿠키로 토큰 저장)",
      "이후 요청: 미들웨어에서 자동 토큰 갱신"
    ],
    
    "data_models": [
      {
        "name": "users",
        "description": "사용자 프로필 (id는 PPOP Auth user_id UUID)"
      },
      {
        "name": "links",
        "description": "커스텀 링크 (제목, URL, 썸네일, 순서, 활성화 상태)"
      }
    ]
  }
}
```

---

## 기술적 도전과제 (technical_challenges)

프로젝트에서 직면한 기술적 도전과 해결 방법을 기술합니다.

```json
{
  "technical_challenges": [
    {
      "title": "PPOP Auth SSO 연동",
      "challenge": "외부 인증 서버와의 OAuth 2.0 플로우 구현 및 JWKS 기반 토큰 검증",
      "solution": "PyJWKClient를 싱글톤 패턴으로 구현하여 JWKS 캐싱, Authorization Code Flow의 전체 과정 구현, HttpOnly 쿠키를 통한 안전한 토큰 저장"
    },
    {
      "title": "자동 토큰 갱신",
      "challenge": "사용자 경험을 해치지 않으면서 만료된 토큰 자동 갱신",
      "solution": "Next.js 미들웨어에서 토큰 만료 감지 및 자동 갱신, 갱신 실패 시 로그인 페이지로 리다이렉트, 쿠키 설정 환경별 분리"
    }
  ]
}
```

---

## 주요 성과 (key_achievements)

프로젝트의 주요 성과를 리스트 형태로 기술합니다.

```json
{
  "key_achievements": [
    "PPOP Auth SSO 연동 완료: OAuth 2.0 Authorization Code Flow 구현, JWKS 기반 RS256 JWT 검증, 자동 토큰 갱신 미들웨어",
    "완전한 Link in Bio 기능: 링크/소셜 링크 CRUD, 드래그앤드롭 순서 변경, 프로필 커스터마이징",
    "구독 기반 비즈니스 로직: FREE/PRO 플랜별 기능 제한, PPOP Auth API 연동 구독 상태 확인, 로컬 캐시 폴백",
    "보안 강화: Rate Limiting (200 req/min), IP 블랙리스트, 악성 패턴 탐지, 보안 헤더 자동 설정"
  ]
}
```

---

## 코드 스니펫 (code_snippets)

프로젝트의 핵심 코드를 보여주는 스니펫입니다.

```json
{
  "code_snippets": [
    {
      "title": "PPOP Auth JWT 토큰 검증 (JWKS)",
      "description": "JWKS를 사용한 RS256 JWT 토큰 검증 로직",
      "file_path": "backend/core/security.py",
      "language": "python",
      "code": "def verify_ppop_token(token: str) -> dict:\n    try:\n        jwks_client = get_jwks_client()\n        signing_key = jwks_client.get_signing_key_from_jwt(token)\n        return jwt.decode(\n            token,\n            signing_key.key,\n            algorithms=[\"RS256\"],\n            audience=settings.PPOP_CLIENT_ID\n        )\n    except Exception as e:\n        raise HTTPException(status_code=401, detail=str(e))"
    }
  ]
}
```

---

## meta.json 전체 구조 예시

```json
{
  "display": {
    "title": "PPOP Link",
    "subtitle": "Link in Bio SaaS 서비스",
    "description": "Linktree의 대안으로 개발된 Link in Bio 서비스",
    "detailed_description": "상세 설명..."
  },
  "classification": {
    "project_type": ["SaaS", "Web"],
    "status": "completed",
    "priority": 100
  },
  "timeline": {
    "start_date": "2024-01-15",
    "end_date": "2024-06-30",
    "is_ongoing": false
  },
  "links": {
    "demo_url": "https://ppop.link",
    "documentation_url": "https://docs.ppop.link"
  },
  "metrics": {
    "lines_of_code": 15000,
    "commit_count": 250,
    "contributor_count": 1
  },
  "client": {
    "name": null
  },
  "technologies": [...],
  "features": [...],
  "screenshots": [...],
  "roles": [...],
  "architecture": {...},
  "technical_challenges": [...],
  "key_achievements": [...],
  "code_snippets": [...]
}
```
