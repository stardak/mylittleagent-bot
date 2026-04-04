<template>
  <div class="flex items-start space-x-4">
    <div class="shrink-0">
      <img class="inline-block size-10 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
    </div>
    <div class="min-w-0 flex-1">
      <form action="#">
        <div class="border-b border-gray-200 pb-px focus-within:border-b-2 focus-within:border-indigo-600 focus-within:pb-0 dark:border-white/10 dark:focus-within:border-indigo-500">
          <label for="comment" class="sr-only">Add your comment</label>
          <textarea rows="3" name="comment" id="comment" class="block w-full resize-none text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:text-white dark:placeholder:text-gray-500" placeholder="Add your comment..."></textarea>
        </div>
        <div class="flex justify-between pt-2">
          <div class="flex items-center space-x-5">
            <div class="flow-root">
              <button type="button" class="-m-2 inline-flex size-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-white">
                <PaperClipIcon class="size-6" aria-hidden="true" />
                <span class="sr-only">Attach a file</span>
              </button>
            </div>
            <div class="flow-root">
              <Listbox as="div" v-model="selected">
                <ListboxLabel class="sr-only">Your mood</ListboxLabel>
                <div class="relative">
                  <ListboxButton class="relative -m-2.5 flex size-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-white">
                    <span class="flex items-center justify-center">
                      <span v-if="selected.value === null">
                        <FaceSmileIcon class="size-5 shrink-0" aria-hidden="true" />
                        <span class="sr-only">Add your mood</span>
                      </span>
                      <span v-if="!(selected.value === null)">
                        <span :class="[selected.bgColor, 'flex size-8 items-center justify-center rounded-full']">
                          <component :is="selected.icon" class="size-5 shrink-0 text-white" aria-hidden="true" />
                        </span>
                        <span class="sr-only">{{ selected.name }}</span>
                      </span>
                    </span>
                  </ListboxButton>

                  <transition leave-active-class="transition ease-in duration-100" leave-from-class="" leave-to-class="opacity-0">
                    <ListboxOptions class="absolute z-10 mt-1 -ml-6 w-60 rounded-lg bg-white py-3 text-base shadow-sm outline-1 outline-black/5 sm:ml-auto sm:w-64 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                      <ListboxOption as="template" v-for="mood in moods" :key="mood.value" :value="mood" v-slot="{ active }">
                        <li :class="[active ? 'bg-gray-100 dark:bg-white/5' : 'bg-white dark:bg-transparent', 'relative cursor-default px-3 py-2 text-gray-900 select-none dark:text-white']">
                          <div class="flex items-center">
                            <div :class="[mood.bgColor, 'flex size-8 items-center justify-center rounded-full']">
                              <component :is="mood.icon" :class="[mood.iconColor, 'size-5 shrink-0']" aria-hidden="true" />
                            </div>
                            <span class="ml-3 block truncate font-medium">{{ mood.name }}</span>
                          </div>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </transition>
                </div>
              </Listbox>
            </div>
          </div>
          <div class="shrink-0">
            <button type="submit" class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Post</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { PaperClipIcon } from '@heroicons/vue/24/outline'
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { FaceFrownIcon, FaceSmileIcon, FireIcon, HandThumbUpIcon, HeartIcon, XMarkIcon } from '@heroicons/vue/20/solid'

const moods = [
  { name: 'Excited', value: 'excited', icon: FireIcon, iconColor: 'text-white', bgColor: 'bg-red-500' },
  { name: 'Loved', value: 'loved', icon: HeartIcon, iconColor: 'text-white', bgColor: 'bg-pink-400' },
  { name: 'Happy', value: 'happy', icon: FaceSmileIcon, iconColor: 'text-white', bgColor: 'bg-green-400' },
  { name: 'Sad', value: 'sad', icon: FaceFrownIcon, iconColor: 'text-white', bgColor: 'bg-yellow-400' },
  { name: 'Thumbsy', value: 'thumbsy', icon: HandThumbUpIcon, iconColor: 'text-white', bgColor: 'bg-blue-500' },
  {
    name: 'I feel nothing',
    value: null,
    icon: XMarkIcon,
    iconColor: 'text-gray-400 dark:text-gray-500',
    bgColor: 'bg-transparent',
  },
]

const selected = ref(moods[5])
</script>