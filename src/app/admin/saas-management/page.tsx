import { redirect } from "next/navigation";

export default function SaasManagementPage() {
  // Redirigir al dashboard por defecto
  redirect("/admin/saas-management/dashboard");
}
