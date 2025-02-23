import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        vue(), // Поддержка Vue
        dts({ insertTypesEntry: true }),
    ],
    build: {
        lib: {
            entry: './src/index.ts',
            name: 'useApi',
            fileName: 'index',
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue',
                },
            },
        },
        outDir: '.',
    },
});