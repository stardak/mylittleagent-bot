<template>
  <ul role="list" class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    <li v-for="person in people" :key="person.email" class="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
      <div class="flex flex-1 flex-col p-8">
        <img class="mx-auto size-32 shrink-0 rounded-full bg-gray-300 outline -outline-offset-1 outline-black/5 dark:bg-gray-700 dark:outline-white/10" :src="person.imageUrl" alt="" />
        <h3 class="mt-6 text-sm font-medium text-gray-900 dark:text-white">{{ person.name }}</h3>
        <dl class="mt-1 flex grow flex-col justify-between">
          <dt class="sr-only">Title</dt>
          <dd class="text-sm text-gray-500 dark:text-gray-400">{{ person.title }}</dd>
          <dt class="sr-only">Role</dt>
          <dd class="mt-3">
            <span class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 inset-ring inset-ring-green-600/20 dark:bg-green-500/10 dark:text-green-500 dark:inset-ring-green-500/10">{{ person.role }}</span>
          </dd>
        </dl>
      </div>
      <div>
        <div class="-mt-px flex divide-x divide-gray-200 dark:divide-white/10">
          <div class="flex w-0 flex-1">
            <a :href="`mailto:${person.email}`" class="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white">
              <EnvelopeIcon class="size-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              Email
            </a>
          </div>
          <div class="-ml-px flex w-0 flex-1">
            <a :href="`tel:${person.telephone}`" class="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white">
              <PhoneIcon class="size-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              Call
            </a>
          </div>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup>
import { EnvelopeIcon, PhoneIcon } from '@heroicons/vue/20/solid'

const people = [
  {
    name: 'Jane Cooper',
    title: 'Paradigm Representative',
    role: 'Admin',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Cody Fisher',
    title: 'Lead Security Associate',
    role: 'Admin',
    email: 'codyfisher@example.com',
    telephone: '+1-202-555-0114',
    imageUrl:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Esther Howard',
    title: 'Assurance Administrator',
    email: 'estherhoward@example.com',
    telephone: '+1-202-555-0143',
    role: 'Admin',
    imageUrl:
      'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Jenny Wilson',
    title: 'Chief Accountability Analyst',
    role: 'Admin',
    email: 'jennywilson@example.com',
    telephone: '+1-202-555-0184',
    imageUrl:
      'https://images.unsplash.com/photo-1498551172505-8ee7ad69f235?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Kristin Watson',
    title: 'Investor Data Orchestrator',
    role: 'Admin',
    email: 'kristinwatson@example.com',
    telephone: '+1-202-555-0191',
    imageUrl:
      'https://images.unsplash.com/photo-1532417344469-368f9ae6d187?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Cameron Williamson',
    title: 'Product Infrastructure Executive',
    role: 'Admin',
    email: 'cameronwilliamson@example.com',
    telephone: '+1-202-555-0108',
    imageUrl:
      'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Courtney Henry',
    title: 'Investor Factors Associate',
    role: 'Admin',
    email: 'courtneyhenry@example.com',
    telephone: '+1-202-555-0104',
    imageUrl:
      'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
  {
    name: 'Theresa Webb',
    title: 'Global Division Officer',
    role: 'Admin',
    email: 'theresawebb@example.com',
    telephone: '+1-202-555-0138',
    imageUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
  },
]
</script>