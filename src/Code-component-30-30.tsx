<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EasyGas Backend Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
        }
        .test-section {
            background: #2a2a2a;
            padding: 20px;
            margin: 10px 0;
            border-radius: 8px;
            border: 1px solid #444;
        }
        button {
            background: #00D4FF;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #0099cc;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .success { background: rgba(0, 255, 0, 0.2); border: 1px solid #0f0; }
        .error { background: rgba(255, 0, 0, 0.2); border: 1px solid #f00; }
        .info { background: rgba(0, 150, 255, 0.2); border: 1px solid #09f; }
        pre {
            background: #000;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <h1>🔥 EasyGas Backend Connection Test</h1>
    
    <div class="test-section">
        <h2>Backend Configuration</h2>
        <div id="config-info"></div>
    </div>

    <div class="test-section">
        <h2>Connection Tests</h2>
        <button onclick="testHealth()">Test Health Check</button>
        <button onclick="testGasLevel()">Test Gas Level</button>
        <button onclick="testLeakStatus()">Test Leak Status</button>
        <button onclick="testInitialize()">Initialize Backend</button>
        <button onclick="testAllEndpoints()">Test All Endpoints</button>
    </div>

    <div class="test-section">
        <h2>Manual Tests</h2>
        <button onclick="simulateGasLeak()">Simulate Gas Leak</button>
        <button onclick="clearGasLeak()">Clear Gas Leak</button>
        <button onclick="updateGasLevel()">Update Gas Level</button>
        <button onclick="emergencyShutoff()">Emergency Shutoff</button>
    </div>

    <div class="test-section">
        <h2>Test Results</h2>
        <div id="test-results"></div>
    </div>

    <script>
        // Configuration
        const projectId = "ovywxqfivffehtyxcody";
        const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92eXd4cWZpdmZmZWh0eXhjb2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mjc3MTMsImV4cCI6MjA3MjMwMzcxM30.AkGa4PcBL6NGZH_Kj0wcJDInK-ZhEq6zuWPX4xql6cE";
        const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-aa295c22`;

        // Display configuration
        document.getElementById('config-info').innerHTML = `
            <div class="info">
                <strong>Project ID:</strong> ${projectId}<br>
                <strong>API Base:</strong> ${API_BASE}<br>
                <strong>Anon Key:</strong> ${publicAnonKey ? 'Present' : 'Missing'}
            </div>
        `;

        // Utility function for API calls
        async function apiCall(endpoint, options = {}) {
            const url = `${API_BASE}${endpoint}`;
            const config = {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`,
                    ...options.headers,
                },
            };

            logResult(`Making request to: ${url}`, 'info');
            
            try {
                const response = await fetch(url, config);
                const data = await response.json();
                
                if (response.ok) {
                    logResult(`✅ ${endpoint} - Success`, 'success');
                    logResult(`Response: ${JSON.stringify(data, null, 2)}`, 'info');
                    return data;
                } else {
                    logResult(`❌ ${endpoint} - HTTP ${response.status}`, 'error');
                    logResult(`Error: ${JSON.stringify(data, null, 2)}`, 'error');
                    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
                }
            } catch (error) {
                logResult(`❌ ${endpoint} - Network Error`, 'error');
                logResult(`Error: ${error.message}`, 'error');
                throw error;
            }
        }

        function logResult(message, type = 'info') {
            const resultsDiv = document.getElementById('test-results');
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = `status ${type}`;
            logEntry.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
            resultsDiv.appendChild(logEntry);
            resultsDiv.scrollTop = resultsDiv.scrollHeight;
        }

        // Test functions
        async function testHealth() {
            try {
                await apiCall('/health');
            } catch (error) {
                console.error('Health check failed:', error);
            }
        }

        async function testGasLevel() {
            try {
                await apiCall('/gas-level');
            } catch (error) {
                console.error('Gas level test failed:', error);
            }
        }

        async function testLeakStatus() {
            try {
                await apiCall('/leak-status');
            } catch (error) {
                console.error('Leak status test failed:', error);
            }
        }

        async function testInitialize() {
            try {
                await apiCall('/initialize', { method: 'POST' });
            } catch (error) {
                console.error('Initialize test failed:', error);
            }
        }

        async function testAllEndpoints() {
            logResult('🚀 Starting comprehensive backend test...', 'info');
            
            const tests = [
                { name: 'Health Check', func: testHealth },
                { name: 'Initialize', func: testInitialize },
                { name: 'Gas Level', func: testGasLevel },
                { name: 'Leak Status', func: testLeakStatus }
            ];

            for (const test of tests) {
                try {
                    logResult(`Testing ${test.name}...`, 'info');
                    await test.func();
                    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
                } catch (error) {
                    logResult(`${test.name} failed: ${error.message}`, 'error');
                }
            }
            
            logResult('✅ Comprehensive test completed!', 'success');
        }

        async function simulateGasLeak() {
            try {
                await apiCall('/leak-status', {
                    method: 'POST',
                    body: JSON.stringify({ leakDetected: true })
                });
            } catch (error) {
                console.error('Simulate gas leak failed:', error);
            }
        }

        async function clearGasLeak() {
            try {
                await apiCall('/leak-status', {
                    method: 'POST',
                    body: JSON.stringify({ leakDetected: false })
                });
            } catch (error) {
                console.error('Clear gas leak failed:', error);
            }
        }

        async function updateGasLevel() {
            const newLevel = Math.random() * 100;
            try {
                await apiCall('/gas-level', {
                    method: 'POST',
                    body: JSON.stringify({ level: newLevel })
                });
            } catch (error) {
                console.error('Update gas level failed:', error);
            }
        }

        async function emergencyShutoff() {
            try {
                await apiCall('/emergency-shutoff', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'shutoff' })
                });
            } catch (error) {
                console.error('Emergency shutoff failed:', error);
            }
        }

        // Auto-run basic test on page load
        window.addEventListener('load', async () => {
            logResult('🔧 Page loaded - Running basic connectivity test...', 'info');
            try {
                await testHealth();
                logResult('🎉 Basic connectivity test completed successfully!', 'success');
            } catch (error) {
                logResult('⚠️ Basic connectivity test failed. Try the manual tests above.', 'error');
            }
        });
    </script>
</body>
</html>