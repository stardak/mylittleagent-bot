<template>
  <fieldset aria-label="Server size">
    <div class="space-y-4">
      <label v-for="plan in plans" :key="plan.id" :aria-label="plan.name" :aria-description="`${plan.ram}, ${plan.cpus}, ${plan.disk}, ${plan.price} per month`" class="group relative block rounded-lg border border-gray-300 bg-white px-6 py-4 has-checked:outline-2 has-checked:-outline-offset-2 has-checked:outline-indigo-600 has-focus-visible:outline-3 has-focus-visible:-outline-offset-1 sm:flex sm:justify-between dark:border-white/10 dark:bg-gray-800/50 dark:has-checked:outline-indigo-500">
        <input type="radio" name="plan" :value="plan.id" :checked="plan.id === 'hobby'" class="absolute inset-0 appearance-none focus:outline-none" />
        <span class="flex items-center">
          <span class="flex flex-col text-sm">
            <span class="font-medium text-gray-900 dark:text-white">{{ plan.name }}</span>
            <span class="text-gray-500 dark:text-gray-400">
              <span class="block sm:inline">{{ plan.ram }} / {{ plan.cpus }}</span>
              {{ ' ' }}
              <span class="hidden sm:mx-1 sm:inline" aria-hidden="true">&middot;</span>
              {{ ' ' }}
              <span class="block sm:inline">{{ plan.disk }}</span>
            </span>
          </span>
        </span>
        <span class="mt-2 flex text-sm sm:mt-0 sm:ml-4 sm:flex-col sm:text-right">
          <span class="font-medium text-gray-900 dark:text-white">{{ plan.price }}</span>
          <span class="ml-1 text-gray-500 sm:ml-0 dark:text-gray-400">/mo</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<script setup>
const plans = [
  { id: 'hobby', name: 'Hobby', ram: '8GB', cpus: '4 CPUs', disk: '160 GB SSD disk', price: '$40' },
  { id: 'startup', name: 'Startup', ram: '12GB', cpus: '6 CPUs', disk: '256 GB SSD disk', price: '$80' },
  { id: 'business', name: 'Business', ram: '16GB', cpus: '8 CPUs', disk: '512 GB SSD disk', price: '$160' },
  { id: 'enterprise', name: 'Enterprise', ram: '32GB', cpus: '12 CPUs', disk: '1024 GB SSD disk', price: '$240' },
]
</script>