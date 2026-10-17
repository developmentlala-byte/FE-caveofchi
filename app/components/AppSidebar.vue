<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
} from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  PhDatabase as Database,
  PhCreditCard as CreditCard,
  PhCalendarCheck as CalendarCheck,
  PhCamera,
  PhHouse as House,
  PhPushPin,
} from "@phosphor-icons/vue";
import { ScrollArea } from "@/components/ui/scroll-area";
import SidebarItem from "./Sidebaritem.vue";
import logoUrl from "/logo-cave-of-chi.png";
import { useSidebarStore } from "~/stores/sidebar";
const mobileOpen = defineModel<boolean>("mobileOpen", { default: false });

// ==========================================
// 1. DATA MENU (statis, tanpa role)
// ==========================================
const MENU: any[] = [
  {
    title: "Dashboard",
    icon: House,
    url: "/dashboard",
  },
  {
    title: "Master",
    icon: Database,
    items: [
      { title: "Event", url: "/dashboard/master/events" },
      { title: "Studio", url: "/dashboard/master/studios" },
      { title: "Voucher", url: "/dashboard/master/vouchers" },
      { title: "Bundle Promo", url: "/dashboard/master/bundle-promos" },
      { title: "Membership", url: "/dashboard/master/memberships" },
    ],
  },
  {
    title: "Payment",
    icon: CreditCard,
    url: "/dashboard/payments",
  },
  {
    title: "Bookings",
    icon: CalendarCheck,
    url: "/dashboard/bookings",
  },
];

// ==========================================
// 1b. HELPER NAVIGASI
// ==========================================
// Menu level-1 dengan SATU anak (tanpa sub-grup) jadi link langsung
const flattenSingleChild = (menu: any) => {
  if (menu.items?.length === 1 && !menu.items[0].items) {
    return {
      title: menu.title,
      icon: menu.icon,
      url: menu.items[0].url,
      order: menu.order,
      section: menu.section,
    };
  }
  return menu;
};

const activeMenus = computed(() => MENU.map(flattenSingleChild));

const normalizePath = (p?: string) =>
  (p || "").toLowerCase().replace(/\/+$/, "") || "/";

const getMatchScore = (pathname: string, url?: string) => {
  if (!url || url === "#") return 0;
  const path = normalizePath(pathname);
  const target = normalizePath(url);
  if (path === target) return target.length + 1;
  if (target !== "/dashboard" && path.startsWith(`${target}/`)) {
    return target.length;
  }
  return 0;
};

const CHILD_ID_PREFIX = ["-sub-", "-subsub-"];

const findActiveId = (menus: any[], pathname: string) => {
  let best = { id: "", score: 0 };
  const visit = (item: any, id: string, depth: number) => {
    const score = getMatchScore(pathname, item.url);
    if (score > best.score) best = { id, score };
    const prefix = CHILD_ID_PREFIX[depth];
    if (item.items && prefix) {
      item.items.forEach((child: any, i: number) =>
        visit(child, `${id}${prefix}${i}`, depth + 1),
      );
    }
  };
  menus.forEach((menu, i) => visit(menu, `menu-${i}`, 0));
  return best.id;
};

const PARENT_ID_REGEX = /-(sub|subsub)-\d+$/;

// ==========================================
// 2. STATE
// ==========================================
const route = useRoute();
const sidebarStore = useSidebarStore();

const asideRef = ref<HTMLElement | null>(null);
const pillRef = ref<HTMLElement | null>(null);
const isHovered = ref(false);

const isExpanded = computed(() => sidebarStore.isPinned || isHovered.value);
const isPillReady = ref(false);

const activeMenu = ref("");
const hoveredMenu = ref("");
const layoutTick = ref(0);

provide("sidebar", {
  isExpanded,
  hoveredMenu,
  activeMenu,
  setHoveredMenu: (id: string) => (hoveredMenu.value = id),
  setActiveMenu: (id: string) => (activeMenu.value = id),
  closeMobile: () => (mobileOpen.value = false),
  bumpLayout: () => layoutTick.value++,
});

// Active state mengikuti URL
watch(
  [() => route.path, activeMenus],
  () => {
    const id = findActiveId(activeMenus.value, route.path);
    activeMenu.value = id;
    hoveredMenu.value = id;
  },
  { immediate: true },
);

