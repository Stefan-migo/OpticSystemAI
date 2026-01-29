// Script mejorado para encontrar y recuperar archivos faltantes del historial de Git
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '../src');

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
  const relativePath = importPath.replace('@/', 'src/');
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  
  for (const ext of extensions) {
    const fullPath = path.join(__dirname, '..', relativePath + ext);
    if (fs.existsSync(fullPath)) {
      return true;
    }
  }
  
  return false;
}

// Función para buscar archivo en Git history
function findInGitHistory(importPath) {
  const relativePath = importPath.replace('@/', 'src/');
  const possiblePaths = [
    relativePath + '.ts',
    relativePath + '.tsx',
    relativePath + '.js',
    relativePath + '.jsx',
    relativePath + '/index.ts',
    relativePath + '/index.tsx',
  ];
  
  for (const filePath of possiblePaths) {
    try {
      // Buscar el commit más reciente que agregó este archivo
      const result = execSync(
        `git log --all --full-history --diff-filter=A --format="%H|%s|%an|%ad" --date=short -- "${filePath}" | head -1`,
        { encoding: 'utf8', cwd: path.join(__dirname, '..') }
      );
      
      if (result.trim()) {
        const [commitHash, ...rest] = result.trim().split('|');
        return { commitHash, filePath };
      }
    } catch (error) {
      // Continuar buscando
    }
  }
  
  return null;
}

// Función para recuperar archivo de Git
function recoverFromGit(commitHash, filePath) {
  try {
    const content = execSync(
      `git show ${commitHash}:${filePath}`,
      { encoding: 'utf8', cwd: path.join(__dirname, '..') }
    );
    
    const fullPath = path.join(__dirname, '..', filePath);
    const dir = path.dirname(fullPath);
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Escribir archivo
    fs.writeFileSync(fullPath, content, 'utf8');
    return true;
  } catch (error) {
    return false;
  }
}

console.log('🔍 Buscando y recuperando archivos faltantes...\n');

// Obtener todos los archivos fuente
const sourceFiles = getAllSourceFiles(srcDir);
console.log(`📁 Analizando ${sourceFiles.length} archivos...\n`);

// Analizar cada archivo
const missingImports = new Set();

sourceFiles.forEach(filePath => {
  const imports = extractImports(filePath);
  
  imports.forEach(importPath => {
    if (!fileExists(importPath)) {
      missingImports.add(importPath);
    }
  });
});

if (missingImports.size === 0) {
  console.log('✅ No se encontraron archivos faltantes!\n');
  process.exit(0);
}

console.log(`❌ Se encontraron ${missingImports.size} archivos/modulos faltantes:\n`);

const recovered = [];
const notFound = [];

// Intentar recuperar cada archivo
missingImports.forEach(importPath => {
  console.log(`🔍 Buscando: ${importPath}`);
  
  const gitInfo = findInGitHistory(importPath);
  
  if (gitInfo) {
    console.log(`   ✅ Encontrado en Git (commit: ${gitInfo.commitHash.substring(0, 8)})`);
    console.log(`   📝 Recuperando: ${gitInfo.filePath}`);
    
    if (recoverFromGit(gitInfo.commitHash, gitInfo.filePath)) {
      console.log(`   ✅ Recuperado exitosamente!\n`);
      recovered.push({ importPath, filePath: gitInfo.filePath });
    } else {
      console.log(`   ❌ Error al recuperar\n`);
      notFound.push(importPath);
    }
  } else {
    console.log(`   ❌ No encontrado en historial de Git\n`);
    notFound.push(importPath);
  }
});

// Resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN');
console.log('='.repeat(60));
console.log(`✅ Recuperados: ${recovered.length}`);
recovered.forEach(({ importPath, filePath }) => {
  console.log(`   - ${importPath} → ${filePath}`);
});

if (notFound.length > 0) {
  console.log(`\n❌ No recuperados: ${notFound.length}`);
  notFound.forEach(importPath => {
    console.log(`   - ${importPath}`);
  });
  console.log('\n💡 Estos archivos pueden necesitar ser creados manualmente.');
}

console.log('\n');
