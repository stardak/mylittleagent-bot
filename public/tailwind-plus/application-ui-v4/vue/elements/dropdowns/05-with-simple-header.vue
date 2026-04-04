<template>
  <Menu as="div" class="relative inline-block">
    <MenuButton class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20">
      Options
      <ChevronDownIcon class="-mr-1 size-5 text-gray-400" aria-hidden="true" />
    </MenuButton>

    <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
      <MenuItems class="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg outline-1 outline-black/5 dark:divide-white/10 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <div class="px-4 py-3">
          <p class="text-sm text-gray-700 dark:text-gray-400">Signed in as</p>
          <p class="truncate text-sm font-medium text-gray-900 dark:text-white">tom@example.com</p>
        </div>
        <div class="py-1">
          <MenuItem v-slot="{ active }">
            <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Account settings</a>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Support</a>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">License</a>
          </MenuItem>
        </div>
        <div class="py-1">
          <form method="POST" action="#">
            <MenuItem v-slot="{ active }">
              <button type="submit" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block w-full px-4 py-2 text-left text-sm']">Sign out</button>
            </MenuItem>
          </form>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'
</script>