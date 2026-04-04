<template>
  <div class="border-b border-gray-200 px-4 py-5 sm:px-6 dark:border-white/10">
    <div class="-mt-4 -ml-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
      <div class="mt-4 ml-4">
        <div class="flex items-center">
          <div class="shrink-0">
            <img class="size-12 rounded-full bg-gray-50 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
          </div>
          <div class="ml-4">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Tom Cook</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              <a href="#">@tom_cook</a>
            </p>
          </div>
        </div>
      </div>
      <div class="mt-4 ml-4 flex shrink-0">
        <button type="button" class="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20">
          <PhoneIcon class="mr-1.5 -ml-0.5 size-5 text-gray-400" aria-hidden="true" />
          <span>Phone</span>
        </button>
        <button type="button" class="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20">
          <EnvelopeIcon class="mr-1.5 -ml-0.5 size-5 text-gray-400" aria-hidden="true" />
          <span>Email</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { EnvelopeIcon, PhoneIcon } from '@heroicons/vue/20/solid'
</script>