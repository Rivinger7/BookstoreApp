// Admin Dashboard Management
class AdminManager {
    constructor() {
        this.api = new API(); // Khởi tạo API instance
        this.currentSection = 'dashboard';
        this.currentPage = {
            books: 1,
            users: 1,
            borrowings: 1,
            categories: 1
        };
        this.pageSize = 10;
        
        // Data storage for frontend filtering
        this.allBooks = [];
        this.allUsers = [];
        this.allBorrowings = [];
        this.allCategories = [];
        
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.setupEventListeners();
        this.loadCategories();
        this.loadDashboardData();
        this.showSection('dashboard');
        this.initCreateBorrowingForm();
    }


    checkAdminAuth() {
        const currentUserData = localStorage.getItem('currentUser');
        const user = currentUserData ? JSON.parse(currentUserData) : {};
        const token = localStorage.getItem('authToken');
        
        if (!token || !user.id || (user.role !== 'admin' && user.role !== 'Admin' && user.role !== 'BookStoreOwner')) {
            alert('Bạn không có quyền truy cập trang này!');
            window.location.href = 'index.html';
            return;
        }

        // Update admin user name
        const adminUserName = document.getElementById('adminUserName');
        if (adminUserName) {
            adminUserName.textContent = user.name || user.email;
        }
    }

