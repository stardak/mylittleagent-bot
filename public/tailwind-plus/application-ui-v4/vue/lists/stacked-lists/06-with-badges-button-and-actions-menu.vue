<template>
  <ul role="list" class="divide-y divide-gray-100 dark:divide-white/5">
    <li v-for="project in projects" :key="project.id" class="flex items-center justify-between gap-x-6 py-5">
      <div class="min-w-0">
        <div class="flex items-start gap-x-3">
          <p class="text-sm/6 font-semibold text-gray-900 dark:text-white">{{ project.name }}</p>
          <p v-if="project.status === 'In progress'" class="mt-0.5 rounded-md bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600 inset-ring inset-ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:inset-ring-gray-400/20">{{ project.status }}</p>
          <p v-if="project.status === 'Complete'" class="mt-0.5 rounded-md bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 inset-ring inset-ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:inset-ring-green-500/20">{{ project.status }}</p>
          <p v-if="project.status === 'Archived'" class="mt-0.5 rounded-md bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-800 inset-ring inset-ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:inset-ring-yellow-400/20">{{ project.status }}</p>
        </div>
        <div class="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500 dark:text-gray-400">
          <p class="whitespace-nowrap">
            Due on <time :datetime="project.dueDateTime">{{ project.dueDate }}</time>
          </p>
          <svg viewBox="0 0 2 2" class="size-0.5 fill-current">
            <circle cx="1" cy="1" r="1" />
          </svg>
          <p class="truncate">Created by {{ project.createdBy }}</p>
        </div>
      </div>
      <div class="flex flex-none items-center gap-x-4">
        <a :href="project.href" class="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 sm:block dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
          >View project<span class="sr-only">, {{ project.name }}</span></a
        >
        <Menu as="div" class="relative flex-none">
          <MenuButton class="relative block text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <span class="absolute -inset-2.5"></span>
            <span class="sr-only">Open options</span>
            <EllipsisVerticalIcon class="size-5" aria-hidden="true" />
          </MenuButton>
          <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
            <MenuItems class="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-gray-900/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
              <MenuItem v-slot="{ active }">
                <a href="#" :class="[active ? 'bg-gray-50 outline-hidden dark:bg-white/5' : '', 'block px-3 py-1 text-sm/6 text-gray-900 dark:text-white']"
                  >Edit<span class="sr-only">, {{ project.name }}</span></a
                >
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <a href="#" :class="[active ? 'bg-gray-50 outline-hidden dark:bg-white/5' : '', 'block px-3 py-1 text-sm/6 text-gray-900 dark:text-white']"
                  >Move<span class="sr-only">, {{ project.name }}</span></a
                >
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <a href="#" :class="[active ? 'bg-gray-50 outline-hidden dark:bg-white/5' : '', 'block px-3 py-1 text-sm/6 text-gray-900 dark:text-white']"
                  >Delete<span class="sr-only">, {{ project.name }}</span></a
                >
              </MenuItem>
            </MenuItems>
          </transition>
        </Menu>
      </div>
    </li>
  </ul>
</template>

<script setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { EllipsisVerticalIcon } from '@heroicons/vue/20/solid'

const projects = [
  {
    id: 1,
    name: 'GraphQL API',
    href: '#',
    status: 'Complete',
    createdBy: 'Leslie Alexander',
    dueDate: 'March 17, 2023',
    dueDateTime: '2023-03-17T00:00Z',
  },
  {
    id: 2,
    name: 'New benefits plan',
    href: '#',
    status: 'In progress',
    createdBy: 'Leslie Alexander',
    dueDate: 'May 5, 2023',
    dueDateTime: '2023-05-05T00:00Z',
  },
  {
    id: 3,
    name: 'Onboarding emails',
    href: '#',
    status: 'In progress',
    createdBy: 'Courtney Henry',
    dueDate: 'May 25, 2023',
    dueDateTime: '2023-05-25T00:00Z',
  },
  {
    id: 4,
    name: 'iOS app',
    href: '#',
    status: 'In progress',
    createdBy: 'Leonard Krasner',
    dueDate: 'June 7, 2023',
    dueDateTime: '2023-06-07T00:00Z',
  },
  {
    id: 5,
    name: 'Marketing site redesign',
    href: '#',
    status: 'Archived',
    createdBy: 'Courtney Henry',
    dueDate: 'June 10, 2023',
    dueDateTime: '2023-06-10T00:00Z',
  },
]
</script>