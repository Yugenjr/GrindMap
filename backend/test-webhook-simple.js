const axios = require('axios');

// Simple webhook test without authentication
const BASE_URL = 'http://localhost:5000/api';

const sampleWebhookData = {
  ideType: 'vscode',
  sessionId: 'test_session_' + Date.now(),
  activityType: 'session_start',
  platform: 'leetcode',
  problemId: '1',
  timestamp: new Date().toISOString(),
  metadata: {
    language: 'javascript',
    filePath: '/problems/two-sum.js'
  }
};

async function testWebhookDirect() {
  console.log('🧪 Testing IDE Activity Webhook (Direct)...\n');

  try {
    console.log('Sending webhook data:', JSON.stringify(sampleWebhookData, null, 2));

    const response = await axios.post(
      `${BASE_URL}/websocket/webhook/ide-activity`,
      sampleWebhookData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Webhook response:', response.data);

  } catch (error) {
    console.log('❌ Webhook test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused - make sure backend server is running on port 5000');
    } else {
      console.log('Error:', error.message);
    }
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing server health...\n');

  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Server health:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Health check failed - server may not be running');
    return false;
  }
}

// Run simple tests
async function runSimpleTests() {
  console.log('🚀 Running Simple IDE Activity Webhook Tests\n');
  console.log('=' .repeat(50));

  const serverRunning = await testHealthCheck();

  if (serverRunning) {
    await testWebhookDirect();
  } else {
    console.log('\n💡 Start the backend server first:');
    console.log('   cd backend && npm start');
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Simple testing completed!');
}

// Handle command line execution
if (require.main === module) {
  runSimpleTests().catch(console.error);
}

module.exports = { runSimpleTests, sampleWebhookData };
