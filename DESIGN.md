# DESIGN.md — BrewLite (Cashless Specialty Coffee Roastery)

> **Mục đích tài liệu:**  
> File này đóng vai trò là **Source of Truth (Nguồn sự thật thiết kế)** duy nhất cho toàn bộ giao diện BrewLite.  
> Mọi màn hình được tạo hoặc chỉnh sửa trên Frontend phải tuân thủ nghiêm ngặt các quy tắc, token màu sắc, typography và kiến trúc responsive (Web Desktop & Mobile) được định nghĩa tại đây.  
> **Nguồn tham chiếu:** Hợp nhất từ Mockup thiết kế chính thức (Artisanal Roastery / Cashless Kiosk) và `BrewLite_SRS_Final.md` (v4.0).

---

## 1. TỔNG QUAN SẢN PHẨM & ĐỐI TƯỢNG NGƯỜI DÙNG

- **Định vị sản phẩm:** Nền tảng đặt và thanh toán cà phê thủ công cao cấp không dùng tiền mặt (**100% Cashless Specialty Roastery**).
- **Trọng tâm trải nghiệm (UX Core):**
  - **Trải nghiệm Web Desktop (Môi trường chấm điểm & demo chính):** Đậm chất Artisanal Roastery sang trọng, không gian thoáng đãng, bố cục 2 cột chuyên nghiệp, hình ảnh chất lượng cao, ghi chú hương vị (Taste Notes) tinh tế.
  - **Trải nghiệm Mobile Web (Khách mua tại quầy/trên đường đi):** Thao tác nhanh gọn trong vài chạm, nút bấm ngón tay cái thuận tiện (Thumb-friendly), sticky action bar rõ ràng, không bị giật lag hay cuộn ngang.
- **Công nghệ triển khai:** Next.js 15 (App Router) + React 19 + TailwindCSS v4 + Zustand + Lucide Icons.

---

## 2. KIẾN TRÚC LUỒNG MÀN HÌNH (INFORMATION ARCHITECTURE)

Dựa trên đề bài môn học và mockup thực tế, hệ thống gồm **5 màn hình cốt lõi** trải dài qua 2 trạng thái thiết bị:

```
[1. Menu Thực Đơn] ──► [2. Chi Tiết Món] ──► [3. Giỏ Hàng (/cart)]
                                                     │
                                             (Bắt buộc Login)
                                                     ▼
[5. Theo Dõi Đơn (/orders/:id)] ◄─── [4. Thanh Toán (/checkout)]
```

### 2.1. Phân chia rõ ràng giữa Giỏ hàng (`/cart`) và Thanh toán (`/checkout`)
* **Trang `/cart` (Giỏ hàng):** Nơi xem lại các món đã chọn, điều chỉnh số lượng (1–20), xóa món, xem tạm tính. Khi bấm **"Thanh toán · Pay"**, hệ thống kiểm tra Auth: nếu chưa đăng nhập → chuyển sang `/auth/login`, đăng nhập xong tự động đưa vào `/checkout`.
* **Trang `/checkout` (Thanh toán):** Nơi nhập mã giảm giá (Voucher), chọn phương thức thanh toán (Ví điện tử / Thẻ mô phỏng), xem tóm tắt chi phí chính thức và bấm **"Xác nhận thanh toán"**.

---

## 3. DESIGN TOKENS (MÀU SẮC, TYPOGRAPHY & SPACING)

### 3.1. Bảng màu chuẩn (Palette Tokens)

Bảng màu được trích xuất trực tiếp từ các mockup chuẩn của thương hiệu BrewLite:

