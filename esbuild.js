require('esbuild').build({
  entryPoints: ['src/index.ts'],
  platform: "browser",
  bundle: true,
  minify: false,
  sourcemap: true,
  target: ['es2020', 'chrome58', 'firefox57', 'safari11', 'edge18'],
  outfile: 'dist/p5.webm-capture.js',
})
