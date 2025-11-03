"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const EMPTY_OPTION_PREFIX = "__empty_option__"

const SelectRoot = SelectPrimitive.Root

function SelectGroup(props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue(props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn("p-1", position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props} />
  );
}

function SelectItem({
  className,
  children,
  ...props
}) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}>
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props} />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}>
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}>
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

function normalizeOptions(children) {
  let emptyOptionCount = 0;

  return React.Children.toArray(children)
    .filter(Boolean)
    .map((child) => {
      if (!React.isValidElement(child) || child.type !== "option") {
        return null;
      }

      const { value, disabled, label } = child.props;
      const content = child.props.children ?? label ?? value;
      const rawValue = value ?? "";
      const sanitizedValue =
        rawValue === ""
          ? `${EMPTY_OPTION_PREFIX}${emptyOptionCount++}`
          : String(rawValue);

      return {
        rawValue: typeof rawValue === "string" ? rawValue : String(rawValue),
        value: sanitizedValue,
        label: typeof content === "string" ? content : React.Children.toArray(content).join(" "),
        disabled: Boolean(disabled),
      };
    })
    .filter(Boolean);
}

const Select = React.forwardRef(function Select(
  {
    children,
    placeholder,
    className,
    size = "default",
    name,
    id,
    required,
    disabled,
    defaultValue,
    value: valueProp,
    onChange,
    onBlur,
    onValueChange,
    ...props
  },
  ref,
) {
  const options = React.useMemo(() => normalizeOptions(children), [children]);
  const rawToSanitized = React.useMemo(() => {
    const map = new Map();
    options.forEach((option) => {
      map.set(option.rawValue ?? "", option.value);
    });
    return map;
  }, [options]);
  const sanitizedToRaw = React.useMemo(() => {
    const map = new Map();
    options.forEach((option) => {
      map.set(option.value, option.rawValue ?? "");
    });
    return map;
  }, [options]);

  const getSanitizedValue = React.useCallback(
    (raw) => {
      if (raw === undefined || raw === null || raw === "") {
        return rawToSanitized.get("") ?? options[0]?.value ?? "";
      }

      const key = typeof raw === "string" ? raw : String(raw);
      return rawToSanitized.get(key) ?? key;
    },
    [options, rawToSanitized],
  );

  const getRawValue = React.useCallback(
    (sanitized) => {
      if (sanitized === undefined || sanitized === null) {
        return "";
      }

      return sanitizedToRaw.get(sanitized) ?? sanitized;
    },
    [sanitizedToRaw],
  );

  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = React.useState(
    valueProp ?? defaultValue ?? options[0]?.rawValue ?? "",
  );

  React.useEffect(() => {
    if (isControlled) {
      setInternalValue(valueProp ?? "");
    }
  }, [isControlled, valueProp]);

  const currentValue = isControlled ? valueProp ?? "" : internalValue;
  const sanitizedValue = getSanitizedValue(currentValue);

  const resolvedPlaceholder =
    placeholder ??
    options.find((option) => option.value === sanitizedValue)?.label ??
    options[0]?.label ??
    "Select an option";

  const handleValueChange = (val) => {
    const rawVal = getRawValue(val);

    if (!isControlled) {
      setInternalValue(rawVal);
    }

    onValueChange?.(rawVal);
    if (onChange) {
      onChange({
        target: { name, value: rawVal },
        currentTarget: { name, value: rawVal },
        type: "change",
      });
    }
  };

  const handleBlur = (event) => {
    onBlur?.(event);
  };

  return (
    <>
      <SelectRoot
        data-slot="select"
        value={sanitizedValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        {...props}
      >
        <SelectTrigger
          id={id}
          size={size}
          className={className}
          onBlur={handleBlur}
          aria-required={required}
        >
          <SelectValue placeholder={resolvedPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
      {name ? (
        <input
          ref={ref}
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
          readOnly
        />
      ) : null}
    </>
  );
});

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
