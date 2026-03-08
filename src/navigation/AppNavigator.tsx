import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTheme } from 'react-native-paper'

import { CommunityScreen } from '../screens/CommunityScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { RecordScreen } from '../screens/RecordScreen'

export type RootTabParamList = {
    Home: undefined
    Record: undefined
    Community: undefined
    Profile: undefined
}

const Tab = createBottomTabNavigator<RootTabParamList>()

export function AppNavigator() {
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
