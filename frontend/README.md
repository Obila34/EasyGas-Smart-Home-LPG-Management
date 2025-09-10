# EasyGas Frontend Applications

User interfaces for the EasyGas Smart Home LPG Management system, including web dashboard and mobile applications.

## 📱 Mobile Application (`/mobile-app/`)

### Features
- **Real-time Monitoring**: Live gas level tracking and consumption data
- **Smart Alerts**: Push notifications for low gas, leaks, and maintenance reminders
- **Device Management**: Easy pairing, configuration, and control of IoT devices
- **Usage Analytics**: Historical consumption patterns and cost analysis
- **Emergency Features**: One-touch emergency contacts and safety procedures

### Technology Stack
- **Framework**: React Native for cross-platform development
- **State Management**: Redux Toolkit for predictable state management
- **Navigation**: React Navigation 6 for smooth app navigation
- **UI Components**: React Native Elements with custom theming
- **Real-time Updates**: Socket.io for live data synchronization
- **Push Notifications**: Firebase Cloud Messaging (FCM)

### Key Screens
```
├── Authentication
│   ├── Login Screen
│   ├── Registration Screen
│   └── Password Reset
├── Dashboard
│   ├── Home Overview
│   ├── Real-time Gas Levels
│   └── Quick Actions
├── Device Management
│   ├── Device List
│   ├── Add New Device
│   ├── Device Settings
│   └── Device Status
├── Analytics
│   ├── Usage History
│   ├── Consumption Trends
│   ├── Cost Analysis
│   └── Predictive Insights
├── Alerts & Notifications
│   ├── Alert History
│   ├── Alert Configuration
│   └── Emergency Contacts
└── Settings
    ├── Profile Management
    ├── Notification Settings
    ├── Security Settings
    └── App Preferences
```

### Mobile App Features

#### Dashboard Overview
```javascript
// Home dashboard component
const Dashboard = () => {
  const [gasLevel, setGasLevel] = useState(0);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Real-time gas level display
  const GasLevelIndicator = () => (
    <CircularProgress
      value={gasLevel}
      color={gasLevel > 20 ? 'green' : gasLevel > 10 ? 'orange' : 'red'}
      size="large"
      label={`${gasLevel}%`}
    />
  );

  // Device status cards
  const DeviceCard = ({ device }) => (
    <Card>
      <CardContent>
        <Text>{device.name}</Text>
        <Text style={{color: device.status === 'online' ? 'green' : 'red'}}>
          {device.status}
        </Text>
        <Text>Last update: {device.lastUpdate}</Text>
      </CardContent>
    </Card>
  );
};
```

#### Alert Management
```javascript
// Alert configuration screen
const AlertSettings = () => {
  const [alertRules, setAlertRules] = useState([]);

  const createAlertRule = (type, threshold, notifications) => {
    const newRule = {
      id: Date.now(),
      type, // 'low_gas', 'leak_detected', 'device_offline'
      threshold,
      notifications, // ['push', 'email', 'sms']
      isActive: true
    };
    
    // Save to backend
    api.post('/alerts', newRule);
    setAlertRules([...alertRules, newRule]);
  };
};
```

## 💻 Web Dashboard (`/web-app/`)

### Features
- **Admin Dashboard**: Comprehensive device and user management
- **Advanced Analytics**: Detailed reporting and data visualization
- **Multi-Device Management**: Centralized control for multiple installations
- **User Management**: Account administration and permissions
- **System Monitoring**: Real-time system health and performance metrics

### Technology Stack
- **Framework**: React 18 with TypeScript for type safety
- **State Management**: Redux Toolkit Query for efficient data fetching
- **UI Library**: Material-UI (MUI) with custom theme
- **Charts & Visualization**: Recharts for analytics and reporting
- **Real-time Updates**: WebSocket connection for live data
- **Build Tool**: Vite for fast development and building

### Dashboard Components

#### Analytics Dashboard
```typescript
// Gas consumption analytics component
interface ConsumptionData {
  date: string;
  consumption: number;
  cost: number;
  efficiency: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [consumptionData, setConsumptionData] = useState<ConsumptionData[]>([]);
  
  // Consumption trend chart
  const ConsumptionChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={consumptionData}>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="consumption" stroke="#8884d8" />
        <Line type="monotone" dataKey="cost" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );

  // Efficiency metrics
  const EfficiencyMetrics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Average Daily Usage"
          value="2.4 kg"
          change="+5%"
          positive={false}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Monthly Cost"
          value="$45.60"
          change="-8%"
          positive={true}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Efficiency Score"
          value="87%"
          change="+12%"
          positive={true}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Next Refill"
          value="8 days"
          change="On time"
          positive={true}
        />
      </Grid>
    </Grid>
  );
};
```

