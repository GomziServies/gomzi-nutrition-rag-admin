import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIDelete, APIGet, APIPost, APIPut } from '../../../_metronic/helpers/Utils'
import * as FGGroupEndpoints from '../../constants/fg_group_endpoints'

// Define types based on the backend model
export type ProductTarget = {
  productName: "peanut butter" | "mass gainer" | "whey protein" | "eaa" | "bcaa" | "pre-workout" | "creatine" | "energy drink"
  unit: string
  target: number
  achieved: number
  pending: number
}

export type GnTargetMatrix = {
  _id?: string
  year: number
  month: number
  totalTarget: number
  totalAchieved: number
  createdBy: string
  updatedBy?: string
  products: ProductTarget[]
  createdAt?: string
  updatedAt?: string
}

export function createGnTargetMatrix(body: {
  year: number
  month: number
  products: Pick<ProductTarget, 'productName' | 'target'>[]
}): Promise<FGGroupAPIResponse> {
  return APIPost(FGGroupEndpoints.CreateGnTargetMatrix, getAPIHeaders('fg_group'), undefined, body)
}

export function getGnTargetMatrix(
  query?: {
    id?: string
    year?: number
    month?: number
  } & FGGroupSearchOptions &
    FGGroupPaginationOptions &
    FGGroupSortOptions
): Promise<FGGroupAPIResponse> {
  return APIGet(FGGroupEndpoints.GetGnTargetMatrix, getAPIHeaders('fg_group'), query)
}

export function updateGnTargetMatrix(body: {
  id: string
  year?: number
  month?: number
  products?: Pick<ProductTarget, 'productName' | 'target'>[]
}): Promise<FGGroupAPIResponse> {
  return APIPut(FGGroupEndpoints.UpdateGnTargetMatrix, getAPIHeaders('fg_group'), undefined, body)
}

export function deleteGnTargetMatrix(query: { id: string }): Promise<FGGroupAPIResponse> {
  return APIDelete(FGGroupEndpoints.DeleteGnTargetMatrix, getAPIHeaders('fg_group'), query)
}

export function updateArchivedGnTargetMatrix(body: {
  id: string
  isArchived: boolean
}): Promise<FGGroupAPIResponse> {
  return APIPost(FGGroupEndpoints.UpdateArchivedGnTargetMatrix, getAPIHeaders('fg_group'), undefined, body)
}

export function getGnData(): Promise<FGGroupAPIResponse> {
  return APIGet(FGGroupEndpoints.GetGnData, getAPIHeaders('fg_group'), undefined)
}