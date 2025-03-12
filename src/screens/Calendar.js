import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text, Platform
} from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import { useSelector } from 'react-redux';
import CalendarStats from '../components/CalendarStats';
import { Api } from '../Api';
import { useDispatch } from 'react-redux';
import { setSelectedClient } from '../redux/slices/selectedClientSlice';
import { TouchableOpacity } from 'react-native-gesture-handler';
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

const iosAdmobBanner1 = "ca-app-pub-8754599705550429~7718527397";
const androidAdmobBanner1 = "ca-app-pub-8754599705550429~4996995283";
const productionID1 =
    Platform.OS === "android" ? androidAdmobBanner1 : iosAdmobBanner1;

const adUnitId1 = __DEV__ ? TestIds.ADAPTIVE_BANNER : productionID1;
export default function Calendar({ navigation }) {
    const [selected, setSelected] = useState('');
    const [treatments, setTreatments] = useState([]);
    const [filteredTreatments, setFilteredTreatments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [markedDates, setMarkedDates] = useState({});
    const [currentMonth, setCurrentMonth] = useState('');
    const [monthlyStats, setMonthlyStats] = useState({
        totalTreatments: 0,
        totalRevenue: 0,
        uniqueClientsCount: 0,
        averagePrice: 0
    });
    const isTrackingPermission = useSelector((state) => state.tracking.isTrackingPermission);
    const user = useSelector((state) => state.auth.user);
    const userId = user._id
    const dispatch = useDispatch();
    // console.log("userId:", userId)
    const fetchMonthlyStats = async (month, year) => {
        try {
            const response = await axios.get(
                `${Api}/treatments/user/${userId}/monthly-stats?month=${month}&year=${year}`
            );
            setMonthlyStats(response.data);
            // console.log("monthlyStats:", monthlyStats)
        } catch (error) {
            console.error('Error fetching monthly stats:', error);
        }
    };

    const handleClientPress = (client) => {
        dispatch(setSelectedClient(client));
        navigation.navigate("Patients", { screen: "Treatments" });
    };

    const fetchTreatments = async (month, year) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${Api}/treatments/user/${userId}?month=${month}&year=${year}`
            );
            setTreatments(response.data);
            // console.log("treatments fetch:", response.data)
            // Create marked dates object
            const marked = {};
            response.data.forEach(treatment => {
                const date = new Date(treatment.treatmentDate).toISOString().split('T')[0];
                marked[date] = {
                    marked: true,
                    dotColor: '#014495',
                    selected: date === selected
                };
            });
            setMarkedDates(marked);
            // console.log(" calendar responseData:", response.data)
            // Update filtered treatments if a date is selected
            if (selected) {
                const filtered = response.data.filter(t =>
                    new Date(t.treatmentDate).toISOString().split('T')[0] === selected
                );
                setFilteredTreatments(filtered);
            } else {
                setFilteredTreatments(response.data);
            }
        } catch (error) {
            console.error('Error fetching treatments:', error);
        } finally {
            setLoading(false);
        }
    };

    const onMonthChange = (month) => {
        const { year, month: monthNumber } = month;
        setCurrentMonth(`${year}-${monthNumber}`);
        fetchTreatments(monthNumber, year);
        fetchMonthlyStats(monthNumber, year);
        setSelected('');
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        const [year, month] = currentMonth.split('-');
        Promise.all([
            fetchTreatments(month, year),
            fetchMonthlyStats(month, year)
        ]).finally(() => setRefreshing(false));
    }, [currentMonth]);

    useEffect(() => {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        setCurrentMonth(`${year}-${month}`);
        fetchTreatments(month, year);
        fetchMonthlyStats(month, year);
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            try {
                setLoading(true);
                const today = new Date();
                const month = today.getMonth() + 1;
                const year = today.getFullYear();
                setCurrentMonth(`${year}-${month}`);

                // Fetch both treatments and stats concurrently
                await Promise.all([
                    fetchTreatments(month, year),
                    fetchMonthlyStats(month, year)
                ]);
            } catch (error) {
                console.error('Error fetching calendar data:', error);
            } finally {
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [navigation]);

    const renderTreatmentItem = ({ item }) => (
        <Animatable.View
            animation="fadeInRight"
            duration={500}
            style={styles.treatmentCard}
        >
            <TouchableOpacity onPress={() => handleClientPress(item.clientId)}>

                <View style={styles.treatmentHeader}>
                    <Text allowFontScaling={false} numberOfLines={1} style={styles.clientName}>
                        {`${(item.clientId.name + ' ' + item.clientId.lastName).slice(0, 17)}${(item.clientId.name + ' ' + item.clientId.lastName).length > 17 ? '...' : ''}`}
                    </Text>
                    <Text allowFontScaling={false} style={styles.dateTime}>
                        {new Date(item.treatmentDate).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}{' '}
                        {new Date(item.treatmentDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>

                <Text allowFontScaling={false}
                    style={styles.summary}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {item.treatmentSummary || 'No summary'}
                </Text>

                <View style={styles.priceContainer}>
                    <Text allowFontScaling={false} style={styles.price}>${item.treatmentPrice}</Text>
                </View>
            </TouchableOpacity>
        </Animatable.View>
    );

    return (
        <View style={styles.container}>
            {user.package === "free" && <BannerAd
                //    ref={bannerRef}
                unitId={adUnitId1}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: !isTrackingPermission,
                    // You can change this setting depending on whether you want to use the permissions tracking we set up in the initializing
                }}
            />}
            <Animatable.View animation="fadeInDown" duration={1000}>
                <RNCalendar
                    onDayPress={day => {
                        setSelected(day.dateString);
                        const filtered = treatments.filter(t =>
                            new Date(t.treatmentDate).toISOString().split('T')[0] === day.dateString
                        );
                        setFilteredTreatments(filtered);
                    }}
                    onMonthChange={onMonthChange}
                    markedDates={{
                        ...markedDates,
                        [selected]: {
                            ...markedDates[selected],
                            selected: true,
                            selectedColor: '#014495',
                        }
                    }}
                    theme={{
                        selectedDayBackgroundColor: '#014495',
                        todayTextColor: '#014495',
                        arrowColor: '#014495',
                        monthTextColor: '#014495',
                    }}
                />
            </Animatable.View>

            {/*  <CalendarStats stats={monthlyStats} /> */}

            {loading ? (
                <ActivityIndicator size="large" color="#014495" style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredTreatments}
                    renderItem={renderTreatmentItem}
                    keyExtractor={item => item._id}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#014495']}
                        />
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text allowFontScaling={false} style={styles.emptyText}>
                                No treatments found for {selected ? 'this date' : 'this month'}
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    treatmentCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    treatmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#014495',
    },
    time: {
        fontSize: 14,
        color: '#666',
    },
    summary: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        lineHeight: 20, // Helps with readability
        flexWrap: 'wrap',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 16,
        fontWeight: '500',
        color: '#014495',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    dateTime: {
        fontSize: 14,
        color: '#666',
        textAlign: 'right',
    },
});