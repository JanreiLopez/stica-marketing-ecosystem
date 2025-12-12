import { useMemo, useState } from "react"
import { subMonths, subYears } from "date-fns"

interface UseDateRangeOptions {
  monthsForward?: number
}

export function useDateRange(options: UseDateRangeOptions = {}) {
  const { monthsForward = 12 } = options

  // Dynamic dates: start date is January 1 of last year, end date is December 31 of this year (for year-over-year comparison)
  const defaultStart = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return new Date(currentYear - 1, 0, 1) // January 1 of last year
  }, [])
  
  const defaultEnd = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return new Date(currentYear, 11, 31) // December 31 of this year
  }, [])

  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart)
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd)

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
  }
}


