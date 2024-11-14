import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { clearUser } from '../redux/slices/userSlice';
import { clearAuth } from '../redux/slices/authSlice';
export default function Profile({ navigation }) {

    const dispatch = useDispatch();

    const logOutPressed = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            //  dispatch(clearAuth());
        }
        catch (e) { Alert.alert("Error to log out try again") } finally { navigation.navigate("Auth", { screen: "SignIn" }) }
    }
    return (
        <View style={{
            flex: 1, justifyContent: "center", alignItems: "center"
        }}>
            <Text>Profile Screen</Text>
            <Button
                onPress={logOutPressed}
                title="Logout"
                color="#841584"
                accessibilityLabel="Learn more about this purple button"
            />
        </View>
    );
}