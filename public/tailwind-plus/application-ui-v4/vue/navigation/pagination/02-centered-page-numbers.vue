<template>
  <nav class="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 dark:border-white/10">
    <div class="-mt-px flex w-0 flex-1">
      <a href="#" class="inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200">
        <ArrowLongLeftIcon class="mr-3 size-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
        Previous
      </a>
    </div>
    <div class="hidden md:-mt-px md:flex">
      <a href="#" class="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200">1</a>
      <!-- Current: "border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400", Default: "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20" -->
      <a href="#" class="inline-flex items-center border-t-2 border-indigo-500 px-4 pt-4 text-sm font-medium text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" aria-current="page">2</a>
      <a href="#" class="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200">3</a>
      <span class="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500">...</span>
      <a href="#" class="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200">8</a>
      <a href="#" class="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200">9</a>
      <a href="#" class="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200">10</a>
    </div>
    <div class="-mt-px flex w-0 flex-1 justify-end">
      <a href="#" class="inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200">
        Next
        <ArrowLongRightIcon class="ml-3 size-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      </a>
    </div>
  </nav>
</template>

<script setup>
import { ArrowLongLeftIcon, ArrowLongRightIcon } from '@heroicons/vue/20/solid'
</script>