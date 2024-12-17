import {
    View,
    ImageBackground,
    Image,
    StyleSheet,
    RefreshControl,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    Dimensions,
    ActivityIndicator,
    // Animated,
    I18nManager,
    Alert,
    Modal,
    FlatList,
    Button,
    TouchableWithoutFeedback,
    Keyboard,
    Linking,
    KeyboardAvoidingView,
} from "react-native";
import {
    BannerAd,
    BannerAdSize,
    TestIds,
    InterstitialAd,
    AdEventType,
    RewardedAd,
    RewardedAdEventType,
    RewardedInterstitialAd,
    mobileAds,
    AppOpenAd,
    AdsConsent,
    AdsConsentStatus,
    useForeground,
} from "react-native-google-mobile-ads";
import ParentsSection from "../components/ParentsSection";
//  import { Image } from 'expo-image';
// import FastImage from 'react-native-fast-image'
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from 'react-redux';
import { Api } from "../Api";
import axios from "axios";
import { useDispatch } from 'react-redux';
import { setSelectedClient } from '../redux/slices/selectedClientSlice'; // Adjust the path as needed
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import Fontisto from '@expo/vector-icons/Fontisto';
import Feather from '@expo/vector-icons/Feather';
import PagerView from 'react-native-pager-view';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Animatable from 'react-native-animatable';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Picker } from '@react-native-picker/picker';

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const GuideLineBaseWidth = 414;
const GuideLineBaseHeight = 896;
const horizontalScale = (size) => (windowWidth / GuideLineBaseWidth) * size;
const verticalScale = (size) => (windowHeight / GuideLineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
    size + (horizontalScale(size) - size) * factor;

const iosAdmobBanner1 = "ca-app-pub-8754599705550429/3783221625";
const androidAdmobBanner1 = "ca-app-pub-8754599705550429/3389503797";
const productionID1 =
    Platform.OS === "android" ? androidAdmobBanner1 : iosAdmobBanner1;

const adUnitId1 = __DEV__ ? TestIds.ADAPTIVE_BANNER : productionID1;

// Add this helper function at the top level, outside of any component
const formatTime = (date) => {
    const treatmentDate = new Date(date);
    return treatmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function calculateAge(birthday) {
    const birthDate = new Date(birthday);
    const today = new Date();

    let ageYears = today.getFullYear() - birthDate.getFullYear();
    let ageMonths = today.getMonth() - birthDate.getMonth();

    // If the current month is before the birth month, or it's the birth month but the current day is before the birth day
    if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
        ageYears--;
        ageMonths += 12;
    }

    if (today.getDate() < birthDate.getDate()) {
        ageMonths--;
    }

    return `${ageYears}:${ageMonths < 10 ? '0' : ''}${ageMonths}`;
}
// First, define DeleteConfirmationModal as a separate component
const DeleteConfirmationModal = ({
    visible,
    onClose,
    onDelete,
}) => (
    <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
    >
        <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                    <Animatable.View
                        animation="zoomIn"
                        duration={300}
                        style={styles.deleteModalContainer}
                    >
                        <View style={styles.deleteModalContent}>
                            <View style={styles.deleteIconContainer}>
                                <MaterialIcons name="delete-outline" size={40} color="#FF4444" />
                            </View>
                            <Text style={styles.deleteModalTitle}>Delete Treatment</Text>
                            <Text style={styles.deleteModalText}>
                                Are you sure you want to delete this treatment? This action cannot be undone.
                            </Text>
                        </View>
                        <View style={styles.deleteModalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmDeleteButton}
                                onPress={onDelete}
                            >
                                <Text style={styles.confirmDeleteText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </Animatable.View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    </Modal>
);

// First, create a separate modal for client details editing
const ClientEditModal = ({ visible, onClose, onSave, editingStat, editValue, setEditValue }) => {
    const getFieldDisplayName = (stat) => {
        if (!stat) return '';
        return stat.toString().replace(/([A-Z])/g, ' $1').trim();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.editModalContainer}>
                            <View style={styles.editModalHeader}>
                                <MaterialIcons name="edit" size={24} color="#014495" />
                                <Text style={styles.editModalTitle}>
                                    Edit {getFieldDisplayName(editingStat)}
                                </Text>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={styles.editModalCloseButton}
                                >
                                    <MaterialIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.editModalContent}>
                                <TextInput
                                    style={styles.editModalInput}
                                    value={editValue}
                                    onChangeText={setEditValue}
                                    keyboardType={editingStat === 'Price' || editingStat === 'Meetings' ? 'numeric' : 'default'}
                                    placeholder={`Enter ${editingStat?.toString().toLowerCase() || ''}`}
                                />
                            </View>

                            <View style={styles.editModalFooter}>
                                <TouchableOpacity
                                    style={styles.editModalCancelButton}
                                    onPress={onClose}
                                >
                                    <Text style={styles.editModalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editModalSaveButton}
                                    onPress={onSave}
                                >
                                    <Text style={styles.editModalSaveText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// Second, create a separate modal for treatment editing
const TreatmentEditModal = ({ visible, onClose, onSave, editingStat, editValue, setEditValue }) => {
    const isLongTextField = editingStat?.field === 'treatmentSummary' ||
        editingStat?.field === 'whatNext' ||
        editingStat?.field === 'homework';
    const [isSaving, setIsSaving] = useState(false); // Add this line to create a loading state

    const handleSave = async () => {
        setIsSaving(true); // Set loading state to true before saving
        await onSave(); // Call the save function
        setIsSaving(false); // Set loading state back to false after saving
    };
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[
                            styles.editModalContainer,
                            isLongTextField && styles.editModalContainerLarge
                        ]}>
                            <View style={styles.editModalHeader}>
                                <MaterialIcons name="edit" size={24} color="#014495" />
                                <Text style={styles.editModalTitle}>
                                    Edit {editingStat?.field?.replace(/([A-Z])/g, ' $1').trim() || ''}
                                </Text>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={styles.editModalCloseButton}
                                >
                                    <MaterialIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.editModalContent}>
                                <TextInput
                                    style={[
                                        styles.editModalInput,
                                        isLongTextField && styles.editModalInputMultiline,
                                        { textAlign: editValue && /^[\u0590-\u05FF]/.test(editValue[0]) ? 'right' : 'left' } // Conditional text alignment
                                    ]}
                                    value={editValue}
                                    onChangeText={setEditValue}
                                    multiline={isLongTextField}
                                    numberOfLines={isLongTextField ? 6 : 1}
                                    textAlignVertical={isLongTextField ? "top" : "center"}
                                    placeholder={`Enter ${editingStat?.field?.toLowerCase() || ''}`}
                                />
                            </ScrollView>

                            <View style={styles.editModalFooter}>
                                <TouchableOpacity
                                    style={styles.editModalCancelButton}
                                    onPress={onClose}
                                >
                                    <Text style={styles.editModalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editModalSaveButton}
                                    onPress={handleSave} // Call the handleSave function
                                    disabled={isSaving} // Disable button while saving
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="white" size="small" /> // Show ActivityIndicator while saving
                                    ) : (
                                        <Text style={styles.editModalSaveText}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// Add these constants at the top of the file
const PAYMENT_STATUSES = {
    PENDING: { label: 'Pending', icon: 'schedule', color: '#FF9800' },
    PAID: { label: 'Paid', icon: 'check-circle', color: '#4CAF50' },
    PARTIALLY_PAID: { label: 'Partially Paid', icon: 'remove-circle-outline', color: '#2196F3' },
    REFUNDED: { label: 'Refunded', icon: 'replay', color: '#9C27B0' },
    CANCELLED: { label: 'Cancelled', icon: 'cancel', color: '#F44336' }
};

const PAYMENT_METHODS = {
    CASH: { label: 'Cash', icon: 'attach-money' },
    CREDIT_CARD: { label: 'Credit Card', icon: 'credit-card' },
    DEBIT_CARD: { label: 'Debit Card', icon: 'credit-card' },
    BANK_TRANSFER: { label: 'Bank Transfer', icon: 'account-balance' },
    INSURANCE: { label: 'Insurance', icon: 'health-and-safety' },
    OTHER: { label: 'Other', icon: 'more-horiz' }
};

// Add these new modal components
const PaymentStatusModal = ({ visible, onClose, onSelect, currentStatus }) => (
    <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
    >
        <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.modalOverlay}>
                <Animatable.View
                    animation="zoomIn"
                    duration={300}
                    style={styles.paymentModalContainer}
                >
                    <View style={styles.paymentModalHeader}>
                        <MaterialIcons name="payments" size={24} color="#014495" />
                        <Text style={styles.paymentModalTitle}>Payment Status</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <MaterialIcons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.paymentModalContent}>
                        {Object.entries(PAYMENT_STATUSES).map(([status, { label, icon, color }]) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.paymentOptionButton,
                                    currentStatus === status && styles.paymentOptionButtonActive
                                ]}
                                onPress={() => onSelect(status)}
                            >
                                <MaterialIcons name={icon} size={24} color={color} />
                                <Text style={[
                                    styles.paymentOptionText,
                                    currentStatus === status && styles.paymentOptionTextActive
                                ]}>
                                    {label}
                                </Text>
                                {currentStatus === status && (
                                    <MaterialIcons name="check" size={24} color="#014495" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Animatable.View>
            </View>
        </TouchableWithoutFeedback>
    </Modal>
);

const PaymentMethodModal = ({ visible, onClose, onSelect, currentMethod, onOtherMethodChange }) => {
    const [otherMethod, setOtherMethod] = useState('');

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <Animatable.View
                        animation="zoomIn"
                        duration={300}
                        style={styles.paymentModalContainer}
                    >
                        <View style={styles.paymentModalHeader}>
                            <MaterialIcons name="payment" size={24} color="#014495" />
                            <Text style={styles.paymentModalTitle}>Payment Method</Text>
                            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                                <MaterialIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.paymentModalContent}>
                            {Object.entries(PAYMENT_METHODS).map(([method, { label, icon }]) => (
                                <TouchableOpacity
                                    key={method}
                                    style={[
                                        styles.paymentOptionButton,
                                        currentMethod === method && styles.paymentOptionButtonActive
                                    ]}
                                    onPress={() => onSelect(method)}
                                >
                                    <MaterialIcons name={icon} size={24} color="#014495" />
                                    <Text style={[
                                        styles.paymentOptionText,
                                        currentMethod === method && styles.paymentOptionTextActive
                                    ]}>
                                        {label}
                                    </Text>
                                    {currentMethod === method && (
                                        <MaterialIcons name="check" size={24} color="#014495" />
                                    )}
                                </TouchableOpacity>
                            ))}
                            {currentMethod === 'OTHER' && (
                                <Animatable.View
                                    animation="fadeIn"
                                    style={styles.otherMethodInput}
                                >
                                    <TextInput
                                        placeholder="Specify payment method"
                                        value={otherMethod}
                                        onChangeText={(text) => {
                                            setOtherMethod(text);
                                            onOtherMethodChange(text);
                                        }}
                                        style={styles.otherMethodTextInput}
                                    />
                                </Animatable.View>
                            )}
                        </ScrollView>
                    </Animatable.View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default function Treatments({ navigation }) {
    const dispatch = useDispatch();
    const isTrackingPermission = useSelector((state) => state.tracking.isTrackingPermission);
    const user = useSelector((state) => state.auth.user);
    const client = useSelector((state) => state.selectedClient);
    const clientId = client._id;
    const adminId = user._id
    // console.log("clientId:", clientId, "adminId:", adminId)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null);
    const [clientDetails, setClientDetails] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [parents, setParents] = useState([])
    const [parentsModalVisible, setParentsModalVisible] = useState(false);
    const [newTreatment, setNewTreatment] = useState({
        treatmentDate: new Date(),
        treatmentTime: new Date(),
        treatmentSummary: '',
        whatNext: '',
        paymentStatus: '',
        payDate: ''
    });
    const [parentName, setParentName] = useState('');
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const searchTimeout = useRef(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showTreatmentDatePicker, setShowTreatmentDatePicker] = useState(false);
    const [showPayDatePicker, setShowPayDatePicker] = useState(false);
    const [totalPages, setTotalPages] = useState(1)
    const [activeTab, setActiveTab] = useState(0);
    const translateX = useSharedValue(0);
    const pagerRef = useRef(null); // Add a ref for PagerView
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingStat, setEditingStat] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [showAgeDatePicker, setShowAgeDatePicker] = useState(false);
    const [isSavingAge, setIsSavingAge] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [treatmentToDelete, setTreatmentToDelete] = useState("");
    const firstNameInputRef = useRef(null);
    const [tempBirthday, setTempBirthday] = useState(() => {
        const now = new Date();
        try {
            if (!clientDetails.birthday) return now;
            const date = new Date(clientDetails.birthday);
            return isNaN(date.getTime()) ? now : date;
        } catch {
            return now;
        }
    });
    const [clientEditModalVisible, setClientEditModalVisible] = useState(false);
    const [treatmentEditModalVisible, setTreatmentEditModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [methodModalVisible, setMethodModalVisible] = useState(false);
    const [selectedTreatmentId, setSelectedTreatmentId] = useState(null);
    const [isSaving, setIsSaving] = useState(false); // Add this line to create a loading state
    const [dateTimeModalVisible, setDateTimeModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isFullNameSaving, setIsFullNameSaving] = useState(false); // State to track saving status
    const [editPriceModalVisible, setEditPriceModalVisible] = useState(false);
    const [isSavingPrice, setIsSavingPrice] = useState(false);
    const [price, setPrice] = useState(0);
    const priceInputRef = useRef(null); // Add a ref for price input
    const [clientPayments, setClientPayments] = useState([])
    const [loadingPaments, setLoadingPayments] = useState(false)
    const [treatmentPaid, setTreatmentPaid] = useState([])

    function checkTreatmentPaid() {
        const paymentsAmountArr = clientPayments.map(p => p.amount)
        const treatmentPriceArr = treatments.map(t => t.treatmentPrice)
        console.log("paymentsAmountArr:", paymentsAmountArr, "treatmentPriceArr:", treatmentPriceArr)
        let paymentSum = paymentsAmountArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        // let paymentSum = 0; // Tracks the cumulative sum of payments
        let result = []; // Array to store the payment statuses

        // Loop through the treatment prices
        for (let i = 0; i < treatmentPriceArr.length; i++) {
            // paymentSum += paymentsAmountArr.shift() || 0; // Add the next payment, or 0 if no payments left

            if (paymentSum >= treatmentPriceArr[i]) {
                result.push("PAID");
                paymentSum -= treatmentPriceArr[i]; // Deduct the treatment price from the payment sum
            } else if (paymentSum > 0 && paymentSum < treatmentPriceArr[i]) {
                result.push("PARTIALLY PAID");
                break; // Stop further processing as payments can't cover subsequent treatments
                // paymentSum = 0; // Remaining amount is used up for partial payment
            } else {
                result.push("PENDING"); // Payment is not sufficient for this treatment
            }
        }
        // Fill the rest with "pending" if there are more treatments than payments
        while (result.length < treatmentPriceArr.length) {
            result.push("PENDING");
        }
        console.log(result)
        setTreatmentPaid(result.reverse())
        // return result;
    }
    useEffect(() => {
        checkTreatmentPaid()
    }, [clientPayments, treatments])

    const fetchPayments = async () => {
        // console.log("clientId for payments:", client._id);
        try {
            setLoadingPayments(true);
            const response = await axios.get(`${Api}/payments/client/${client._id}`);

            // Check if the response is successful
            if (response.status === 200) {
                setClientPayments(response.data);
                // checkTreatmentPaid()
            } /* else {
                console.error("Unexpected response status:", response.status);
            } */
        } catch (error) {
            setLoadingPayments(false);
            if (error.response) {
                // Handle known errors
                console.error('Error fetching payments:', error.response.data.message);
                // alert(error.response.data.message); // Show the error message to the user
            } else {
                // Handle unknown errors
                console.error('Error fetching payments:', error.message);
                // alert('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoadingPayments(false);
        }
    };


    useEffect(() => {
        fetchPayments(clientDetails._id);
    }, []);

    const openEditPriceModal = () => {
        setEditPriceModalVisible(true);
        setTimeout(() => {
            priceInputRef.current?.focus(); // Focus on the price input after the modal opens
        }, 100); // Delay to ensure the modal is fully rendered before focusing
    };
    const handlePriceChange = (text, id) => {
        setPrice(text);
    };
    const handleSavePrice = async (id) => {
        if (price === 0) { setIsSavingPrice(false); return }
        setIsSavingPrice(true); // Set loading state to true before saving
        try {
            // Call the function to update the treatment price in the backend
            await updateTreatmentPrice(id);
        } catch (error) {
            console.error('Error saving treatment price:', error);
        } finally {
            setIsSavingPrice(false); // Reset loading state after saving
            setEditPriceModalVisible(false); // Close modal after saving
        }
    };
    const updateTreatmentPrice = async (id) => {
        try {
            // console.log("id:", id)
            const response = await axios.put(`${Api}/treatments/treatments/${selectedTreatmentId}`, {
                treatmentPrice: price,
            });
            fetchTreatments();
            // Handle response if needed
        } catch (error) {
            console.error('Error updating treatment price:', error);
        }
    };

    const openNameModal = () => {
        setNameModalVisible(true);
        setTimeout(() => {
            firstNameInputRef.current.focus(); // Focus on the first name input after the modal opens
        }, 100); // Delay to ensure the modal is fully rendered before focusing
    };
    const handleSaveName = async (id) => {
        if (firstName === "" || lastName === "") { setIsFullNameSaving(false); return }
        setIsFullNameSaving(true); // Set loading state to true before saving
        try {
            // Call the function to update the client's name in the backend
            await updateClientName(id, firstName, lastName);
        } catch (error) {
            console.error('Error saving client name:', error);
        } finally {
            setIsFullNameSaving(false); // Reset loading state after saving
            setNameModalVisible(false); // Close modal after saving
        }
    };
    const updateClientName = async (id, firstName, lastName) => {
        try {
            const response = await axios.put(`${Api}/clients/${id}/${user._id}`, {
                name: firstName,
                lastName: lastName,
            });
            fetchClientData()
            // Handle response if needed
        } catch (error) {
            console.error('Error updating client name:', error);
        }
    };
    const handleDateChange = (event, date) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleSaveDateTime = async (id) => {
        // Call the function to update the date and time in the backend
        await updateTreatmentDateTime(id, selectedDate);
        setDateTimeModalVisible(false);
    };

    // Function to update the treatment date and time in the backend
    const updateTreatmentDateTime = async (id, newDateTime) => {
        try {
            const response = await axios.put(`${Api}/treatments/dateTime/${id}`, {
                treatmentDate: newDateTime.toISOString(),
            });
            fetchTreatments()
            // Handle response if needed
        } catch (error) {
            console.error('Error updating treatment date and time:', error);
        }
    };

    const handleCloseDeleteModal = useCallback(() => {
        setDeleteModalVisible(false);
        setTreatmentToDelete(null);
    }, []);

    const handlePageChange = (page) => {
        setActiveTab(page);
        translateX.value = withTiming(page * (windowWidth / 3)); // Adjust width division as per number of tabs

        // Set the page in PagerView
        if (pagerRef.current) {
            pagerRef.current.setPage(page);
        }
    };

    const onPageSelected = (e) => {
        const page = e.nativeEvent.position;
        setActiveTab(page);
        translateX.value = withTiming(page * (windowWidth / 3)); // Sync the indicator animation with swipe
    };

    const animatedIndicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const fetchClientData = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${Api}/clients/${clientId}/${adminId}`);
            setClientDetails(response.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('404'); // Set error to "404" if status is 404
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // fetchClientDetails();
        fetchTreatments();
    }, [debouncedSearch, clientId, page, search]);
    useEffect(() => {
        const fetchClientData = async () => {
            try {
                setLoading(true)
                const response = await axios.get(`${Api}/clients/${clientId}/${adminId}`);
                setClientDetails(response.data);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError('404'); // Set error to "404" if status is 404
                } else {
                    setError('An unexpected error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchClientData();
    }, [clientId, adminId]);

    const handleDeleteTreatment = useCallback(async () => {
        try {
            console.log("treatmentToDelete:", treatmentToDelete)
            const response = await axios.delete(`${Api}/treatments/${treatmentToDelete}`);

            if (response.status === 200) {
                // setTreatments(response.data.treatments)
                setTreatments(prev => prev.filter(t => t._id !== treatmentToDelete));
                handleCloseDeleteModal(); // Use the handler here

                // Optional: Show success message
                // Alert.alert('Success', 'Treatment deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting treatment:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to delete treatment'
            );
        }
    }, [treatmentToDelete]);
    /*  const fetchClientDetails = async () => {
         // Fetch client details based on clientId
         // Assuming you have a route for fetching client details by ID
         try {
             const response = await axios.get(`${Api}/clients/${clientId}`);
             setClientDetails(response.data);
         } catch (error) {
             console.error(error);
         }
     }; */

    const fetchTreatments = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${Api}/treatments/${clientId}`, {
                params: {
                    page,
                    limit: 10,
                    search: debouncedSearch // Use debounced search term
                }
            });

            const { treatments: newTreatments, totalPages } = response.data;

            // Combine the existing treatments with the new ones and filter duplicates
            const combinedTreatments = page === 1
                ? newTreatments
                : [...treatments, ...newTreatments];

            // Filter out treatments with duplicate _id keys
            const uniqueTreatments = combinedTreatments.filter(
                (treatment, index, self) =>
                    index === self.findIndex((t) => t._id === treatment._id)
            );

            setTreatments(uniqueTreatments);
            // checkTreatmentPaid()
            setTotalPages(totalPages); // Set total pages for pagination controls
            //  console.log("treatments:", uniqueTreatments);
        } catch (error) {
            console.error("error fetching treatments: ", error);
        }
        setIsLoading(false);
    };

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page when search changes
        }, 600);

        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    const handleSearch = (text) => {
        setSearch(text);
    };

    const handleEndReached = () => {
        if (!isLoading && page < totalPages) { // Ensure we don't load past the last page
            setPage(prevPage => prevPage + 1);
        }
    };

    // const TreatmentsList = ({ treatments, onAddTreatment, loading }) => {
    //     const [isSaving, setIsSaving] = useState(false);

    //     const handleSaveDateTime = async (item) => {
    //         setIsSaving(true); // Set loading state to true before saving
    //         try {
    //             // Call the function to update the date and time in the backend
    //             await updateTreatmentDateTime(item._id, selectedDate);
    //         } catch (error) {
    //             console.error('Error saving date and time:', error);
    //         } finally {
    //             setIsSaving(false); // Reset loading state after saving
    //             setDateTimeModalVisible(false); // Close modal after saving
    //         }
    //     };
    //     const renderTreatmentItem = ({ item, index }) => (
    //         <Animatable.View
    //             animation="fadeInUp"
    //             delay={index * 100}
    //             style={styles.treatmentCard}
    //         >
    //             <View style={styles.treatmentHeader}>
    //                 <TouchableOpacity onPress={() => { setSelectedDate(new Date(item.treatmentDate)); setDateTimeModalVisible(true) }}>
    //                     <View style={styles.treatmentDateTime}>
    //                         <View style={styles.treatmentDate}>
    //                             <MaterialIcons name="event" size={20} color="#014495" />
    //                             <Text style={styles.dateText}>
    //                                 {new Date(item.treatmentDate).toLocaleDateString()}
    //                             </Text>
    //                         </View>
    //                         <View style={styles.treatmentTime}>
    //                             <MaterialIcons name="access-time" size={20} color="#014495" />
    //                             <Text style={styles.timeText}>
    //                                 {formatTime(item.treatmentDate)}
    //                             </Text>
    //                         </View>
    //                     </View>
    //                 </TouchableOpacity>
    //                 <TouchableOpacity onPress={() => { setPrice(clientDetails.clientPrice); openEditPriceModal() }}>
    //                     <View style={styles.treatmentPrice}>
    //                         <MaterialIcons name="attach-money" size={20} color="#014495" />
    //                         <Text style={styles.priceText}>
    //                             ${item.treatmentPrice ? item.treatmentPrice : clientDetails.clientPrice ? clientDetails.clientPrice : 'N/A'}
    //                         </Text>
    //                     </View>
    //                 </TouchableOpacity>
    //                 <Modal
    //                     animationType="slide"
    //                     transparent={true}
    //                     visible={editPriceModalVisible}
    //                     onRequestClose={() => setEditPriceModalVisible(false)}
    //                 >
    //                     <View style={styles.modalOverlay}>
    //                         <View style={styles.modalEditPriceContainer}>
    //                             <Text style={styles.modalEditPriceHeader}>Edit Price</Text>
    //                             <TextInput
    //                                 ref={priceInputRef}
    //                                 style={styles.priceInput}
    //                                 placeholder="Enter new price"
    //                                 keyboardType="numeric"
    //                                 value={price ? price.toString() : ''}
    //                                 onChangeText={(text) => handlePriceChange(text, item._id)}
    //                             // onFocus={() => priceInputRef.current?.focus()}
    //                             />
    //                             <View style={styles.buttonEditPriceContainer}>
    //                                 <Button title="Cancel" onPress={() => setEditPriceModalVisible(false)} color="#FF3D00" />
    //                                 <Button title="Save" onPress={() => handleSavePrice(item._id)} color="#014495" />
    //                             </View>
    //                         </View>
    //                     </View>
    //                 </Modal>
    //                 <Modal
    //                     animationType="slide"
    //                     transparent={true}
    //                     visible={dateTimeModalVisible}
    //                     onRequestClose={() => setDateTimeModalVisible(false)}
    //                 >
    //                     <View style={styles.modalOverlay}>
    //                         <View style={styles.modalDateTimeContainer}>
    //                             <Text style={styles.modalDateTimeHeader}>Update Date and Time</Text>
    //                             <DateTimePicker
    //                                 value={selectedDate}
    //                                 mode="datetime"
    //                                 display="default"
    //                                 onChange={handleDateChange}
    //                                 confirmBtnText="confirm"
    //                                 cancelBtnText="dismiss"
    //                             />
    //                             <View style={styles.buttonDateTimeContainer}>
    //                                 <Button title="Cancel" onPress={() => setDateTimeModalVisible(false)} color="#FF3D00" />
    //                                 <View style={styles.saveDateTimeButtonContainer}>
    //                                     {isSaving ? (
    //                                         <ActivityIndicator size="small" color="#014495" />
    //                                     ) : (
    //                                         <Button title="Save" onPress={handleSaveDateTime} color="#014495" />
    //                                     )}
    //                                 </View>
    //                             </View>
    //                         </View>
    //                     </View>
    //                 </Modal>
    //                 <View style={styles.headerActions}>
    //                     <Text style={styles.sessionNumber}>Session #{/* item.sessionNumber */treatments.length - index}</Text>
    //                     <TouchableOpacity
    //                         style={styles.deleteButton}
    //                         onPress={() => {
    //                             setTreatmentToDelete(item._id);
    //                             setDeleteModalVisible(true);
    //                         }}
    //                     >
    //                         <MaterialIcons name="delete-outline" size={24} color="#FF4444" />
    //                     </TouchableOpacity>
    //                 </View>
    //             </View>
    //             <DeleteConfirmationModal
    //                 visible={deleteModalVisible}
    //                 onClose={handleCloseDeleteModal}
    //                 onDelete={handleDeleteTreatment}
    //             />
    //             <View style={styles.treatmentContent}>
    //                 <TouchableOpacity
    //                     style={styles.editableField}
    //                     onPress={() => handleEditField(item._id, 'treatmentSummary')}
    //                 >
    //                     <Text style={styles.fieldLabel}>Treatment Summary</Text>
    //                     <Text style={styles.fieldValue}>
    //                         {item.treatmentSummary || 'Add summary...'}
    //                     </Text>
    //                 </TouchableOpacity>

    //                 <TouchableOpacity
    //                     style={styles.editableField}
    //                     onPress={() => handleEditField(item._id, 'whatNext')}
    //                 >
    //                     <Text style={styles.fieldLabel}>Next Steps</Text>
    //                     <Text style={styles.fieldValue}>
    //                         {item.whatNext || 'Add next steps...'}
    //                     </Text>
    //                 </TouchableOpacity>

    //                 <TouchableOpacity
    //                     style={styles.editableField}
    //                     onPress={() => handleEditField(item._id, 'homework')}
    //                 >
    //                     <Text style={styles.fieldLabel}>Homework</Text>
    //                     <Text style={styles.fieldValue}>
    //                         {item.homework || 'Add homework...'}
    //                     </Text>
    //                 </TouchableOpacity>

    //                 <View style={styles.paymentSection}>
    //                     <TouchableOpacity
    //                         style={[styles.paymentStatus, {
    //                             backgroundColor: PAYMENT_STATUSES[item.paymentStatus]?.color + '20' || '#FFF3E0'
    //                         }]}
    //                         onPress={() => handleStatusModalOpen(item._id)}
    //                     >
    //                         <MaterialIcons
    //                             name={PAYMENT_STATUSES[item.paymentStatus]?.icon || 'schedule'}
    //                             size={16}
    //                             color={PAYMENT_STATUSES[item.paymentStatus]?.color || '#FF9800'}
    //                         />
    //                         <Text style={[styles.statusText, { color: PAYMENT_STATUSES[item.paymentStatus]?.color || '#FF9800' }]}>
    //                             {PAYMENT_STATUSES[item.paymentStatus]?.label || 'Set status'}
    //                         </Text>
    //                     </TouchableOpacity>

    //                     <TouchableOpacity
    //                         style={styles.paymentMethod}
    //                         onPress={() => handleMethodModalOpen(item._id)}
    //                     >
    //                         <MaterialIcons
    //                             name={PAYMENT_METHODS[item.PaymentMethod]?.icon || 'payment'}
    //                             size={16}
    //                             color="#014495"
    //                         />
    //                         <Text style={styles.methodText}>
    //                             {item.PaymentMethod === 'OTHER' ? item.otherPaymentMethod :
    //                                 PAYMENT_METHODS[item.PaymentMethod]?.label || 'Set method'}
    //                         </Text>
    //                     </TouchableOpacity>
    //                 </View>
    //             </View>
    //         </Animatable.View>
    //     );

    //     const renderSkeletonLoading = () => (
    //         <View style={styles.skeletonContainer}>
    //             {[1, 2, 3].map((_, index) => (
    //                 <Animatable.View
    //                     key={index}
    //                     animation="pulse"
    //                     iterationCount="infinite"
    //                     style={styles.skeletonCard}
    //                 >
    //                     <View style={styles.skeletonHeader}>
    //                         <View style={styles.skeletonDate} />
    //                         <View style={styles.skeletonStatus} />
    //                     </View>
    //                     <View style={styles.skeletonContent}>
    //                         <View style={styles.skeletonLine} />
    //                         <View style={[styles.skeletonLine, { width: '60%' }]} />
    //                     </View>
    //                 </Animatable.View>
    //             ))}
    //         </View>
    //     );

    //     return (
    //         <View style={styles.treatmentsContainer}>
    //             {loading ? (
    //                 renderSkeletonLoading()
    //             ) : (
    //                 <>
    //                     <FlatList
    //                         data={treatments}
    //                         renderItem={renderTreatmentItem}
    //                         keyExtractor={(item) => item._id}
    //                         contentContainerStyle={styles.treatmentsList}
    //                         showsVerticalScrollIndicator={false}
    //                         ListEmptyComponent={() => (
    //                             <View style={styles.emptyState}>
    //                                 <MaterialIcons name="medical-services" size={60} color="#014495" />
    //                                 <Text style={styles.emptyStateTitle}>No Treatments Yet</Text>
    //                                 <Text style={styles.emptyStateText}>
    //                                     Add your first treatment to start tracking progress
    //                                 </Text>
    //                             </View>
    //                         )}
    //                     />
    //                     <TouchableOpacity
    //                         style={styles.addButton}
    //                         onPress={() => setModalVisible(true)}
    //                         activeOpacity={0.7}
    //                     >
    //                         <LinearGradient
    //                             colors={['#4A90E2', '#357ABD']}
    //                             style={styles.gradientButton}
    //                             start={{ x: 0, y: 0 }}
    //                             end={{ x: 1, y: 0 }}
    //                         >
    //                             <MaterialIcons name="add" size={24} color="white" />
    //                             <Text style={styles.addButtonText}>Add Treatment</Text>
    //                         </LinearGradient>
    //                     </TouchableOpacity>
    //                 </>
    //             )}
    //         </View>
    //     );
    // };

    const validateInputs = () => {
        let validationErrors = {};

        if (!newTreatment.treatmentDate) validationErrors.treatmentDate = 'Treatment Date is required';
        if (!newTreatment.treatmentSummary) validationErrors.treatmentSummary = 'Summary is required';

        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const handleSaveTreatment = async () => {
        try {
            // Validate date and time
            if (!newTreatment.treatmentDate || !newTreatment.treatmentTime) {
                Alert.alert("Error", "Please select both date and time");
                return;
            }

            // Combine date and time
            const combinedDateTime = new Date(newTreatment.treatmentDate);
            const timeDate = new Date(newTreatment.treatmentTime);

            // Validate the combined date
            if (isNaN(combinedDateTime.getTime()) || isNaN(timeDate.getTime())) {
                Alert.alert("Error", "Invalid date or time selected");
                return;
            }

            combinedDateTime.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);

            /*  console.log('Sending treatment data:', {
                 clientId,
                 treatmentDate: combinedDateTime.toISOString()
             }); */

            const response = await axios.post(`${Api}/treatments/${clientId}`, {
                treatmentDate: combinedDateTime.toISOString(),
            });
            // setTreatments(response.data)
            // Add the new treatment to the beginning of the list
            setTreatments(prev => [response.data, ...prev]);
            setModalVisible(false);
            setNewTreatment({
                treatmentDate: new Date(),
                treatmentTime: new Date(),
            });
        } catch (error) {
            console.error("Error saving treatment:", error.response?.data || error);
            Alert.alert(
                "Error",
                "Failed to create treatment: " + (error.response?.data?.message || error.message)
            );
        }
    };

    const handleEditField = (treatmentId, field) => {
        const treatment = treatments.find(t => t._id === treatmentId);
        if (!treatment) return;

        setEditingStat({
            id: treatmentId,
            field,
            currentValue: treatment[field] || '',
        });
        setEditValue(treatment[field] || '');
        setTreatmentEditModalVisible(true);  // Changed from setEditModalVisible
    };

    const handleSaveTreatmentEdit = async () => {
        try {
            const { id, field } = editingStat;
            let value = editValue;

            // Special handling for dates if needed
            if (field === 'payDate') {
                value = new Date(value).toISOString();
            }
            // console.log("id:", id, "field:", field, "value:", value)
            const response = await axios.put(`${Api}/treatments/treatments/${id}`, {
                [field]: value
            });

            // Update treatments list with edited treatment
            setTreatments(prev =>
                prev.map(t => t._id === id ? response.data : t)
            );

            setTreatmentEditModalVisible(false);
        } catch (error) {
            console.error('Error updating treatment:', error);
            Alert.alert('Error', 'Failed to update treatment');
        }
    };



    const renderParent = ({ item, index }) => (
        <View style={styles.parentContainer}>
            <View style={{/* justifyContent:"center", alignItems:"center" */ flexDirection: "row", }}>
                <View style={{ justifyContent: "center", alignItems: "center" }}>

                    {item.gender === "זכר" ? <Fontisto name="male" size={40} color="#8BB6C7" /> : <Fontisto name="female" size={40} color="#ECABA8" />}
                    <Text style={styles.parentText}>{item.parentName.length > 12 ? `${item.parentName.slice(0, 15)}..` : item.parentName}</Text>
                </View>

                <View style={styles.iconContainer}>
                    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                        <FontAwesome name="phone" size={24} color="grey" />
                        <Text style={{ color: "grey", marginHorizontal: horizontalScale(10) }}>{item.phone}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity disabled={!item.email} style={{ flexDirection: "row", alignItems: "center" }} onPress={() => Linking.openURL(`mailto:${item.email}`)}>
                        <FontAwesome name="envelope" size={24} color="grey" />
                        <Text style={{ color: "grey", marginHorizontal: horizontalScale(10) }}>{item.email ? item.email : "No email"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity onPress={() => handleDeleteParent(index)}>
                <Feather name="x-circle" size={24} color="black" />
            </TouchableOpacity>
            {/* <Button title="Delete" onPress={() => handleDeleteParent(index)} /> */}
        </View>
    );

    const renderParents = ({ item }) => (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>

            <View style={styles.parentContainer}>
                <FontAwesome name="user" size={24} color="blue" />
                <Text>{clientDetails.parentName}</Text>
            </View>
            <View style={{ width: windowWidth * 0.5, justifyContent: "space-between" }}>
                <Entypo name="mail" size={24} color="black" />
                <FontAwesome name="whatsapp" size={24} color="black" />
                <Entypo name="phone" size={24} color="black" />
            </View>
        </View>
    );

    const deleteParentByIndex = async (clientId, index, setParents) => {
        try {
            const response = await axios.delete(`${Api}/clients/${clientId}/parent/index/${index}`);

            // Update the parents list with the modified array from the response
            setClientDetails(response.data);

            Alert.alert("Success", "Parent deleted successfully");
        } catch (error) {
            console.error("Error deleting parent: ", error);
            Alert.alert("Error", "Could not delete parent. Please try again.");
        }
    };

    const handleDeleteParent = (index) => {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this parent?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: () => deleteParentByIndex(clientId, index, setParents) }
            ]
        );
    };


    const onTreatmentDateChange = (event, selectedDate) => {
        setShowTreatmentDatePicker(false);
        if (selectedDate) {
            setNewTreatment({ ...newTreatment, treatmentDate: selectedDate });
        }
    };

    const onPayDateChange = (event, selectedDate) => {
        setShowPayDatePicker(false);
        if (selectedDate) {
            setNewTreatment({ ...newTreatment, payDate: selectedDate });
        }
    };

    const handleAddParent = async () => {
        try {
            const newParent = { parentName, gender, phone, email };
            response = await axios.post(`${Api}/clients/${clientId}/addParent`, newParent);
            setClientDetails(response.data.client)
            // onParentAdded(newParent);
            setParentsModalVisible(false)
        } catch (error) {
            console.error('Error adding parent:', error);
        }
    };

    const handleStatPress = (statLabel) => {
        // Don't show edit modal for Age stat
        if (statLabel === 'Age') return;

        let currentValue = '';
        switch (statLabel) {
            case 'Price':
                currentValue = clientDetails.clientPrice || '';
                break;
            case 'Insurance':
                currentValue = clientDetails.insuranceInfo || '';
                break;
            case 'Meetings':
                currentValue = clientDetails.numberOfMeetings?.toString() || '';
                break;
        }

        setEditingStat(statLabel);
        setEditValue(currentValue);
        setClientEditModalVisible(true);
    };

    const handleSaveStatEdit = async () => {
        try {
            let field = '';
            let value = editValue;

            // Map the editingStat to the correct field name
            switch (editingStat) {
                case 'Price':
                    field = 'clientPrice';
                    break;
                case 'Insurance':
                    field = 'insuranceInfo';
                    break;
                case 'Meetings':
                    field = 'numberOfMeetings';
                    value = parseInt(editValue) || 0;
                    break;
            }

            const response = await axios.patch(`${Api}/clients/${clientId}/updateField`, {
                field,
                value
            });

            setClientDetails(response.data);
            setClientEditModalVisible(false);
        } catch (error) {
            console.error('Error updating stat:', error);
            Alert.alert('Error', 'Failed to update information');
        }
    };

    const ClientDescription = ({ clientDetails }) => {
        const [descModalVisible, setDescModalVisible] = useState(false);
        const [description, setDescription] = useState(clientDetails.description || '');
        const [isSaving, setIsSaving] = useState(false);

        const handleSaveDescription = async () => {
            setIsSaving(true);
            try {
                const response = await axios.patch(`${Api}/clients/${clientDetails._id}/updateField`, {
                    field: 'description',
                    value: description
                });

                // Update the client details in the parent component
                setClientDetails(response.data);
                setDescModalVisible(false);
            } catch (error) {
                console.error('Error saving description:', error);
                Alert.alert('Error', 'Failed to save description');
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <Animatable.View
                animation="fadeInUp"
                delay={800}
                style={styles.descriptionContainer}
            >
                <View style={styles.descriptionHeader}>
                    <MaterialIcons name="description" size={24} color="#014495" />
                    <Text style={styles.descriptionTitle}>Description</Text>
                    <TouchableOpacity
                        onPress={() => setDescModalVisible(true)}
                        style={styles.editDescriptionButton}
                    >
                        <MaterialIcons name="edit" size={20} color="#014495" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.descriptionText}>
                    {clientDetails.description || "No description available"}
                </Text>

                <Modal
                    visible={descModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setDescModalVisible(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.descriptionModalContainer}
                        keyboardVerticalOffset={100} // Adjust this value as needed
                    >
                        <View style={styles.descriptionModalContent}>
                            <View style={styles.descriptionModalHeader}>
                                <Text style={styles.descriptionModalTitle}>Edit Description</Text>
                                <TouchableOpacity
                                    onPress={() => setDescModalVisible(false)}
                                    style={styles.descriptionModalClose}
                                >
                                    <MaterialIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.descriptionInput}
                                multiline
                                numberOfLines={8}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Enter description..."
                                textAlignVertical="top"
                            />

                            <TouchableOpacity
                                style={[
                                    styles.saveDescriptionButton,
                                    isSaving && styles.saveButtonDisabled
                                ]}
                                onPress={() => {
                                    handleSaveDescription();
                                    Keyboard.dismiss(); // Dismiss the keyboard when saving
                                }}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.saveDescriptionText}>Save Description</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </Animatable.View>
        );
    };


    const handleSaveAge = async () => {
        try {
            setIsSavingAge(true);
            const response = await axios.patch(`${Api}/clients/${clientId}/updateField`, {
                field: 'birthday',
                value: tempBirthday.toISOString()
            });
            setClientDetails(response.data);
            setShowAgeDatePicker(false);
        } catch (error) {
            console.error('Error updating age:', error);
            Alert.alert('Error', 'Failed to update birthday');
        } finally {
            setIsSavingAge(false);
        }
    };

    const handleStatusModalOpen = (treatmentId) => {
        setSelectedTreatmentId(treatmentId);
        setStatusModalVisible(true);
    };

    const handleMethodModalOpen = (treatmentId) => {
        setSelectedTreatmentId(treatmentId);
        setMethodModalVisible(true);
    };

    const handleStatusSelect = async (status) => {
        if (selectedTreatmentId) {
            await handleEditField(selectedTreatmentId, 'paymentStatus', status);
            setStatusModalVisible(false);
            setSelectedTreatmentId(null);
        }
    };

    const handleMethodSelect = async (method) => {
        if (selectedTreatmentId) {
            await handleEditField(selectedTreatmentId, 'PaymentMethod', method);
            setMethodModalVisible(false);
            if (method !== 'OTHER') {
                setSelectedTreatmentId(null);
            }
        }
    };

    const handleOtherMethodChange = async (text) => {
        if (selectedTreatmentId) {
            await handleEditField(selectedTreatmentId, 'otherPaymentMethod', text);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" style={styles.centered} />;
    }

    if (error === '404') {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>404 Page Not Found</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const EditStatModal = () => {
        // Determine if the current field should use multiline input
        const isLongTextField = editingStat?.field === 'treatmentSummary' ||
            editingStat?.field === 'whatNext' ||
            editingStat?.field === 'homework';

        return (
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={[
                            styles.editModalContainer,
                            isLongTextField && styles.editModalContainerLarge
                        ]}>
                            <View style={styles.editModalHeader}>
                                <MaterialIcons name="edit" size={24} color="#014495" />
                                <Text style={styles.editModalTitle}>
                                    Edit {editingStat?.field ? editingStat.field.replace(/([A-Z])/g, ' $1').trim() : ''}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setEditModalVisible(false)}
                                    style={styles.editModalCloseButton}
                                >
                                    <MaterialIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.editModalContent}>
                                <Text style={styles.editModalLabel}>
                                    {editingStat?.field ? editingStat.field.replace(/([A-Z])/g, ' $1').trim() : ''} Value
                                </Text>
                                <TextInput
                                    style={[
                                        styles.editModalInput,
                                        isLongTextField && styles.editModalInputMultiline,
                                        { textAlign: editValue && /^[\u0590-\u05FF]/.test(editValue[0]) ? 'right' : 'left' } // Conditional text alignment
                                    ]}
                                    value={editValue}
                                    onChangeText={setEditValue}
                                    multiline={isLongTextField}
                                    numberOfLines={isLongTextField ? 6 : 1}
                                    textAlignVertical={isLongTextField ? "top" : "center"}
                                    keyboardType={editingStat?.field === 'numberOfMeetings' || editingStat?.field === 'clientPrice' ? 'numeric' : 'default'}
                                    placeholder={`Enter ${editingStat?.field ? editingStat.field.replace(/([A-Z])/g, ' $1').trim().toLowerCase() : ''}`}
                                />
                            </View>

                            <View style={styles.editModalFooter}>
                                <TouchableOpacity
                                    style={styles.editModalCancelButton}
                                    onPress={() => setEditModalVisible(false)}
                                >
                                    <Text style={styles.editModalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editModalSaveButton}
                                    onPress={handleSaveTreatmentEdit}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.editModalSaveText}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    };

    const PaymentsList = ({ treatments, payments, clientId, userId }) => {
        const paidTreatments = /* payments.filter(t => t.status === 'paid'); */ payments.map(t => t.amount)
        const pendingTreatments = /* treatments.filter(t => t.paymentStatus === 'pending'); */treatments.map(t => t.treatmentPrice)

        const totalPaid = paidTreatments.reduce((sum, t) => sum + (parseFloat(t) || 0), 0);
        const totalPending = pendingTreatments.reduce((sum, t) => sum + (parseFloat(t) || 0), 0) - totalPaid;
        const [paymentModalVisible, setPaymentModalVisible] = useState(false);
        const [paymentAmount, setPaymentAmount] = useState('');
        const [paymentMethod, setPaymentMethod] = useState('');
        const [paymentStage, setPaymentStage] = useState(1); // 1: Amount, 2: Method, 3: Confirmation
        const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer'];


        const handleDeletePayment = async (paymentId) => {
            try {
                Alert.alert(
                    "Delete Payment",
                    "Are you sure you want to delete this payment?",
                    [
                        {
                            text: "Cancel",
                            style: "cancel"
                        },
                        {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                                const response = await axios.delete(`${Api}/payments/${paymentId}`);
                                if (response.status === 200) {
                                    // Update your local state to remove the deleted payment
                                    const updatedPayments = payments.filter(payment => payment._id !== paymentId);
                                    setClientPayments(updatedPayments);
                                    // Alert.alert("Success", "Payment deleted successfully");
                                }
                            }
                        }
                    ]
                );
            } catch (error) {
                console.error('Error deleting payment:', error);
                Alert.alert("Error", "Failed to delete payment");
            }
        };

        const handleAddPayment = async () => {
            // Validate input
            if (!paymentAmount || !paymentMethod) {
                alert("Please enter an amount and select a payment method.");
                return;
            }

            // Prepare the payment data
            const paymentData = {
                clientId: clientId, // Assuming you have clientDetails available
                userId: userId,
                amount: parseFloat(paymentAmount),
                paymentMethod: paymentMethod,
            };

            try {
                // Make API call to add the payment
                const response = await axios.post(`${Api}/payments/`, paymentData);
                if (response.status !== 201) {
                    throw new Error('Failed to add payment');
                }
                console.log("response data payments:", response.data)
                setClientPayments([response.data, ...clientPayments])
                // Optionally, you can update the state or refresh the list of treatments here
                // setTreatments([...treatments]); // If you are using state to manage treatments

                // Close the payment modal
                setPaymentModalVisible(false);
                alert('Payment added successfully!');

            } catch (error) {
                console.error('Error adding payment:', error);
                alert('Failed to add payment. Please try again.');
            }
        };
        const renderRightActions = (progress, dragX, item) => {
            return (
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={styles.deleteAction}
                >
                    <TouchableOpacity
                        style={styles.deleteActionButton}
                        onPress={() => handleDeletePayment(item._id)}
                    >
                        <MaterialIcons name="delete" size={24} color="white" />
                    </TouchableOpacity>
                </Animated.View>
            );
        };

        const renderPaymentItem = ({ item, index }) => (
            <Swipeable
                renderRightActions={(progress, dragX) =>
                    renderRightActions(progress, dragX, item)
                }
                rightThreshold={40}
            >
                <Animatable.View
                    animation="fadeInUp"
                    delay={index * 100}
                    style={styles.paymentCard}
                >
                    <View style={styles.paymentHeader}>
                        <View style={styles.paymentDate}>
                            <MaterialIcons name="event" size={20} color="#014495" />
                            <Text style={styles.paymentDateText2}>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                            <Text style={styles.paymentTimeText}>
                                {new Date(item.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </Text>
                        </View>
                        <View style={styles.headerRightSection}>
                            <Text style={styles.paymentAmounts}>
                                ${parseFloat(item.amount || 0).toFixed(2)}
                            </Text>
                            {/* Remove the static delete button */}
                        </View>
                    </View>
                    <View style={styles.paymentMethodContainer}>
                        <View style={styles.paymentMethodBadge}>
                            <MaterialIcons
                                name={
                                    item.paymentMethod === 'cash' ? 'payments' :
                                        item.paymentMethod === 'credit' ? 'credit-card' :
                                            'account-balance'
                                }
                                size={18}
                                color="#014495"
                            />
                            <Text style={styles.paymentMethodText}>
                                {item.paymentMethod?.charAt(0).toUpperCase() + item.paymentMethod?.slice(1)}
                            </Text>
                        </View>
                    </View>
                </Animatable.View>
            </Swipeable>
        );

        return (
            <View style={styles.paymentsContainer}>
                <Animatable.View
                    animation="fadeInDown"
                    style={styles.paymentsSummary}
                >
                    <View style={styles.summaryCard}>
                        <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                        <Text style={styles.summaryAmount}>${totalPaid.toFixed(2)}</Text>
                        <Text style={styles.summaryLabel}>Total Paid</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <MaterialIcons name="schedule" size={24} color="#FF9800" />
                        <Text style={styles.summaryAmount}>${totalPending.toFixed(2)}</Text>
                        <Text style={styles.summaryLabel}>Pending</Text>
                    </View>
                </Animatable.View>



                <FlatList
                    data={/*treatments*/ payments}
                    renderItem={renderPaymentItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.paymentsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="account-balance-wallet" size={60} color="#014495" />
                            <Text style={styles.emptyStateTitle}>No Payments Yet</Text>
                            {/* <Text style={styles.emptyStateText}>
                                Payments will appear here once treatments are added
                            </Text> */}
                        </View>
                    )}
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setPaymentAmount('');
                        setPaymentMethod('');
                        setPaymentStage(1);
                        setPaymentModalVisible(true);
                    }}
                >
                    <LinearGradient
                        colors={['#4A90E2', '#357ABD']}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <MaterialIcons name="add" size={24} color="white" />
                        <Text style={styles.addButtonText}>Add Payment</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={paymentModalVisible}
                    onRequestClose={() => setPaymentModalVisible(false)}
                >
                    <View style={styles.modalPaymentOverlay}>
                        <View style={styles.modalPaymentContainer}>
                            {paymentStage === 1 && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Enter Amount</Text>
                                        <TouchableOpacity
                                            onPress={() => setPaymentModalVisible(false)}
                                            style={styles.modalCloseButton}
                                        >
                                            <MaterialIcons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    {/*  <Text style={styles.modalPaymentHeader}>Enter Amount</Text> */}
                                    <TextInput
                                        style={styles.inputPayment}
                                        placeholder="Amount"
                                        keyboardType="numeric"
                                        value={paymentAmount}
                                        onChangeText={setPaymentAmount}
                                    />
                                    <View style={styles.modalFooter}>
                                        <TouchableOpacity
                                            style={styles.cancelButtonTreatment}
                                            onPress={() => setPaymentModalVisible(false)}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={() => setPaymentStage(2)}
                                            disabled={!paymentAmount}
                                        >

                                            <Text style={styles.saveButtonText}>Next</Text>

                                        </TouchableOpacity>
                                    </View>
                                    {/* <Button title="Next" onPress={() => setPaymentStage(2)} disabled={!paymentAmount} /> */}
                                </>
                            )}
                            {paymentStage === 2 && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Select Payment Method</Text>
                                        <TouchableOpacity
                                            onPress={() => setPaymentModalVisible(false)}
                                            style={styles.modalCloseButton}
                                        >
                                            <MaterialIcons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    {/*  <Text style={styles.modalPaymentHeader}>Select Payment Method</Text> */}
                                    <Picker
                                        selectedValue={paymentMethod}
                                        onValueChange={(itemValue) => setPaymentMethod(itemValue)}
                                    >
                                        {paymentMethods.map((method) => (
                                            <Picker.Item key={method} label={method} value={method} />
                                        ))}
                                    </Picker>
                                    <View style={styles.modalFooter}>
                                        <TouchableOpacity
                                            style={styles.cancelButtonTreatment}
                                            onPress={() => setPaymentModalVisible(false)}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={() => setPaymentStage(3)}
                                            disabled={!paymentAmount}
                                        >

                                            <Text style={styles.saveButtonText}>Next</Text>

                                        </TouchableOpacity>
                                    </View>
                                    {/*  <Button title="Next" onPress={() => setPaymentStage(3)} disabled={!paymentMethod} /> */}
                                </>
                            )}
                            {paymentStage === 3 && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Confirm Payment</Text>
                                        <TouchableOpacity
                                            onPress={() => setPaymentModalVisible(false)}
                                            style={styles.modalCloseButton}
                                        >
                                            <MaterialIcons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    {/* <Text style={styles.modalPaymentHeader}>Confirm Payment</Text> */}
                                    <Text style={styles.paymentText}>Amount: ${paymentAmount}</Text>
                                    <Text style={styles.paymentText}>Method: {paymentMethod}</Text>
                                    <View style={styles.modalFooter}>
                                        <TouchableOpacity
                                            style={styles.cancelButtonTreatment}
                                            onPress={() => setPaymentModalVisible(false)}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={handleAddPayment}
                                            disabled={!paymentAmount}
                                        >

                                            <Text style={styles.saveButtonText}>Confirm</Text>

                                        </TouchableOpacity>
                                    </View>
                                    {/*  <Button title="Confirm" onPress={handleAddPayment} />
                                    <Button title="Cancel" onPress={() => setPaymentModalVisible(false)} /> */}
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        );
    };



    return (
        <View style={styles.container}>
            <Animatable.View
                animation="fadeInDown"
                duration={800}
                style={styles.header}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#014495" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Client Card</Text>
                <View style={{ width: 40 }} />
            </Animatable.View>

            <TabBar
                activeTab={activeTab}
                handlePageChange={handlePageChange}
                animatedIndicatorStyle={animatedIndicatorStyle}
            />

            <PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={0}
                onPageSelected={onPageSelected}
            >
                {/* Profile Tab */}
                <View key="1" style={styles.page}>
                    <ScrollView showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps={"handled"}
                    >
                        <Animatable.View
                            animation="fadeIn"
                            duration={1000}
                            style={styles.profileContainer}
                        >
                            <Animatable.View
                                animation="bounceIn"
                                duration={1500}
                                style={styles.avatarContainer}
                            >
                                <Image
                                    source={
                                        clientDetails.gender === 'male'
                                            ? require("../../assets/maleIcon.png")
                                            : require('../../assets/femaleIcon.png')
                                    }
                                    style={styles.avatarImage}
                                />
                            </Animatable.View>
                            <TouchableOpacity onPress={() => { setFirstName(clientDetails.name); setLastName(clientDetails.lastName); openNameModal() }}>

                                <Animatable.Text
                                    animation="fadeInUp"
                                    delay={300}
                                    style={styles.clientName}

                                >
                                    {`${clientDetails.name} ${clientDetails.lastName}`}
                                </Animatable.Text>
                            </TouchableOpacity>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={nameModalVisible}
                                onRequestClose={() => setNameModalVisible(false)}
                            >
                                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                    <View style={styles.modalNameOverlay}>

                                        <KeyboardAvoidingView
                                            style={styles.modalNameContainer}
                                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Adjust behavior based on platform
                                            keyboardVerticalOffset={100} // Adjust this value based on your header height
                                        >
                                            <Animatable.Text style={styles.labelName} animation="fadeIn" duration={500}>
                                                First Name
                                            </Animatable.Text>
                                            {/* <Animatable.Text style={styles.descriptionName} animation="fadeIn" duration={500}>
                                            Please enter the client's first name.
                                        </Animatable.Text> */}
                                            <Animatable.View animation="fadeInUp" duration={500}>
                                                <TextInput
                                                    ref={firstNameInputRef}
                                                    style={[styles.inputName, { textAlign: firstName && /^[\u0590-\u05FF]/.test(firstName[0]) ? 'right' : 'left' }]} // Conditional text alignment
                                                    placeholder="First Name"
                                                    value={firstName}
                                                    onChangeText={setFirstName}
                                                />
                                                {firstName === "" && (
                                                    <Animatable.Text style={styles.validationNameText} animation="shake" duration={500}>
                                                        First name cannot be empty.
                                                    </Animatable.Text>
                                                )}
                                            </Animatable.View>

                                            <Animatable.Text style={styles.labelName} animation="fadeIn" duration={500}>
                                                Last Name
                                            </Animatable.Text>
                                            {/*  <Animatable.Text style={styles.descriptionName} animation="fadeIn" duration={500}>
                                            Please enter the client's last name.
                                        </Animatable.Text> */}
                                            <Animatable.View animation="fadeInUp" duration={500}>
                                                <TextInput

                                                    style={[styles.inputName, { textAlign: lastName && /^[\u0590-\u05FF]/.test(lastName[0]) ? 'right' : 'left' }]} // Conditional text alignment
                                                    placeholder="Last Name"
                                                    value={lastName}
                                                    onChangeText={setLastName}
                                                />
                                                {lastName === "" && (
                                                    <Animatable.Text style={styles.validationNameText} animation="shake" duration={500}>
                                                        Last name cannot be empty.
                                                    </Animatable.Text>
                                                )}
                                            </Animatable.View>
                                            <View style={styles.buttonNameContainer}>
                                                <TouchableOpacity
                                                    style={styles.cancelNameButton}
                                                    onPress={() => setNameModalVisible(false)}
                                                >
                                                    <Text style={styles.buttonNameText}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.saveButtonNameContainer, firstName === "" || lastName === "" && styles.disabledNameButton]}
                                                    onPress={() => handleSaveName(clientDetails._id)}
                                                    disabled={isFullNameSaving} // Disable button while saving
                                                >
                                                    {isFullNameSaving ? (
                                                        <ActivityIndicator size="small" color="white" />
                                                    ) : (
                                                        <Text style={styles.buttonNameText}>Save</Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </KeyboardAvoidingView>

                                    </View>
                                </TouchableWithoutFeedback>
                            </Modal>

                            <View style={styles.statsContainer}>
                                {[
                                    {
                                        label: 'Age',
                                        value: calculateAge(clientDetails.birthday),
                                        icon: 'cake',
                                        // isEditable: true
                                    },
                                    {
                                        label: 'Price',
                                        value: clientDetails.clientPrice ?
                                            Math.min(Number(clientDetails.clientPrice), 99999).toString() :
                                            '-',
                                        icon: 'attach-money'
                                    },
                                    {
                                        label: 'Insurance',
                                        value: clientDetails.insuranceInfo ?
                                            clientDetails.insuranceInfo.slice(0, 20) :
                                            '-',
                                        icon: 'health-and-safety'
                                    },
                                    {
                                        label: 'Meetings',
                                        value: clientDetails.numberOfMeetings ?
                                            Math.min(Number(clientDetails.numberOfMeetings), 9999).toString() :
                                            '-',
                                        icon: 'event'
                                    }
                                ].map((stat, index) => (
                                    <TouchableOpacity
                                        key={stat.label}
                                        onPress={() => stat.label === 'Age' ? setShowAgeDatePicker(true) : handleStatPress(stat.label)}
                                        style={[styles.statItemWrapper, { flex: stat.label === 'Insurance' ? 1.2 : 1 }]}
                                    >
                                        <Animatable.View
                                            animation="fadeInUp"
                                            delay={500 + (index * 100)}
                                            style={[
                                                styles.statItem,
                                                stat.isEditable && styles.editableStatItem
                                            ]}
                                        >
                                            <MaterialIcons name={stat.icon} size={24} color="#014495" />
                                            <Text
                                                style={[
                                                    styles.statValue,
                                                    (stat.label === 'Insurance' || stat.label === 'Meetings') && styles.insuranceValue
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {stat.value}
                                            </Text>
                                            <Text numberOfLines={1} style={styles.statLabel}>{stat.label}</Text>
                                            {stat.isEditable && (
                                                <View style={styles.editIndicator}>
                                                    <MaterialIcons name="edit" size={16} color="#014495" />
                                                </View>
                                            )}
                                        </Animatable.View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animatable.View>
                        <ClientDescription clientDetails={clientDetails} />
                        <ParentsSection clientDetails={clientDetails} refreshClient={fetchClientData} />
                    </ScrollView>
                </View>

                {/* Treatments Tab */}
                <View key="2" style={styles.page}>
                    <View style={styles.treatmentsContainer}>
                        {loading ? (
                            renderSkeletonLoading()
                        ) : (
                            <>
                                <Text style={{}}>{treatments.length}\{clientDetails.numberOfMeetings} treatments</Text>
                                <FlatList
                                    data={treatments}
                                    renderItem={({ item, index }) => (
                                        <Animatable.View
                                            animation="fadeInUp"
                                            delay={index * 100}
                                            style={styles.treatmentCard}
                                        >
                                            <View style={styles.treatmentHeader}>
                                                <TouchableOpacity onPress={() => { setSelectedDate(new Date(item.treatmentDate)); setSelectedTreatmentId(item._id); setDateTimeModalVisible(true) }}>
                                                    <View style={styles.treatmentDateTime}>
                                                        <View style={styles.treatmentDate}>
                                                            <MaterialIcons name="event" size={20} color="#014495" />
                                                            <Text style={styles.dateText}>
                                                                {new Date(item.treatmentDate).toLocaleDateString()}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.treatmentTime}>
                                                            <MaterialIcons name="access-time" size={20} color="#014495" />
                                                            <Text style={styles.timeText}>
                                                                {formatTime(item.treatmentDate)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => { item.treatmentPrice ? setPrice(item.treatmentPrice) : setPrice(clientDetails.clientPrice); setSelectedTreatmentId(item._id); openEditPriceModal() }}>
                                                    <View style={styles.treatmentPrice}>
                                                        <MaterialIcons name="attach-money" size={20} color="#014495" />
                                                        <Text style={styles.priceText}>
                                                            ${item.treatmentPrice ? item.treatmentPrice : clientDetails.clientPrice ? clientDetails.clientPrice : 'N/A'}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                                <Modal
                                                    animationType="slide"
                                                    transparent={true}
                                                    visible={editPriceModalVisible}
                                                    onRequestClose={() => setEditPriceModalVisible(false)}
                                                >
                                                    <View style={styles.modalOverlay}>
                                                        <View style={styles.modalEditPriceContainer}>
                                                            <Text style={styles.modalEditPriceHeader}>Edit Price</Text>
                                                            <TextInput
                                                                ref={priceInputRef}
                                                                style={styles.priceInput}
                                                                placeholder="Enter new price"
                                                                keyboardType="numeric"
                                                                value={price ? price.toString() : ''}
                                                                onChangeText={(text) => handlePriceChange(text, item._id)}
                                                            />
                                                            <View style={styles.buttonEditPriceContainer}>
                                                                <Button title="Cancel" onPress={() => setEditPriceModalVisible(false)} color="#FF3D00" />
                                                                <Button title="Save" onPress={() => handleSavePrice(item._id)} color="#014495" />
                                                            </View>
                                                        </View>
                                                    </View>
                                                </Modal>
                                                <Modal
                                                    animationType="slide"
                                                    transparent={true}
                                                    visible={dateTimeModalVisible}
                                                    onRequestClose={() => setDateTimeModalVisible(false)}
                                                >
                                                    <View style={styles.modalOverlay}>
                                                        <View style={styles.modalDateTimeContainer}>
                                                            <Text style={styles.modalDateTimeHeader}>Update Date and Time</Text>
                                                            <DateTimePicker
                                                                value={selectedDate}
                                                                mode="datetime"
                                                                display="default"
                                                                onChange={handleDateChange}
                                                                confirmBtnText="confirm"
                                                                cancelBtnText="dismiss"
                                                            />
                                                            <View style={styles.buttonDateTimeContainer}>
                                                                <Button title="Cancel" onPress={() => setDateTimeModalVisible(false)} color="#FF3D00" />
                                                                <View style={styles.saveDateTimeButtonContainer}>
                                                                    {isSaving ? (
                                                                        <ActivityIndicator size="small" color="#014495" />
                                                                    ) : (
                                                                        <Button title="Save" onPress={() => handleSaveDateTime(item._id)} color="#014495" />
                                                                    )}
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </Modal>
                                                <View style={styles.headerActions}>
                                                    <Text style={styles.sessionNumber}>Session #{treatments.length - index}</Text>
                                                    <TouchableOpacity
                                                        style={styles.deleteButton}
                                                        onPress={() => {
                                                            setTreatmentToDelete(item._id);
                                                            setDeleteModalVisible(true);
                                                        }}
                                                    >
                                                        <MaterialIcons name="delete-outline" size={24} color="#FF4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            <DeleteConfirmationModal
                                                visible={deleteModalVisible}
                                                onClose={handleCloseDeleteModal}
                                                onDelete={handleDeleteTreatment}
                                            />
                                            <View style={styles.treatmentContent}>
                                                <TouchableOpacity
                                                    style={styles.editableField}
                                                    onPress={() => handleEditField(item._id, 'treatmentSummary')}
                                                >
                                                    <Text style={styles.fieldLabel}>Treatment Summary</Text>
                                                    <Text style={[
                                                        styles.fieldValue,
                                                        { textAlign: /^[\u0590-\u05FF]/.test(item.treatmentSummary) ? 'right' : 'left' }
                                                    ]}>
                                                        {item.treatmentSummary || 'Add summary...'}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.editableField}
                                                    onPress={() => handleEditField(item._id, 'whatNext')}
                                                >
                                                    <Text style={styles.fieldLabel}>Next Steps</Text>
                                                    <Text style={[
                                                        styles.fieldValue,
                                                        { textAlign: /^[\u0590-\u05FF]/.test(item.whatNext) ? 'right' : 'left' }
                                                    ]}>
                                                        {item.whatNext || 'Add next steps...'}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.editableField}
                                                    onPress={() => handleEditField(item._id, 'homework')}
                                                >
                                                    <Text style={styles.fieldLabel}>Homework</Text>
                                                    <Text style={[
                                                        styles.fieldValue,
                                                        { textAlign: /^[\u0590-\u05FF]/.test(item.homework) ? 'right' : 'left' }
                                                    ]}>
                                                        {item.homework || 'Add homework...'}
                                                    </Text>
                                                </TouchableOpacity>

                                                <View style={styles.paymentSection}>
                                                    <View
                                                        style={[styles.paymentStatus, {
                                                            backgroundColor: PAYMENT_STATUSES[treatmentPaid[index]]?.color + '20' || '#FFF3E0'
                                                        }]}
                                                    >
                                                        <MaterialIcons
                                                            name={PAYMENT_STATUSES[treatmentPaid[index]]?.icon || 'schedule'}
                                                            size={16}
                                                            color={PAYMENT_STATUSES[treatmentPaid[index]]?.color || '#FF9800'}
                                                        />
                                                        <Text style={[styles.statusText, { color: PAYMENT_STATUSES[treatmentPaid[index]]?.color || '#FF9800' }]}>
                                                            {treatmentPaid[index]}
                                                        </Text>
                                                        {/* <Text>{treatmentPaid[index]}</Text> */}
                                                    </View>


                                                    {/* <TouchableOpacity
                                                        style={[styles.paymentStatus, {
                                                            backgroundColor: PAYMENT_STATUSES[item.paymentStatus]?.color + '20' || '#FFF3E0'
                                                        }]}
                                                        onPress={() => handleStatusModalOpen(item._id)}
                                                    >
                                                        <MaterialIcons
                                                            name={PAYMENT_STATUSES[item.paymentStatus]?.icon || 'schedule'}
                                                            size={16}
                                                            color={PAYMENT_STATUSES[item.paymentStatus]?.color || '#FF9800'}
                                                        />
                                                        <Text style={[styles.statusText, { color: PAYMENT_STATUSES[item.paymentStatus]?.color || '#FF9800' }]}>
                                                            {PAYMENT_STATUSES[item.paymentStatus]?.label || 'Set status'}
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={styles.paymentMethod}
                                                        onPress={() => handleMethodModalOpen(item._id)}
                                                    >
                                                        <MaterialIcons
                                                            name={PAYMENT_METHODS[item.PaymentMethod]?.icon || 'payment'}
                                                            size={16}
                                                            color="#014495"
                                                        />
                                                        <Text style={styles.methodText}>
                                                            {item.PaymentMethod === 'OTHER' ? item.otherPaymentMethod :
                                                                PAYMENT_METHODS[item.PaymentMethod]?.label || 'Set method'}
                                                        </Text>
                                                    </TouchableOpacity> */}
                                                </View>
                                            </View>
                                        </Animatable.View>
                                    )}
                                    keyExtractor={(item) => item._id}
                                    contentContainerStyle={styles.treatmentsList}
                                    showsVerticalScrollIndicator={false}
                                    ListEmptyComponent={() => (
                                        <View style={styles.emptyState}>
                                            <MaterialIcons name="medical-services" size={60} color="#014495" />
                                            <Text style={styles.emptyStateTitle}>No Treatments Yet</Text>
                                            <Text style={styles.emptyStateText}>
                                                Add your first treatment to start tracking progress
                                            </Text>
                                        </View>
                                    )}
                                />
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => setModalVisible(true)}
                                    activeOpacity={0.7}
                                >
                                    <LinearGradient
                                        colors={['#4A90E2', '#357ABD']}
                                        style={styles.gradientButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <MaterialIcons name="add" size={24} color="white" />
                                        <Text style={styles.addButtonText}>Add Treatment</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                {/* Payments Tab */}
                <View key="3" style={styles.page}>
                    <PaymentsList treatments={treatments} payments={clientPayments} clientId={clientId} userId={user._id} />
                </View>
            </PagerView>

            {/* Add Treatment Modal */}
            <AddTreatmentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSaveTreatment}
                treatment={newTreatment}
                setTreatment={setNewTreatment}
            />

            <ClientEditModal
                visible={clientEditModalVisible}
                onClose={() => setClientEditModalVisible(false)}
                onSave={handleSaveStatEdit}
                editingStat={editingStat}
                editValue={editValue}
                setEditValue={setEditValue}
            />

            <TreatmentEditModal
                visible={treatmentEditModalVisible}
                onClose={() => setTreatmentEditModalVisible(false)}
                onSave={handleSaveTreatmentEdit}
                editingStat={editingStat}
                editValue={editValue}
                setEditValue={setEditValue}
            />

            <Modal
                visible={showAgeDatePicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAgeDatePicker(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >

                    <TouchableWithoutFeedback onPress={() => setShowAgeDatePicker(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                                <Animatable.View
                                    animation="zoomIn"
                                    duration={300}
                                    style={[
                                        styles.editModalContainer,
                                        { maxHeight: windowHeight * 0.5 } // Reduced from 0.4 to 0.3
                                    ]}
                                >
                                    <View style={styles.editModalHeader}>
                                        <MaterialIcons name="cake" size={24} color="#014495" />
                                        <Text style={styles.editModalTitle}>Edit Birthday</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowAgeDatePicker(false)}
                                            style={styles.editModalCloseButton}
                                        >
                                            <MaterialIcons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>


                                    <View style={styles.modalBody}>
                                        {Platform.OS === 'ios' ? (
                                            <DateTimePicker
                                                value={tempBirthday}
                                                mode="date"
                                                display="spinner"
                                                onChange={(event, selectedDate) => {
                                                    if (selectedDate) {
                                                        setTempBirthday(selectedDate);
                                                    }
                                                }}
                                                maximumDate={new Date()}
                                            />
                                        ) : (
                                            <DateTimePicker
                                                value={tempBirthday}
                                                mode="date"
                                                display="default"
                                                onChange={(event, selectedDate) => {
                                                    if (event.type === 'set' && selectedDate) {
                                                        setTempBirthday(selectedDate);
                                                    }
                                                }}
                                                maximumDate={new Date()}
                                            />
                                        )}
                                    </View>

                                    <View style={styles.editModalFooter}>
                                        <TouchableOpacity
                                            style={styles.editModalCancelButton}
                                            onPress={() => setShowAgeDatePicker(false)}
                                        >
                                            <Text style={styles.editModalCancelText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.editModalSaveButton, isSavingAge && styles.modalSaveButtonDisabled]}
                                            onPress={handleSaveAge}
                                            disabled={isSavingAge}
                                        >
                                            {isSavingAge ? (
                                                <ActivityIndicator color="white" size="small" />
                                            ) : (
                                                <Text style={styles.editModalSaveText}>Save</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </Animatable.View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            {/* Add these modals outside of the FlatList but inside the main View */}
            <PaymentStatusModal
                visible={statusModalVisible}
                onClose={() => {
                    setStatusModalVisible(false);
                    setSelectedTreatmentId(null);
                }}
                currentStatus={treatments.find(t => t._id === selectedTreatmentId)?.paymentStatus}
                onSelect={handleStatusSelect}
            />

            <PaymentMethodModal
                visible={methodModalVisible}
                onClose={() => {
                    setMethodModalVisible(false);
                    setSelectedTreatmentId(null);
                }}
                currentMethod={treatments.find(t => t._id === selectedTreatmentId)?.PaymentMethod}
                onSelect={handleMethodSelect}
                onOtherMethodChange={handleOtherMethodChange}
            />
        </View>
    );
}

const AddTreatmentModal = ({ visible, onClose, onSave, treatment, setTreatment }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave();
        setIsSaving(false);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <Animatable.View
                            animation="slideInUp"
                            duration={300}
                            style={styles.modalContainer}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add Treatment</Text>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={styles.modalCloseButton}
                                >
                                    <MaterialIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalContent}>
                                <View style={styles.dateTimeContainer}>
                                    <View
                                        style={[styles.datePickerButton, { flex: 1, marginRight: 10, }]}
                                    // onPress={() => setShowDatePicker(true)}
                                    >
                                        {/* <MaterialIcons name="event" size={24} color="#014495" />
                                        <Text style={styles.datePickerText}>
                                            {treatment.treatmentDate.toLocaleDateString()}
                                        </Text> */}
                                        <DateTimePicker
                                            value={treatment.treatmentDate}
                                            mode="date"
                                            display="inline"
                                            onChange={(event, selectedDate) => {
                                                setShowDatePicker(false);
                                                if (selectedDate) {
                                                    setTreatment({
                                                        ...treatment,
                                                        treatmentDate: selectedDate
                                                    });
                                                }
                                            }}
                                        />
                                    </View>

                                    <View
                                        style={[styles.datePickerButton, { flex: 1 }]}
                                    // onPress={() => setShowTimePicker(true)}
                                    >
                                        {/*  <MaterialIcons name="access-time" size={24} color="#014495" />
                                        <Text style={styles.datePickerText}>
                                            {formatTime(treatment.treatmentTime)}
                                        </Text> */}
                                        <DateTimePicker
                                            value={treatment.treatmentTime}
                                            mode="time"
                                            display="calendar"
                                            onChange={(event, selectedTime) => {
                                                setShowTimePicker(false);
                                                if (selectedTime) {
                                                    setTreatment({
                                                        ...treatment,
                                                        treatmentTime: selectedTime
                                                    });
                                                }
                                            }}
                                        />
                                    </View>
                                </View>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={treatment.treatmentDate}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(false);
                                            if (selectedDate) {
                                                setTreatment({
                                                    ...treatment,
                                                    treatmentDate: selectedDate
                                                });
                                            }
                                        }}
                                    />
                                )}

                                {showTimePicker && (
                                    <DateTimePicker
                                        value={treatment.treatmentTime}
                                        mode="time"
                                        display="default"
                                        onChange={(event, selectedTime) => {
                                            setShowTimePicker(false);
                                            if (selectedTime) {
                                                setTreatment({
                                                    ...treatment,
                                                    treatmentTime: selectedTime
                                                });
                                            }
                                        }}
                                    />
                                )}

                                {/* <Text style={styles.inputLabel}>Treatment Summary</Text>
                                <TextInput
                                    style={styles.textArea}
                                    multiline
                                    numberOfLines={4}
                                    value={treatment.treatmentSummary}
                                    onChangeText={(text) =>
                                        setTreatment({ ...treatment, treatmentSummary: text })
                                    }
                                    placeholder="Describe the treatment..."
                                />

                                <Text style={styles.inputLabel}>Next Steps</Text>
                                <TextInput
                                    style={styles.textArea}
                                    multiline
                                    numberOfLines={4}
                                    value={treatment.whatNext}
                                    onChangeText={(text) =>
                                        setTreatment({ ...treatment, whatNext: text })
                                    }
                                    placeholder="What's next..."
                                />

                                <Text style={styles.inputLabel}>Payment Status</Text>
                                <View style={styles.paymentStatusSelector}>
                                    {['paid', 'pending'].map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[
                                                styles.statusOption,
                                                treatment.paymentStatus === status &&
                                                styles.statusOptionActive
                                            ]}
                                            onPress={() =>
                                                setTreatment({ ...treatment, paymentStatus: status })
                                            }
                                        >
                                            <MaterialIcons
                                                name={status === 'paid' ? 'check-circle' : 'schedule'}
                                                size={20}
                                                color={treatment.paymentStatus === status ?
                                                    'white' : '#666'}
                                            />
                                            <Text style={[
                                                styles.statusOptionText,
                                                treatment.paymentStatus === status &&
                                                styles.statusOptionTextActive
                                            ]}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View> */}
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.cancelButtonTreatment}
                                    onPress={onClose}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                    onPress={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </Animatable.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const TabBar = ({ activeTab, handlePageChange, animatedIndicatorStyle }) => (
    <View style={styles.tabBarContainer}>
        {['Profile', 'Treatments', 'Payments'].map((tab, index) => (
            <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => handlePageChange(index)}
            >
                <Animatable.View
                    animation={activeTab === index ? 'pulse' : undefined}
                    style={styles.tabContent}
                >
                    <MaterialIcons
                        name={
                            index === 0 ? 'person' :
                                index === 1 ? 'medical-services' :
                                    'payments'
                        }
                        size={24}
                        color={activeTab === index ? '#014495' : '#666'}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === index && styles.activeTabText
                    ]}>
                        {tab}
                    </Text>
                </Animatable.View>
            </TouchableOpacity>
        ))}
        <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
    </View>
);

