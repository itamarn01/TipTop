import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';


import Icon from 'react-native-vector-icons/Ionicons';
import Home from '../screens/Home';

import Calendar from '../screens/Calendar';
import Profile from '../screens/Profile';
import ClientStack from './ClientStack';

const Tab = createBottomTabNavigator();

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'ClientStack') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Calendar') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={Home} options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#1F609A' },
                headerTintColor: '#fff', // This changes the text color to white
                headerTitleStyle: { fontWeight: 'bold', fontFamily: "Rubik-italic" }, // You can customize the font style if needed
            }} />
            <Tab.Screen name="ClientStack" component={ClientStack} options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#1F609A' },
                headerTintColor: '#fff', // This changes the text color to white
                headerTitleStyle: { fontWeight: 'bold', fontFamily: "Rubik-italic" }, // You can customize the font style if needed
            }} />
            <Tab.Screen name="Calendar" component={Calendar} options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#1F609A' },
                headerTintColor: '#fff', // This changes the text color to white
                headerTitleStyle: { fontWeight: 'bold', fontFamily: "Rubik-italic" }, // You can customize the font style if needed
            }} />
            <Tab.Screen name="Profile" component={Profile} options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#1F609A' },
                headerTintColor: '#fff', // This changes the text color to white
                headerTitleStyle: { fontWeight: 'bold', fontFamily: "Rubik-italic" }, // You can customize the font style if needed
            }} />
        </Tab.Navigator>
    );
}

export default TabNavigator;