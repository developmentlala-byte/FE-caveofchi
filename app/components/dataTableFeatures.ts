import {
  columnVisibilityFeature,
  columnResizingFeature,
  columnSizingFeature,
  createExpandedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from "@tanstack/vue-table";

/**
 * Fitur yang dipakai DataTable.vue.
 * Pakai di columns: createColumnHelper<typeof dataTableFeatures, MyRow>()
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowExpandingFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  sortFns,
});

export type DataTableFeatures = typeof dataTableFeatures;
