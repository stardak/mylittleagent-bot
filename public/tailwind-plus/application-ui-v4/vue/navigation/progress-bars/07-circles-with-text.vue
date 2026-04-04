<template>
  <nav aria-label="Progress">
    <ol role="list" class="overflow-hidden">
      <li v-for="(step, stepIdx) in steps" :key="step.name" :class="[stepIdx !== steps.length - 1 ? 'pb-10' : '', 'relative']">
        <template v-if="step.status === 'complete'">
          <div v-if="stepIdx !== steps.length - 1" class="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-indigo-600 dark:bg-indigo-500" aria-hidden="true"></div>
          <a :href="step.href" class="group relative flex items-start">
            <span class="flex h-9 items-center">
              <span class="relative z-10 flex size-8 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800 dark:bg-indigo-500 dark:group-hover:bg-indigo-600">
                <CheckIcon class="size-5 text-white" aria-hidden="true" />
              </span>
            </span>
            <span class="ml-4 flex min-w-0 flex-col">
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ step.name }}</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ step.description }}</span>
            </span>
          </a>
        </template>
        <template v-else-if="step.status === 'current'">
          <div v-if="stepIdx !== steps.length - 1" class="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-gray-300 dark:bg-gray-700" aria-hidden="true"></div>
          <a :href="step.href" class="group relative flex items-start" aria-current="step">
            <span class="flex h-9 items-center" aria-hidden="true">
              <span class="relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white dark:border-indigo-500 dark:bg-gray-900">
                <span class="size-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500"></span>
              </span>
            </span>
            <span class="ml-4 flex min-w-0 flex-col">
              <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">{{ step.name }}</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ step.description }}</span>
            </span>
          </a>
        </template>
        <template v-else>
          <div v-if="stepIdx !== steps.length - 1" class="absolute top-4 left-4 mt-0.5 -ml-px h-full w-0.5 bg-gray-300 dark:bg-white/15" aria-hidden="true"></div>
          <a :href="step.href" class="group relative flex items-start">
            <span class="flex h-9 items-center" aria-hidden="true">
              <span class="relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400 dark:border-white/15 dark:bg-gray-900 dark:group-hover:border-white/25">
                <span class="size-2.5 rounded-full bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-white/15"></span>
              </span>
            </span>
            <span class="ml-4 flex min-w-0 flex-col">
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ step.name }}</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ step.description }}</span>
            </span>
          </a>
        </template>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { CheckIcon } from '@heroicons/vue/20/solid'

const steps = [
  { name: 'Create account', description: 'Vitae sed mi luctus laoreet.', href: '#', status: 'complete' },
  {
    name: 'Profile information',
    description: 'Cursus semper viverra facilisis et et some more.',
    href: '#',
    status: 'current',
  },
  { name: 'Business information', description: 'Penatibus eu quis ante.', href: '#', status: 'upcoming' },
  { name: 'Theme', description: 'Faucibus nec enim leo et.', href: '#', status: 'upcoming' },
  { name: 'Preview', description: 'Iusto et officia maiores porro ad non quas.', href: '#', status: 'upcoming' },
]
</script>