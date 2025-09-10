# EasyGas Smart Home LPG Management System - Complete Deployment Guide

## Overview
This guide will walk you through deploying your EasyGas system with real-time gas monitoring, leak detection, AI predictions, order management, and critical safety features including Twilio-powered emergency voice calls and SMS alerts.

---

## Phase 1: Twilio Account Setup & Configuration

### 1.1 Create Twilio Account
1. Go to [https://www.twilio.com](https://www.twilio.com)
2. Sign up for a free account (includes $15.50 free credit)
3. Verify your phone number
4. Complete account verification

### 1.2 Get Twilio Credentials
Once logged in to your Twilio Console:

1. **Account SID**: Found on your dashboard main page
   - Copy the "Account SID" value
   
2. **Auth Token**: Click the "Show" button next to Auth Token
   - Copy the "Auth Token" value
   
3. **Phone Number**: 
   - Go to Phone Numbers > Manage > Active numbers
   - If no number exists, go to Phone Numbers > Manage > Buy a number
   - Choose a number with Voice and SMS capabilities
   - For Kenya, select a +254 number or use international +1 number
   - Copy your Twilio phone number (format: +1234567890)

### 1.3 Configure Your Emergency Contact
- Decide which phone number should receive emergency alerts
- Format: +254XXXXXXXXX for Kenya numbers or +1XXXXXXXXXX for US numbers
- This will receive both SMS and voice calls during gas leaks

---

## Phase 2: ESP32 Hardware Setup

### 2.1 Required Components
- ESP32 Development Board
- MQ-5 Gas Sensor (for LPG detection)
- HC-SR04 Ultrasonic Sensor (for gas level measurement)
- Passive Buzzer
- LED (any color)
- Resistors (220Ω for LED, 10kΩ for pull-up if needed)
- Breadboard and jumper wires
- 5V power supply or USB power

### 2.2 Wiring Diagram
```
ESP32 Pin Connections:
├── MQ-5 Gas Sensor
│   ├── VCC → 5V
│   ├── GND → GND
│   └── A0 → GPIO 36 (A0)
├── HC-SR04 Ultrasonic Sensor  
│   ├── VCC → 5V
│   ├── GND → GND
│   ├── Trig → GPIO 2
│   └── Echo → GPIO 3
├── Status LED
│   ├── Anode → GPIO 13 (through 220Ω resistor)
│   └── Cathode → GND
└── Buzzer
    ├── Positive → GPIO 12
    └── Negative → GND
```

### 2.3 Arduino IDE Setup
1. Install Arduino IDE from [arduino.cc](https://www.arduino.cc/en/software)
2. Add ESP32 board manager:
   - File > Preferences
   - Additional Board Manager URLs: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools > Board > Boards Manager
   - Search "ESP32" and install "ESP32 by Espressif Systems"

### 2.4 Install Required Libraries
In Arduino IDE: Tools > Manage Libraries, install:
- `ArduinoJson` by Benoit Blanchon
- `ESP32` board package (if not already installed)

---

## Phase 3: Configure ESP32 Firmware

### 3.1 Update Firmware Configuration
Open `esp32_firmware.ino` and replace these values:

```cpp
// WiFi credentials
const char* ssid = "YOUR_ACTUAL_WIFI_NAME";
const char* password = "YOUR_ACTUAL_WIFI_PASSWORD";

// Supabase configuration  
const char* projectId = "YOUR_SUPABASE_PROJECT_ID";
const char* anonKey = "YOUR_SUPABASE_ANON_KEY";

// Twilio configuration
const char* twilioAccountSid = "YOUR_TWILIO_ACCOUNT_SID";
const char* twilioAuthToken = "YOUR_TWILIO_AUTH_TOKEN";
const char* twilioPhoneNumber = "YOUR_TWILIO_PHONE_NUMBER";
const char* emergencyPhoneNumber = "YOUR_EMERGENCY_PHONE_NUMBER";
```

### 3.2 Find Your Supabase Credentials
1. Go to [supabase.com](https://supabase.com) and open your project
2. Go to Settings > API
3. Copy:
   - Project URL (extract the project ID from: `https://PROJECT_ID.supabase.co`)
   - `anon` `public` key

### 3.3 Upload Firmware
1. Connect ESP32 to computer via USB
2. Select board: Tools > Board > ESP32 Dev Module
3. Select correct port: Tools > Port > (your ESP32 port)
4. Click Upload button
5. Open Serial Monitor (9600 baud) to see debug output

---

## Phase 4: Supabase Backend Deployment

### 4.1 Deploy Supabase Edge Function
Your Supabase function is already configured. To deploy:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Deploy the function:
```bash
supabase functions deploy server --project-ref YOUR_PROJECT_ID
```

### 4.2 Test Backend Connection
1. Open your web application
2. Check the "Backend Connected" status in the header
3. If showing error, check browser console for details

---

## Phase 5: Web Application Deployment

### 5.1 Deploy to Vercel (Recommended)
1. Push your code to GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign up
3. Import your GitHub repository
4. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_PROJECT_ID=your_project_id`
   - `VITE_SUPABASE_ANON_KEY=your_anon_key`
5. Deploy!

### 5.2 Alternative: Netlify Deployment
1. Build the application locally:
```bash
npm run build
```
2. Go to [netlify.com](https://netlify.com)
3. Drag and drop the `dist` folder
4. Set environment variables in Netlify dashboard

### 5.3 Local Development
```bash
npm install
npm run dev
```

---

## Phase 6: System Testing & Calibration

### 6.1 Initial System Test
1. Power on ESP32
2. Check Serial Monitor output:
   ```
   WiFi connected!
   IP address: 192.168.x.x
   EasyGas ESP32 Sensor System Initialized
   Reading sensors and sending data to Supabase...
   ```

### 6.2 Sensor Calibration
1. Ensure gas cylinder is empty or removed
2. Ensure no gas leaks present
3. In Arduino IDE, uncomment the calibration call in `setup()`:
   ```cpp
   void setup() {
     // ... existing code ...
     calibrateSensors(); // Uncomment this line
   }
   ```
4. Upload and run calibration
5. Note the readings from Serial Monitor
6. Update constants in firmware if needed
7. Comment out calibration and re-upload

### 6.3 Emergency System Test
**⚠️ SAFETY WARNING: Test in well-ventilated area**

1. **LED Test**: Normal operation should show steady LED
2. **Buzzer Test**: Should be silent during normal operation
3. **Gas Leak Simulation**: 
   - Use a small amount of LPG near sensor (SAFELY!)
   - LED should flash rapidly
   - Buzzer should sound intermittently
   - Check Serial Monitor for "GAS LEAK DETECTED!"

### 6.4 Twilio Emergency Test
**⚠️ Note: This will make actual calls and send SMS**

1. Trigger gas leak detection (safely)
2. Within 30 seconds, you should receive:
   - SMS alert with emergency message
   - Voice call with automated warning
3. Check Serial Monitor for Twilio API responses
4. If calls fail, verify Twilio credentials and phone number formats

---

## Phase 7: Production Deployment Checklist

### 7.1 Security Configuration
- [ ] Change default WiFi credentials
- [ ] Verify Supabase RLS policies are enabled
- [ ] Use environment variables for all sensitive data
- [ ] Enable HTTPS for web application

### 7.2 Hardware Installation
- [ ] Mount ESP32 in weatherproof enclosure
- [ ] Position gas sensor near gas appliances (not directly above)
- [ ] Position ultrasonic sensor on top of gas cylinder
- [ ] Ensure stable 5V power supply
- [ ] Test range of WiFi connection at installation site

### 7.3 Monitoring Setup
- [ ] Configure email notifications in Supabase
- [ ] Set up log monitoring for ESP32
- [ ] Test emergency procedures with household members
- [ ] Create emergency action plan document

### 7.4 Final Testing
- [ ] Test complete gas monitoring cycle
- [ ] Verify order placement and tracking
- [ ] Test emergency SMS and voice calls
- [ ] Confirm mobile app responsiveness
- [ ] Test system during WiFi disconnection/reconnection

---

## Phase 8: Operational Guidelines

### 8.1 Emergency Response Protocol
When gas leak is detected:
1. **Immediate**: ESP32 triggers local buzzer and LED
2. **Within 30 seconds**: SMS and voice alerts sent
3. **User action required**: 
   - Ventilate area immediately
   - Turn off gas supply at cylinder
   - Check for leak source
   - Acknowledge alert in app when safe

### 8.2 Maintenance Schedule
- **Weekly**: Check ESP32 status LED and test buzzer
- **Monthly**: Verify gas level accuracy, clean sensors
- **Quarterly**: Test emergency alert system
- **Annually**: Replace gas sensor if readings become inconsistent

### 8.3 System Monitoring
- Monitor ESP32 uptime via web dashboard
- Check Twilio credit balance monthly
- Verify Supabase function logs for errors
- Update firmware for security patches

---

## Troubleshooting Guide

### Common ESP32 Issues
**WiFi Connection Fails**
- Check SSID/password spelling
- Verify 2.4GHz network (ESP32 doesn't support 5GHz)
- Check WiFi signal strength at installation location

**Sensor Readings Inconsistent**
- Clean sensor surfaces gently
- Check wiring connections
- Recalibrate sensors
- Replace sensors if over 2 years old

**Twilio Calls/SMS Fail**
- Verify account SID and auth token
- Check phone number formats (+country code)
- Ensure sufficient Twilio account balance
- Test with Twilio Console first

### Web Application Issues
**Backend Connection Error**
- Check Supabase function deployment
- Verify environment variables
- Check browser console for CORS errors

**Data Not Updating**
- Verify ESP32 is sending data (Serial Monitor)
- Check Supabase Edge Function logs
- Test API endpoints directly

---

## Cost Estimates (Kenya)

### Hardware (One-time)
- ESP32 Development Board: KES 1,500
- MQ-5 Gas Sensor: KES 800
- Ultrasonic Sensor: KES 600
- Components (LED, buzzer, resistors): KES 300
- **Total Hardware: KES 3,200**

### Monthly Operational Costs
- Twilio SMS (estimated 2-5 per month): KES 50-125
- Twilio Voice calls (estimated 0-2 per month): KES 0-100
- Supabase (free tier sufficient for personal use): KES 0
- Internet/WiFi (existing): KES 0
- **Monthly Total: KES 50-225**

### Annual Savings
- Early leak detection prevents cylinder losses: KES 5,000+
- Predictive ordering prevents emergency purchases: KES 2,000+
- Remote monitoring saves inspection trips: KES 1,000+
- **ROI Period: 6-12 months**

---

## Support & Next Steps

### Immediate Next Steps After Deployment
1. Install and test hardware completely
2. Run 48-hour monitoring test
3. Document your specific calibration values
4. Create household emergency response plan
5. Set calendar reminders for maintenance

### Potential Future Enhancements
- Multiple gas cylinder monitoring
- Integration with smart home systems (Google Home, Alexa)
- Mobile app with push notifications
- Advanced analytics and usage patterns
- Integration with local gas suppliers' APIs
- Weather-based usage predictions

### Getting Help
- Check Serial Monitor output for ESP32 issues
- Use browser developer tools for web app debugging  
- Supabase dashboard for backend monitoring
- Twilio Console for communication testing

---

**🎉 Congratulations! Your EasyGas smart home LPG management system is now ready for deployment.**

Remember: This system enhances safety but doesn't replace proper gas safety practices. Always follow manufacturer guidelines for gas appliances and conduct regular manual safety checks.