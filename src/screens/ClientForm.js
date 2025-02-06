import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, Button, Dimensions, Linking, InputAccessoryView, Platform, ActivityIndicator, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import WebView from 'react-native-webview';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { setAuth } from "../redux/slices/authSlice"
import { Api } from "../Api";
import * as Animatable from 'react-native-animatable';
import { Share } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Image as ImageCompressor } from "react-native-compressor";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';


const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const GuideLineBaseWidth = 414;
const GuideLineBaseHeight = 896;
const horizontalScale = (size) => (windowWidth / GuideLineBaseWidth) * size;
const verticalScale = (size) => (windowHeight / GuideLineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
    size + (horizontalScale(size) - size) * factor;

const paymentStatusOptions = ['Pending', 'Paid', 'Cancelled'];
const paymentMethodOptions = ['Cash', 'Credit Card', 'Bank Transfer', 'Insurance'];

const ClientForm = ({ route, navigation }) => {
    const dispatch = useDispatch();
    const isTrackingPermission = useSelector((state) => state.tracking.isTrackingPermission);
    // const user = useSelector((state) => state.auth.user);
    const [link, setLink] = useState("");
    const [activeTab, setActiveTab] = useState(0);
    const translateX = useSharedValue(0);
    const pagerRef = useRef(null); // Add a ref for PagerView
    const [user, setUser] = useState(useSelector((state) => state.auth.user))
    const [loading, setLoading] = useState(false)
    const inputAccessoryViewID = 'inputAccessoryViewID';
    const [logo, setLogo] = useState(user.logo)
    const [phone, setPhone] = useState(user.phone)
    const [specialization, setSpecialization] = useState(user.specialization)
    const [experience, setExperience] = useState(user.experiance)
    const [clinicName, setClinicName] = useState(user.clinicName)
    const [clinicAddress, setClinicAddress] = useState(user.clinicAddress)
    const [welcomeMessage, setWelcomeMessage] = useState(user.welcomeMessage)
    const [thankYouMessage, setThankYouMessage] = useState(user.thankYouMessage)
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef(null)
    const [modalTitle, setModalTitle] = useState("");
    const [modalField, setModalField] = useState("");
    const [webViewUri, setWebViewUri] = useState(user.formLink);

    const showDynamicModal = (title, field) => {
        setModalTitle(title); // Set the title
        setModalField(field); // Set the field
        setModalVisible(true); // Show the modal
    };
    async function fetchUserDetails() {
        try {
            setLoading(true)
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${Api}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // setName(response.data.name)
            return setUser(response.data.user);
            setWebViewUri(response.data.user.formLink)
        } catch (error) {

            console.error('Error fetching user details:', error.response.data);

        }
    }
    const refreshWebView = () => {
        setWebViewUri(user.formLink); // Update the URI to refresh
    };
    useEffect(() => {
        refreshWebView()
    }, [user]);
    useEffect(() => {
        fetchUserDetails();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchUserDetails()
        });

        return unsubscribe;
    }, [navigation]);

    const generateLink = async () => {
        try {
            const response = await axios.post(`${Api}/clients/generate-form-link`, { adminId: user._id, api: Api.slice(0, -4) });
            setLink(response.data.link);
            dispatch(setAuth({ user: response.data.user }));
            setUser(response.data.user)
            Alert.alert("Success", "Form link generated successfully.");
        } catch (error) {
            console.error("Error generating form link:", error);
            Alert.alert("Error", "Could not generate form link.");
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

    const handlePageChange = (page) => {
        console.log("page:", page)
        setActiveTab(page);
        translateX.value = withTiming(page * (windowWidth / 2)); // Adjust width division as per number of tabs

        // Set the page in PagerView
        if (pagerRef.current) {
            pagerRef.current.setPage(page);
        }

    };

    // Pick an image from the device
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setLogo(result.assets[0].uri);
            uploadImage(result.assets[0].uri);
        }
    };

    // Upload the image to the backend
    const uploadImage = async (uri) => {
        setUploading(true);
        setMessage('');
        const compressor = await ImageCompressor.compress(uri, {
            compressionMethod: "auto",
        });
        // Prepare the image for upload
        const formData = new FormData();
        formData.append('logoImage', {
            uri: compressor,
            type: 'image/jpeg',
            name: 'profile.jpg',
        });

        try {
            // Send the image to your backend
            const response = await axios.post(
                `${Api}/profile/users/${user._id}/logo-image`, // Replace with your backend URL
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setMessage(response.data.message || 'logo uploaded successfully!');
            fetchUserDetails()
        } catch (error) {
            console.error(error);
            setMessage('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteLogoImage = async () => {
        setDeleteLoading(true);

        try {
            const response = await axios.delete(`${Api}/profile/users/${user._id}/logo-image`);
            setDeleteLoading(false);

            Alert.alert('Success', response.data.message, [{ text: 'OK' }]);
            setLogo(null)
            fetchUserDetails()
            // Optionally: Update your app's user state or UI to reflect the deletion
        } catch (error) {
            setDeleteLoading(false);
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete profile image');
        }
    };



    const handleSave = async (field, title) => {
        // if (!field) return; // Ensure name is not empty
        setIsSaving(true);
        try {
            const token = await AsyncStorage.getItem('userToken'); // Get the token for authorization

            const response = await axios.put(`${Api}/auth/update-form`, {
                [title]: field // Send the new name in the request body
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Include the token in the headers
                }
            });

            if (response.data.message) {
                // Alert.alert('Success', response.data.message); // Show success message
                fetchUserDetails(); // Fetch updated user details
                setModalVisible(false); // Close the modal
            }
        } catch (error) {
            console.error('Error updating Name:', error);
            Alert.alert('Error', error.response?.data?.message || `Failed to update ${field}`); // Show error message
        } finally {
            setIsSaving(false); // Reset saving state
        }
    };

    const validatePhoneNumber = (phone) => {
        if (phone === "") return true
        const phoneRegex = /^(?:\d{10}|\d{9})$/; // Validates either 10 or 9 digits
        return phoneRegex.test(phone);
    };


    return (
        <View
            style={styles.container}
        // behavior={Platform.OS === "ios" ? "padding" : "height"}
        // keyboardShouldPersistTaps="handled"
        >

            {/* <View style={styles.container}> */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                onShow={() => {
                    if (modalTitle !== "experience") {


                        // Focus the amount input when the modal is shown
                        setTimeout(() => {
                            inputRef.current?.focus();
                        }, 100);
                    }
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    {/*  <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
                    <View style={styles.modalIdOverlay}>
                        <Animatable.View
                            animation="slideInUp"
                            duration={300}
                            style={styles.modalIdContent}
                        >
                            <View style={styles.modalIdHeader}>
                                <TouchableOpacity
                                    style={styles.descriptionModalClose}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <MaterialIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                                <Text allowFontScaling={false} style={styles.modalIdTitle}>{`Edit ${modalTitle === "clinicName" ? "Clinic Name" : modalTitle === "clinicAddress" ? "Clinic Address" : modalTitle === "welcomeMessage" ? "Welcome Message" : modalTitle === "thankYouMessage" ? "thank You Message" : modalTitle}`}</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.saveIdButton,
                                        isSaving || modalTitle === "phone" && !validatePhoneNumber(modalField) && styles.saveButtonIdDisabled
                                    ]}
                                    onPress={() => handleSave(modalField, modalTitle)}
                                    disabled={isSaving || modalTitle === "phone" && !validatePhoneNumber(modalField)/* :  modalField === "" */}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text allowFontScaling={false} style={styles.saveButtonIdText}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalIdBody}>
                                <View style={styles.inputIdContainer}>
                                    <Text allowFontScaling={false} style={styles.inputIdLabel}>{modalTitle === "clinicName" ? "Clinic Name" : modalTitle === "clinicAddress" ? "Clinic Address" : modalTitle === "welcomeMessage" ? "Welcome Message" : modalTitle === "thankYouMessage" ? "thank You Message" : modalTitle}</Text>
                                    {modalTitle === "experience" ? (
                                        <Picker
                                            selectedValue={modalField}
                                            onValueChange={(itemValue) => setModalField(itemValue)}
                                            style={{ height: 300, width: 150, /* backgroundColor: "rgba(0,0,0,0.1)", */ alignSelf: "center", borderRadius: 10 }}
                                        >
                                            {Array.from({ length: 101 }, (_, i) => i).map((year) => (
                                                <Picker.Item key={year} label={year.toString()} value={year} />
                                            ))}
                                        </Picker>
                                    ) :
                                        <TextInput
                                            allowFontScaling={false}
                                            ref={inputRef}
                                            style={modalTitle === "welcomeMessage" || modalTitle === "thankYouMessage" ? [styles.inputId, styles.textAreaLong] : styles.inputId}
                                            placeholder={`Enter your ${modalTitle === "clinicName" ? "Clinic Name" : modalTitle === "clinicAddress" ? "Clinic Address" : modalTitle === "welcomeMessage" ? "Welcome Message" : modalTitle === "thankYouMessage" ? "thank You Message" : modalTitle}`} // Fixed placeholder
                                            value={modalField}
                                            onChangeText={setModalField}
                                            keyboardType={modalTitle === "phone" ? "phone-pad" : "default"}
                                            placeholderTextColor="#999"
                                            multiline={modalTitle === "welcomeMessage" || modalTitle === "thankYouMessage" ? true : false} // Enable multiline
                                            numberOfLines={modalTitle === "welcomeMessage" || modalTitle === "thankYouMessage" ? 8 : 1} // Set number of lines
                                            editable
                                        />}
                                    {modalTitle === "phone" && !validatePhoneNumber(modalField) && (
                                        <Animatable.Text
                                            animation="shake"
                                            style={styles.errorIdText}
                                        >
                                            {`Invalid ${modalTitle} number`}
                                        </Animatable.Text>
                                    )}
                                </View>
                            </View>
                        </Animatable.View>
                    </View>
                    {/*  </TouchableWithoutFeedback> */}
                </KeyboardAvoidingView>
            </Modal>
            <View style={{ flexDirection: "row", alignSelf: "center", alignItems: "center", width: "90%", paddingVertical: 15, /* backgroundColor: "#f0f0f0", */ borderRadius: 5 }}>
                <Ionicons name="earth-outline" size={24} color="black" />
                <Text style={{ marginLeft: 10, fontSize: 16, color: "#333", fontWeight: "500", /* textAlign: "center" */ }}>
                    This form is public and available to anyone with the link
                </Text>
            </View>
            {
                Platform.OS === "ios" && <InputAccessoryView nativeID={inputAccessoryViewID}>
                    <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.accessoryButton}>
                        <Text allowFontScaling={false} style={styles.accessoryButtonText}>Close</Text>
                    </TouchableOpacity>
                </InputAccessoryView>
            }
            {
                user.formLink ?
                    <View>
                        <ScrollView horizontal={true} style={{
                            width: windowWidth * 0.9, /* height: 50, */ alignSelf: "center", backgroundColor: "rgba(0,0,0,0.1)", padding: 10, borderRadius: 5,
                        }}>
                            <Text
                                numberOfLines={1}
                                // style={{ flex: 1 }}
                                selectable
                            >
                                {user.formLink}
                            </Text>
                        </ScrollView>

                        <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginTop: 20, }}>
                            <Animatable.View animation="bounceIn" duration={1000}>
                                <TouchableOpacity
                                    style={styles.copyButton}
                                    onPress={() => Linking.openURL(user.formLink)}
                                >
                                    <MaterialIcons name="open-in-browser" size={24} color="white" />
                                    <Text allowFontScaling={false} style={styles.copyButtonText}>Preview</Text>
                                </TouchableOpacity>
                            </Animatable.View>
                            <Animatable.View animation="bounceIn" duration={1000}>
                                <TouchableOpacity
                                    style={styles.copyButton}
                                    onPress={() => {
                                        Share.share({
                                            message: `${user.formLink}`,
                                        });
                                    }}
                                >
                                    <MaterialIcons name="share" size={24} color="white" />
                                    <Text allowFontScaling={false} style={styles.copyButtonText}>Share Link</Text>
                                </TouchableOpacity>
                            </Animatable.View>
                            {/* <Animatable.View animation="bounceIn" duration={1000}>
                                <TouchableOpacity
                                    style={styles.copyButton}
                                    onPress={generateLink}
                                >
                                    <MaterialIcons name="share" size={24} color="white" />
                                    <Text allowFontScaling={false} style={styles.copyButtonText}>Generate New Link</Text>
                                </TouchableOpacity>
                            </Animatable.View> */}

                        </View>

                        <View style={styles.tabBarContainer}>
                            {['Edit form', 'Preview'].map((tab, index) => (
                                <TouchableOpacity
                                    key={tab}
                                    style={styles.tab}
                                    onPress={() => handlePageChange(index)}
                                >
                                    <Animatable.View
                                        animation={activeTab === index ? 'pulse' : undefined}
                                        style={styles.tabContent}
                                    >
                                        <MaterialIcons
                                            name={
                                                index === 0 ? 'edit' :
                                                    'preview'
                                            }
                                            size={24}
                                            color={activeTab === index ? '#014495' : '#666'}
                                        />
                                        <Text allowFontScaling={false} style={[
                                            styles.tabText,
                                            activeTab === index && styles.activeTabText
                                        ]}>
                                            {tab}
                                        </Text>
                                    </Animatable.View>
                                </TouchableOpacity>
                            ))}
                            <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
                        </View>
                        <View >
                            <PagerView
                                ref={pagerRef}
                                style={[styles.pagerView, { height: windowHeight }]}
                                initialPage={0}
                                onPageSelected={onPageSelected}
                            >


                                <View key="1" style={styles.page}>

                                    {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss()}> */}
                                    <ScrollView showsVerticalScrollIndicator={true}
                                        keyboardShouldPersistTaps={"handled"}
                                        style={{ marginBottom: 500 }}
                                    >
                                        <Animatable.View animation="bounceIn" duration={1000}>
                                            <TouchableOpacity
                                                style={styles.copyButton}
                                                onPress={generateLink}
                                            >
                                                <MaterialIcons name="share" size={24} color="white" />
                                                <Text allowFontScaling={false} style={styles.copyButtonText}>Generate New Link</Text>
                                            </TouchableOpacity>
                                        </Animatable.View>
                                        <KeyboardAvoidingView
                                            // style={{ flex: 1,/*  marginBottom: 500 *//* backgroundColor: "green" */ }}
                                            behavior={Platform.OS === "ios" ? "padding" : "height"}

                                        >
                                            <Animatable.View animation="fadeIn" duration={300} style={styles.imageContainer}>
                                                {uploading && <ActivityIndicator size="large" color="#0000ff" style={styles.defaultImageIcon} />}
                                                {logo ? (
                                                    <>
                                                        <TouchableOpacity onPress={pickImage}>

                                                            <Image source={{ uri: user.logo }} style={styles.image} />
                                                        </TouchableOpacity>
                                                        {deleteLoading ? (
                                                            <ActivityIndicator size="large" color="#0000ff" />
                                                        ) : (
                                                            <TouchableOpacity
                                                                style={[styles.button, /* styles.deleteButton */]}
                                                                onPress={handleDeleteLogoImage}
                                                            >
                                                                {/*  <MaterialIcons name="delete" size={24} color="#fff" /> */}
                                                                <Text allowFontScaling={false} style={styles.buttonDeleteImageText}>Delete logo Image</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </>
                                                ) : (
                                                    <TouchableOpacity onPress={pickImage} style={{}}>
                                                        {/* <MaterialCommunityIcons name="file-image-plus" size={200} color="#ccc" style={styles.defaultImageIcon} /> */}
                                                        <MaterialIcons name="account-circle" size={100} color="#ccc" style={styles.defaultImageIcon} />
                                                    </TouchableOpacity>
                                                )}
                                                {/*  {message && <Text allowFontScaling={false}  style={styles.message}>{message}</Text>} */}
                                                <TouchableOpacity style={styles.button} onPress={pickImage}>
                                                    {/* <MaterialIcons name="photo" size={24} color='#014495' /> */}
                                                    <Text allowFontScaling={false} style={styles.buttonText}>Edit logo</Text>
                                                </TouchableOpacity>

                                            </Animatable.View>
                                            <View style={styles.settingsContainer}>

                                                <Animatable.View animation="fadeIn" duration={300}>
                                                    <TouchableOpacity style={styles.settingOption} onPress={() => { showDynamicModal("phone", user.phone) }}>
                                                        <MaterialIcons name="phone" size={24} color={user.phone ? "#333" : "rgba(0,0,0,0.3)"} />
                                                        <Text allowFontScaling={false} style={[styles.settingText, { color: user.phone ? '#333' : "rgba(0,0,0,0.3)" }]}>{user.phone ? user.phone : "Add Phone"}</Text>
                                                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                                                    </TouchableOpacity>
                                                </Animatable.View>

                                                <Animatable.View animation="fadeIn" duration={300}>
                                                    <TouchableOpacity style={styles.settingOption} onPress={() => { showDynamicModal("specialization", user.specialization) }}>
                                                        <Ionicons name="briefcase-outline" size={24} color={user.specialization ? "#333" : "rgba(0,0,0,0.3)"} />
                                                        <Text allowFontScaling={false} style={[styles.settingText, { color: user.specialization ? '#333' : "rgba(0,0,0,0.3)" }]}>{user.specialization ? user.specialization : "Add Specialization"}</Text>
                                                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                                                    </TouchableOpacity>
                                                </Animatable.View>

                                                <Animatable.View animation="fadeIn" duration={300}>
                                                    <TouchableOpacity style={styles.settingOption} onPress={() => { showDynamicModal("experience", user.experience) }}>
                                                        <Ionicons name="time-outline" size={24} color={user.experience ? "#333" : "rgba(0,0,0,0.3)"} />
                                                        <Text allowFontScaling={false} style={[styles.settingText, { color: user.experience ? '#333' : "rgba(0,0,0,0.3)" }]}>{user.experience ? user.experience : "Add Experience"}</Text>
                                                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                                                    </TouchableOpacity>
                                                </Animatable.View>

                                                <Animatable.View animation="fadeIn" duration={300}>
                                                    <TouchableOpacity style={styles.settingOption} onPress={() => { showDynamicModal("clinicName", user.clinicName) }}>
                                                        <Ionicons name="home-outline" size={24} color={user.clinicName ? "#333" : "rgba(0,0,0,0.3)"} />
                                                        <Text allowFontScaling={false} style={[styles.settingText, { color: user.clinicName ? '#333' : "rgba(0,0,0,0.3)" }]}>{user.clinicName ? user.clinicName : "Add Clinic Name"}</Text>
                                                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                                                    </TouchableOpacity>
                                                </Animatable.View>

                                                <Animatable.View animation="fadeIn" duration={300}>
                                                    <TouchableOpacity style={styles.settingOption} onPress={() => { showDynamicModal("clinicAddress", user.clinicAddress) }}>
                                                        <Ionicons name="location-outline" size={24} color={user.clinicAddress ? "#333" : "rgba(0,0,0,0.3)"} />
                                                        <Text allowFontScaling={false} style={[styles.settingText, { color: user.clinicAddress ? '#333' : "rgba(0,0,0,0.3)" }]}>{user.clinicAddress ? user.clinicAddress : "Add Clinic Address"}</Text>
                                                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                                                    </TouchableOpacity>
                                                </Animatable.View>
                                            </View>

                                            {/*  <View style={{ backgroundColor: "rgba(0,0,0,0.1)", height: 2, marginBottom: 20, width: windowWidth * 0.9, alignSelf: "center" }} /> */}
                                            <Text allowFontScaling={false} style={styles.longInputTitle}>Welcome Message</Text>
                                            <View style={styles.settingsContainer}>

                                                <Animatable.View animation="fadeIn" duration={300}>
                                                    <TouchableOpacity style={styles.settingOption} onPress={() => { showDynamicModal("welcomeMessage", user.welcomeMessage) }}>
                                                        <Ionicons name="chatbubble-outline" size={24} color={user.welcomeMessage ? "#333" : "rgba(0,0,0,0.3)"} />
                                                        <Text allowFontScaling={false} numberOfLines={2} style={[styles.settingText, { color: user.welcomeMessage ? '#333' : "rgba(0,0,0,0.3)" }]}>{user.welcomeMessage ? user.welcomeMessage : "Add Welcome Message"}</Text>
                                                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                                                    </TouchableOpacity>
                                                </Animatable.View>
                                            </View>
                                            <Text allowFontScaling={false} style={styles.longInputTitle}>Thank You Message</Text>
                                            <View style={styles.settingsContainer}>

                                                <Animatable.View animation="fadeIn" duration={300}>
                                                    <TouchableOpacity style={styles.settingOption} onPress={() => { showDynamicModal("thankYouMessage", user.thankYouMessage) }}>
                                                        <Ionicons name="chatbubble-outline" size={24} color={user.thankYouMessage ? "#333" : "rgba(0,0,0,0.3)"} />
                                                        <Text allowFontScaling={false} numberOfLines={2} style={[styles.settingText, { color: user.thankYouMessage ? '#333' : "rgba(0,0,0,0.3)" }]}>{user.thankYouMessage ? user.thankYouMessage : "Add Thank You Message"}</Text>
                                                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                                                    </TouchableOpacity>
                                                </Animatable.View>
                                            </View>


                                            {/* <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Phone</Text>
                                                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                                                <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} style={styles.input} inputAccessoryViewID={inputAccessoryViewID} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Specialization</Text>
                                                <Ionicons name="briefcase-outline" size={20} color="#666" style={styles.inputIcon} />
                                                <TextInput placeholder="Specialization" value={specialization} onChangeText={setSpecialization} style={styles.input} inputAccessoryViewID={inputAccessoryViewID} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Experience</Text>
                                                <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
                                                <TextInput placeholder="Experience" value={experience} keyboardType="numeric" onChangeText={setExperience} style={styles.input} inputAccessoryViewID={inputAccessoryViewID} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Clinic Name</Text>
                                                <Ionicons name="home-outline" size={20} color="#666" style={styles.inputIcon} />
                                                <TextInput placeholder="Clinic Name" value={clinicName} onChangeText={setClinicAddress} style={styles.input} inputAccessoryViewID={inputAccessoryViewID} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Clinic Address</Text>
                                                <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                                                <TextInput placeholder="Clinic Address" value={clinicAddress} onChangeText={setClinicAddress} style={styles.input} inputAccessoryViewID={inputAccessoryViewID} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Welcome Message</Text>
                                                <Ionicons name="chatbubble-outline" size={20} color="#666" style={styles.inputIcon} />
                                                <TextInput
                                                    placeholder="Welcome Message"
                                                    value={welcomeMessage}
                                                    onChangeText={setWelcomeMessage}
                                                    style={[styles.input, styles.textAreaLong]} // Added textArea style
                                                    inputAccessoryViewID={inputAccessoryViewID}
                                                    multiline={true} // Enable multiline
                                                    numberOfLines={4} // Set number of lines
                                                    editable
                                                />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Thank You Message</Text>
                                                <Ionicons name="chatbubbles-outline" size={20} color="#666" style={styles.inputIcon} />
                                                <TextInput
                                                    placeholder="Thank You Message"
                                                    value={thankYouMessage}
                                                    onChangeText={setThankYouMessage}
                                                    style={[styles.input, styles.textAreaLong]} // Added textArea style
                                                    inputAccessoryViewID={inputAccessoryViewID}
                                                    multiline={true} // Enable multiline
                                                    numberOfLines={4} // Set number of lines
                                                    editable
                                                />
                                            </View> */}
                                            {/* <TouchableOpacity style={styles.submitButton} >
                                                <Text style={styles.submitButtonText}>Save</Text>
                                            </TouchableOpacity> */}
                                        </KeyboardAvoidingView>
                                    </ScrollView>
                                    {/* </TouchableWithoutFeedback> */}
                                    {/*  </KeyboardAvoidingView> */}

                                </View>
                                <View key="2" style={styles.page}>
                                    <View style={{ height: "50%" }}>

                                        <WebView source={{ uri: webViewUri }} pullToRefreshEnabled={true} style={{ width: windowWidth, height: windowHeight * 2, backgroundColor: 'transparent', marginTop: 20, alignSelf: "center", flex: 1 }} scalesPageToFit={true} contentMode="mobile" scrollEnabled={true} />
                                    </View>
                                </View>
                            </PagerView>
                        </View>
                    </View> : <Button title="Generate Form Link" onPress={generateLink} style={{ height: 50, alignSelf: "center" }} />
            }

            {/* </View> */}

        </View >

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: 'green',

    },
    header: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E1E1E1',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
    },
    formContainer: {
        padding: 20,
    },
    /*  inputGroup: {
         marginBottom: 20,
     }, */
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E1E1E1',
        color: '#333',
    },
    textArea: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E1E1E1',
        color: '#333',
        height: 100,
        textAlignVertical: 'top',
    },
    dateButton: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E1E1E1',
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E1E1E1',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    submitButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    copyButton: {
        backgroundColor: '#014495',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 10,
    },
    copyButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        // marginHorizontal: 15,
        marginVertical: 10,
        borderRadius: 15,
        height: 60,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContent: {
        alignItems: 'center',
    },
    tabText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    activeTabText: {
        color: '#014495',
        fontWeight: '600',
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        width: windowWidth / 2,
        backgroundColor: '#014495',
        borderRadius: 1.5,
    },
    // pagerView: { flex: 1 },
    editModalInputError: {
        borderColor: '#FF4444',
    },
    accessoryButton: {
        padding: 10,
        backgroundColor: '#FFF',
        alignItems: 'flex-start',
    },
    accessoryButtonText: {
        color: '#4A90E2',
        fontSize: 16,
    },
    defaultImageIcon: {
        marginTop: 20, // Adjust margin as needed
        borderRadius: 50, // Optional: to make it circular
    },
    buttonDeleteImageText: {
        color: '#ff0000',
        marginLeft: 10,
        fontSize: 16,
    },
    imageContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    image: {
        width: 100,
        height: 100,
        marginTop: 20,
        borderRadius: 100,
    },
    message: {
        marginTop: 20,
        fontSize: 16,
        color: 'green',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        // marginVertical: 5,
        // width: '80%',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: '#ff0000',
    },
    buttonText: {
        color: '#014495',
        marginLeft: 10,
        fontSize: 16,
    },
    inputGroup: {
        marginBottom: 20,
        // position: 'relative',
        width: "95%",
        alignSelf: "center",
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputIcon: {
        position: 'absolute',
        left: 10,
        top: 40, // Adjust based on your input height
    },
    textAreaLong: {
        height: 100, // Adjust height as needed
        textAlignVertical: 'top', // Align text to the top
    },
    modalIdOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalIdContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        maxHeight: '90%',
    },
    modalIdHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    descriptionModalClose: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    modalIdTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    saveIdButton: {
        backgroundColor: '#014495',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonIdDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonIdText: {
        color: 'white',
        fontWeight: '500',
    },
    modalIdBody: {
        padding: 16,
    },
    inputIdContainer: {
        marginBottom: 16,
    },
    inputIdLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    inputId: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    inputError: {
        borderColor: '#ff3b30',
        borderWidth: 1
    },
    errorIdText: {
        color: '#ff3b30',
        fontSize: 12,
        marginTop: 4,
    },
    settingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
        flex: 1,
    },
    settingsContainer: {
        width: '100%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 20,
    },
    longInputTitle: {
        fontSize: 20, // Adjust size as needed
        fontWeight: 'bold',
        color: '#333', // Adjust color as needed
        marginBottom: 10, // Adjust spacing as needed
    },



});

export default ClientForm;