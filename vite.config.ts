import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd())
    return {
      base: './',
      server: {
        port: parseInt(env.VITE_PORT) || 3000,
        host: '0.0.0.0',
      },
      build: {
        outDir: 'html',
      },
      plugins: [
        AutoImport({
          resolvers: [ElementPlusResolver()],
        }),
        Components({
          resolvers: [ElementPlusResolver()],
        }),
        vue(),
        vueJsx(),
        vueDevTools(),
        viteCompression({
          filter: /\.(js|css|json|txt|ico|svg|wasm)(\?.*)?$/i, // 需要壓縮的檔案
          threshold: 1024, // 檔案容量大於這個值進行壓縮
          algorithm: 'gzip', // 壓縮方式
          ext: 'gz', // 字尾名
          deleteOriginFile: false, // 壓縮後是否刪除壓縮原始檔
        }),
      ],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
      },
    }
})

