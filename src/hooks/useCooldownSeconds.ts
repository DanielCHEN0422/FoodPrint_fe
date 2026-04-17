import { useCallback, useEffect, useRef, useState } from 'react'

const TICK_MS = 1000

/**
 * 倒计时（秒）。用于验证码「每分钟 1 次」等场景：成功触发后调用 startCooldown(60)。
 */
export function useCooldownSeconds() {
    const [secondsRemaining, setSecondsRemaining] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const clearTimer = useCallback(() => {
        if (timerRef.current != null) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }, [])

    useEffect(() => () => clearTimer(), [clearTimer])

    const startCooldown = useCallback(
        (durationSeconds: number) => {
            clearTimer()
            const n = Math.max(0, Math.floor(durationSeconds))
            setSecondsRemaining(n)
            if (n <= 0) {
                return
            }
            timerRef.current = setInterval(() => {
                setSecondsRemaining((s) => {
                    if (s <= 1) {
                        clearTimer()
                        return 0
                    }
                    return s - 1
                })
            }, TICK_MS)
        },
        [clearTimer]
    )

    return {
        secondsRemaining,
        isCoolingDown: secondsRemaining > 0,
        startCooldown,
    }
}