| Tên Token | Mã Hex | Vai trò sử dụng | Tỷ lệ tương phản (Contrast) |
|---|---|---|---|
| `--color-bg` | `#FBF8F3` | Nền trang chính (Warm Cream Paper) | Nền tảng dịu mắt, ấm áp |
| `--color-surface` | `#FFFFFF` | Nền thẻ sản phẩm, panel, modal, form input | Sạch sẽ, tách bạch |
| `--color-surface-muted` | `#F7F3EE` | Nền thẻ phụ, badge xám, ô chọn chưa active | Tách khối mềm |
| `--color-border` | `#E8E5E1` | Đường kẻ, viền card, viền divider | Mảnh 1px tinh tế |
| `--color-primary` | `#2A1810` | Nâu Espresso đậm (Nút bấm chính, tiêu đề H1, icon chủ đạo) | Đạt chuẩn AAA (>12:1) trên nền kem |
| `--color-on-primary` | `#FFFFFF` | Màu chữ trên nền nút chính | Đạt chuẩn AAA (>12:1) |
| `--color-accent` | `#C28B5B` | Nâu Caramel ấm (Điểm nhấn, viền active, icon highlight) | Sang trọng, đặc trưng cà phê |
| `--color-accent-soft` | `#F8EBE0` | Nền highlight (mã ưu đãi, tag khuyến mãi, bước active) | Mềm mại, tương phản cao với chữ đậm |
| `--color-text` | `#2A1810` | Màu chữ chính cho toàn bộ trang | Đạt chuẩn AAA |
| `--color-text-muted` | `#6B5D52` | Màu chữ phụ, mô tả món, nhãn tiếng Anh phụ | Đạt chuẩn AA (khoảng 6:1 trên nền kem) |
| `--color-success` | `#2E7D32` | Trạng thái thành công, đã thanh toán, icon check | Đạt chuẩn AA |
| `--color-warning` | `#8A5A00` | Cảnh báo, trạng thái chờ | Đạt chuẩn AA trên nền `#FFF3D6` |
| `--color-danger` | `#B3261E` | Thông báo lỗi, hủy đơn, thanh toán thất bại | Đạt chuẩn AA |

---

### 3.2. Quy tắc Typography (Font chữ & Phân cấp)

Sự kết hợp giữa **Serif cổ điển (Thủ công / Nghệ nhân)** và **Sans-serif hiện đại (Rõ ràng / Dễ đọc)**:

* **Font Tiêu đề & Giá lớn:** **Playfair Display** (hoặc `font-serif`, hỗ trợ đầy đủ tiếng Việt). Tạo cảm giác cao cấp, sang trọng của quán cà phê thủ công.
* **Font Nội dung & Giao diện (UI):** **Inter** (hoặc `font-sans`, hỗ trợ đầy đủ tiếng Việt). Rõ ràng, sắc nét trên mọi độ phân giải.

| Cấp bậc | Desktop | Mobile | Cân nặng (Weight) & Kiểu | Line-height |
|---|---|---|---|---|
| **H1 (Tiêu đề trang)** | 36px – 40px | 26px – 28px | 700 Serif (`font-serif font-bold`) | 1.2 |
| **H2 (Tiêu đề mục)** | 24px – 28px | 20px – 22px | 700 Serif | 1.3 |
| **H3 (Tên món/Card)** | 18px – 20px | 16px – 17px | 600 Serif / Sans | 1.3 |
| **Giá tiền nổi bật** | 20px – 24px | 18px – 20px | 700 Serif / Sans | 1.2 |
| **Body (Nội dung)** | 15px – 16px | 14px – 15px | 400 Sans (`font-normal`) | 1.5 |
| **Body nhỏ (Mô tả)** | 13px – 14px | 13px | 400 Sans | 1.4 |
| **Caption / Badge** | 12px (tối thiểu) | 11px – 12px | 500 – 600 Sans | 1.3 |

> **Quy định cấm:** Tuyệt đối không dùng kích thước chữ nhỏ hơn **11px** trên bất kỳ thiết bị nào.

---

### 3.3. Bo góc, Đổ bóng & Hệ thống khoảng cách (Spacing Rhythm)
- **Hệ thống khoảng cách 4/8dp:** `4px` · `8px` · `12px` · `16px` · `24px` · `32px` · `48px` · `64px`.
- **Bo góc (Border Radius):**
  - Card sản phẩm, Panel container: `rounded-2xl` (`16px`).
  - Nút bấm chính, Ô nhập form: `rounded-xl` (`12px`).
  - Badge, Tag trạng thái: `rounded-full` (`999px` dạng viên thuốc).
- **Đổ bóng (Box Shadow):** Đổ bóng cực nhẹ, tự nhiên: `shadow-sm` hoặc `shadow-[0_4px_20px_rgba(42,24,16,0.06)]`. Ưu tiên sử dụng viền kẻ mỏng `--color-border` hơn là đổ bóng đậm.

---

