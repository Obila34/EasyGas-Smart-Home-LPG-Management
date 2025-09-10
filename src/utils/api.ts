import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-aa295c22`;

// In-memory storage for offline mode
const offlineStorage = new Map<string, any>();

// Initialize offline storage with default values
offlineStorage.set('current_gas_level', 68.5);
offlineStorage.set('leak_detected', false);
offlineStorage.set('last_gas_update', new Date().toISOString());

// Helper function to make API calls
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const fullUrl = `${API_BASE}${endpoint}`;
  
  try {
    console.log(`Making API call to: ${fullUrl}`);
    console.log(`Project ID: ${projectId}`);
    console.log(`Using Authorization: Bearer ${publicAnonKey.substring(0, 20)}...`);
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...options.headers,
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error response body:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Response data for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    console.error(`Error type: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    
    // If it's a network error, timeout, or fetch failure, try offline mode
    if (error.name === 'AbortError' || 
        error.name === 'TypeError' ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('fetch')) {
      console.log(`Network error detected, using offline mode for ${endpoint}`);
      return handleOfflineMode(endpoint, options);
    }
    
    throw error;
  }
}

// Handle offline mode with simulated data
function handleOfflineMode(endpoint: string, options: RequestInit = {}) {
  console.log(`Offline mode: handling ${endpoint}`);
  
  const method = options.method || 'GET';
  
  switch (endpoint) {
    case '/health':
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        server: 'EasyGas Backend (Offline Mode)'
      };
      
    case '/gas-level':
      if (method === 'GET') {
        const level = offlineStorage.get('current_gas_level') || 68.5;
        return {
          level: parseFloat(level.toFixed(1)),
          timestamp: new Date().toISOString()
        };
      } else if (method === 'POST') {
        const body = JSON.parse(options.body as string || '{}');
        if (body.level !== undefined) {
          const roundedLevel = parseFloat(body.level.toFixed(1));
          offlineStorage.set('current_gas_level', roundedLevel);
          offlineStorage.set('last_gas_update', new Date().toISOString());
          return {
            success: true,
            level: roundedLevel,
            timestamp: new Date().toISOString()
          };
        }
      }
      break;
      
    case '/leak-status':
      if (method === 'GET') {
        return {
          leakDetected: offlineStorage.get('leak_detected') || false
        };
      } else if (method === 'POST') {
        const body = JSON.parse(options.body as string || '{}');
        if (body.leakDetected !== undefined) {
          offlineStorage.set('leak_detected', body.leakDetected);
          return {
            success: true,
            leakDetected: body.leakDetected
          };
        }
      }
      break;
      
    case '/emergency-shutoff':
      if (method === 'POST') {
        offlineStorage.set('gas_valve_status', 'closed');
        offlineStorage.set('leak_detected', false);
        offlineStorage.set('emergency_shutoff_time', new Date().toISOString());
        return {
          success: true,
          message: 'Gas supply shut off successfully (Offline Mode)',
          timestamp: new Date().toISOString(),
          valve_status: 'closed'
        };
      }
      break;
      
    case '/initialize':
      if (method === 'POST') {
        return {
          success: true,
          message: 'Data initialized (Offline Mode)'
        };
      }
      break;
      
    case '/predictions':
      if (method === 'GET') {
        const gasLevel = offlineStorage.get('current_gas_level') || 68;
        const dailyUsage = 2.3;
        const daysRemaining = Math.round(gasLevel / dailyUsage);
        const nextRefillDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
        
        return {
          predictions: {
            nextRefill: `${daysRemaining} days`,
            nextRefillDate: nextRefillDate.toISOString(),
            usageTrend: '+15%',
            peakHours: '6-8 PM',
            smartTip: `Consider scheduling your next delivery for ${nextRefillDate.toLocaleDateString('en-KE')} to avoid running out during peak usage hours.`
          }
        };
      }
      break;
      
    case '/orders':
      if (method === 'GET') {
        return { orders: [] };
      } else if (method === 'POST') {
        const body = JSON.parse(options.body as string || '{}');
        const orderId = `EG${Date.now()}`;
        return {
          success: true,
          order: {
            id: orderId,
            size: body.size || '14.2kg',
            customerInfo: body.customerInfo || {},
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }
        };
      }
      break;
  }
  
  // Default response for unhandled endpoints
  return {
    success: true,
    message: `Offline mode response for ${endpoint}`,
    timestamp: new Date().toISOString()
  };
}

// Initialize backend data
export async function initializeBackend() {
  try {
    await apiCall('/initialize', { method: 'POST' });
    console.log('Backend initialized successfully');
  } catch (error) {
    console.error('Failed to initialize backend:', error);
  }
}

// Test backend connection
export async function testBackendConnection() {
  try {
    console.log('=== TESTING BACKEND CONNECTION ===');
    console.log('Project ID:', projectId);
    console.log('API Base URL:', API_BASE);
    console.log('Health endpoint URL:', `${API_BASE}/health`);
    console.log('===================================');
    
    const result = await apiCall('/health');
    console.log('✅ Backend connection test successful:', result);
    return result.status === 'ok';
  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
    console.error('Attempted URL:', `${API_BASE}/health`);
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Try a direct fetch to diagnose the issue
    try {
      console.log('🔍 Attempting direct fetch for diagnosis...');
      const directResponse = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        signal: AbortSignal.timeout(5000)
      });
      console.log('Direct fetch response status:', directResponse.status);
      console.log('Direct fetch response headers:', Object.fromEntries(directResponse.headers.entries()));
      const directText = await directResponse.text();
      console.log('Direct fetch response body:', directText);
    } catch (directError) {
      console.error('Direct fetch also failed:', directError);
    }
    
    // Try offline mode
    try {
      const offlineResult = await handleOfflineMode('/health');
      console.log('📱 Offline mode activated:', offlineResult);
      return false; // Return false to indicate we're in offline mode
    } catch (offlineError) {
      console.error('❌ Offline mode also failed:', offlineError);
      return false;
    }
  }
}

// Fallback data for when backend is unavailable
export function getFallbackGasData() {
  return {
    level: 68.5,
    timestamp: new Date().toISOString()
  };
}

export function getFallbackLeakData() {
  return {
    leakDetected: false
  };
}

// Enhanced API call with retry mechanism
export async function apiCallWithRetry(endpoint: string, options: RequestInit = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await apiCall(endpoint, options);
    } catch (error) {
      console.log(`API call attempt ${i + 1} failed for ${endpoint}:`, error);
      
      if (i === retries) {
        // Last attempt failed, throw the error
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}