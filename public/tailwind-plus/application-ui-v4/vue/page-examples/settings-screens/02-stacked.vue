<template>
  <header class="absolute inset-x-0 top-0 z-50 flex h-16 border-b border-gray-900/10 dark:border-white/10 dark:bg-black/10">
    <div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex flex-1 items-center gap-x-6">
        <button type="button" class="-m-3 p-3 md:hidden" @click="mobileMenuOpen = true">
          <span class="sr-only">Open main menu</span>
          <Bars3Icon class="size-5 text-gray-900 dark:text-white" aria-hidden="true" />
        </button>
        <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" />
        <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company" />
      </div>
      <nav class="hidden md:flex md:gap-x-11 md:text-sm/6 md:font-semibold md:text-gray-700 dark:md:text-gray-300">
        <a v-for="(item, itemIdx) in navigation" :key="itemIdx" :href="item.href">{{ item.name }}</a>
      </nav>
      <div class="flex flex-1 items-center justify-end gap-x-8">
        <button type="button" class="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-white">
          <span class="sr-only">View notifications</span>
          <BellIcon class="size-6" aria-hidden="true" />
        </button>
        <a href="#" class="-m-1.5 p-1.5">
          <span class="sr-only">Your profile</span>
          <img class="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
        </a>
      </div>
    </div>
    <Dialog class="lg:hidden" @close="mobileMenuOpen = false" :open="mobileMenuOpen">
      <div class="fixed inset-0 z-50"></div>
      <DialogPanel class="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-4 pb-6 sm:max-w-sm sm:px-6 sm:ring-1 sm:ring-gray-900/10 dark:bg-gray-900 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10 dark:sm:ring-white/10">
        <div class="relative -ml-0.5 flex h-16 items-center gap-x-6">
          <button type="button" class="-m-2.5 p-2.5 text-gray-700 dark:text-gray-400" @click="mobileMenuOpen = false">
            <span class="sr-only">Close menu</span>
            <XMarkIcon class="size-6" aria-hidden="true" />
          </button>
          <div class="-ml-0.5">
            <a href="#" class="-m-1.5 block p-1.5">
              <span class="sr-only">Your Company</span>
              <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="" />
              <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="" />
            </a>
          </div>
        </div>
        <div class="mt-2 space-y-2">
          <a v-for="item in navigation" :key="item.name" :href="item.href" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5">{{ item.name }}</a>
        </div>
      </DialogPanel>
    </Dialog>
  </header>

  <div class="mx-auto max-w-7xl pt-16 lg:flex lg:gap-x-16 lg:px-8">
    <h1 class="sr-only">General Settings</h1>

    <aside class="flex overflow-x-auto border-b border-gray-900/5 py-4 lg:block lg:w-64 lg:flex-none lg:border-0 lg:py-20 dark:border-white/10">
      <nav class="flex-none px-4 sm:px-6 lg:px-0">
        <ul role="list" class="flex gap-x-3 gap-y-1 whitespace-nowrap lg:flex-col">
          <li v-for="item in secondaryNavigation" :key="item.name">
            <a :href="item.href" :class="[item.current ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white', 'group flex gap-x-3 rounded-md py-2 pr-3 pl-2 text-sm/6 font-semibold']">
              <component :is="item.icon" :class="[item.current ? 'text-indigo-600 dark:text-white' : 'text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-white', 'size-6 shrink-0']" aria-hidden="true" />
              {{ item.name }}
            </a>
          </li>
        </ul>
      </nav>
    </aside>

    <main class="px-4 py-16 sm:px-6 lg:flex-auto lg:px-0 lg:py-20">
      <div class="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
        <div>
          <h2 class="text-base/7 font-semibold text-gray-900 dark:text-white">Profile</h2>
          <p class="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">This information will be displayed publicly so be careful what you share.</p>

          <dl class="mt-6 divide-y divide-gray-100 border-t border-gray-200 text-sm/6 dark:divide-white/5 dark:border-white/5">
            <div class="py-6 sm:flex">
              <dt class="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6 dark:text-white">Full name</dt>
              <dd class="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                <div class="text-gray-900 dark:text-gray-300">Tom Cook</div>
                <button type="button" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Update</button>
              </dd>
            </div>
            <div class="py-6 sm:flex">
              <dt class="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6 dark:text-white">Email address</dt>
              <dd class="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                <div class="text-gray-900 dark:text-gray-300">tom.cook@example.com</div>
                <button type="button" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Update</button>
              </dd>
            </div>
            <div class="py-6 sm:flex">
              <dt class="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6 dark:text-white">Title</dt>
              <dd class="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                <div class="text-gray-900 dark:text-gray-300">Human Resources Manager</div>
                <button type="button" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Update</button>
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 class="text-base/7 font-semibold text-gray-900 dark:text-white">Bank accounts</h2>
          <p class="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">Connect bank accounts to your account.</p>

          <ul role="list" class="mt-6 divide-y divide-gray-100 border-t border-gray-200 text-sm/6 dark:divide-white/5 dark:border-white/5">
            <li class="flex justify-between gap-x-6 py-6">
              <div class="font-medium text-gray-900 dark:text-white">TD Canada Trust</div>
              <button type="button" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Update</button>
            </li>
            <li class="flex justify-between gap-x-6 py-6">
              <div class="font-medium text-gray-900 dark:text-white">Royal Bank of Canada</div>
              <button type="button" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Update</button>
            </li>
          </ul>

          <div class="flex border-t border-gray-100 pt-6 dark:border-white/5">
            <button type="button" class="text-sm/6 font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"><span aria-hidden="true">+</span> Add another bank</button>
          </div>
        </div>

        <div>
          <h2 class="text-base/7 font-semibold text-gray-900 dark:text-white">Integrations</h2>
          <p class="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">Connect applications to your account.</p>

          <ul role="list" class="mt-6 divide-y divide-gray-100 border-t border-gray-200 text-sm/6 dark:divide-white/5 dark:border-white/5">
            <li class="flex justify-between gap-x-6 py-6">
              <div class="font-medium text-gray-900 dark:text-white">QuickBooks</div>
              <button type="button" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Update</button>
            </li>
          </ul>

          <div class="flex border-t border-gray-100 pt-6 dark:border-white/5">
            <button type="button" class="text-sm/6 font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"><span aria-hidden="true">+</span> Add another application</button>
          </div>
        </div>

        <div>
          <h2 class="text-base/7 font-semibold text-gray-900 dark:text-white">Language and dates</h2>
          <p class="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">Choose what language and date format to use throughout your account.</p>

          <dl class="mt-6 divide-y divide-gray-100 border-t border-gray-200 text-sm/6 dark:divide-white/5 dark:border-white/5">
            <div class="py-6 sm:flex">
              <dt class="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6 dark:text-white">Language</dt>
              <dd class="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                <div class="text-gray-900 dark:text-gray-300">English</div>
                <button type="button" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Update</button>
              </dd>
            </div>
            <div class="py-6 sm:flex">
              <dt class="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6 dark:text-white">Date format</dt>
              <dd class="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                <div class="text-gray-900 dark:text-gray-300">DD-MM-YYYY</div>
                <button type="button" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Update</button>
              </dd>
            </div>
            <div class="flex pt-6">
              <dt class="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6 dark:text-white">Automatic timezone</dt>
              <dd class="flex flex-auto items-center justify-end">
                <div class="group relative inline-flex w-8 shrink-0 rounded-full bg-gray-200 p-px inset-ring inset-ring-gray-900/5 outline-offset-2 outline-indigo-600 transition-colors duration-200 ease-in-out has-checked:bg-indigo-600 has-focus-visible:outline-2 dark:bg-white/5 dark:inset-ring-white/10 dark:outline-indigo-500 dark:has-checked:bg-indigo-500">
                  <span class="size-4 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-3.5"></span>
                  <input type="checkbox" class="absolute inset-0 size-full appearance-none focus:outline-hidden" aria-label="Automatic timezone" name="automatic-timezone" checked="" />
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Dialog, DialogPanel } from '@headlessui/vue'
import { Bars3Icon } from '@heroicons/vue/20/solid'
import {
  BellIcon,
  CreditCardIcon,
  CubeIcon,
  FingerPrintIcon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const navigation = [
  { name: 'Home', href: '#' },
  { name: 'Invoices', href: '#' },
  { name: 'Clients', href: '#' },
  { name: 'Expenses', href: '#' },
]
const secondaryNavigation = [
  { name: 'General', href: '#', icon: UserCircleIcon, current: true },
  { name: 'Security', href: '#', icon: FingerPrintIcon, current: false },
  { name: 'Notifications', href: '#', icon: BellIcon, current: false },
  { name: 'Plan', href: '#', icon: CubeIcon, current: false },
  { name: 'Billing', href: '#', icon: CreditCardIcon, current: false },
  { name: 'Team members', href: '#', icon: UsersIcon, current: false },
]

const mobileMenuOpen = ref(false)
</script>