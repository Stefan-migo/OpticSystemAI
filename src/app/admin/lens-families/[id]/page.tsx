import { LensFamilyEditor } from "@/components/admin/lenses/LensFamilyEditor";

interface PageProps {
  params: {
    id: string;
  };
}

export default function LensFamilyDetailPage({ params }: PageProps) {
  return (
    <div className="container mx-auto py-6">
      <LensFamilyEditor familyId={params.id} />
    </div>
  );
}
