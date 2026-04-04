<template>
  <div class="border-b border-gray-200 pb-5 sm:pb-0 dark:border-white/10">
    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Candidates</h3>
    <div class="mt-3 sm:mt-4">
      <div class="grid grid-cols-1 sm:hidden">
        <!-- Use an "onChange" listener to redirect the user to the selected tab URL. -->
        <select aria-label="Select a tab" class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-gray-800 dark:focus:outline-white">
          <option v-for="tab in tabs" :key="tab.name" :selected="tab.current">{{ tab.name }}</option>
        </select>
        <ChevronDownIcon class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500 dark:fill-gray-400" aria-hidden="true" />
      </div>
      <div class="hidden sm:block">
        <nav class="-mb-px flex space-x-8">
          <a v-for="tab in tabs" :key="tab.name" :href="tab.href" :class="[tab.current ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-white', 'border-b-2 px-1 pb-4 text-sm font-medium whitespace-nowrap']" :aria-current="tab.current ? 'page' : undefined">{{ tab.name }}</a>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ChevronDownIcon } from '@heroicons/vue/16/solid'

const tabs = [
  { name: 'Applied', href: '#', current: false },
  { name: 'Phone Screening', href: '#', current: false },
  { name: 'Interview', href: '#', current: true },
  { name: 'Offer', href: '#', current: false },
  { name: 'Hired', href: '#', current: false },
]
</script>