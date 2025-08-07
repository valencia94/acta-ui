#!/usr/bin/env node

// Real-time Production Monitor for ACTA-UI (ES Module version)
// Run with: node scripts/monitor-production.js

import https from 'https';
import { performance } from 'perf_hooks';

const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
const CLOUDFRONT_URL = 'https://d7t9x3j66yd8k.cloudfront.net';

console.log('🔄 ACTA-UI Production Monitor');
console.log('=============================');
console.log('Press Ctrl+C to stop monitoring\n');

async function checkEndpoint(url, name) {
  const start = performance.now();
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const duration = performance.now() - start;
      resolve({
        name,
        status: res.statusCode,
        duration,
        success: res.statusCode === 200
      });
    }).on('error', (err) => {
      const duration = performance.now() - start;
      resolve({
        name,
        status: 0,
        duration,
        success: false,
        error: err.message
      });
    });
  });
}

async function runMonitor() {
  const timestamp = new Date().toLocaleTimeString();
  
  const checks = await Promise.all([
    checkEndpoint(CLOUDFRONT_URL, 'CloudFront'),
    checkEndpoint(`${API_BASE}/health`, 'API Health'),
    checkEndpoint(`${API_BASE}/projects`, 'API Projects')
  ]);

  console.log(`\n[${timestamp}] Status Check:`);
  checks.forEach(check => {
    const statusIcon = check.success ? '✅' : '❌';
    const latency = check.duration.toFixed(0);
    console.log(`${statusIcon} ${check.name}: ${check.status} (${latency}ms) ${check.error || ''}`);
  });

  // Calculate average latency
  const avgLatency = checks.reduce((sum, check) => sum + check.duration, 0) / checks.length;
  console.log(`📊 Average latency: ${avgLatency.toFixed(0)}ms`);
}

// Run initial check
runMonitor();

// Set up monitoring interval (every 30 seconds)
setInterval(runMonitor, 30000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitoring stopped');
  process.exit(0);
});
