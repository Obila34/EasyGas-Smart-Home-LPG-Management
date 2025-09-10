# EasyGas Examples and Demos

This directory contains practical examples, tutorials, and demonstration code for the EasyGas Smart Home LPG Management system.

## 📚 Available Examples

### 🔧 Hardware Examples
- **Basic Sensor Setup** (`/hardware/basic-setup/`): Simple gas level monitoring
- **Advanced Monitoring** (`/hardware/advanced/`): Multi-sensor setup with leak detection
- **Power Optimization** (`/hardware/low-power/`): Battery-powered deployment examples
- **Custom Calibration** (`/hardware/calibration/`): Sensor calibration procedures

### 📡 Backend Integration Examples
- **API Usage** (`/backend/api-examples/`): REST API integration samples
- **Real-time Data** (`/backend/websocket/`): WebSocket and MQTT examples
- **Data Analytics** (`/backend/analytics/`): Usage pattern analysis
- **Alert Systems** (`/backend/alerts/`): Custom notification implementations

### 🖥️ Frontend Examples
- **Dashboard Widgets** (`/frontend/widgets/`): Custom dashboard components
- **Mobile Integration** (`/frontend/mobile/`): React Native examples
- **Data Visualization** (`/frontend/charts/`): Chart and graph implementations
- **User Experience** (`/frontend/ux/`): UI/UX best practices

## 🚀 Quick Start Examples

### 1. Basic Hardware Setup

**File**: `/hardware/basic-setup/minimal_monitor.ino`
```cpp
// Minimal gas level monitor for ESP32
#include <WiFi.h>
#include <HX711.h>

#define LOADCELL_DOUT_PIN 4
#define LOADCELL_SCK_PIN 5

HX711 scale;
const char* ssid = "YourWiFi";
const char* password = "YourPassword";

void setup() {
  Serial.begin(115200);
  
  // Initialize load cell
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(-7050); // Calibration factor
  scale.tare();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected!");
}

void loop() {
  if (scale.is_ready()) {
    float weight = scale.get_units(5); // Average of 5 readings
    float gasPercentage = calculateGasLevel(weight);
    
    Serial.printf("Weight: %.2f kg, Gas: %.1f%%\n", weight, gasPercentage);
    
    // Send data to backend (simplified)
    sendDataToBackend(gasPercentage);
  }
  
  delay(10000); // Read every 10 seconds
}

float calculateGasLevel(float currentWeight) {
  const float emptyWeight = 15.0;  // kg
  const float fullWeight = 29.0;   // kg
  
  if (currentWeight <= emptyWeight) return 0.0;
  if (currentWeight >= fullWeight) return 100.0;
  
  return ((currentWeight - emptyWeight) / (fullWeight - emptyWeight)) * 100.0;
}

void sendDataToBackend(float gasLevel) {
  // HTTP POST to backend API
  // Implementation would use WiFiClient or HTTPClient library
  Serial.printf("Sending gas level: %.1f%%\n", gasLevel);
}
```

### 2. Mobile App Integration

**File**: `/frontend/mobile/quick-setup/GasMonitor.js`
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { CircularProgress } from 'react-native-circular-progress';

const GasMonitor = () => {
  const [gasLevel, setGasLevel] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState('offline');

  useEffect(() => {
    // Connect to real-time data stream
    const connectToDevice = async () => {
      try {
        // WebSocket connection to backend
        const ws = new WebSocket('wss://api.easygas.com/devices/easygas_001/stream');
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setGasLevel(data.gasLevel);
          setDeviceStatus(data.status);
          
          // Trigger alerts for low gas
          if (data.gasLevel < 15) {
            Alert.alert(
              'Low Gas Alert',
              `Gas level is ${data.gasLevel.toFixed(1)}%. Consider refilling soon.`,
              [{ text: 'OK' }]
            );
          }
        };
        
        ws.onopen = () => setDeviceStatus('online');
        ws.onclose = () => setDeviceStatus('offline');
        
      } catch (error) {
        console.error('Connection failed:', error);
      }
    };

    connectToDevice();
  }, []);

  const getGasLevelColor = (level) => {
    if (level > 50) return '#4CAF50'; // Green
    if (level > 20) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        EasyGas Monitor
      </Text>
      
      <CircularProgress
        size={200}
        width={15}
        fill={gasLevel}
        tintColor={getGasLevelColor(gasLevel)}
        backgroundColor="#E0E0E0"
        rotation={0}
      >
        {() => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold' }}>
              {gasLevel.toFixed(1)}%
            </Text>
            <Text style={{ fontSize: 16, color: '#666' }}>
              Gas Remaining
            </Text>
          </View>
        )}
      </CircularProgress>
      
      <Text style={{ 
        marginTop: 20, 
        fontSize: 16,
        color: deviceStatus === 'online' ? '#4CAF50' : '#F44336'
      }}>
        Status: {deviceStatus.toUpperCase()}
      </Text>
    </View>
  );
};

