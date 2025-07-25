# BookLend - Website Mượn Trả Sách Online

## Mô tả
BookLend là một website hiện đại cho phép người dùng mượn và trả sách online. Website bao gồm:

- **Giao diện người dùng**: Tìm kiếm, xem thông tin và mượn sách
- **Hệ thống admin**: Quản lý sách, người dùng, và các giao dịch mượn trả
- **Hệ thống xác thực**: Đăng ký, đăng nhập với phân quyền

## Tính năng chính

### Người dùng thường
- Xem danh sách sách với bộ lọc theo thể loại
- Tìm kiếm sách theo tên hoặc tác giả
- Xem chi tiết thông tin sách
- Mượn sách (cần đăng nhập)
- Đăng ký tài khoản mới
- Đăng nhập/Đăng xuất

### Admin
- Dashboard với thống kê tổng quan
- Quản lý danh sách sách (thêm, sửa, xóa)
- Quản lý người dùng (xem, khóa/mở khóa)
- Quản lý giao dịch mượn trả
- Báo cáo thống kê

## Cấu trúc dự án

```
BookstoreApp/
├── index.html              # Trang chính
├── admin.html              # Trang quản lý admin
├── css/
│   ├── style.css           # CSS chính
│   └── admin.css           # CSS cho admin
└── js/
    ├── api.js              # Template API calls
    ├── auth.js             # Xử lý đăng nhập/đăng ký
    ├── books.js            # Quản lý sách
    ├── main.js             # Chức năng chung
    └── admin.js            # Quản lý admin
```

## Cách sử dụng

### 1. Mở website
- Mở file `index.html` trong trình duyệt
- Hoặc sử dụng Live Server trong VS Code

### 2. Tài khoản demo
**Admin:**
- Email: `admin@booklend.com`
- Password: `123456`

**User thường:**
- Email: `user@booklend.com` 
- Password: `123456`

### 3. Chức năng hiện có
- ✅ Giao diện responsive đầy đủ
- ✅ Hệ thống đăng nhập/đăng ký
- ✅ Hiển thị danh sách sách với filter
- ✅ Tìm kiếm sách
- ✅ Chi tiết sách
- ✅ Dashboard admin với thống kê
- ✅ Quản lý sách, người dùng, mượn trả
- ✅ Template API sẵn sàng kết nối backend

## Kết nối Backend

### API Templates đã chuẩn bị trong `js/api.js`:

1. **Authentication**
   - `POST /api/auth/login`
   - `POST /api/auth/register`
   - `POST /api/auth/logout`

2. **Books**
   - `GET /api/books` - Lấy danh sách sách
   - `GET /api/books/:id` - Lấy chi tiết sách
   - `POST /api/books` - Thêm sách mới
   - `PUT /api/books/:id` - Cập nhật sách
   - `DELETE /api/books/:id` - Xóa sách

3. **Borrowings**
   - `GET /api/borrowings` - Lấy danh sách mượn trả
   - `POST /api/borrowings` - Mượn sách
   - `POST /api/borrowings/:id/return` - Trả sách

4. **Users (Admin)**
   - `GET /api/users` - Lấy danh sách người dùng
   - `PUT /api/users/:id/status` - Cập nhật trạng thái user

5. **Dashboard/Reports**
   - `GET /api/dashboard/stats` - Thống kê dashboard
   - `GET /api/dashboard/activities` - Hoạt động gần đây
   - `GET /api/reports/borrowings` - Báo cáo mượn trả
   - `GET /api/reports/popular-books` - Sách phổ biến

### Cách kết nối:

1. **Thay đổi BASE_URL trong `js/api.js`:**
   ```javascript
   this.BASE_URL = 'http://localhost:5000/api'; // URL backend của bạn
   ```

2. **Uncomment các API calls thực và comment/xóa mock data:**
   ```javascript
   // Thay vì dùng mock:
   // const result = await this.getMockBooks();
   
   // Sử dụng API thực:
   const result = await api.getBooks(params);
   ```

3. **Cấu hình CORS trong backend** để cho phép frontend truy cập

## Công nghệ sử dụng

- **HTML5**: Cấu trúc semantic
- **CSS3**: 
  - CSS Grid & Flexbox
  - CSS Variables
  - Responsive design
  - Animations
- **Vanilla JavaScript**: 
  - ES6+ features
  - Fetch API
  - Local Storage
  - Class-based architecture
- **Font Awesome**: Icons
- **Google Fonts**: Typography

## Responsive Design

Website được thiết kế responsive cho các thiết bị:
- Desktop (1200px+)
- Tablet (768px - 1199px)  
- Mobile (< 768px)

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Hướng phát triển

### Tính năng có thể thêm:
1. **Người dùng:**
   - Lịch sử mượn sách
   - Đánh giá và bình luận sách
   - Wishlist/Yêu thích
   - Thông báo khi sách có sẵn
   - Gia hạn mượn sách

2. **Admin:**
   - Quản lý thể loại sách
   - Quản lý phí phạt
   - Export dữ liệu Excel/PDF
   - Thông báo hệ thống
   - Backup dữ liệu

3. **Hệ thống:**
   - Tích hợp thanh toán
   - Email notifications
   - PWA (Progressive Web App)
   - Dark mode
   - Multi-language

### Backend frameworks gợi ý:
- **Node.js**: Express.js + MongoDB/PostgreSQL
- **ASP.NET Core**: Entity Framework + SQL Server
- **Python**: Django/FastAPI + PostgreSQL
- **Java**: Spring Boot + MySQL

## Lưu ý

- Hiện tại website sử dụng mock data để demo
- Cần kết nối backend thực để có đầy đủ chức năng
- Tất cả template API đã được chuẩn bị sẵn
- Authentication sử dụng JWT token (localStorage)
- Responsive design đã được test trên nhiều thiết bị

## Liên hệ

Nếu cần hỗ trợ hoặc có thắc mắc, vui lòng liên hệ qua issues hoặc email.

---

© 2025 BookLend. All rights reserved.
