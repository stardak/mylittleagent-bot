<template>
  <Popover class="relative">
    <PopoverButton class="inline-flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900 dark:text-white">
      <span>Solutions</span>
      <ChevronDownIcon class="size-5" aria-hidden="true" />
    </PopoverButton>

    <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-1" enter-to-class="translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="translate-y-0" leave-to-class="opacity-0 translate-y-1">
      <PopoverPanel class="absolute left-1/2 z-10 mt-5 flex w-screen max-w-max -translate-x-1/2 bg-transparent px-4">
        <div class="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm/6 shadow-lg outline-1 outline-gray-900/5 lg:max-w-3xl dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          <div class="grid grid-cols-1 gap-x-6 gap-y-1 p-4 lg:grid-cols-2">
            <div v-for="item in solutions" :key="item.name" class="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-white/5">
              <div class="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white dark:bg-gray-700/50 dark:group-hover:bg-gray-700">
                <component :is="item.icon" class="size-6 text-gray-600 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-white" aria-hidden="true" />
              </div>
              <div>
                <a :href="item.href" class="font-semibold text-gray-900 dark:text-white">
                  {{ item.name }}
                  <span class="absolute inset-0"></span>
                </a>
                <p class="mt-1 text-gray-600 dark:text-gray-400">{{ item.description }}</p>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-8 py-6 dark:bg-gray-700/50">
            <div class="flex items-center gap-x-3">
              <h3 class="text-sm/6 font-semibold text-gray-900 dark:text-white">Enterprise</h3>
              <p class="rounded-full bg-indigo-600/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">New</p>
            </div>
            <p class="mt-2 text-sm/6 text-gray-600 dark:text-gray-400">Empower your entire team with even more advanced tools.</p>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup>
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
import {
  ArrowPathIcon,
  ChartPieIcon,
  CursorArrowRaysIcon,
  DocumentChartBarIcon,
  FingerPrintIcon,
  SquaresPlusIcon,
} from '@heroicons/vue/24/outline'

const solutions = [
  { name: 'Analytics', description: 'Get a better understanding of your traffic', href: '#', icon: ChartPieIcon },
  {
    name: 'Integrations',
    description: 'Connect with third-party tools and find out expectations',
    href: '#',
    icon: SquaresPlusIcon,
  },
  {
    name: 'Engagement',
    description: 'Speak directly to your customers with our engagement tool',
    href: '#',
    icon: CursorArrowRaysIcon,
  },
  { name: 'Automations', description: 'Build strategic funnels that will convert', href: '#', icon: ArrowPathIcon },
  { name: 'Security', description: "Your customers' data will be safe and secure", href: '#', icon: FingerPrintIcon },
  {
    name: 'Reports',
    description: 'Edit, manage and create newly informed decisions',
    href: '#',
    icon: DocumentChartBarIcon,
  },
]
</script>