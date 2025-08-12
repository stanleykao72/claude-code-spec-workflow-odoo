const { build, context } = require('esbuild');
const path = require('path');

const baseConfig = {
  entryPoints: [path.resolve(__dirname, 'src/dashboard/client/multi-app.ts')],
  bundle: true,
  outfile: path.resolve(__dirname, 'src/dashboard/public/dist/app.js'),
  target: 'es2020',
  format: 'iife',
  external: ['petite-vue'],
  color: true,
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
};

const developmentConfig = {
  ...baseConfig,
  sourcemap: 'inline',
  minify: false,
  keepNames: true,
  banner: {
    js: '// Development build - source maps enabled for debugging',
  },
};

const productionConfig = {
  ...baseConfig,
  sourcemap: true,
  minify: true,
  treeShaking: true,
  // Advanced production optimizations
  legalComments: 'none',
  drop: ['console', 'debugger'],
  pure: ['console.log', 'console.warn', 'console.info'],
  // Mangling options for better compression
  mangleProps: /^_/,
  keepNames: false,
  // Bundle splitting - disabled for now as dashboard is a single app
  splitting: false,
  // Compression settings
  charset: 'utf8',
  banner: {
    js: '// Production build - optimized for performance',
  },
  // Build metadata
  metafile: true,
  write: true,
};

const watchConfig = {
  ...developmentConfig,
  plugins: [
    {
      name: 'watch-plugin',
      setup(build) {
        build.onStart(() => {
          console.log('[esbuild] Frontend build started...');
        });
        build.onEnd((result) => {
          if (result.errors.length === 0) {
            console.log('[esbuild] Frontend build completed successfully');
          } else {
            console.log('[esbuild] Frontend build failed with errors');
          }
        });
      },
    },
  ],
};

module.exports = {
  developmentConfig,
  productionConfig,
  watchConfig,
  baseConfig,
};

// CLI usage
if (require.main === module) {
  const mode = process.argv[2] || 'development';
  const fs = require('fs');
  
  async function runBuild() {
    try {
      if (mode === 'watch') {
        const ctx = await context(watchConfig);
        await ctx.watch();
        console.log('[esbuild] Watching for changes...');
        
        // Keep the process alive
        process.on('SIGINT', async () => {
          console.log('\n[esbuild] Stopping watch mode...');
          await ctx.dispose();
          process.exit(0);
        });
      } else {
        let config;
        switch (mode) {
          case 'production':
            config = productionConfig;
            break;
          default:
            config = developmentConfig;
        }
        
        const result = await build(config);
        
        // Write build analysis for production builds
        if (mode === 'production' && result.metafile) {
          const metafilePath = path.resolve(__dirname, 'src/dashboard/public/dist/meta.json');
          fs.writeFileSync(metafilePath, JSON.stringify(result.metafile, null, 2));
          console.log('[esbuild] Build analysis written to meta.json');
          
          // Log bundle size information
          const { outputs } = result.metafile;
          const mainOutput = outputs[Object.keys(outputs)[0]];
          if (mainOutput) {
            const sizeKB = (mainOutput.bytes / 1024).toFixed(1);
            console.log(`[esbuild] Bundle size: ${sizeKB} KB`);
          }
        }
        
        console.log(`[esbuild] ${mode} build completed successfully`);
      }
    } catch (error) {
      console.error('[esbuild] Build failed:', error);
      process.exit(1);
    }
  }
  
  runBuild();
}