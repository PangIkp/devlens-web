# 08 - Remaining Checklist

อัปเดตล่าสุด: `2026-08-13`

## จุดประสงค์

เอกสารนี้สรุปสิ่งที่ **ยังไม่ได้ทำ** หรือ **ยังไม่ควรนับว่าเสร็จ** โดยอิงจาก:

- `docs/01-business-logic-architecture.md`
- `docs/02-frontend-roadmap-api-mapping.md`
- `docs/03-backend-roadmap.md`
- `docs/06-api-design.md`
- `docs/07-backend-operations.md`
- `docs/openapi.yaml`

> หมายเหตุ
>
> - `openapi.yaml` เป็น source of truth
> - รายการด้านล่างแยกระหว่าง
>   - งานที่ยังค้างใน frontend/repo นี้
>   - งานที่เป็น future scope ตามเอกสาร
> - ถ้า endpoint หรือ capability ไม่อยู่ใน `openapi.yaml` ให้ถือว่า **ยังไม่ใช่ public API requirement**

---

## 1. Frontend Remaining Work

### 1.1 Live Integration Verification

- [X] verify `Settings` กับ backend local จริง
- [X] verify `Repositories` list/detail กับ backend local จริง
- [X] verify `Dashboard & Metrics` กับ backend local จริง
- [X] verify `Pull Requests` list/detail กับ backend local จริง
- [X] verify `Insights` list/actions กับ backend local จริง
- [X] verify error states จาก backend response จริง เช่น `400`, `401`, `403`, `404`, `429`, `500`
- [X] verify empty states กับ organization / repository ที่ยังไม่มีข้อมูลจริง

### 1.2 Authentication And Session UI

- [X] ทำ login UI
- [X] ทำ refresh session flow
- [X] ทำ logout flow
- [X] ทำ bearer token persistence/re-hydration flow ให้ครบใน browser
- [X] ผูก `/me` เข้ากับ auth/session flow จริง แทน manual query-only usage

### 1.3 Dashboard Polish

- [X] ตรวจว่า dashboard ทุก section ใช้ข้อมูลจริงครบตาม endpoint ล่าสุด
- [X] ตรวจความสอดคล้องของ `from` / `to` / `interval` กับ metric endpoints จริง
- [X] เพิ่ม UI สำหรับ trend comparison ที่ใช้ series จาก metrics endpoints
- [X] ตรวจ loading / empty / error states ของทุก metric section กับ backend response จริง

หมายเหตุ (implement `2026-08-13`, ตรวจโค้ด `src/routes/dashboard.tsx` + `src/features/dashboard/` เทียบกับ live backend และ unit tests):

- เพิ่ม section ใหม่ 2 ตัวที่ขาดไป:
  - **Review queue** — เรียก `GET /repositories/{repositoryId}/dashboard/review-queue` ผ่าน `useReviewQueueQuery`, render ด้วย `DashboardReviewQueueTable` พร้อม pagination (`reviewQueuePage` search param), loading/empty/error state ครบ
  - **Workload distribution** — เรียก `GET /repositories/{repositoryId}/metrics/workload-distribution` ผ่าน `useWorkloadDistributionQuery`, render ด้วย `DashboardWorkloadDistribution` (share bar ของ contributor/reviewer พร้อมข้อความกำกับว่าไม่ใช่ developer ranking ตามหลักการใน `04-metric-definitions.md`)
