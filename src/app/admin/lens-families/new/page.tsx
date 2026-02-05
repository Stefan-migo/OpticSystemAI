import { LensFamilyWizard } from "@/components/admin/lenses/LensFamilyWizard";

export default function NewLensFamilyPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Nueva Familia de Lentes</h1>
      <LensFamilyWizard />
    </div>
  );
}