// ==========================================
// 3. PILL
// ==========================================
function updatePillPosition() {
  const aside = asideRef.value;
  const pill = pillRef.value;
  if (!aside || !pill) return;

  const find = (id: string) =>
    aside.querySelector<HTMLElement>(`[data-nav-id="${id}"]`);
  const isHidden = (el: HTMLElement | null) =>
    !!el && !!el.closest('[data-collapsed="true"]');

  let targetId = hoveredMenu.value;
  let targetEl = targetId ? find(targetId) : null;

  while (targetEl && isHidden(targetEl) && PARENT_ID_REGEX.test(targetId)) {
    targetId = targetId.replace(PARENT_ID_REGEX, "");
    targetEl = find(targetId);
  }

  if (!targetEl || isHidden(targetEl)) {
    pill.style.opacity = "0";
    return;
  }

  const a = aside.getBoundingClientRect();
  const t = targetEl.getBoundingClientRect();
  if (t.width === 0 && t.height === 0) {
    pill.style.opacity = "0";
    return;
  }

  pill.style.opacity = "1";
  pill.style.transform = `translate3d(${t.left - a.left}px, ${t.top - a.top}px, 0)`;
  pill.style.width = `${t.width}px`;
  pill.style.height = `${t.height}px`;
}

let frameId = 0;
function trackPill() {
  cancelAnimationFrame(frameId);
  const start = performance.now();
  const loop = (time: number) => {
    updatePillPosition();
    if (time - start < 500) frameId = requestAnimationFrame(loop);
  };
  frameId = requestAnimationFrame(loop);
}

watch([hoveredMenu, activeMenu, isExpanded, layoutTick], () => {
  nextTick(trackPill);
});

onMounted(() => {
  nextTick(() => {
    trackPill();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => (isPillReady.value = true)),
    );
  });
});
onBeforeUnmount(() => cancelAnimationFrame(frameId));

function onAsideLeave() {
  isHovered.value = false;
  hoveredMenu.value = activeMenu.value;
}

function onAsideEnter() {
  if (!sidebarStore.isPinned) isHovered.value = true;
}
</script>

