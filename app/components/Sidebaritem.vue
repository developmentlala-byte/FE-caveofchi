<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { PhCaretRight as ChevronRight } from "@phosphor-icons/vue";

defineOptions({ name: "SidebarItem" });

const props = withDefaults(
  defineProps<{
    item: any;
    parentId: string;
    staggerIdx?: number;
    level?: 1 | 2 | 3;
  }>(),
  { staggerIdx: 0, level: 1 },
);

const sidebar: any = inject("sidebar");
const {
  isExpanded,
  hoveredMenu,
  activeMenu,
  setHoveredMenu,
  setActiveMenu,
  closeMobile,
  bumpLayout,
} = sidebar;

const hasChildren = computed(
  () => Array.isArray(props.item.items) && props.item.items.length > 0,
);
const hasActiveChild = computed(
  () => hasChildren.value && activeMenu.value.startsWith(`${props.parentId}-`),
);
const isActive = computed(
  () => activeMenu.value === props.parentId || hasActiveChild.value,
);

// Grup yang berisi halaman aktif otomatis terbuka
const isOpen = ref(hasActiveChild.value);
watch(hasActiveChild, (v) => {
  if (v) isOpen.value = true;
});

const isTop = computed(() => props.level === 1);
const isProminent = computed(
  () => hoveredMenu.value === props.parentId || isActive.value,
);
const isChildrenVisible = computed(() => isOpen.value && isExpanded.value);
const hoverTitle = computed(() =>
  isTop.value && !isExpanded.value ? props.item.title : undefined,
);

const transitionDelay = computed(() =>
  isExpanded.value ? props.staggerIdx * 0.03 : 0,
);

function handleToggle() {
  isOpen.value = !isOpen.value;
  bumpLayout();
}
function handleNavigate() {
  setActiveMenu(props.parentId);
  closeMobile();
}

const rowClass =
  "block w-full text-left outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring/50";
</script>

