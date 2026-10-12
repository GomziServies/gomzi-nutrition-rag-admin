import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DayJS } from '../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../_metronic/layout/core'
import { getInvoice, getQuotation } from '../../Functions/FGGroup'

const InvestorDocumentView: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const type = searchParams.get('type') // 'invoice' or 'quotation'
	const id = searchParams.get('id')
	const [data, setData] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const adminType = 'Investor'

	const fetchData = async () => {
		setLoading(true)
		try {
			let response: any
			if (type === 'invoice') {
				response = await getInvoice({ id: id as string })
			} else {
				response = await getQuotation({ id: id as string })
			}
			setData(response.data[0])
		} catch (error) {
			console.error('Error fetching document:', error)
		}
		setLoading(false)
	}

	useEffect(() => {
		if (id) fetchData()
	}, [id, type])

	const generatePDF = (name: any) => {
		const invoiceContent = document.getElementById('invoiceContent')

		if (invoiceContent) {
			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			})

			const margin = 10
			const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
			const contentHeight = doc.internal.pageSize.getHeight() - 2 * margin

			html2canvas(invoiceContent, { scale: 2, useCORS: true }).then((canvas) => {
				const invoiceImg = canvas.toDataURL('image/jpeg', 1)

				// Page 1 - Invoice/Quotation
				doc.addImage(invoiceImg, 'JPEG', margin, margin, contentWidth, contentHeight)

				const pdfName = `${name || 'Document'}.pdf`
				doc.save(pdfName)
			})
		} else {
			console.error('Content not found.')
		}
	}

	if (loading) return <div className='p-10'>Loading...</div>
	if (!data) return <div className='p-10'>Data not found</div>

	const calculateTotalProductAmount = (): number => {
		return data.items.reduce((sum: number, item: any) => {
			const quantity = parseFloat(item.quantity?.toString() || '0') || 0
			const amount = parseFloat(item.amount?.toString() || '0') || 0
			return sum + quantity * amount
		}, 0)
	}

	const dueAmount = (data.net_amount || 0) - (data.paid_amount || 0)

	return (
		<>
			<PageTitle breadcrumbs={[]}>
				{type === 'invoice' ? 'Invoice View' : 'Quotation View'}
			</PageTitle>
			<div className='row justify-content-center'>
				<div className='col-md-8'>
					<div className='card mb-5'>
						<div className='card-body p-0'>
							{/* Main Content Area */}
							<div
								id='invoiceContent'
								className='bg-white p-10'
								style={{ color: '#000' }}>
								<p
									className='fw-bold fs-5 text-center mb-2 uppercase'
									style={{ color: '#000' }}>
									{type === 'invoice' ? 'INVOICE' : 'QUOTATION'}
								</p>
								<div className='border border-black'>
									{/* Header Section */}
									<div className='invoice-header row mt-2 p-3 align-items-start m-0'>
										<div className='col-8'>
											<p className='fs-4 mb-1'>
												<b>Gomzi Lifesciences LLP</b>
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mt-1 mb-1'>
												547,548, FIRST FLOOR, RJD TEXTILES PARK, Hazira Rd, Ichchhapor, PAL, Surat,
												Gujarat 394510
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mb-1'>
												Phone no.: <strong>83200 77993</strong>
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mb-1'>
												Email: <strong>Sales@Gomzilifesciences.In</strong>
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mb-1'>
												GSTIN: <strong>24ABBFG3336P1Z9</strong>, State: Gujarat
											</p>
										</div>
										<div className='col-4 text-center'>
											<img
												src='/media/logos/rag-logo.webp'
												width='60%'
												alt='Logo'
											/>
										</div>
									</div>

									{/* Bill To & Details Section */}
									<div className='invoice-details d-flex border-top border-black'>
										<div className='col-6 border-end border-black p-0'>
											<div
												className='border-bottom border-black px-2 py-1 fw-bold'
												style={{ fontSize: '13px', backgroundColor: '#add900' }}>
												Bill To
											</div>
											<div
												className='p-2'
												style={{ fontSize: '12px' }}>
												<strong>
													<p className='mb-1'>Name- {data.name || '-'}</p>
													<p className='mb-1'>Email- {data.email || '-'}</p>
													<p className='mb-1'>PAN No.- {data.pan_number || '-'}</p>
													<p className='mb-1'>GST No.- {data.gst_number || '-'}</p>
												</strong>
											</div>
										</div>
										<div className='col-6 p-0'>
											<div
												className='p-2'
												style={{ fontSize: '12px' }}>
												<p className='mb-1'>
													<strong>{type === 'invoice' ? 'Invoice' : 'Quotation'} No. :</strong>{' '}
													{data.invoice_number || data.quotation_number || '-'}
												</p>
												<p className='mb-1'>
													<strong>Date :-</strong> {DayJS(data.date).format('DD-MM-YYYY')}
												</p>
												<p className='mb-1'>
													<strong>Phone No. :-</strong> {data.mobile || '-'}
												</p>
												<p className='mb-1'>
													<strong>Address :-</strong>
													<span>
														{`${data.billing_address?.address_line_1 || ''}${
															data.billing_address?.city ? ', ' + data.billing_address.city : ''
														}${
															data.billing_address?.state ? ', ' + data.billing_address.state : ''
														}${
															data.billing_address?.pin_code
																? ', ' + data.billing_address.pin_code
																: ''
														}${
															data.billing_address?.country
																? ', ' + data.billing_address.country
																: ''
														}`}
													</span>
												</p>
											</div>
										</div>
									</div>

									{/* Items Table */}
									<div className='invoice-items mt-0'>
										<table className='table table-bordered border-black m-0'>
											<thead style={{ backgroundColor: '#add900' }}>
												<tr className='text-center border-bottom border-black'>
													<th
														className='border-end border-black py-1 px-2'
														style={{ fontSize: '13px', fontWeight: '500' }}>
														Product
													</th>
													<th
														className='border-end border-black py-1 px-2'
														style={{ fontSize: '13px', fontWeight: '500' }}>
														Weight
													</th>
													<th
														className='border-end border-black py-1 px-2'
														style={{ fontSize: '13px', fontWeight: '500' }}>
														Rate
													</th>
													<th
														className='border-end border-black py-1 px-2'
														style={{ fontSize: '13px', fontWeight: '500' }}>
														Qty
													</th>
													<th
														className='border-end border-black py-1 px-2'
														style={{ fontSize: '13px', fontWeight: '500' }}>
														Amount
													</th>
													{data.gst != '0' && (
														<th
															className='border-end border-black py-1 px-2'
															style={{ fontSize: '13px', fontWeight: '500' }}>
															GST
														</th>
													)}
													{data.discount != '0' && (
														<th
															className='border-end border-black py-1 px-2'
															style={{ fontSize: '13px', fontWeight: '500' }}>
															Dis
														</th>
													)}
													<th
														className='py-1 px-2'
														style={{ fontSize: '13px', fontWeight: '500' }}>
														Total
													</th>
												</tr>
											</thead>
											<tbody>
												{data.items?.map((item: any, index: number) => (
													<tr
														key={index}
														className='text-center'>
														<td
															className='text-start border-end border-black py-1 px-2'
															style={{ fontSize: '12px' }}>
															{item.item_name}
														</td>
														<td
															className='border-end border-black py-1 px-2'
															style={{ fontSize: '12px' }}>
															{item.item_weight
																? `${item.item_weight} ${item.item_weight_type || ''}`
																: '-'}
														</td>
														<td
															className='border-end border-black py-1 px-2'
															style={{ fontSize: '12px' }}>
															{item.amount || '-'}
														</td>
														<td
															className='border-end border-black py-1 px-2'
															style={{ fontSize: '12px' }}>
															{item.quantity || '-'}
														</td>
														<td
															className='border-end border-black py-1 px-2'
															style={{ fontSize: '12px' }}>
															{(item.amount * item.quantity).toFixed(0)}
														</td>
														{data.gst != '0' && (
															<td
																className='border-end border-black py-1 px-2'
																style={{ fontSize: '12px' }}>
																{item.gst || '0'}%
															</td>
														)}
														{data.discount != '0' && (
															<td
																className='border-end border-black py-1 px-2'
																style={{ fontSize: '12px' }}>
																{item.discount || '0'}
																{item.isDiscountPercentage ? '%' : '₹'}
															</td>
														)}
														<td
															className='py-1 px-2'
															style={{ fontSize: '12px' }}>
															{item.totalAmount || '-'}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>

									{/* Footer Details & Summary */}
									<div className='invoice-details d-flex border-top border-black'>
										<div className='col-6 border-end border-black p-0'>
											<div
												className='border-bottom border-black px-2 py-1 fw-bold'
												style={{ fontSize: '13px', backgroundColor: '#add900' }}>
												Description :-
											</div>
											<div
												className='p-2'
												style={{ fontSize: '12px' }}>
												{data.note || '-'}
											</div>
										</div>
										<div className='col-6 p-0'>
											<div
												className='border-bottom border-black px-2 py-1 fw-bold'
												style={{ fontSize: '13px', backgroundColor: '#add900' }}>
												Amount :-
											</div>
											<div
												className='p-2'
												style={{ fontSize: '12px' }}>
												<div className='d-flex justify-content-between mb-1'>
													<span className='fw-bold'>Total Amount:</span>
													<span>{calculateTotalProductAmount().toFixed(0)}/-</span>
												</div>
												<div className='d-flex justify-content-between mb-1'>
													<span>GST:</span>
													<span>
														+
														{data.items
															?.reduce((sum: number, item: any) => {
																const itemGst = parseFloat(item.gst) || 0
																const itemAmount = parseFloat(item.amount) || 0
																const itemQuantity = parseFloat(item.quantity) || 0
																return sum + (itemAmount * itemQuantity * itemGst) / 100
															}, 0)
															.toFixed(0)}
														/-
													</span>
												</div>
												{data.discount != '0' && (
													<div className='d-flex justify-content-between mb-1'>
														<span>Discount:</span>
														<span>-{data.discount || '-'}/-</span>
													</div>
												)}
												{data.service_charge?.map((charge: any, idx: number) => (
													<div
														key={idx}
														className='d-flex justify-content-between mb-1'>
														<span>{charge.charge_name}:</span>
														<span>+{charge.charge_amount}/-</span>
													</div>
												))}
												{data.freight_charges?.map((charge: any, idx: number) => (
													<div
														key={idx}
														className='d-flex justify-content-between mb-1'>
														<span>{charge.charge_name}:</span>
														<span>+{charge.charge_amount}/-</span>
													</div>
												))}
												<hr className='my-1 border-dark dashed' />
												<div className='d-flex justify-content-between fw-bolder mt-1 fs-6'>
													<span>Total Amount:</span>
													<span>{data.net_amount || '-'}/-</span>
												</div>
												{type === 'invoice' && (
													<>
														<div className='d-flex justify-content-between fw-bold'>
															<span>Paid Amount:</span>
															<span>{data.paid_amount || '-'}/-</span>
														</div>
														<div className='d-flex justify-content-between fw-bold text-danger'>
															<span>Due Amount:</span>
															<span>{dueAmount.toFixed(0)}/-</span>
														</div>
													</>
												)}
											</div>
										</div>
									</div>

									{/* Signature Section */}
									<div className='d-flex border-top border-black'>
										<div className='col-6 border-end border-black p-0'>
											<div
												className='border-bottom border-black px-2 py-1 fw-bold'
												style={{ fontSize: '13px', backgroundColor: '#add900' }}>
												Sign:
											</div>
											<div className='p-10'></div>
										</div>
										<div className='col-6 p-0'>
											<div
												className='border-bottom border-black px-2 py-1 fw-bold'
												style={{ fontSize: '13px', backgroundColor: '#add900' }}>
												Administrator:
											</div>
											<div className='text-center p-2'>
												<img
													src='/media/sign/goutam_sir.png'
													alt='sign'
													width='130px'
												/>
											</div>
										</div>
									</div>

									<div className='border-top border-black'>
										<div
											className='border-bottom border-black px-2 py-1 fw-bold'
											style={{ fontSize: '13px', backgroundColor: '#add900' }}>
											Terms and Conditions :-
										</div>
										<div
											className='px-2 py-2'
											style={{ fontSize: '11px' }}>
											<p className='mb-1'>
												<strong>*</strong> GST will be applicable additionally on all payments.
											</p>
											<p className='mb-1'>
												<strong>*</strong> Courier charges will be borne by the customer
												additionally.
											</p>
											<p className='mb-1'>
												<strong>*</strong> Payment made is non-refundable, non-transferrable and
												non-cancellable.
											</p>
											<p className='mb-1'>
												<strong>*</strong> 70% advance payment is required to confirm the order.
											</p>
										</div>
									</div>

									{/* Payment Details Section */}
									<div className='border-top border-black'>
										<div
											className='border-bottom border-black px-2 py-1 fw-bold'
											style={{ fontSize: '13px', backgroundColor: '#add900' }}>
											Payment Details
										</div>
										<div className='d-flex p-2'>
											<div className='me-5'>
												<img
													src='/media/gomzi-nutrition/payment_scan.png'
													alt='QR'
													width='110px'
												/>
											</div>
											<div style={{ fontSize: '12px' }}>
												<p className='my-1'>
													<strong>Bank Name: Axis Bank Adajan</strong>
												</p>
												<p className='my-1'>
													<strong>Account Holder Name: Gomzi life Science LLP</strong>
												</p>
												<p className='my-1'>
													<strong>Account Number: 924020043956068</strong>
												</p>
												<p className='my-1'>
													<strong>IFSC: UTIB0000566</strong>
												</p>
												<p className='my-1'>
													<strong>Account Type: Current Account</strong>
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Terms & Conditions Section now part of the main document if needed, but no separate page */}
						</div>
					</div>

					{/* Download Action */}
					<div className='text-center mb-20'>
						<button
							className='btn btn-success px-10 gap-2'
							onClick={() => generatePDF(data.name || 'document')}>
							<FontAwesomeIcon icon={faDownload} />
							Download {type === 'invoice' ? 'Invoice' : 'Quotation'}
						</button>
					</div>
				</div>
			</div>
		</>
	)
}

export default InvestorDocumentView
