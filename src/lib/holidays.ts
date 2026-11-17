import type { CalendarHoliday } from '../types'

// Festival dates move every year, so they are listed by year. Years outside this list
// still show the fixed-date holidays below.
const festivalDates: Record<number, { title: string; date: string }[]> = {
  2026: [{ title: 'Holi', date: '2026-03-04' }, { title: 'Diwali', date: '2026-11-08' }],
  2027: [{ title: 'Holi', date: '2027-03-22' }, { title: 'Diwali', date: '2027-10-29' }],
  2028: [{ title: 'Holi', date: '2028-03-11' }, { title: 'Diwali', date: '2028-10-17' }],
  2029: [{ title: 'Holi', date: '2029-03-01' }, { title: 'Diwali', date: '2029-11-05' }],
  2030: [{ title: 'Holi', date: '2030-03-20' }, { title: 'Diwali', date: '2030-10-26' }],
}

/** Built-in India holidays and observances shown on the calendar for a given year. */
export const indiaHolidaysForYear = (year: number): CalendarHoliday[] => [
  { id: `india-republic-day-${year}`, title: 'Republic Day', date: `${year}-01-26`, color: '#b45309', kind: 'holiday' },
  { id: `india-independence-day-${year}`, title: 'Independence Day', date: `${year}-08-15`, color: '#047857', kind: 'holiday' },
  { id: `india-gandhi-jayanti-${year}`, title: 'Gandhi Jayanti', date: `${year}-10-02`, color: '#b45309', kind: 'holiday' },
  { id: `india-christmas-${year}`, title: 'Christmas', date: `${year}-12-25`, color: '#b91c1c', kind: 'holiday' },
  { id: `india-all-souls-day-${year}`, title: "All Souls' Day", date: `${year}-11-02`, color: '#bc80ae', kind: 'holiday' },
  { id: `india-childrens-day-${year}`, title: "Children's Day", date: `${year}-11-14`, color: '#6a00cd', kind: 'holiday' },
  ...(festivalDates[year] ?? []).map(holiday => ({
    id: `india-${holiday.title.toLowerCase()}-${year}`,
    ...holiday,
    color: holiday.title === 'Diwali' ? '#a16207' : '#c2410c',
    kind: 'holiday' as const,
  })),
]
