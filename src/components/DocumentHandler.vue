<template>
    <div class="editor-container" v-loading="loading" element-loading-text="Loading...">
        <div id="iframe"></div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref, watchEffect, watch } from 'vue'
import { getDocumentType, DocmentType } from '@/utils/util'
import { g_sEmpty_bin } from '@/utils/empty_bin'
// @ts-ignore
import {
    initX2TScript,
    initX2T,
    convertDocument,
    convertBinToDocumentAndDownload,
    c_oAscFileType2,
} from '@/utils/x2t'
const X2T = ref(null)
// 設定prop
const props = defineProps<{
    file: DocmentType
}>()

const editor = ref<any>(null)
const loading = ref(false)

// 全域性 media 對映物件
const media: { [key: string]: string } = {}

onMounted(async () => {
    loading.value = true
    try {
        await initX2TScript()
        // 載入編輯器API
        await loadEditorApi()
        await initX2T()
        console.log('app has loading')
        loading.value = false
        // 頁面初始化後，使用 watchEffect 監聽 props.file 並執行 openFile
        // 新增props.file監聽

        const stopWatch = watch(
            () => props.file.fileName,
            async () => {
                try {
                    await openFile()
                } catch (error) {
                    console.error('Error opening file:', error)
                    alert('檔案開啟失敗，請檢查檔案格式')
                }
            },
            { immediate: true }, // 立即執行一次以處理初始值
        )

        // 元件解除安裝時停止監聽
        onBeforeUnmount(stopWatch)
    } catch (error) {
        console.error('Failed to initialize editor:', error)
        // 錯誤已在各函式中處理
    }
})
// 合併後的檔案操作方法
async function handleDocumentOperation(options: { isNew: boolean; fileName: string; file?: File }) {
    try {
        const { isNew, fileName, file } = options
        const fileType = fileName.split('.').pop() || ''
        const docType = getDocumentType(fileType)

        // 獲取文件內容
        let documentData: {
            bin: ArrayBuffer
            media?: any
        }

        if (isNew) {
            // 新建文件使用空模板
            const emptyBin = g_sEmpty_bin[`.${fileType}`]
            if (!emptyBin) {
                throw new Error(`不支援的檔案型別: ${fileType}`)
            }
            documentData = { bin: emptyBin as any }
        } else {
            // 開啟現有文件需要轉換
            if (!file) throw new Error('無效的檔案物件')
            documentData = (await convertDocument(file)) as any
        }

        // 建立編輯器例項
        createEditorInstance({
            fileName,
            fileType,
            binData: documentData.bin,
            media: documentData.media,
        })
    } catch (error: any) {
        console.error('文件操作失敗:', error)
        alert(`文件操作失敗: ${error.message}`)
        throw error
    }
}

// 公共編輯器建立方法
function createEditorInstance(config: {
    fileName: string
    fileType: string
    binData: ArrayBuffer
    media?: any
}) {
    // 清理舊編輯器例項
    if (editor.value) {
        editor.value.destroyEditor()
        editor.value = null
    }

    const { fileName, fileType, binData, media } = config

    editor.value = new window.DocsAPI.DocEditor('iframe', {
        document: {
            title: fileName,
            url: fileName, // 使用檔名作為標識
            fileType: fileType,
            permissions: {
                edit: true,
                chat: false,
                protect: false,
            },
        },
        editorConfig: {
            lang: 'zh',
            customization: {
                help: false,
                about: false,
                hideRightMenu: true,
                features: {
                    spellcheck: {
                        change: false,
                    },
                },
                anonymous: {
                    request: false,
                    label: 'Guest',
                },
            },
        },
        events: {
            onAppReady: () => {
                // 設定媒體資源
                if (media) {
                    editor.value.sendCommand({
                        command: 'asc_setImageUrls',
                        data: { urls: media },
                    })
                }

                // 載入文件內容
                editor.value.sendCommand({
                    command: 'asc_openDocument',
                    data: { buf: binData },
                })
            },
            onDocumentReady: () => {
                console.log('文件載入完成:', fileName)
            },
            onSave: handleSaveDocument,
            // writeFile
            // todo writeFile 當外部貼上圖片時候處理
            writeFile: handleWriteFile,
        },
    })
}

// 修改後的openFile方法
async function openFile() {
    const { fileName, file } = props.file

    await handleDocumentOperation({
        isNew: !file, // 根據是否存在file判斷是否新建
        fileName,
        file: file ?? undefined,
    })
}

onBeforeUnmount(() => {
    // 清理資源
    if (editor.value) {
        // 如果編輯器有銷燬方法，呼叫它
        if (typeof editor.value.destroyEditor === 'function') {
            editor.value.destroyEditor()
        }
    }
})

