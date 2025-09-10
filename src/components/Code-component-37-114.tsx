import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Wifi, WifiOff, Zap, AlertTriangle, CheckCircle, Clock, Thermometer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { apiCall } from "../utils/api";
import { toast } from "sonner@2.0.3";

interface ESP32Status {
  isConnected: boolean;
  lastSeen: Date | null;
  batteryLevel?: number;
  wifiSignal?: number;
  temperature?: number;
  firmwareVersion?: string;
  uptimeSeconds?: number;
}

interface SensorReading {
  gasLevel: number;
  leakDetected: boolean;
  sensorVoltage: number;
  timestamp: Date;
  distanceCm?: number;
}

export function ESP32StatusMonitor() {
  const [esp32Status, setEsp32Status] = useState<ESP32Status>({
    isConnected: false,
    lastSeen: null
  });
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check ESP32 connection status
  const checkESP32Status = async () => {
    try {
      const gasData = await apiCall('/gas-level');
      const leakData = await apiCall('/leak-status');
      
      // If we get data, ESP32 is likely connected
      const now = new Date();
      const lastUpdate = new Date(gasData.timestamp);
      const timeDiff = now.getTime() - lastUpdate.getTime();
      const isConnected = timeDiff < 60000; // Consider connected if last update was within 1 minute
      
      setEsp32Status({
        isConnected,
        lastSeen: lastUpdate,
        // Mock additional data that would come from ESP32
        batteryLevel: 85,
        wifiSignal: -45,
        temperature: 28.5,
        firmwareVersion: "v1.2.0",
        uptimeSeconds: Math.floor(Date.now() / 1000) % 86400
      });

      setLatestReading({
        gasLevel: gasData.level,
        leakDetected: leakData.leakDetected,
        sensorVoltage: 1.2,
        timestamp: lastUpdate,
        distanceCm: 18.5
      });

    } catch (error) {
      console.error('Failed to check ESP32 status:', error);
      setEsp32Status(prev => ({ ...prev, isConnected: false }));
    } finally {
      setIsLoading(false);
    }
  };

  // Send test command to ESP32
  const sendTestCommand = async () => {
    try {
      await apiCall('/gas-level', {
        method: 'POST',
        body: JSON.stringify({ level: 75.0 })
      });
      toast.success("Test command sent to ESP32 successfully!");
      checkESP32Status();
    } catch (error) {
      toast.error("Failed to send test command to ESP32");
    }
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Format time since last seen
  const formatLastSeen = (date: Date | null) => {
    if (!date) return "Never";
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  useEffect(() => {
    checkESP32Status();
    const interval = setInterval(checkESP32Status, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full"
            />
            <span className="ml-2 text-gray-300">Checking ESP32 connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ESP32 Connection Status */}
      <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <motion.div
              animate={{ 
                scale: esp32Status.isConnected ? [1, 1.1, 1] : 1,
                color: esp32Status.isConnected ? "#00D4FF" : "#FF6B35"
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {esp32Status.isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </motion.div>
            ESP32 Hardware Status
            <Badge 
              variant="outline" 
              className={`ml-auto ${
                esp32Status.isConnected 
                  ? "bg-green-500/20 text-green-400 border-green-500/50" 
                  : "bg-red-500/20 text-red-400 border-red-500/50"
              }`}
            >
              {esp32Status.isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Last Seen */}
            <div className="text-center">
              <Clock className="w-4 h-4 mx-auto mb-1 text-blue-400" />
              <p className="text-sm text-gray-400">Last Seen</p>
              <p className="text-white font-medium">
                {formatLastSeen(esp32Status.lastSeen)}
              </p>
            </div>

            {/* Battery Level */}
            <div className="text-center">
              <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
              <p className="text-sm text-gray-400">Battery</p>
              <p className="text-white font-medium">
                {esp32Status.batteryLevel || "N/A"}%
              </p>
            </div>

            {/* WiFi Signal */}
            <div className="text-center">
              <Wifi className="w-4 h-4 mx-auto mb-1 text-green-400" />
              <p className="text-sm text-gray-400">WiFi Signal</p>
              <p className="text-white font-medium">
                {esp32Status.wifiSignal || "N/A"} dBm
              </p>
            </div>

            {/* Temperature */}
            <div className="text-center">
              <Thermometer className="w-4 h-4 mx-auto mb-1 text-orange-400" />
              <p className="text-sm text-gray-400">Temp</p>
              <p className="text-white font-medium">
                {esp32Status.temperature || "N/A"}°C
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-700">
            <div className="text-sm text-gray-400">
              <p>Firmware: {esp32Status.firmwareVersion || "Unknown"}</p>
              <p>Uptime: {esp32Status.uptimeSeconds ? formatUptime(esp32Status.uptimeSeconds) : "Unknown"}</p>
            </div>
            <Button 
              onClick={sendTestCommand}
              variant="outline"
              size="sm"
              className="bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30"
            >
              Send Test Command
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Latest Sensor Reading */}
      {latestReading && (
        <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-5 h-5 text-blue-400" />
              </motion.div>
              Live Sensor Data
              <Badge variant="outline" className="ml-auto bg-blue-500/20 text-blue-400 border-blue-500/50">
                Real-time
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Gas Level */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {latestReading.gasLevel.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-400">Gas Level</p>
              </div>

              {/* Leak Status */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {latestReading.leakDetected ? (
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400">Leak Status</p>
                <p className={`text-sm font-medium ${
                  latestReading.leakDetected ? "text-red-400" : "text-green-400"
                }`}>
                  {latestReading.leakDetected ? "DETECTED" : "Normal"}
                </p>
              </div>

              {/* Sensor Voltage */}
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {latestReading.sensorVoltage.toFixed(2)}V
                </div>
                <p className="text-sm text-gray-400">Sensor Voltage</p>
              </div>

              {/* Distance */}
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {latestReading.distanceCm?.toFixed(1) || "N/A"}cm
                </div>
                <p className="text-sm text-gray-400">Distance</p>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-slate-700">
              <p className="text-sm text-gray-400">
                Last reading: {latestReading.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ESP32 Connection Instructions */}
      {!esp32Status.isConnected && (
        <Card className="bg-amber-500/10 backdrop-blur border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="text-amber-400 font-medium mb-2">ESP32 Not Connected</h4>
                <div className="text-sm text-amber-200 space-y-1">
                  <p>• Check that your ESP32 is powered on and connected to WiFi</p>
                  <p>• Verify the Supabase credentials in your ESP32 firmware</p>
                  <p>• Monitor the ESP32 Serial output for connection errors</p>
                  <p>• Ensure your WiFi network allows outbound HTTPS requests</p>
                </div>
                <div className="mt-3">
                  <Button 
                    onClick={checkESP32Status}
                    variant="outline"
                    size="sm"
                    className="bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30"
                  >
                    Retry Connection
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}