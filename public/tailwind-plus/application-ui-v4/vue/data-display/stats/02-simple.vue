<template>
  <div class="bg-white dark:bg-gray-900">
    <div class="mx-auto max-w-7xl">
      <div class="grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-4 dark:bg-white/10">
        <div v-for="stat in stats" :key="stat.name" class="bg-white px-4 py-6 sm:px-6 lg:px-8 dark:bg-gray-900">
          <p class="text-sm/6 font-medium text-gray-500 dark:text-gray-400">{{ stat.name }}</p>
          <p class="mt-2 flex items-baseline gap-x-2">
            <span class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">{{ stat.value }}</span>
            <span v-if="stat.unit" class="text-sm text-gray-500 dark:text-gray-400">{{ stat.unit }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const stats = [
  { name: 'Number of deploys', value: '405' },
  { name: 'Average deploy time', value: '3.65', unit: 'mins' },
  { name: 'Number of servers', value: '3' },
  { name: 'Success rate', value: '98.5%' },
]
</script>