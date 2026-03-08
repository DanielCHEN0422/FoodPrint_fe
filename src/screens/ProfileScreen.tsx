import { StatusBar } from 'expo-status-bar'
import { Text, View } from 'react-native'

import { useScreenStyles } from '../theme'

export function ProfileScreen() {
    const styles = useScreenStyles()
    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Profile</Text>
            <StatusBar style="auto" />
        </View>
    )
}
