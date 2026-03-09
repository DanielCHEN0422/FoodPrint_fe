import type { StackScreenProps } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useMemo, useState } from 'react'
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native'
import {
    Button,
    HelperText,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper'

import {
    evaluatePasswordStrength,
    isValidEmail,
    useAuth,
} from '../context/AuthContext'
import type { AuthStackParamList } from '../navigation/types'

type Props = StackScreenProps<AuthStackParamList, 'Register'>

export function RegisterScreen({ navigation }: Props) {
    const theme = useTheme()
    const { register } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const themedStyles = useMemo(
        () => ({
            errorBox: { backgroundColor: theme.colors.errorContainer },
            errorText: { color: theme.colors.onErrorContainer },
            formCard: { backgroundColor: theme.colors.surface },
            page: { backgroundColor: '#E8F0E7' },
            passRuleDone: { color: theme.colors.primary },
            passRulePending: { color: theme.colors.onSurfaceVariant },
            statText: { color: '#7C9A79' },
        }),
        [
            theme.colors.errorContainer,
            theme.colors.onErrorContainer,
            theme.colors.onSurfaceVariant,
            theme.colors.primary,
            theme.colors.surface,
        ]
    )
    const emailTouched = email.length > 0
    const emailValid = isValidEmail(email)
    const passwordStrength = evaluatePasswordStrength(password)

    const onRegister = async () => {
        // Dismiss keyboard to release iOS credential focus before navigating to Onboarding
        Keyboard.dismiss()

        setSubmitting(true)
        setError('')
        const result = await register(email, password)
        if (!result.success) {
            setError(result.message ?? 'Registration failed')
        }
        setSubmitting(false)
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            style={[styles.page, themedStyles.page]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                horizontal={false}
                keyboardDismissMode={
                    Platform.OS === 'ios' ? 'interactive' : 'on-drag'
                }
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={Keyboard.dismiss}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.brandSection}>
                    <Text style={styles.brandTitle}>FoodPrint</Text>
                    <View style={styles.statRow}>
                        <MaterialCommunityIcons
                            color={themedStyles.statText.color}
                            name="shield-check-outline"
                            size={20}
                        />
                        <Text style={[styles.statText, themedStyles.statText]}>
                            Start your healthy eating journey
                        </Text>
                    </View>
                </View>

                <View style={[styles.formCard, themedStyles.formCard]}>
                    <Text style={styles.formTitle}>Create Account</Text>
                    <Text style={styles.subTitle}>
                        Save your diet records and get personalized suggestions
                    </Text>

                    <TextInput
                        label="Email"
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        left={<TextInput.Icon icon="email-outline" />}
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                    />
                    <HelperText
                        type="error"
                        visible={emailTouched && !emailValid}
                    >
                        <Text>Please enter a valid email (e.g. name@example.com)</Text>
                    </HelperText>

                    <TextInput
                        autoComplete="password-new"
                        label="Password"
                        left={<TextInput.Icon icon="lock-outline" />}
                        mode="outlined"
                        onChangeText={setPassword}
                        passwordRules="required: lower; required: upper; required: digit; required: special; minlength: 8;"
                        secureTextEntry
                        style={styles.input}
                        textContentType="newPassword"
                        value={password}
                    />

                    <View style={styles.ruleCard}>
                        <Text style={styles.ruleTitle}>Password requirements</Text>
                        <Text
                            variant="bodySmall"
                            style={
                                passwordStrength.minLength
                                    ? themedStyles.passRuleDone
                                    : themedStyles.passRulePending
                            }
                        >
                            - At least 8 characters
                        </Text>
                        <Text
                            variant="bodySmall"
                            style={
                                passwordStrength.hasUppercase
                                    ? themedStyles.passRuleDone
                                    : themedStyles.passRulePending
                            }
                        >
                            - One uppercase letter
                        </Text>
                        <Text
                            variant="bodySmall"
                            style={
                                passwordStrength.hasLowercase
                                    ? themedStyles.passRuleDone
                                    : themedStyles.passRulePending
                            }
                        >
                            - One lowercase letter
                        </Text>
                        <Text
                            variant="bodySmall"
                            style={
                                passwordStrength.hasNumber
                                    ? themedStyles.passRuleDone
                                    : themedStyles.passRulePending
                            }
                        >
                            - One number
                        </Text>
                        <Text
                            variant="bodySmall"
                            style={
                                passwordStrength.hasSpecial
                                    ? themedStyles.passRuleDone
                                    : themedStyles.passRulePending
                            }
                        >
                            - One special character
                        </Text>
                    </View>

                    <TextInput
                        autoComplete="password-new"
                        label="Confirm Password"
                        left={<TextInput.Icon icon="lock-check-outline" />}
                        mode="outlined"
                        onChangeText={setConfirmPassword}
                        passwordRules="required: lower; required: upper; required: digit; required: special; minlength: 8;"
                        secureTextEntry
                        style={styles.input}
                        textContentType="newPassword"
                        value={confirmPassword}
                    />

                    {error ? (
                        <View style={[styles.errorBox, themedStyles.errorBox]}>
                            <MaterialCommunityIcons
                                color={themedStyles.errorText.color}
                                name="alert-circle-outline"
                                size={20}
                            />
                            <Text
                                style={[
                                    styles.errorText,
                                    themedStyles.errorText,
                                ]}
                            >
                                {error}
                            </Text>
                        </View>
                    ) : null}

                    <Button
                        buttonColor="#8BA888"
                        disabled={submitting}
                        loading={submitting}
                        mode="contained"
                        onPress={onRegister}
                        style={styles.registerButton}
                    >
                        <Text>{submitting ? 'Signing Up...' : 'Sign Up'}</Text>
                    </Button>

                    <View style={styles.loginRow}>
                        <Text>Already have an account?</Text>
                        <Button
                            compact
                            mode="text"
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text>Sign In</Text>
                        </Button>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </Text>
                </View>
            </ScrollView>
            <StatusBar style="auto" />
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    brandSection: {
        marginBottom: 18,
    },
    brandTitle: {
        color: '#2F3E2D',
        fontSize: 38,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
    },
    errorBox: {
        alignItems: 'flex-start',
        borderRadius: 12,
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
        padding: 12,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        marginTop: 16,
    },
    footerText: {
        color: '#66756A',
        fontSize: 12,
        textAlign: 'center',
    },
    formCard: {
        borderRadius: 24,
        elevation: 3,
        padding: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    formTitle: {
        color: '#324032',
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        marginBottom: 8,
    },
    loginRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    page: {
        flex: 1,
    },
    registerButton: {
        borderRadius: 14,
        marginTop: 2,
        paddingVertical: 2,
    },
    ruleCard: {
        backgroundColor: '#F5F8F5',
        borderRadius: 14,
        marginBottom: 10,
        padding: 12,
    },
    ruleTitle: {
        color: '#324032',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 24,
    },
    statRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
    },
    statText: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
    subTitle: {
        color: '#7B8778',
        fontSize: 13,
        marginBottom: 16,
    },
})
