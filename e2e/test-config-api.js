// 测试系统配置 API
const testConfigAPI = async () => {
    try {
        console.log('🧪 Testing system configuration API...');

        // Test request with no parameters
        const response = await fetch('http://localhost:3001/api/sys/config');
        const data = await response.json();

        console.log('📊 API response status:', response.status);
        console.log('📋 API response data:', data);

        if (response.ok) {
            console.log('✅ API test successful!');
        } else {
            console.log('❌ API test failed:', data.error);
        }
    } catch (error) {
        console.error('💥 Test error:', error);
    }
};

// Wait for server to start and run test
setTimeout(testConfigAPI, 5000);
