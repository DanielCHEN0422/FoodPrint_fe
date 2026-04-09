// src/services/chatUtils.ts
import { AIResponse, extractAssistantText } from './ai';

// 使用现有的 ChatMessage 接口
export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
}

/**
 * 创建用户消息
 */
export function createUserMessage(text: string): ChatMessage {
    return {
        id: Date.now().toString(),
        text: text.trim(),
        sender: 'user',
        timestamp: new Date(),
    };
}

/**
 * 创建助手消息
 */
export function createAssistantMessage(text: string): ChatMessage {
    return {
        id: (Date.now() + Math.random()).toString(),
        text,
        sender: 'assistant',
        timestamp: new Date(),
    };
}

/**
 * 从API响应创建助手消息
 */
export function createAssistantMessageFromAPI(response: AIResponse): ChatMessage {
    const text = response.success 
        ? extractAssistantText(response)
        : `抱歉，处理出错了：${response.error || '未知错误'}`;

    return createAssistantMessage(text);
}

/**
 * 创建错误消息
 */
export function createErrorMessage(error: string): ChatMessage {
    return createAssistantMessage(`网络错误：${error}`);
}