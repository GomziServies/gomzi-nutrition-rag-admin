/* eslint-disable */
import React from 'react'
import html2pdf from 'html2pdf.js'
import TermAndCondition from '../../../components/TermAndCondition'

export interface CompanyInvoiceDocumentProps {
	invoiceData: {
		name?: string
		email?: string
		mobile?: string
		gst_number?: string
		pan_number?: string
		invoice_number?: string | number
		date?: string
		billing_address_line_1?: string
		billing_city?: string
		billing_state?: string
		billing_pin_code?: string
		billing_country?: string
		sales_person?: string
		discount?: string | number
		net_amount?: string | number
		paid_amount?: string | number
		note?: string
		[key: string]: any
	}
	items: Array<{
		item_name?: string
		item_weight?: string | number
		item_weight_type?: string
		amount?: string | number
		quantity?: string | number
		gst?: string | number
		discount?: string | number
		isDiscountPercentage?: boolean
		totalAmount?: string | number
		[key: string]: any
	}>
	dueAmount?: string | number
	showTerms?: boolean
	containerId?: string
}

/**
 * Download helper using html2pdf.
 * Preserves the exact identical options, font classes, and PDF rendering pipeline.
 */
export const generateCompanyInvoicePDF = async (name: string, contentId = 'invoiceContent', termsId = 'invoiceTermAndCondition') => {
	const invoiceContent = document.getElementById(contentId)
	const termsContent = document.getElementById(termsId)

	if (!invoiceContent || !termsContent) return

	invoiceContent.classList.add('pdf-font-black')
	termsContent.classList.add('pdf-font-black')

	const wrapper = document.createElement('div')
	wrapper.appendChild(invoiceContent.cloneNode(true))
	wrapper.appendChild(termsContent.cloneNode(true))

	const opt = {
		margin: [8, 8, 8, 8] as [number, number, number, number],
		filename: `${name || 'invoice'}.pdf`,
		image: {
			type: 'jpeg' as const,
			quality: 1,
		},
		html2canvas: {
			scale: 2,
			useCORS: true,
			scrollX: 0,
			scrollY: 0,
		},
		jsPDF: {
			unit: 'mm',
			format: 'a4',
			orientation: 'portrait' as const,
		},
		pagebreak: {
			mode: ['css', 'legacy'],
		},
	}

	await html2pdf().set(opt).from(wrapper).save()

	invoiceContent.classList.remove('pdf-font-black')
	termsContent.classList.remove('pdf-font-black')
}

/**
 * EXACT COMPANY INVOICE TEMPLATE
 * Unmodified layout, branding, GST, calculations, QR code, bank details, and signature.
 */
