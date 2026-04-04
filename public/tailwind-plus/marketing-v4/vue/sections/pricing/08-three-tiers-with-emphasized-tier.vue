<template>
  <form class="group/tiers bg-white py-24 sm:py-32 dark:bg-gray-900">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mx-auto max-w-4xl text-center">
        <h2 class="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">Pricing</h2>
        <p class="mt-2 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-6xl dark:text-white">Pricing that grows with you</p>
      </div>
      <p class="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-600 sm:text-xl/8 dark:text-gray-400">Choose an affordable plan that’s packed with the best features for engaging your audience, creating customer loyalty, and driving sales.</p>
      <div class="mt-16 flex justify-center">
        <fieldset aria-label="Payment frequency">
          <div class="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs/5 font-semibold inset-ring inset-ring-gray-200 dark:inset-ring-white/10">
            <label class="group relative rounded-full px-2.5 py-1 has-checked:bg-indigo-600 dark:has-checked:bg-indigo-500">
              <input type="radio" name="frequency" value="monthly" checked="" class="absolute inset-0 appearance-none rounded-full" />
              <span class="text-gray-500 group-has-checked:text-white dark:text-gray-400">Monthly</span>
            </label>
            <label class="group relative rounded-full px-2.5 py-1 has-checked:bg-indigo-600 dark:has-checked:bg-indigo-500">
              <input type="radio" name="frequency" value="annually" class="absolute inset-0 appearance-none rounded-full" />
              <span class="text-gray-500 group-has-checked:text-white dark:text-gray-400">Annually</span>
            </label>
          </div>
        </fieldset>
      </div>
      <div class="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        <div v-for="tier in tiers" :key="tier.id" class="group/tier rounded-3xl p-8 ring-1 ring-gray-200 data-featured:bg-gray-900 data-featured:ring-gray-900 xl:p-10 dark:bg-gray-800/50 dark:ring-white/10 dark:data-featured:bg-gray-800/50 dark:data-featured:ring-2 dark:data-featured:ring-indigo-500" :data-featured="tier.featured ? 'true' : undefined">
          <h3 :id="`tier-${tier.id}`" class="text-lg/8 font-semibold text-gray-900 group-data-featured/tier:text-white dark:text-white dark:group-data-featured/tier:text-indigo-400">{{ tier.name }}</h3>
          <p class="mt-4 text-sm/6 text-gray-600 group-data-featured/tier:text-gray-300 dark:text-gray-300">{{ tier.description }}</p>
          <p v-if="typeof tier.price === 'string'" class="mt-6 text-4xl font-semibold tracking-tight text-gray-900 group-data-featured/tier:text-white dark:text-white">{{ tier.price }}</p>
          <template v-else>
            <p class="mt-6 flex items-baseline gap-x-1 group-not-has-[[name=frequency][value=monthly]:checked]/tiers:hidden">
              <span class="text-4xl font-semibold tracking-tight text-gray-900 group-data-featured/tier:text-white dark:text-white">{{ tier.price.monthly }}</span>
              <span class="text-sm/6 font-semibold text-gray-600 group-data-featured/tier:text-gray-300 dark:text-gray-400">/month</span>
            </p>
            <p class="mt-6 flex items-baseline gap-x-1 group-not-has-[[name=frequency][value=annually]:checked]/tiers:hidden">
              <span class="text-4xl font-semibold tracking-tight text-gray-900 group-data-featured/tier:text-white dark:text-white">{{ tier.price.annually }}</span>
              <span class="text-sm/6 font-semibold text-gray-600 group-data-featured/tier:text-gray-300 dark:text-gray-400">/year</span>
            </p>
          </template>
          <button type="submit" name="tier" :value="tier.id" :aria-describedby="`tier-${tier.id}`" class="mt-6 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm/6 font-semibold text-white shadow-xs group-data-featured/tier:bg-white/10 group-data-featured/tier:inset-ring group-data-featured/tier:inset-ring-white/5 hover:bg-indigo-500 group-data-featured/tier:hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 group-data-featured/tier:focus-visible:outline-white/75 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">{{ tier.cta }}</button>
          <ul role="list" class="mt-8 space-y-3 text-sm/6 text-gray-600 group-data-featured/tier:text-gray-300 xl:mt-10 dark:text-gray-300">
            <li v-for="feature in tier.features" :key="feature" class="flex gap-x-3">
              <CheckIcon :class="[tier.featured ? 'text-white dark:text-indigo-400' : 'text-indigo-600 dark:text-indigo-400', 'h-6 w-5 flex-none']" aria-hidden="true" />
              {{ feature }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import { CheckIcon } from '@heroicons/vue/20/solid'

const frequencies = [
  { value: 'monthly', label: 'Monthly', priceSuffix: '/month' },
  { value: 'annually', label: 'Annually', priceSuffix: '/year' },
]
const tiers = [
  {
    name: 'Freelancer',
    id: 'tier-freelancer',
    href: '#',
    price: { monthly: '$19', annually: '$199' },
    description: 'The essentials to provide your best work for clients.',
    features: ['5 products', 'Up to 1,000 subscribers', 'Basic analytics', '48-hour support response time'],
    featured: false,
    cta: 'Buy plan',
  },
  {
    name: 'Startup',
    id: 'tier-startup',
    href: '#',
    price: { monthly: '$29', annually: '$299' },
    description: 'A plan that scales with your rapidly growing business.',
    features: [
      '25 products',
      'Up to 10,000 subscribers',
      'Advanced analytics',
      '24-hour support response time',
      'Marketing automations',
    ],
    featured: false,
    cta: 'Buy plan',
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '#',
    price: 'Custom',
    description: 'Dedicated support and infrastructure for your company.',
    features: [
      'Unlimited products',
      'Unlimited subscribers',
      'Advanced analytics',
      '1-hour, dedicated support response time',
      'Marketing automations',
      'Custom reporting tools',
    ],
    featured: true,
    cta: 'Contact sales',
  },
]
</script>