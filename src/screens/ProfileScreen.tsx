import { StatusBar } from 'expo-status-bar'
import { Button, View } from 'react-native'
import { Text } from 'react-native-paper'

import { useAuth } from '../context/AuthContext'
import { useScreenStyles } from '../theme'

export function ProfileScreen() {
    const styles = useScreenStyles()
    const { userEmail, logout } = useAuth()

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Profile</Text>
            <Text>{userEmail ? `当前账号：${userEmail}` : '未登录'}</Text>
            <Button title="退出登录" onPress={() => void logout()} />
            <StatusBar style="auto" />
        </View>
    )
}
