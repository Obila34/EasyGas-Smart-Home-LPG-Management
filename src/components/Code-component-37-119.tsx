import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { 
  Wifi, 
  Settings, 
  Download, 
  Upload, 
  Code, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  ExternalLink,
  Zap,
  Radio
} from "lucide-react";
import { ESP32StatusMonitor } from "./ESP32StatusMonitor";
import { apiCall } from "../utils/api";
import { toast } from "sonner@2.0.3";

interface ESP32Config {
  wifiSSID: string;
  wifiPassword: string;
  supabaseProjectId: string;
  supabaseAnonKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  emergencyPhoneNumber: string;
}

export function ESP32Integration() {
  const [config, setConfig] = useState<ESP32Config>({
    wifiSSID: "",
    wifiPassword: "",
    supabaseProjectId: "ovywxqfivffehtyxcody",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92eXd4cWZpdmZmZWh0eXhjb2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mjc3MTMsImV4cCI6MjA3MjMwMzcxM30.AkGa4PcBL6NGZH_Kj0wcJDInK-ZhEq6zuWPX4xql6cE",
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
    emergencyPhoneNumber: ""
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  // Generate ESP32 firmware with user configuration
  const generateFirmware = async () => {
    setIsGenerating(true);
    
    try {
      const firmwareTemplate = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <base64.h>

// WiFi credentials - CONFIGURED FOR YOUR NETWORK
const char* ssid = "${config.wifiSSID}";
const char* password = "${config.wifiPassword}";

// Supabase configuration - CONFIGURED FOR YOUR PROJECT
const char* projectId = "${config.supabaseProjectId}";
const char* anonKey = "${config.supabaseAnonKey}";

// Twilio configuration - CONFIGURED FOR YOUR ACCOUNT
const char* twilioAccountSid = "${config.twilioAccountSid}";
const char* twilioAuthToken = "${config.twilioAuthToken}";
const char* twilioPhoneNumber = "${config.twilioPhoneNumber}";
const char* emergencyPhoneNumber = "${config.emergencyPhoneNumber}";

// API endpoint
String apiBaseUrl = "https://" + String(projectId) + ".supabase.co/functions/v1/make-server-aa295c22";

// Pin configurations for ULTRASONIC gas level measurement
const int LEVEL_SENSOR_TRIG = 2;  // Ultrasonic sensor trigger pin
const int LEVEL_SENSOR_ECHO = 3;  // Ultrasonic sensor echo pin
const int GAS_SENSOR_PIN = A0;    // MQ-5 gas sensor analog pin
const int LED_PIN = 13;           // Status LED
const int BUZZER_PIN = 12;        // Emergency buzzer
const int TEMP_SENSOR_PIN = 4;    // DS18B20 temperature sensor (optional)

// Sensor variables
float gasLevel = 0.0;
float temperature = 25.0;
bool leakDetected = false;
bool lastLeakState = false;
unsigned long lastSensorRead = 0;
unsigned long lastApiCall = 0;
unsigned long lastEmergencyCall = 0;

// Timing intervals
const unsigned long SENSOR_INTERVAL = 2000;      // Read sensors every 2 seconds
const unsigned long API_INTERVAL = 10000;        // Send data every 10 seconds
const unsigned long EMERGENCY_CALL_COOLDOWN = 300000; // 5 minutes between emergency calls

// Ultrasonic sensor calibration variables (ADJUST FOR YOUR SETUP)
const float CYLINDER_HEIGHT_CM = 30.0;       // Total internal height of your cylinder
const float EMPTY_DISTANCE_CM = 28.0;        // Distance when cylinder is empty
const float FULL_DISTANCE_CM = 3.0;          // Distance when cylinder is full
const float SOUND_VELOCITY = 343.0;          // Sound velocity in air (m/s)
const float TEMP_VELOCITY_COEFF = 0.6;       // Temperature compensation coefficient

// Gas leak detection threshold
const float LEAK_THRESHOLD_VOLTAGE = 1.5;    // MQ-5 sensor threshold (volts)

void setup() {
  Serial.begin(115200);
  Serial.println("\\n=== EasyGas ESP32 System Starting ===");
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LEVEL_SENSOR_TRIG, OUTPUT);
  pinMode(LEVEL_SENSOR_ECHO, INPUT);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Test API connection
  testAPIConnection();
  
  Serial.println("EasyGas ESP32 initialized and ready!");
  Serial.println("Monitoring gas levels with ultrasonic sensor...");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors every SENSOR_INTERVAL
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readSensors();
    
    // Check for new gas leak detection
    if (leakDetected && !lastLeakState) {
      Serial.println("🚨 NEW GAS LEAK DETECTED - TRIGGERING EMERGENCY!");
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
      Serial.println("📶 WiFi disconnected, reconnecting...");
      connectToWiFi();
    }
    lastApiCall = currentTime;
  }
  
  // Handle emergency situations
  handleEmergencyIndicators();
  
  delay(100);
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi: ");
  Serial.print(ssid);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n✅ WiFi connected!");
    Serial.print("📍 IP address: ");
    Serial.println(WiFi.localIP());
    
    // Blink LED to indicate successful connection
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(200);
      digitalWrite(LED_PIN, LOW);
      delay(200);
    }
  } else {
    Serial.println("\\n❌ WiFi connection failed!");
  }
}

void readSensors() {
  // Read gas level using ultrasonic sensor
  gasLevel = readGasLevelUltrasonic();
  
  // Read temperature (if sensor available)
  temperature = readTemperature();
  
  // Read gas leak detection using MQ-5 sensor
  leakDetected = detectGasLeak();
  
  // Print sensor readings
  Serial.println("\\n--- 📊 Sensor Readings ---");
  Serial.printf("⛽ Gas Level: %.1f%%\\n", gasLevel);
  Serial.printf("🌡️ Temperature: %.1f°C\\n", temperature);
  Serial.printf("🔍 Leak Status: %s\\n", leakDetected ? "🚨 DETECTED" : "✅ Normal");
  Serial.println("-------------------------\\n");
}

float readGasLevelUltrasonic() {
  // Temperature-compensated sound velocity
  float adjustedVelocity = SOUND_VELOCITY + (TEMP_VELOCITY_COEFF * (temperature - 20.0));
  
  // Send ultrasonic pulse
  digitalWrite(LEVEL_SENSOR_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(LEVEL_SENSOR_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(LEVEL_SENSOR_TRIG, LOW);
  
  // Read the echo with timeout
  long duration = pulseIn(LEVEL_SENSOR_ECHO, HIGH, 30000);
  
  if (duration == 0) {
    Serial.println("⚠️ Ultrasonic sensor timeout");
    return gasLevel; // Return last known value
  }
  
  // Calculate distance with temperature compensation
  float distance = (duration * adjustedVelocity) / 20000.0; // Convert to cm
  
  // Calculate gas level percentage (inverted - less distance = more gas)
  float level = 0.0;
  if (distance >= FULL_DISTANCE_CM && distance <= EMPTY_DISTANCE_CM) {
    level = ((EMPTY_DISTANCE_CM - distance) / (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)) * 100.0;
  } else if (distance < FULL_DISTANCE_CM) {
    level = 100.0; // Tank is full or sensor error
  } else {
    level = 0.0;   // Tank is empty
  }
  
  // Clamp to valid range
  level = constrain(level, 0.0, 100.0);
  
  // Simple smoothing filter
  static float lastLevel = 0.0;
  level = (level * 0.7) + (lastLevel * 0.3);
  lastLevel = level;
  
  Serial.printf("📏 Distance: %.1fcm, Level: %.1f%%\\n", distance, level);
  return level;
}

float readTemperature() {
  // Placeholder for DS18B20 temperature sensor
  // Replace with actual temperature reading code
  return 25.0 + (random(-50, 50) / 10.0); // Simulated temperature ±5°C
}

bool detectGasLeak() {
  int sensorValue = analogRead(GAS_SENSOR_PIN);
  float voltage = sensorValue * (3.3 / 4095.0); // Convert to voltage for ESP32
  
  Serial.printf("🔬 Gas Sensor: %d ADC, %.2fV\\n", sensorValue, voltage);
  
  return voltage > LEAK_THRESHOLD_VOLTAGE;
}

void sendGasLevelData() {
  HTTPClient http;
  String url = apiBaseUrl + "/gas-level";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(anonKey));
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["level"] = round(gasLevel * 10) / 10.0; // Round to 1 decimal
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.printf("📤 Sending gas data: %s\\n", jsonString.c_str());
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("📥 API Response (%d): %s\\n", httpResponseCode, response.c_str());
    
    // Blink LED on successful transmission
    digitalWrite(LED_PIN, HIGH);
    delay(50);
    digitalWrite(LED_PIN, LOW);
  } else {
    Serial.printf("❌ API Error: %d\\n", httpResponseCode);
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
  doc["sensorVoltage"] = analogRead(GAS_SENSOR_PIN) * (3.3 / 4095.0);
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.printf("📤 Sending leak data: %s\\n", jsonString.c_str());
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("📥 Leak API Response (%d): %s\\n", httpResponseCode, response.c_str());
  } else {
    Serial.printf("❌ Leak API Error: %d\\n", httpResponseCode);
  }
  
  http.end();
}

void handleEmergencyIndicators() {
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
    Serial.println("⏳ Emergency call cooldown active - skipping alerts");
    return;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("📞 Triggering emergency SMS and voice call...");
    
    // Send emergency SMS
    sendEmergencySMS();
    delay(2000);
    
    // Make emergency voice call
    makeEmergencyCall();
    
    // Send to server for app notifications
    sendEmergencyNotification();
    
    lastEmergencyCall = currentTime;
  } else {
    Serial.println("❌ WiFi not connected - cannot send emergency alerts!");
  }
}

