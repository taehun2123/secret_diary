# Secret Diary - 개발 진행 상황

## 프로젝트 개요

Secret Diary는 개인 일기 작성 및 관리 웹 애플리케이션입니다. 사용자들이 자신만의 비밀 공간에서 일상을 기록하고, 음악과 이미지로 추억을 꾸밀 수 있는 감성적인 다이어리 서비스입니다.

### 핵심 목표

1. **감성적인 사용자 경험**: 실제 다이어리를 펼치는 듯한 애니메이션과 인터랙션
2. **멀티미디어 통합**: 이미지, 음악을 포함한 풍부한 콘텐츠 지원
3. **개인화 및 커스터마이징**: 스티커로 표지를 꾸미고 카테고리로 분류
4. **보안과 프라이버시**: JWT 기반 인증과 숨김 기능으로 사생활 보호

---

## 기술 스택

### Frontend

- **Next.js 16.2.1** (App Router)
  - React 19.2.4
  - TypeScript 5
  - Turbopack for fast builds
- **Styling**
  - Tailwind CSS 4
  - CSS Modules with custom animations
  - Responsive design
- **UI/UX**
  - Lucide React (아이콘)
  - 3D CSS transforms for page flip effects
  - Framer Motion-style animations

### Backend

- **Next.js API Routes**
  - RESTful API design
  - Server-side rendering
- **Authentication**
  - JWT (jsonwebtoken 9.0.3)
  - bcryptjs for password hashing
- **Database**
  - Supabase (PostgreSQL)
  - @supabase/supabase-js 2.99.3

### DevOps

- **Docker**
  - Multi-stage builds
  - Node 20 Alpine for production
- **Development Tools**
  - ESLint 9
  - React Compiler
  - Hot Module Replacement

---

## 주요 기능

### 1. 인증 시스템

**파일**: `src/lib/auth.ts`, `src/app/api/auth/*`

- JWT 기반 토큰 인증
- bcrypt를 사용한 안전한 비밀번호 해싱
- 토큰 검증 미들웨어
- AuthProvider와 AuthGuard 컴포넌트로 보호된 라우팅

**구현 상세**:
```typescript
- generateToken(): JWT 토큰 생성
- verifyToken(): 토큰 검증
- hashPassword(): 비밀번호 해싱
- comparePassword(): 비밀번호 비교
```

### 2. 다이어리 작성 및 관리

**파일**: `src/app/write/page.tsx`, `src/app/api/diaries/*`

**기능**:
- 제목, 내용, 카테고리 입력
- 날짜 선택
- 다중 이미지 업로드 (최대 5장)
- Spotify 음악 연동
- 실시간 저장 및 수정

**제한사항**:
- 제목: 최대 200자
- 내용: 최대 10,000자
- 이미지: JPEG, PNG, GIF, WebP 지원

### 3. 다이어리 읽기 (페이지네이션)

**파일**: `src/app/read/[id]/page.tsx`

**특징**:
- 책을 펼치는 듯한 오프닝 애니메이션
- 좌우 양면 레이아웃 (왼쪽: 표지, 오른쪽: 내용)
- 자동 페이지 분할 (약 500자/페이지)
  - 문단 및 문장 단위 스마트 분할
  - overflow: hidden으로 스크롤 방지
- 3D 페이지 넘김 애니메이션
  - perspective를 활용한 입체감
  - rotateY transform
  - 600ms 부드러운 전환
- 키보드 네비게이션 지원

**최근 개선사항**:
- 높이 기반 페이지 분할로 전환하여 스크롤 문제 해결
- 페이지 오버플로우 방지
- 첫 페이지에만 이미지 및 음악 플레이어 표시

### 4. 표지 꾸미기

**파일**: `src/app/decorate/[id]/page.tsx`

**기능**:
- 드래그 앤 드롭으로 스티커 배치
- 스티커 회전, 크기 조절
- 레이어 순서 조정 (앞으로/뒤로, 맨앞으로/맨뒤로)
- 커스텀 이미지 업로드
- 실시간 미리보기

**인터랙션**:
- Pointer Events API 사용
- 터치 및 마우스 동시 지원
- 선택된 스티커 하이라이트

### 5. 카테고리 관리

**파일**: `src/app/page.tsx`, `src/app/api/categories/*`

