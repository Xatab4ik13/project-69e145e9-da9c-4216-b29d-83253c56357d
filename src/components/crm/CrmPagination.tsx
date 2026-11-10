import { ChevronLeft, ChevronRight } from "lucide-react";
import { paginationPageNumbers } from "@/lib/crm/clients";

export function CrmPagination({
  currentPage,
  pageCount,
  onPageChange,
  label,
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  const pageNumbers = paginationPageNumbers(currentPage, pageCount);

  return (
    <nav className="flex items-center gap-1" aria-label={label}>
      <button
        type="button"
        aria-label="Предыдущая страница"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pageNumbers.map((pageNumber) => {
        const available = pageNumber <= pageCount;
        return (
          <button
            key={pageNumber}
            type="button"
            aria-label={`Страница ${pageNumber}`}
            aria-current={currentPage === pageNumber ? "page" : undefined}
            disabled={!available}
            onClick={() => onPageChange(pageNumber)}
            className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium transition-colors disabled:cursor-default disabled:opacity-40 ${currentPage === pageNumber ? "bg-crm text-crm-foreground" : "border border-border hover:bg-muted disabled:hover:bg-transparent"}`}
          >
            {pageNumber}
          </button>
        );
      })}
      <button
        type="button"
        aria-label="Следующая страница"
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
