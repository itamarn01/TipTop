import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Button, Image, StyleSheet, Text, ActivityIndicator, Dimensions, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { clearUser } from '../redux/slices/userSlice';
import { clearAuth } from '../redux/slices/authSlice';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Api } from '../Api';
import { useSelector } from 'react-redux';


const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const GuideLineBaseWidth = 414;
const GuideLineBaseHeight = 896;
const horizontalScale = (size) => (windowWidth / GuideLineBaseWidth) * size;
const verticalScale = (size) => (windowHeight / GuideLineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
    size + (horizontalScale(size) - size) * factor;


export default function Profile({ navigation }) {

    const [uploading, setUploading] = useState(false); // To show a loading indicator
    const [message, setMessage] = useState(''); // To display success/error messages
    const user = useSelector((state) => state.auth.user);
    const [image, setImage] = useState(user.profileImage); // For displaying selected image
    const dispatch = useDispatch();

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

        // Prepare the image for upload
        const formData = new FormData();
        formData.append('profileImage', {
            uri,
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
        } catch (error) {
            console.error(error);
            setMessage('Failed to upload image');
        } finally {
            setUploading(false);
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
            flex: 1, justifyContent: "center", alignItems: "center"
        }}>
            <Text>Profile Screen</Text>

            <Button title="Pick an Image" onPress={pickImage} />
            {uploading && <ActivityIndicator size="large" color="#0000ff" />}
            {image && <Image source={{ uri: image }} style={styles.image} />}
            {message && <Text style={styles.message}>{message}</Text>}
            <Button
                onPress={logOutPressed}
                title="Logout"
                color="#841584"
                accessibilityLabel="Learn more about this purple button"
            />
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
});