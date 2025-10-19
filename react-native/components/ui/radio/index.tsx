"use client";

import React from "react";
import { Pressable, Text, View } from "react-native";
import { PrimitiveIcon, UIIcon } from "@gluestack-ui/core/icon/creator";
import { createRadio } from "@gluestack-ui/core/radio/creator";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { tva, useStyleContext, withStyleContext } from "@gluestack-ui/utils/nativewind-utils";
import { cssInterop } from "nativewind";

const SCOPE = "RADIO";

const UIRadio = createRadio({
  Root: withStyleContext(Pressable, SCOPE),
  Group: View,
  Icon: UIIcon,
  Label: Text,
  Indicator: View,
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

const radioStyle = tva({
  base: "group/radio flex-row items-center justify-start gap-2 data-[disabled=true]:opacity-40 data-[disabled=true]:cursor-not-allowed",
});

const radioIndicatorStyle = tva({
  base: "justify-center items-center bg-transparent border-2 border-outline-400 data-[checked=true]:border-primary-500 data-[checked=true]:bg-transparent data-[hover=true]:border-outline-500 data-[hover=true]:data-[checked=true]:border-primary-600 data-[hover=true]:bg-transparent data-[hover=true]:data-[checked=true]:bg-transparent data-[active=true]:bg-transparent data-[invalid=true]:border-error-700 data-[disabled=true]:opacity-40 data-[disabled=true]:cursor-not-allowed rounded-full",
  variants: {
    size: {
      lg: "w-6 h-6",
      md: "w-5 h-5",
      sm: "w-4 h-4",
    },
  },
});

const radioLabelStyle = tva({
  base: "text-typography-900 data-[checked=true]:text-typography-900 data-[hover=true]:text-typography-900 data-[active=true]:text-typography-900 data-[disabled=true]:opacity-40 web:select-none",
  variants: {
    size: {
      "2xs": "text-2xs",
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
      "6xl": "text-6xl",
    },
  },
});

const radioIconStyle = tva({
  base: "fill-none text-primary-500 data-[checked=true]:text-primary-500 rounded-full",
  variants: {
    size: {
      "2xs": "h-3 w-3",
      xs: "h-3.5 w-3.5",
      sm: "h-4 w-4",
      md: "h-[18px] w-[18px]",
      lg: "h-5 w-5",
      xl: "h-6 w-6",
    },
  },
});

const radioGroupStyle = tva({
  base: "flex-col gap-2",
});

type IRadioProps = React.ComponentProps<typeof UIRadio> &
  VariantProps<typeof radioStyle> & { className?: string };

const Radio = React.forwardRef<React.ComponentRef<typeof UIRadio>, IRadioProps>(function Radio(
  { className, ...props },
  ref
) {
  return (
    <UIRadio
      ref={ref}
      {...props}
      className={radioStyle({ class: className })}
      context={{ size: "md" }}
    />
  );
});

type IRadioIndicatorProps = React.ComponentProps<typeof UIRadio.Indicator> &
  VariantProps<typeof radioIndicatorStyle> & { className?: string };

const RadioIndicator = React.forwardRef<
  React.ComponentRef<typeof UIRadio.Indicator>,
  IRadioIndicatorProps
>(function RadioIndicator({ className, size, ...props }, ref) {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIRadio.Indicator
      ref={ref}
      {...props}
      className={radioIndicatorStyle({
        size: size ?? parentSize,
        class: className,
      })}
    />
  );
});

type IRadioLabelProps = React.ComponentProps<typeof UIRadio.Label> &
  VariantProps<typeof radioLabelStyle> & { className?: string };

const RadioLabel = React.forwardRef<React.ComponentRef<typeof UIRadio.Label>, IRadioLabelProps>(
  function RadioLabel({ className, size, ...props }, ref) {
    return (
      <UIRadio.Label ref={ref} {...props} className={radioLabelStyle({ size, class: className })} />
    );
  }
);

type IRadioIconProps = React.ComponentProps<typeof UIRadio.Icon> &
  VariantProps<typeof radioIconStyle> & {
    className?: string;
    as?: React.ElementType;
    height?: number;
    width?: number;
  };

const RadioIcon = React.forwardRef<React.ComponentRef<typeof UIRadio.Icon>, IRadioIconProps>(
  function RadioIcon({ className, size, ...props }, ref) {
    const { size: parentSize } = useStyleContext(SCOPE);

    if (typeof size === "number") {
      return (
        <UIRadio.Icon
          ref={ref}
          {...props}
          className={radioIconStyle({ class: className })}
          size={size}
        />
      );
    } else if ((props.height !== undefined || props.width !== undefined) && size === undefined) {
      return <UIRadio.Icon ref={ref} {...props} className={radioIconStyle({ class: className })} />;
    }
    return (
      <UIRadio.Icon
        ref={ref}
        {...props}
        className={radioIconStyle({
          size: size ?? parentSize,
          class: className,
        })}
      />
    );
  }
);

type IRadioGroupProps = React.ComponentProps<typeof UIRadio.Group> &
  VariantProps<typeof radioGroupStyle> & { className?: string };

const RadioGroup = React.forwardRef<React.ComponentRef<typeof UIRadio.Group>, IRadioGroupProps>(
  function RadioGroup({ className, ...props }, ref) {
    return <UIRadio.Group ref={ref} {...props} className={radioGroupStyle({ class: className })} />;
  }
);

Radio.displayName = "Radio";
RadioIndicator.displayName = "RadioIndicator";
RadioLabel.displayName = "RadioLabel";
RadioIcon.displayName = "RadioIcon";
RadioGroup.displayName = "RadioGroup";

export { Radio, RadioIndicator, RadioLabel, RadioIcon, RadioGroup };
