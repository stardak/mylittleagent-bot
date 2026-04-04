<template>
  <div>
    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Last 30 days</h3>
    <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
      <div v-for="item in stats" :key="item.name" class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm sm:p-6 dark:bg-gray-800/75 dark:inset-ring dark:inset-ring-white/10">
        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{{ item.name }}</dt>
        <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{{ item.stat }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup>
const stats = [
  { name: 'Total Subscribers', stat: '71,897' },
  { name: 'Avg. Open Rate', stat: '58.16%' },
  { name: 'Avg. Click Rate', stat: '24.57%' },
]
</script>