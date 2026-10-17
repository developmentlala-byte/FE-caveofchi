<script setup lang="ts">
import { ref, watch } from "vue";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    id?: string;
    max?: number;
    disabled?: boolean;
    placeholder?: string;
  }>(),
  { max: 999_999_999, disabled: false, placeholder: "0" },
);

/** Nilai asli: angka bulat rupiah (2000), bukan teks berformat. */
const model = defineModel<number>({ default: 0 });

const formatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const format = (value: number) =>
  formatter.format(Number.isFinite(value) ? value : 0);
const toDigits = (value: string) => value.replace(/\D/g, "");
const toNumber = (value: string) => Number(toDigits(value) || 0);

/** Teks yang tampil di input (2.000). */
const text = ref(format(Number(model.value ?? 0)));

// Sinkron kalau nilai diubah dari luar (mis. form di-reset atau modal edit dibuka).
watch(model, (value) => {
  const next = Number(value ?? 0);
  if (next !== toNumber(text.value)) text.value = format(next);
});

const onInput = (event: Event) => {
  const el = event.target as HTMLInputElement;
  const caret = el.selectionStart ?? el.value.length;

  // Abaikan desimal (mis. hasil paste "Rp 2.000,50"): ambil bagian sebelum koma.
  const raw = el.value.split(",")[0];
  const allDigits = toDigits(raw);
  const digits = allDigits.replace(/^0+(?=\d)/, ""); // buang nol di depan
  const stripped = allDigits.length - digits.length;
  const digitsBeforeCaret = Math.max(
    0,
    toDigits(raw.slice(0, caret)).length - stripped,
  );
  const value = digits ? Number(digits) : 0;

  // Tolak input yang melewati batas maksimum.
  if (value > props.max) {
    el.value = text.value;
    const back = Math.max(0, caret - 1);
    el.setSelectionRange(back, back);
    return;
  }

  const formatted = digits ? format(value) : "";

  // Pertahankan posisi kursor setelah titik pemisah ditambahkan.
  let seen = 0;
  let pos = 0;
  while (pos < formatted.length && seen < digitsBeforeCaret) {
    if (/\d/.test(formatted[pos])) seen++;
    pos++;
  }

  text.value = formatted;
  el.value = formatted;
  el.setSelectionRange(pos, pos);
  model.value = value;
};

const onFocus = (event: FocusEvent) => {
  const el = event.target as HTMLInputElement;
  // Nilai 0: blok semua supaya langsung tertimpa saat mengetik.
  if (toNumber(text.value) === 0) setTimeout(() => el.select(), 0);
};

const onBlur = () => {
  text.value = format(Number(model.value ?? 0));
};
</script>

<template>
  <InputGroup :data-disabled="disabled || undefined">
    <input
      v-bind="$attrs"
      :id="id"
      data-slot="input-group-control"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      :placeholder="placeholder"
      :disabled="disabled"
      :value="text"
      class="h-full min-w-0 flex-1 bg-transparent py-1 pr-3 pl-1 text-base tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <InputGroupAddon>
      <InputGroupText>Rp</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
</template>
