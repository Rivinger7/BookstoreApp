// Books Management
class BooksManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 12;
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.books = [];
        this.allBooks = []; // Cache tất cả sách từ API
        this.totalItems = 0;
        this.totalPages = 0;
        this.filteredTotal = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadBooks();
    }

    setupEventListeners() {
        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterChange(e.target.dataset.category);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchBooks();
                }
            });
        }
    }

    async loadBooks() {
        try {
            this.showLoading();
            
            // Chỉ gửi page và pageSize lên backend
            const params = {
                page: this.currentPage,
                pageSize: this.pageSize
            };
            
            const result = await api.getBooks(params);
            console.log('Books result:', result);
            
            // Xử lý response từ API thực tế và cache vào allBooks
            if (result && Array.isArray(result)) {
                this.allBooks = result;
                this.totalItems = result.length;
            } else if (result && result.books) {
                this.allBooks = result.books;
                this.totalItems = result.totalCount || result.total || result.books.length;
            } else if (result && result.data) {
                this.allBooks = Array.isArray(result.data) ? result.data : result.data.books || [];
                this.totalItems = result.totalCount || result.total || this.allBooks.length;
            } else {
                // Fallback to mock data if API fails
                console.log('No books from API, using mock data');
                this.allBooks = await this.getMockBooks();
                this.totalItems = this.allBooks.length;
            }
            
            // Calculate total pages
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            
            // Áp dụng filter ở frontend
            this.applyFilters();
            this.renderBooks();
            this.renderPagination();
            
        } catch (error) {
            console.error('Load books error:', error);
            this.showAlert('Không thể tải danh sách sách từ server', 'error');
            
            // Fallback to mock data on error
            this.allBooks = await this.getMockBooks();
            this.totalItems = this.allBooks.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            this.applyFilters();
            this.renderBooks();
            this.renderPagination();
        } finally {
            this.hideLoading();
        }
    }

    renderBooks() {
        const booksGrid = document.getElementById('booksGrid');
        if (!booksGrid) return;

        if (this.books.length === 0) {
            booksGrid.innerHTML = `
                <div class="no-books">
                    <i class="fas fa-book-open" style="font-size: 48px; color: #cbd5e1; margin-bottom: 15px;"></i>
                    <h3>Không tìm thấy sách</h3>
                    <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
            `;
            return;
        }        const booksHTML = this.books.map(book => `
            <div class="book-card" onclick="showBookDetail('${book.id}')">
                <img src="${book.image || 'https://via.placeholder.com/280x300?text=No+Image'}" 
                     alt="${this.escapeHtml(book.title)}" class="book-image">
                <div class="book-info">
                    <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                    <p class="book-author">Tác giả: ${this.escapeHtml(book.author)}</p>
                    <p class="book-isbn">ISBN: ${book.isbn || 'N/A'}</p>
                    <div class="book-quantity">
                        <i class="fas fa-warehouse"></i>
                        <span>Số lượng: ${book.quantity || 0}</span>
                    </div>
                    <div class="book-price">
                        <i class="fas fa-tag"></i>
                        <span>${book.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price) : 'Miễn phí'}</span>
                    </div>
                    <div class="book-status">
                        <span class="status-badge ${book.quantity > 0 ? 'status-available' : 'status-borrowed'}">
                            ${book.quantity > 0 ? 'Có sẵn' : 'Hết sách'}
                        </span>
                        <div class="borrow-info">
                            <i class="fas fa-info-circle"></i>
                            <span>Đến cửa hàng để mượn sách</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        booksGrid.innerHTML = booksHTML;
    }

    applyFilters() {
        let filteredBooks = [...this.allBooks];
        
        // Filter by category
        if (this.currentFilter !== 'all') {
            filteredBooks = filteredBooks.filter(book => book.category === this.currentFilter);
        }
        
        // Filter by search
        if (this.currentSearch) {
            const search = this.currentSearch.toLowerCase();
            filteredBooks = filteredBooks.filter(book => 
                book.title.toLowerCase().includes(search) ||
                book.author.toLowerCase().includes(search)
            );
        }
        
        // Update total filtered items
        this.filteredTotal = filteredBooks.length;
        this.totalPages = Math.ceil(this.filteredTotal / this.pageSize);
        
        // Apply pagination
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.books = filteredBooks.slice(startIndex, endIndex);
    }

    handleFilterChange(category) {
        // Update filter button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        this.currentFilter = category;
        this.currentPage = 1;
        
        // Áp dụng filter ở frontend, không cần reload API
        this.applyFilters();
        this.renderBooks();
        this.renderPagination();
    }

    async searchBooks() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        this.currentSearch = searchInput.value.trim();
        this.currentPage = 1;
        
        // Áp dụng search ở frontend, không cần reload API
        this.applyFilters();
        this.renderBooks();
        this.renderPagination();
    }

    async showBookDetail(bookId) {
        try {
            console.log('showBookDetail method called with bookId:', bookId);
            console.log('Current books array:', this.books);
            
            // Validate bookId (should be a valid GUID string)
            if (!bookId || typeof bookId !== 'string') {
                console.error('Invalid bookId:', bookId);
                this.showAlert('ID sách không hợp lệ', 'error');
                return;
            }

            // Trước tiên tìm trong danh sách sách hiện tại (từ getBooks)
            let book = this.books.find(b => b.id === bookId);
            console.log('Book found in current list:', book);
            
            // Chỉ gọi API getBookById nếu không tìm thấy hoặc thiếu thông tin chi tiết
            if (!book || !book.description) {
                try {
                    console.log('Getting book detail from API for ID:', bookId);
                    book = await api.getBookById(bookId);
                    console.log('Book detail from API:', book);
                } catch (apiError) {
                    console.warn('API getBookById failed:', apiError);
                    // Nếu API fail, vẫn dùng book từ danh sách (có thể thiếu description)
                    if (!book) {
                        console.error('No book found anywhere for ID:', bookId);
                        this.showAlert('Không tìm thấy thông tin sách', 'error');
                        return;
                    }
                }
            }
            
            console.log('Final book object before render:', book);
            this.renderBookDetail(book);
            
        } catch (error) {
            console.error('Get book detail error:', error);
            this.showAlert('Không thể tải thông tin sách', 'error');
        }
    }

    getBookById(bookId) {
        // Tìm trong danh sách sách hiện tại
        let book = this.books.find(b => b.id === bookId);
        
        // Nếu không tìm thấy trong danh sách hiện tại, tìm trong sample data
        if (!book) {
            const sampleBooks = this.getSampleBooks();
            book = sampleBooks.find(b => b.id === bookId);
        }
        
        return book;
    }

    renderBookDetail(book) {
        console.log('renderBookDetail called with book:', book);
        const bookDetail = document.getElementById('bookDetail');
        console.log('bookDetail element found:', !!bookDetail);
        if (!bookDetail) {
            console.error('bookDetail element not found in DOM');
            return;
        }

        const detailHTML = `
                <div class="book-detail-image">
                    <img src="${book.book.image || 'https://via.placeholder.com/200x250?text=No+Image'}" 
                     alt="${this.escapeHtml(book.book.image)}" class="book-detail-image" style="margin-right: 20px; height: fit-content;">
                </div>
                <div class="book-detail-info">
                    <h2>${this.escapeHtml(book.book.title)}</h2>
                    <p class="book-detail-author">Tác giả: ${this.escapeHtml(book.book.author)}</p>
                    <p class="book-detail-description">
                        ${this.escapeHtml(book.description || 'Không có mô tả')}
                    </p>
                    <div class="book-detail-meta">
                        <div class="meta-item">
                            <div class="meta-label">Thể loại</div>
                            <div class="meta-value">${this.escapeHtml(this.getCategoryName(book.book.categoryName))}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">ISBN</div>
                            <div class="meta-value">${book.book.isbn || 'N/A'}</div>                        
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Số lượng</div>
                            <div class="meta-value">
                                <span class="quantity-info">
                                    <i class="fas fa-warehouse"></i>
                                    ${book.book.quantity || 0} cuốn
                                </span>
                            </div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Trạng thái</div>
                            <div class="meta-value">
                                <span class="status-badge ${book.book.quantity > 0 ? 'status-available' : 'status-borrowed'}">
                                    ${book.book.quantity > 0 ? 'Có sẵn' : 'Hết sách'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="borrow-notice">
                        <i class="fas fa-store"></i>
                        <span>Để mượn sách, vui lòng đến cửa hàng trực tiếp</span>
                        <br>
                        <small>Nhân viên sẽ hỗ trợ bạn trong việc mượn sách</small>
                    </div>
                </div>
            
        `;

        console.log('Setting bookDetail innerHTML...');
        bookDetail.innerHTML = detailHTML;
        console.log('bookDetail innerHTML set successfully');
        
        // Show modal
        const modal = document.getElementById('bookModal');
        console.log('bookModal element found:', !!modal);
        if (modal) {
            console.log('Showing modal...');
            modal.style.display = 'block';
            modal.classList.add('show');
            console.log('Modal shown successfully');
        } else {
            console.error('bookModal element not found in DOM');
        }
    }  

    showConfirmationModal(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmationModal');
            const titleEl = document.getElementById('confirmationTitle');
            const messageEl = document.getElementById('confirmationMessage');
            const confirmBtn = document.getElementById('confirmationConfirm');
            const cancelBtn = document.getElementById('confirmationCancel');

            if (!modal || !titleEl || !messageEl || !confirmBtn || !cancelBtn) {
                // Fallback: create modal dynamically if HTML modal not found
                this.showConfirmationModalDynamic(title, message, confirmText, cancelText).then(resolve);
                return;
            }

            // Set content
            titleEl.textContent = title;
            messageEl.textContent = message;
            confirmBtn.textContent = confirmText;
            cancelBtn.textContent = cancelText;

            // Show modal
            modal.style.display = 'block';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            const cleanup = () => {
                modal.style.display = 'none';
                modal.classList.remove('show');
                document.body.style.overflow = 'auto';
                confirmBtn.removeEventListener('click', confirmHandler);
                cancelBtn.removeEventListener('click', cancelHandler);
                modal.removeEventListener('click', backdropHandler);
                document.removeEventListener('keydown', escapeHandler);
            };

            const confirmHandler = () => {
                cleanup();
                resolve(true);
            };

            const cancelHandler = () => {
                cleanup();
                resolve(false);
            };

            const backdropHandler = (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            };

            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                }
            };

            // Add event listeners
            confirmBtn.addEventListener('click', confirmHandler);
            cancelBtn.addEventListener('click', cancelHandler);
            modal.addEventListener('click', backdropHandler);
            document.addEventListener('keydown', escapeHandler);
        });
    }

    showConfirmationModalDynamic(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy') {
        return new Promise((resolve) => {
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'modal show confirmation-modal';
            modal.innerHTML = `
                <div class="modal-content modal-small">
                    <div class="confirmation-content">
                        <div class="confirmation-icon">
                            <i class="fas fa-question-circle"></i>
                        </div>
                        <h3>${title}</h3>
                        <p>${message}</p>
                        <div class="confirmation-actions">
                            <button class="btn btn-outline cancel-btn">${cancelText}</button>
                            <button class="btn btn-primary confirm-btn">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            // Add to body
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';

            // Add event listeners
            const confirmBtn = modal.querySelector('.confirm-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');

            const cleanup = () => {
                document.body.removeChild(modal);
                document.body.style.overflow = 'auto';
            };

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });

            // Close on escape key
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        });
    }

    getCategoryName(categoryId) {
        // Tìm category theo ID từ cache (nếu có booksPageManager)
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showAlert(message, type = 'info') {
        // Reuse from auth manager if available
        if (window.authManager) {
            window.authManager.showAlert(message, type);
            return;
        }

        // Fallback alert implementation
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        const header = document.querySelector('.header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(alert, header.nextSibling);
        } else {
            document.body.insertBefore(alert, document.body.firstChild);
        }
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    renderPagination() {
        // For index.html, pagination is usually simpler - just "Load More" or basic pagination
        const booksSection = document.querySelector('.books-section');
        if (!booksSection) return;
        
        // Remove existing pagination
        const existingPagination = booksSection.querySelector('.pagination-container');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        // Only show pagination if we have more than one page
        if (this.totalPages <= 1) return;
        
        const paginationHTML = `
            <div class="pagination-container" style="text-align: center; margin-top: 30px;">
                <div class="pagination-info">
                    Trang ${this.currentPage} / ${this.totalPages} 
                    (${this.filteredTotal || this.totalItems} sách)
                </div>
                <div class="pagination-buttons" style="margin-top: 15px;">
                    ${this.currentPage > 1 ? `<button class="btn btn-outline" onclick="window.booksManager.goToPage(${this.currentPage - 1})">← Trước</button>` : ''}
                    ${this.currentPage < this.totalPages ? `<button class="btn btn-outline" onclick="window.booksManager.goToPage(${this.currentPage + 1})">Tiếp →</button>` : ''}
                </div>
            </div>
        `;
        
        // Insert before the "Xem tất cả sách" button
        const viewAllButton = booksSection.querySelector('.text-center');
        if (viewAllButton) {
            viewAllButton.insertAdjacentHTML('beforebegin', paginationHTML);
        } else {
            booksSection.insertAdjacentHTML('beforeend', paginationHTML);
        }
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        this.applyFilters();
        this.renderBooks();
        this.renderPagination();
        
        // Scroll to books section
        const booksGrid = document.getElementById('booksGrid');
        if (booksGrid) {
            booksGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }    // Mock functions for demo - Remove when backend is ready
    async getMockBooks() {
        return new Promise(resolve => {
            setTimeout(() => {
                const allBooks = [
                    {
                        id: 1,
                        title: "Tôi thấy hoa vàng trên cỏ xanh",
                        author: "Nguyễn Nhật Ánh",
                        category: "fiction",
                        image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=280&h=300&fit=crop",
                        available: true,
                        quantity: 5,
                        totalQuantity: 8,
                        description: "Một tác phẩm văn học nổi tiếng của Nguyễn Nhật Ánh về tuổi thơ và những kỷ niệm đẹp.",
                        isbn: "978-604-2-01234-5",
                        year: 2010
                    },
                    {
                        id: 2,
                        title: "Đắc Nhân Tâm",
                        author: "Dale Carnegie",
                        category: "business",
                        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=280&h=300&fit=crop",
                        available: false,
                        quantity: 0,
                        totalQuantity: 3,
                        description: "Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử với con người.",
                        isbn: "978-604-2-01234-6",
                        year: 1986
                    },
                    {
                        id: 3,
                        title: "Lập trình JavaScript nâng cao",
                        author: "Eloquent JavaScript",
                        category: "technology",
                        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=280&h=300&fit=crop",
                        available: true,
                        quantity: 3,
                        totalQuantity: 5,
                        description: "Hướng dẫn toàn diện về JavaScript từ cơ bản đến nâng cao.",
                        isbn: "978-604-2-01234-7",
                        year: 2020
                    },
                    {
                        id: 4,
                        title: "Lịch sử Việt Nam",
                        author: "Viện Sử học",
                        category: "history",
                        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=280&h=300&fit=crop",
                        available: true,
                        quantity: 2,
                        totalQuantity: 4,
                        description: "Tài liệu lịch sử Việt Nam từ thời cổ đại đến hiện đại.",
                        isbn: "978-604-2-01234-8",
                        year: 2019
                    },
                    {
                        id: 5,
                        title: "Vật lý đại cương",
                        author: "Halliday, Resnick",
                        category: "science",
                        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=280&h=300&fit=crop",
                        available: true,
                        quantity: 7,
                        totalQuantity: 10,
                        description: "Giáo trình vật lý đại cương cơ bản cho sinh viên.",
                        isbn: "978-604-2-01234-9",
                        year: 2018
                    },
                    {
                        id: 6,
                        title: "1984",
                        author: "George Orwell",
                        category: "fiction",
                        image: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=280&h=300&fit=crop",
                        available: false,
                        quantity: 0,
                        totalQuantity: 2,
                        description: "Tiểu thuyết kinh điển về một xã hội toàn trị trong tương lai.",
                        isbn: "978-604-2-01235-0",
                        year: 1949
                    },
                    {
                        id: 7,
                        title: "Toán học cao cấp",
                        author: "Nguyễn Văn Khải",
                        category: "science",
                        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=280&h=300&fit=crop",
                        available: true,
                        quantity: 4,
                        totalQuantity: 6,
                        description: "Giáo trình toán học cao cấp cho sinh viên kỹ thuật.",
                        isbn: "978-604-2-01235-1",
                        year: 2021
                    },
                    {
                        id: 8,
                        title: "React.js từ cơ bản đến nâng cao",
                        author: "Dan Abramov",
                        category: "technology",
                        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=280&h=300&fit=crop",
                        available: true,
                        quantity: 1,
                        totalQuantity: 3,
                        description: "Hướng dẫn học React.js từ những kiến thức cơ bản nhất.",
                        isbn: "978-604-2-01235-2",
                        year: 2022
                    },
                    {
                        id: 9,
                        title: "Kinh tế học vĩ mô",
                        author: "Gregory Mankiw",
                        category: "business",
                        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=280&h=300&fit=crop",
                        available: true,
                        quantity: 6,
                        totalQuantity: 8,
                        description: "Giáo trình kinh tế học vĩ mô cơ bản và ứng dụng.",
                        isbn: "978-604-2-01235-3",
                        year: 2020
                    },
                    {
                        id: 10,
                        title: "Chiến tranh và Hòa bình",
                        author: "Leo Tolstoy",
                        category: "fiction",
                        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=280&h=300&fit=crop",
                        available: false,
                        quantity: 0,
                        totalQuantity: 2,
                        description: "Tiểu thuyết sử thi vĩ đại của Tolstoy về cuộc chiến chống Napoleon.",
                        isbn: "978-604-2-01235-4",
                        year: 1869
                    },
                    {
                        id: 11,
                        title: "Python cho khoa học dữ liệu",
                        author: "Wes McKinney",
                        category: "technology",
                        image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=280&h=300&fit=crop",
                        available: true,
                        quantity: 8,
                        totalQuantity: 10,
                        description: "Hướng dẫn sử dụng Python cho phân tích và khoa học dữ liệu.",
                        isbn: "978-604-2-01235-5",
                        year: 2023
                    },
                    {
                        id: 12,
                        title: "Cách mạng công nghiệp 4.0",
                        author: "Klaus Schwab",
                        category: "technology",
                        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=280&h=300&fit=crop",
                        available: true,
                        quantity: 3,
                        totalQuantity: 5,
                        description: "Phân tích về cuộc cách mạng công nghiệp lần thứ tư và tác động của nó.",
                        isbn: "978-604-2-01235-6",
                        year: 2021                    }
                ];

                // Filter by category
                let filteredBooks = allBooks;
                if (this.currentFilter && this.currentFilter !== 'all') {
                    filteredBooks = allBooks.filter(book => book.category === this.currentFilter);
                }

                // Filter by search
                if (this.currentSearch) {
                    const search = this.currentSearch.toLowerCase();
                    filteredBooks = filteredBooks.filter(book => 
                        book.title.toLowerCase().includes(search) ||
                        book.author.toLowerCase().includes(search)
                    );
                }

                resolve({ books: filteredBooks });
            }, 500);
        });
    }
}

// Initialize books manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Chỉ khởi tạo books manager nếu chưa có booksPageManager (để tránh conflict)
    if (!window.booksPageManager) {
        window.booksManager = new BooksManager();
    } else {
        console.log('BooksPageManager detected, skipping BooksManager initialization');
    }
});

// Global functions for HTML onclick events
function searchBooks() {
    if (window.booksManager) {
        window.booksManager.searchBooks();
    } else {
        console.error('BooksManager not initialized');
    }
}

function showBookDetail(bookId) {
    console.log('showBookDetail called with bookId:', bookId);
    if (window.booksManager) {
        console.log('BooksManager found, calling showBookDetail');
        window.booksManager.showBookDetail(bookId);
    } else {
        console.error('BooksManager not initialized');
    }
}
