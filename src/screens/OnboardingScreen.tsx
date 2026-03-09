import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { StatusBar } from 'expo-status-bar'
import { useMemo, useState } from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput as RNTextInput,
    View,
} from 'react-native'
import { Button, ProgressBar, Text, useTheme } from 'react-native-paper'

import { useAuth } from '../context/AuthContext'

const TOTAL_STEPS = 5

const GOAL_OPTIONS = [
    { value: 'lose', label: 'Lose Weight', desc: 'Burn fat and get leaner' },
    { value: 'maintain', label: 'Maintain', desc: 'Stay at your current weight' },
    { value: 'gain', label: 'Gain Muscle', desc: 'Build strength and muscle mass' },
] as const

const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other / Prefer not to say' },
] as const

const ACTIVITY_OPTIONS = [
    { value: 'low', label: 'Lightly Active', desc: 'Desk job, little exercise' },
    { value: 'medium', label: 'Moderately Active', desc: 'Light exercise 3–5 days/week' },
    { value: 'high', label: 'Very Active', desc: 'Intense exercise 6–7 days/week' },
] as const

const DIET_PREFERENCES = [
    { value: 'none', label: 'No Restrictions', icon: 'silverware-fork-knife' },
    { value: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
    { value: 'vegan', label: 'Vegan', icon: 'sprout' },
    { value: 'keto', label: 'Ketogenic', icon: 'food-steak' },
    { value: 'low-carb', label: 'Low Carb', icon: 'food-apple-outline' },
    { value: 'halal', label: 'Halal', icon: 'star-crescent' },
    { value: 'kosher', label: 'Kosher', icon: 'star-david' },
    { value: 'paleo', label: 'Paleo', icon: 'food-drumstick' },
] as const

function toNumber(value: string) {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
}

export function OnboardingScreen() {
    const theme = useTheme()
    const { completeOnboarding, updateProfile, userEmail, userProfile } =
        useAuth()
    const [step, setStep] = useState(1)
    const [submitting, setSubmitting] = useState(false)

    const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>(
        userProfile?.goal ?? 'lose'
    )
    const [gender, setGender] = useState<'male' | 'female' | 'other'>(
        userProfile?.gender ?? 'male'
    )
    const [height, setHeight] = useState(userProfile?.height?.toString() ?? '')
    const [weight, setWeight] = useState(userProfile?.weight?.toString() ?? '')
    const [age, setAge] = useState(userProfile?.age?.toString() ?? '')
    const [activityLevel, setActivityLevel] = useState<
        'low' | 'medium' | 'high'
    >(userProfile?.activityLevel ?? 'medium')
    const [dietPreference, setDietPreference] = useState(
        userProfile?.dietPreference ?? 'none'
    )

    const themedStyles = useMemo(
        () => ({
            card: { backgroundColor: theme.colors.surface },
            page: { backgroundColor: '#E8F0E7' },
            selected: {
                backgroundColor: '#E8F0E7',
                borderColor: '#8BA888',
            },
            unselected: {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
            },
        }),
        [theme.colors.outlineVariant, theme.colors.surface]
    )

    const calculateDailyCalories = () => {
        const heightCm = toNumber(height)
        const weightKg = toNumber(weight)
        const ageYears = toNumber(age)

        if (!heightCm || !weightKg || !ageYears) {
            return 2000
        }

        const bmr =
            gender === 'male'
                ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
                : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161

        const activityMultiplier =
            activityLevel === 'low'
                ? 1.2
                : activityLevel === 'high'
                  ? 1.55
                  : 1.375

        let tdee = bmr * activityMultiplier
        if (goal === 'lose') {
            tdee -= 500
        }
        if (goal === 'gain') {
            tdee += 500
        }
        return Math.max(1200, Math.round(tdee))
    }

    const canProceed = () => {
        if (step === 3) {
            return (
                toNumber(height) > 0 &&
                toNumber(weight) > 0 &&
                toNumber(age) > 0
            )
        }
        return true
    }

    const onNext = async () => {
        if (step < TOTAL_STEPS) {
            setStep((prev) => prev + 1)
            return
        }

        setSubmitting(true)
        await updateProfile({
            activityLevel,
            age: toNumber(age),
            dailyCalories: calculateDailyCalories(),
            dietPreference,
            email: userEmail ?? '',
            gender,
            goal,
            height: toNumber(height),
            weight: toNumber(weight),
        })
        await completeOnboarding()
        setSubmitting(false)
    }

    const onBack = () => {
        if (step > 1) {
            setStep((prev) => prev - 1)
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            style={[styles.page, themedStyles.page]}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.progressBlock}>
                    <View style={styles.progressRow}>
                        <Text>{`Step ${step} of ${TOTAL_STEPS}`}</Text>
                        <Text>{`${Math.round((step / TOTAL_STEPS) * 100)}%`}</Text>
                    </View>
                    <ProgressBar
                        color="#8BA888"
                        progress={step / TOTAL_STEPS}
                        style={styles.progressBar}
                    />
                </View>

                <View style={[styles.card, themedStyles.card]}>
                    {step === 1 ? (
                        <>
                            <Text style={styles.title}>{"What's your goal?"}</Text>
                            <Text style={styles.subtitle}>
                                {"We'll tailor calorie suggestions to your goal"}
                            </Text>
                            {GOAL_OPTIONS.map((item) => (
                                <Button
                                    key={item.value}
                                    mode="outlined"
                                    onPress={() => setGoal(item.value)}
                                    contentStyle={styles.optionButtonContent}
                                    style={[
                                        styles.optionButton,
                                        goal === item.value
                                            ? themedStyles.selected
                                            : themedStyles.unselected,
                                    ]}
                                >
                                    <View style={styles.optionButtonInner}>
                                        <Text style={styles.optionLabel}>
                                            {item.label}
                                        </Text>
                                        <Text style={styles.optionDesc}>
                                            {item.desc}
                                        </Text>
                                    </View>
                                </Button>
                            ))}
                        </>
                    ) : null}

                    {step === 2 ? (
                        <>
                            <Text style={styles.title}>{"What's your gender?"}</Text>
                            <Text style={styles.subtitle}>
                                Helps us estimate your calorie needs more accurately
                            </Text>
                            {GENDER_OPTIONS.map((item) => (
                                <Button
                                    key={item.value}
                                    mode="outlined"
                                    onPress={() => setGender(item.value)}
                                    style={[
                                        styles.optionButton,
                                        gender === item.value
                                            ? themedStyles.selected
                                            : themedStyles.unselected,
                                    ]}
                                >
                                    <Text>{item.label}</Text>
                                </Button>
                            ))}
                        </>
                    ) : null}

                    {step === 3 ? (
                        <View
                            collapsable={false}
                            pointerEvents="box-none"
                            style={styles.step3Wrapper}
                        >
                            <Text style={styles.title}>About you</Text>
                            <Text style={styles.subtitle}>
                                We use this to calculate your daily calorie target
                            </Text>
                            {/* Native TextInput with textContentType="none" to break iOS AutoFill chain after strong password */}
                            <Text style={styles.step3Label}>Height (cm)</Text>
                            <RNTextInput
                                autoComplete="off"
                                importantForAutofill="no"
                                keyboardType="number-pad"
                                onChangeText={setHeight}
                                placeholder="e.g. 175"
                                placeholderTextColor="#9E9E9E"
                                style={styles.step3Input}
                                textContentType="none"
                                value={height}
                            />
                            <Text style={styles.step3Label}>Weight (kg)</Text>
                            <RNTextInput
                                autoComplete="off"
                                importantForAutofill="no"
                                keyboardType="number-pad"
                                onChangeText={setWeight}
                                placeholder="e.g. 70"
                                placeholderTextColor="#9E9E9E"
                                style={styles.step3Input}
                                textContentType="none"
                                value={weight}
                            />
                            <Text style={styles.step3Label}>Age</Text>
                            <RNTextInput
                                autoComplete="off"
                                importantForAutofill="no"
                                keyboardType="number-pad"
                                onChangeText={setAge}
                                placeholder="e.g. 25"
                                placeholderTextColor="#9E9E9E"
                                style={styles.step3Input}
                                textContentType="none"
                                value={age}
                            />
                        </View>
                    ) : null}

                    {step === 4 ? (
                        <>
                            <Text style={styles.title}>How active are you?</Text>
                            <Text style={styles.subtitle}>
                                More activity usually means higher daily calories
                            </Text>
                            {ACTIVITY_OPTIONS.map((item) => (
                                <Button
                                    key={item.value}
                                    mode="outlined"
                                    onPress={() => setActivityLevel(item.value)}
                                    contentStyle={styles.optionButtonContent}
                                    style={[
                                        styles.optionButton,
                                        activityLevel === item.value
                                            ? themedStyles.selected
                                            : themedStyles.unselected,
                                    ]}
                                >
                                    <View style={styles.optionButtonInner}>
                                        <Text style={styles.optionLabel}>
                                            {item.label}
                                        </Text>
                                        <Text style={styles.optionDesc}>
                                            {item.desc}
                                        </Text>
                                    </View>
                                </Button>
                            ))}
                        </>
                    ) : null}

                    {step === 5 ? (
                        <>
                            <Text style={styles.title}>Dietary preferences?</Text>
                            <Text style={styles.subtitle}>
                                {"We'll tailor recommendations to your needs"}
                            </Text>
                            <View style={styles.dietGrid}>
                                {DIET_PREFERENCES.map((item) => (
                                    <Button
                                        key={item.value}
                                        mode="outlined"
                                        onPress={() =>
                                            setDietPreference(item.value)
                                        }
                                        contentStyle={styles.dietButtonContent}
                                        style={[
                                            styles.dietButton,
                                            dietPreference === item.value
                                                ? themedStyles.selected
                                                : themedStyles.unselected,
                                        ]}
                                    >
                                        <View style={styles.dietInner}>
                                            <MaterialCommunityIcons
                                                color="#5F7B5C"
                                                name={item.icon}
                                                size={20}
                                            />
                                            <Text style={styles.dietLabel}>
                                                {item.label}
                                            </Text>
                                        </View>
                                    </Button>
                                ))}
                            </View>
                            <Text style={styles.calorieHint}>
                                Estimated daily calories: {calculateDailyCalories()} kcal
                            </Text>
                        </>
                    ) : null}

                    <View style={styles.footerButtons}>
                        {step > 1 ? (
                            <Button mode="outlined" onPress={onBack}>
                                <Text>Back</Text>
                            </Button>
                        ) : null}
                        <Button
                            buttonColor="#8BA888"
                            disabled={!canProceed() || submitting}
                            loading={submitting}
                            mode="contained"
                            onPress={() => void onNext()}
                            style={styles.nextButton}
                        >
                            {step === TOTAL_STEPS ? 'Complete Setup' : 'Continue'}
                        </Button>
                    </View>
                </View>
            </ScrollView>
            <StatusBar style="auto" />
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    calorieHint: {
        marginTop: 10,
        textAlign: 'center',
    },
    card: {
        borderRadius: 24,
        elevation: 3,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 24,
    },
    dietButton: {
        marginBottom: 10,
        minHeight: 56,
        width: '48%',
    },
    dietButtonContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    dietGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    dietInner: {
        alignItems: 'center',
        gap: 6,
    },
    dietLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    footerButtons: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'space-between',
        marginTop: 14,
    },
    nextButton: {
        flex: 1,
    },
    optionButton: {
        alignSelf: 'stretch',
        marginBottom: 10,
    },
    optionButtonContent: {
        alignItems: 'flex-start',
        alignSelf: 'stretch',
        flexDirection: 'column',
        width: '100%',
    },
    optionButtonInner: {
        alignItems: 'flex-start',
        alignSelf: 'stretch',
    },
    optionDesc: {
        fontSize: 13,
        marginTop: 2,
        opacity: 0.9,
    },
    optionLabel: {
        fontWeight: '600',
    },
    page: {
        flex: 1,
    },
    progressBar: {
        borderRadius: 999,
        height: 8,
    },
    progressBlock: {
        marginBottom: 14,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    step3Input: {
        backgroundColor: '#FFF',
        borderColor: '#C9D7C7',
        borderRadius: 12,
        borderWidth: 1,
        color: '#1C1B1F',
        fontSize: 16,
        marginBottom: 16,
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    step3Label: {
        color: '#49454F',
        fontSize: 14,
        marginBottom: 6,
    },
    step3Wrapper: {
        marginBottom: 0,
    },
    subtitle: {
        marginBottom: 14,
        opacity: 0.8,
        textAlign: 'left',
    },
    title: {
        fontSize: 26,
        fontWeight: '600',
        marginBottom: 6,
        textAlign: 'left',
    },
})
