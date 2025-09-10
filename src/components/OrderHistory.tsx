import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle, XCircle, Clock, Package } from "lucide-react";
import { apiCall, initializeBackend } from "../utils/api";

interface Order {
  id: string;
  createdAt: string;
  size: string;
  amount: number;
  status: "delivered" | "cancelled" | "pending";
}

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Initialize data first
        await initializeBackend();

        // Fetch orders
        const result = await apiCall('/orders');
        setOrders(result.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "pending":
        return <Clock className="w-4 h-4 text-orange-400" />;
      default:
        return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            Delivered
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
            Cancelled
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="backdrop-blur-md bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Order History</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"
                />
                <p className="text-gray-400 mt-2">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">No orders found</p>
              </div>
            ) : (
              orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="text-white font-medium">Order #{order.id}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(order.createdAt).toLocaleDateString('en-KE')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-white font-medium">{order.size} Cylinder</p>
                        <p className="text-blue-400 font-semibold">
                          KES {order.amount?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 pt-4 border-t border-white/10"
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {orders.filter(o => o.status === "delivered").length}
                </p>
                <p className="text-sm text-gray-400">Delivered</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  KES {orders.filter(o => o.status === "delivered")
                    .reduce((sum, o) => sum + (o.amount || 0), 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">Total Spent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">
                  {Math.round(orders.filter(o => o.status === "delivered").length / 12 * 100)}%
                </p>
                <p className="text-sm text-gray-400">Reliability</p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}