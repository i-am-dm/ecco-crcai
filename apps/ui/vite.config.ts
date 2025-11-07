import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const vendorChunkMatchers: { name: string; pattern: RegExp }[] = [
  { name: 'vendor-react', pattern: /node_modules\/(react|react-dom|scheduler|react-router-dom|history)\// },
  { name: 'vendor-query', pattern: /node_modules\/@tanstack\/react-query/ },
  { name: 'vendor-state', pattern: /node_modules\/zustand/ },
  { name: 'vendor-forms', pattern: /node_modules\/(react-hook-form|@hookform)/ },
  { name: 'vendor-firebase', pattern: /node_modules\/firebase/ },
  { name: 'vendor-charts', pattern: /node_modules\/recharts/ },
  { name: 'vendor-ui', pattern: /node_modules\/(@radix-ui|lucide-react|class-variance-authority|clsx|tailwind-merge|sonner)/ },
  { name: 'vendor-date', pattern: /node_modules\/date-fns/ },
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const matched = vendorChunkMatchers.find(({ pattern }) => pattern.test(id))
          if (matched) return matched.name

          const [, chunkPath = ''] = id.split('node_modules/')
          const parts = chunkPath.split('/')
          if (parts[0]?.startsWith('@')) {
            const scope = parts.slice(0, 2).join('-').replace('@', '')
            return `vendor-${scope}`
          }

          return 'vendor-shared'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/*.spec.*',
        '**/*.test.*',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