## 4. QUY TẮC HIỂN THỊ DỮ LIỆU & NGHIỆP VỤ (KHỚP SRS v4.0)

| Thành phần | Quy tắc hiển thị chuẩn | Ví dụ minh họa |
|---|---|---|
| **Định dạng tiền tệ** | Ngăn cách hàng nghìn bằng dấu chấm `.`, hậu tố `đ`. Không có số lẻ. | `48.000đ`, `105.000đ` |
| **Giá sản phẩm trên Menu** | Hiển thị chữ **"Từ {giá_size_S}đ"** | `Từ 48.000đ` |
| **Phụ thu kích thước (Size)** | Ba lựa chọn bắt buộc, kèm dung tích (ml) nếu có: | Size S (Nhỏ - 250ml) `+0đ`<br>Size M (Vừa - 350ml) `+5.000đ`<br>Size L (Lớn - 500ml) `+10.000đ` |
| **Tùy chọn Topping** | Checkbox dạng card, có giá rõ ràng: | Kem muối biển `+10.000đ`<br>Trân châu giòn `+8.000đ`<br>Thạch cà phê `+8.000đ` |
| **Tùy chọn Mức Đá (Mới)** | Radio/Pill chọn mức đá (+0đ): | `100% Đá` · `70% Đá` · `50% Đá` · `Không Đá` |
| **Tùy chọn Mức Đường (Mới)** | Radio/Pill chọn mức đường (+0đ): | `Chuẩn Ngọt` · `70% Đường` · `50% Đường` · `Không Đường` |
| **Số lượng món** | Bộ tăng giảm `[-] {qty} [+]`, chặn từ 1 đến 20. | Tự động cộng dồn nếu trùng cấu hình |
| **Mã giảm giá (Voucher)** | Danh sách seed có sẵn để test: | `BREWCOZY` (-15% đơn hàng)<br>`BREWLITE10` (-10%, tối đa 20k)<br>`WELCOME20` (-20.000đ) |
| **Điểm thưởng (Loyalty)** | Công thức: `floor(tổng_thanh_toán / 10.000)`. | Đơn 89.250đ $\rightarrow$ `+8 điểm` |
| **Phương thức thanh toán** | Ví điện tử (mô phỏng) hoặc Thẻ ngân hàng. | Ghi rõ nhãn `Sandbox Mode` |
| **Mã đơn hàng** | Định dạng hiển thị bắt đầu bằng dấu thăng `#`: | `#1042` |

---

## 5. THIẾT KẾ CHI TIẾT TỪNG MÀN HÌNH (DESKTOP & MOBILE)

### 5.1. Màn hình 1: Thực đơn · Menu (`/`)

#### 🖥️ Bố cục Web Desktop (Màn hình chính của Thầy)
* **Header:**
  - Bên trái: Logo BrewLite (Icon tách cà phê vector + chữ `BrewLite CASHLESS ROASTERY`).
  - Ở giữa: Menu điều hướng `Thực đơn • Menu` (active có gạch chân đen) và `Đơn hàng • Orders`.
  - Bên phải: Badge điểm thưởng `+120 điểm` (nền kem nhẹ), Icon Giỏ hàng kèm badge số lượng tròn đỏ/đen `[2]`, Icon tài khoản người dùng.
* **Hero Banner Roastery:**
  - Dòng tag nhỏ: `SINGLE ORIGIN & ARTISANAL ROASTERY`.
  - Tiêu đề H1 lớn font serif: `Thực đơn • Menu`.
  - Dòng mô tả ngắn: *"Hương vị thủ công rang mộc, trải nghiệm gọi món không tiền mặt tốc độ cao."*
  - Badge tiện ích bên phải: `3 - 5 Phút Chuẩn Bị • Express pickup tại quầy bar`.
* **Voucher Banner nổi bật:**
  - Khối màu nâu đậm bo góc lớn: Giảm ngay 15% với mã `BREWCOZY` kèm nút bấm *"Sao chép mã"*.
* **Thanh tìm kiếm & Thống kê:**
  - Ô search tròn dẹp: *"Tìm đồ uống, cà phê... • Search drinks, roasts..."*.
  - Dòng trạng thái nhỏ: *"Đang hiển thị 6 món trong thực đơn thủ công"*.