- เติม `changeFailureRate` เป็นการ์ดที่ 5 ใน `DashboardSummaryGrid` (เดิมมีแค่ 4 จาก 5 field ของ `dashboard/summary`)
- เพิ่ม UI trend comparison: checkbox "Compare to previous period" ข้าง active range — เมื่อเปิดจะ fetch ช่วงก่อนหน้าที่มีความยาวเท่ากัน (`getPreviousDateRange`) สำหรับ PR cycle time / review wait time / deployment trend แล้ว overlay เป็น series ที่สองในกราฟเดิม (index-aligned ผ่าน `alignComparisonSeries` เพราะวันที่จริงของสองช่วงไม่ตรงกัน)
- `dashboard/pr-cycle-time`, `dashboard/review-wait-time`, และ consolidated `GET /repositories/{repositoryId}/metrics` ยังไม่ถูกเรียกตรง ๆ แต่ยังไม่ถือเป็น gap เพราะข้อมูลซ้อนกับ `metrics/pull-requests` / `metrics/reviews` ที่ใช้อยู่แล้ว
- ระหว่างทางพบ `docs/openapi.yaml` มี duplicate YAML key `"400"` ใต้ `GET /pull-requests` (บรรทัดเดิม 686) ที่ทำให้ `npm run generate:api` (openapi-typescript) parse ไม่ผ่านและทำให้ generated client ไม่มี `workload-distribution` เลย แก้โดยลบ key ซ้ำแล้ว regenerate `src/api/generated/schema.ts` ใหม่
- verify แล้วด้วย `npx tsc --noEmit`, `npx eslint .`, `npm run build`, และ `npx vitest run` (30/30 ผ่าน รวม `dashboard.test.tsx` 10 tests รวม 3 test ใหม่สำหรับ review queue, workload distribution, และ comparison toggle)
- สรุป: `1.3 Dashboard Polish` **ปิดได้แล้ว**

### 1.4 Pull Request Experience Polish

- [X] ตรวจว่า PR list ใช้ sorting/filtering ได้ครบตาม contract จริง
- [X] แสดง `timeline` จาก `GET /pull-requests/{pullRequestId}` ถ้ายังแสดงไม่ครบ
- [X] ตรวจว่า `riskIndicator` ถูก render ครบถ้ามีใน payload จริง
- [X] verify pagination behavior กับข้อมูลหลายหน้า

หมายเหตุ (implement `2026-08-13`, ตรวจโค้ด `src/routes/pull-requests.tsx` + `pull-request-detail.tsx` + `src/features/pull-requests/` เทียบกับ live backend และ unit tests):

- เพิ่ม UI sort control (`Newest first` / `Oldest first` / `PR number` ทั้งสองทิศทาง) ผูกกับ `sortBy`/`sortOrder` search param แล้วส่งต่อไป `GET /pull-requests` จริง — ยืนยันกับ backend local แล้วว่า `sortBy=number&sortOrder=asc|desc` เรียงผลลัพธ์ถูกต้องจริง
- เจอ type bug ระหว่างทาง: `pull-requests.api.ts` เดิมประกาศ `PullRequestSortBy = "createdAt" | "updatedAt" | "mergedAt"` เอง ซึ่งไม่ตรงกับ contract จริง (`"createdAt" | "number"`) แก้โดย derive type จาก `operations["listPullRequests"]` ใน generated schema แทน
- `pullRequestDetailSchema` เดิมไม่มี `timeline` และ `riskIndicator` เลย ทำให้ zod strip ทิ้งอัตโนมัติแม้ backend จะส่งมาให้ครบ (ยืนยันจาก live response จริงว่ามีทั้งสอง field) — เพิ่ม schema และ component ใหม่ `PullRequestTimeline` (แสดงลำดับเหตุการณ์ created → review_requested → review_started → review_submitted → merged/closed) และ risk indicator pill (`low`/`medium`/`high`) พร้อม reasons list ใน `PullRequestDetailPanel`
- pagination ของ PR list ใช้ pattern เดียวกับ hotspots/review-queue ที่ verify ผ่านแล้วใน 1.3 เพิ่ม test ยืนยัน multi-page navigation จริง
- verify แล้วด้วย `npx tsc --noEmit`, `npx eslint .`, `npm run build`, และ `npx vitest run` (33/33 ผ่าน รวม `pull-requests.test.tsx` เพิ่มจาก 1 → 4 tests)
- สรุป: `1.4 Pull Request Experience Polish` **ปิดได้แล้ว**

### 1.5 Insights Polish

- [X] ตรวจว่าใช้ path หลัก `GET /organizations/{organizationId}/insights` หรือ alias อย่างสม่ำเสมอ
- [X] verify review / dismiss / reopen actions กับ backend local จริง
- [X] ปรับ evidence rendering ตาม payload จริงถ้ามีหลาย shape
- [X] รองรับ partial data จาก backend โดยไม่ทำให้หน้า fail ทั้งหน้า

หมายเหตุ (implement `2026-08-13`, ตรวจโค้ด `src/routes/insights.tsx` + `src/features/insights/` เทียบกับ live backend และ unit tests):

