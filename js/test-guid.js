// Test data với GUID để kiểm tra functions
const testGuidBooks = [
    {
        id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Test Book 1",
        author: "Test Author 1",
        description: "This is a test book with GUID ID",
        image: "https://via.placeholder.com/200x300?text=Book+1",
        category: "fiction",
        quantity: 5,
        price: 100000,
        isbn: "ISBN-TEST-001",
        year: 2024
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440002", 
        title: "Test Book 2",
        author: "Test Author 2",
        description: "Another test book with GUID ID",
        image: "https://via.placeholder.com/200x300?text=Book+2",
        category: "technology",
        quantity: 3,
        price: 150000,
        isbn: "ISBN-TEST-002",
        year: 2023
    }
];

console.log('Test GUID Books:', testGuidBooks);

// Test showBookDetail function
function testShowBookDetail() {
    const testId = "550e8400-e29b-41d4-a716-446655440001";
    console.log('Testing showBookDetail with GUID:', testId);
    
    if (typeof showBookDetail === 'function') {
        showBookDetail(testId);
    } else {
        console.error('showBookDetail function not found');
    }
}

// Test showQuickView function  
function testShowQuickView() {
    const testId = "550e8400-e29b-41d4-a716-446655440002";
    console.log('Testing showQuickView with GUID:', testId);
    
    if (typeof showQuickView === 'function') {
        showQuickView(testId);
    } else {
        console.error('showQuickView function not found');
    }
}

// Make functions available globally
window.testShowBookDetail = testShowBookDetail;
window.testShowQuickView = testShowQuickView;
window.testGuidBooks = testGuidBooks;
