<template>
  <Popover class="relative isolate z-50 shadow-sm">
    <div class="bg-white py-5 dark:bg-gray-900">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <PopoverButton class="inline-flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900 dark:text-white">
          Solutions
          <ChevronDownIcon class="size-5" aria-hidden="true" />
        </PopoverButton>
      </div>
    </div>

    <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 -translate-y-1" enter-to-class="translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="translate-y-0" leave-to-class="opacity-0 -translate-y-1">
      <PopoverPanel class="absolute inset-x-0 top-16 bg-white dark:bg-gray-900">
        <!-- Presentational element used to render the bottom shadow, if we put the shadow on the actual panel it pokes out the top, so we use this shorter element to hide the top of the shadow -->
        <div class="absolute inset-0 top-1/2 bg-white shadow-lg ring-1 ring-gray-900/5 dark:bg-gray-900 dark:shadow-none dark:ring-white/15" aria-hidden="true"></div>
        <div class="relative bg-white dark:bg-gray-900">
          <div class="mx-auto grid max-w-7xl grid-cols-4 gap-x-4 px-6 py-10 lg:px-8 xl:gap-x-8">
            <div v-for="item in solutions" :key="item.name" class="group relative rounded-lg p-6 text-sm/6 hover:bg-gray-50 dark:hover:bg-white/5">
              <div class="flex size-11 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white dark:bg-gray-700/50 dark:group-hover:bg-gray-700">
                <component :is="item.icon" class="size-6 text-gray-600 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-white" aria-hidden="true" />
              </div>
              <a :href="item.href" class="mt-6 block font-semibold text-gray-900 dark:text-white">
                {{ item.name }}
                <span class="absolute inset-0"></span>
              </a>
              <p class="mt-1 text-gray-600 dark:text-gray-400">{{ item.description }}</p>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800/50">
            <div class="mx-auto max-w-7xl px-6 lg:px-8">
              <div class="grid grid-cols-3 divide-x divide-gray-900/5 border-x border-gray-900/5 dark:divide-white/5 dark:border-white/10">
                <a v-for="item in callsToAction" :key="item.name" :href="item.href" class="flex items-center justify-center gap-x-2.5 p-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800">
                  <component :is="item.icon" class="size-5 flex-none text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  {{ item.name }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup>
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { ChevronDownIcon, PhoneIcon, PlayCircleIcon, RectangleGroupIcon } from '@heroicons/vue/20/solid'
import { ChartPieIcon, CursorArrowRaysIcon, FingerPrintIcon, SquaresPlusIcon } from '@heroicons/vue/24/outline'

const solutions = [
  {
    name: 'Analytics',
    description: 'Get a better understanding of where your traffic is coming from',
    href: '#',
    icon: ChartPieIcon,
  },
  {
    name: 'Engagement',
    description: 'Speak directly to your customers with our engagement tool',
    href: '#',
    icon: CursorArrowRaysIcon,
  },
  { name: 'Security', description: "Your customers' data will be safe and secure", href: '#', icon: FingerPrintIcon },
  {
    name: 'Integrations',
    description: "Connect with third-party tools that you're already using",
    href: '#',
    icon: SquaresPlusIcon,
  },
]
const callsToAction = [
  { name: 'Watch demo', href: '#', icon: PlayCircleIcon },
  { name: 'Contact sales', href: '#', icon: PhoneIcon },
  { name: 'View all products', href: '#', icon: RectangleGroupIcon },
]
</script>