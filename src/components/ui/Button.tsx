import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-charcoal text-ivory hover:bg-clay",
  secondary: "bg-transparent text-charcoal border border-charcoal/30 hover:border-charcoal",
  ghost: "bg-transparent text-charcoal hover:text-clay",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-sm",
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase tracking-[0.12em] transition-colors duration-300 ease-out disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay";

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonAsButton = ButtonOwnProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = ButtonOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    const classes = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

    if (props.href !== undefined) {
      const { href, ...anchorProps } = props;
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...anchorProps}
        />
      );
    }

    const { ...buttonProps } = props;
    return (
      <button ref={ref as React.Ref<HTMLButtonElement>} className={classes} {...buttonProps} />
    );
  }
);

Button.displayName = "Button";
