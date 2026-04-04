<template>
  <div class="bg-white dark:bg-gray-900">
    <header>
      <nav class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div class="flex lg:flex-1">
          <a href="#" class="-m-1.5 p-1.5">
            <span class="sr-only">Your Company</span>
            <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="" />
            <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="" />
          </a>
        </div>
        <div class="flex lg:hidden">
          <button type="button" class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-200" @click="mobileMenuOpen = true">
            <span class="sr-only">Open main menu</span>
            <Bars3Icon class="size-6" aria-hidden="true" />
          </button>
        </div>
        <div class="hidden lg:flex lg:gap-x-12">
          <a v-for="item in navigation" :key="item.name" :href="item.href" class="text-sm/6 font-semibold text-gray-900 dark:text-white">{{ item.name }}</a>
        </div>
        <div class="hidden lg:flex lg:flex-1 lg:justify-end">
          <a href="#" class="text-sm/6 font-semibold text-gray-900 dark:text-white">Log in <span aria-hidden="true">&rarr;</span></a>
        </div>
      </nav>
      <Dialog class="lg:hidden" @close="mobileMenuOpen = false" :open="mobileMenuOpen">
        <div class="fixed inset-0 z-50"></div>
        <DialogPanel class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:bg-gray-900 dark:sm:ring-gray-100/10">
          <div class="flex items-center justify-between">
            <a href="#" class="-m-1.5 p-1.5">
              <span class="sr-only">Your Company</span>
              <img class="h-8 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="" />
              <img class="h-8 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="" />
            </a>
            <button type="button" class="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-200" @click="mobileMenuOpen = false">
              <span class="sr-only">Close menu</span>
              <XMarkIcon class="size-6" aria-hidden="true" />
            </button>
          </div>
          <div class="mt-6 flow-root">
            <div class="-my-6 divide-y divide-gray-500/10 dark:divide-white/10">
              <div class="space-y-2 py-6">
                <a v-for="item in navigation" :key="item.name" :href="item.href" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5">{{ item.name }}</a>
              </div>
              <div class="py-6">
                <a href="#" class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5">Log in</a>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>

    <main>
      <!-- Pricing section -->
      <form class="group/tiers bg-white pt-24 sm:pt-32 dark:bg-gray-900">
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
          <div class="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl xl:mx-0 xl:max-w-none xl:grid-cols-4">
            <div v-for="tier in pricing.tiers" :key="tier.id" class="group/tier rounded-3xl p-8 ring-1 ring-gray-200 data-featured:ring-2 data-featured:ring-indigo-600 dark:bg-gray-800/50 dark:ring-white/15 dark:data-featured:ring-indigo-400" :data-featured="tier.featured ? 'true' : undefined">
              <div class="flex items-center justify-between gap-x-4">
                <h3 :id="`tier-${tier.id}`" class="text-lg/8 font-semibold text-gray-900 group-data-featured/tier:text-indigo-600 dark:text-white dark:group-data-featured/tier:text-indigo-400">{{ tier.name }}</h3>
                <p class="rounded-full bg-indigo-600/10 px-2.5 py-1 text-xs/5 font-semibold text-indigo-600 group-not-data-featured/tier:hidden dark:bg-indigo-500 dark:text-white">Most popular</p>
              </div>
              <p class="mt-4 text-sm/6 text-gray-600 dark:text-gray-300">{{ tier.description }}</p>
              <p class="mt-6 flex items-baseline gap-x-1 group-not-has-[[name=frequency][value=monthly]:checked]/tiers:hidden">
                <span class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">{{ tier.price.monthly }}</span>
                <span class="text-sm/6 font-semibold text-gray-600 dark:text-gray-400">/month</span>
              </p>
              <p class="mt-6 flex items-baseline gap-x-1 group-not-has-[[name=frequency][value=annually]:checked]/tiers:hidden">
                <span class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">{{ tier.price.annually }}</span>
                <span class="text-sm/6 font-semibold text-gray-600 dark:text-gray-400">/year</span>
              </p>
              <a :href="tier.href" :aria-describedby="tier.id" class="mt-6 block w-full rounded-md px-3 py-2 text-center text-sm/6 font-semibold text-indigo-600 inset-ring-1 inset-ring-indigo-200 group-data-featured/tier:bg-indigo-600 group-data-featured/tier:text-white group-data-featured/tier:shadow-xs group-data-featured/tier:inset-ring-0 hover:inset-ring-indigo-300 group-data-featured/tier:hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-white dark:inset-ring dark:inset-ring-white/5 dark:group-data-featured/tier:bg-indigo-500 dark:group-data-featured/tier:shadow-none dark:hover:bg-white/20 dark:hover:inset-ring-white/5 dark:group-data-featured/tier:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500 dark:group-not-data-featured/tier:focus-visible:outline-white/75">Buy plan</a>
              <ul role="list" class="mt-8 space-y-3 text-sm/6 text-gray-600 dark:text-gray-300">
                <li v-for="feature in tier.features" :key="feature" class="flex gap-x-3">
                  <CheckIcon class="h-6 w-5 flex-none text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>

      <!-- Logo cloud -->
      <div class="mx-auto mt-24 max-w-7xl px-6 sm:mt-32 lg:px-8">
        <div class="mx-auto grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-12 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 sm:gap-y-14 lg:mx-0 lg:max-w-none lg:grid-cols-5">
          <img class="col-span-2 max-h-12 w-full object-contain lg:col-span-1 dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/158x48/transistor-logo-gray-900.svg" alt="Transistor" width="158" height="48" />
          <img class="col-span-2 max-h-12 w-full object-contain not-dark:hidden lg:col-span-1" src="https://tailwindcss.com/plus-assets/img/logos/158x48/transistor-logo-white.svg" alt="Transistor" width="158" height="48" />

          <img class="col-span-2 max-h-12 w-full object-contain lg:col-span-1 dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/158x48/reform-logo-gray-900.svg" alt="Reform" width="158" height="48" />
          <img class="col-span-2 max-h-12 w-full object-contain not-dark:hidden lg:col-span-1" src="https://tailwindcss.com/plus-assets/img/logos/158x48/reform-logo-white.svg" alt="Reform" width="158" height="48" />

          <img class="col-span-2 max-h-12 w-full object-contain lg:col-span-1 dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/158x48/tuple-logo-gray-900.svg" alt="Tuple" width="158" height="48" />
          <img class="col-span-2 max-h-12 w-full object-contain not-dark:hidden lg:col-span-1" src="https://tailwindcss.com/plus-assets/img/logos/158x48/tuple-logo-white.svg" alt="Tuple" width="158" height="48" />

          <img class="col-span-2 max-h-12 w-full object-contain sm:col-start-2 lg:col-span-1 dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/158x48/savvycal-logo-gray-900.svg" alt="SavvyCal" width="158" height="48" />
          <img class="col-span-2 max-h-12 w-full object-contain not-dark:hidden sm:col-start-2 lg:col-span-1" src="https://tailwindcss.com/plus-assets/img/logos/158x48/savvycal-logo-white.svg" alt="SavvyCal" width="158" height="48" />

          <img class="col-span-2 col-start-2 max-h-12 w-full object-contain sm:col-start-auto lg:col-span-1 dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/158x48/statamic-logo-gray-900.svg" alt="Statamic" width="158" height="48" />
          <img class="col-span-2 col-start-2 max-h-12 w-full object-contain not-dark:hidden sm:col-start-auto lg:col-span-1" src="https://tailwindcss.com/plus-assets/img/logos/158x48/statamic-logo-white.svg" alt="Statamic" width="158" height="48" />
        </div>
        <div class="mt-16 flex justify-center">
          <p class="relative rounded-full bg-gray-50 px-4 py-1.5 text-sm/6 text-gray-600 inset-ring inset-ring-gray-900/5 dark:bg-gray-800/75 dark:text-gray-400 dark:inset-ring-white/10">
            <span class="hidden md:inline">Transistor saves up to $40,000 per year, per employee by working with us.</span>
            <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"><span class="absolute inset-0" aria-hidden="true"></span> See our case study <span aria-hidden="true">&rarr;</span></a>
          </p>
        </div>
      </div>

      <!-- Testimonial section -->
      <div class="mx-auto mt-24 max-w-7xl sm:mt-56 sm:px-6 lg:px-8">
        <div class="relative overflow-hidden bg-gray-900 px-6 py-20 shadow-xl sm:rounded-3xl sm:px-10 sm:py-24 md:px-12 lg:px-20 dark:bg-black dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:inset-ring dark:after:inset-ring-white/10 dark:after:sm:rounded-3xl">
          <img class="absolute inset-0 size-full object-cover brightness-150 saturate-0" src="https://images.unsplash.com/photo-1601381718415-a05fb0a261f3?ixid=MXwxMjA3fDB8MHxwcm9maWxlLXBhZ2V8ODl8fHxlbnwwfHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1216&q=80" alt="" />
          <div class="absolute inset-0 bg-gray-900/90 mix-blend-multiply"></div>
          <div class="absolute -top-56 -left-80 transform-gpu blur-3xl" aria-hidden="true">
            <div class="aspect-1097/845 w-274.25 bg-linear-to-r from-[#ff4694] to-[#776fff] opacity-[0.45] dark:opacity-[0.30]" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"></div>
          </div>
          <div class="hidden md:absolute md:bottom-16 md:left-200 md:block md:transform-gpu md:blur-3xl" aria-hidden="true">
            <div class="aspect-1097/845 w-274.25 bg-linear-to-r from-[#ff4694] to-[#776fff] opacity-25 dark:opacity-20" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"></div>
          </div>
          <div class="relative mx-auto max-w-2xl lg:mx-0">
            <img class="h-12 w-auto dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/workcation-logo-white.svg" alt="" />
            <img class="h-12 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/workcation-logo-white.svg" alt="" />
            <figure>
              <blockquote class="mt-6 text-lg font-semibold text-white sm:text-xl/8">
                <p>“Lorem ipsum dolor sit amet consectetur adipisicing elit. Nemo expedita voluptas culpa sapiente alias molestiae. Numquam corrupti in laborum sed rerum et corporis.”</p>
              </blockquote>
              <figcaption class="mt-6 text-base text-white dark:text-gray-200">
                <div class="font-semibold">Judith Black</div>
                <div class="mt-1">CEO of Workcation</div>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>

      <!-- FAQ section -->
      <div class="mx-auto mt-24 max-w-7xl px-6 sm:mt-56 lg:px-8">
        <div class="mx-auto max-w-4xl">
          <h2 class="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">Frequently asked questions</h2>
          <dl class="mt-16 divide-y divide-gray-900/10 dark:divide-white/10">
            <Disclosure as="div" v-for="faq in faqs" :key="faq.question" class="py-6 first:pt-0 last:pb-0" v-slot="{ open }">
              <dt>
                <DisclosureButton class="flex w-full items-start justify-between text-left text-gray-900 dark:text-white">
                  <span class="text-base/7 font-semibold">{{ faq.question }}</span>
                  <span class="ml-6 flex h-7 items-center">
                    <PlusSmallIcon v-if="!open" class="size-6" aria-hidden="true" />
                    <MinusSmallIcon v-else class="size-6" aria-hidden="true" />
                  </span>
                </DisclosureButton>
              </dt>
              <DisclosurePanel as="dd" class="mt-2 pr-12">
                <p class="text-base/7 text-gray-600 dark:text-gray-400">{{ faq.answer }}</p>
              </DisclosurePanel>
            </Disclosure>
          </dl>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="mx-auto max-w-7xl px-6 pt-24 pb-8 sm:pt-56 lg:px-8">
      <div class="border-t border-gray-900/10 pt-24 dark:border-white/10">
        <div class="xl:grid xl:grid-cols-3 xl:gap-8">
          <img class="h-9 dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Company name" />
          <img class="h-9 not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Company name" />
          <div class="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div class="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 class="text-sm/6 font-semibold text-gray-900 dark:text-white">Solutions</h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li v-for="item in footerNavigation.solutions" :key="item.name">
                    <a :href="item.href" class="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{{ item.name }}</a>
                  </li>
                </ul>
              </div>
              <div class="mt-10 md:mt-0">
                <h3 class="text-sm/6 font-semibold text-gray-900 dark:text-white">Support</h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li v-for="item in footerNavigation.support" :key="item.name">
                    <a :href="item.href" class="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{{ item.name }}</a>
                  </li>
                </ul>
              </div>
            </div>
            <div class="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 class="text-sm/6 font-semibold text-gray-900 dark:text-white">Company</h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li v-for="item in footerNavigation.company" :key="item.name">
                    <a :href="item.href" class="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{{ item.name }}</a>
                  </li>
                </ul>
              </div>
              <div class="mt-10 md:mt-0">
                <h3 class="text-sm/6 font-semibold text-gray-900 dark:text-white">Legal</h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li v-for="item in footerNavigation.legal" :key="item.name">
                    <a :href="item.href" class="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{{ item.name }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Dialog, DialogPanel, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { Bars3Icon, MinusSmallIcon, PlusSmallIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { CheckIcon } from '@heroicons/vue/20/solid'

