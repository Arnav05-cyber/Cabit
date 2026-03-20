import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import { ActivityIndicator, View, Text } from 'react-native';

// Import Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import FindRidesScreen from './src/screens/FindRidesScreen';
import OfferRideScreen from './src/screens/OfferRideScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import RideDetailScreen from './src/screens/RideDetailScreen';

import './global.css';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tabs for main app
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1A237E' },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E3F2FD',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#1565C0',
        tabBarInactiveTintColor: '#90A4AE',
        headerTitleStyle: { fontWeight: '800', letterSpacing: 0.5 },
      }}
    >
      <Tab.Screen
        name="FindRides"
        component={FindRidesScreen}
        options={{
          title: 'Find Rides',
          tabBarIcon: () => <View><Text style={{fontSize: 20}}>🔍</Text></View>,
        }}
      />
      <Tab.Screen
        name="OfferRide"
        component={OfferRideScreen}
        options={{
          title: 'Offer a Ride',
          tabBarIcon: () => <View><Text style={{fontSize: 20}}>🚗</Text></View>,
        }}
      />
      <Tab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{
          title: 'My Bookings',
          headerShown: false, // Custom header in screen
          tabBarIcon: () => <View><Text style={{fontSize: 20}}>🎒</Text></View>,
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A237E' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated Stack
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="RideDetail"
            component={RideDetailScreen}
            options={{
              headerShown: true,
              title: 'Ride Details',
              headerStyle: { backgroundColor: '#1A237E' },
              headerTintColor: '#fff',
              headerBackTitleVisible: false,
            }}
          />
        </>
      ) : (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
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
