<template>
  <div class="rounded-md bg-green-50 p-4 dark:bg-green-500/10 dark:outline dark:outline-green-500/20">
    <div class="flex">
      <div class="shrink-0">
        <CheckCircleIcon class="size-5 text-green-400" aria-hidden="true" />
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-green-800 dark:text-green-200">Order completed</h3>
        <div class="mt-2 text-sm text-green-700 dark:text-green-200/85">
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid pariatur, ipsum similique veniam.</p>
        </div>
        <div class="mt-4">
          <div class="-mx-2 -my-1.5 flex">
            <button type="button" class="rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 dark:bg-transparent dark:text-green-200 dark:hover:bg-white/10 dark:focus-visible:outline-offset-1 dark:focus-visible:outline-green-500/50">View status</button>
            <button type="button" class="ml-3 rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 dark:bg-transparent dark:text-green-200 dark:hover:bg-white/10 dark:focus-visible:outline-offset-1 dark:focus-visible:outline-green-500/50">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CheckCircleIcon } from '@heroicons/vue/20/solid'
</script>