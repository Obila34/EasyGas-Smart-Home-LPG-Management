// Configuration file for ESP32 Gas Level Monitor
// Edit these values before uploading to your device

#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YourWiFiNetwork"
#define WIFI_PASSWORD "YourWiFiPassword"

// MQTT Configuration
#define MQTT_SERVER "mqtt.easygas.com"
#define MQTT_PORT 1883
#define MQTT_USER "device_user"
#define MQTT_PASSWORD "device_password"

// Device Configuration
#define DEVICE_ID "easygas_sensor_001" // Unique identifier for this device

// Sensor Calibration (adjust based on your load cell)
#define DEFAULT_CALIBRATION_FACTOR -7050.0
#define EMPTY_CYLINDER_WEIGHT 15.0  // kg
#define FULL_CYLINDER_WEIGHT 29.0   // kg

// Timing Configuration (milliseconds)
#define SENSOR_READ_INTERVAL 5000    // How often to read sensor
#define DATA_TRANSMISSION_INTERVAL 30000  // How often to send data
#define HEARTBEAT_INTERVAL 300000    // How often to send heartbeat

// Thresholds
#define LOW_GAS_THRESHOLD 15.0       // Percentage
#define CRITICAL_GAS_THRESHOLD 5.0   // Percentage
#define CHANGE_THRESHOLD 2.0         // Minimum change to trigger transmission

// Hardware Pins
#define LOADCELL_DOUT_PIN 4
#define LOADCELL_SCK_PIN 5
#define STATUS_LED_PIN 2
#define CALIBRATION_BUTTON_PIN 0
#define BATTERY_MONITOR_PIN A0

// Power Management
#define ENABLE_DEEP_SLEEP false      // Enable deep sleep mode
#define SLEEP_DURATION 30            // Sleep duration in seconds
#define LOW_BATTERY_THRESHOLD 20.0   // Percentage

// Debug Configuration
#define SERIAL_BAUD_RATE 115200
#define ENABLE_DEBUG_OUTPUT true

// Safety Configuration
#define MAX_TRANSMISSION_FAILURES 5  // Max failures before restart
#define WATCHDOG_TIMEOUT 60000       // Watchdog timeout in ms

// Version Information
#define FIRMWARE_VERSION "1.0.0"
#define HARDWARE_VERSION "1.0"

#endif // CONFIG_H