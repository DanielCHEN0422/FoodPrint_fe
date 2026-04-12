import type { AuthError } from '@supabase/supabase-js'

import { supabase } from './supabase'

/** 发送密码重置邮件。若要在邮件中显示 6 位验证码，请在 Supabase → Auth → Email Templates → Reset password 模板中加入 {{ .Token }}。 */
export async function sendPasswordRecoveryOtp(
    email: string
): Promise<{ error: AuthError | null }> {
    const normalized = email.trim().toLowerCase()
    const { error } = await supabase.auth.resetPasswordForEmail(normalized)
    return { error }
}

/** 仅校验恢复验证码（成功后本地会有 recovery session，供后续 updateUser 改密）。 */
export async function verifyRecoveryOtpOnly(
    email: string,
    otp: string
): Promise<{ error: AuthError | null }> {
    const normalizedEmail = email.trim().toLowerCase()
    const token = otp.trim().replace(/\s/g, '')

    const { error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: 'recovery',
    })
    return { error }
}

/** 在已通过 recovery 验证的会话上更新密码并退出登录。 */
export async function updatePasswordAfterRecovery(
    newPassword: string
): Promise<{ error: AuthError | null }> {
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    })
    if (updateError) {
        return { error: updateError }
    }
    await supabase.auth.signOut()
    return { error: null }
}
