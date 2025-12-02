import { useMemo, useState } from "react"
import { addMonths } from "date-fns"

interface UseDateRangeOptions {
  monthsForward?: number
}

export function useDateRange(options: UseDateRangeOptions = {}) {
  const { monthsForward = 12 } = options

  const today = useMemo(() => new Date(), [])
  const defaultEnd = useMemo(() => addMonths(today, monthsForward), [today, monthsForward])

  const [startDate, setStartDate] = useState<Date | undefined>(today)
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd)

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
  }
}


