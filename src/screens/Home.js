import {
    View,
    ImageBackground,
    Image,
    StyleSheet,
    RefreshControl,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    Dimensions,
    ActivityIndicator,
    Animated,
    I18nManager,
    Alert
} from "react-native";
import {
    BannerAd,
    BannerAdSize,
    TestIds,
    InterstitialAd,
    AdEventType,
    RewardedAd,
    RewardedAdEventType,
    RewardedInterstitialAd,
    mobileAds,
    AppOpenAd,
    AdsConsent,
    AdsConsentStatus,
    useForeground,
} from "react-native-google-mobile-ads";
import * as Animatable from 'react-native-animatable';
import axios from "axios";
//  import { Image } from 'expo-image';
// import FastImage from 'react-native-fast-image'
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from 'react-redux';
import { Api } from "../Api";
import LinearGradient from "react-native-linear-gradient";
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { setSelectedClient } from '../redux/slices/selectedClientSlice';

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const GuideLineBaseWidth = 414;
const GuideLineBaseHeight = 896;
const horizontalScale = (size) => (windowWidth / GuideLineBaseWidth) * size;
const verticalScale = (size) => (windowHeight / GuideLineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
    size + (horizontalScale(size) - size) * factor;

const iosAdmobBanner1 = "ca-app-pub-8754599705550429/1831775897";
const androidAdmobBanner1 = "ca-app-pub-8754599705550429/3683913611";
const productionID1 =
    Platform.OS === "android" ? androidAdmobBanner1 : iosAdmobBanner1;

const adUnitId1 = __DEV__ ? TestIds.ADAPTIVE_BANNER : productionID1;

const COLORS = {
    primary: '#2C3E50',       // Deep blue-gray
    secondary: '#3498DB',     // Bright blue
    success: '#27AE60',       // Emerald green
    warning: '#F1C40F', // Warm yellow
    female: '#FF69B4',      //pink
    background: '#F8FAFC',    // Light gray-blue
    white: '#FFFFFF',
    text: {
        primary: '#2C3E50',
        secondary: '#34495E',
        light: 'rgba(255, 255, 255, 0.95)',
    }
};

export default function Home({ navigation }) {
    const dispatch = useDispatch();
    const isTrackingPermission = useSelector((state) => state.tracking.isTrackingPermission);
    const user = useSelector((state) => state.auth.user);
    console.log("trackingpermos:", isTrackingPermission)
    console.log("user:", user)
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${Api}/home/user/${user._id}/stats`);
            setStats(response.data);
            console.log("stat:", response.data)
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchStats();
        });

        return () => {
            unsubscribe();
        };
    }, [navigation]);

    const handleClientPress = (client) => {
        dispatch(setSelectedClient(client));
        navigation.navigate("Patients", { screen: "Treatments" });
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: COLORS.background,
        }}>
            {user.package === "free" && <BannerAd
                //    ref={bannerRef}
                unitId={adUnitId1}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: !isTrackingPermission,
                    // You can change this setting depending on whether you want to use the permissions tracking we set up in the initializing
                }}
            />}

            <ScrollView style={styles.container}>
                <Animatable.View
                    animation="fadeIn"
                    duration={1500}
                    style={styles.welcomeContainer}
                >
                    <Text allowFontScaling={false} style={styles.greetingText}>
                        {(() => {
                            const hour = new Date().getHours();
                            if (hour > 4 && hour < 12) return 'Good Morning';
                            if (hour > 12 && hour < 17) return 'Good Afternoon';
                            if (hour > 17 && hour < 21) return 'Good Evening';
                            return 'Good Night';
                        })()}
                    </Text>
                    <Text allowFontScaling={false} style={styles.userName}>
                        {user.name || 'User'}
                    </Text>
                    <Text allowFontScaling={false} style={styles.welcomeMessage}>
                        {stats.clientCount > 0 ? "Welcome back to your therapy dashboard" : "Welcome to your therapy dashboard"}
                    </Text>
                </Animatable.View>
                {stats.clientCount === 0 &&
                    <Animatable.View
                        animation="fadeIn"
                        duration={1000}
                        style={styles.newUserContainer}
                    >
                        <Text allowFontScaling={false} style={styles.newUserText}>
                            Hey there! Welcome to TipTop! To kick things off, just add some patients and schedule their treatments. Let's get started!
                        </Text>
                        <TouchableOpacity
                            style={styles.newUserButton}
                            onPress={() => navigation.navigate('Patients')}
                        >
                            <Text allowFontScaling={false} style={styles.newUserButtonText}>Add Patients</Text>
                        </TouchableOpacity>
                    </Animatable.View>}

                <TouchableOpacity onPress={() => navigation.navigate('Patients')} style={styles.statsRow}>


                    <Animatable.View
                        animation="zoomIn"
                        duration={1000}
                        style={[styles.statsBox, { backgroundColor: COLORS.secondary }]}
                    >

                        <MaterialIcons name="people" size={24} color="#FFF" />
                        <Text allowFontScaling={false} style={styles.statsLabel}>Patients</Text>
                        <Text allowFontScaling={false} style={styles.statsValue}>{stats.clientCount}</Text>

                    </Animatable.View>



                    <Animatable.View
                        animation="zoomIn"
                        duration={1000}
                        delay={200}
                        style={[styles.statsBox, { backgroundColor: COLORS.female }]}
                    >
                        <MaterialIcons name="medical-services" size={24} color="#FFF" />
                        <Text allowFontScaling={false} style={styles.statsLabel}>Treatments</Text>
                        <Text allowFontScaling={false} style={styles.statsValue}>{stats.treatmentCount}</Text>
                    </Animatable.View>
                </TouchableOpacity>
                {stats.nextTreatment && (
                    <Animatable.View
                        animation="slideInDown"
                        duration={1000}
                        delay={600}
                    >
                        <ImageBackground
                            source={require('../../assets/treatment-bg.jpg')} // Make sure to add this image to your assets
                            style={styles.nextTreatmentCard}
                            imageStyle={styles.backgroundImage}
                        >
                            <LinearGradient
                                colors={[`${COLORS.primary}F0`, `${COLORS.primary}E0`]}
                                style={styles.gradientOverlay}
                            >
                                {/* <View style={styles.nextTreatmentContent}> */}
                                <TouchableOpacity
                                    onPress={() => handleClientPress(stats.nextTreatment.clientId)}
                                    style={styles.nextTreatmentContent}
                                >
                                    <View style={styles.titleContainer}>
                                        <MaterialIcons name="event" size={24} color="#FFF" />
                                        <Text allowFontScaling={false} style={styles.nextTreatmentTitle}>Next Treatment</Text>
                                    </View>

                                    <View style={styles.treatmentDetails}>
                                        <View style={styles.dateTimeContainer}>
                                            <MaterialIcons name="access-time" size={20} color="#FFF" />
                                            <Text allowFontScaling={false} style={styles.dateTimeText}>
                                                {new Date(stats.nextTreatment.treatmentDate).toLocaleString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </Text>
                                        </View>

                                        <View style={styles.dateTimeContainer}>
                                            <MaterialIcons name="calendar-today" size={20} color="#FFF" />
                                            <Text allowFontScaling={false} style={styles.dateTimeText}>
                                                {new Date(stats.nextTreatment.treatmentDate).toLocaleDateString([], {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </View>

                                    {stats.nextTreatment !== null ? (
                                        <View style={styles.clientInfo}>
                                            <MaterialIcons
                                                name={stats.nextTreatment.clientId.gender === 'male' ? 'face' : 'face-3'}
                                                size={24}
                                                color="#FFF"
                                            />
                                            <Text allowFontScaling={false} style={styles.clientName}>
                                                {stats.nextTreatment.clientId.name} {stats.nextTreatment.clientId.lastName}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Animatable.View
                                            animation="fadeIn"
                                            style={styles.emptyTreatmentContainer}
                                        >
                                            <MaterialIcons name="event-busy" size={40} color="rgba(255, 255, 255, 0.8)" />
                                            <Text allowFontScaling={false} style={styles.emptyTreatmentTitle}>No Upcoming Treatments</Text>
                                            <Text allowFontScaling={false} style={styles.emptyTreatmentText}>
                                                You don't have any treatments scheduled yet
                                            </Text>
                                        </Animatable.View>
                                    )}
                                </TouchableOpacity>
                            </LinearGradient>
                        </ImageBackground>
                    </Animatable.View>
                )

                }


                <Animatable.View
                    animation="fadeInUp"
                    duration={1000}
                    delay={400}
                    style={styles.paymentsCard}
                >
                    <View style={styles.paymentsHeader}>
                        <MaterialIcons name="account-balance-wallet" size={24} color="#014495" />
                        <Text allowFontScaling={false} style={styles.paymentsTitle}>Payments Overview</Text>
                    </View>

                    <View style={styles.paymentsGrid}>
                        <View style={[styles.paymentBox, styles.successPaymentBox]}>
                            <MaterialIcons name="check-circle" size={24} color={COLORS.success} />
                            <Text allowFontScaling={false} style={[styles.paymentLabel, { color: COLORS.text.secondary }]}>Paid</Text>
                            <Text allowFontScaling={false} style={[styles.paymentAmount, { color: COLORS.success }]}>
                                ${stats.payments.find(p => p._id === 'paid')?.totalAmount || 0}
                            </Text>
                        </View>

                        <View style={[styles.paymentBox, styles.warningPaymentBox]}>
                            <MaterialIcons name="schedule" size={24} color={COLORS.warning} />
                            <Text allowFontScaling={false} style={[styles.paymentLabel, { color: COLORS.text.secondary }]}>Pending</Text>
                            <Text allowFontScaling={false} style={[styles.paymentAmount, { color: COLORS.warning }]}>
                                ${stats.totalPending/*  ${stats.payments.find(p => p._id === 'pending')?.totalAmount || 0} */}
                            </Text>
                        </View>
                    </View>
                </Animatable.View>


            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 16,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4A90E2',
        marginBottom: 8,
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    paymentStatus: {
        fontSize: 16,
        color: '#666',
    },
    paymentAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    welcomeContainer: {
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    greetingText: {
        fontSize: 22,
        color: COLORS.text.light,
        fontWeight: '500',
        marginBottom: 5,
    },
    userName: {
        fontSize: 28,
        color: COLORS.white,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    welcomeMessage: {
        fontSize: 16,
        color: COLORS.text.light,
        fontWeight: '400',
    },
    nextTreatmentCard: {
        height: 180,
        marginBottom: 16,
        borderRadius: 15,
        overflow: 'hidden',
    },
    backgroundImage: {
        borderRadius: 15,
    },
    gradientOverlay: {
        flex: 1,
        borderRadius: 15,
        padding: 20,
    },
    nextTreatmentContent: {
        flex: 1,
    },
    nextTreatmentTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginLeft: 8, // Add space between icon and text
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    treatmentDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateTimeText: {
        color: '#FFF',
        fontSize: 16,
        marginLeft: 8,
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 10,
        borderRadius: 8,
    },
    clientName: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '500',
        marginLeft: 8,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    statsBox: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        // width: "40%",
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        minHeight: 120,
    },
    statsLabel: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 8,
        marginBottom: 4,
    },
    statsValue: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
    },
    paymentsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    paymentsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    paymentsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginLeft: 8,
    },
    paymentsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    paymentBox: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
    },
    paymentLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
    },
    paymentAmount: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    successPaymentBox: {
        backgroundColor: `${COLORS.success}15`, // 15% opacity
    },
    warningPaymentBox: {
        backgroundColor: `${COLORS.warning}15`, // 15% opacity
    },
    emptyTreatmentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        marginTop: 10,
    },
    emptyTreatmentTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginTop: 12,
        marginBottom: 4,
    },
    emptyTreatmentText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    newUserContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 12,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20,
    },
    newUserButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 10,
    },
    newUserButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    newUserText: {
        fontSize: 16,
        color: '#333', // You can adjust the color as needed
        textAlign: 'center', // Center the text
        marginBottom: 10, // Add some space below the text
    },
});