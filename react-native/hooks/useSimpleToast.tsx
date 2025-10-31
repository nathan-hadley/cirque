import React from "react";
import { Toast, ToastDescription, useToast, type IToastProps } from "@/components/ui/toast";

type ShowToastOptions = {
  action: IToastProps["action"];
  message: string;
};

export function useSimpleToast() {
  const toast = useToast();

  return (options: ShowToastOptions) => {
    const { action, message } = options;

    toast.show({
      placement: "top",
      render: ({ id }: { id: string }) => (
        <Toast nativeID={`toast-${id}`} action={action} variant="solid">
          <ToastDescription>{message}</ToastDescription>
        </Toast>
      ),
    });
  };
}
