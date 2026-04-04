<template>
  <nav class="flex items-center justify-center" aria-label="Progress">
    <p class="text-sm font-medium text-gray-900 dark:text-white">Step {{ steps.findIndex((step) => step.status === 'current') + 1 }} of {{ steps.length }}</p>
    <ol role="list" class="ml-8 flex items-center space-x-5">
      <li v-for="step in steps" :key="step.name">
        <a v-if="step.status === 'complete'" :href="step.href" class="block size-2.5 rounded-full bg-indigo-600 hover:bg-indigo-900 dark:bg-indigo-500 dark:hover:bg-indigo-400">
          <span class="sr-only">{{ step.name }}</span>
        </a>
        <a v-else-if="step.status === 'current'" :href="step.href" class="relative flex items-center justify-center" aria-current="step">
          <span class="absolute flex size-5 p-px" aria-hidden="true">
            <span class="size-full rounded-full bg-indigo-200 dark:bg-indigo-900"></span>
          </span>
          <span class="relative block size-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500" aria-hidden="true"></span>
          <span class="sr-only">{{ step.name }}</span>
        </a>
        <a v-else :href="step.href" class="block size-2.5 rounded-full bg-gray-200 hover:bg-gray-400 dark:bg-white/15 dark:hover:bg-white/25">
          <span class="sr-only">{{ step.name }}</span>
        </a>
      </li>
    </ol>
  </nav>
</template>

<script setup>
const steps = [
  { name: 'Step 1', href: '#', status: 'complete' },
  { name: 'Step 2', href: '#', status: 'current' },
  { name: 'Step 3', href: '#', status: 'upcoming' },
  { name: 'Step 4', href: '#', status: 'upcoming' },
]
</script>