import { supabase } from '../lib/supabase'
import { readAsStringAsync } from 'expo-file-system/legacy'

/**
 * 上传图片到 Supabase Storage
 * @param imageUri - 本地图片 URI
 * @param folder - 存储文件夹（如：'posts', 'challenges'）
 * @returns 上传后的公开 URL
 */
export async function uploadImageToSupabase(imageUri: string, folder: string = 'posts'): Promise<string> {
  try {
    // 生成唯一的文件名
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const fileName = `${folder}_${timestamp}_${randomId}.jpg`
    const filePath = `${folder}/${fileName}`

    // 读取本地文件为 Base64
    const fileBase64 = await readAsStringAsync(imageUri, {
      encoding: 'base64',
    })

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('public')
      .upload(filePath, base64ToUint8Array(fileBase64), {
        contentType: 'image/jpeg',
      })

    if (error) {
      console.error('❌ 图片上传失败:', error)
      throw error
    }

    // 获取公开 URL
    const { data: publicData } = supabase.storage.from('public').getPublicUrl(filePath)

    if (!publicData?.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    console.log('✅ 图片上传成功:', publicData.publicUrl)
    return publicData.publicUrl
  } catch (error) {
    console.error('❌ [API] 图片上传错误:', error)
    throw error
  }
}

/**
 * Base64 字符串转 Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
