<script lang="ts">
  import {
    BarChart3,
    BookOpen,
    CreditCard,
    FileText,
    GraduationCap,
    LayoutDashboard,
    Receipt,
    Settings,
    Users,
    X,
  } from '@lucide/svelte'

  type NavItem = {
    label: string
    icon: typeof LayoutDashboard
  }

  type NavGroup = {
    label: string
    items: NavItem[]
  }

  let { open = false, onClose }: { open?: boolean; onClose?: () => void } = $props()

  const mainNavigation: NavItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
  ]

  const navigationGroups: NavGroup[] = [
    {
      label: 'Akademik',
      items: [
        {
          label: 'Tahun Ajaran',
          icon: BookOpen,
        },
        {
          label: 'Kelas',
          icon: GraduationCap,
        },
        {
          label: 'Siswa',
          icon: Users,
        },
      ],
    },
    {
      label: 'Pembayaran',
      items: [
        {
          label: 'Jenis Pembayaran',
          icon: FileText,
        },
        {
          label: 'Tarif',
          icon: CreditCard,
        },
        {
          label: 'Tagihan',
          icon: Receipt,
        },
        {
          label: 'Transaksi',
          icon: CreditCard,
        },
      ],
    },
    {
      label: 'Laporan',
      items: [
        {
          label: 'Tunggakan',
          icon: Receipt,
        },
        {
          label: 'Rekapitulasi',
          icon: BarChart3,
        },
        {
          label: 'Pendapatan',
          icon: BarChart3,
        },
      ],
    },
  ]
</script>

{#if open}
  <button
    type="button"
    class="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
    aria-label="Tutup menu"
    onclick={() => onClose?.()}
  ></button>
{/if}

<aside
  class={[
    'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
    open ? 'translate-x-0' : '-translate-x-full',
  ].join(' ')}
>
  <div class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
    <div class="flex min-w-0 items-center gap-3">
      <div
        class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white"
      >
        SP
      </div>

      <div class="min-w-0">
        <p class="truncate text-sm font-bold text-slate-900">
          E-Pembayaran SPP
        </p>
        <p class="text-xs text-slate-500">
          Administrasi Madrasah
        </p>
      </div>
    </div>

    <button
      type="button"
      class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
      aria-label="Tutup sidebar"
      onclick={() => onClose?.()}
    >
      <X size={20} />
    </button>
  </div>

  <nav class="flex-1 overflow-y-auto px-3 py-5">
    <div class="space-y-1">
      {#each mainNavigation as item}
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-left text-sm font-medium text-emerald-700"
          onclick={() => onClose?.()}
        >
          <item.icon size={19} strokeWidth={1.8} />
          <span>{item.label}</span>
        </button>
      {/each}
    </div>

    {#each navigationGroups as group}
      <div class="mt-7">
        <p class="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {group.label}
        </p>

        <div class="space-y-1">
          {#each group.items as item}
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              onclick={() => onClose?.()}
            >
              <item.icon size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </nav>

  <div class="border-t border-slate-200 p-3">
    <button
      type="button"
      class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      <Settings size={19} strokeWidth={1.8} />
      <span>Pengaturan</span>
    </button>
  </div>
</aside>
