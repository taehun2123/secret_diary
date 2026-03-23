# Supabase 설정 가이드

Secret Diary 프로젝트를 위한 Supabase 데이터베이스 설정 가이드입니다.

## 1. Supabase 프로젝트 생성

1. https://supabase.com 에 접속하여 회원가입 또는 로그인합니다.
2. "New Project" 버튼을 클릭합니다.
3. 프로젝트 정보를 입력합니다:
   - **Name**: secret-diary (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 생성 (저장해두세요!)
   - **Region**: Northeast Asia (Seoul) 선택 (한국에서 가장 가까운 리전)
4. "Create new project" 버튼을 클릭하고 프로젝트가 생성될 때까지 기다립니다 (약 2-3분 소요).

## 2. 데이터베이스 스키마 생성

1. Supabase 대시보드에서 왼쪽 메뉴의 **SQL Editor**를 클릭합니다.
2. **기존 테이블이 있다면** 먼저 다음 SQL을 실행하여 삭제합니다:
   ```sql
   DROP TABLE IF EXISTS diaries CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
3. 프로젝트 루트의 `supabase-schema.sql` 파일의 내용을 복사합니다.
4. SQL Editor에 붙여넣고 우측 하단의 **Run** 버튼을 클릭합니다.
5. 성공적으로 실행되면 "Success. No rows returned" 메시지가 표시됩니다.

## 3. Supabase Storage 설정 (이미지 업로드)

1. 왼쪽 메뉴에서 **Storage**를 클릭합니다.
2. **New bucket** 버튼을 클릭합니다.
3. 버킷 생성:
   - **Name**: `diary-images`
   - **Public bucket**: ✅ 체크 (이미지를 공개적으로 접근 가능하게 설정)
4. **Create bucket** 버튼을 클릭합니다.
5. 생성된 `diary-images` 버킷을 클릭합니다.
6. **Policies** 탭으로 이동합니다.
7. 다음 정책들을 추가합니다:

   **업로드 정책 (Insert):**
   - **New policy** 클릭
   - **For full customization** 선택
   - Policy name: `Allow authenticated uploads`
   - Allowed operation: `INSERT` 체크
   - Policy definition:
     ```sql
     true
     ```
   - **Review and save** 클릭

   **읽기 정책 (Select):**
   - **New policy** 클릭
   - **For full customization** 선택
   - Policy name: `Allow public reads`
   - Allowed operation: `SELECT` 체크
   - Policy definition:
     ```sql
     true
     ```
   - **Review and save** 클릭

## 4. API 키 확인

1. 왼쪽 메뉴에서 **Project Settings** (톱니바퀴 아이콘)를 클릭합니다.
2. **API** 섹션을 선택합니다.
3. 다음 정보를 복사해둡니다:
   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon public** 키 (긴 문자열)
   - **service_role** 키 (비밀 키 - 서버 사이드에서만 사용)

## 5. 환경 변수 설정

프로젝트의 `.env.local` 파일을 열고 다음 값을 업데이트합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

위의 값들을 4단계에서 복사한 실제 값으로 교체합니다:
- `your-project-url.supabase.co`: Project URL
- `your-anon-key`: anon public 키
- `your-service-role-key`: service_role 키 (⚠️ 절대 클라이언트에 노출하지 마세요!)

## 6. 개발 서버 재시작

환경 변수를 변경했으므로 개발 서버를 재시작해야 합니다:

```bash
# 기존 서버 중지 (Ctrl+C)
# 새로 시작
npm run dev
```

## 7. 테스트

1. 브라우저에서 http://localhost:3000 에 접속합니다.
2. 로그인 페이지에서 새 비밀번호를 입력하여 첫 사용자를 생성합니다.
3. 일기를 작성하고 저장합니다.
4. Supabase 대시보드의 **Table Editor**에서 데이터가 정상적으로 저장되었는지 확인합니다:
   - `users` 테이블에 사용자 데이터
   - `diaries` 테이블에 일기 데이터

## 데이터베이스 구조

### Users 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | 사용자 ID (PK) |
| passwordHash | TEXT | 해시된 비밀번호 |
| createdAt | TIMESTAMPTZ | 생성 시간 |
| updatedAt | TIMESTAMPTZ | 수정 시간 |

### Diaries 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | 일기 ID (PK) |
| userId | TEXT | 사용자 ID (FK) |
| title | TEXT | 제목 |
| content | TEXT | 내용 |
| category | TEXT | 카테고리 |
| date | TEXT | 날짜 |
| music | TEXT | 음악 정보 (nullable) |
| images | JSONB | 이미지 URL 배열 |
| coverStickers | JSONB | 스티커 정보 |
| createdAt | TIMESTAMPTZ | 생성 시간 |
| updatedAt | TIMESTAMPTZ | 수정 시간 |

## 문제 해결

### "Missing Supabase environment variables" 에러
- `.env.local` 파일에 환경 변수가 올바르게 설정되었는지 확인하세요.
- 개발 서버를 재시작했는지 확인하세요.

### 데이터가 저장되지 않음
- Supabase 대시보드에서 **Table Editor** > **diaries** 테이블을 확인하세요.
- 브라우저 콘솔에서 에러 메시지를 확인하세요.
- API 키가 올바른지 확인하세요 (anon public 키를 사용해야 합니다).

### RLS (Row Level Security) 관련 에러
- 현재 설정은 API 레이어에서 JWT로 인증을 처리하므로 RLS 정책이 모두 허용으로 설정되어 있습니다.
- 추가 보안이 필요한 경우 `supabase-schema.sql`의 RLS 정책을 수정할 수 있습니다.

## 주의사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요! (이미 `.gitignore`에 포함되어 있습니다)
- `anon public` 키는 클라이언트에서 사용할 수 있는 공개 키입니다.
- `service_role` 키는 절대 클라이언트에 노출하지 마세요.
- 프로덕션 배포 시 `JWT_SECRET`도 변경하세요.