function loadEditorApi(): Promise<void> {
    return new Promise((resolve, reject) => {
        // 檢查是否已載入
        if (window.DocsAPI) {
            resolve()
            return
        }

        // 載入編輯器API
        const script = document.createElement('script')
        script.src = './web-apps/apps/api/documents/api.js'
        script.onload = () => resolve()
        script.onerror = (error) => {
            console.error('Failed to load OnlyOffice API:', error)
            alert('無法載入編輯器元件。請確保已正確安裝 OnlyOffice API。')
            reject(error)
        }
        document.head.appendChild(script)
    })
}

interface SaveEvent {
    data: {
        data: string
        option: any
    }
}

async function handleSaveDocument(event: SaveEvent) {
    console.log('Save document event:', event)

    if (event.data && event.data.data) {
        const { data, option } = event.data
        console.log(data, 'data')
        debugger
        // 建立下載
        await convertBinToDocumentAndDownload(
            data as any,
            props.file.fileName,
            c_oAscFileType2[option.outputformat],
        )
        // const blob = dataURItoBlob(data);
        // saveAs(blob, props.file.fileName);
    }

    // 告知編輯器儲存完成
    editor.value.sendCommand({
        command: 'asc_onSaveCallback',
        data: { err_code: 0 },
    })
}

// 輔助函式：將base64轉為Blob
function dataURItoBlob(dataURI: string): Blob {
    // 從base64字串中提取資料部分
    const byteString = atob(dataURI.split(',')[1])

    // 建立ArrayBuffer
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
    }

    return new Blob([ab])
}

/**
 * 處理檔案寫入請求（主要用於處理貼上的圖片）
 * @param event - OnlyOffice 編輯器的檔案寫入事件
 */
function handleWriteFile(event: any) {
    debugger
    try {
        console.log('Write file event:', event)

        const { data: eventData } = event
        if (!eventData) {
            console.warn('No data provided in writeFile event')
            return
        }

        const {
            data: imageData, // Uint8Array 圖片資料
            file: fileName, // 檔名，如 "display8image-174799443357-0.png"
            target, // 目標物件，包含 frameOrigin 等資訊
        } = eventData

        // 驗證資料
        if (!imageData || !(imageData instanceof Uint8Array)) {
            throw new Error('Invalid image data: expected Uint8Array')
        }

        if (!fileName || typeof fileName !== 'string') {
            throw new Error('Invalid file name')
        }

        // 從檔名中提取副檔名
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'png'
        const mimeType = getMimeTypeFromExtension(fileExtension)

        // 建立 Blob 物件
        const blob = new Blob([imageData], { type: mimeType })

        // 建立物件 URL
        const objectUrl = URL.createObjectURL(blob)
        // 將圖片設定為base64url
        //  const base64Url = `data:${mimeType};base64,${btoa(String.fromCharCode(...imageData))}`;
        // 將圖片URL新增到媒體對映中，使用原始檔名作為key
        media[`media/${fileName}`] = objectUrl
        editor.value.sendCommand({
            command: 'asc_setImageUrls',
            data: {
                urls: media,
            },
        })

        editor.value.sendCommand({
            command: 'asc_writeFileCallback',
            data: {
                // 圖片base64
                path: objectUrl,
                imgName: fileName,
            },
        })
        console.log(`Successfully processed image: ${fileName}, URL: ${media}`)
    } catch (error: any) {
        console.error('Error handling writeFile:', error)

        // 通知編輯器檔案處理失敗
        if (editor.value && typeof editor.value.sendCommand === 'function') {
            editor.value.sendCommand({
                command: 'asc_writeFileCallback',
                data: {
                    success: false,
                    error: error.message,
                },
            })
        }

        if (event.callback && typeof event.callback === 'function') {
            event.callback({
                success: false,
                error: error.message,
            })
        }
    }
}

/**
 * 根據副檔名獲取 MIME 型別
 * @param extension - 副檔名
 * @returns string - MIME 型別
 */
function getMimeTypeFromExtension(extension: string): string {
    const mimeMap: { [key: string]: string } = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        bmp: 'image/bmp',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        ico: 'image/x-icon',
        tiff: 'image/tiff',
        tif: 'image/tiff',
    }

    return mimeMap[extension?.toLowerCase()] || 'image/png'
}

// 元件解除安裝時清理物件 URL
onBeforeUnmount(() => {
    // 清理媒體資源的物件 URL
    Object.values(media).forEach((url) => {
        if (typeof url === 'string' && url.startsWith('blob:')) {
            URL.revokeObjectURL(url)
        }
    })

    // 清理編輯器資源
    if (editor.value) {
        if (typeof editor.value.destroyEditor === 'function') {
            editor.value.destroyEditor()
        }
    }
})
</script>

<style scoped>
.editor-container {
    width: 100%;
    height: 100vh;
}

#iframe {
    width: 100%;
    height: 100%;
}
</style>