export default GasMonitor;
```

### 3. Backend API Integration

**File**: `/backend/api-examples/device-registration.js`
```javascript
// Example: Device registration and data handling
const express = require('express');
const mongoose = require('mongoose');
const mqtt = require('mqtt');

const app = express();
app.use(express.json());

// Device schema
const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  type: { type: String, enum: ['gas_monitor', 'leak_detector'] },
  configuration: {
    emptyWeight: Number,
    fullWeight: Number,
    alertThresholds: {
      low: { type: Number, default: 20 },
      critical: { type: Number, default: 5 }
    }
  },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const Device = mongoose.model('Device', DeviceSchema);

// MQTT client for receiving sensor data
const mqttClient = mqtt.connect('mqtt://broker.easygas.com:1883');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('easygas/sensors/+/data');
});

mqttClient.on('message', async (topic, message) => {
  try {
    const sensorData = JSON.parse(message.toString());
    await processSensorData(sensorData);
  } catch (error) {
    console.error('Error processing sensor data:', error);
  }
});

// API endpoint to register a new device
app.post('/api/devices/register', async (req, res) => {
  try {
    const { deviceId, name, type, configuration, userId } = req.body;
    
    const device = new Device({
      deviceId,
      name,
      type,
      configuration,
      userId
    });
    
    await device.save();
    
    res.status(201).json({
      message: 'Device registered successfully',
      device: {
        id: device._id,
        deviceId: device.deviceId,
        name: device.name,
        status: device.status
      }
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Device ID already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Process incoming sensor data
async function processSensorData(data) {
  const { deviceId, gasLevel, timestamp, status } = data;
  
  try {
    // Update device status
    const device = await Device.findOneAndUpdate(
      { deviceId },
      { 
        status: 'online',
        lastSeen: new Date(timestamp)
      },
      { new: true }
    );
    
    if (!device) {
      console.log(`Unknown device: ${deviceId}`);
      return;
    }
    
    // Store sensor reading
    await storeSensorReading(deviceId, gasLevel, timestamp);
    
    // Check for alerts
    await checkAlertConditions(device, gasLevel);
    
    console.log(`Processed data from ${deviceId}: ${gasLevel}%`);
    
  } catch (error) {
    console.error('Error processing sensor data:', error);
  }
}

async function checkAlertConditions(device, gasLevel) {
  const { alertThresholds } = device.configuration;
  
  if (gasLevel <= alertThresholds.critical) {
    await triggerAlert(device, 'critical', `Critical gas level: ${gasLevel}%`);
  } else if (gasLevel <= alertThresholds.low) {
    await triggerAlert(device, 'low', `Low gas level: ${gasLevel}%`);
  }
}

async function triggerAlert(device, level, message) {
  // Send push notification, email, etc.
  console.log(`ALERT [${level.toUpperCase()}] ${device.name}: ${message}`);
  
  // Implementation would include:
  // - Push notifications to mobile app
  // - Email notifications
  // - SMS alerts (if configured)
  // - Webhook notifications
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EasyGas Backend running on port ${PORT}`);
});
```

### 4. Web Dashboard Widget

**File**: `/frontend/widgets/GasLevelChart.js`
```javascript
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const GasLevelChart = ({ deviceId, timeRange = '7d' }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [deviceId, timeRange]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/sensors/${deviceId}/history?range=${timeRange}`
      );
      const data = await response.json();
      
      // Transform data for chart
      const chartData = data.readings.map(reading => ({
        date: new Date(reading.timestamp).toLocaleDateString(),
        gasLevel: reading.gasLevel,
        consumption: reading.dailyConsumption || 0
      }));
      
      setChartData(chartData);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading chart data...</div>;
  }

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <h3>Gas Level Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value, name) => [
              `${value}${name === 'gasLevel' ? '%' : ' kg'}`,
              name === 'gasLevel' ? 'Gas Level' : 'Daily Consumption'
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="gasLevel" 
            stroke="#2196F3" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="consumption" 
            stroke="#FF9800" 
            strokeWidth={2}
            yAxisId="right"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GasLevelChart;
```

## 🛠️ Advanced Examples

### Multi-Device Monitoring Setup
See `/examples/advanced/multi-device/` for:
- Managing multiple LPG cylinders
- Centralized monitoring dashboard
- Comparative consumption analysis
- Load balancing between cylinders

### Smart Home Integration
See `/examples/integrations/smart-home/` for:
- Home Assistant integration
- Amazon Alexa skills
- Google Home actions
- Apple HomeKit compatibility

### Commercial Deployment
See `/examples/commercial/` for:
- Restaurant/hotel multi-cylinder setups
- Fleet management for gas delivery
- Billing integration for commercial users
- Enterprise dashboard implementations

## 🧪 Testing Examples

### Hardware Testing Setup
```cpp
// /examples/testing/hardware-simulation.ino
// Hardware-in-the-loop testing setup
void runHardwareTests() {
  // Test sensor accuracy
  testSensorAccuracy();
  
  // Test communication protocols
  testMQTTConnection();
  testWiFiReliability();
  
  // Test power consumption
  measurePowerUsage();
  
  // Test environmental conditions
  testTemperatureVariation();
  testHumidityEffects();
}
```

### Load Testing Script
```javascript
// /examples/testing/load-test.js
// Simulate multiple devices sending data
const generateMockDevices = (count) => {
  const devices = [];
  for (let i = 0; i < count; i++) {
    devices.push({
      deviceId: `easygas_${i.toString().padStart(3, '0')}`,
      gasLevel: Math.random() * 100,
      location: `Location ${i}`
    });
  }
  return devices;
};

// Simulate real-time data from 100 devices
const simulateDeviceData = (devices) => {
  setInterval(() => {
    devices.forEach(device => {
      // Gradually decrease gas level
      device.gasLevel = Math.max(0, device.gasLevel - Math.random() * 0.1);
      
      // Send data to backend
      sendSensorData(device);
    });
  }, 1000);
};
```

## 📖 Tutorials

### Getting Started Tutorial
1. **Hardware Setup**: Step-by-step device assembly
2. **Software Installation**: Backend and frontend setup
3. **Device Pairing**: Connecting hardware to software
4. **First Monitoring**: Viewing real-time data
5. **Alert Configuration**: Setting up notifications

### Advanced Configuration Tutorial
1. **Custom Sensor Calibration**: Precision tuning
2. **Multi-Device Setup**: Managing multiple sensors
3. **Integration Development**: Creating custom integrations
4. **Performance Optimization**: Scaling the system
5. **Security Hardening**: Production deployment

## 🎯 Use Case Examples

### Home User Scenarios
- **Single Cylinder Monitoring**: Basic home setup
- **Backup Cylinder Management**: Managing primary and backup gas
- **Vacation Monitoring**: Remote monitoring while away
- **Family Notifications**: Multi-user alert configurations

### Commercial Scenarios
- **Restaurant Kitchen**: Multiple cooking stations
- **Hotel Operations**: Bulk gas management
- **Food Truck Fleet**: Mobile monitoring solutions
- **Catering Services**: Portable monitoring setups

## 🚀 Getting Started with Examples

1. **Choose your scenario**: Pick the example that matches your use case
2. **Follow the setup guide**: Each example includes detailed setup instructions
3. **Customize for your needs**: Adapt the code for your specific requirements
4. **Test thoroughly**: Use the provided test scripts to validate your setup
5. **Deploy confidently**: Move to production with tested configurations

Each example includes:
- Complete source code
- Setup instructions
- Configuration templates
- Testing procedures
- Troubleshooting guides

Start with the basic examples and gradually work your way up to more advanced implementations as you become familiar with the system.