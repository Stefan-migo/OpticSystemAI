import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

interface SaasManagementLayoutProps {
  children: ReactNode;
}

export default async function SaasManagementLayout({
  children,
}: SaasManagementLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar si el usuario es root/dev usando service role
  const supabaseServiceRole = createServiceRoleClient();
  const { data: adminUser } = await supabaseServiceRole
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isRoot = adminUser?.role === "root" || adminUser?.role === "dev";

  if (!isRoot) {
    redirect("/admin");
  }

  return <>{children}</>;
}
