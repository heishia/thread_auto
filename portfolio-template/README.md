# 📦 Portfolio Meta.json 가이드

## 빠른 시작

1. `portfolio/` 폴더를 복사
2. 프로젝트 레포 루트에 붙여넣기
3. `meta.json` 수정
4. `screenshots/`에 이미지 추가
5. Git push!

```
your-project/
├── portfolio/          ← 이 폴더를 복사!
│   ├── meta.json
│   └── screenshots/
│       └── main.png
├── src/
└── README.md
```

---

## 파일 설명

| 파일 | 설명 |
|------|------|
| `portfolio/meta.json` | 전체 필드 (권장) |
| `portfolio/meta.minimal.json` | 최소 필드 (빠른 시작) |
| `SCHEMA.md` | 필드 상세 스펙 |

---

## 필수 필드

| 필드 | 설명 |
|------|------|
| `title` | 프로젝트 제목 |
| `project_type` | 유형 배열 (예: `["web"]`) |
| `technologies` | 기술 스택 배열 |

---

## project_type 옵션

| 값 | 설명 |
|-----|------|
| `web` | 웹 애플리케이션 |
| `mobile` | 모바일 앱 |
| `desktop` | 데스크톱 앱 |
| `automation` | 자동화 프로그램 |
| `api` | 백엔드 API |
| `library` | 라이브러리/패키지 |
| `cli` | CLI 도구 |

---

## technology category 옵션

| 값 | 예시 |
|-----|------|
| `Frontend` | React, Vue, TypeScript |
| `Backend` | FastAPI, Django, Express |
| `Database` | PostgreSQL, MongoDB, Redis |
| `DevOps` | Docker, Kubernetes, AWS |
| `Language` | Python, Go, Rust |
| `AI` | OpenAI API, Claude API |
| `Tool` | Git, Webpack, Vite |

---

## priority 가이드

- `10` - 최상단 (대표 프로젝트)
- `5` - 중요 프로젝트
- `0` - 기본값
- `-5` - 하단

---

## 스크린샷 가이드

- `main.png` (필수) - 메인 화면
- `feature-xx.png` - 기능 화면
- `mobile.png` - 모바일 화면
- `demo.mp4` - 데모 영상

권장 해상도: 1920x1080 또는 1280x720

---

## AI에게 요청하는 방법

```
다음 프로젝트의 portfolio/meta.json 작성해줘:

프로젝트명: [이름]
설명: [설명]
기술: [스택]
기능: [기능들]
기간: [시작일 ~ 종료일]
```

---

## 전체 예시

```json
{
  "title": "AI 오케스트레이션",
  "subtitle": "Claude + Cursor 연동",
  "detailed_description": "여러 AI 에이전트를 조율하는 프레임워크",
  
  "project_type": ["automation", "api"],
  "status": "completed",
  "priority": 10,
  
  "start_date": "2024-01-15",
  "end_date": "2024-03-20",
  
  "technologies": [
    { "name": "Python", "category": "Language", "version": "3.11" },
    { "name": "FastAPI", "category": "Backend" },
    { "name": "Claude API", "category": "AI" }
  ],
  
  "features": [
    { "title": "멀티 에이전트", "description": "여러 AI 협업" },
    { "title": "실시간 동기화", "description": "WebSocket 연결" }
  ],
  
  "screenshots": [
    { "file": "main.png", "caption": "대시보드" },
    { "file": "demo.mp4", "caption": "데모 영상", "type": "video" }
  ],
  
  "demo_url": "https://demo.example.com",
  "challenges": "비동기 처리 최적화",
  "achievements": "개발 시간 40% 단축"
}
```
