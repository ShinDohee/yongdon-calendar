import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './', // GitHub Pages는 /repo-name/ 하위 경로에서 서빙되므로 상대경로로 빌드
  server: {
    host: true,       // LAN/터널로 접속할 때도 서버가 요청을 받도록
    allowedHosts: true, // 터널(loca.lt 등) 도메인의 Host 헤더를 허용
  },
})