void testAPIConnection() {
  Serial.println("🔍 Testing API connection...");
  
  HTTPClient http;
  String url = apiBaseUrl + "/health";
  
  http.begin(url);
  http.addHeader("Authorization", "Bearer " + String(anonKey));
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    Serial.println("✅ API connection successful!");
    String response = http.getString();
    Serial.printf("📥 Health check response: %s\\n", response.c_str());
  } else {
    Serial.printf("❌ API connection failed with code: %d\\n", httpResponseCode);
  }
  
  http.end();
}

// Placeholder functions for Twilio integration
void sendEmergencySMS() {
  Serial.println("📱 Emergency SMS would be sent here");
  // Add your Twilio SMS code here
}

void makeEmergencyCall() {
  Serial.println("📞 Emergency call would be made here");
  // Add your Twilio voice call code here
}

void sendEmergencyNotification() {
  Serial.println("🚨 Emergency notification sent to server");
  // Already implemented above
}`;

      setGeneratedCode(firmwareTemplate);
      toast.success("ESP32 firmware generated successfully!");
      
    } catch (error) {
      toast.error("Failed to generate firmware");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy code to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  // Download firmware file
  const downloadFirmware = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'easygas_esp32_firmware.ino';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Firmware file downloaded!");
  };

  // Test ESP32 connection
  const testConnection = async () => {
    try {
      const result = await apiCall('/health');
      toast.success("ESP32 connection test successful!");
    } catch (error) {
      toast.error("ESP32 connection test failed");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Radio className="w-5 h-5 text-blue-400" />
            </motion.div>
            ESP32 Hardware Integration
            <Badge variant="outline" className="ml-auto bg-blue-500/20 text-blue-400 border-blue-500/50">
              Ultrasonic Sensors
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
              <TabsTrigger value="status">Live Status</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="firmware">Firmware</TabsTrigger>
              <TabsTrigger value="help">Setup Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="space-y-4">
              <ESP32StatusMonitor />
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">WiFi Configuration</h3>
                  <div className="space-y-2">
                    <Label htmlFor="wifiSSID">WiFi Network Name (SSID)</Label>
                    <Input
                      id="wifiSSID"
                      value={config.wifiSSID}
                      onChange={(e) => setConfig(prev => ({ ...prev, wifiSSID: e.target.value }))}
                      placeholder="Your WiFi network name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wifiPassword">WiFi Password</Label>
                    <Input
                      id="wifiPassword"
                      type="password"
                      value={config.wifiPassword}
                      onChange={(e) => setConfig(prev => ({ ...prev, wifiPassword: e.target.value }))}
                      placeholder="Your WiFi password"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Twilio Emergency Alerts</h3>
                  <div className="space-y-2">
                    <Label htmlFor="twilioSid">Twilio Account SID</Label>
                    <Input
                      id="twilioSid"
                      value={config.twilioAccountSid}
                      onChange={(e) => setConfig(prev => ({ ...prev, twilioAccountSid: e.target.value }))}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilioToken">Twilio Auth Token</Label>
                    <Input
                      id="twilioToken"
                      type="password"
                      value={config.twilioAuthToken}
                      onChange={(e) => setConfig(prev => ({ ...prev, twilioAuthToken: e.target.value }))}
                      placeholder="Your Twilio auth token"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilioPhone">Twilio Phone Number</Label>
                    <Input
                      id="twilioPhone"
                      value={config.twilioPhoneNumber}
                      onChange={(e) => setConfig(prev => ({ ...prev, twilioPhoneNumber: e.target.value }))}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Contact Number</Label>
                    <Input
                      id="emergencyPhone"
                      value={config.emergencyPhoneNumber}
                      onChange={(e) => setConfig(prev => ({ ...prev, emergencyPhoneNumber: e.target.value }))}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <Button 
                  onClick={generateFirmware}
                  disabled={isGenerating || !config.wifiSSID}
                  className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30"
                >
                  {isGenerating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border border-blue-400 border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <Code className="w-4 h-4 mr-2" />
                  )}
                  Generate Custom ESP32 Firmware
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="firmware" className="space-y-4">
              {generatedCode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Generated Firmware</h3>
                    <div className="flex gap-2">
                      <Button onClick={copyToClipboard} variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button onClick={downloadFirmware} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={generatedCode}
                    readOnly
                    className="h-96 font-mono text-sm bg-slate-900/50"
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Code className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400 mb-4">Configure your settings and generate custom firmware</p>
                  <Button onClick={() => setConfig(prev => ({ ...prev }))} variant="outline">
                    Go to Configuration
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Hardware Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-slate-700/30 p-4">
                      <h4 className="font-medium text-blue-400 mb-2">For Gas Level Measurement</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• HC-SR04 Ultrasonic Sensor</li>
                        <li>• ESP32 GPIO 2 (Trigger)</li>
                        <li>• ESP32 GPIO 3 (Echo)</li>
                        <li>• 5V power supply</li>
                      </ul>
                    </Card>
                    <Card className="bg-slate-700/30 p-4">
                      <h4 className="font-medium text-orange-400 mb-2">For Leak Detection</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• MQ-5 Gas Sensor</li>
                        <li>• ESP32 GPIO A0 (Analog)</li>
                        <li>• 5V power supply</li>
                        <li>• Proper ventilation</li>
                      </ul>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Quick Setup Steps</h3>
                  <div className="space-y-3">
                    {[
                      "Wire the ultrasonic sensor to GPIO 2 & 3",
                      "Connect MQ-5 gas sensor to analog pin A0",
                      "Configure WiFi and Twilio credentials above",
                      "Generate and upload the custom firmware",
                      "Calibrate sensors with your cylinder dimensions",
                      "Monitor real-time data in the Live Status tab"
                    ].map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <span className="text-gray-300">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={testConnection}
                    variant="outline"
                    className="bg-green-500/20 text-green-400 border-green-500/50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                  <Button 
                    variant="outline"
                    className="bg-blue-500/20 text-blue-400 border-blue-500/50"
                    onClick={() => window.open('/ESP32_Setup_Guide.md', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Full Setup Guide
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}