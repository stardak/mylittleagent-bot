<template>
  <div class="overflow-hidden bg-white shadow-sm sm:rounded-md dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
    <ul role="list" class="divide-y divide-gray-200 dark:divide-white/10">
      <li v-for="item in items" :key="item.id" class="px-4 py-4 sm:px-6">
        <!-- Your content -->
      </li>
    </ul>
  </div>
</template>

<script setup>
const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
</script>