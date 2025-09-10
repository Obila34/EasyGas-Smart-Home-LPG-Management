# Contributing to EasyGas Smart Home LPG Management

Thank you for your interest in contributing to the EasyGas project! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Getting Started
1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** from `main`
4. **Make your changes** following our coding standards
5. **Test your changes** thoroughly
6. **Submit a pull request** with a clear description

### Development Setup
```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/EasyGas-Smart-Home-LPG-Management.git
cd EasyGas-Smart-Home-LPG-Management

# Add upstream remote
git remote add upstream https://github.com/Obila34/EasyGas-Smart-Home-LPG-Management.git

# Install dependencies
npm install  # or yarn install
```

## 📋 Contribution Types

### Code Contributions
- **Bug fixes**: Resolve issues in existing functionality
- **Feature development**: Implement new features and capabilities
- **Performance improvements**: Optimize existing code and algorithms
- **Security enhancements**: Strengthen security measures and protocols

### Documentation Contributions
- **API documentation**: Improve or expand API reference materials
- **User guides**: Create or enhance user-facing documentation
- **Developer docs**: Contribute to technical documentation
- **Code comments**: Add meaningful comments to complex code sections

### Hardware Contributions
- **Sensor designs**: New sensor modules and improvements
- **Circuit schematics**: PCB designs and electrical diagrams
- **3D models**: Enclosure designs and mechanical components
- **Firmware**: Microcontroller code and embedded systems

## 🎯 Development Guidelines

### Code Style Standards

#### JavaScript/TypeScript
```javascript
// Use ES6+ features
const processGasData = async (deviceId, sensorData) => {
  try {
    const processedData = await validateSensorData(sensorData);
    return await storeSensorReading(deviceId, processedData);
  } catch (error) {
    logger.error(`Gas data processing failed: ${error.message}`);
    throw new ProcessingError('Failed to process gas sensor data');
  }
};

// Use meaningful variable names
const gasLevelPercentage = calculateGasLevel(currentWeight, emptyWeight, fullWeight);
const isLeakDetected = gasConcentration > LEAK_THRESHOLD;
```

#### Python (Data Processing)
```python
# Follow PEP 8 guidelines
class GasConsumptionAnalyzer:
    """Analyzes gas consumption patterns and predicts usage trends."""
    
    def __init__(self, device_id: str):
        self.device_id = device_id
        self.consumption_data = []
    
    def predict_refill_date(self, current_level: float, usage_rate: float) -> datetime:
        """Predict when the next refill will be needed."""
        if usage_rate <= 0:
            raise ValueError("Usage rate must be positive")
        
        days_remaining = current_level / usage_rate
        return datetime.now() + timedelta(days=days_remaining)
```

#### Hardware Code (Arduino/ESP32)
```cpp
// Use clear, descriptive function names
void readGasLevelSensor() {
    float rawReading = analogRead(LOAD_CELL_PIN);
    float calibratedWeight = applyCalibration(rawReading);
    float gasPercentage = calculateGasPercentage(calibratedWeight);
    
    // Send data if significant change detected
    if (abs(gasPercentage - lastGasLevel) > CHANGE_THRESHOLD) {
        transmitSensorData(gasPercentage);
        lastGasLevel = gasPercentage;
    }
}
```

### Git Workflow

#### Branch Naming Convention
```bash
# Feature branches
feature/gas-leak-detection
feature/mobile-app-notifications

# Bug fix branches
bugfix/sensor-calibration-error
bugfix/api-authentication-issue

# Hotfix branches
hotfix/critical-security-patch
hotfix/data-loss-prevention
```

#### Commit Message Format
```
type(scope): short description

Longer explanation if needed

Fixes #issue-number
```

Examples:
```bash
feat(sensors): add MQ-6 gas leak detection support

Implement support for MQ-6 sensors with calibration
routines and threshold-based leak detection.

Fixes #123

fix(api): resolve authentication token expiration

Update JWT token handling to properly refresh
expired tokens and maintain user sessions.

Fixes #456
```

### Testing Requirements

#### Unit Tests
- **Coverage**: Minimum 80% code coverage required
- **Test naming**: Descriptive test names that explain the scenario
- **Mocking**: Use proper mocking for external dependencies
- **Edge cases**: Test boundary conditions and error scenarios

