/**
 * Script para confirmar manualmente el email de un usuario en desarrollo local
 * 
 * Uso:
 *   node scripts/confirm-user-email.js <email>
 * 
 * O con variable de entorno:
 *   USER_EMAIL=usuario@ejemplo.com node scripts/confirm-user-email.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurado en .env.local");
  console.error("   Ejecuta: supabase status para obtener la service role key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function confirmUserEmail(email) {
  console.log(`\n🔍 Buscando usuario con email: ${email}`);

  // Buscar usuario por email
  const { data: users, error: searchError } = await supabase.auth.admin.listUsers();

  if (searchError) {
    console.error("❌ Error buscando usuarios:", searchError.message);
    process.exit(1);
  }

  const user = users.users.find((u) => u.email === email);

  if (!user) {
    console.error(`❌ No se encontró usuario con email: ${email}`);
    console.log("\n📋 Usuarios disponibles:");
    users.users.forEach((u) => {
      console.log(`   - ${u.email} (${u.email_confirmed_at ? "✅ confirmado" : "❌ no confirmado"})`);
    });
    process.exit(1);
  }

  if (user.email_confirmed_at) {
    console.log(`✅ El usuario ${email} ya tiene su email confirmado`);
    console.log(`   Confirmado el: ${new Date(user.email_confirmed_at).toLocaleString()}`);
    return;
  }

  console.log(`\n📧 Confirmando email para usuario: ${email} (ID: ${user.id})`);

  // Confirmar email usando admin API
  const { data: updatedUser, error: confirmError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      email_confirm: true,
    }
  );

  if (confirmError) {
    console.error("❌ Error confirmando email:", confirmError.message);
    process.exit(1);
  }

  console.log(`\n✅ Email confirmado exitosamente para: ${email}`);
  console.log(`   Usuario ID: ${updatedUser.user.id}`);
  console.log(`   Email confirmado: ${updatedUser.user.email_confirmed_at ? "Sí" : "No"}`);
  console.log(`\n🎉 Ahora puedes iniciar sesión y continuar con el onboarding`);
}

// Obtener email del argumento o variable de entorno
const email = process.argv[2] || process.env.USER_EMAIL;

if (!email) {
  console.error("❌ Error: Debes proporcionar un email");
  console.error("\nUso:");
  console.error("   node scripts/confirm-user-email.js <email>");
  console.error("\nO con variable de entorno:");
  console.error("   USER_EMAIL=usuario@ejemplo.com node scripts/confirm-user-email.js");
  process.exit(1);
}

confirmUserEmail(email).catch((error) => {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
});
