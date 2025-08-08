const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      fixImports(fullPath);
    } else if (file.name.endsWith('.ts') && !file.name.endsWith('.d.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Replace all @/ imports with relative paths
      content = content.replace(/from ['"]@\//g, (match) => {
        modified = true;
        // Calculate relative path from current file to src directory
        const relativePath = path.relative(path.dirname(fullPath), path.join(__dirname, 'src'));
        const normalizedPath = relativePath.replace(/\\/g, '/');
        return `from '${normalizedPath}/`;
      });
      
      content = content.replace(/import ['"]@\//g, (match) => {
        modified = true;
        const relativePath = path.relative(path.dirname(fullPath), path.join(__dirname, 'src'));
        const normalizedPath = relativePath.replace(/\\/g, '/');
        return `import '${normalizedPath}/`;
      });
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed imports in: ${fullPath}`);
      }
    }
  }
}

// Fix imports in src directory
fixImports(path.join(__dirname, 'src'));
console.log('Import fixing completed!');
