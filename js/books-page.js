// Books Page Management
class BooksPageManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentView = 'grid';
        this.totalItems = 0;
        this.totalPages = 0;
        this.currentFilters = {
            title: '',
            author: '',
            isbn: '',
            category: '',
            status: '',
            year: '',
            sort: 'title'
        };
        this.books = [];
        this.allBooks = []; // Cache tất cả sách từ API
        this.categories = []; // Cache categories từ API
        this.init();
    }    init() {
        this.setupEventListeners();
        this.setupModalListeners();
        this.loadCategories();
        this.loadBooks();
        this.updateViewDisplay();
    }

    setupEventListeners() {
        // Search inputs
        const searchInputs = ['searchTitle', 'searchAuthor', 'searchISBN'];
        searchInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performAdvancedSearch();
                    }
                });
            }
        });

        // Filter changes
        const filterIds = ['categoryFilter', 'statusFilter', 'yearFilter', 'sortFilter'];
        filterIds.forEach(id => {
            const filter = document.getElementById(id);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });

        // Items per page change
        const itemsPerPageSelect = document.getElementById('itemsPerPage');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', () => {
                this.changeItemsPerPage();
            });
        }
    }

    setupModalListeners() {
        // Setup modal close on outside click
        const modal = document.getElementById('quickViewModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal('quickViewModal');
                }
            });
        }
        
        // Setup ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('quickViewModal');
                if (modal && modal.style.display === 'block') {
                    closeModal('quickViewModal');
                }
            }
        });
    }

    async loadCategories() {
        try {
            console.log('Loading categories from API...');
            const result = await api.getCategories();
            console.log('Categories result:', result);
            
            let categories = [];
            
            // Xử lý response từ API
            if (result && result.success && result.categories) {
                categories = result.categories;
            } else if (result && Array.isArray(result)) {
                categories = result;
            } else {
                console.warn('Unexpected categories API response format:', result);
                categories = this.getFallbackCategories();
            }
            
            // Cache categories để sử dụng trong getCategoryName
            this.categories = categories;
            
            this.populateCategoryFilter(categories);
            
        } catch (error) {
            console.error('Error loading categories:', error);
            console.log('Using fallback categories');
            const fallbackCategories = this.getFallbackCategories();
            this.categories = fallbackCategories;
            this.populateCategoryFilter(fallbackCategories);
        }
    }

    populateCategoryFilter(categories) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;
        
        // Reset dropdown, giữ lại option "Tất cả thể loại"
        categoryFilter.innerHTML = '<option value="">Tất cả thể loại</option>';
        
        // Thêm categories từ API
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id; // Sử dụng GUID ID
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
        
        console.log('Populated category filter with', categories.length, 'categories');
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

    async loadBooks() {
        try {
            this.showLoading();
            
            // Gửi thông tin filter hiện tại lên backend để xử lý phân trang đúng
            const params = {
                page: this.currentPage,
                pageSize: this.itemsPerPage,
                // Thêm filter params nếu có
                title: this.currentFilters.title,
                author: this.currentFilters.author,
                isbn: this.currentFilters.isbn,
                category: this.currentFilters.category,
                status: this.currentFilters.status,
                sort: this.currentFilters.sort
            };

            console.log('Loading books with params:', params);

            // Sử dụng API thực tế
            let result;
            try {
                result = await api.getBooks(params);
                console.log('Books result from API:', result);
                
                // Xử lý response từ API thực tế với totalCount
                if (result && result.success && result.books) {
                    this.books = result.books; // Sách cho trang hiện tại
                    this.totalItems = result.totalCount || 0; // Tổng số sách từ API
                    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
                    console.log('API data loaded:', {
                        booksCount: this.books.length,
                        totalItems: this.totalItems,
                        totalPages: this.totalPages
                    });
                } else if (result && Array.isArray(result)) {
                    // Fallback nếu API trả về array trực tiếp
                    this.books = result;
                    this.totalItems = result.length;
                    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
                } else {
                    throw new Error('Invalid API response format');
                }
            } catch (error) {
                console.warn('API failed, using mock data:', error);
                // Fallback to frontend filtering với mock data
                result = await this.getMockBooksData(params);
                this.allBooks = result.books || [];
                this.applyFiltersAndPagination();
                console.log('Mock data loaded:', this.allBooks.length, 'books');
                return; // Exit early để không duplicate rendering
            }
            
            // Render books từ API
            this.renderBooks();
            this.renderPagination();
            this.updateResultsInfo();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading books:', error);
            // Fallback to mock data
            this.allBooks = this.getFallbackBooks();
            this.applyFiltersAndPagination();
            this.renderBooks();
            this.renderPagination();
            this.updateResultsInfo();
            this.hideLoading();
            this.showAlert('Có lỗi xảy ra khi tải danh sách sách, đang sử dụng dữ liệu mẫu', 'warning');
        }
    }

    renderBooks() {
        const container = document.getElementById('booksDisplay');
        if (!container) return;

        if (this.books.length === 0) {
            container.innerHTML = ''; // 👈 XÓA kết quả cũ
            this.showNoResults();
            return;
        }

        this.hideNoResults();

        if (this.currentView === 'grid') {
            container.innerHTML = this.books.map(book => this.renderBookCardGrid(book)).join('');
        } else {
            container.innerHTML = this.books.map(book => this.renderBookCardList(book)).join('');
        }
    }

    renderBookCardGrid(book) {
        const isAvailable = book.quantity > 0;
        const statusText = isAvailable ? 'Có sẵn' : 'Hết sách';
        const statusClass = isAvailable ? 'status-available' : 'status-borrowed';        return `
            <div class="book-card">
                <div class="book-card-image">
                    <img src="${book.image}" alt="${this.escapeHtml(book.title)}" loading="lazy" class="book-image">
                    <div class="book-overlay">
                        <button class="btn btn-outline btn-sm" onclick="showQuickView('${book.id}')">
                            <i class="fas fa-eye"></i> Xem nhanh
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="showBookDetail('${book.id}')">
                            <i class="fas fa-info-circle"></i> Chi tiết
                        </button>
                    </div>
                </div>
                <div class="book-info">
                    <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                    <p class="book-author">Tác giả: ${this.escapeHtml(book.author)}</p>
                    <div class="book-meta">
                        <span class="book-category">${this.getDisplayCategoryName(book)}</span>
                    </div>
                    <div class="book-quantity">
                        <i class="fas fa-books"></i>
                        <span>Số lượng: ${book.quantity || 0}</span>
                    </div>
                    <div class="book-status">
                        <span class="status-badge ${statusClass}">
                            ${statusText}
                        </span>
                        <div class="borrow-notice">
                            <i class="fas fa-store"></i>
                            <small>Đến cửa hàng để mượn</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderBookCardList(book) {
        const isAvailable = book.quantity > 0;
        const statusText = isAvailable ? 'Có sẵn' : 'Hết sách';
        const statusClass = isAvailable ? 'status-available' : 'status-borrowed';

        return `
            <div class="book-list-item">
                <div class="book-list-image">
                    <img src="${book.image}" alt="${book.title}" loading="lazy">
                </div>
                <div class="book-list-content">
                    <div class="book-list-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">Tác giả: ${book.author}</p>
                        <p class="book-description">${book.description}</p>
                        <div class="book-meta">
                            <span class="book-category">${this.getDisplayCategoryName(book)}</span>
                            <span class="book-isbn">ISBN: ${book.isbn}</span>
                        </div>
                        <div class="book-quantity">
                            <i class="fas fa-books"></i>
                            <span>Số lượng: ${book.quantity || 0}</span>
                        </div>
                        <div class="book-status">
                            <span class="status-badge ${statusClass}">
                                ${statusText}
                            </span>
                        </div>
                    </div>
                    <div class="book-list-actions">
                        <div class="borrow-notice">
                            <i class="fas fa-store"></i>
                            <span>Đến cửa hàng để mượn sách</span>
                        </div>
                        <button class="btn btn-outline" onclick="showBookDetail('${book.id}')">
                            <i class="fas fa-info-circle"></i> Chi tiết
                        </button>
                        <button class="btn btn-outline" onclick="showQuickView('${book.id}')">
                            <i class="fas fa-eye"></i> Xem nhanh
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    performAdvancedSearch() {
        this.currentFilters.title = document.getElementById('searchTitle')?.value || '';
        this.currentFilters.author = document.getElementById('searchAuthor')?.value || '';
        this.currentFilters.isbn = document.getElementById('searchISBN')?.value || '';
        this.currentPage = 1;
        
        console.log('performAdvancedSearch called');
        console.log('Search filters set:', this.currentFilters);
        
        // Gọi lại loadBooks() để lấy data từ API với search filters mới
        this.loadBooks();
    }

    applyFilters() {
        this.currentFilters.category = document.getElementById('categoryFilter')?.value || '';
        this.currentFilters.status = document.getElementById('statusFilter')?.value || '';
        this.currentFilters.year = document.getElementById('yearFilter')?.value || '';
        this.currentFilters.sort = document.getElementById('sortFilter')?.value || 'title';
        this.currentPage = 1;
        
        console.log('applyFilters called');
        console.log('Category filter value:', this.currentFilters.category);
        console.log('All current filters:', this.currentFilters);
        
        // Gọi lại loadBooks() để lấy data từ API với filters mới
        this.loadBooks();
    }

    applyFrontendFilters(books) {
        console.log('applyFrontendFilters called with books:', books);
        console.log('Current filters:', this.currentFilters);
        
        let filteredBooks = [...books];
        console.log('Initial filteredBooks count:', filteredBooks.length);
        
        // Filter by title
        if (this.currentFilters.title) {
            const searchTerm = this.currentFilters.title.toLowerCase();
            console.log('Filtering by title:', searchTerm);
            filteredBooks = filteredBooks.filter(book => 
                book.title.toLowerCase().includes(searchTerm)
            );
            console.log('After title filter, count:', filteredBooks.length);
        }
        
        // Filter by author
        if (this.currentFilters.author) {
            const searchTerm = this.currentFilters.author.toLowerCase();
            console.log('Filtering by author:', searchTerm);
            filteredBooks = filteredBooks.filter(book => 
                book.author.toLowerCase().includes(searchTerm)
            );
            console.log('After author filter, count:', filteredBooks.length);
        }
        
        // Filter by ISBN
        if (this.currentFilters.isbn) {
            const searchTerm = this.currentFilters.isbn.toLowerCase();
            console.log('Filtering by ISBN:', searchTerm);
            filteredBooks = filteredBooks.filter(book => 
                book.isbn && book.isbn.toLowerCase().includes(searchTerm)
            );
            console.log('After ISBN filter, count:', filteredBooks.length);
        }
        
        // Filter by category
        if (this.currentFilters.category) {
            console.log('Filtering by category:', this.currentFilters.category);
            filteredBooks = filteredBooks.filter(book => {
                // Check if book matches selected category by ID or name
                const bookCategoryId = book.categoryId || book.category;
                const bookCategoryName = book.categoryName;
                
                // Match by category ID (GUID hoặc string ID)
                if (bookCategoryId === this.currentFilters.category) {
                    return true;
                }
                
                // Match by category name (case-insensitive)
                if (bookCategoryName && bookCategoryName.toLowerCase() === this.currentFilters.category.toLowerCase()) {
                    return true;
                }
                
                // Find category by ID to get name for comparison
                const categoryObj = this.categories.find(cat => cat.id === this.currentFilters.category);
                if (categoryObj && bookCategoryName && bookCategoryName.toLowerCase() === categoryObj.name.toLowerCase()) {
                    return true;
                }
                
                return false;
            });
            console.log('After category filter, count:', filteredBooks.length);
        }
        
        // Filter by status
        if (this.currentFilters.status === 'available') {
            console.log('Filtering by status: available');
            filteredBooks = filteredBooks.filter(book => book.quantity > 0);
            console.log('After status filter, count:', filteredBooks.length);
        } else if (this.currentFilters.status === 'borrowed') {
            console.log('Filtering by status: borrowed');
            filteredBooks = filteredBooks.filter(book => book.quantity === 0);
            console.log('After status filter, count:', filteredBooks.length);
        }
        
        // Filter by year
        // if (this.currentFilters.year) {
        //     console.log('Filtering by year:', this.currentFilters.year);
        //     if (this.currentFilters.year === 'older') {
        //         filteredBooks = filteredBooks.filter(book => 
        //             book.year && parseInt(book.year) < 2020
        //         );
        //     } else {
        //         filteredBooks = filteredBooks.filter(book => 
        //             book.year && book.year.toString() === this.currentFilters.year
        //         );
        //     }
        //     console.log('After year filter, count:', filteredBooks.length);
        // }
        
        // Sort books
        if (this.currentFilters.sort) {
            console.log('Sorting by:', this.currentFilters.sort);
            filteredBooks.sort((a, b) => {
                switch (this.currentFilters.sort) {
                    case 'title':
                        return a.title.localeCompare(b.title);
                    case 'title_desc':
                        return b.title.localeCompare(a.title);
                    case 'author':
                        return a.author.localeCompare(b.author);
                    case 'author_desc':
                        return b.author.localeCompare(a.author);
                    // case 'year_desc':
                    //     return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
                    // case 'year':
                    //     return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
                    // case 'popular':
                    //     // Sắp xếp theo số lượng đã mượn (giả định)
                    //     return (b.borrowedCount || 0) - (a.borrowedCount || 0);
                    default:
                        return 0;
                }
            });
        }
        
        console.log('Final filteredBooks count:', filteredBooks.length);
        return filteredBooks;
    }

    applyFiltersAndPagination() {
        console.log('applyFiltersAndPagination called');
        console.log('allBooks:', this.allBooks);
        console.log('allBooks length:', this.allBooks.length);
        
        // Xử lý filter và sort ở frontend
        let filteredBooks = this.applyFrontendFilters(this.allBooks);
        
        // Xử lý pagination ở frontend
        this.totalItems = filteredBooks.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        console.log('Total items after filter:', this.totalItems);
        console.log('Total pages:', this.totalPages);
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.books = filteredBooks.slice(startIndex, endIndex);
        
        console.log('Final books for current page:', this.books);
        console.log('Final books count:', this.books.length);
        
        // Render và update UI
        this.renderBooks();
        this.renderPagination();
        this.updateResultsInfo();
    }

    clearAllFilters() {
        // Reset filter inputs
        const titleInput = document.getElementById('searchTitle');
        const authorInput = document.getElementById('searchAuthor');
        const isbnInput = document.getElementById('searchISBN');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        const yearFilter = document.getElementById('yearFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        if (titleInput) titleInput.value = '';
        if (authorInput) authorInput.value = '';
        if (isbnInput) isbnInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        if (yearFilter) yearFilter.value = '';
        if (sortFilter) sortFilter.value = 'title';
        
        // Reset filters object
        this.currentFilters = {
            title: '',
            author: '',
            isbn: '',
            category: '',
            status: '',
            year: '',
            sort: 'title'
        };
        
        this.currentPage = 1;
        
        console.log('clearAllFilters called, applying filters with empty criteria');
        // Gọi lại loadBooks() để lấy data từ API với filters rỗng
        this.loadBooks();
    }

    changeView(view) {
        this.currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
          // Update container classes
        const container = document.getElementById('booksDisplay');
        if (view === 'grid') {
            container.className = 'books-grid';
        } else {
            container.className = 'books-grid list-view';
        }
        
        this.renderBooks();
    }

    changeItemsPerPage() {
        const select = document.getElementById('itemsPerPage');
        if (!select) {
            console.error('itemsPerPage select element not found');
            return;
        }
        
        const newItemsPerPage = parseInt(select.value);
        console.log('changeItemsPerPage called:', {
            oldItemsPerPage: this.itemsPerPage,
            newItemsPerPage: newItemsPerPage,
            selectValue: select.value
        });
        
        this.itemsPerPage = newItemsPerPage;
        this.currentPage = 1; // Reset về trang 1 khi thay đổi pageSize
        
        // Gọi lại loadBooks() để lấy data từ API với pageSize mới
        this.loadBooks();
    }

    renderPagination() {
        const container = document.getElementById('pagination');
        const infoContainer = document.getElementById('paginationInfo');
        
        console.log('renderPagination called:', {
            container: !!container,
            totalPages: this.totalPages,
            currentPage: this.currentPage,
            totalItems: this.totalItems,
            itemsPerPage: this.itemsPerPage
        });
        
        if (!container) {
            console.error('Pagination container not found');
            return;
        }
        
        // Chỉ ẩn phân trang nếu không có dữ liệu hoặc có lỗi
        if (this.totalPages <= 1 && this.totalItems === 0) {
            container.innerHTML = '';
            if (infoContainer) infoContainer.innerHTML = '';
            return;
        }

        // Đảm bảo có ít nhất 1 trang
        if (this.totalPages < 1) {
            this.totalPages = 1;
        }

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button onclick="window.booksPageManager.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Trước
            </button>`;
        }

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button onclick="window.booksPageManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="${i === this.currentPage ? 'active' : ''}" 
                onclick="window.booksPageManager.goToPage(${i})">${i}</button>`;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
            paginationHTML += `<button onclick="window.booksPageManager.goToPage(${this.totalPages})">${this.totalPages}</button>`;
        }

        // Next button
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button onclick="window.booksPageManager.goToPage(${this.currentPage + 1})">
                Sau <i class="fas fa-chevron-right"></i>
            </button>`;
        }

        container.innerHTML = paginationHTML;
        console.log('Pagination HTML set:', paginationHTML);

        // Update pagination info
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        if (infoContainer) {
            const infoText = `Hiển thị ${startItem}-${endItem} trong tổng số ${this.totalItems} kết quả`;
            infoContainer.innerHTML = infoText;
        }
        
        // Đảm bảo pagination section luôn hiển thị
        const paginationSection = container.closest('.pagination-section');
        if (paginationSection) {
            paginationSection.style.display = 'flex';
            paginationSection.style.visibility = 'visible';
            paginationSection.style.opacity = '1';
        }
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            // Gọi lại loadBooks() để lấy data từ API cho trang mới
            this.loadBooks();
        }
    }

    updateResultsInfo() {
        const resultsCount = document.getElementById('resultsCount');
        const resultsQuery = document.getElementById('resultsQuery');
        
        if (resultsCount) {
            resultsCount.textContent = `Hiển thị ${this.totalItems} kết quả`;
        }
        
        if (resultsQuery) {
            const activeFilters = [];
            if (this.currentFilters.title) activeFilters.push(`Tiêu đề: "${this.currentFilters.title}"`);
            if (this.currentFilters.author) activeFilters.push(`Tác giả: "${this.currentFilters.author}"`);
            if (this.currentFilters.category) activeFilters.push(`Thể loại: ${this.getCategoryName(this.currentFilters.category)}`);
            if (this.currentFilters.status) activeFilters.push(`Trạng thái: ${this.currentFilters.status === 'available' ? 'Có sẵn' : 'Đã mượn'}`);
            
            resultsQuery.textContent = activeFilters.length > 0 ? ` - ${activeFilters.join(', ')}` : '';
        }
    }    updateViewDisplay() {
        const container = document.getElementById('booksDisplay');
        if (this.currentView === 'grid') {
            container.className = 'books-grid';
        } else {
            container.className = 'books-grid list-view';
        }
    }

    showLoading() {
        const loading = document.getElementById('loadingSection');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loadingSection');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showNoResults() {
        const noResults = document.getElementById('noResults');
        if (noResults) {
            noResults.style.display = 'block';
        }
    }

    hideNoResults() {
        const noResults = document.getElementById('noResults');
        if (noResults) {
            noResults.style.display = 'none';
        }
    }    renderQuickView(book) {
        const isAvailable = book.quantity > 0;
        const statusText = isAvailable ? 'Có sẵn' : 'Hết sách';
        const statusClass = isAvailable ? 'status-available' : 'status-borrowed';

        return `
            <div class="quick-view-book">
                <div class="quick-view-image">
                    <img src="${book.image}" alt="${book.title}">
                </div>
                <div class="quick-view-info">
                    <h3>${book.title}</h3>
                    <p class="author">Tác giả: ${book.author}</p>
                    <div class="book-summary">
                        <div class="summary-item">
                            <i class="fas fa-calendar"></i>
                            <span>${book.year || 'N/A'}</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-books"></i>
                            <span>${book.quantity || 0} cuốn</span>
                        </div>
                        <div class="summary-item">
                            <span class="status-badge ${statusClass}">
                                ${statusText}
                            </span>
                        </div>
                    </div>
                    <div class="quick-description">
                        <p>${book.description && book.description.length > 120 ? book.description.substring(0, 120) + '...' : book.description || 'Không có mô tả'}</p>
                    </div>
                    <div class="quick-view-actions">
                    ${isAvailable ? `
                        <button class="btn btn-primary" onclick="borrowBook('${book.id}'); closeModal('quickViewModal')">
                            <i class="fas fa-plus-circle"></i> Mượn sách
                        </button>
                    ` : `
                        <button class="btn btn-secondary" disabled>
                            <i class="fas fa-ban"></i> ${book.quantity === 0 ? 'Hết sách' : 'Không có sẵn'}
                        </button>
                    `}
                        <button class="btn btn-outline" onclick="showBookDetail('${book.id}'); closeModal('quickViewModal')">
                            <i class="fas fa-info-circle"></i> Xem chi tiết
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showAlert(message, type = 'info') {
        if (window.mainApp && window.mainApp.showAlert) {
            window.mainApp.showAlert(message, type);
        } else if (window.authManager && window.authManager.showAlert) {
            window.authManager.showAlert(message, type);
        } else {
            alert(message);
        }
    }

    getCategoryName(categoryId) {
        // Tìm category theo ID từ cache
        if (this.categories && this.categories.length > 0) {
            const category = this.categories.find(cat => cat.id === categoryId);
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

    getDisplayCategoryName(book) {
        // Ưu tiên hiển thị categoryName nếu có
        if (book.categoryName) {
            return book.categoryName;
        }
        
        // Nếu không có categoryName, thử tìm theo categoryId
        if (book.categoryId) {
            return this.getCategoryName(book.categoryId);
        }
        
        // Fallback nếu có category field khác
        if (book.category) {
            return this.getCategoryName(book.category);
        }
        
        return 'Chưa phân loại';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Function to get fallback books data when bookManager is not available
    getFallbackBooks() {
        // Tạo danh sách sách lớn để test phân trang
        const baseBooks = [
            {
                id: 1,
                title: "Tôi thấy hoa vàng trên cỏ xanh",
                author: "Nguyễn Nhật Ánh",
                category: "fiction",
                categoryId: "fiction",
                categoryName: "Tiểu thuyết",
                image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=280&h=320&fit=crop",
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
                categoryId: "business",
                categoryName: "Kinh doanh",
                image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=280&h=320&fit=crop",
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
                categoryId: "technology",
                categoryName: "Công nghệ",
                image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=280&h=320&fit=crop",
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
                categoryId: "history",
                categoryName: "Lịch sử",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=280&h=320&fit=crop",
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
                categoryId: "science",
                categoryName: "Khoa học",
                image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=280&h=320&fit=crop",
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
                categoryId: "fiction",
                categoryName: "Tiểu thuyết",
                image: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=280&h=320&fit=crop",
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
                categoryId: "science",
                categoryName: "Khoa học",
                image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=280&h=320&fit=crop",
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
                categoryId: "technology",
                categoryName: "Công nghệ",
                image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=280&h=320&fit=crop",
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
                categoryId: "business",
                categoryName: "Kinh doanh",
                image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=280&h=320&fit=crop",
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
                categoryId: "fiction",
                categoryName: "Tiểu thuyết",
                image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=280&h=320&fit=crop",
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
                categoryId: "technology",
                categoryName: "Công nghệ",
                image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=280&h=320&fit=crop",
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
                categoryId: "technology",
                categoryName: "Công nghệ",
                image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=280&h=320&fit=crop",
                available: true,
                quantity: 3,
                totalQuantity: 5,
                description: "Cuốn sách về xu hướng công nghệ và tương lai của nhân loại.",
                isbn: "978-604-2-01235-6",
                year: 2024
            }
        ];

        // Tạo thêm nhiều sách để test phân trang (tổng cộng 50 sách)
        const additionalBooks = [];
        const authors = [
            "Haruki Murakami", "J.K. Rowling", "Stephen King", "Agatha Christie", 
            "Isaac Asimov", "Terry Pratchett", "Neil Gaiman", "Margaret Atwood",
            "Philip K. Dick", "Ursula K. Le Guin", "Ray Bradbury", "Arthur C. Clarke",
            "Douglas Adams", "Orson Scott Card", "Frank Herbert", "William Gibson",
            "Kurt Vonnegut", "Gabriel García Márquez", "Toni Morrison", "Maya Angelou",
            "Jane Austen", "Charles Dickens", "Mark Twain", "Ernest Hemingway",
            "F. Scott Fitzgerald", "John Steinbeck", "Harper Lee", "To Kill a Mockingbird",
            "Aldous Huxley", "Ray Bradbury", "George R.R. Martin", "J.R.R. Tolkien",
            "C.S. Lewis", "Roald Dahl", "Lewis Carroll", "Oscar Wilde",
            "Virginia Woolf", "James Joyce", "Marcel Proust", "Franz Kafka"
        ];

        const categories = ["fiction", "science", "technology", "history", "business"];
        const categoryNames = ["Tiểu thuyết", "Khoa học", "Công nghệ", "Lịch sử", "Kinh doanh"];

        for (let i = 13; i <= 50; i++) {
            const categoryIndex = Math.floor(Math.random() * categories.length);
            const author = authors[Math.floor(Math.random() * authors.length)];
            
            additionalBooks.push({
                id: i,
                title: `Sách số ${i} - ${author}`,
                author: author,
                category: categories[categoryIndex],
                categoryId: categories[categoryIndex],
                categoryName: categoryNames[categoryIndex],
                image: `https://images.unsplash.com/photo-${1500000000000 + i}?w=280&h=320&fit=crop`,
                available: Math.random() > 0.2, // 80% chance available
                quantity: Math.floor(Math.random() * 10),
                totalQuantity: Math.floor(Math.random() * 10) + 5,
                description: `Mô tả chi tiết cho sách số ${i} của tác giả ${author}.`,
                isbn: `978-604-2-${String(i).padStart(5, '0')}-${Math.floor(Math.random() * 10)}`,
                year: 2000 + Math.floor(Math.random() * 24)
            });
        }

        return [...baseBooks, ...additionalBooks];
    }

    // Mock function for demo - Remove when backend is ready
    async getMockBooksData(params = {}) {
        return new Promise(resolve => {
            setTimeout(() => {
                // Ưu tiên sử dụng data từ bookManager để đảm bảo đồng bộ với index.html
                let allBooks = [];
                if (window.bookManager && typeof window.bookManager.getSampleBooks === 'function') {
                    try {
                        allBooks = window.bookManager.getSampleBooks();
                        console.log('Using books data from bookManager:', allBooks.length, 'books');
                    } catch (error) {
                        console.warn('Error getting books from bookManager:', error);
                        allBooks = this.getFallbackBooks();
                    }
                } else {
                    console.log('bookManager not available, using fallback data');
                    allBooks = this.getFallbackBooks();
                }

                // Apply filters
                let filteredBooks = [...allBooks];

                // Filter by title
                if (params.title) {
                    filteredBooks = filteredBooks.filter(book => 
                        book.title.toLowerCase().includes(params.title.toLowerCase())
                    );
                }

                // Filter by author
                if (params.author) {
                    filteredBooks = filteredBooks.filter(book => 
                        book.author.toLowerCase().includes(params.author.toLowerCase())
                    );
                }

                // Filter by ISBN
                if (params.isbn) {
                    filteredBooks = filteredBooks.filter(book => 
                        book.isbn && book.isbn.includes(params.isbn)
                    );
                }

                // Filter by category
                if (params.category) {
                    filteredBooks = filteredBooks.filter(book => book.category === params.category);
                }

                // Filter by status
                if (params.status === 'available') {
                    filteredBooks = filteredBooks.filter(book => book.quantity > 0);
                } else if (params.status === 'borrowed') {
                    filteredBooks = filteredBooks.filter(book => book.quantity === 0);
                }

                // Filter by year
                if (params.year) {
                    if (params.year === 'older') {
                        filteredBooks = filteredBooks.filter(book => book.year && book.year < 2020);
                    } else {
                        filteredBooks = filteredBooks.filter(book => book.year && book.year.toString() === params.year);
                    }
                }

                // Sort books
                if (params.sort) {
                    switch (params.sort) {
                        case 'title':
                            filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                            break;
                        case 'title_desc':
                            filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                            break;
                        case 'author':
                            filteredBooks.sort((a, b) => a.author.localeCompare(b.author));
                            break;
                        case 'year_desc':
                            filteredBooks.sort((a, b) => (b.year || 0) - (a.year || 0));
                            break;
                        case 'year':
                            filteredBooks.sort((a, b) => (a.year || 0) - (b.year || 0));
                            break;
                        case 'popular':
                            // Sort by quantity descending as a proxy for popularity
                            filteredBooks.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
                            break;
                        default:
                            filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                    }
                }

                // Pagination
                const total = filteredBooks.length;
                const page = parseInt(params.page) || 1;
                const limit = parseInt(params.limit) || 12;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

                resolve({
                    books: paginatedBooks,
                    total: total,
                    page: page,
                    totalPages: Math.ceil(total / limit)
                });
            }, 800);
        });
    }
}

// Initialize books page manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing BooksPageManager...');
    window.booksPageManager = new BooksPageManager();
    console.log('BooksPageManager initialized:', window.booksPageManager);
});

// Global functions for HTML onclick events
function performAdvancedSearch() {
    console.log('performAdvancedSearch called');
    if (window.booksPageManager) {
        window.booksPageManager.performAdvancedSearch();
    } else {
        console.error('BooksPageManager not initialized');
    }
}

function applyFilters() {
    console.log('applyFilters called');
    if (window.booksPageManager) {
        window.booksPageManager.applyFilters();
    } else {
        console.error('BooksPageManager not initialized');
    }
}

function clearAllFilters() {
    console.log('clearAllFilters called');
    if (window.booksPageManager) {
        window.booksPageManager.clearAllFilters();
    } else {
        console.error('BooksPageManager not initialized');
    }
}

function changeView(view) {
    console.log('changeView called with:', view);
    if (window.booksPageManager) {
        window.booksPageManager.changeView(view);
    } else {
        console.error('BooksPageManager not initialized');
    }
}

function changeItemsPerPage() {
    console.log('changeItemsPerPage called');
    if (window.booksPageManager) {
        window.booksPageManager.changeItemsPerPage();
    } else {
        console.error('BooksPageManager not initialized');
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function applyFilters() {
    if (window.booksPageManager) {
        window.booksPageManager.applyFilters();
    }
}

function clearAllFilters() {
    if (window.booksPageManager) {
        window.booksPageManager.clearAllFilters();
    }
}

function changeView(view) {
    if (window.booksPageManager) {
        window.booksPageManager.changeView(view);
    }
}

function changeItemsPerPage() {
    if (window.booksPageManager) {
        window.booksPageManager.changeItemsPerPage();
    }
}

function showQuickView(bookId) {
    console.log('showQuickView called with bookId:', bookId);
    
    // Validate bookId (should be a valid GUID string)
    if (!bookId || typeof bookId !== 'string') {
        console.error('Invalid bookId:', bookId);
        alert('ID sách không hợp lệ!');
        return;
    }
    
    // Check if modal exists first
    const modal = document.getElementById('quickViewModal');
    const quickViewContent = document.getElementById('quickViewContent');
    
    if (!modal) {
        console.error('quickViewModal element not found');
        alert('Modal không tồn tại!');
        return;
    }
    
    if (!quickViewContent) {
        console.error('quickViewContent element not found');
        alert('Nội dung modal không tồn tại!');
        return;
    }
    
    // Thử nhiều cách để lấy book data
    let book = null;
    
    // Cách 1: Từ booksPageManager books list (đã load từ API)
    if (window.booksPageManager && window.booksPageManager.books) {
        book = window.booksPageManager.books.find(b => b.id === bookId);
        console.log('Book found from booksPageManager:', book);
    }
    
    // Cách 2: Từ bookManager nếu có
    if (!book && window.bookManager && typeof window.bookManager.getBookById === 'function') {
        book = window.bookManager.getBookById(bookId);
        console.log('Book found from bookManager:', book);
    }
    
    // Cách 3: Từ fallback data
    if (!book && window.booksPageManager && typeof window.booksPageManager.getFallbackBooks === 'function') {
        const fallbackBooks = window.booksPageManager.getFallbackBooks();
        book = fallbackBooks.find(b => b.id === bookId);
        console.log('Book found from fallback:', book);
    }
    
    // Cách 4: Tạo simple fallback book
    if (!book) {
        console.warn('Book not found, creating simple fallback book');
        book = {
            id: bookId,
            title: 'Sách ' + bookId,
            author: 'Tác giả không xác định',
            description: 'Mô tả chi tiết không có sẵn cho cuốn sách này.',
            image: 'https://via.placeholder.com/200x300?text=Book+' + bookId,
            category: 'other',
            year: new Date().getFullYear(),
            isbn: 'ISBN-' + bookId,
            quantity: Math.floor(Math.random() * 5) + 1,
            totalQuantity: 5,
            available: true
        };
    }
    
    try {
        console.log('Rendering quick view for book:', book);
        
        // Simple render if booksPageManager not available
        let content;
        if (window.booksPageManager && typeof window.booksPageManager.renderQuickView === 'function') {
            content = window.booksPageManager.renderQuickView(book);
        } else {            // Simple fallback rendering - ngắn gọn cho quick view
            const isAvailable = book.quantity > 0;
            const statusText = isAvailable ? 'Có sẵn' : 'Hết sách';
            const statusClass = isAvailable ? 'status-available' : 'status-borrowed';
            
            content = `
                <div class="quick-view-book">
                    <div class="quick-view-image">
                        <img src="${book.image}" alt="${book.title}">
                    </div>
                    <div class="quick-view-info">
                        <h3>${book.title}</h3>
                        <p class="author">Tác giả: ${book.author}</p>
                        <div class="book-summary">
                            <div class="summary-item">
                                <i class="fas fa-calendar"></i>
                                <span>${book.year || 'N/A'}</span>
                            </div>
                            <div class="summary-item">
                                <i class="fas fa-books"></i>
                                <span>${book.quantity || 0} cuốn</span>
                            </div>
                            <div class="summary-item">
                                <span class="status-badge ${statusClass}">
                                    ${statusText}
                                </span>
                            </div>
                        </div>
                        <div class="quick-description">
                            <p>${book.description.length > 120 ? book.description.substring(0, 120) + '...' : book.description}</p>
                        </div>
                        <div class="quick-view-actions">
                            ${isAvailable ? `
                            <button class="btn btn-primary" onclick="alert('Chức năng mượn sách sẽ được thêm'); closeModal('quickViewModal')">
                                <i class="fas fa-plus-circle"></i> Mượn sách
                            </button>
                            ` : `
                            <button class="btn btn-secondary" disabled>
                                <i class="fas fa-ban"></i> ${book.quantity === 0 ? 'Hết sách' : 'Không có sẵn'}
                            </button>
                            `}
                            <button class="btn btn-outline" onclick="showBookDetail('${book.id}'); closeModal('quickViewModal')">
                                <i class="fas fa-info-circle"></i> Xem chi tiết
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Set content
        quickViewContent.innerHTML = content;
        console.log('Quick view content set successfully');
        
        // Show modal với nhiều cách
        try {
            if (typeof showModal === 'function') {
                console.log('Using showModal function');
                showModal('quickViewModal');
            } else {
                console.log('Using direct modal display');
                // Direct modal display
                modal.style.display = 'block';
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
                
                // Add click to close
                modal.onclick = function(e) {
                    if (e.target === modal) {
                        if (typeof closeModal === 'function') {
                            closeModal('quickViewModal');
                        } else {
                            modal.style.display = 'none';
                            modal.classList.remove('show');
                            document.body.style.overflow = 'auto';
                        }
                    }
                };
            }
            console.log('Modal opened successfully');
        } catch (modalError) {
            console.error('Error opening modal:', modalError);
            alert('Có lỗi khi mở modal: ' + modalError.message);
        }
        
    } catch (error) {
        console.error('Error in showQuickView:', error);
        alert('Có lỗi khi hiển thị xem nhanh: ' + error.message);
    }
}

function showBookDetail(bookId) {
    console.log('showBookDetail called with bookId:', bookId);
    
    try {
        // Validate bookId (should be a valid GUID string)
        if (!bookId || typeof bookId !== 'string') {
            console.error('Invalid bookId:', bookId);
            alert('ID sách không hợp lệ!');
            return;
        }
    
        // Check if modal exists first
        const modal = document.getElementById('bookModal');
        const bookDetail = document.getElementById('bookDetail');
        
        if (!modal) {
            console.error('bookModal element not found');
            alert('Modal chi tiết không tồn tại!');
            return;
        }
        
        if (!bookDetail) {
            console.error('bookDetail element not found');
            alert('Nội dung chi tiết không tồn tại!');
            return;
        }
        
        // Thử lấy book data từ danh sách đã load
        let book = null;
        
        // Cách 1: Từ booksPageManager books list (ưu tiên)
        if (window.booksPageManager && window.booksPageManager.books) {
            book = window.booksPageManager.books.find(b => b.id === bookId);
            console.log('Book found from booksPageManager:', book);
        }
        
        // // Cách 2: Từ bookManager nếu có
        // if (!book && window.bookManager && typeof window.bookManager.getBookById === 'function') {
        //     book = window.bookManager.getBookById(bookId);
        //     console.log('Book found from bookManager:', book);
        // }
        
        // // Cách 3: Từ fallback data
        // if (!book && window.booksPageManager && typeof window.booksPageManager.getFallbackBooks === 'function') {
        //     const fallbackBooks = window.booksPageManager.getFallbackBooks();
        //     book = fallbackBooks.find(b => b.id === bookId);
        //     console.log('Book found from fallback:', book);
        // }
        
        // // Cách 4: Tạo fallback book
        // if (!book) {
        //     console.warn('Book not found, creating fallback book');
        //     book = {
        //         id: bookId,
        //         title: 'Sách ' + bookId,
        //         author: 'Tác giả không xác định',
        //         description: 'Mô tả chi tiết không có sẵn cho cuốn sách này. Đây là cuốn sách có ID ' + bookId + ' trong hệ thống thư viện.',
        //         image: 'https://via.placeholder.com/300x400?text=Book+' + bookId,
        //         category: 'other',
        //         year: new Date().getFullYear(),
        //         isbn: 'ISBN-' + bookId,
        //         quantity: Math.floor(Math.random() * 5) + 1,
        //         totalQuantity: 5,
        //         available: true,
        //         publisher: 'Nhà xuất bản không xác định',
        //         language: 'Tiếng Việt',
        //         pages: Math.floor(Math.random() * 300) + 100
        //     };
        // }
        
        try {
            console.log('Rendering book detail for book:', book);
        
        // Render detailed content
        const isAvailable = book.quantity > 0;
        const statusText = isAvailable ? 'Có sẵn' : 'Hết sách';
        const statusClass = isAvailable ? 'status-available' : 'status-borrowed';
        
        const content = `
            <div class="book-detail-content">
                <div class="book-detail-image">
                    <img src="${book.image}" alt="${book.title}">
                </div>
                <div class="book-detail-info">
                    
                    <div class="book-meta">
                        <p><strong>Tên sách:</strong> ${book.title}</p>
                        <p><strong>Tác giả:</strong> ${book.author}</p>
                        <p><strong>Thể loại:</strong> ${book.categoryName || 'Khác'}</p>
                        <p><strong>ISBN:</strong> ${book.isbn}</p>
                        <p><strong>Ngôn ngữ:</strong> ${book.language || 'Tiếng Việt'}</p>
                    </div>
                    <div class="book-status-detail">
                        <div class="quantity-detail">
                            <i class="fas fa-books"></i>
                            <span>Số lượng: ${book.quantity || 0} cuốn</span>
                        </div>
                        <span class="status-badge ${statusClass}">
                            ${statusText}
                        </span>
                    </div>
                    <div class="book-description">
                        <h4>Mô tả:</h4>
                        <p>${book.description}</p>
                    </div>
                    <div class="book-actions">
                        ${isAvailable ? `
                        <button class="btn btn-primary" onclick="alert('Chức năng mượn sách sẽ được thêm'); closeModal('bookModal')">
                            <i class="fas fa-plus-circle"></i> Mượn sách
                        </button>
                        ` : `
                        <button class="btn btn-secondary" disabled>
                            <i class="fas fa-ban"></i> ${book.quantity === 0 ? 'Hết sách' : 'Không có sẵn'}
                        </button>
                        `}
                        <button class="btn btn-outline" onclick="closeModal('bookModal')">
                            <i class="fas fa-times"></i> Đóng
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Set content
        bookDetail.innerHTML = content;
        console.log('Book detail content set successfully');
        
        // Show modal
        try {
            if (typeof showModal === 'function') {
                console.log('Using showModal function');
                showModal('bookModal');
            } else {
                console.log('Using direct modal display');
                modal.style.display = 'block';
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
                
                modal.onclick = function(e) {
                    if (e.target === modal) {
                        if (typeof closeModal === 'function') {
                            closeModal('bookModal');
                        } else {
                            modal.style.display = 'none';
                            modal.classList.remove('show');
                            document.body.style.overflow = 'auto';
                        }
                    }
                };
            }
            console.log('Book detail modal opened successfully');
        } catch (modalError) {
            console.error('Error opening modal:', modalError);
            alert('Có lỗi khi mở modal: ' + modalError.message);
        }
        
    } catch (error) {
        console.error('Error in showBookDetail:', error);
        alert('Có lỗi khi hiển thị chi tiết: ' + error.message);
    }
} catch (error) {
    console.error('Error in showBookDetail:', error);
    alert('Có lỗi khi hiển thị chi tiết: ' + error.message);
}
}
