<template>
  <label for="location" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Location</label>
  <div class="mt-2 grid grid-cols-1">
    <select id="location" name="location" class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-gray-800 dark:focus-visible:outline-indigo-500">
      <option>United States</option>
      <option selected="">Canada</option>
      <option>Mexico</option>
    </select>
    <ChevronDownIcon class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400" aria-hidden="true" />
  </div>
</template>

<script setup>
import { ChevronDownIcon } from '@heroicons/vue/16/solid'
</script>