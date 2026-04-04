<template>
  <div class="border-b border-gray-200 dark:border-white/10">
    <div class="sm:flex sm:items-baseline">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">Issues</h3>
      <div class="mt-4 sm:mt-0 sm:ml-10">
        <nav class="-mb-px flex space-x-8">
          <a v-for="tab in tabs" :key="tab.name" :href="tab.href" :class="[tab.current ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-white', 'border-b-2 px-1 pb-4 text-sm font-medium whitespace-nowrap']" :aria-current="tab.current ? 'page' : undefined">{{ tab.name }}</a>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
const tabs = [
  { name: 'Open', href: '#', current: true },
  { name: 'Closed', href: '#', current: false },
]
</script>