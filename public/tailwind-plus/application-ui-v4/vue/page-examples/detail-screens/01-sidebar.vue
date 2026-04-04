<template>
  <!--
    This example requires updating your template:

    ```
    <html class="h-full bg-white dark:bg-gray-900">
    <body class="h-full">
    ```
  -->
  <div>
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog class="relative z-50 xl:hidden" @close="sidebarOpen = false">
        <TransitionChild as="template" enter="transition-opacity ease-linear duration-300" enter-from="opacity-0" enter-to="" leave="transition-opacity ease-linear duration-300" leave-from="" leave-to="opacity-0">
          <div class="fixed inset-0 bg-gray-900/80"></div>
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild as="template" enter="transition ease-in-out duration-300 transform" enter-from="-translate-x-full" enter-to="translate-x-0" leave="transition ease-in-out duration-300 transform" leave-from="translate-x-0" leave-to="-translate-x-full">
            <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
              <TransitionChild as="template" enter="ease-in-out duration-300" enter-from="opacity-0" enter-to="" leave="ease-in-out duration-300" leave-from="" leave-to="opacity-0">
                <div class="absolute top-0 left-full flex w-16 justify-center pt-5">
                  <button type="button" class="-m-2.5 p-2.5" @click="sidebarOpen = false">
                    <span class="sr-only">Close sidebar</span>
                    <XMarkIcon class="size-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </TransitionChild>

              <!-- Sidebar component, swap this element with another sidebar if you like -->
              <div class="relative flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 px-6 dark:bg-gray-900 dark:ring dark:ring-white/10 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
                <div class="relative flex h-16 shrink-0 items-center">
                  <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" />
                  <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company" />
                </div>
                <nav class="relative flex flex-1 flex-col">
                  <ul role="list" class="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" class="-mx-2 space-y-1">
                        <li v-for="item in navigation" :key="item.name">
                          <a :href="item.href" :class="[item.current ? 'bg-gray-100 text-indigo-600 dark:bg-white/5 dark:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white', 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold']">
                            <component :is="item.icon" :class="[item.current ? 'text-indigo-600 dark:text-white' : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white', 'size-6 shrink-0']" aria-hidden="true" />
                            {{ item.name }}
                          </a>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <div class="text-xs/6 font-semibold text-gray-400">Your teams</div>
                      <ul role="list" class="-mx-2 mt-2 space-y-1">
                        <li v-for="team in teams" :key="team.name">
                          <a :href="team.href" :class="[team.current ? 'bg-gray-100 text-indigo-600 dark:bg-white/5 dark:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white', 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold']">
                            <span :class="[team.current ? 'border-indigo-600 text-indigo-600 dark:border-white/20 dark:text-white' : 'border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:group-hover:border-white/20 dark:group-hover:text-white', 'flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium dark:bg-white/5']">{{ team.initial }}</span>
                            <span class="truncate">{{ team.name }}</span>
                          </a>
                        </li>
                      </ul>
                    </li>
                    <li class="-mx-6 mt-auto">
                      <a href="#" class="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-white/5">
                        <img class="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                        <span class="sr-only">Your profile</span>
                        <span aria-hidden="true">Tom Cook</span>
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Static sidebar for desktop -->
    <div class="hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col dark:bg-gray-900">
      <!-- Sidebar component, swap this element with another sidebar if you like -->
      <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 px-6 ring-1 ring-gray-200 dark:bg-black/10 dark:ring-white/5">
        <div class="flex h-16 shrink-0 items-center">
          <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" />
          <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company" />
        </div>
        <nav class="flex flex-1 flex-col">
          <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" class="-mx-2 space-y-1">
                <li v-for="item in navigation" :key="item.name">
                  <a :href="item.href" :class="[item.current ? 'bg-gray-100 text-indigo-600 dark:bg-white/5 dark:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white', 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold']">
                    <component :is="item.icon" :class="[item.current ? 'text-indigo-600 dark:text-white' : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white', 'size-6 shrink-0']" aria-hidden="true" />
                    {{ item.name }}
                  </a>
                </li>
              </ul>
            </li>
            <li>
              <div class="text-xs/6 font-semibold text-gray-500 dark:text-gray-400">Your teams</div>
              <ul role="list" class="-mx-2 mt-2 space-y-1">
                <li v-for="team in teams" :key="team.name">
                  <a :href="team.href" :class="[team.current ? 'bg-gray-100 text-indigo-600 dark:bg-white/5 dark:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white', 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold']">
                    <span :class="[team.current ? 'border-indigo-600 text-indigo-600 dark:border-white/20 dark:text-white' : 'border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:group-hover:border-white/20 dark:group-hover:text-white', 'flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium dark:bg-white/5']">{{ team.initial }}</span>
                    <span class="truncate">{{ team.name }}</span>
                  </a>
                </li>
              </ul>
            </li>
            <li class="-mx-6 mt-auto">
              <a href="#" class="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-white/5">
                <img class="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                <span class="sr-only">Your profile</span>
                <span aria-hidden="true">Tom Cook</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <div class="xl:pl-72">
      <!-- Sticky search header -->
      <div class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-gray-200 bg-white px-4 shadow-xs sm:px-6 lg:px-8 dark:border-white/5 dark:bg-gray-900 dark:shadow-none">
        <button type="button" class="-m-2.5 p-2.5 text-gray-900 xl:hidden dark:text-white" @click="sidebarOpen = true">
          <span class="sr-only">Open sidebar</span>
          <Bars3Icon class="size-5" aria-hidden="true" />
        </button>

        <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <form class="grid flex-1 grid-cols-1" action="#" method="GET">
            <input name="search" aria-label="Search" class="col-start-1 row-start-1 block size-full bg-transparent pl-8 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm/6 dark:text-white dark:placeholder:text-gray-500" placeholder="Search" />
            <MagnifyingGlassIcon class="pointer-events-none col-start-1 row-start-1 size-5 self-center text-gray-400 dark:text-gray-500" aria-hidden="true" />
          </form>
        </div>
      </div>

      <main>
        <header>
          <!-- Secondary navigation -->
          <nav class="flex overflow-x-auto border-b border-gray-200 py-4 dark:border-white/10">
            <ul role="list" class="flex min-w-full flex-none gap-x-6 px-4 text-sm/6 font-semibold text-gray-500 sm:px-6 lg:px-8 dark:text-gray-400">
              <li v-for="item in secondaryNavigation" :key="item.name">
                <a :href="item.href" :class="item.current ? 'text-indigo-600 dark:text-indigo-400' : ''">{{ item.name }}</a>
              </li>
            </ul>
          </nav>

          <!-- Heading -->
          <div class="flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8 dark:bg-gray-700/10">
            <div>
              <div class="flex items-center gap-x-3">
                <div class="flex-none rounded-full bg-green-500/10 p-1 text-green-500 dark:bg-green-400/10 dark:text-green-400">
                  <div class="size-2 rounded-full bg-current"></div>
                </div>
                <h1 class="flex gap-x-3 text-base/7">
                  <span class="font-semibold text-gray-900 dark:text-white">Planetaria</span>
                  <span class="text-gray-400 dark:text-gray-600">/</span>
                  <span class="font-semibold text-gray-900 dark:text-white">mobile-api</span>
                </h1>
              </div>
              <p class="mt-2 text-xs/6 text-gray-500 dark:text-gray-400">Deploys from GitHub via main branch</p>
            </div>
            <div class="order-first flex-none rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-500 ring-1 ring-indigo-200 ring-inset sm:order-0 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30">Production</div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-1 bg-gray-50 sm:grid-cols-2 lg:grid-cols-4 dark:bg-gray-700/10">
            <div v-for="(stat, statIdx) in stats" :key="stat.name" :class="[statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '', 'border-t border-gray-200/50 px-4 py-6 sm:px-6 lg:px-8 dark:border-white/5']">
              <p class="text-sm/6 font-medium text-gray-500 dark:text-gray-400">{{ stat.name }}</p>
              <p class="mt-2 flex items-baseline gap-x-2">
                <span class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">{{ stat.value }}</span>
                <span v-if="stat.unit" class="text-sm text-gray-500 dark:text-gray-400">{{ stat.unit }}</span>
              </p>
            </div>
          </div>
        </header>

        <!-- Activity list -->
        <div class="border-t border-gray-200 pt-11 dark:border-white/10">
          <h2 class="px-4 text-base/7 font-semibold text-gray-900 sm:px-6 lg:px-8 dark:text-white">Latest activity</h2>
          <table class="mt-6 w-full text-left whitespace-nowrap">
            <colgroup>
              <col class="w-full sm:w-4/12" />
              <col class="lg:w-4/12" />
              <col class="lg:w-2/12" />
              <col class="lg:w-1/12" />
              <col class="lg:w-1/12" />
            </colgroup>
            <thead class="border-b border-gray-200 text-sm/6 text-gray-900 dark:border-white/10 dark:text-white">
              <tr>
                <th scope="col" class="py-2 pr-8 pl-4 font-semibold sm:pl-6 lg:pl-8">User</th>
                <th scope="col" class="hidden py-2 pr-8 pl-0 font-semibold sm:table-cell">Commit</th>
                <th scope="col" class="py-2 pr-4 pl-0 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20">Status</th>
                <th scope="col" class="hidden py-2 pr-8 pl-0 font-semibold md:table-cell lg:pr-20">Duration</th>
                <th scope="col" class="hidden py-2 pr-4 pl-0 text-right font-semibold sm:table-cell sm:pr-6 lg:pr-8">Deployed at</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-white/5">
              <tr v-for="item in activityItems" :key="item.commit">
                <td class="py-4 pr-8 pl-4 sm:pl-6 lg:pl-8">
                  <div class="flex items-center gap-x-4">
                    <img :src="item.user.imageUrl" alt="" class="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" />
                    <div class="truncate text-sm/6 font-medium text-gray-900 dark:text-white">{{ item.user.name }}</div>
                  </div>
                </td>
                <td class="hidden py-4 pr-4 pl-0 sm:table-cell sm:pr-8">
                  <div class="flex gap-x-3">
                    <div class="font-mono text-sm/6 text-gray-500 dark:text-gray-400">{{ item.commit }}</div>
                    <span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-300 ring-inset dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20">{{ item.branch }}</span>
                  </div>
                </td>
                <td class="py-4 pr-4 pl-0 text-sm/6 sm:pr-8 lg:pr-20">
                  <div class="flex items-center justify-end gap-x-2 sm:justify-start">
                    <time class="text-gray-500 sm:hidden dark:text-gray-400" :datetime="item.dateTime">{{ item.date }}</time>
                    <div :class="[statuses[item.status], 'flex-none rounded-full p-1']">
                      <div class="size-1.5 rounded-full bg-current"></div>
                    </div>
                    <div class="hidden text-gray-900 sm:block dark:text-white">{{ item.status }}</div>
                  </div>
                </td>
                <td class="hidden py-4 pr-8 pl-0 text-sm/6 text-gray-500 md:table-cell lg:pr-20 dark:text-gray-400">{{ item.duration }}</td>
                <td class="hidden py-4 pr-4 pl-0 text-right text-sm/6 text-gray-500 sm:table-cell sm:pr-6 lg:pr-8 dark:text-gray-400">
                  <time :datetime="item.dateTime">{{ item.date }}</time>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import {
  ChartBarSquareIcon,
  Cog6ToothIcon,
  FolderIcon,
  GlobeAltIcon,
  ServerIcon,
  SignalIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/vue/20/solid'

const navigation = [
  { name: 'Projects', href: '#', icon: FolderIcon, current: false },
  { name: 'Deployments', href: '#', icon: ServerIcon, current: true },
  { name: 'Activity', href: '#', icon: SignalIcon, current: false },
  { name: 'Domains', href: '#', icon: GlobeAltIcon, current: false },
  { name: 'Usage', href: '#', icon: ChartBarSquareIcon, current: false },
  { name: 'Settings', href: '#', icon: Cog6ToothIcon, current: false },
]
const teams = [
  { id: 1, name: 'Planetaria', href: '#', initial: 'P', current: false },
  { id: 2, name: 'Protocol', href: '#', initial: 'P', current: false },
  { id: 3, name: 'Tailwind Labs', href: '#', initial: 'T', current: false },
]
const secondaryNavigation = [
  { name: 'Overview', href: '#', current: true },
  { name: 'Activity', href: '#', current: false },
  { name: 'Settings', href: '#', current: false },
  { name: 'Collaborators', href: '#', current: false },
  { name: 'Notifications', href: '#', current: false },
]
const stats = [
  { name: 'Number of deploys', value: '405' },
  { name: 'Average deploy time', value: '3.65', unit: 'mins' },
  { name: 'Number of servers', value: '3' },
  { name: 'Success rate', value: '98.5%' },
]
const statuses = {
  Completed: 'text-green-500 bg-green-500/10 dark:text-green-400 dark:bg-green-400/10',
  Error: 'text-rose-500 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-400/10',
}
const activityItems = [
  {
    user: {
      name: 'Michael Foster',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    commit: '2d89f0c8',
    branch: 'main',
    status: 'Completed',
    duration: '25s',
    date: '45 minutes ago',
    dateTime: '2023-01-23T11:00',
  },
  {
    user: {
      name: 'Lindsay Walton',
      imageUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    commit: '249df660',
    branch: 'main',
    status: 'Completed',
    duration: '1m 32s',
    date: '3 hours ago',
    dateTime: '2023-01-23T09:00',
  },
  {
    user: {
      name: 'Courtney Henry',
      imageUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    commit: '11464223',
    branch: 'main',
    status: 'Error',
    duration: '1m 4s',
    date: '12 hours ago',
    dateTime: '2023-01-23T00:00',
  },
  {
    user: {
      name: 'Courtney Henry',
      imageUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    commit: 'dad28e95',
    branch: 'main',
    status: 'Completed',
    duration: '2m 15s',
    date: '2 days ago',
    dateTime: '2023-01-21T13:00',
  },
  {
    user: {
      name: 'Michael Foster',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    commit: '624bc94c',
    branch: 'main',
    status: 'Completed',
    duration: '1m 12s',
    date: '5 days ago',
    dateTime: '2023-01-18T12:34',
  },
  {
    user: {
      name: 'Courtney Henry',
      imageUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    commit: 'e111f80e',
    branch: 'main',
    status: 'Completed',
    duration: '1m 56s',
    date: '1 week ago',
    dateTime: '2023-01-16T15:54',
  },
  {
    user: {
      name: 'Michael Foster',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    commit: '5e136005',
    branch: 'main',
    status: 'Completed',
    duration: '3m 45s',
    date: '1 week ago',
    dateTime: '2023-01-16T11:31',
  },
  {
    user: {
      name: 'Whitney Francis',
      imageUrl:
        'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    commit: '5c1fd07f',
    branch: 'main',
    status: 'Completed',
    duration: '37s',
    date: '2 weeks ago',
    dateTime: '2023-01-09T08:45',
  },
]

const sidebarOpen = ref(false)
</script>