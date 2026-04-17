import type { Action } from 'expo-image-manipulator'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import type { ImagePickerAsset } from 'expo-image-picker'

/** 长边上限（像素），控制上传体积与后端处理耗时 */
const MAX_EDGE_PX = 1680
/** JPEG 质量 0–1，略低于 1 以明显减小体积 */
const JPEG_COMPRESS = 0.78

function jpegFileName(asset: ImagePickerAsset): string {
    const raw = asset.fileName?.trim()
    if (raw) {
        const base = raw.replace(/\.[^/.]+$/, '')
        return `${base || 'photo'}.jpg`
    }
    return 'photo.jpg'
}

/**
 * 上传前压缩：必要时缩小长边，并统一为 JPEG，减小 multipart 体积。
 * 失败时返回原 asset，不阻断上传流程。
 */
export async function compressImagePickerAssetForUpload(
    asset: ImagePickerAsset
): Promise<ImagePickerAsset> {
    try {
        const w = asset.width ?? 0
        const h = asset.height ?? 0
        const actions: Action[] = []
        if (w > 0 && h > 0 && (w > MAX_EDGE_PX || h > MAX_EDGE_PX)) {
            if (w >= h) {
                actions.push({ resize: { width: MAX_EDGE_PX } })
            } else {
                actions.push({ resize: { height: MAX_EDGE_PX } })
            }
        }

        const result = await manipulateAsync(asset.uri, actions, {
            compress: JPEG_COMPRESS,
            format: SaveFormat.JPEG,
        })

        return {
            ...asset,
            uri: result.uri,
            width: result.width,
            height: result.height,
            mimeType: 'image/jpeg',
            fileName: jpegFileName(asset),
        }
    } catch {
        return asset
    }
}
