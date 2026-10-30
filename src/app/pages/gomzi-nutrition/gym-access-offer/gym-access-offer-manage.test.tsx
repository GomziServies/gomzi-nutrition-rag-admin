import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GetGymAccessOffer, SaveGymAccessOffer } from '../../../Functions/FGGroup/GymAccessOffer'
import GymAccessOfferManage from './gym-access-offer-manage'

jest.mock('../../../Functions/FGGroup/GymAccessOffer', () => ({ GetGymAccessOffer: jest.fn(), SaveGymAccessOffer: jest.fn() }))
jest.mock('../../../../_metronic/layout/core', () => ({ PageTitle: () => null }))
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn() } }))
const settings = { enabled: true, gym_name: 'Gomzi', terms: 'Show receipt at Gomzi.', tiers: [{ minimum_amount: 1500, months: 1 }, { minimum_amount: 3000, months: 2 }] }
beforeEach(() => {
  jest.clearAllMocks()
  ;(GetGymAccessOffer as jest.Mock).mockResolvedValue({ data: JSON.parse(JSON.stringify(settings)) })
})

test('loads existing tiers and saves an edited gym duration', async () => {
  ;(SaveGymAccessOffer as jest.Mock).mockImplementation(async data => ({ data }))
  render(<GymAccessOfferManage />)
  const duration = await screen.findByLabelText('Months for tier 2')
  fireEvent.change(duration, { target: { value: '3' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save offer' }))
  await waitFor(() => expect(SaveGymAccessOffer).toHaveBeenCalledWith(expect.objectContaining({ tiers: [{ minimum_amount: 1500, months: 1 }, { minimum_amount: 3000, months: 3 }] })))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save offer' })).toBeEnabled())
})

test('allows admins to add a tier and disable the offer', async () => {
  ;(SaveGymAccessOffer as jest.Mock).mockImplementation(async data => ({ data }))
  render(<GymAccessOfferManage />)
  await screen.findByLabelText('Months for tier 1')
  fireEvent.click(screen.getByRole('button', { name: 'Add tier' }))
  fireEvent.change(screen.getByLabelText('Minimum spend for tier 3'), { target: { value: '4500' } })
  fireEvent.change(screen.getByLabelText('Months for tier 3'), { target: { value: '3' } })
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Save offer' }))
  await waitFor(() => expect(SaveGymAccessOffer).toHaveBeenCalledWith(expect.objectContaining({ enabled: false, tiers: expect.arrayContaining([{ minimum_amount: 4500, months: 3 }]) })))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save offer' })).toBeEnabled())
})

test('shows a failed save and keeps the edit available for retry', async () => {
  ;(SaveGymAccessOffer as jest.Mock).mockRejectedValue({ message: 'Each spending threshold must be unique.' })
  render(<GymAccessOfferManage />)
  await screen.findByLabelText('Months for tier 1')
  fireEvent.click(screen.getByRole('button', { name: 'Save offer' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Each spending threshold must be unique.')
  expect(screen.getByRole('button', { name: 'Save offer' })).toBeEnabled()
})
