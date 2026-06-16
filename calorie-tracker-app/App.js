import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import HomeScreen     from './src/screens/HomeScreen';
import FoodScreen     from './src/screens/FoodScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import BMIScreen      from './src/screens/BMIScreen';
import ProfileScreen  from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const icon = (emoji) => ({ focused }) => (
  <Text style={{ fontSize: focused ? 24 : 20 }}>{emoji}</Text>
);

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopColor: '#eee',
              height: 60,
              paddingBottom: 8,
            },
            tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
            tabBarActiveTintColor: '#1a1a2e',
            tabBarInactiveTintColor: '#aaa',
          }}
        >
          <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarLabel:'Home',     tabBarIcon: icon('🏠') }} />
          <Tab.Screen name="Food"     component={FoodScreen}     options={{ tabBarLabel:'Food',     tabBarIcon: icon('🍽️') }} />
          <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel:'Calendar', tabBarIcon: icon('📅') }} />
          <Tab.Screen name="BMI"      component={BMIScreen}      options={{ tabBarLabel:'BMI',      tabBarIcon: icon('⚖️') }} />
          <Tab.Screen name="Profile"  component={ProfileScreen}  options={{ tabBarLabel:'Profile',  tabBarIcon: icon('👤') }} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
