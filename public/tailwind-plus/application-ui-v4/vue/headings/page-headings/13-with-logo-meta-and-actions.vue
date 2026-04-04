<template>
  <div class="px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto flex items-center justify-between gap-x-8 lg:mx-0">
      <div class="flex items-center gap-x-6">
        <img src="https://tailwindcss.com/plus-assets/img/logos/48x48/tuple.svg" alt="" class="size-16 flex-none rounded-full outline outline-gray-900/10 dark:outline-white/10" />
        <h1>
          <div class="text-sm/6 text-gray-500 dark:text-gray-400">Invoice <span class="text-gray-700 dark:text-gray-300">#00011</span></div>
          <div class="mt-1 text-base font-semibold text-gray-900 dark:text-white">Tuple, Inc</div>
        </h1>
      </div>
      <div class="flex items-center gap-x-4 sm:gap-x-6">
        <button type="button" class="hidden text-sm/6 font-semibold text-gray-900 sm:block dark:text-white">Copy URL</button>
        <a href="#" class="hidden text-sm/6 font-semibold text-gray-900 sm:block dark:text-white">Edit</a>
        <a href="#" class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Send</a>

        <Menu as="div" class="relative sm:hidden">
          <MenuButton class="relative block">
            <span class="absolute -inset-3"></span>
            <span class="sr-only">More</span>
            <EllipsisVerticalIcon class="size-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          </MenuButton>

          <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
            <MenuItems class="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-gray-900/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
              <MenuItem v-slot="{ active }">
                <button type="button" :class="[active ? 'bg-gray-50 outline-hidden dark:bg-white/5' : '', 'block w-full px-3 py-1 text-left text-sm/6 text-gray-900 dark:text-white']">Copy URL</button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <a href="#" :class="[active ? 'bg-gray-50 outline-hidden dark:bg-white/5' : '', 'block px-3 py-1 text-sm/6 text-gray-900 dark:text-white']">Edit</a>
              </MenuItem>
            </MenuItems>
          </transition>
        </Menu>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { EllipsisVerticalIcon } from '@heroicons/vue/20/solid'
</script>