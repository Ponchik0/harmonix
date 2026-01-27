const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const localesPath = path.join(context.appOutDir, 'locales');
  
  if (!fs.existsSync(localesPath)) {
    return;
  }
  
  const keepLocales = ['ru.pak', 'en-US.pak'];
  const files = fs.readdirSync(localesPath);
  
  let removed = 0;
  for (const file of files) {
    if (!keepLocales.includes(file)) {
      fs.unlinkSync(path.join(localesPath, file));
      removed++;
    }
  }
  
  console.log(`[AfterPack] Removed ${removed} unused locale files, kept ${keepLocales.length}`);
};
