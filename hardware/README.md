# Hardware Components

This directory contains all hardware-related components for the EasyGas Smart Home LPG Management system.

## 📡 Sensors (`/sensors/`)

### LPG Level Sensors
- **Load Cell Based Measurement**: Precisely monitors gas cylinder weight
- **Wireless Transmission**: WiFi/Bluetooth connectivity for data transmission
- **Low Power Design**: Battery-powered with sleep modes for extended operation
- **Weather Resistant**: IP65-rated enclosures for outdoor installations

### Gas Leak Detection
- **Multi-Gas Detection**: MQ-2, MQ-6 sensors for LPG leak detection
- **Fast Response**: Sub-second detection and alert capabilities
- **Calibration Tools**: Self-calibrating sensors with baseline adjustment
- **Safety Shutoff**: Integration with automatic valve control systems

### Environmental Monitoring
- **Temperature Sensors**: DS18B20 for ambient temperature monitoring
- **Pressure Sensors**: BMP280 for atmospheric pressure tracking
- **Humidity Sensors**: DHT22 for environmental condition monitoring

## 🖥️ Controllers (`/controllers/`)

### ESP32 Main Controller
- **WiFi Connectivity**: 802.11 b/g/n support for cloud connectivity
- **Bluetooth**: BLE for mobile app pairing and local communication
- **Multi-Sensor Support**: Up to 8 analog and 16 digital sensor inputs
- **Real-time Processing**: FreeRTOS-based multitasking for concurrent operations

### Arduino Nano (Secondary Controllers)
- **Low-Cost Sensors**: Simple sensor nodes for distributed monitoring
- **Battery Powered**: Ultra-low power modes for long-term deployment
- **Mesh Networking**: RF24 modules for sensor mesh networks
- **Backup Systems**: Redundant monitoring for critical applications

## ⚡ Power Management
- **Solar Charging**: Optional solar panels for continuous operation
- **Battery Monitoring**: Real-time battery level tracking and alerts
- **Power Optimization**: Dynamic frequency scaling and sleep modes
- **Backup Power**: UPS integration for critical safety systems

## 🔧 Communication Protocols
- **MQTT**: Primary protocol for IoT data transmission
- **HTTP/HTTPS**: REST API communication with backend services
- **LoRaWAN**: Long-range communication for remote installations
- **RF24**: Local mesh networking between sensor nodes

## 🛡️ Safety Features
- **Emergency Shutoff**: Automatic valve control in leak detection
- **Redundant Monitoring**: Multiple sensors for critical measurements
- **Failsafe Design**: Safe defaults in case of communication loss
- **Compliance**: Meets LPG industry safety standards and regulations

## 📋 Installation Guide

### Quick Setup
1. Mount load cell sensor under LPG cylinder
2. Install gas leak detector near cylinder valve
3. Configure WiFi settings via mobile app
4. Pair device with EasyGas mobile application
5. Test all sensors and verify connectivity

### Advanced Configuration
- Custom sensor calibration procedures
- Mesh network setup for multiple sensors
- Integration with existing smart home systems
- Professional installation guidelines

## 🔍 Troubleshooting

Common issues and solutions for hardware components:
- Sensor calibration problems
- Connectivity issues
- Power management concerns
- Environmental interference

See individual component READMEs for detailed specifications and usage instructions.