```javascript
// Example test structure
describe('GasLevelCalculator', () => {
  describe('calculateGasPercentage', () => {
    it('should return 100% for full cylinder weight', () => {
      const calculator = new GasLevelCalculator(EMPTY_WEIGHT, FULL_WEIGHT);
      const result = calculator.calculateGasPercentage(FULL_WEIGHT);
      expect(result).toBe(100);
    });

    it('should throw error for invalid weight values', () => {
      const calculator = new GasLevelCalculator(10, 20);
      expect(() => {
        calculator.calculateGasPercentage(-5);
      }).toThrow('Weight cannot be negative');
    });
  });
});
```

#### Integration Tests
- **API endpoints**: Test complete request-response cycles
- **Database operations**: Verify data persistence and retrieval
- **Hardware simulation**: Mock sensor inputs and test responses
- **Real-time features**: Test WebSocket and MQTT communications

#### Hardware Tests
- **Sensor accuracy**: Validate sensor readings against known values
- **Communication**: Test wireless data transmission reliability
- **Power consumption**: Measure and optimize battery usage
- **Environmental**: Test under various temperature and humidity conditions

## 🐛 Bug Reports

### Before Reporting
1. **Search existing issues** to avoid duplicates
2. **Update to latest version** to ensure bug still exists
3. **Test in different environments** if possible
4. **Gather relevant information** (logs, configurations, etc.)

### Bug Report Template
```markdown
## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g., iOS 15.0, Android 11, Windows 10]
- Device: [e.g., iPhone 12, Samsung Galaxy S21]
- App Version: [e.g., 1.2.3]
- Hardware: [e.g., ESP32 v3.2, Load Cell Model X]

## Additional Context
Add any other context, logs, or screenshots.
```

## ✨ Feature Requests

### Feature Request Template
```markdown
## Feature Description
A clear description of the feature you'd like to see.

## Problem Statement
What problem would this feature solve?

## Proposed Solution
How would you like this feature to work?

## Alternatives Considered
What alternative solutions have you considered?

## Additional Context
Add any other context, mockups, or examples.
```

## 🔍 Code Review Process

### Pull Request Guidelines
1. **Clear description**: Explain what changes were made and why
2. **Link issues**: Reference related issues with `Fixes #123` or `Closes #456`
3. **Test coverage**: Include tests for new functionality
4. **Documentation**: Update relevant documentation
5. **Breaking changes**: Clearly mark any breaking changes

### Review Checklist
- [ ] Code follows project style guidelines
- [ ] Tests pass and coverage is adequate
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable
- [ ] Backward compatibility is maintained (unless breaking change)

### Review Timeline
- **Initial review**: Within 2-3 business days
- **Follow-up reviews**: Within 1 business day
- **Final approval**: After all feedback is addressed

## 🏆 Recognition

### Contributors
We recognize contributors in several ways:
- **GitHub contributors graph**: Automatic recognition for commits
- **Release notes**: Special mentions for significant contributions
- **Hall of fame**: Annual recognition for outstanding contributors
- **Swag**: Project stickers and merchandise for active contributors

### Contribution Levels
- **First-time contributor**: Welcome package and mentorship
- **Regular contributor**: Advanced project access and input on roadmap
- **Core contributor**: Repository permissions and release management
- **Maintainer**: Full project oversight and direction

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord Server**: Real-time chat with other contributors
- **Email**: `contributors@easygas.com` for sensitive matters

### Mentorship Program
New contributors can request mentorship for:
- Understanding the codebase
- Guidance on contribution process
- Code review and feedback
- Career development in IoT/hardware projects

## 📚 Resources

### Learning Materials
- **IoT Development**: [Link to IoT learning resources]
- **React Native**: [Link to React Native tutorials]
- **Arduino/ESP32**: [Link to embedded systems guides]
- **Gas Safety**: [Link to LPG safety standards and regulations]

### Tools and Setup
- **Development Environment**: [Setup guide]
- **Testing Tools**: [Testing framework documentation]
- **Deployment**: [CI/CD pipeline information]
- **Hardware Tools**: [Required development hardware]

Thank you for contributing to EasyGas! Together, we're making smart home gas management safer and more efficient for everyone. 🏠⚡