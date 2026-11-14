# Admin & Staff Modern Vintage Theme, Sparkline, Official Logo, Role Redirection & Wave 4 Merge Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the BrewLite Admin Portal into an artisanal Modern Vintage design system (Warm Alabaster & Espresso palette, clean monochrome black vector SVG icons, smooth 7-day revenue Bezier sparkline with amber gradient area and today pulse dot), replace temporary "BL" badge in Admin and "☕" emoji in Staff (`/staff`) with the official group logo `<BrewLiteLogo />`, replace all emojis (📋, ✅, 📖, ⚠️) with clean monochrome black SVG vector icons across both Admin and Staff, enable role-based login redirection, add account portal shortcuts, merge Wave 4 (`fix/wave4-frontend-api-contract`), and push directly to `main` for Vercel/Render auto-deployment.

**Architecture:** 
- Restyle Admin CSS module (`admin.module.css`) to the approved Palette 1 (Warm Alabaster `#FAF6F0`, pure white Bento cards with `#EBE3D5` borders, Deep Espresso `#1C1917` text and accents).
- Embed a lightweight, responsive SVG sparkline component for 7-day revenue featuring smooth Bezier spline curves, linear gradient area shading, and a glowing pulse dot on today's datapoint.
- Refactor bottom navigation bars (`AdminBottomBar.tsx` and `staff/page.tsx`) to render pure monochrome black 2px vector line icons (Chart, Cup, Box, Users on Admin; Clipboard, CheckCircle on Staff) with clear typography and zero emojis.
- Upgrade Staff Header (`/staff`) to use `<BrewLiteLogo height={28} />` alongside "Quầy bar KDS" label and shortcut back to `/menu`.
- Implement role-based redirect in `AuthForms.tsx` (`ADMIN` ➡️ `/admin`, `STAFF` ➡️ `/staff`, `CUSTOMER` ➡️ `/menu`) and shortcut cards on `/account` & header.
- Merge local branch `fix/wave4-frontend-api-contract` cleanly into `main` of `BrewLite_project` and push to GitHub to trigger CI/CD.

**Tech Stack:** Next.js 16 (App Router), React 19, CSS Modules, Tailwind CSS, SVG Bezier Splines, TypeScript, NestJS 10, Zustand.

