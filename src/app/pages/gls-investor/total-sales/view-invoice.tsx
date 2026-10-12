import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getInvoice } from '../../../Functions/FGGroup'
import { PageTitle } from '../../../../_metronic/layout/core'
import { KTIcon, toAbsoluteUrl } from '../../../../_metronic/helpers'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import TableButton from '../../../components/TableButton'

const InvestorViewInvoice = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoiceId = searchParams.get('id')
	const [invoice, setInvoice] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const invoiceRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const fetchInvoice = async () => {
			if (!invoiceId) return
			try {
				const response: any = await getInvoice({ id: invoiceId })
				setInvoice(response.data[0])
			} catch (error) {
				console.error('Error fetching invoice:', error)
			}
			setLoading(false)
		}
		fetchInvoice()
	}, [invoiceId])

	const downloadPDF = async () => {
		if (!invoiceRef.current) return

		const canvas = await html2canvas(invoiceRef.current, {
			scale: 2,
			useCORS: true,
			logging: false,
		})

		const imgData = canvas.toDataURL('image/png')
		const pdf = new jsPDF('p', 'mm', 'a4')
		const pdfWidth = pdf.internal.pageSize.getWidth()
		const pdfHeight = (canvas.height * pdfWidth) / canvas.width

		pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
		pdf.save(`Invoice_${invoice?.invoice_no || 'NA'}.pdf`)
	}

	if (loading) return <div>Loading...</div>
	if (!invoice) return <div>Invoice not found</div>

	return (
		<>
			<PageTitle breadcrumbs={[]}>View Invoice</PageTitle>

			<div className='card shadow-sm'>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<TableButton
							to='/gls-investor/invoice-list'
							action='view'
							text='Back'
						/>
					</div>
					<div className='card-toolbar'>
						<button className='btn btn-primary' onClick={downloadPDF}>
							<KTIcon iconName='download' className='fs-2 me-2' />
							Download PDF
						</button>
					</div>
				</div>

				<div className='card-body p-10'>
					<div ref={invoiceRef} className='bg-white p-8 border rounded'>
						<div className='d-flex justify-content-between mb-10'>
							<div>
								<img
									src={toAbsoluteUrl('/media/logos/fgiit-logo.png')}
									alt='Logo'
									className='h-60px'
								/>
							</div>
							<div className='text-end'>
								<h1 className='fw-bold text-gray-800 fs-2qx mb-2'>INVOICE</h1>
								<div className='text-gray-500 fw-bold fs-4'>#{invoice.invoice_no}</div>
							</div>
						</div>

						<div className='row mb-10'>
							<div className='col-6'>
								<h5 className='fw-bold text-gray-800 mb-3'>Invoice To:</h5>
								<div className='fs-6 text-gray-600'>
									<div className='fw-bold text-gray-800'>{invoice.fullName}</div>
									<div>{invoice.phone}</div>
									<div>{invoice.address_line_1}</div>
									<div>{invoice.city}, {invoice.state}</div>
								</div>
							</div>
							<div className='col-6 text-end'>
								<h5 className='fw-bold text-gray-800 mb-3'>Invoice Details:</h5>
								<div className='fs-6 text-gray-600'>
									<div><span className='fw-bold'>Date:</span> {new Date(invoice.createdAt).toLocaleDateString()}</div>
									<div><span className='fw-bold'>Status:</span> {invoice.payment_status}</div>
									<div><span className='fw-bold'>Source:</span> {invoice.invoice_category}</div>
								</div>
							</div>
						</div>

						<div className='table-responsive mb-10'>
							<table className='table table-row-bordered table-row-gray-300 gs-0 gy-4'>
								<thead>
									<tr className='fw-bold text-muted bg-light'>
										<th className='ps-4 min-w-300px'>Description</th>
										<th className='min-w-100px text-end'>Qty</th>
										<th className='min-w-100px text-end'>Price</th>
										<th className='min-w-100px text-end pe-4'>Total</th>
									</tr>
								</thead>
								<tbody>
									{invoice.products?.map((item: any, index: number) => (
										<tr key={index}>
											<td className='ps-4'>
												<div className='fw-bold text-gray-800 fs-6'>{item.product_name}</div>
											</td>
											<td className='text-end'>{item.quantity}</td>
											<td className='text-end'>{item.price}</td>
											<td className='text-end pe-4 fw-bold'>{item.total_amount}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className='d-flex justify-content-end'>
							<div className='mw-300px'>
								<div className='d-flex flex-stack mb-3'>
									<div className='fw-semibold pe-10 text-gray-600 fs-7'>Subtotal:</div>
									<div className='text-end fw-bold fs-6 text-gray-800'>{invoice.total_amount}</div>
								</div>
								<div className='d-flex flex-stack mb-3'>
									<div className='fw-semibold pe-10 text-gray-600 fs-7'>Paid Amount:</div>
									<div className='text-end fw-bold fs-6 text-success'>{invoice.paid_amount}</div>
								</div>
								<div className='border-top border-gray-300 pt-3 mt-3 d-flex flex-stack'>
									<div className='fw-bold pe-10 text-gray-800 fs-3'>Total Due:</div>
									<div className='text-end fw-bold fs-3 text-danger'>{invoice.unpaid_amount}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export { InvestorViewInvoice }
