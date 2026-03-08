import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useTheme } from 'react-native-paper'

import { useAuth } from '../context/AuthContext'
import { LoginScreen } from '../screens/LoginScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { CommunityScreen } from '../screens/CommunityScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { RecordScreen } from '../screens/RecordScreen'
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
                headerTitleAlign: 'center',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.onSurface,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <AuthStack.Screen
                name="Login"
                component={LoginScreen}
                options={{ title: '登录' }}
            />
            <AuthStack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ title: '注册' }}
            />
        </AuthStack.Navigator>
    )
}

export function AppNavigator() {
    const theme = useTheme()
    const { isAuthenticated, isLoading } = useAuth()

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

    return isAuthenticated ? <MainTabs /> : <AuthNavigator />
}

const styles = StyleSheet.create({
    loadingContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
})
