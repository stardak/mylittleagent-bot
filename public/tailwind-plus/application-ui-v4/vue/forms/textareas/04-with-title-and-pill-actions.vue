<template>
  <form action="#" class="relative">
    <div class="rounded-lg bg-white outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-gray-800/50 dark:outline-white/10 dark:focus-within:outline-indigo-500">
      <label for="title" class="sr-only">Title</label>
      <input type="text" name="title" id="title" class="block w-full px-3 pt-2.5 text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500" placeholder="Title" />
      <label for="description" class="sr-only">Description</label>
      <textarea rows="2" name="description" id="description" class="block w-full resize-none px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:text-white dark:placeholder:text-gray-500" placeholder="Write a description..."></textarea>

      <!-- Spacer element to match the height of the toolbar -->
      <div aria-hidden="true">
        <div class="py-2">
          <div class="h-9"></div>
        </div>
        <div class="h-px"></div>
        <div class="py-2">
          <div class="py-px">
            <div class="h-9"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute inset-x-px bottom-0">
      <!-- Actions: These are just examples to demonstrate the concept, replace/wire these up however makes sense for your project. -->
      <div class="flex flex-nowrap justify-end space-x-2 px-2 py-2 sm:px-3">
        <Listbox as="div" v-model="assigned" class="shrink-0">
          <ListboxLabel class="sr-only">Assign</ListboxLabel>
          <div class="relative">
            <ListboxButton class="relative inline-flex items-center rounded-full bg-gray-50 px-2 py-2 text-sm font-medium whitespace-nowrap text-gray-500 hover:bg-gray-100 sm:px-3 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10">
              <UserCircleIcon v-if="assigned.value === null" class="size-5 shrink-0 text-gray-300 sm:-ml-1 dark:text-gray-500" aria-hidden="true" />

              <img v-else :src="assigned.avatar" alt="" class="size-5 shrink-0 rounded-full" />

              <span :class="[assigned.value === null ? '' : 'text-gray-900 dark:text-white', 'hidden truncate sm:ml-2 sm:block']">{{ assigned.value === null ? 'Assign' : assigned.name }}</span>
            </ListboxButton>

            <transition leave-active-class="transition ease-in duration-100" leave-from-class="" leave-to-class="opacity-0">
              <ListboxOptions class="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-white py-3 text-base shadow-sm outline-1 outline-black/5 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                <ListboxOption as="template" v-for="assignee in assignees" :key="assignee.value" :value="assignee" v-slot="{ active }">
                  <li :class="[active ? 'relative bg-gray-100 hover:outline-hidden dark:bg-white/5' : 'bg-white dark:bg-gray-800', 'cursor-default px-3 py-2 select-none']">
                    <div class="flex items-center">
                      <img v-if="assignee.avatar" :src="assignee.avatar" alt="" class="size-5 shrink-0 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" />
                      <UserCircleIcon v-else class="size-5 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                      <span class="ml-3 block truncate font-medium dark:text-white">{{ assignee.name }}</span>
                    </div>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </div>
        </Listbox>

        <Listbox as="div" v-model="labelled" class="shrink-0">
          <ListboxLabel class="sr-only">Add a label</ListboxLabel>
          <div class="relative">
            <ListboxButton class="relative inline-flex items-center rounded-full bg-gray-50 px-2 py-2 text-sm font-medium whitespace-nowrap text-gray-500 hover:bg-gray-100 sm:px-3 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10">
              <TagIcon :class="[labelled.value === null ? 'text-gray-300 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400', 'size-5 shrink-0 sm:-ml-1']" aria-hidden="true" />
              <span :class="[labelled.value === null ? '' : 'text-gray-900 dark:text-white', 'hidden truncate sm:ml-2 sm:block']">{{ labelled.value === null ? 'Label' : labelled.name }}</span>
            </ListboxButton>

            <transition leave-active-class="transition ease-in duration-100" leave-from-class="" leave-to-class="opacity-0">
              <ListboxOptions class="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-white py-3 text-base shadow-sm outline-1 outline-black/5 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                <ListboxOption as="template" v-for="label in labels" :key="label.value" :value="label" v-slot="{ active }">
                  <li :class="[active ? 'relative bg-gray-100 hover:outline-hidden dark:bg-white/5' : 'bg-white dark:bg-gray-800', 'cursor-default px-3 py-2 select-none']">
                    <div class="flex items-center">
                      <span class="block truncate font-medium dark:text-white">{{ label.name }}</span>
                    </div>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </div>
        </Listbox>

        <Listbox as="div" v-model="dated" class="shrink-0">
          <ListboxLabel class="sr-only">Add a due date</ListboxLabel>
          <div class="relative">
            <ListboxButton class="relative inline-flex items-center rounded-full bg-gray-50 px-2 py-2 text-sm font-medium whitespace-nowrap text-gray-500 hover:bg-gray-100 sm:px-3 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10">
              <CalendarIcon :class="[dated.value === null ? 'text-gray-300 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400', 'size-5 shrink-0 sm:-ml-1']" aria-hidden="true" />
              <span :class="[dated.value === null ? '' : 'text-gray-900 dark:text-white', 'hidden truncate sm:ml-2 sm:block']">{{ dated.value === null ? 'Due date' : dated.name }}</span>
            </ListboxButton>

            <transition leave-active-class="transition ease-in duration-100" leave-from-class="" leave-to-class="opacity-0">
              <ListboxOptions class="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-white py-3 text-base shadow-sm outline-1 outline-black/5 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                <ListboxOption as="template" v-for="dueDate in dueDates" :key="dueDate.value" :value="dueDate" v-slot="{ active }">
                  <li :class="[active ? 'relative bg-gray-100 hover:outline-hidden dark:bg-white/5' : 'bg-white dark:bg-gray-800', 'cursor-default px-3 py-2 select-none']">
                    <div class="flex items-center">
                      <span class="block truncate font-medium dark:text-white">{{ dueDate.name }}</span>
                    </div>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </div>
        </Listbox>
      </div>
      <div class="flex items-center justify-between space-x-3 border-t border-gray-200 px-2 py-2 sm:px-3 dark:border-white/10">
        <div class="flex">
          <button type="button" class="group -my-2 -ml-2 inline-flex items-center rounded-full px-3 py-2 text-left text-gray-400 dark:text-gray-500">
            <PaperClipIcon class="mr-2 -ml-1 size-5 group-hover:text-gray-500 dark:group-hover:text-gray-400" aria-hidden="true" />
            <span class="text-sm text-gray-500 italic group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300">Attach a file</span>
          </button>
        </div>
        <div class="shrink-0">
          <button type="submit" class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Create</button>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { CalendarIcon, PaperClipIcon, TagIcon, UserCircleIcon } from '@heroicons/vue/20/solid'

const assignees = [
  { name: 'Unassigned', value: null },
  {
    name: 'Wade Cooper',
    value: 'wade-cooper',
    avatar:
      'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Arlene Mccoy',
    value: 'arlene-mccoy',
    avatar:
      'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Devon Webb',
    value: 'devon-webb',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80',
  },
]
const labels = [
  { name: 'Unlabelled', value: null },
  { name: 'Engineering', value: 'engineering' },
  { name: 'Marketing', value: 'marketing' },
  { name: 'Design', value: 'design' },
  { name: 'Human Resources', value: 'human-resources' },
]
const dueDates = [
  { name: 'No due date', value: null },
  { name: 'Today', value: 'today' },
  { name: 'Tomorrow', value: 'tomorrow' },
  { name: 'This week', value: 'this-week' },
]

const assigned = ref(assignees[0])
const labelled = ref(labels[0])
const dated = ref(dueDates[0])
</script>