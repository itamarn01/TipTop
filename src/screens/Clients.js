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
    Alert,
    Modal,
    FlatList,
    Button
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
//  import { Image } from 'expo-image';
// import FastImage from 'react-native-fast-image'
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from 'react-redux';
import { Api } from "../Api";
import axios from "axios";
import DateTimePicker from '@react-native-community/datetimepicker';

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const GuideLineBaseWidth = 414;
const GuideLineBaseHeight = 896;
const horizontalScale = (size) => (windowWidth / GuideLineBaseWidth) * size;
const verticalScale = (size) => (windowHeight / GuideLineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
    size + (horizontalScale(size) - size) * factor;

const iosAdmobBanner1 = "ca-app-pub-8754599705550429/4580663513";
const androidAdmobBanner1 = "ca-app-pub-8754599705550429/4876005547";
const productionID1 =
    Platform.OS === "android" ? androidAdmobBanner1 : iosAdmobBanner1;

const adUnitId1 = __DEV__ ? TestIds.ADAPTIVE_BANNER : productionID1;

export default function Clients({ navigation }) {
    const isTrackingPermission = useSelector((state) => state.tracking.isTrackingPermission);
    const user = useSelector((state) => state.auth.user);
    const [clients, setClients] = useState([]);
    const [page, setPage] = useState(1);
    const [totalClients, setTotalClients] = useState(0);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', lastName: '', phone: '', email: '', birthday: '' });
    const [errors, setErrors] = useState({});
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchClients();
    }, [page, search]);

    const fetchClients = async () => {
        try {
            const response = await axios.get(`${Api}/clients`, { params: { page, search } });
            const newClients = response.data.clients;

            // Filter out duplicates by checking the _id property
            const uniqueClients = newClients.filter(
                (newClient) => !clients.some((existingClient) => existingClient._id === newClient._id)
            );

            setClients(prevClients => [...prevClients, ...uniqueClients]);
            setTotalClients(response.data.total);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };


    const handleSearch = (text) => {
        setSearch(text);
        setPage(1);
        setClients([]);
    };

    const handleEndReached = () => {
        if (clients.length < totalClients) {
            setPage(page + 1);
        }
    };

    const validateInputs = () => {
        const newErrors = {};
        if (!newClient.name) newErrors.name = 'Name is required';
        if (!newClient.lastName) newErrors.lastName = 'Last Name is required';
        if (!newClient.phone) newErrors.phone = 'Phone number is required';
        if (!newClient.email) newErrors.email = 'Email is required';
        if (!newClient.birthday) newErrors.birthday = 'Birthday is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveClient = async () => {
        if (!validateInputs()) return;
        try {
            const response = await axios.post(`${Api}/clients`, newClient);
            setClients([response.data, ...clients]);
            setModalVisible(false);
            setNewClient({ name: '', lastName: '', phone: '', email: '', birthday: ''/* , adminId:user._id  */ });
        } catch (error) {
            console.error('Error adding client:', error);
            Alert.alert('Error', 'Could not add client');
        }
    };

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || newClient.birthday;
        setShowDatePicker(Platform.OS === 'ios');
        setNewClient({ ...newClient, birthday: currentDate.toISOString().split('T')[0] });
    };

    return (
        <View style={{ flex: 1, }}>
            {user.package === "free" && <BannerAd
                //    ref={bannerRef}
                unitId={adUnitId1}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: !isTrackingPermission,
                    // You can change this setting depending on whether you want to use the permissions tracking we set up in the initializing
                }}
            />}
            {/* <Text>{user._id}</Text> */}
            <TextInput
                style={styles.searchInput}
                placeholder="Search clients..."
                value={search}
                onChangeText={handleSearch}
            />
            <FlatList
                data={clients}
                keyExtractor={(item) => item._id.toString()}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                renderItem={({ item }) => (
                    <View style={styles.clientItem}>
                        <Text>{item.name} {item.lastName}</Text>
                    </View>
                )}
            />
            <TouchableOpacity style={styles.addButton} onPress={() => { setNewClient({ ...newClient, adminId: user._id }); setModalVisible(true) }}>
                <Text style={styles.addButtonText}>Add New Client</Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={[styles.input, errors.name && styles.errorInput]}
                            placeholder="Name"
                            value={newClient.name}
                            onChangeText={(text) => setNewClient({ ...newClient, name: text })}
                        />
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        <TextInput
                            style={[styles.input, errors.lastName && styles.errorInput]}
                            placeholder="Last Name"
                            value={newClient.lastName}
                            onChangeText={(text) => setNewClient({ ...newClient, lastName: text })}
                        />
                        {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                        <TextInput
                            style={[styles.input, errors.phone && styles.errorInput]}
                            placeholder="Phone"
                            keyboardType="phone-pad"
                            value={newClient.phone}
                            onChangeText={(text) => setNewClient({ ...newClient, phone: text })}
                        />
                        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                        <TextInput
                            style={[styles.input, errors.email && styles.errorInput]}
                            placeholder="Email"
                            keyboardType="email-address"
                            value={newClient.email}
                            onChangeText={(text) => setNewClient({ ...newClient, email: text })}
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <Text style={[styles.input, styles.dateInput]}>
                                {newClient.birthday ? newClient.birthday : 'Select Birthday'}
                            </Text>
                        </TouchableOpacity>
                        {errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}

                        {showDatePicker && (
                            <DateTimePicker
                                value={newClient.birthday ? new Date(newClient.birthday) : new Date()}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                        {/*  <TextInput
                            style={[styles.input, errors.birthday && styles.errorInput]}
                            placeholder="Birthday (YYYY-MM-DD)"
                            value={newClient.birthday}
                            onChangeText={(text) => setNewClient({ ...newClient, birthday: text })}
                        />
                        {errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>} */}
                        <Button title="Save" onPress={handleSaveClient} />
                        <Button title="Cancel" color="red" onPress={() => { setNewClient({ name: '', lastName: '', phone: '', email: '', birthday: ''/* , adminId:user._id  */ }); setModalVisible(false) }} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    searchInput: {
        padding: 10,
        marginBottom: 20,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
    },
    clientItem: {
        padding: 15,
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
    },
    addButton: {
        backgroundColor: '#014495',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
    },
    input: {
        padding: 10,
        marginBottom: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
    },
    errorInput: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
    dateInput: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        color: '#000',
    },
});