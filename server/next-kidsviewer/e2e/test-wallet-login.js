#!/usr/bin/env node

/**
 * Test script for wallet login functionality
 * This script tests the wallet authentication API endpoints
 */

const { ethers } = require('ethers');

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    testWallet: {
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat test account
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        chain: 'ethereum',
        chainId: 1
    }
};

/**
 * Test wallet login API
 */
async function testWalletLogin() {
    console.log('🧪 Testing wallet login functionality...\n');

    try {
        // Create a test wallet
        const wallet = new ethers.Wallet(TEST_CONFIG.testWallet.privateKey);
        console.log(`📱 Test wallet address: ${wallet.address}`);

        // Create a message to sign
        const message = `Sign this message to authenticate with KidsViewer at ${new Date().toISOString()}`;
        console.log(`📝 Message to sign: ${message}`);

        // Sign the message
        const signature = await wallet.signMessage(message);
        console.log(`✍️  Signature: ${signature}`);

        // Test wallet login API
        console.log('\n🔐 Testing wallet login API...');
        const loginResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/wallet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                address: wallet.address,
                signature: signature,
                message: message,
                chain: TEST_CONFIG.testWallet.chain,
                chainId: TEST_CONFIG.testWallet.chainId,
            }),
        });

        const loginData = await loginResponse.json();
        console.log(`📊 Login response status: ${loginResponse.status}`);
        console.log(`📊 Login response data:`, JSON.stringify(loginData, null, 2));

        if (loginData.success) {
            console.log('✅ Wallet login test passed!');
            console.log(`👤 User ID: ${loginData.user.id}`);
            console.log(`📧 User Email: ${loginData.user.email}`);
            console.log(`🏢 Tenant ID: ${loginData.user.tenantId}`);
        } else {
            console.log('❌ Wallet login test failed!');
            console.log(`🚨 Error: ${loginData.error}`);
        }

    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
    }
}

/**
 * Test email login API
 */
async function testEmailLogin() {
    console.log('\n🧪 Testing email login functionality...\n');

    try {
        const emailResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@kidsviewer.local',
                password: '123456',
            }),
        });

        const emailData = await emailResponse.json();
        console.log(`📊 Email login response status: ${emailResponse.status}`);
        console.log(`📊 Email login response data:`, JSON.stringify(emailData, null, 2));

        if (emailData.user) {
            console.log('✅ Email login test passed!');
            console.log(`👤 User ID: ${emailData.user.id}`);
            console.log(`📧 User Email: ${emailData.user.email}`);
        } else {
            console.log('❌ Email login test failed!');
            console.log(`🚨 Error: ${emailData.error || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('💥 Email login test failed with error:', error.message);
    }
}

/**
 * Test GitHub login (simulation)
 */
async function testGitHubLogin() {
    console.log('\n🧪 Testing GitHub login functionality...\n');
    console.log('ℹ️  GitHub login requires OAuth flow, skipping direct API test');
    console.log('ℹ️  To test GitHub login, visit: http://localhost:3000/login');
}

/**
 * Main test function
 */
async function runTests() {
    console.log('🚀 Starting KidsViewer Login Tests\n');
    console.log('='.repeat(50));

    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test email login first (most basic)
    await testEmailLogin();

    // Test wallet login
    await testWalletLogin();

    // Test GitHub login info
    await testGitHubLogin();

    console.log('\n' + '='.repeat(50));
    console.log('🏁 Tests completed!');
    console.log('\n📋 Manual testing instructions:');
    console.log('1. Visit http://localhost:3000/login for UI testing');
    console.log('2. Test email login with: admin@kidsviewer.local / 123456');
    console.log('3. Test wallet login by connecting a wallet');
    console.log('4. Test GitHub login by clicking GitHub button');
}

// Run tests
runTests().catch(console.error);
