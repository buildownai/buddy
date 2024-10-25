import { type App, createApp, reactive } from "vue";
import Popover from "./Popover.vue";

type PopoverOptions<OneValueType, TwoValueType, ThreeValueType> = {
  title: string;
  message: string;
  icon?: string;
  btnOneText: string;
  btnOneIcon?: string;
  btnOneValue: OneValueType;

  btnTwoText: string;
  btnTwoIcon?: string;
  btnTwoValue: TwoValueType;

  btnThreeText?: string;
  btnThreeIcon?: string;
  btnThreeValue?: ThreeValueType;

  isVisible?: boolean;
  callback?: (response: OneValueType | TwoValueType | ThreeValueType) => void;
};

export default {
  install(app: App) {
    const popoverState = reactive<PopoverOptions<any, any, any>>({
      title: "",
      message: "",
      btnOneText: "Yes",
      btnOneValue: true,
      btnOneIcon: "check",
      btnTwoText: "No",
      btnTwoValue: false,
      btnTwoIcon: "not_interested",
      btnThreeText: undefined,
      btnThreeValue: undefined,
      btnThreeIcon: undefined,
      icon: "",
      isVisible: false,
      callback: (response: boolean) => {},
    });

    const showPopover = <One, Two, Three>(
      options: PopoverOptions<One, Two, Three>
    ): Promise<
      | PopoverOptions<One, Two, Three>["btnOneValue"]
      | PopoverOptions<One, Two, Three>["btnTwoValue"]
      | PopoverOptions<One, Two, Three>["btnThreeValue"]
    > => {
      return new Promise((resolve) => {
        popoverState.title = options.title || "Question";
        popoverState.message = options.message || "Are you sure?";
        popoverState.btnOneText = options.btnOneText || "Yes";
        popoverState.btnOneIcon = options.btnOneIcon || "check";
        popoverState.btnOneValue = options.btnOneValue;
        popoverState.btnTwoText = options.btnTwoText || "No";
        popoverState.btnTwoIcon = options.btnTwoIcon || "not_interested";
        popoverState.btnTwoValue = options.btnTwoValue;

        popoverState.btnThreeText = options.btnThreeText;
        popoverState.btnThreeIcon = options.btnThreeIcon;
        popoverState.btnThreeValue = options.btnThreeValue;

        popoverState.icon = options.icon || "";
        popoverState.isVisible = true;

        popoverState.callback = (
          response:
            | PopoverOptions<One, Two, Three>["btnOneValue"]
            | PopoverOptions<One, Two, Three>["btnTwoValue"]
            | PopoverOptions<One, Two, Three>["btnThreeValue"]
        ) => {
          resolve(response); // Resolve the promise when user clicks "true" or "false"
          popoverState.isVisible = false; // Hide the popover
        };
      });
    };

    app.config.globalProperties.$showPopover = showPopover as any;

    // Dynamically mount the Popover component
    const popoverInstance = createApp(Popover, { popoverState }).mount(
      document.createElement("div")
    );
    document.body.appendChild(popoverInstance.$el);
  },
};

declare module "vue" {
  interface ComponentCustomProperties {
    $showPopover: <One, Two, Three>(
      options: PopoverOptions<One, Two, Three>
    ) => Promise<One | Two | Three>;
  }
}
