"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [thongTin, setThongTin] = useState<any>(null);

  useEffect(() => {
    // Next.js đóng vai trò shipper, chạy sang Backend (cổng 3001) để xin dữ liệu
    fetch("http://localhost:3001/Hellomom/thong-tin")
      .then((res) => res.json())
      .then((data) => setThongTin(data))
      .catch((err) => console.log("Lỗi kết nối Backend:", err));
  }, []);

  return (
    <div style={{ padding: "50px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#0070f3" }}>Mặt tiền cửa hàng (Next.js)</h1>

      <div
        style={{
          border: "2px dashed #ccc",
          padding: "20px",
          marginTop: "20px",
          borderRadius: "10px",
        }}
      >
        <h3>Dữ liệu được chuyển từ nhà bếp (NestJS) sang:</h3>

        {thongTin ? (
          <ul style={{ fontSize: "18px", lineHeight: "1.8" }}>
            <li>
              <strong>Họ tên:</strong> {thongTin.hoTen}
            </li>
            <li>
              <strong>Nghề nghiệp:</strong> {thongTin.ngheNghiep}
            </li>
            <li>
              <strong>Lời nhắn:</strong> {thongTin.loiNhan}
            </li>
          </ul>
        ) : (
          <p style={{ color: "red" }}>
            Đang tải dữ liệu... (Hãy chắc chắn bạn đã bật Backend ở cổng 3001)
          </p>
        )}
      </div>
    </div>
  );
}
