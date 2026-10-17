<script setup lang="ts" generic="TData extends Record<string, any>">
import { computed, ref, useSlots } from "vue";
import {
  FlexRender,
  useTable,
  type ColumnDef,
  type ColumnSizingState,
  type ExpandedState,
  type PaginationState,
  type Row,
  type SortingState,
  type Updater,
} from "@tanstack/vue-table";
import {
  PhArrowLeft,
  PhArrowRight,
  PhCaretDown,
  PhCaretUp,
  PhCaretUpDown,
} from "@phosphor-icons/vue";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataTableFeatures, type DataTableFeatures } from "./dataTableFeatures";

/**
 * Cara render isi sel (opsional, per kolom) lewat slot:
 *   #cell-<columnId>="{ row, cell, value, rowNumber }"
 *   #footer-<columnId>="{ header }"
 *   #expanded-row="{ row }"
 * Kalau slot tidak ada, dipakai render bawaan dari column def.
 */

// ─── Props & Emits ────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<DataTableFeatures, TData, any>[];
    data: TData[];
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    caption?: string;
    emptyMessage?: string;
    getRowCanExpand?: (row: Row<DataTableFeatures, TData>) => boolean;
    /** Tampilkan skeleton loading menggantikan isi tabel. Header & toolbar tetap terlihat. */
    isLoading?: boolean;
    /** Jumlah baris skeleton saat loading. Default: pageSize aktif. */
    skeletonRowCount?: number;
    expandOnRowClick?: boolean;
    expandable?: boolean;
    /** Beri cursor pointer di baris (set true kalau kamu pakai @row-click). */
    clickable?: boolean;

    /** Server-side pagination support */
    manualPagination?: boolean;
    pageCount?: number;
    pageIndex?: number;
    totalRows?: number;
  }>(),
  {
    defaultPageSize: 10,
    pageSizeOptions: () => [5, 10, 25, 50],
    emptyMessage: "Tidak ada data yang ditampilkan.",
    isLoading: false,
    expandOnRowClick: false,
    expandable: false,
    clickable: false,
    manualPagination: false,
  },
);

const emit = defineEmits<{
  (e: "row-click", row: TData): void;
  (e: "page-change", page: number): void;
  (e: "page-size-change", pageSize: number): void;
}>();

const slots = useSlots();
const hasFooter = computed(() =>
  Object.keys(slots).some((k) => k.startsWith("footer-")),
);

// ─── Skeleton helpers ─────────────────────────────────────────────────────────
// Pola width bervariasi supaya kerasa natural. Deterministic (bukan Math.random)
// biar gak ada flicker antar re-render.
const SKELETON_WIDTH_PATTERN = [72, 88, 56, 94, 64, 80, 48, 90] as const;

function getSkeletonWidth(rowIndex: number, colIndex: number) {
  const idx = (rowIndex * 3 + colIndex) % SKELETON_WIDTH_PATTERN.length;
  return `${SKELETON_WIDTH_PATTERN[idx]}%`;
}

// ─── State ────────────────────────────────────────────────────────────────────

function resolveUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === "function"
    ? (updater as (old: T) => T)(previous)
    : updater;
}

const sorting = ref<SortingState>([]);
const columnSizing = ref<ColumnSizingState>({});
const expanded = ref<ExpandedState>({});
const internalPagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: props.defaultPageSize,
});

// Pagination selalu dikontrol di sini: manual -> pageIndex dari props.
const pagination = computed<PaginationState>(() =>
  props.manualPagination
    ? {
        pageIndex: props.pageIndex ?? 0,
        pageSize: internalPagination.value.pageSize,
      }
    : internalPagination.value,
);

function handlePaginationChange(updater: Updater<PaginationState>) {
  const current = pagination.value;
  const next = resolveUpdater(updater, current);

  if (props.manualPagination) {
    if (next.pageIndex !== current.pageIndex)
      emit("page-change", next.pageIndex);
    if (next.pageSize !== current.pageSize) {
      internalPagination.value = {
        ...internalPagination.value,
        pageSize: next.pageSize,
      };
      emit("page-size-change", next.pageSize);
    }
  } else {
    internalPagination.value = next;
  }
}