* **Lưới sản phẩm (Grid):**
  - Desktop hiển thị **4 cột** (hoặc 3 cột trên tablet), khoảng cách `gap-6`.
  - **Mỗi thẻ món (Product Card):**
    - Ảnh món tỉ lệ vuông 1:1, góc bo `rounded-2xl`, có hiệu ứng hover zoom nhẹ.
    - Badge tag trên ảnh: `BESTSELLER`, `TRUYỀN THỐNG`, `PHA MÁY`, `Ủ LẠNH 18H`, `TRÀ MỘC`.
    - Tên món font serif đậm: `Cà Phê Muối`, nhãn tag phụ `SALTED`.
    - Dòng mô tả ngắn: `line-clamp-2` giúp các thẻ luôn bằng nhau về chiều cao.
    - Chân thẻ: Dòng giá `Từ 48.000đ` bên trái, nút mũi tên tròn `→` bên phải (hover đổi màu espresso).
    - Món hết hàng (`stock = 0`): Phủ overlay mờ `opacity-60`, nhãn `Hết hàng · Sold out`, icon ổ khóa, click bị vô hiệu hóa.
* **Footer Kiosk Roastery:**
  - Banner cam kết 100% Cashless (Logo Napas, Visa, Master, Apple Pay, MoMo).
  - 3 cột chân trang: Thông tin thương hiệu, Danh mục catalog, Giờ mở cửa xưởng rang.

#### 📱 Tối ưu hóa Mobile Web (< 768px)
* Header tinh gọn: Logo + Nút giỏ hàng có badge số lượng.
* Lưới sản phẩm: **2 cột** (`grid-cols-2 gap-3`).
  - Trên mobile, ẩn dòng mô tả dài để tránh card bị quá dài, giữ lại: Ảnh, Badge, Tên món, Giá "Từ 48k" và nút bấm.
  - Vùng bấm bao trùm toàn bộ thẻ (Card click mở trang chi tiết).
* Thanh điều hướng **Bottom Navigation (4 tab cố định)**: `Thực đơn` · `Giỏ hàng` · `Đơn hàng` · `Tài khoản`.

---

### 5.2. Màn hình 2: Chi tiết sản phẩm (`/products/:id`)

#### 🖥️ Bố cục Web Desktop (2 Cột Sang Trọng)
* Nút điều hướng đầu trang: `← Quay lại Thực đơn • Back to menu`, bên phải có tag `Express Bar 01 • Sẵn sàng pha chế`.
* **Cột trái (Hình ảnh & Câu chuyện hương vị - 50% width):**
  - Ảnh lớn sắc nét, góc bo `rounded-3xl`, có badge `Signature Roastery` và `ĐẮK LẮK FINE ROBUSTA`.
  - 3 khối thông số nhanh: `Đậm đà êm ái (Single Shot Phin-press)`, `Kem muối biển (Ủ lạnh độc quyền)`, `3 - 5 Phút (Chiết xuất trạm Express)`.
  - Khối **Trải nghiệm hương vị (Taste Note)**: Mô tả cảm giác nếm, gợi ý cách uống không cần ống hút để cảm nhận lớp kem béo sóng sánh.
* **Cột phải (Cấu hình tùy chọn & Đặt món - 50% width):**
  - Mã sản phẩm (`CF-SLT-01`), Tên món H1 font serif `Cà Phê Muối`, tên tiếng Anh phụ `Salted Cream Coffee`.
  - Giá gốc: `48.000đ (Giá gốc • Base)`.
  - **1. Chọn kích thước • Size (Bắt buộc):** 3 ô nút bấm lớn (S / M / L) xếp ngang, hiển thị rõ phụ thu `+0đ`, `+5.000đ`, `+10.000đ`. Ô đang chọn có viền nâu đen đậm.
  - **2. Tùy chọn Đá & Đường:** Các nút pill nhỏ gọn để chọn mức ngọt và đá.
  - **3. Thêm Topping • Extras (Tùy chọn):** Danh sách checkbox dạng card (`Kem muối +10k`, `Trân châu giòn +8k`, `Thạch cà phê +8k`).
  - **4. Số lượng • Quantity:** Bộ nút bấm to rõ `[-]  1  [+]`.
  - **Nút hành động chính:** Nút đen nâu full-width cao `54px`:  
    **`Thêm vào giỏ hàng • Add to cart — 58.000đ`** (Giá tiền tự động nhảy theo size & topping đã chọn theo thời gian thực).

