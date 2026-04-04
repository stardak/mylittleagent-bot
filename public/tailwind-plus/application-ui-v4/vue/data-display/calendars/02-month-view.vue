<template>
  <div class="lg:flex lg:h-full lg:flex-col">
    <header class="flex items-center justify-between border-b border-gray-200 px-6 py-4 lg:flex-none dark:border-white/10 dark:bg-gray-800/50">
      <h1 class="text-base font-semibold text-gray-900 dark:text-white">
        <time datetime="2022-01">January 2022</time>
      </h1>
      <div class="flex items-center">
        <div class="relative flex items-center rounded-md bg-white shadow-xs outline -outline-offset-1 outline-gray-300 md:items-stretch dark:bg-white/10 dark:shadow-none dark:outline-white/5">
          <button type="button" class="flex h-9 w-12 items-center justify-center rounded-l-md pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50 dark:hover:text-white dark:md:hover:bg-white/10">
            <span class="sr-only">Previous month</span>
            <ChevronLeftIcon class="size-5" aria-hidden="true" />
          </button>
          <button type="button" class="hidden px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block dark:text-white dark:hover:bg-white/10">Today</button>
          <span class="relative -mx-px h-5 w-px bg-gray-300 md:hidden dark:bg-white/10"></span>
          <button type="button" class="flex h-9 w-12 items-center justify-center rounded-r-md pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50 dark:hover:text-white dark:md:hover:bg-white/10">
            <span class="sr-only">Next month</span>
            <ChevronRightIcon class="size-5" aria-hidden="true" />
          </button>
        </div>
        <div class="hidden md:ml-4 md:flex md:items-center">
          <Menu as="div" class="relative">
            <MenuButton type="button" class="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20">
              Month view
              <ChevronDownIcon class="-mr-1 size-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </MenuButton>

            <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
              <MenuItems class="absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg outline-1 outline-black/5 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10">
                <div class="py-1">
                  <MenuItem v-slot="{ active }">
                    <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Day view</a>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Week view</a>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Month view</a>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Year view</a>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
          <div class="ml-6 h-6 w-px bg-gray-300 dark:bg-white/10"></div>
          <button type="button" class="ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Add event</button>
        </div>
        <Menu as="div" class="relative ml-6 md:hidden">
          <MenuButton class="-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-white">
            <span class="sr-only">Open menu</span>
            <EllipsisHorizontalIcon class="size-5" aria-hidden="true" />
          </MenuButton>

          <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
            <MenuItems class="absolute right-0 z-10 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg outline-1 outline-black/5 dark:divide-white/10 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10">
              <div class="py-1">
                <MenuItem v-slot="{ active }">
                  <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Create event</a>
                </MenuItem>
              </div>
              <div class="py-1">
                <MenuItem v-slot="{ active }">
                  <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Go to today</a>
                </MenuItem>
              </div>
              <div class="py-1">
                <MenuItem v-slot="{ active }">
                  <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Day view</a>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Week view</a>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Month view</a>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Year view</a>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </div>
    </header>
    <div class="shadow-sm ring-1 ring-black/5 lg:flex lg:flex-auto lg:flex-col dark:shadow-none dark:ring-white/5">
      <div class="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs/6 font-semibold text-gray-700 lg:flex-none dark:border-white/5 dark:bg-white/15 dark:text-gray-300">
        <div class="flex justify-center bg-white py-2 dark:bg-gray-900">
          <span>M</span>
          <span class="sr-only sm:not-sr-only">on</span>
        </div>
        <div class="flex justify-center bg-white py-2 dark:bg-gray-900">
          <span>T</span>
          <span class="sr-only sm:not-sr-only">ue</span>
        </div>
        <div class="flex justify-center bg-white py-2 dark:bg-gray-900">
          <span>W</span>
          <span class="sr-only sm:not-sr-only">ed</span>
        </div>
        <div class="flex justify-center bg-white py-2 dark:bg-gray-900">
          <span>T</span>
          <span class="sr-only sm:not-sr-only">hu</span>
        </div>
        <div class="flex justify-center bg-white py-2 dark:bg-gray-900">
          <span>F</span>
          <span class="sr-only sm:not-sr-only">ri</span>
        </div>
        <div class="flex justify-center bg-white py-2 dark:bg-gray-900">
          <span>S</span>
          <span class="sr-only sm:not-sr-only">at</span>
        </div>
        <div class="flex justify-center bg-white py-2 dark:bg-gray-900">
          <span>S</span>
          <span class="sr-only sm:not-sr-only">un</span>
        </div>
      </div>
      <div class="flex bg-gray-200 text-xs/6 text-gray-700 lg:flex-auto dark:bg-white/10 dark:text-gray-300">
        <div class="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-6 lg:gap-px">
          <div v-for="day in days" :key="day.date" :data-is-current-month="day.isCurrentMonth ? '' : undefined" :data-is-today="day.isToday ? '' : undefined" class="group relative bg-gray-50 px-3 py-2 text-gray-500 data-is-current-month:bg-white dark:bg-gray-900 dark:text-gray-400 dark:not-data-is-current-month:before:pointer-events-none dark:not-data-is-current-month:before:absolute dark:not-data-is-current-month:before:inset-0 dark:not-data-is-current-month:before:bg-gray-800/50 dark:data-is-current-month:bg-gray-900">
            <time :datetime="day.date" class="relative group-not-data-is-current-month:opacity-75 in-data-is-today:flex in-data-is-today:size-6 in-data-is-today:items-center in-data-is-today:justify-center in-data-is-today:rounded-full in-data-is-today:bg-indigo-600 in-data-is-today:font-semibold in-data-is-today:text-white dark:in-data-is-today:bg-indigo-500">{{ day.date.split('-').pop().replace(/^0/, '') }}</time>
            <ol v-if="day.events.length > 0" class="mt-2">
              <li v-for="event in day.events.slice(0, 2)" :key="event.id">
                <a :href="event.href" class="group flex">
                  <p class="flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">{{ event.name }}</p>
                  <time :datetime="event.datetime" class="ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block dark:text-gray-400 dark:group-hover:text-indigo-400">{{ event.time }}</time>
                </a>
              </li>
              <li v-if="day.events.length > 2" class="text-gray-500 dark:text-gray-400">+ {{ day.events.length - 2 }} more</li>
            </ol>
          </div>
        </div>
        <div class="isolate grid w-full grid-cols-7 grid-rows-6 gap-px lg:hidden">
          <button v-for="day in days" :key="day.date" type="button" :data-is-current-month="day.isCurrentMonth ? '' : undefined" :data-is-selected="day.isSelected ? '' : undefined" :data-is-today="day.isToday ? '' : undefined" class="group relative flex h-14 flex-col px-3 py-2 not-data-is-current-month:bg-gray-50 not-data-is-selected:not-data-is-current-month:not-data-is-today:text-gray-500 hover:bg-gray-100 focus:z-10 data-is-current-month:bg-white not-data-is-selected:data-is-current-month:not-data-is-today:text-gray-900 data-is-current-month:hover:bg-gray-100 data-is-selected:font-semibold data-is-selected:text-white data-is-today:font-semibold not-data-is-selected:data-is-today:text-indigo-600 dark:not-data-is-current-month:bg-gray-900 dark:not-data-is-selected:not-data-is-current-month:not-data-is-today:text-gray-400 dark:not-data-is-current-month:before:pointer-events-none dark:not-data-is-current-month:before:absolute dark:not-data-is-current-month:before:inset-0 dark:not-data-is-current-month:before:bg-gray-800/50 dark:hover:bg-gray-900/50 dark:data-is-current-month:bg-gray-900 dark:not-data-is-selected:data-is-current-month:not-data-is-today:text-white dark:data-is-current-month:hover:bg-gray-900/50 dark:not-data-is-selected:data-is-today:text-indigo-400">
            <time :datetime="day.date" class="ml-auto group-not-data-is-current-month:opacity-75 in-data-is-selected:flex in-data-is-selected:size-6 in-data-is-selected:items-center in-data-is-selected:justify-center in-data-is-selected:rounded-full in-data-is-selected:not-in-data-is-today:bg-gray-900 in-data-is-selected:in-data-is-today:bg-indigo-600 dark:in-data-is-selected:not-in-data-is-today:bg-white dark:in-data-is-selected:not-in-data-is-today:text-gray-900 dark:in-data-is-selected:in-data-is-today:bg-indigo-500">{{ day.date.split('-').pop().replace(/^0/, '') }}</time>
            <span class="sr-only">{day.events.length} events</span>
            <span v-if="day.events.length > 0" class="-mx-0.5 mt-auto flex flex-wrap-reverse">
              <span v-for="event in day.events" :key="event.id" class="mx-0.5 mb-1 size-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></span>
            </span>
          </button>
        </div>
      </div>
    </div>
    <div class="relative px-4 py-10 sm:px-6 lg:hidden dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:top-0 dark:after:h-px dark:after:bg-white/10">
      <ol class="divide-y divide-gray-100 overflow-hidden rounded-lg bg-white text-sm shadow-sm outline-1 outline-black/5 dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <li v-for="event in events" :key="event.id" class="group flex p-4 pr-6 focus-within:bg-gray-50 hover:bg-gray-50 dark:focus-within:bg-white/5 dark:hover:bg-white/5">
          <div class="flex-auto">
            <p class="font-semibold text-gray-900 dark:text-white">{{ event.name }}</p>
            <time :datetime="event.datetime" class="mt-2 flex items-center text-gray-700 dark:text-gray-300">
              <ClockIcon class="mr-2 size-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              {{ event.time }}
            </time>
          </div>
          <a :href="event.href" class="ml-6 flex-none self-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 opacity-0 shadow-xs ring-1 ring-gray-300 ring-inset group-hover:opacity-100 hover:ring-gray-400 focus:opacity-100 dark:bg-white/10 dark:text-white dark:shadow-none dark:ring-white/5 dark:hover:bg-white/20 dark:hover:ring-white/5"
            >Edit<span class="sr-only">, {{ event.name }}</span></a
          >
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/vue/20/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'

