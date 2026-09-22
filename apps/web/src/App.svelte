<script lang="ts">
  const projectName = 'E-Pembayaran SPP'
</script>

<svelte:head>
  <title>{projectName}</title>
  <meta
    name="description"
    content="Sistem pembayaran SPP madrasah"
  />
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <div>
        <h1 class="text-xl font-bold text-slate-900">
          {projectName}
        </h1>
        <p class="text-sm text-slate-500">
          Sistem administrasi pembayaran siswa
        </p>
      </div>

      <div class="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        Foundation
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-2xl font-semibold text-slate-900">
        UI Foundation
      </h2>

      <p class="mt-2 max-w-2xl text-slate-600">
        Tailwind CSS berhasil menjadi fondasi UI aplikasi.
        Halaman ini sementara digunakan untuk validasi setup.
      </p>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-lg border border-slate-200 p-4">
          <p class="text-sm font-medium text-slate-500">Frontend</p>
          <p class="mt-1 text-lg font-semibold text-slate-900">
            Svelte + TypeScript
          </p>
        </div>

        <div class="rounded-lg border border-slate-200 p-4">
          <p class="text-sm font-medium text-slate-500">Styling</p>
          <p class="mt-1 text-lg font-semibold text-slate-900">
            Tailwind CSS v4
          </p>
        </div>

        <div class="rounded-lg border border-slate-200 p-4">
          <p class="text-sm font-medium text-slate-500">Build Tool</p>
          <p class="mt-1 text-lg font-semibold text-slate-900">
            Vite
          </p>
        </div>
      </div>

      <div class="mt-6">
        <button
          type="button"
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Tailwind aktif
        </button>
      </div>
    </div>
  </main>
</div>
