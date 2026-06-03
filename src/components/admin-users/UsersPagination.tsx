import { Button } from '@/components/ui/button';
import { ITEMS_PER_PAGE } from './shared';

interface UsersPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onChange: (page: number) => void;
}

export function UsersPagination({ currentPage, totalPages, totalItems, onChange }: UsersPaginationProps) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const to = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t mt-4">
      <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
        {from}-{to} de {totalItems}
      </p>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {currentPage}/{totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
