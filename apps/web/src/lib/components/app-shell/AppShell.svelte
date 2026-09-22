<script lang="ts">
  import Header from './Header.svelte'
  import Sidebar from './Sidebar.svelte'

  let {
    children,
  }: {
    children: import('svelte').Snippet
  } = $props()

  let sidebarOpen = $state(false)
</script>

<div class="min-h-screen bg-slate-50">
  <div class="flex min-h-screen">
    <Sidebar
      open={sidebarOpen}
      onClose={() => {
        sidebarOpen = false
      }}
    />

    <div class="flex min-w-0 flex-1 flex-col">
      <Header
        onMenuClick={() => {
          sidebarOpen = true
        }}
      />

      <main class="min-w-0 flex-1 overflow-x-hidden">
        <div class="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {@render children()}
        </div>
      </main>
    </div>
  </div>
</div>
