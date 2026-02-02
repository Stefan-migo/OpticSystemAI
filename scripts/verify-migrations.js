/**
 * Verify that production migrations (20260205) were applied correctly.
 * Run: node scripts/verify-migrations.js
 * Uses SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL from .env.local
 */
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  const errors = [];
  const ok = [];

  // 1. subscriptions: gateway_subscription_id, gateway_customer_id, gateway, trial_ends_at
  try {
    const { data, error } = await supabase.from("subscriptions").select("id, gateway_subscription_id, gateway_customer_id, gateway, trial_ends_at").limit(1);
    if (error) errors.push(`subscriptions: ${error.message}`);
    else ok.push("✓ subscriptions: gateway_subscription_id, gateway_customer_id, gateway, trial_ends_at OK");
  } catch (e) {
    errors.push(`subscriptions: ${e.message}`);
  }

  // 2. organizations: trial_days_override
  try {
    const { data, error } = await supabase.from("organizations").select("id, trial_days_override").limit(1);
    if (error) errors.push(`organizations: ${error.message}`);
    else ok.push("✓ organizations: trial_days_override OK");
  } catch (e) {
    errors.push(`organizations: ${e.message}`);
  }

  // 3. system_config: Daluz replaced
  try {
    const { data, error } = await supabase.from("system_config").select("config_key, config_value").in("config_key", ["site_name", "contact_email", "support_email"]).limit(5);
    if (error) errors.push(`system_config: ${error.message}`);
    else {
      const daluz = (data || []).filter((r) => String(r.config_value || "").toLowerCase().includes("daluz"));
      if (daluz.length > 0) {
        errors.push(`system_config: still has Daluz refs: ${daluz.map((r) => r.config_key).join(", ")}`);
      } else {
        ok.push("✓ system_config: Daluz replaced with Opttius");
      }
    }
  } catch (e) {
    errors.push(`system_config: ${e.message}`);
  }

  ok.forEach((m) => console.log(m));
  if (errors.length > 0) {
    console.error("\n❌ Errors:");
    errors.forEach((e) => console.error("  -", e));
    process.exit(1);
  }
  console.log("\n✅ All migrations verified successfully.");
}

verify().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
