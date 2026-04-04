<template>
  <div class="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200 dark:md:divide-white/10">
    <div class="md:pr-14">
      <div class="flex items-center">
        <h2 class="flex-auto text-sm font-semibold text-gray-900 dark:text-white">January 2022</h2>
        <button type="button" class="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-white">
          <span class="sr-only">Previous month</span>
          <ChevronLeftIcon class="size-5" aria-hidden="true" />
        </button>
        <button type="button" class="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-white">
          <span class="sr-only">Next month</span>
          <ChevronRightIcon class="size-5" aria-hidden="true" />
        </button>
      </div>
      <div class="mt-10 grid grid-cols-7 text-center text-xs/6 text-gray-500 dark:text-gray-400">
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
        <div>S</div>
      </div>
      <div class="mt-2 grid grid-cols-7 text-sm">
        <div v-for="(day, dayIdx) in days" :key="day.date" :data-first-line="dayIdx <= 6 ? '' : undefined" class="py-2 not-data-first-line:border-t not-data-first-line:border-gray-200 dark:not-data-first-line:border-white/10">
          <button type="button" :data-is-selected="day.isSelected ? '' : undefined" :data-is-current-month="day.isCurrentMonth ? '' : undefined" :data-is-today="day.isToday ? '' : undefined" class="mx-auto flex size-8 items-center justify-center rounded-full not-data-is-selected:not-data-is-today:not-data-is-current-month:text-gray-400 not-data-is-selected:hover:bg-gray-200 not-data-is-selected:not-data-is-today:data-is-current-month:text-gray-900 data-is-selected:font-semibold data-is-selected:text-white data-is-selected:not-data-is-today:bg-gray-900 data-is-today:font-semibold not-data-is-selected:data-is-today:text-indigo-600 data-is-selected:data-is-today:bg-indigo-600 dark:not-data-is-selected:not-data-is-today:not-data-is-current-month:text-gray-500 dark:not-data-is-selected:hover:bg-white/10 dark:not-data-is-selected:not-data-is-today:data-is-current-month:text-white dark:data-is-selected:not-data-is-today:bg-white dark:data-is-selected:not-data-is-today:text-gray-900 dark:not-data-is-selected:data-is-today:text-indigo-400 dark:data-is-selected:data-is-today:bg-indigo-500">
            <time :datetime="day.date">{{ day.date.split('-').pop().replace(/^0/, '') }}</time>
          </button>
        </div>
      </div>
    </div>
    <section class="mt-12 md:mt-0 md:pl-14">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">Schedule for <time datetime="2022-01-21">January 21, 2022</time></h2>
      <ol class="mt-4 flex flex-col gap-y-1 text-sm/6 text-gray-500 dark:text-gray-400">
        <li v-for="meeting in meetings" :key="meeting.id" class="group flex items-center gap-x-4 rounded-xl px-4 py-2 focus-within:bg-gray-100 hover:bg-gray-100 dark:focus-within:bg-white/5 dark:hover:bg-white/5">
          <img :src="meeting.imageUrl" alt="" class="size-10 flex-none rounded-full dark:outline dark:-outline-offset-1 dark:outline-white/10" />
          <div class="flex-auto">
            <p class="text-gray-900 dark:text-white">{{ meeting.name }}</p>
            <p class="mt-0.5">
              <time :datetime="meeting.startDatetime">{{ meeting.start }}</time> - <time :datetime="meeting.endDatetime">{{ meeting.end }}</time>
            </p>
          </div>
          <Menu as="div" class="relative opacity-0 group-hover:opacity-100 focus-within:opacity-100">
            <MenuButton class="relative flex items-center rounded-full text-gray-500 outline-offset-6 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white">
              <span class="absolute -inset-2"></span>
              <span class="sr-only">Open options</span>
              <EllipsisVerticalIcon class="size-6" aria-hidden="true" />
            </MenuButton>

            <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
              <MenuItems class="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg outline-1 outline-black/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                <div class="py-1">
                  <MenuItem v-slot="{ active }">
                    <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Edit</a>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-hidden dark:bg-white/5 dark:text-white' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">Cancel</a>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </li>
      </ol>
    </section>
  </div>