- `listInsights` เดิมเรียก `/insights` (alias) เสมอ ทั้งที่หน้ามี `organizationId` context อยู่แล้ว — เปลี่ยนไปเรียก path หลัก `GET /organizations/{organizationId}/insights` ตามคำแนะนำใน `02-frontend-roadmap-api-mapping.md` ยืนยันแล้วว่า endpoint นี้ตอบ `200 OK` จริงกับ backend local
- verify `review`/`dismiss`/`reopen` กับ backend local จริงโดยสร้าง insight status แบบ synthetic ผ่าน API ตรง ๆ (เพราะข้อมูล fixture ปัจจุบันไม่มีเคสที่เข้าเกณฑ์ rule engine จริง) ยืนยันว่าทั้ง 3 action ตอบ `200 OK` และ response ตรงตาม `InsightStatusResponse` schema ทุกครั้ง (ลบข้อมูลทดสอบออกหลังตรวจเสร็จ)
- ตรวจ backend source (`internal/insights/repository.go`, `service.go`) พบว่า evidence จริงมี 2 shape: flat primitive (string/int/float) สำหรับ evidence เฉพาะ rule แต่ละตัว และ nested object หนึ่งชั้นคือ `ruleConfig` ที่ enrichment เพิ่มเข้ามาเสมอ (มี `fingerprint`, `dedupeVersion`, `windowFrom`, `windowTo`, `ruleConfig` ติดมาทุก insight) — `InsightEvidence` เดิม dump nested object เป็น JSON string ก้อนเดียว อ่านยาก ปรับให้ nested object render เป็น sub key-value list แทน
- `insightListResponseSchema.parse()` เดิม parse ทั้ง array รวดเดียว ถ้า insight ตัวใดตัวหนึ่งมี field ไม่ตรง schema (เช่น `insightType`/`severity`/`status` ค่าใหม่ที่ frontend enum ยังไม่รู้จัก) จะทำให้ทั้งหน้า insights fail ไปด้วย — เปลี่ยนเป็น parse ทีละ item ด้วย `safeParse` ผ่าน `parseInsightListResponse` ตัด item ที่ parse ไม่ผ่านออกแล้วแสดง insight ที่เหลือตามปกติ พร้อมแบนเนอร์แจ้งเตือนจำนวนที่ถูกซ่อนแทนที่จะแสดง error ทั้งหน้า
- verify แล้วด้วย `npx tsc --noEmit`, `npx eslint .`, `npm run build`, และ `npx vitest run` (35/35 ผ่าน รวม `insights.test.tsx` เพิ่มจาก 1 → 3 tests)
- สรุป: `1.5 Insights Polish` **ปิดได้แล้ว**

### 1.6 Repository And Sync UX Polish

- [X] verify repository onboarding flow จริงตั้งแต่ GitHub installation callback จนถึง select repositories
- [X] verify sync job retry / cancel กับสถานะจริงจาก backend
- [X] ตรวจว่า repository create/update flow สอดคล้องกับ contract จริง
- [X] ตรวจการแสดง connection states ให้ครบ: `not_connected`, `installation_required`, `connected`, `syncing`, `sync_failed`

หมายเหตุ:

- หลังบ้านยืนยันแล้วว่า org ที่ยัง `not_connected` และ repo ที่ยังไม่ผ่าน repository selection flow ไม่ควรถูกพาไปกด sync
- frontend ถูกปรับให้ lock ปุ่ม sync ใน state นี้แล้ว และถ้ายังมี request หลุดไป backend จะตอบ `409` เพื่อนำ user กลับไป onboarding flow ได้ตรงเคส

หมายเหตุเพิ่ม (implement `2026-08-13`, ตรวจ + แก้ onboarding flow จริงจน select repositories):

