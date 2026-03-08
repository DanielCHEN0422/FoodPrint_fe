import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'
import {
    Button,
    HelperText,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper'

import { useAuth } from '../context/AuthContext'
import type { AuthStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

export function LoginScreen({ navigation }: Props) {
    const theme = useTheme()
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const onLogin = async () => {
        setSubmitting(true)
        setError('')
        const result = await login(email, password)
        if (!result.success) {
            setError(result.message ?? '登录失败')
        }
        setSubmitting(false)
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Text variant="headlineMedium" style={styles.title}>
                    登录 FoodPrint
                </Text>
                <TextInput
                    label="邮箱"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                />
                <TextInput
                    label="密码"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                />
                <HelperText type="error" visible={!!error}>
                    {error}
                </HelperText>
                <Button
                    mode="contained"
                    onPress={onLogin}
                    loading={submitting}
                    disabled={submitting}
                    style={styles.button}
                >
                    <Text>登录</Text>
                </Button>
                <Button
                    mode="text"
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text>还没有账号？去注册</Text>
                </Button>
            </View>
            <StatusBar style="auto" />
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    button: {
        marginBottom: 6,
        marginTop: 8,
    },
    card: {
        borderRadius: 12,
        elevation: 2,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    input: {
        marginBottom: 8,
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
    },
})
