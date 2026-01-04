import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectsLoading() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
