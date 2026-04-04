<template>
  <fieldset>
    <legend class="block text-sm/6 font-semibold text-gray-900 dark:text-white">Choose a label color</legend>
    <div class="mt-6 flex items-center gap-x-3">
      <div v-for="color in options" :key="color.id" class="flex rounded-full outline -outline-offset-1 outline-black/10">
        <input :aria-label="color.name" type="radio" name="color" :value="color.id" :checked="color === options[0]" :class="[color.classes, 'size-8 appearance-none rounded-full forced-color-adjust-none checked:outline-2 checked:outline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-3']" />
      </div>
    </div>
  </fieldset>
</template>

<script setup>
const options = [
  { id: 'pink', name: 'Pink', classes: 'bg-pink-500 checked:outline-pink-500' },
  { id: 'purple', name: 'Purple', classes: 'bg-purple-500 checked:outline-purple-500' },
  { id: 'blue', name: 'Blue', classes: 'bg-blue-500 checked:outline-blue-500' },
  { id: 'green', name: 'Green', classes: 'bg-green-500 checked:outline-green-500' },
  { id: 'yellow', name: 'Yellow', classes: 'bg-yellow-500 checked:outline-yellow-500' },
]
</script>