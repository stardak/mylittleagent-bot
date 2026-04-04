<template>
  <div>
    <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400">Pinned Projects</h2>
    <ul role="list" class="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      <li v-for="project in projects" :key="project.name" class="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
        <div :class="[project.bgColor, 'flex w-16 shrink-0 items-center justify-center rounded-l-md text-sm font-medium text-white']">{{ project.initials }}</div>
        <div class="flex flex-1 items-center justify-between truncate rounded-r-md border-t border-r border-b border-gray-200 bg-white dark:border-white/10 dark:bg-gray-800/50">
          <div class="flex-1 truncate px-4 py-2 text-sm">
            <a :href="project.href" class="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-200">{{ project.name }}</a>
            <p class="text-gray-500 dark:text-gray-400">{{ project.members }} Members</p>
          </div>
          <div class="shrink-0 pr-2">
            <button type="button" class="inline-flex size-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:hover:text-white dark:focus:outline-white">
              <span class="sr-only">Open options</span>
              <EllipsisVerticalIcon class="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { EllipsisVerticalIcon } from '@heroicons/vue/20/solid'

const projects = [
  { name: 'Graph API', initials: 'GA', href: '#', members: 16, bgColor: 'bg-pink-600 dark:bg-pink-700' },
  { name: 'Component Design', initials: 'CD', href: '#', members: 12, bgColor: 'bg-purple-600 dark:bg-purple-700' },
  { name: 'Templates', initials: 'T', href: '#', members: 16, bgColor: 'bg-yellow-500 dark:bg-yellow-600' },
  { name: 'React Components', initials: 'RC', href: '#', members: 8, bgColor: 'bg-green-500 dark:bg-green-600' },
]
</script>