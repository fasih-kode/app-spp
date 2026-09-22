<script lang="ts">
  import { Bell, Menu, User } from '@lucide/svelte'

  let { onMenuClick }: { onMenuClick?: () => void } = $props()
</script>

<header class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
      aria-label="Buka menu"
      onclick={() => onMenuClick?.()}
    >
      <Menu size={21} />
    </button>

    <div>
      <p class="text-sm font-medium text-slate-900">
        Dashboard
      </p>
      <p class="hidden text-xs text-slate-500 sm:block">
        Ringkasan administrasi pembayaran
      </p>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <button
      type="button"
      class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      aria-label="Notifikasi"
    >
      <Bell size={20} />
    </button>

    <div class="ml-1 hidden h-8 w-px bg-slate-200 sm:block"></div>

    <button
      type="button"
      class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
      aria-label="Profil pengguna"
    >
      <div
        class="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
      >
        <User size={17} />
      </div>

      <div class="hidden text-left sm:block">
        <p class="text-sm font-medium text-slate-900">
          Administrator
        </p>
        <p class="text-xs text-slate-500">
          Admin
        </p>
      </div>
    </button>
  </div>
</header>