<template>
  <!-- Overlay mobile -->
  <div
    :class="[
      'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden transition-opacity duration-500 ease-in-out',
      mobileOpen
        ? 'opacity-100 pointer-events-auto'
        : 'opacity-0 pointer-events-none',
    ]"
    @click="mobileOpen = false"
  />

  <aside
    ref="asideRef"
    :class="[
      'fixed top-0 z-50 h-svh min-h-svh shrink-0 flex flex-col border-r border-border bg-background overflow-hidden transition-all duration-300 ease-in-out md:sticky md:translate-x-0',
      mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ]"
    :style="{ width: mobileOpen ? '260px' : isExpanded ? '260px' : '80px' }"
    @mouseenter="onAsideEnter"
    @mouseleave="onAsideLeave"
  >
    <!-- Pill penanda hover / aktif -->
    <div
      ref="pillRef"
      :class="[
        'absolute z-0 pointer-events-none bg-accent/80 border border-border/50 shadow-sm rounded-lg',
        isPillReady ? 'fluid-pill-transition' : '',
      ]"
      style="opacity: 0"
    />

    <!-- Header -->
    <div
      :class="[
        'relative z-20 flex h-16 shrink-0 items-center border-b border-border px-3',
        isExpanded ? 'justify-start' : 'justify-center',
      ]"
    >
      <RouterLink
        to="/dashboard"
        :class="[
          'flex min-w-0 items-center outline-none gap-2',
          isExpanded ? 'flex-1' : 'justify-center',
        ]"
      >
        <div class="flex w-10 shrink-0 items-center justify-center">
          <!-- Logo krem dirancang untuk latar gelap, jadi ditaruh di tile gelap
               yang tetap sama di mode terang maupun gelap. -->
          <div
            class="flex size-9 items-center justify-center rounded-md bg-[#2E2924] p-1.5 shadow-sm"
          >
            <img
              :src="logoUrl"
              alt=""
              width="24"
              height="24"
              decoding="async"
              draggable="false"
              class="size-full object-contain select-none"
            />
          </div>
        </div>
        <div
          :class="[
            'grid min-w-0 transition-all duration-200',
            isExpanded
              ? 'flex-1 grid-cols-[1fr] opacity-100'
              : 'grid-cols-[0fr] opacity-0',
          ]"
        >
          <div class="min-w-0 overflow-hidden whitespace-nowrap">
            <span
              class="block truncate text-sm font-semibold leading-tight text-foreground"
            >
              Cave Of Chi
            </span>
            <span
              class="block truncate text-xs leading-tight text-muted-foreground"
            >
              Business Management
            </span>
          </div>
        </div>
      </RouterLink>

      <button
        v-if="isExpanded"
        type="button"
        :class="[
          'hidden size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-foreground md:flex',
          sidebarStore.isPinned
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground',
        ]"
        :aria-label="sidebarStore.isPinned ? 'Lepas sematan sidebar' : 'Sematkan sidebar'"
        :aria-pressed="sidebarStore.isPinned"
        :title="sidebarStore.isPinned ? 'Lepas sematan sidebar' : 'Sematkan sidebar'"
        @click="sidebarStore.togglePinned()"
      >
        <PhPushPin class="size-4" />
      </button>
    </div>

    <!-- Menu -->
    <ScrollArea
      class="min-h-0 flex-1 overflow-x-hidden py-4 px-3 relative z-10"
    >
      <nav aria-label="Main navigation" class="flex flex-col gap-1 pb-6">
        <template v-for="(menuItem, idx) in activeMenus" :key="menuItem.title">
          <!-- Label section: teks saat melebar, garis tipis saat mengecil -->
          <div
            v-if="
              menuItem.section &&
              menuItem.section !== activeMenus[idx - 1]?.section
            "
            aria-hidden="true"
            class="relative h-6 mt-3 flex items-center select-none"
          >
            <span
              :class="[
                'absolute left-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 whitespace-nowrap transition-opacity duration-300',
                isExpanded ? 'opacity-100' : 'opacity-0',
              ]"
            >
              {{ menuItem.section }}
            </span>
            <span
              :class="[
                'absolute left-3 right-3 h-px bg-border/70 transition-opacity duration-300',
                isExpanded ? 'opacity-0' : 'opacity-100',
              ]"
            />
          </div>

          <div
            class="animate-stagger-item"
            :style="{ animationDelay: `${idx * 0.03}s` }"
          >
            <SidebarItem
              :item="menuItem"
              :parent-id="`menu-${idx}`"
              :stagger-idx="idx"
              :level="1"
            />
          </div>
        </template>
      </nav>
    </ScrollArea>
  </aside>
</template>

<style>
.css-grid-transition {
  transition:
    grid-template-columns 0.5s cubic-bezier(0.2, 0.9, 0.3, 1),
    grid-template-rows 0.5s cubic-bezier(0.2, 0.9, 0.3, 1),
    opacity 0.4s ease,
    visibility 0s linear 0s;
}
.css-grid-transition.is-collapsed {
  visibility: hidden;
  transition:
    grid-template-columns 0.5s cubic-bezier(0.2, 0.9, 0.3, 1),
    grid-template-rows 0.5s cubic-bezier(0.2, 0.9, 0.3, 1),
    opacity 0.4s ease,
    visibility 0s linear 0.5s;
}
.fluid-pill-transition {
  transition:
    transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1),
    width 0.5s cubic-bezier(0.2, 0.9, 0.3, 1),
    height 0.5s cubic-bezier(0.2, 0.9, 0.3, 1),
    opacity 0.3s ease;
  will-change: transform, width, height, opacity;
}
@keyframes fadeInUpStagger {
  0% {
    opacity: 0;
    transform: translate3d(0, 15px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
.animate-stagger-item {
  opacity: 0;
  animation: fadeInUpStagger 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
}
@media (prefers-reduced-motion: reduce) {
  .css-grid-transition,
  .fluid-pill-transition {
    transition-duration: 0.01ms !important;
    transition-delay: 0s !important;
  }
  .animate-stagger-item {
    animation-duration: 0.01ms !important;
  }
}
</style>
