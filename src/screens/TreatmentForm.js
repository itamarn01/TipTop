import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import i18n from "../i18n";

const paymentStatusOptions = [
    { value: 'Pending', label: 'pending' },
    { value: 'Paid', label: 'paid' },
    { value: 'Cancelled', label: 'cancelled' }
];
const paymentMethodOptions = [
    { value: 'Cash', label: 'cash' },
    { value: 'Credit Card', label: 'creditCard' },
    { value: 'Bank Transfer', label: 'bankTransfer' },
    { value: 'Insurance', label: 'insurance' }
];

const TreatmentForm = ({ route, navigation }) => {
    const { treatment, isEditing } = route.params || {};
    const [clientId, setClientId] = useState(treatment?.clientId || '');
    const [treatmentPrice, setTreatmentPrice] = useState(treatment?.treatmentPrice || '');
    const [sessionNumber, setSessionNumber] = useState(treatment?.sessionNumber || '');
    const [treatmentDate, setTreatmentDate] = useState(treatment?.treatmentDate ? new Date(treatment.treatmentDate) : new Date());
    const [treatmentSummary, setTreatmentSummary] = useState(treatment?.treatmentSummary || '');
    const [homework, setHomework] = useState(treatment?.homework || '');
    const [whatNext, setWhatNext] = useState(treatment?.whatNext || '');
    const [paymentStatus, setPaymentStatus] = useState(treatment?.paymentStatus || '');
    const [paymentMethod, setPaymentMethod] = useState(treatment?.paymentMethod || '');
    const [payDate, setPayDate] = useState(treatment?.payDate ? new Date(treatment.payDate) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const validateInputs = () => {
        if (!clientId || !treatmentPrice || !sessionNumber || !treatmentSummary || !paymentStatus || !paymentMethod) {
            Alert.alert(i18n.t('validationError'), i18n.t('fillRequired'));
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateInputs()) return;

        const payload = {
            clientId,
            treatmentPrice: Number(treatmentPrice),
            sessionNumber: Number(sessionNumber),
            treatmentDate,
            treatmentSummary,
            homework,
            whatNext,
            paymentStatus,
            paymentMethod,
            payDate
        };

        try {
            if (isEditing) {
                await axios.put(`http://your-server-url/treatments/${treatment._id}`, payload);
                Alert.alert(i18n.t('success'), i18n.t('treatmentUpdated'));
            } else {
                await axios.post('http://your-server-url/treatments', payload);
                Alert.alert(i18n.t('success'), i18n.t('treatmentAdded'));
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert(i18n.t('error'), i18n.t('issueSaving'));
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <MaterialIcons name="medical-services" size={40} color="#4A90E2" />
                <Text allowFontScaling={false} style={styles.headerText}>
                    {isEditing ? i18n.t('updateTreatment') : i18n.t('newTreatment')}
                </Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>{i18n.t('clientId')}</Text>
                    <TextInput
                        value={clientId}
                        onChangeText={setClientId}
                        placeholder={i18n.t('enterClientId')}
                        style={styles.input}
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginEnd: 10 }]}>
                        <Text allowFontScaling={false} style={styles.label}>{i18n.t('price')}</Text>
                        <TextInput
                            value={treatmentPrice}
                            onChangeText={setTreatmentPrice}
                            keyboardType="numeric"
                            placeholder={`${i18n.t('currencySymbol')}0.00`}
                            style={styles.input}
                            placeholderTextColor="#A0A0A0"
                        />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text allowFontScaling={false} style={styles.label}>{i18n.t('sessionNumber')}</Text>
                        <TextInput
                            value={sessionNumber}
                            onChangeText={setSessionNumber}
                            keyboardType="numeric"
                            placeholder="0"
                            style={styles.input}
                            placeholderTextColor="#A0A0A0"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>{i18n.t('treatmentDate')}</Text>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={styles.dateButton}
                    >
                        <MaterialIcons name="event" size={24} color="#4A90E2" />
                        <Text allowFontScaling={false} style={styles.dateText}>{treatmentDate.toDateString()}</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={treatmentDate}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setTreatmentDate(selectedDate);
                        }}
                    />
                )}

                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>{i18n.t('treatmentSummary')}</Text>
                    <TextInput
                        value={treatmentSummary}
                        onChangeText={setTreatmentSummary}
                        placeholder={i18n.t('describeTreatment')}
                        style={styles.textArea}
                        multiline
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>{i18n.t('homework')}</Text>
                    <TextInput
                        value={homework}
                        onChangeText={setHomework}
                        placeholder={i18n.t('assignHomework')}
                        style={styles.textArea}
                        multiline
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>{i18n.t('whatNext')}</Text>
                    <TextInput
                        value={whatNext}
                        onChangeText={setWhatNext}
                        placeholder={i18n.t('planNextSteps')}
                        style={styles.textArea}
                        multiline
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>{i18n.t('paymentStatus')}</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={paymentStatus}
                            onValueChange={setPaymentStatus}
                            style={styles.picker}
                        >
                            {paymentStatusOptions.map((option) => (
                                <Picker.Item key={option.value} label={i18n.t(option.label)} value={option.value} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>{i18n.t('paymentMethod')}</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={paymentMethod}
                            onValueChange={setPaymentMethod}
                            style={styles.picker}
                        >
                            {paymentMethodOptions.map((option) => (
                                <Picker.Item key={option.value} label={i18n.t(option.label)} value={option.value} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                >
                    <Text allowFontScaling={false} style={styles.submitButtonText}>
                        {isEditing ? i18n.t('updateTreatment') : i18n.t('addTreatment')}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6F8',
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
    inputGroup: {
        marginBottom: 20,
    },
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
        marginStart: 10,
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
});

export default TreatmentForm;