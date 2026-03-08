import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import { Provider as PaperProvider } from 'react-native-paper'

import { AppNavigator } from './src/navigation/AppNavigator'
import { getCombinedTheme, getNavigationTheme } from './src/theme'

export default function App() {
    const colorScheme = useColorScheme()
    const isDark = colorScheme === 'dark'
    const paperTheme = getCombinedTheme(isDark ? 'dark' : 'light')
    const navigationTheme = getNavigationTheme(isDark ? 'dark' : 'light')

    return (
        <PaperProvider theme={paperTheme}>
            <NavigationContainer theme={navigationTheme}>
                <AppNavigator />
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'auto'} />
            </NavigationContainer>
        </PaperProvider>
    )
}
