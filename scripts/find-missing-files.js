// Script para encontrar archivos faltantes basándose en imports
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '../src');
const missingFiles = new Set();

// Función para buscar todos los archivos TypeScript/JavaScript
function getAllSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      getAllSourceFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Función para extraer imports de un archivo
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+.*?\s+from\s+['"](@\/[^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (error) {
    return [];
  }
}

// Función para verificar si un archivo existe
function fileExists(importPath) {
  // Convertir @/ a src/
  const relativePath = importPath.replace('@/', 'src/');
  
  // Intentar diferentes extensiones
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  
  for (const ext of extensions) {
    const fullPath = path.join(__dirname, '..', relativePath + ext);
    if (fs.existsSync(fullPath)) {
      return true;
    }
  }
  
  return false;
}

console.log('🔍 Buscando archivos faltantes...\n');

// Obtener todos los archivos fuente
const sourceFiles = getAllSourceFiles(srcDir);
console.log(`📁 Analizando ${sourceFiles.length} archivos...\n`);

// Analizar cada archivo
const missingImports = new Map();

sourceFiles.forEach(filePath => {
  const imports = extractImports(filePath);
  
  imports.forEach(importPath => {
    if (!fileExists(importPath)) {
      if (!missingImports.has(importPath)) {
        missingImports.set(importPath, []);
      }
      missingImports.get(importPath).push(filePath);
    }
  });
});

// Mostrar resultados
if (missingImports.size === 0) {
  console.log('✅ No se encontraron archivos faltantes!');
} else {
  console.log(`❌ Se encontraron ${missingImports.size} archivos/modulos faltantes:\n`);
  
  missingImports.forEach((files, importPath) => {
    console.log(`📦 ${importPath}`);
    console.log(`   Referenciado en:`);
    files.forEach(file => {
      const relativeFile = path.relative(path.join(__dirname, '..'), file);
      console.log(`   - ${relativeFile}`);
    });
    console.log('');
  });
  
  // Buscar en Git history
  console.log('\n🔍 Buscando en historial de Git...\n');
  
  missingImports.forEach((files, importPath) => {
    const relativePath = importPath.replace('@/', 'src/');
    const possiblePaths = [
      relativePath + '.ts',
      relativePath + '.tsx',
      relativePath + '.js',
      relativePath + '.jsx',
      relativePath + '/index.ts',
      relativePath + '/index.tsx',
    ];
    
    possiblePaths.forEach(filePath => {
      try {
        const result = execSync(
          `git log --all --full-history --diff-filter=A --name-only -- "${filePath}"`,
          { encoding: 'utf8', cwd: path.join(__dirname, '..') }
        );
        
        if (result.trim()) {
          const commits = result.trim().split('\n');
          const uniqueCommits = [...new Set(commits)];
          if (uniqueCommits.length > 0) {
            console.log(`✅ Encontrado en Git: ${filePath}`);
            console.log(`   Commits: ${uniqueCommits.slice(0, 3).join(', ')}`);
            console.log(`   Para recuperar: git show <commit>:${filePath}`);
            console.log('');
          }
        }
      } catch (error) {
        // Archivo no encontrado en Git
      }
    });
  });
}