</template>

<script setup>
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { EllipsisVerticalIcon } from '@heroicons/vue/24/outline'

const meetings = [
  {
    id: 1,
    name: 'Leslie Alexander',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    start: '1:00 PM',
    startDatetime: '2022-01-21T13:00',
    end: '2:30 PM',
    endDatetime: '2022-01-21T14:30',
  },
  {
    id: 2,
    name: 'Michael Foster',
    imageUrl:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    start: '3:00 PM',
    startDatetime: '2022-01-21T15:00',
    end: '4:30 PM',
    endDatetime: '2022-01-21T16:30',
  },
  {
    id: 3,
    name: 'Dries Vincent',
    imageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    start: '5:00 PM',
    startDatetime: '2022-01-21T17:00',
    end: '6:30 PM',
    endDatetime: '2022-01-21T18:30',
  },
  {
    id: 4,
    name: 'Lindsay Walton',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    start: '7:00 PM',
    startDatetime: '2022-01-21T19:00',
    end: '8:30 PM',
    endDatetime: '2022-01-21T20:30',
  },
  {
    id: 5,
    name: 'Courtney Henry',
    imageUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    start: '9:00 PM',
    startDatetime: '2022-01-21T21:00',
    end: '10:30 PM',
    endDatetime: '2022-01-21T22:30',
  },
]
const days = [
  { date: '2021-12-27' },
  { date: '2021-12-28' },
  { date: '2021-12-29' },
  { date: '2021-12-30' },
  { date: '2021-12-31' },
  { date: '2022-01-01', isCurrentMonth: true },
  { date: '2022-01-02', isCurrentMonth: true },
  { date: '2022-01-03', isCurrentMonth: true },
  { date: '2022-01-04', isCurrentMonth: true },
  { date: '2022-01-05', isCurrentMonth: true },
  { date: '2022-01-06', isCurrentMonth: true },
  { date: '2022-01-07', isCurrentMonth: true },
  { date: '2022-01-08', isCurrentMonth: true },
  { date: '2022-01-09', isCurrentMonth: true },
  { date: '2022-01-10', isCurrentMonth: true },
  { date: '2022-01-11', isCurrentMonth: true },
  { date: '2022-01-12', isCurrentMonth: true, isToday: true },
  { date: '2022-01-13', isCurrentMonth: true },
  { date: '2022-01-14', isCurrentMonth: true },
  { date: '2022-01-15', isCurrentMonth: true },
  { date: '2022-01-16', isCurrentMonth: true },
  { date: '2022-01-17', isCurrentMonth: true },
  { date: '2022-01-18', isCurrentMonth: true },
  { date: '2022-01-19', isCurrentMonth: true },
  { date: '2022-01-20', isCurrentMonth: true },
  { date: '2022-01-21', isCurrentMonth: true, isSelected: true },
  { date: '2022-01-22', isCurrentMonth: true },
  { date: '2022-01-23', isCurrentMonth: true },
  { date: '2022-01-24', isCurrentMonth: true },
  { date: '2022-01-25', isCurrentMonth: true },
  { date: '2022-01-26', isCurrentMonth: true },
  { date: '2022-01-27', isCurrentMonth: true },
  { date: '2022-01-28', isCurrentMonth: true },
  { date: '2022-01-29', isCurrentMonth: true },
  { date: '2022-01-30', isCurrentMonth: true },
  { date: '2022-01-31', isCurrentMonth: true },
  { date: '2022-02-01' },
  { date: '2022-02-02' },
  { date: '2022-02-03' },
  { date: '2022-02-04' },
  { date: '2022-02-05' },
  { date: '2022-02-06' },
]
</script>