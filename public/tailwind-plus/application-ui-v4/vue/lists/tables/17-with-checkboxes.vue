<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900 dark:text-white">Users</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">A list of all the users in your account including their name, title, email and role.</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button type="button" class="block rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Add user</button>
      </div>
    </div>
    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="group/table relative">
            <div class="absolute top-0 left-14 z-10 hidden h-12 items-center space-x-3 bg-white group-has-checked/table:flex sm:left-12 dark:bg-gray-900">
              <button type="button" class="inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white dark:bg-white/10 dark:text-white dark:inset-ring-white/10 dark:hover:bg-white/15 dark:disabled:hover:bg-white/10">Bulk edit</button>
              <button type="button" class="inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white dark:bg-white/10 dark:text-white dark:inset-ring-white/10 dark:hover:bg-white/15 dark:disabled:hover:bg-white/10">Delete all</button>
            </div>
            <table class="relative min-w-full table-fixed divide-y divide-gray-300 dark:divide-white/15">
              <thead>
                <tr>
                  <th scope="col" class="relative px-7 sm:w-12 sm:px-6">
                    <div class="group absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1">
                      <input type="checkbox" class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/20 dark:bg-gray-800/50 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:indeterminate:border-indigo-500 dark:indeterminate:bg-indigo-500 dark:focus-visible:outline-indigo-500 dark:disabled:border-white/10 dark:disabled:bg-gray-800 dark:disabled:checked:bg-gray-800 forced-colors:appearance-auto" :checked="indeterminate || selectedPeople.length === people.length" :indeterminate="indeterminate" @change="selectedPeople = $event.target.checked ? people.map((p) => p.email) : []" />
                      <svg class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-gray-50/25" viewBox="0 0 14 14" fill="none">
                        <path class="opacity-0 group-has-checked:opacity-100" d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path class="opacity-0 group-has-indeterminate:opacity-100" d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </div>
                  </th>
                  <th scope="col" class="min-w-48 py-3.5 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                  <th scope="col" class="py-3.5 pr-4 pl-3 sm:pr-3">
                    <span class="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900">
                <tr v-for="person in people" :key="person.email" class="group has-checked:bg-gray-50 dark:has-checked:bg-gray-800/50">
                  <td class="relative px-7 sm:w-12 sm:px-6">
                    <div className="hidden group-has-checked:block absolute inset-y-0 left-0 w-0.5 bg-indigo-600 dark:bg-indigo-500" />

                    <div class="absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1">
                      <input type="checkbox" class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/20 dark:bg-gray-800/50 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:indeterminate:border-indigo-500 dark:indeterminate:bg-indigo-500 dark:focus-visible:outline-indigo-500 dark:disabled:border-white/10 dark:disabled:bg-gray-800 dark:disabled:checked:bg-gray-800 forced-colors:appearance-auto" :value="person.email" v-model="selectedPeople" />
                      <svg class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-gray-50/25" viewBox="0 0 14 14" fill="none">
                        <path class="opacity-0 group-has-checked:opacity-100" d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path class="opacity-0 group-has-indeterminate:opacity-100" d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </div>
                  </td>
                  <td class="py-4 pr-3 text-sm font-medium whitespace-nowrap text-gray-900 group-has-checked:text-indigo-600 dark:text-white dark:group-has-checked:text-indigo-400">
                    {{ person.name }}
                  </td>
                  <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {{ person.title }}
                  </td>
                  <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {{ person.email }}
                  </td>
                  <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {{ person.role }}
                  </td>
                  <td class="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-3">
                    <a href="#" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Edit<span class="sr-only">, {{ person.name }}</span>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const people = [
  {
    name: 'Lindsay Walton',
    title: 'Front-end Developer',
    email: 'lindsay.walton@example.com',
    role: 'Member',
  },
  // More people...
]

const selectedPeople = ref([])
const indeterminate = computed(() => selectedPeople.value.length > 0 && selectedPeople.value.length < people.length)
</script>