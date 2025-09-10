# EasyGas Backend Services

The backend services power the EasyGas Smart Home LPG Management system, providing APIs, data processing, and business logic.

## 🏗️ Architecture Overview

### Microservices Design
- **Device Service**: Manages IoT device registration and communication
- **User Service**: Handles user authentication, authorization, and profiles  
- **Analytics Service**: Processes sensor data and generates insights
- **Notification Service**: Manages alerts, push notifications, and communications
- **Reporting Service**: Generates usage reports and historical analytics

### Technology Stack
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB for sensor data, PostgreSQL for user data
- **Caching**: Redis for session management and real-time data
- **Message Queue**: RabbitMQ for asynchronous processing
- **Authentication**: JWT tokens with OAuth 2.0 integration

## 📡 API Services (`/api/`)

### Device Management API
```javascript
// Device registration and management
POST   /api/devices/register     - Register new IoT device
GET    /api/devices/{id}         - Get device information
PUT    /api/devices/{id}         - Update device settings
DELETE /api/devices/{id}         - Remove device
GET    /api/devices/{id}/status  - Get real-time device status
```

### User Management API
```javascript
// User authentication and profiles
POST   /api/auth/login          - User login
POST   /api/auth/register       - User registration
GET    /api/users/profile       - Get user profile
PUT    /api/users/profile       - Update user profile
POST   /api/users/devices       - Link device to user account
```

### Sensor Data API
```javascript
// Real-time and historical sensor data
POST   /api/sensors/data        - Receive sensor data from devices
GET    /api/sensors/{id}/latest - Get latest sensor readings
GET    /api/sensors/{id}/history - Get historical data
GET    /api/sensors/analytics    - Get processed analytics data
```

### Alert Management API
```javascript
// Alert configuration and management
GET    /api/alerts              - Get user alerts
POST   /api/alerts              - Create new alert rule
PUT    /api/alerts/{id}         - Update alert rule
DELETE /api/alerts/{id}         - Delete alert rule
POST   /api/alerts/{id}/test    - Test alert configuration
```

## 💾 Database (`/database/`)

### MongoDB (Sensor Data)
```javascript
// Sensor readings collection
{
  _id: ObjectId,
  deviceId: String,
  timestamp: Date,
  sensorType: String, // 'gas_level', 'leak_detector', 'temperature'
  value: Number,
  unit: String,
  status: String, // 'normal', 'warning', 'critical'
  location: {
    latitude: Number,
    longitude: Number
  }
}

// Device metadata collection
{
  _id: ObjectId,
  deviceId: String,
  userId: ObjectId,
  deviceType: String,
  firmwareVersion: String,
  lastSeen: Date,
  configuration: Object,
  isActive: Boolean
}
```

### PostgreSQL (User Data)
```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert rules table
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    device_id VARCHAR(100),
    alert_type VARCHAR(50), -- 'low_gas', 'leak_detected', 'device_offline'
    threshold_value DECIMAL(10,2),
    notification_methods JSON, -- ['push', 'email', 'sms']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## ⚙️ Services (`/services/`)

### Analytics Engine
```javascript
// Gas consumption prediction
class ConsumptionAnalytics {
    // Analyze usage patterns
    analyzeUsagePatterns(deviceId, timeRange)
    
    // Predict next refill date
    predictRefillDate(deviceId, currentLevel)
    
    // Calculate cost optimization suggestions
    generateCostOptimizationTips(userId, consumptionData)
    
    // Anomaly detection in usage patterns
    detectUsageAnomalies(deviceId, recentData)
}
```

### Notification Engine
```javascript
// Multi-channel notification service
class NotificationService {
    // Send push notification to mobile app
    sendPushNotification(userId, message, data)
    
    // Send email notification
    sendEmailNotification(email, subject, templateData)
    
    // Send SMS alert
    sendSMSAlert(phoneNumber, message)
    
    // Process alert rules and trigger notifications
    processAlertRules(sensorData)
}
```

### Data Processing Pipeline
```javascript
// Real-time data processing
class DataProcessor {
    // Process incoming sensor data
    processSensorData(rawData)
    
    // Apply calibration and filtering
    applySensorCalibration(deviceId, rawValue)
    
    // Store processed data
    storeProcessedData(processedData)
    
    // Trigger real-time alerts
    checkAlertConditions(processedData)
}
```

## 🔐 Security Features

### Authentication & Authorization
- JWT tokens for stateless authentication
- Role-based access control (RBAC)
- API rate limiting and throttling
- OAuth 2.0 integration for third-party logins

### Data Security
- AES-256 encryption for sensitive data
- TLS 1.3 for all API communications
- Database encryption at rest
- Regular security audits and penetration testing

### Device Security
- Device certificate-based authentication
- Encrypted MQTT communications
- Secure device provisioning
- Regular firmware update mechanisms

## 🚀 Deployment

### Docker Configuration
```dockerfile
# Multi-stage build for Node.js services
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Configuration
```bash
# Required environment variables
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secure-jwt-secret
MONGODB_URI=mongodb://mongodb:27017/easygas
POSTGRES_URI=postgresql://user:pass@postgres:5432/easygas_users
REDIS_URI=redis://redis:6379
SMTP_HOST=your-smtp-server
MQTT_BROKER_URL=mqtt://mqtt-broker:1883
```

### Kubernetes Deployment
```yaml
# Service deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: easygas-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: easygas-api
  template:
    metadata:
      labels:
        app: easygas-api
    spec:
      containers:
      - name: api
        image: easygas/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

## 📊 Monitoring & Observability

### Metrics Collection
- Application performance monitoring (APM)
- Custom business metrics tracking
- Real-time system health dashboards
- Automated alerting for system issues

### Logging
- Structured logging with Winston
- Centralized log aggregation
- Log analysis and search capabilities
- Error tracking and reporting

## 🧪 Testing

### Test Coverage
- Unit tests: 90%+ coverage required
- Integration tests for all API endpoints
- End-to-end testing with real devices
- Performance and load testing

### Testing Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load
```

This backend infrastructure ensures reliable, scalable, and secure operation of the EasyGas Smart Home LPG Management system.