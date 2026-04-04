<template>
  <ul role="list" class="space-y-3">
    <li v-for="item in items" :key="item.id" class="overflow-hidden rounded-md bg-white px-6 py-4 shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
      <!-- Your content -->
    </li>
  </ul>
</template>

<script setup>
const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
</script>