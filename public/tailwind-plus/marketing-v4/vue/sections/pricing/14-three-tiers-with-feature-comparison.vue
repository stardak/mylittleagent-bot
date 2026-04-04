<template>
  <form class="group/tiers isolate overflow-hidden bg-white dark:bg-gray-900">
    <div class="flow-root border-b border-b-transparent bg-gray-900 pt-24 pb-16 sm:pt-32 lg:pb-0 dark:border-b-white/5 dark:bg-gray-800/25">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="relative z-10">
          <h2 class="mx-auto max-w-4xl text-center text-5xl font-semibold tracking-tight text-balance text-white sm:text-6xl">Pricing that grows with you</h2>
          <p class="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">Choose an affordable plan that’s packed with the best features for engaging your audience, creating customer loyalty, and driving sales.</p>
          <div class="mt-16 flex justify-center">
            <fieldset aria-label="Payment frequency">
              <div class="grid grid-cols-2 gap-x-1 rounded-full bg-white/5 p-1 text-center text-xs/5 font-semibold text-white">
                <label class="group relative rounded-full px-2.5 py-1 has-checked:bg-indigo-500">
                  <input type="radio" name="frequency" value="monthly" checked="" class="absolute inset-0 appearance-none rounded-full" />
                  <span class="text-white">Monthly</span>
                </label>
                <label class="group relative rounded-full px-2.5 py-1 has-checked:bg-indigo-500">
                  <input type="radio" name="frequency" value="annually" class="absolute inset-0 appearance-none rounded-full" />
                  <span class="text-white">Annually</span>
                </label>
              </div>
            </fieldset>
          </div>
        </div>
        <div class="relative mx-auto mt-10 grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:-mb-14 lg:max-w-none lg:grid-cols-3">
          <svg viewBox="0 0 1208 1024" aria-hidden="true" class="absolute -bottom-48 left-1/2 h-256 -translate-x-1/2 translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)] lg:-top-48 lg:bottom-auto lg:translate-y-0">
            <ellipse cx="604" cy="512" fill="url(#d25c25d4-6d43-4bf9-b9ac-1842a30a4867)" rx="604" ry="512" />
            <defs>
              <radialGradient id="d25c25d4-6d43-4bf9-b9ac-1842a30a4867">
                <stop stop-color="#7775D6" />
                <stop offset="1" stop-color="#E935C1" />
              </radialGradient>
            </defs>
          </svg>
          <div class="hidden lg:absolute lg:inset-x-px lg:top-4 lg:bottom-0 lg:block lg:rounded-t-2xl lg:bg-gray-800/80 lg:ring-1 lg:ring-white/10" aria-hidden="true"></div>
          <div v-for="tier in tiers" :key="tier.id" :class="[tier.featured ? 'z-10 bg-white shadow-xl outline-1 outline-gray-900/10 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10' : 'bg-gray-800/80 outline-1 -outline-offset-1 outline-white/10 lg:bg-transparent lg:pb-14 lg:outline-0', 'group/tier relative rounded-2xl']" :data-featured="tier.featured ? 'true' : undefined">
            <div class="p-8 lg:pt-12 xl:p-10 xl:pt-14">
              <h3 :id="`tier-${tier.id}`" class="text-sm/6 font-semibold text-white group-data-featured/tier:text-gray-900 dark:group-data-featured/tier:text-white">{{ tier.name }}</h3>
              <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-stretch">
                <div class="mt-2 flex items-center gap-x-4">
                  <p class="text-4xl font-semibold tracking-tight text-white group-not-has-[[name=frequency][value=monthly]:checked]/tiers:hidden group-data-featured/tier:text-gray-900 dark:group-data-featured/tier:text-white">{{ tier.price.monthly }}</p>
                  <p class="text-4xl font-semibold tracking-tight text-white group-not-has-[[name=frequency][value=annually]:checked]/tiers:hidden group-data-featured/tier:text-gray-900 dark:group-data-featured/tier:text-white">{{ tier.price.annually }}</p>
                  <div class="text-sm">
                    <p class="text-white group-data-featured/tier:text-gray-900 dark:group-data-featured/tier:text-white">USD</p>
                    <p class="text-gray-400 group-not-has-[[name=frequency][value=monthly]:checked]/tiers:hidden group-data-featured/tier:text-gray-500 dark:group-data-featured/tier:text-gray-400">Billed monthly</p>
                    <p class="text-gray-400 group-not-has-[[name=frequency][value=annually]:checked]/tiers:hidden group-data-featured/tier:text-gray-500 dark:group-data-featured/tier:text-gray-400">Billed annually</p>
                  </div>
                </div>
                <button type="submit" name="tier" :value="tier.id" :aria-describedby="`tier-${tier.id}`" class="w-full rounded-md bg-white/10 px-3 py-2 text-center text-sm/6 font-semibold text-white not-group-data-featured:inset-ring not-group-data-featured:inset-ring-white/5 group-data-featured/tier:bg-indigo-600 group-data-featured/tier:shadow-xs hover:bg-white/20 group-data-featured/tier:hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/75 group-data-featured/tier:focus-visible:outline-indigo-600 dark:group-data-featured/tier:bg-indigo-500 dark:group-data-featured/tier:shadow-none dark:group-data-featured/tier:hover:bg-indigo-400 dark:group-data-featured/tier:focus-visible:outline-indigo-500">Buy this plan</button>
              </div>
              <div class="mt-8 flow-root sm:mt-10">
                <ul role="list" class="-my-2 divide-y divide-white/5 border-t border-white/5 text-sm/6 text-white group-data-featured/tier:divide-gray-900/5 group-data-featured/tier:border-gray-900/5 group-data-featured/tier:text-gray-600 lg:border-t-0 dark:group-data-featured/tier:divide-white/10 dark:group-data-featured/tier:border-white/10 dark:group-data-featured/tier:text-white">
                  <li v-for="mainFeature in tier.highlights" :key="mainFeature" class="flex gap-x-3 py-2">
                    <CheckIcon class="h-6 w-5 flex-none text-gray-500 group-data-featured/tier:text-indigo-600 dark:group-data-featured/tier:text-indigo-400" aria-hidden="true" />
                    {{ mainFeature }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="relative bg-gray-50 lg:pt-14 dark:bg-gray-900">
      <div class="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <!-- Feature comparison (up to lg) -->
        <section aria-labelledby="mobile-comparison-heading" class="lg:hidden">
          <h2 id="mobile-comparison-heading" class="sr-only">Feature comparison</h2>

          <div class="mx-auto max-w-2xl space-y-16">
            <div v-for="tier in tiers" :key="tier.id" class="border-t border-gray-900/10 dark:border-white/10">
              <div :class="[tier.featured ? 'border-indigo-600 dark:border-indigo-500' : 'border-transparent', '-mt-px w-72 border-t-2 pt-10 md:w-80']">
                <h3 :class="[tier.featured ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white', 'text-sm/6 font-semibold']">{{ tier.name }}</h3>
                <p class="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">{{ tier.description }}</p>
              </div>

              <div class="mt-10 space-y-10">
                <div v-for="section in sections" :key="section.name">
                  <h4 class="text-sm/6 font-semibold text-gray-900 dark:text-white">{{ section.name }}</h4>
                  <div class="relative mt-6">
                    <!-- Fake card background -->
                    <div aria-hidden="true" class="absolute inset-y-0 right-0 hidden w-1/2 rounded-lg bg-white shadow-xs sm:block dark:bg-gray-800/50 dark:shadow-none"></div>

                    <div :class="[tier.featured ? 'ring-2 ring-indigo-600 dark:ring-indigo-500' : 'ring-1 ring-gray-900/10 dark:ring-white/10', 'relative rounded-lg bg-white shadow-xs sm:rounded-none sm:bg-transparent sm:shadow-none sm:ring-0 dark:bg-gray-800/50 dark:shadow-none dark:sm:bg-transparent']">
                      <dl class="divide-y divide-gray-200 text-sm/6 dark:divide-white/10">
                        <div v-for="feature in section.features" :key="feature.name" class="flex items-center justify-between px-4 py-3 sm:grid sm:grid-cols-2 sm:px-0">
                          <dt class="pr-4 text-gray-600 dark:text-gray-400">{{ feature.name }}</dt>
                          <dd class="flex items-center justify-end sm:justify-center sm:px-4">
                            <span v-if="typeof feature.tiers[tier.name] === 'string'" :class="tier.featured ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'">{{ feature.tiers[tier.name] }}</span>
                            <template v-else>
                              <CheckIcon v-if="feature.tiers[tier.name] === true" class="mx-auto size-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                              <XMarkIcon v-else class="mx-auto size-5 text-gray-400 dark:text-gray-600" aria-hidden="true" />
                              <span class="sr-only">{{ feature.tiers[tier.name] === true ? 'Yes' : 'No' }}</span>
                            </template>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <!-- Fake card border -->
                    <div aria-hidden="true" :class="[tier.featured ? 'ring-2 ring-indigo-600 dark:ring-indigo-500' : 'ring-1 ring-gray-900/10 dark:ring-white/10', 'pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 rounded-lg sm:block']"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Feature comparison (lg+) -->
        <section aria-labelledby="comparison-heading" class="hidden lg:block">
          <h2 id="comparison-heading" class="sr-only">Feature comparison</h2>

          <div class="grid grid-cols-4 gap-x-8 border-t border-gray-900/10 before:block dark:border-white/10">
            <div v-for="tier in tiers" :key="tier.id" aria-hidden="true" class="-mt-px">
              <div :class="[tier.featured ? 'border-indigo-600 dark:border-indigo-500' : 'border-transparent', 'border-t-2 pt-10']">
                <p :class="[tier.featured ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white', 'text-sm/6 font-semibold']">{{ tier.name }}</p>
                <p class="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">{{ tier.description }}</p>
              </div>
            </div>
          </div>

          <div class="-mt-6 space-y-16">
            <div v-for="section in sections" :key="section.name">
              <h3 class="text-sm/6 font-semibold text-gray-900 dark:text-white">{{ section.name }}</h3>
              <div class="relative -mx-8 mt-10">
                <!-- Fake card backgrounds -->
                <div class="absolute inset-x-8 inset-y-0 grid grid-cols-4 gap-x-8 before:block" aria-hidden="true">
                  <div class="size-full rounded-lg bg-white shadow-xs dark:bg-gray-800/50 dark:shadow-none"></div>
                  <div class="size-full rounded-lg bg-white shadow-xs dark:bg-gray-800/50 dark:shadow-none"></div>
                  <div class="size-full rounded-lg bg-white shadow-xs dark:bg-gray-800/50 dark:shadow-none"></div>
                </div>

                <table class="relative w-full border-separate border-spacing-x-8">
                  <thead>
                    <tr class="text-left">
                      <th scope="col">
                        <span class="sr-only">Feature</span>
                      </th>
                      <th v-for="tier in tiers" :key="tier.id" scope="col">
                        <span class="sr-only">{{ tier.name }} tier</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(feature, featureIdx) in section.features" :key="feature.name">
                      <th scope="row" class="w-1/4 py-3 pr-4 text-left text-sm/6 font-normal text-gray-900 dark:text-white">
                        {{ feature.name }}
                        <div v-if="featureIdx !== section.features.length - 1" class="absolute inset-x-8 mt-3 h-px bg-gray-200 dark:bg-white/10"></div>
                      </th>
                      <td v-for="tier in tiers" :key="tier.id" class="relative w-1/4 px-4 py-0 text-center">
                        <span class="relative size-full py-3">
                          <span v-if="typeof feature.tiers[tier.name] === 'string'" :class="[tier.featured ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white', 'text-sm/6']">{{ feature.tiers[tier.name] }}</span>
                          <template v-else>
                            <CheckIcon v-if="feature.tiers[tier.name] === true" class="mx-auto size-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                            <XMarkIcon v-else class="mx-auto size-5 text-gray-400 dark:text-gray-600" aria-hidden="true" />
                            <span class="sr-only">{{ feature.tiers[tier.name] === true ? 'Yes' : 'No' }}</span>
                          </template>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Fake card borders -->
                <div class="pointer-events-none absolute inset-x-8 inset-y-0 grid grid-cols-4 gap-x-8 before:block" aria-hidden="true">
                  <div v-for="tier in tiers" :key="tier.id" :class="[tier.featured ? 'ring-2 ring-indigo-600 dark:ring-indigo-500' : 'ring-1 ring-gray-900/10 dark:ring-white/10', 'rounded-lg']"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </form>
</template>

<script setup>
import { CheckIcon, XMarkIcon } from '@heroicons/vue/20/solid'

const frequencies = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annually', label: 'Annually' },
]
const tiers = [
  {
    name: 'Starter',
    id: 'tier-starter',
    href: '#',
    featured: false,
    description: 'Everything you need to get started.',
    price: { monthly: '$19', annually: '$199' },
    highlights: ['Custom domains', 'Edge content delivery', 'Advanced analytics'],
  },
  {
    name: 'Scale',
    id: 'tier-scale',
    href: '#',
    featured: true,
    description: 'Added flexibility at scale.',
    price: { monthly: '$99', annually: '$999' },
    highlights: [
      'Custom domains',
      'Edge content delivery',
      'Advanced analytics',
      'Quarterly workshops',
      'Single sign-on (SSO)',
      'Priority phone support',
    ],
  },
  {
    name: 'Growth',
    id: 'tier-growth',
    href: '#',
    featured: false,
    description: 'All the extras for your growing team.',
    price: { monthly: '$49', annually: '$499' },
    highlights: ['Custom domains', 'Edge content delivery', 'Advanced analytics', 'Quarterly workshops'],
  },
]
const sections = [
  {
    name: 'Features',
    features: [
      { name: 'Edge content delivery', tiers: { Starter: true, Growth: true, Scale: true } },
      { name: 'Custom domains', tiers: { Starter: '1', Growth: '3', Scale: 'Unlimited' } },
      { name: 'Team members', tiers: { Starter: '3', Growth: '20', Scale: 'Unlimited' } },
      { name: 'Single sign-on (SSO)', tiers: { Starter: false, Growth: false, Scale: true } },
    ],
  },
  {
    name: 'Reporting',
    features: [
      { name: 'Advanced analytics', tiers: { Starter: true, Growth: true, Scale: true } },
      { name: 'Basic reports', tiers: { Starter: false, Growth: true, Scale: true } },
      { name: 'Professional reports', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: 'Custom report builder', tiers: { Starter: false, Growth: false, Scale: true } },
    ],
  },
  {
    name: 'Support',
    features: [
      { name: '24/7 online support', tiers: { Starter: true, Growth: true, Scale: true } },
      { name: 'Quarterly workshops', tiers: { Starter: false, Growth: true, Scale: true } },
      { name: 'Priority phone support', tiers: { Starter: false, Growth: false, Scale: true } },
      { name: '1:1 onboarding tour', tiers: { Starter: false, Growth: false, Scale: true } },
    ],
  },
]
</script>