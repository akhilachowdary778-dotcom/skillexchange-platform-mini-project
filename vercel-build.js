const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);
const publicDir = path.join(root, 'public');
const publicPagesDir = path.join(publicDir, 'pages');
const frontendPages = path.join(root, 'frontend', 'pages');
const frontendCss = path.join(root, 'frontend', 'css');
const frontendJs = path.join(root, 'frontend', 'js');

async function copyDir(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function build() {
  await fs.promises.rm(publicDir, { recursive: true, force: true });
  await fs.promises.mkdir(publicDir, { recursive: true });

  await copyDir(frontendPages, publicPagesDir);
  await copyDir(frontendCss, path.join(publicDir, 'css'));
  await copyDir(frontendJs, path.join(publicDir, 'js'));

  console.log('Static site built to', publicDir);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
