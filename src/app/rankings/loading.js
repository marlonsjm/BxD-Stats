import { TableSkeleton } from "@/components/TableSkeleton";

export default function Loading() {
  return (
    <div className="text-white py-4 md:py-8">
      <div className="container mx-auto space-y-8">
        <TableSkeleton rows={8} />
        <TableSkeleton rows={8} title={false} />
      </div>
    </div>
  );
}
