import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-aa295c22/health", (c) => {
  console.log("Health check endpoint hit");
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    server: "EasyGas Backend"
  });
});

// Gas monitoring endpoints
app.get("/make-server-aa295c22/gas-level", async (c) => {
  console.log("GET /gas-level endpoint hit");
  try {
    let gasLevel = await kv.get("current_gas_level");
    console.log("Retrieved gas level from KV:", gasLevel);
    
    if (gasLevel === undefined || gasLevel === null) {
      gasLevel = 68.5; // Default starting level
      await kv.set("current_gas_level", gasLevel);
      console.log("Set default gas level:", gasLevel);
    }
    
    // Ensure gas level is within valid range
    gasLevel = Math.max(0, Math.min(100, gasLevel));
    
    const response = { 
      level: parseFloat(gasLevel.toFixed(1)),
      timestamp: new Date().toISOString()
    };
    
    console.log("Returning gas level response:", response);
    return c.json(response);
  } catch (error) {
    console.log("Error fetching gas level:", error);
    return c.json({ error: "Failed to fetch gas level", details: error.message }, 500);
  }
});

app.post("/make-server-aa295c22/gas-level", async (c) => {
  try {
    const { level } = await c.req.json();
    if (typeof level !== "number" || level < 0 || level > 100) {
      return c.json({ error: "Invalid gas level. Must be between 0-100" }, 400);
    }
    
    // Round to 1 decimal place for consistency
    const roundedLevel = parseFloat(level.toFixed(1));
    await kv.set("current_gas_level", roundedLevel);
    await kv.set("last_gas_update", new Date().toISOString());
    
    return c.json({ 
      success: true, 
      level: roundedLevel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log("Error updating gas level:", error);
    return c.json({ error: "Failed to update gas level" }, 500);
  }
});

// Leak detection endpoints
app.get("/make-server-aa295c22/leak-status", async (c) => {
  try {
    let leakStatus = await kv.get("leak_detected");
    if (leakStatus === undefined) {
      leakStatus = false;
      await kv.set("leak_detected", leakStatus);
    }
    return c.json({ leakDetected: leakStatus });
  } catch (error) {
    console.log("Error fetching leak status:", error);
    return c.json({ error: "Failed to fetch leak status" }, 500);
  }
});

app.post("/make-server-aa295c22/leak-status", async (c) => {
  try {
    const { leakDetected } = await c.req.json();
    if (typeof leakDetected !== "boolean") {
      return c.json({ error: "Invalid leak status. Must be boolean" }, 400);
    }
    await kv.set("leak_detected", leakDetected);
    return c.json({ success: true, leakDetected });
  } catch (error) {
    console.log("Error updating leak status:", error);
    return c.json({ error: "Failed to update leak status" }, 500);
  }
});

// Emergency shutoff endpoint
app.post("/make-server-aa295c22/emergency-shutoff", async (c) => {
  try {
    const { action } = await c.req.json();
    if (action !== "shutoff") {
      return c.json({ error: "Invalid action" }, 400);
    }
    
    // Simulate emergency shutoff procedure
    await kv.set("gas_valve_status", "closed");
    await kv.set("leak_detected", false); // Clear leak status after shutoff
    await kv.set("emergency_shutoff_time", new Date().toISOString());
    
    console.log("Emergency gas shutoff activated");
    
    return c.json({ 
      success: true, 
      message: "Gas supply shut off successfully",
      timestamp: new Date().toISOString(),
      valve_status: "closed"
    });
  } catch (error) {
    console.log("Error performing emergency shutoff:", error);
    return c.json({ error: "Failed to perform emergency shutoff" }, 500);
  }
});

// Order management endpoints
app.post("/make-server-aa295c22/orders", async (c) => {
  try {
    const { size, customerInfo } = await c.req.json();
    
    const orderId = `EG${Date.now()}`;
    const order = {
      id: orderId,
      size,
      customerInfo,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
    
    await kv.set(`order_${orderId}`, order);
    
    // Add to orders list
    const orders = await kv.get("orders_list") || [];
    orders.unshift(orderId);
    await kv.set("orders_list", orders.slice(0, 50)); // Keep last 50 orders
    
    return c.json({ success: true, order });
  } catch (error) {
    console.log("Error creating order:", error);
    return c.json({ error: "Failed to create order" }, 500);
  }
});

app.get("/make-server-aa295c22/orders", async (c) => {
  try {
    const orderIds = await kv.get("orders_list") || [];
    const orders = [];
    
    for (const orderId of orderIds) {
      const order = await kv.get(`order_${orderId}`);
      if (order) {
        orders.push(order);
      }
    }
    
    return c.json({ orders });
  } catch (error) {
    console.log("Error fetching orders:", error);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

app.get("/make-server-aa295c22/orders/:orderId", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    const order = await kv.get(`order_${orderId}`);
    
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }
    
    return c.json({ order });
  } catch (error) {
    console.log("Error fetching order:", error);
    return c.json({ error: "Failed to fetch order" }, 500);
  }
});

app.put("/make-server-aa295c22/orders/:orderId/status", async (c) => {
  try {
    const orderId = c.req.param("orderId");
    const { status } = await c.req.json();
    
    const order = await kv.get(`order_${orderId}`);
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }
    
    order.status = status;
    order.updatedAt = new Date().toISOString();
    
    await kv.set(`order_${orderId}`, order);
    
    return c.json({ success: true, order });
  } catch (error) {
    console.log("Error updating order status:", error);
    return c.json({ error: "Failed to update order status" }, 500);
  }
});

// Emergency alert endpoint
app.post("/make-server-aa295c22/emergency-alert", async (c) => {
  try {
    const { alert_type, severity, timestamp, gas_level, sensor_voltage, sms_sent, voice_call_made } = await c.req.json();
    
    if (!alert_type || !severity) {
      return c.json({ error: "Missing required alert parameters" }, 400);
    }
    
    const alertId = `ALERT_${Date.now()}`;
    const alert = {
      id: alertId,
      alert_type,
      severity,
      timestamp: new Date(timestamp || Date.now()).toISOString(),
      gas_level: gas_level || null,
      sensor_voltage: sensor_voltage || null,
      sms_sent: sms_sent || false,
      voice_call_made: voice_call_made || false,
      acknowledged: false,
      created_at: new Date().toISOString()
    };
    
    // Store the alert
    await kv.set(`alert_${alertId}`, alert);
    
    // Add to alerts list (keep last 100 alerts)
    const alerts = await kv.get("alerts_list") || [];
    alerts.unshift(alertId);
    await kv.set("alerts_list", alerts.slice(0, 100));
    
    // Update system status if gas leak
    if (alert_type === "gas_leak") {
      await kv.set("leak_detected", true);
      await kv.set("last_emergency_alert", new Date().toISOString());
      
      // Log critical alert
      console.log(`CRITICAL ALERT: Gas leak detected at ${alert.timestamp}`);
      console.log(`Gas level: ${gas_level}%, Sensor voltage: ${sensor_voltage}V`);
      console.log(`SMS sent: ${sms_sent}, Voice call made: ${voice_call_made}`);
    }
    
    return c.json({ 
      success: true, 
      alert_id: alertId,
      message: "Emergency alert received and processed",
      alert
    });
  } catch (error) {
    console.log("Error processing emergency alert:", error);
    return c.json({ error: "Failed to process emergency alert" }, 500);
  }
});

// Get emergency alerts endpoint
app.get("/make-server-aa295c22/alerts", async (c) => {
  try {
    const alertIds = await kv.get("alerts_list") || [];
    const alerts = [];
    
    for (const alertId of alertIds.slice(0, 20)) { // Return last 20 alerts
      const alert = await kv.get(`alert_${alertId}`);
      if (alert) {
        alerts.push(alert);
      }
    }
    
    return c.json({ alerts });
  } catch (error) {
    console.log("Error fetching alerts:", error);
    return c.json({ error: "Failed to fetch alerts" }, 500);
  }
});

// Acknowledge alert endpoint
app.put("/make-server-aa295c22/alerts/:alertId/acknowledge", async (c) => {
  try {
    const alertId = c.req.param("alertId");
    const alert = await kv.get(`alert_${alertId}`);
    
    if (!alert) {
      return c.json({ error: "Alert not found" }, 404);
    }
    
    alert.acknowledged = true;
    alert.acknowledged_at = new Date().toISOString();
    await kv.set(`alert_${alertId}`, alert);
    
    console.log(`Alert ${alertId} acknowledged`);
    
    return c.json({ success: true, alert });
  } catch (error) {
    console.log("Error acknowledging alert:", error);
    return c.json({ error: "Failed to acknowledge alert" }, 500);
  }
});

// AI Predictions endpoint
app.get("/make-server-aa295c22/predictions", async (c) => {
  try {
    const gasLevel = await kv.get("current_gas_level") || 68;
    const usageHistory = await kv.get("usage_history") || [];
    
    // Simple AI prediction logic
    const dailyUsage = 2.3; // Average daily usage percentage
    const daysRemaining = Math.round(gasLevel / dailyUsage);
    const nextRefillDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
    
    const predictions = {
      nextRefill: `${daysRemaining} days`,
      nextRefillDate: nextRefillDate.toISOString(),
      usageTrend: "+15%",
      peakHours: "6-8 PM",
      smartTip: "Consider scheduling your next delivery for " + 
        nextRefillDate.toLocaleDateString('en-KE') + " to avoid running out during peak usage hours."
    };
    
    return c.json({ predictions });
  } catch (error) {
    console.log("Error generating predictions:", error);
    return c.json({ error: "Failed to generate predictions" }, 500);
  }
});

// Initialize default data
app.post("/make-server-aa295c22/initialize", async (c) => {
  try {
    // Set default gas level if not exists
    const gasLevel = await kv.get("current_gas_level");
    if (gasLevel === undefined || gasLevel === null) {
      await kv.set("current_gas_level", 68.5);
      await kv.set("last_gas_update", new Date().toISOString());
    }
    
    // Set default leak status
    const leakStatus = await kv.get("leak_detected");
    if (leakStatus === undefined) {
      await kv.set("leak_detected", false);
    }
    
    // Initialize sample order history if empty
    const orders = await kv.get("orders_list");
    if (!orders || orders.length === 0) {
      const sampleOrders = [
        {
          id: "EG2024001",
          size: "14.2kg",
          status: "delivered",
          createdAt: "2024-08-15T10:00:00Z",
          amount: 2800
        },
        {
          id: "EG2024002", 
          size: "14.2kg",
          status: "delivered",
          createdAt: "2024-07-22T14:30:00Z",
          amount: 2800
        },
        {
          id: "EG2024003",
          size: "19kg", 
          status: "cancelled",
          createdAt: "2024-06-30T09:15:00Z",
          amount: 4200
        }
      ];
      
      for (const order of sampleOrders) {
        await kv.set(`order_${order.id}`, order);
      }
      await kv.set("orders_list", sampleOrders.map(o => o.id));
    }
    
    return c.json({ success: true, message: "Data initialized" });
  } catch (error) {
    console.log("Error initializing data:", error);
    return c.json({ error: "Failed to initialize data" }, 500);
  }
});

Deno.serve(app.fetch);