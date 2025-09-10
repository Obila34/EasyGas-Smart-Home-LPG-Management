import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  console.log(`Request: ${req.method} ${path}`);

  try {
    // Health check endpoint
    if (path === '/make-server-aa295c22/health') {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          server: 'EasyGas Backend'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gas level endpoints
    if (path === '/make-server-aa295c22/gas-level') {
      if (req.method === 'GET') {
        let gasLevel = await kv.get('current_gas_level');
        if (gasLevel === undefined || gasLevel === null) {
          gasLevel = 68.5; // Default starting level
          await kv.set('current_gas_level', gasLevel);
        }
        
        // Ensure gas level is within valid range
        gasLevel = Math.max(0, Math.min(100, gasLevel));
        
        const response = { 
          level: parseFloat(gasLevel.toFixed(1)),
          timestamp: new Date().toISOString()
        };
        
        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (req.method === 'POST') {
        const { level } = await req.json();
        if (typeof level !== 'number' || level < 0 || level > 100) {
          return new Response(
            JSON.stringify({ error: 'Invalid gas level. Must be between 0-100' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const roundedLevel = parseFloat(level.toFixed(1));
        await kv.set('current_gas_level', roundedLevel);
        await kv.set('last_gas_update', new Date().toISOString());
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            level: roundedLevel,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Leak status endpoints
    if (path === '/make-server-aa295c22/leak-status') {
      if (req.method === 'GET') {
        let leakStatus = await kv.get('leak_detected');
        if (leakStatus === undefined) {
          leakStatus = false;
          await kv.set('leak_detected', leakStatus);
        }
        return new Response(
          JSON.stringify({ leakDetected: leakStatus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (req.method === 'POST') {
        const { leakDetected } = await req.json();
        if (typeof leakDetected !== 'boolean') {
          return new Response(
            JSON.stringify({ error: 'Invalid leak status. Must be boolean' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        await kv.set('leak_detected', leakDetected);
        return new Response(
          JSON.stringify({ success: true, leakDetected }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Emergency shutoff endpoint
    if (path === '/make-server-aa295c22/emergency-shutoff') {
      if (req.method === 'POST') {
        const { action } = await req.json();
        if (action !== 'shutoff') {
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        await kv.set('gas_valve_status', 'closed');
        await kv.set('leak_detected', false);
        await kv.set('emergency_shutoff_time', new Date().toISOString());
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Gas supply shut off successfully',
            timestamp: new Date().toISOString(),
            valve_status: 'closed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Initialize endpoint
    if (path === '/make-server-aa295c22/initialize') {
      if (req.method === 'POST') {
        // Set default gas level if not exists
        const gasLevel = await kv.get('current_gas_level');
        if (gasLevel === undefined || gasLevel === null) {
          await kv.set('current_gas_level', 68.5);
          await kv.set('last_gas_update', new Date().toISOString());
        }
        
        // Set default leak status
        const leakStatus = await kv.get('leak_detected');
        if (leakStatus === undefined) {
          await kv.set('leak_detected', false);
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Data initialized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Orders endpoints (simplified for testing)
    if (path === '/make-server-aa295c22/orders') {
      if (req.method === 'GET') {
        return new Response(
          JSON.stringify({ orders: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (req.method === 'POST') {
        const { size, customerInfo } = await req.json();
        const orderId = `EG${Date.now()}`;
        const order = {
          id: orderId,
          size,
          customerInfo,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        
        return new Response(
          JSON.stringify({ success: true, order }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Predictions endpoint
    if (path === '/make-server-aa295c22/predictions') {
      if (req.method === 'GET') {
        const gasLevel = await kv.get('current_gas_level') || 68;
        const dailyUsage = 2.3;
        const daysRemaining = Math.round(gasLevel / dailyUsage);
        const nextRefillDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
        
        const predictions = {
          nextRefill: `${daysRemaining} days`,
          nextRefillDate: nextRefillDate.toISOString(),
          usageTrend: '+15%',
          peakHours: '6-8 PM',
          smartTip: `Consider scheduling your next delivery for ${nextRefillDate.toLocaleDateString('en-KE')} to avoid running out during peak usage hours.`
        };
        
        return new Response(
          JSON.stringify({ predictions }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 404 for unknown paths
    return new Response(
      JSON.stringify({ error: 'Not found', path }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});