**Spec:** Showcase artifacts [`admin_modern_vintage_showcase.html`](file:///C:/Users/Giavy/.gemini/antigravity/brain/64d237bc-d69e-4e83-a13a-b20d14239cf0/admin_modern_vintage_showcase.html) & [`staff_kds_showcase.html`](file:///C:/Users/Giavy/.gemini/antigravity/brain/64d237bc-d69e-4e83-a13a-b20d14239cf0/staff_kds_showcase.html).

---

## Global Constraints

- **Design System Palette:** Surface `#FAF6F0`, Cards `#FFFFFF`, Border `#EBE3D5`, Primary Text `#1C1917`, Secondary Text `#78716C`, Accent Gold `#D4AF37`, Success Emerald `#10B981`, Warning Rose `#EF4444`.
- **Iconography Rule:** Pure monochrome black/charcoal SVG vector lines (`stroke="currentColor"`, stroke-width: 2px). Strictly NO emojis or colored icons anywhere in navigation, status bars, or buttons.
- **Brand Consistency Rule:** Both Admin (`/admin`) AND Staff (`/staff`) headers MUST render the official group logo `<BrewLiteLogo />`.
- **Sparkline Chart Dimensions:** Responsive SVG (viewBox `0 0 320 60`), height `52px`, smooth cubic Bezier curve, gradient stop `#C68B59` / `#D4AF37` at 30% opacity fading to 0%, animated pulse dot at current day.
- **Role-Based Login Redirection:** Preserve explicit query param `?redirect=...` if present; fallback to `ADMIN` ➡️ `/admin`, `STAFF` ➡️ `/staff`, `CUSTOMER` ➡️ `/menu`.
- **Zero Conflict Wave 4 Merge:** Merge `fix/wave4-frontend-api-contract` into `main` using `--no-ff`.
- **Zero Build Warnings/Errors:** `npm run build -w apps/web` and `npm run build -w apps/api` must exit `0`.
- **Deployment Action:** On completion, push directly to `main` on `MaGiaVy/BrewLite_project` to trigger automatic Vercel & Render deployment.

---

## Review Focus

1. **Accessibility & Contrast:** High contrast text ratio (WCAG AAA >= 7:1) for `#1C1917` on `#FAF6F0` and `#FFFFFF`.
2. **Mobile Shell Responsiveness:** Bottom bar and header must stay sticky and fit mobile viewports (<480px) and tablet/desktop centered shell.
3. **Brand & Icon Parity on Both Portals:** Verify both `/admin` and `/staff` headers display `<BrewLiteLogo />` cleanly and use pure monochrome black SVG vector icons without emojis.
4. **Session Role Guard Isolation:** Route guard middleware (`middleware.ts`) must allow unauthenticated `/login` without redirect loops.
5. **No Regressions on Live APIs:** Admin & Staff data fetching (`/products`, `/inventory/ingredients`, `/orders`, `/staff`, `/admin/customers`) must continue functioning with live Supabase and Render endpoints.

---

### Task 1: Merge Wave 4 (`fix/wave4-frontend-api-contract`) into `main` on `BrewLite_project`

**Files:**
- Git: `D:\SWE\BrewLite_project` branch `main`

**Interfaces:**
- Consumes: Local branch `fix/wave4-frontend-api-contract` (7 commits).
- Produces: `main` updated with KDS chime, 86 sold-out sheet, Edge route guard middleware, and live PG integration tests.

- [x] **Step 1: Verify git status is clean on `BrewLite_project`**
  ```bash
  cd D:\SWE\BrewLite_project
  git checkout main
  git status
  ```
- [x] **Step 2: Merge `fix/wave4-frontend-api-contract` into `main`**
  ```bash
  git merge --no-ff fix/wave4-frontend-api-contract -m "merge(wave4): integrate frontend api-contract, kds chime, 86 toggle, and route guard"
  ```
- [x] **Step 3: Verify build passes after merge**
  ```bash
  npm run build -w apps/web
  ```

---

### Task 2: Modern Vintage Theme & Official Logo on `/admin`

**Files:**
- Modify: `D:\SWE\BrewLite_project\apps\web\src\components\admin\admin.module.css`
- Modify: `D:\SWE\BrewLite_project\apps\web\src\app\admin\page.tsx`

**Interfaces:**
- Consumes: Approved Palette 1 tokens from `admin_modern_vintage_showcase.html`.
- Produces: Warm Alabaster background, Bento white cards, official `BrewLiteLogo`, and monochrome vector actions.

- [x] **Step 1: Update `admin.module.css` color variables and classes**
  - Replace `#0c0806` / `#160f0c` page background with `#FAF6F0`.
  - Replace dark red `#991b1b` / `#450a0a` logo badge with official `BrewLiteLogo` wrapper.
  - Update card backgrounds to `#FFFFFF` with borders `#EBE3D5` and subtle box-shadow `0 2px 8px rgba(44, 24, 16, 0.04)`.
  - Update typography colors: primary text `#1C1917`, secondary `#78716C`, accent `#D4AF37`.
- [x] **Step 2: Update Header in `apps/web/src/app/admin/page.tsx`**
  - Import `BrewLiteLogo` from `../../components/BrewLiteLogo`.
  - Replace `<div className={styles.logoBadge}>BL</div>` with `<div className={styles.logoWrap}><BrewLiteLogo height={32} /></div>`.
  - Replace bell and action button styling with sleek monochrome black vector icons.
- [x] **Step 3: Verify Admin header and cards render cleanly in browser**

---

### Task 3: Official Group Logo, Vector Icons & Navigation on Staff KDS (`/staff`)

**Files:**
- Modify: `D:\SWE\BrewLite_project\apps\web\src\app\staff\page.tsx`
- Modify: `D:\SWE\BrewLite_project\apps\web\src\components\staff\staff.module.css`

**Interfaces:**
- Consumes: `BrewLiteLogo` component and pure SVG vector icons.
- Produces: Professional KDS header with official logo, subtitle "Quầy bar KDS", monochrome SVG vector bottom navigation (replacing 📋 và ✅), vector recipe icon, and link back to menu. Zero emojis.

- [x] **Step 1: Import `BrewLiteLogo` in `apps/web/src/app/staff/page.tsx`**
  ```tsx
  import { BrewLiteLogo } from '../../components/BrewLiteLogo';
  ```
- [x] **Step 2: Update Staff Header markup**
  - Replace `<span>☕ BrewLite · Quầy bar KDS</span>` with:
    ```tsx
    <div className={styles.brand}>
      <BrewLiteLogo height={28} />
      <span className={styles.kdsBadge}>Quầy bar KDS</span>
    </div>
    ```
  - Add quick navigation button "Thực đơn" next to `totalChip` linking to `/menu`.
- [x] **Step 3: Replace all emojis in `staff/page.tsx` with clean monochrome black SVG vector icons**
  - Replace `📋 Đơn đang pha` with SVG Clipboard icon + text.
  - Replace `✅ Lịch sử đã xong` with SVG Check-circle icon + text.
  - Replace `📖` in recipe buttons with SVG Book-open icon.
  - Replace `⚠️` in warning banners with SVG Alert-triangle icon.
- [x] **Step 4: Update `staff.module.css` for bottom navigation & `.kdsBadge`**
  - Clean vector alignment, border-left divider, elegant typography matching coffee theme.

---

### Task 4: Revenue Sparkline Line Chart Component

**Files:**
- Create: `D:\SWE\BrewLite_project\apps\web\src\components\admin\RevenueSparkline.tsx`
- Modify: `D:\SWE\BrewLite_project\apps\web\src\components\admin\AdminOverviewSection.tsx`

**Interfaces:**
- Consumes: 7-day order revenue data from `chartOrders ?? recentOrders`.
- Produces: Smooth SVG Bezier line chart with amber gradient area, data dots, and animated pulse dot.

- [x] **Step 1: Implement `RevenueSparkline.tsx`**
  - Calculate 7 daily totals for the past 7 days (T2 through CN).
  - Compute normalized SVG coordinates (viewBox `0 0 320 60`).
  - Render smooth cubic Bezier spline path `d="M ... C ..."` with `<linearGradient>` amber area fill.
  - Render pulse dot `<circle>` at current day with CSS animation.
  - Render weekday labels `T2  T3  T4  T5  T6  T7  CN (Nay)`.
- [x] **Step 2: Integrate `RevenueSparkline` into `AdminOverviewSection.tsx`**
  - Embed directly inside the top 7-day revenue card.
  - Display net revenue total with +14.2% growth indicator pill.
- [x] **Step 3: Verify sparkline renders accurately with zero layout shifts**

---

### Task 5: Pure Monochrome Black Vector Navigation on `AdminBottomBar`

**Files:**
- Modify: `D:\SWE\BrewLite_project\apps\web\src\components\admin\AdminBottomBar.tsx`
- Modify: `D:\SWE\BrewLite_project\apps\web\src\components\admin\admin.module.css`

**Interfaces:**
- Consumes: `ChartIcon`, `CupIcon`, `BoxIcon`, `UsersIcon` from `AdminIcons.tsx`.
- Produces: Minimalist black line bottom navigation with active/inactive indicators. Zero emojis.

- [x] **Step 1: Update `AdminBottomBar.tsx` tabs**
  - Ensure all 4 tabs (`overview`, `menu`, `inventory`, `management`) use clean SVG vector icons.
  - Set active tab color to Deep Espresso/Black (`#1C1917`) with stroke-width `2.3px`.
  - Set inactive tab color to muted stone (`#A8A29E`) with hover transition.
- [x] **Step 2: Update bottom nav bar container styling in `admin.module.css`**
  - Background `#FFFFFF` with top border `#EBE3D5` and subtle backdrop blur.
- [x] **Step 3: Verify tab switching functions smoothly**

---

### Task 6: Role-Based Redirection on Login & Portal Shortcuts on `/account`

**Files:**
- Modify: `D:\SWE\BrewLite_project\apps\web\src\components\auth\AuthForms.tsx`
- Modify: `D:\SWE\BrewLite_project\apps\web\src\app/account/page.tsx`
- Modify: `D:\SWE\BrewLite_project\apps\web\src\app/admin/page.tsx`

**Interfaces:**
- Consumes: `user.role` from `useAuthStore` and login API response.
- Produces: Automatic conditional routing on login, plus Admin/Staff portal shortcuts on `/account`.

- [x] **Step 1: Update `handleSubmit` in `AuthForms.tsx`**
  - Check `data.user?.role`:
    ```typescript
    const explicitRedirect = searchParams.get('redirect');
    if (explicitRedirect) {
      router.push(explicitRedirect);
    } else if (data.user?.role === 'ADMIN') {
      router.push('/admin');
    } else if (data.user?.role === 'STAFF') {
      router.push('/staff');
    } else {
      router.push('/menu');
    }
    ```
- [x] **Step 2: Add portal shortcut cards in `apps/web/src/app/account/page.tsx`**
  - If `user?.role === 'ADMIN'`: Render prominent "Trang Quản Trị (Admin Portal)" shortcut.
  - If `user?.role === 'STAFF'`: Render "Màn hình Pha chế (KDS Barista)" shortcut.
- [x] **Step 3: Add "Xem Thực đơn Khách hàng" link in Header of `/admin` & `/staff`**
  - Allows seamless navigation back to `/menu` without logging out.

---

### Task 7: Verification Gates, Git Push to `main` & Live Production Verification

**Files:**
- Verification & Deployment

**Interfaces:**
- Produces: 100% passing builds, push to GitHub `personal/main`, Vercel & Render live deployment.

- [x] **Step 1: Run Next.js build verification**
  ```bash
  cd D:\SWE\BrewLite_project
  npm run build -w apps/web
  ```
  Expected: Compiled successfully with zero errors.
- [x] **Step 2: Run NestJS API build verification**
  ```bash
  npm run build -w apps/api
  ```
  Expected: Compiled successfully with zero errors.
- [x] **Step 3: Commit all changes cleanly**
  ```bash
  git add apps/web/src/
  git commit -m "feat(admin,staff): modern vintage theme, official logo, sparkline, monochrome icons, and role redirect"
  ```
- [x] **Step 4: Push directly to `main` on GitHub**
  ```bash
  git push personal main
  ```
- [x] **Step 5: Verify live auto-deployment on Vercel**
  - Monitor deployment at `https://brew-lite-project.vercel.app/admin`.
  - Monitor deployment at `https://brew-lite-project.vercel.app/staff`.
  - Verify live menu at `https://brew-lite-project.vercel.app/menu`.
