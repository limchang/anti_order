import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        workbox: {
          // version.json을 프리캐시에서 제외 → 항상 네트워크에서 신선하게 가져오도록
          navigateFallbackDenylist: [/\/version\.json/],
          globIgnores: ['**/version.json'],
          runtimeCaching: [
            {
              urlPattern: /\/version\.json/,
              handler: 'NetworkOnly',  // 캐시 절대 무시, 항상 네트워크에서만
            }
          ]
        },
        manifest: {
          name: '오더모아',
          short_name: '오더모아',
          description: '카페에서 여러 테이블 주문을 모아서 한번에 카운터로!',
          theme_color: '#3182F6',
          background_color: '#F2F4F6',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
