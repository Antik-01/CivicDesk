// App.js
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getToken, removeToken } from './utils/auth';

// Import Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import UploadReportScreen from './screens/UploadReportScreen';
import MyReportsScreen from './screens/MyReportsScreen';
import AllReportsScreen from './screens/AllReportsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Profile screen with a logout button
const ProfileScreen = ({ setAuthStatus }) => {
  const handleLogout = async () => {
    await removeToken();
    setAuthStatus(false);
  };

  return (
    <View style={styles.profileContainer}>
      <Text style={styles.profileTitle}>Profile</Text>
      <Button title="Logout" onPress={handleLogout} color="red" />
    </View>
  );
};

function HomeTabs({ setAuthStatus }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Upload') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'My Reports') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'All Reports') {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Upload" component={UploadReportScreen} />
      <Tab.Screen name="My Reports" component={MyReportsScreen} />
      <Tab.Screen name="All Reports" component={AllReportsScreen} />
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} setAuthStatus={setAuthStatus} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = await getToken();
      setIsAuthenticated(!!token);
    };
    checkAuthStatus();
  }, []);

  const setAuthStatus = (status) => {
    setIsAuthenticated(status);
  };

  if (isAuthenticated === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <Stack.Screen name="Home">
            {(props) => <HomeTabs {...props} setAuthStatus={setAuthStatus} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} setAuthStatus={setAuthStatus} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});