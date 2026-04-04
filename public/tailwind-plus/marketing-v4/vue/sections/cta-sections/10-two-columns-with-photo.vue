<template>
  <div class="overflow-hidden bg-white py-24 sm:py-32 dark:bg-gray-900">
    <div class="relative isolate">
      <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="mx-auto flex max-w-2xl flex-col gap-16 bg-white/75 px-6 py-16 shadow-lg ring-1 ring-gray-900/5 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-20 xl:gap-x-20 xl:px-20 dark:bg-white/3 dark:shadow-none dark:ring-white/10">
          <img class="h-96 w-full flex-none rounded-2xl object-cover shadow-none lg:aspect-square lg:h-auto lg:max-w-sm dark:shadow-xl" src="https://images.unsplash.com/photo-1519338381761-c7523edc1f46?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80" alt="" />
          <div class="w-full flex-auto">
            <h2 class="text-4xl font-semibold tracking-tight text-pretty text-gray-950 sm:text-5xl dark:text-white">Join our team</h2>
            <p class="mt-6 text-lg/8 text-pretty text-gray-600 dark:text-gray-400">Lorem ipsum dolor sit amet consect adipisicing elit. Possimus magnam voluptatum cupiditate veritatis in accusamus quisquam.</p>
            <ul role="list" class="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 text-base/7 text-gray-950 sm:grid-cols-2 dark:text-gray-200">
              <li v-for="benefit in benefits" :key="benefit" class="flex gap-x-3">
                <CheckCircleIcon class="h-7 w-5 flex-none text-indigo-500 dark:text-gray-200" aria-hidden="true" />
                {{ benefit }}
              </li>
            </ul>
            <div class="mt-10 flex">
              <a href="#" class="text-sm/6 font-semibold text-indigo-600 hover:text-indigo-300 dark:text-indigo-400 dark:hover:text-indigo-300">
                See our job postings
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl" aria-hidden="true">
        <div class="aspect-1318/752 w-329.5 flex-none bg-linear-to-r from-[#9fd6fc] to-[#8680fd] opacity-50 dark:from-[#80caff] dark:to-[#4f46e5] dark:opacity-20" style="clip-path: polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CheckCircleIcon } from '@heroicons/vue/20/solid'

const benefits = [
  'Competitive salaries',
  'Flexible work hours',
  '30 days of paid vacation',
  'Annual team retreats',
  'Benefits for you and your family',
  'A great work environment',
]
</script>