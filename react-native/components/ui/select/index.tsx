"use client";
import React from "react";
import { createSelect } from "@gluestack-ui/select";
import { Pressable, Text, View, FlatList, ScrollView } from "react-native";
import { tva } from "@gluestack-ui/nativewind-utils/tva";
import { withStyleContext, useStyleContext } from "@gluestack-ui/nativewind-utils/withStyleContext";
import { cssInterop } from "nativewind";
import type { VariantProps } from "@gluestack-ui/nativewind-utils";
import { PrimitiveIcon, UIIcon } from "@gluestack-ui/icon";

const SCOPE = "SELECT";

const UISelect = createSelect({
  Root: withStyleContext(View, SCOPE),
  Trigger: Pressable,
  Input: Text,
  Icon: UIIcon,
  Portal: View,
  Backdrop: Pressable,
  Content: View,
  DragIndicator: View,
  Item: Pressable,
  ItemText: Text,
  ScrollView,
  FlatList,
});

cssInterop(PrimitiveIcon, {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: "classNameColor",
      stroke: true,
    },
  },
});

const selectStyle = tva({ base: "w-full" });

const selectTriggerStyle = tva({
  base: "flex-row items-center justify-between rounded border border-background-300 px-3 h-10 bg-background-0",
});

const selectInputStyle = tva({ base: "text-typography-900" });

const selectBackdropStyle = tva({ base: "absolute left-0 top-0 right-0 bottom-0 bg-background-dark/50" });

const selectContentStyle = tva({ base: "rounded-xl bg-background-0 shadow-hard-4 p-2 w-full" });

const selectDragIndicatorStyle = tva({ base: "w-16 h-1 bg-background-400 rounded-full self-center my-2" });

const optionStyle = tva({ base: "px-3 py-2 rounded hover:bg-background-50 active:bg-background-100" });
const optionTextStyle = tva({ base: "text-typography-800" });

export type SelectProps = React.ComponentProps<typeof UISelect> & VariantProps<typeof selectStyle>;

const Select = React.forwardRef<React.ComponentRef<typeof UISelect>, SelectProps>(function Select(
  { className, ...props },
  ref
) {
  return (
    <UISelect
      {...props}
      ref={ref}
      className={selectStyle({ class: className })}
      components={{}}
    />
  );
});

const SelectTrigger = React.forwardRef<React.ComponentRef<typeof UISelect.Trigger>, React.ComponentProps<typeof UISelect.Trigger>>(
  function SelectTrigger({ className, ...props }, ref) {
    return <UISelect.Trigger ref={ref} {...props} className={selectTriggerStyle({ class: className })} />;
  }
);

const SelectInput = React.forwardRef<React.ComponentRef<typeof UISelect.Input>, React.ComponentProps<typeof UISelect.Input>>(
  function SelectInput({ className, ...props }, ref) {
    return <UISelect.Input ref={ref} {...props} className={selectInputStyle({ class: className })} />;
  }
);

const SelectIcon = UISelect.Icon;
const SelectPortal = UISelect.Portal;

const SelectBackdrop = React.forwardRef<React.ComponentRef<typeof UISelect.Backdrop>, React.ComponentProps<typeof UISelect.Backdrop>>(
  function SelectBackdrop({ className, ...props }, ref) {
    return <UISelect.Backdrop ref={ref} {...props} className={selectBackdropStyle({ class: className })} />;
  }
);

const SelectContent = React.forwardRef<React.ComponentRef<typeof UISelect.Content>, React.ComponentProps<typeof UISelect.Content>>(
  function SelectContent({ className, ...props }, ref) {
    return <UISelect.Content ref={ref} {...props} className={selectContentStyle({ class: className })} />;
  }
);

const SelectDragIndicator = React.forwardRef<React.ComponentRef<typeof UISelect.DragIndicator>, React.ComponentProps<typeof UISelect.DragIndicator>>(
  function SelectDragIndicator({ className, ...props }, ref) {
    return <UISelect.DragIndicator ref={ref} {...props} className={selectDragIndicatorStyle({ class: className })} />;
  }
);

const SelectFlatList = React.forwardRef<React.ComponentRef<typeof UISelect.FlatList>, React.ComponentProps<typeof UISelect.FlatList>>(
  function SelectFlatList({ className, ...props }, ref) {
    return <UISelect.FlatList ref={ref} {...props} className={className} />;
  }
);

const SelectScrollView = React.forwardRef<React.ComponentRef<typeof UISelect.ScrollView>, React.ComponentProps<typeof UISelect.ScrollView>>(
  function SelectScrollView({ className, ...props }, ref) {
    return <UISelect.ScrollView ref={ref} {...props} className={className} />;
  }
);

const SelectItem = React.forwardRef<React.ComponentRef<typeof UISelect.Item>, React.ComponentProps<typeof UISelect.Item>>(
  function SelectItem({ className, ...props }, ref) {
    return <UISelect.Item ref={ref} {...props} className={optionStyle({ class: className })} />;
  }
);

const SelectItemText = React.forwardRef<React.ComponentRef<typeof UISelect.ItemText>, React.ComponentProps<typeof UISelect.ItemText>>(
  function SelectItemText({ className, ...props }, ref) {
    return <UISelect.ItemText ref={ref} {...props} className={optionTextStyle({ class: className })} />;
  }
);

Select.displayName = "Select";
SelectTrigger.displayName = "SelectTrigger";
SelectInput.displayName = "SelectInput";
SelectBackdrop.displayName = "SelectBackdrop";
SelectContent.displayName = "SelectContent";
SelectDragIndicator.displayName = "SelectDragIndicator";
SelectFlatList.displayName = "SelectFlatList";
SelectScrollView.displayName = "SelectScrollView";
SelectPortal.displayName = "SelectPortal";
SelectItem.displayName = "SelectItem";
SelectItemText.displayName = "SelectItemText";

export {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectFlatList,
  SelectScrollView,
  SelectItem,
  SelectItemText,
};