- พบบั๊กสำคัญระหว่างตรวจ: `GET /organizations/{organizationId}/github/installations/callback` มี query param `state` เป็น **required** ตาม `openapi.yaml` (opaque token ที่ backend สร้างตอน `start` แล้วฝังใน `installUrl` ให้ GitHub echo กลับมาตอน redirect) แต่ `settingsSearchSchema` เดิมไม่ได้ capture `state` จาก URL เลย และ `completeGitHubInstallation` (`github.api.ts`) ก็ไม่เคยส่ง `state` ไปกับ request — ยืนยันกับ backend local จริงว่า callback ที่ไม่มี `state` ตอบ `400 VALIDATION_ERROR: state is required` เสมอ ซึ่งแปลว่า onboarding flow จริง (คลิกติดตั้งจน redirect กลับมา) จะ fail ทุกครั้งที่ step นี้
- แก้โดยเพิ่ม `state` เข้า `settingsSearchSchema`, ส่งต่อเข้า `completeGitHubInstallation`, และผูกเป็นเงื่อนไขบังคับใน callback effect (`selectedOrganizationId && installation_id && state` ครบทั้ง 3 ค่าถึงจะยิง mutation) — ยืนยันกับ backend local จริงอีกครั้งว่าเมื่อส่ง `state` ที่ตรงกับค่าที่ได้จาก `start` แล้ว ผ่าน validation ไปได้ (ไป fail ที่ GitHub API call จริงแทนเพราะใช้ installation id ปลอมในการทดสอบ ซึ่งเป็นข้อจำกัดของ local environment ไม่ใช่ frontend bug)
- เจอ gap เสริม: หน้าเดิมไม่มี error state ให้ผู้ใช้เห็นเลยถ้า callback fail (มีแค่ pending text) เพิ่ม `ErrorState` พร้อมปุ่ม retry ที่ยิง mutation ซ้ำด้วย params เดิม
- verify ส่วน select repositories แยกกับ backend local จริง (`POST /organizations/{organizationId}/github/repositories/select`) ยืนยัน response ตรงกับ `GitHubRepositorySelectionResponse` schema ทุก field
- verify แล้วด้วย `npx tsc --noEmit`, `npx eslint .`, `npm run build`, และ `npx vitest run` (37/37 ผ่าน รวม `settings.test.tsx` เพิ่มจาก 3 → 5 tests ครอบคลุมทั้งเคส missing state และเคส callback error+retry)
- สรุป: `1.6 Repository And Sync UX Polish` **ปิดครบทุกข้อแล้ว**

### 1.7 Production Readiness

- [X] review responsive behavior ของหน้าที่เพิ่มใหม่ทั้งหมด
- [X] ลด bundle size หรือ split routes ถ้าจะเก็บ performance เพิ่ม
- [X] เพิ่ม end-to-end checks สำหรับ flow สำคัญ (เขียนแล้ว — **ยัง execute ไม่ได้ในเครื่องนี้**, ดูหมายเหตุ)
- [X] ตรวจ accessibility ของ form, filter, table, status, action buttons

หมายเหตุ (implement `2026-08-13`):

**Bundle size**

- `dashboard.tsx` ถูก import แบบ static เข้า route tree เดียวกับหน้าอื่นทั้งหมด ทำให้ `echarts` (dependency ใหญ่ที่สุดใน repo, unpacked ~54MB) ถูกมัดรวมเข้า main bundle แม้แต่หน้าที่ไม่มีกราฟเลย (login, pull-requests, insights, settings) — วัดจาก `npm run build` ก่อนแก้: main chunk เดียว `1,511.72 kB` (gzip `480.90 kB`)
- แก้โดยเปลี่ยน `EChartPanel` ให้ `import("echarts")` แบบ dynamic เฉพาะตอน mount แทน static import ที่ top of file — ผลลัพธ์หลังแก้: main chunk `473.48 kB` (gzip `136.90 kB`, ลดลง ~70%) + echarts แยกเป็น chunk ของตัวเอง `1,042.71 kB` (gzip `345.77 kB`) ที่โหลดเฉพาะตอนเข้าหน้า Dashboard จริง ๆ
- ลองต่อด้วย modular echarts imports (`echarts/core` + `echarts/charts` + `echarts/components` + `echarts/renderers` แทน full `echarts`) แต่วัดแล้วประหยัดแค่ ~2KB gzip เพราะ core rendering engine ของ echarts (graphic/Axis/animation) กินพื้นที่หลักอยู่แล้วไม่ว่าจะ register chart type ไหน — เพิ่ม complexity/ความเสี่ยงโดยไม่คุ้ม จึง revert กลับไปใช้ dynamic import แบบง่ายของ full package

**Responsive**

