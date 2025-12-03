import { useMemo, useState } from "react"
import { subMonths, subYears } from "date-fns"

interface UseDateRangeOptions {
  monthsForward?: number
}

export function useDateRange(options: UseDateRangeOptions = {}) {
  const { monthsForward = 12 } = options

  const today = useMemo(() => new Date(), [])
  const defaultStart = useMemo(() => subYears(today, 1), [today])
  const defaultEnd = useMemo(() => today, [today])

  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart)
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd)

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
  }
}


