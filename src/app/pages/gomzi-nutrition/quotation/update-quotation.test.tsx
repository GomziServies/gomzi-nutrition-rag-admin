import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'
import { MemoryRouter } from 'react-router-dom'
import { getQuotation } from '../../../Functions/FGGroup/Quotation'
import NutritionUpdateQuotation from './update-quotation'

jest.mock('html2canvas', () => jest.fn())
jest.mock('jspdf', () => jest.fn())
jest.mock('react-hot-toast', () => ({ error: jest.fn(), success: jest.fn() }))
jest.mock('../../../Functions/FGGroup/Quotation', () => ({
	getQuotation: jest.fn(),
	updateQuotation: jest.fn(),
}))
jest.mock('../../../../_metronic/layout/core', () => ({ PageTitle: () => null }))
jest.mock('../../../../_metronic/helpers/Utils', () => ({ DayJS: require('dayjs') }))
jest.mock('../../../components/SelectField', () => () => null)
jest.mock('../../../components/TableButton', () => () => null)
jest.mock('../../../components/animated-icons', () => ({ PlusIcon: () => null }))

const capture = html2canvas as jest.MockedFunction<typeof html2canvas>
const pdf = {
	internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
	addImage: jest.fn(),
	addPage: jest.fn(),
	save: jest.fn(),
}
const canvas = {
	width: 1588,
	height: 2246,
	toDataURL: () => 'data:image/png;base64,invoice',
} as HTMLCanvasElement

beforeEach(() => {
	jest.clearAllMocks()
	capture.mockReset()
	capture.mockResolvedValue(canvas)
	pdf.save.mockReset().mockResolvedValue(undefined)
	;(jsPDF as unknown as jest.Mock).mockImplementation(() => pdf)
	;(getQuotation as jest.Mock).mockResolvedValue({ data: [{
		name: 'Test Customer', date: '2026-11-21', email: '', mobile: '',
		billing_address: { address_line_1: 'Test address' }, payment_method: 'CASH',
		net_amount: 100, paid_amount: 0, note: '',
		items: [{ _id: 'item-1', item_name: 'Supplement', amount: 100, gst: 0,
			discount: 0, totalAmount: 100, quantity: 1 }],
	}] })
	window.history.replaceState({}, '', '/rag/update-quotation?id=quotation-test')
})

const renderQuotation = async () => {
	render(<MemoryRouter><NutritionUpdateQuotation /></MemoryRouter>)
	await screen.findByDisplayValue('Test Customer')
}

test('downloads both pages and stays busy until the PDF has been saved', async () => {
	let finishSaving!: () => void
	pdf.save.mockReturnValueOnce(new Promise<void>((resolve) => { finishSaving = resolve }))
	await renderQuotation()
	fireEvent.click(screen.getByRole('button', { name: 'Download Invoice' }))

	await waitFor(() => expect(pdf.save).toHaveBeenCalledWith('Test Customer.pdf', { returnPromise: true }))
	expect(capture.mock.calls.map(([element]) => element.id)).toEqual([
		'quotationContent', 'invoiceTermAndCondition',
	])
	expect(pdf.addImage).toHaveBeenCalledTimes(2)
	expect(pdf.addPage).toHaveBeenCalledTimes(1)
	expect(screen.getByRole('button', { name: 'Generating PDF...' })).toBeDisabled()
	expect(screen.getByRole('button', { name: 'Update Quotation' })).toBeDisabled()

	await act(async () => { finishSaving() })
	expect(screen.getByRole('button', { name: 'Download Invoice' })).toBeEnabled()
})

test('excludes unrelated images and external font stylesheets from the capture', async () => {
	await renderQuotation()
	fireEvent.click(screen.getByRole('button', { name: 'Download Invoice' }))
	await waitFor(() => expect(capture).toHaveBeenCalledTimes(2))

	const [content, options] = capture.mock.calls[0]
	const ignoreElements = options?.ignoreElements
	const parent = content.parentElement
	const image = content.querySelector('img')
	if (!ignoreElements || !parent || !image) throw new Error('Capture context is missing')
	const unrelatedImage = document.createElement('img')
	document.body.appendChild(unrelatedImage)
	try {
		expect(ignoreElements(unrelatedImage)).toBe(true)
		expect(ignoreElements(content)).toBe(false)
		expect(ignoreElements(parent)).toBe(false)
		expect(ignoreElements(image)).toBe(false)
		const fontStylesheet = document.createElement('link')
		fontStylesheet.rel = 'stylesheet'
		fontStylesheet.href = 'https://fonts.googleapis.com/css?family=Inter:400'
		expect(ignoreElements(fontStylesheet)).toBe(true)
		fontStylesheet.href = '/assets/app.css'
		expect(ignoreElements(fontStylesheet)).toBe(false)
	} finally {
		unrelatedImage.remove()
	}
	await waitFor(() => expect(screen.getByRole('button', { name: 'Download Invoice' })).toBeEnabled())
})

test('places the off-screen terms on a printable page without modifying the preview', async () => {
	await renderQuotation()
	fireEvent.click(screen.getByRole('button', { name: 'Download Invoice' }))
	await waitFor(() => expect(capture).toHaveBeenCalledTimes(2))

	const [terms, options] = capture.mock.calls[1]
	const onclone = options?.onclone
	if (!onclone) throw new Error('Capture callback is missing')
	const originalStyle = terms.getAttribute('style')
	const clone = document.implementation.createHTMLDocument()
	const clonedTerms = clone.importNode(terms, true)
	onclone(clone, clonedTerms)
	expect(clonedTerms.parentElement).toBe(clone.body)
	expect(clonedTerms.style.position).toBe('static')
	expect(clonedTerms.style.width).toBe('794px')
	expect(terms.getAttribute('style')).toBe(originalStyle)
	expect(terms).not.toHaveClass('pdf-font-black')
	await waitFor(() => expect(screen.getByRole('button', { name: 'Download Invoice' })).toBeEnabled())
})

test.each(['capture', 'save'])('shows an error and allows retry after a %s failure', async (failure) => {
	const log = jest.spyOn(console, 'error').mockImplementation(() => undefined)
	if (failure === 'capture') capture.mockRejectedValueOnce(new Error('Capture failed'))
	else pdf.save.mockRejectedValueOnce(new Error('Save failed'))
	try {
		await renderQuotation()
		fireEvent.click(screen.getByRole('button', { name: 'Download Invoice' }))
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Unable to download the PDF. Please try again.'))
		if (failure === 'capture') expect(pdf.save).not.toHaveBeenCalled()
		expect(screen.getByRole('button', { name: 'Download Invoice' })).toBeEnabled()

		fireEvent.click(screen.getByRole('button', { name: 'Download Invoice' }))
		await waitFor(() => expect(pdf.save).toHaveBeenCalledWith('Test Customer.pdf', { returnPromise: true }))
		await waitFor(() => expect(screen.getByRole('button', { name: 'Download Invoice' })).toBeEnabled())
	} finally {
		log.mockRestore()
	}
})
