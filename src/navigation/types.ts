export type RootTabParamList = {
    Home: undefined
    Record: undefined
    Community: undefined
    Profile: undefined
}

export type AuthStackParamList = {
    Login: undefined
    Register: undefined
    ForgotPassword: undefined
    SetNewPassword: { email: string }
}
