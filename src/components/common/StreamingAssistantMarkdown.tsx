import { useEffect, useState } from 'react'

import { AssistantMarkdown, type AssistantMarkdownProps } from './AssistantMarkdown'

const WORDS_PER_FRAME = 2
const MS_PER_FRAME = 28
/** 过短内容直接展示，避免无意义动画 */
const INSTANT_MAX_LEN = 24

/**
 * 将完整 Markdown 切成多帧：按词批量追加（比逐字更稳，减少半段 ** 代码块 导致的闪烁）。
 */
function buildFrames(full: string, wordsPerFrame: number): string[] {
    if (!full) {
        return ['']
    }
    if (full.length <= INSTANT_MAX_LEN) {
        return [full]
    }

    const tokens = full.split(/(\s+)/)
    const frames: string[] = []
    let acc = ''
    let wordsInChunk = 0

    for (const t of tokens) {
        acc += t
        if (t.trim().length > 0) {
            wordsInChunk++
            if (wordsInChunk >= wordsPerFrame) {
                frames.push(acc)
                wordsInChunk = 0
            }
        }
    }

    if (frames.length === 0 || frames[frames.length - 1] !== full) {
        frames.push(full)
    }

    return frames
}

export type StreamingAssistantMarkdownProps = AssistantMarkdownProps

/**
 * 在已有完整文本的前提下做「流式」展示（前端逐段露出）。
 * 真正从模型边生成边下发需要后端 SSE / chunked 响应。
 */
export function StreamingAssistantMarkdown({
    markdown,
    textColor,
    linkColor,
}: StreamingAssistantMarkdownProps) {
    const [shown, setShown] = useState(() => buildFrames(markdown, WORDS_PER_FRAME)[0] ?? '')

    useEffect(() => {
        const frames = buildFrames(markdown, WORDS_PER_FRAME)
        setShown(frames[0] ?? '')

        if (frames.length <= 1) {
            return undefined
        }

        let i = 0
        const id = setInterval(() => {
            i++
            if (i >= frames.length) {
                clearInterval(id)
                return
            }
            setShown(frames[i])
        }, MS_PER_FRAME)

        return () => clearInterval(id)
    }, [markdown])

    return (
        <AssistantMarkdown markdown={shown} textColor={textColor} linkColor={linkColor} />
    )
}
