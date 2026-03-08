import { StatusBar } from 'expo-status-bar'
import { Alert, Button, Text, View } from 'react-native'

import { useScreenStyles } from '../theme'

export function HomeScreen() {
    const styles = useScreenStyles()
    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Home</Text>
            <Button
                title="Click me"
                onPress={() => Alert.alert('Button pressed')}
            />
            <StatusBar style="auto" />
        </View>
    )
}
