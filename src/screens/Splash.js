import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet, Animated } from 'react-native';
import { Api } from '../Api';
import { setAuth, clearAuth } from '../redux/slices/authSlice';
import { Provider, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { checkTrackingStatus, requestTrackingPermission } from 'react-native-tracking-transparency';

import { setTrackingPermission, clearTrackingPermission } from '../redux/slices/trackingSlice';
export default function Splash({ navigation }) {
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [isTrackingPermission, setIsTrackingPermission] = useState(false);
    const [trackingPermissionProcessEnd, setTrackingPermissionProcessEnd] =
        useState(false);
    const [animationEnded, setAnimationEnded] = useState(false);
    const animatedValues = Array(25).fill().map(() => new Animated.Value(0));
    const dispatch = useDispatch();
    useEffect(() => {
        if (!trackingPermissionProcessEnd) {
            console.log("tracking process doesn't finish");
            return;
        }
        const animations = animatedValues.map((value, index) =>
            Animated.timing(value, {
                toValue: 1,
                duration: 5,
                delay: 50,
                useNativeDriver: true,
            })
        );
        Animated.sequence(animations).start(() => {
            setAnimationEnded(true);
        });

        // Animated.stagger(100, animations).start();
    }, [trackingPermissionProcessEnd]);

    const renderDots = () => {
        return animatedValues.map((value, index) => (
            <Animated.View
                key={index}
                style={[
                    styles.dot,
                    {
                        transform: [
                            {
                                scale: value.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 1],
                                }),
                            },
                        ],
                        opacity: value,
                    },
                ]}
            />
        ));
    };

    useEffect(() => {
        const getTrackingPermission = async () => {
            console.log("start tracking permission process.....");
            try {
                /* const status = await checkTrackingStatus();
                console.log("status tracking:", status);
                if (status === 'not-determined') { */
                const permission = await requestTrackingPermission();
                console.log("permission tracking:", permission);
                if (permission === 'authorized') {
                    setIsTrackingPermission(true);
                    dispatch(setIsTrackingPermission())
                    /*  state.isTrackingPermission = true */
                    console.log("Permission to track data granted.");
                }
                /*  } else if (status === 'authorized') {
                   setIsTrackingPermission(true);
                   console.log("Permission to track data granted.");
                 } */
            } catch (error) {
                console.log("Error during tracking permissions request:", error);
            } finally {
                console.log("Finalizing permissions and initializing ads...");

                setTrackingPermissionProcessEnd(true);
                await mobileAds().initialize();
                console.log("Ads initialized.");
            }
        };

        getTrackingPermission();
    }, []);



    async function fetchUserDetails(token) {
        try {

            const response = await axios.get(`${Api}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setName(response.data.name)
            return response.data.user;
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a non-2xx status code
                console.error('Error fetching user details:', error.response.data);
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Error fetching user details:', error.request);
            } else {
                // Something else happened in making the request
                console.error('Error fetching user details:', error.message);
            }
            await AsyncStorage.removeItem('userToken');
            dispatch(clearAuth())
            return null;
        }
    }

    useEffect(() => {
        async function prepare() {
            try {
                if (animationEnded) {
                    const token = await AsyncStorage.getItem('userToken');
                    console.log("tokennnn:", token)
                    if (token) {
                        const user = await fetchUserDetails(token);
                        dispatch(setAuth({ token: token, user: user }));
                        console.log("user.name", user.name)
                        setLoading(false)
                        navigation.navigate("Main")
                    } else { setLoading(false); navigation.navigate("SignIn"); }
                }
            } catch (e) {
                console.warn(e);
            }
        }

        prepare();
    }, [animationEnded]);

    /*  const onLayoutRootView = useCallback(async () => {
         if (appIsReady) {
             await SplashScreen.hideAsync();
         }
     }, [appIsReady]);
 
     if (!appIsReady) {
         return null;
     }
  */
    return (


        <View style={styles.container}>
            <View style={styles.dotContainer}>{renderDots()}</View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2471A3', // Deep blue background
    },
    dotContainer: {
        width: 200,
        height: 200,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#85C1E9', // Light blue dots
        margin: 5,
    },
});