#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <base64.h>

// WiFi credentials - Replace with your actual credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase configuration - Replace with your actual values
const char* projectId = "YOUR_SUPABASE_PROJECT_ID";
const char* anonKey = "YOUR_SUPABASE_ANON_KEY";

// Twilio configuration - Replace with your actual values
const char* twilioAccountSid = "YOUR_TWILIO_ACCOUNT_SID";
const char* twilioAuthToken = "YOUR_TWILIO_AUTH_TOKEN";
const char* twilioPhoneNumber = "YOUR_TWILIO_PHONE_NUMBER"; // Format: +1234567890
const char* emergencyPhoneNumber = "YOUR_EMERGENCY_PHONE_NUMBER"; // Format: +1234567890

// API endpoint
String apiBaseUrl = "https://" + String(projectId) + ".supabase.co/functions/v1/make-server-aa295c22";

// Pin configurations
const int GAS_SENSOR_PIN = A0;  // MQ-5 gas sensor analog pin
const int LEVEL_SENSOR_TRIG = 2; // Ultrasonic sensor trigger pin
const int LEVEL_SENSOR_ECHO = 3; // Ultrasonic sensor echo pin
const int LED_PIN = 13;         // Status LED
const int BUZZER_PIN = 12;      // Emergency buzzer

// Sensor variables
float gasLevel = 0.0;
bool leakDetected = false;
bool lastLeakState = false;
unsigned long lastSensorRead = 0;
unsigned long lastApiCall = 0;
unsigned long lastEmergencyCall = 0;
const unsigned long SENSOR_INTERVAL = 2000;  // Read sensors every 2 seconds
const unsigned long API_INTERVAL = 10000;    // Send data every 10 seconds
const unsigned long EMERGENCY_CALL_COOLDOWN = 300000; // 5 minutes between emergency calls

// Gas level calculation variables
const float TANK_HEIGHT_CM = 30.0;  // Height of your gas tank in cm
const float EMPTY_DISTANCE_CM = 25.0; // Distance when tank is empty

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LEVEL_SENSOR_TRIG, OUTPUT);
  pinMode(LEVEL_SENSOR_ECHO, INPUT);
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("EasyGas ESP32 Sensor System Initialized");
  Serial.println("Reading sensors and sending data to Supabase...");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors every SENSOR_INTERVAL
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readSensors();
    
    // Check for new gas leak detection
    if (leakDetected && !lastLeakState) {
      // New gas leak detected - trigger emergency protocols
      Serial.println("NEW GAS LEAK DETECTED - TRIGGERING EMERGENCY PROTOCOLS!");
      triggerEmergencyAlerts();
    }
    lastLeakState = leakDetected;
    lastSensorRead = currentTime;
  }
  
  // Send data to API every API_INTERVAL
  if (currentTime - lastApiCall >= API_INTERVAL) {
    if (WiFi.status() == WL_CONNECTED) {
      sendGasLevelData();
      sendLeakDetectionData();
    } else {
      Serial.println("WiFi disconnected, attempting to reconnect...");
      connectToWiFi();
    }
    lastApiCall = currentTime;
  }
  
  // Handle emergency situations
  handleEmergency();
  
  delay(100);
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Blink LED to indicate successful connection
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

void readSensors() {
  // Read gas level using ultrasonic sensor
  gasLevel = readGasLevel();
  
  // Read gas leak detection using MQ-5 sensor
  leakDetected = detectGasLeak();
  
  // Print sensor readings
  Serial.println("--- Sensor Readings ---");
  Serial.print("Gas Level: ");
  Serial.print(gasLevel);
  Serial.println("%");
  Serial.print("Leak Detected: ");
  Serial.println(leakDetected ? "YES" : "NO");
  Serial.println();
}

