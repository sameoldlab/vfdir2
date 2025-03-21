import fs from 'fs'
import path from 'path';

const LICENSE_HEADER_JS = `// SPDX-License-Identifier: MPL-2.0

`
const LICENSE_HEADER_SV = `<!-- SPDX-License-Identifier: MPL-2.0 -->

`

function addLicenseHeader(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('SPDX-License-Identifier')) {
    fs.writeFileSync(filePath, (filePath.endsWith('.svelte') ? LICENSE_HEADER_SV : LICENSE_HEADER_JS) + content);
    console.log(`Added license header to ${filePath}`);
  }
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.svelte')) {
      addLicenseHeader(filePath);
    }
  });
}

// Start processing from the current directory
processDirectory('./src');
