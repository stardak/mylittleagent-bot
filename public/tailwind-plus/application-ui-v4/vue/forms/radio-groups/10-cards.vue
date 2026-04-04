<template>
  <fieldset>
    <legend class="text-sm/6 font-semibold text-gray-900 dark:text-white">Select a mailing list</legend>
    <div class="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
      <label v-for="mailingList in mailingLists" :key="mailingList.id" :aria-label="mailingList.title" :aria-description="`${mailingList.description} to ${mailingList.users}`" class="group relative flex rounded-lg border border-gray-300 bg-white p-4 has-checked:outline-2 has-checked:-outline-offset-2 has-checked:outline-indigo-600 has-focus-visible:outline-3 has-focus-visible:-outline-offset-1 has-disabled:border-gray-400 has-disabled:bg-gray-200 has-disabled:opacity-25 dark:border-white/10 dark:bg-gray-800/50 dark:has-checked:bg-indigo-500/10 dark:has-checked:outline-indigo-500 dark:has-disabled:border-white/10 dark:has-disabled:bg-gray-800">
        <input type="radio" name="mailing-list" :value="mailingList.id" :checked="mailingList === mailingLists[0]" class="absolute inset-0 appearance-none focus:outline-none" />
        <div class="flex-1">
          <span class="block text-sm font-medium text-gray-900 dark:text-white">{{ mailingList.title }}</span>
          <span class="mt-1 block text-sm text-gray-500 dark:text-gray-400">{{ mailingList.description }}</span>
          <span class="mt-6 block text-sm font-medium text-gray-900 dark:text-white">{{ mailingList.users }}</span>
        </div>
        <CheckCircleIcon class="invisible size-5 text-indigo-600 group-has-checked:visible dark:text-indigo-500" aria-hidden="true" />
      </label>
    </div>
  </fieldset>
</template>

<script setup>
import { CheckCircleIcon } from '@heroicons/vue/20/solid'

const mailingLists = [
  { id: 'newsletter', title: 'Newsletter', description: 'Last message sent an hour ago', users: '621 users' },
  {
    id: 'existing-customers',
    title: 'Existing customers',
    description: 'Last message sent 2 weeks ago',
    users: '1200 users',
  },
  { id: 'trial-users', title: 'Trial users', description: 'Last message sent 4 days ago', users: '2740 users' },
]
</script>