float readGasLevel() {
  // Send ultrasonic pulse
  digitalWrite(LEVEL_SENSOR_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(LEVEL_SENSOR_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(LEVEL_SENSOR_TRIG, LOW);
  
  // Read the echo
  long duration = pulseIn(LEVEL_SENSOR_ECHO, HIGH);
  float distance = duration * 0.034 / 2; // Convert to cm
  
  // Calculate gas level percentage
  float level = 0.0;
  if (distance <= EMPTY_DISTANCE_CM) {
    level = ((EMPTY_DISTANCE_CM - distance) / (EMPTY_DISTANCE_CM - 5.0)) * 100.0;
    level = constrain(level, 0.0, 100.0);
  }
  
  // Add some noise filtering
  static float lastLevel = 0.0;
  level = (level * 0.7) + (lastLevel * 0.3); // Simple low-pass filter
  lastLevel = level;
  
  return level;
}

bool detectGasLeak() {
  int sensorValue = analogRead(GAS_SENSOR_PIN);
  float voltage = sensorValue * (3.3 / 4095.0); // Convert to voltage for ESP32
  
  // MQ-5 sensor threshold - adjust based on your sensor calibration
  const float LEAK_THRESHOLD = 1.5; // Volts
  
  Serial.print("Gas Sensor Voltage: ");
  Serial.print(voltage);
  Serial.println("V");
  
  return voltage > LEAK_THRESHOLD;
}

void sendGasLevelData() {
  HTTPClient http;
  String url = apiBaseUrl + "/gas-level";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(anonKey));
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["level"] = gasLevel;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Sending gas level data: ");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Gas level API response: ");
    Serial.println(response);
    
    // Blink LED on successful transmission
    digitalWrite(LED_PIN, HIGH);
    delay(50);
    digitalWrite(LED_PIN, LOW);
  } else {
    Serial.print("Gas level API error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void sendLeakDetectionData() {
  HTTPClient http;
  String url = apiBaseUrl + "/leak-status";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(anonKey));
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["leakDetected"] = leakDetected;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Sending leak detection data: ");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Leak detection API response: ");
    Serial.println(response);
  } else {
    Serial.print("Leak detection API error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void handleEmergency() {
  if (leakDetected) {
    // Emergency mode: flash LED rapidly and sound buzzer
    static unsigned long lastFlash = 0;
    static bool ledState = false;
    
    if (millis() - lastFlash >= 200) {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState);
      
      // Sound buzzer intermittently to save power
      if (ledState) {
        tone(BUZZER_PIN, 1000, 100); // 1kHz tone for 100ms
      }
      
      lastFlash = millis();
    }
    
    Serial.println("EMERGENCY: GAS LEAK DETECTED!");
  } else {
    // Normal operation: steady LED
    digitalWrite(LED_PIN, HIGH);
    noTone(BUZZER_PIN);
  }
}

void triggerEmergencyAlerts() {
  unsigned long currentTime = millis();
  
  // Prevent spam calls - only trigger if cooldown period has passed
  if (currentTime - lastEmergencyCall < EMERGENCY_CALL_COOLDOWN) {
    Serial.println("Emergency call cooldown active - skipping Twilio alerts");
    return;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Triggering emergency SMS and voice call...");
    
    // Send emergency SMS
    sendEmergencySMS();
    delay(2000); // Wait 2 seconds between calls
    
    // Make emergency voice call
    makeEmergencyCall();
    
    // Update last emergency call time
    lastEmergencyCall = currentTime;
    
    // Also send to our server for app notifications
    sendEmergencyNotification();
  } else {
    Serial.println("WiFi not connected - cannot send emergency alerts!");
  }
}

