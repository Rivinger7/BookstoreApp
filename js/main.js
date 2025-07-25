// Main Application Logic
class MainApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeComponents();
        this.handleScrollAnimations();
    }

    setupEventListeners() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Window scroll event for header shadow
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const visibleModal = document.querySelector('.modal.show');
                if (visibleModal) {
                    this.closeModal(visibleModal.id);
                }
            }
        });        // Handle form submissions with Enter key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                const form = e.target.closest('form');
                if (form) {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
            }
        });

        // Handle tab switching in My Books modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tabBtns = document.querySelectorAll('.tab-btn');
                const tabPanes = document.querySelectorAll('.tab-pane');
                const targetTab = e.target.dataset.tab;

                // Remove active class from all tabs and panes
                tabBtns.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));

                // Add active class to clicked tab
                e.target.classList.add('active');

                // Show corresponding tab pane
                const targetPane = document.getElementById(targetTab + 'Tab');
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            }
        });
    }

    initializeComponents() {
        // Initialize tooltips if needed
        this.initTooltips();
        
        // Initialize lazy loading for images
        this.initLazyLoading();
        
        // Check browser compatibility
        this.checkBrowserCompatibility();
    }

    initTooltips() {
        // Simple tooltip implementation
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.dataset.tooltip;
                document.body.appendChild(tooltip);

                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            });

            element.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    }

    initLazyLoading() {
        // Intersection Observer for lazy loading images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    handleScrollAnimations() {
        // Animate elements on scroll
        if ('IntersectionObserver' in window) {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, {
                threshold: 0.1
            });

            document.querySelectorAll('.feature, .stat-card, .book-card').forEach(element => {
                animationObserver.observe(element);
            });
        }
    }

    checkBrowserCompatibility() {
        // Check for required features
        const requiredFeatures = [
            'fetch',
            'Promise',
            'localStorage'
        ];

        const unsupportedFeatures = requiredFeatures.filter(feature => {
            return !(feature in window);
        });

        if (unsupportedFeatures.length > 0) {
            this.showAlert(
                'Trình duyệt của bạn không hỗ trợ một số tính năng. Vui lòng cập nhật trình duyệt.',
                'warning'
            );
        }
    }

    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    // Utility functions
    formatDate(date, format = 'dd/mm/yyyy') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        switch (format) {
            case 'dd/mm/yyyy':
                return `${day}/${month}/${year}`;
            case 'yyyy-mm-dd':
                return `${year}-${month}-${day}`;
            case 'long':
                return d.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            default:
                return `${day}/${month}/${year}`;
        }
    }

    formatCurrency(amount, currency = 'VND') {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Local storage helpers
    setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting localStorage:', error);
            return false;
        }
    }

    getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error getting localStorage:', error);
            return defaultValue;
        }
    }

    removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing localStorage:', error);
            return false;
        }
    }

    // Alert system
    showAlert(message, type = 'info', duration = 5000) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
            <button type="button" class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Insert at the top of the page
        const header = document.querySelector('.header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(alert, header.nextSibling);
        } else {
            document.body.insertBefore(alert, document.body.firstChild);
        }
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, duration);
        }
    }

    // Loading state management
    showLoading(target = 'body', message = 'Đang tải...') {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;

        // Remove existing loading
        const existingLoading = targetElement.querySelector('.loading-overlay');
        if (existingLoading) {
            existingLoading.remove();
        }

        // Create loading overlay
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${message}</span>
            </div>
        `;

        targetElement.style.position = 'relative';
        targetElement.appendChild(loading);
    }

    hideLoading(target = 'body') {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;

        const loading = targetElement.querySelector('.loading-overlay');
        if (loading) {
            loading.remove();
        }
    }

    // Form validation helpers
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    validateRequired(value) {
        return value && value.trim().length > 0;
    }

    // Network status
    checkNetworkStatus() {
        if (!navigator.onLine) {
            this.showAlert('Không có kết nối internet', 'error', 0);
        }
    }

    // Print functionality
    printPage() {
        window.print();
    }

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showAlert('Đã sao chép vào clipboard', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showAlert('Không thể sao chép', 'error');
        }
    }
}

// Initialize the main application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new MainApp();
    
    // Setup global functions after a short delay to ensure auth.js is loaded
    setTimeout(() => {
        if (typeof showProfile === 'function') {
            window.showProfile = showProfile;
        }
        if (typeof showMyBooks === 'function') {
            window.showMyBooks = showMyBooks;
        }
        if (typeof editProfile === 'function') {
            window.editProfile = editProfile;
        }
        if (typeof changePassword === 'function') {
            window.changePassword = changePassword;
        }
        if (typeof returnBook === 'function') {
            window.returnBook = returnBook;
        }
        
        console.log('Global functions setup completed');
    }, 100);
});

// Global utility functions
function closeModal(modalId) {
    window.mainApp.closeModal(modalId);
}

function showAlert(message, type = 'info') {
    window.mainApp.showAlert(message, type);
}

function formatDate(date, format) {
    return window.mainApp.formatDate(date, format);
}

function formatCurrency(amount, currency) {
    return window.mainApp.formatCurrency(amount, currency);
}

// Global functions for modal management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Global functions for authentication modals
function showLoginModal() {
    showModal('loginModal');
}

function showRegisterModal() {
    showModal('registerModal');
}

function switchToRegister() {
    closeModal('loginModal');
    showModal('registerModal');
}

function switchToLogin() {
    closeModal('registerModal');
    showModal('loginModal');
}

// Additional global functions
function logout() {
    if (window.authManager) {
        window.authManager.logout();
    }
}

function searchBooks() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) {
        // Redirect to books page with search query
        window.location.href = `books.html?search=${encodeURIComponent(searchInput.value)}`;
    } else {
        window.location.href = 'books.html';
    }
}

// Make sure all functions are available globally
window.showModal = showModal;
window.closeModal = closeModal;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.logout = logout;
window.searchBooks = searchBooks;

// Add some CSS for loading and animations
const additionalStyles = `
    <style>
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .loading-spinner {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            color: var(--primary-color);
        }

        .loading-spinner i {
            font-size: 24px;
        }

        .alert {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 1100;
        }

        .alert-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 4px;
            margin-left: 10px;
        }

        .tooltip {
            position: absolute;
            background-color: var(--dark-color);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 2000;
            pointer-events: none;
        }

        .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: var(--dark-color) transparent transparent transparent;
        }

        .header.scrolled {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .animate-in {
            animation: fadeInUp 0.6s ease forwards;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .lazy {
            opacity: 0;
            transition: opacity 0.3s;
        }

        .no-books {
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
            color: var(--text-light);
        }

        .no-books h3 {
            margin-bottom: 10px;
            color: var(--text-color);
        }

        @media (max-width: 768px) {
            .loading-overlay {
                background-color: rgba(255, 255, 255, 0.95);
            }
        }
    </style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);
