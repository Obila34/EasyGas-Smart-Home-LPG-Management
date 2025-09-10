# EasyGas Testing Suite

Testing framework and examples for the EasyGas Smart Home LPG Management system.

## 🧪 Testing Overview

This directory contains comprehensive tests for all system components:

### Test Categories
- **Hardware Tests** (`/hardware/`): Sensor validation, firmware testing, and hardware simulation
- **Backend Tests** (`/backend/`): API endpoint tests, database operations, and business logic
- **Frontend Tests** (`/frontend/`): Component tests, integration tests, and E2E user flows
- **Integration Tests** (`/integration/`): Cross-component testing and system-level validation

## 🔧 Hardware Testing

### Sensor Calibration Tests
```python
# hardware/test_sensors.py
import unittest
from unittest.mock import Mock, patch
from sensors.gas_level_sensor import GasLevelSensor

class TestGasLevelSensor(unittest.TestCase):
    def setUp(self):
        self.sensor = GasLevelSensor(
            empty_weight=15.0,
            full_weight=29.0,
            calibration_factor=-7050.0
        )
    
    def test_calculate_gas_percentage_empty(self):
        """Test gas percentage calculation for empty cylinder"""
        result = self.sensor.calculate_gas_percentage(15.0)
        self.assertEqual(result, 0.0)
    
    def test_calculate_gas_percentage_full(self):
        """Test gas percentage calculation for full cylinder"""
        result = self.sensor.calculate_gas_percentage(29.0)
        self.assertEqual(result, 100.0)
    
    def test_calculate_gas_percentage_half(self):
        """Test gas percentage calculation for half-full cylinder"""
        result = self.sensor.calculate_gas_percentage(22.0)
        self.assertEqual(result, 50.0)
    
    def test_invalid_weight_values(self):
        """Test error handling for invalid weight values"""
        with self.assertRaises(ValueError):
            self.sensor.calculate_gas_percentage(-5.0)
```

### Communication Protocol Tests
```python
# hardware/test_mqtt.py
import unittest
from unittest.mock import Mock, MagicMock
from communication.mqtt_client import EasyGasMQTTClient

class TestMQTTCommunication(unittest.TestCase):
    def setUp(self):
        self.mqtt_client = EasyGasMQTTClient(
            broker="test-broker.com",
            device_id="test_device_001"
        )
    
    @patch('paho.mqtt.client.Client')
    def test_publish_sensor_data(self, mock_mqtt):
        """Test publishing sensor data via MQTT"""
        mock_client = Mock()
        mock_mqtt.return_value = mock_client
        
        sensor_data = {
            "device_id": "test_device_001",
            "gas_level": 75.5,
            "timestamp": 1234567890
        }
        
        result = self.mqtt_client.publish_sensor_data(sensor_data)
        self.assertTrue(result)
        mock_client.publish.assert_called_once()
```

## 📡 Backend API Testing

### Authentication Tests
```javascript
// backend/test/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models');

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // First registration
      await request(app).post('/api/auth/register').send(userData);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Create test user
      await User.create({
        email: 'test@example.com',
        password: 'hashedpassword123',
        firstName: 'John'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });
  });
});
```

### Device Management Tests
```javascript
// backend/test/devices.test.js
const request = require('supertest');
const app = require('../src/app');
const { generateAuthToken } = require('./helpers/auth');

describe('Device Management', () => {
  let authToken;

  beforeEach(async () => {
    authToken = await generateAuthToken();
  });

  describe('POST /api/devices/register', () => {
    it('should register a new device', async () => {
      const deviceData = {
        deviceId: 'easygas_001',
        deviceType: 'gas_monitor',
        location: 'Kitchen'
      };

      const response = await request(app)
        .post('/api/devices/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData)
        .expect(201);

      expect(response.body.device.deviceId).toBe(deviceData.deviceId);
    });
  });

  describe('GET /api/devices/:id/status', () => {
    it('should return device status', async () => {
      const response = await request(app)
        .get('/api/devices/easygas_001/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('gasLevel');
      expect(response.body).toHaveProperty('lastUpdate');
    });
  });
});
```

### Sensor Data Processing Tests
```javascript
// backend/test/data-processing.test.js
const { processSensorData } = require('../src/services/dataProcessor');
const { AlertService } = require('../src/services/alertService');

describe('Sensor Data Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processSensorData', () => {
    it('should process valid sensor data', async () => {
      const rawData = {
        deviceId: 'easygas_001',
        sensorType: 'gas_level',
        value: 75.5,
        timestamp: new Date(),
        status: 'normal'
      };

      const result = await processSensorData(rawData);
      
      expect(result.processedValue).toBeDefined();
      expect(result.alertsTriggered).toBe(false);
    });

    it('should trigger low gas alert', async () => {
      const alertSpy = jest.spyOn(AlertService, 'triggerAlert');
      
      const lowGasData = {
        deviceId: 'easygas_001',
        sensorType: 'gas_level',
        value: 8.5, // Below threshold
        timestamp: new Date()
      };

      await processSensorData(lowGasData);
      
      expect(alertSpy).toHaveBeenCalledWith(
        'low_gas',
        expect.objectContaining({
          deviceId: 'easygas_001',
          gasLevel: 8.5
        })
      );
    });
  });
});
```