// ─── Table ────────────────────────────────────────────────────────────────────

const table = useTable({
  features: dataTableFeatures,
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  columnResizeMode: "onChange",
  enableColumnResizing: true,
  get getRowCanExpand() {
    return props.getRowCanExpand;
  },
  get manualPagination() {
    return props.manualPagination;
  },
  get pageCount() {
    return props.pageCount;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnSizing() {
      return columnSizing.value;
    },
    get expanded() {
      return expanded.value;
    },
    get pagination() {
      return pagination.value;
    },
  },
  onSortingChange: (u) => {
    sorting.value = resolveUpdater(u, sorting.value);
  },
  onColumnSizingChange: (u) => {
    columnSizing.value = resolveUpdater(u, columnSizing.value);
  },
  onExpandedChange: (u) => {
    expanded.value = resolveUpdater(u, expanded.value);
  },
  onPaginationChange: handlePaginationChange,
});

function handlePageSizeChange(newSize: number) {
  if (props.manualPagination) {
    internalPagination.value = {
      ...internalPagination.value,
      pageSize: newSize,
    };
    emit("page-size-change", newSize);
    emit("page-change", 0);
  } else {
    internalPagination.value = { pageIndex: 0, pageSize: newSize };
  }
}

function handleRowClick(row: Row<DataTableFeatures, TData>) {
  if (props.expandOnRowClick && row.getCanExpand()) {
    row.toggleExpanded();
  }
  emit("row-click", row.original);
}

// ─── Derived ──────────────────────────────────────────────────────────────────

const pageIndex = computed(() => pagination.value.pageIndex);
const pageSize = computed(() => pagination.value.pageSize);

const totalPages = computed(() =>
  props.manualPagination ? (props.pageCount ?? 0) : table.getPageCount(),
);
const totalRows = computed(() =>
  props.manualPagination ? (props.totalRows ?? 0) : props.data.length,
);
const startRow = computed(() =>
  totalRows.value === 0 ? 0 : pageIndex.value * pageSize.value + 1,
);
const endRow = computed(() =>
  Math.min((pageIndex.value + 1) * pageSize.value, totalRows.value),
);
const columnCount = computed(
  () => props.columns.length + (props.expandable ? 1 : 0),
);
const skeletonCount = computed(() => props.skeletonRowCount ?? pageSize.value);

// Header group pertama dipakai untuk label di mobile card
const headerGroup = computed(() => table.getHeaderGroups()[0]);

// Nomor urut mengikuti posisi baris di halaman aktif, lanjut antar halaman.
const rowNumberOf = (rowIdx: number) =>
  pageIndex.value * pageSize.value + rowIdx + 1;

const pages = computed<(number | "…")[]>(() => {
  const count = totalPages.value;
  const current = pageIndex.value;
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const result: (number | "…")[] = [];
  const start = Math.max(1, current - 1);
  const end = Math.min(count - 2, current + 1);
  result.push(0);
  if (start > 1) result.push("…");
  for (let i = start; i <= end; i++) result.push(i);
  if (end < count - 2) result.push("…");
  result.push(count - 1);
  return result;
});

const rowClickable = (row: Row<DataTableFeatures, TData>) =>
  props.clickable || (props.expandOnRowClick && row.getCanExpand());
</script>