- พบบั๊กจริงที่ `AppSidebar`: `sidebarOpen` default เป็น `true` และ width เดิมคือ `w-72` (288px) โดยไม่มี responsive breakpoint เลย ทำให้บนมือถือ sidebar กิน viewport ส่วนใหญ่ไปตั้งแต่เปิดหน้าแรก แก้โดย force ให้ต่ำกว่า `md:` เป็น `w-20` (icon width) เสมอไม่ว่าจะ toggle state ไหน แล้วโชว์ label เต็มเฉพาะ `md:` ขึ้นไป (ใช้ `sr-only` span คู่กันเพื่อให้ accessible name ยังเป็น label เต็มเสมอสำหรับ screen reader)
- พบบั๊กจริงที่ `AppHeader`: ไม่มี `flex-wrap` และไม่มีการซ่อน/ลดทอนข้อความบนจอแคบ (eyebrow text + user name/email + ปุ่ม 2 ปุ่มในแถวเดียว) เสี่ยง overflow แนวนอนบนมือถือ แก้โดยเพิ่ม `flex-wrap` และซ่อน eyebrow text + user identity block ต่ำกว่า `sm:`
- ตรวจ grid layout ของหน้าอื่นทั้งหมด (dashboard, pull-requests, insights, settings, repositories) พบว่าใช้ pattern `md:grid-cols-*` / `lg:grid-cols-*` สม่ำเสมอ default เป็น single column บนมือถืออยู่แล้ว และไม่พบ hardcoded pixel width (`grep "w-\[...px\]"` ว่างเปล่า) จึงไม่ต้องแก้เพิ่ม

**Accessibility**

- เจอ input/select ที่ไม่มี accessible label เลย (ไม่มีทั้ง wrapping `<label>` และ `aria-label`) ใน `settings.tsx`: ฟอร์ม "Create organization" (GitHub id, slug, name) และฟอร์ม "Add member" (User UUID, role select) — เพิ่ม `aria-label` ให้ครบ
- เจอปุ่ม action ที่ accessible name ซ้ำกันข้ามหลาย row/card ทำให้ผู้ใช้ screen reader แยกไม่ออกว่าปุ่มไหนเป็นของ item ไหน: ปุ่ม "Mark reviewed"/"Dismiss"/"Reopen" ใน `InsightCard` (ซ้ำทุก insight card) และปุ่ม "Save role"/"Remove" + role `<Select>` ต่อสมาชิกใน `settings.tsx` (ซ้ำทุก member row) — เพิ่ม `aria-label` ที่ผูกกับ insight title / member userId ให้ไม่ซ้ำกัน
- แก้ `AppSidebar` nav links ให้ accessible name เป็น label เต็มเสมอ (ผ่าน `sr-only` span) แม้ตอน collapsed state ที่แสดงแค่ตัวอักษรแรกบนจอ — เดิม screen reader จะได้ยินแค่ตัวอักษรเดียว (เช่น "D") ตอน sidebar ถูก collapse
- ตรวจ table แบบ div-based (hotspots, review queue, pull request list) แล้วเห็นว่าใช้ card-per-row layout ที่มีข้อความอธิบายครบในตัว (ไม่ใช่ dense grid ที่ต้องพึ่ง column header ในการตีความ) จึงไม่ถือเป็น accessibility blocker ตาม WCAG แม้จะไม่ใช่ semantic `<table>` — การแปลงเป็น ARIA grid เต็มรูปแบบมีความเสี่ยงทำให้แย่ลงถ้า implement ไม่ครบ จึงไม่แตะส่วนนี้

**End-to-end checks**

