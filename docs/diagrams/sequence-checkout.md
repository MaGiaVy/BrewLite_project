# Tài Liệu Biểu Đồ Trình Tự Đặt Hàng & Thanh Toán 2 Pha (Checkout & Payment Sequence Diagram)

Tài liệu này mô tả chi tiết kiến trúc quy trình đặt hàng và thanh toán (Checkout & Payment) của hệ thống **BrewLite**. Toàn bộ thiết kế được xây dựng đồng bộ với mã nguồn thực tế tại `apps/api/src/orders/orders.service.ts`, `apps/api/src/payments/payments.service.ts` và `apps/api/src/jobs/expire-orders.job.ts`. Biểu đồ nguồn tương ứng được lưu tại [`sequence-checkout.puml`](sequence-checkout.puml).

---

## 1. Kiến Trúc Thanh Toán 2 Pha Riêng Biệt (Two-Phase Architecture)

Để đảm bảo tính nhất quán dữ liệu kho hàng (BOM), ngăn chặn tranh chấp tài nguyên đồng thời và chống giả mạo số tiền (Anti-tampering / IDOR), hệ thống BrewLite tách biệt tuyệt đối quy trình mua hàng thành **2 PHA RIÊNG BIỆT**:

```
[Khách Hàng] 
     │
     ├──(Pha 1: POST /orders)────► [Tạo đơn PENDING, Trừ/Giữ kho BOM với Optimistic Lock]
     │                                     │
     │                          (Hết hạn 15 phút -> Tự hủy & hoàn kho)
     │                                     │
     └──(Pha 2: POST /payments)───► [Gửi Idempotency-Key, Chuyển sang PAID, Tích Hạt Vàng]
```

---

## 2. Chi Tiết Pha 1: Tạo Đơn Hàng & Giữ Kho BOM (`POST /orders`)

### 2.1. Hợp đồng dữ liệu (API Contract)
- **Endpoint**: `POST /orders`
- **Header**: `Authorization: Bearer <JWT>`
- **Body (`CreateOrderDto`)**:
  ```json
  {
    "items": [
      {
        "productId": 1,
        "productName": "Cà Phê Muối Hoàng Gia",
        "size": "L",
        "toppings": ["Trân Châu Trắng"],
        "quantity": 2,
        "unitPrice": 45000
      }
    ],
    "discountCode": "BREW10"
  }
  ```

### 2.2. Trình tự xử lý nghiệp vụ
1. **Tính tổng phụ (Subtotal)**:
   - Server tự tính toán `rawSubtotal = sum(unitPrice * quantity)`. Tuyệt đối không nhận subtotal từ client.
2. **Xác thực và áp dụng mã giảm giá (Voucher / Discount Code)**:
   - Tra cứu trong cơ sở dữ liệu bảng `DiscountCode` hoặc voucher cá nhân `UserVoucher`.
   - Kiểm tra trạng thái kích hoạt (`isActive`), điều kiện đơn tối thiểu (`minOrderAmount`), và giới hạn giảm tối đa (`maxDiscountAmount`).
   - Nếu mã không tồn tại hoặc đơn không đủ giá trị tối thiểu -> Ném `BadRequestException(400)`.
   - Áp dụng **0% VAT** và tính tổng thanh toán cuối cùng:
     ```ts
     const afterDiscount = Math.max(0, rawSubtotal - discountAmount);
     const totalAmount = afterDiscount; // 0% VAT
     ```
3. **Thực thi trong Prisma Transaction (`$transaction`)**:
   - **Tính toán BOM (Bill of Materials)**: Hàm `computeRequiredIngredients` truy xuất công thức món (`Recipe`) theo từng size sản phẩm (`M`, `L`, hoặc `ALL` cho bánh ngọt) và công thức topping (`ToppingRecipe`) để tính tổng định lượng từng nguyên vật liệu tiêu hao.
   - **Kiểm tra tồn kho & Khóa lạc quan (Optimistic Locking)**:
     - Với các nguyên liệu bắt buộc bán (`isRequiredForSale = true`): nếu `currentIng.stock < requiredAmount`, ném `BadRequestException(400)` báo hết nguyên liệu.
     - Thực hiện trừ kho kèm điều kiện phiên bản:
       ```ts
       const updateRes = await tx.ingredient.updateMany({
         where: {
           id: currentIng.id,
           version: currentIng.version,
           stock: { gte: reqIng.requiredAmount },
         },
         data: {
           stock: { decrement: reqIng.requiredAmount },
           version: { increment: 1 },
         },
       });
       if (updateRes.count === 0) {
         throw new ConflictException('Xung đột đồng thời (Optimistic Lock) khi trừ kho nguyên vật liệu. Vui lòng thử lại.');
       }
       ```
   - **Tạo bản ghi đơn hàng**: Tạo đơn hàng với trạng thái mặc định **`PENDING`** và `version: 0`. Lưu ý: Không trừ lượt voucher của người dùng tại thời điểm này để tránh thất thoát voucher nếu đơn không thanh toán thành công.
