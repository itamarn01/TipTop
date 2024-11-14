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
    // Animated,
    I18nManager,
    Alert,
    Modal,
    FlatList,
    Button,
    TouchableWithoutFeedback,
    Keyboard,
    Linking,
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
import { useDispatch } from 'react-redux';
import { setSelectedClient } from '../redux/slices/selectedClientSlice'; // Adjust the path as needed
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import Fontisto from '@expo/vector-icons/Fontisto';
import Feather from '@expo/vector-icons/Feather';
import PagerView from 'react-native-pager-view';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const GuideLineBaseWidth = 414;
const GuideLineBaseHeight = 896;
const horizontalScale = (size) => (windowWidth / GuideLineBaseWidth) * size;
const verticalScale = (size) => (windowHeight / GuideLineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
    size + (horizontalScale(size) - size) * factor;

const iosAdmobBanner1 = "ca-app-pub-8754599705550429/3783221625";
const androidAdmobBanner1 = "ca-app-pub-8754599705550429/3389503797";
const productionID1 =
    Platform.OS === "android" ? androidAdmobBanner1 : iosAdmobBanner1;

const adUnitId1 = __DEV__ ? TestIds.ADAPTIVE_BANNER : productionID1;

export default function Treatments({ navigation }) {
    const dispatch = useDispatch();
    const isTrackingPermission = useSelector((state) => state.tracking.isTrackingPermission);
    const user = useSelector((state) => state.auth.user);
    const client = useSelector((state) => state.selectedClient);
    const clientId = client._id;
    const adminId = user._id
    console.log("clientId:", clientId, "adminId:", adminId)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null);
    const [clientDetails, setClientDetails] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [parents, setParents] = useState([])
    const [parentsModalVisible, setParentsModalVisible] = useState(false);
    const [newTreatment, setNewTreatment] = useState({
        treatmentDate: new Date(),
        treatmentSummary: '',
        whatNext: '',
        paymentStatus: '',
        payDate: ''
    });
    const [parentName, setParentName] = useState('');
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const searchTimeout = useRef(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showTreatmentDatePicker, setShowTreatmentDatePicker] = useState(false);
    const [showPayDatePicker, setShowPayDatePicker] = useState(false);
    const [totalPages, setTotalPages] = useState(1)
    const [activeTab, setActiveTab] = useState(0);
    const translateX = useSharedValue(0);
    const pagerRef = useRef(null); // Add a ref for PagerView

    const handlePageChange = (page) => {
        setActiveTab(page);
        translateX.value = withTiming(page * (windowWidth / 2)); // Adjust width division as per number of tabs

        // Set the page in PagerView
        if (pagerRef.current) {
            pagerRef.current.setPage(page);
        }
    };

    const onPageSelected = (e) => {
        const page = e.nativeEvent.position;
        setActiveTab(page);
        translateX.value = withTiming(page * (windowWidth / 2)); // Sync the indicator animation with swipe
    };

    const animatedIndicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));
    useEffect(() => {
        // fetchClientDetails();
        fetchTreatments();
    }, [debouncedSearch, clientId, page, search]);
    useEffect(() => {
        const fetchClientData = async () => {
            try {
                setLoading(true)
                const response = await axios.get(`${Api}/clients/${clientId}/${adminId}`);
                setClientDetails(response.data);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError('404'); // Set error to "404" if status is 404
                } else {
                    setError('An unexpected error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchClientData();
    }, [clientId, adminId]);


    /*  const fetchClientDetails = async () => {
         // Fetch client details based on clientId
         // Assuming you have a route for fetching client details by ID
         try {
             const response = await axios.get(`${Api}/clients/${clientId}`);
             setClientDetails(response.data);
         } catch (error) {
             console.error(error);
         }
     }; */

    const fetchTreatments = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${Api}/treatments/${clientId}`, {
                params: {
                    page,
                    limit: 10,
                    search: debouncedSearch // Use debounced search term
                }
            });

            const { treatments: newTreatments, totalPages } = response.data;

            // Combine the existing treatments with the new ones and filter duplicates
            const combinedTreatments = page === 1
                ? newTreatments
                : [...treatments, ...newTreatments];

            // Filter out treatments with duplicate _id keys
            const uniqueTreatments = combinedTreatments.filter(
                (treatment, index, self) =>
                    index === self.findIndex((t) => t._id === treatment._id)
            );

            setTreatments(uniqueTreatments);
            setTotalPages(totalPages); // Set total pages for pagination controls
            console.log("treatments:", uniqueTreatments);
        } catch (error) {
            console.error("error fetching treatments: ", error);
        }
        setIsLoading(false);
    };

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page when search changes
        }, 600);

        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    const handleSearch = (text) => {
        setSearch(text);
    };

    const handleEndReached = () => {
        if (!isLoading && page < totalPages) { // Ensure we don't load past the last page
            setPage(prevPage => prevPage + 1);
        }
    };

    const validateInputs = () => {
        let validationErrors = {};

        if (!newTreatment.treatmentDate) validationErrors.treatmentDate = 'Treatment Date is required';
        if (!newTreatment.treatmentSummary) validationErrors.treatmentSummary = 'Summary is required';

        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const handleSaveTreatment = async () => {
        if (!validateInputs()) return;

        try {
            const response = await axios.post(`${Api}/treatments/${clientId}`, newTreatment);

            // Add the new treatment to the treatments array
            setTreatments(prev => [...prev, response.data]); // `response.data` is the newly added treatment
            setModalVisible(false);

            // Reset new treatment form fields
            setNewTreatment({
                treatmentDate: new Date(),
                treatmentSummary: '',
                whatNext: '',
                paymentStatus: '',
                payDate: ''
            });
        } catch (error) {
            console.error("Error saving treatment:", error);
        }
    };

    const renderTreatmentItem = ({ item }) => (
        <View style={styles.treatmentItem}>
            <Text style={{ color: "grey" }}>{new Date(item.treatmentDate).toLocaleDateString()}</Text>
            <Text numberOfLines={1} style={{ fontFamily: "Rubik-italic", fontSize: moderateScale(30) }}>{item.treatmentSummary}</Text>
        </View>
    );

    const renderParent = ({ item, index }) => (
        <View style={styles.parentContainer}>
            <View style={{/* justifyContent:"center", alignItems:"center" */ flexDirection: "row", }}>
                <View style={{ justifyContent: "center", alignItems: "center" }}>

                    {item.gender === "זכר" ? <Fontisto name="male" size={40} color="#8BB6C7" /> : <Fontisto name="female" size={40} color="#ECABA8" />}
                    <Text style={styles.parentText}>{item.parentName.length > 12 ? `${item.parentName.slice(0, 15)}..` : item.parentName}</Text>
                </View>

                <View style={styles.iconContainer}>
                    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                        <FontAwesome name="phone" size={24} color="grey" />
                        <Text style={{ color: "grey", marginHorizontal: horizontalScale(10) }}>{item.phone}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity disabled={!item.email} style={{ flexDirection: "row", alignItems: "center" }} onPress={() => Linking.openURL(`mailto:${item.email}`)}>
                        <FontAwesome name="envelope" size={24} color="grey" />
                        <Text style={{ color: "grey", marginHorizontal: horizontalScale(10) }}>{item.email ? item.email : "No email"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity onPress={() => handleDeleteParent(index)}>
                <Feather name="x-circle" size={24} color="black" />
            </TouchableOpacity>
            {/* <Button title="Delete" onPress={() => handleDeleteParent(index)} /> */}
        </View>
    );

    const renderParents = ({ item }) => (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>

            <View style={styles.parentContainer}>
                <FontAwesome name="user" size={24} color="blue" />
                <Text>{clientDetails.parentName}</Text>
            </View>
            <View style={{ width: windowWidth * 0.5, justifyContent: "space-between" }}>
                <Entypo name="mail" size={24} color="black" />
                <FontAwesome name="whatsapp" size={24} color="black" />
                <Entypo name="phone" size={24} color="black" />
            </View>
        </View>
    );

    const deleteParentByIndex = async (clientId, index, setParents) => {
        try {
            const response = await axios.delete(`${Api}/clients/${clientId}/parent/index/${index}`);

            // Update the parents list with the modified array from the response
            setClientDetails(response.data);

            Alert.alert("Success", "Parent deleted successfully");
        } catch (error) {
            console.error("Error deleting parent: ", error);
            Alert.alert("Error", "Could not delete parent. Please try again.");
        }
    };

    const handleDeleteParent = (index) => {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this parent?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: () => deleteParentByIndex(clientId, index, setParents) }
            ]
        );
    };

    function calculateAge(birthday) {
        const birthDate = new Date(birthday);
        const today = new Date();

        let ageYears = today.getFullYear() - birthDate.getFullYear();
        let ageMonths = today.getMonth() - birthDate.getMonth();

        // If the current month is before the birth month, or it's the birth month but the current day is before the birth day
        if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
            ageYears--;
            ageMonths += 12;
        }

        if (today.getDate() < birthDate.getDate()) {
            ageMonths--;
        }

        return `${ageYears}:${ageMonths < 10 ? '0' : ''}${ageMonths}`;
    }
    const onTreatmentDateChange = (event, selectedDate) => {
        setShowTreatmentDatePicker(false);
        if (selectedDate) {
            setNewTreatment({ ...newTreatment, treatmentDate: selectedDate });
        }
    };

    const onPayDateChange = (event, selectedDate) => {
        setShowPayDatePicker(false);
        if (selectedDate) {
            setNewTreatment({ ...newTreatment, payDate: selectedDate });
        }
    };

    const handleAddParent = async () => {
        try {
            const newParent = { parentName, gender, phone, email };
            response = await axios.post(`${Api}/clients/${clientId}/addParent`, newParent);
            setClientDetails(response.data.client)
            // onParentAdded(newParent);
            setParentsModalVisible(false)
        } catch (error) {
            console.error('Error adding parent:', error);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" style={styles.centered} />;
    }

    if (error === '404') {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>404 Page Not Found</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={{
            flex: 1,
        }}>
            <ImageBackground source={require("../../assets/background.png")} style={{ flex: 1 }}>

                {user.package === "free" && <BannerAd
                    //    ref={bannerRef}
                    unitId={adUnitId1}
                    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                    requestOptions={{
                        requestNonPersonalizedAdsOnly: !isTrackingPermission,
                        // You can change this setting depending on whether you want to use the permissions tracking we set up in the initializing
                    }}
                />}
                {/* Tab Bar */}
                <View style={styles.tabBar}>
                    <TouchableOpacity style={styles.tab} onPress={() => handlePageChange(0)}>
                        <Text style={activeTab === 0 ? styles.activeTabText : styles.tabText}>Client</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tab} onPress={() => handlePageChange(1)}>
                        <Text style={activeTab === 1 ? styles.activeTabText : styles.tabText}>Treatments</Text>
                    </TouchableOpacity>
                    {/* Add more tabs as needed */}
                    <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
                </View>

                {/* PagerView */}
                <PagerView
                    ref={pagerRef} // Assign the ref to PagerView
                    style={styles.pagerView}
                    initialPage={0}
                    onPageSelected={onPageSelected}
                >
                    <View key="1" style={styles.page}>
                        <Text>Content for Tab 1</Text>
                        <View style={{ justifyContent: "center", width: windowWidth, alignItems: "center" }}>
                            {clientDetails.gender === 'male' ? (
                                <Image
                                    source={require("../../assets/maleIcon.png")}
                                    style={{ width: 100, height: 100 }}
                                    alt="Male Icon"
                                />

                            ) : (
                                <Image
                                    source={require('../../assets/femaleIcon.png')}
                                    style={{ width: 100, height: 100 }}
                                    alt="Female Icon"
                                />
                            )}
                            <Text numberOfLines={1} style={{ fontFamily: "Rubik", fontSize: moderateScale(40), alignSelf: "center", }}>{`${clientDetails.name} ${clientDetails.lastName}`}</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: verticalScale(20) }}>
                            <View style={{ justifyContent: "center", alignItems: "center" }}>
                                <Text allowFontScaling={false} style={{ fontSize: 25 }}>{`${calculateAge(clientDetails.birthday)}`}</Text>
                                <Text style={{ color: "grey", fontSize: 20 }}>{`Age`}</Text>
                            </View>
                            <View style={{ justifyContent: "center", alignItems: "center" }}>
                                <Text allowFontScaling={false} style={{ fontSize: 25 }}>{clientDetails.clientPrice ? clientDetails.clientPrice : "-"}</Text>
                                <Text style={{ color: "grey", fontSize: 20 }}>{`Price`}</Text>
                            </View>
                            <View style={{ justifyContent: "center", alignItems: "center" }}>
                                <Text allowFontScaling={false} style={{ fontSize: 25 }}>{clientDetails.insuranceInfo ? clientDetails.insuranceInfo : "-"}</Text>
                                <Text style={{ color: "grey", fontSize: 20 }}>{`Insurance`}</Text>
                            </View>
                            <View style={{ justifyContent: "center", alignItems: "center" }}>
                                <Text allowFontScaling={false} style={{ fontSize: 25 }}>{clientDetails.numberOfMeetings ? clientDetails.numberOfMeetings : "-"}</Text>
                                <Text style={{ color: "grey", fontSize: 20 }}>{`Meetings`}</Text>
                            </View>
                        </View>
                        <View style={[styles.clientDetails, { marginTop: verticalScale(10) }]}>
                            {/* <Text>Birthday: {new Date(clientDetails.birthday).toLocaleDateString()}</Text>
                <Text>Gender: {clientDetails.gender}</Text> */}
                            <Text style={{ color: "grey" }}>Description: {clientDetails.descriptin ? clientDetails.descriptin : "No description"}</Text>

                            {/*  <Text style={{ fontFamily: "Rubik", fontSize: moderateScale(18) }}>{`phone: ${clientDetails.phone} `}</Text>
                <Text>{`Age: ${calculateAge(clientDetails.birthday)}`}</Text> */}
                        </View>
                        <View style={{
                            flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: windowWidth * 0.95, alignSelf: "center", /* backgroundColor: "yellow" */
                        }}>

                            <Text style={{ fontFamily: "Rubik", fontSize: moderateScale(30), marginHorizontal: horizontalScale(15) }}>Parents</Text>
                            <TouchableOpacity onPress={() => setParentsModalVisible(true)} style={{ padding: 5, backgroundColor: "#1F609A", borderRadius: 20 }}>
                                {/*  <FontAwesome name="user-plus" size={10} color="blue" /> */}
                                <Text style={{ color: "white" }}>Add parent</Text>
                                {/* <Text>Add Parent</Text> */}
                            </TouchableOpacity>
                        </View>
                        <View style={{ justifyContent: "flex-start", flexDirection: "row", alignItems: "center", width: windowWidth * 0.9, paddingVertical: verticalScale(20), alignSelf: "center", backgroundColor: "white", borderRadius: 10 }}>
                            <FlatList
                                data={clientDetails.parents}
                                horizontal
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={renderParent}
                            />
                        </View>

                    </View>
                    <View key="2" style={styles.page}>
                        <Text>Content for Tab 2</Text>
                        <TouchableOpacity style={styles.addButton} onPress={() => /* setModalVisible(true) */ navigation.navigate("TreatmentForm")}>
                            <Text style={styles.addButtonText}>Add New Treatment</Text>
                        </TouchableOpacity>


                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by treatment summary..."
                            value={search}
                            onChangeText={handleSearch}
                        />
                        <FlatList
                            data={treatments}
                            keyExtractor={(item) => item._id.toString()}
                            renderItem={renderTreatmentItem}
                            onEndReached={handleEndReached}
                            onEndReachedThreshold={0.5}
                        />
                    </View>
                </PagerView>













                <Modal
                    visible={modalVisible}
                    // transparent={true}
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

                        <View style={styles.modalContent}>
                            <ScrollView style={{ marginTop: 100, paddingBottom: 500 }}>
                                <Text style={styles.modalTitle}>Add New Treatment</Text>
                                <Text>Treatment Date:</Text>
                                <TouchableOpacity onPress={() => setShowTreatmentDatePicker(true)}>
                                    <Text style={styles.dateInput}>{!showPayDatePicker ? "Pick a date:" : newTreatment.treatmentDate.toDateString()}</Text>
                                </TouchableOpacity>
                                {/*  <Button title="Select Treatment Date" onPress={() => setShowTreatmentDatePicker(true)} /> */}
                                {showTreatmentDatePicker && (
                                    <DateTimePicker
                                        value={newTreatment.treatmentDate}
                                        mode="date"
                                        display="default"
                                        onChange={onTreatmentDateChange}
                                    />
                                )}
                                <Text>{newTreatment.treatmentDate.toLocaleDateString()}</Text>
                                {errors.treatmentDate && <Text style={styles.errorText}>{errors.treatmentDate}</Text>}
                                <Text>Treatment Summary:</Text>
                                <TextInput
                                    style={[styles.input, errors.treatmentSummary && styles.errorInput]}
                                    placeholder="Treatment Summary"
                                    value={newTreatment.treatmentSummary}
                                    multiline
                                    numberOfLines={8}
                                    onChangeText={(text) => setNewTreatment({ ...newTreatment, treatmentSummary: text })}
                                />
                                {errors.treatmentSummary && <Text style={styles.errorText}>{errors.treatmentSummary}</Text>}
                                <Text>What Next:</Text>
                                <TextInput
                                    style={[styles.input, errors.whatNext && styles.errorInput]}
                                    placeholder="What Next"
                                    value={newTreatment.whatNext}
                                    multiline
                                    numberOfLines={8}
                                    onChangeText={(text) => setNewTreatment({ ...newTreatment, whatNext: text })}
                                />
                                {errors.whatNext && <Text style={styles.errorText}>{errors.whatNext}</Text>}


                                {/*   <Button title="Select Pay Date" onPress={() => setShowPayDatePicker(true)} />
                            {showPayDatePicker && (
                                <DateTimePicker
                                    value={newTreatment.payDate || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={onPayDateChange}
                                />
                            )}
                            {newTreatment.payDate && <Text>{newTreatment.payDate.toLocaleDateString()}</Text>} */}

                                <Button title="Save" onPress={handleSaveTreatment} />
                                <Button title="Cancel" onPress={() => {
                                    setNewTreatment({
                                        treatmentDate: new Date(),
                                        treatmentSummary: '',
                                        whatNext: '',
                                        paymentStatus: '',
                                        payDate: ''
                                    }); setModalVisible(false)
                                }} />
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
                <Modal visible={parentsModalVisible} transparent={true} animationType="slide">
                    <View style={styles.modalContainer}>
                        <Text style={styles.title}>Add Parent</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Parent Name"
                            value={parentName}
                            onChangeText={setParentName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Gender"
                            value={gender}
                            onChangeText={setGender}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone"
                            value={phone}
                            onChangeText={setPhone}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <Button title="Add Parent" onPress={handleAddParent} />
                        <Button title="Cancel" onPress={() => setParentsModalVisible(false)} color="red" />
                    </View>
                </Modal>
            </ImageBackground>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    clientDetails: {
        marginBottom: 20,
        marginHorizontal: horizontalScale(15),
        // backgroundColor: "#1F609A"
    },
    searchInput: {
        width: windowWidth * 0.9,
        alignSelf: "center",
        padding: 10,
        marginBottom: 20,
        borderColor: '#ccc',
        backgroundColor: '#ccc',
        borderWidth: 1,
        borderRadius: moderateScale(10),
    },
    treatmentItem: {
        backgroundColor: "white",
        padding: 15,
        borderRadius: moderateScale(10),
        // borderBottomColor: '#ccc',
        // borderBottomWidth: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: windowWidth * 0.9,
        marginVertical: verticalScale(10),
    },
    addButton: {
        width: horizontalScale(200),
        backgroundColor: '#014495',
        padding: 15,
        borderRadius: 20,
        marginVertical: verticalScale(20),
        alignSelf: "center",
        justifyContent: "center",
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
    },
    modalContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    errorInput: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    parentContainer: {
        justifyContent: "center",
        alignItems: "center",
        // flexDirection: "row",
        marginHorizontal: horizontalScale(10),
        // backgroundColor: "rgba(0,0,0,0.01)",
        padding: 5
    },
    iconContainer: {
        marginHorizontal: horizontalScale(10)
        // flexDirection: 'row',
        // gap: 15,
    },
    tabBar: {
        flexDirection: 'row',
        height: 50,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabText: { fontSize: 16, color: '#777' },
    activeTabText: { fontSize: 16, color: '#000', fontWeight: 'bold' },
    indicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        width: windowWidth / 2, // Adjust width division as per number of tabs
        backgroundColor: 'blue',
    },
    pagerView: { flex: 1 },
    page: {
        flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
    },
});