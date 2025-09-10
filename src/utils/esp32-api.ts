import { apiCall } from './api';

// ESP32-specific API functions for ultrasonic sensor integration
export interface UltrasonicCalibration {
  cylinderHeightCm: number;
  emptyDistanceCm: number;
  fullDistanceCm: number;
  soundVelocity: number;
  tempVelocityCoeff: number;
}

export interface GasSensorCalibration {
  leakThresholdVoltage: number;
  cleanAirVoltage: number;
  sensorSensitivity: number;
}

export interface ESP32SensorData {
  gasLevel: number;
  temperature: number;
  leakDetected: boolean;
  sensorVoltage: number;
  distanceCm: number;
  timestamp: string;
  batteryLevel?: number;
  wifiSignal?: number;
  uptimeSeconds?: number;
}

export interface ESP32Status {
  isOnline: boolean;
  lastSeen: Date | null;
  firmwareVersion?: string;
  calibration: {
    ultrasonic: UltrasonicCalibration;
    gasSensor: GasSensorCalibration;
  };
}

// Default calibration values for ultrasonic gas level measurement
export const DEFAULT_ULTRASONIC_CALIBRATION: UltrasonicCalibration = {
  cylinderHeightCm: 30.0,      // Standard 14.2kg cylinder height
  emptyDistanceCm: 28.0,       // Distance when empty
  fullDistanceCm: 3.0,         // Distance when full
  soundVelocity: 343.0,        // Sound velocity in air at 20°C (m/s)
  tempVelocityCoeff: 0.6       // Temperature compensation (m/s per °C)
};

// Default calibration values for MQ-5 gas sensor
export const DEFAULT_GAS_SENSOR_CALIBRATION: GasSensorCalibration = {
  leakThresholdVoltage: 1.5,   // Voltage threshold for leak detection
  cleanAirVoltage: 0.4,        // Baseline voltage in clean air
  sensorSensitivity: 1.0       // Sensor sensitivity multiplier
};

// Send ultrasonic calibration data to ESP32
export async function sendUltrasonicCalibration(calibration: UltrasonicCalibration) {
  try {
    const response = await apiCall('/esp32/calibration/ultrasonic', {
      method: 'POST',
      body: JSON.stringify(calibration)
    });
    console.log('✅ Ultrasonic calibration sent to ESP32:', calibration);
    return response;
  } catch (error) {
    console.error('❌ Failed to send ultrasonic calibration:', error);
    throw error;
  }
}

// Send gas sensor calibration data to ESP32
export async function sendGasSensorCalibration(calibration: GasSensorCalibration) {
  try {
    const response = await apiCall('/esp32/calibration/gas-sensor', {
      method: 'POST',
      body: JSON.stringify(calibration)
    });
    console.log('✅ Gas sensor calibration sent to ESP32:', calibration);
    return response;
  } catch (error) {
    console.error('❌ Failed to send gas sensor calibration:', error);
    throw error;
  }
}

// Get current ESP32 status and sensor readings
export async function getESP32Status(): Promise<ESP32Status> {
  try {
    const [gasData, leakData] = await Promise.all([
      apiCall('/gas-level'),
      apiCall('/leak-status')
    ]);

    const lastUpdate = new Date(gasData.timestamp);
    const timeDiff = Date.now() - lastUpdate.getTime();
    const isOnline = timeDiff < 60000; // Consider online if last update within 1 minute

    return {
      isOnline,
      lastSeen: lastUpdate,
      firmwareVersion: "v1.2.0", // This would come from ESP32
      calibration: {
        ultrasonic: DEFAULT_ULTRASONIC_CALIBRATION,
        gasSensor: DEFAULT_GAS_SENSOR_CALIBRATION
      }
    };
  } catch (error) {
    console.error('❌ Failed to get ESP32 status:', error);
    return {
      isOnline: false,
      lastSeen: null,
      calibration: {
        ultrasonic: DEFAULT_ULTRASONIC_CALIBRATION,
        gasSensor: DEFAULT_GAS_SENSOR_CALIBRATION
      }
    };
  }
}

// Get latest sensor data with ESP32-specific metadata
export async function getESP32SensorData(): Promise<ESP32SensorData | null> {
  try {
    const [gasData, leakData] = await Promise.all([
      apiCall('/gas-level'),
      apiCall('/leak-status')
    ]);

    return {
      gasLevel: gasData.level,
      temperature: gasData.temperature || 25.0,
      leakDetected: leakData.leakDetected,
      sensorVoltage: 1.2, // This would come from ESP32
      distanceCm: 18.5,   // This would come from ESP32
      timestamp: gasData.timestamp,
      batteryLevel: 85,   // This would come from ESP32
      wifiSignal: -45,    // This would come from ESP32
      uptimeSeconds: Math.floor(Date.now() / 1000) % 86400 // This would come from ESP32
    };
  } catch (error) {
    console.error('❌ Failed to get ESP32 sensor data:', error);
    return null;
  }
}

