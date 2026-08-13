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

- [ ] verify `Settings` กับ backend local จริง
- [ ] verify `Repositories` list/detail กับ backend local จริง
- [ ] verify `Dashboard & Metrics` กับ backend local จริง
- [ ] verify `Pull Requests` list/detail กับ backend local จริง
- [ ] verify `Insights` list/actions กับ backend local จริง
- [ ] verify error states จาก backend response จริง เช่น `400`, `401`, `403`, `404`, `429`, `500`
- [ ] verify empty states กับ organization / repository ที่ยังไม่มีข้อมูลจริง

### 1.2 Authentication And Session UI

- [ ] ทำ login UI
- [ ] ทำ refresh session flow
- [ ] ทำ logout flow
- [ ] ทำ bearer token persistence/re-hydration flow ให้ครบใน browser
- [ ] ผูก `/me` เข้ากับ auth/session flow จริง แทน manual query-only usage

### 1.3 Dashboard Polish

- [ ] ตรวจว่า dashboard ทุก section ใช้ข้อมูลจริงครบตาม endpoint ล่าสุด
- [ ] ตรวจความสอดคล้องของ `from` / `to` / `interval` กับ metric endpoints จริง
- [ ] เพิ่ม UI สำหรับ trend comparison ที่ใช้ series จาก metrics endpoints
- [ ] ตรวจ loading / empty / error states ของทุก metric section กับ backend response จริง

### 1.4 Pull Request Experience Polish

- [ ] ตรวจว่า PR list ใช้ sorting/filtering ได้ครบตาม contract จริง
- [ ] แสดง `timeline` จาก `GET /pull-requests/{pullRequestId}` ถ้ายังแสดงไม่ครบ
- [ ] ตรวจว่า `riskIndicator` ถูก render ครบถ้ามีใน payload จริง
- [ ] verify pagination behavior กับข้อมูลหลายหน้า

### 1.5 Insights Polish

- [ ] ตรวจว่าใช้ path หลัก `GET /organizations/{organizationId}/insights` หรือ alias อย่างสม่ำเสมอ
- [ ] verify review / dismiss / reopen actions กับ backend local จริง
- [ ] ปรับ evidence rendering ตาม payload จริงถ้ามีหลาย shape
- [ ] รองรับ partial data จาก backend โดยไม่ทำให้หน้า fail ทั้งหน้า

### 1.6 Repository And Sync UX Polish

- [ ] verify repository onboarding flow จริงตั้งแต่ GitHub installation callback จนถึง select repositories
- [ ] verify sync job retry / cancel กับสถานะจริงจาก backend
- [ ] ตรวจว่า repository create/update flow สอดคล้องกับ contract จริง
- [ ] ตรวจการแสดง connection states ให้ครบ: `not_connected`, `installation_required`, `connected`, `syncing`, `sync_failed`

### 1.7 Production Readiness

- [ ] review responsive behavior ของหน้าที่เพิ่มใหม่ทั้งหมด
- [ ] ลด bundle size หรือ split routes ถ้าจะเก็บ performance เพิ่ม
- [ ] เพิ่ม end-to-end checks สำหรับ flow สำคัญ
- [ ] ตรวจ accessibility ของ form, filter, table, status, action buttons

---

## 2. Future Scope According To Docs

รายการนี้ยังไม่ควรนับเป็น missing implementation ของ milestone ปัจจุบัน ถ้ายังไม่อยู่ใน `openapi.yaml`

### 2.1 Settings / Admin

- [ ] Disconnect GitHub endpoint + UI
- [ ] Metric configuration UI
- [ ] Insight rule configuration UI
- [ ] Data retention settings UI

### 2.2 Repository / Dashboard Enrichment

- [ ] dedicated Repository Health endpoint หรือ view model
- [ ] PR-level cycle time / review wait fields แบบ explicit ใน PR detail
- [ ] richer comparison views ระหว่างช่วงเวลา

### 2.3 Advanced Product Features

- [ ] AI recommendation layer สำหรับ insights
- [ ] configurable insight rules
- [ ] deeper org/team benchmarking views
- [ ] advanced export/reporting flows

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

- [ ] ปิด live integration verification ของ frontend ทั้ง 5 flows หลักก่อน
- [ ] ทำ auth/session UI ให้ครบ
- [ ] เก็บ dashboard / pull request / insights polish ตาม payload จริง
- [ ] ค่อยไล่ production readiness และ performance
- [ ] future scope แยกเป็น milestone ถัดไป
