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
    Button,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    SafeAreaView,
    StatusBar,
    Linking,
    Share,
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
import { useDispatch } from 'react-redux';
import { setSelectedClient } from '../redux/slices/selectedClientSlice'; // Adjust the path as needed
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import LottieView from 'lottie-react-native';

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

const fadeIn = {
    0: {
        opacity: 0,
        scale: 0.5,
    },
    1: {
        opacity: 1,
        scale: 1,
    },
};



const NoSearchResultsComponent = ({ search }) => (
    <Animatable.View
        animation="fadeIn"
        style={styles.emptyStateContainer}
        duration={1000}
    >
        <LottieView
            source={require('../../assets/animation/no-results.json')}
            autoPlay
            loop
            style={styles.emptyStateAnimation}
            speed={0.8}
        />
        <Text allowFontScaling={false} style={styles.emptyStateTitle}>No Results Found</Text>
        <Text allowFontScaling={false} style={styles.emptyStateText}>
            We couldn't find any clients matching "{search}"
        </Text>
    </Animatable.View>
);

const ClientSkeletonItem = () => (
    <Animatable.View
        animation="pulse"
        easing="ease-out"
        iterationCount="infinite"
        style={styles.clientItem}
    >
        <View style={[styles.clientAvatar, styles.skeleton]} />
        <View style={styles.clientInfo}>
            <View style={[styles.skeletonText, { width: '70%' }]} />
            <View style={[styles.skeletonText, { width: '40%', marginTop: 8 }]} />
        </View>
        <View style={[styles.skeletonChevron]} />
    </Animatable.View>
);

