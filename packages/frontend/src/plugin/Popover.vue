<template>
  <div
    v-if="popoverState.isVisible"
    class="fixed inset-0 flex items-center justify-center z-50"
  >
    <div class="absolute inset-0 bg-black opacity-70"></div>
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 relative z-10 min-w-96"
    >
      <div
        class="flex justify-center items-center text-gray-900 dark:text-gray-200 mb-5"
      >
        <span
          v-if="popoverState.icon"
          class="material-icons-outlined w-7 h12"
          >{{ popoverState.icon }}</span
        >
        <span class="text-xl font-semibold">{{ popoverState.title }}</span>
      </div>
      <div class="mb-10">
        <p class="text-gray-500 dark:text-gray-400 text-center">
          <span
            v-for="(msg, index) of popoverState.message.split('\n')"
            :key="index"
            >{{ msg }}<br
          /></span>
        </p>
      </div>
      <div class="mt-4 flex justify-center space-x-3">
        <div
          v-if="popoverState.btnThreeValue !== undefined"
          @click="resultValue(popoverState.btnThreeValue)"
          class="px-5 py-2 border rounded text-slate-600 border-gray-300 hover:bg-gray-200 dark:text-slate-200 dark:border-gray-600 dark:hover:bg-gray-700 flex cursor-pointer"
        >
          <span
            v-if="popoverState.btnThreeIcon"
            class="material-icons-outlined w-6 h-6 mr-2"
            >{{ popoverState.btnThreeIcon }}</span
          ><span>{{ popoverState.btnThreeText }}</span>
        </div>
        <div
          @click="resultValue(popoverState.btnTwoValue)"
          class="px-5 py-2 rounded text-slate-600 bg-gray-300 hover:bg-gray-400 dark:text-slate-200 dark:bg-gray-600 dark:hover:bg-gray-700 flex cursor-pointer"
        >
          <span
            v-if="popoverState.btnTwoIcon"
            class="material-icons-outlined w-6 h-6 mr-2"
            >{{ popoverState.btnTwoIcon }}</span
          ><span>{{ popoverState.btnTwoText }}</span>
        </div>
        <div
          @click="resultValue(popoverState.btnOneValue)"
          class="px-5 py-2 rounded flex text-slate-200 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
        >
          <span
            v-if="popoverState.btnOneIcon"
            class="material-icons-outlined w-6 h-6 mr-2"
            >{{ popoverState.btnOneIcon }}</span
          >
          {{ popoverState.btnOneText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
type PopoverState<
  OneValueType = true,
  TwoValueType = false,
  ThreeValueType = undefined
> = {
  title: string;
  message: string;
  icon?: string;
  btnOneText: string;
  btnOneIcon?: string;
  btnOneValue: OneValueType;

  btnTwoText: string;
  btnTwoIcon: string;
  btnTwoValue: TwoValueType;

  btnThreeText?: string;
  btnThreeIcon?: string;
  btnThreeValue?: ThreeValueType;

  isVisible: boolean;
  callback: (response: OneValueType | TwoValueType | ThreeValueType) => void;
};

const props = defineProps<{ popoverState: PopoverState }>();

function resultValue(response: any) {
  props.popoverState.callback(response);
}
</script>
