<script lang="ts">
  import { AppShell } from '$lib/components/app-shell'
</script>

<svelte:head>
  <title>E-Pembayaran SPP</title>
  <meta
    name="description"
    content="Sistem administrasi pembayaran siswa"
  />
</svelte:head>

<AppShell>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Selamat datang di E-Pembayaran SPP
      </h1>

      <p class="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
        Sistem administrasi pembayaran siswa untuk mengelola akademik,
        tagihan, transaksi, dan laporan.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Total Siswa</p>
        <p class="mt-2 text-2xl font-bold text-slate-900">0</p>
        <p class="mt-1 text-xs text-slate-500">Data belum tersedia</p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Tagihan Aktif</p>
        <p class="mt-2 text-2xl font-bold text-slate-900">0</p>
        <p class="mt-1 text-xs text-slate-500">Data belum tersedia</p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Tunggakan</p>
        <p class="mt-2 text-2xl font-bold text-slate-900">Rp0</p>
        <p class="mt-1 text-xs text-slate-500">Data belum tersedia</p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Pendapatan</p>
        <p class="mt-2 text-2xl font-bold text-slate-900">Rp0</p>
        <p class="mt-1 text-xs text-slate-500">Data belum tersedia</p>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-900">
        App Shell aktif
      </h2>

      <p class="mt-2 text-sm leading-6 text-slate-500">
        Sidebar, header, responsive navigation, dan area konten utama
        sudah tersedia sebagai fondasi UI aplikasi.
      </p>
    </div>
  </section>
</AppShell>
