<template>
  <Listbox as="div" v-model="selected">
    <ListboxLabel class="sr-only">Change published status</ListboxLabel>
    <div class="relative">
      <div class="inline-flex divide-x divide-indigo-700 rounded-md outline-hidden dark:divide-indigo-600">
        <div class="inline-flex items-center gap-x-1.5 rounded-l-md bg-indigo-600 px-3 py-2 text-white dark:bg-indigo-500">
          <CheckIcon class="-ml-0.5 size-5" aria-hidden="true" />
          <p class="text-sm font-semibold">{{ selected.title }}</p>
        </div>
        <ListboxButton class="inline-flex items-center rounded-l-none rounded-r-md bg-indigo-600 p-2 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-400 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-400">
          <span class="sr-only">Change published status</span>
          <ChevronDownIcon class="size-5 text-white forced-colors:text-[Highlight]" aria-hidden="true" />
        </ListboxButton>
      </div>

      <transition leave-active-class="transition ease-in duration-100" leave-from-class="" leave-to-class="opacity-0">
        <ListboxOptions class="absolute right-0 z-10 mt-2 w-72 origin-top-right divide-y divide-gray-200 overflow-hidden rounded-md bg-white shadow-lg outline-1 outline-black/5 dark:divide-white/10 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          <ListboxOption as="template" v-for="option in publishingOptions" :key="option.title" :value="option" v-slot="{ active, selected }">
            <li :class="[active ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'text-gray-900 dark:text-white', 'cursor-default p-4 text-sm select-none']">
              <div class="flex flex-col">
                <div class="flex justify-between">
                  <p :class="selected ? 'font-semibold' : 'font-normal'">{{ option.title }}</p>
                  <span v-if="selected" :class="active ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'">
                    <CheckIcon class="size-5" aria-hidden="true" />
                  </span>
                </div>
                <p :class="[active ? 'text-indigo-200 dark:text-indigo-100' : 'text-gray-500 dark:text-gray-400', 'mt-2']">{{ option.description }}</p>
              </div>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<script setup>
import { ref } from 'vue'
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { CheckIcon, ChevronDownIcon } from '@heroicons/vue/20/solid'

const publishingOptions = [
  {
    value: 'published',
    title: 'Published',
    description: 'This job posting can be viewed by anyone who has the link.',
    current: true,
  },
  {
    value: 'draft',
    title: 'Draft',
    description: 'This job posting will no longer be publicly accessible.',
    current: false,
  },
]

const selected = ref(publishingOptions[0])
</script>