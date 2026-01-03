import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // 可以根据需要添加更多别名
      // '@components': resolve(__dirname, 'src/components'),
      // '@views': resolve(__dirname, 'src/views'),
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  // TypeScript 相关配置
  esbuild: {
    // 排除不需要处理的文件
    exclude: ['node_modules/**']
  }
})