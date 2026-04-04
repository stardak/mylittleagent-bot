<template>
  <ul role="list" class="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8">
    <li v-for="client in clients" :key="client.id" class="overflow-hidden rounded-xl outline outline-gray-200 dark:-outline-offset-1 dark:outline-white/10">
      <div class="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6 dark:border-white/10 dark:bg-gray-800/50">
        <img :src="client.imageUrl" :alt="client.name" class="size-12 flex-none rounded-lg bg-white object-cover ring-1 ring-gray-900/10 dark:bg-gray-700 dark:ring-white/10" />
        <div class="text-sm/6 font-medium text-gray-900 dark:text-white">{{ client.name }}</div>
        <Menu as="div" class="relative ml-auto">
          <MenuButton class="relative block text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-white">
            <span class="absolute -inset-2.5"></span>
            <span class="sr-only">Open options</span>
            <EllipsisHorizontalIcon class="size-5" aria-hidden="true" />
          </MenuButton>
          <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
            <MenuItems class="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-gray-900/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
              <MenuItem v-slot="{ active }">
                <a href="#" :class="[active ? 'bg-gray-50 outline-hidden dark:bg-white/5' : '', 'block px-3 py-1 text-sm/6 text-gray-900 dark:text-white']"
                  >View<span class="sr-only">, {{ client.name }}</span></a
                >
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <a href="#" :class="[active ? 'bg-gray-50 outline-hidden dark:bg-white/5' : '', 'block px-3 py-1 text-sm/6 text-gray-900 dark:text-white']"
                  >Edit<span class="sr-only">, {{ client.name }}</span></a
                >
              </MenuItem>
            </MenuItems>
          </transition>
        </Menu>
      </div>
      <dl class="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm/6 dark:divide-white/10">
        <div class="flex justify-between gap-x-4 py-3">
          <dt class="text-gray-500 dark:text-gray-400">Last invoice</dt>
          <dd class="text-gray-700 dark:text-gray-300">
            <time :datetime="client.lastInvoice.dateTime">{{ client.lastInvoice.date }}</time>
          </dd>
        </div>
        <div class="flex justify-between gap-x-4 py-3">
          <dt class="text-gray-500 dark:text-gray-400">Amount</dt>
          <dd class="flex items-start gap-x-2">
            <div class="font-medium text-gray-900 dark:text-white">{{ client.lastInvoice.amount }}</div>
            <div v-if="client.lastInvoice.status == 'Paid'" class="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset dark:bg-green-500/10 dark:text-green-500 dark:ring-green-500/10">{{ client.lastInvoice.status }}</div>
            <div v-if="client.lastInvoice.status == 'Withdraw'" class="rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset dark:bg-white/5 dark:text-gray-400 dark:ring-white/10">{{ client.lastInvoice.status }}</div>
            <div v-if="client.lastInvoice.status == 'Overdue'" class="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10 ring-inset dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/10">{{ client.lastInvoice.status }}</div>
          </dd>
        </div>
      </dl>
    </li>
  </ul>
</template>

<script setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { EllipsisHorizontalIcon } from '@heroicons/vue/20/solid'

const clients = [
  {
    id: 1,
    name: 'Tuple',
    imageUrl: 'https://tailwindcss.com/plus-assets/img/logos/48x48/tuple.svg',
    lastInvoice: { date: 'December 13, 2022', dateTime: '2022-12-13', amount: '$2,000.00', status: 'Overdue' },
  },
  {
    id: 2,
    name: 'SavvyCal',
    imageUrl: 'https://tailwindcss.com/plus-assets/img/logos/48x48/savvycal.svg',
    lastInvoice: { date: 'January 22, 2023', dateTime: '2023-01-22', amount: '$14,000.00', status: 'Paid' },
  },
  {
    id: 3,
    name: 'Reform',
    imageUrl: 'https://tailwindcss.com/plus-assets/img/logos/48x48/reform.svg',
    lastInvoice: { date: 'January 23, 2023', dateTime: '2023-01-23', amount: '$7,600.00', status: 'Paid' },
  },
]
</script>