<template>
  <div :class="['flex flex-col', isTop ? '' : 'mt-0.5']">
    <div
      :class="['relative cursor-pointer py-0.5', isTop ? 'group' : 'group/sub']"
      @mouseenter="setHoveredMenu(parentId)"
    >
      <!-- Grup: button -->
      <button
        v-if="hasChildren"
        type="button"
        :aria-expanded="isOpen"
        :aria-label="item.title"
        :title="hoverTitle"
        :class="rowClass"
        @click="handleToggle"
        @focus="setHoveredMenu(parentId)"
      >
        <template v-if="isTop">
          <div
            :data-nav-id="parentId"
            :class="[
              'relative z-10 flex items-center w-full py-2 rounded-lg transition-colors duration-300',
              isProminent
                ? 'text-foreground font-medium'
                : 'text-muted-foreground group-hover:text-foreground',
            ]"
          >
            <span
              :class="[
                'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary transition-all duration-300',
                isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0',
              ]"
            />
            <div class="w-[48px] flex items-center justify-center shrink-0">
              <component
                :is="item.icon"
                v-if="item.icon"
                :class="[
                  'w-5 h-5 transition-all duration-300',
                  isActive ? 'text-primary' : '',
                ]"
                :weight="isProminent ? 'bold' : 'regular'"
              />
            </div>
            <div
              :class="[
                'grid css-grid-transition flex-1',
                isExpanded ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]',
              ]"
            >
              <div class="overflow-hidden whitespace-nowrap w-full">
                <div
                  class="flex items-center justify-between pr-2 w-full"
                  :style="{
                    transform: isExpanded
                      ? 'translate3d(0,0,0)'
                      : 'translate3d(0,15px,0)',
                    opacity: isExpanded ? 1 : 0,
                    transition: `transform 0.5s cubic-bezier(0.2,0.9,0.3,1) ${transitionDelay}s, opacity 0.5s cubic-bezier(0.2,0.9,0.3,1) ${transitionDelay}s`,
                    willChange: 'transform, opacity',
                  }"
                >
                  <span class="text-sm font-medium">{{ item.title }}</span>
                  <ChevronRight
                    :class="[
                      'w-4 h-4 text-muted-foreground transition-transform duration-300',
                      isOpen ? 'rotate-90' : '',
                    ]"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div
            :data-nav-id="parentId"
            :class="[
              'relative z-10 flex items-center justify-between text-sm py-1.5 px-3 rounded-md transition-colors duration-200 whitespace-nowrap',
              isProminent
                ? 'text-foreground font-medium bg-accent/50'
                : 'text-muted-foreground group-hover/sub:text-foreground group-hover/sub:bg-accent/30',
            ]"
          >
            <span>{{ item.title }}</span>
            <ChevronRight
              :class="[
                'w-3.5 h-3.5 transition-transform duration-300',
                isOpen ? 'rotate-90' : '',
              ]"
            />
          </div>
        </template>
      </button>

      <!-- Leaf: RouterLink -->
      <RouterLink
        v-else
        :to="item.url || '#'"
        :aria-label="item.title"
        :title="hoverTitle"
        :aria-current="activeMenu === parentId ? 'page' : undefined"
        :class="rowClass"
        @click="handleNavigate"
        @focus="setHoveredMenu(parentId)"
      >
        <div
          v-if="isTop"
          :data-nav-id="parentId"
          :class="[
            'relative z-10 flex items-center w-full py-2 rounded-lg transition-colors duration-300',
            isProminent
              ? 'text-foreground font-medium'
              : 'text-muted-foreground group-hover:text-foreground',
          ]"
        >
          <span
            :class="[
              'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary transition-all duration-300',
              isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0',
            ]"
          />
          <div class="w-[48px] flex items-center justify-center shrink-0">
            <component
              :is="item.icon"
              v-if="item.icon"
              :class="[
                'w-5 h-5 transition-all duration-300',
                isActive ? 'text-primary' : '',
              ]"
              :weight="isProminent ? 'bold' : 'regular'"
            />
          </div>
          <div
            :class="[
              'grid css-grid-transition flex-1',
              isExpanded ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]',
            ]"
          >
            <div class="overflow-hidden whitespace-nowrap w-full">
              <div
                class="flex items-center justify-between pr-2 w-full"
                :style="{
                  transform: isExpanded
                    ? 'translate3d(0,0,0)'
                    : 'translate3d(0,15px,0)',
                  opacity: isExpanded ? 1 : 0,
                  transition: `transform 0.5s cubic-bezier(0.2,0.9,0.3,1) ${transitionDelay}s, opacity 0.5s cubic-bezier(0.2,0.9,0.3,1) ${transitionDelay}s`,
                  willChange: 'transform, opacity',
                }"
              >
                <span class="text-sm font-medium">{{ item.title }}</span>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          :data-nav-id="parentId"
          :class="[
            'relative z-10 flex items-center justify-between text-sm py-1.5 px-3 rounded-md transition-colors duration-200 whitespace-nowrap',
            isProminent
              ? 'text-foreground font-medium bg-accent/50'
              : 'text-muted-foreground group-hover/sub:text-foreground group-hover/sub:bg-accent/30',
          ]"
        >
          <span>{{ item.title }}</span>
        </div>
      </RouterLink>
    </div>

    <!-- Anak -->
    <div
      v-if="hasChildren"
      :data-collapsed="!isChildrenVisible"
      :aria-hidden="!isChildrenVisible"
      :class="[
        'grid css-grid-transition',
        isChildrenVisible
          ? 'grid-rows-[1fr] opacity-100'
          : 'grid-rows-[0fr] opacity-0 is-collapsed',
      ]"
    >
      <div class="overflow-hidden">
        <div
          v-if="isTop"
          class="pl-[44px] pr-2 py-1 flex flex-col relative mt-1"
        >
          <div class="absolute left-[24px] top-1 bottom-1 w-px bg-border/60" />
          <SidebarItem
            v-for="(sub, idx) in item.items"
            :key="idx"
            :item="sub"
            :parent-id="`${parentId}-sub-${idx}`"
            :level="2"
          />
        </div>
        <div
          v-else
          class="pl-4 pr-1 flex flex-col relative mt-1 border-l border-border/60 ml-3 space-y-0.5"
        >
          <SidebarItem
            v-for="(sub, idx) in item.items"
            :key="idx"
            :item="sub"
            :parent-id="`${parentId}-subsub-${idx}`"
            :level="3"
          />
        </div>
      </div>
    </div>
  </div>
</template>
