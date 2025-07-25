// Test register function
function testRegisterAPI() {
    const testData = {
        username: "admin",
        password: "admin123", 
        confirmPassword: "admin123",
        email: "admint@gmail.com",
        fullName: "Admin"
    };
    
    console.log('Testing register with data:', testData);
    
    // Mock API call
    const api = new API();
    
    // Test the format
    console.log('Request body will be:', JSON.stringify(testData, null, 2));
    
    return testData;
}

// Test function
window.testRegisterAPI = testRegisterAPI;