#### 📱 Tối ưu hóa Mobile Web (< 768px)
* **Ẩn hoàn toàn Bottom Navigation** khi vào trang này để tối ưu không gian đọc.
* Nội dung xếp thành 1 cột: Ảnh sản phẩm $\rightarrow$ Tên món & Giá $\rightarrow$ Bộ chọn Size $\rightarrow$ Topping $\rightarrow$ Đường/Đá.
* Khối Taste Note dài được đặt trong khối Accordion (bấm để mở rộng) giúp khách hàng nhanh chóng cuộn đến phần chọn món.
* **Sticky Action Bar dính sát đáy màn hình:**  
  Nút *"Thêm vào giỏ hàng — 58.000đ"* cố định ở cạnh dưới cùng màn hình kèm khoảng đệm safe-area (`pb-safe`), giúp ngón tay cái bấm cực kỳ dễ dàng mà không bị che khuất.

---

### 5.3. Màn hình 3: Giỏ hàng · Cart (`/cart`)

* **Nội dung hiển thị:**
  - Danh sách từng dòng món: Ảnh nhỏ (60x60px), Tên món, Tag Size + Topping + Đá/Đường, Bộ nút tăng/giảm số lượng (1–20), Nút icon thùng rác để xóa món, Giá thành tiền từng dòng.
  - Dòng Tạm tính (Subtotal).
  - Nút chính: **`Thanh toán • Proceed to Checkout — {tổng_tiền}đ`**.
  - Liên kết phụ: `← Tiếp tục chọn món`.
* **Xử lý trạng thái Auth (Cực kỳ quan trọng):**  
  Khi khách bấm *"Thanh toán"*:
  - Nếu đã đăng nhập $\rightarrow$ Chuyển thẳng sang `/checkout`.
  - Nếu chưa đăng nhập $\rightarrow$ Tự động chuyển hướng sang `/auth/login` (kèm query `?redirect=/checkout`). Sau khi login/register xong, hệ thống tự động đưa thẳng vào `/checkout` mà không làm mất giỏ hàng.
* **Trạng thái giỏ trống:** Minh họa tách cà phê rỗng + thông báo *"Giỏ hàng của bạn đang trống"* + nút bấm *"Khám phá thực đơn ngay"*.

---

### 5.4. Màn hình 4: Thanh toán · Checkout (`/checkout`)

#### 🖥️ Bố cục Web Desktop (2 Cột Chuyên Nghiệp)
* **Cột trái (60% width - Tùy chọn thanh toán & Voucher):**
  - **Khối tóm tắt món:** Liệt kê vắn tắt các món trong đơn hàng.
  - **Khối Mã ưu đãi • Voucher:**
    - Ô nhập mã + Nút *"Áp dụng • Apply"*.
    - Khi mã hợp lệ: Hiện thẻ nền cam nhạt `--color-accent-soft` ghi rõ: `BREWCOZY (-15%) - Đã tiết kiệm 15.750đ` kèm nút `[X] Gỡ • Remove`.
  - **Khối Phương thức thanh toán (Sandbox Mode):**
    - Thẻ chọn `Ví điện tử (mô phỏng) • E-wallet (mock)` có dấu tích check xanh/đen.
    - Dòng cam kết bảo mật 100% Cashless Kiosk.
* **Cột phải (40% width - Bảng tính tiền & Xác nhận):**
  - Card bo góc nền trắng:
    - Tạm tính: `105.000đ`
    - Khuyến mãi `BREWCOZY (-15%)`: `-15.750đ` (chữ màu xanh lá)
    - Phí dịch vụ Kiosk: `0đ (Miễn phí)`
    - **TỔNG THANH TOÁN (VAT incl.): `89.250đ`** (font serif lớn, đậm)
    - Điểm thưởng tích lũy: `+8 điểm` (Reward points)
  - Nút bấm chính xác nhận:  
    **`Xác nhận thanh toán • Confirm payment — 89.250đ`**
  - Subtext: *"Ví Sandbox - Khởi tạo đơn tức thời • Bảo mật PCI-DSS Level 1 Sandbox"*.

