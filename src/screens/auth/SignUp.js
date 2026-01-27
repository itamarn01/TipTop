import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ScrollView,
    Modal,
    Keyboard,
    TouchableWithoutFeedback
} from 'react-native';


import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setAuth } from '../../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api } from '../../Api';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import i18n from '../../i18n';
const { width, height } = Dimensions.get('window');

const SignUp = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const dispatch = useDispatch();


    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

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

    const validateForm = () => {
        let errors = {};
        if (!name) errors.name = i18n.t('nameRequired');
        if (!email) errors.email = i18n.t('emailRequired');
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = i18n.t('invalidEmail');
        if (!password) errors.password = i18n.t('passwordRequired');
        else if (password.length < 6) errors.password = i18n.t('passwordLength');
        return errors;
    };

    const handleSignUp = async () => {
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(`${Api}/auth/send-registration-code`, { email });
            setShowVerificationModal(true);
        } catch (error) {
            if (error.response) {
                setErrors({ form: error.response.data.message });
            } else {
                setErrors({ form: i18n.t('failedToSendCode') });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndSignUp = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setErrors({ verification: i18n.t('enterCodeValidation') });
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${Api}/auth/register`, {
                name,
                email,
                password,
                code: verificationCode
            });
            setShowVerificationModal(false);
            dispatch(setAuth({ token: response.data.token, user: response.data.user }));
            await AsyncStorage.setItem('userToken', response.data.token);
            navigation.navigate('Main');
        } catch (error) {
            if (error.response) {
                setErrors({ verification: error.response.data.message });
            } else {
                setErrors({ verification: i18n.t('failedToVerify') });
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <LinearGradient
            colors={['#4A90E2', '#5AB1FF']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
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
                                source={require('../../../assets/animation/signup-animation.json')}
                                autoPlay
                                loop
                                style={styles.animation}
                            />
                            <Text allowFontScaling={false} style={styles.title}>{i18n.t('createAccountTitle')}</Text>
                            <Text allowFontScaling={false} style={styles.subtitle}>{i18n.t('joinUs')}</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="person" size={24} color="#4A90E2" />
                                <TextInput
                                    allowFontScaling={false}
                                    style={styles.input}
                                    placeholder={i18n.t('fullNamePlaceholder')}
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor="#A0A0A0"
                                />
                            </View>
                            {errors.name && <Text allowFontScaling={false} style={styles.errorText}>{errors.name}</Text>}

                            <View style={styles.inputContainer}>
                                <MaterialIcons name="email" size={24} color="#4A90E2" />
                                <TextInput
                                    allowFontScaling={false}
                                    style={styles.input}
                                    placeholder={i18n.t('emailPlaceholder')}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#A0A0A0"
                                />
                            </View>
                            {errors.email && <Text allowFontScaling={false} style={styles.errorText}>{errors.email}</Text>}

                            <View style={styles.inputContainer}>
                                <MaterialIcons name="lock" size={24} color="#4A90E2" />
                                <TextInput
                                    style={styles.input}
                                    placeholder={i18n.t('passwordPlaceholder')}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#A0A0A0"
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
                            {errors.password && <Text allowFontScaling={false} style={styles.errorText}>{errors.password}</Text>}

                            {errors.form && <Text allowFontScaling={false} style={styles.errorText}>{errors.form}</Text>}

                            <TouchableOpacity
                                style={styles.signupButton}
                                onPress={handleSignUp}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <LottieView
                                        source={require('../../../assets/animation/loading.json')}
                                        autoPlay
                                        loop
                                        style={styles.loadingAnimation}
                                    />
                                ) : (
                                    <Text allowFontScaling={false} style={styles.signupButtonText}>{i18n.t('createAccountTitle')}</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.signinContainer}>
                                <Text allowFontScaling={false} style={styles.signinText}>{i18n.t('alreadyHaveAccount')}</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                                    <Text allowFontScaling={false} style={styles.signinButton}>{i18n.t('signInButton')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>

                <Modal
                    visible={showVerificationModal}
                    transparent={true}
                    animationType="fade"
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                style={{ width: '100%', alignItems: 'center' }}
                            >
                                <View style={styles.modalContent}>
                                    <TouchableOpacity 
                                        style={styles.closeModal} 
                                        onPress={() => setShowVerificationModal(false)}
                                    >
                                        <MaterialIcons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                    
                                    <LottieView
                                        source={require('../../../assets/animation/signup-animation.json')}
                                        autoPlay
                                        loop
                                        style={styles.modalAnimation}
                                    />
                                    
                                    <Text style={styles.modalTitle}>{i18n.t('enterVerificationCode')}</Text>
                                    <Text style={styles.modalSubtitle}>{i18n.t('verificationSent')}</Text>
                                    
                                    <View style={[styles.inputContainer, { marginTop: 20 }]}>
                                        <MaterialIcons name="vpn-key" size={24} color="#4A90E2" />
                                        <TextInput
                                            style={styles.input}
                                            placeholder={i18n.t('enterCodePlaceholder')}
                                            value={verificationCode}
                                            onChangeText={setVerificationCode}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            placeholderTextColor="#A0A0A0"
                                        />
                                    </View>
                                    {errors.verification && <Text style={styles.errorText}>{errors.verification}</Text>}
                                    
                                    <TouchableOpacity
                                        style={styles.signupButton}
                                        onPress={handleVerifyAndSignUp}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <LottieView
                                                source={require('../../../assets/animation/loading.json')}
                                                autoPlay
                                                loop
                                                style={styles.loadingAnimation}
                                            />
                                        ) : (
                                            <Text style={styles.signupButtonText}>{i18n.t('verifyCode')}</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </KeyboardAvoidingView>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

            </KeyboardAvoidingView>

        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
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
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 10,
    },
    signupButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 25,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 20,
    },
    signupButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    signinContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    signinText: {
        color: '#666',
    },
    signinButton: {
        color: '#4A90E2',
        fontWeight: '600',
    },
    eyeIcon: {
        padding: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 25,
        width: '100%',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalAnimation: {
        width: 150,
        height: 150,
    },
    closeModal: {
        position: 'absolute',
        right: 15,
        top: 15,
        zIndex: 1,
    }
});


export default SignUp;