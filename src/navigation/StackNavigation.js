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