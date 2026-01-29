// scripts/search-cursor-history.js
// Busca archivos en el historial local de Cursor

const fs = require('fs');
const path = require('path');

/**
 * Busca archivos en el historial de Cursor
 */
function searchCursorHistory(searchTerm) {
  const cursorHistoryPaths = [
    path.join(process.env.APPDATA || '', 'Cursor', 'User', 'History'),
    path.join(process.env.LOCALAPPDATA || '', 'Cursor', 'User', 'History'),
    path.join(process.env.HOME || '', '.cursor', 'History'),
    path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'Cursor', 'User', 'History'),
  ];
  
  console.log('🔍 Buscando en historial de Cursor...\n');
  
  for (const historyPath of cursorHistoryPaths) {
    if (fs.existsSync(historyPath)) {
      console.log(`✅ Encontrado: ${historyPath}`);
      
      try {
        // Cursor guarda historial en subdirectorios por fecha
        const subdirs = fs.readdirSync(historyPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
          .sort()
          .reverse(); // Más recientes primero
        
        console.log(`   📁 Directorios encontrados: ${subdirs.length}`);
        
        let totalFiles = 0;
        const matches = [];
        
        // Buscar en cada subdirectorio
        for (const subdir of subdirs.slice(0, 10)) { // Limitar a 10 más recientes
          const subdirPath = path.join(historyPath, subdir);
          try {
            const files = fs.readdirSync(subdirPath, { recursive: true });
            totalFiles += files.length;
            
            files.forEach(file => {
              const fullPath = path.join(subdirPath, file);
              if (typeof file === 'string' && file.toLowerCase().includes(searchTerm.toLowerCase())) {
                matches.push({
                  path: fullPath,
                  date: subdir,
                  name: file
                });
              }
            });
          } catch (error) {
            // Continuar con siguiente directorio
          }
        }
        
        console.log(`   📄 Archivos totales escaneados: ${totalFiles}`);
        
        if (matches.length > 0) {
          console.log(`\n   ✅ Coincidencias encontradas: ${matches.length}`);
          matches.slice(0, 20).forEach(match => {
            console.log(`      📅 ${match.date} - ${match.name}`);
            console.log(`         ${match.path}`);
          });
          
          if (matches.length > 20) {
            console.log(`      ... y ${matches.length - 20} más`);
          }
          
          return { historyPath, matches };
        } else {
          console.log(`   ⚠️  No se encontraron coincidencias con "${searchTerm}"`);
        }
        
        return { historyPath, matches: [] };
      } catch (error) {
        console.log(`   ⚠️  Error leyendo: ${error.message}`);
      }
    }
  }
  
  console.log('   ❌ No se encontró historial de Cursor');
  return null;
}

/**
 * Intenta leer contenido de un archivo del historial de Cursor
 */
function readCursorHistoryFile(filePath) {
  try {
    // Cursor guarda archivos en formato específico, puede ser JSON o texto
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Intentar parsear como JSON
    try {
      const json = JSON.parse(content);
      return json;
    } catch {
      // Si no es JSON, devolver como texto
      return content;
    }
  } catch (error) {
    console.error(`Error leyendo archivo: ${error.message}`);
    return null;
  }
}

// Ejecutar
if (require.main === module) {
  const searchTerm = process.argv[2] || '';
  
  if (!searchTerm) {
    console.log('Uso: node scripts/search-cursor-history.js <término-de-búsqueda>');
    console.log('Ejemplo: node scripts/search-cursor-history.js "pagination"');
    process.exit(1);
  }
  
  const result = searchCursorHistory(searchTerm);
  
  if (result && result.matches.length > 0) {
    console.log('\n💡 Para examinar un archivo específico, usa:');
    console.log('   node scripts/search-cursor-history.js <término> --read <índice>');
  }
}

module.exports = { searchCursorHistory, readCursorHistoryFile };