4. **Phản hồi**: Trả về `orderId`, trạng thái `PENDING`, tổng tiền thực tế cần thanh toán. Đơn hàng giữ tồn kho BOM tối đa trong vòng **15 phút**.

---

## 3. Chi Tiết Pha 2: Thanh Toán Đơn Hàng (`POST /payments` hoặc ZaloPay Gateway)

### 3.1. Phương Án A: Cổng Thanh Toán Demo / Mock Gateway (`POST /payments`)

- **Endpoint**: `POST /payments`
- **Headers**:
  - `Authorization: Bearer <JWT>`
  - `Idempotency-Key: <UUID-v4>` (Khóa chống trùng lặp thanh toán)
- **Body (`CreatePaymentDto`)**:
  ```json
  {
    "orderId": 105,
    "method": "EWALLET",
    "simulateFailure": false
  }
  ```
  *(Trong đó `method` thuộc enum `PaymentMethod`: `EWALLET` hoặc `BANK_CARD`.)*

#### Quy trình xử lý tại Backend:
1. **Kiểm tra Idempotency-Key**:
   - Tra cứu bản ghi `Payment` theo `idempotencyKey`.
   - Nếu khóa đã tồn tại và giao dịch trước có trạng thái **`SUCCESS`**: Trả về ngay kết quả giao dịch cũ với cờ `isIdempotent: true` (Không trừ tiền lần 2, không cộng điểm lần 2).
   - Nếu giao dịch trước bị `FAILED`, hệ thống cho phép người dùng thử lại.
2. **Xác thực quyền sở hữu & Tính hợp lệ của đơn hàng**:
   - Tra cứu đơn hàng theo `orderId`.
   - **Chống IDOR**: Kiểm tra `order.userId === req.user.userId`. Ném `ForbiddenException(403)` nếu truy cập trái phép.
   - **Kiểm tra thời hạn thanh toán**: Đơn hàng phải ở trạng thái `PENDING` hoặc `PAYMENT_FAILED` và thời gian khởi tạo không quá **15 phút (900.000 ms)**. Nếu quá hạn, hệ thống tự động hủy hoàn kho và ném `BadRequestException`.
   - **Bảo mật giá tiền**: Số tiền thanh toán lấy trực tiếp từ `order.totalAmount` trong cơ sở dữ liệu.
   - **State Machine Guard**: Kiểm tra chuyển trạng thái hợp lệ thông qua `assertTransition(order.status, 'PAID')`.
3. **Thực thi trong Prisma Transaction (`$transaction`)**:
   - Gọi `mockGatewayService.charge(...)` (endpoint `POST /payments` trả về HTTP `201 Created`; bị chặn `403 Forbidden` ở môi trường production nếu `ALLOW_MOCK_PAYMENT=false`).
   - **Nếu thất bại**: Cập nhật đơn hàng sang `PAYMENT_FAILED`, tạo bản ghi Payment trạng thái `FAILED`, trả về HTTP `201 { success: false, status: 'PAYMENT_FAILED' }` và **tiếp tục giữ nguyên kho BOM** để khách thử lại.
   - **Nếu thành công**:
     - Cập nhật đơn hàng sang **`PAID`** bằng Optimistic Locking:
       ```ts
       const successResult = await tx.order.updateMany({
         where: { id: currentOrder.id, version: currentOrder.version },
         data: { status: OrderStatus.PAID, version: { increment: 1 } },
       });
       if (successResult.count === 0) {
         throw new ConflictException('Đơn hàng đã bị thay đổi bởi một request khác.');
       }
       ```
     - Tạo bản ghi `Payment` với trạng thái `SUCCESS` và lưu `idempotencyKey`.
     - **Tích điểm Hạt Vàng (BrewLite Club)**: Tỷ lệ quy đổi chuẩn **1.000 VNĐ = 1 điểm**:
       ```ts
       const pointsEarned = Math.floor(paymentAmount / 1000);
       if (pointsEarned > 0 && currentOrder.userId) {
         await tx.user.update({
           where: { id: currentOrder.userId },
           data: { loyaltyPoints: { increment: pointsEarned } },
         });
       }
       ```
     - Trả về kết quả thanh toán thành công kèm số điểm Hạt Vàng vừa nhận.

---

### 3.2. Phương Án B: Tích Hợp Cổng ZaloPay Sandbox

