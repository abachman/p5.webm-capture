const esbuild = require('esbuild');

const buildOptions = {
  entryPoints: ['src/index.ts'],
  platform: "browser",
  bundle: true,
  minify: true,
  sourcemap: true,
  logLevel: 'info',
  target: ['es2020'],
  outfile: 'dist/p5.webm-capture.js',
};

if (process.argv.includes('--watch')) {
  esbuild.context(buildOptions)
    .then((context) => context.watch())
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  esbuild.build(buildOptions).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