const navigation = [
  { name: 'Product', href: '#' },
  { name: 'Features', href: '#' },
  { name: 'Marketplace', href: '#' },
  { name: 'Company', href: '#' },
]
const pricing = {
  tiers: [
    {
      name: 'Hobby',
      id: 'hobby',
      price: { monthly: '$19', annually: '$199' },
      description: 'The essentials to provide your best work for clients.',
      features: ['5 products', 'Up to 1,000 subscribers', 'Basic analytics'],
      featured: false,
    },
    {
      name: 'Freelancer',
      id: 'freelancer',
      price: { monthly: '$29', annually: '$299' },
      description: 'The essentials to provide your best work for clients.',
      features: ['5 products', 'Up to 1,000 subscribers', 'Basic analytics', '48-hour support response time'],
      featured: false,
    },
    {
      name: 'Startup',
      id: 'startup',
      price: { monthly: '$59', annually: '$599' },
      description: 'A plan that scales with your rapidly growing business.',
      features: [
        '25 products',
        'Up to 10,000 subscribers',
        'Advanced analytics',
        '24-hour support response time',
        'Marketing automations',
      ],
      featured: true,
    },
    {
      name: 'Enterprise',
      id: 'enterprise',
      price: { monthly: '$99', annually: '$999' },
      description: 'Dedicated support and infrastructure for your company.',
      features: [
        'Unlimited products',
        'Unlimited subscribers',
        'Advanced analytics',
        '1-hour, dedicated support response time',
        'Marketing automations',
        'Custom reporting tools',
      ],
      featured: false,
    },
  ],
}
const faqs = [
  {
    question: "What's the best thing about Switzerland?",
    answer:
      "I don't know, but the flag is a big plus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    question: 'How do you make holy water?',
    answer:
      'You boil the hell out of it. Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam aut tempora vitae odio inventore fuga aliquam nostrum quod porro. Delectus quia facere id sequi expedita natus.',
  },
  {
    question: 'What do you call someone with no body and no nose?',
    answer:
      'Nobody knows. Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa, voluptas ipsa quia excepturi, quibusdam natus exercitationem sapiente tempore labore voluptatem.',
  },
  {
    question: 'Why do you never see elephants hiding in trees?',
    answer:
      "Because they're so good at it. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    question: "Why can't you hear a pterodactyl go to the bathroom?",
    answer:
      'Because the pee is silent. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ipsam, quas voluptatibus ex culpa ipsum, aspernatur blanditiis fugiat ullam magnam suscipit deserunt illum natus facilis atque vero consequatur! Quisquam, debitis error.',
  },
  {
    question: 'Why did the invisible man turn down the job offer?',
    answer:
      "He couldn't see himself doing it. Lorem ipsum dolor sit, amet consectetur adipisicing elit. Eveniet perspiciatis officiis corrupti tenetur. Temporibus ut voluptatibus, perferendis sed unde rerum deserunt eius.",
  },
]
const footerNavigation = {
  solutions: [
    { name: 'Marketing', href: '#' },
    { name: 'Analytics', href: '#' },
    { name: 'Automation', href: '#' },
    { name: 'Commerce', href: '#' },
    { name: 'Insights', href: '#' },
  ],
  support: [
    { name: 'Submit ticket', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'Guides', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Jobs', href: '#' },
    { name: 'Press', href: '#' },
  ],
  legal: [
    { name: 'Terms of service', href: '#' },
    { name: 'Privacy policy', href: '#' },
    { name: 'License', href: '#' },
  ],
}

const mobileMenuOpen = ref(false)
</script>