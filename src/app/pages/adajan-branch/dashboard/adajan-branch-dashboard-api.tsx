/**
 * Adajan Branch Dashboard API
 * Replace fetch URLs with real backend when ready.
 * Trainer, Client, Attendance - all connected via API.
 */

export const ADAJAN_BRANCH_API_BASE = process.env.REACT_APP_ADAJAN_BRANCH_API || ''

export interface TimeSlot {
  id: string
  time: string
  maxCapacity: number
}

export const DASHBOARD_TIME_SLOTS: TimeSlot[] = [
  { id: '1', time: '06:00 AM - 07:00 AM', maxCapacity: 3 },
  { id: '2', time: '07:00 AM - 08:00 AM', maxCapacity: 3 },
  { id: '3', time: '08:00 AM - 09:00 AM', maxCapacity: 3 },
  { id: '4', time: '09:00 AM - 10:00 AM', maxCapacity: 3 },
  { id: '5', time: '10:00 AM - 11:00 AM', maxCapacity: 3 },
  { id: '6', time: '05:00 PM - 06:00 PM', maxCapacity: 3 },
  { id: '7', time: '06:00 PM - 07:00 PM', maxCapacity: 3 },
  { id: '8', time: '07:00 PM - 08:00 PM', maxCapacity: 3 },
]

export interface DashboardClient {
  _id: string
  name: string
  phone?: string
  email?: string
}

export interface DashboardTrainer {
  _id: string
  name: string
  phone?: string
  email?: string
  timeSlotAssignments: { [timeSlotId: string]: string[] }
}

export interface DashboardAttendanceSummary {
  presentToday: number
  totalMembers: number
  absentToday: number
  percentage: number
}

async function fetchApi<T>(path: string): Promise<T> {
  if (ADAJAN_BRANCH_API_BASE) {
    const res = await fetch(`${ADAJAN_BRANCH_API_BASE}${path}`)
    if (!res.ok) throw new Error(`API ${path} failed`)
    return res.json()
  }
  // Dummy data when no API base configured
  await new Promise((r) => setTimeout(r, 200))
  return getDummyData(path) as T
}

function getDummyData(path: string): unknown {
  if (path.includes('clients')) {
    return {
      count: 7,
      list: [
        { _id: '1', name: 'Rajesh Kumar', phone: '9876543210', email: 'r@e.com' },
        { _id: '2', name: 'Priya Patel', phone: '9123456789', email: 'p@e.com' },
        { _id: '3', name: 'Amit Shah', phone: '9988776655', email: 'a@e.com' },
        { _id: '4', name: 'Neha Sharma', phone: '9654321789', email: 'n@e.com' },
        { _id: '5', name: 'Vikram Desai', phone: '9876512340', email: 'v@e.com' },
        { _id: '6', name: 'Kiran Modi', phone: '9876512341', email: 'k@e.com' },
        { _id: '7', name: 'Rahul Joshi', phone: '9876512342', email: 'rj@e.com' },
      ],
    }
  }
  if (path.includes('trainers')) {
    const assignments = getTrainerAssignmentsFromStorage()
    return {
      count: 3,
      list: [
        { _id: '1', name: 'Virat', phone: '9876543210', email: 'virat@gym.com', timeSlotAssignments: assignments['1'] || {} },
        { _id: '2', name: 'Ram', phone: '9123456789', email: 'ram@gym.com', timeSlotAssignments: assignments['2'] || {} },
        { _id: '3', name: 'Gopal', phone: '9988776655', email: 'gopal@gym.com', timeSlotAssignments: assignments['3'] || {} },
      ],
    }
  }
  if (path.includes('attendance-summary')) {
    return {
      presentToday: 5,
      totalMembers: 7,
      absentToday: 2,
      percentage: 71,
    }
  }
  return {}
}

function getTrainerAssignmentsFromStorage(): Record<string, Record<string, string[]>> {
  try {
    const raw = localStorage.getItem('trainerAssignments')
    if (!raw) return {}
    const assignments: { clientId: string; trainerId: string; timeSlotId: string }[] = JSON.parse(raw)
    const byTrainer: Record<string, Record<string, string[]>> = {}
    assignments.forEach((a) => {
      if (!byTrainer[a.trainerId]) byTrainer[a.trainerId] = {}
      if (!byTrainer[a.trainerId][a.timeSlotId]) byTrainer[a.trainerId][a.timeSlotId] = []
      byTrainer[a.trainerId][a.timeSlotId].push(a.clientId)
    })
    return byTrainer
  } catch {
    return {}
  }
}

export interface ClientsResponse {
  count: number
  list: DashboardClient[]
}

export interface TrainersResponse {
  count: number
  list: DashboardTrainer[]
}

export async function fetchClients(): Promise<ClientsResponse> {
  const data = await fetchApi<ClientsResponse>('/clients')
  const list = Array.isArray((data as any).list) ? (data as any).list : []
  return { count: list.length, list }
}

export async function fetchTrainers(): Promise<TrainersResponse> {
  const data = await fetchApi<TrainersResponse>('/trainers')
  const list = Array.isArray((data as any).list) ? (data as any).list : []
  return { count: list.length, list }
}

export async function fetchAttendanceSummary(): Promise<DashboardAttendanceSummary> {
  const data = await fetchApi<DashboardAttendanceSummary>('/attendance-summary')
  const d = data as DashboardAttendanceSummary
  return {
    presentToday: d.presentToday ?? 0,
    totalMembers: d.totalMembers ?? 0,
    absentToday: d.absentToday ?? 0,
    percentage: d.percentage ?? 0,
  }
}

export function getTrainerSlotLoad(
  trainer: DashboardTrainer,
  timeSlotId: string
): number {
  const arr = trainer.timeSlotAssignments[timeSlotId]
  return arr ? arr.length : 0
}

export type SlotStatus = 'red' | 'yellow' | 'green'

export function getSlotStatus(load: number, maxCapacity: number): SlotStatus {
  if (load >= maxCapacity) return 'red'
  if (load >= maxCapacity * 0.7) return 'yellow'
  return 'green'
}

export function getAttendanceStatus(percentage: number): SlotStatus {
  if (percentage < 50) return 'red'
  if (percentage < 80) return 'yellow'
  return 'green'
}