export const CompanyInvoiceDocument: React.FC<CompanyInvoiceDocumentProps> = ({
	invoiceData,
	items,
	dueAmount,
	showTerms = true,
	containerId = 'invoiceContent',
}) => {
	const hasGst = items.some((item) => Number(item?.gst) > 0)
	const hasDiscount = items.some((item) => Number(item?.discount) > 0)

	const calculateTotalProductAmount = (): number => {
		return items.reduce((sum, item) => {
			const quantity = parseFloat(item.quantity?.toString() || '0') || 0
			const amount = parseFloat(item.amount?.toString() || '0') || 0
			return sum + quantity * amount
		}, 0)
	}

	const calculateTotalGstAmount = (): number => {
		return items.reduce((sum, item) => {
			const quantity = parseFloat(item.quantity?.toString() || '0') || 0
			const amount = parseFloat(item.amount?.toString() || '0') || 0
			const gstPercent = parseFloat(item.gst?.toString() || '0') || 0
			const baseAmount = quantity * amount
			const gstAmount = (baseAmount * gstPercent) / 100
			return sum + gstAmount
		}, 0)
	}

	return (
		<div className='company-invoice-document-wrapper'>
			<div id={containerId}>
				<div className='card border-0 shadow-none'>
					<div className='card-body p-0'>
						<div>
							<p className='fw-bold fs-5 text-center mb-2'>TAX INVOICE</p>
							<div className='border border-black'>
								{/* Header */}
								<div className='invoice-header row mt-2 p-3 align-items-start m-0'>
									<div className='col-md-7 col-7'>
										<p className='fs-6 mb-1'>
											<b>RAG STRENGTH AND NUTRITION</b>
										</p>
										<p style={{ fontSize: '12px' }} className='mt-1 mb-1'>
											G-23-TIME SQUARE, Gaurav Path Road, Nr. Galaxy Circle, Pal, Surat, Gujarat 394510
										</p>
										<p style={{ fontSize: '12px' }} className='mb-1'>
											Phone no.: +91 98752 70200
										</p>
										<p style={{ fontSize: '12px' }} className='mb-1'>
											Email: info@ragnutrition.in
										</p>
										<p style={{ fontSize: '12px' }} className='mb-1'>
											GSTIN: 24ABOFR2172H1Z2
										</p>
									</div>
									<div className='col-md-5 col-5'>
										<div className='text-end'>
											<img
												src='/media/logos/rag-logo.webp'
												width='90%'
												alt='Company Logo'
											/>
										</div>
									</div>
								</div>

								{/* Bill To & Invoice Info */}
								<div className='invoice-details d-flex'>
									<div className='col-md-6 col-6 px-0'>
										<div
											className='bill-to border-bottom border-top border-black px-2'
											style={{ fontSize: '13px', fontWeight: 600 }}>
											Bill To
										</div>
										<strong>
											<p className='mt-2 px-2 mb-1' style={{ fontSize: '12px' }} id='inv-name'>
												Name: {invoiceData.name || 'N/A'}
											</p>
											<p className='px-2 mb-1' style={{ fontSize: '12px' }} id='inv-email'>
												Email: {invoiceData.email || 'N/A'}
											</p>
											<p className='px-2 mb-1' style={{ fontSize: '12px' }} id='inv-gst_number'>
												GST No: {invoiceData.gst_number || 'N/A'}
											</p>
											<p className='px-2 mb-1' style={{ fontSize: '12px' }} id='inv-pan_number'>
												PAN No: {invoiceData.pan_number || 'N/A'}
											</p>
										</strong>
									</div>
									<div className='col-md-6 col-6 border border-black border-bottom-0 border-end-0 text-right'>
										<div className='bill-name-date px-2 py-1'>
											<p style={{ fontSize: '12px' }} className='mb-1'>
												<strong>Invoice No. :</strong>
												<span id='inv-n' className='ms-1'>{invoiceData.invoice_number || 'N/A'}</span>
											</p>
											<p style={{ fontSize: '12px' }} className='mb-1'>
												<strong>Date :-</strong>
												<span id='inv-date' className='ms-1'>{invoiceData.date || 'N/A'}</span>
											</p>
											<p style={{ fontSize: '12px' }} className='mb-1'>
												<strong>Phone No. :-</strong>
												<span id='inv-mobile' className='ms-1'>{invoiceData.mobile || 'N/A'}</span>
											</p>
											<p style={{ fontSize: '12px' }} className='mb-1'>
												<strong>Address :-</strong>
												<span id='inv-address' className='ms-1'>
													{`${invoiceData.billing_address_line_1 || ''}${
														invoiceData.billing_address_line_1 &&
														(invoiceData.billing_city ||
															invoiceData.billing_state ||
															invoiceData.billing_pin_code ||
															invoiceData.billing_country)
															? ', '
															: ''
													}${invoiceData.billing_city || ''}${
														invoiceData.billing_city &&
														(invoiceData.billing_state || invoiceData.billing_pin_code)
															? ', '
															: ''
													}${invoiceData.billing_state || ''}${
														invoiceData.billing_state && invoiceData.billing_pin_code ? ', ' : ''
													}${invoiceData.billing_pin_code || ''}${
														(invoiceData.billing_city ||
															invoiceData.billing_state ||
															invoiceData.billing_pin_code) &&
														invoiceData.billing_country
															? ', '
															: ''
													}${invoiceData.billing_country || ''}`}
												</span>
											</p>
										</div>
									</div>
								</div>

								{/* Items Table */}
								<div className='invoice-items'>
									<table className='border border-black w-100'>
										<thead>
											<tr>
												<th className='border border-black p-1' style={{ fontSize: '13px' }}>Product</th>
												<th className='border border-black p-1' style={{ fontSize: '13px' }}>Weight</th>
												<th className='border border-black p-1' style={{ fontSize: '13px' }}>Rate</th>
												<th className='border border-black p-1' style={{ fontSize: '13px' }}>Qty.</th>
												<th className='border border-black p-1' style={{ fontSize: '13px' }}>Amount</th>
												{hasGst && (
													<th className='border border-black p-1' style={{ fontSize: '13px' }}>GST</th>
												)}
												{hasDiscount && (
													<th className='border border-black p-1' style={{ fontSize: '13px' }}>
														Dis ({items[0]?.isDiscountPercentage ? '%' : '₹'})
													</th>
												)}
												<th className='border border-black p-1' style={{ fontSize: '13px' }}>Total</th>
											</tr>
										</thead>
										<tbody>
											{items.length === 0 ? (
												<tr>
													<td className='border border-black p-1'><div id='inv-product'>-</div></td>
													<td className='border border-black p-1'><span className='inv-total'>-</span></td>
													<td className='border border-black p-1'><span className='inv-amount'>-</span></td>
													<td className='border border-black p-1'><span className='inv-quantity'>-</span></td>
													<td className='border border-black p-1'><span className='inv-amount'>-</span></td>
													{hasGst && <td className='border border-black p-1'><span className='inv-amount'>-</span></td>}
													{hasDiscount && <td className='border border-black p-1'><span className='inv-amount'>-</span></td>}
													<td className='border border-black p-1'><span className='inv-amount'>-</span></td>
												</tr>
											) : (
												items.map((item, index) => {
													const itemWeight = item?.item_weight ? `${item.item_weight} ${item.item_weight_type || 'kg'}` : '-'
													const rawAmount = (parseFloat(String(item.amount || '0')) || 0) * (parseFloat(String(item.quantity || '0')) || 0)
													return (
														<tr key={index}>
															<td className='border border-black p-1'>
																<span className='inv-product' style={{ fontSize: '12px' }}>
																	{item.item_name || '-'}
																</span>
															</td>
															<td className='border border-black p-1'>
																<span className='inv-total' style={{ fontSize: '12px' }}>
																	{itemWeight}
																</span>
															</td>
															<td className='border border-black p-1'>
																<span className='inv-amount' style={{ fontSize: '12px' }}>
																	₹{item.amount || '-'}/-
																</span>
															</td>
															<td className='border border-black p-1'>
																<span className='inv-quantity' style={{ fontSize: '12px' }}>
																	{item.quantity || '-'}
																</span>
															</td>
															<td className='border border-black p-1'>
																<span className='inv-amount' style={{ fontSize: '12px' }}>
																	₹{rawAmount || '-'}/-
																</span>
															</td>
															{hasGst && (
																<td className='border border-black p-1'>
																	<span className='inv-paid' style={{ fontSize: '12px' }}>
																		{Number(item.gst) > 0 ? `${item.gst}%` : '-'}
																	</span>
																</td>
															)}
															{hasDiscount && (
																<td className='border border-black p-1'>
																	<span className='inv-paid' style={{ fontSize: '12px' }}>
																		{Number(item.discount) > 0
																			? `${item.discount}${item.isDiscountPercentage ? '%' : '₹'}`
																			: '-'}
																	</span>
																</td>
															)}
															<td className='border border-black p-1'>
																<span className='inv-total' style={{ fontSize: '12px' }}>
																	₹{item.totalAmount ? item.totalAmount : '-'}/-
																</span>
															</td>
														</tr>
													)
												})
											)}
										</tbody>
									</table>
								</div>

								{/* Amount Summary */}
								<div className='invoice-details d-flex'>
									<div className='border border-black px-0 col-md-12 col-12' style={{ fontSize: '12px' }}>
										<div>
											<div className='bill-to px-2 border-bottom border-black' style={{ fontSize: '13px', fontWeight: 600 }}>
												Amount :
											</div>
											<div className='px-2 py-1'>
												<div className='d-flex justify-content-between'>
													<span className='fw-bold'>Amount:</span>
													<span className='fw-bold'>₹{calculateTotalProductAmount()}/-</span>
												</div>
												{hasGst && (
													<div className='d-flex justify-content-between'>
														<span>GST:</span>
														<span>+{calculateTotalGstAmount()}/-</span>
													</div>
												)}
												{Number(invoiceData.discount) > 0 && (
													<div className='d-flex justify-content-between'>
														<span>Discount:</span>
														<span>-{invoiceData.discount}/-</span>
													</div>
												)}
												<hr className='my-2 border-dark' style={{ borderStyle: 'dashed' }} />
												<div className='d-flex justify-content-between fw-bold'>
													<span>Total Amount:</span>
													<span>₹{invoiceData.net_amount || '-'}/-</span>
												</div>
												<div className='d-flex justify-content-between fw-bold'>
													<span>Paid Amount:</span>
													<span>₹{invoiceData.paid_amount || '-'}/-</span>
												</div>
												<div className='d-flex justify-content-between fw-bold'>
													<span>Due Amount:</span>
													<span>₹{dueAmount !== undefined ? dueAmount : (Number(invoiceData.net_amount || 0) - Number(invoiceData.paid_amount || 0))}/-</span>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Payment Details & Signature */}
								<div className='invoice-details d-flex'>
									<div className='col-8 border border-black px-0'>
										<div className='bill-to px-2 border-bottom border-black' style={{ fontSize: '13px', fontWeight: 600 }}>
											Payment Details
										</div>
										<div className='d-flex align-items-center'>
											<div className='px-2'>
												<img
													src='/media/gomzi-nutrition/rag-qr-code.png'
													alt='QR Code'
													width='110px'
												/>
											</div>
											<div className='bill-name-date px-2'>
												<p className='my-1' style={{ fontSize: '12px' }}>
													<strong>UPI ID: bom260801350628@mahb</strong>
												</p>
												<p className='my-1' style={{ fontSize: '12px' }}>
													<strong>Bank Name: Bank of Maharashtra, Jahangirabad</strong>
												</p>
												<p className='my-1' style={{ fontSize: '12px' }}>
													<strong>Account Holder Name: RAG STRENGTH & NUTRITION</strong>
												</p>
												<p className='my-1' style={{ fontSize: '12px' }}>
													<strong>Account Number: 60587480966</strong>
												</p>
												<p className='my-1' style={{ fontSize: '12px' }}>
													<strong>IFSC: MAHB0002533</strong>
												</p>
												<p className='my-1' style={{ fontSize: '12px' }}>
													<strong>Account Type: Current Account</strong>
												</p>
											</div>
										</div>
									</div>
									<div id='invoice-signature' className='invoice-details col-md-4 col-4 border-start border-black'>
										<div className='bill-to px-2 border-bottom border-black' style={{ fontSize: '13px', fontWeight: 600 }}>
											Administrator:
										</div>
										<div className='px-2 py-3 text-center'>
											<img
												src='/media/sign/chirag-pandey-sign.webp'
												alt='signature'
												width='90%'
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{showTerms && (
				<div id='invoiceTermAndConditionWrapper' className='mt-4'>
					<TermAndCondition />
				</div>
			)}
		</div>
	)
}

export default CompanyInvoiceDocument
