<template>
  <div class="relative isolate bg-white dark:bg-gray-900">
    <div class="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
      <div class="relative px-6 pt-24 pb-20 sm:pt-32 lg:static lg:px-8 lg:py-48">
        <div class="mx-auto max-w-xl lg:mx-0 lg:max-w-lg">
          <div class="absolute inset-y-0 left-0 -z-10 w-full overflow-hidden bg-gray-100 ring-1 ring-gray-900/10 lg:w-1/2 dark:bg-gray-900 dark:ring-white/10">
            <svg class="absolute inset-0 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-gray-200 dark:stroke-white/10" aria-hidden="true">
              <defs>
                <pattern id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527" width="200" height="200" x="100%" y="-1" patternUnits="userSpaceOnUse">
                  <path d="M130 200V.5M.5 .5H200" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" stroke-width="0" class="fill-white dark:fill-gray-900" />
              <svg x="100%" y="-1" class="overflow-visible fill-gray-50 dark:fill-gray-800/20">
                <path d="M-470.5 0h201v201h-201Z" stroke-width="0" />
              </svg>
              <rect width="100%" height="100%" stroke-width="0" fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)" />
            </svg>
            <div class="absolute top-[calc(100%-13rem)] -left-56 hidden transform-gpu blur-3xl lg:top-[calc(50%-7rem)] lg:left-[max(-14rem,calc(100%-59rem))] dark:block" aria-hidden="true">
              <div class="aspect-1155/678 w-288.75 bg-linear-to-br from-[#80caff] to-[#4f46e5] opacity-10 dark:opacity-20" style="clip-path: polygon(74.1% 56.1%, 100% 38.6%, 97.5% 73.3%, 85.5% 100%, 80.7% 98.2%, 72.5% 67.7%, 60.2% 37.8%, 52.4% 32.2%, 47.5% 41.9%, 45.2% 65.8%, 27.5% 23.5%, 0.1% 35.4%, 17.9% 0.1%, 27.6% 23.5%, 76.1% 2.6%, 74.1% 56.1%)"></div>
            </div>
          </div>
          <h2 class="text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl dark:text-white">Get in touch</h2>
          <p class="mt-6 text-lg/8 text-gray-600 dark:text-gray-400">Proin volutpat consequat porttitor cras nullam gravida at. Orci molestie a eu arcu. Sed ut tincidunt integer elementum id sem. Arcu sed malesuada et magna.</p>
          <dl class="mt-10 space-y-4 text-base/7 text-gray-600 dark:text-gray-300">
            <div class="flex gap-x-4">
              <dt class="flex-none">
                <span class="sr-only">Address</span>
                <BuildingOffice2Icon class="h-7 w-6 text-gray-400" aria-hidden="true" />
              </dt>
              <dd>545 Mavis Island<br />Chicago, IL 99191</dd>
            </div>
            <div class="flex gap-x-4">
              <dt class="flex-none">
                <span class="sr-only">Telephone</span>
                <PhoneIcon class="h-7 w-6 text-gray-400" aria-hidden="true" />
              </dt>
              <dd><a class="hover:text-gray-900 dark:hover:text-white" href="tel:+1 (555) 234-5678">+1 (555) 234-5678</a></dd>
            </div>
            <div class="flex gap-x-4">
              <dt class="flex-none">
                <span class="sr-only">Email</span>
                <EnvelopeIcon class="h-7 w-6 text-gray-400" aria-hidden="true" />
              </dt>
              <dd><a class="hover:text-gray-900 dark:hover:text-white" href="mailto:hello@example.com">hello@example.com</a></dd>
            </div>
          </dl>
        </div>
      </div>
      <form action="#" method="POST" class="px-6 pt-20 pb-24 sm:pb-32 lg:px-8 lg:py-48">
        <div class="mx-auto max-w-xl lg:mr-0 lg:max-w-lg">
          <div class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            <div>
              <label for="first-name" class="block text-sm/6 font-semibold text-gray-900 dark:text-white">First name</label>
              <div class="mt-2.5">
                <input type="text" name="first-name" id="first-name" autocomplete="given-name" class="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
              </div>
            </div>
            <div>
              <label for="last-name" class="block text-sm/6 font-semibold text-gray-900 dark:text-white">Last name</label>
              <div class="mt-2.5">
                <input type="text" name="last-name" id="last-name" autocomplete="family-name" class="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="email" class="block text-sm/6 font-semibold text-gray-900 dark:text-white">Email</label>
              <div class="mt-2.5">
                <input type="email" name="email" id="email" autocomplete="email" class="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="phone-number" class="block text-sm/6 font-semibold text-gray-900 dark:text-white">Phone number</label>
              <div class="mt-2.5">
                <input type="tel" name="phone-number" id="phone-number" autocomplete="tel" class="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label for="message" class="block text-sm/6 font-semibold text-gray-900 dark:text-white">Message</label>
              <div class="mt-2.5">
                <textarea name="message" id="message" rows="4" class="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"></textarea>
              </div>
            </div>
          </div>
          <div class="mt-8 flex justify-end">
            <button type="submit" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Send message</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { BuildingOffice2Icon, EnvelopeIcon, PhoneIcon } from '@heroicons/vue/24/outline'
</script>