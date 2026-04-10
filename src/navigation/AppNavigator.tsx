import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useTheme } from 'react-native-paper'

import { useAuth } from '../context/AuthContext'
import { CommunityScreen } from '../screens/Community'
import { HomeScreen } from '../screens/HomeScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { OnboardingScreen } from '../screens/OnboardingScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { RecordScreen } from '../screens/RecordScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import type { AuthStackParamList, RootTabParamList } from './types'

const Tab = createBottomTabNavigator<RootTabParamList>()
const AuthStack = createNativeStackNavigator<AuthStackParamList>()

function MainTabs() {
    const theme = useTheme()
    const { colors } = theme

    return (
        <Tab.Navigator
            screenOptions={{
                headerTitleAlign: 'center',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.onSurface,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.outline,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.onSurfaceVariant,
                tabBarShowLabel: true,
                animation: 'shift',
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="home"
                            size={size ?? 24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Record"
                component={RecordScreen}
                options={{
                    tabBarLabel: 'Record',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="camera-plus"
                            size={size ?? 24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Community"
                component={CommunityScreen}
                options={{
                    tabBarLabel: 'Community',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="account-group"
                            size={size ?? 24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons
                            name="account"
                            size={size ?? 24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    )
}

function AuthNavigator() {
    const theme = useTheme()
    const { colors } = theme

    return (
        <AuthStack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                headerShown: false,
            }}
        >
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    )
}

export function AppNavigator() {
    const theme = useTheme()
    const { hasCompletedOnboarding, isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return (
            <View
                style={[
                    styles.loadingContainer,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
        )
    }

    if (!isAuthenticated) {
        return <AuthNavigator />
    }

    if (!hasCompletedOnboarding) {
        return <OnboardingScreen />
    }

    return <MainTabs />
}

const styles = StyleSheet.create({
    loadingContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
})
