<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900 dark:text-white">Plans</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Your team is on the <strong class="font-semibold text-gray-900 dark:text-white">Startup</strong> plan. The next payment of $80 will be due on August 4, 2022.</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button type="button" class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Update credit card</button>
      </div>
    </div>
    <div class="-mx-4 mt-10 ring-1 ring-gray-300 sm:mx-0 sm:rounded-lg dark:ring-white/15">
      <table class="relative min-w-full divide-y divide-gray-300 dark:divide-white/15">
        <thead>
          <tr>
            <th scope="col" class="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6 dark:text-white">Plan</th>
            <th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell dark:text-white">Memory</th>
            <th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell dark:text-white">CPU</th>
            <th scope="col" class="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell dark:text-white">Storage</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Price</th>
            <th scope="col" class="py-3.5 pr-4 pl-3 sm:pr-6">
              <span class="sr-only">Select</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(plan, planIdx) in plans" :key="plan.id">
            <td :class="[planIdx === 0 ? '' : 'border-t border-transparent', 'relative py-4 pr-3 pl-4 text-sm sm:pl-6']">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ plan.name }}
                <span v-if="plan.isCurrent" class="ml-1 text-indigo-600 dark:text-indigo-400">(Current Plan)</span>
              </div>
              <div class="mt-1 flex flex-col text-gray-500 sm:block lg:hidden dark:text-gray-400">
                <span>{{ plan.memory }} / {{ plan.cpu }}</span>
                <span class="hidden sm:inline">·</span>
                <span>{{ plan.storage }}</span>
              </div>
              <div v-if="planIdx !== 0" class="absolute -top-px right-0 left-6 h-px bg-gray-200 dark:bg-white/10"></div>
            </td>
            <td :class="[planIdx === 0 ? '' : 'border-t border-gray-200 dark:border-white/10', 'hidden px-3 py-3.5 text-sm text-gray-500 lg:table-cell dark:text-gray-400']">{{ plan.memory }}</td>
            <td :class="[planIdx === 0 ? '' : 'border-t border-gray-200 dark:border-white/10', 'hidden px-3 py-3.5 text-sm text-gray-500 lg:table-cell dark:text-gray-400']">{{ plan.cpu }}</td>
            <td :class="[planIdx === 0 ? '' : 'border-t border-gray-200 dark:border-white/10', 'hidden px-3 py-3.5 text-sm text-gray-500 lg:table-cell dark:text-gray-400']">{{ plan.storage }}</td>
            <td :class="[planIdx === 0 ? '' : 'border-t border-gray-200 dark:border-white/10', 'px-3 py-3.5 text-sm text-gray-500 dark:text-gray-400']">
              <div class="sm:hidden">{{ plan.price }}/mo</div>
              <div class="hidden sm:block">{{ plan.price }}/month</div>
            </td>
            <td :class="[planIdx === 0 ? '' : 'border-t border-transparent', 'relative py-3.5 pr-4 pl-3 text-right text-sm font-medium sm:pr-6']">
              <button type="button" class="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white dark:bg-white/10 dark:text-white dark:inset-ring-white/10 dark:hover:bg-white/15 dark:disabled:hover:bg-white/10" :disabled="plan.isCurrent">
                Select<span class="sr-only">, {{ plan.name }}</span>
              </button>
              <div v-if="planIdx !== 0" class="absolute -top-px right-6 left-0 h-px bg-gray-200 dark:bg-white/10"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const plans = [
  {
    id: 1,
    name: 'Hobby',
    memory: '4 GB RAM',
    cpu: '4 CPUs',
    storage: '128 GB SSD disk',
    price: '$40',
    isCurrent: false,
  },
  {
    id: 2,
    name: 'Startup',
    memory: '8 GB RAM',
    cpu: '6 CPUs',
    storage: '256 GB SSD disk',
    price: '$80',
    isCurrent: true,
  },
  {
    id: 3,
    name: 'Business',
    memory: '16 GB RAM',
    cpu: '8 CPUs',
    storage: '512 GB SSD disk',
    price: '$160',
    isCurrent: false,
  },
  {
    id: 4,
    name: 'Enterprise',
    memory: '1024 GB RAM',
    cpu: '12 CPUs',
    storage: '128 GB SSD disk',
    price: '$240',
    isCurrent: false,
  },
]
</script>