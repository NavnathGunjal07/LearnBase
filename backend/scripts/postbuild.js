const fs = require('fs');
const path = require('path');

// Source: prisma/generated
const src = path.join(__dirname, '../prisma/generated');
// Dest: dist/prisma/generated
const dest = path.join(__dirname, '../dist/prisma/generated');

// Recursive copy function
function copyDir(source, destination) {
  // Create destination folder if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Read directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('Running postbuild: Copying prisma/generated to dist/prisma/generated...');
  if (fs.existsSync(src)) {
    copyDir(src, dest);
    console.log('Postbuild completed successfully.');
  } else {
    console.log('Warning: prisma/generated source directory not found. Skipping copy.');
  }
} catch (err) {
  console.error('Postbuild failed:', err);
  process.exit(1);
}
