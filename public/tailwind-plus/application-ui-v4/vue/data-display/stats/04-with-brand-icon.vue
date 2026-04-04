<template>
  <div>
    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Last 30 days</h3>

    <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="item in stats" :key="item.id" class="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow-sm sm:px-6 sm:pt-6 dark:bg-gray-800/75 dark:inset-ring dark:inset-ring-white/10">
        <dt>
          <div class="absolute rounded-md bg-indigo-500 p-3">
            <component :is="item.icon" class="size-6 text-white" aria-hidden="true" />
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">{{ item.name }}</p>
        </dt>
        <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ item.stat }}</p>
          <p :class="[item.changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400', 'ml-2 flex items-baseline text-sm font-semibold']">
            <ArrowUpIcon v-if="item.changeType === 'increase'" class="size-5 shrink-0 self-center text-green-500 dark:text-green-400" aria-hidden="true" />
            <ArrowDownIcon v-else class="size-5 shrink-0 self-center text-red-500 dark:text-red-400" aria-hidden="true" />
            <span class="sr-only"> {{ item.changeType === 'increase' ? 'Increased' : 'Decreased' }} by </span>
            {{ item.change }}
          </p>
          <div class="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6 dark:bg-gray-700/20">
            <div class="text-sm">
              <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >View all<span class="sr-only"> {{ item.name }} stats</span></a
              >
            </div>
          </div>
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup>
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/vue/20/solid'
import { CursorArrowRaysIcon, EnvelopeOpenIcon, UsersIcon } from '@heroicons/vue/24/outline'

const stats = [
  { id: 1, name: 'Total Subscribers', stat: '71,897', icon: UsersIcon, change: '122', changeType: 'increase' },
  { id: 2, name: 'Avg. Open Rate', stat: '58.16%', icon: EnvelopeOpenIcon, change: '5.4%', changeType: 'increase' },
  { id: 3, name: 'Avg. Click Rate', stat: '24.57%', icon: CursorArrowRaysIcon, change: '3.2%', changeType: 'decrease' },
]
</script>