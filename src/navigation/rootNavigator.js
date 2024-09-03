/* import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

// Import your screens
import SignIn from '../screens/auth/SignIn';
import SignUp from '../screens/auth/SignUp';
import Home from '../screens/Home';
import Clients from '../screens/Clients';
import Calendar from '../screens/Calendar';
import Profile from '../screens/Profile';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="SignUp" component={SignUp} />
    </Stack.Navigator>
);

const MainTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Home') {
                    iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Clients') {
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
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Clients" component={Clients} />
        <Tab.Screen name="Calendar" component={Calendar} />
        <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
);

const RootNavigator = () => {
    const user = useSelector(state => state.user);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <Stack.Screen name="Main" component={MainTabs} />
                ) : (
                    <Stack.Screen name="Auth" component={AuthStack} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator; */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';


import AuthStack from './AuthStack'
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator();

const RootNavigator = ({ onReady }) => {
    return (
        <NavigationContainer onReady={onReady}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Auth" component={AuthStack} />
                <Stack.Screen name="Main" component={TabNavigator} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;