import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Linking,
    Alert,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    Platform
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { Api } from '../Api';

export default function ParentsSection({ clientDetails, refreshClient }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingParent, setEditingParent] = useState(null);
    const [parentData, setParentData] = useState({
        parentName: '',
        gender: 'male',
        phone: '',
        email: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const parentNameInputRef = useRef(null);

    const handleAddParent = async () => {
        setIsSaving(true);
        try {
            console.log("parentData:", parentData, "clientDetails id:", clientDetails._id)
            await axios.post(`${Api}/clients/${clientDetails._id}/parents`, parentData);
            setModalVisible(false);
            refreshClient();
            resetForm();
        } catch (error) {
            Alert.alert('Error', 'Failed to add parent');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditParent = async (parentId) => {
        setIsSaving(true);
        try {
            await axios.put(
                `${Api}/clients/${clientDetails._id}/parents/${parentId}`,
                parentData
            );
            setModalVisible(false);
            refreshClient();
            resetForm();
        } catch (error) {
            Alert.alert('Error', 'Failed to update parent');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteParent = async (parentId) => {
        Alert.alert(
            'Delete Parent',
            'Are you sure you want to delete this parent?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(
                                `${Api}/clients/${clientDetails._id}/parents/${parentId}`
                            );
                            refreshClient();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete parent');
                        }
                    },
                },
            ]
        );
    };

    const handleContact = (type, value) => {
        if (type === 'phone') {
            Linking.openURL(`tel:${value}`);
        } else if (type === 'email') {
            Linking.openURL(`mailto:${value}`);
        }
    };

    const resetForm = () => {
        setParentData({
            parentName: '',
            gender: 'male',
            phone: '',
            email: '',
        });
        setEditingParent(null);
    };

    return (
        <Animatable.View animation="fadeIn" duration={1000} style={styles.container}>
            <View style={styles.header}>
                <Text allowFontScaling={false} style={styles.title}>Parents</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        resetForm();
                        setModalVisible(true);
                    }}
                >
                    <MaterialIcons name="add" size={24} color="#014495" />
                </TouchableOpacity>
            </View>

            {clientDetails.parents?.map((parent, index) => (
                <Animatable.View
                    key={parent._id}
                    animation="fadeInUp"
                    delay={index * 100}
                    style={styles.parentCard}
                >
                    <View style={styles.parentHeader}>
                        <MaterialIcons
                            name={parent.gender === 'male' ? 'face' : 'face-3'}
                            size={24}
                            color="#014495"
                        />
                        <Text allowFontScaling={false} style={styles.parentName}>{parent.parentName}</Text>
                    </View>

                    <View style={styles.contactButtons}>
                        {parent.phone && (
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() => handleContact('phone', parent.phone)}
                            >
                                <MaterialIcons name="phone" size={20} color="#014495" />
                                <Text allowFontScaling={false} style={styles.contactText}>{parent.phone}</Text>
                            </TouchableOpacity>
                        )}
                        {parent.email && (
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() => handleContact('email', parent.email)}
                            >
                                <MaterialIcons name="email" size={20} color="#014495" />
                                <Text allowFontScaling={false} style={styles.contactText}>{parent.email}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => {
                                setEditingParent(parent);
                                setParentData(parent);
                                setModalVisible(true);
                            }}
                        >
                            <MaterialIcons name="edit" size={20} color="#014495" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteParent(parent._id)}
                        >
                            <MaterialIcons name="delete" size={20} color="#FF5252" />
                        </TouchableOpacity>
                    </View>
                </Animatable.View>
            ))}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
                onShow={() => {
                    setTimeout(() => {
                        parentNameInputRef.current?.focus();
                    }, 100);
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <Animatable.View
                                animation="slideInUp"
                                duration={300}
                                style={styles.modalContent}
                            >
                                <Text allowFontScaling={false} style={styles.modalTitle}>
                                    {editingParent ? 'Edit Parent' : 'Add Parent'}
                                </Text>

                                <TextInput
                                    ref={parentNameInputRef}
                                    style={styles.input}
                                    placeholder="Parent Name"
                                    value={parentData.parentName}
                                    onChangeText={(text) => setParentData({ ...parentData, parentName: text })}
                                    returnKeyType="next"
                                />

                                <View style={styles.genderButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.genderButton,
                                            parentData.gender === 'male' && styles.selectedGender
                                        ]}
                                        onPress={() => setParentData({ ...parentData, gender: 'male' })}
                                    >
                                        <MaterialIcons
                                            name="face"
                                            size={24}
                                            color={parentData.gender === 'male' ? '#fff' : '#014495'}
                                        />
                                        <Text allowFontScaling={false} style={[
                                            styles.genderText,
                                            parentData.gender === 'male' && styles.selectedGenderText
                                        ]}>
                                            Male
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.genderButton,
                                            parentData.gender === 'female' && styles.selectedGender
                                        ]}
                                        onPress={() => setParentData({ ...parentData, gender: 'female' })}
                                    >
                                        <MaterialIcons
                                            name="face-3"
                                            size={24}
                                            color={parentData.gender === 'female' ? '#fff' : '#014495'}
                                        />
                                        <Text allowFontScaling={false} style={[
                                            styles.genderText,
                                            parentData.gender === 'female' && styles.selectedGenderText
                                        ]}>
                                            Female
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number"
                                    value={parentData.phone}
                                    onChangeText={(text) => setParentData({ ...parentData, phone: text })}
                                    keyboardType="phone-pad"
                                    returnKeyType="next"
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    value={parentData.email}
                                    onChangeText={(text) => setParentData({ ...parentData, email: text })}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                />

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => {
                                            setModalVisible(false);
                                            resetForm();
                                        }}
                                    >
                                        <Text allowFontScaling={false} style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.saveButton, isSaving && styles.savingButton]}
                                        onPress={async () => {
                                            setIsSaving(true);
                                            try {
                                                if (editingParent) {
                                                    await handleEditParent(editingParent._id);
                                                } else {
                                                    await handleAddParent();
                                                }
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Text allowFontScaling={false} style={styles.buttonText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </Animatable.View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </Animatable.View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        margin: 20,

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#014495',
    },
    addButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
    },
    parentCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    parentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    parentName: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
        color: '#014495',
    },
    contactButtons: {
        marginVertical: 8,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 6,
        marginBottom: 4,
    },
    contactText: {
        marginLeft: 8,
        color: '#014495',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    editButton: {
        padding: 8,
        marginRight: 8,
    },
    deleteButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        maxHeight: '80%',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#014495',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    genderButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    genderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#014495',
        width: '45%',
        justifyContent: 'center',
    },
    selectedGender: {
        backgroundColor: '#014495',
    },
    genderText: {
        marginLeft: 8,
        color: '#014495',
    },
    selectedGenderText: {
        color: 'white',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
    },
    cancelButton: {
        backgroundColor: '#FF5252',
        padding: 12,
        borderRadius: 8,
        width: '45%',
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#014495',
        padding: 12,
        borderRadius: 8,
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 45,
    },
    savingButton: {
        opacity: 0.8,
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
    },
});