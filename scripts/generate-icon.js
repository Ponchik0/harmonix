const sharp = require('sharp');
const pngToIco = require('png-to-ico').default || require('png-to-ico');
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build');

// Sizes needed for Windows ICO (taskbar, task manager, etc.)
const sizes = [16, 24, 32, 48, 64, 128, 256];

async function generateIconFromSvg(svgPath, outputName) {
  const pngFiles = [];

  console.log(`\nGenerating ${outputName} from ${path.basename(svgPath)}...`);
  
  for (const size of sizes) {
    const pngPath = path.join(buildDir, `${outputName}-${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    pngFiles.push(pngPath);
    console.log(`  Created: ${outputName}-${size}.png`);
  }

  // Also create main PNG (256x256)
  const mainPngPath = path.join(buildDir, `${outputName}.png`);
  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(mainPngPath);
  console.log(`  Created: ${outputName}.png (256x256)`);

  // Convert all PNGs to single ICO with multiple sizes
  console.log(`Converting to ${outputName}.ico...`);
  const icoBuffer = await pngToIco(pngFiles);
  const icoPath = path.join(buildDir, `${outputName}.ico`);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`  Created: ${outputName}.ico`);

  // Cleanup temporary PNG files (keep main PNG)
  for (const pngFile of pngFiles) {
    if (pngFile !== mainPngPath) {
      fs.unlinkSync(pngFile);
    }
  }
}

async function generateIcons() {
  // Create build directory if it doesn't exist
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const publicDir = path.join(__dirname, '../public');

  // Generate dark icon (default)
  const darkSvgPath = path.join(publicDir, 'icon.svg');
  if (fs.existsSync(darkSvgPath)) {
    await generateIconFromSvg(darkSvgPath, 'icon');
  } else {
    console.error('Error: icon.svg not found!');
  }

  // Generate light icon
  const lightSvgPath = path.join(publicDir, 'icon-light.svg');
  if (fs.existsSync(lightSvgPath)) {
    await generateIconFromSvg(lightSvgPath, 'icon-light');
  } else {
    console.log('Note: icon-light.svg not found, skipping light icon generation');
  }

  console.log('\nDone!');
}

generateIcons().catch(console.error);
