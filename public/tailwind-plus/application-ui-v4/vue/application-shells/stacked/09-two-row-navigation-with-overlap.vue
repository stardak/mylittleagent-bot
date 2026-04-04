<template>
  <!--
    This example requires updating your template:

    ```
    <html class="h-full bg-gray-100 dark:bg-gray-900">
    <body class="h-full">
    ```
  -->
  <div class="min-h-full">
    <header class="bg-indigo-600 pb-24 dark:bg-indigo-800">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <div class="relative flex items-center justify-center py-5 lg:justify-between">
          <!-- Logo -->
          <div class="absolute left-0 shrink-0 lg:static">
            <a href="#">
              <span class="sr-only">Your Company</span>
              <img class="h-8 w-auto" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=300" alt="Your Company" />
            </a>
          </div>

          <!-- Right section on desktop -->
          <div class="hidden lg:ml-4 lg:flex lg:items-center lg:pr-0.5">
            <button type="button" class="relative shrink-0 rounded-full p-1 text-indigo-200 hover:text-white focus:outline-2 focus:outline-white">
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">View notifications</span>
              <BellIcon class="size-6" aria-hidden="true" />
            </button>

            <!-- Profile dropdown -->
            <Menu as="div" class="relative ml-4 shrink-0">
              <MenuButton class="relative flex max-w-xs items-center rounded-full bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <span class="absolute -inset-1.5"></span>
                <span class="sr-only">Open user menu</span>
                <img class="size-8 rounded-full outline -outline-offset-1 outline-white/10" :src="user.imageUrl" alt="" />
              </MenuButton>

              <transition leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
                <MenuItems class="absolute right-0 z-10 mt-2 -mr-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline outline-black/5 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10">
                  <MenuItem v-for="item in userNavigation" :key="item.name" v-slot="{ active }">
                    <a :href="item.href" :class="[active ? 'bg-gray-100 outline-hidden dark:bg-white/5' : '', 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-300']">{{ item.name }}</a>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>
          </div>

          <!-- Search -->
          <div class="min-w-0 flex-1 px-12 lg:hidden">
            <div class="mx-auto grid w-full max-w-xs grid-cols-1">
              <input name="search" aria-label="Search" class="col-start-1 row-start-1 block w-full rounded-md bg-indigo-500/75 py-1.5 pr-3 pl-10 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-white/75 focus:outline-2 focus:-outline-offset-2 focus:outline-white sm:text-sm/6 dark:bg-indigo-700/50 dark:outline-indigo-400/25 dark:placeholder:text-white/50" placeholder="Search" />
              <MagnifyingGlassIcon class="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-white/75 dark:text-white/50" aria-hidden="true" />
            </div>
          </div>

          <!-- Menu button -->
          <div class="absolute right-0 shrink-0 lg:hidden">
            <!-- Mobile menu button -->
            <button class="relative inline-flex items-center justify-center rounded-md bg-transparent p-2 text-indigo-200 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-white" @click="open = true">
              <span class="absolute -inset-0.5"></span>
              <span class="sr-only">Open main menu</span>
              <Bars3Icon class="size-6" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div class="hidden border-t border-white/20 py-5 lg:block dark:border-white/10">
          <div class="grid grid-cols-3 items-center gap-8">
            <div class="col-span-2">
              <nav class="flex space-x-4">
                <a v-for="item in navigation" :key="item.name" :href="item.href" :class="[item.current ? 'text-white' : 'text-indigo-100', 'rounded-md px-3 py-2 text-sm font-medium hover:bg-indigo-500/75 dark:hover:bg-indigo-700/75']" :aria-current="item.current ? 'page' : undefined">{{ item.name }}</a>
              </nav>
            </div>
            <div class="mx-auto grid w-full max-w-md grid-cols-1">
              <input name="search" aria-label="Search" class="col-start-1 row-start-1 block w-full rounded-md bg-indigo-500/75 py-1.5 pr-3 pl-10 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-white/75 focus:outline-2 focus:-outline-offset-2 focus:outline-white sm:text-sm/6 dark:bg-indigo-700/50 dark:outline-indigo-400/25 dark:placeholder:text-white/50" placeholder="Search" />
              <MagnifyingGlassIcon class="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-white/75 dark:text-white/50" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <TransitionRoot as="template" :show="open">
        <Dialog class="lg:hidden" @close="open = false">
          <TransitionChild as="template" enter="duration-150 ease-out" enter-from="opacity-0" enter-to="" leave="duration-150 ease-in" leave-from="" leave-to="opacity-0">
            <div class="fixed inset-0 z-20 bg-black/25"></div>
          </TransitionChild>

          <TransitionChild as="template" enter="duration-150 ease-out" enter-from="opacity-0 scale-95" enter-to=" scale-100" leave="duration-150 ease-in" leave-from=" scale-100" leave-to="opacity-0 scale-95">
            <DialogPanel class="absolute inset-x-0 top-0 z-30 mx-auto w-full max-w-3xl origin-top transform p-2 transition">
              <div class="divide-y divide-gray-200 rounded-lg bg-white shadow-lg outline outline-black/5 dark:divide-white/10 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                <div class="pt-3 pb-2">
                  <div class="flex items-center justify-between px-4">
                    <div>
                      <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" />
                      <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company" />
                    </div>
                    <div class="-mr-2">
                      <button class="relative inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-white dark:bg-gray-800 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-white" @click="open = false">
                        <span class="absolute -inset-0.5"></span>
                        <span class="sr-only">Close menu</span>
                        <XMarkIcon class="size-6" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div class="mt-3 space-y-1 px-2">
                    <a href="#" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-100 dark:hover:bg-white/5 dark:hover:text-white">Home</a>
                    <a href="#" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-100 dark:hover:bg-white/5 dark:hover:text-white">Profile</a>
                    <a href="#" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-100 dark:hover:bg-white/5 dark:hover:text-white">Resources</a>
                    <a href="#" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-100 dark:hover:bg-white/5 dark:hover:text-white">Company Directory</a>
                    <a href="#" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-100 dark:hover:bg-white/5 dark:hover:text-white">Openings</a>
                  </div>
                </div>
                <div class="pt-4 pb-2">
                  <div class="flex items-center px-5">
                    <div class="shrink-0">
                      <img class="size-10 rounded-full outline -outline-offset-1 outline-black/5 dark:outline-white/10" :src="user.imageUrl" alt="" />
                    </div>
                    <div class="ml-3 min-w-0 flex-1">
                      <div class="truncate text-base font-medium text-gray-800 dark:text-gray-200">{{ user.name }}</div>
                      <div class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{{ user.email }}</div>
                    </div>
                    <button type="button" class="relative ml-auto shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500 dark:text-gray-400 dark:hover:text-white dark:focus:outline-white">
                      <span class="absolute -inset-1.5"></span>
                      <span class="sr-only">View notifications</span>
                      <BellIcon class="size-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div class="mt-3 space-y-1 px-2">
                    <a v-for="item in userNavigation" :key="item.name" :href="item.href" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-100 dark:hover:bg-white/5 dark:hover:text-white">{{ item.name }}</a>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </TransitionRoot>
    </header>
    <main class="-mt-24 pb-8">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 class="sr-only">Page title</h1>
        <!-- Main 3 column grid -->
        <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
          <!-- Left column -->
          <div class="grid grid-cols-1 gap-4 lg:col-span-2">
            <section aria-labelledby="section-1-title">
              <h2 class="sr-only" id="section-1-title">Section title</h2>
              <div class="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
                <div class="p-6">
                  <!-- Your content -->
                </div>
              </div>
            </section>
          </div>

          <!-- Right column -->
          <div class="grid grid-cols-1 gap-4">
            <section aria-labelledby="section-2-title">
              <h2 class="sr-only" id="section-2-title">Section title</h2>
              <div class="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:shadow-none dark:inset-ring dark:inset-ring-white/10">
                <div class="p-6">
                  <!-- Your content -->
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
    <footer>
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <div class="border-t border-gray-200 py-8 text-center text-sm text-gray-500 sm:text-left dark:border-gray-700 dark:text-gray-400"><span class="block sm:inline">&copy; 2021 Your Company, Inc.</span> <span class="block sm:inline">All rights reserved.</span></div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  Dialog,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/vue/20/solid'

const user = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
}
const navigation = [
  { name: 'Home', href: '#', current: true },
  { name: 'Profile', href: '#', current: false },
  { name: 'Resources', href: '#', current: false },
  { name: 'Company Directory', href: '#', current: false },
  { name: 'Openings', href: '#', current: false },
]
const userNavigation = [
  { name: 'Your profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]

const open = ref(false)
</script>