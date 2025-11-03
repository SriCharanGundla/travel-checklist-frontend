import { forwardRef, useEffect, useMemo, useState } from "react"
import { ChevronDownIcon } from "lucide-react"
import { format, isSameDay, isValid, parseISO } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const parseDateValue = (value) => {
  if (!value) return undefined
  try {
    const parsed = parseISO(value)
    return isValid(parsed) ? parsed : undefined
  } catch (_error) {
    return undefined
  }
}

export const DatePicker = forwardRef(function DatePicker(
  {
    id,
    value,
    onChange,
    onBlur,
    placeholder = "Select date",
    disabled,
    className,
    buttonProps = {},
    calendarProps = {},
  },
  ref
) {
  const [open, setOpen] = useState(false)
  const selectedDate = useMemo(() => parseDateValue(value), [value])
  const [month, setMonth] = useState(() => selectedDate ?? new Date())

  const {
    captionLayout = "dropdown",
    fromYear = 1900,
    toYear = 2100,
    ...restCalendarProps
  } = calendarProps ?? {}

  useEffect(() => {
    if (selectedDate) {
      setMonth(selectedDate)
    }
  }, [selectedDate])

  const handleOpenChange = (next) => {
    setOpen(next)
    if (next) {
      setMonth(selectedDate ?? new Date())
    }
    if (!next && onBlur) {
      onBlur()
    }
  }

  const handleSelect = (date) => {
    const shouldClear = Boolean(date && selectedDate && isSameDay(date, selectedDate))
    const nextValue = shouldClear ? "" : date ? format(date, "yyyy-MM-dd") : ""
    if (onChange) {
      onChange(nextValue)
    }
    setOpen(false)
    if (onBlur) {
      onBlur()
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          ref={ref}
          variant="outline"
          disabled={disabled}
          className={cn(
            "flex w-full min-w-0 justify-between font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          {...buttonProps}
        >
          <span className="truncate">
            {selectedDate ? format(selectedDate, "PPP") : placeholder}
          </span>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          month={month}
          onMonthChange={setMonth}
          captionLayout={captionLayout}
          fromYear={fromYear}
          toYear={toYear}
          {...restCalendarProps}
        />
      </PopoverContent>
    </Popover>
  )
})

export const DateTimePicker = forwardRef(function DateTimePicker(
  {
    id,
    value,
    onChange,
    onBlur,
    placeholder = "Select date & time",
    disabled,
    className,
    buttonProps = {},
    calendarProps = {},
    timeLabel = "Time",
    timeStep = 60,
  },
  ref
) {
  const [open, setOpen] = useState(false)
  const [internalTime, setInternalTime] = useState("")

  const selectedDate = useMemo(() => parseDateValue(value), [value])
  const [month, setMonth] = useState(() => selectedDate ?? new Date())
  const {
    captionLayout = "dropdown",
    fromYear = 1900,
    toYear = 2100,
    ...restCalendarProps
  } = calendarProps ?? {}

  useEffect(() => {
    if (selectedDate) {
      setInternalTime(format(selectedDate, "HH:mm"))
      setMonth(selectedDate)
    } else {
      setInternalTime("")
      setMonth(new Date())
    }
  }, [selectedDate])

  const handleOpenChange = (next) => {
    setOpen(next)
    if (next) {
      setMonth(selectedDate ?? new Date())
    }
    if (!next && onBlur) {
      onBlur()
    }
  }

  const emitChange = (date, time) => {
    if (!onChange) return
    if (!date) {
      onChange("")
      return
    }
    const safeTime = time && time.length ? time : "00:00"
    const [hours, minutes] = safeTime.split(":")
    const withTime = new Date(date)
    withTime.setHours(Number(hours ?? "0"), Number(minutes ?? "0"), 0, 0)
    onChange(format(withTime, "yyyy-MM-dd'T'HH:mm"))
  }

  const handleDateSelect = (date) => {
    if (!date) {
      setInternalTime("")
      emitChange(undefined, internalTime)
      setOpen(false)
      if (onBlur) {
        onBlur()
      }
      return
    }

    if (selectedDate && isSameDay(date, selectedDate)) {
      setInternalTime("")
      if (onChange) {
        onChange("")
      }
      setOpen(false)
      if (onBlur) {
        onBlur()
      }
      return
    }

    emitChange(date, internalTime)
    setOpen(false)
    if (onBlur) {
      onBlur()
    }
  }

  const handleTimeChange = (event) => {
    const nextTime = event.target.value
    setInternalTime(nextTime)
    if (selectedDate) {
      emitChange(selectedDate, nextTime)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          ref={ref}
          variant="outline"
          disabled={disabled}
          className={cn(
            "flex w-full min-w-0 justify-between font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          {...buttonProps}
        >
          <span className="truncate">
            {selectedDate ? format(selectedDate, "PPP") : placeholder}
          </span>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
          month={month}
          onMonthChange={setMonth}
          captionLayout={captionLayout}
          fromYear={fromYear}
          toYear={toYear}
          className="min-w-[280px]"
          {...restCalendarProps}
        />
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {timeLabel}
            </span>
            <Input
              type="time"
              step={timeStep}
              value={internalTime}
              onChange={handleTimeChange}
              className={cn(
                "bg-background appearance-none h-9 w-[120px]",
                "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              )}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})
