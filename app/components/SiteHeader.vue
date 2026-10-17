<script setup lang="ts">
import {
  PhBellSimple,
  PhChatCircleDots,
  PhMagnifyingGlass,
  PhGearSix,
  PhList,
  PhMoon,
  PhSun,
  PhCaretRight,
  PhSignOut,
} from '@phosphor-icons/vue'
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useDark } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import { ApiError } from '~/utils/api-error'

defineProps<{
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const route = useRoute()
const isDark = useDark()
const { user, logout } = useAuth()
const isLoggingOut = ref(false)
const userInitials = computed(() =>
  user.value?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') ?? 'MS',
)

async function handleLogout(): Promise<void> {
  isLoggingOut.value = true
  try {
    await logout()
    toast.success('Berhasil keluar.')
    await navigateTo('/login')
  } catch (error) {
    toast.error(
      error instanceof ApiError
        ? error.message
        : 'Tidak dapat keluar. Silakan coba lagi.',
    )
    if (!(error instanceof ApiError)) console.error(error)
  } finally {
    isLoggingOut.value = false
  }
}

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  master: 'Master',
  studios: 'Studio',
  events: 'Event',
  vouchers: 'Voucher',
  'bundle-promos': 'Bundle Promo',
  memberships: 'Membership',
  payments: 'Payment',
  bookings: 'Bookings',
  create: 'Create',
  edit: 'Edit',
}

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  let path = ''

  return segments.map((segment, index) => {
    path += `/${segment}`
    const title = /^\d+$/.test(segment)
      ? 'Detail'
      : breadcrumbLabels[segment] ??
        segment
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')

    return {
      title,
      path,
      isCurrent: index === segments.length - 1,
    }
  })
})
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-border/80 bg-background/95 px-4 backdrop-blur lg:px-7"
  >
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        class="shrink-0"
        :aria-label="mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'"
        title="Tampilkan/sembunyikan navigasi"
        @click="emit('toggle-sidebar')"
      >
        <PhList class="size-5" />
      </Button>

      <nav
        aria-label="Breadcrumb"
        class="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm sm:gap-2"
      >
        <template v-for="(item, index) in breadcrumbs" :key="item.path">
          <PhCaretRight
            v-if="index > 0"
            class="size-3.5 shrink-0 text-muted-foreground/70"
            aria-hidden="true"
          />
          <span
            v-if="item.isCurrent"
            class="truncate font-semibold text-foreground"
            aria-current="page"
          >
            {{ item.title }}
          </span>
          <RouterLink
            v-else
            :to="item.path"
            class="truncate text-muted-foreground transition-colors hover:text-foreground"
          >
            {{ item.title }}
          </RouterLink>
        </template>
      </nav>
    </div>

    <div class="flex shrink-0 items-center gap-1 sm:gap-2">
      <div
        class="hidden items-center gap-0.5 border-r border-border pr-2 sm:flex"
        aria-label="Alat workspace"
      >
        <Button variant="ghost" size="icon" aria-label="Cari">
          <PhMagnifyingGlass class="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Pengaturan">
          <PhGearSix class="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Pesan">
          <PhChatCircleDots class="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifikasi">
          <PhBellSimple class="size-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        :aria-label="isDark ? 'Gunakan tema terang' : 'Gunakan tema gelap'"
        :title="isDark ? 'Gunakan tema terang' : 'Gunakan tema gelap'"
        @click="isDark = !isDark"
      >
        <PhSun v-if="isDark" class="size-4" />
        <PhMoon v-else class="size-4" />
      </Button>

      <div class="flex items-center gap-2 pl-1 sm:pl-2">
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
          aria-hidden="true"
        >
          {{ userInitials }}
        </div>
        <div class="hidden min-w-0 flex-col sm:flex">
          <span class="max-w-32 truncate text-sm font-semibold leading-tight">
            {{ user?.name ?? 'Cave Of Chi' }}
          </span>
          <span class="text-xs leading-tight text-muted-foreground">
            {{ user?.roles.map((role) => role.name).join(', ') ?? 'Akun' }}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        class="ml-1"
        aria-label="Keluar"
        title="Keluar"
        :disabled="isLoggingOut"
        @click="handleLogout"
      >
        <PhSignOut class="size-4" />
      </Button>
    </div>
  </header>
</template>
