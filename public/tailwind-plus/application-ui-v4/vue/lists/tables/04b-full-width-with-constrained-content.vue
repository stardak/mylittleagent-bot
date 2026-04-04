<template>
  <div>
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-base font-semibold text-gray-900 dark:text-white">Users</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">A list of all the users in your account including their name, title, email and role.</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button type="button" class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Add user</button>
        </div>
      </div>
    </div>
    <div class="mt-8 flow-root overflow-hidden">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <table class="w-full text-left">
          <thead class="bg-white dark:bg-gray-900">
            <tr>
              <th scope="col" class="relative isolate py-3.5 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Name
                <div class="absolute inset-y-0 right-full -z-10 w-screen border-b border-b-gray-200 dark:border-b-white/15"></div>
                <div class="absolute inset-y-0 left-0 -z-10 w-screen border-b border-b-gray-200 dark:border-b-white/15"></div>
              </th>
              <th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell dark:text-white">Title</th>
              <th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 md:table-cell dark:text-white">Email</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
              <th scope="col" class="py-3.5 pl-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in people" :key="person.email">
              <td class="relative py-4 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                {{ person.name }}
                <div class="absolute right-full bottom-0 h-px w-screen bg-gray-100 dark:bg-white/10"></div>
                <div class="absolute bottom-0 left-0 h-px w-screen bg-gray-100 dark:bg-white/10"></div>
              </td>
              <td class="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell dark:text-gray-400">{{ person.title }}</td>
              <td class="hidden px-3 py-4 text-sm text-gray-500 md:table-cell dark:text-gray-400">{{ person.email }}</td>
              <td class="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{{ person.role }}</td>
              <td class="py-4 pl-3 text-right text-sm font-medium">
                <a href="#" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >Edit<span class="sr-only">, {{ person.name }}</span></a
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
const people = [
  { name: 'Lindsay Walton', title: 'Front-end Developer', email: 'lindsay.walton@example.com', role: 'Member' },
  { name: 'Courtney Henry', title: 'Designer', email: 'courtney.henry@example.com', role: 'Admin' },
  { name: 'Tom Cook', title: 'Director of Product', email: 'tom.cook@example.com', role: 'Member' },
  { name: 'Whitney Francis', title: 'Copywriter', email: 'whitney.francis@example.com', role: 'Admin' },
  { name: 'Leonard Krasner', title: 'Senior Designer', email: 'leonard.krasner@example.com', role: 'Owner' },
  { name: 'Floyd Miles', title: 'Principal Designer', email: 'floyd.miles@example.com', role: 'Member' },
]
</script>