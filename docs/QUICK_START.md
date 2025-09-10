# EasyGas Quick Start Guide

This guide will help you get started with the EasyGas Smart Home LPG Management system quickly.

## 🚀 Quick Installation

### Option 1: Hardware Kit Setup (Recommended for beginners)
If you have the EasyGas hardware kit:

1. **Unbox your kit** - You should have:
   - ESP32 controller with pre-installed firmware
   - Load cell sensor with mounting hardware
   - Gas leak detector sensor
   - Power adapter and cables
   - Quick start instruction card

2. **Mount the load cell sensor**:
   ```
   └── Place sensor under your LPG cylinder
   └── Ensure stable, level surface
   └── Connect cables to ESP32 controller
   ```

3. **Download the mobile app**:
   - iOS: Search "EasyGas" on App Store
   - Android: Search "EasyGas" on Google Play Store

4. **Setup via mobile app**:
   - Open EasyGas app
   - Tap "Add New Device"
   - Follow pairing instructions
   - Configure your WiFi settings

### Option 2: DIY Hardware Build
If you're building your own hardware:

1. **Required components**:
   - ESP32 development board
   - HX711 load cell amplifier
   - 5kg+ load cell sensor
   - MQ-6 gas sensor (optional)
   - Breadboard and jumper wires

2. **Wiring diagram**:
   ```
   ESP32          HX711 Load Cell Amplifier
   ────────       ──────────────────────────
   GPIO 4    ──── DT (Data)
   GPIO 5    ──── SCK (Clock)
   3.3V      ──── VCC
   GND       ──── GND
   ```

3. **Upload firmware**:
   ```bash
   cd hardware/controllers/
   # Edit config.h with your settings
   # Upload gas_level_monitor.ino using Arduino IDE
   ```

## 📱 Mobile App Setup

### First Time Setup
1. **Create account**: Email and password registration
2. **Device pairing**: Follow in-app instructions to connect hardware
3. **Cylinder setup**: Enter your LPG cylinder specifications
4. **Calibration**: Perform initial sensor calibration
5. **Alert configuration**: Set up notifications for low gas levels

### Key Features Overview
- **Real-time monitoring**: Live gas level display
- **Smart alerts**: Low gas and leak notifications
- **Usage tracking**: Daily/weekly/monthly consumption
- **Refill reminders**: Predictive refill scheduling
- **Emergency contacts**: One-tap emergency calling

## 🖥️ Web Dashboard (Optional)

For advanced users who want web-based monitoring:

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/Obila34/EasyGas-Smart-Home-LPG-Management.git
cd EasyGas-Smart-Home-LPG-Management

# Install backend dependencies
cd backend
npm install
cp .env.example .env  # Edit with your configuration

# Install web app dependencies
cd ../frontend/web-app
npm install

# Start services
cd ../../backend && npm run dev  # Backend on port 3000
cd ../frontend/web-app && npm start  # Web app on port 5173
```

### Cloud Deployment
For production use, consider deploying to:
- **Backend**: AWS ECS, Google Cloud Run, or DigitalOcean App Platform
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Database**: MongoDB Atlas or AWS DocumentDB

## 🔧 Configuration

### Hardware Configuration
Edit `hardware/controllers/config.h`:
```cpp
// WiFi settings
#define WIFI_SSID "YourWiFiNetwork"
#define WIFI_PASSWORD "YourPassword"

// Device identification
#define DEVICE_ID "easygas_sensor_001"

// Sensor calibration
#define EMPTY_CYLINDER_WEIGHT 15.0  // kg
#define FULL_CYLINDER_WEIGHT 29.0   // kg
```

### Mobile App Configuration
- **Notifications**: Configure push notification preferences
- **Thresholds**: Set custom alert thresholds (e.g., alert at 20% remaining)
- **Contacts**: Add emergency contact numbers
- **Units**: Choose kg/lbs, Celsius/Fahrenheit

## 📊 Understanding the Data

### Gas Level Indicators
- **Green (60-100%)**: Normal levels, no action needed
- **Orange (20-60%)**: Moderate usage, consider refill timing
- **Red (5-20%)**: Low gas, plan refill soon
- **Blinking Red (<5%)**: Critical, immediate refill needed

### Usage Patterns
The system learns your consumption patterns:
- **Daily usage**: Average gas consumption per day
- **Weekly trends**: Identify high/low usage periods
- **Seasonal patterns**: Adjust for weather-based usage changes
- **Predictive alerts**: Smart refill reminders based on usage

## 🚨 Safety Features

### Automatic Alerts
- **Low gas warnings**: Customizable threshold alerts
- **Leak detection**: Immediate notifications for gas leaks
- **Device offline**: Alerts if sensor stops communicating
- **Battery low**: Notifications for sensor battery status

### Emergency Procedures
1. **Gas leak detected**:
   - Immediate mobile notification
   - Optional SMS to emergency contacts
   - Automatic valve shutoff (if connected)
   - Safety instructions displayed in app

2. **System offline**:
   - Regular connectivity checks
   - Backup monitoring options
   - Manual override capabilities

## 🔍 Troubleshooting

### Common Issues

#### Device won't connect to WiFi
```
1. Check WiFi credentials in config.h
2. Ensure 2.4GHz network (ESP32 limitation)
3. Verify signal strength at installation location
4. Restart device by power cycling
```

#### Inaccurate gas level readings
```
1. Perform sensor calibration via mobile app
2. Check load cell mounting - must be stable
3. Verify cylinder weight specifications
4. Recalibrate with known empty/full weights
```

#### Mobile app not receiving notifications
```
1. Check notification permissions in phone settings
2. Verify internet connectivity
3. Ensure app is updated to latest version
4. Check backend service status
```

#### Web dashboard not loading
```
1. Verify backend service is running
2. Check database connectivity
3. Confirm environment variables are set
4. Review server logs for errors
```

## 📞 Support

### Getting Help
- **Documentation**: Full docs at `/docs/`
- **Issues**: GitHub Issues for bug reports
- **Community**: GitHub Discussions for questions
- **Email**: support@easygas.com (if available)

### Warranty & Safety
- Hardware components have 1-year warranty
- Software is provided as-is under MIT license
- Always follow proper LPG safety procedures
- This system supplements but doesn't replace professional inspections

## 🎯 Next Steps

### Basic Usage
1. Monitor daily gas consumption
2. Set up low-gas alerts
3. Track monthly usage patterns
4. Use predictive refill scheduling

### Advanced Features
1. Integrate with smart home systems
2. Set up multiple device monitoring
3. Configure detailed analytics and reporting
4. Implement cost optimization strategies

### Community Contributions
1. Share your hardware builds
2. Contribute to software development
3. Submit feature requests
4. Help other users in discussions

---

**Happy monitoring! 🏠⚡**

Remember: This system is designed to assist with LPG monitoring but should never replace proper safety procedures and regular professional inspections.