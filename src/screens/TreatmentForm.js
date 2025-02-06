import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const paymentStatusOptions = ['Pending', 'Paid', 'Cancelled'];
const paymentMethodOptions = ['Cash', 'Credit Card', 'Bank Transfer', 'Insurance'];

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
            Alert.alert("Validation Error", "Please fill in all required fields.");
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
                Alert.alert("Success", "Treatment updated successfully");
            } else {
                await axios.post('http://your-server-url/treatments', payload);
                Alert.alert("Success", "Treatment added successfully");
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "There was an issue saving the treatment.");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <MaterialIcons name="medical-services" size={40} color="#4A90E2" />
                <Text allowFontScaling={false} style={styles.headerText}>
                    {isEditing ? "Update Treatment" : "New Treatment"}
                </Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>Client ID</Text>
                    <TextInput
                        value={clientId}
                        onChangeText={setClientId}
                        placeholder="Enter Client ID"
                        style={styles.input}
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text allowFontScaling={false} style={styles.label}>Price</Text>
                        <TextInput
                            value={treatmentPrice}
                            onChangeText={setTreatmentPrice}
                            keyboardType="numeric"
                            placeholder="$0.00"
                            style={styles.input}
                            placeholderTextColor="#A0A0A0"
                        />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text allowFontScaling={false} style={styles.label}>Session #</Text>
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
                    <Text allowFontScaling={false} style={styles.label}>Treatment Date</Text>
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
                    <Text allowFontScaling={false} style={styles.label}>Treatment Summary</Text>
                    <TextInput
                        value={treatmentSummary}
                        onChangeText={setTreatmentSummary}
                        placeholder="Describe the treatment..."
                        style={styles.textArea}
                        multiline
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>Homework</Text>
                    <TextInput
                        value={homework}
                        onChangeText={setHomework}
                        placeholder="Assign homework..."
                        style={styles.textArea}
                        multiline
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>Next Steps</Text>
                    <TextInput
                        value={whatNext}
                        onChangeText={setWhatNext}
                        placeholder="Plan next steps..."
                        style={styles.textArea}
                        multiline
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>Payment Status</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={paymentStatus}
                            onValueChange={setPaymentStatus}
                            style={styles.picker}
                        >
                            {paymentStatusOptions.map((status) => (
                                <Picker.Item key={status} label={status} value={status} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text allowFontScaling={false} style={styles.label}>Payment Method</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={paymentMethod}
                            onValueChange={setPaymentMethod}
                            style={styles.picker}
                        >
                            {paymentMethodOptions.map((method) => (
                                <Picker.Item key={method} label={method} value={method} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                >
                    <Text allowFontScaling={false} style={styles.submitButtonText}>
                        {isEditing ? "Update Treatment" : "Add Treatment"}
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
});

export default TreatmentForm;