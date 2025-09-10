import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ShoppingCart, Package, Clock, MapPin } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { apiCall } from "../utils/api";

export function OrderCylinder() {
  const [selectedSize, setSelectedSize] = useState("14.2kg");
  const [isOrdering, setIsOrdering] = useState(false);

  const cylinderOptions = [
    { size: "5kg", price: "KES 1,800", description: "Perfect for small families" },
    { size: "14.2kg", price: "KES 2,800", description: "Most popular choice" },
    { size: "19kg", price: "KES 4,200", description: "For large households" }
  ];

  const handleOrder = async () => {
    setIsOrdering(true);
    
    try {
      const result = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify({
          size: selectedSize,
          customerInfo: {
            address: "Default address", // You can expand this later
          },
        }),
      });
      
      toast.success(`Order placed! ${selectedSize} cylinder will be delivered within 24 hours. Order ID: ${result.order.id}`);
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="backdrop-blur-md bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            Order New Cylinder
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Cylinder Selection */}
          <div className="space-y-3">
            <label className="text-gray-300">Select Cylinder Size</label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/20">
                {cylinderOptions.map((option) => (
                  <SelectItem key={option.size} value={option.size}>
                    <div className="flex justify-between items-center w-full">
                      <span>{option.size}</span>
                      <span className="text-blue-400 ml-4">{option.price}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Cylinder Details */}
          {selectedSize && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
            >
              {cylinderOptions.map((option) => 
                option.size === selectedSize && (
                  <div key={option.size} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{option.size} LPG Cylinder</p>
                        <p className="text-gray-300 text-sm">{option.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-400">{option.price}</p>
                    </div>
                  </div>
                )
              )}
            </motion.div>
          )}

          {/* Delivery Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-4 h-4 text-green-400" />
              <span>24hr delivery</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="w-4 h-4 text-green-400" />
              <span>Free delivery</span>
            </div>
          </div>

          {/* Order Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleOrder}
              disabled={isOrdering}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isOrdering ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Order Now
                </>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}