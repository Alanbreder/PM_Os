export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export function applyPagination<T>(
  items: T[],
  pageParam?: any,
  limitParam?: any
): {
  data: T[];
  pagination: PaginationMeta;
} {
  const total = items.length;
  let page = parseInt(pageParam, 10);
  let limit = parseInt(limitParam, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 50;
  if (limit > 100) limit = 100;

  const total_pages = Math.ceil(total / limit) || 1;
  const validPage = Math.min(page, total_pages);
  const startIndex = (validPage - 1) * limit;
  const paginatedData = items.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    pagination: {
      page: validPage,
      limit,
      total,
      total_pages,
    },
  };
}