    logout() {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            // Clear localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            
            // Show success message
            this.showAlert('Đăng xuất thành công!', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
            });
        });

        // Book form
        const bookForm = document.getElementById('bookForm');
        if (bookForm) {
            bookForm.addEventListener('submit', this.handleBookSubmit.bind(this));
        }

        // Category form
        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) {
            categoryForm.addEventListener('submit', this.handleCategorySubmit.bind(this));
        }

        // Search inputs
        this.setupSearchInputs();

        // Filter changes
        this.setupFilterListeners();
    }

    setupSearchInputs() {
        const searchInputs = [
            { id: 'bookSearchInput', handler: this.searchBooksAdmin.bind(this) },
            { id: 'userSearchInput', handler: this.searchUsersAdmin.bind(this) },
            { id: 'borrowingSearchInput', handler: this.searchBorrowingsAdmin.bind(this) },
            { id: 'categorySearchInput', handler: this.searchCategoriesAdmin.bind(this) }
        ];

        searchInputs.forEach(({ id, handler }) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handler();
                    }
                });
            }
        });
    }

    setupFilterListeners() {
        const filters = ['categoryFilter', 'statusFilter', 'borrowingStatusFilter'];
        
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    if (filterId === 'categoryFilter' || filterId === 'statusFilter') {
                        // Reset to first page when filtering
                        this.currentPage.books = 1;
                        this.applyBooksFilter();
                    } else if (filterId === 'borrowingStatusFilter') {
                        this.currentPage.borrowings = 1;
                        this.loadBorrowingsData();
                    }
                });
            }
        });
    }

    showSection(sectionName) {
        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Show/hide sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;

        // Load section data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'books':
                this.loadBooksData();
                break;
            case 'categories':
                this.loadCategoriesData();
                break;
            case 'users':
                this.loadUsersData();
                break;
            case 'create-borrowing':
                // Form already initialized in init()
                break;
            case 'borrowings':
                this.loadBorrowingsData();
                break;
        }
    }

    async loadCategories() {
        try {
            console.log('Admin: Loading categories from API...');
            const result = await this.api.getCategories();
            console.log('Admin: Categories result:', result);
            
            let categories = [];
            
            // Xử lý response từ API
            if (result && result.success && result.categories) {
                categories = result.categories;
            } else if (result && Array.isArray(result)) {
                categories = result;
            } else {
                console.warn('Admin: Unexpected categories API response format:', result);
                categories = this.getFallbackCategories();
            }
            
            // Cache categories để sử dụng trong getCategoryName
            this.categories = categories;
            
            this.populateCategoryFilters(categories);
            
        } catch (error) {
            console.error('Admin: Error loading categories:', error);
            console.log('Admin: Using fallback categories');
            const fallbackCategories = this.getFallbackCategories();
            this.categories = fallbackCategories;
            this.populateCategoryFilters(fallbackCategories);
        }
    }

    populateCategoryFilters(categories) {
        // Update category filter in books management
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            // Reset dropdown, giữ lại option "Tất cả thể loại"
            categoryFilter.innerHTML = '<option value="">Tất cả thể loại</option>';
            
            // Thêm categories từ API - sử dụng name thay vì ID để dễ match với book data
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name; // Sử dụng name thay vì ID
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }
        
        // Update category dropdown in book form
        const bookCategorySelect = document.getElementById('bookCategory');
        if (bookCategorySelect) {
            // Reset dropdown, giữ lại option "Chọn thể loại"
            bookCategorySelect.innerHTML = '<option value="">Chọn thể loại</option>';
            
            // Thêm categories từ API
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id; // Sử dụng GUID ID
                option.textContent = category.name;
                bookCategorySelect.appendChild(option);
            });
        }
        
        console.log('Admin: Populated category filters with', categories.length, 'categories');
    }

    getFallbackCategories() {
        // Fallback categories nếu API fail
        return [
            { id: 'fiction', name: 'Tiểu thuyết' },
            { id: 'science', name: 'Khoa học' },
            { id: 'technology', name: 'Công nghệ' },
            { id: 'history', name: 'Lịch sử' },
            { id: 'art', name: 'Nghệ thuật' },
            { id: 'business', name: 'Kinh doanh' },
            { id: 'education', name: 'Giáo dục' },
            { id: 'health', name: 'Sức khỏe' }
        ];
    }

    async loadDashboardData() {
        try {
            // Load actual data from APIs
            const [userResponse, booksResponse, borrowResponse] = await Promise.all([
                this.api.getUserDashboard(),
                this.api.getBooksDashboard(),
                this.api.getBorrowDashboard()
            ]);
            
            const stats = {
                totalBooks: booksResponse?.quantity || 0,
                totalUsers: userResponse?.quantity || 0,
                activeBorrowings: borrowResponse?.borrowQuantity || 0,
                todayReturns: borrowResponse?.returnedInDayQuantity || 0,
                overdueBooks: borrowResponse?.overdueQuantity || 0,
                totalReturned: borrowResponse?.returnedQuantity || 0
            };
            
            this.updateDashboardStats(stats);
            this.createDashboardChart(stats);
            
        } catch (error) {
            console.error('Load dashboard data error:', error);
            // Fallback to zero values
            const stats = {
                totalBooks: 0,
                totalUsers: 0,
                activeBorrowings: 0,
                todayReturns: 0,
                overdueBooks: 0,
                totalReturned: 0
            };
            
            this.updateDashboardStats(stats);
            this.createDashboardChart(stats);
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('totalBooks').textContent = stats.totalBooks || 0;
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('activeBorrowings').textContent = stats.activeBorrowings || 0;
        document.getElementById('todayReturns').textContent = stats.todayReturns || 0;
        document.getElementById('overdueBooks').textContent = stats.overdueBooks || 0;
        document.getElementById('totalReturned').textContent = stats.totalReturned || 0;
    }

    createDashboardChart(stats) {
        this.createOverviewChart(stats);
        this.createStatusPieChart(stats);
        this.createComparisonChart(stats);
    }

    createOverviewChart(stats) {
        const canvas = document.getElementById('overviewChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Enhanced gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Data for chart with better colors
        const data = [
            { label: 'Tổng sách', value: stats.totalBooks, color: '#3498db', hoverColor: '#2980b9' },
            { label: 'Người dùng', value: stats.totalUsers, color: '#2ecc71', hoverColor: '#27ae60' },
            { label: 'Đang mượn', value: stats.activeBorrowings, color: '#f39c12', hoverColor: '#e67e22' },
            { label: 'Trả trong ngày', value: stats.todayReturns, color: '#9b59b6', hoverColor: '#8e44ad' },
            { label: 'Tổng quá hạn', value: stats.overdueBooks, color: '#e74c3c', hoverColor: '#c0392b' },
            { label: 'Tổng đã trả', value: stats.totalReturned, color: '#1abc9c', hoverColor: '#16a085' }
        ];

        // Calculate chart dimensions with better spacing
        const chartWidth = width - 120;
        const chartHeight = height - 120;
        const maxValue = Math.max(...data.map(d => d.value), 1);
        const barWidth = chartWidth / data.length - 30;
        const startX = 80;
        const startY = height - 60;

        // Draw grid lines
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = startY - (chartHeight * i / 5);
            ctx.beginPath();
            ctx.moveTo(startX - 10, y);
            ctx.lineTo(startX + chartWidth, y);
            ctx.stroke();
            
            // Y-axis labels
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(maxValue * i / 5), startX - 15, y + 4);
        }

        // Draw bars with enhanced styling
        data.forEach((item, index) => {
            const barHeight = Math.max((item.value / maxValue) * chartHeight, 5);
            const x = startX + index * (barWidth + 30);
            const y = startY - barHeight;

            // Create gradient for bars
            const barGradient = ctx.createLinearGradient(0, y, 0, startY);
            barGradient.addColorStop(0, item.color);
            barGradient.addColorStop(1, item.hoverColor);

            // Draw bar with rounded corners
            ctx.fillStyle = barGradient;
            this.drawRoundedRect(ctx, x, y, barWidth, barHeight, 8);

            // Draw value on top with background
            ctx.fillStyle = '#ffffff';
            const valueText = item.value.toString();
            const textWidth = ctx.measureText(valueText).width;
            this.drawRoundedRect(ctx, x + barWidth/2 - textWidth/2 - 8, y - 25, textWidth + 16, 20, 10);
            
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(valueText, x + barWidth / 2, y - 10);

            // Draw label below bar
            ctx.fillStyle = '#495057';
            ctx.font = '12px Arial';
            ctx.fillText(item.label, x + barWidth / 2, startY + 20);
        });

        // Draw title
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Thống kê tổng quan hệ thống', width / 2, 30);
    }

    createStatusPieChart(stats) {
        const canvas = document.getElementById('statusChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        const data = [
            { label: 'Đang mượn', value: stats.activeBorrowings, color: '#f39c12' },
            { label: 'Trả trong ngày', value: stats.todayReturns, color: '#2ecc71' },
            { label: 'Tổng quá hạn', value: stats.overdueBooks, color: '#e74c3c' }
        ];

        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) {
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Không có dữ liệu', centerX, centerY);
            return;
        }

        let currentAngle = -Math.PI / 2;

        // Draw pie slices
        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();
            
            // Add border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Add percentage labels
            if (item.value > 0) {
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                
                const percentage = ((item.value / total) * 100).toFixed(1);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${percentage}%`, labelX, labelY);
            }

            currentAngle += sliceAngle;
        });

        // Draw legend
        let legendY = height - 80;
        data.forEach((item, index) => {
            if (item.value > 0) {
                ctx.fillStyle = item.color;
                ctx.fillRect(20, legendY, 15, 15);
                
                ctx.fillStyle = '#2c3e50';
                ctx.font = '12px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(`${item.label}: ${item.value}`, 45, legendY + 12);
                
                legendY += 25;
            }
        });
    }

    createComparisonChart(stats) {
        const canvas = document.getElementById('comparisonChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw title
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('So sánh các chỉ số hệ thống', width / 2, 30);

        // Comparison data với thông tin chi tiết hơn
        const comparisons = [
            { 
                label: 'Hiệu suất trả sách trong ngày',
                current: stats.todayReturns,
                target: Math.max(stats.activeBorrowings, 1),
                color: '#9b59b6',
                unit: 'cuốn'
            },
            {
                label: 'Tỉ lệ sách quá hạn / đang mượn',
                current: stats.overdueBooks,
                target: Math.max(stats.activeBorrowings, 1),
                color: '#e74c3c',
                unit: 'cuốn'
            },
            {
                label: 'Tổng sách đã trả / tổng sách',
                current: stats.totalReturned,
                target: Math.max(stats.totalBooks, 1),
                color: '#1abc9c',
                unit: 'cuốn'
            }
        ];

        const barHeight = 30;
        const barSpacing = 100;
        const startY = 80;

        comparisons.forEach((comp, index) => {
            const y = startY + index * barSpacing;
            const percentage = Math.min((comp.current / comp.target) * 100, 100);
            const barWidth = (width - 100) * (percentage / 100);

            // Background bar
            ctx.fillStyle = '#e9ecef';
            this.drawRoundedRect(ctx, 50, y, width - 100, barHeight, 20);

            // Progress bar
            ctx.fillStyle = comp.color;
            this.drawRoundedRect(ctx, 50, y, barWidth, barHeight, 20);

            // Label
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(comp.label, 50, y - 10);

            // Percentage
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            if (barWidth > 50) {
                ctx.fillText(`${percentage.toFixed(1)}%`, 50 + barWidth/2, y + 25);
            }

            // Values với đơn vị
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`${comp.current}/${comp.target} ${comp.unit}`, width - 10, y + 25);
        });
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    async loadBooksData() {
        try {
            this.showLoading();
            
            // Nếu chưa có data hoặc cần refresh, load từ API
            if (this.allBooks.length === 0) {
                const result = await this.api.getBooks({ page: 1, pageSize: 1000 }); // Load all books
                this.allBooks = result.books || [];
            }
            
            // Apply frontend search and filter
            this.applyBooksFilter();
            
        } catch (error) {
            console.error('Load books data error:', error);
            this.showAlert('Không thể tải dữ liệu sách', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    applyBooksFilter() {
        let filteredBooks = [...this.allBooks];
        
        // Apply search filter
        const searchInput = document.getElementById('bookSearchInput');
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book => 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                book.isbn?.toLowerCase().includes(searchTerm) ||
                book.categoryName?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply category filter
        const categoryFilter = document.getElementById('categoryFilter');
        const categoryValue = categoryFilter ? categoryFilter.value : '';
        if (categoryValue) {
            console.log('Filtering by category:', categoryValue);
            console.log('Sample book data:', this.allBooks[0]);
            filteredBooks = filteredBooks.filter(book => {
                // So sánh với categoryName vì dropdown value là category name
                const match = book.categoryName === categoryValue;
                if (!match && this.allBooks.indexOf(book) < 3) {
                    console.log(`Book "${book.title}" category "${book.categoryName}" does not match "${categoryValue}"`);
                }
                return match;
            });
            console.log('Filtered books count:', filteredBooks.length);
        }
        
        // Apply status filter
        const statusFilter = document.getElementById('statusFilter');
        const statusValue = statusFilter ? statusFilter.value : '';
        if (statusValue) {
            if (statusValue === 'available') {
                filteredBooks = filteredBooks.filter(book => book.quantity > 0);
            } else if (statusValue === 'borrowed') {
                filteredBooks = filteredBooks.filter(book => book.quantity === 0);
            }
        }
        
        // Apply pagination
        const totalPages = Math.ceil(filteredBooks.length / this.pageSize);
        const startIndex = (this.currentPage.books - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const paginatedBooks = filteredBooks.slice(startIndex, endIndex);
        
        this.renderBooksTable(paginatedBooks);
        this.renderPagination('books', totalPages, this.currentPage.books);
    }

    renderBooksTable(books) {
        const tbody = document.getElementById('booksTableBody');
        if (!tbody) return;

        console.log('Rendering books table:', books); // Debug log

        const booksHTML = books.map(book => `
            <tr>
                <td>
                    <img src="${book.image || 'https://via.placeholder.com/50x60?text=No+Image'}" 
                         alt="${book.title}" class="table-image">
                </td>
                <td>${book.title}</td>
                <td>${book.categoryName}</td>
                <td>${book.author}</td>
                <td>${book.isbn || 'N/A'}</td>
                <td>
                    <span class="status-badge ${book.quantity > 0 ? 'status-available' : 'status-borrowed'}">
                        ${book.quantity > 0 ? 'Có sẵn' : 'Hết sách'}
                    </span>
                </td>
                <td>${book.quantity || 0}</td>
                <td>${book.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price) : 'N/A'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="editBook('${book.id}')" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBook('${book.id}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = booksHTML;
    }

    async loadCategoriesData() {
        try {
            this.showLoading();
            
            // Nếu chưa có data hoặc cần refresh, load từ API
            if (this.allCategories.length === 0) {
                const result = await this.api.getCategories();
                if (result.success) {
                    this.allCategories = result.categories || [];
                } else {
                    throw new Error(result.message || 'Failed to load categories');
                }
            }
            
            // Apply frontend search filter
            this.applyCategoriesFilter();
            
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showAlert('Lỗi khi tải danh sách thể loại: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    applyCategoriesFilter() {
        let filteredCategories = [...this.allCategories];
        
        // Apply search filter
        const searchInput = document.getElementById('categorySearchInput');
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (searchTerm) {
            filteredCategories = filteredCategories.filter(category => 
                category.name.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply pagination
        const totalPages = Math.ceil(filteredCategories.length / this.pageSize);
        const startIndex = (this.currentPage.categories - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const paginatedCategories = filteredCategories.slice(startIndex, endIndex);
        
        this.renderCategoriesTable(paginatedCategories);
        this.renderPagination('categories', totalPages, this.currentPage.categories);
    }

    renderCategoriesTable(categories) {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;

        console.log('Rendering categories table:', categories);

        const categoriesHTML = categories.map(category => `
            <tr>
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="editCategory('${category.id}')" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCategory('${category.id}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = categoriesHTML;
    }

    async loadUsersData() {
        try {
            this.showLoading();
            
            // Nếu chưa có data hoặc cần refresh, load từ API
            if (this.allUsers.length === 0) {
                const result = await this.api.getUsers({ page: 1, pageSize: 1000 }); // Load all users
                
                // Chuyển đổi structure mới: API trả về array của objects với format {users: {id, username, email, fullName}, borrowQuantity}
                this.allUsers = result.users ? result.users.map(item => ({
                    id: item.users.id,
                    name: item.users.fullName || item.users.username,
                    email: item.users.email,
                    username: item.users.username,
                    createdAt: new Date().toISOString(), // API không trả về createdAt, dùng tạm
                    borrowingCount: item.borrowQuantity || 0,
                    status: 'active' // API không trả về status, default active
                })) : [];
            }
            
            // Apply frontend search and filter
            this.applyUsersFilter();
            
        } catch (error) {
            console.error('Load users data error:', error);
            this.showAlert('Không thể tải dữ liệu người dùng', 'error');
            
            // Fallback to mock data if API fails
            const result = await this.getMockUsersData();
            this.renderUsersTable(result.users);
            this.renderPagination('users', result.totalPages, this.currentPage.users);
        } finally {
            this.hideLoading();
        }
    }
    
    applyUsersFilter() {
        let filteredUsers = [...this.allUsers];
        
        // Apply search filter
        const searchInput = document.getElementById('userSearchInput');
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.username?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply pagination
        const totalPages = Math.ceil(filteredUsers.length / this.pageSize);
        const startIndex = (this.currentPage.users - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        this.renderUsersTable(paginatedUsers);
        this.renderPagination('users', totalPages, this.currentPage.users);
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        const usersHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>${user.borrowingCount || 0}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-danger" 
                                onclick="deleteUser('${user.id}')" title="Xóa người dùng">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = usersHTML;
    }

    async loadBorrowingsData() {
        try {
            this.showLoading();
            console.log('Loading borrowings data...');
            
            // Call actual API to get borrowings
            const response = await this.api.getBorrowings({
                page: this.currentPage.borrowings,
                pageSize: this.pageSize
            });
            
            if (response && response.success) {
                this.allBorrowings = response.borrowRecords || [];
                this.totalBorrowings = response.totalCount || 0;
                console.log('Loaded borrowings:', this.allBorrowings);
                
                this.applyBorrowingsFilter();
            } else {
                throw new Error(response?.message || 'Failed to load borrowings');
            }
            
        } catch (error) {
            console.error('Load borrowings data error:', error);
            this.showAlert('Không thể tải dữ liệu mượn trả', 'error');
            // Fallback to empty data
            this.allBorrowings = [];
            this.applyBorrowingsFilter();
        } finally {
            this.hideLoading();
        }
    }

    applyBorrowingsFilter() {
        let filteredBorrowings = [...this.allBorrowings];
        
        // Apply search filter
        const searchInput = document.getElementById('borrowingSearchInput');
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (searchTerm) {
            filteredBorrowings = filteredBorrowings.filter(borrowing => 
                borrowing.fullName?.toLowerCase().includes(searchTerm) ||
                borrowing.email?.toLowerCase().includes(searchTerm) ||
                borrowing.bookTitle?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply status filter
        const statusFilter = document.getElementById('borrowingStatusFilter');
        const statusValue = statusFilter ? statusFilter.value : '';
        if (statusValue) {
            filteredBorrowings = filteredBorrowings.filter(borrowing => {
                const status = borrowing.status?.toLowerCase();
                switch (statusValue) {
                    case 'active':
                        return status === 'borrowing';
                    case 'returned':
                        return status === 'returned';
                    case 'overdue':
                        // Check if borrowing is overdue (past expectedReturnDate and not returned)
                        if (status === 'borrowing') {
                            const dateParts = borrowing.expectedReturnDate.split('-');
                            const expectedDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); // DD-MM-YYYY
                            const today = new Date();
                            today.setHours(0, 0, 0, 0); // Reset time for comparison
                            return expectedDate < today;
                        }
                        return false;
                    default:
                        return true;
                }
            });
        }
        
        // Apply pagination
        const totalPages = Math.ceil(filteredBorrowings.length / this.pageSize);
        const startIndex = (this.currentPage.borrowings - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const paginatedBorrowings = filteredBorrowings.slice(startIndex, endIndex);
        
        this.renderBorrowingsTable(paginatedBorrowings);
        this.renderPagination('borrowings', totalPages, this.currentPage.borrowings);
    }

    renderBorrowingsTable(borrowings) {
        const tbody = document.getElementById('borrowingsTableBody');
        if (!tbody) return;

        const borrowingsHTML = borrowings.map(borrowing => `
            <tr>
                <td>${borrowing.id}</td>
                <td>${borrowing.fullName}</td>
                <td>${borrowing.bookTitle}</td>
                <td>${borrowing.borrowDate}</td>
                <td>${borrowing.expectedReturnDate}</td>
                <td>${borrowing.actualReturnDate || '-'}</td>
                <td>
                    <span class="status-badge ${this.getBorrowingStatusClass(borrowing.status)}">
                        ${this.getBorrowingStatusText(borrowing.status)}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        ${borrowing.status === 'Borrowing' ? `
                            <button class="btn btn-sm btn-success" onclick="returnBook('${borrowing.id}')">
                                Trả sách
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = borrowingsHTML;
    }

    async returnBook(borrowingId) {
        try {
            this.showLoading();
            
            // Call API to return book
            const response = await this.api.returnBook(borrowingId);
            
            if (response && response.success) {
                this.showAlert('Trả sách thành công', 'success');
                // Reload borrowings data to reflect changes
                await this.loadBorrowingsData();
            } else {
                throw new Error(response?.message || 'Failed to return book');
            }
            
        } catch (error) {
            console.error('Error returning book:', error);
            this.showAlert(error.message || 'Lỗi khi trả sách', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Modal and form methods
    showAddBookModal() {
        document.getElementById('bookFormTitle').textContent = 'Thêm sách mới';
        
        const form = document.getElementById('bookForm');
        form.reset();
        delete form.dataset.editId; // Đảm bảo xóa edit ID
        
        const modal = document.getElementById('bookFormModal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
    }

    async editBook(bookId) {
        try {
            // Lấy thông tin sách từ API
            const bookObject = await this.api.getBookById(bookId);
            console.log('Edit book data:', bookObject.book); // Debug log

            // var bookTit = bookObject.book.title;
            // console.log('Book titleaaaaaaaaaaaaaaaaaaaaaa:', bookTit);

            // Reset form trước
            const form = document.getElementById('bookForm');
            if (form) {
                form.reset();
                form.dataset.editId = bookId;
            }
            
            // Hiển thị modal trước
            const modal = document.getElementById('bookFormModal');
            if (modal) {
                // console.log('Before showing modal, book data:', book); // Debug log
                modal.style.display = 'block';
                modal.classList.add('show');
            }

            // Đợi modal hiển thị xong rồi fill form
            setTimeout(() => {
                // console.log('Inside setTimeout, book data:', book); // Debug log
                // console.log('Book title specifically:', book.title); // Debug log
                
                // Check elements existence
                const titleInput = document.getElementById('bookTitle');
                const authorInput = document.getElementById('bookAuthor');
                const isbnInput = document.getElementById('bookISBN');
                const categorySelect = document.getElementById('bookCategory');
                const quantityInput = document.getElementById('bookQuantity');
                const priceInput = document.getElementById('bookPrice');
                const imageInput = document.getElementById('bookImage');
                
                

                // console.log('Elements check:', {
                //     titleInput: !!titleInput,
                //     authorInput: !!authorInput,
                //     categorySelect: !!categorySelect
                // });

                if (bookObject) {
                    document.getElementById('bookFormTitle').textContent = 'Sửa thông tin sách';
                    
                    if (titleInput) {
                        titleInput.value = bookObject.book.title;
                        // console.log('Set book title:', bookObject.book.title, 'Input value:', titleInput.value);
                    }
                    if (authorInput) {
                        authorInput.value = bookObject.book.author || '';
                        // console.log('Set book author:', book.author);
                    }
                    if (isbnInput) {
                        isbnInput.value = bookObject.book.isbn || '';
                    }
                    if (categorySelect) {
                        categorySelect.value = bookObject.book.categoryId || '';
                        // console.log('Set category:', book.categoryId || book.category);
                    }
                    if (quantityInput) {
                        quantityInput.value = bookObject.book.quantity || '';
                        // console.log('Set quantity:', book.quantity);
                    }
                    if (priceInput) {
                        priceInput.value = bookObject.book.price || '';
                        // console.log('Set price:', book.price);
                    }
                    if (imageInput) {
                        imageInput.value = bookObject.book.image || '';
                    }
                    
                    console.log('Form fill completed successfully');
                } else {
                    console.error('Book data is invalid:', bookObject);
                }
            }, 300);
            
        } catch (error) {
            console.error('Edit book error:', error);
            this.showAlert('Không thể tải thông tin sách', 'error');
        }
    }

    async deleteBook(bookId) {
        if (confirm('Bạn có chắc chắn muốn xóa sách này?')) {
            try {
                this.showLoading();
                
                await this.api.deleteBook(bookId);
                
                this.showAlert('Xóa sách thành công', 'success');
                
                // Reload danh sách sách
                await this.loadBooksData();
                
            } catch (error) {
                console.error('Delete book error:', error);
                this.showAlert('Không thể xóa sách', 'error');
            } finally {
                this.hideLoading();
            }
        }
    }

    async deleteUser(userId) {
        if (confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) {
            try {
                this.showLoading();
                
                await this.api.deleteUser(userId);
                
                this.showAlert('Xóa người dùng thành công', 'success');
                
                // Remove from local array and refresh view
                this.allUsers = this.allUsers.filter(user => user.id !== userId);
                this.applyUsersFilter();
                
            } catch (error) {
                console.error('Delete user error:', error);
                this.showAlert('Không thể xóa người dùng', 'error');
            } finally {
                this.hideLoading();
            }
        }
    }

    async editCategory(categoryId) {
        try {
            this.showLoading();
            
            const result = await this.api.getCategoryById(categoryId);
            
            if (result.success && result.category) {
                const category = result.category;
                
                // Điền thông tin vào form
                document.getElementById('categoryName').value = category.name;
                
                // Set edit mode
                const form = document.getElementById('categoryForm');
                form.dataset.editId = categoryId;
                
                // Change modal title
                document.getElementById('categoryFormTitle').textContent = 'Chỉnh sửa thể loại';
                
                // Show modal
                document.getElementById('categoryFormModal').style.display = 'block';
            } else {
                throw new Error(result.message || 'Không thể tải thông tin thể loại');
            }
            
        } catch (error) {
            console.error('Edit category error:', error);
            this.showAlert('Không thể tải thông tin thể loại: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async deleteCategory(categoryId) {
        if (confirm('Bạn có chắc chắn muốn xóa thể loại này? Lưu ý: Các sách thuộc thể loại này sẽ cần được cập nhật thể loại khác.')) {
            try {
                this.showLoading();
                
                await this.api.deleteCategory(categoryId);
                
                this.showAlert('Xóa thể loại thành công', 'success');
                
                // Reload danh sách categories
                await this.loadCategoriesData();
                
                // Reload categories cho dropdown
                await this.loadCategories();
                
            } catch (error) {
                console.error('Delete category error:', error);
                this.showAlert('Không thể xóa thể loại: ' + error.message, 'error');
            } finally {
                this.hideLoading();
            }
        }
    }

    closeModal(modalId) {
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        }
    }

    // Search methods
    searchBooksAdmin() {
        const searchInput = document.getElementById('bookSearchInput');
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        console.log('Search books:', searchTerm);
        
        // Reset to first page when searching
        this.currentPage.books = 1;
        this.applyBooksFilter();
    }

    searchUsersAdmin() {
        const searchInput = document.getElementById('userSearchInput');
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        console.log('Search users:', searchTerm);
        
        // Reset to first page when searching
        this.currentPage.users = 1;
        this.applyUsersFilter();
    }

    searchBorrowingsAdmin() {
        const searchInput = document.getElementById('borrowingSearchInput');
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        console.log('Search borrowings:', searchTerm);
        // Reset to first page when searching
        this.currentPage.borrowings = 1;
        this.applyBorrowingsFilter();
    }

    searchCategoriesAdmin() {
        const searchInput = document.getElementById('categorySearchInput');
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        console.log('Search categories:', searchTerm);
        
        // Reset to first page when searching
        this.currentPage.categories = 1;
        this.applyCategoriesFilter();
    }

    // Pagination and UI methods
    renderPagination(type, totalPages, currentPage) {
        const container = document.getElementById(`${type}Pagination`);
        if (!container) return;

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="changePage('${type}', ${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage || i === 1 || i === totalPages || 
                (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `
                    <button class="${i === currentPage ? 'active' : ''}" 
                            onclick="changePage('${type}', ${i})">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += '<span>...</span>';
            }
        }

        // Next button
        paginationHTML += `
            <button ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="changePage('${type}', ${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        container.innerHTML = paginationHTML;
    }

    // Form handlers
    async handleBookSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const editId = form.dataset.editId; // Kiểm tra xem có đang edit không
        
        const formData = {
            title: document.getElementById('bookTitle').value,
            author: document.getElementById('bookAuthor').value,
            isbn: document.getElementById('bookISBN').value,
            categoryId: document.getElementById('bookCategory').value,
            quantity: parseInt(document.getElementById('bookQuantity').value) || 1,
            price: parseFloat(document.getElementById('bookPrice').value) || 0,
            image: document.getElementById('bookImage').value
        };

        // Thêm năm xuất bản nếu có trường này
        const yearInput = document.getElementById('bookYear');
        if (yearInput) {
            formData.publishedYear = parseInt(yearInput.value) || null;
        }

        // Thêm mô tả nếu có trường này
        const descInput = document.getElementById('bookDescription');
        if (descInput) {
            formData.description = descInput.value;
        }

        // Validation
        if (!formData.title || !formData.author || !formData.categoryId) {
            this.showAlert('Vui lòng nhập đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        try {
            this.showLoading();
            
            let result;
            if (editId) {
                // Cập nhật sách
                result = await this.api.updateBook(editId, formData);
                this.showAlert('Cập nhật sách thành công!', 'success');
            } else {
                // Thêm sách mới
                result = await this.api.createBook(formData);
                this.showAlert('Thêm sách thành công!', 'success');
            }
            
            console.log('Book operation result:', result);
            
            // Đóng modal và reset form
            this.closeModal('bookFormModal');
            form.reset();
            delete form.dataset.editId; // Xóa edit ID
            
            // Reload danh sách sách
            await this.loadBooksData();
            
        } catch (error) {
            console.error('Book operation error:', error);
            this.showAlert(error.message || `Không thể ${editId ? 'cập nhật' : 'thêm'} sách`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleCategorySubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const editId = form.dataset.editId; // Kiểm tra xem có đang edit không
        
        const formData = {
            name: document.getElementById('categoryName').value.trim()
        };

        // Validation
        if (!formData.name) {
            this.showAlert('Vui lòng nhập tên thể loại', 'error');
            return;
        }

        try {
            this.showLoading();
            
            let result;
            if (editId) {
                // Cập nhật category
                result = await this.api.updateCategory(editId, formData);
                this.showAlert('Cập nhật thể loại thành công!', 'success');
            } else {
                // Thêm category mới
                result = await this.api.createCategory(formData);
                this.showAlert('Thêm thể loại thành công!', 'success');
            }
            
            console.log('Category operation result:', result);
            
            // Đóng modal và reset form
            this.closeModal('categoryFormModal');
            form.reset();
            delete form.dataset.editId; // Xóa edit ID
            
            // Reload danh sách categories
            await this.loadCategoriesData();
            
            // Reload categories cho dropdown
            await this.loadCategories();
            
        } catch (error) {
            console.error('Category operation error:', error);
            this.showAlert(error.message || `Không thể ${editId ? 'cập nhật' : 'thêm'} thể loại`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Utility methods
    getCategoryName(categoryId) {
        // Tìm category theo ID từ cache admin
        if (this.categories && this.categories.length > 0) {
            const category = this.categories.find(cat => cat.id === categoryId);
            if (category) {
                return category.name;
            }
        }
        
        // Tìm category theo ID từ cache booksPageManager (nếu có)
        if (window.booksPageManager && window.booksPageManager.categories && window.booksPageManager.categories.length > 0) {
            const category = window.booksPageManager.categories.find(cat => cat.id === categoryId);
            if (category) {
                return category.name;
            }
        }
        
        // Fallback mapping cho compatibility với hardcoded IDs
        const fallbackCategories = {
            'fiction': 'Tiểu thuyết',
            'science': 'Khoa học',
            'technology': 'Công nghệ',
            'history': 'Lịch sử',
            'art': 'Nghệ thuật',
            'business': 'Kinh doanh',
            'education': 'Giáo dục',
            'health': 'Sức khỏe'
        };
        
        return fallbackCategories[categoryId] || categoryId || 'Khác';
    }

    getBorrowingStatusClass(status) {
        const statusLower = status?.toLowerCase();
        const classes = {
            'borrowing': 'status-active',
            'returned': 'status-returned',
            'overdue': 'status-overdue'
        };
        return classes[statusLower] || 'status-active';
    }

    getBorrowingStatusText(status) {
        const statusLower = status?.toLowerCase();
        const texts = {
            'borrowing': 'Đang mượn',
            'returned': 'Đã trả',
            'overdue': 'Quá hạn'
        };
        return texts[statusLower] || status;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('vi-VN');
    }

    formatTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffInMinutes = Math.floor((now - past) / (1000 * 60));
        
        if (diffInMinutes < 60) {
            return `${diffInMinutes} phút trước`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
        }
    }

    showLoading() {
        // Reuse from main app if available
        if (window.mainApp) {
            window.mainApp.showLoading('.admin-main');
        }
    }

    hideLoading() {
        if (window.mainApp) {
            window.mainApp.hideLoading('.admin-main');
        }
    }

    showAlert(message, type) {
        if (window.mainApp) {
            window.mainApp.showAlert(message, type);
        }
    }

    closeModal(modalId) {
        if (window.mainApp) {
            window.mainApp.closeModal(modalId);
        }
    }

    // Mock data methods for demo - Remove when backend is ready
    async getMockDashboardStats() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    totalBooks: 1250,
                    totalUsers: 385,
                    activeBorrowings: 127,
                    todayReturns: 23
                });
            }, 500);
        });
    }

    async getMockBooksData() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    books: [
                        {
                            id: 1,
                            title: "Tôi thấy hoa vàng trên cỏ xanh",
                            author: "Nguyễn Nhật Ánh",
                            category: "fiction",
                            image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=50&h=60&fit=crop",
                            available: true,
                            quantity: 5
                        },
                        {
                            id: 2,
                            title: "Đắc Nhân Tâm",
                            author: "Dale Carnegie",
                            category: "business",
                            image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=50&h=60&fit=crop",
                            available: false,
                            quantity: 3
                        }
                    ],
                    totalPages: 5
                });
            }, 500);
        });
    }

    async getMockUsersData() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    users: [
                        {
                            id: 1,
                            name: "Nguyễn Văn A",
                            email: "nguyenvana@email.com",
                            createdAt: "2024-01-15",
                            borrowingCount: 3,
                            status: "active"
                        },
                        {
                            id: 2,
                            name: "Trần Thị B",
                            email: "tranthib@email.com",
                            createdAt: "2024-02-20",
                            borrowingCount: 1,
                            status: "active"
                        }
                    ],
                    totalPages: 3
                });
            }, 500);
        });
    }

    async getMockBorrowingsData() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    borrowings: [
                        {
                            id: 1,
                            userName: "Nguyễn Văn A",
                            bookTitle: "Đắc Nhân Tâm",
                            borrowDate: "2024-06-01",
                            dueDate: "2024-06-15",
                            returnDate: null,
                            status: "active"
                        },
                        {
                            id: 2,
                            userName: "Trần Thị B",
                            bookTitle: "1984",
                            borrowDate: "2024-05-20",
                            dueDate: "2024-06-03",
                            returnDate: "2024-06-02",
                            status: "returned"
                        }
                    ],
                    totalPages: 4
                });
            }, 500);
        });
    }

    async getMockPopularBooks() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { title: "Đắc Nhân Tâm", borrowCount: 45 },
                    { title: "Sapiens", borrowCount: 38 },
                    { title: "1984", borrowCount: 32 },
                    { title: "Tôi thấy hoa vàng trên cỏ xanh", borrowCount: 28 }
                ]);
            }, 500);
        });
    }

    async getMockActiveUsers() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { name: "Nguyễn Văn A", borrowCount: 12 },
                    { name: "Trần Thị B", borrowCount: 8 },
                    { name: "Lê Văn C", borrowCount: 7 },
                    { name: "Phạm Thị D", borrowCount: 5 }
                ]);
            }, 500);
        });
    }

    async mockCreateBook(formData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!formData.title || !formData.author) {
                    reject(new Error('Vui lòng nhập đầy đủ thông tin'));
                    return;
                }
                resolve({ message: 'Thêm sách thành công' });
            }, 1000);
        });
    }

    // Create Borrowing Management
    initCreateBorrowingForm() {
        // Setup form handlers
        const form = document.getElementById('createBorrowingForm');
        if (form && !form.dataset.initialized) {
            form.addEventListener('submit', this.handleCreateBorrowing.bind(this));
            form.dataset.initialized = 'true';
        }
        
        // Setup borrow period change listener
        const borrowPeriodInput = document.getElementById('borrowPeriod');
        if (borrowPeriodInput) {
            borrowPeriodInput.addEventListener('change', this.updateExpectedReturnDate.bind(this));
            borrowPeriodInput.addEventListener('input', this.updateExpectedReturnDate.bind(this));
            // Set initial date
            this.updateExpectedReturnDate();
        }
        
        // Reset form
        this.resetBorrowingForm();
    }

    async searchCustomer() {
        const searchInput = document.getElementById('customerSearch');
        const resultsDiv = document.getElementById('customerResults');
        
        if (!searchInput || !resultsDiv) return;
        
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) {
            resultsDiv.innerHTML = '';
            return;
        }
        
        try {
            this.showLoading();
            
            // Call new API to search user by username or email
            const result = await this.api.searchUserByUsernameOrEmail(searchTerm);
            
            if (result && result.users) {
                // API trả về thông tin user
                this.renderCustomerResults([result.users]);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">Không tìm thấy khách hàng nào</div>';
            }
            
        } catch (error) {
            console.error('Search customer error:', error);
            resultsDiv.innerHTML = '<div class="error">Lỗi khi tìm kiếm khách hàng: ' + error.message + '</div>';
        } finally {
            this.hideLoading();
        }
    }

    renderCustomerResults(customers) {
        const resultsDiv = document.getElementById('customerResults');
        if (!resultsDiv) return;
        
        if (customers.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">Không tìm thấy khách hàng nào</p>';
            return;
        }
        
        const resultsHTML = customers.map(customer => `
            <div class="customer-result" onclick="window.adminManager.selectCustomer('${customer.id}', '${customer.fullName || customer.name}', '${customer.email}', '${customer.username}')">
                <div class="customer-info">
                    <strong>${customer.fullName || customer.name}</strong>
                    <p><i class="fas fa-envelope"></i> ${customer.email}</p>
                    <p><i class="fas fa-user"></i> ${customer.username}</p>
                </div>
                <button type="button" class="btn btn-sm btn-outline">
                    <i class="fas fa-check"></i> Chọn
                </button>
            </div>
        `).join('');
        
        resultsDiv.innerHTML = resultsHTML;
    }

    selectCustomer(id, name, email, username) {
        // Hide search results
        document.getElementById('customerResults').innerHTML = '';
        
        // Show selected customer
        document.getElementById('selectedCustomer').style.display = 'block';
        document.getElementById('selectedCustomerName').textContent = name;
        document.getElementById('selectedCustomerEmail').textContent = email;
        // document.getElementById('selectedCustomerUsername').textContent = username;
        
        // Store selected customer data
        this.selectedCustomerData = { id, name, email, username };
        
        // Clear search input
        document.getElementById('customerSearch').value = '';
        
        console.log('Selected customer:', this.selectedCustomerData);
    }

    async searchBook() {
        const searchInput = document.getElementById('bookSearch');
        const resultsDiv = document.getElementById('bookResults');
        
        if (!searchInput || !resultsDiv) return;
        
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) {
            resultsDiv.innerHTML = '';
            return;
        }
        
        try {
            this.showLoading();
            
            // Call new API to search books
            const result = await this.api.searchBooks({ 
                search: searchTerm, 
                page: 1, 
                pageSize: 20 
            });
            
            if (result && result.success && result.books) {
                this.renderBookResults(result.books);
            } else {
                resultsDiv.innerHTML = '<div class="no-results">Không tìm thấy sách nào</div>';
            }
            
        } catch (error) {
            console.error('Search book error:', error);
            resultsDiv.innerHTML = '<div class="error">Lỗi khi tìm kiếm sách: ' + error.message + '</div>';
        } finally {
            this.hideLoading();
        }
    }

    renderBookResults(books) {
        const resultsDiv = document.getElementById('bookResults');
        if (!resultsDiv) return;
        
        if (books.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">Không tìm thấy sách có sẵn nào</p>';
            return;
        }
        
        const resultsHTML = books.map(book => `
            <div class="book-result" onclick="window.adminManager.selectBook('${book.id}', '${book.title}', '${book.author}', '${book.isbn}', ${book.quantity}, '${book.image || ''}', '${book.price || 0}')">
                <img src="${book.image || 'https://via.placeholder.com/50x60?text=No+Image'}" alt="${book.title}" class="book-result-image">
                <div class="book-info">
                    <strong>${book.title}</strong>
                    <p><i class="fas fa-user"></i> ${book.author}</p>
                    <p><i class="fas fa-barcode"></i> ${book.isbn || 'N/A'}</p>
                    <p><i class="fas fa-tag"></i> ${book.categoryName || 'N/A'}</p>
                    <small><i class="fas fa-books"></i> Có sẵn: ${book.quantity} cuốn</small>
                    ${book.price ? `<small><i class="fas fa-money-bill"></i> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)}</small>` : ''}
                </div>
                <button type="button" class="btn btn-sm btn-outline">
                    <i class="fas fa-check"></i> Chọn
                </button>
            </div>
        `).join('');
        
        resultsDiv.innerHTML = resultsHTML;
    }

    selectBook(id, title, author, isbn, quantity, image, price) {
        // Hide search results
        document.getElementById('bookResults').innerHTML = '';
        
        // Show selected book
        document.getElementById('selectedBook').style.display = 'block';
        document.getElementById('selectedBookTitle').textContent = title;
        document.getElementById('selectedBookAuthor').textContent = author;
        document.getElementById('selectedBookISBN').textContent = isbn || 'N/A';
        document.getElementById('selectedBookQuantity').textContent = quantity;
        document.getElementById('selectedBookImage').src = image || 'https://via.placeholder.com/80x100?text=No+Image';
        // document.getElementById('selectedBookPrice').textContent = price ? 
        //     new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) : 'N/A';
        
        // Store selected book data
        this.selectedBookData = { id, title, author, isbn, quantity, image, price };
        
        // Clear search input
        document.getElementById('bookSearch').value = '';
        
        console.log('Selected book:', this.selectedBookData);
    }

    updateExpectedReturnDate() {
        const borrowPeriodInput = document.getElementById('borrowPeriod');
        const expectedDateInput = document.getElementById('expectedReturnDate');
        
        if (!borrowPeriodInput || !expectedDateInput) return;
        
        const borrowDays = parseInt(borrowPeriodInput.value) || 14;
        const today = new Date();
        const expectedDate = new Date(today.getTime() + borrowDays * 24 * 60 * 60 * 1000);
        
        expectedDateInput.value = expectedDate.toISOString().split('T')[0];
    }

    async handleCreateBorrowing(event) {
        event.preventDefault();
        
        if (!this.selectedCustomerData) {
            this.showAlert('Vui lòng chọn khách hàng', 'warning');
            return;
        }
        
        if (!this.selectedBookData) {
            this.showAlert('Vui lòng chọn sách', 'warning');
            return;
        }
        
        const borrowPeriod = parseInt(document.getElementById('borrowPeriod').value);
        const notes = document.getElementById('borrowNote').value;
        
        if (!borrowPeriod || borrowPeriod < 1 || borrowPeriod > 30) {
            this.showAlert('Số ngày mượn phải từ 1 đến 30 ngày', 'warning');
            return;
        }
        
        try {
            this.showLoading();
            
            const borrowingData = {
                email: this.selectedCustomerData.email,
                bookId: this.selectedBookData.id,
                period: borrowPeriod, // số ngày
                note: notes || ''
            };
            
            console.log('Creating borrowing with data:', borrowingData);
            
            // Call API to create borrowing
            const result = await this.api.createBorrowing(borrowingData);
            
            if (result && (result.success || result.id)) {
                this.showAlert('Tạo giao dịch mượn sách thành công!', 'success');
                this.resetBorrowingForm();
                
                // Optionally refresh borrowings list
                if (this.currentSection === 'borrowings') {
                    this.loadBorrowingsData();
                }
            } else {
                throw new Error(result.message || 'Không thể tạo giao dịch mượn sách');
            }
            
        } catch (error) {
            console.error('Create borrowing error:', error);
            this.showAlert(error.message || 'Không thể tạo giao dịch mượn sách', 'error');
        }
    }

    resetBorrowingForm() {
        // Reset form
        const form = document.getElementById('createBorrowingForm');
        if (form) {
            form.reset();
        }
        
        // Hide selected customer and book
        const selectedCustomer = document.getElementById('selectedCustomer');
        const selectedBook = document.getElementById('selectedBook');
        if (selectedCustomer) selectedCustomer.style.display = 'none';
        if (selectedBook) selectedBook.style.display = 'none';
        
        // Clear search results
        const customerResults = document.getElementById('customerResults');
        const bookResults = document.getElementById('bookResults');
        if (customerResults) customerResults.innerHTML = '';
        if (bookResults) bookResults.innerHTML = '';
        
        // Reset selected data
        this.selectedCustomerData = null;
        this.selectedBookData = null;
        
        // Reset borrow period and update expected date
        const borrowPeriodInput = document.getElementById('borrowPeriod');
        if (borrowPeriodInput) {
            borrowPeriodInput.value = 14;
            this.updateExpectedReturnDate();
        }
        
        console.log('Borrowing form reset');
    }
}

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});

// Global functions for HTML onclick events
function showAddBookModal() {
    const modal = document.getElementById('bookFormModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
    }
}

function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'mở khóa' : 'khóa';
    
    if (confirm(`Bạn có chắc chắn muốn ${action} người dùng này?`)) {
        window.adminManager.showAlert(`Tính năng ${action} người dùng đang phát triển`, 'warning');
    }
}

function returnBook(borrowingId) {
    if (confirm('Xác nhận trả sách?')) {
        if (window.adminManager) {
            window.adminManager.returnBook(borrowingId);
        }
    }
}

function changePage(type, page) {
    window.adminManager.currentPage[type] = page;
    
    switch (type) {
        case 'books':
            window.adminManager.applyBooksFilter();
            break;
        case 'categories':
            window.adminManager.applyCategoriesFilter();
            break;
        case 'users':
            window.adminManager.applyUsersFilter();
            break;
        case 'borrowings':
            window.adminManager.applyBorrowingsFilter();
            break;
    }
}

function searchBooksAdmin() {
    window.adminManager.loadBooksData();
}

function searchUsersAdmin() {
    window.adminManager.loadUsersData();
}

function searchBorrowingsAdmin() {
    window.adminManager.loadBorrowingsData();
}

// Global function for modal closing
function closeModal(modalId) {
    if (window.adminManager) {
        window.adminManager.closeModal(modalId);
    } else {
        // Fallback if adminManager not available
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }
}

// Global functions for admin actions
function showAddBookModal() {
    if (window.adminManager) {
        window.adminManager.showAddBookModal();
    }
}

function editBook(bookId) {
    if (window.adminManager) {
        window.adminManager.editBook(bookId);
    }
}

function deleteBook(bookId) {
    if (window.adminManager) {
        window.adminManager.deleteBook(bookId);
    }
}

function deleteUser(userId) {
    if (window.adminManager) {
        window.adminManager.deleteUser(userId);
    }
}

function searchBooksAdmin() {
    if (window.adminManager) {
        window.adminManager.searchBooksAdmin();
    }
}

function searchUsersAdmin() {
    if (window.adminManager) {
        window.adminManager.searchUsersAdmin();
    }
}

function searchBorrowingsAdmin() {
    if (window.adminManager) {
        window.adminManager.searchBorrowingsAdmin();
    }
}

function searchCategoriesAdmin() {
    if (window.adminManager) {
        window.adminManager.searchCategoriesAdmin();
    }
}

// Additional global functions
function closeModal(modalId) {
    if (modalId) {
        // Đóng modal cụ thể
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    } else {
        // Đóng tất cả modal
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }
}

// Thêm event listener để đóng modal khi click overlay
document.addEventListener('DOMContentLoaded', function() {
    // Đóng modal khi click overlay
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            e.target.classList.remove('show');
        }
    });
    
    // Đóng modal khi nhấn ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                    modal.classList.remove('show');
                }
            });
        }
    });
});

function searchBooks() {
    if (window.adminManager) {
        window.adminManager.searchBooks();
    }
}

function clearSearch() {
    if (window.adminManager) {
        window.adminManager.clearSearch();
    }
}

// Global functions for borrowing creation
function searchCustomer() {
    if (window.adminManager) {
        window.adminManager.searchCustomer();
    }
}

function searchBook() {
    if (window.adminManager) {
        window.adminManager.searchBook();
    }
}

// Global functions for category management
function showAddCategoryModal() {
    if (window.adminManager) {
        const modal = document.getElementById('categoryFormModal');
        const form = document.getElementById('categoryForm');
        const title = document.getElementById('categoryFormTitle');
        
        if (modal && form && title) {
            title.textContent = 'Thêm thể loại mới';
            form.reset();
            delete form.dataset.editId;
            modal.style.display = 'block';
        }
    }
}

function editCategory(categoryId) {
    if (window.adminManager) {
        window.adminManager.editCategory(categoryId);
    }
}

function deleteCategory(categoryId) {
    if (window.adminManager) {
        window.adminManager.deleteCategory(categoryId);
    }
}

// Global function for updating expected return date
function updateExpectedReturnDate() {
    if (window.adminManager) {
        window.adminManager.updateExpectedReturnDate();
    }
}

// Global function for logout
function logout() {
    if (window.adminManager) {
        window.adminManager.logout();
    }
}
