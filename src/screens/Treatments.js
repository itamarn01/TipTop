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
    Touchable,
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
import * as ImagePicker from 'expo-image-picker';
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
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image as ImageCompressor } from "react-native-compressor";
import { WebView } from 'react-native-webview';
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from '@expo/vector-icons/AntDesign';
import * as DocumentPicker from "expo-document-picker";
import i18n from "../i18n";

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
    if (birthday === null) return "0:0"
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
                            <Text allowFontScaling={false} style={styles.deleteModalTitle}>{i18n.t('deleteTreatment')}</Text>
                            <Text allowFontScaling={false} style={styles.deleteModalText}>
                                {i18n.t('deleteTreatmentConfirm')}
                            </Text>
                        </View>
                        <View style={styles.deleteModalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                            >
                                <Text allowFontScaling={false} style={styles.cancelButtonText}>{i18n.t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmDeleteButton}
                                onPress={onDelete}
                            >
                                <Text allowFontScaling={false} style={styles.confirmDeleteText}>{i18n.t('delete')}</Text>
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
    const editInputRef = useRef()

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            onShow={() => setTimeout(() => {
                editInputRef.current?.focus();
            }, 100)}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.editModalContainer}>
                                <View style={styles.editModalHeader}>
                                    <MaterialIcons name="edit" size={24} color="#014495" />
                                    <Text allowFontScaling={false} style={styles.editModalTitle}>
                                        {i18n.t('edit')} {getFieldDisplayName(editingStat)}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={onClose}
                                        style={styles.editModalCloseButton}
                                    >
                                        <MaterialIcons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.editModalContent}>
                                    {editingStat === 'Insurance' || editingStat === 'קופ"ח' ? (
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={editValue}
                                                onValueChange={(itemValue) => setEditValue(itemValue)}
                                                style={styles.picker}
                                            >
                                                <Picker.Item label={i18n.t('selectOption')} value="" color="#999" />
                                                <Picker.Item label="כללית" value="כללית" />
                                                <Picker.Item label="מכבי" value="מכבי" />
                                                <Picker.Item label="מאוחדת" value="מאוחדת" />
                                                <Picker.Item label="לאומית" value="לאומית" />
                                                <Picker.Item label={i18n.t('other')} value="אחר" />
                                            </Picker>
                                        </View>
                                    ) : editingStat === 'Meetings' || editingStat === 'מפגשים' ? (
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={editValue}
                                                onValueChange={(itemValue) => setEditValue(itemValue)}
                                                style={styles.picker}
                                            >
                                                {Array.from({ length: 300 }, (_, i) => i + 1).map((number) => (
                                                    <Picker.Item key={number} label={number.toString()} value={number.toString()} />
                                                ))}
                                            </Picker>
                                        </View>
                                    ) : (
                                        <TextInput
                                            ref={editInputRef}
                                            style={styles.editModalInput}
                                            value={editValue}
                                            onChangeText={setEditValue}
                                            keyboardType={editingStat === 'Price' || editingStat === 'Meetings' ? 'numeric' : 'default'}
                                            placeholder={`Enter ${editingStat?.toString().toLowerCase() || ''}`}
                                        />
                                    )}
                                </View>


                                <View style={styles.editModalFooter}>
                                    <TouchableOpacity
                                        style={styles.editModalCancelButton}
                                        onPress={onClose}
                                    >
                                        <Text allowFontScaling={false} style={styles.editModalCancelText}>{i18n.t('cancel')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.editModalSaveButton}
                                        onPress={onSave}
                                    >
                                        <Text allowFontScaling={false} style={styles.editModalSaveText}>{i18n.t('save')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>

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
    const editValueInputRef = useRef()
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
            onShow={() => {
                setTimeout(() => {
                    editValueInputRef.current?.focus();
                }, 100);
            }}
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
                                <Text allowFontScaling={false} style={styles.editModalTitle}>
                                    {i18n.t('editField')} {editingStat?.field ? i18n.t(editingStat.field) : ''}
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
                                    ref={editValueInputRef}
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
                                    placeholder={`${i18n.t('enterFieldPlaceholder')} ${editingStat?.field ? i18n.t(editingStat.field).toLowerCase() : ''}`}
                                />
                            </ScrollView>

                            <View style={styles.editModalFooter}>
                                <TouchableOpacity
                                    style={styles.editModalCancelButton}
                                    onPress={onClose}
                                >
                                    <Text allowFontScaling={false} style={styles.editModalCancelText}>{i18n.t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editModalSaveButton}
                                    onPress={handleSave} // Call the handleSave function
                                    disabled={isSaving} // Disable button while saving
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="white" size="small" /> // Show ActivityIndicator while saving
                                    ) : (
                                        <Text allowFontScaling={false} style={styles.editModalSaveText}>{i18n.t('save')}</Text>
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
    PENDING: { label: 'pending', icon: 'schedule', color: '#FF9800' },
    PAID: { label: 'paid', icon: 'check-circle', color: '#4CAF50' },
    PARTIALLY_PAID: { label: 'partiallyPaid', icon: 'remove-circle-outline', color: '#2196F3' },
    REFUNDED: { label: 'refunded', icon: 'replay', color: '#9C27B0' },
    CANCELLED: { label: 'cancelled', icon: 'cancel', color: '#F44336' }
};

const PAYMENT_METHODS = {
    CASH: { label: 'cash', icon: 'attach-money' },
    CREDIT_CARD: { label: 'creditCard', icon: 'credit-card' },
    DEBIT_CARD: { label: 'debitCard', icon: 'credit-card' },
    BANK_TRANSFER: { label: 'bankTransfer', icon: 'account-balance' },
    INSURANCE: { label: 'insurance', icon: 'health-and-safety' },
    OTHER: { label: 'other', icon: 'more-horiz' }
};

