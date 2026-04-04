<template>
  <div class="relative flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 dark:border-white/10 dark:bg-gray-900 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
    <div class="relative flex h-16 shrink-0 items-center">
      <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" />
      <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company" />
    </div>
    <nav class="relative flex flex-1 flex-col">
      <ul role="list" class="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" class="-mx-2 space-y-1">
            <li v-for="item in navigation" :key="item.name">
              <a v-if="!item.children" :href="item.href" :class="[item.current ? 'bg-gray-50 dark:bg-white/5 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5 dark:hover:text-white', 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 dark:text-gray-400']">
                <component :is="item.icon" class="size-6 shrink-0 text-gray-400 dark:text-current" aria-hidden="true" />
                {{ item.name }}
              </a>
              <Disclosure as="div" v-else v-slot="{ open }">
                <DisclosureButton :class="[item.current ? 'bg-gray-50 dark:bg-white/5 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5 dark:hover:text-white', 'flex w-full items-center gap-x-3 rounded-md p-2 text-left text-sm/6 font-semibold text-gray-700 dark:text-gray-400']">
                  <component :is="item.icon" class="size-6 shrink-0 text-gray-400 dark:text-current" aria-hidden="true" />
                  {{ item.name }}
                  <ChevronRightIcon :class="[open ? 'rotate-90 text-gray-500 dark:text-gray-400' : 'text-gray-400', 'ml-auto size-5 shrink-0']" aria-hidden="true" />
                </DisclosureButton>
                <DisclosurePanel as="ul" class="mt-1 px-2">
                  <li v-for="subItem in item.children" :key="subItem.name">
                    <!-- 44px -->
                    <DisclosureButton as="a" :href="subItem.href" :class="[subItem.current ? 'bg-gray-50 dark:bg-white/5 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5 dark:hover:text-white', 'block rounded-md py-2 pr-2 pl-9 text-sm/6 text-gray-700 dark:text-gray-400']">{{ subItem.name }}</DisclosureButton>
                  </li>
                </DisclosurePanel>
              </Disclosure>
            </li>
          </ul>
        </li>
        <li class="-mx-6 mt-auto">
          <a href="#" class="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5">
            <img class="size-8 rounded-full bg-gray-50 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
            <span class="sr-only">Your profile</span>
            <span aria-hidden="true">Tom Cook</span>
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ChevronRightIcon } from '@heroicons/vue/20/solid'
import {
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline'

const navigation = [
  { name: 'Dashboard', href: '#', icon: HomeIcon, current: true },
  {
    name: 'Teams',
    icon: UsersIcon,
    current: false,
    children: [
      { name: 'Engineering', href: '#' },
      { name: 'Human Resources', href: '#' },
      { name: 'Customer Success', href: '#' },
    ],
  },
  {
    name: 'Projects',
    icon: FolderIcon,
    current: false,
    children: [
      { name: 'GraphQL API', href: '#' },
      { name: 'iOS App', href: '#' },
      { name: 'Android App', href: '#' },
      { name: 'New Customer Portal', href: '#' },
    ],
  },
  { name: 'Calendar', href: '#', icon: CalendarIcon, current: false },
  { name: 'Documents', href: '#', icon: DocumentDuplicateIcon, current: false },
  { name: 'Reports', href: '#', icon: ChartPieIcon, current: false },
]
</script>