import { useMemo } from 'react'
import { useTheme } from 'react-native-paper'

import { typography } from './tokens'

/**
 * 从主题生成页面通用样式，各 Screen 无需再写 StyleSheet 和颜色。
 */
export function useScreenStyles() {
  const theme = useTheme()
  const colors = theme.colors

  return useMemo(
    () => ({
      screen: {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        backgroundColor: colors.background,
      },
      title: {
        ...typography.title,
        marginBottom: 12,
        color: colors.onSurface,
      },
    }),
    [colors.background, colors.onSurface]
  )
}
