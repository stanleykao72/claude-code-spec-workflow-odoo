const { build, context } = require('esbuild');
const path = require('path');

const baseConfig = {
  entryPoints: [path.resolve(__dirname, 'src/dashboard/client/multi-app.ts')],
  bundle: true,
  outfile: path.resolve(__dirname, 'src/dashboard/public/dist/app.js'),
  target: 'es2020',
  format: 'esm',
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
  banner: {
    js: '// Production build',
  },
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
        
        await build(config);
      }
    } catch (error) {
      console.error('[esbuild] Build failed:', error);
      process.exit(1);
    }
  }
  
  runBuild();
}