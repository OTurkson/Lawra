import React from "react";

type TablePaginatorProps<T> = {
  items: T[];
  pageSize?: number;
  renderPage: (pageItems: T[]) => React.ReactNode;
  className?: string;
};

export function TablePaginator<T>({ items, pageSize = 10, renderPage }: TablePaginatorProps<T>) {
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    // Reset to first page if items change
    setPage(1);
  }, [items]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageItems = items.slice(start, end);

  const showControls = total > pageSize;

  return (
    <>
      {renderPage(pageItems)}

      {showControls && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
          <div className="text-sm text-muted-foreground">
            Showing {start + 1}-{end} of {total}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded-md border bg-card text-sm disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>

            <div className="text-sm text-muted-foreground">Page {page} / {totalPages}</div>

            <button
              className="px-3 py-1 rounded-md border bg-card text-sm disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default TablePaginator;
