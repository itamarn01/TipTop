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
    ScrollView
} from 'react-native';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setAuth } from '../../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api } from '../../Api';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SignUp = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
        if (!name) errors.name = "Name is required";
        if (!email) errors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Email is invalid";
        if (!password) errors.password = "Password is required";
        else if (password.length < 6) errors.password = "Password must be at least 6 characters";
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
            const response = await axios.post(`${Api}/auth/register`, {
                name,
                email,
                password
            });
            dispatch(setAuth({ token: response.data.token, user: response.data.user }));
            await AsyncStorage.setItem('userToken', response.data.token);
            navigation.navigate('Main');
        } catch (error) {
            if (error.response) {
                setErrors({ form: error.response.data.message });
            } else {
                setErrors({ form: 'An error occurred. Please try again.' });
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
                            <Text allowFontScaling={false} style={styles.title}>Create Account</Text>
                            <Text allowFontScaling={false} style={styles.subtitle}>Join us today!</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="person" size={24} color="#4A90E2" />
                                <TextInput
                                    allowFontScaling={false}
                                    style={styles.input}
                                    placeholder="Full Name"
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
                                    placeholder="Email"
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
                                    placeholder="Password"
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
                                    <Text allowFontScaling={false} style={styles.signupButtonText}>Create Account</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.signinContainer}>
                                <Text allowFontScaling={false} style={styles.signinText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                                    <Text allowFontScaling={false} style={styles.signinButton}>Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>
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
});

export default SignUp;