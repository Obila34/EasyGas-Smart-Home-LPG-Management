import { useEffect, useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { LiveDashboard } from "./components/LiveDashboard";
import { AIPrediction } from "./components/AIPrediction";
import { OrderCylinder } from "./components/OrderCylinder";
import { DeliveryTracking } from "./components/DeliveryTracking";
import { OrderHistory } from "./components/OrderHistory";
import { ESP32Integration } from "./components/ESP32Integration";
import { motion } from "motion/react";
import { Flame, Wifi, WifiOff, Radio, Tabs } from "lucide-react";
import { testBackendConnection, initializeBackend } from "./utils/api";
import { Badge } from "./components/ui/badge";
import { Tabs as TabsComponent, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

export default function App() {
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isConnected = await testBackendConnection();
        if (isConnected) {
          await initializeBackend();
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
          console.log('Backend not available - application will run in offline mode');
        }
      } catch (error) {
        console.error('Backend check failed:', error);
        setBackendStatus('error');
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 dark">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.1),transparent_50%)]" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0] 
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Flame className="w-8 h-8 text-blue-400" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white">EasyGas</h1>
          </div>
          <p className="text-gray-300 text-lg">Smart Home LPG Management System</p>
          
          {/* Backend Status Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {backendStatus === 'connecting' && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full mr-2"
                />
                Connecting to Backend
              </Badge>
            )}
            {backendStatus === 'connected' && (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                <Wifi className="w-3 h-3 mr-2" />
                Backend Connected
              </Badge>
            )}
            {backendStatus === 'error' && (
              <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                <WifiOff className="w-3 h-3 mr-2" />
                Offline Mode - Simulated Data
              </Badge>
            )}
          </div>
        </motion.header>

        {/* Main Dashboard */}
        <div className="max-w-6xl mx-auto space-y-8">
          <TabsComponent defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-800/50 border-slate-700">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                <Flame className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="hardware" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                <Radio className="w-4 h-4 mr-2" />
                ESP32 Hardware
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8">
              {/* Live Dashboard Section */}
              <section>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-semibold text-white mb-6"
                >
                  Live Dashboard
                </motion.h2>
                <LiveDashboard />
              </section>

              {/* AI Prediction & Order Section */}
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-semibold text-white mb-6"
                  >
                    Smart Insights
                  </motion.h2>
                  <AIPrediction />
                </div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl font-semibold text-white mb-6"
                  >
                    Quick Order
                  </motion.h2>
                  <OrderCylinder />
                </div>
              </section>

              {/* Delivery Tracking Section */}
              <section>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-2xl font-semibold text-white mb-6"
                >
                  Delivery Status
                </motion.h2>
                <DeliveryTracking />
              </section>

              {/* Order History Section */}
              <section>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-2xl font-semibold text-white mb-6"
                >
                  Order History
                </motion.h2>
                <OrderHistory />
              </section>
            </TabsContent>

            <TabsContent value="hardware" className="space-y-8">
              <section>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-semibold text-white mb-6 flex items-center gap-3"
                >
                  <Radio className="w-6 h-6 text-blue-400" />
                  ESP32 Hardware Integration
                </motion.h2>
                <ESP32Integration />
              </section>
            </TabsContent>
          </TabsComponent>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-16 py-8 border-t border-white/10"
        >
          <p className="text-gray-400">
            © 2024 EasyGas. Powered by smart home technology.
          </p>
        </motion.footer>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}