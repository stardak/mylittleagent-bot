<template>
  <fieldset aria-label="Choose a memory option">
    <div class="flex items-center justify-between">
      <div class="text-sm/6 font-medium text-gray-900 dark:text-white">RAM</div>
      <a href="#" class="text-sm/6 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">See performance specs</a>
    </div>
    <div class="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
      <label v-for="option in memoryOptions" :key="option.id" :aria-label="option.name" class="group relative flex items-center justify-center rounded-md border border-gray-300 bg-white p-3 has-checked:border-indigo-600 has-checked:bg-indigo-600 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-600 has-disabled:border-gray-400 has-disabled:bg-gray-200 has-disabled:opacity-25 dark:border-white/10 dark:bg-gray-800/50 dark:has-checked:border-indigo-500 dark:has-checked:bg-indigo-500 dark:has-focus-visible:outline-indigo-500 dark:has-disabled:border-white/10 dark:has-disabled:bg-gray-800">
        <input type="radio" name="option" :value="option.id" :checked="option === memoryOptions[2]" :disabled="!option.inStock" class="absolute inset-0 appearance-none focus:outline-none disabled:cursor-not-allowed" />
        <span class="text-sm font-medium text-gray-900 uppercase group-has-checked:text-white dark:text-white">{{ option.name }}</span>
      </label>
    </div>
  </fieldset>
</template>

<script setup>
const memoryOptions = [
  { id: '4gb', name: '4 GB', inStock: true },
  { id: '8gb', name: '8 GB', inStock: true },
  { id: '16gb', name: '16 GB', inStock: true },
  { id: '32gb', name: '32 GB', inStock: true },
  { id: '64gb', name: '64 GB', inStock: true },
  { id: '128gb', name: '128 GB', inStock: false },
]
</script>