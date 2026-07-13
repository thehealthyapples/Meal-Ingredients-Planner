import { CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isError = variant === "destructive"
        const duration = isError ? 5000 : 2500

        return (
          <Toast key={id} variant={variant} duration={duration} {...props}>
            <div className="flex items-center gap-2 min-w-0">
              {isError ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
              <div className="min-w-0 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            {/* PX1-W4b (fnd-px-toast-limit-one): the close button was gated on
                `isError`, so a success could only be waited out. With TOAST_LIMIT
                raised, toasts now stack rather than destroy one another — and a
                stack the household cannot dismiss is the noise a limit of 1 was
                avoiding. Every toast closes. */}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