const events = [
  { id: 1, name: 'Maple syrup museum', time: '3PM', datetime: '2022-01-15T09:00', href: '#' },
  { id: 2, name: 'Hockey game', time: '7PM', datetime: '2022-01-22T19:00', href: '#' },
]
const days = [
  { date: '2021-12-27', events: [] },
  { date: '2021-12-28', events: [] },
  { date: '2021-12-29', events: [] },
  { date: '2021-12-30', events: [] },
  { date: '2021-12-31', events: [] },
  { date: '2022-01-01', isCurrentMonth: true, events: [] },
  { date: '2022-01-02', isCurrentMonth: true, events: [] },
  {
    date: '2022-01-03',
    isCurrentMonth: true,
    events: [
      { id: 1, name: 'Design review', time: '10AM', datetime: '2022-01-03T10:00', href: '#' },
      { id: 2, name: 'Sales meeting', time: '2PM', datetime: '2022-01-03T14:00', href: '#' },
    ],
  },
  { date: '2022-01-04', isCurrentMonth: true, events: [] },
  { date: '2022-01-05', isCurrentMonth: true, events: [] },
  { date: '2022-01-06', isCurrentMonth: true, events: [] },
  {
    date: '2022-01-07',
    isCurrentMonth: true,
    events: [{ id: 3, name: 'Date night', time: '6PM', datetime: '2022-01-08T18:00', href: '#' }],
  },
  { date: '2022-01-08', isCurrentMonth: true, events: [] },
  { date: '2022-01-09', isCurrentMonth: true, events: [] },
  { date: '2022-01-10', isCurrentMonth: true, events: [] },
  { date: '2022-01-11', isCurrentMonth: true, events: [] },
  {
    date: '2022-01-12',
    isCurrentMonth: true,
    isToday: true,
    events: [{ id: 6, name: "Sam's birthday party", time: '2PM', datetime: '2022-01-25T14:00', href: '#' }],
  },
  { date: '2022-01-13', isCurrentMonth: true, events: [] },
  { date: '2022-01-14', isCurrentMonth: true, events: [] },
  { date: '2022-01-15', isCurrentMonth: true, events: [] },
  { date: '2022-01-16', isCurrentMonth: true, events: [] },
  { date: '2022-01-17', isCurrentMonth: true, events: [] },
  { date: '2022-01-18', isCurrentMonth: true, events: [] },
  { date: '2022-01-19', isCurrentMonth: true, events: [] },
  { date: '2022-01-20', isCurrentMonth: true, events: [] },
  { date: '2022-01-21', isCurrentMonth: true, events: [] },
  {
    date: '2022-01-22',
    isCurrentMonth: true,
    isSelected: true,
    events: [
      { id: 4, name: 'Maple syrup museum', time: '3PM', datetime: '2022-01-22T15:00', href: '#' },
      { id: 5, name: 'Hockey game', time: '7PM', datetime: '2022-01-22T19:00', href: '#' },
    ],
  },
  { date: '2022-01-23', isCurrentMonth: true, events: [] },
  { date: '2022-01-24', isCurrentMonth: true, events: [] },
  { date: '2022-01-25', isCurrentMonth: true, events: [] },
  { date: '2022-01-26', isCurrentMonth: true, events: [] },
  { date: '2022-01-27', isCurrentMonth: true, events: [] },
  { date: '2022-01-28', isCurrentMonth: true, events: [] },
  { date: '2022-01-29', isCurrentMonth: true, events: [] },
  { date: '2022-01-30', isCurrentMonth: true, events: [] },
  { date: '2022-01-31', isCurrentMonth: true, events: [] },
  { date: '2022-02-01', events: [] },
  { date: '2022-02-02', events: [] },
  { date: '2022-02-03', events: [] },
  {
    date: '2022-02-04',
    events: [{ id: 7, name: 'Cinema with friends', time: '9PM', datetime: '2022-02-04T21:00', href: '#' }],
  },
  { date: '2022-02-05', events: [] },
  { date: '2022-02-06', events: [] },
]
</script>