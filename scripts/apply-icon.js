const { rcedit } = require('rcedit');
const path = require('path');
const fs = require('fs');

const exePath = path.join(__dirname, '../release/win-unpacked/Harmonix.exe');
const icoPath = path.join(__dirname, '../build/icon.ico');

async function applyIcon() {
  if (!fs.existsSync(exePath)) {
    console.log('EXE not found:', exePath);
    return;
  }

  if (!fs.existsSync(icoPath)) {
    console.log('ICO not found:', icoPath);
    return;
  }

  console.log('Applying icon and metadata to Harmonix.exe...');
  
  try {
    await rcedit(exePath, {
      icon: icoPath,
      'version-string': {
        ProductName: 'Harmonix',
        FileDescription: 'Harmonix',
        CompanyName: 'Harmonix Team',
        LegalCopyright: 'Copyright © 2025 Harmonix',
        OriginalFilename: 'Harmonix.exe',
        InternalName: 'Harmonix'
      },
      'product-version': '1.0.0',
      'file-version': '1.0.0'
    });
    console.log('Done! Icon and metadata applied.');
  } catch (err) {
    console.error('Error:', err);
  }
}

applyIcon();
