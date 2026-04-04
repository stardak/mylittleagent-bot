<template>
  <TransitionRoot :show="open" as="template" @after-leave="query = ''" appear>
    <Dialog class="relative z-10" @close="open = false">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="" leave="ease-in duration-200" leave-from="" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-500/25 transition-opacity dark:bg-gray-900/50" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 scale-95" enter-to=" scale-100" leave="ease-in duration-200" leave-from=" scale-100" leave-to="opacity-0 scale-95">
          <DialogPanel class="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl outline-1 outline-black/5 transition-all dark:divide-white/10 dark:bg-gray-900 dark:-outline-offset-1 dark:outline-white/10">
            <Combobox @update:modelValue="onSelect">
              <div class="grid grid-cols-1">
                <ComboboxInput class="col-start-1 row-start-1 h-12 w-full pr-4 pl-11 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500" placeholder="Search..." @change="query = $event.target.value" @blur="query = ''" />
                <MagnifyingGlassIcon class="pointer-events-none col-start-1 row-start-1 ml-4 size-5 self-center text-gray-400 dark:text-gray-500" aria-hidden="true" />
              </div>

              <ComboboxOptions v-if="filteredItems.length > 0" static class="max-h-96 transform-gpu scroll-py-3 overflow-y-auto p-3">
                <ComboboxOption v-for="item in filteredItems" :key="item.id" :value="item" as="template" v-slot="{ active }">
                  <li :class="['flex cursor-default rounded-xl p-3 select-none', active && 'bg-gray-100 outline-hidden dark:bg-white/5']">
                    <div :class="['flex size-10 flex-none items-center justify-center rounded-lg', item.color]">
                      <component :is="item.icon" class="size-6 text-white" aria-hidden="true" />
                    </div>
                    <div class="ml-4 flex-auto">
                      <p :class="['text-sm font-medium', active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200']">
                        {{ item.name }}
                      </p>
                      <p :class="['text-sm', active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400']">
                        {{ item.description }}
                      </p>
                    </div>
                  </li>
                </ComboboxOption>
              </ComboboxOptions>

              <div v-if="query !== '' && filteredItems.length === 0" class="px-6 py-14 text-center text-sm sm:px-14">
                <ExclamationCircleIcon type="outline" name="exclamation-circle" class="mx-auto size-6 text-gray-400 dark:text-gray-500" />
                <p class="mt-4 font-semibold text-gray-900 dark:text-white">No results found</p>
                <p class="mt-2 text-gray-500 dark:text-gray-400">No components found for this search term. Please try again.</p>
              </div>
            </Combobox>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { computed, ref } from 'vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/20/solid'
import {
  CalendarIcon,
  CodeBracketIcon,
  DocumentIcon,
  ExclamationCircleIcon,
  LinkIcon,
  PencilSquareIcon,
  PhotoIcon,
  TableCellsIcon,
  VideoCameraIcon,
  ViewColumnsIcon,
  Bars4Icon,
} from '@heroicons/vue/24/outline'
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'

const items = [
  {
    id: 1,
    name: 'Text',
    description: 'Add freeform text with basic formatting options.',
    url: '#',
    color: 'bg-indigo-500',
    icon: PencilSquareIcon,
  },
  // More items...
]

const open = ref(true)
const query = ref('')
const filteredItems = computed(() =>
  query.value === ''
    ? []
    : items.filter((item) => {
        return item.name.toLowerCase().includes(query.value.toLowerCase())
      }),
)

function onSelect(item) {
  if (item) {
    window.location = item.url
  }
}
</script>