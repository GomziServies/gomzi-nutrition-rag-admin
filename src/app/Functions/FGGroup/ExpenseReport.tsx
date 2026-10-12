import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

type ExpenseItem = {
    type: string
    description: string
    amount: number
    file_url?: string
}

export type ExpenseReport = {
    _id?: string
    employee_id: string
    purpose: string
    expenses: ExpenseItem[]
    status?: 'Pending' | 'Approved' | 'Rejected'
    rejected_reason?: string
    remarks?: string
    total_amount?: number
    createdAt?: Date
    updatedAt?: Date
}

export function CreateExpenseReport(body: {
    employee_id: string
    purpose: string
    expenses: ExpenseItem[]
    remarks?: string
}): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.CreateExpenseReport, getAPIHeaders('fg_group'), undefined, body)
}

export function GetExpenseReports(
    query?: {
        id?: string
        employee_id?: string
        status?: 'Pending' | 'Approved' | 'Rejected'
        from_date?: Date
        to_date?: Date
    } & FGGroupSearchOptions &
        FGGroupPaginationOptions &
        FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
    return APIGet(FGGroupEndpoints.GetExpenseReports, getAPIHeaders('fg_group'), query)
}

export function ActionExpenseReport(body: {
    id: string
    action: 'Approved' | 'Rejected'
    rejected_reason?: string
    remarks?: string
}): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.ActionExpenseReport, getAPIHeaders('fg_group'), undefined, body)
}

export function UpdateExpenseReport(body: {
    id: string
    purpose?: string
    expenses?: ExpenseItem[]
    status?: 'Pending' | 'Approved' | 'Rejected'
    rejected_reason?: string
    remarks?: string
}): Promise<FGGroupAPIResponse> {
    return APIPost(FGGroupEndpoints.UpdateExpenseReport, getAPIHeaders('fg_group'), undefined, body)
}

export function DeleteExpenseReport(query: { id: string }): Promise<FGGroupAPIResponse> {
    return APIDelete(FGGroupEndpoints.DeleteExpenseReport, getAPIHeaders('fg_group'), query)
}