// Send test command to ESP32
export async function sendTestCommand(command: string, value?: any) {
  try {
    const response = await apiCall('/esp32/test-command', {
      method: 'POST',
      body: JSON.stringify({ command, value, timestamp: Date.now() })
    });
    console.log('✅ Test command sent to ESP32:', { command, value });
    return response;
  } catch (error) {
    console.error('❌ Failed to send test command:', error);
    throw error;
  }
}

// Calculate gas level from ultrasonic distance reading
export function calculateGasLevelFromDistance(
  distanceCm: number, 
  calibration: UltrasonicCalibration,
  temperatureC: number = 20
): number {
  // Temperature-compensated sound velocity
  const adjustedVelocity = calibration.soundVelocity + 
    (calibration.tempVelocityCoeff * (temperatureC - 20.0));

  // Calculate gas level percentage (inverted - less distance = more gas)
  let level = 0.0;
  
  if (distanceCm >= calibration.fullDistanceCm && distanceCm <= calibration.emptyDistanceCm) {
    level = ((calibration.emptyDistanceCm - distanceCm) / 
             (calibration.emptyDistanceCm - calibration.fullDistanceCm)) * 100.0;
  } else if (distanceCm < calibration.fullDistanceCm) {
    level = 100.0; // Tank is full or sensor error
  } else {
    level = 0.0;   // Tank is empty
  }

  // Clamp to valid range
  return Math.max(0, Math.min(100, level));
}

// Validate ultrasonic calibration values
export function validateUltrasonicCalibration(calibration: UltrasonicCalibration): string[] {
  const errors: string[] = [];

  if (calibration.cylinderHeightCm <= 0 || calibration.cylinderHeightCm > 100) {
    errors.push("Cylinder height must be between 0 and 100 cm");
  }

  if (calibration.emptyDistanceCm <= calibration.fullDistanceCm) {
    errors.push("Empty distance must be greater than full distance");
  }

  if (calibration.fullDistanceCm < 1) {
    errors.push("Full distance must be at least 1 cm");
  }

  if (calibration.soundVelocity < 300 || calibration.soundVelocity > 400) {
    errors.push("Sound velocity should be between 300-400 m/s");
  }

  return errors;
}

// Validate gas sensor calibration values
export function validateGasSensorCalibration(calibration: GasSensorCalibration): string[] {
  const errors: string[] = [];

  if (calibration.leakThresholdVoltage <= calibration.cleanAirVoltage) {
    errors.push("Leak threshold must be higher than clean air voltage");
  }

  if (calibration.leakThresholdVoltage > 3.3) {
    errors.push("Leak threshold cannot exceed 3.3V (ESP32 max)");
  }

  if (calibration.cleanAirVoltage < 0) {
    errors.push("Clean air voltage cannot be negative");
  }

  if (calibration.sensorSensitivity <= 0) {
    errors.push("Sensor sensitivity must be greater than 0");
  }

  return errors;
}

// Generate calibration report
export function generateCalibrationReport(
  ultrasonicCal: UltrasonicCalibration,
  gasCal: GasSensorCalibration,
  testReadings?: { distance: number; voltage: number; temperature: number }[]
): string {
  let report = `=== EasyGas ESP32 Calibration Report ===\n\n`;
  
  report += `Ultrasonic Sensor Configuration:\n`;
  report += `- Cylinder Height: ${ultrasonicCal.cylinderHeightCm} cm\n`;
  report += `- Empty Distance: ${ultrasonicCal.emptyDistanceCm} cm\n`;
  report += `- Full Distance: ${ultrasonicCal.fullDistanceCm} cm\n`;
  report += `- Sound Velocity: ${ultrasonicCal.soundVelocity} m/s\n`;
  report += `- Temperature Coefficient: ${ultrasonicCal.tempVelocityCoeff} m/s/°C\n\n`;
  
  report += `Gas Sensor Configuration:\n`;
  report += `- Leak Threshold: ${gasCal.leakThresholdVoltage} V\n`;
  report += `- Clean Air Baseline: ${gasCal.cleanAirVoltage} V\n`;
  report += `- Sensitivity Multiplier: ${gasCal.sensorSensitivity}\n\n`;
  
  if (testReadings && testReadings.length > 0) {
    report += `Test Readings:\n`;
    testReadings.forEach((reading, index) => {
      const gasLevel = calculateGasLevelFromDistance(
        reading.distance, 
        ultrasonicCal, 
        reading.temperature
      );
      report += `${index + 1}. Distance: ${reading.distance}cm, `;
      report += `Gas Level: ${gasLevel.toFixed(1)}%, `;
      report += `Voltage: ${reading.voltage}V, `;
      report += `Temp: ${reading.temperature}°C\n`;
    });
  }
  
  report += `\nGenerated: ${new Date().toLocaleString()}\n`;
  return report;
}

