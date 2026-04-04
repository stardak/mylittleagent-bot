<template>
  <div>
    <button class="rounded-md bg-gray-950/5 px-2.5 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-950/10 dark:bg-white/10 dark:text-white dark:inset-ring dark:inset-ring-white/5 dark:hover:bg-white/20" @click="open = true">Open drawer</button>
    <TransitionRoot as="template" :show="open">
      <Dialog class="relative z-10" @close="open = false">
        <div class="fixed inset-0"></div>

        <div class="fixed inset-0 overflow-hidden">
          <div class="absolute inset-0 overflow-hidden">
            <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <TransitionChild as="template" enter="transform transition ease-in-out duration-500 sm:duration-700" enter-from="translate-x-full" enter-to="translate-x-0" leave="transform transition ease-in-out duration-500 sm:duration-700" leave-from="translate-x-0" leave-to="translate-x-full">
                <DialogPanel class="pointer-events-auto w-screen max-w-md">
                  <form class="relative flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl dark:divide-white/10 dark:bg-gray-800 dark:after:absolute dark:after:inset-y-0 dark:after:left-0 dark:after:w-px dark:after:bg-white/10">
                    <div class="h-0 flex-1 overflow-y-auto">
                      <div class="bg-indigo-700 px-4 py-6 sm:px-6 dark:bg-indigo-800">
                        <div class="flex items-center justify-between">
                          <DialogTitle class="text-base font-semibold text-white">New project</DialogTitle>
                          <div class="ml-3 flex h-7 items-center">
                            <button type="button" class="relative rounded-md text-indigo-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-indigo-300 dark:hover:text-white" @click="open = false">
                              <span class="absolute -inset-2.5"></span>
                              <span class="sr-only">Close panel</span>
                              <XMarkIcon class="size-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <div class="mt-1">
                          <p class="text-sm text-indigo-300">Get started by filling in the information below to create your new project.</p>
                        </div>
                      </div>
                      <div class="flex flex-1 flex-col justify-between">
                        <div class="divide-y divide-gray-200 px-4 sm:px-6 dark:divide-white/10">
                          <div class="space-y-6 pt-6 pb-5">
                            <div>
                              <label for="project-name" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">Project name</label>
                              <div class="mt-2">
                                <input type="text" name="project-name" id="project-name" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
                              </div>
                            </div>
                            <div>
                              <label for="project-description" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">Description</label>
                              <div class="mt-2">
                                <textarea rows="3" name="project-description" id="project-description" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"></textarea>
                              </div>
                            </div>
                            <div>
                              <h3 class="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Team Members</h3>
                              <div class="mt-2">
                                <div class="flex space-x-2">
                                  <a v-for="person in team" :key="person.email" :href="person.href" class="relative rounded-full hover:opacity-75">
                                    <img class="inline-block size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" :src="person.imageUrl" :alt="person.name" />
                                  </a>
                                  <button type="button" class="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/20 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-white/30 dark:hover:text-gray-200 dark:focus-visible:outline-indigo-500">
                                    <span class="absolute -inset-2"></span>
                                    <span class="sr-only">Add team member</span>
                                    <PlusIcon class="size-5" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <fieldset>
                              <legend class="text-sm/6 font-medium text-gray-900 dark:text-gray-100">Privacy</legend>
                              <div class="mt-2 space-y-4">
                                <div class="relative flex items-start">
                                  <div class="absolute flex h-6 items-center">
                                    <input id="privacy-public" name="privacy" value="public" aria-describedby="privacy-public-description" type="radio" checked="" class="relative size-4 appearance-none rounded-full border border-gray-300 before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 dark:border-white/20 dark:bg-black/10 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500 dark:disabled:border-white/10 dark:disabled:bg-gray-800 dark:disabled:before:bg-white/20 forced-colors:appearance-auto forced-colors:before:hidden" />
                                  </div>
                                  <div class="pl-7 text-sm/6">
                                    <label for="privacy-public" class="font-medium text-gray-900 dark:text-gray-100">Public access</label>
                                    <p id="privacy-public-description" class="text-gray-500 dark:text-gray-400">Everyone with the link will see this project.</p>
                                  </div>
                                </div>
                                <div>
                                  <div class="relative flex items-start">
                                    <div class="absolute flex h-6 items-center">
                                      <input id="privacy-private-to-project" name="privacy" value="private-to-project" aria-describedby="privacy-private-to-project-description" type="radio" class="relative size-4 appearance-none rounded-full border border-gray-300 before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 dark:border-white/20 dark:bg-black/10 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500 dark:disabled:border-white/10 dark:disabled:bg-gray-800 dark:disabled:before:bg-white/20 forced-colors:appearance-auto forced-colors:before:hidden" />
                                    </div>
                                    <div class="pl-7 text-sm/6">
                                      <label for="privacy-private-to-project" class="font-medium text-gray-900 dark:text-gray-100">Private to project members</label>
                                      <p id="privacy-private-to-project-description" class="text-gray-500 dark:text-gray-400">Only members of this project would be able to access.</p>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div class="relative flex items-start">
                                    <div class="absolute flex h-6 items-center">
                                      <input id="privacy-private" name="privacy" value="private" aria-describedby="privacy-private-to-project-description" type="radio" class="relative size-4 appearance-none rounded-full border border-gray-300 before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 dark:border-white/20 dark:bg-black/10 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:focus-visible:outline-indigo-500 dark:disabled:border-white/10 dark:disabled:bg-gray-800 dark:disabled:before:bg-white/20 forced-colors:appearance-auto forced-colors:before:hidden" />
                                    </div>
                                    <div class="pl-7 text-sm/6">
                                      <label for="privacy-private" class="font-medium text-gray-900 dark:text-gray-100">Private to you</label>
                                      <p id="privacy-private-description" class="text-gray-500 dark:text-gray-400">You are the only one able to access this project.</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </fieldset>
                          </div>
                          <div class="pt-4 pb-6">
                            <div class="flex text-sm">
                              <a href="#" class="group inline-flex items-center font-medium text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                <LinkIcon class="size-5 text-indigo-500 group-hover:text-indigo-900 dark:text-indigo-400 dark:group-hover:text-indigo-300" aria-hidden="true" />
                                <span class="ml-2">Copy link</span>
                              </a>
                            </div>
                            <div class="mt-4 flex text-sm">
                              <a href="#" class="group inline-flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-gray-200">
                                <QuestionMarkCircleIcon class="size-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-300" aria-hidden="true" />
                                <span class="ml-2">Learn more about sharing</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="flex shrink-0 justify-end px-4 py-4">
                      <button type="button" class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20" @click="open = false">Cancel</button>
                      <button type="submit" class="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Save</button>
                    </div>
                  </form>
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
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { LinkIcon, PlusIcon, QuestionMarkCircleIcon } from '@heroicons/vue/20/solid'

const team = [
  {
    name: 'Tom Cook',
    email: 'tom.cook@example.com',
    href: '#',
    imageUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Whitney Francis',
    email: 'whitney.francis@example.com',
    href: '#',
    imageUrl:
      'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Leonard Krasner',
    email: 'leonard.krasner@example.com',
    href: '#',
    imageUrl:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Floyd Miles',
    email: 'floyd.miles@example.com',
    href: '#',
    imageUrl:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Emily Selman',
    email: 'emily.selman@example.com',
    href: '#',
    imageUrl:
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
]

const open = ref(true)
</script>