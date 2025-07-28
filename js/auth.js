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

async function showProfile() {
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
        
        // Try to get borrowed books count from API, fallback to localStorage
        try {
            // First try API
            const historyResponse = await api.getBorrowingHistory(user.email, 1, 100);
            if (historyResponse.success && historyResponse.borrowRecords) {
                const records = historyResponse.borrowRecords;
                const totalBorrowed = records.length;
                const currentlyBorrowed = records.filter(r => r.status === 'Borrowing').length;
                const returned = records.filter(r => r.status === 'Returned').length;
                const overdue = records.filter(r => r.status === 'Overdue').length;
                
                booksCountField.value = `${totalBorrowed} (${currentlyBorrowed} đang mượn, ${returned} đã trả, ${overdue} quá hạn)`;
            } else {
                throw new Error('API response invalid');
            }
        } catch (apiError) {
            console.log('Could not fetch from API, using localStorage fallback:', apiError.message);
            
            // Fallback to localStorage data
            const borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks') || '[]');
            const userBorrowedBooks = borrowedBooks.filter(book => book.userId === user.email);
            
            const totalBorrowed = userBorrowedBooks.length;
            const currentlyBorrowed = userBorrowedBooks.filter(book => book.status === 'borrowed').length;
            const returned = userBorrowedBooks.filter(book => book.status === 'returned').length;
            const overdue = userBorrowedBooks.filter(book => book.status === 'overdue').length;
            
            booksCountField.value = `${totalBorrowed} (${currentlyBorrowed} đang mượn, ${returned} đã trả, ${overdue} quá hạn)`;
        }
        
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

async function loadMyBooks(userEmail) {
    try {
        // Show loading state
        showMyBooksLoading(true);
        
        // Call the new API to get borrowing history
        const response = await api.getBorrowingHistory(userEmail, 1, 50); // Get first 50 records
        
        if (response.success && response.borrowRecords) {
            const records = response.borrowRecords;
            
            // Separate books by status
            const borrowed = records.filter(book => book.status === 'Borrowing');
            const returned = records.filter(book => book.status === 'Returned');
            const overdue = records.filter(book => book.status === 'Overdue');
            
            // Render books in respective tabs
            renderBooksList('borrowedBooksList', borrowed, 'Borrowing');
            renderBooksList('returnedBooksList', returned, 'Returned');
            renderBooksList('overdueBooksList', overdue, 'Overdue');
            
            // Update tab counts
            updateTabCounts(borrowed.length, returned.length, overdue.length);
            
            // Setup tab switching
            setupMyBooksTabSwitching();
        } else {
            throw new Error(response.message || 'Không thể tải lịch sử mượn sách');
        }
    } catch (error) {
        console.error('Error loading my books:', error);
        
        // Show error in all tabs
        ['borrowedBooksList', 'returnedBooksList', 'overdueBooksList'].forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--error-color); margin-bottom: 16px;"></i>
                        <p style="color: var(--error-color); text-align: center;">Không thể tải dữ liệu: ${error.message}</p>
                        <button class="btn btn-sm btn-primary" onclick="loadMyBooks('${userEmail}')">Thử lại</button>
                    </div>
                `;
            }
        });
        
        window.authManager.showAlert('Có lỗi khi tải lịch sử mượn sách: ' + error.message, 'error');
    } finally {
        showMyBooksLoading(false);
    }
}

function showMyBooksLoading(show) {
    ['borrowedBooksList', 'returnedBooksList', 'overdueBooksList'].forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container && show) {
            container.innerHTML = `
                <div class="loading-state" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: var(--primary-color); margin-bottom: 16px;"></i>
                    <p>Đang tải dữ liệu...</p>
                </div>
            `;
        }
    });
}

function setupMyBooksTabSwitching() {
    const tabBtns = document.querySelectorAll('#myBooksModal .tab-btn');
    const tabPanes = document.querySelectorAll('#myBooksModal .tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab pane
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === tabName + 'Tab') {
                    pane.classList.add('active');
                }
            });
        });
    });
}

function updateTabCounts(borrowedCount, returnedCount, overdueCount) {
    const tabs = document.querySelectorAll('#myBooksModal .tab-btn');
    tabs.forEach(tab => {
        const tabType = tab.dataset.tab;
        let originalText = '';
        let count = 0;
        
        // Get original text and count
        if (tabType === 'borrowed') {
            originalText = 'Đang mượn';
            count = borrowedCount;
        } else if (tabType === 'returned') {
            originalText = 'Đã trả';
            count = returnedCount;
        } else if (tabType === 'overdue') {
            originalText = 'Quá hạn';
            count = overdueCount;
        }
        
        tab.textContent = `${originalText} (${count})`;
    });
}

function renderBooksList(containerId, books, statusType) {
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
        let dueDateInfo = '';
        let actionButtons = '';
        
        // Calculate date information based on status
        if (statusType === 'Borrowing') {
            const today = new Date();
            const expectedReturnDate = new Date(book.expectedReturnDate.split('-').reverse().join('-')); // Convert DD-MM-YYYY to YYYY-MM-DD
            const diffTime = expectedReturnDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 1) {
                dueDateInfo = `<div class="due-info due-ok">Còn ${diffDays} ngày</div>`;
            } else if (diffDays === 1) {
                dueDateInfo = `<div class="due-info due-warning">Còn 1 ngày</div>`;
            } else if (diffDays === 0) {
                dueDateInfo = `<div class="due-info due-today">Hết hạn hôm nay</div>`;
            } else {
                dueDateInfo = `<div class="due-info due-overdue">Quá hạn ${Math.abs(diffDays)} ngày</div>`;
            }
            
            // actionButtons = `
            //     <button class="btn btn-sm btn-outline" onclick="returnBookAPI('${book.id}')">
            //         <i class="fas fa-undo"></i> Trả sách
            //     </button>
            // `;
        } else if (statusType === 'Overdue') {
            const today = new Date();
            const expectedReturnDate = new Date(book.expectedReturnDate.split('-').reverse().join('-'));
            const diffTime = today - expectedReturnDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            dueDateInfo = `<div class="due-info due-overdue">Quá hạn ${diffDays} ngày</div>`;
            if (book.fineAmount > 0) {
                dueDateInfo += `<div class="fine-info">Phí phạt: ${formatCurrency(book.fineAmount)}</div>`;
            }
            
            // actionButtons = `
            //     <button class="btn btn-sm btn-outline" onclick="returnBookAPI('${book.id}')">
            //         <i class="fas fa-undo"></i> Trả sách
            //     </button>
            // `;
        }
        
        return `
            <div class="book-item">
                <div class="book-item-image">
                    <div class="book-placeholder">
                        <i class="fas fa-book"></i>
                    </div>
                </div>
                <div class="book-item-info">
                    <div class="book-item-title">${book.bookTitle}</div>
                    <div class="book-item-meta">
                        <div class="book-item-dates">
                            <div><i class="fas fa-calendar-plus"></i> Ngày mượn: ${book.borrowDate}</div>
                            ${book.actualReturnDate ? 
                                `<div><i class="fas fa-calendar-check"></i> Ngày trả: ${book.actualReturnDate}</div>` : 
                                `<div><i class="fas fa-calendar-times"></i> Hạn trả: ${book.expectedReturnDate}</div>`
                            }
                            ${book.createdDate ? `<div><i class="fas fa-clock"></i> Tạo lúc: ${book.createdDate}</div>` : ''}
                        </div>
                        ${book.note ? `<div class="book-item-note"><i class="fas fa-sticky-note"></i> Ghi chú: ${book.note}</div>` : ''}
                    </div>
                    ${dueDateInfo}
                </div>
                <div class="book-item-actions">
                    <div class="book-item-status status-${statusType.toLowerCase()}">
                        ${getStatusText(statusType)}
                    </div>
                    ${actionButtons}
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(amount);
}

function getStatusText(status) {
    const statusMap = {
        'Borrowing': 'Đang mượn',
        'Returned': 'Đã trả',
        'Overdue': 'Quá hạn',
        'borrowed': 'Đang mượn',
        'returned': 'Đã trả',
        'overdue': 'Quá hạn'
    };
    return statusMap[status] || status;
}

async function returnBookAPI(borrowingId) {
    try {
        // Show confirmation
        const confirmed = confirm('Bạn có chắc chắn muốn trả sách này không?');
        if (!confirmed) return;
        
        // Call API to return book
        const response = await api.returnBook(borrowingId);
        
        if (response.success) {
            window.authManager.showToast('Trả sách thành công!', 'success');
            
            // Reload the books list
            const currentUserData = localStorage.getItem('currentUser');
            const currentUser = currentUserData ? JSON.parse(currentUserData) : {};
            if (currentUser.email) {
                loadMyBooks(currentUser.email);
            }
        } else {
            throw new Error(response.message || 'Không thể trả sách');
        }
    } catch (error) {
        console.error('Error returning book:', error);
        window.authManager.showAlert('Có lỗi khi trả sách: ' + error.message, 'error');
    }
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
    window.returnBookAPI = returnBookAPI;
    window.loadMyBooks = loadMyBooks;
    
    // Debug: Check if modal elements exist
    console.log('Profile Modal exists:', !!document.getElementById('profileModal'));
    console.log('My Books Modal exists:', !!document.getElementById('myBooksModal'));
    
    // Initialize sample data (for fallback)
    initializeSampleBorrowedBooks();
    
    // Test function for console
    window.testBorrowingHistory = async function(email = 'test@gmail.com') {
        try {
            console.log('Testing borrowing history for:', email);
            const result = await api.getBorrowingHistory(email, 1, 10);
            console.log('Result:', result);
            return result;
        } catch (error) {
            console.error('Test failed:', error);
            return error;
        }
    };
    
    // Test JWT decoding
    window.testJWTDecode = function(token) {
        if (!token) {
            token = localStorage.getItem('authToken');
        }
        if (!token) {
            console.error('No token provided and no token in localStorage');
            return null;
        }
        
        console.log('Testing JWT decode for token:', token.substring(0, 50) + '...');
        const decoded = api.decodeJWT(token);
        console.log('Decoded result:', decoded);
        return decoded;
    };
    
    // Test user construction from token
    window.testUserFromToken = function(token) {
        if (!token) {
            token = localStorage.getItem('authToken');
        }
        if (!token) {
            console.error('No token provided and no token in localStorage');
            return null;
        }
        
        const userInfo = api.decodeJWT(token);
        const user = {
            id: userInfo.nameidentifier || userInfo.sub || userInfo.id,
            username: 'test',
            role: userInfo.role || 'Borrower',
            name: userInfo.name || userInfo.fullName || 'Test User',
            email: userInfo.emailaddress || userInfo.email || 'unknown@example.com',
            joinDate: new Date().toLocaleDateString('vi-VN')
        };
        
        console.log('Constructed user from token:', user);
        return user;
    };
    
    console.log('Auth functions initialized.');
    console.log('Available test functions:');
    console.log('- testBorrowingHistory("email")');
    console.log('- testJWTDecode(token)'); 
    console.log('- testUserFromToken(token)');
    console.log('- showMyBooks()');
    console.log('Current user:', api.currentUser);
});