const TREATMENT_STATUSES = {
    PENDING: { label: 'pending', icon: 'schedule', color: '#FF9800' },
    COMPLETED: { label: 'completed', icon: 'check-circle', color: '#4CAF50' },
    CANCELED: { label: 'canceled', icon: 'cancel', color: '#F44336' },
    NO_SHOW: { label: 'noShow', icon: 'cancel', color: '#9C27B0' },
    SCHEDULED: { label: 'scheduled', icon: 'schedule', color: '#FF9800' },
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
                        <Text allowFontScaling={false} style={styles.paymentModalTitle}>{i18n.t('paymentStatus')}</Text>
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
                                <Text allowFontScaling={false} style={[
                                    styles.paymentOptionText,
                                    currentStatus === status && styles.paymentOptionTextActive
                                ]}>
                                    {i18n.t(label)}
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
                            <Text allowFontScaling={false} style={styles.paymentModalTitle}>{i18n.t('paymentMethod')}</Text>
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
                                    <Text allowFontScaling={false} style={[
                                        styles.paymentOptionText,
                                        currentMethod === method && styles.paymentOptionTextActive
                                    ]}>
                                        {i18n.t(label)}
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
                                        placeholder={i18n.t('specifyPaymentMethod')}
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

const ClientDescription = ({ clientDetails, setClientDetails }) => {
    const [descModalVisible, setDescModalVisible] = useState(false);
    const [description, setDescription] = useState(clientDetails.description || '');
    const [isSaving, setIsSaving] = useState(false);
    const descriptionInputRef = useRef(null)

    useEffect(() => {
        if (clientDetails) {
            setDescription(clientDetails.description || '');
        }
    }, [clientDetails]);

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
                <Text allowFontScaling={false} style={styles.descriptionTitle}>{i18n.t('description')}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setDescModalVisible(true)
                        setTimeout(() => {
                            descriptionInputRef.current?.focus();
                        }, 100);
                    }}
                    style={styles.editDescriptionButton}
                >
                    <MaterialIcons name="edit" size={20} color="#014495" />
                </TouchableOpacity>
            </View>
            <Text allowFontScaling={false} style={styles.descriptionText}>
                {clientDetails.description || i18n.t('noDescription')}
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
                            <Text allowFontScaling={false} style={styles.descriptionModalTitle}>{i18n.t('editDescription')}</Text>
                            <TouchableOpacity
                                onPress={() => setDescModalVisible(false)}
                                style={styles.descriptionModalClose}
                            >
                                <MaterialIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            ref={descriptionInputRef}
                            style={styles.descriptionInput}
                            multiline
                            numberOfLines={6}
                            value={description}
                            onChangeText={setDescription}
                            placeholder={i18n.t('enterDescription')}
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
                                <Text allowFontScaling={false} style={styles.saveDescriptionText}>{i18n.t('saveDescription')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </Animatable.View>
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
    const [editStatusModalVisible, setEditStatusModalVisible] = useState(false);
    const [isSavingPrice, setIsSavingPrice] = useState(false);
    const [price, setPrice] = useState(0);
    const priceInputRef = useRef(null); // Add a ref for price input
    const [clientPayments, setClientPayments] = useState([])
    const [loadingPaments, setLoadingPayments] = useState(false)
    const [treatmentPaid, setTreatmentPaid] = useState([])
    const [repeat, setRepeat] = useState("weekly")
    const [idNumber, setIdNumber] = useState(clientDetails.idNumber || '');
    const [idModalVisible, setIdModalVisible] = useState(false);
    const [isIdSaving, setIsIdSaving] = useState(false);
    const idInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [modalFileVisible, setModalFileVisible] = useState(false);
    const [modalFilePickerVisible, setModalFilePickerVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState();
    const [loadingFiles, setLoadingFiles] = useState(false)
    const [uploadFileLoading, setUploadFileLoading] = useState(false)
    const [status, setStatus] = useState("")
    const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
    const [showAndroidTimePicker, setShowAndroidTimePicker] = useState(false);
    const pickImage = async () => {
        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            alert("אין הרשאה לגלריה. היכנס להגדרות");
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const compressedImage = await ImageCompressor.compress(result.assets[0].uri, {
                compressionMethod: "auto",
            });

            uploadImage(compressedImage);
        }
    };
    // Function to take a photo
    const takePhoto = async () => {
        const permissionResult =
            await ImagePicker.requestCameraPermissionsAsync()
        if (permissionResult.granted === false) {
            alert("אין הרשאה לגלריה. היכנס להגדרות");
            return;
        }
        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const compressedImage = await ImageCompressor.compress(result.assets[0].uri, {
                compressionMethod: "auto",
            });
            uploadImage(compressedImage);
        }
    };
    // Add the pickFile function
    const pickFile = async () => {
        try {

            let result = await DocumentPicker.getDocumentAsync({
                type: "application/pdf",
            });
            if (!result.canceled) {
                uploadFile(result);
                // console.log("resault:", result.assets[0].name)
            }

            // Call your existing uploadFile function with the selected file URI
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('User cancelled the picker');
            } else {
                console.error('Error picking file:', err);
            }
        }
    };


    // Function to upload the file image
    const uploadImage = async (fileUri) => {
        setModalFilePickerVisible(false)
        setUploadFileLoading(true)
        const formData = new FormData();
        formData.append('file', {
            uri: fileUri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        });
        try {
            const response = await axios.post(`${Api}/profile/${clientId}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFiles(response.data.files);
            setUploadFileLoading(false)
        } catch (error) {
            console.error('Error uploading file:', error);
            setModalFilePickerVisible(false)
            setUploadFileLoading(false)
        }
    };

    // Function to upload the file
    const uploadFile = async (file) => {
        setModalFilePickerVisible(false)
        setUploadFileLoading(true)
        const formData = new FormData();
        formData.append("file", {
            uri: file.assets[0].uri,
            name: file.assets[0].name,
            type: file.assets[0].mimeType,
        });

        try {
            const response = await axios.post(`${Api}/profile/${clientId}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFiles(response.data.files);
            setUploadFileLoading(false)
        } catch (error) {
            setModalFilePickerVisible(false)
            setUploadFileLoading(false)
            console.error('Error uploading file:', error);
        }
    };

    // Function to fetch files
    const fetchFiles = async () => {
        try {
            setLoadingFiles(true)
            const response = await axios.get(`${Api}/profile/${clientId}/files`);
            setFiles(response.data);
            setLoadingFiles(false)
        } catch (error) {
            setLoadingFiles(false)
            console.error('Error fetching files:', error);
        }
    };

    // Function to delete a file
    const deleteFile = async (index) => {
        try {
            await axios.delete(`${Api}/profile/${clientId}/files/index/${index}`);
            fetchFiles(); // Refresh the file list
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchFiles()
        });

        return unsubscribe;
    }, [navigation]);

    const handleSaveId = async (clientId) => {
        if (!idNumber) return;
        setIsIdSaving(true);
        try {

            axios.put(`${Api}/clients/${clientId}/${user._id}`, {
                idNumber: idNumber
            });
            fetchClientData();
            setIdModalVisible(false);
        } catch (error) {
            console.error('Error updating ID:', error);
            Alert.alert('Error', 'Failed to update ID number');
        } finally {
            setIsIdSaving(false);
        }
    };

    function checkTreatmentPaid() {
        const paymentsAmountArr = clientPayments.map(p => p.amount)
        const sortedTreatments = treatments.slice() // Create a shallow copy to avoid mutating the original array
            .sort((a, b) => new Date(a.treatmentDate) - new Date(b.treatmentDate));
        const treatmentPriceArr = sortedTreatments.map(t => t.treatmentPrice);

        // console.log("paymentsAmountArr:", paymentsAmountArr, "treatmentPriceArr:", treatmentPriceArr)
        let paymentSum = paymentsAmountArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        let result = []; // Array to store the payment statuses

        // Loop through the treatments
        for (let i = 0; i < sortedTreatments.length; i++) {
            // Check if treatment is canceled or no show
            if (sortedTreatments[i].status === "CANCELED" || sortedTreatments[i].status === "NO_SHOW") {
                result.push("-");
                continue; // Skip to next iteration
            }

            // Handle payment status for non-canceled treatments
            if (paymentsAmountArr.length === 0) {
                result.push("PENDING")
            }
            else if (paymentSum >= treatmentPriceArr[i]) {
                result.push("PAID");
                paymentSum -= treatmentPriceArr[i];
            } else if (paymentSum > 0 && paymentSum < treatmentPriceArr[i]) {
                result.push("PARTIALLY PAID");
                break;
            } else {
                result.push("PENDING");
            }
        }

        // Fill the rest with "pending" if there are more treatments than payments
        while (result.length < treatmentPriceArr.length) {
            const currentTreatment = sortedTreatments[result.length];
            if (currentTreatment.status !== "CANCELED" && currentTreatment.status !== "NO_SHOW") {
                result.push("PENDING");
            } else {
                result.push("-");
            }
        }

        // console.log("result:--------", result)
        setTreatmentPaid(result.reverse())
    }
    useEffect(() => {
        checkTreatmentPaid()
    }, [clientPayments, treatments])

    const fetchPayments = async (clientId) => {
        // console.log("clientId for payments:", clientId);
        try {
            setLoadingPayments(true);
            const response = await axios.get(`${Api}/payments/client/${clientId}`);

            // Check if the response is successful

            setClientPayments(response.data);
            // checkTreatmentPaid()
            /* else {
                console.error("Unexpected response status:", response.status);
            } */
        } catch (error) {
            setLoadingPayments(false);
            if (error.response) {
                // Handle known errors
                // console.error('Error fetching payments:', error.response.data.message);
                // alert(error.response.data.message); // Show the error message to the user
            } else {
                // Handle unknown errors
                // console.error('Error fetching payments:', error.message);
                // alert('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoadingPayments(false);
        }
    };


    useEffect(() => {
        fetchPayments(clientDetails._id);
    }, [clientDetails]);

    /*  useEffect(() => {
         const unsubscribe = navigation.addListener('focus', () => {
             fetchPayments(clientDetails._id)
         });
 
         return unsubscribe;
     }, [navigation]); */

    const openEditPriceModal = () => {
        setEditPriceModalVisible(true);
        /* setTimeout(() => {
            priceInputRef.current?.focus(); // Focus on the price input after the modal opens
        }, 100);  */// Delay to ensure the modal is fully rendered before focusing
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
            fetchTreatments()
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

    const updateTreatmentStatus = async (statusText) => {
        try {
            console.log("status:-----------------------------", statusText)
            // console.log("id:", id)
            const response = await axios.put(`${Api}/treatments/treatments/${selectedTreatmentId}`, {
                status: statusText,
            });
            fetchTreatments();
            checkTreatmentPaid();
            setEditStatusModalVisible(false)
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
            const response = await axios.put(`${Api}/treatments/dateTime/${selectedTreatmentId}`, {
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
        // console.log("page:", page)
        setActiveTab(page);
        translateX.value = withTiming(page * (windowWidth / 4)); // Adjust width division as per number of tabs

        // Set the page in PagerView
        if (pagerRef.current) {
            pagerRef.current.setPage(page);
        }
        if (page === 3) {
            fetchFiles()
        }
    };

    const onPageSelected = (e) => {
        const page = e.nativeEvent.position;
        setActiveTab(page);
        translateX.value = withTiming(page * (windowWidth / 4)); // Sync the indicator animation with swipe
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
                treatmentDate: combinedDateTime.toISOString(), repeatStatus: repeat, numberOfMeetings: clientDetails.numberOfMeetings,
            });
            // setTreatments(response.data)
            // Add the new treatment to the beginning of the list
            fetchTreatments()
            // setTreatments(prev => [response.data, ...prev]);
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
                    <Text allowFontScaling={false} style={styles.parentText}>{item.parentName.length > 12 ? `${item.parentName.slice(0, 15)}..` : item.parentName}</Text>
                </View>

                <View style={styles.iconContainer}>
                    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                        <FontAwesome name="phone" size={24} color="grey" />
                        <Text allowFontScaling={false} style={{ color: "grey", marginHorizontal: horizontalScale(10) }}>{item.phone}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity disabled={!item.email} style={{ flexDirection: "row", alignItems: "center" }} onPress={() => Linking.openURL(`mailto:${item.email}`)}>
                        <FontAwesome name="envelope" size={24} color="grey" />
                        <Text allowFontScaling={false} style={{ color: "grey", marginHorizontal: horizontalScale(10) }}>{item.email ? item.email : "No email"}</Text>
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
        if (statLabel === i18n.t('age')) return;

        let currentValue = '';
        if (statLabel === i18n.t('price')) {
             currentValue = clientDetails.clientPrice || '';
        } else if (statLabel === i18n.t('statsInsurance')) {
             currentValue = clientDetails.insuranceInfo || '';
        } else if (statLabel === i18n.t('meetings')) {
             currentValue = clientDetails.numberOfMeetings?.toString() || '';
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
            if (editingStat === i18n.t('price')) {
                 field = 'clientPrice';
            } else if (editingStat === i18n.t('statsInsurance')) {
                 field = 'insuranceInfo';
            } else if (editingStat === i18n.t('meetings')) {
                 field = 'numberOfMeetings';
                 value = parseInt(editValue) || 0;
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
                <Text allowFontScaling={false} style={styles.errorText}>404 Page Not Found</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text allowFontScaling={false} style={styles.errorText}>{error}</Text>
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
                                <Text allowFontScaling={false} style={styles.editModalTitle}>
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
                                <Text allowFontScaling={false} style={styles.editModalLabel}>
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
                                    <Text allowFontScaling={false} style={styles.editModalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editModalSaveButton}
                                    onPress={handleSaveTreatmentEdit}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text allowFontScaling={false} style={styles.editModalSaveText}>Save</Text>
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
        const pendingStatusFilter = treatments.filter((t) => t.status === "" || t.status === "PENDING" || t.status === "COMPLETED")
        const pendingTreatments = /* treatments.filter(t => t.paymentStatus === 'pending'); */pendingStatusFilter.map(t => t.treatmentPrice)

        const totalPaid = paidTreatments.reduce((sum, t) => sum + (parseFloat(t) || 0), 0);
        const totalPending = pendingTreatments.reduce((sum, t) => sum + (parseFloat(t) || 0), 0) - totalPaid;
        const [paymentModalVisible, setPaymentModalVisible] = useState(false);
        const [paymentAmount, setPaymentAmount] = useState('');
        const [paymentMethod, setPaymentMethod] = useState('cash');
        const [paymentStage, setPaymentStage] = useState(1); // 1: Amount, 2: Method, 3: Confirmation
        const paymentMethods = ['cash', 'bankTransfer', 'paybox', 'bit', 'creditCard', 'googlePay', 'applePay', 'vCheck', 'bitcoin', 'ethereum', 'payoneer', 'debitCard', 'paypal'];
        const amountInputRef = useRef(null);

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
                // alert('Payment added successfully!');

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
                            <Text allowFontScaling={false} style={styles.paymentDateText2}>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                            <Text allowFontScaling={false} style={styles.paymentTimeText}>
                                {new Date(item.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </Text>
                        </View>
                        <View style={styles.headerRightSection}>
                            <Text allowFontScaling={false} style={styles.paymentAmounts}>
                                {i18n.t('currencySymbol')}{parseFloat(item.amount || 0).toFixed(2)}
                            </Text>
                            {/* Remove the static delete button */}
                        </View>
                    </View>
                    <View style={styles.paymentMethodContainer}>
                        <View style={styles.paymentMethodBadge}>
                            <MaterialIcons
                                name={
                                    (item.paymentMethod === 'cash' || item.paymentMethod === 'Cash') ? 'payments' :
                                        (item.paymentMethod === 'creditCard' || item.paymentMethod === 'Credit Card') ? 'credit-card' :
                                            'account-balance'
                                }
                                size={18}
                                color="#014495"
                            />
                            <Text allowFontScaling={false} style={styles.paymentMethodText}>
                                {(() => {
                                    const method = item.paymentMethod;
                                    const mapping = {
                                        'Cash': 'cash',
                                        'Bank Transfer': 'bankTransfer',
                                        'Paybox': 'paybox',
                                        'Bit': 'bit',
                                        'Credit Card': 'creditCard',
                                        'Google Pay': 'googlePay',
                                        'Apple Pay': 'applePay',
                                        'V-Check': 'vCheck',
                                        'Bitcoin': 'bitcoin',
                                        'Ethereum': 'ethereum',
                                        'Payoneer': 'payoneer',
                                        'Debit Card': 'debitCard',
                                        'PayPal': 'paypal'
                                    };
                                    return i18n.t(mapping[method] || method);
                                })()}
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
                        <Text allowFontScaling={false} style={styles.summaryAmount}>{i18n.t('currencySymbol')}{totalPaid.toFixed(2)}</Text>
                        <Text allowFontScaling={false} style={styles.summaryLabel}>{i18n.t('totalPaid')}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <MaterialIcons name="schedule" size={24} color="#FF9800" />
                        <Text allowFontScaling={false} style={styles.summaryAmount}>{i18n.t('currencySymbol')}{totalPending.toFixed(2)}</Text>
                        <Text allowFontScaling={false} style={styles.summaryLabel}>{i18n.t('pendingPayment')}</Text>
                    </View>
                </Animatable.View>



                <FlatList
                    data={/*treatments*/ payments}
                    renderItem={renderPaymentItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.paymentsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <Animatable.View 
                            animation="fadeInUp" 
                            duration={800}
                            style={styles.emptyState}
                        >
                            <LinearGradient
                                colors={['#F0F4FF', '#FFFFFF']}
                                style={styles.emptyGradient}
                            >
                                <Animatable.View 
                                    animation="bounceIn" 
                                    delay={300}
                                    style={styles.emptyIconContainer}
                                >
                                    <MaterialIcons name="account-balance-wallet" size={80} color="#014495" />
                                </Animatable.View>
                                <Animatable.Text 
                                    animation="fadeIn" 
                                    delay={500}
                                    allowFontScaling={false} 
                                    style={styles.emptyStateTitle}
                                >
                                    {i18n.t('noPaymentsYet')}
                                </Animatable.Text>
                            </LinearGradient>
                        </Animatable.View>
                    )}
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setPaymentAmount('');
                        setPaymentMethod('cash');
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
                        <Text allowFontScaling={false} style={styles.addButtonText}>{i18n.t('addPayment')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={paymentModalVisible}
                    onRequestClose={() => setPaymentModalVisible(false)}
                    onShow={() => {
                        // Focus the amount input when the modal is shown
                        setTimeout(() => {
                            amountInputRef.current?.focus();
                        }, 100);
                    }}
                >
                    <View style={styles.modalPaymentOverlay}>
                        <View style={styles.modalPaymentContainer}>
                            {paymentStage === 1 && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Text allowFontScaling={false} style={styles.modalTitle}>{i18n.t('enterAmount')}</Text>
                                        <TouchableOpacity
                                            onPress={() => setPaymentModalVisible(false)}
                                            style={styles.modalCloseButton}
                                        >
                                            <MaterialIcons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    {/*  <Text allowFontScaling={false}  style={styles.modalPaymentHeader}>Enter Amount</Text> */}
                                    <TextInput
                                        ref={amountInputRef}
                                        style={styles.inputPayment}
                                        placeholder={i18n.t('enterPrice')}
                                        keyboardType="numeric"
                                        value={paymentAmount}
                                        onChangeText={setPaymentAmount}
                                    />
                                    <View style={styles.modalFooter}>
                                        <TouchableOpacity
                                            style={styles.cancelButtonTreatment}
                                            onPress={() => setPaymentModalVisible(false)}
                                        >
                                            <Text allowFontScaling={false} style={styles.cancelButtonText}>{i18n.t('cancel')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={() => setPaymentStage(2)}
                                            disabled={!paymentAmount}
                                        >

                                            <Text allowFontScaling={false} style={styles.saveButtonText}>{i18n.t('next')}</Text>

                                        </TouchableOpacity>
                                    </View>
                                    {/* <Button title="Next" onPress={() => setPaymentStage(2)} disabled={!paymentAmount} /> */}
                                </>
                            )}
                            {paymentStage === 2 && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Text allowFontScaling={false}
                                            style={styles.modalTitle}>{i18n.t('selectPaymentMethod')}</Text>
                                        <TouchableOpacity
                                            onPress={() => setPaymentModalVisible(false)}
                                            style={styles.modalCloseButton}
                                        >
                                            <MaterialIcons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    {/*  <Text allowFontScaling={false}  style={styles.modalPaymentHeader}>Select Payment Method</Text> */}
                                    <Picker
                                        selectedValue={paymentMethod}
                                        onValueChange={(itemValue) => setPaymentMethod(itemValue)}
                                    >
                                        {paymentMethods.map((method) => (
                                            <Picker.Item key={method} label={i18n.t(method)} value={method} />
                                        ))}
                                    </Picker>
                                    <View style={styles.modalFooter}>
                                        <TouchableOpacity
                                            style={styles.cancelButtonTreatment}
                                            onPress={() => setPaymentModalVisible(false)}
                                        >
                                            <Text allowFontScaling={false} style={styles.cancelButtonText}>{i18n.t('cancel')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={() => setPaymentStage(3)}
                                            disabled={!paymentAmount}
                                        >

                                            <Text allowFontScaling={false} style={styles.saveButtonText}>{i18n.t('next')}</Text>

                                        </TouchableOpacity>
                                    </View>
                                    {/*  <Button title="Next" onPress={() => setPaymentStage(3)} disabled={!paymentMethod} /> */}
                                </>
                            )}
                            {paymentStage === 3 && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Text allowFontScaling={false} style={styles.modalTitle}>{i18n.t('confirmPayment')}</Text>
                                        <TouchableOpacity
                                            onPress={() => setPaymentModalVisible(false)}
                                            style={styles.modalCloseButton}
                                        >
                                            <MaterialIcons name="close" size={24} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    {/* <Text allowFontScaling={false}  style={styles.modalPaymentHeader}>Confirm Payment</Text> */}
                                    <Text allowFontScaling={false} style={styles.paymentText}>{i18n.t('price')}: {i18n.t('currencySymbol')}{paymentAmount}</Text>
                                    <Text allowFontScaling={false} style={styles.paymentText}>{i18n.t('paymentMethod')}: {paymentMethod}</Text>
                                    <View style={styles.modalFooter}>
                                        <TouchableOpacity
                                            style={styles.cancelButtonTreatment}
                                            onPress={() => setPaymentModalVisible(false)}
                                        >
                                            <Text allowFontScaling={false} style={styles.cancelButtonText}>{i18n.t('cancel')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={handleAddPayment}
                                            disabled={!paymentAmount}
                                        >

                                            <Text allowFontScaling={false} style={styles.saveButtonText}>{i18n.t('confirm')}</Text>

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

    function getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const diffInSeconds = Math.abs(diff) / 1000;
        const diffInMinutes = diffInSeconds / 60;
        const diffInHours = diffInMinutes / 60;
        const diffInDays = diffInHours / 24;
        const diffInWeeks = diffInDays / 7;
        const diffInMonths = diffInDays / 30;
        const diffInYears = diffInDays / 365;

        const isFuture = diff < 0;

        // Helper function to handle plural forms
        const plural = (value, unit) =>
            Math.floor(value) === 1 ? `${Math.floor(value)} ${unit}` : `${Math.floor(value)} ${unit}s`;

        if (diffInSeconds < 60) {
            return isFuture ? 'in a few seconds' : 'just now';
        }

        if (diffInMinutes < 60) {
            return isFuture
                ? `in ${plural(diffInMinutes, 'minute')}`
                : `${plural(diffInMinutes, 'minute')} ago`;
        }

        if (diffInHours < 24) {
            return isFuture
                ? `in ${plural(diffInHours, 'hour')}`
                : `${plural(diffInHours, 'hour')} ago`;
        }

        if (diffInDays < 7) {
            if (diffInDays < 1) {
                return isFuture ? 'tomorrow' : 'yesterday';
            }
            return isFuture
                ? `in ${plural(diffInDays, 'day')}`
                : `${plural(diffInDays, 'day')} ago`;
        }

        if (diffInWeeks < 4) {
            if (diffInWeeks < 1) {
                return isFuture ? 'next week' : 'last week';
            }
            return isFuture
                ? `in ${plural(diffInWeeks, 'week')}`
                : `${plural(diffInWeeks, 'week')} ago`;
        }

        if (diffInMonths < 12) {
            if (diffInMonths < 1) {
                return isFuture ? 'next month' : 'last month';
            }
            return isFuture
                ? `in ${plural(diffInMonths, 'month')}`
                : `${plural(diffInMonths, 'month')} ago`;
        }

        if (diffInYears < 1) {
            return isFuture ? 'next year' : 'last year';
        }

        return isFuture
            ? `in ${plural(diffInYears, 'year')}`
            : `${plural(diffInYears, 'year')} ago`;
    }

    return (
        <View style={styles.container}>
            <Animatable.View
                animation="fadeInDown"
                duration={800}
                style={styles.header}
            >
                <TouchableOpacity
                    onPress={() => navigation.navigate("Clients")}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#014495" />
                </TouchableOpacity>
                <Text allowFontScaling={false} style={styles.headerTitle}>{clientDetails.name} {clientDetails.lastName}</Text>
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
                            <Animatable.View
                                animation="fadeInUp"
                                duration={1000}
                                style={styles.idNumberContainer}
                            >
                                <MaterialIcons name="badge" size={20} color="#014495" />
                                <TouchableOpacity
                                    style={styles.idNumberButton}
                                    onPress={() => {
                                        setIdNumber(clientDetails.idNumber || '');
                                        setIdModalVisible(true);
                                        setTimeout(() => {
                                            idInputRef.current?.focus(); // Focus on the price input after the modal opens
                                        }, 100);
                                        /* idInputRef.current?.focus(); */
                                    }}
                                >
                                    <Text allowFontScaling={false} style={styles.idNumberLabel}>{i18n.t('idNumberLabel')}:</Text>
                                    <View style={styles.idNumberValueContainer}>
                                        <Text allowFontScaling={false} style={[
                                            styles.idNumberValue,
                                            !clientDetails.idNumber && styles.idNumberPlaceholder
                                        ]}>
                                            {clientDetails.idNumber || i18n.t('addIdNumber')}
                                        </Text>
                                        <View style={styles.editIdIndicator}>
                                            <MaterialIcons name="edit" size={16} color="#014495" />
                                        </View>
                                        {/* <MaterialIcons name="edit" size={16} color="#014495" /> */}
                                    </View>
                                </TouchableOpacity>
                            </Animatable.View>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={nameModalVisible}
                                onRequestClose={() => setNameModalVisible(false)}
                            >
                                <KeyboardAvoidingView
                                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                                    style={{ flex: 1 }}
                                >
                                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                        <View style={styles.modalIdOverlay}>
                                            <Animatable.View
                                                animation="slideInUp"
                                                duration={300}
                                                style={styles.modalIdContent}
                                            >
                                                <View style={styles.modalIdHeader}>
                                                    <TouchableOpacity
                                                        style={styles.descriptionModalClose}
                                                        onPress={() => setNameModalVisible(false)}
                                                    >
                                                        <MaterialIcons name="close" size={24} color="#666" />
                                                    </TouchableOpacity>
                                                    <Text allowFontScaling={false} style={styles.modalIdTitle}>Edit Name</Text>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.saveIdButton,
                                                            (firstName === "" || lastName === "") && styles.saveButtonDisabled
                                                        ]}
                                                        onPress={() => handleSaveName(clientDetails._id)}
                                                        disabled={isFullNameSaving || firstName === "" || lastName === ""}
                                                    >
                                                        {isFullNameSaving ? (
                                                            <ActivityIndicator color="white" size="small" />
                                                        ) : (
                                                            <Text allowFontScaling={false} style={styles.saveButtonIdText}>Save</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={styles.modalIdBody}>
                                                    <View style={styles.inputIdContainer}>
                                                        <Text allowFontScaling={false} style={styles.inputIdLabel}>First Name</Text>
                                                        <TextInput
                                                            ref={firstNameInputRef}
                                                            style={[
                                                                styles.inputId,
                                                                { textAlign: firstName && /^[\u0590-\u05FF]/.test(firstName[0]) ? 'right' : 'left' }
                                                            ]}
                                                            placeholder="Enter First Name"
                                                            value={firstName}
                                                            onChangeText={setFirstName}
                                                            placeholderTextColor="#999"
                                                        />
                                                        {firstName === "" && (
                                                            <Animatable.Text
                                                                animation="shake"
                                                                style={styles.errorIdText}
                                                            >
                                                                First name cannot be empty
                                                            </Animatable.Text>
                                                        )}
                                                    </View>

                                                    <View style={styles.inputIdContainer}>
                                                        <Text allowFontScaling={false} style={styles.inputIdLabel}>Last Name</Text>
                                                        <TextInput
                                                            style={[
                                                                styles.inputId,
                                                                { textAlign: lastName && /^[\u0590-\u05FF]/.test(lastName[0]) ? 'right' : 'left' }
                                                            ]}
                                                            placeholder="Enter Last Name"
                                                            value={lastName}
                                                            onChangeText={setLastName}
                                                            placeholderTextColor="#999"
                                                        />
                                                        {lastName === "" && (
                                                            <Animatable.Text
                                                                animation="shake"
                                                                style={styles.errorIdText}
                                                            >
                                                                Last name cannot be empty
                                                            </Animatable.Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </Animatable.View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </KeyboardAvoidingView>
                            </Modal>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={idModalVisible}
                                onRequestClose={() => setIdModalVisible(false)}
                            >
                                <KeyboardAvoidingView
                                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                                    style={{ flex: 1 }}
                                >
                                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                        <View style={styles.modalIdOverlay}>
                                            <Animatable.View
                                                animation="slideInUp"
                                                duration={300}
                                                style={styles.modalIdContent}
                                            >
                                                <View style={styles.modalIdHeader}>
                                                    <TouchableOpacity
                                                        style={styles.descriptionModalClose}
                                                        onPress={() => setIdModalVisible(false)}
                                                    >
                                                        <MaterialIcons name="close" size={24} color="#666" />
                                                    </TouchableOpacity>
                                                    <Text allowFontScaling={false} style={styles.modalIdTitle}>{i18n.t('editIdNumber')}</Text>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.saveIdButton,
                                                            idNumber === "" && styles.saveButtonIdDisabled
                                                        ]}
                                                        onPress={() => handleSaveId(clientDetails._id)}
                                                        disabled={isIdSaving || idNumber === ""}
                                                    >
                                                        {isIdSaving ? (
                                                            <ActivityIndicator color="white" size="small" />
                                                        ) : (
                                                            <Text allowFontScaling={false} style={styles.saveButtonIdText}>{i18n.t('save')}</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={styles.modalIdBody}>
                                                    <View style={styles.inputIdContainer}>
                                                        <Text allowFontScaling={false} style={styles.inputIdLabel}>{i18n.t('idNumberLabel')}</Text>
                                                        <TextInput
                                                            ref={idInputRef}
                                                            style={styles.inputId}
                                                            placeholder={i18n.t('enterIdNumberPlaceholder')}
                                                            value={idNumber}
                                                            onChangeText={setIdNumber}
                                                            keyboardType="numeric"
                                                            maxLength={9}
                                                            placeholderTextColor="#999"
                                                        />
                                                        {idNumber === "" && (
                                                            <Animatable.Text
                                                                animation="shake"
                                                                style={styles.errorIdText}
                                                            >
                                                                {i18n.t('idNumberEmpty')}
                                                            </Animatable.Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </Animatable.View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </KeyboardAvoidingView>
                            </Modal>

                            <View style={styles.statsContainer}>
                                {[
                                    {
                                        label: i18n.t('age'),
                                        value: calculateAge(clientDetails.birthday),
                                        icon: 'cake',
                                        // isEditable: true
                                    },
                                    {
                                        label: i18n.t('price'),
                                        value: clientDetails.clientPrice ?
                                            Math.min(Number(clientDetails.clientPrice), 99999).toString() :
                                            '-',
                                        icon: 'attach-money'
                                    },
                                    {
                                        label: i18n.t('statsInsurance'),
                                        value: clientDetails.insuranceInfo ?
                                            clientDetails.insuranceInfo.slice(0, 20) :
                                            '-',
                                        icon: 'health-and-safety'
                                    },
                                    {
                                        label: i18n.t('meetings'),
                                        value: clientDetails.numberOfMeetings ?
                                            Math.min(Number(clientDetails.numberOfMeetings), 9999).toString() :
                                            '-',
                                        icon: 'event'
                                    }
                                ].map((stat, index) => (
                                    <TouchableOpacity
                                        key={stat.label}
                                        onPress={() => stat.label === i18n.t('age') ? setShowAgeDatePicker(true) : handleStatPress(stat.label)}
                                        style={[styles.statItemWrapper, { flex: stat.label === i18n.t('statsInsurance') ? 1.2 : 1 }]}
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
                                                    (stat.label === i18n.t('statsInsurance') || stat.label === i18n.t('meetings')) && styles.insuranceValue
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {stat.value}
                                            </Text>
                                            <Text allowFontScaling={false} numberOfLines={1} style={styles.statLabel}>{stat.label}</Text>
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
                        <ClientDescription clientDetails={clientDetails} setClientDetails={setClientDetails} />
                        <ParentsSection clientDetails={clientDetails} refreshClient={fetchClientData} />
                        {user.package === "free" && <BannerAd
                            //    ref={bannerRef}
                            unitId={adUnitId1}
                            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                            requestOptions={{
                                requestNonPersonalizedAdsOnly: !isTrackingPermission,
                                // You can change this setting depending on whether you want to use the permissions tracking we set up in the initializing
                            }}
                        />}
                    </ScrollView>
                </View>

                {/* Treatments Tab */}
                <View key="2" style={styles.page}>
                    <View style={styles.treatmentsContainer}>
                        {loading ? (
                            renderSkeletonLoading()
                        ) : (
                            <>
                                <Text allowFontScaling={false} style={styles.treatmentsCount}>
                                    <Text allowFontScaling={false} style={styles.currentTreatments}>{treatments.length}</Text>
                                    <Text allowFontScaling={false} style={styles.treatmentsSeparator}>/</Text>
                                    <Text allowFontScaling={false} style={styles.totalTreatments}>{clientDetails.numberOfMeetings}</Text>
                                    <Text allowFontScaling={false} style={styles.treatmentsLabel}> treatments</Text>
                                </Text>
                                <FlatList
                                    keyboardShouldPersistTaps="handled"
                                    data={treatments}
                                    renderItem={({ item, index }) => (
                                        <>
                                            <Animatable.Text
                                                animation="fadeIn"
                                                style={styles.relativeTimeText}
                                                allowFontScaling={false}
                                            >
                                                {getRelativeTime(new Date(item.treatmentDate))}
                                            </Animatable.Text>
                                            <Animatable.View
                                                animation="fadeInUp"
                                                delay={index * 100}
                                                style={[styles.treatmentCard, { backgroundColor: item.status === "NO_SHOW" || item.status === "CANCELED" ? "rgba(0,0,0,0.05)" : "white" }]}
                                            >

                                                <View style={styles.treatmentHeader}>
                                                    <TouchableOpacity onPress={() => { setSelectedDate(new Date(item.treatmentDate)); setSelectedTreatmentId(item._id); setDateTimeModalVisible(true) }}>
                                                        <View style={styles.treatmentDateTime}>
                                                            <View style={styles.treatmentDate}>
                                                                <MaterialIcons name="event" size={20} color="#014495" />
                                                                <Text allowFontScaling={false} style={styles.dateText}>
                                                                    {new Date(item.treatmentDate).toLocaleDateString()}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.treatmentTime}>
                                                                <MaterialIcons name="access-time" size={20} color="#014495" />
                                                                <Text allowFontScaling={false} style={styles.timeText}>
                                                                    {formatTime(item.treatmentDate)}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                    {/*  <TouchableOpacity onPress={() => { item.treatmentPrice ? setPrice(item.treatmentPrice) : setPrice(clientDetails.clientPrice); setSelectedTreatmentId(item._id); openEditPriceModal() }}>
                                                    <View style={styles.treatmentPrice}>
                                                        <MaterialIcons name="attach-money" size={20} color="#014495" />
                                                        <Text allowFontScaling={false}  style={styles.priceText}>
                                                            {item.treatmentPrice}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity> */}
                                                    <Modal
                                                        animationType="slide"
                                                        transparent={true}
                                                        visible={editPriceModalVisible}
                                                        onRequestClose={() => setEditPriceModalVisible(false)}
                                                        onShow={() => {
                                                            setTimeout(() => {
                                                                priceInputRef.current?.focus();
                                                            }, 200);
                                                        }}
                                                    >
                                                        <TouchableWithoutFeedback onPress={() => setEditPriceModalVisible(false)}>
                                                            <KeyboardAvoidingView
                                                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                                                style={{ flex: 1 }}
                                                            >
                                                                <View style={styles.modalOverlay}>
                                                                    <View style={styles.editModalContainer}>
                                                                        <View style={styles.editModalHeader}>
                                                                            <MaterialIcons name="edit" size={24} color="#014495" />
                                                                            <Text allowFontScaling={false} style={styles.editModalTitle}>
                                                                                Edit Price
                                                                            </Text>
                                                                            <TouchableOpacity
                                                                                onPress={() => setEditPriceModalVisible(false)}
                                                                                style={styles.editModalCloseButton}
                                                                            >
                                                                                <MaterialIcons name="close" size={24} color="#666" />
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                        {/* <Text allowFontScaling={false}  style={styles.editModalTitle}>Edit Price</Text> */}
                                                                        <View style={styles.editModalContent}>
                                                                            <TextInput
                                                                                ref={priceInputRef}
                                                                                style={styles.editModalInput}
                                                                                placeholder="Enter new price"
                                                                                keyboardType="numeric"
                                                                                value={price ? price.toString() : ''}
                                                                                onChangeText={(text) => handlePriceChange(text, item._id)}
                                                                            />
                                                                        </View>
                                                                        <View style={styles.editModalFooter}>
                                                                            <TouchableOpacity
                                                                                style={styles.editModalCancelButton}
                                                                                onPress={() => setEditPriceModalVisible(false)}
                                                                            >
                                                                                <Text allowFontScaling={false} style={styles.editModalCancelText}>Cancel</Text>
                                                                            </TouchableOpacity>
                                                                            <TouchableOpacity
                                                                                style={styles.editModalSaveButton}
                                                                                onPress={() => handleSavePrice(item._id)}
                                                                            >
                                                                                {isSavingPrice ? <ActivityIndicator /> :
                                                                                    <Text allowFontScaling={false} style={styles.editModalSaveText}>Save</Text>
                                                                                }

                                                                            </TouchableOpacity>
                                                                        </View>
                                                                        {/*  <View style={styles.buttonEditPriceContainer}>
                                                                <Button title="Cancel" onPress={() => setEditPriceModalVisible(false)} color="#FF3D00" />
                                                                <Button title="Save" onPress={() => handleSavePrice(item._id)} color="#014495" />
                                                            </View> */}
                                                                    </View>
                                                                </View>
                                                            </KeyboardAvoidingView>
                                                        </TouchableWithoutFeedback>
                                                    </Modal>
                                                    <Modal
                                                        animationType="slide"
                                                        transparent={true}
                                                        visible={editStatusModalVisible}
                                                        onRequestClose={() => setEditStatusModalVisible(false)}
                                                    >
                                                        <TouchableWithoutFeedback onPress={() => setEditStatusModalVisible(false)}>
                                                            <KeyboardAvoidingView
                                                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                                                style={{ flex: 1 }}
                                                            >
                                                                <View style={styles.modalOverlay}>
                                                                    <View style={styles.editModalContainer}>
                                                                        <View style={styles.editModalHeader}>
                                                                            <MaterialIcons name="edit" size={24} color="#014495" />
                                                                            <Text allowFontScalin={false} style={styles.editModalTitle}>
                                                                                Edit Status
                                                                            </Text>
                                                                            <TouchableOpacity
                                                                                onPress={() => setEditStatusModalVisible(false)}
                                                                                style={styles.editModalCloseButton}
                                                                            >
                                                                                <MaterialIcons name="close" size={24} color="#666" />
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                        {/* <Text allowFontScaling={false}  style={styles.editModalTitle}>Edit Price</Text> */}
                                                                        <View style={styles.editModalContent}>
                                                                            <Animatable.View animation="fadeIn" duration={300}>
                                                                                <TouchableOpacity onPress={() => { setStatus("PENDING"); updateTreatmentStatus("PENDING") }} style={{ flexDirection: "row", alignItems: "center", padding: 15 }}>
                                                                                    <MaterialIcons name="schedule" size={30} color="#FFA500" />
                                                                                    <Text allowFontScaling={false} style={{ marginLeft: 10, fontSize: 18 }}>Pending</Text>
                                                                                </TouchableOpacity>
                                                                            </Animatable.View>
                                                                            <Animatable.View animation="fadeIn" duration={300}>
                                                                                <TouchableOpacity onPress={() => { setStatus("COMPLETED"); updateTreatmentStatus("COMPLETED") }} style={{ flexDirection: "row", alignItems: "center", padding: 15 }}>
                                                                                    <MaterialIcons name="check-circle" size={30} color="#4CAF50" />
                                                                                    <Text allowFontScaling={false} style={{ marginLeft: 10, fontSize: 18 }}>Completed</Text>
                                                                                </TouchableOpacity>
                                                                            </Animatable.View>
                                                                            <Animatable.View animation="fadeIn" duration={300}>
                                                                                <TouchableOpacity onPress={() => { setStatus("CANCELED"); updateTreatmentStatus("CANCELED"); }} style={{ flexDirection: "row", alignItems: "center", padding: 15 }}>
                                                                                    <MaterialIcons name="cancel" size={30} color="#FF4444" />
                                                                                    <Text allowFontScaling={false} style={{ marginLeft: 10, fontSize: 18 }}>Canceled</Text>
                                                                                </TouchableOpacity>
                                                                            </Animatable.View>
                                                                            <Animatable.View animation="fadeIn" duration={300}>
                                                                                <TouchableOpacity onPress={() => { setStatus("NO_SHOW"); updateTreatmentStatus("NO_SHOW"); }} style={{ flexDirection: "row", alignItems: "center", padding: 15 }}>
                                                                                    <MaterialIcons name="remove-circle" size={30} color="#FFA500" />
                                                                                    <Text allowFontScaling={false} style={{ marginLeft: 10, fontSize: 18 }}>No Show</Text>
                                                                                </TouchableOpacity>
                                                                            </Animatable.View>
                                                                        </View>
                                                                        {/*  <View style={styles.editModalFooter}>
                                                                        <TouchableOpacity
                                                                            style={styles.editModalCancelButton}
                                                                            onPress={() => setEditStatusModalVisible(false)}
                                                                        >
                                                                            <Text allowFontScaling={false}  style={styles.editModalCancelText}>Cancel</Text>
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity
                                                                            style={styles.editModalSaveButton}
                                                                            onPress={() => handleSavePrice(item._id)}
                                                                        >
                                                                            {isSavingPrice ? <ActivityIndicator /> :
                                                                                <Text allowFontScaling={false}  style={styles.editModalSaveText}>Save</Text>
                                                                            }

                                                                        </TouchableOpacity>
                                                                    </View> */}
                                                                        {/*  <View style={styles.buttonEditPriceContainer}>
                                                                <Button title="Cancel" onPress={() => setEditPriceModalVisible(false)} color="#FF3D00" />
                                                                <Button title="Save" onPress={() => handleSavePrice(item._id)} color="#014495" />
                                                            </View> */}
                                                                    </View>
                                                                </View>
                                                            </KeyboardAvoidingView>
                                                        </TouchableWithoutFeedback>
                                                    </Modal>
                                                    <Modal
                                                        animationType="slide"
                                                        transparent={true}
                                                        visible={dateTimeModalVisible}
                                                        onRequestClose={() => setDateTimeModalVisible(false)}
                                                    >
                                                        <TouchableWithoutFeedback onPress={() => setDateTimeModalVisible(false)}>
                                                            <View style={styles.modalOverlay}>

                                                                <View style={styles.modalContainer}>
                                                                    <View style={styles.editModalHeader}>
                                                                        <MaterialIcons name="edit" size={24} color="#014495" />
                                                                        <Text allowFontScaling={false} style={styles.editModalTitle}>
                                                                            Update Date and Time
                                                                        </Text>
                                                                        <TouchableOpacity
                                                                            onPress={() => setDateTimeModalVisible(false)}
                                                                            style={styles.editModalCloseButton}
                                                                        >
                                                                            <MaterialIcons name="close" size={24} color="#666" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                    <ScrollView style={styles.modalContent}>
                                                                        <View style={styles.dateTimeContainer}>
                                                                            <View style={[styles.datePickerButton, { flex: 1, marginRight: 10 }]}>
                                                                                <Text allowFontScaling={false} style={styles.pickerTitle}>Select Date</Text>
                                                                                {Platform.OS === 'ios' ? (
                                                                                    <DateTimePicker
                                                                                        value={selectedDate}
                                                                                        mode="date"
                                                                                        display="inline"
                                                                                        onChange={handleDateChange}
                                                                                    />
                                                                                ) : (
                                                                                    <>
                                                                                        <TouchableOpacity
                                                                                            onPress={() => setShowAndroidDatePicker(true)}
                                                                                            style={styles.androidPickerButton}
                                                                                        >
                                                                                            <Text allowFontScaling={false} style={styles.androidPickerText}>
                                                                                                {selectedDate.toLocaleDateString()}
                                                                                            </Text>
                                                                                        </TouchableOpacity>
                                                                                        {showAndroidDatePicker && (
                                                                                            <DateTimePicker
                                                                                                value={selectedDate}
                                                                                                mode="date"
                                                                                                display="default"
                                                                                                onChange={(event, date) => {
                                                                                                    setShowAndroidDatePicker(false);
                                                                                                    if (event.type !== 'dismissed' && date) {
                                                                                                        handleDateChange(event, date);
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </View>

                                                                            <View style={[styles.datePickerButton, { flex: 1 }]}>
                                                                                <Text allowFontScaling={false} style={styles.pickerTitle}>Select Time</Text>
                                                                                {Platform.OS === 'ios' ? (
                                                                                    <DateTimePicker
                                                                                        value={selectedDate}
                                                                                        mode="time"
                                                                                        display="spinner"
                                                                                        onChange={handleDateChange}
                                                                                    />
                                                                                ) : (
                                                                                    <>
                                                                                        <TouchableOpacity
                                                                                            onPress={() => setShowAndroidTimePicker(true)}
                                                                                            style={styles.androidPickerButton}
                                                                                        >
                                                                                            <Text allowFontScaling={false} style={styles.androidPickerText}>
                                                                                                {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                            </Text>
                                                                                        </TouchableOpacity>
                                                                                        {showAndroidTimePicker && (
                                                                                            <DateTimePicker
                                                                                                value={selectedDate}
                                                                                                mode="time"
                                                                                                display="default"
                                                                                                onChange={(event, time) => {
                                                                                                    setShowAndroidTimePicker(false);
                                                                                                    if (event.type !== 'dismissed' && time) {
                                                                                                        handleDateChange(event, time);
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </View>
                                                                        </View>
                                                                        {/* <Text allowFontScaling={false}  style={styles.modalDateTimeHeader}>Update Date and Time</Text> */}
                                                                        {/* <DateTimePicker
                                                                        value={selectedDate}
                                                                        mode="datetime"
                                                                        display="default"
                                                                        onChange={handleDateChange}
                                                                        confirmBtnText="confirm"
                                                                        cancelBtnText="dismiss"
                                                                    /> */}
                                                                        <View style={styles.editModalFooter}>
                                                                            <TouchableOpacity
                                                                                style={styles.editModalCancelButton}
                                                                                onPress={() => setDateTimeModalVisible(false)}
                                                                            >
                                                                                <Text allowFontScaling={false} style={styles.editModalCancelText}>Cancel</Text>
                                                                            </TouchableOpacity>
                                                                            <TouchableOpacity
                                                                                style={styles.editModalSaveButton}
                                                                                onPress={() => { setSelectedTreatmentId(item._id); handleSaveDateTime(item._id) }}
                                                                            >
                                                                                {isSaving ? (
                                                                                    <ActivityIndicator size="small" color="#014495" />
                                                                                ) : (
                                                                                    <Text allowFontScaling={false} style={styles.editModalSaveText}>Save</Text>

                                                                                )}

                                                                            </TouchableOpacity>
                                                                        </View>
                                                                        {/* <View style={styles.buttonDateTimeContainer}>
                                                                <Button title="Cancel" onPress={() => setDateTimeModalVisible(false)} color="#FF3D00" />
                                                                <View style={styles.saveDateTimeButtonContainer}>
                                                                    {isSaving ? (
                                                                        <ActivityIndicator size="small" color="#014495" />
                                                                    ) : (
                                                                        <Button title="Save" onPress={() => handleSaveDateTime(item._id)} color="#014495" />
                                                                    )}
                                                                </View>
                                                            </View> */}
                                                                    </ScrollView>
                                                                </View>
                                                            </View>
                                                        </TouchableWithoutFeedback>
                                                    </Modal>
                                                    <View style={styles.headerActions}>
                                                        <Text allowFontScaling={false} style={styles.sessionNumber}>Session #{treatments.length - index}</Text>
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
                                                        disabled={item.status === "CANCELED" || item.status === "NO_SHOW"}
                                                        style={styles.editableField}
                                                        onPress={() => handleEditField(item._id, 'treatmentSummary')}
                                                    >
                                                        <Text allowFontScaling={false} style={styles.fieldLabel}>{i18n.t('treatmentSummary')}</Text>
                                                        <Text allowFontScaling={false} style={[
                                                            styles.fieldValue,
                                                            { textAlign: /^[\u0590-\u05FF]/.test(item.treatmentSummary) ? 'right' : 'left' }
                                                        ]}>
                                                            {item.treatmentSummary || i18n.t('addSummaryPlaceholder')}
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        disabled={item.status === "CANCELED" || item.status === "NO_SHOW"}
                                                        style={styles.editableField}
                                                        onPress={() => handleEditField(item._id, 'whatNext')}
                                                    >
                                                        <Text allowFontScaling={false} style={styles.fieldLabel}>{i18n.t('whatNext')}</Text>
                                                        <Text allowFontScaling={false} style={[
                                                            styles.fieldValue,
                                                            { textAlign: /^[\u0590-\u05FF]/.test(item.whatNext) ? 'right' : 'left' }
                                                        ]}>
                                                            {item.whatNext || i18n.t('addNextStepsPlaceholder')}
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        disabled={item.status === "CANCELED" || item.status === "NO_SHOW"}
                                                        style={styles.editableField}
                                                        onPress={() => handleEditField(item._id, 'homework')}
                                                    >
                                                        <Text allowFontScaling={false} style={styles.fieldLabel}>{i18n.t('homework')}</Text>
                                                        <Text allowFontScaling={false} style={[
                                                            styles.fieldValue,
                                                            { textAlign: /^[\u0590-\u05FF]/.test(item.homework) ? 'right' : 'left' }
                                                        ]}>
                                                            {item.homework || i18n.t('addHomeworkPlaceholder')}
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <View style={styles.paymentSection}>
                                                        <Text allowFontScaling={false} style={styles.fieldLabel}>{i18n.t('paymentStatus')}</Text>
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
                                                            <Text allowFontScaling={false} style={[styles.statusText, { color: PAYMENT_STATUSES[treatmentPaid[index]]?.color || '#FF9800' }]}>
                                                                {treatmentPaid[index]}
                                                            </Text>
                                                            {/* <Text>{treatmentPaid[index]}</Text> */}
                                                        </View>



                                                        <TouchableOpacity /* disabled={item.status !== "COMPLETED"} */ onPress={() => { item.treatmentPrice ? setPrice(item.treatmentPrice) : setPrice(clientDetails.clientPrice); setSelectedTreatmentId(item._id); openEditPriceModal() }}>
                                                            <View style={styles.treatmentPrice}>
                                                                {/*  <MaterialIcons name="attach-money" size={20} color="#014495" /> */}
                                                                <Text allowFontScaling={false} style={styles.priceText}>
                                                                    {item.treatmentPrice === 0 ? i18n.t('addPriceLabel') : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.treatmentPrice)}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    </View>

                                                    <View style={styles.paymentSection}>
                                                        <Text allowFontScaling={false} style={styles.fieldLabel}>{i18n.t('treatmentStatus')}</Text>
                                                        <View
                                                            style={[styles.paymentStatus, {
                                                                backgroundColor: TREATMENT_STATUSES[item.status]?.color + '20' || '#FFF3E0'
                                                            }]}
                                                        >
                                                            <MaterialIcons
                                                                name={TREATMENT_STATUSES[item.status]?.icon || 'schedule'}
                                                                size={16}
                                                                color={TREATMENT_STATUSES[item.status]?.color || '#FF9800'}
                                                            />
                                                            <Text allowFontScaling={false} style={[styles.statusText, { color: TREATMENT_STATUSES[item.status]?.color || '#FF9800' }]}>
                                                                {item.status}
                                                            </Text>
                                                            {/* <Text>{treatmentPaid[index]}</Text> */}
                                                        </View>



                                                        <TouchableOpacity onPress={() => { setSelectedTreatmentId(item._id); setEditStatusModalVisible(true) }}>
                                                            <View style={styles.treatmentPrice}>
                                                                {/*  <MaterialIcons name="attach-money" size={20} color="#014495" /> */}
                                                                <Text allowFontScaling={false} style={styles.priceText}>
                                                                    {i18n.t('changeStatus')}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                            </Animatable.View>
                                        </>
                                    )}
                                    keyExtractor={(item) => item._id}
                                    contentContainerStyle={styles.treatmentsList}
                                    showsVerticalScrollIndicator={false}
                                    ListEmptyComponent={() => (
                                        <Animatable.View 
                                            animation="fadeInUp" 
                                            duration={800}
                                            style={styles.emptyState}
                                        >
                                            <LinearGradient
                                                colors={['#F0F4FF', '#FFFFFF']}
                                                style={styles.emptyGradient}
                                            >
                                                <Animatable.View 
                                                    animation="bounceIn" 
                                                    delay={300}
                                                    style={styles.emptyIconContainer}
                                                >
                                                    <MaterialIcons name="medical-services" size={80} color="#014495" />
                                                </Animatable.View>
                                                <Animatable.Text 
                                                    animation="fadeIn" 
                                                    delay={500}
                                                    allowFontScaling={false} 
                                                    style={styles.emptyStateTitle}
                                                >
                                                    {i18n.t('noTreatmentsYet')}
                                                </Animatable.Text>
                                                <Animatable.Text 
                                                    animation="fadeIn" 
                                                    delay={700}
                                                    allowFontScaling={false} 
                                                    style={styles.emptyStateText}
                                                >
                                                    {i18n.t('addFirstTreatmentText')}
                                                </Animatable.Text>
                                            </LinearGradient>
                                        </Animatable.View>
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
                                        <Text allowFontScaling={false} style={styles.addButtonText}>{i18n.t('addTreatment')}</Text>
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
                <View key='4' style={styles.page}>

                    {files.length === 0 && (
                        <Animatable.View 
                            animation="fadeInUp" 
                            duration={800}
                            style={styles.emptyFilesState}
                        >
                            <LinearGradient
                                colors={['#F0F4FF', '#FFFFFF']}
                                style={styles.emptyFilesGradient}
                            >
                                <Animatable.View 
                                    animation="bounceIn" 
                                    delay={300}
                                    style={styles.emptyFilesIconContainer}
                                >
                                    <MaterialCommunityIcons name="file-document-edit" size={80} color="#014495" />
                                </Animatable.View>
                                <Animatable.Text 
                                    animation="fadeIn" 
                                    delay={500}
                                    allowFontScaling={false} 
                                    style={styles.emptyFilesStateTitle}
                                >
                                    {i18n.t('noFilesYet')}
                                </Animatable.Text>
                                <Animatable.Text 
                                    animation="fadeIn" 
                                    delay={700}
                                    allowFontScaling={false} 
                                    style={styles.emptyFilesStateText}
                                >
                                    {i18n.t('noFilesUploadedText')}
                                </Animatable.Text>
                            </LinearGradient>
                        </Animatable.View>
                    )}

                    {/* <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setModalFilePickerVisible(true)}
                    >
                        <LinearGradient
                            colors={['#4A90E2', '#357ABD']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <MaterialIcons name="add" size={24} color="white" />
                            <Text allowFontScaling={false}  style={styles.addButtonText}>Add File</Text>
                        </LinearGradient>
                    </TouchableOpacity> */}


                    <Modal visible={modalFilePickerVisible} animationType="slide"
                        transparent={true} onRequestClose={() => setModalFilePickerVisible(false)} onShow={() => {
                            // Focus the amount input when the modal is shown
                            console.log("ani patuach")
                        }}>
                        <View style={styles.modalPaymentOverlay}>
                            <Animatable.View
                                animation="slideInUp"
                                duration={300}
                                style={styles.modalFilePickerContainer}
                            >
                                <View style={styles.modalFilePickerHeader}>
                                    <Text allowFontScaling={false} style={styles.modalFilePickerTitle}>{i18n.t('selectOption')}</Text>
                                    <TouchableOpacity onPress={() => setModalFilePickerVisible(false)} style={styles.modalFilePickerCloseButton}>
                                        <MaterialIcons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.modalContent}>
                                    <TouchableOpacity style={styles.optionFilePickerButton} onPress={takePhoto}>
                                        <MaterialIcons name="camera-alt" size={24} color="#014495" />
                                        <Text allowFontScaling={false} style={styles.optionFilePickerText}>{i18n.t('takePhoto')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.optionFilePickerButton} onPress={pickImage}>
                                        <MaterialIcons name="photo-library" size={24} color="#014495" />
                                        <Text allowFontScaling={false} style={styles.optionFilePickerText}>{i18n.t('chooseFromLibrary')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.optionFilePickerButton} onPress={pickFile}>
                                        <MaterialIcons name="folder" size={24} color="#014495" />
                                        <Text allowFontScaling={false} style={styles.optionFilePickerText}>{i18n.t('chooseFromFiles')}</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </Animatable.View>
                        </View>
                    </Modal>

                    {loadingFiles ? (
                        // Skeleton Loader
                        /*  <SkeletonLoader />  */// Replace with your actual skeleton loader component
                        /*  <ActivityIndicator size={"large"} color={"blue"} />  */
                        <FlatList
                            data={Array.from({ length: 5 })} // Create an array for skeletons
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={() => (
                                <Animatable.View
                                    animation="fadeIn"
                                    duration={300}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 10,
                                        backgroundColor: '#f0f0f0',
                                        borderRadius: 10,
                                        marginBottom: 10,
                                        elevation: 2,
                                    }}
                                >
                                    <View style={{ width: 100, height: 100, backgroundColor: '#e0e0e0', borderRadius: 8 }} />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <View style={{ height: 20, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 5 }} />
                                        <View style={{ height: 15, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 5 }} />
                                        <View style={{ height: 15, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
                                    </View>
                                </Animatable.View>
                            )}
                            contentContainerStyle={{ padding: 10 }}
                        />
                    ) : (
                        <FlatList
                            data={files}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item, index }) => {
                                // Convert bytes to KB or MB
                                const formatBytes = (bytes) => {
                                    if (bytes < 1024) return `${bytes} bytes`;
                                    else if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
                                    else return `${(bytes / 1048576).toFixed(2)} MB`;
                                };

                                return (
                                    <TouchableOpacity onPress={() => {
                                        // const fileExtension = item.url.split('.').pop().toLowerCase(); // Get the file extension
                                        // if (fileExtension === 'pdf') {
                                        //     Linking.openURL(item.url); // Open PDF in external viewer
                                        // } else {
                                        setSelectedFile(item);
                                        setModalFileVisible(true); // Open modal for other file types
                                        // }
                                    }}>
                                        <Animatable.View
                                            animation="fadeInUp"
                                            duration={300}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: 10,
                                                backgroundColor: 'white',
                                                borderRadius: 10,
                                                marginBottom: 10,
                                                elevation: 2,
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 4,
                                            }}
                                        >
                                            <Image source={{ uri: item.url }} style={{ width: 100, height: 100, marginRight: 10, borderRadius: 8 }} />
                                            <View style={{ flex: 1 }}>
                                                {item.url && <Text allowFontScaling={false} style={{ fontWeight: 'bold' }}>{item.url.split('/').pop()}</Text>}
                                                <Text allowFontScaling={false} style={{ color: '#666' }}>{formatBytes(item.bytes)}</Text>
                                                <Text allowFontScaling={false} style={{ color: '#999' }}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => {
                                                Alert.alert(
                                                    i18n.t('deleteFileTitle'),
                                                    i18n.t('deleteFileConfirm'),
                                                    [
                                                        {
                                                            text: i18n.t('cancel'),
                                                            style: "cancel"
                                                        },
                                                        {
                                                            text: i18n.t('delete'),
                                                            style: "destructive",
                                                            onPress: () => deleteFile(index)
                                                        }
                                                    ]
                                                );
                                            }} style={{ marginLeft: 10 }}>
                                                <MaterialIcons name="delete" size={24} color="red" />
                                            </TouchableOpacity>
                                        </Animatable.View>
                                    </TouchableOpacity>
                                );
                            }}
                        />

                    )}
                    {uploadFileLoading && <ActivityIndicator size={"large"} color={"blue"} />}
                    <Modal visible={modalFileVisible} animationType="slide"
                        transparent={true} onRequestClose={() => setModalFileVisible(false)} onShow={() => {


                        }}>
                        <View style={styles.modalPaymentOverlay}>
                            <SafeAreaView>

                                <Animatable.View
                                    animation="slideInUp"
                                    duration={300} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "black", width: windowWidth, height: windowHeight }}>
                                    <View style={styles.fileHeader}>
                                        <TouchableOpacity style={{ flexDirection: "row", width: windowWidth / 4 }} onPress={() => setModalFileVisible(false)}>
                                            <AntDesign name="left" size={24} color="white" />

                                            <Text allowFontScaling={false} style={{ color: "white", fontSize: 18 }}>{i18n.t('back')}</Text>

                                        </TouchableOpacity>
                                        {selectedFile ? (
                                            <Text allowFontScaling={false} style={{ fontWeight: 'bold', color: "white" }}>{selectedFile.url.split('/').pop()}</Text>
                                        ) : (
                                            <Text allowFontScaling={false} style={{ color: 'white' }}>{i18n.t('fileNotExist')}</Text>
                                        )}
                                        <View style={{ width: windowWidth / 4 }}></View>
                                    </View>
                                    {selectedFile ? (
                                        <WebView source={{ uri: selectedFile.url }} style={{ width: windowWidth /* * 0.9 */, height: windowHeight * 0.9, backgroundColor: 'transparent', marginTop: 50, }} scalesPageToFit={true}
                                            contentMode="mobile" />
                                    ) : null}

                                </Animatable.View>
                            </SafeAreaView>
                        </View>
                    </Modal>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setModalFilePickerVisible(true)}
                    >
                        <LinearGradient
                            colors={['#4A90E2', '#357ABD']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <MaterialIcons name="add" size={24} color="white" />
                            <Text allowFontScaling={false} style={styles.addButtonText}>{i18n.t('addFile')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </PagerView>

            {/* Add Treatment Modal */}
            <AddTreatmentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSaveTreatment}
                treatment={newTreatment}
                treatments={treatments}
                setTreatment={setNewTreatment}
                clientDetails={clientDetails}
                setClientDetails={setClientDetails}
                setRepeat={setRepeat}
                repeat={repeat}
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
                                        <Text allowFontScaling={false} style={styles.editModalTitle}>{i18n.t('editBirthday')}</Text>
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
                                            <>
                                                <TouchableOpacity
                                                    onPress={() => setShowAndroidDatePicker(true)}
                                                    style={styles.androidPickerAgeButton}
                                                >
                                                    <Text allowFontScaling={false} style={styles.androidPickerAgeText}>
                                                        {tempBirthday.toLocaleDateString()}
                                                    </Text>
                                                </TouchableOpacity>
                                                {showAndroidDatePicker && (
                                                    <DateTimePicker
                                                        value={tempBirthday}
                                                        mode="date"
                                                        display="default"
                                                        onChange={(event, selectedDate) => {
                                                            setShowAndroidDatePicker(false);
                                                            if (event.type === 'set' && selectedDate) {
                                                                setTempBirthday(selectedDate);
                                                            }
                                                        }}
                                                        maximumDate={new Date()}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </View>

                                    <View style={styles.editModalFooter}>
                                        <TouchableOpacity
                                            style={styles.editModalCancelButton}
                                            onPress={() => setShowAgeDatePicker(false)}
                                        >
                                            <Text allowFontScaling={false} style={styles.editModalCancelText}>{i18n.t('cancel')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.editModalSaveButton, isSavingAge && styles.modalSaveButtonDisabled]}
                                            onPress={handleSaveAge}
                                            disabled={isSavingAge}
                                        >
                                            {isSavingAge ? (
                                                <ActivityIndicator color="white" size="small" />
                                            ) : (
                                                <Text allowFontScaling={false} style={styles.editModalSaveText}>{i18n.t('save')}</Text>
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

const AddTreatmentModal = ({ visible, onClose, onSave, treatment, treatments, clientDetails, setClientDetails, setTreatment, setRepeat, repeat }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [clientPrice, setClientPrice] = useState(0);
    const [treatmentStage, setTreatmentStage] = useState(clientDetails.clientPrice === 0 ? 0 : 1)
    const [isSaving, setIsSaving] = useState(false);
    // console.log("treatment.length:", Treatments.length, "clientDetails.numberOfMeetings:", clientDetails.numberOfMeetings)
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
            onRequestClose={() => { setTreatmentStage(0); onClose(); }}
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
                                <Text allowFontScaling={false} style={styles.modalTitle}>{i18n.t('addTreatmentTitle')}</Text>
                                <TouchableOpacity
                                    onPress={() => { setTreatmentStage(0); onClose(); }}
                                    style={styles.modalCloseButton}
                                >
                                    <MaterialIcons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            {treatmentStage === 0 && clientDetails.clientPrice === 0 ? (
                                <View>
                                    <Text allowFontScaling={false} style={styles.clientPricePrompt}>{i18n.t('treatmentPriceLabel')}</Text>
                                    <View style={styles.editModalContent}>
                                        <TextInput
                                            style={styles.editModalInput}
                                            placeholder={i18n.t('enterNewPricePlaceholder')}
                                            keyboardType="numeric"
                                            value={clientPrice.toString()}
                                            onChangeText={setClientPrice}
                                        />
                                    </View>
                                    <View style={styles.modalFooter}>
                                        <TouchableOpacity
                                            style={styles.cancelButtonTreatment}
                                            onPress={() => setTreatmentStage(1)}
                                        >
                                            <Text allowFontScaling={false} style={styles.cancelButtonText}>{i18n.t('skip')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                            onPress={async () => {
                                                try {
                                                    console.log("clientDetails._id:", clientDetails._id)
                                                    setIsSaving(true); let field = "clientPrice"; let value = parseInt(clientPrice); const response = await axios.patch(`${Api}/clients/${clientDetails._id}/updateField`, {
                                                        field,
                                                        value
                                                    });
                                                    setClientDetails(response.data);
                                                    setIsSaving(false);
                                                    setTreatmentStage(1);
                                                } catch (error) {
                                                    console.log("error update client price:", error)
                                                }

                                            }}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator color="white" size="small" />
                                            ) : (
                                                <Text allowFontScaling={false} style={styles.saveButtonText}>{i18n.t('next')}</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) :
                                <>

                                    <ScrollView style={styles.modalContent}>


                                        <View style={styles.dateTimeContainer}>
                                            <View style={styles.datePickerButton}>
                                                <Text allowFontScaling={false} style={styles.pickerTitle}>{i18n.t('selectDate')}</Text>
                                                {Platform.OS === 'ios' ? (
                                                    <DateTimePicker
                                                        value={treatment.treatmentDate}
                                                        mode="date"
                                                        display="inline"
                                                        onChange={(event, selectedDate) => {
                                                            if (selectedDate) {
                                                                setTreatment({
                                                                    ...treatment,
                                                                    treatmentDate: selectedDate
                                                                });
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <>
                                                        <TouchableOpacity
                                                            onPress={() => setShowDatePicker(true)}
                                                            style={styles.androidPickerButton}
                                                        >
                                                            <Text allowFontScaling={false} style={styles.androidPickerText}>
                                                                {treatment.treatmentDate.toLocaleDateString()}
                                                            </Text>
                                                        </TouchableOpacity>
                                                        {showDatePicker && (
                                                            <DateTimePicker
                                                                value={treatment.treatmentDate}
                                                                mode="date"
                                                                display="default"
                                                                onChange={(event, selectedDate) => {
                                                                    setShowDatePicker(false);
                                                                    if (event.type !== 'dismissed' && selectedDate) {
                                                                        setTreatment({
                                                                            ...treatment,
                                                                            treatmentDate: selectedDate
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </View>
                                            
                                            <View style={{ height: 10 }} />

                                            <View style={styles.datePickerButton}>
                                                <Text allowFontScaling={false} style={styles.pickerTitle}>{i18n.t('selectTime')}</Text>
                                                {Platform.OS === 'ios' ? (
                                                    <DateTimePicker
                                                        value={treatment.treatmentTime}
                                                        mode="time"
                                                        display="clock"
                                                        onChange={(event, selectedTime) => {
                                                            if (selectedTime) {
                                                                setTreatment({
                                                                    ...treatment,
                                                                    treatmentTime: selectedTime
                                                                });
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <>
                                                        <TouchableOpacity
                                                            onPress={() => setShowTimePicker(true)}
                                                            style={styles.androidPickerButton}
                                                        >
                                                            <Text allowFontScaling={false} style={styles.androidPickerText}>
                                                                {treatment.treatmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Text>
                                                        </TouchableOpacity>
                                                        {showTimePicker && (
                                                            <DateTimePicker
                                                                value={treatment.treatmentTime}
                                                                mode="time"
                                                                display="default"
                                                                onChange={(event, selectedTime) => {
                                                                    setShowTimePicker(false);
                                                                    if (event.type !== 'dismissed' && selectedTime) {
                                                                        setTreatment({
                                                                            ...treatment,
                                                                            treatmentTime: selectedTime
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </View>
                                        </View>


                                        {treatments.length < clientDetails.numberOfMeetings - 1 && <View style={styles.repeatContainer}>
                                            <Text allowFontScaling={false} style={styles.repeatLabel}>
                                                <MaterialIcons name="repeat" size={20} color="#014495" />
                                                <Text allowFontScaling={false} style={styles.repeatLabelText}> {i18n.t('repeatLabel')}</Text>
                                            </Text>

                                            <View style={styles.repeatOptions}>
                                                {[
                                                    { label: i18n.t('everyWeek'), value: 'weekly' },
                                                    { label: i18n.t('never'), value: 'never' },

                                                    /* { label: 'Every 2 weeks', value: 'biweekly' } */
                                                ].map((option) => (
                                                    <Animatable.View
                                                        key={option.value}
                                                        animation="fadeIn"
                                                        duration={500}
                                                        delay={100}
                                                    >
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.repeatOption,
                                                                repeat === option.value && styles.repeatOptionActive
                                                            ]}
                                                            onPress={() => setRepeat(option.value)}
                                                        >
                                                            <MaterialIcons
                                                                name={
                                                                    option.value === 'never' ? 'close' :
                                                                        option.value === 'weekly' ? 'event-repeat' :
                                                                            'date-range'
                                                                }
                                                                size={20}
                                                                color={repeat === option.value ? 'white' : '#014495'}
                                                            />
                                                            <Text allowFontScaling={false} style={[
                                                                styles.repeatOptionText,
                                                                repeat === option.value && styles.repeatOptionTextActive
                                                            ]}>
                                                                {option.label}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </Animatable.View>
                                                ))}
                                            </View>
                                        </View>}

                                    </ScrollView>

                                    <View style={styles.modalFooter}>
                                        <TouchableOpacity
                                            style={styles.cancelButtonTreatment}
                                            onPress={() => { setTreatmentStage(0); onClose(); }}
                                        >
                                            <Text allowFontScaling={false} style={styles.cancelButtonText}>{i18n.t('cancel')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                            onPress={() => { setTreatmentStage(0); handleSave(repeat); }}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator color="white" size="small" />
                                            ) : (
                                                <Text allowFontScaling={false} style={styles.saveButtonText}>{i18n.t('save')}</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>}
                        </Animatable.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const TabBar = ({ activeTab, handlePageChange, animatedIndicatorStyle }) => (
    <View style={styles.tabBarContainer}>
        {[i18n.t('tabProfile'), i18n.t('treatments'), i18n.t('payments'), i18n.t('files')].map((tab, index) => (
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
                                    index === 2 ? 'payments' :
                                        'insert-drive-file'

                        }
                        size={24}
                        color={activeTab === index ? '#014495' : '#666'}
                    />
                    <Text allowFontScaling={false} style={[
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
                    <Text allowFontScaling={false} style={styles.statValue}>{stat.value}</Text>
                    <Text allowFontScaling={false} style={styles.statLabel}>{stat.label}</Text>
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
        width: windowWidth / 4,
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
        marginHorizontal: 20,
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
        // elevation: 2,
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
        marginStart: 4,
    },
    dateText: {
        marginStart: 8,
        fontSize: 16,
        color: '#333',
    },
    timeText: {
        marginStart: 8,
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
        width: "auto"
    },
    statusText: {
        marginStart: 4,
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
        // backgroundColor: 'yellow',
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
        // elevation: 2,
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
        marginStart: 8,
        fontSize: 16,
        color: '#333',
    },
    paymentAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#014495',
        marginStart: 8,
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
        marginStart: 4,
        fontSize: 12,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: Platform.OS === "ios" ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalIdOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        paddingBottom: 20,
        // flexGrow: 1
    },

    modalContainer: {
        backgroundColor: 'white',
        width: windowWidth * 0.9,
        justifyContent: 'center',
        // paddingLeft: 20,
       // paddingRight: 10,
        // alignItems: 'center',
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
    modalIdHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#014495',
    },
    modalIdTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    saveIdButton: {
        backgroundColor: '#014495',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonIdDisabled: {
        backgroundColor: '#ccc',
    },
    modalCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    closeButton: {
        padding: 8,
    },
    modalContent: {
        // padding: 20,
    },
    modalIdContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        maxHeight: '90%',
        // justifyContent: "flex-end"
    },
    dateTimeContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
    /*  dateTimeContainer: {
         flexDirection: 'row',
         justifyContent: 'space-between',
         marginBottom: 10,
     }, */
    /* datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 10,
    }, */
    datePickerButton: {
        // Ensure this style includes any necessary styling for the picker container
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        alignItems: 'center',
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#014495',
        marginBottom: 8,
        textAlign: 'center',
    },
    datePickerText: {
        marginStart: 8,
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
    page: { flex: 1 },
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
        end: 8,
        backgroundColor: '#E0E7FF',
        borderRadius: 12,
        padding: 4,
    },
    editIdIndicator: {
        position: 'absolute',
        // top: 5,
        end: 8,
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
        justifyContent: 'space-between',
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
        marginStart: 12,
    },
    editModalCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    editModalContent: {
        margin: 20,
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
        marginEnd: 12,
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
        // paddingVertical: 40
    },
    descriptionModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
        justifyContent: "flex-end",
        paddingVertical: 40
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
        maxHeight: 250,
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
        end: 24,
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
        marginStart: 8,
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
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        // backgroundColor: "yellow",
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
        marginStart: 12,
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
        marginStart: 12,
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
        width: windowWidth * 0.9,
        maxHeight: windowHeight * 0.7, // Limit the height
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    treatmentPrice: {
        flexDirection: 'row',
        alignItems: 'center',
        // marginTop: 10,
    },
    priceText: {
        marginStart: 5,
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
    treatmentsLabel: {
        color: '#666',
        fontSize: 14,
    },
    treatmentsCount: {
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    currentTreatments: {
        color: '#014495',
        fontWeight: '600',
    },
    treatmentsSeparator: {
        color: '#666',
        marginHorizontal: 2,
    },
    totalTreatments: {
        color: '#014495',
        fontWeight: '600',
    },
    repeatContainer: {
        marginTop: 20,
        marginBottom: 15,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    repeatLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    repeatLabelText: {
        fontSize: 16,
        color: '#014495',
        fontWeight: '500',
        marginStart: 4,
    },
    repeatOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
    },
    repeatOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#014495',
        minWidth: 100,
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    repeatOptionActive: {
        backgroundColor: '#014495',
        borderColor: '#014495',
    },
    repeatOptionText: {
        marginStart: 6,
        color: '#014495',
        fontSize: 14,
        fontWeight: '500',
    },
    repeatOptionTextActive: {
        color: 'white',
    },
    idNumberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        // marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        marginBottom: 20
    },
    idNumberButton: {
        flex: 1,
        marginStart: 12,
    },
    idNumberLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    idNumberValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    idNumberValue: {
        fontSize: 16,
        color: '#014495',
        fontWeight: '500',
    },
    idNumberPlaceholder: {
        color: '#999',
        fontStyle: 'italic',
    },
    saveButtonIdText: {
        color: 'white',
        fontWeight: '500',
    },
    modalIdBody: {
        padding: 16,
    },
    inputIdContainer: {
        marginBottom: 16,
    },
    inputIdLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    inputId: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    errorIdText: {
        color: '#ff3b30',
        fontSize: 12,
        marginTop: 4,
    },
    modalFilePickerContainer: {
        backgroundColor: 'white',
        width: windowWidth * 0.9,
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        padding: 20,
    },
    modalFilePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalFilePickerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#014495',
    },
    optionFilePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    optionFilePickerText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    modalFilePickerCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F0F4F8',
    },
    fileHeader: {
        marginTop: 50,
        backgroundColor: 'black',
        width: windowWidth,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: "center",
        height: windowHeight * 0.1
    },
    clientPricePrompt: {
        fontSize: 18,
        color: '#333', // Dark gray for better readability
        margin: 10, // Space above and below the text
        textAlign: 'flex-start', // Center the text
    },

    relativeTimeText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        marginBottom: 8,
        marginLeft: 4,
        fontStyle: 'italic',
        opacity: 0.8
    },
    androidPickerButton: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    androidPickerText: {
        fontSize: 16,
        color: '#333',
    },

    androidPickerAgeButton: {
        padding: 12,
        margin: 12,
        backgroundColor: '#F8F9FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    androidPickerAgeText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },

    // Empty Treatments State Styles
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 60,
    },
    emptyGradient: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 50,
        paddingHorizontal: 30,
        borderRadius: 20,
        shadowColor: '#014495',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    emptyIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: '#014495',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#014495',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 280,
        opacity: 0.9,
    },

    // Empty Files State Styles
    emptyFilesState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 60,
    },
    emptyFilesGradient: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 50,
        paddingHorizontal: 30,
        borderRadius: 20,
        shadowColor: '#014495',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    emptyFilesIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: '#014495',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    emptyFilesStateTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#014495',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    emptyFilesStateText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 280,
        opacity: 0.9,
    },

});