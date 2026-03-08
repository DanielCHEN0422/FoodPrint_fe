import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { CommonActions, NavigationContainer } from '@react-navigation/native'
import { BottomNavigation } from 'react-native-paper'

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
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{ headerTitleAlign: 'center' }}
                tabBar={({ navigation, state, descriptors, insets }) => (
                    <BottomNavigation.Bar
                        navigationState={state}
                        safeAreaInsets={insets}
                        onTabPress={({
                            route,
                            preventDefault,
                        }: {
                            route: {
                                key: string
                                name: string
                                params?: object
                            }
                            preventDefault: () => void
                        }) => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            })
                            if (event.defaultPrevented) {
                                preventDefault()
                            } else {
                                navigation.dispatch({
                                    ...CommonActions.navigate(
                                        route.name,
                                        route.params
                                    ),
                                    target: state.key,
                                })
                            }
                        }}
                        renderIcon={({
                            route,
                            focused,
                            color,
                        }: {
                            route: { key: string }
                            focused: boolean
                            color: string
                        }) => {
                            const { options } = descriptors[route.key]
                            return (
                                options.tabBarIcon?.({
                                    focused,
                                    color,
                                    size: 24,
                                }) ?? null
                            )
                        }}
                        getLabelText={({
                            route,
                        }: {
                            route: { key: string; name: string }
                        }) => {
                            const { options } = descriptors[route.key]
                            if (typeof options.tabBarLabel === 'string')
                                return options.tabBarLabel
                            if (typeof options.title === 'string')
                                return options.title
                            return route.name
                        }}
                    />
                )}
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
        </NavigationContainer>
    )
}
