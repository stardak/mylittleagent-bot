<template>
  <div class="border-b border-gray-200 pb-5 dark:border-white/10">
    <div class="sm:flex sm:items-baseline sm:justify-between">
      <div class="sm:w-0 sm:flex-1">
        <h1 id="message-heading" class="text-base font-semibold text-gray-900 dark:text-white">Full-Stack Developer</h1>
        <p class="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">Checkout and Payments Team</p>
      </div>

      <div class="mt-4 flex items-center justify-between sm:mt-0 sm:ml-6 sm:shrink-0 sm:justify-start">
        <span class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 inset-ring inset-ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:inset-ring-green-500/10">Open</span>
        <div class="-my-2 ml-3 inline-block text-left">
          <Menu as="div" class="relative">
            <MenuButton class="flex items-center rounded-full p-2 text-gray-400 hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:text-gray-300">
              <span class="sr-only">Open options</span>
              <EllipsisVerticalIcon class="size-5" aria-hidden="true" />
            </MenuButton>

            <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
              <MenuItems class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg outline-1 outline-black/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                <div class="py-1">
                  <MenuItem v-slot="{ active }">
                    <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'flex justify-between px-4 py-2 text-sm']">
                      <span>Edit</span>
                    </a>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'flex justify-between px-4 py-2 text-sm']">
                      <span>Duplicate</span>
                    </a>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button type="button" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'flex w-full justify-between px-4 py-2 text-sm']">
                      <span>Archive</span>
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { EllipsisVerticalIcon } from '@heroicons/vue/20/solid'
</script>