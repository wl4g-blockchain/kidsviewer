#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting unified development mode...');
console.log('📱 Frontend: http://localhost:5173');
console.log('🔧 Backend API: http://localhost:3000');

// Start Next.js backend
const nextProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..', 'server', 'next-kidsviewer'),
    stdio: 'pipe',
    shell: true
});

// Start Vite frontend
const viteProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true
});

// Handle Next.js output
nextProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
});

nextProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
});

// Handle Vite output
viteProcess.stdout.on('data', (data) => {
    console.log(`[Frontend] ${data.toString().trim()}`);
});

viteProcess.stderr.on('data', (data) => {
    console.error(`[Frontend Error] ${data.toString().trim()}`);
});

// Handle process exit
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development servers...');
    nextProcess.kill('SIGINT');
    viteProcess.kill('SIGINT');
    process.exit(0);
});

// Handle process errors
nextProcess.on('error', (err) => {
    console.error('Backend process error:', err);
});

viteProcess.on('error', (err) => {
    console.error('Frontend process error:', err);
});

// Wait for both processes to be ready
let backendReady = false;
let frontendReady = false;

nextProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Ready') && !backendReady) {
        backendReady = true;
        console.log('✅ Backend server is ready!');
    }
});

viteProcess.stdout.on('data', (data) => {
    if (data.toString().includes('Local:') && !frontendReady) {
        frontendReady = true;
        console.log('✅ Frontend server is ready!');
    }
});
