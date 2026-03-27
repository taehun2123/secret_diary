# Secret Diary

나만의 비밀 공간에서 일상을 기록하는 감성 다이어리 애플리케이션

## 프로젝트 소개

Secret Diary는 실제 다이어리를 펼치는 듯한 경험을 제공하는 웹 기반 일기 애플리케이션입니다. 텍스트, 이미지, 음악을 결합하여 추억을 더욱 생생하게 기록하고, 스티커로 표지를 꾸며 나만의 개성을 표현할 수 있습니다.

### 주요 특징

- **감성적인 UI/UX**: 책을 펼치는 3D 애니메이션과 페이지 넘김 효과
- **멀티미디어 지원**: 이미지 (최대 5장), Spotify 음악 통합
- **표지 꾸미기**: 드래그 앤 드롭으로 스티커를 자유롭게 배치
- **카테고리 관리**: 일기를 주제별로 분류하고 관리
- **아카이브 기능**: 특별히 숨기고 싶은 일기는 아카이브로 보관
- **페이지네이션**: 긴 글은 자동으로 여러 페이지로 분할하여 읽기 편하게
- **반응형 디자인**: PC와 모바일 모두 최적화

## 기술 스택

### Frontend
- Next.js 16.2.1 (App Router)
- React 19.2.4
- TypeScript 5
- Tailwind CSS 4

### Backend
- Next.js API Routes
- JWT Authentication
- Supabase (PostgreSQL)

### DevOps
- Docker & Docker Compose
- Node.js 20 Alpine

## 시작하기

### 필수 요구사항

- Node.js 20 이상
- npm 또는 yarn
- Supabase 계정 (무료)

### 설치 방법

1. **저장소 클론**

```bash
git clone https://github.com/yourusername/secretDiary.git
cd secretDiary
```

2. **의존성 설치**

```bash
npm install
# 또는
yarn install
```

3. **환경 변수 설정**

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
```

4. **데이터베이스 설정**

Supabase 콘솔에서 SQL 에디터를 열고 다음 스키마를 실행하세요:

```sql
-- Users 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Diaries 테이블
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

-- Categories 테이블
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", name)
);

-- 인덱스 생성
CREATE INDEX idx_diaries_user_id ON diaries("userId");
CREATE INDEX idx_diaries_category ON diaries(category);
CREATE INDEX idx_categories_user_id ON categories("userId");
```

5. **개발 서버 실행**

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어주세요.

### Docker로 실행하기

```bash
# 이미지 빌드 및 컨테이너 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 중지
docker-compose down
```

## 사용 방법

### 1. 회원가입 및 로그인

- 처음 방문 시 회원가입을 진행하세요
- 안전한 비밀번호를 사용하세요 (bcrypt로 암호화됨)

### 2. 다이어리 작성

1. 우측 상단의 "새 글 쓰기" 버튼 클릭
2. 제목, 날짜, 카테고리 입력
3. 본문 작성 (최대 10,000자)
4. 이미지 추가 (선택, 최대 5장)
5. Spotify 음악 추가 (선택)
6. "저장" 버튼 클릭

### 3. 표지 꾸미기

1. 다이어리 표지의 메뉴에서 "표지 꾸미기" 선택
2. 좌측 스티커 팔레트에서 원하는 스티커 선택
3. 드래그하여 원하는 위치에 배치
4. 회전 및 크기 조절
5. "저장" 버튼으로 변경사항 저장

### 4. 카테고리 관리

- 카테고리 버튼 위에 마우스를 올리면 수정/삭제 버튼이 나타납니다
- 수정: 카테고리 이름 변경
- 삭제: 카테고리만 삭제되고 일기는 유지됩니다

### 5. 아카이브 (숨김)

- 표지의 메뉴에서 "숨김" 선택
- 숨긴 일기는 메인 목록에 표시되지 않습니다
- 아카이브 보기: 오리 이미지를 더블 클릭하세요

## 주요 기능 설명

### 페이지 넘김 효과

긴 일기는 자동으로 여러 페이지로 분할됩니다:
- 약 500자마다 페이지 구분
- 문단 및 문장 단위로 자연스럽게 분할
- 3D 애니메이션으로 실제 책을 넘기는 효과
- 좌우 버튼 또는 키보드로 네비게이션

### 이미지 갤러리

- 풀스크린 뷰어 지원
- 좌우 화살표로 탐색
- 키보드 단축키:
  - `←` / `→`: 이전/다음 이미지
  - `ESC`: 갤러리 닫기

### 음악 플레이어

- Spotify 음악 30초 미리듣기
- 일기마다 독립적인 플레이어
- 자동 재생 제어

## 프로젝트 구조

```
secretDiary/
├── src/
│   ├── app/              # Next.js App Router 페이지
│   │   ├── api/          # API 라우트
│   │   ├── decorate/     # 표지 꾸미기
│   │   ├── read/         # 다이어리 읽기
│   │   └── write/        # 다이어리 작성
│   ├── components/       # React 컴포넌트
│   └── lib/             # 유틸리티 및 헬퍼
├── public/              # 정적 파일
│   └── assets/          # 이미지, 아이콘
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/verify` - 토큰 검증
- `GET /api/auth/status` - 로그인 상태 확인

### 다이어리
- `GET /api/diaries` - 다이어리 목록 조회
- `POST /api/diaries` - 다이어리 생성
- `GET /api/diaries/[id]` - 다이어리 상세 조회
- `PUT /api/diaries/[id]` - 다이어리 수정
- `DELETE /api/diaries/[id]` - 다이어리 삭제

### 카테고리
- `GET /api/categories` - 카테고리 목록
- `POST /api/categories` - 카테고리 생성
- `PUT /api/categories/[id]` - 카테고리 수정
- `DELETE /api/categories/[id]` - 카테고리 삭제

### 기타
- `POST /api/upload` - 이미지 업로드
- `PUT /api/diaries/[id]/stickers` - 스티커 저장

## 개발

### 개발 서버 실행

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
npm start
```

### 린팅

```bash
npm run lint
```

## 트러블슈팅

### 데이터베이스 연결 오류

- Supabase URL과 Anon Key가 올바른지 확인하세요
- `.env.local` 파일이 프로젝트 루트에 있는지 확인하세요

### 이미지 업로드 실패

- 이미지 크기가 너무 크지 않은지 확인하세요
- 지원 포맷: JPEG, PNG, GIF, WebP

### 페이지 넘김이 작동하지 않음

- 브라우저 캐시를 지워보세요
- 최신 버전의 모던 브라우저를 사용하세요

## 기여하기

기여는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

This project is private and proprietary.

## 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해주세요.

## 감사의 말

- [Next.js](https://nextjs.org/) - React 프레임워크
- [Supabase](https://supabase.com/) - 백엔드 서비스
- [Lucide](https://lucide.dev/) - 아이콘
- [Spotify](https://developer.spotify.com/) - 음악 API

---

**Made with ❤️ by github : @taehun2123**

마지막 업데이트: 2026-03-27