const ClientProfile = ({ clientDetails }) => (
    <Animatable.View
        animation="fadeIn"
        duration={1000}
        style={styles.profileContainer}
    >
        <Animatable.View
            animation="bounceIn"
            duration={1500}
            style={styles.avatarContainer}
        >
            <Image
                source={
                    clientDetails.gender === 'male'
                        ? require("../../assets/maleIcon.png")
                        : require('../../assets/femaleIcon.png')
                }
                style={styles.avatarImage}
            />
        </Animatable.View>

        <Animatable.Text
            animation="fadeInUp"
            delay={300}
            style={styles.clientName}
        >
            {`${clientDetails.name} ${clientDetails.lastName}`}
        </Animatable.Text>

        <View style={styles.statsContainer}>
            {[
                { label: 'Age', value: calculateAge(clientDetails.birthday), icon: 'cake' },
                { label: 'Price', value: clientDetails.clientPrice || '-', icon: 'attach-money' },
                { label: 'Insurance', value: clientDetails.insuranceInfo || '-', icon: 'health-and-safety' },
                { label: 'Meetings', value: clientDetails.numberOfMeetings || '-', icon: 'event' }
            ].map((stat, index) => (
                <Animatable.View
                    key={stat.label}
                    animation="fadeInUp"
                    delay={500 + (index * 100)}
                    style={styles.statItem}
                >
                    <MaterialIcons name={stat.icon} size={24} color="#014495" />
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                </Animatable.View>
            ))}
        </View>
    </Animatable.View>
);