**기능**:
- 카테고리 생성, 수정, 삭제
- "전체" 카테고리로 모든 일기 보기
- 카테고리별 필터링
- 카테고리별 페이지네이션 (페이지당 8개)

**UI 개선**:
- 호버 시에만 수정/삭제 버튼 표시
- 아이콘 기반 직관적 인터페이스

### 6. 아카이브 (숨김 기능)

**파일**: `src/components/ArchiveModal.tsx`, `src/components/DiaryCover.tsx`

**기능**:
- 다이어리 숨기기/숨김 해제
- 더블 클릭으로 아카이브 모달 열기
- 숨겨진 일기 별도 관리
- 자동 새로고침

**데이터베이스**:
```sql
ALTER TABLE diaries ADD COLUMN "isHidden" BOOLEAN DEFAULT FALSE;
```

### 7. 음악 통합

**파일**: `src/components/PostPlayer.tsx`, `src/components/SpotifyProvider.tsx`

**기능**:
- Spotify 음악 검색 및 추가
- 30초 미리듣기
- 재생 컨트롤
- 일기별 독립적인 플레이어

### 8. 이미지 갤러리

**파일**: `src/app/read/[id]/page.tsx` (이미지 모달)

**기능**:
- 풀스크린 이미지 뷰어
- 좌우 네비게이션
- 썸네일 스트립
- 키보드 단축키 (←, →, ESC)

---

## 데이터베이스 스키마

### Users 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### Diaries 테이블
```sql
CREATE TABLE diaries (
  id VARCHAR(50) PRIMARY KEY,
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  date VARCHAR(20) NOT NULL,
  music TEXT,
  images TEXT[] DEFAULT '{}',
  "coverStickers" JSONB DEFAULT '[]',
  "uploadedStickers" TEXT[] DEFAULT '{}',
  "isHidden" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### Categories 테이블
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", name)
);
```

---

## 프로젝트 구조