#### Device Management Interface
```typescript
// Device management dashboard
interface Device {
  id: string;
  name: string;
  type: 'gas_monitor' | 'leak_detector' | 'smart_valve';
  status: 'online' | 'offline' | 'warning';
  lastUpdate: Date;
  batteryLevel?: number;
  currentReading?: number;
}

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Device list with status indicators
  const DeviceList = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Device Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Update</TableCell>
            <TableCell>Battery</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell>{device.name}</TableCell>
              <TableCell>{device.type}</TableCell>
              <TableCell>
                <Chip
                  label={device.status}
                  color={getStatusColor(device.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {formatDate(device.lastUpdate)}
              </TableCell>
              <TableCell>
                {device.batteryLevel && (
                  <BatteryIndicator level={device.batteryLevel} />
                )}
              </TableCell>
              <TableCell>
                <IconButton onClick={() => editDevice(device)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => deleteDevice(device.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

## 🎨 UI/UX Design System

### Color Palette
```css
/* Primary colors */
--primary-main: #2196F3;
--primary-dark: #1976D2;
--primary-light: #BBDEFB;

/* Status colors */
--success: #4CAF50;
--warning: #FF9800;
--error: #F44336;
--info: #2196F3;

/* Gas level indicators */
--gas-full: #4CAF50;
--gas-medium: #FF9800;
--gas-low: #F44336;
--gas-critical: #D32F2F;
```

### Typography
```css
/* Font family */
font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;

/* Font sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
```

### Component Library
- **Gas Level Indicator**: Circular progress with color-coded levels
- **Device Status Card**: Compact device information display
- **Alert Badge**: Notification count with priority styling
- **Consumption Chart**: Interactive data visualization
- **Emergency Button**: Prominent safety action button

## 📱 Responsive Design

### Mobile-First Approach
- Touch-friendly interface design
- Swipe gestures for navigation
- Large tap targets for accessibility
- Optimized for one-handed use

### Tablet & Desktop Optimization
- Multi-column layouts for larger screens
- Advanced data tables and charts
- Keyboard navigation support
- Context menus and advanced controls

## 🔧 Development Setup

### Prerequisites
```bash
# Node.js and npm
node --version  # >= 16.x
npm --version   # >= 8.x

# React Native CLI (for mobile development)
npm install -g react-native-cli
npm install -g @react-native-community/cli
```

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd EasyGas-Smart-Home-LPG-Management

# Install web app dependencies
cd frontend/web-app
npm install

# Install mobile app dependencies
cd ../mobile-app
npm install

# iOS setup (macOS only)
cd ios
pod install
```

### Development Commands
```bash
# Web dashboard development
cd frontend/web-app
npm start              # Start development server
npm run build         # Build for production
npm run test          # Run tests
npm run lint          # Run linter

# Mobile app development
cd frontend/mobile-app
npm start             # Start Metro bundler
npm run android       # Run on Android
npm run ios           # Run on iOS (macOS only)
npm test              # Run tests
```

## 🧪 Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Hook testing with React Hooks Testing Library
- Utility function testing with Jest
- Snapshot testing for UI consistency

### Integration Testing
- API integration testing
- Navigation flow testing
- Real-time data synchronization testing
- Push notification testing

### End-to-End Testing
- Critical user journey testing
- Cross-platform compatibility testing
- Performance testing under load
- Accessibility testing (WCAG 2.1 compliance)

## 🚀 Deployment

### Web Dashboard Deployment
```bash
# Build for production
npm run build

# Deploy to AWS S3 + CloudFront
aws s3 sync build/ s3://easygas-web-dashboard
aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/*"
```

### Mobile App Deployment
```bash
# Android release build
cd android
./gradlew assembleRelease

# iOS release build (requires Xcode)
cd ios
xcodebuild -workspace EasyGas.xcworkspace -scheme EasyGas -configuration Release
```

The frontend applications provide intuitive, responsive interfaces for users to monitor and manage their LPG systems efficiently and safely.