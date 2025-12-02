"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  startDate: Date | undefined
  endDate: Date | undefined
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = "",
}: DateRangePickerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[140px] justify-start text-left font-normal border border-border focus-visible:ring-ring focus-visible:border-ring h-9 px-3"
          >
            {startDate ? format(startDate, "MM/dd/yyyy") : "Start Date"}
            <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={onStartDateChange}
            captionLayout="dropdown"
            fromYear={new Date().getFullYear() - 10}
            toYear={new Date().getFullYear() + 10}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[140px] justify-start text-left font-normal border border-border focus-visible:ring-ring focus-visible:border-ring h-9 px-3"
          >
            {endDate ? format(endDate, "MM/dd/yyyy") : "End Date"}
            <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={onEndDateChange}
            captionLayout="dropdown"
            fromYear={new Date().getFullYear() - 10}
            toYear={new Date().getFullYear() + 10}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}



