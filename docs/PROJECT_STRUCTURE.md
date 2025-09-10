# EasyGas Project Structure Guide

This document provides a comprehensive overview of the EasyGas Smart Home LPG Management system architecture and file organization.

## 📁 Directory Structure

### `/docs/` - Documentation
Contains all project documentation, guides, and specifications.

- **`api/`** - API documentation and specifications
- **`setup/`** - Installation and setup guides  
- **`hardware/`** - Hardware documentation and manuals
- **`software/`** - Software architecture and design documents

### `/hardware/` - Hardware Components
All hardware-related code, designs, and documentation.

- **`sensors/`** - Sensor modules and drivers
  - Gas level sensors (load cell based)
  - Leak detection sensors (MQ-2, MQ-6)
  - Temperature and pressure sensors
  
- **`controllers/`** - Microcontroller firmware
  - ESP32/Arduino code for IoT connectivity
  - Communication protocols (WiFi, Bluetooth, LoRa)
  - Power management and low-power modes
  
- **`schematics/`** - Circuit designs and PCB layouts
  - Schematic diagrams
  - PCB design files (KiCad/Altium)
  - Bill of Materials (BOM)

### `/backend/` - Server-Side Application
Backend services, APIs, and data processing components.

- **`api/`** - REST API endpoints and controllers
  - Device management APIs
  - User authentication and authorization
  - Data retrieval and storage APIs
  - Alert and notification services
  
- **`database/`** - Database schemas and migrations
  - MongoDB schemas for sensor data
  - PostgreSQL schemas for user data
  - Migration scripts and seed data
  
- **`services/`** - Business logic and data processing
  - Data analytics and processing engines
  - Predictive algorithms for gas consumption
  - Alert generation and management
  - Third-party integrations

### `/frontend/` - User Interfaces
Web and mobile applications for end users.

- **`web-app/`** - Web dashboard (React/Vue.js)
  - Admin dashboard for device management
  - Analytics and reporting interface
  - User management and settings
  - Real-time monitoring views
  
- **`mobile-app/`** - Mobile application (React Native/Flutter)
  - Consumer mobile app
  - Real-time notifications
  - Device pairing and setup
  - Usage tracking and alerts

### `/infrastructure/` - DevOps and Deployment
Infrastructure as Code, CI/CD pipelines, and deployment configurations.

- Docker containers and Kubernetes manifests
- AWS/Azure/GCP deployment scripts
- Monitoring and logging configurations
- Security and compliance tools

### `/testing/` - Test Suites
Comprehensive testing framework for all components.

- Unit tests for backend services
- Integration tests for API endpoints
- Hardware simulation and testing
- End-to-end testing for user flows
- Performance and load testing

### `/examples/` - Usage Examples and Demos
Sample implementations and demonstration code.

- Quick start examples
- Integration demos
- Configuration templates
- Sample data sets

### `/tools/` - Development Utilities
Development tools, scripts, and utilities.

- Build and deployment scripts
- Code generation tools
- Data migration utilities
- Development environment setup

## 🔄 Data Flow Architecture

### 1. Hardware Layer
```
[LPG Tank] → [Load Cell Sensor] → [ESP32 Controller] → [WiFi/Bluetooth]
[Gas Leak Detector] → [MQ-6 Sensor] → [Alert System]
```

### 2. Communication Layer
```
[Hardware] → [IoT Gateway] → [Cloud Services] → [APIs]
```

### 3. Application Layer
```
[Backend APIs] → [Database] → [Analytics Engine] → [Frontend Apps]
```

### 4. User Layer
```
[Mobile App] ← [Push Notifications] ← [Alert System]
[Web Dashboard] ← [Real-time Updates] ← [WebSocket/SSE]
```

## 🏗️ Component Relationships

### Core Components
1. **Sensor Network**: Hardware sensors collecting real-time data
2. **IoT Gateway**: ESP32-based controllers for data transmission
3. **Backend Services**: Data processing, storage, and API services
4. **User Applications**: Mobile and web interfaces for monitoring
5. **Analytics Engine**: AI/ML models for predictive insights

### Integration Points
- **Hardware ↔ Backend**: MQTT/HTTP protocols for sensor data
- **Backend ↔ Frontend**: REST APIs and WebSocket connections
- **Mobile ↔ Cloud**: Push notifications and real-time sync
- **Third-party**: Integration with smart home systems (Alexa, Google Home)

## 📱 Application Workflows

### Device Registration Flow
1. Hardware device broadcasts pairing signal
2. Mobile app detects and connects to device
3. User configures device settings via app
4. Device registers with backend services
5. Monitoring begins automatically

### Alert Generation Flow
1. Sensor detects anomaly (low gas/leak)
2. Controller processes and validates data
3. Alert sent to backend via secure channel
4. Backend triggers notification services
5. Push notification sent to mobile app
6. Email/SMS alerts sent if configured

### Data Analytics Flow
1. Continuous sensor data collection
2. Real-time data streaming to analytics engine
3. ML models process consumption patterns
4. Predictive insights generated
5. Recommendations sent to user applications

## 🔧 Development Guidelines

### Coding Standards
- Use ESLint/Prettier for JavaScript/TypeScript
- Follow PEP 8 for Python code
- Use consistent naming conventions
- Document all public APIs

### Version Control
- Use feature branches for development
- Require pull request reviews
- Maintain semantic versioning
- Tag releases appropriately

### Testing Requirements
- Minimum 80% code coverage
- Unit tests for all business logic
- Integration tests for API endpoints
- End-to-end tests for critical workflows

### Security Considerations
- Encrypt all data in transit and at rest
- Implement OAuth 2.0 for authentication
- Regular security audits and penetration testing
- Follow OWASP security guidelines

## 🚀 Deployment Strategy

### Development Environment
- Local development with Docker Compose
- Mock hardware simulators for testing
- Local databases and services

### Staging Environment
- Cloud-based deployment (AWS/Azure)
- Production-like data and configurations
- Automated testing and validation

### Production Environment
- Highly available cloud deployment
- Auto-scaling and load balancing
- Comprehensive monitoring and alerting
- Disaster recovery and backup systems

This structure ensures scalability, maintainability, and clear separation of concerns across all project components.