export default function Clients({ navigation }) {
    const dispatch = useDispatch();
    const isTrackingPermission = useSelector((state) => state.tracking.isTrackingPermission);
    const user = useSelector((state) => state.auth.user);
    const [clients, setClients] = useState([]);
    const [page, setPage] = useState(1);
    const [totalClients, setTotalClients] = useState(0);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', lastName: '', parentName: '', phone: '', email: '', birthday: '', gender: "male", adminId: user._id });
    const [errors, setErrors] = useState({});
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [gender, setGender] = useState("male")
    const today = new Date()
    const [refreshing, setRefreshing] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchAnimation = useRef(new Animated.Value(0)).current;
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const nameRef = useRef(null);
    const [link, setLink] = useState("");
    const [modalformvisible, setModalFormVisible] = useState(false)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setPage(1);
            setClients([]);
            fetchClients();
        });

        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        const handler = setTimeout(() => {
            searchClients(search);
        }, 400);

        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const user_id = user._id;
            const response = await axios.get(`${Api}/clients`, {
                params: {
                    page,
                    adminId: user_id
                }
            });
            const newClients = response.data.clients;

            const uniqueClients = newClients.filter(
                (newClient) => !clients.some((existingClient) => existingClient._id === newClient._id)
            );

            if (page === 1) {
                setClients(newClients);
            } else {
                setClients(prevClients => [...prevClients, ...uniqueClients]);
            }
            setTotalClients(response.data.total);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClient = async (clientId) => {
        try {
            await axios.delete(`${Api}/clients/${clientId}/${user._id}`);
            // Reset clients and page to trigger a fresh fetch
            setClients([]);
            setPage(1);
            fetchClients();
        } catch (error) {
            console.error('Error deleting client:', error);
            Alert.alert('Error', 'Could not delete client');
        }
    };

    const handleSearch = (text) => {
        setSearch(text);
        setPage(1);
        setClients([]);
    };

    const handleEndReached = () => {
        if (clients.length % 10 === 0) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const validateInputs = () => {
        const newErrors = {};
        if (!newClient.name) newErrors.name = 'Name is required';
        if (!newClient.lastName) newErrors.lastName = 'Last Name is required';
        /* if (!newClient.phone) newErrors.phone = 'Phone number is required';
        if (!newClient.email) newErrors.email = 'Email is required';*/
        // if (!newClient.birthday) newErrors.birthday = 'Birthday is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveClient = async () => {
        if (!validateInputs()) return;
        try {
            const response = await axios.post(`${Api}/clients`, newClient);
            setClients([response.data, ...clients]);
            setModalVisible(false);
            setNewClient({ name: '', lastName: '', birthday: '', gender: "male", adminId: user._id });
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

    const handleClientPress = (client) => {
        dispatch(setSelectedClient(client));
        navigation.navigate("Treatments");
    };


    const toggleSearch = () => {
        setIsSearchVisible(!isSearchVisible);
        Animated.spring(searchAnimation, {
            toValue: isSearchVisible ? 0 : 1,
            useNativeDriver: true,
        }).start();
    };

    const handleAddClient = () => {
        setNewClient({ ...newClient, adminId: user._id });
        setModalVisible(true);
        setTimeout(() => {
            nameRef.current?.focus();
        }, 100);
    };

    const searchClients = async (searchText) => {
        if (!searchText.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await axios.get(`${Api}/clients/search-clients`, {
                params: {
                    search: searchText,
                    adminId: user._id
                }
            });
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching clients:', error);
        }
    };

    const NoClientsComponent = ({ onAddClient }) => (
        <Animatable.View
            animation="fadeIn"
            style={styles.emptyStateContainer}
            duration={1000}
        >
            <Text allowFontScaling={false} style={styles.emptyStateTitle}>No Patients Yet</Text>
            <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={onAddClient}
            >
                <MaterialIcons name="person-add" size={24} color="white" />
                <Text allowFontScaling={false} style={styles.emptyStateButtonText}>Add New Patient</Text>
            </TouchableOpacity>
            <Text allowFontScaling={false} style={styles.orText}>or</Text>
            <TouchableOpacity
                style={styles.generateLinkButton}
                onPress={() => navigation.navigate("ClientForm")}
            >
                <MaterialIcons name="link" size={24} color="white" />
                <Text allowFontScaling={false} style={styles.generateLinkText}>Send Patient Link For Details</Text>
            </TouchableOpacity>
        </Animatable.View>
    );

    const generateLink = async () => {
        /*  if (!adminId) {
             Alert.alert("Error", "Admin ID is required.");
             return;
         } */

        try {
            const response = await axios.post(`${Api}/clients/generate-form-link`, { adminId: user._id, api: Api.slice(0, -4) });
            setLink(response.data.link);
            Alert.alert("Success", "Form link generated successfully.");
        } catch (error) {
            console.error("Error generating form link:", error);
            Alert.alert("Error", "Could not generate form link.");
        }
    };

    const NewBadge = () => (
        <View style={styles.newBadgeContainer}>
            <Text allowFontScaling={false} style={styles.newBadgeText}>NEW</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#014495" barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >


                <Animatable.View
                    animation="slideInDown"
                    duration={1000}
                    style={styles.header}
                >
                    <Text allowFontScaling={false} style={styles.headerTitle}>My Patients</Text>

                    <TouchableOpacity
                        onPress={() => {
                            setIsSearchVisible(!isSearchVisible);
                            if (!isSearchVisible) {
                                setSearch('');
                                setSearchResults([]);
                            }
                        }}
                        style={styles.searchIcon}
                    >
                        <MaterialIcons
                            name={isSearchVisible ? "close" : "search"}
                            size={24}
                            color="#014495"
                        />
                    </TouchableOpacity>
                </Animatable.View>
                {user.package === "free" && <BannerAd
                    unitId={adUnitId1}
                    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                    requestOptions={{
                        requestNonPersonalizedAdsOnly: !isTrackingPermission,
                    }}
                />}

                {/*  {user.formLink ?
                    <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
                      
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={() => Linking.openURL(user.formLink)}
                        >
                            <MaterialIcons name="open-in-browser" size={24} color="white" />
                            <Text allowFontScaling={false} style={styles.copyButtonText}>Preview</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={() => {
                                // Functionality to share the link
                                Share.share({
                                    message: `${user.formLink}`,
                                });
                            }}
                        >
                            <MaterialIcons name="share" size={24} color="white" />
                            <Text allowFontScaling={false} style={styles.copyButtonText}>Share Link</Text>
                        </TouchableOpacity>
                    </View> : null}
                <Button title="Generate Form Link" onPress={generateLink} style={{ height: 50 }} />
                {link ? (
                    <View style={styles.linkContainer}>
                        <Text allowFontScaling={false} style={styles.linkLabel}>Form Link:</Text>
                        <Text allowFontScaling={false}
                            style={styles.link}
                            selectable // Make the text selectable for manual copying
                        >
                            {link}
                        </Text>
                        <TouchableOpacity
                            style={styles.openLinkButton}
                            onPress={() => Linking.openURL(link)}
                        >
                            <MaterialIcons name="open-in-browser" size={24} color="white" />
                            <Text allowFontScaling={false} style={styles.openLinkButtonText}>Preview</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={() => {
                                // Functionality to share the link
                                Share.share({
                                    message: `Check out this link: ${link}`,
                                });
                            }}
                        >
                            <MaterialIcons name="share" size={24} color="white" />
                            <Text allowFontScaling={false} style={styles.copyButtonText}>Share Link</Text>
                        </TouchableOpacity>
                    </View>
                ) : null} */}

                {isSearchVisible ? (
                    // Search View
                    <Animated.View style={styles.searchView}>
                        <View style={styles.searchInputContainer}>
                            <MaterialIcons name="search" size={20} color="#666" />
                            <TextInput
                                allowFontScaling={false}
                                style={styles.searchInput}
                                placeholder="Search clients..."
                                value={search}
                                onChangeText={setSearch}
                                autoFocus
                                placeholderTextColor="#666"
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <MaterialIcons name="close" size={20} color="#666" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item._id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleClientPress(item)}
                                    style={styles.searchResultItem}
                                >
                                    <View style={styles.clientAvatar}>
                                        <MaterialIcons
                                            name={item.gender === 'male' ? 'person' : 'person-outline'}
                                            size={30}
                                            color={item.gender === 'male' ? '#014495' : '#FF69B4'}
                                        />
                                    </View>
                                    <View style={styles.clientInfo}>
                                        <Text
                                            numberOfLines={1}
                                            allowFontScaling={false}
                                            style={styles.name}
                                        >
                                            {`${(item.name + ' ' + item.lastName).slice(0, 22)}${(item.name + ' ' + item.lastName).length > 22 ? '...' : ''}`}
                                        </Text>
                                        <Text allowFontScaling={false} style={styles.clientDetails}>
                                            {item.birthday ? new Date(item.birthday).toLocaleDateString() : ''}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                search.length > 0 ? (
                                    <NoSearchResultsComponent search={search} />
                                ) : null
                            )}
                            contentContainerStyle={searchResults.length === 0 ? { flex: 1 } : null}
                        />
                    </Animated.View>
                ) : (
                    // Main Clients View
                    <>
                        {clients.length === 0 && !isLoading ? (
                            <NoClientsComponent onAddClient={handleAddClient} />
                        ) : (
                            <>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", width: "90%", marginVertical: 20, alignItems: "center", alignSelf: "center" }}>


                                    <TouchableOpacity
                                        style={[styles.addButton, { width: "83%" }]}
                                        onPress={handleAddClient}
                                    >
                                        <MaterialIcons name="person-add" size={24} color="white" />
                                        <Text allowFontScaling={false} style={styles.addButtonText}>Add New Patient</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.addButton, { width: "15%" }]}
                                        onPress={() => navigation.navigate("ClientForm")}
                                    >
                                        <MaterialIcons name="link" size={24} color="white" />
                                        {/* <Text allowFontScaling={false} style={styles.generateLinkText}>Send Patient Link For Details</Text> */}
                                    </TouchableOpacity>
                                </View>

                                {isLoading && page === 1 ? (
                                    // Show skeleton loading for initial load
                                    <FlatList
                                        data={[1, 2, 3, 4, 5]} // Number of skeleton items to show
                                        keyExtractor={(item) => item.toString()}
                                        renderItem={() => <ClientSkeletonItem />}
                                        contentContainerStyle={{ paddingHorizontal: 20 }}
                                    />
                                ) : (
                                    <FlatList
                                        data={clients}
                                        keyExtractor={(item) => item._id.toString()}
                                        renderItem={({ item, index }) => {
                                            const isNew = item.createdAt &&
                                                (new Date().getTime() - new Date(item.createdAt).getTime()) < (2 * 24 * 60 * 60 * 1000);

                                            return (
                                                <Animatable.View
                                                    animation={fadeIn}
                                                    duration={500}
                                                    delay={index * 100}
                                                >
                                                    <Swipeable
                                                        renderRightActions={() => (
                                                            <TouchableOpacity
                                                                style={styles.deleteSwipe}
                                                                onPress={() => {
                                                                    Alert.alert(
                                                                        'Delete Client',
                                                                        'Are you sure you want to delete this client?',
                                                                        [
                                                                            { text: 'Cancel', style: 'cancel' },
                                                                            {
                                                                                text: 'Delete',
                                                                                onPress: () => handleDeleteClient(item._id),
                                                                                style: 'destructive'
                                                                            },
                                                                        ]
                                                                    );
                                                                }}
                                                            >
                                                                <MaterialIcons name="delete" size={24} color="white" />
                                                            </TouchableOpacity>
                                                        )}
                                                    >
                                                        <TouchableOpacity
                                                            onPress={() => handleClientPress(item)}
                                                            style={[styles.clientItem, isNew && styles.newClientItem]}
                                                        >
                                                            <View style={styles.clientAvatar}>
                                                                <MaterialIcons
                                                                    name={item.gender === 'male' ? 'person' : 'person-outline'}
                                                                    size={30}
                                                                    color={item.gender === 'male' ? '#014495' : '#FF69B4'}
                                                                />
                                                            </View>
                                                            <View style={styles.clientInfo}>
                                                                <View style={styles.nameContainer}>
                                                                    <Text
                                                                        numberOfLines={1}
                                                                        allowFontScaling={false}
                                                                        style={styles.name}
                                                                    >
                                                                        {`${(item.name + ' ' + item.lastName).slice(0, 17)}${(item.name + ' ' + item.lastName).length > 17 ? '...' : ''}`}
                                                                    </Text>
                                                                    {isNew && <NewBadge />}
                                                                </View>
                                                                <Text allowFontScaling={false} style={styles.clientDetails}>
                                                                    {item.birthday ? new Date(item.birthday).toLocaleDateString() : ''}
                                                                </Text>
                                                            </View>
                                                            <MaterialIcons name="chevron-right" size={24} color="#666" />
                                                        </TouchableOpacity>
                                                    </Swipeable>
                                                </Animatable.View>
                                            );
                                        }}
                                        onEndReached={handleEndReached}
                                        onEndReachedThreshold={0.5}
                                        refreshControl={
                                            <RefreshControl
                                                refreshing={refreshing}
                                                onRefresh={() => {
                                                    setRefreshing(true);
                                                    setPage(1);
                                                    fetchClients().then(() => setRefreshing(false));
                                                }}
                                            />
                                        }
                                        ListFooterComponent={() => (
                                            // Show skeleton loading for pagination
                                            isLoading && page > 1 ? (
                                                <ClientSkeletonItem />
                                            ) : null
                                        )}
                                    />
                                )}
                            </>
                        )}
                    </>
                )}

                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={{ flex: 1 }}
                        >
                            <View style={[styles.modalContainer, {
                                // bottom: keyboardHeight,
                            }]}>
                                <Animatable.View
                                    animation="slideInUp"
                                    duration={300}
                                    style={[styles.modalContent,/*  {
                                    bottom: keyboardHeight,
                                } */]}
                                >
                                    <Animated.View
                                        style={[
                                            styles.buttonContainer,
                                            /*  {
                                                 bottom: keyboardHeight,
                                             } */
                                        ]}
                                    >
                                        <TouchableOpacity
                                            style={styles.closeButton}
                                            onPress={() => {
                                                setNewClient({
                                                    name: '',
                                                    lastName: '',
                                                    birthday: '',
                                                    adminId: user._id
                                                });
                                                setModalVisible(false);
                                            }}
                                        >
                                            <MaterialIcons name="close" size={24} color="#666" />
                                            {/* <Text allowFontScaling={false} style={styles.cancelButtonText}>Cancel</Text> */}
                                        </TouchableOpacity>
                                        <Text allowFontScaling={false} style={styles.modalTitle}>Add New Patient</Text>
                                        <TouchableOpacity
                                            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                            onPress={async () => {
                                                setIsSaving(true);
                                                await handleSaveClient();
                                                setIsSaving(false);
                                            }}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator color="white" size="small" />
                                            ) : (
                                                <Text allowFontScaling={false} style={styles.saveButtonText}>Save</Text>
                                            )}
                                        </TouchableOpacity>
                                    </Animated.View>
                                    {/*  <View style={styles.modalHeader}>
                            <Text allowFontScaling={false} style={styles.modalTitle}>Add New Patient</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <MaterialIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View> */}

                                    <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps={"handled"}>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={styles.inputLabel}>Patient name</Text>
                                            <TextInput
                                                allowFontScaling={false}
                                                ref={nameRef}
                                                style={[styles.input, errors.name && styles.errorInput]}
                                                placeholder="Name"
                                                value={newClient.name}
                                                onChangeText={(text) => setNewClient({ ...newClient, name: text })}
                                                placeholderTextColor="#999"
                                            />
                                            {errors.name && (
                                                <Animatable.Text
                                                    animation="shake"
                                                    style={styles.errorText}
                                                >
                                                    {errors.name}
                                                </Animatable.Text>
                                            )}
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={styles.inputLabel}>Patient last name</Text>
                                            <TextInput
                                                allowFontScaling={false}
                                                style={[styles.input, errors.lastName && styles.errorInput]}
                                                placeholder="Last Name"
                                                value={newClient.lastName}
                                                onChangeText={(text) => setNewClient({ ...newClient, lastName: text })}
                                                placeholderTextColor="#999"
                                            />
                                            {errors.lastName && (
                                                <Animatable.Text
                                                    animation="shake"
                                                    style={styles.errorText}
                                                >
                                                    {errors.lastName}
                                                </Animatable.Text>
                                            )}
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text allowFontScaling={false} style={styles.inputLabel}>Client gender</Text>
                                            <View style={styles.genderContainer}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setGender("male");
                                                        setNewClient({ ...newClient, gender: "male" })
                                                    }}
                                                    style={[
                                                        styles.genderButton,
                                                        gender === "male" && styles.genderButtonActive
                                                    ]}
                                                >
                                                    <FontAwesome
                                                        name="male"
                                                        size={24}
                                                        color={gender === "male" ? "white" : "#666"}
                                                    />
                                                    <Text allowFontScaling={false} style={[
                                                        styles.genderText,
                                                        gender === "male" && styles.genderTextActive
                                                    ]}>Male</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setGender("female");
                                                        setNewClient({ ...newClient, gender: "female" })
                                                    }}
                                                    style={[
                                                        styles.genderButton,
                                                        gender === "female" && styles.genderButtonActive
                                                    ]}
                                                >
                                                    <FontAwesome
                                                        name="female"
                                                        size={24}
                                                        color={gender === "female" ? "#FF69B4" : "#666"}
                                                    />
                                                    <Text allowFontScaling={false} style={[
                                                        styles.genderText,
                                                        gender === "female" && styles.genderTextActive
                                                    ]}>Female</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={styles.inputLabel}>Client birthday</Text>
                                <View style={styles.datePickerContainer}>
                                    <DateTimePicker
                                        value={newClient.birthday ? new Date(newClient.birthday) : new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={handleDateChange}
                                        maximumDate={new Date()}
                                        style={styles.datePicker}
                                    />
                                </View>
                            </View> */}


                                    </ScrollView>


                                </Animatable.View>
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>

    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E1E1E1',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#014495',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E1E1E1',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        borderRadius: 10,
        paddingHorizontal: 10,
    },
    searchInputIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#2D3436',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#014495',
        padding: 15,
        borderRadius: 12,
        // margin: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 16,
    },
    clientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        marginHorizontal: 20,
        marginVertical: 6,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    clientAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F5F6FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    clientInfo: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3436',
    },
    clientDetails: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    deleteSwipe: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        width: '100%',
        maxHeight: "85%"
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#014495',
    },
    closeButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    modalScroll: {
        maxHeight: windowHeight * 0.7,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#F5F6FA',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    errorInput: {
        borderColor: '#FF3B30',
        borderWidth: 1,
    },
    errorText: {
        color: '#FF3B30',
        marginBottom: 10,
        fontSize: 14,
    },
    emptyStateContainer: {

        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyStateAnimation: {
        width: windowWidth * 0.2,
        height: windowWidth * 0.2,
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#014495',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    emptyStateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#014495',
        padding: 15,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    emptyStateButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 16,
    },
    searchView: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E1E1',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 10,
        marginRight: 10,
        color: '#2D3436',
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        marginHorizontal: 15,
        marginVertical: 5,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    skeleton: {
        backgroundColor: '#E1E9EE',
        overflow: 'hidden',
        position: 'relative',
    },
    skeletonText: {
        backgroundColor: '#F5F6FA',
        height: 16,
        borderRadius: 4,
    },
    skeletonChevron: {
        backgroundColor: '#F5F6FA',
        width: 24,
        height: 24,
        borderRadius: 4,
        marginLeft: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        // backgroundColor: "rgba(0,0,0,0.1)",
        // width: windowWidth
    },
    cancelButton: {
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#014495',
        padding: 15,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    genderButton: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
        // elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    genderButtonActive: {
        backgroundColor: '#014495',
    },
    genderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3436',
        marginTop: 5,
    },
    genderTextActive: {
        color: 'white',
    },
    datePickerContainer: {
        backgroundColor: '#F5F6FA',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    datePicker: {
        width: '100%',
        height: 150,
    },
    linkContainer: { marginTop: 20 },
    linkLabel: { fontWeight: "bold" },
    link: { color: "blue", marginTop: 5 },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#014495',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    copyButtonText: {
        color: 'white',
        marginLeft: 5,
        fontWeight: 'bold',
    },
    orText: {
        fontSize: 16,
        color: '#666',
        marginVertical: 10,
        textAlign: 'center',
    },
    generateLinkButton: {
        backgroundColor: '#014495', // Same color as Add New Patient button
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row', // Align icon and text horizontally
        alignItems: 'center',
        marginTop: 10,
    },
    generateLinkText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10, // Space between icon and text
    },
    newClientItem: {
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    newBadgeContainer: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});