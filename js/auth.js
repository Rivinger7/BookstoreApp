// Authentication Management
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showAlert('Vui lòng nhập đầy đủ thông tin', 'error');
            return;
        }

        try {
            this.showLoading('Đang đăng nhập...');
            
            // Sử dụng API thực tế
            const result = await api.login(email, password);
            console.log('Login result:', result);
            
            this.showAlert('Đăng nhập thành công!', 'success');
            this.closeModal('loginModal');
            this.updateAuthUI();
            
            // Redirect to admin if user is admin
            if (result.user && (result.user.role === 'admin' || result.user.role === 'Admin' || result.user.role === 'BookStoreOwner')) {
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            }
            
        } catch (error) {
            this.showAlert(error.message || 'Đăng nhập thất bại', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!username || !name || !email || !password || !confirmPassword) {
            this.showAlert('Vui lòng nhập đầy đủ thông tin', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showAlert('Mật khẩu xác nhận không khớp', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showAlert('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showAlert('Email không hợp lệ', 'error');
            return;
        }

        try {
            this.showLoading('Đang đăng ký...');
            
            // Tạo object userData theo format backend yêu cầu
            const userData = {
                username: username,
                password: password,
                confirmPassword: confirmPassword,
                email: email,
                fullName: name
            };
            
            // Sử dụng API thực tế
            const result = await api.register(userData);
            
            this.showAlert('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 'success');
            this.closeModal('registerModal');
            
            // Clear form
            document.getElementById('registerForm').reset();
            
            // Chuyển sang form đăng nhập
            setTimeout(() => {
                this.showLoginModal();
            }, 1000);
            
        } catch (error) {
            this.showAlert(error.message || 'Đăng ký thất bại', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async logout() {
        try {
            // Sử dụng API logout (chỉ xử lý frontend)
            api.logout();
            
            this.showAlert('Đăng xuất thành công', 'success');
            this.updateAuthUI();
            
            // Redirect to home if on admin page
            if (window.location.pathname.includes('admin.html')) {
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showAlert('Có lỗi xảy ra khi đăng xuất', 'error');
        }
    }

    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const currentUserData = localStorage.getItem('currentUser');
        const user = currentUserData ? JSON.parse(currentUserData) : {};
        
        if (token && user.id) {
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        const currentUserData = localStorage.getItem('currentUser');
        const user = currentUserData ? JSON.parse(currentUserData) : {};
        const isAuthenticated = !!localStorage.getItem('authToken') && !!user.id;
        
        const authButtons = document.querySelector('.nav-auth .btn');
        const userProfile = document.getElementById('userProfile');
        const userName = document.getElementById('userName');
        const adminLink = document.getElementById('adminLink');
        
        if (isAuthenticated) {
            // Hide auth buttons, show user profile
            if (authButtons && authButtons.parentElement) {
                authButtons.parentElement.querySelectorAll('.btn').forEach(btn => {
                    btn.style.display = 'none';
                });
            }
            
            if (userProfile) {
                userProfile.style.display = 'flex';
            }
            
            if (userName) {
                userName.textContent = user.name || user.email;
            }
            
            // Show admin link if user is admin
            if (adminLink && user.role === 'admin') {
                adminLink.style.display = 'block';
            }
            
        } else {
            // Show auth buttons, hide user profile
            if (authButtons && authButtons.parentElement) {
                authButtons.parentElement.querySelectorAll('.btn').forEach(btn => {
                    btn.style.display = 'inline-flex';
                });
            }
            
            if (userProfile) {
                userProfile.style.display = 'none';
            }
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'block';
        }
    }

    showRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'block';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    switchToRegister() {
        this.closeModal('loginModal');
        this.showRegisterModal();
    }

    switchToLogin() {
        this.closeModal('registerModal');
        this.showLoginModal();
    }    showAlert(message, type = 'info') {
        this.showToast(message, type);
    }

    showToast(message, type = 'info', title = null) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Icon map
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        // Default titles
        const titles = {
            success: 'Thành công',
            error: 'Lỗi',
            warning: 'Cảnh báo',
            info: 'Thông tin'
        };

        toast.innerHTML = `
            <i class="toast-icon ${icons[type] || icons.info}"></i>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : `<div class="toast-title">${titles[type] || titles.info}</div>`}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to container
        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }

    showLoading(message = 'Đang xử lý...') {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.textContent = message;
            loading.style.display = 'block';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Initialize sample borrowed books data
function initializeSampleBorrowedBooks() {
    const existingData = localStorage.getItem('borrowedBooks');
    if (!existingData) {
        const sampleBorrowedBooks = [
            {
                id: 1,
                userId: 'user@booklend.com',
                title: 'Lập trình JavaScript cơ bản',
                author: 'Nguyễn Văn A',
                image: 'https://via.placeholder.com/300x400?text=JS+Book',
                borrowDate: '2025-01-15',
                dueDate: '2025-02-15',
                returnDate: null,
                status: 'borrowed'
            },
            {
                id: 2,
                userId: 'user@booklend.com',
                title: 'HTML & CSS cho người mới bắt đầu',
                author: 'Trần Thị B',
                image: 'https://via.placeholder.com/300x400?text=HTML+CSS',
                borrowDate: '2025-01-10',
                dueDate: '2025-02-10',
                returnDate: '2025-01-25',
                status: 'returned'
            },
            {
                id: 3,
                userId: 'user@booklend.com',
                title: 'Python Programming',
                author: 'Lê Văn C',
                image: 'https://via.placeholder.com/300x400?text=Python',
                borrowDate: '2024-12-20',
                dueDate: '2025-01-20',
                returnDate: null,
                status: 'overdue'
            },
            {
                id: 4,
                userId: 'admin@booklend.com',
                title: 'React.js Advanced',
                author: 'Phạm Thị D',
                image: 'https://via.placeholder.com/300x400?text=React',
                borrowDate: '2025-01-20',
                dueDate: '2025-02-20',
                returnDate: null,
                status: 'borrowed'
            },
            {
                id: 5,
                userId: 'user@booklend.com',
                title: 'Node.js Backend Development',
                author: 'Hoàng Văn E',
                image: 'https://via.placeholder.com/300x400?text=NodeJS',
                borrowDate: '2025-01-01',
                dueDate: '2025-01-15',
                returnDate: null,
                status: 'overdue'
            },
            {
                id: 6,
                userId: 'admin@booklend.com',
                title: 'Database Design Principles',
                author: 'Nguyễn Thị F',
                image: 'https://via.placeholder.com/300x400?text=Database',
                borrowDate: '2025-01-05',
                dueDate: '2025-02-05',
                returnDate: '2025-01-30',
                status: 'returned'
            }
        ];
        
        localStorage.setItem('borrowedBooks', JSON.stringify(sampleBorrowedBooks));
    }
}

// Initialize sample data when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSampleBorrowedBooks();
});

// Global functions for HTML onclick events
function showLoginModal() {
    window.authManager.showLoginModal();
}

function showRegisterModal() {
    window.authManager.showRegisterModal();
}

function closeModal(modalId) {
    window.authManager.closeModal(modalId);
}

function switchToLogin() {
    window.authManager.switchToLogin();
}

function switchToRegister() {
    window.authManager.switchToRegister();
}

function logout() {
    window.authManager.logout();
}

function showProfile() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.authManager.showAlert('Vui lòng đăng nhập để xem hồ sơ', 'warning');
        return;
    }

    const user = JSON.parse(currentUser);
    
    try {
        // Populate profile form
        const nameField = document.getElementById('profileName');
        const emailField = document.getElementById('profileEmail');
        const joinDateField = document.getElementById('profileJoinDate');
        const booksCountField = document.getElementById('profileBooksCount');
        
        if (!nameField || !emailField || !joinDateField || !booksCountField) {
            console.error('Profile form fields not found');
            window.authManager.showAlert('Lỗi hiển thị form hồ sơ', 'error');
            return;
        }
        
        nameField.value = user.name || '';
        emailField.value = user.email || '';
        
        // Format join date
        const joinDate = user.joinDate || new Date().toLocaleDateString('vi-VN');
        joinDateField.value = joinDate;
        
        // Get borrowed books count and statistics
        const borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks') || '[]');
        const userBorrowedBooks = borrowedBooks.filter(book => book.userId === user.email);
        
        // Calculate statistics
        const totalBorrowed = userBorrowedBooks.length;
        const currentlyBorrowed = userBorrowedBooks.filter(book => book.status === 'borrowed').length;
        const returned = userBorrowedBooks.filter(book => book.status === 'returned').length;
        const overdue = userBorrowedBooks.filter(book => book.status === 'overdue').length;
        
        booksCountField.value = `${totalBorrowed} (${currentlyBorrowed} đang mượn, ${returned} đã trả, ${overdue} quá hạn)`;
        
        showModal('profileModal');
    } catch (error) {
        console.error('Error showing profile:', error);
        window.authManager.showAlert('Có lỗi khi hiển thị hồ sơ', 'error');
    }
}

function showMyBooks() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.authManager.showAlert('Vui lòng đăng nhập để xem sách đã mượn', 'warning');
        return;
    }

    const user = JSON.parse(currentUser);
    
    try {
        loadMyBooks(user.email); // Use email as userId
        showModal('myBooksModal');
    } catch (error) {
        console.error('Error showing my books:', error);
        window.authManager.showAlert('Có lỗi khi hiển thị sách đã mượn', 'error');
    }
}

function loadMyBooks(userId) {
    const borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks') || '[]');
    const userBooks = borrowedBooks.filter(book => book.userId === userId);
    
    // Separate books by status
    const borrowed = userBooks.filter(book => book.status === 'borrowed');
    const returned = userBooks.filter(book => book.status === 'returned');
    const overdue = userBooks.filter(book => book.status === 'overdue');
    
    // Render books in respective tabs
    renderBooksList('borrowedBooksList', borrowed);
    renderBooksList('returnedBooksList', returned);
    renderBooksList('overdueBooksList', overdue);
    
    // Update tab titles with counts
    updateTabCounts(borrowed.length, returned.length, overdue.length);
}

function updateTabCounts(borrowedCount, returnedCount, overdueCount) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        const tabType = tab.dataset.tab;
        const originalText = tab.textContent.split(' (')[0]; // Remove existing count
        
        let count = 0;
        if (tabType === 'borrowed') count = borrowedCount;
        else if (tabType === 'returned') count = returnedCount;
        else if (tabType === 'overdue') count = overdueCount;
        
        tab.textContent = `${originalText} (${count})`;
    });
}

function renderBooksList(containerId, books) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open" style="font-size: 48px; color: var(--text-light); margin-bottom: 16px;"></i>
                <p style="color: var(--text-light); text-align: center;">Không có sách nào</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = books.map(book => {
        // Calculate days remaining or overdue
        const today = new Date();
        const dueDate = new Date(book.dueDate);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let dueDateInfo = '';
        if (book.status === 'borrowed') {
            if (diffDays > 0) {
                dueDateInfo = `<div class="due-info due-ok">Còn ${diffDays} ngày</div>`;
            } else if (diffDays === 0) {
                dueDateInfo = `<div class="due-info due-today">Hết hạn hôm nay</div>`;
            } else {
                dueDateInfo = `<div class="due-info due-overdue">Quá hạn ${Math.abs(diffDays)} ngày</div>`;
            }
        }
        
        return `
            <div class="book-item">
                <div class="book-item-image">
                    <img src="${book.image || 'https://via.placeholder.com/60x80?text=Book'}" alt="${book.title}" loading="lazy">
                </div>
                <div class="book-item-info">
                    <div class="book-item-title">${book.title}</div>
                    <div class="book-item-author">Tác giả: ${book.author}</div>
                    <div class="book-item-dates">
                        <div><i class="fas fa-calendar-plus"></i> Ngày mượn: ${formatDate(book.borrowDate)}</div>
                        ${book.returnDate ? 
                            `<div><i class="fas fa-calendar-check"></i> Ngày trả: ${formatDate(book.returnDate)}</div>` : 
                            `<div><i class="fas fa-calendar-times"></i> Hạn trả: ${formatDate(book.dueDate)}</div>`
                        }
                    </div>
                    ${dueDateInfo}
                </div>
                <div class="book-item-actions">
                    <div class="book-item-status status-${book.status}">
                        ${getStatusText(book.status)}
                    </div>
                    ${book.status === 'borrowed' ? 
                        `<button class="btn btn-sm btn-outline" onclick="returnBook(${book.id})">
                            <i class="fas fa-undo"></i> Trả sách
                         </button>` : ''
                    }
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN');
}

function getStatusText(status) {
    const statusMap = {
        'borrowed': 'Đang mượn',
        'returned': 'Đã trả',
        'overdue': 'Quá hạn'
    };
    return statusMap[status] || status;
}

function returnBook(bookId) {
    const borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks') || '[]');
    const bookIndex = borrowedBooks.findIndex(book => book.id === bookId);
    
    if (bookIndex !== -1) {
        borrowedBooks[bookIndex].status = 'returned';
        borrowedBooks[bookIndex].returnDate = new Date().toISOString().split('T')[0];
        localStorage.setItem('borrowedBooks', JSON.stringify(borrowedBooks));
        
        // Reload the books list
        const currentUserData = localStorage.getItem('currentUser');
        const currentUser = currentUserData ? JSON.parse(currentUserData) : {};
        if (currentUser.email) {
            loadMyBooks(currentUser.email);
        }
        
        window.authManager.showToast('Trả sách thành công!', 'success');
    }
}

function editProfile() {
    window.authManager.showAlert('Tính năng chỉnh sửa hồ sơ đang phát triển', 'info');
}

function changePassword() {
    window.authManager.showAlert('Tính năng đổi mật khẩu đang phát triển', 'info');
}

// Debug function to test modals
function testProfileModal() {
    console.log('Testing profile modal...');
    showModal('profileModal');
}

function testMyBooksModal() {
    console.log('Testing my books modal...');
    showModal('myBooksModal');
}

// Ensure all functions are available when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Make sure global functions are properly assigned
    window.showProfile = showProfile;
    window.showMyBooks = showMyBooks;
    window.editProfile = editProfile;
    window.changePassword = changePassword;
    window.returnBook = returnBook;
    
    // Debug: Check if modal elements exist
    console.log('Profile Modal exists:', !!document.getElementById('profileModal'));
    console.log('My Books Modal exists:', !!document.getElementById('myBooksModal'));
    
    // Initialize sample data
    initializeSampleBorrowedBooks();
});
