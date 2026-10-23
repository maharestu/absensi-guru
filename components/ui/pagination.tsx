import React from "react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  size?: "sm" | "md";
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  size = "md",
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const isSmall = size === "sm";

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }

    return pages.map((page, index) => {
      if (page === "...") {
        return (
          <span
            key={`dots-${index}`}
            className={`text-slate-400 font-medium ${
              isSmall ? "px-1 py-0.5 text-xs" : "px-1.5 py-1 text-xs"
            }`}
          >
            ...
          </span>
        );
      }
      const isCurrent = currentPage === page;
      return (
        <button
          key={`page-${page}`}
          onClick={() => onPageChange(page as number)}
          className={`font-semibold transition-all flex items-center justify-center cursor-pointer ${
            isSmall
              ? "min-w-[24px] sm:min-w-[27px] h-6 sm:h-7 px-1 rounded-md text-[11px] sm:text-xs"
              : "min-w-[28px] sm:min-w-[30px] h-7 sm:h-7.5 px-1.5 sm:px-2 rounded-md text-xs sm:text-[13px]"
          } ${
            isCurrent
              ? "bg-[#334155] text-white border border-[#334155] shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 border border-slate-200/90 bg-white"
          }`}
        >
          {page}
        </button>
      );
    });
  };

  if (totalItems === 0) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 w-full ${
        isSmall
          ? "gap-2 sm:gap-3 mt-3.5 pt-3"
          : "gap-3 sm:gap-3.5 mt-4 pt-3.5"
      }`}
    >
      <div
        className={`text-slate-500 text-center sm:text-left ${
          isSmall ? "text-[11px] sm:text-xs" : "text-xs sm:text-[13px]"
        }`}
      >
        Menampilkan{" "}
        <span className="font-bold text-slate-700">
          {startIndex}–{endIndex}
        </span>{" "}
        dari <span className="font-bold text-slate-700">{totalItems}</span> data
      </div>

      <div className={`flex items-center ${isSmall ? "gap-1" : "gap-1.5"}`}>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`flex items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
            isSmall ? "w-6 h-6 sm:w-7 sm:h-7" : "w-7 h-7 sm:w-7.5 sm:h-7.5"
          }`}
          title="Halaman Pertama"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isSmall ? "w-3 h-3" : "w-3 h-3 sm:w-3.5 sm:h-3.5"}
          >
            <polyline points="11 17 6 12 11 7"></polyline>
            <polyline points="18 17 13 12 18 7"></polyline>
          </svg>
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
            isSmall ? "w-6 h-6 sm:w-7 sm:h-7" : "w-7 h-7 sm:w-7.5 sm:h-7.5"
          }`}
          title="Sebelumnya"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isSmall ? "w-3 h-3" : "w-3 h-3 sm:w-3.5 sm:h-3.5"}
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div className={`flex items-center ${isSmall ? "gap-1 mx-0.5" : "gap-1.5 mx-1"}`}>
          {renderPageNumbers()}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
            isSmall ? "w-6 h-6 sm:w-7 sm:h-7" : "w-7 h-7 sm:w-7.5 sm:h-7.5"
          }`}
          title="Berikutnya"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isSmall ? "w-3 h-3" : "w-3 h-3 sm:w-3.5 sm:h-3.5"}
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`flex items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
            isSmall ? "w-6 h-6 sm:w-7 sm:h-7" : "w-7 h-7 sm:w-7.5 sm:h-7.5"
          }`}
          title="Halaman Terakhir"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isSmall ? "w-3 h-3" : "w-3 h-3 sm:w-3.5 sm:h-3.5"}
          >
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}
