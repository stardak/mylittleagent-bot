<template>
  <Combobox as="div" v-model="selectedPerson" @update:modelValue="query = ''">
    <ComboboxLabel class="block text-sm/6 font-medium text-gray-900 dark:text-white">Assigned to</ComboboxLabel>
    <div class="relative mt-2">
      <ComboboxInput class="block w-full rounded-md bg-white py-1.5 pr-12 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" @change="query = $event.target.value" @blur="query = ''" :display-value="(person) => person?.name" />
      <ComboboxButton class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
        <ChevronDownIcon class="size-5 text-gray-400" aria-hidden="true" />
      </ComboboxButton>

      <transition leave-active-class="transition ease-in duration-100" leave-from-class="" leave-to-class="opacity-0">
        <ComboboxOptions v-if="filteredPeople.length > 0 || query.length > 0" class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          <ComboboxOption v-if="queryPerson" :value="queryPerson" as="template" v-slot="{ active }">
            <li :class="['relative cursor-default px-3 py-2 select-none', active ? 'bg-indigo-600 text-white outline-hidden dark:bg-indigo-500' : 'text-gray-900 dark:text-white']">
              <div class="flex items-center">
                <span class="inline-block size-2 shrink-0 rounded-full border border-gray-400 in-aria-active:border-white/75 dark:border-gray-500" aria-hidden="true" />
                <span class="ml-3 truncate">
                  {{ query }}
                </span>
              </div>
            </li>
          </ComboboxOption>
          <ComboboxOption v-for="person in filteredPeople" :key="person.id" :value="person" as="template" v-slot="{ active }">
            <li :class="['relative cursor-default px-3 py-2 select-none', active ? 'bg-indigo-600 text-white outline-hidden dark:bg-indigo-500' : 'text-gray-900 dark:text-white']">
              <div class="flex items-center">
                <span :class="['inline-block size-2 shrink-0 rounded-full', person.online ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-200 dark:bg-white/20']" aria-hidden="true" />
                <span class="ml-3 truncate">
                  {{ person.name }}
                  <span class="sr-only"> is {{ person.online ? 'online' : 'offline' }}</span>
                </span>
              </div>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </transition>
    </div>
  </Combobox>
</template>

<script setup>
import { computed, ref } from 'vue'
import { CheckIcon, ChevronDownIcon } from '@heroicons/vue/20/solid'
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxLabel,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/vue'

const people = [
  { id: 1, name: 'Leslie Alexander', online: true },
  // More users...
]

const query = ref('')
const selectedPerson = ref(null)
const filteredPeople = computed(() =>
  query.value === ''
    ? people
    : people.filter((person) => {
        return person.name.toLowerCase().includes(query.value.toLowerCase())
      }),
)
const queryPerson = computed(() => {
  return query.value === '' ? null : { id: null, name: query.value }
})
</script>