import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';


import Icon from 'react-native-vector-icons/Ionicons';
import Home from '../screens/Home';

import Calendar from '../screens/Calendar';
import Profile from '../screens/Profile';
import ClientStack from './ClientStack';
import i18n from "../i18n";

const Tab = createBottomTabNavigator();

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Patients') {
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
                headerStyle: { backgroundColor: '#014495' },
                headerTintColor: '#fff', // This changes the text color to white
                headerTitleStyle: { fontWeight: 'bold', fontFamily: "Rubik-italic", /* fontSize: 24, */ }, // You can customize the font style if needed
                tabBarLabel: i18n.t('tabHome'),
                title: i18n.t('tabHome')
            }} />
            <Tab.Screen name="Patients" component={ClientStack} options={{
                headerShown: false,
                headerStyle: { backgroundColor: '#014495' },
                headerTintColor: '#fff', // This changes the text color to white
                headerTitleStyle: { fontWeight: 'bold', fontFamily: "Rubik-italic" }, // You can customize the font style if needed
                tabBarLabel: i18n.t('tabClients'),
                title: i18n.t('tabClients')
            }} />
            <Tab.Screen name="Calendar" component={Calendar} options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#014495' },
                headerTintColor: '#fff', // This changes the text color to white
                headerTitleStyle: { fontWeight: 'bold', fontFamily: "Rubik-italic" }, // You can customize the font style if needed
                tabBarLabel: i18n.t('tabCalendar'),
                title: i18n.t('tabCalendar')
            }} />
            <Tab.Screen name="Profile" component={Profile} options={{
                headerShown: true,
                headerStyle: { /* backgroundColor: '#4A90E2' */ backgroundColor: '#014495' },
                headerTintColor: '#fff', // This changes the text color to white
                headerTitleStyle: { fontWeight: 'bold', fontFamily: "Rubik-italic" }, // You can customize the font style if needed
                tabBarLabel: i18n.t('tabProfile'),
                title: i18n.t('tabProfile')
            }} />
        </Tab.Navigator>
    );
}

export default TabNavigator;