// ESP32 firmware code generation with calibration
export function generateCalibratedFirmwareCode(
  wifiConfig: { ssid: string; password: string },
  supabaseConfig: { projectId: string; anonKey: string },
  ultrasonicCal: UltrasonicCalibration,
  gasCal: GasSensorCalibration
): string {
  return `// EasyGas ESP32 Firmware - Auto-generated with calibration
// Generated: ${new Date().toLocaleString()}

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "${wifiConfig.ssid}";
const char* password = "${wifiConfig.password}";

// Supabase Configuration
const char* projectId = "${supabaseConfig.projectId}";
const char* anonKey = "${supabaseConfig.anonKey}";
String apiBaseUrl = "https://" + String(projectId) + ".supabase.co/functions/v1/make-server-aa295c22";

// Pin Definitions
const int TRIG_PIN = 2;
const int ECHO_PIN = 3;
const int GAS_SENSOR_PIN = A0;
const int LED_PIN = 13;
const int BUZZER_PIN = 12;

// Calibrated Constants - DO NOT CHANGE UNLESS RECALIBRATING
const float CYLINDER_HEIGHT = ${ultrasonicCal.cylinderHeightCm};
const float EMPTY_DISTANCE = ${ultrasonicCal.emptyDistanceCm};
const float FULL_DISTANCE = ${ultrasonicCal.fullDistanceCm};
const float SOUND_VELOCITY = ${ultrasonicCal.soundVelocity};
const float TEMP_COEFF = ${ultrasonicCal.tempVelocityCoeff};
const float LEAK_THRESHOLD = ${gasCal.leakThresholdVoltage};
const float CLEAN_AIR_VOLTAGE = ${gasCal.cleanAirVoltage};
const float SENSOR_SENSITIVITY = ${gasCal.sensorSensitivity};

// Global Variables
float gasLevel = 0.0;
float temperature = 25.0;
bool leakDetected = false;
unsigned long lastReading = 0;
unsigned long lastTransmission = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("EasyGas ESP32 System Starting...");
  
  // Initialize pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected!");
  
  // Test API connection
  testConnection();
}

void loop() {
  if (millis() - lastReading >= 2000) {
    readSensors();
    lastReading = millis();
  }
  
  if (millis() - lastTransmission >= 10000) {
    sendData();
    lastTransmission = millis();
  }
  
  handleEmergency();
  delay(100);
}

void readSensors() {
  // Read ultrasonic distance
  float distance = readUltrasonicDistance();
  
  // Calculate gas level with temperature compensation
  gasLevel = calculateGasLevel(distance, temperature);
  
  // Read gas sensor
  leakDetected = detectGasLeak();
  
  // Print readings
  Serial.printf("Distance: %.1fcm, Gas Level: %.1f%%, Leak: %s\\n", 
                distance, gasLevel, leakDetected ? "YES" : "NO");
}

float readUltrasonicDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return EMPTY_DISTANCE; // Timeout
  
  float adjustedVelocity = SOUND_VELOCITY + (TEMP_COEFF * (temperature - 20.0));
  return (duration * adjustedVelocity) / 20000.0; // Convert to cm
}

float calculateGasLevel(float distance, float temp) {
  if (distance < FULL_DISTANCE) return 100.0;
  if (distance > EMPTY_DISTANCE) return 0.0;
  
  float level = ((EMPTY_DISTANCE - distance) / (EMPTY_DISTANCE - FULL_DISTANCE)) * 100.0;
  return constrain(level, 0.0, 100.0);
}

bool detectGasLeak() {
  int reading = analogRead(GAS_SENSOR_PIN);
  float voltage = reading * (3.3 / 4095.0);
  return voltage > LEAK_THRESHOLD;
}

void sendData() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  http.begin(apiBaseUrl + "/gas-level");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(anonKey));
  
  String payload = "{\\"level\\":" + String(gasLevel) + 
                  ",\\"temperature\\":" + String(temperature) + "}";
  
  int responseCode = http.POST(payload);
  if (responseCode > 0) {
    Serial.println("Data sent successfully");
  }
  http.end();
}

void testConnection() {
  HTTPClient http;
  http.begin(apiBaseUrl + "/health");
  http.addHeader("Authorization", "Bearer " + String(anonKey));
  
  int responseCode = http.GET();
  Serial.printf("API Test Response: %d\\n", responseCode);
  http.end();
}

void handleEmergency() {
  if (leakDetected) {
    // Flash LED and sound alarm
    digitalWrite(LED_PIN, millis() % 500 < 250);
    if (millis() % 1000 < 100) {
      tone(BUZZER_PIN, 1000, 100);
    }
  } else {
    digitalWrite(LED_PIN, HIGH);
    noTone(BUZZER_PIN);
  }
}`;
}