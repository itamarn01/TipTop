import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Dimensions,
    Animated,
    KeyboardAvoidingView,
    Platform,
    InputAccessoryView,
    Keyboard,
    TouchableWithoutFeedback,
    StatusBar
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api } from "../../Api";
import { useDispatch } from 'react-redux';
import { setAuth } from "../../redux/slices/authSlice";
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import {
    GoogleOneTapSignIn,
    statusCodes,
    isErrorWithCode,
    isSuccessResponse,
    isNoSavedCredentialFoundResponse,
    GoogleSigninButton,
} from '@react-native-google-signin/google-signin';
import { GoogleSignin, } from '@react-native-google-signin/google-signin';
import { Image } from 'expo-image';

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const GuideLineBaseWidth = 414;
const GuideLineBaseHeight = 896;
const horizontalScale = (size) => (windowWidth / GuideLineBaseWidth) * size;
const verticalScale = (size) => (windowHeight / GuideLineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
    size + (horizontalScale(size) - size) * factor;

export default function SignIn({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [countdown, setCountdown] = useState(0);
    const [isVerified, setIsVerified] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [googleUser, setGoogleUser] = useState();
    const dispatch = useDispatch();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    useEffect(() => {
        GoogleSignin.configure({
            webClientId: "826801571021-4qgv31c0n29lqfkksp1j2ufadshn0et0.apps.googleusercontent.com",
            offlineAccess: true, // Add this
            forceCodeForRefreshToken: true, // Add this
        });
    }, [])

    const signInWithGoogle = async () => {
        try {
            console.log("start google auth...")
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            // const tokens = await GoogleSignin.getTokens(); 
            console.log("response.user google:", response.user)
            handleGoogleLogin(response.user)
            console.log(" google response:", response.user)
            /*   if (isSuccessResponse(response)) {
                  setGoogleUser({ userInfo: response.data });
                  console.log("google user data: ", response.data)
              } else {
                  // sign in was cancelled by user
                  console.log("google user dont have details")
              } */
        } catch (error) {
            console.log("error google auth:", error)
            if (isErrorWithCode(error)) {
                switch (error.code) {
                    case statusCodes.IN_PROGRESS:
                        // operation (eg. sign in) already in progress
                        break;
                    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                        // Android only, play services not available or outdated
                        break;
                    default:
                    // some other error happened
                }
            } else {
                // an error that's not related to google sign in occurred
            }
        }
    };

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const goToSignUp = () => {
        navigation.navigate('SignUp');
    };
    const goToHome = () => {
        navigation.navigate('Splash');
    };
    const validateInputs = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return false;
        }
        if (password.length < 6) {
            Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
            return false;
        }
        return true;
    };

    const handleEmailPasswordLogin = async () => {
        if (!validateInputs()) return;

        try {
            const response = await fetch(`${Api}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                await AsyncStorage.setItem('userToken', data.token);
                dispatch(setAuth({ token: data.token, user: data.user }));
                goToHome()
            } else {
                Alert.alert('Login Failed', data.message || 'Please check your credentials and try again.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An error occurred during login. Please try again.');
        }
    };
    const handleAppleLogin = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            // Send credential.identityToken to your backend
            const response = await fetch(`${Api}/auth/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: credential.identityToken,
                    authProvider: 'apple',
                }),
            });
            const data = await response.json();
            console.log("apple auth:", response.json)
            console.log("data.token:", data.token)
            dispatch(setAuth({ token: data.token, user: data.user }));
            await AsyncStorage.setItem('userToken', data.token);

            goToHome()
        } catch (e) {
            console.log(e);
        }
    };

    const handleGoogleLogin = async (user) => {
        try {
            console.log("google user starting upload:", user)
            const response = await axios.post(`${Api}/auth/google-auth`, { googleUser: user });
            const data = response.data; // Use the response from the Axios call
            dispatch(setAuth({ token: data.token, user: data.user }));
            await AsyncStorage.setItem('userToken', data.token);
            goToHome();
        } catch (e) {
            console.log(e);
        }
    };

    const handleForgotPassword = async () => {
        if (!resetEmail) {
            Alert.alert('Error', 'Please enter your email address');
            return false;
        }

        try {
            const response = await fetch(`${Api}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: resetEmail }),
            });
            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Verification code sent to your email');
                return true;
            } else {
                Alert.alert('Error', data.message);
                return false;
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send verification code');
            return false;
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) {
            Alert.alert('Error', 'Please enter verification code');
            return false;
        }

        try {
            const response = await fetch(`${Api}/auth/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: resetEmail,
                    code: verificationCode
                }),
            });
            const data = await response.json();

            if (response.ok) {
                return true;
            } else {
                Alert.alert('Error', data.message);
                return false;
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to verify code');
            return false;
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) {
            Alert.alert('Error', 'Please enter new password');
            return false;
        }

        try {
            const response = await fetch(`${Api}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: resetEmail,
                    code: verificationCode,
                    newPassword
                }),
            });
            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Password reset successful');
                return true;
            } else {
                Alert.alert('Error', data.message);
                return false;
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to reset password');
            return false;
        }
    };
    const inputAccessoryViewID = 'inputAccessoryViewID';
    return (
        <LinearGradient
            colors={['#4A90E2', '#5AB1FF']}
            style={styles.container}
        >
            {Platform.OS === "ios" && <InputAccessoryView nativeID={inputAccessoryViewID}>
                <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.accessoryButton}>
                    <Text allowFontScaling={false} style={styles.accessoryButtonText}>Close</Text>
                </TouchableOpacity>
            </InputAccessoryView>}
            <StatusBar /* backgroundColor='#4A90E2' */ backgroundColor={"#4A90E2"} barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>

                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <View style={styles.logoContainer}>
                            <LottieView
                                source={require('../../../assets/animation/therapy-animation.json')} // You'll need to add this animation
                                autoPlay
                                loop
                                style={styles.animation}
                            />
                            <Text allowFontScaling={false} style={styles.title}>Tip Top</Text>
                            <Text allowFontScaling={false} style={styles.subtitle}>Sign in to continue</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="email" size={24} color="#4A90E2" />
                                <TextInput
                                    allowFontScaling={false}
                                    style={styles.input}
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#A0A0A0"
                                    inputAccessoryViewID={inputAccessoryViewID}
                                    // autoCompleteType="off"
                                    autoCorrect={Platform.OS === "ios" && "false"}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <MaterialIcons name="lock" size={24} color="#4A90E2" />
                                <TextInput
                                    allowFontScaling={false}
                                    style={styles.input}
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#A0A0A0"
                                    inputAccessoryViewID={inputAccessoryViewID}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <MaterialIcons
                                        name={showPassword ? "visibility" : "visibility-off"}
                                        size={24}
                                        color="#A0A0A0"
                                    />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.forgotPasswordButton}
                                onPress={() => setShowVerificationModal(true)}
                            >
                                <Text allowFontScaling={false} style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleEmailPasswordLogin}
                            >
                                {isLoading ? (
                                    <LottieView
                                        source={require('../../../assets/animation/loading.json')} // Add loading animation
                                        autoPlay
                                        loop
                                        style={styles.loadingAnimation}
                                    />
                                ) : (
                                    <Text allowFontScaling={false} style={styles.loginButtonText}>Sign In</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text allowFontScaling={false} style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity onPress={() => {
                                signInWithGoogle()

                            }} disabled={Platform.OS === "ios" ? true : false} >
                                <View style={{
                                    width: "100%", height: Platform.OS === "android" ? 60 : "auto", alignItems: 'center',
                                    justifyContent: 'center',
                                }}>

                                    <GoogleSigninButton
                                        size={GoogleSigninButton.Size.Wide}
                                        color={GoogleSigninButton.Color.Light}
                                        // disabled={false}
                                        onPress={() => {
                                            signInWithGoogle()

                                        }}
                                        style={{ width: "100%", height: 60, padding: 20 }}
                                    />
                                </View>
                            </TouchableOpacity>

                            <View style={{ height: 20 }}></View>
                            {Platform.OS === "ios" && <AppleAuthentication.AppleAuthenticationButton
                                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK} // Options: BLACK or WHITE
                                cornerRadius={10} // Optional, ensures rounded corners
                                style={styles.appleButton}
                                onPress={handleAppleLogin}
                            />}
                            {/*  <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleAppleLogin}
                            >
                                <Image source={require('../../../assets/apple-logo.png')} style={styles.logo} />

                            </TouchableOpacity> */}


                            {/*  <AppleAuthentication.AppleAuthenticationButton
                            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                            cornerRadius={10}
                            style={styles.appleButton}
                            onPress={handleAppleLogin}
                         /> */}

                            <View style={styles.signupContainer}>
                                <Text allowFontScaling={false} style={styles.signupText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={goToSignUp}>
                                    <Text allowFontScaling={false} style={styles.signupButton}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </TouchableWithoutFeedback>

                {showVerificationModal && (
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text allowFontScaling={false} style={styles.modalTitle}>
                                {resetStep === 1 && "Reset Password"}
                                {resetStep === 2 && "Enter Verification Code"}
                                {resetStep === 3 && "Set New Password"}
                            </Text>

                            {resetStep === 1 && (
                                <>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Email"
                                        value={resetEmail}
                                        onChangeText={setResetEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={styles.modalButton}
                                        onPress={async () => {
                                            const success = await handleForgotPassword();
                                            if (success) {
                                                setResetStep(2);
                                                setCountdown(50);
                                            }
                                        }}
                                    >
                                        <Text allowFontScaling={false} style={styles.modalButtonText}>Send Code</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {resetStep === 2 && (
                                <>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Enter 6-digit code"
                                        value={verificationCode}
                                        onChangeText={setVerificationCode}
                                        keyboardType="numeric"
                                        maxLength={6}
                                    />
                                    <TouchableOpacity
                                        style={styles.modalButton}
                                        onPress={async () => {
                                            const success = await handleVerifyCode();
                                            if (success) {
                                                setResetStep(3);
                                            }
                                        }}
                                    >
                                        <Text allowFontScaling={false} style={styles.modalButtonText}>Verify Code</Text>
                                    </TouchableOpacity>
                                    {countdown > 0 ? (
                                        <Text allowFontScaling={false} style={styles.countdownText}>
                                            Resend code in {countdown}s
                                        </Text>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={async () => {
                                                const success = await handleForgotPassword();
                                                if (success) setCountdown(50);
                                            }}
                                        >
                                            <Text allowFontScaling={false} style={styles.resendText}>Resend Code</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}

                            {resetStep === 3 && (
                                <>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[styles.modalInput, { flex: 1 }]}
                                            placeholder="New Password"
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry={!showNewPassword}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowNewPassword(!showNewPassword)}
                                            style={styles.eyeIcon}
                                        >
                                            <MaterialIcons
                                                name={showNewPassword ? "visibility" : "visibility-off"}
                                                size={24}
                                                color="#A0A0A0"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.modalButton}
                                        onPress={async () => {
                                            const success = await handleResetPassword();
                                            if (success) {
                                                setShowVerificationModal(false);
                                                setResetStep(1);
                                            }
                                        }}
                                    >
                                        <Text allowFontScaling={false} style={styles.modalButtonText}>Reset Password</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => {
                                    setShowVerificationModal(false);
                                    setResetStep(1);
                                    setVerificationCode('');
                                    setNewPassword('');
                                    setShowNewPassword(false);
                                }}
                            >
                                <Text allowFontScaling={false} style={styles.modalCloseText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    animation: {
        width: 200,
        height: 200,
    },
    loadingAnimation: {
        width: 50,
        height: 50,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#FFF',
        opacity: 0.8,
    },
    formContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6F8',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    input: {
        flex: 1,
        height: 50,
        marginLeft: 10,
        color: '#333',
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 25,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E1E1E1',
    },
    dividerText: {
        color: '#666',
        paddingHorizontal: 10,
    },
    appleButton: {
        width: '100%',
        height: 50,
        marginBottom: 20,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    signupText: {
        color: '#666',
    },
    signupButton: {
        color: '#4A90E2',
        fontWeight: '600',
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginTop: 5,
        marginBottom: 15,
    },
    forgotPasswordText: {
        color: '#4A90E2',
        fontSize: 14,
    },
    modalContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: '#F5F6F8',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    modalButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 25,
        padding: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalCloseButton: {
        padding: 10,
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#666',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 10,
    },
    countdownText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 10,
    },
    resendText: {
        textAlign: 'center',
        color: '#4A90E2',
        marginTop: 10,
        textDecorationLine: 'underline',
    },
    socialButton: {
        backgroundColor: '#4A90E2', // Same background color for both buttons
        borderRadius: 5,
        // height: 50,
        // width: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        height: 50,
        width: 50,
        borderRadius: 5
    },
    appleButton: {
        height: 50,       // Minimum height required by Apple is 44
        width: "100%",       // Adjust width as per your design
        borderRadius: 10, // Rounded corners for aesthetic compliance
        marginBottom: 20, // Optional, for spacing
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
});