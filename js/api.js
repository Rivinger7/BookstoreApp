// API Configuration và Template
class API {
    constructor() {
        // Microservices URLs
        this.AUTH_BASE_URL = 'https://localhost:7042/api';
        this.BOOK_BASE_URL = 'https://localhost:7209/api';
        this.BORROW_BASE_URL = 'https://localhost:7288/api';
        
        this.token = localStorage.getItem('authToken');
        const currentUserData = localStorage.getItem('currentUser');
        this.currentUser = currentUserData ? JSON.parse(currentUserData) : {};
    }

    // Helper method để tạo headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Helper method để xử lý response
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        let responseData = {};
        
        try {
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = { message: await response.text() };
            }
        } catch (error) {
            responseData = { message: 'Không thể đọc dữ liệu từ server' };
        }
        
        if (!response.ok) {
            // Xử lý các loại lỗi HTTP khác nhau
            let errorMessage = responseData.message || responseData.error || 'Có lỗi xảy ra';
            
            switch (response.status) {
                case 400:
                    errorMessage = responseData.message || 'Dữ liệu không hợp lệ';
                    break;
                case 401:
                    errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng';
                    break;
                case 403:
                    errorMessage = 'Bạn không có quyền thực hiện hành động này';
                    break;
                case 404:
                    errorMessage = 'Không tìm thấy dữ liệu';
                    break;
                case 409:
                    errorMessage = responseData.message || 'Dữ liệu đã tồn tại';
                    break;
                case 500:
                    errorMessage = 'Lỗi server, vui lòng thử lại sau';
                    break;
                default:
                    errorMessage = responseData.message || `Lỗi HTTP ${response.status}`;
            }
            
            throw new Error(errorMessage);
        }
        
        return responseData;
    }

    // AUTH API Templates
    async login(username, password) {
        try {
            const response = await fetch(`${this.AUTH_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(false),
                body: JSON.stringify({ username, password })
            });
            
            const data = await this.handleResponse(response);
            
            // Lưu token
            if (data.token) {
                this.token = data.token;
                localStorage.setItem('authToken', data.token);
                
                // Decode JWT token để lấy thông tin user
                const userInfo = this.decodeJWT(data.token);
                const user = {
                    id: userInfo.nameidentifier || userInfo.sub || username,
                    username: username,
                    role: userInfo.role || 'Borrower',
                    name: username, // Tạm thời dùng username làm name
                    email: username + '@example.com', // Tạm thời
                    joinDate: new Date().toLocaleDateString('vi-VN')
                };
                
                localStorage.setItem('currentUser', JSON.stringify(user));
                this.currentUser = user;
                
                // Thử lấy thông tin user đầy đủ từ server (nếu có API)
                try {
                    await this.getUserProfile();
                } catch (profileError) {
                    console.log('Could not fetch user profile:', profileError.message);
                    // Không làm gì, tiếp tục với thông tin từ JWT
                }
                
                // Trả về format cũ để tương thích
                return { user: this.currentUser, token: data.token, ...data };
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            // Format data để phù hợp với backend API
            const requestData = {
                username: userData.username,
                password: userData.password,
                confirmPassword: userData.confirmPassword,
                email: userData.email,
                fullName: userData.fullName
            };

            const response = await fetch(`${this.AUTH_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: this.getHeaders(false),
                body: JSON.stringify(requestData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    logout() {
        // Logout chỉ ở frontend - xóa token và user info
        this.token = null;
        this.currentUser = {};
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        console.log('User logged out successfully');
    }

    // BOOKS API Templates
    async getBooks(params = {}) {
        try {
            // Chỉ gửi page và pageSize lên backend
            const apiParams = {};
            
            if (params.page) apiParams.page = params.page;
            if (params.pageSize) apiParams.pageSize = params.pageSize;
            
            const queryString = new URLSearchParams(apiParams).toString();
            const url = `${this.BOOK_BASE_URL}/books${queryString ? '?' + queryString : ''}`;
            
            console.log('Calling API:', url);
            console.log('Params sent:', apiParams);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(false)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get books error:', error);
            throw error;
        }
    }

    async getBookById(id) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/books/${id}`, {
                method: 'GET',
                headers: this.getHeaders(false)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get book error:', error);
            throw error;
        }
    }

    async createBook(bookData) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/books`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(bookData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Create book error:', error);
            throw error;
        }
    }

    async updateBook(id, bookData) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/books/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(bookData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Update book error:', error);
            throw error;
        }
    }

    async deleteBook(id) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/books/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Delete book error:', error);
            throw error;
        }
    }

    // CATEGORIES API Templates
    async getCategories() {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/categories`, {
                method: 'GET',
                headers: this.getHeaders(false)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get categories error:', error);
            throw error;
        }
    }

    async getCategoryById(categoryId) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/categories/${categoryId}`, {
                method: 'GET',
                headers: this.getHeaders(false)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get category by ID error:', error);
            throw error;
        }
    }

    async createCategory(categoryData) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/categories`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(categoryData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Create category error:', error);
            throw error;
        }
    }

    async updateCategory(categoryId, categoryData) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/categories/${categoryId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(categoryData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Update category error:', error);
            throw error;
        }
    }

    async deleteCategory(categoryId) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/categories/${categoryId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Delete category error:', error);
            throw error;
        }
    }

    // USER SEARCH API
    async searchUserByUsernameOrEmail(usernameOrEmail) {
        try {
            const response = await fetch(`${this.AUTH_BASE_URL}/user/${encodeURIComponent(usernameOrEmail)}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Search user error:', error);
            throw error;
        }
    }

    // BOOK SEARCH API
    async searchBooks(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.BOOK_BASE_URL}/books${queryString ? '?' + queryString : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(false)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Search books error:', error);
            throw error;
        }
    }

    // CREATE BORROWING API
    async createBorrowing(borrowData) {
        try {
            const response = await fetch(`${this.BORROW_BASE_URL}/borrow`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(borrowData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Create borrowing error:', error);
            throw error;
        }
    }

    // BORROWING API Templates


    async returnBook(borrowingId) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/borrowings/${borrowingId}/return`, {
                method: 'POST',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Return book error:', error);
            throw error;
        }
    }

    async getBorrowings(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.BOOK_BASE_URL}/borrowings${queryString ? '?' + queryString : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get borrowings error:', error);
            throw error;
        }
    }

    async getUserBorrowings(userId = null) {
        try {
            const id = userId || this.currentUser.id || 'me';
            const response = await fetch(`${this.BOOK_BASE_URL}/users/${id}/borrowings`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get user borrowings error:', error);
            throw error;
        }
    }



    async searchUsers(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.AUTH_BASE_URL}/users/search${queryString ? '?' + queryString : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Search users error:', error);
            throw error;
        }
    }

    // USERS API Templates (Admin only)
    async getUsers(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.AUTH_BASE_URL}/users${queryString ? '?' + queryString : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }

    // async getUserProfile() {
    //     try {
    //         const response = await fetch(`${this.AUTH_BASE_URL}/auth/profile`, {
    //             method: 'GET',
    //             headers: this.getHeaders()
    //         });
            
    //         const userData = await this.handleResponse(response);
            
    //         // Cập nhật currentUser với thông tin từ server
    //         if (userData) {
    //             this.currentUser = { ...this.currentUser, ...userData };
    //             localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    //         }
            
    //         return userData;
    //     } catch (error) {
    //         console.error('Get user profile error:', error);
    //         throw error;
    //     }
    // }

    async updateUserStatus(userId, status) {
        try {
            const response = await fetch(`${this.AUTH_BASE_URL}/users/${userId}/status`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ status })
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Update user status error:', error);
            throw error;
        }
    }

    // DASHBOARD/REPORTS API Templates
    async getDashboardStats() {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/dashboard/stats`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            throw error;
        }
    }

    async getRecentActivities(limit = 10) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/dashboard/activities?limit=${limit}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get recent activities error:', error);
            throw error;
        }
    }

    async getBorrowingReport(fromDate, toDate) {
        try {
            const params = new URLSearchParams({
                fromDate: fromDate,
                toDate: toDate
            });
            
            const response = await fetch(`${this.BOOK_BASE_URL}/reports/borrowings?${params}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get borrowing report error:', error);
            throw error;
        }
    }

    async getPopularBooks(limit = 10) {
        try {
            const response = await fetch(`${this.BOOK_BASE_URL}/reports/popular-books?limit=${limit}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get popular books error:', error);
            throw error;
        }
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token && !!this.currentUser.id;
    }

    isAdmin() {
        return this.currentUser.role === 'BookStoreOwner' || 
               this.currentUser.role === 'admin' || 
               this.currentUser.role === 'Admin';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Decode JWT token để lấy thông tin user
    decodeJWT(token) {
        try {
            // JWT có 3 phần cách nhau bởi dấu chấm
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            console.log('JWT Payload:', payload);
            
            // Map các claim names chuẩn
            return {
                nameidentifier: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
                role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
                exp: payload.exp,
                iss: payload.iss,
                aud: payload.aud,
                // Các claim khác
                ...payload
            };
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return {};
        }
    }
}

// Tạo instance global
const api = new API();

// Debug log
console.log('API initialized:', api);
console.log('Auth Base URL:', api.AUTH_BASE_URL);
console.log('Book Base URL:', api.BOOK_BASE_URL);
console.log('Token:', api.token);
console.log('Current user:', api.currentUser);

// Export để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, api };
}
