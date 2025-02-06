import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View, Button, StyleSheet, Text, ActivityIndicator, Dimensions, Alert, TouchableOpacity, Modal, TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { clearUser } from '../redux/slices/userSlice';
import { clearAuth } from '../redux/slices/authSlice';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Api } from '../Api';
import { useSelector } from 'react-redux';
import { Image } from 'expo-image';
import { Image as ImageCompressor } from "react-native-compressor";
import * as Animatable from 'react-native-animatable';
import { MaterialIcons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const GuideLineBaseWidth = 414;
const GuideLineBaseHeight = 896;
const horizontalScale = (size) => (windowWidth / GuideLineBaseWidth) * size;
const verticalScale = (size) => (windowHeight / GuideLineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
    size + (horizontalScale(size) - size) * factor;


export default function Profile({ navigation }) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false); // To show a loading indicator
    const [message, setMessage] = useState(''); // To display success/error messages
    const [user, setUser] = useState(useSelector((state) => state.auth.user))
    // const user = useSelector((state) => state.auth.user);
    const [image, setImage] = useState(user.profileImage); // For displaying selected image
    const [name, setName] = useState(user.name)
    const [email, setEmail] = useState(user.email)
    const [phone, setPhone] = useState(user.phone)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [nameModalVisible, setNameModalVisible] = useState(false)
    const [emailModalVisible, setEmailModalVisible] = useState(false)
    const [phoneModalVisible, setPhoneModalVisible] = useState(false)
    const dispatch = useDispatch();
    const nameInputRef = useRef(null);
    const emailInputRef = useRef(null);
    const phoneInputRef = useRef(null);
    const [isNameSaving, setIsNameSaving] = useState(false);
    const [isEmailSaving, setIsEmailSaving] = useState(false);
    const [isPhoneSaving, setIsPhoneSaving] = useState(false);
    const [emailStep, setEmailStep] = useState(1); // 1 for email input, 2 for verification code
    const [newEmail, setNewEmail] = useState(user.email);
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);


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
        } catch (error) {

            console.error('Error fetching user details:', error.response.data);

        }
    }
    useEffect(() => {
        fetchUserDetails();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchUserDetails()
        });

        return unsubscribe;
    }, [navigation]);

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSendVerificationCode = async () => {
        try {
            setIsVerifying(true);
            console.log("newEmail:", newEmail) // Debug log

            // Make sure we have the token
            const token = await AsyncStorage.getItem('userToken');

            const response = await axios.post(`${Api}/auth/verify-new-email`, {
                newEmail: newEmail
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.message) {
                // Alert.alert('Success', 'Verification code sent to your email');
                setEmailStep(2);
            }
        } catch (error) {
            Alert.alert('Error', error /* error.response?.data?.message */ || 'Failed to send verification code');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerifyAndUpdateEmail = async () => {
        try {
            setIsEmailSaving(true);

            // Make sure we have the token
            const token = await AsyncStorage.getItem('userToken');

            const response = await axios.post(`${Api}/auth/update-email`, {
                code: verificationCode
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.message) {
                // Alert.alert('Success', 'Email updated successfully');
                setEmailModalVisible(false);
                fetchUserDetails();
                // Reset states
                setEmailStep(1);
                setNewEmail('');
                setVerificationCode('');
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to verify code');
        } finally {
            setIsEmailSaving(false);
        }
    };
    const handleSaveName = async () => {
        if (!name) return; // Ensure name is not empty
        setIsNameSaving(true);
        try {
            const token = await AsyncStorage.getItem('userToken'); // Get the token for authorization

            const response = await axios.put(`${Api}/auth/update-name`, {
                newName: name // Send the new name in the request body
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Include the token in the headers
                }
            });

            if (response.data.message) {
                // Alert.alert('Success', response.data.message); // Show success message
                fetchUserDetails(); // Fetch updated user details
                setNameModalVisible(false); // Close the modal
            }
        } catch (error) {
            console.error('Error updating Name:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update name'); // Show error message
        } finally {
            setIsNameSaving(false); // Reset saving state
        }
    };

    const handleSavePhone = async () => {
        if (!phone) return; // Ensure name is not empty
        setIsPhoneSaving(true);
        try {
            const token = await AsyncStorage.getItem('userToken'); // Get the token for authorization

            const response = await axios.put(`${Api}/auth/update-phone`, {
                newPhone: phone // Send the new name in the request body
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Include the token in the headers
                }
            });

            if (response.data.message) {
                // Alert.alert('Success', response.data.message); // Show success message
                fetchUserDetails(); // Fetch updated user details
                setPhoneModalVisible(false); // Close the modal
            }
        } catch (error) {
            console.error('Error updating Name:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update phone'); // Show error message
        } finally {
            setIsPhoneSaving(false); // Reset saving state
        }
    };

    const handleSaveEmail = async (clientId) => {
        if (!name) return;
        setIsEmailSaving(true);
        try {

            axios.put(`${Api}/clients/${clientId}/${user._id}`, {
                email: email
            });
            fetchUserDetails();
            setEmailModalVisible(false);
        } catch (error) {
            console.error('Error updating Name:', error);
            Alert.alert('Error', 'Failed to update ID number');
        } finally {
            setIsEmailSaving(false);
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
            setImage(result.assets[0].uri);
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
        formData.append('profileImage', {
            uri: compressor,
            type: 'image/jpeg',
            name: 'profile.jpg',
        });

        try {
            // Send the image to your backend
            const response = await axios.post(
                `${Api}/profile/users/${user._id}/profile-image`, // Replace with your backend URL
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setMessage(response.data.message || 'Image uploaded successfully!');
            fetchUserDetails()
        } catch (error) {
            console.error(error);
            setMessage('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteProfileImage = async () => {
        setDeleteLoading(true);

        try {
            const response = await axios.delete(`${Api}/profile/users/${user._id}/profile-image`);
            setDeleteLoading(false);

            Alert.alert('Success', response.data.message, [{ text: 'OK' }]);
            setImage(null)
            fetchUserDetails()
            // Optionally: Update your app's user state or UI to reflect the deletion
        } catch (error) {
            setDeleteLoading(false);
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete profile image');
        }
    };

    const logOutPressed = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            //  dispatch(clearAuth());
        }
        catch (e) { Alert.alert("Error to log out try again") } finally { navigation.navigate("Auth", { screen: "SignIn" }) }
    }
    return (
        <View style={{
            flex: 1, /* justifyContent: "center",  */alignItems: "center"
        }}>



            <Animatable.View animation="fadeIn" duration={300} style={styles.imageContainer}>
                {uploading && <ActivityIndicator size="large" color="#0000ff" style={styles.defaultImageIcon} />}
                {image ? (
                    <>
                        <TouchableOpacity onPress={pickImage}>

                            <Image source={{ uri: user.profileImage }} style={styles.image} />
                        </TouchableOpacity>
                        {deleteLoading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, /* styles.deleteButton */]}
                                onPress={handleDeleteProfileImage}
                            >
                                {/*  <MaterialIcons name="delete" size={24} color="#fff" /> */}
                                <Text allowFontScaling={false} style={styles.buttonDeleteImageText}>Delete Profile Image</Text>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <TouchableOpacity onPress={pickImage}>
                        <MaterialIcons name="account-circle" size={200} color="#ccc" style={styles.defaultImageIcon} />
                    </TouchableOpacity>
                )}
                {/*  {message && <Text allowFontScaling={false}  style={styles.message}>{message}</Text>} */}
                <TouchableOpacity style={styles.button} onPress={pickImage}>
                    {/* <MaterialIcons name="photo" size={24} color='#014495' /> */}
                    <Text allowFontScaling={false} style={styles.buttonText}>Edit picture</Text>
                </TouchableOpacity>

            </Animatable.View>
            <View style={styles.settingsContainer}>
                <Animatable.View animation="fadeIn" duration={300}>
                    <TouchableOpacity style={styles.settingOption} onPress={() => setNameModalVisible(true)}>
                        <MaterialIcons name="person" size={24} color="#333" />
                        <Text allowFontScaling={false} style={styles.settingText}>{user.name}</Text>
                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                </Animatable.View>

                <Animatable.View animation="fadeIn" duration={300} delay={100}>
                    <TouchableOpacity style={styles.settingOption} onPress={() => { setNewEmail(user.email); setEmailModalVisible(true) }}>
                        <MaterialIcons name="email" size={24} color="#333" />
                        <Text allowFontScaling={false} style={styles.settingText}>{user.email}</Text>
                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                </Animatable.View>

                <Animatable.View animation="fadeIn" duration={300}>
                    <TouchableOpacity style={styles.settingOption} onPress={() => setPhoneModalVisible(true)}>
                        <MaterialIcons name="phone" size={24} color={user.phone ? "#333" : "rgba(0,0,0,0.3)"} />
                        <Text allowFontScaling={false} style={[styles.settingText, { color: user.phone ? '#333' : "rgba(0,0,0,0.3)" }]}>{user.phone ? user.phone : "Add Phone"}</Text>
                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                </Animatable.View>

                <Animatable.View animation="fadeIn" duration={300} delay={200}>
                    <TouchableOpacity style={styles.settingOption} onPress={logOutPressed}>
                        <MaterialIcons name="logout" size={24} color="#333" />
                        <Text allowFontScaling={false} style={styles.settingText}>Logout</Text>
                        <AntDesign name="right" size={24} color="#333" style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                </Animatable.View>
            </View>
            {/*  <TouchableOpacity onPress={() => setNameModalVisible(true)}>
                <Text allowFontScaling={false} >{user.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setNewEmail(user.email); setEmailModalVisible(true) }}>
                <Text allowFontScaling={false} >{user.email}</Text>
            </TouchableOpacity>
            <Button
                onPress={logOutPressed}
                title="Logout"
                color="#841584"
                accessibilityLabel="Learn more about this purple button"
            /> */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={nameModalVisible}
                onRequestClose={() => setNameModalVisible(false)}
                onShow={() => {
                    // Focus the amount input when the modal is shown
                    setTimeout(() => {
                        nameInputRef.current?.focus();
                    }, 100);
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalIdOverlay}>
                            <Animatable.View
                                animation="slideInUp"
                                duration={300}
                                style={styles.modalIdContent}
                            >
                                <View style={styles.modalIdHeader}>
                                    <TouchableOpacity
                                        style={styles.descriptionModalClose}
                                        onPress={() => setNameModalVisible(false)}
                                    >
                                        <MaterialIcons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                    <Text allowFontScaling={false} style={styles.modalIdTitle}>Edit your Name</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.saveIdButton,
                                            name === "" && styles.saveButtonIdDisabled
                                        ]}
                                        onPress={() => handleSaveName()}
                                        disabled={isNameSaving || name === ""}
                                    >
                                        {isNameSaving ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text allowFontScaling={false} style={styles.saveButtonIdText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalIdBody}>
                                    <View style={styles.inputIdContainer}>
                                        <Text allowFontScaling={false} style={styles.inputIdLabel}>FullName</Text>
                                        <TextInput
                                            ref={nameInputRef}
                                            style={styles.inputId}
                                            placeholder="Enter your fullname"
                                            value={name}
                                            onChangeText={setName}
                                            keyboardType="name-phone-pad"
                                            // maxLength={20}
                                            placeholderTextColor="#999"
                                        />
                                        {name === "" && (
                                            <Animatable.Text
                                                animation="shake"
                                                style={styles.errorIdText}
                                            >
                                                Name cannot be empty
                                            </Animatable.Text>
                                        )}
                                    </View>
                                </View>
                            </Animatable.View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
            <Modal
                animationType="slide"
                transparent={true}
                visible={emailModalVisible}
                onRequestClose={() => {
                    setEmailModalVisible(false);
                    setEmailStep(1);
                }}
                onShow={() => {
                    setTimeout(() => {
                        emailInputRef.current?.focus();
                    }, 100);
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalIdOverlay}>
                            <Animatable.View
                                animation="slideInUp"
                                duration={300}
                                style={styles.modalIdContent}
                            >
                                <View style={styles.modalIdHeader}>
                                    <TouchableOpacity
                                        style={styles.descriptionModalClose}
                                        onPress={() => {
                                            setEmailModalVisible(false);
                                            setEmailStep(1);
                                        }}
                                    >
                                        <MaterialIcons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                    <Text allowFontScaling={false} style={styles.modalIdTitle}>
                                        {emailStep === 1 ? 'Change Email' : 'Verify Email'}
                                    </Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.saveIdButton,
                                            (emailStep === 1 ? !newEmail : !verificationCode) &&
                                            styles.saveButtonIdDisabled
                                        ]}
                                        onPress={() =>
                                            emailStep === 1 ?
                                                handleSendVerificationCode() :
                                                handleVerifyAndUpdateEmail()
                                        }
                                        disabled={isVerifying || isEmailSaving ||
                                            (emailStep === 1 ? !newEmail : !verificationCode)}
                                    >
                                        {isVerifying || isEmailSaving ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text allowFontScaling={false} style={styles.saveButtonIdText}>
                                                {emailStep === 1 ? 'Send Code' : 'Verify'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.modalIdBody}>
                                    <Animatable.View
                                        animation={emailStep === 1 ? "slideInRight" : "slideInLeft"}
                                        style={styles.inputIdContainer}
                                    >
                                        {emailStep === 1 ? (
                                            <>
                                                <Text allowFontScaling={false} style={styles.inputIdLabel}>New Email Address</Text>
                                                <TextInput
                                                    allowFontScaling={false}
                                                    ref={emailInputRef}
                                                    style={[
                                                        styles.inputId,
                                                        (!isValidEmail(newEmail) && newEmail !== '') && styles.inputError
                                                    ]}
                                                    placeholder="Enter new email"
                                                    value={newEmail}
                                                    onChangeText={setNewEmail}
                                                    keyboardType="email-address"
                                                    autoCapitalize="none"
                                                    placeholderTextColor="#999"
                                                />
                                                {!newEmail && (
                                                    <Animatable.Text
                                                        animation="shake"
                                                        style={styles.errorIdText}
                                                    >
                                                        Email cannot be empty
                                                    </Animatable.Text>
                                                )}
                                                {newEmail !== '' && !isValidEmail(newEmail) && (
                                                    <Animatable.Text
                                                        animation="shake"
                                                        style={styles.errorIdText}
                                                    >
                                                        Please enter a valid email address
                                                    </Animatable.Text>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Text allowFontScaling={false} style={styles.inputIdLabel}>Verification Code sent to {newEmail}</Text>
                                                <TextInput
                                                    allowFontScaling={false}
                                                    ref={emailInputRef}
                                                    style={styles.inputId}
                                                    placeholder="Enter verification code"
                                                    value={verificationCode}
                                                    onChangeText={setVerificationCode}
                                                    keyboardType="number-pad"
                                                    maxLength={6}
                                                    placeholderTextColor="#999"
                                                />
                                                {!verificationCode && (
                                                    <Animatable.Text
                                                        animation="shake"
                                                        style={styles.errorIdText}
                                                    >
                                                        Verification code cannot be empty
                                                    </Animatable.Text>
                                                )}
                                            </>
                                        )}
                                    </Animatable.View>
                                </View>
                            </Animatable.View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
            <Modal
                animationType="slide"
                transparent={true}
                visible={phoneModalVisible}
                onRequestClose={() => setPhoneModalVisible(false)}
                onShow={() => {
                    // Focus the amount input when the modal is shown
                    setTimeout(() => {
                        phoneInputRef.current?.focus();
                    }, 100);
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalIdOverlay}>
                            <Animatable.View
                                animation="slideInUp"
                                duration={300}
                                style={styles.modalIdContent}
                            >
                                <View style={styles.modalIdHeader}>
                                    <TouchableOpacity
                                        style={styles.descriptionModalClose}
                                        onPress={() => setPhoneModalVisible(false)}
                                    >
                                        <MaterialIcons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                    <Text allowFontScaling={false} style={styles.modalIdTitle}>Edit your phone number</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.saveIdButton,
                                            phone === "" && styles.saveButtonIdDisabled
                                        ]}
                                        onPress={() => handleSavePhone()}
                                        disabled={isPhoneSaving || phone === ""}
                                    >
                                        {isPhoneSaving ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text allowFontScaling={false} style={styles.saveButtonIdText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalIdBody}>
                                    <View style={styles.inputIdContainer}>
                                        <Text allowFontScaling={false} style={styles.inputIdLabel}>Phone Number</Text>
                                        <TextInput
                                            allowFontScaling={false}
                                            ref={phoneInputRef}
                                            style={styles.inputId}
                                            placeholder="Enter your phone number"
                                            value={phone}
                                            onChangeText={setPhone}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            placeholderTextColor="#999"
                                        />
                                        {phone === "" && (
                                            <Animatable.Text
                                                animation="shake"
                                                style={styles.errorIdText}
                                            >
                                                Phone cannot be empty
                                            </Animatable.Text>
                                        )}
                                    </View>
                                </View>
                            </Animatable.View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 200,
        height: 200,
        marginTop: 20,
        borderRadius: 100,
    },
    message: {
        marginTop: 20,
        fontSize: 16,
        color: 'green',
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
        marginTop: 20,
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
    imageContainer: {
        alignItems: 'center',
        marginVertical: 20,
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
    defaultImageIcon: {
        marginTop: 20, // Adjust margin as needed
        borderRadius: 50, // Optional: to make it circular
    },
    buttonDeleteImageText: {
        color: '#ff0000',
        marginLeft: 10,
        fontSize: 16,
    },
});