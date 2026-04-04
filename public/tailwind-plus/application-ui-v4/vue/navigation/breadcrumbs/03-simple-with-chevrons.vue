<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol role="list" class="flex items-center space-x-4">
      <li>
        <div>
          <a href="#" class="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300">
            <HomeIcon class="size-5 shrink-0" aria-hidden="true" />
            <span class="sr-only">Home</span>
          </a>
        </div>
      </li>
      <li v-for="page in pages" :key="page.name">
        <div class="flex items-center">
          <ChevronRightIcon class="size-5 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <a :href="page.href" class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" :aria-current="page.current ? 'page' : undefined">{{ page.name }}</a>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { ChevronRightIcon, HomeIcon } from '@heroicons/vue/20/solid'

const pages = [
  { name: 'Projects', href: '#', current: false },
  { name: 'Project Nero', href: '#', current: true },
]
</script>