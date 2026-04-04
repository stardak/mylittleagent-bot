<template>
  <!-- When the mobile menu is open, add `overflow-hidden` to the `body` element to prevent double scrollbars -->
  <Popover as="template" v-slot="{ open }">
    <header :class="[open ? 'fixed inset-0 z-40 overflow-y-auto' : '', 'relative bg-white shadow-xs lg:overflow-y-visible dark:bg-gray-800/50 dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:bottom-0 dark:after:h-px dark:after:bg-white/10']">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="relative flex justify-between lg:gap-8 xl:grid xl:grid-cols-12">
          <div class="flex md:absolute md:inset-y-0 md:left-0 lg:static xl:col-span-2">
            <div class="flex shrink-0 items-center">
              <a href="#">
                <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" />
                <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company" />
              </a>
            </div>
          </div>
          <div class="min-w-0 flex-1 md:px-8 lg:px-0 xl:col-span-6">
            <div class="flex items-center px-6 py-3.5 md:mx-auto md:max-w-3xl lg:mx-0 lg:max-w-none xl:px-0">
              <div class="grid w-full grid-cols-1">
                <input name="search" class="col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" placeholder="Search" />
                <MagnifyingGlassIcon class="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div class="flex items-center md:absolute md:inset-y-0 md:right-0 lg:hidden">
            <!-- Mobile menu button -->
            <PopoverButton class="relative -mx-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white dark:focus:outline-indigo-500">
              <span class="absolute -inset-0.5"></span>
              <span class="sr-only">Open menu</span>
              <Bars3Icon v-if="!open" class="block size-6" aria-hidden="true" />
              <XMarkIcon v-else class="block size-6" aria-hidden="true" />
            </PopoverButton>
          </div>
          <div class="hidden lg:flex lg:items-center lg:justify-end xl:col-span-4">
            <button type="button" class="relative ml-5 shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:text-gray-400 dark:hover:text-white dark:focus:outline-indigo-500">
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">View notifications</span>
              <BellIcon class="size-6" aria-hidden="true" />
            </button>

            <!-- Profile dropdown -->
            <Menu as="div" class="relative ml-5 shrink-0">
              <MenuButton class="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500">
                <span class="absolute -inset-1.5"></span>
                <span class="sr-only">Open user menu</span>
                <img class="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" :src="user.imageUrl" alt="" />
              </MenuButton>

              <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
                <MenuItems class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline-1 outline-black/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                  <MenuItem v-for="item in userNavigation" :key="item.name" v-slot="{ active }">
                    <a :href="item.href" :class="[active ? 'bg-gray-100 outline-hidden dark:bg-white/5' : '', 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-300']">{{ item.name }}</a>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>

            <a href="#" class="ml-6 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">New Project</a>
          </div>
        </div>
      </div>

      <PopoverPanel as="nav" class="absolute relative left-1/2 z-10 mt-2 w-full -translate-x-1/2 lg:hidden dark:bg-gray-900 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-gray-800/50" aria-label="Global">
        <div class="relative mx-auto max-w-3xl space-y-1 px-2 pt-2 pb-3 sm:px-4">
          <a v-for="item in navigation" :key="item.name" :href="item.href" :aria-current="item.current ? 'page' : undefined" :class="[item.current ? 'bg-gray-100 text-gray-900 dark:bg-white/5 dark:text-white' : 'text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white', 'block rounded-md px-3 py-2 text-base font-medium']">{{ item.name }}</a>
        </div>
        <div class="relative border-t border-gray-200 pt-4 pb-3 dark:border-white/10">
          <div class="mx-auto flex max-w-3xl items-center px-4 sm:px-6">
            <div class="shrink-0">
              <img class="size-10 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" :src="user.imageUrl" alt="" />
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-gray-800 dark:text-white">{{ user.name }}</div>
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ user.email }}</div>
            </div>
            <button type="button" class="relative ml-auto shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:text-gray-400 dark:hover:text-white dark:focus:outline-indigo-500">
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">View notifications</span>
              <BellIcon class="size-6" aria-hidden="true" />
            </button>
          </div>
          <div class="mx-auto mt-3 max-w-3xl space-y-1 px-2 sm:px-4">
            <a v-for="item in userNavigation" :key="item.name" :href="item.href" class="block rounded-md px-3 py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white">{{ item.name }}</a>
          </div>
        </div>
      </PopoverPanel>
    </header>
  </Popover>
</template>

<script setup>
import { Menu, MenuButton, MenuItem, MenuItems, Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/20/solid'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const user = {
  name: 'Chelsea Hagon',
  email: 'chelsea.hagon@example.com',
  imageUrl:
    'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
}
const navigation = [
  { name: 'Dashboard', href: '#', current: true },
  { name: 'Calendar', href: '#', current: false },
  { name: 'Teams', href: '#', current: false },
  { name: 'Directory', href: '#', current: false },
]
const userNavigation = [
  { name: 'Your profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]
</script>