const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#014495',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },

    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        // marginHorizontal: 15,
        marginVertical: 10,
        borderRadius: 15,
        height: 60,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContent: {
        alignItems: 'center',
    },
    tabText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    activeTabText: {
        color: '#014495',
        fontWeight: '600',
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        width: windowWidth / 3,
        backgroundColor: '#014495',
        borderRadius: 1.5,
    },
    profileContainer: {
        padding: 20,
        alignItems: 'center',
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'white',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    clientName: {
        fontSize: moderateScale(28),
        fontWeight: 'bold',
        color: '#014495',
        textAlign: 'center',
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        // marginHorizontal: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#014495',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    descriptionContainer: {
        backgroundColor: 'white',
        margin: 15,
        padding: 20,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    descriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#014495',
        marginLeft: 10,
    },
    descriptionText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    treatmentsContainer: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    treatmentsList: {
        padding: 15,
        paddingBottom: 80, // Space for FAB
    },
    treatmentCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    treatmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    treatmentDateTime: {
        flexDirection: 'column',
        gap: 4,
    },
    treatmentDate: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    treatmentTime: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
    },
    dateText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    timeText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    paymentText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333', // Dark gray for better readability
        marginVertical: 8, // Space between lines
        padding: 10, // Padding around text
        backgroundColor: '#f9f9f9', // Light background for contrast
        borderRadius: 8, // Rounded corners
        shadowColor: '#000', // Shadow for depth
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2, // Elevation for Android
    },
    paymentStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        borderRadius: 20,
    },
    statusText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '500',
    },
    treatmentContent: {
        padding: 15,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    summaryText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 15,
    },
    nextStepsLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    nextStepsText: {
        fontSize: 16,
        color: '#333',
    },
    paymentsContainer: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    paymentsSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryCard: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#014495',
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    paymentsList: {
        padding: 15,
        paddingBottom: 80, // Space for FAB
    },
    paymentCard: {
        /* backgroundColor: 'white',
        borderRadius: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4, */
        padding: 15,
        marginVertical: 8,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    paymentDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    paymentDateText2: {
        fontSize: 14,
        color: '#014495',
        fontWeight: '500',
    },
    paymentDateText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    paymentAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#014495',
        marginLeft: 8,
    },
    paymentDetails: {
        padding: 15,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    paymentSummary: {
        fontSize: 16,
        color: '#333',
        marginBottom: 15,
    },
    paymentStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        borderRadius: 20,
    },
    paymentStatusText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContainer: {
        backgroundColor: 'white',
        width: windowWidth * 0.9,
        // height: windowHeight * 0.8,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#014495',
    },
    modalCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    modalContent: {
        padding: 20,
    },
    dateTimeContainer: {
        flexDirection: 'column',
    },
    /*  dateTimeContainer: {
         flexDirection: 'row',
         justifyContent: 'space-between',
         marginBottom: 10,
     }, */
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 10,
    },
    datePickerText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
    },
    paymentStatusSelector: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    statusOption: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 10,
    },
    statusOptionActive: {
        borderColor: '#014495',
    },
    statusOptionText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    statusOptionTextActive: {
        color: '#014495',
        fontWeight: '600',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: 'white'
        // backgroundColor: "yellow"
    },
    cancelButtonTreatment: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F0F4F8',
        marginRight: 12,

    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
    },
    saveButton: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#014495',
        minWidth: 100,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    saveButtonText: {
        fontSize: 16,
        color: 'white',
    },
    pagerView: { flex: 1 },
    editModalInputError: {
        borderColor: '#FF4444',
    },
    errorText: {
        color: '#FF4444',
        fontSize: 14,
        marginTop: 4,
    },
    statItemWrapper: {
        flex: 1,
    },
    editableStatItem: {
        position: 'relative',
        backgroundColor: '#F8F9FF',
        borderWidth: 1,
        borderColor: '#E0E7FF',
        borderRadius: 12,
        padding: 12,
    },
    editIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#E0E7FF',
        borderRadius: 12,
        padding: 4,
    },
    editModalContainer: {
        backgroundColor: 'white',
        width: windowWidth * 0.9,
        maxHeight: windowHeight * 0.7, // Limit the height
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    editModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    editModalTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#014495',
        marginLeft: 12,
    },
    editModalCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    editModalContent: {
        padding: 20,
        maxHeight: windowHeight * 0.4, // Limit content height
    },
    editModalLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    editModalInput: {
        borderWidth: 1,
        borderColor: '#E0E7FF',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#F8F9FF',
    },
    editModalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: 'white', // Ensure the background is white
    },
    editModalCancelButton: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F0F4F8',
        marginRight: 12,
    },
    editModalCancelText: {
        fontSize: 16,
        color: '#666',
    },
    editModalSaveButton: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#014495',
        minWidth: 100,
        alignItems: 'center',
    },
    editModalSaveButtonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    editModalSaveText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
    },
    descriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        justifyContent: 'space-between',
    },
    editDescriptionButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    descriptionModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    descriptionModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    descriptionModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    descriptionModalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#014495',
    },
    descriptionModalClose: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    descriptionInput: {
        borderWidth: 1,
        borderColor: '#E0E7FF',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#F8F9FF',
        minHeight: 150,
        marginBottom: 20,
    },
    saveDescriptionButton: {
        backgroundColor: '#014495',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    saveDescriptionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    ageDatePickerContainer: {
        backgroundColor: 'white',
        width: windowWidth * 0.9,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    ageDatePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    ageDatePickerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#014495',
    },
    ageDatePickerCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    datePickerWrapper: {
        padding: 20,
        borderWidth: 1,
        borderColor: '#E0E7FF',
        borderRadius: 12,
        marginBottom: 20,
    },
    ageDatePickerFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    /*  addButton: {
         flexDirection: 'row',
         alignItems: 'center',
         // backgroundColor: '#2196F3', // Material Design blue
         paddingVertical: 12,
         paddingHorizontal: 20,
         borderRadius: 25,
         elevation: 3, // Android shadow
         shadowColor: '#000', // iOS shadow
         shadowOffset: {
             width: 0,
             height: 2,
         },
         shadowOpacity: 0.25,
         shadowRadius: 3.84,
         gap: 8, // Space between icon and text
     },
     addButtonText: {
         color: 'white',
         fontSize: 16,
         fontWeight: '600',
         marginLeft: 4,
     },
     gradientButton: {
         flexDirection: 'row',
         alignItems: 'center',
         justifyContent: 'center',
         paddingVertical: 12,
         paddingHorizontal: 20,
         borderRadius: 25,
         elevation: 3, // Android shadow
         shadowColor: '#000', // iOS shadow
         shadowOffset: {
             width: 0,
             height: 2,
         },
         shadowOpacity: 0.25,
         shadowRadius: 3.84,
     }, */
    addButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#4A90E2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    editableField: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    fieldLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    fieldValue: {
        fontSize: 16,
        color: '#333',
    },
    paymentSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    paymentMethod: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    methodText: {
        fontSize: 14,
        color: '#666',
    },
    sessionNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#014495',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deleteButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#FFF5F5',
    },
    deleteModalContainer: {
        backgroundColor: 'white',
        width: windowWidth * 0.85,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    deleteModalContent: {
        padding: 24,
        alignItems: 'center',
    },
    deleteIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFF5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteModalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    deleteModalText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    deleteModalActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    deleteModalActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#F0F0F0',
    },
    confirmDeleteButton: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#FF4444',
        borderBottomRightRadius: 20,
    },
    confirmDeleteText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
    },
    editModalContainerLarge: {
        maxHeight: windowHeight * 0.6, // Increased height for long text fields
    },
    editModalInputMultiline: {
        height: 150,
        textAlignVertical: 'top',
        paddingTop: 12,
        paddingBottom: 12,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#FF4444',
        textAlign: 'center',
    },
    longTextFieldContainer: {
        padding: 12,
        backgroundColor: '#F8F9FF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    fieldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#014495',
    },
    longTextValue: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        minHeight: 48,
    },
    placeholderText: {
        color: '#999',
        fontStyle: 'italic',
    },
    paymentModalContainer: {
        backgroundColor: 'white',
        width: windowWidth * 0.9,
        maxHeight: windowHeight * 0.7,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    paymentModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    paymentModalTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#014495',
        marginLeft: 12,
    },
    paymentModalContent: {
        padding: 15,
    },
    paymentOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F8F9FF',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    paymentOptionButtonActive: {
        backgroundColor: '#EBF2FF',
        borderColor: '#014495',
    },
    paymentOptionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
    },
    paymentOptionTextActive: {
        color: '#014495',
        fontWeight: '600',
    },
    otherMethodInput: {
        marginTop: 8,
        padding: 15,
        backgroundColor: '#F8F9FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    otherMethodTextInput: {
        fontSize: 16,
        color: '#333',
        padding: 8,
    },
    modalDateTimeContainer: {
        width: '80%', // Adjust width as needed
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        elevation: 5, // Shadow effect for Android
        shadowColor: '#000', // Shadow effect for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalDateTimeHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#014495',
    },
    buttonDateTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    saveDateTimeButtonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalNameOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalNameContainer: {
        width: '80%', // Adjust width as needed
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        elevation: 5, // Shadow effect for Android
        shadowColor: '#000', // Shadow effect for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalNameHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#014495',
    },
    inputName: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    buttonNameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    saveButtonNameContainer: {
        backgroundColor: '#014495',
        borderRadius: 5,
        padding: 10,
        flex: 1,
        alignItems: 'center',
    },
    cancelNameButton: {
        backgroundColor: '#FF3D00',
        borderRadius: 5,
        padding: 10,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    buttonNameText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledNameButton: {
        backgroundColor: '#CCCCCC', // Grey out the button when disabled
    },
    labelName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    descriptionName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    validationNameText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 10,
    },
    editPriceModalContainer: {
        backgroundColor: 'white',
        width: windowWidth * 0.9,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    editPriceModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    editPriceModalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#014495',
    },
    editPriceModalCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    priceInput: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#E0E7FF',
        borderRadius: 12,
        marginBottom: 20,
    },
    buttonEditPriceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    buttonEditPrice: {
        backgroundColor: '#014495',
        borderRadius: 5,
        padding: 10,
        flex: 1,
        alignItems: 'center',
    },
    buttonEditPriceText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledEditPriceButton: {
        backgroundColor: '#CCCCCC', // Grey out the button when disabled
    },
    validationEditPriceText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 10,
    },
    modalEditPriceContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    treatmentPrice: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    priceText: {
        marginLeft: 5,
        fontSize: 16,
        fontWeight: '600',
        color: '#014495',
    },
    modalPaymentOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalPaymentContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxHeight: '90%',
    },
    modalPaymentHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    inputPayment: {
        height: 40,
        borderColor: '#E0E7FF',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        color: '#333',
    },
    /*  gradientButton: {
         padding: 10,
         borderRadius: 5,
         justifyContent: 'center',
         alignItems: 'center',
         width: '100%',
     },
     addButtonText: {
         color: 'white',
         fontSize: 16,
         fontWeight: 'bold',
     }, */
    modalPaymentHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },

    headerRightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deletePaymentButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#FFF0F0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    paymentAmounts: {
        fontSize: 18,
        fontWeight: '600',
        color: '#014495',
    },
    paymentTimeText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    paymentMethodContainer: {
        marginTop: 10,
        paddingTop: 10,
        // borderTopWidth: 1,
        // borderTopColor: '#eee',
    },
    paymentMethodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
        alignSelf: 'flex-start',
        gap: 6,
    },
    paymentMethodText: {
        color: '#014495',
        fontSize: 14,
        fontWeight: '500',
    },
    deleteAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 10
    },
    deleteActionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
});