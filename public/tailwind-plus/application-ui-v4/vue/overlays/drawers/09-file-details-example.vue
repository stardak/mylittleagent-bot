<template>
  <div>
    <button class="rounded-md bg-gray-950/5 px-2.5 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-950/10 dark:bg-white/10 dark:text-white dark:inset-ring dark:inset-ring-white/5 dark:hover:bg-white/20" @click="open = true">Open drawer</button>
    <TransitionRoot as="template" :show="open">
      <Dialog class="relative z-10" @close="open = false">
        <TransitionChild as="template" enter="ease-in-out duration-500" enter-from="opacity-0" enter-to="" leave="ease-in-out duration-500" leave-from="" leave-to="opacity-0">
          <div class="fixed inset-0 bg-gray-500/75 transition-opacity dark:bg-gray-900/50"></div>
        </TransitionChild>

        <div class="fixed inset-0 overflow-hidden">
          <div class="absolute inset-0 overflow-hidden">
            <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <TransitionChild as="template" enter="transform transition ease-in-out duration-500 sm:duration-700" enter-from="translate-x-full" enter-to="translate-x-0" leave="transform transition ease-in-out duration-500 sm:duration-700" leave-from="translate-x-0" leave-to="translate-x-full">
                <DialogPanel class="pointer-events-auto relative w-96">
                  <TransitionChild as="template" enter="ease-in-out duration-500" enter-from="opacity-0" enter-to="" leave="ease-in-out duration-500" leave-from="" leave-to="opacity-0">
                    <div class="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
                      <button type="button" class="relative rounded-md text-gray-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-400 dark:hover:text-white dark:focus-visible:outline-indigo-500" @click="open = false">
                        <span class="absolute -inset-2.5"></span>
                        <span class="sr-only">Close panel</span>
                        <XMarkIcon class="size-6" aria-hidden="true" />
                      </button>
                    </div>
                  </TransitionChild>
                  <div class="relative h-full overflow-y-auto bg-white p-8 dark:bg-gray-800 dark:after:absolute dark:after:inset-y-0 dark:after:left-0 dark:after:w-px dark:after:bg-white/10">
                    <div class="space-y-6 pb-16">
                      <div>
                        <img src="https://images.unsplash.com/photo-1582053433976-25c00369fc93?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=512&q=80" alt="" class="block aspect-10/7 w-full rounded-lg bg-gray-100 object-cover outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" />
                        <div class="mt-4 flex items-start justify-between">
                          <div>
                            <h2 class="text-base font-semibold text-gray-900 dark:text-white"><span class="sr-only">Details for </span>IMG_4985.HEIC</h2>
                            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">3.9 MB</p>
                          </div>
                          <button type="button" class="relative ml-4 flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-indigo-500">
                            <span class="absolute -inset-1.5"></span>
                            <HeartIcon class="size-6" aria-hidden="true" />
                            <span class="sr-only">Favorite</span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <h3 class="font-medium text-gray-900 dark:text-white">Information</h3>
                        <dl class="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200 dark:divide-white/10 dark:border-white/10">
                          <div class="flex justify-between py-3 text-sm font-medium">
                            <dt class="text-gray-500 dark:text-gray-400">Uploaded by</dt>
                            <dd class="text-gray-900 dark:text-white">Marie Culver</dd>
                          </div>
                          <div class="flex justify-between py-3 text-sm font-medium">
                            <dt class="text-gray-500 dark:text-gray-400">Created</dt>
                            <dd class="text-gray-900 dark:text-white">June 8, 2020</dd>
                          </div>
                          <div class="flex justify-between py-3 text-sm font-medium">
                            <dt class="text-gray-500 dark:text-gray-400">Last modified</dt>
                            <dd class="text-gray-900 dark:text-white">June 8, 2020</dd>
                          </div>
                          <div class="flex justify-between py-3 text-sm font-medium">
                            <dt class="text-gray-500 dark:text-gray-400">Dimensions</dt>
                            <dd class="text-gray-900 dark:text-white">4032 x 3024</dd>
                          </div>
                          <div class="flex justify-between py-3 text-sm font-medium">
                            <dt class="text-gray-500 dark:text-gray-400">Resolution</dt>
                            <dd class="text-gray-900 dark:text-white">72 x 72</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h3 class="font-medium text-gray-900 dark:text-white">Description</h3>
                        <div class="mt-2 flex items-center justify-between">
                          <p class="text-sm text-gray-500 italic dark:text-gray-400">Add a description to this image.</p>
                          <button type="button" class="relative -mr-2 flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-indigo-500">
                            <span class="absolute -inset-1.5"></span>
                            <PencilIcon class="size-5" aria-hidden="true" />
                            <span class="sr-only">Add description</span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <h3 class="font-medium text-gray-900 dark:text-white">Shared with</h3>
                        <ul role="list" class="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200 dark:divide-white/10 dark:border-white/10">
                          <li class="flex items-center justify-between py-3">
                            <div class="flex items-center">
                              <img src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=1024&h=1024&q=80" alt="" class="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" />
                              <p class="ml-4 text-sm font-medium text-gray-900 dark:text-white">Aimee Douglas</p>
                            </div>
                            <button type="button" class="ml-6 rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 dark:focus-visible:outline-indigo-500">Remove<span class="sr-only"> Aimee Douglas</span></button>
                          </li>
                          <li class="flex items-center justify-between py-3">
                            <div class="flex items-center">
                              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixqx=oilqXxSqey&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" class="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" />
                              <p class="ml-4 text-sm font-medium text-gray-900 dark:text-white">Andrea McMillan</p>
                            </div>
                            <button type="button" class="ml-6 rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 dark:focus-visible:outline-indigo-500">Remove<span class="sr-only"> Andrea McMillan</span></button>
                          </li>
                          <li class="flex items-center justify-between py-2">
                            <button type="button" class="group -ml-1 flex items-center rounded-md p-1 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500">
                              <span class="flex size-8 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 dark:border-white/20">
                                <PlusIcon class="size-5" aria-hidden="true" />
                              </span>
                              <span class="ml-4 text-sm font-medium text-indigo-600 group-hover:text-indigo-500 dark:text-indigo-400 dark:group-hover:text-indigo-300">Share</span>
                            </button>
                          </li>
                        </ul>
                      </div>
                      <div class="flex">
                        <button type="button" class="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Download</button>
                        <button type="button" class="ml-3 flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20">Delete</button>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { HeartIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { PencilIcon, PlusIcon } from '@heroicons/vue/20/solid'

const open = ref(true)
</script>