import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Package, Truck, CheckCircle, MapPin } from "lucide-react";
import { apiCall } from "../utils/api";
import { toast } from "sonner@2.0.3";

type DeliveryStatus = "confirmed" | "preparing" | "out-for-delivery" | "delivered";

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: DeliveryStatus;
}

export function DeliveryTracking() {
  const [currentStatus, setCurrentStatus] = useState<DeliveryStatus>("preparing");
  const [currentOrderId, setCurrentOrderId] = useState<string>("EG2024-001");

  const trackingSteps: TrackingStep[] = [
    {
      id: "confirmed",
      title: "Order Confirmed",
      description: "Your order has been confirmed",
      icon: CheckCircle,
      status: "confirmed"
    },
    {
      id: "preparing",
      title: "Preparing",
      description: "Cylinder is being prepared for delivery",
      icon: Package,
      status: "preparing"
    },
    {
      id: "out-for-delivery",
      title: "Out for Delivery",
      description: "Your cylinder is on the way",
      icon: Truck,
      status: "out-for-delivery"
    },
    {
      id: "delivered",
      title: "Delivered",
      description: "Successfully delivered",
      icon: MapPin,
      status: "delivered"
    }
  ];

  const getStepStatus = (stepStatus: DeliveryStatus) => {
    const statusOrder = ["confirmed", "preparing", "out-for-delivery", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const simulateProgress = async (status: DeliveryStatus) => {
    try {
      await apiCall(`/orders/${currentOrderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      
      setCurrentStatus(status);
      toast.success(`Order status updated to: ${status.replace("-", " ")}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  // Fetch latest order on component mount
  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        const data = await apiCall('/orders');
        if (data.orders && data.orders.length > 0) {
          const latestOrder = data.orders[0];
          setCurrentOrderId(latestOrder.id);
          setCurrentStatus(latestOrder.status || "preparing");
        }
      } catch (error) {
        console.error("Error fetching latest order:", error);
      }
    };

    fetchLatestOrder();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="backdrop-blur-md bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Delivery Tracking</CardTitle>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              Order #{currentOrderId}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="relative">
            {trackingSteps.map((step, index) => {
              const status = getStepStatus(step.status);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="relative flex items-center mb-8 last:mb-0">
                  {/* Connecting Line */}
                  {index < trackingSteps.length - 1 && (
                    <div 
                      className={`absolute left-6 top-12 w-0.5 h-16 transition-all duration-500 ${
                        status === "completed" 
                          ? "bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50" 
                          : "bg-gray-600"
                      }`}
                    />
                  )}
                  
                  {/* Step Dot */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      status === "completed"
                        ? "bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50"
                        : status === "current"
                        ? "bg-blue-500/30 border-blue-400 shadow-lg shadow-blue-500/30"
                        : "bg-gray-700 border-gray-600"
                    }`}
                  >
                    <motion.div
                      animate={status === "current" ? {
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: status === "current" ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    >
                      <Icon 
                        className={`w-6 h-6 ${
                          status === "completed" || status === "current"
                            ? "text-white"
                            : "text-gray-400"
                        }`} 
                      />
                    </motion.div>
                  </motion.div>
                  
                  {/* Step Content */}
                  <div className="ml-6">
                    <h4 className={`font-medium ${
                      status === "completed" || status === "current"
                        ? "text-white"
                        : "text-gray-400"
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {step.description}
                    </p>
                    {status === "current" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2"
                      >
                        <Badge className="bg-blue-500/20 text-blue-400">
                          In Progress
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simulation Buttons */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-3">Simulate delivery progress:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => simulateProgress("out-for-delivery")}
                className="bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30"
              >
                Out for Delivery
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => simulateProgress("delivered")}
                className="bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30"
              >
                Delivered
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}