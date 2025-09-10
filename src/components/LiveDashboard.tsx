import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CircularProgress } from "./CircularProgress";
import { AlertTriangle, CheckCircle, RefreshCw, Phone, ShieldX, AlertCircle, Power } from "lucide-react";
import { apiCall, apiCallWithRetry, initializeBackend, getFallbackGasData, getFallbackLeakData } from "../utils/api";
import { toast } from "sonner@2.0.3";

export function LiveDashboard() {
  const [gasLevel, setGasLevel] = useState(68);
  const [isLeakDetected, setIsLeakDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSimulatingLeak, setIsSimulatingLeak] = useState(false);

  const getGasLevelColor = (level: number) => {
    if (level <= 15) return "text-red-400";
    if (level <= 30) return "text-orange-400";
    return "text-white";
  };

  const getGasLevelMessage = (level: number) => {
    if (level <= 15) return "Low gas! Order soon";
    if (level <= 30) return "Consider ordering";
    return "Gas level normal";
  };

  // Fetch initial data and set up real-time updates
  useEffect(() => {
    const fetchGasData = async () => {
      try {
        console.log('Fetching initial gas data...');
        
        // Initialize backend data
        await initializeBackend();

        // Fetch gas level with retry
        const gasData = await apiCallWithRetry('/gas-level');
        setGasLevel(gasData.level);
        setLastUpdated(new Date());
        console.log('Gas level fetched successfully:', gasData.level);

        // Fetch leak status with retry
        const leakData = await apiCallWithRetry('/leak-status');
        setIsLeakDetected(leakData.leakDetected);
        console.log('Leak status fetched successfully:', leakData.leakDetected);
        
        toast.success("Gas monitoring system connected", {
          description: "Real-time data is now available",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error fetching gas data:", error);
        
        // Use fallback data
        const fallbackGasData = getFallbackGasData();
        const fallbackLeakData = getFallbackLeakData();
        
        setGasLevel(fallbackGasData.level);
        setIsLeakDetected(fallbackLeakData.leakDetected);
        setLastUpdated(new Date());
        
        toast.warning("Operating in offline mode", {
          description: "Using simulated data. Backend will auto-reconnect when available.",
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGasData();

    // Set up periodic updates (simulate real-time monitoring)
    const interval = setInterval(async () => {
      try {
        console.log('Periodic update: fetching gas data...');
        
        // Fetch current gas level from backend
        const gasData = await apiCallWithRetry('/gas-level');
        const currentLevel = gasData.level;
        
        // Simulate slight gas level decrease over time
        const newLevel = Math.max(0, currentLevel - Math.random() * 0.1);
        
        // Update gas level in backend
        await apiCallWithRetry('/gas-level', {
          method: 'POST',
          body: JSON.stringify({ level: newLevel }),
        });
        
        setGasLevel(newLevel);
        setLastUpdated(new Date());
        console.log('Periodic update successful, new level:', newLevel);
        
        // Very rare leak simulation (0.1% chance)
        if (Math.random() < 0.001) {
          await apiCallWithRetry('/leak-status', {
            method: 'POST',
            body: JSON.stringify({ leakDetected: true }),
          });
          setIsLeakDetected(true);
          // Clear after 5 seconds
          setTimeout(async () => {
            try {
              await apiCallWithRetry('/leak-status', {
                method: 'POST',
                body: JSON.stringify({ leakDetected: false }),
              });
              setIsLeakDetected(false);
            } catch (error) {
              console.error("Error clearing simulated leak:", error);
            }
          }, 5000);
        }
      } catch (error) {
        console.error("Error in periodic update:", error);
        // Silently continue with local simulation if backend fails
        const currentLevel = gasLevel;
        const newLevel = Math.max(0, currentLevel - Math.random() * 0.1);
        setGasLevel(newLevel);
        setLastUpdated(new Date());
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []); // Empty dependency array to run only once

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('Manual refresh triggered...');
      
      // Fetch current gas level
      const gasData = await apiCallWithRetry('/gas-level');
      setGasLevel(gasData.level);
      setLastUpdated(new Date());

      // Fetch leak status
      const leakData = await apiCallWithRetry('/leak-status');
      setIsLeakDetected(leakData.leakDetected);

      toast.success("Data refreshed successfully");
      console.log('Manual refresh completed successfully');
    } catch (error) {
      console.error("Error refreshing gas data:", error);
      
      // Use fallback data and continue
      const fallbackGasData = getFallbackGasData();
      const fallbackLeakData = getFallbackLeakData();
      
      setGasLevel(fallbackGasData.level);
      setIsLeakDetected(fallbackLeakData.leakDetected);
      setLastUpdated(new Date());
      
      toast.error("Refresh failed - using simulated data", {
        description: "Backend connection error. Check server logs.",
        duration: 5000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEmergencyCall = () => {
    // Simulate emergency call action
    toast.error("Emergency call initiated to 999", {
      description: "Emergency services have been notified of the gas leak",
      duration: 5000,
    });
  };

  const handleShutoffGas = async () => {
    try {
      // Simulate remote gas shutoff
      const response = await apiCall('/emergency-shutoff', {
        method: 'POST',
        body: JSON.stringify({ action: "shutoff" }),
      });

      toast.success("Gas supply shut off successfully", {
        description: "Remote gas valve has been closed for safety",
        duration: 5000,
      });
      setIsLeakDetected(false); // Clear leak after shutoff
    } catch (error) {
      console.error("Error shutting off gas:", error);
      toast.error("Emergency shutoff failed", {
        description: "Please manually shut off the gas valve immediately",
        duration: 5000,
      });
    }
  };

  const handleEvacuate = () => {
    toast.warning("Evacuation protocol activated", {
      description: "Leave the premises immediately and ventilate the area",
      duration: 10000,
    });
  };

  const handleSimulateLeak = async () => {
    setIsSimulatingLeak(true);
    try {
      // Simulate a gas leak for testing
      await apiCall('/leak-status', {
        method: 'POST',
        body: JSON.stringify({ leakDetected: true }),
      });
      
      setIsLeakDetected(true);
      toast.warning("Gas leak simulation activated", {
        description: "This is a test of the emergency system",
        duration: 3000,
      });
      
      // Auto-clear after 30 seconds for demo
      setTimeout(async () => {
        try {
          await apiCall('/leak-status', {
            method: 'POST',
            body: JSON.stringify({ leakDetected: false }),
          });
          setIsLeakDetected(false);
        } catch (error) {
          console.error("Error clearing simulated leak:", error);
        }
      }, 30000);
      
    } catch (error) {
      console.error("Error simulating leak:", error);
      toast.error("Failed to simulate leak", {
        description: "Backend connection error",
        duration: 5000,
      });
    } finally {
      setIsSimulatingLeak(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gas Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader className="text-center">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Current Gas Level</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                >
                  <motion.div
                    animate={isRefreshing ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full"
                  />
                  <p className="text-gray-400">Loading gas level...</p>
                </div>
              ) : (
                <>
                  <CircularProgress percentage={gasLevel} size={150} />
                  <div className="text-center">
                    <p className={`text-lg font-semibold ${getGasLevelColor(gasLevel)}`}>
                      {getGasLevelMessage(gasLevel)}
                    </p>
                    <p className="text-gray-300 mt-2">Estimated days remaining</p>
                    <p className="text-xl font-bold text-white">
                      {Math.round((gasLevel / 2.3))} days
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Based on daily usage: 2.3%
                    </p>
                    {lastUpdated && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Gas Leak Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card 
            className={`backdrop-blur-md border-white/10 transition-all duration-300 ${
              isLeakDetected 
                ? "bg-red-500/20 border-red-500/50" 
                : "bg-white/5"
            }`}
          >
            <CardHeader className="text-center">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Gas Leak Detection</CardTitle>
                {!isLeakDetected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSimulateLeak}
                    disabled={isSimulatingLeak}
                    className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10"
                  >
                    {isSimulatingLeak ? "Simulating..." : "Test Leak"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <motion.div
                animate={{ 
                  scale: isLeakDetected ? [1, 1.1, 1] : 1,
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: isLeakDetected ? Infinity : 0,
                  repeatType: "reverse"
                }}
              >
                {isLeakDetected ? (
                  <AlertTriangle 
                    className="w-16 h-16 text-red-400" 
                  />
                ) : (
                  <CheckCircle 
                    className="w-16 h-16 text-green-400" 
                  />
                )}
              </motion.div>
              
              <div className="text-center">
                <p 
                  className={`text-xl font-bold ${
                    isLeakDetected ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {isLeakDetected ? "LEAK DETECTED!" : "SYSTEM NORMAL"}
                </p>
                <p className="text-gray-300 mt-2">
                  {isLeakDetected 
                    ? "Immediate attention required" 
                    : "All sensors functioning properly"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Emergency Actions Panel - Only visible when leak is detected */}
      {isLeakDetected && (
        <motion.div
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Card className="backdrop-blur-md bg-red-500/10 border-red-500/30 border-2">
            <CardHeader className="text-center pb-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="flex items-center justify-center gap-3"
              >
                <AlertCircle className="w-8 h-8 text-red-400" />
                <CardTitle className="text-red-300 text-2xl">EMERGENCY ACTIONS</CardTitle>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </motion.div>
              <p className="text-red-200 mt-2">
                Take immediate action to ensure safety
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Emergency Call Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleEmergencyCall}
                    className="w-full h-20 bg-red-600 hover:bg-red-700 text-white border-red-500 flex flex-col items-center gap-2 shadow-lg"
                    size="lg"
                  >
                    <Phone className="w-6 h-6" />
                    <span className="font-semibold">Call Emergency</span>
                    <span className="text-xs opacity-90">999</span>
                  </Button>
                </motion.div>

                {/* Gas Shutoff Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleShutoffGas}
                    className="w-full h-20 bg-orange-600 hover:bg-orange-700 text-white border-orange-500 flex flex-col items-center gap-2 shadow-lg"
                    size="lg"
                  >
                    <Power className="w-6 h-6" />
                    <span className="font-semibold">Shut Off Gas</span>
                    <span className="text-xs opacity-90">Remote valve</span>
                  </Button>
                </motion.div>

                {/* Evacuation Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleEvacuate}
                    className="w-full h-20 bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500 flex flex-col items-center gap-2 shadow-lg"
                    size="lg"
                  >
                    <ShieldX className="w-6 h-6" />
                    <span className="font-semibold">Evacuate</span>
                    <span className="text-xs opacity-90">Leave premises</span>
                  </Button>
                </motion.div>
              </div>

              {/* Emergency Instructions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg"
              >
                <h4 className="text-red-300 font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Emergency Safety Protocol
                </h4>
                <ul className="text-red-200 text-sm space-y-1 list-disc list-inside">
                  <li>Do not use electrical switches or create sparks</li>
                  <li>Open windows and doors for ventilation</li>
                  <li>Evacuate all persons from the building</li>
                  <li>Call emergency services immediately</li>
                  <li>Do not re-enter until area is declared safe</li>
                </ul>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}