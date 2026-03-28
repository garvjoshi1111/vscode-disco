const esbuild = require("esbuild");
const watch = process.argv.includes("--watch");

(async () => {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    outfile: "dist/extension.js",
    external: ["vscode"],
    format: "cjs",
    platform: "node",
    sourcemap: true,
    minify: !watch,
  });

  if (watch) {
    await ctx.watch();
    console.log("Watching...");
  } else {
    await ctx.rebuild();
    ctx.dispose();
  }
})();
