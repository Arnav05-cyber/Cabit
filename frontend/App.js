import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import { ActivityIndicator, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import FindRidesScreen from './src/screens/FindRidesScreen';
import OfferRideScreen from './src/screens/OfferRideScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import RideDetailScreen from './src/screens/RideDetailScreen';

import CompleteProfileScreen from './src/screens/auth/CompleteProfileScreen';

import './global.css';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tabs for main app
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF', shadowOpacity: 0, elevation: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
        headerTintColor: '#0F172A',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        headerTitleStyle: { fontWeight: '700', letterSpacing: 0, fontSize: 18 },
      }}
    >
      <Tab.Screen
        name="FindRides"
        component={FindRidesScreen}
        options={{
          title: 'Find Rides',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="OfferRide"
        component={OfferRideScreen}
        options={{
          title: 'Offer a Ride',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{
          title: 'My Bookings',
          headerShown: false, // Custom header in screen
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator handles Auth State
function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  // Determine if authenticated but missing critical profile details
  const isAuth = !!user;
  const needsProfile = isAuth && !user.isProfileComplete;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuth ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : needsProfile ? (
        // Registration Completion Gate
        <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      ) : (
        // Authenticated Stack
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="RideDetail"
            component={RideDetailScreen}
            options={{
              headerShown: true,
              title: 'Ride Details',
              headerStyle: { backgroundColor: '#FFFFFF', shadowOpacity: 0, elevation: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
              headerTintColor: '#0F172A',
              headerTitleStyle: { fontWeight: '700' },
              headerBackTitleVisible: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  console.log("LoginScreen:", LoginScreen);
  console.log("RegisterScreen:", RegisterScreen);
  console.log("MainTabs:", MainTabs);
  console.log("RideDetailScreen:", RideDetailScreen);
  return (
    <AuthProvider>
      <WebSocketProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </WebSocketProvider>
    </AuthProvider>
  );
}
