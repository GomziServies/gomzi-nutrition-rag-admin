import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { MemoryRouter } from 'react-router-dom'
import { GetOrders } from '../../../Functions/FGGroup'
import ProductOrder from './product-order'

jest.mock('../../../Functions/FGGroup', () => ({ GetOrders: jest.fn() }))
jest.mock('../../../../_metronic/layout/core', () => ({ PageTitle: () => null }))
jest.mock('../../../components/DateRangePicker', () => ({
	__esModule: true,
	default: ({ defaultAllDates }: any) => <span>{defaultAllDates ? 'All dates' : 'This month'}</span>,
}))
jest.mock('../../../components/SelectField', () => ({
	__esModule: true,
	default: ({ options, value, onChange }: any) => (
		<select aria-label={options[0].label} value={value} onChange={onChange}>
			{options.map((option: any) => <option key={option.value} value={option.value}>{option.label}</option>)}
		</select>
	),
}))
jest.mock('../../../components/LengthMenu', () => () => null)
jest.mock('../../../components/DownloadExcelButton', () => () => null)
jest.mock('../../../components/SearchFilter', () => () => null)
jest.mock('../../../components/GomziTablePagination', () => () => null)
jest.mock('../../../components/NumberTicker', () => ({ value }: any) => <span>{value}</span>)

const getOrders = GetOrders as jest.Mock
const order = {
	_id: 'order-1', receipt_id: 'RECEIPT-1', status: 'PENDING',
	order_item_type: 'CART', CART: [null], multiple_items: [],
	user_info: { first_name: 'Test', last_name: 'Customer' },
	createdAt: '2026-10-30T06:00:00Z', amount: 100,
}
const response = { data: [order], metadata: { pagination: { totalDocs: 1, totalPages: 1 } } }

beforeEach(() => getOrders.mockReset())
const renderOrders = () => render(<MemoryRouter><ProductOrder /></MemoryRouter>)

test('shows pending orders by default without a hidden payment or date restriction', async () => {
	getOrders.mockResolvedValue(response)
	renderOrders()
	expect(await screen.findByText('RECEIPT-1')).toBeInTheDocument()
	expect(screen.getByText('Pending Payment', { selector: 'span' })).toBeInTheDocument()
	expect(screen.getByText('All dates')).toBeInTheDocument()
	expect(getOrders.mock.calls[0][0]).not.toHaveProperty('order_status')
	expect(getOrders.mock.calls[0][0]).not.toHaveProperty('from_date')
	expect(getOrders.mock.calls[0][0].item_type).toEqual(['FG_MEAL_PRODUCT'])
})

test('passes explicit payment and shipment filters to the API', async () => {
	getOrders.mockResolvedValue(response)
	renderOrders()
	await screen.findByText('RECEIPT-1')
	await act(async () => { fireEvent.change(screen.getByRole('combobox', { name: 'All Payment Statuses' }), { target: { value: 'SUCCESS' } }) })
	await waitFor(() => expect(getOrders).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, order_status: 'SUCCESS' })))
	await act(async () => { fireEvent.change(screen.getByRole('combobox', { name: 'All Status' }), { target: { value: 'DISPATCHED' } }) })
	await waitFor(() => expect(getOrders).toHaveBeenLastCalledWith(expect.objectContaining({ shipment_status: 'DISPATCHED' })))
})

test('shows a request error and retries instead of claiming there are no orders', async () => {
	getOrders.mockRejectedValueOnce({ message: 'Order service unavailable' }).mockResolvedValue(response)
	const log = jest.spyOn(console, 'error').mockImplementation(() => {})
	renderOrders()
	expect(await screen.findByRole('alert')).toHaveTextContent('Order service unavailable')
	expect(screen.queryByText('No orders found')).not.toBeInTheDocument()
	fireEvent.click(screen.getByRole('button', { name: 'Retry loading orders' }))
	expect(await screen.findByText('RECEIPT-1')).toBeInTheDocument()
	log.mockRestore()
})

test('ignores an older response after changing filters', async () => {
	let finishOldRequest: (value: any) => void = () => {}
	getOrders.mockImplementationOnce(() => new Promise(resolve => { finishOldRequest = resolve }))
	getOrders.mockResolvedValueOnce({ data: [{ ...order, receipt_id: 'CURRENT', status: 'SUCCESS' }] })
	renderOrders()
	fireEvent.change(screen.getByRole('combobox', { name: 'All Payment Statuses' }), { target: { value: 'SUCCESS' } })
	expect(await screen.findByText('CURRENT')).toBeInTheDocument()
	await act(async () => { finishOldRequest(response) })
	expect(screen.queryByText('RECEIPT-1')).not.toBeInTheDocument()
	expect(screen.getByText('CURRENT')).toBeInTheDocument()
})
