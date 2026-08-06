import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Vite 配置文件
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['localhost', '.serveousercontent.com'],
  },
  plugins: [
    react(),
    // PWA 插件配置：支持离线缓存和安装到设备
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'StudyFlow 学习计划',
        short_name: 'StudyFlow',
        description: '专注、高效的学习管理工具',
        theme_color: '#2563EB',
        background_color: '#F8FAFC',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
