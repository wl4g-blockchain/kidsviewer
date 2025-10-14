#!/usr/bin/env node

/**
 * Test script to create a test user with wallet address
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUserWithWallet() {
  console.log('🧪 Creating test user with wallet address...\n');

  try {
    // Test wallet configuration
    const testWallet = {
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      chain: 'ethereum',
      chainId: 1
    };

    // Check if user already exists
    const existingUser = await prisma.sysUser.findFirst({
      where: {
        email: 'test@wallet.local'
      }
    });

    if (existingUser) {
      console.log('✅ Test user already exists, updating wallet address...');
      
      // Update user with wallet address
      await prisma.sysUser.update({
        where: { id: existingUser.id },
        data: {
          wallets: [{
            chain: testWallet.chain,
            address: testWallet.address.toLowerCase(),
            chainId: testWallet.chainId
          }]
        }
      });
      
      console.log('✅ Wallet address updated for existing user');
    } else {
      console.log('📝 Creating new test user...');
      
      // Get default tenant
      const tenant = await prisma.sysTenant.findFirst();
      
      if (!tenant) {
        throw new Error('No tenant found in database');
      }

      // Create new user with wallet address
      const newUser = await prisma.sysUser.create({
        data: {
          id: BigInt(Date.now()), // Generate a unique ID
          name: 'Test Wallet User',
          email: 'test@wallet.local',
          password: null, // No password for wallet-only user
          tenantId: tenant.id,
          userType: 1, // Parent user
          createDate: new Date(),
          updateDate: new Date(),
          wallets: [{
            chain: testWallet.chain,
            address: testWallet.address.toLowerCase(),
            chainId: testWallet.chainId
          }]
        }
      });

      console.log('✅ Test user created successfully');
      console.log(`👤 User ID: ${newUser.id}`);
      console.log(`📧 Email: ${newUser.email}`);
      console.log(`🏢 Tenant ID: ${newUser.tenantId}`);
    }

    console.log('\n🎉 Test user setup completed!');
    console.log('📋 Test wallet details:');
    console.log(`   Address: ${testWallet.address}`);
    console.log(`   Chain: ${testWallet.chain}`);
    console.log(`   Chain ID: ${testWallet.chainId}`);
    console.log(`   Private Key: ${testWallet.privateKey}`);

  } catch (error) {
    console.error('💥 Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUserWithWallet().catch(console.error);
