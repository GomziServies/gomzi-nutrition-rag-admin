import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken'
import { APIGet, APIPost } from '../../../_metronic/helpers/Utils'
import { FG_GROUP_BASE_URL } from '../../constants/base_URL'

export interface GymCouponSystem {
  enabled: boolean
  price: number
  title: string
  subtitle: string
  reward_count: number
  reward_text: string
  supplement_policy: string
  share_prompt: string
}

export interface GymOfferPack {
  id?: string
  name: string
  price: number
  rtp?: string
  supplements?: string
  perks: string[]
  free_gift?: string
  status?: boolean
}

export interface GymOfferTier {
  minimum_amount: number
  months: number
}

export type GymOfferSettings = {
  enabled: boolean
  gym_name: string
  terms: string
  tiers: GymOfferTier[]
  coupon_system?: GymCouponSystem
  packs?: GymOfferPack[]
}

const endpoint = `${FG_GROUP_BASE_URL}/admin/v1/gym-access-offer`
export const GetGymAccessOffer = (): Promise<FGGroupAPIResponse> => APIGet(endpoint, getAPIHeaders('fg_group'))
export const SaveGymAccessOffer = (settings: GymOfferSettings): Promise<FGGroupAPIResponse> => APIPost(endpoint, getAPIHeaders('fg_group'), undefined, settings)
