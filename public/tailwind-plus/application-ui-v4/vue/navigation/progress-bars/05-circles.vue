<template>
  <nav aria-label="Progress">
    <ol role="list" class="flex items-center">
      <li v-for="(step, stepIdx) in steps" :key="step.name" :class="[stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '', 'relative']">
        <template v-if="step.status === 'complete'">
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div class="h-0.5 w-full bg-indigo-600 dark:bg-indigo-500"></div>
          </div>
          <a href="#" class="relative flex size-8 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-900 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            <CheckIcon class="size-5 text-white" aria-hidden="true" />
            <span class="sr-only">{{ step.name }}</span>
          </a>
        </template>
        <template v-else-if="step.status === 'current'">
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div class="h-0.5 w-full bg-gray-200 dark:bg-white/15"></div>
          </div>
          <a href="#" class="relative flex size-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white dark:border-indigo-500 dark:bg-gray-900" aria-current="step">
            <span class="size-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500" aria-hidden="true"></span>
            <span class="sr-only">{{ step.name }}</span>
          </a>
        </template>
        <template v-else>
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div class="h-0.5 w-full bg-gray-200 dark:bg-white/15"></div>
          </div>
          <a href="#" class="group relative flex size-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400 dark:border-white/15 dark:bg-gray-900 dark:hover:border-white/25">
            <span class="size-2.5 rounded-full bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-white/15" aria-hidden="true"></span>
            <span class="sr-only">{{ step.name }}</span>
          </a>
        </template>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { CheckIcon } from '@heroicons/vue/20/solid'

const steps = [
  { name: 'Step 1', href: '#', status: 'complete' },
  { name: 'Step 2', href: '#', status: 'complete' },
  { name: 'Step 3', href: '#', status: 'current' },
  { name: 'Step 4', href: '#', status: 'upcoming' },
  { name: 'Step 5', href: '#', status: 'upcoming' },
]
</script>