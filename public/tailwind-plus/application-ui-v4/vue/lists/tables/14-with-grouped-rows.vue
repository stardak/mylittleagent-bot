<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900 dark:text-white">Users</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">A list of all the users in your account including their name, title, email and role.</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button type="button" class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Add user</button>
      </div>
    </div>
    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table class="relative min-w-full">
            <thead class="bg-white dark:bg-gray-900">
              <tr>
                <th scope="col" class="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-3 dark:text-white">Name</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                <th scope="col" class="py-3.5 pr-4 pl-3 sm:pr-3">
                  <span class="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900">
              <template v-for="location in locations" :key="location.name">
                <tr class="border-t border-gray-200 dark:border-white/10">
                  <th colspan="5" scope="colgroup" class="bg-gray-50 py-2 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-3 dark:bg-gray-800/50 dark:text-white">{{ location.name }}</th>
                </tr>
                <tr v-for="(person, personIdx) in location.people" :key="person.email" :class="[personIdx === 0 ? 'border-gray-300 dark:border-white/15' : 'border-gray-200 dark:border-white/10', 'border-t']">
                  <td class="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-3 dark:text-white">{{ person.name }}</td>
                  <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">{{ person.title }}</td>
                  <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">{{ person.email }}</td>
                  <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">{{ person.role }}</td>
                  <td class="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-3">
                    <a href="#" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >Edit<span class="sr-only">, {{ person.name }}</span></a
                    >
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const locations = [
  {
    name: 'Edinburgh',
    people: [
      { name: 'Lindsay Walton', title: 'Front-end Developer', email: 'lindsay.walton@example.com', role: 'Member' },
      { name: 'Courtney Henry', title: 'Designer', email: 'courtney.henry@example.com', role: 'Admin' },
    ],
  },
  {
    name: 'London',
    people: [
      { name: 'Tom Cook', title: 'Director of Product', email: 'tom.cook@example.com', role: 'Member' },
      { name: 'Whitney Francis', title: 'Copywriter', email: 'whitney.francis@example.com', role: 'Admin' },
      { name: 'Leonard Krasner', title: 'Senior Designer', email: 'leonard.krasner@example.com', role: 'Owner' },
      { name: 'Floyd Miles', title: 'Principal Designer', email: 'floyd.miles@example.com', role: 'Member' },
    ],
  },
  {
    name: 'Leeds',
    people: [
      { name: 'Emily Selman', title: 'VP, User Experience', email: 'emily.selman@example.com', role: 'Member' },
      { name: 'Kristin Watson', title: 'VP, Human Resources', email: 'kristin.watson@example.com', role: 'Admin' },
      { name: 'Emma Dorsey', title: 'Senior Developer', email: 'emma.dorsey@example.com', role: 'Member' },
    ],
  },
]
</script>