- ไฟล์ `tests/e2e/app.spec.ts` เดิมเป็น placeholder จาก scaffold เริ่มต้น (เช็ค heading "DevLens Web Foundation" ซึ่งเป็นหน้า Phase 0 เดิมที่ไม่มี flow จริงเลย) เขียนใหม่เป็น 5 test ครอบคลุม flow สำคัญจริง: unauthenticated redirect ไป `/login`, login ด้วย local dev account, navigate ไป Dashboard และเช็คว่า metrics โหลด, navigate ไป Pull Requests แล้วเปิด PR detail, navigate ไป Insights/Settings
- **ข้อจำกัดสำคัญ**: sandbox ของ session นี้รัน Chromium ไม่ได้ (`page.goto` ตอบ `Error: Page crashed` ทุกครั้งไม่ว่าจะ `--no-sandbox` หรือ flag ใด ๆ — ปัญหานี้มีอยู่ก่อนแล้วกับ e2e test เดิมด้วย ไม่ใช่ผลจากการแก้ไขรอบนี้) จึง **verify ไม่ได้ว่า test ที่เขียนใหม่รันผ่านจริง** ยืนยันได้แค่ผ่าน `npx tsc --noEmit` และ `npx eslint tests/e2e/` (type-safe และ syntax ถูกต้อง) กับ cross-reference selector/ข้อความทุกจุดกับ source code จริง (heading/label ที่ใช้ตรงกับ `login.tsx`, `index.tsx`, `dashboard.tsx`, `pull-requests.tsx`, `insights.tsx`, `app-sidebar.tsx` เป๊ะ)
- **ต้อง verify เพิ่มเติมนอกเซสชันนี้**: รัน `npm run test:e2e` บนเครื่อง/CI ที่รัน browser ได้จริง ก่อนจะถือว่าข้อนี้ปิดสนิท 100%

**Verify อื่น**

- `npx tsc --noEmit`, `npx eslint .`, `npm run build` ผ่านหมด, `npx vitest run` 37/37 ผ่าน (unit test suite เดิม ไม่กระทบจากการแก้ 1.7)
- สรุป: `1.7 Production Readiness` ทำครบ 4 ข้อในขอบเขตที่ตรวจสอบได้ในเซสชันนี้ — **ยกเว้น e2e ที่ต้อง execute ยืนยันเพิ่มนอก sandbox นี้ก่อนถือว่าปิดสนิท**

---

## 2. Future Scope According To Docs 

รายการนี้ยังไม่ควรนับเป็น missing implementation ของ milestone ปัจจุบัน ถ้ายังไม่อยู่ใน `openapi.yaml`

### 2.1 Settings / Admin

- [X] Disconnect GitHub endpoint + UI
- [X] Metric configuration UI
- [X] Insight rule configuration UI
- [X] Data retention settings UI

หมายเหตุ (implement `2026-08-14`): backend ทีมส่งมอบ 5 endpoint ใหม่บน branch `feat/github-app-connection` (commit `cd1b74c feat: add github disconnect, PR timing fields, and org rule/retention settings`) — sync `docs/openapi.yaml` จาก `devlens-api` แล้ว regenerate client:

- **Disconnect GitHub** — `DELETE /organizations/{organizationId}/github/connection` เพิ่ม `disconnectGitHubConnection` ใน `github.api.ts`/`github.query.ts` และปุ่ม "Disconnect GitHub" ใน Settings พร้อม confirm step 2 ขั้น (กันกดพลาด) แสดงเฉพาะตอน connection ไม่ใช่ `not_connected` — verify route/auth จริงกับ backend local (401 ตอนไม่มี token ยืนยันว่า route ผูกถูก) แต่**ไม่ได้ execute จริง**บน org ทดสอบหลักเพราะจะทำให้ต้อง onboarding ใหม่ทั้งหมด (ทีม backend ยืนยันแล้วว่า test ผ่านจริงฝั่งเขา)
- **Insight & metric rule settings** — `GET`/`PUT /organizations/{organizationId}/settings/rules` เพิ่ม feature module ใหม่ `organization-settings/` (schema/api/query) และ UI section ใหม่ใน Settings ปรับได้ครบทั้ง 6 insight rule (enable/disable + threshold) และ metric rule (day type, hotspot weight) — **สำคัญ**: เจอจาก live test ว่า partial update ต่อ field เดียวใน section เดียวกันจะ reset field พี่น้องอื่นในเซคชันนั้นกลับเป็น default (ไม่ merge ลึกระดับ field) จึงออกแบบ UI ให้ save ทั้งก้อน `OrganizationRuleSettings` รวดเดียวเสมอ ไม่แยก save รายฟิลด์ ยืนยันกับ backend local จริงแล้วว่า GET/PUT ทำงานถูกต้อง
- **Retention settings** — `GET`/`PUT /organizations/{organizationId}/settings/retention` เพิ่ม UI section ปรับ `analyticsRawRetentionDays` พร้อม banner เตือนชัดเจนว่า `enforced: false` เสมอตอนนี้ (ค่าที่ตั้งยังไม่มีผลจริงต่อการลบข้อมูล จนกว่า backend จะทำ enforcement เป็น follow-up) ยืนยันกับ backend local จริงแล้ว
- verify แล้วด้วย `npx tsc --noEmit`, `npx eslint .`, `npm run build`, และ `npx vitest run` (44/44 ผ่าน เพิ่ม test ใหม่สำหรับ disconnect confirm flow, rule settings full-payload save, retention save)

