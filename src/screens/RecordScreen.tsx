import { StatusBar } from 'expo-status-bar'
import { Text, View } from 'react-native'

import { useScreenStyles } from '../theme'

export function RecordScreen() {
    const styles = useScreenStyles()
    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Record</Text>
            <StatusBar style="auto" />
        </View>
    )
}
