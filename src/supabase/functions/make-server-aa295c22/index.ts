import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

// Simple in-memory storage for development/testing
const kvStore = new Map<string, any>();

// KV Store functions
const kv = {
  get: (key: string) => {
    return Promise.resolve(kvStore.get(key));
  },
  set: (key: string, value: any) => {
    kvStore.set(key, value);
    return Promise.resolve();
  },
  del: (key: string) => {
    kvStore.delete(key);
    return Promise.resolve();
  }
};

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
    
    return c.json({ success: true, message: "Data initialized" });
  } catch (error) {
    console.log("Error initializing data:", error);
    return c.json({ error: "Failed to initialize data" }, 500);
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

Deno.serve(app.fetch);