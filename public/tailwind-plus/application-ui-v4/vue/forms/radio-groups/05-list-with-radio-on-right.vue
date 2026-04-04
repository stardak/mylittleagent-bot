<template>
  <fieldset>
    <legend class="text-sm/6 font-semibold text-gray-900 dark:text-white">Transfer funds</legend>
    <p class="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">Transfer your balance to your bank account.</p>
    <div class="mt-2.5 divide-y divide-gray-200 dark:divide-white/10">
      <div v-for="(account, accountIdx) in accounts" :key="accountIdx" class="relative flex items-start pt-3.5 pb-4">
        <div class="min-w-0 flex-1 text-sm/6">
          <label :for="`account-${account.id}`" class="font-medium text-gray-900 dark:text-white">{{ account.name }}</label>
          <p :id="`account-${account.id}-description`" class="text-gray-500 dark:text-gray-400">{{ account.description }}</p>
        </div>
        <div class="ml-3 flex h-6 items-center">
          <input :id="`account-${account.id}`" :aria-describedby="`account-${account.id}-description`" name="account" type="radio" :checked="account.id === 'checking'" class="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500 dark:disabled:border-white/5 dark:disabled:bg-white/10 dark:disabled:before:bg-white/20 forced-colors:appearance-auto forced-colors:before:hidden" />
        </div>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
const accounts = [
  { id: 'checking', name: 'Checking', description: 'CIBC ••••6610' },
  { id: 'savings', name: 'Savings', description: 'Bank of America ••••0149' },
  { id: 'mastercard', name: 'Mastercard', description: 'Capital One ••••7877' },
]
</script>