#### 📱 Tối ưu hóa Mobile Web (< 768px)
* Ẩn Bottom Navigation.
* Toàn bộ nội dung xếp 1 cột dọc: Món tóm tắt $\rightarrow$ Ô Voucher $\rightarrow$ Phương thức thanh toán $\rightarrow$ Bảng tổng kết tiền.
* Nút *"Xác nhận thanh toán"* dính sát đáy (Sticky Bottom Bar) giúp khách chốt đơn tức thì.

---

### 5.5. Màn hình 5: Theo dõi đơn hàng & Xác nhận (`/orders/:id`)

Dựa trên Mockup Ảnh 4 (Màn hình theo dõi chuẩn Kiosk):

* **Thông tin định danh đơn:**
  - Tiêu đề: `MÃ ĐƠN • ORDER ID #1042 • 10/10/2026 10:42`.
  - Badge trạng thái nổi bật: `Express Kiosk`, `Đang pha chế • Preparing`.
  - Dòng cập nhật thời gian thực: `Tự động cập nhật mỗi 5 giây • Cập nhật lúc 10:42:05`.
* **Tiến trình chuẩn bị (Brewing Progress Stepper):**
  - **Trên Desktop:** Hiển thị thanh ngang 5 bước hoàn chỉnh:
    1. `Chờ thanh toán (Pending)` [Check xanh lá]
    2. `Đã thanh toán (Paid)` [Check xanh lá]
    3. `Đang pha chế (Preparing)` [Biểu tượng ngọn lửa nâu - Đang sáng]
    4. `Sẵn sàng (Ready)` [Biểu tượng tách cà phê xám]
    5. `Hoàn tất (Completed)` [Biểu tượng hoàn tất]
  - **Trên Mobile:** Rút gọn thành thanh tiến trình Progress Bar có chỉ số rõ ràng: **`Bước 3 / 5: Đang pha chế`** kèm icon nổi bật, tránh việc 5 chữ bị dồn ép gây vỡ layout trên màn hình nhỏ.
* **Thông báo nhận món:**
  - Khối thông tin: `Trạm Nhận Nhanh • Station 02 [Active Lane]` — *"Vui lòng theo dõi màn hình hiển thị số #1042 tại quầy Bar Express. Dự kiến: ~2 - 3 phút"*.
* **Cột Chi tiết đơn hàng (bên phải trên Desktop):**
  - Danh sách từng món đầy đủ size, topping, đá, đường.
  - Tổng thanh toán, số điểm thưởng cộng vào tài khoản: `+8 điểm • Reward points`.
  - Mã giao dịch: `#TX-904291`.
* **Xử lý ngoại lệ Thanh toán thất bại (`PAYMENT_FAILED`):**
  - Stepper chuyển sang trạng thái cảnh báo đỏ.
  - Hiển thị thông báo: *"Thanh toán chưa thành công. Đơn hàng của bạn vẫn được giữ chỗ tồn kho."*
  - Xuất hiện 2 nút rõ ràng: **`Thử lại thanh toán • Try again`** (nút chính) và **`Hủy đơn hàng • Cancel order`** (nút phụ nguy hiểm, có xác nhận hoàn kho).

---

## 6. TIÊU CHÍ TRUY CẬP (ACCESSIBILITY) & CHỐNG LỖI UI

1. **Touch Target Size (Vùng chạm di động):** Tất cả các nút bấm, icon button, ô checkbox topping đều có diện tích bấm thực tế $\ge 44 \times 44\text{px}$.
2. **Ngăn chặn Layout Shift (CLS):** Ảnh sản phẩm luôn có thuộc tính `aspect-ratio: 1/1` và skeleton loader đúng kích thước khi đang tải dữ liệu.
3. **Chống bấm đúp (Double-click Prevention):** Khi bấm các nút "Xác nhận thanh toán" hoặc "Thêm vào giỏ", nút lập tức bị `disabled` và chuyển sang trạng thái xoay loading spinner để chống gửi trùng request.
4. **Không Scroll ngang (Zero Horizontal Scroll):** Mọi container đều có `max-w-full overflow-x-hidden`, bảng biểu phức tạp được bọc trong khung cuộn nội bộ có chỉ dẫn.

---

*Tài liệu được biên soạn bởi Senior UI/UX Specialist — Dự án BrewLite, Môn CNPM, SGU, Tháng 10/2026.*
