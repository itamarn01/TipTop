import React, { useState, useEffect, useCallback } from 'react';
import Constants from 'expo-constants';
import { View, Text, Button, StyleSheet, Animated, Modal, TouchableOpacity, Linking, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Api } from '../Api';
import { setAuth, clearAuth } from '../redux/slices/authSlice';
import { Provider, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { checkTrackingStatus, requestTrackingPermission } from 'react-native-tracking-transparency';
import LottieView from 'lottie-react-native';
import mobileAds from 'react-native-google-mobile-ads'; 
import i18n from '../i18n';

import { setTrackingPermission, clearTrackingPermission } from '../redux/slices/trackingSlice';
export default function Splash({ navigation }) {
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [isTrackingPermission, setIsTrackingPermission] = useState(false);
    const [trackingPermissionProcessEnd, setTrackingPermissionProcessEnd] =
        useState(false);
    const [animationEnded, setAnimationEnded] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateStatus, setUpdateStatus] = useState(null); // 'mustUpdate', 'recommendToUpdate'

    const animatedValues = Array(25).fill().map(() => new Animated.Value(0));
    const dispatch = useDispatch();

    useEffect(() => {
        if (!trackingPermissionProcessEnd) {
            console.log("tracking process doesn't finish");
            return;
        }
        /*  const animations = animatedValues.map((value, index) =>
             Animated.timing(value, {
                 toValue: 1,
                 duration: 5,
                 delay: 50,
                 useNativeDriver: true,
             })
         );
         Animated.sequence(animations).start(() => {
             setAnimationEnded(true);
         }); */

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
            navigation.navigate("SignIn")
            return null;
        }
    }

    const checkForUpdate = async () => {
        try {
            const currentVersion = Constants.expoConfig.version;
            console.log("currentVersion", currentVersion);
            const response = await axios.post(`${Api}/checkUpdate`, { currentVersion });
            const { updateStatus } = response.data;
            return updateStatus;
        } catch (error) {
            console.error('Error checking for update:', error);
            return 'noUpdate'; // Proceed if check fails
        }
    };

    const handleUpdate = () => {
        const url = Platform.OS === 'ios' 
            ? 'https://apps.apple.com/il/app/gigtune-%D7%92%D7%99%D7%92%D7%98%D7%99%D7%95%D7%9F/id1659825204?l=he'
            : 'https://play.google.com/store/apps/details?id=com.webixnow.gigtune&pcampaignid=web_share';
        
        Linking.openURL(url);
    };

    const proceedToApp = async () => {
        const token = await AsyncStorage.getItem('userToken');
        console.log("tokennnn:", token)
        if (token) {
            const user = await fetchUserDetails(token);
            if (user) {
                dispatch(setAuth({ token: token, user: user }));
                console.log("user.name", user.name)
                setLoading(false)
                setAnimationEnded(false)
                navigation.navigate("Main")
            } else {
                 setLoading(false); setAnimationEnded(false); navigation.navigate("SignIn");
            }
        } else { setLoading(false); setAnimationEnded(false); navigation.navigate("SignIn"); }
    };

    async function prepare() {
        try {
            console.log("check if anumationended")
            if (animationEnded) {
                const status = await checkForUpdate();
                console.log("Update status:", status);

                if (status === 'mustUpdate' || status === 'recommendToUpdate' || status === 'updateAvailable') {
                    setUpdateStatus(status);
                    setShowUpdateModal(true);
                    return;
                }

                await proceedToApp();
            }
        } catch (e) {
            console.warn(e);
            await proceedToApp(); // Fail safe
        }
    }


    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            const timer = setTimeout(() => {
                setAnimationEnded(true);
            }, 2000);

            return () => clearTimeout(timer);
        });

        return () => unsubscribe();
    }, [navigation]);

    useEffect(() => {
        // const unsubscribe = navigation.addListener('focus', async () => {
        prepare();
        // });
        /*  return () => unsubscribe(); */
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
            <StatusBar style="light" backgroundColor="#2471A3" translucent={true} />
            <View>

            </View>
            <LottieView
                source={require('../../assets/animation/icon.json')} // You'll need to add this animation
                autoPlay
                loop
                style={styles.animation}
            /*  onAnimationFinish={() => setAnimationEnded(true)} */
            />
            {/* <View style={styles.dotContainer}>{renderDots()}</View> */}

            <Modal
                transparent={true}
                visible={showUpdateModal}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {updateStatus === 'mustUpdate' ? 'Update Required' : 'Update Available'}
                        </Text>
                        <Text style={styles.modalText}>
                            {updateStatus === 'mustUpdate' 
                                ? 'A new version of TipTop is available. Please update to continue using the app.'
                                : 'A new version of TipTop is available. Would you like to update now?'}
                        </Text>
                        
                        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                            <Text style={styles.updateButtonText}>Update Now</Text>
                        </TouchableOpacity>

                        {(updateStatus === 'recommendToUpdate' || updateStatus === 'updateAvailable') && (
                            <TouchableOpacity 
                                style={styles.skipButton} 
                                onPress={() => {
                                    setShowUpdateModal(false);
                                    proceedToApp();
                                }}
                            >
                                <Text style={styles.skipButtonText}>Skip for now</Text>
                            </TouchableOpacity>
                        )}

                    </View>
                </View>
            </Modal>
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
    animation: {
        width: 200,
        height: 200,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
        lineHeight: 22,
    },
    updateButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        marginBottom: 10,
        width: '100%',
        alignItems: 'center',
    },
    updateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    skipButton: {
        paddingVertical: 10,
    },
    skipButtonText: {
        color: '#999',
        fontSize: 16,
    },
});
