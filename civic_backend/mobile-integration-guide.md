# Mobile App Integration Guide

This FastAPI backend is fully compatible with mobile applications. Here's how to integrate it with popular mobile frameworks:

## API Endpoints for Mobile

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile

### Reports
- `POST /api/reports/upload` - Upload report with image (FormData)
- `GET /api/reports/my` - Get user's reports
- `POST /api/reports/nearby` - Get reports near location
- `GET /api/reports/stats` - Get dashboard statistics
- `GET /api/reports/categories` - Get available categories

## React Native Integration

### 1. Install Dependencies
```bash
npm install @react-native-async-storage/async-storage
npm install react-native-image-picker
npm install @react-native-community/geolocation
```

### 2. Authentication Service
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://your-backend-url';

class AuthService {
  async login(username, password) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      await AsyncStorage.setItem('token', data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      return data;
    }
    throw new Error('Login failed');
  }

  async getToken() {
    return await AsyncStorage.getItem('token');
  }

  async logout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  }
}
```

### 3. Report Upload with Camera
```javascript
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';

class ReportService {
  async uploadReport(text, category, imageUri = null) {
    const token = await AsyncStorage.getItem('token');
    
    // Get current location
    const location = await this.getCurrentLocation();
    
    const formData = new FormData();
    formData.append('text', text);
    formData.append('category', category);
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    
    if (imageUri) {
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'report.jpg'
      });
    }

    const response = await fetch(`${API_BASE}/api/reports/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    });

    return response.json();
  }

  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position.coords),
        error => reject(error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    });
  }

  async getNearbyReports(radius = 5) {
    const token = await AsyncStorage.getItem('token');
    const location = await this.getCurrentLocation();
    
    const response = await fetch(`${API_BASE}/api/reports/nearby`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        radius_km: radius
      })
    });

    return response.json();
  }
}
```

## Flutter Integration

### 1. Dependencies (pubspec.yaml)
```yaml
dependencies:
  http: ^0.13.5
  shared_preferences: ^2.0.15
  image_picker: ^0.8.6
  geolocator: ^9.0.2
  permission_handler: ^10.2.0
```

### 2. API Service
```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://your-backend-url';
  
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['access_token']);
      return data;
    }
    throw Exception('Login failed');
  }

  Future<Map<String, dynamic>> uploadReport({
    required String text,
    required String category,
    required double latitude,
    required double longitude,
    File? image,
  }) async {
    final token = await getToken();
    final uri = Uri.parse('$baseUrl/api/reports/upload');
    final request = http.MultipartRequest('POST', uri);
    
    request.headers['Authorization'] = 'Bearer $token';
    request.fields['text'] = text;
    request.fields['category'] = category;
    request.fields['latitude'] = latitude.toString();
    request.fields['longitude'] = longitude.toString();
    
    if (image != null) {
      request.files.add(await http.MultipartFile.fromPath('image', image.path));
    }

    final response = await request.send();
    final responseData = await response.stream.bytesToString();
    return jsonDecode(responseData);
  }
}
```

## Mobile-Specific Features Added

1. **File Size Validation**: 10MB limit for mobile uploads
2. **Nearby Reports**: Location-based queries for map views
3. **Report Statistics**: Dashboard data for mobile UI
4. **Category Endpoints**: Predefined categories with icons
5. **Database Indexing**: Optimized for mobile query patterns
6. **Error Handling**: Mobile-friendly error responses

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Token Storage**: Use secure storage (Keychain/Keystore)
3. **API Rate Limiting**: Implement rate limiting for mobile endpoints
4. **Image Validation**: Server-side image validation and processing
5. **Location Privacy**: Allow users to opt-out of location sharing

## Testing Mobile Integration

Use tools like:
- **Postman**: Test API endpoints
- **React Native Debugger**: Debug network requests
- **Flutter Inspector**: Monitor API calls
- **Charles Proxy**: Inspect mobile traffic

The backend is now fully optimized for mobile app integration with enhanced features specifically designed for mobile use cases.