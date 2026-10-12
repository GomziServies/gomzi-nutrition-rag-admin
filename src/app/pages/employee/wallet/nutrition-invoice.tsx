import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { getInvoice } from '../../../Functions/FGGroup'

const NutritionInvoicePage: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoice_id: string | null = searchParams.get('invoice_id')

	const [invoiceData, setInvoiceData] = useState<any>({
		invoice_number: '',
		date: '',
		name: '',
		branch_name: '',
		sales_person: '',
		billing_address_line_1: '',
		billing_country: '',
		billing_state: '',
		billing_city: '',
		billing_pin_code: '',
		duration: '',
		duration_number: '',
		mobile: '',
		gst_number: '',
		pan_number: '',
		email: '',
		items: [],
		payment_method: '',
		amount: '',
		gst: '',
		discount: '',
		net_amount: '',
		paid_amount: '',
		note: '',
		item_weight: '',
		item_type: '',
		item_weight_type: '',
		service_charge: [],
		freight_charges: [],
	})

	const adminType = localStorage.getItem('admin')

	const fetchInvoiceData = async () => {
		try {
			const response: any = await getInvoice({ id: String(invoice_id) })
			const data = response.data[0]

			setInvoiceData({
				invoice_number: data?.invoice_number,
				date: data?.date,
				name: data?.name,
				billing_address_line_1: data?.billing_address?.address_line_1 || '',
				billing_country: data?.billing_address?.country || '',
				billing_state: data?.billing_address?.state || '',
				billing_city: data?.billing_address?.city || '',
				billing_pin_code: data?.billing_address?.pin_code || '',
				mobile: data?.mobile,
				gst_number: data?.gst_number,
				pan_number: data?.pan_number,
				email: data?.email,
				items: data.items || [],
				payment_method: data?.payment_method,
				net_amount: data?.net_amount,
				paid_amount: data?.paid_amount,
				note: data?.note,
				gst: data?.gst || '',
				discount: data?.discount || '',
				branch_name: data?.branch_name || '',
				sales_person: data?.sales_person || '',
				service_charge: data?.service_charge || [],
				freight_charges: data?.freight_charges || [],
			})
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchInvoiceData()
	}, [])

	const generatePDF = (name: any) => {
		const invoiceContent = document.getElementById('invoiceContent')
		const invoiceTermAndCondition = document.getElementById('invoiceTermAndCondition')

		if (invoiceContent && invoiceTermAndCondition) {
			invoiceContent.classList.add('pdf-font-black')
			invoiceTermAndCondition.classList.add('pdf-font-black')

			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			})

			const margin = 10
			const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
			const contentHeight = doc.internal.pageSize.getHeight() - 2 * margin

			Promise.all([
				html2canvas(invoiceContent, { scale: 2, useCORS: true }),
				html2canvas(invoiceTermAndCondition, { scale: 2, useCORS: true }),
			]).then(([invoiceCanvas, termsCanvas]) => {
				const invoiceImg = invoiceCanvas.toDataURL('image/jpeg', 1)
				const termsImg = termsCanvas.toDataURL('image/jpeg', 1)

				invoiceContent.classList.remove('pdf-font-black')
				invoiceTermAndCondition.classList.remove('pdf-font-black')

				// Page 1 - Invoice
				doc.addImage(invoiceImg, 'JPEG', margin, margin, contentWidth, contentHeight)

				// Page 2 - Terms and Conditions
				doc.addPage()
				doc.addImage(termsImg, 'JPEG', margin, margin, contentWidth, contentHeight)

				const pdfName = `${name || 'demoName'}.pdf`
				doc.save(pdfName)
			})
		} else {
			console.error('Invoice content or terms not found.')
		}
	}

	// Calculate total product amount without discount and GST
	const calculateTotalProductAmount = (): number => {
		return invoiceData.items.reduce((sum: number, item: any) => {
			const quantity = parseFloat(item.quantity?.toString() || '0') || 0
			const amount = parseFloat(item.amount?.toString() || '0') || 0
			return sum + quantity * amount
		}, 0)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Invoice</PageTitle>

			<div className='row'></div>
			<div className='col-md-6 mt-3'>
				<div className='card'>
					<div className='card-body'>
						<div id='invoiceContent'>
							<p className='fw-bold fs-5 text-center mb-2'>INVOICE</p>
							<div className='border border-black'>
								<div className='invoice-header row mt-2 p-3 align-items-start'>
									<div className='col-md-8'>
										<p className='fs-4 mb-1'>
											<b>{adminType == 'Store' ? 'Gomzi Nutrition ' : 'Gomzi Lifesciences LLP'}</b>
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mt-1 mb-1'>
											{adminType == 'Store'
												? 'G-23-TIME SQUARE, Gaurav Path Road, TP 10 Main Rd, Surat, Gujarat, Opp. Shree Bharti Residency, Surat, Gujarat 394510'
												: '547,548, FIRST FLOOR, RJD TEXTILES PARK, Hazira Rd, Ichchhapor, PAL, Surat, Gujarat 394510'}
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											Phone no.:
											<strong>
												{adminType == 'Store' ? '8866465275 / 9081091068' : '83200 77993'}
											</strong>
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											Email:
											<strong id='emailLabel'>
												{adminType == 'Store'
													? 'gomzinutrition.palshop@gmail.com'
													: 'Sales@Gomzilifesciences.In'}
											</strong>
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											GSTIN:
											<strong>{adminType == 'Store' ? '-' : '24ABBFG3336P1Z9'}</strong>
											{adminType == 'Store' ? '' : ' , State: Gujarat'}
										</p>
									</div>
									<div className='col-md-4'>
										<div className='text-center'>
											<img
												src='/media/logos/rag-logo.webp'
												width='60%'
												alt='Company Logo'
											/>
										</div>
									</div>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-md-6 border border-black px-0'>
										<div
											className='bill-to border-bottom border-black'
											style={{ fontSize: '13px' }}>
											Bill To
										</div>
										<strong>
											<p
												className='mt-2 px-2'
												style={{ fontSize: '12px' }}
												id='inv-name'>
												Name- {invoiceData.name || '-'}
											</p>

											<p
												className='px-2'
												style={{ fontSize: '12px' }}
												id='inv-email'>
												Email- {invoiceData.email || '-'}
											</p>
											<p
												className='px-2'
												style={{ fontSize: '12px' }}
												id='inv-pan_number'>
												PAN No.- {invoiceData.pan_number || '-'}
											</p>
											<p
												className='px-2'
												style={{ fontSize: '12px' }}
												id='inv-gst_number'>
												GST No.- {invoiceData.gst_number || '-'}
											</p>
										</strong>
									</div>
									<div className='col-md-6 border border-black text-right'>
										<div className='bill-name-date px-2'>
											<p style={{ fontSize: '12px' }}>
												<strong>Invoice No. :</strong>
												<span id='inv-n'>{invoiceData.invoice_number || '-'}</span>
											</p>
											<p style={{ fontSize: '12px' }}>
												<strong>Date :-</strong>
												<span id='inv-date'>{invoiceData.date || '-'}</span>
											</p>
											<p style={{ fontSize: '12px' }}>
												<strong>Phone No. :-</strong>
												<span id='inv-mobile'>{invoiceData.mobile || '-'}</span>
											</p>
											<p style={{ fontSize: '12px' }}>
												<strong>Address :-</strong>
												<span id='inv-address'>
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
								<div className='invoice-items'>
									<table className='border border-black'>
										<thead>
											<tr>
												<th
													className='border border-black'
													style={{ fontSize: '13px' }}>
													Product
												</th>
												<th
													className='border border-black'
													style={{ fontSize: '13px' }}>
													Weight
												</th>
												<th
													className='border border-black'
													style={{ fontSize: '13px' }}>
													Rate
												</th>
												<th
													className='border border-black'
													style={{ fontSize: '13px' }}>
													Quantity
												</th>
												<th
													className='border border-black'
													style={{ fontSize: '13px' }}>
													Amount
												</th>
												{invoiceData.gst != '0' ? (
													<th
														className='border border-black'
														style={{ fontSize: '13px' }}>
														GST
													</th>
												) : (
													''
												)}
												{invoiceData.discount != '0' && invoiceData.items.length > 0 ? (
													<th
														className='border border-black'
														style={{ fontSize: '13px' }}>
														Dis
													</th>
												) : (
													''
												)}
												<th
													className='border border-black'
													style={{ fontSize: '13px' }}>
													Total
												</th>
											</tr>
										</thead>
										<tbody>
											{invoiceData.items.length == 0 ? (
												<tr>
													<td className='border border-black'>
														<div id='inv-product'>-</div>
													</td>
													<td className='border border-black'>
														<span className='inv-total'>-</span>
													</td>
													<td className='border border-black'>
														<span className='inv-paid'>-</span>
													</td>
													<td className='border border-black'>
														<span className='inv-total'>-</span>
													</td>
													<td className='border border-black'>
														<span className='inv-total'>-</span>
													</td>
												</tr>
											) : (
												invoiceData.items.map((item: any, index: any) => {
													return (
														<tr key={index}>
															<td>
																<div
																	id='inv-product'
																	style={{ fontSize: '12px' }}>
																	{item.item_name}
																</div>
															</td>
															<td>
																<span
																	className='inv-total'
																	style={{ fontSize: '12px' }}>
																	{item.item_weight
																		? `${item.item_weight} ${item.item_weight_type || ''}`
																		: '-'}
																</span>
															</td>
															<td>
																<span
																	className='inv-total'
																	style={{ fontSize: '12px' }}>
																	{item.amount || '-'}
																</span>
															</td>
															<td>
																<span
																	className='inv-paid'
																	style={{ fontSize: '12px' }}>
																	{item.quantity || '-'}
																</span>
															</td>
															<td>
																<span
																	className='inv-paid'
																	style={{ fontSize: '12px' }}>
																	{item.amount * item.quantity || '-'}
																</span>
															</td>
															{item.gst != '0' ? (
																<td>
																	<span
																		className='inv-paid'
																		style={{ fontSize: '12px' }}>
																		{item.gst || '0'}%
																	</span>
																</td>
															) : (
																''
															)}
															{item.discount != '0' ? (
																<td>
																	<span
																		className='inv-paid'
																		style={{ fontSize: '12px' }}>
																		{item.discount || '0'}
																		{item.isDiscountPercentage ? '%' : '₹'}
																	</span>
																</td>
															) : (
																''
															)}
															<td>
																<span
																	className='inv-total'
																	style={{ fontSize: '12px' }}>
																	{item.totalAmount ? item.totalAmount : '-'}
																</span>
															</td>
														</tr>
													)
												})
											)}
										</tbody>
									</table>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-md-6 border border-black px-0'>
										<div
											className='bill-to px-2 border-bottom border-black'
											style={{ fontSize: '13px' }}>
											Description :-
										</div>
										<p
											style={{ fontSize: '12px' }}
											className='px-2'>
											<b></b> <span id='inv-notes'> {invoiceData.note || '-'}</span>{' '}
										</p>
									</div>
									<div className='col-md-6 border border-black px-0'>
										<div
											className='bill-to px-2 border-bottom border-black'
											style={{ fontSize: '13px' }}>
											Amount :-
										</div>
										<div className='bill-name-date px-2 py-1'>
											<div className='d-flex justify-content-between'>
												<span
													className='fw-bold'
													style={{ fontSize: '12px' }}>
													Amount:
												</span>
												<span
													className='fw-bold'
													style={{ fontSize: '12px' }}>
													{calculateTotalProductAmount()}/-
												</span>
											</div>
											<div className='d-flex justify-content-between'>
												<span style={{ fontSize: '12px' }}>GST:</span>
												<span style={{ fontSize: '12px' }}>
													+
													{invoiceData.items.reduce((sum: number, item: any) => {
														const itemGst = parseFloat(item.gst) || 0
														const itemAmount = parseFloat(item.amount) || 0
														const itemQuantity = parseFloat(item.quantity) || 0
														const baseAmount = itemAmount * itemQuantity
														const gstAmount = (baseAmount * itemGst) / 100
														return sum + gstAmount
													}, 0)}
													/-
												</span>
											</div>

											{invoiceData.discount != '0' && (
												<div className='d-flex justify-content-between'>
													<span style={{ fontSize: '12px' }}>Discount:</span>
													<span style={{ fontSize: '12px' }}>-{invoiceData.discount || '-'}/-</span>
												</div>
											)}

											{invoiceData.service_charge && invoiceData.service_charge.length > 0 && (
												<>
													<hr
														className='my-2 border-dark'
														style={{ borderStyle: 'dashed' }}
													/>
													<span
														className='fw-bold'
														style={{ fontSize: '12px' }}>
														Service Charges:
													</span>
													{invoiceData.service_charge.map((charge: any, index: number) => (
														<div key={index}>
															<div className='d-flex justify-content-between'>
																<span style={{ fontSize: '12px' }}>{charge.charge_name}:</span>
																<span style={{ fontSize: '12px' }}>+{charge.charge_amount}/-</span>
															</div>
														</div>
													))}
												</>
											)}

											{invoiceData.freight_charges && invoiceData.freight_charges.length > 0 && (
												<>
													<hr
														className='my-2 border-dark'
														style={{ borderStyle: 'dashed' }}
													/>
													<span
														className='fw-bold'
														style={{ fontSize: '12px' }}>
														Freight Charges:
													</span>
													{invoiceData.freight_charges.map((charge: any, index: number) => (
														<div key={index}>
															<div className='d-flex justify-content-between'>
																<span style={{ fontSize: '12px' }}>{charge.charge_name}:</span>
																<span style={{ fontSize: '12px' }}>+{charge.charge_amount}/-</span>
															</div>
														</div>
													))}
												</>
											)}

											<hr
												className='my-2 border-dark'
												style={{ borderStyle: 'dashed' }}
											/>

											<div className='d-flex justify-content-between fw-bold'>
												<span style={{ fontSize: '12px' }}>Total Amount:</span>
												<span style={{ fontSize: '12px' }}>{invoiceData.net_amount || '-'}/-</span>
											</div>
											<div className='d-flex justify-content-between fw-bold'>
												<span style={{ fontSize: '12px' }}>Paid Amount:</span>
												<span style={{ fontSize: '12px' }}>{invoiceData.paid_amount || '-'}/-</span>
											</div>

											<div className='d-flex justify-content-between fw-bold'>
												<span style={{ fontSize: '12px' }}>Due Amount:</span>
												<span style={{ fontSize: '12px' }}>
													{invoiceData.net_amount - invoiceData.paid_amount || '-'}/-
												</span>
											</div>
										</div>
									</div>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-md-6 border border-black px-0'>
										<div
											className='bill-to px-2 border-bottom border-black '
											style={{ fontSize: '13px' }}>
											Sign:
										</div>
									</div>
									<div className='col-md-6 border border-black px-0'>
										<div
											className='bill-to px-2 border-bottom border-black'
											style={{ fontSize: '13px' }}>
											Administrator:
										</div>
										<div className='px-2 d-flex justify-content-center'>
											<img
												src={
													adminType == 'Store'
														? '/media/sign/chirag.png'
														: '/media/sign/goutam_sir.png'
												}
												alt='sign'
												width='130px'
											/>
										</div>
									</div>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-12 border border-black px-0'>
										<div className='bill-to px-2 border-bottom border-black'>Payment Details</div>
										<div className='d-flex'>
											<div className='px-2'>
												<img
													src={
														adminType == 'Store'
															? '/media/gomzi-nutrition/payment_scan.png'
															: '/media/gomzi-nutrition/payment_scan.png'
													}
													alt='sign'
													width='110px'
												/>
											</div>
											<div className='bill-name-date px-2'>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>Bank Name: Axis Bank Adajan</strong>
												</p>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>Account Holder Name: Gomzi life Science LLP</strong>
												</p>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>Account Number: 924020043956068</strong>
												</p>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>IFSC: UTIB0000566</strong>
												</p>
												<p
													className='my-1'
													style={{ fontSize: '12px' }}>
													<strong>Account Type: Current Account</strong>
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className='col-md-12 fv-row mt-10 text-center'>
							<button
								type='button'
								className='btn btn-success'
								onClick={() => generatePDF(invoiceData?.name)}>
								Download Invoice
							</button>
						</div>
					</div>
				</div>
			</div>
			<div
				className='col-md-6 mt-3'
				style={{ height: '0px', overflow: 'hidden' }}>
				<div className='card'>
					<div className='card-body'>
						<div id='invoiceTermAndCondition'>
							<p className='fw-bold fs-5 text-center mb-2'>
								Gomzi Life Sciences – Supplement Manufacturing Terms & Conditions
							</p>
							<div className='border'>
								<div className='invoice-details d-flex'>
									<div className='col-md-12 border px-0'>
										<div className='bill-to px-2'>Terms and Conditions :-</div>
										<div className='px-2'>
											<p
												style={{ fontSize: '12px' }}
												className='mt-1'>
												Welcome to Gomzi Life Sciences, your trusted partner in premium-quality
												supplement manufacturing. To maintain smooth production and timely delivery,
												we request all clients to strictly follow the terms below:
											</p>
											<div>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>1. Payment Policy</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>*</strong> 100% advance payment is compulsory for confirming any
													manufacturing order.
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>*</strong> This is necessary as we immediately initiate
													procurement of raw materials, packaging, and production setup.
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>*</strong> In case of partial payment approval, the remaining
													balance must be paid within 7 days from the date of order confirmation.
												</p>
											</div>
											<div>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong> {'=>'} Important Note:</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>*</strong> If full payment is not received in time, we cannot
													proceed to the sticker/batch number stage, which can cause major losses
													and project delays.
												</p>
											</div>
											<div>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>2. GST (5%) is Mandatory</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>*</strong> 5% GST is applicable on all orders, as per government
													guidelines.
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>*</strong> We also pay GST on our raw material purchases—hence,
													orders cannot be processed or dispatched without GST payment.
												</p>
											</div>
											<div>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>3. Transport & Delivery Charges</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>*</strong> All transport or courier charges are 100% to be borne
													by the client.
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>*</strong> You may:
													<ul>
														<li>Collect the goods yourself</li>
														<li>Arrange your own transport</li>
														<li>Or pay us courier charges in advance for dispatch</li>
													</ul>
												</p>
											</div>
											<div>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>4. Dispatch Confirmation & Responsibility Clause</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>*</strong> A video of the packed goods will be shared with you
													before dispatch for final confirmation.
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>*</strong> Once confirmed, Gomzi Life Sciences is not responsible
													for any issues related to damage, loss, or complaints after dispatch.
												</p>
											</div>
											<div>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>5. Minimum Order Quantity (MOQ)</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>*</strong> Orders are subject to minimum quantity requirements,
													which vary depending on the product.
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>*</strong> Please confirm the MOQ for your specific product before
													placing an order.
												</p>
											</div>
											<div>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>6. Formula Finalization</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>*</strong> Once your formula (flavor, ingredients, etc.) is
													finalized and production begins, no changes can be made.
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>*</strong> Any further changes will be treated as a new order, and
													additional costs will apply.
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>*</strong> If the formulation is provided by the client, any
													further consequences regarding the nature of goods will be handled by the
													client.
												</p>
											</div>
											<div>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>7. Refund & Cancellation Policy</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>*</strong> No refund or cancellation is allowed once the
													production process has begun.
												</p>
												<p style={{ fontSize: '12px' }}>
													<strong>*</strong> If cancelled before production, a processing fee will
													be deducted from the advance.
												</p>
											</div>
											<div>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>8. Branding & Confidentiality</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>*</strong> We value your brand identity and maintain full
													confidentiality of your formulas and project details.
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mt-1'>
													<strong>*</strong> Your formulation will never be shared with any third
													party without written consent.
												</p>
											</div>
											<div>
												<p
													style={{ fontSize: '10px' }}
													className='mt-1'>
													<strong>9. Production Timeline</strong>
												</p>
												<p
													style={{ fontSize: '10px' }}
													className='mt-1'>
													<strong>*</strong> Once the order is confirmed and the label design is
													finalized, production will begin only after final label approval from the
													client.
												</p>
												<p style={{ fontSize: '10px' }}>
													<strong>*</strong> After label approval, the manufacturing process will
													take approximately <strong>20 working days</strong> to complete.
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className='col-md-12 fv-row mt-10 text-center'>
							<button
								type='button'
								className='btn btn-success'
								onClick={() => generatePDF(invoiceData.name)}>
								Download Invoice
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default NutritionInvoicePage
