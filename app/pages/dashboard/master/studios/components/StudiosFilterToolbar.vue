<script setup lang="ts">
import { computed } from "vue";
import { PhFunnel, PhMagnifyingGlass } from "@phosphor-icons/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudioStatus } from "../type/studio.types";

const searchInput = defineModel<string>("searchInput", { required: true });
const status = defineModel<"all" | StudioStatus>("status", { required: true });
const capacity = defineModel<"" | "5" | "10" | "15">("capacity", {
  required: true,
});
const capacitySelectValue = computed({
  get: () => capacity.value || "all",
  set: (value: "all" | "5" | "10" | "15") => {
    capacity.value = value === "all" ? "" : value;
  },
});

const statusOptions: { value: "all" | StudioStatus; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
  { value: "maintenance", label: "Maintenance" },
];
const capacityOptions = [
  { value: "all", label: "Semua kapasitas" },
  { value: "5", label: "Di atas 5 orang" },
  { value: "10", label: "Di atas 10 orang" },
  { value: "15", label: "Di atas 15 orang" },
] as const;
</script>

<template>
  <div
    class="grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_auto_auto] md:p-4"
  >
    <div class="relative min-w-0 sm:col-span-2 md:col-span-1">
      <PhMagnifyingGlass
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        v-model="searchInput"
        type="search"
        placeholder="Cari nama, kode, atau slug studio..."
        class="h-9 rounded-xl bg-background pl-9"
      />
    </div>

    <Select
      :model-value="status"
      @update:model-value="
        (value) => {
          if (
            value === 'all' ||
            value === 'active' ||
            value === 'inactive' ||
            value === 'maintenance'
          )
            status = value;
        }
      "
    >
      <SelectTrigger class="h-10 w-full rounded-xl bg-background md:w-48">
        <PhFunnel class="size-4 text-muted-foreground" />
        <SelectValue placeholder="Filter status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in statusOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Select
      :model-value="capacitySelectValue"
      @update:model-value="
        (value) => {
          if (
            value === 'all' ||
            value === '5' ||
            value === '10' ||
            value === '15'
          )
            capacitySelectValue = value;
        }
      "
    >
      <SelectTrigger class="h-10 w-full rounded-xl bg-background md:w-52">
        <SelectValue placeholder="Filter kapasitas" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in capacityOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Badge
      v-if="status !== 'all' || capacity !== ''"
      variant="secondary"
      class="h-8 w-fit rounded-full px-3 sm:col-span-2 md:col-span-3"
    >
      <span class="flex items-center gap-2">
        <span v-if="status !== 'all'">
          {{ statusOptions.find((option) => option.value === status)?.label }}
        </span>
        <span v-if="status !== 'all' && capacity !== ''" aria-hidden="true">
          ·
        </span>
        <span v-if="capacity !== ''">
          {{
            capacityOptions.find((option) => option.value === capacity)?.label
          }}
        </span>
        <Button
          variant="ghost"
          size="sm"
          class="ml-1 h-6 px-1.5 text-xs"
          @click="
            () => {
              status = 'all';
              capacity = '';
            }
          "
        >
          Reset
        </Button>
      </span>
    </Badge>
  </div>
</template>
