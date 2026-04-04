<template>
  <!-- Global notification live region, render this permanently at the end of the document -->
  <div aria-live="assertive" class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6">
    <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
      <!-- Notification panel, dynamically insert this into the live region when it needs to be displayed -->
      <transition enter-active-class="transform ease-out duration-300 transition" enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2" enter-to-class="translate-y-0 sm:translate-x-0" leave-active-class="transition ease-in duration-100" leave-from-class="" leave-to-class="opacity-0">
        <div v-if="show" class="pointer-events-auto flex w-full max-w-md rounded-lg bg-white shadow-lg outline-1 outline-black/5 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10">
          <div class="w-0 flex-1 p-4">
            <div class="flex items-start">
              <div class="shrink-0 pt-0.5">
                <img class="size-10 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80" alt="" />
              </div>
              <div class="ml-3 w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Emilia Gates</p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Sure! 8:30pm works great!</p>
              </div>
            </div>
          </div>
          <div class="flex border-l border-gray-200 dark:border-white/10">
            <button type="button" @click="show = false" class="flex w-full items-center justify-center rounded-none rounded-r-lg p-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-2 focus:outline-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 dark:focus:outline-indigo-400">Reply</button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(true)
</script>