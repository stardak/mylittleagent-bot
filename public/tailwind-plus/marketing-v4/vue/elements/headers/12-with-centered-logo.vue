<template>
  <header class="bg-white dark:bg-gray-900">
    <nav class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
      <div class="flex flex-1">
        <div class="hidden lg:flex lg:gap-x-12">
          <a v-for="item in navigation" :key="item.name" :href="item.href" class="text-sm/6 font-semibold text-gray-900 dark:text-white">{{ item.name }}</a>
        </div>
        <div class="flex lg:hidden">
          <button type="button" class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-400 dark:hover:text-white" @click="mobileMenuOpen = true">
            <span class="sr-only">Open main menu</span>
            <Bars3Icon class="size-6" aria-hidden="true" />
          </button>
        </div>
      </div>
      <a href="#" class="-m-1.5 p-1.5">
        <span class="sr-only">Your Company</span>
        <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="" />
        <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="" />
      </a>
      <div class="flex flex-1 justify-end">
        <a href="#" class="text-sm/6 font-semibold text-gray-900 dark:text-white">Log in <span aria-hidden="true">&rarr;</span></a>
      </div>
    </nav>
    <Dialog class="lg:hidden" @close="mobileMenuOpen = false" :open="mobileMenuOpen">
      <div class="fixed inset-0 z-10"></div>
      <DialogPanel class="fixed inset-y-0 left-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div class="flex flex-1">
            <button type="button" class="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-400 dark:hover:text-white" @click="mobileMenuOpen = false">
              <span class="sr-only">Close menu</span>
              <XMarkIcon class="size-6" aria-hidden="true" />
            </button>
          </div>
          <a href="#" class="-m-1.5 p-1.5">
            <span class="sr-only">Your Company</span>
            <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="" />
            <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="" />
          </a>
          <div class="flex flex-1 justify-end">
            <a href="#" class="text-sm/6 font-semibold text-gray-900 dark:text-white">Log in <span aria-hidden="true">&rarr;</span></a>
          </div>
        </div>
        <div class="mt-6 space-y-2">
          <a v-for="item in navigation" :key="item.name" :href="item.href" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5">{{ item.name }}</a>
        </div>
      </DialogPanel>
    </Dialog>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { Dialog, DialogPanel } from '@headlessui/vue'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'

const navigation = [
  { name: 'Product', href: '#' },
  { name: 'Features', href: '#' },
  { name: 'Company', href: '#' },
]

const mobileMenuOpen = ref(false)
</script>