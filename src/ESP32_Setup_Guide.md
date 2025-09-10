# EasyGas ESP32 Hardware Integration Guide

## Overview
This guide will help you set up your ESP32 to work with your EasyGas web application for real-time LPG monitoring.

## Required Components

### Hardware
- **ESP32 Development Board** (ESP32 DevKit or similar)
- **MQ-5 Gas Sensor** (for LPG leak detection)
- **HC-SR04 Ultrasonic Sensor** (for gas level measurement)
- **LED** (status indicator)
- **Buzzer** (emergency alarm)
- **Resistors**: 220Ω (for LED), 10kΩ (pull-up if needed)
- **Breadboard and jumper wires**
- **Power supply** (5V/3.3V)

### Software
- **Arduino IDE** with ESP32 board support
- **Required Libraries**:
  - WiFi (built-in)
  - HTTPClient (built-in) 
  - ArduinoJson (install via Library Manager)

## Wiring Diagram

```
ESP32 Development Board Connections:

Gas Level Sensor (HC-SR04):
├── VCC → 5V (or 3.3V)
├── GND → GND
├── Trig → GPIO 2
└── Echo → GPIO 3

Gas Leak Sensor (MQ-5):
├── VCC → 5V
├── GND → GND
└── AO → GPIO A0 (ADC pin)

Status LED:
├── Anode → GPIO 13 (through 220Ω resistor)
└── Cathode → GND

Emergency Buzzer:
├── Positive → GPIO 12
└── Negative → GND

Power:
├── ESP32 VIN → 5V power supply
└── ESP32 GND → Power supply GND
```

## Installation Steps

### 1. Arduino IDE Setup

1. **Install Arduino IDE** (version 1.8.19 or later)
2. **Add ESP32 Board Support**:
   - Go to File → Preferences
   - Add this URL to "Additional Board Manager URLs":
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - Go to Tools → Board → Board Manager
   - Search for "ESP32" and install "ESP32 by Espressif Systems"

3. **Install Required Libraries**:
   - Go to Tools → Manage Libraries
   - Search and install "ArduinoJson" by Benoit Blanchon

### 2. Hardware Assembly

1. **Connect the components** according to the wiring diagram above
2. **Double-check all connections** before powering on
3. **Test basic connectivity** with a simple sketch first

### 3. Software Configuration

1. **Open the ESP32 firmware** (`esp32_firmware.ino`)
2. **Update the configuration variables**:

```cpp
// WiFi credentials
const char* ssid = "YOUR_WIFI_NETWORK_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase configuration
const char* projectId = "YOUR_SUPABASE_PROJECT_ID";
const char* anonKey = "YOUR_SUPABASE_ANON_KEY";
```

3. **Get your Supabase credentials** from your project dashboard:
   - Project ID: Found in your Supabase project settings
   - Anon Key: Found in your project API settings

### 4. Sensor Calibration

1. **Upload the firmware** to your ESP32
2. **Open Serial Monitor** (115200 baud rate)
3. **Run calibration** by calling the `calibrateSensors()` function
4. **Update sensor constants** in the code based on calibration results

```cpp
// Adjust these values based on your setup
const float TANK_HEIGHT_CM = 30.0;  // Your actual tank height
const float EMPTY_DISTANCE_CM = 25.0; // Distance when tank is empty
const float LEAK_THRESHOLD = 1.5; // Gas sensor threshold voltage
```

## How It Works

### Data Flow
```
ESP32 Sensors → ESP32 WiFi → Internet → Supabase Backend → EasyGas Web App
```

### Real-time Updates
1. **ESP32 reads sensors** every 2 seconds
2. **Sends data to Supabase** every 10 seconds via HTTP POST
3. **Web app polls backend** and displays real-time data
4. **Emergency alerts** trigger immediately when leaks detected

### API Endpoints Used
- `POST /gas-level` - Updates current gas level percentage
- `POST /leak-status` - Updates leak detection status
- `GET /health` - Health check for connectivity

## Testing Your Setup

### 1. Basic Connectivity Test
```cpp
// Add this to your setup() function for testing
void testConnectivity() {
  HTTPClient http;
  String url = apiBaseUrl + "/health";
  http.begin(url);
  http.addHeader("Authorization", "Bearer " + String(anonKey));
  
  int httpResponseCode = http.GET();
  if (httpResponseCode == 200) {
    Serial.println("✅ Successfully connected to EasyGas backend!");
  } else {
    Serial.println("❌ Connection failed. Check your credentials.");
  }
  http.end();
}
```

### 2. Sensor Validation
1. **Gas Level**: Move your hand near the ultrasonic sensor to simulate different levels
2. **Leak Detection**: Use a lighter (don't ignite) near the MQ-5 sensor to test detection
3. **Web App**: Check that your EasyGas dashboard updates with real sensor data

## Troubleshooting

### Common Issues

1. **WiFi Connection Failed**
   - Check SSID and password
   - Ensure ESP32 is in range of WiFi
   - Try restarting the ESP32

2. **API Calls Failing**
   - Verify Supabase project ID and anon key
   - Check internet connectivity
   - Monitor Serial output for error codes

3. **Sensors Not Reading Correctly**
   - Check wiring connections
   - Verify power supply voltage
   - Run sensor calibration again

4. **Web App Not Updating**
   - Check backend connection in web app
   - Verify API endpoints are responding
   - Check browser console for errors

### Serial Monitor Output
Expected output should look like:
```
WiFi connected!
IP address: 192.168.1.100
--- Sensor Readings ---
Gas Level: 68.5%
Leak Detected: NO

Sending gas level data: {"level":68.5}
Gas level API response: {"success":true,"level":68.5,"timestamp":"2024-..."}
```

## Safety Considerations

⚠️ **Important Safety Notes**:

1. **Electrical Safety**
   - Use proper voltage levels (3.3V/5V)
   - Avoid short circuits
   - Ensure proper grounding

2. **Gas Safety**
   - Install sensors in well-ventilated areas
   - Test emergency responses regularly
   - Never ignore gas leak warnings

3. **Fire Safety**
   - Keep electrical components away from gas sources
   - Use explosion-proof enclosures in hazardous areas
   - Have fire extinguisher readily available

## Advanced Features

### 1. Over-the-Air (OTA) Updates
Add OTA capability for remote firmware updates:

```cpp
#include <ArduinoOTA.h>

void setupOTA() {
  ArduinoOTA.begin();
  ArduinoOTA.onStart([]() {
    Serial.println("OTA Update Starting...");
  });
}
```

### 2. Deep Sleep Mode
Implement power saving for battery operation:

```cpp
void enterDeepSleep() {
  Serial.println("Entering deep sleep for 60 seconds...");
  esp_sleep_enable_timer_wakeup(60 * 1000000); // 60 seconds
  esp_deep_sleep_start();
}
```

### 3. Local Web Server
Add a local configuration interface:

```cpp
#include <WebServer.h>

WebServer server(80);

void setupWebServer() {
  server.on("/", handleRoot);
  server.on("/config", handleConfig);
  server.begin();
}
```

## Next Steps

1. **Test the basic setup** with the provided firmware
2. **Calibrate your sensors** for accurate readings
3. **Mount the hardware** in your gas tank area
4. **Monitor the web app** for real-time updates
5. **Implement additional features** as needed

## Support

If you encounter any issues:
1. Check the Serial Monitor output for error messages
2. Verify all wiring connections
3. Ensure your Supabase credentials are correct
4. Test individual components separately

Your EasyGas web application is already fully prepared to receive and display real sensor data from your ESP32!