```
secretDiary/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # 인증 API
│   │   │   ├── categories/    # 카테고리 API
│   │   │   ├── diaries/       # 다이어리 CRUD API
│   │   │   └── upload/        # 이미지 업로드 API
│   │   ├── decorate/[id]/     # 표지 꾸미기 페이지
│   │   ├── read/[id]/         # 다이어리 읽기 페이지
│   │   ├── write/             # 작성/수정 페이지
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── page.tsx           # 홈 페이지 (목록)
│   │   └── globals.css        # 전역 스타일
│   ├── components/
│   │   ├── ArchiveModal.tsx   # 아카이브 모달
│   │   ├── AudioProvider.tsx  # 오디오 컨텍스트
│   │   ├── AuthGuard.tsx      # 인증 가드
│   │   ├── AuthProvider.tsx   # 인증 컨텍스트
│   │   ├── DiaryCover.tsx     # 다이어리 표지 컴포넌트
│   │   ├── GlobalPlayer.tsx   # 글로벌 음악 플레이어
│   │   ├── PostPlayer.tsx     # 개별 음악 플레이어
│   │   └── SpotifyProvider.tsx# Spotify 컨텍스트
│   └── lib/
│       ├── auth.ts            # 인증 유틸리티
│       ├── db.ts              # 데이터베이스 쿼리
│       ├── supabase.ts        # Supabase 클라이언트
│       └── types.ts           # TypeScript 타입 정의
├── public/
│   └── assets/                # 이미지 에셋
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## 개발 히스토리

### Phase 1: 기본 기능 구현
- ✅ Next.js 프로젝트 초기 설정
- ✅ Supabase 연동 및 스키마 설계
- ✅ JWT 인증 시스템
- ✅ 다이어리 CRUD 기능
- ✅ 카테고리 관리

### Phase 2: UI/UX 개선
- ✅ 다이어리 표지 디자인
- ✅ 오프닝 애니메이션 구현
- ✅ 반응형 레이아웃
- ✅ 이미지 업로드 및 갤러리

### Phase 3: 고급 기능
- ✅ Spotify 음악 통합
- ✅ 스티커 시스템 및 드래그 앤 드롭
- ✅ 아카이브/숨김 기능
- ✅ 페이지네이션 (목록)

### Phase 4: 최근 개선사항
- ✅ 드롭다운 메뉴 재배치 (표지 타이틀 섹션 우측 상단)
- ✅ 카테고리 버튼 호버 시에만 표시
- ✅ 다이어리 내용 페이지네이션 (읽기 모드)
- ✅ 3D 페이지 넘김 애니메이션
- ✅ 높이 기반 페이지 분할로 스크롤 방지
- ✅ TypeScript 타입 오류 수정 (isHidden 속성)

---

## 기술적 도전과 해결

### 1. 페이지 오버플로우 문제
**문제**: 긴 텍스트가 다이어리 페이지 프레임을 넘어 스크롤이 발생

**해결**:
- `overflow: hidden` 적용
- 문자 수 기반 분할 (800자 → 500자)
- 높이 제약 설정
- 스마트 분할 (문단/문장 단위)

### 2. 페이지 넘김 애니메이션
**문제**: 부드럽고 자연스러운 책 넘김 효과 구현

**해결**:
```css
@keyframes flipForward {
  0% { transform: perspective(2000px) rotateY(0deg); }
  50% { transform: perspective(2000px) rotateY(-90deg); }
  100% { transform: perspective(2000px) rotateY(0deg); }
}
```
- perspective로 3D 공간 생성
- rotateY로 회전 효과
- opacity 변화로 부드러운 전환

### 3. 드래그 앤 드롭 구현
**문제**: 터치와 마우스 이벤트 동시 처리

**해결**:
- Pointer Events API 사용
- 상대 좌표 계산으로 반응형 지원
- 컨테이너 경계 체크

### 4. 이미지 업로드 최적화
**문제**: 대용량 이미지 처리

**해결**:
- Base64 인코딩
- 파일 크기 제한
- 이미지 포맷 검증
- 로딩 상태 표시

---

## 성능 최적화

### 1. 이미지 최적화
- Next.js Image 컴포넌트 사용
- Lazy loading
- 적절한 크기 조정

### 2. 번들 최적화
- Turbopack 사용
- 코드 스플리팅
- Dynamic imports

### 3. 데이터베이스 쿼리
- 인덱싱 (userId, category)
- 페이지네이션으로 데이터 로드 최소화
- 필요한 필드만 선택

### 4. 캐싱 전략
- JWT 토큰 로컬 스토리지
- 이미지 브라우저 캐싱
- API 응답 최적화

---

## 보안 고려사항

### 1. 인증 보안
- JWT 토큰 만료 시간 설정
- httpOnly 쿠키 (향후 고려)
- 비밀번호 해싱 (bcrypt)

### 2. 입력 검증
- 클라이언트 및 서버 사이드 검증
- SQL 인젝션 방지 (Supabase의 prepared statements)
- XSS 방지 (React의 자동 이스케이핑)

### 3. 권한 관리
- 모든 API 엔드포인트에서 토큰 검증
- userId 기반 데이터 접근 제어
- 삭제 시 확인 메시지

---

## 향후 개선 계획

### 단기 (1-2개월)
- [ ] 검색 기능 추가
- [ ] 태그 시스템
- [ ] 다크 모드
- [ ] 비밀번호 재설정

### 중기 (3-6개월)
- [ ] 소셜 로그인 (OAuth)
- [ ] 백업 및 내보내기 (PDF, JSON)
- [ ] 캘린더 뷰
- [ ] 감정 분석 및 통계

### 장기 (6개월+)
- [ ] 모바일 앱 (React Native)
- [ ] 협업 기능
- [ ] AI 기반 추천
- [ ] 다국어 지원

---

## 테스트

### 현재 상태
- 수동 테스트 위주
- E2E 테스트 미구현

### 계획
- Jest + React Testing Library
- Playwright E2E 테스트
- API 통합 테스트

---

## 배포

### 개발 환경
```bash
npm run dev
# http://localhost:3000
```

### 프로덕션 빌드
```bash
npm run build
npm start
```

### Docker 배포
```bash
docker-compose up --build
```

---

## 팀 및 기여

- **개발자**: [Your Name]
- **시작일**: 2024
- **상태**: 활발히 개발 중

---

## 라이선스

Private Project

---

## 연락처 및 지원

문제 발생 시 GitHub Issues 또는 이메일로 연락해주세요.

---

**마지막 업데이트**: 2026-03-27
