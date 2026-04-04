# 🔗 HƯỚNG DẪN KẾT NỐI BACKEND VÀ FRONTEND

## ✅ Những gì đã được cài đặt

### Backend
- ✅ Thêm `cors` package để cho phép frontend gọi API
- ✅ Cấu hình CORS trong `app.js`
- ✅ Backend chạy trên port **3000**

### Frontend
- ✅ Tạo `api/axiosConfig.js` - Cấu hình Axios client
- ✅ Tạo `api/endpoints.js` - Các hàm API cho tất cả endpoints
- ✅ Tạo `api/EXAMPLE_USAGE.js` - Hướng dẫn cách sử dụng API
- ✅ Cập nhật `.env` để trỏ đến backend

---

## 🚀 CÁCH CHẠY DỰ ÁN

### 1️⃣ Cài đặt dependencies (lần đầu tiên)

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2️⃣ Khởi động Services

**Terminal 1 - Khởi động Backend (port 3000):**
```bash
cd backend
npm start
```

**Terminal 2 - Khởi động Frontend (port 5173):**
```bash
cd frontend
npm run dev
```

Khi khởi động thành công, bạn sẽ thấy:
- Backend: `Listening on port 3000`
- Frontend: `Local: http://localhost:5173`

---

## 📝 CÁCH SỬ DỤNG API TRONG COMPONENT

### Ví dụ đơn giản:

```javascript
import { useEffect, useState } from 'react';
import * as api from './api/endpoints';

function MyComponent() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAuthors = async () => {
      try {
        setLoading(true);
        const response = await api.getAuthors();
        setAuthors(response.data.data);
      } catch (error) {
        console.error('Lỗi:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthors();
  }, []);

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      {authors.map(author => (
        <div key={author._id}>{author.name}</div>
      ))}
    </div>
  );
}
```

### Import API Functions:
```javascript
import * as api from './api/endpoints';

// Authors
await api.getAuthors();
await api.getAuthorById(id);
await api.createAuthor(data);
await api.updateAuthor(id, data);
await api.deleteAuthor(id);

// Books
await api.getBooks(params);
await api.getBookById(id);
await api.createBook(data);

// Categories
await api.getCategories();
await api.getCategoryById(id);

// Users
await api.getUsers();
await api.updateUser(id, data);

// Authentication
await api.login(email, password);
await api.register(data);

// Cart
await api.getCart();
await api.addToCart(data);
await api.removeFromCart(id);

// Orders
await api.getOrders();
await api.createOrder(data);
```

---

## 🔐 Xác thực (Authentication)

### Đăng nhập:
```javascript
import * as api from './api/endpoints';

const response = await api.login('user@example.com', 'password123');
// Token tự động lưu vào localStorage
// Header Authorization tự động được thêm vào mọi request
```

### Logout:
```javascript
import * as api from './api/endpoints';

await api.logout();
localStorage.removeItem('token'); // Xóa token nếu cần
```

**Token được tự động quản lý bởi `axiosConfig.js`:**
- Tự động thêm vào header của mỗi request
- Nếu status 401 (Unauthorized), tự động chuyển đến trang login

---

## ⚙️ Cấu hình Môi trường

File: `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api/v1
```

Để thay đổi cấu hình:
1. Mở file `.env` trong thư mục `frontend`
2. Sửa `VITE_API_URL` thành URL backend của bạn

---

## ✨ Một số lưu ý

### 1. Xử lý lỗi
```javascript
try {
  const response = await api.getAuthors();
  console.log(response.data);
} catch (error) {
  console.error('Status:', error.response?.status);
  console.error('Message:', error.response?.data?.message);
  console.error('Error:', error.message);
}
```

### 2. Request với params
```javascript
// Lấy sách với tìm kiếm
await api.getBooks({ 
  page: 1, 
  limit: 10, 
  sort: '-createdAt' 
});

// Tìm tác giả theo tên
await api.getAuthors('Tên tác giả');
```

### 3. Xóa token khi đăng xuất
```javascript
const handleLogout = async () => {
  await api.logout();
  localStorage.removeItem('token');
  // Chuyển hướng đến trang login
};
```

### 4. Kiểm tra kết nối
Mở DevTools (F12) → Network tab:
- Đăng nhập hoặc thực hiện một action
- Kiểm tra request gửi đi có `Authorization: Bearer <token>` không
- Check response có trả về dữ liệu đúng không

---

## 🐛 Troubleshooting

### ❌ "Cannot GET /api/v1/..."
**Nguyên nhân:** Backend không chạy hoặc route không tồn tại
**Giải pháp:** 
- Kiểm tra backend đã khởi động trên port 3000
- Kiểm tra endpoint path có đúng không

### ❌ "CORS error" hoặc "Access-Control-Allow-Origin"
**Nguyên nhân:** CORS chưa được cấu hình đúng
**Giải pháp:**
- Kiểm tra đã npm install cors trong backend
- Kiểm tra app.js có CORS middleware không

### ❌ "401 Unauthorized"
**Nguyên nhân:** Token hết hạn hoặc không có token
**Giải pháp:**
- Đăng nhập lại để lấy token mới
- Kiểm tra localStorage có token không

### ❌ "Cannot find module './api/endpoints'"
**Nguyên nhân:** File endpoints.js chưa được tạo
**Giải pháp:**
- Kiểm tra thư mục `frontend/src/api/` có endpoints.js không
- Nếu không, các file đã được tạo ở bước trước

---

## ✅ CHECKLIST TRƯỚC KHI CHẠY

- [ ] Cài npm packages: `npm install` ở cả backend và frontend
- [ ] Kiểm tra `.env` có URL backend đúng không
- [ ] MongoDB đã khởi động chưa (backend cần kết nối)
- [ ] Port 3000 (backend) và 5173 (frontend) không bị chiếm
- [ ] Đã cập nhật routes mới (nếu có) trong api/endpoints.js

---

## 📚 Tài liệu tham khảo

- **Axios Documentation:** https://axios-http.com/
- **CORS:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Vite:** https://vitejs.dev/
- **React Hooks:** https://react.dev/reference/react/hooks

---

**Chúc bạn thành công! 🎉**

Nếu gặp vấn đề, kiểm tra:
1. Console (F12) xem có error không
2. Network tab xem request/response
3. Backend logs xem lỗi gì
