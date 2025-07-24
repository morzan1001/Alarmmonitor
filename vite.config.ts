import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.tsx',
    coverage: {
      reporter: ['text', 'json', 'html', 'cobertura', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockServiceWorker.js',
        '**/mocks/**',
      ],
    },
    reporters: ['default', 'junit', 'json', 'vitest-sonar-reporter'],
    outputFile: {
      junit: './coverage/junit.xml',
      json: './coverage/test-report.json',
      'vitest-sonar-reporter': './coverage/sonar-report.xml',
    },
  },
})