### 2.2 Repository / Dashboard Enrichment

- [X] dedicated Repository Health endpoint หรือ view model
- [X] PR-level cycle time / review wait fields แบบ explicit ใน PR detail
- [X] richer comparison views ระหว่างช่วงเวลา (พื้นฐานทำแล้วใน 1.3 ผ่าน "Compare to previous period" toggle บน Dashboard)

หมายเหตุเพิ่ม (implement `2026-08-14`): backend เพิ่ม `cycleTimeMinutes`/`reviewWaitMinutes` (nullable, optional) ใน `PullRequestDetail` แล้วตาม commit เดียวกับ 2.1 — เพิ่มเข้า `pullRequestDetailSchema` และแสดงเป็นการ์ดที่ 4-5 ในหน้า PR detail ยืนยันกับ backend local จริงว่า field มาจริง (`cycleTimeMinutes: 120, reviewWaitMinutes: 30` จาก PR ตัวอย่างที่ merge แล้ว)

หมายเหตุ (implement `2026-08-13`): ต่างจาก 2.1 ตรงที่ `01-business-logic-architecture.md` และ `02-frontend-roadmap-api-mapping.md` ระบุชัดว่า `Repository Health` ไม่ต้องรอ endpoint ใหม่ ให้ derive จาก `dashboard/summary`/`metrics` ที่มีอยู่แล้วได้เลย (ต่างจาก Disconnect GitHub/metric config/insight rule config ใน 2.1 ที่ backend ไม่มี handler เลย) — จึงตรวจแล้วพบว่าทำได้จริงในรอบนี้:

- เพิ่ม section "Repository health" ใน `repository-detail.tsx` โดยเรียก `GET /repositories/{repositoryId}/metrics` (consolidated endpoint ที่ backend มีแล้วแต่ก่อนหน้านี้ยังไม่มีหน้าไหนเรียกใช้เลย) รวมกับ `GET /repositories/{repositoryId}/metrics/workload-distribution`
- reuse component จาก dashboard ทั้งหมด (`DashboardSummaryGrid`, `DashboardHotspotsTable`, `DashboardWorkloadDistribution`) แทนการสร้างใหม่ซ้ำซ้อน พร้อม date range selector (7/30/90 วัน) และ loading/empty/error state ตาม pattern เดียวกับ Dashboard
- ยืนยันกับ backend local จริงว่าทั้ง `GET /repositories/{repositoryId}/metrics` และ `GET /repositories/{repositoryId}/metrics/workload-distribution` ตอบ `200 OK` และ payload ตรงกับ schema ที่ประกาศไว้
- verify แล้วด้วย `npx tsc --noEmit`, `npx eslint .`, `npm run build`, และ `npx vitest run` (38/38 ผ่าน รวม `repository-detail.test.tsx` เพิ่มจาก 2 → 3 tests)

---

## 3. Backend / Operations Items Still Mentioned In Docs

รายการนี้อยู่ในเอกสาร roadmap/operations แต่ไม่ควรถูกตีความว่าเป็น frontend task ตรง ๆ

- [ ] webhook / async pipeline operational verification ใน environment จริง
- [ ] backup / restore drill สำหรับ PostgreSQL และ ClickHouse
- [ ] retention cleanup verification
- [ ] observability / OTEL / Prometheus / Grafana hardening
- [ ] GitHub App permission review ใน environment จริง

---

## 4. Suggested Order

- [X] ปิด live integration verification ของ frontend ทั้ง 5 flows หลักก่อน
- [X] ทำ auth/session UI ให้ครบ
- [X] เก็บ dashboard / pull request / insights polish ตาม payload จริง
- [X] ค่อยไล่ production readiness และ performance (ยกเว้น e2e execution ที่ต้อง verify นอก sandbox นี้)
- [ ] future scope แยกเป็น milestone ถัดไป