void sendEmergencySMS() {
  HTTPClient http;
  http.begin("https://api.twilio.com/2010-04-01/Accounts/" + String(twilioAccountSid) + "/Messages.json");
  
  // Set headers
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  // Create basic auth header
  String auth = String(twilioAccountSid) + ":" + String(twilioAuthToken);
  String encodedAuth = base64::encode(auth);
  http.addHeader("Authorization", "Basic " + encodedAuth);
  
  // Create POST data
  String postData = "From=" + String(twilioPhoneNumber) + 
                   "&To=" + String(emergencyPhoneNumber) + 
                   "&Body=URGENT: Gas leak detected at your property! Please check your EasyGas system immediately and ensure safety. Time: " + 
                   String(millis()/1000) + " seconds since startup.";
  
  Serial.println("Sending emergency SMS...");
  int httpResponseCode = http.POST(postData);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("SMS sent successfully!");
    Serial.println("Response: " + response);
  } else {
    Serial.println("SMS failed with code: " + String(httpResponseCode));
  }
  
  http.end();
}

void makeEmergencyCall() {
  HTTPClient http;
  http.begin("https://api.twilio.com/2010-04-01/Accounts/" + String(twilioAccountSid) + "/Calls.json");
  
  // Set headers
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  // Create basic auth header
  String auth = String(twilioAccountSid) + ":" + String(twilioAuthToken);
  String encodedAuth = base64::encode(auth);
  http.addHeader("Authorization", "Basic " + encodedAuth);
  
  // TwiML for voice message
  String twimlUrl = "http://twimlets.com/message?Message%5B0%5D=Emergency%20alert.%20Gas%20leak%20detected%20at%20your%20property.%20Please%20check%20your%20Easy%20Gas%20system%20immediately%20and%20ensure%20safety.%20This%20is%20an%20automated%20emergency%20call%20from%20your%20smart%20gas%20monitoring%20system.";
  
  // Create POST data  
  String postData = "From=" + String(twilioPhoneNumber) + 
                   "&To=" + String(emergencyPhoneNumber) + 
                   "&Url=" + twimlUrl;
  
  Serial.println("Making emergency voice call...");
  int httpResponseCode = http.POST(postData);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Emergency call initiated successfully!");
    Serial.println("Response: " + response);
  } else {
    Serial.println("Emergency call failed with code: " + String(httpResponseCode));
  }
  
  http.end();
}

void sendEmergencyNotification() {
  HTTPClient http;
  String url = apiBaseUrl + "/emergency-alert";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(anonKey));
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["alert_type"] = "gas_leak";
  doc["severity"] = "critical";
  doc["timestamp"] = millis();
  doc["gas_level"] = gasLevel;
  doc["sensor_voltage"] = analogRead(GAS_SENSOR_PIN) * (3.3 / 4095.0);
  doc["sms_sent"] = true;
  doc["voice_call_made"] = true;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Sending emergency notification to server: ");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Emergency notification response: ");
    Serial.println(response);
  } else {
    Serial.print("Emergency notification failed: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void calibrateSensors() {
  Serial.println("Starting sensor calibration...");
  Serial.println("Make sure tank is empty and no gas leaks present.");
  Serial.println("Calibration will start in 5 seconds...");
  
  delay(5000);
  
  // Calibrate gas level sensor (empty tank)
  float emptyReading = 0;
  for (int i = 0; i < 10; i++) {
    digitalWrite(LEVEL_SENSOR_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(LEVEL_SENSOR_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(LEVEL_SENSOR_TRIG, LOW);
    
    long duration = pulseIn(LEVEL_SENSOR_ECHO, HIGH);
    float distance = duration * 0.034 / 2;
    emptyReading += distance;
    delay(100);
  }
  emptyReading /= 10;
  
  Serial.print("Empty tank distance: ");
  Serial.print(emptyReading);
  Serial.println(" cm");
  
  // Calibrate gas sensor (clean air)
  float cleanAirReading = 0;
  for (int i = 0; i < 10; i++) {
    int sensorValue = analogRead(GAS_SENSOR_PIN);
    float voltage = sensorValue * (3.3 / 4095.0);
    cleanAirReading += voltage;
    delay(100);
  }
  cleanAirReading /= 10;
  
  Serial.print("Clean air voltage: ");
  Serial.print(cleanAirReading);
  Serial.println(" V");
  
  Serial.println("Calibration complete!");
  Serial.println("Update the constants in your code with these values.");
}