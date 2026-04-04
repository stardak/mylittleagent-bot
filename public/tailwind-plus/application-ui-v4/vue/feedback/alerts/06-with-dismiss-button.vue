<template>
  <div class="rounded-md bg-green-50 p-4 dark:bg-green-500/10 dark:outline dark:outline-green-500/20">
    <div class="flex">
      <div class="shrink-0">
        <CheckCircleIcon class="size-5 text-green-400" aria-hidden="true" />
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium text-green-800 dark:text-green-300">Successfully uploaded</p>
      </div>
      <div class="ml-auto pl-3">
        <div class="-mx-1.5 -my-1.5">
          <button type="button" class="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-green-50 focus-visible:outline-hidden dark:bg-transparent dark:text-green-400 dark:hover:bg-green-500/10 dark:focus-visible:ring-green-500 dark:focus-visible:ring-offset-1 dark:focus-visible:ring-offset-green-900">
            <span class="sr-only">Dismiss</span>
            <XMarkIcon class="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CheckCircleIcon, XMarkIcon } from '@heroicons/vue/20/solid'
</script>