1. **Khởi tạo giao dịch (`POST /payments/zalopay/create`)**:
   - Backend gọi API ZaloPay Sandbox `v2/create` kèm chữ ký HMAC SHA256 Key 1.
   - Trả về liên kết thanh toán (`orderUrl`), mã QR và mã giao dịch ứng dụng (`appTransId`).
2. **Xử lý IPN Webhook (`POST /payments/zalopay/callback`)**:
   - Máy chủ ZaloPay bắn thông báo thanh toán về server BrewLite.
   - Backend giải mã và kiểm tra tính toàn vẹn qua chữ ký **MAC Key 2**:
     ```ts
     const isValid = this.zaloPayService.verifyCallback(body.data, body.mac);
     if (!isValid) return { return_code: -1, return_message: 'mac not equal' };
     ```
   - Trích xuất `orderId`, kiểm tra nếu đơn đã `PAID` thì trả về ngay `{ return_code: 1, return_message: 'success' }` (Idempotent Callback).
   - Nếu chưa thanh toán: Mở Transaction cập nhật trạng thái đơn thành `PAID`, tạo bản ghi `Payment` (với key `ZALOPAY_${zp_trans_id}`), và cộng điểm Hạt Vàng cho khách.
3. **Cơ chế Polling dự phòng từ Frontend (`GET /payments/zalopay/status/:orderId`)**:
   - Giao diện Client thực hiện polling định kỳ mỗi 3 giây nhằm xử lý trường hợp Webhook bị trễ hoặc khi đang chạy môi trường phát triển cục bộ (Localhost).

---

## 4. Cơ Chế Tự Động Hoàn Kho & Timeout 15 Phút (Auto-Expiration)

Hệ thống BrewLite thiết lập cơ chế giải phóng tồn kho tự động nhằm ngăn chặn tình trạng khách đặt giữ chỗ đơn hàng nhưng không thanh toán làm cạn kiệt nguyên liệu của cửa hàng.

- **Cơ chế kích hoạt**: Tác vụ `ExpireOrdersJob` (`apps/api/src/jobs/expire-orders.job.ts`) chạy định kỳ mỗi **1 phút** bằng `@Cron('*/1 * * * *')`, gọi `expirePendingOrders(..., { timeoutMinutes: 15 })`.
- **Thời hạn TTL (Time-To-Live)**: **15 phút (900.000 ms)** áp dụng cho đơn ở trạng thái `PENDING` hoặc `PAYMENT_FAILED`.
- **Trình tự hoàn kho trong Transaction**:
  1. Quét các đơn hàng `status IN ('PENDING', 'PAYMENT_FAILED')` có `createdAt <= now - 15 phút`.
  2. Với mỗi đơn hết hạn, gọi `computeRequiredIngredients(order.items)` (qua `refundOrderResources`) để xác định đúng số lượng nguyên vật liệu và topping đã giữ.
  3. Hoàn trả 100% nguyên liệu vào kho:
     ```ts
     await tx.ingredient.update({
       where: { id: reqIng.ingredientId },
       data: {
         stock: { increment: reqIng.requiredAmount },
         version: { increment: 1 },
       },
     });
     ```
  4. Cập nhật trạng thái đơn hàng sang **`CANCELLED`** (tăng `version + 1`).
  5. Ghi log cảnh báo: `[Auto-Expire 15m] Đơn hàng #id đã tự động hủy do quá 15 phút chưa thanh toán. Đã hoàn trả nguyên liệu vào kho.`

---

## 5. Luồng Hủy Đơn Hàng Đã Thanh Toán (`PAID`) & Thu Hồi Điểm Thưởng

Trong trường hợp đơn hàng đã ở trạng thái `PAID` và được nhân viên hủy tại màn hình Barista KDS hoặc khách hàng yêu cầu hủy đơn hợp lệ (`PATCH /orders/:id/status` với `status: CANCELLED`):

1. **State Machine Guard**: Xác thực bước chuyển trạng thái từ `PAID` -> `CANCELLED`.
2. **Hoàn kho nguyên vật liệu BOM**: Tính toán lại định lượng món và tăng lại `stock` của các `Ingredient` tương ứng (đồng thời tăng `version` để chống stale data).
3. **Thu hồi điểm Hạt Vàng**:
   ```ts
   const pointsToRevoke = Math.floor(order.totalAmount / 1000);
   if (pointsToRevoke > 0) {
     await tx.user.update({
       where: { id: order.userId },
       data: { loyaltyPoints: { decrement: pointsToRevoke } },
     });
   }
   ```
4. **Hoàn trả mã giảm giá cá nhân**: Nếu đơn hàng trước đó đã trừ số lượng mã cá nhân của khách (`voucherDeducted == true`), hệ thống tự động tăng lại `quantity` cho bản ghi `userVoucher`.
5. Đơn hàng chuyển sang trạng thái `CANCELLED` hoàn tất.
