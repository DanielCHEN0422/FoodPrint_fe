import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { useAuth } from '../context/AuthContext'
import type { AuthStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>

export function RegisterScreen({ navigation }: Props) {
    const theme = useTheme()
    const { register } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const styles = createStyles(theme.colors)

    const onRegister = async () => {
        if (password !== confirmPassword) {
            setError('两次输入密码不一致')
            return
        }

        setSubmitting(true)
        setError('')
        const result = await register(email, password)
        if (!result.success) {
            setError(result.message ?? '注册失败')
        }
        setSubmitting(false)
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            style={styles.container}
        >
            <View style={styles.card}>
                <Text variant="headlineMedium" style={styles.title}>
                    注册 FoodPrint
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
                <TextInput
                    label="确认密码"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                />
                <HelperText type="error" visible={!!error}>
                    {error}
                </HelperText>
                <Button
                    mode="contained"
                    onPress={onRegister}
                    loading={submitting}
                    disabled={submitting}
                    style={styles.button}
                >
                    注册
                </Button>
                <Button mode="text" onPress={() => navigation.navigate('Login')}>
                    已有账号？去登录
                </Button>
            </View>
            <StatusBar style="auto" />
        </KeyboardAvoidingView>
    )
}

function createStyles(colors: {
    background: string
    surface: string
    elevation: { level2: string }
}) {
    return StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
            backgroundColor: colors.background,
        },
        card: {
            backgroundColor: colors.surface,
            padding: 20,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 2,
        },
        title: {
            textAlign: 'center',
            marginBottom: 16,
        },
        input: {
            marginBottom: 8,
        },
        button: {
            marginTop: 8,
            marginBottom: 6,
        },
    })
}
