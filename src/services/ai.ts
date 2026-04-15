// src/services/ai.ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface AIAnalyzeRequest {
  text?: string;
  imageUrl?: string;
  userContext?: any;
}

export interface AIResponse {
  success: boolean;
  data: {
    type: 'FOOD_ANALYSIS' | 'DIET_ADVICE' | 'DIET_PLAN' | 'DIET_ROAST' | 'GENERAL_CHAT' | 'PROFILE_NEEDED';
    result: any;
    message?: string;
    conversation?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  };
  error?: string;
}

/**
 * 分析文本（用于Text Description和AI Chat）
 */
export async function analyzeText(text: string, token: string): Promise<AIResponse> {
  try {
    console.log('analyzeText called with:', { text: text.substring(0, 50) + '...', token: token ? 'exists' : 'missing' });
    
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API Response data:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('analyzeText error:', error);
    throw new Error(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 分析图片（用于Photo Scan）
 */
export async function analyzeImage(imageUri: string, token: string): Promise<AIResponse> {
  try {
    console.log('analyzeImage called with:', { imageUri, token: token ? 'exists' : 'missing' });

    const formData = new FormData();
    
    // 处理Expo ImagePicker返回的URI
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/ai/analyze/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // 不要手动设置 Content-Type，让浏览器自动设置 multipart boundary
      },
      body: formData,
    });

    console.log('Image API Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Image API Response data:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('analyzeImage error:', error);
    throw new Error(`图片分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 从AI响应中提取聊天内容
 */
export function extractAssistantText(response: AIResponse): string {
  // 如果有conversation字段，优先使用
  if (response.data.conversation && response.data.conversation.length > 0) {
    const lastAssistant = response.data.conversation
      .filter(msg => msg.role === 'assistant')
      .pop();
    if (lastAssistant) return lastAssistant.content;
  }

  // 如果有message字段
  if (response.data.message) {
    return response.data.message;
  }

  // 如果result是字符串
  if (typeof response.data.result === 'string') {
    return response.data.result;
  }

  // 如果result是对象，尝试提取text或content字段
  if (typeof response.data.result === 'object' && response.data.result) {
    const result = response.data.result as any;
    return result.text || result.content || result.advice || JSON.stringify(result);
  }

  return '收到了你的消息，但我暂时无法理解，请稍后重试。';
}

/**
 * 标准化AI响应（用于分析页面）
 */
export function normalizeAIResponse(response: AIResponse) {
  return {
    type: response.data.type,
    content: response.data.result,
    message: response.data.message,
    success: response.success,
    error: response.error,
  };
}