## 🖥️ Frontend Testing

### React Component Tests
```javascript
// frontend/web-app/src/components/__tests__/GasLevelIndicator.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GasLevelIndicator from '../GasLevelIndicator';

describe('GasLevelIndicator', () => {
  it('renders normal gas level correctly', () => {
    render(<GasLevelIndicator level={75} />);
    
    const indicator = screen.getByTestId('gas-level-indicator');
    expect(indicator).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(indicator).toHaveClass('gas-level-normal');
  });

  it('renders low gas level with warning style', () => {
    render(<GasLevelIndicator level={15} />);
    
    const indicator = screen.getByTestId('gas-level-indicator');
    expect(indicator).toHaveClass('gas-level-low');
    expect(screen.getByText('Low Gas')).toBeInTheDocument();
  });

  it('renders critical gas level with alert style', () => {
    render(<GasLevelIndicator level={3} />);
    
    const indicator = screen.getByTestId('gas-level-indicator');
    expect(indicator).toHaveClass('gas-level-critical');
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });
});
```

### Mobile App Testing (React Native)
```javascript
// frontend/mobile-app/__tests__/Dashboard.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Dashboard from '../src/screens/Dashboard';

const mockStore = configureStore([]);

describe('Dashboard Screen', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      devices: {
        activeDevice: {
          id: 'easygas_001',
          gasLevel: 65,
          status: 'normal'
        }
      },
      alerts: {
        unreadCount: 2
      }
    });
  });

  it('displays gas level correctly', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );

    expect(getByTestId('gas-level-display')).toHaveTextContent('65%');
  });

  it('navigates to device settings on button press', () => {
    const mockNavigation = { navigate: jest.fn() };
    
    const { getByTestId } = render(
      <Provider store={store}>
        <Dashboard navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.press(getByTestId('device-settings-button'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('DeviceSettings');
  });
});
```

## 🔗 Integration Testing

### End-to-End User Flows
```javascript
// testing/e2e/user-flows.test.js
const { test, expect } = require('@playwright/test');

test.describe('EasyGas User Journey', () => {
  test('complete device setup flow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Navigate to device setup
    await page.click('[data-testid="add-device-button"]');
    await expect(page).toHaveURL('/devices/setup');

    // Device configuration
    await page.fill('[data-testid="device-name"]', 'Kitchen LPG Monitor');
    await page.selectOption('[data-testid="cylinder-type"]', '14kg-cylinder');
    await page.click('[data-testid="start-pairing"]');

    // Wait for device pairing
    await page.waitForSelector('[data-testid="pairing-success"]');
    await expect(page.locator('[data-testid="pairing-success"]')).toBeVisible();

    // Verify device appears in dashboard
    await page.click('[data-testid="continue-to-dashboard"]');
    await expect(page.locator('[data-testid="device-card"]')).toContainText('Kitchen LPG Monitor');
  });

  test('alert configuration and triggering', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Configure low gas alert
    await page.click('[data-testid="alerts-settings"]');
    await page.fill('[data-testid="low-gas-threshold"]', '20');
    await page.check('[data-testid="enable-push-notifications"]');
    await page.click('[data-testid="save-alert-settings"]');

    // Simulate low gas condition
    await page.goto('/test/simulate');
    await page.click('[data-testid="simulate-low-gas"]');

    // Verify alert appears
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="alert-notification"]')).toBeVisible();
  });
});
```

### Performance Testing
```javascript
// testing/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50, // 50 virtual users
  duration: '5m',
};

export default function() {
  // Simulate sensor data upload
  const sensorData = {
    deviceId: 'easygas_001',
    gasLevel: Math.random() * 100,
    timestamp: new Date().toISOString(),
    status: 'normal'
  };

  const response = http.post(
    'https://api.easygas.com/sensors/data',
    JSON.stringify(sensorData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    }
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

## 🚀 Running Tests

### Quick Test Commands
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test categories
npm run test:backend
npm run test:frontend
npm run test:hardware

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Performance testing
npm run test:performance
```

### Continuous Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
        MQTT_BROKER_URL: ${{ secrets.TEST_MQTT_BROKER }}
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
```

## 📊 Test Data and Mocks

### Mock Sensor Data
```json
{
  "scenarios": {
    "normal_operation": {
      "gasLevel": 65.5,
      "status": "normal",
      "batteryLevel": 85,
      "signalStrength": -45
    },
    "low_gas": {
      "gasLevel": 12.0,
      "status": "low",
      "batteryLevel": 90,
      "signalStrength": -42
    },
    "critical_gas": {
      "gasLevel": 3.5,
      "status": "critical",
      "batteryLevel": 88,
      "signalStrength": -38
    },
    "device_offline": {
      "lastSeen": "2024-01-01T10:00:00Z",
      "status": "offline"
    }
  }
}
```

This comprehensive testing suite ensures the reliability, performance, and safety of the EasyGas Smart Home LPG Management system across all components.