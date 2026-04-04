<template>
  <div class="overflow-hidden rounded-md border border-gray-300 bg-white dark:border-white/10 dark:bg-gray-900">
    <ul role="list" class="divide-y divide-gray-300 dark:divide-white/10">
      <li v-for="item in items" :key="item.id" class="px-6 py-4">
        <!-- Your content -->
      </li>
    </ul>
  </div>
</template>

<script setup>
const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
</script>