<template>
  <div class="px-4 py-5 sm:px-6">
    <div class="flex space-x-3">
      <div class="shrink-0">
        <img class="size-10 rounded-full bg-gray-50 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10" src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-gray-900 dark:text-white">
          <a href="#" class="hover:underline">Chelsea Hagon</a>
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <a href="#" class="hover:underline">December 9 at 11:43 AM</a>
        </p>
      </div>
      <div class="flex shrink-0 self-center">
        <Menu as="div" class="relative inline-block text-left">
          <MenuButton class="relative flex items-center rounded-full text-gray-400 outline-offset-6 hover:text-gray-600 dark:hover:text-white">
            <span class="absolute -inset-2"></span>
            <span class="sr-only">Open options</span>
            <EllipsisVerticalIcon class="size-5" aria-hidden="true" />
          </MenuButton>

          <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
            <MenuItems class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg outline-1 outline-black/5 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10">
              <div class="py-1">
                <MenuItem v-slot="{ active }">
                  <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-200', 'flex px-4 py-2 text-sm']">
                    <StarIcon class="mr-3 size-5 text-gray-400" aria-hidden="true" />
                    <span>Add to favorites</span>
                  </a>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-200', 'flex px-4 py-2 text-sm']">
                    <CodeBracketIcon class="mr-3 size-5 text-gray-400" aria-hidden="true" />
                    <span>Embed</span>
                  </a>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-200', 'flex px-4 py-2 text-sm']">
                    <FlagIcon class="mr-3 size-5 text-gray-400" aria-hidden="true" />
                    <span>Report content</span>
                  </a>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { CodeBracketIcon, EllipsisVerticalIcon, FlagIcon, StarIcon } from '@heroicons/vue/20/solid'
</script>