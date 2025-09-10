// ESP32 Gas Level Sensor Controller
// Monitors LPG cylinder weight using load cell sensor
// Transmits data via WiFi to backend services

#include <WiFi.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <HX711.h>
#include "config.h"

// Pin definitions
#define LOADCELL_DOUT_PIN 4
#define LOADCELL_SCK_PIN 5
#define LED_PIN 2
#define BUTTON_PIN 0

// Sensor configuration
HX711 scale;
WiFiClient espClient;
PubSubClient mqtt(espClient);

// Calibration values (to be configured per installation)
float calibration_factor = -7050.0; // Adjust based on load cell
float empty_weight = 15.0; // Empty cylinder weight in kg
float full_weight = 29.0;  // Full cylinder weight in kg

// Global variables
float current_gas_level = 0.0;
float last_transmitted_level = 0.0;
unsigned long last_reading = 0;
unsigned long last_transmission = 0;

// Configuration
const unsigned long READING_INTERVAL = 5000;  // 5 seconds
const unsigned long TRANSMISSION_INTERVAL = 30000; // 30 seconds
const float CHANGE_THRESHOLD = 2.0; // Minimum change to trigger transmission

void setup() {
  Serial.begin(115200);
  Serial.println("EasyGas LPG Level Monitor Starting...");
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  // Initialize load cell
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(calibration_factor);
  scale.tare(); // Reset scale to 0
  
  // Initialize WiFi
  setupWiFi();
  
  // Initialize MQTT
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
  
  // Perform initial calibration
  performCalibration();
  
  Serial.println("Setup complete. Starting monitoring...");
  digitalWrite(LED_PIN, HIGH); // Indicate ready status
}

void loop() {
  unsigned long now = millis();
  
  // Ensure MQTT connection
  if (!mqtt.connected()) {
    reconnectMQTT();
  }
  mqtt.loop();
  
  // Read sensor data
  if (now - last_reading >= READING_INTERVAL) {
    readGasLevel();
    last_reading = now;
  }
  
  // Transmit data if needed
  if (shouldTransmitData(now)) {
    transmitSensorData();
    last_transmission = now;
    last_transmitted_level = current_gas_level;
  }
  
  // Handle calibration button press
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      performCalibration();
      while (digitalRead(BUTTON_PIN) == LOW) delay(10);
    }
  }
  
  delay(100);
}

void setupWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed!");
  }
}

void readGasLevel() {
  if (!scale.is_ready()) {
    Serial.println("Load cell not ready");
    return;
  }
  
  // Take multiple readings for accuracy
  float total_weight = 0;
  int valid_readings = 0;
  
  for (int i = 0; i < 5; i++) {
    float reading = scale.get_units(3); // Average of 3 readings
    if (!isnan(reading) && reading > 0) {
      total_weight += reading;
      valid_readings++;
    }
    delay(100);
  }
  
  if (valid_readings > 0) {
    float average_weight = total_weight / valid_readings;
    current_gas_level = calculateGasPercentage(average_weight);
    
    Serial.printf("Weight: %.2f kg, Gas Level: %.1f%%\n", 
                  average_weight, current_gas_level);
    
    // Update LED indicator
    updateStatusLED();
  }
}

float calculateGasPercentage(float current_weight) {
  if (current_weight <= empty_weight) {
    return 0.0;
  }
  
  if (current_weight >= full_weight) {
    return 100.0;
  }
  
  float gas_weight = current_weight - empty_weight;
  float max_gas_weight = full_weight - empty_weight;
  float percentage = (gas_weight / max_gas_weight) * 100.0;
  
  return constrain(percentage, 0.0, 100.0);
}

bool shouldTransmitData(unsigned long now) {
  // Transmit if enough time has passed
  if (now - last_transmission >= TRANSMISSION_INTERVAL) {
    return true;
  }
  
  // Transmit if significant change detected
  if (abs(current_gas_level - last_transmitted_level) >= CHANGE_THRESHOLD) {
    return true;
  }
  
  // Transmit if critical levels detected
  if (current_gas_level <= 10.0 || current_gas_level >= 95.0) {
    return true;
  }
  
  return false;
}

void transmitSensorData() {
  if (!mqtt.connected()) {
    Serial.println("MQTT not connected, cannot transmit");
    return;
  }
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = WiFi.getTime();
  doc["gas_level"] = current_gas_level;
  doc["status"] = getStatusString();
  doc["battery_level"] = getBatteryLevel();
  
  String payload;
  serializeJson(doc, payload);
  
  // Publish to MQTT topic
  String topic = String("easygas/sensors/") + DEVICE_ID + "/data";
  if (mqtt.publish(topic.c_str(), payload.c_str())) {
    Serial.println("Data transmitted successfully");
    digitalWrite(LED_PIN, LOW);
    delay(100);
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("Failed to transmit data");
  }
}

String getStatusString() {
  if (current_gas_level <= 5.0) {
    return "critical";
  } else if (current_gas_level <= 15.0) {
    return "low";
  } else if (current_gas_level <= 30.0) {
    return "medium";
  } else {
    return "normal";
  }
}

void updateStatusLED() {
  // Blink pattern based on gas level
  static unsigned long last_blink = 0;
  static bool led_state = false;
  unsigned long blink_interval;
  
  if (current_gas_level <= 10.0) {
    blink_interval = 200; // Fast blink for low gas
  } else if (current_gas_level <= 25.0) {
    blink_interval = 500; // Medium blink for medium gas
  } else {
    blink_interval = 2000; // Slow blink for normal levels
  }
  
  unsigned long now = millis();
  if (now - last_blink >= blink_interval) {
    led_state = !led_state;
    digitalWrite(LED_PIN, led_state);
    last_blink = now;
  }
}

void performCalibration() {
  Serial.println("Starting calibration process...");
  digitalWrite(LED_PIN, LOW);
  
  // Tare the scale (set zero point)
  Serial.println("Remove all weight and press button to tare...");
  while (digitalRead(BUTTON_PIN) == HIGH) {
    delay(100);
  }
  
  scale.tare();
  Serial.println("Scale tared. Place known weight and configure calibration factor.");
  
  // Visual indication of calibration mode
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
  
  Serial.println("Calibration complete");
  digitalWrite(LED_PIN, HIGH);
}

float getBatteryLevel() {
  // Read battery voltage from ADC
  int battery_raw = analogRead(A0);
  float battery_voltage = (battery_raw / 1023.0) * 3.3 * 2; // Voltage divider
  
  // Convert to percentage (assuming 3.0V min, 4.2V max)
  float battery_percentage = ((battery_voltage - 3.0) / 1.2) * 100.0;
  return constrain(battery_percentage, 0.0, 100.0);
}

void reconnectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASSWORD)) {
      Serial.println("connected");
      
      // Subscribe to control topics
      String control_topic = String("easygas/devices/") + DEVICE_ID + "/control";
      mqtt.subscribe(control_topic.c_str());
      
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqtt.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.printf("Message received [%s]: %s\n", topic, message.c_str());
  
  // Parse control commands
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  if (doc.containsKey("command")) {
    String command = doc["command"];
    
    if (command == "calibrate") {
      performCalibration();
    } else if (command == "reset") {
      ESP.restart();
    } else if (command == "update_config") {
      // Update configuration parameters
      if (doc.containsKey("calibration_factor")) {
        calibration_factor = doc["calibration_factor"];
        scale.set_scale(calibration_factor);
      }
    }
  }
}