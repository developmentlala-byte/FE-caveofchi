<script setup lang="ts">
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
import type { EventStatus } from "../types/event.types";

const searchInput = defineModel<string>("searchInput", { required: true });
const status = defineModel<"all" | EventStatus>("status", { required: true });

const statusOptions: { value: "all" | EventStatus; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Terbit" },
  { value: "archived", label: "Diarsipkan" },
];
</script>

<template>
  <div
    class="grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_auto] md:p-4"
  >
    <div class="relative min-w-0 sm:col-span-2 md:col-span-1">
      <PhMagnifyingGlass
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        v-model="searchInput"
        type="search"
        placeholder="Cari nama, kode, atau slug event..."
        class="h-9 rounded-xl bg-background pl-9"
      />
    </div>

    <Select
      :model-value="status"
      @update:model-value="
        (value) => {
          if (
            value === 'all' ||
            value === 'draft' ||
            value === 'published' ||
            value === 'archived'
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

    <Badge
      v-if="status !== 'all'"
      variant="secondary"
      class="h-8 w-fit rounded-full px-3 sm:col-span-2 md:col-span-2"
    >
      <span class="flex items-center gap-2">
        <span>
          {{ statusOptions.find((option) => option.value === status)?.label }}
        </span>
        <Button
          variant="ghost"
          size="sm"
          class="ml-1 h-6 px-1.5 text-xs"
          @click="status = 'all'"
        >
          Reset
        </Button>
      </span>
    </Badge>
  </div>
</template>
