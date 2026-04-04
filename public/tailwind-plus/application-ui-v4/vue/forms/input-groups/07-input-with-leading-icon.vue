<template>
  <div>
    <label for="email" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Email</label>
    <div class="mt-2 grid grid-cols-1">
      <input type="email" name="email" id="email" class="col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:pl-9 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" placeholder="you@example.com" />
      <EnvelopeIcon class="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400 sm:size-4 dark:text-gray-500" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup>
import { EnvelopeIcon } from '@heroicons/vue/16/solid'
</script>