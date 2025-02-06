/* import { createStackNavigator } from "@react-navigation/stack";
import CalendarScreen from "../screens/Calendar";
import LoginScreen from "../screens/auth/LoginScreen";
import HomeScreen from "../screens/Home";
import ClientsScreen from "../screens/Clients";
import SignUpScreen from "../screens/auth/SignUp";
const Stack = createStackNavigator();
export default function StackNavigation() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
                name="LoginScreen"
                component={LoginScreen}
            />
            <Stack.Screen
                options={{ headerShown: false }}
                name="signUpScreen"
                component={SignUpScreen}
            />

            <Stack.Screen
                options={{ headerShown: false }}
                name="HomeScreen"
                component={HomeScreen}
            />
            <Stack.Screen
                options={{ headerShown: false }}
                name="ClientsScreen"
                component={ClientsScreen}
            />



            <Stack.Screen
                options={{ headerShown: false }}
                name="CalendarScreen"
                component={CalendarScreen}
            />


        </Stack.Navigator>
    );
}
 */
import { createStackNavigator } from "@react-navigation/stack";
import Clients from "../screens/Clients";
import Treatments from "../screens/Treatments";
import TreatmentForm from "../screens/TreatmentForm";
import ClientForm from "../screens/ClientForm";
const Stack = createStackNavigator();

const ClientStack = () => (
    <Stack.Navigator>
        <Stack.Screen name="Clients" component={Clients} options={{
            headerShown: false,
            headerStyle: { backgroundColor: '#1F609A' },
            headerTintColor: '#fff',
        }}
        />
        <Stack.Screen
            name="Treatments"
            component={Treatments}
            options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#1F609A' },
                headerTintColor: '#fff', // This changes the text color to white
                headerTitleStyle: { fontWeight: 'bold', fontFamily: "Rubik-italic" }, // You can customize the font style if needed
                headerLeft: () => null,

            }}
        />
        <Stack.Screen
            name="TreatmentForm"
            component={TreatmentForm}
            options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#1F609A' },
                headerTintColor: '#fff',
            }}
        />
        <Stack.Screen name="ClientForm" component={ClientForm} options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#1F609A' },
            headerTintColor: '#fff',
        }}
        />
    </Stack.Navigator>
);

export default ClientStack;