import React, { useEffect, useState, useRef } from "react";
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
// import * as Google from 'expo-google-app-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api } from "../../Api";
import TabNavigator from "../../navigation/TabNavigator";
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/userSlice';
import { setAuth } from "../../redux/slices/authSlice";

export default function SignIn({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();

    const goToSignUp = () => {
        navigation.navigate('SignUp');
    };
    const goToHome = () => {
        navigation.navigate('Main');
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
            console.log("ani bifinim")
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

    const handleGoogleLogin = async () => {
        try {
            const { type, accessToken, user } = await Google.logInAsync({
                // Get your Google client ID from the Google Developer Console
                clientId: 'YOUR_GOOGLE_CLIENT_ID',
            });

            if (type === 'success') {
                // Send accessToken to your backend
                const response = await fetch(`${Api}/auth`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: accessToken,
                        authProvider: 'google',
                    }),
                });
                const data = await response.json();
                await AsyncStorage.setItem('userToken', data.token);
                goToHome()
            }
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="Login" onPress={handleEmailPasswordLogin} />
            <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={5}
                style={styles.button}
                onPress={handleAppleLogin} />
            <Button
                onPress={goToSignUp}
                title="SignUp"
                color="#841584"
                accessibilityLabel="Learn more about this purple button"
            />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        width: 200,
        height: 44,
    },
    input: {
        height: 40,
        width: 200,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
});