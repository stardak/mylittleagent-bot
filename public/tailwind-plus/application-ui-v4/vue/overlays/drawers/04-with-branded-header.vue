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
                  <div class="relative flex h-full flex-col overflow-y-auto bg-white shadow-xl dark:bg-gray-800 dark:after:absolute dark:after:inset-y-0 dark:after:left-0 dark:after:w-px dark:after:bg-white/10">
                    <div class="bg-indigo-700 px-4 py-6 sm:px-6 dark:bg-indigo-800">
                      <div class="flex items-center justify-between">
                        <DialogTitle class="text-base font-semibold text-white">Panel title</DialogTitle>
                        <div class="ml-3 flex h-7 items-center">
                          <button type="button" class="relative rounded-md text-indigo-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-indigo-300 dark:hover:text-white" @click="open = false">
                            <span class="absolute -inset-2.5"></span>
                            <span class="sr-only">Close panel</span>
                            <XMarkIcon class="size-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div class="mt-1">
                        <p class="text-sm text-indigo-300 dark:text-indigo-200">Lorem, ipsum dolor sit amet consectetur adipisicing elit aliquam ad hic recusandae soluta.</p>
                      </div>
                    </div>
                    <div class="relative flex-1 px-4 py-6 sm:px-6">
                      <!-- Your content -->
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
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const open = ref(true)
</script>