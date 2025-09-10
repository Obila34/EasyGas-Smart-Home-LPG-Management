import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Brain, TrendingUp, Calendar, Zap } from "lucide-react";
import { apiCall } from "../utils/api";

export function AIPrediction() {
  const [predictions, setPredictions] = useState([
    {
      icon: Calendar,
      title: "Next Refill",
      value: "Loading...",
      description: "Based on current usage pattern"
    },
    {
      icon: TrendingUp,
      title: "Usage Trend",
      value: "Loading...",
      description: "Higher than last month"
    },
    {
      icon: Zap,
      title: "Peak Hours",
      value: "Loading...",
      description: "Highest consumption window"
    }
  ]);
  const [smartTip, setSmartTip] = useState("Loading smart insights...");

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const data = await apiCall('/predictions');
        const { predictions: predData } = data;
        
        setPredictions([
          {
            icon: Calendar,
            title: "Next Refill",
            value: predData.nextRefill,
            description: "Based on current usage pattern"
          },
          {
            icon: TrendingUp,
            title: "Usage Trend",
            value: predData.usageTrend,
            description: "Higher than last month"
          },
          {
            icon: Zap,
            title: "Peak Hours",
            value: predData.peakHours,
            description: "Highest consumption window"
          }
        ]);
        
        setSmartTip(predData.smartTip);
      } catch (error) {
        console.error("Error fetching predictions:", error);
      }
    };

    fetchPredictions();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="backdrop-blur-md bg-white/5 border-white/10 relative overflow-hidden">
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-white flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-5 h-5 text-blue-400" />
            </motion.div>
            AI-Powered Predictions
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10 space-y-4">
          {predictions.map((prediction, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="flex items-center space-x-4 p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="p-2 rounded-lg bg-blue-500/20">
                <prediction.icon className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium">{prediction.title}</h4>
                <p className="text-gray-300 text-sm">{prediction.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-400">{prediction.value}</p>
              </div>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
          >
            <p className="text-sm text-gray-300">
              <span className="text-blue-400 font-medium">Smart Tip:</span> {smartTip}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}