<template>
  <div
    class="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
  >
    <!-- ── Toolbar (mobile) ─────────────────────────────────────────────── -->
    <div
      class="flex items-center justify-between gap-4 border-b border-border px-5 py-3 md:hidden"
    >
      <p v-if="caption" class="text-sm font-semibold text-foreground">
        {{ caption }}
      </p>
      <span v-else />
      <div class="flex shrink-0 items-center gap-2">
        <span class="text-xs text-muted-foreground">Tampilkan</span>
        <Select
          :model-value="String(pageSize)"
          :disabled="isLoading"
          @update:model-value="(v) => handlePageSizeChange(Number(v))"
        >
          <SelectTrigger size="sm" class="w-[104px] text-xs font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="size in pageSizeOptions"
              :key="size"
              :value="String(size)"
            >
              {{ size }} data
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- ── Desktop: Table (sm ke atas) ──────────────────────────────────── -->
    <div class="hidden w-full min-w-0 sm:block">
      <Table :style="{ minWidth: `${table.getTotalSize()}px` }">
        <TableHeader>
          <TableRow
            v-for="hg in table.getHeaderGroups()"
            :key="hg.id"
            class="bg-muted/35 hover:bg-muted/35"
          >
            <TableHead
              v-for="header in hg.headers"
              :key="header.id"
              :class="[
                'group relative h-auto select-none px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                header.column.getCanSort() && !isLoading
                  ? 'transition-colors hover:text-foreground'
                  : '',
              ]"
              :style="{ width: `${header.getSize()}px` }"
            >
              <div class="flex items-center justify-between gap-2">
                <div
                  :class="[
                    'inline-flex items-center gap-1.5',
                    header.column.getCanSort() && !isLoading
                      ? 'cursor-pointer'
                      : '',
                  ]"
                  @click="
                    header.column.getCanSort() && !isLoading
                      ? header.column.getToggleSortingHandler()?.($event)
                      : undefined
                  "
                >
                  <FlexRender v-if="!header.isPlaceholder" :header="header" />
                  <template v-if="header.column.getCanSort()">
                    <PhCaretUp
                      v-if="header.column.getIsSorted() === 'asc'"
                      weight="bold"
                      class="size-3 shrink-0 text-foreground"
                    />
                    <PhCaretDown
                      v-else-if="header.column.getIsSorted() === 'desc'"
                      weight="bold"
                      class="size-3 shrink-0 text-foreground"
                    />
                    <PhCaretUpDown
                      v-else
                      class="size-3 shrink-0 text-muted-foreground/40"
                    />
                  </template>
                </div>

                <div
                  v-if="!header.isPlaceholder"
                  :class="[
                    'absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize touch-none select-none transition-colors',
                    header.column.getIsResizing()
                      ? 'bg-foreground/50'
                      : 'bg-transparent group-hover:bg-border',
                  ]"
                  @mousedown="header.getResizeHandler()($event)"
                  @touchstart="header.getResizeHandler()($event)"
                />
              </div>
            </TableHead>
            <TableHead v-if="expandable" class="w-12 px-3 py-4" />
          </TableRow>
        </TableHeader>

        <TableBody>
          <!-- Skeleton -->
          <template v-if="isLoading">
            <TableRow
              v-for="rowIndex in skeletonCount"
              :key="`skeleton-${rowIndex}`"
              class="hover:bg-transparent"
            >
              <TableCell
                v-for="colIndex in columnCount"
                :key="colIndex"
                class="px-5 py-3.5 align-middle"
              >
                <Skeleton
                  class="h-3.5 max-w-full rounded-full"
                  :style="{
                    width: getSkeletonWidth(rowIndex - 1, colIndex - 1),
                  }"
                />
              </TableCell>
            </TableRow>
          </template>

          <!-- Empty -->
          <TableRow
            v-else-if="table.getRowModel().rows.length === 0"
            class="hover:bg-transparent"
          >
            <TableCell
              :colspan="columnCount"
              class="px-5 py-14 text-center text-sm text-muted-foreground"
            >
              {{ emptyMessage }}
            </TableCell>
          </TableRow>

          <!-- Rows -->
          <template v-else>
            <template
              v-for="(row, rowIdx) in table.getRowModel().rows"
              :key="row.id"
            >
              <TableRow
                :class="rowClickable(row) ? 'cursor-pointer' : ''"
                @click="handleRowClick(row)"
              >
                <TableCell
                  v-for="cell in row.getAllCells()"
                  :key="cell.id"
                  class="px-5 py-3.5 align-middle text-sm text-foreground"
                  :style="{ width: `${cell.column.getSize()}px` }"
                >
                  <slot
                    v-if="$slots[`cell-${cell.column.id}`]"
                    :name="`cell-${cell.column.id}`"
                    :row="row"
                    :cell="cell"
                    :value="cell.getValue()"
                    :row-number="rowNumberOf(rowIdx)"
                  />
                  <FlexRender v-else :cell="cell" />
                </TableCell>
                <TableCell
                  v-if="expandable"
                  class="px-3 py-3.5 text-right align-middle"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 text-muted-foreground"
                    :disabled="!row.getCanExpand()"
                    :aria-label="
                      row.getIsExpanded()
                        ? 'Tutup detail row'
                        : 'Buka detail row'
                    "
                    @click.stop="row.toggleExpanded()"
                  >
                    <PhCaretUp
                      v-if="row.getIsExpanded()"
                      weight="bold"
                      class="size-4"
                    />
                    <PhCaretDown v-else weight="bold" class="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow
                v-if="row.getIsExpanded() && $slots['expanded-row']"
                class="bg-muted/15 hover:bg-muted/15"
              >
                <TableCell :colspan="columnCount" class="px-5 py-4">
                  <slot name="expanded-row" :row="row" />
                </TableCell>
              </TableRow>
            </template>
          </template>
        </TableBody>

        <TableFooter v-if="!isLoading && hasFooter">
          <TableRow
            v-for="footerGroup in table.getFooterGroups()"
            :key="footerGroup.id"
            class="hover:bg-transparent"
          >
            <TableCell
              v-for="header in footerGroup.headers"
              :key="header.id"
              class="px-5 py-4 align-middle text-xs"
              :style="{ width: `${header.getSize()}px` }"
            >
              <slot
                v-if="$slots[`footer-${header.column.id}`]"
                :name="`footer-${header.column.id}`"
                :header="header"
              />
              <FlexRender
                v-else-if="
                  !header.isPlaceholder && header.column.columnDef.footer
                "
                :footer="header"
              />
            </TableCell>
            <TableCell v-if="expandable" />
          </TableRow>
        </TableFooter>
      </Table>
    </div>

    <!-- ── Mobile: Card list per baris (di bawah sm) ────────────────────── -->
    <div class="divide-y divide-border sm:hidden">
      <template v-if="isLoading">
        <div
          v-for="rowIndex in skeletonCount"
          :key="`skeleton-mobile-${rowIndex}`"
          class="flex flex-col gap-2.5 px-4 py-3"
        >
          <div
            v-for="colIndex in columnCount"
            :key="colIndex"
            class="flex items-center justify-between gap-3"
          >
            <Skeleton class="h-3 w-[30%] rounded-full" />
            <div class="flex flex-1 justify-end">
              <Skeleton
                class="h-3.5 max-w-full rounded-full"
                :style="{
                  width: getSkeletonWidth(rowIndex - 1, colIndex - 1),
                }"
              />
            </div>
          </div>
        </div>
      </template>

      <p
        v-else-if="table.getRowModel().rows.length === 0"
        class="px-5 py-10 text-center text-sm text-muted-foreground"
      >
        {{ emptyMessage }}
      </p>

      <template v-else>
        <div
          v-for="(row, rowIdx) in table.getRowModel().rows"
          :key="row.id"
          :class="[
            'flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/40',
            rowClickable(row) ? 'cursor-pointer' : '',
          ]"
          @click="handleRowClick(row)"
        >
          <div
            v-for="(cell, idx) in row.getAllCells()"
            :key="cell.id"
            class="flex min-h-[22px] items-center justify-between gap-3"
          >
            <span
              class="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <FlexRender
                v-if="headerGroup?.headers[idx]"
                :header="headerGroup.headers[idx]"
              />
            </span>
            <div class="min-w-0 text-right text-sm text-foreground">
              <slot
                v-if="$slots[`cell-${cell.column.id}`]"
                :name="`cell-${cell.column.id}`"
                :row="row"
                :cell="cell"
                :value="cell.getValue()"
                :row-number="rowNumberOf(rowIdx)"
              />
              <FlexRender v-else :cell="cell" />
            </div>
          </div>

          <div v-if="expandable" class="flex items-center justify-end pt-1">
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground"
              :disabled="!row.getCanExpand()"
              :aria-label="
                row.getIsExpanded() ? 'Tutup detail row' : 'Buka detail row'
              "
              @click.stop="row.toggleExpanded()"
            >
              <PhCaretUp
                v-if="row.getIsExpanded()"
                weight="bold"
                class="size-4"
              />
              <PhCaretDown v-else weight="bold" class="size-4" />
            </Button>
          </div>

          <div
            v-if="row.getIsExpanded() && $slots['expanded-row']"
            class="mt-2 rounded-xl border border-border bg-muted/20 p-3"
          >
            <slot name="expanded-row" :row="row" />
          </div>
        </div>
      </template>
    </div>

    <!-- ── Footer: record info + pagination ─────────────────────────────── -->
    <div
      v-if="totalPages > 0 || isLoading"
      class="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/20 px-5 py-3.5 md:py-1"
    >
      <Skeleton v-if="isLoading" class="h-3 w-[140px] rounded-full" />
      <p v-else class="shrink-0 text-xs text-muted-foreground">
        Menampilkan
        <span class="font-semibold text-foreground"
          >{{ startRow }}–{{ endRow }}</span
        >
        dari
        <span class="font-semibold text-foreground">{{ totalRows }}</span>
        data
      </p>

      <div class="flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1 px-2.5 text-xs font-medium text-muted-foreground"
          :disabled="isLoading || !table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <PhArrowLeft class="size-3" />
          Prev
        </Button>

        <div v-if="isLoading" class="flex items-center gap-1 px-1">
          <Skeleton v-for="i in 3" :key="i" class="size-[30px] rounded-lg" />
        </div>
        <div v-else class="flex items-center gap-1">
          <template
            v-for="(p, i) in pages"
            :key="p === '…' ? `ellipsis-${i}` : p"
          >
            <span
              v-if="p === '…'"
              class="select-none px-1 text-xs text-muted-foreground"
            >
              …
            </span>
            <Button
              v-else
              :variant="p === pageIndex ? 'default' : 'ghost'"
              size="sm"
              :class="[
                'h-[30px] min-w-[30px] px-1 text-xs font-medium',
                p === pageIndex ? '' : 'text-muted-foreground',
              ]"
              @click="table.setPageIndex(p)"
            >
              {{ p + 1 }}
            </Button>
          </template>
        </div>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1 px-2.5 text-xs font-medium text-muted-foreground"
          :disabled="isLoading || !table.getCanNextPage()"
          @click="table.nextPage()"
        >
          Next
          <PhArrowRight class="size-3" />
        </Button>
      </div>

      <!-- Toolbar Desktop -->
      <div
        class="flex items-center justify-between gap-4 px-5 py-3 max-sm:hidden"
      >
        <p v-if="caption" class="text-sm font-semibold text-foreground">
          {{ caption }}
        </p>
        <span v-else />
        <div class="flex shrink-0 items-center gap-2">
          <span class="text-xs text-muted-foreground">Tampilkan</span>
          <Select
            :model-value="String(pageSize)"
            :disabled="isLoading"
            @update:model-value="(v) => handlePageSizeChange(Number(v))"
          >
            <SelectTrigger size="sm" class="w-[104px] text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="size in pageSizeOptions"
                :key="size"
                :value="String(size)"
              >
                {{ size }} data
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  </div>
</template>
