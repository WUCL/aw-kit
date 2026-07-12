import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: () => 'aw-notify-kit.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name === 'aw-notify-kit.css' ? 'style.css' : assetInfo.name,
      },
    },
    cssCodeSplit: false, // force single dist/style.css instead of per-chunk splitting
  },
})
