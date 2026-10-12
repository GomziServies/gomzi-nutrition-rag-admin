import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { getInvoice } from '../../../Functions/FGGroup'

const FgroupInvoicePage: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoice_id: string | null = searchParams.get('invoice_id')
	const [isDiscountPercentage, setIsDiscountPercentage] = useState(true)

	const [invoiceData, setInvoiceData] = useState<any>({
		invoice_number: '',
		date: '',
		name: '',
		branch_name: 'Vesu',
		billing_address: '',
		mobile: '',
		email: '',
		duration: '',
		duration_number: '',
		items: '',
		payment_method: '',
		bank_details: '',
		amount: '',
		gst: '',
		discount: '',
		net_amount: '',
		paid_amount: '',
		note: '',
	})

	const fetchInvoiceData = async () => {
		try {
			const response: any = await getInvoice({ id: String(invoice_id) })
			const data = response.data[0]

			let DurationSplit = data?.items[0]?.duration?.split(' ')

			const setData = {
				invoice_number: data.invoice_number,
				date: data.date,
				name: data.name,
				user_id: data.user_id,
				branch_name: data.branch_name,
				duration: DurationSplit ? DurationSplit[1] : '',
				duration_number: DurationSplit ? DurationSplit[0] : '',
				billing_address: data?.billing_address?.address_line_1 || '',
				mobile: data.mobile,
				email: data.email,
				items: data.items[0]?.item_name || '',
				payment_method: data.payment_method,
				bank_details: data.bank_details?.account_type || '',
				amount: data?.amount,
				gst: data?.items[0]?.gst,
				discount: data?.items[0]?.discount,
				net_amount: data.net_amount,
				paid_amount: data.paid_amount,
				note: data.note,
			}
			setInvoiceData(setData)

			// Determine discount type based on the value
			if (data?.items[0]?.discount !== undefined) {
				const discountValue = +data.items[0].discount
				const amountValue = +data.amount
				if (!isNaN(discountValue) && !isNaN(amountValue) && amountValue > 0) {
					// Set discount type based on value: < 100 = percentage, >= 100 = rupee
					setIsDiscountPercentage(discountValue < 100)
				}
			}
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

	return (
		<>
			<PageTitle breadcrumbs={[]}>Invoice</PageTitle>

			<div className='row'>
				<div className='col-md-6 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<div id='invoiceContent'>
								<p className='fw-bold fs-5 text-center mb-2'>INVOICE</p>
								<div className='border'>
									<div className='invoice-header row mt-2 p-3'>
										<div className='col-md-8'>
											<p className='fs-4 mb-1'>
												<b>Fitness with Gomzi International Institute of Teaching</b>
											</p>
											{invoiceData.branch_name == 'Vesu' ? (
												<>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1 mb-1'>
														A- 301, Ambrosia Business Hub, VIP Road, beside SMC Garden, Vesu, Surat,
														Gujarat 395007
													</p>

													<p
														style={{ fontSize: '10px' }}
														className='mb-1'>
														Brand Name:
														<strong> Vesu</strong>
													</p>
												</>
											) : invoiceData.branch_name == 'Adajan' ? (
												<>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1 mb-1'>
														228-TIME SQUARE, GauravPath Road, TP 10 Main Rd, opp. Shree Bharti
														Residency, Surat, Gujarat 394510
													</p>

													<p
														style={{ fontSize: '10px' }}
														className='mb-1'>
														Brand Name:
														<strong> Adajan</strong>
													</p>
												</>
											) : invoiceData.branch_name == 'Katargam' ? (
												<>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1 mb-1'>
														323 3'rd floor, Laxmi Enclave-1, opp. Gajera School, Chitrakut Society,
														Katargam, Surat, Gujarat 395004
													</p>

													<p
														style={{ fontSize: '10px' }}
														className='mb-1'>
														Brand Name:
														<strong> Katargam</strong>
													</p>
												</>
											) : (
												<>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1 mb-1'>
														Address:
													</p>

													<p
														style={{ fontSize: '10px' }}
														className='mb-1'>
														Brand Name:
													</p>
												</>
											)}
											<p
												style={{ fontSize: '10px' }}
												className='mb-1'>
												Phone no.:
												<strong>8866842520</strong>
											</p>
											<p
												style={{ fontSize: '10px' }}
												className='mb-1'>
												Email:
												<strong id='emailLabel'>fitnesswithgomzi@gmail.com</strong>
											</p>
											<p
												style={{ fontSize: '10px' }}
												className='mb-1'>
												GSTIN:
												<strong>24AAGFF2816D1ZX</strong> , State: 24-Gujarat
											</p>
										</div>
										<div className='col-md-4'>
											<div className='text-center'>
												<img
													src='/media/logos/fgiit-logo.png'
													width='60%'
													alt='Company Logo'
												/>
											</div>
										</div>
									</div>
									<div className='invoice-details d-flex'>
										<div className='col-md-5 border px-0'>
											<div className='bill-to'>Bill To</div>
											<strong>
												<p
													className='mt-2 px-2'
													style={{ fontSize: '14px' }}
													id='inv-name'>
													{invoiceData.name || '-'}
												</p>
											</strong>
											<strong>
												<p
													className='px-2'
													style={{ fontSize: '14px' }}
													id='inv-email'>
													{invoiceData.email || '-'}
												</p>
											</strong>
										</div>
										<div className='col-md-7 border text-right'>
											<div className='bill-name-date px-2'>
												<p>
													<strong>Invoice No. :</strong>
													<span id='inv-n'>{invoiceData.invoice_number || '-'}</span>
												</p>
												<p className=''>
													<strong>Date :-</strong>
													<span id='inv-date'>{invoiceData.date || '-'}</span>
												</p>
												<p className=''>
													<strong>Phone No. :-</strong>
													<span id='inv-mobile'>{invoiceData.mobile || '-'}</span>
												</p>
												<p className=''>
													<strong>Address :-</strong>
													<span id='inv-address'>{invoiceData.billing_address || '-'}</span>
												</p>
											</div>
										</div>
									</div>
									<div className='invoice-items'>
										<table>
											<thead>
												<tr>
													<th>Services</th>
													{invoiceData.gst != '0' || invoiceData.discount != '0' ? (
														<th>Amount</th>
													) : (
														''
													)}
													{invoiceData.gst != '0' ? <th>GST</th> : ''}
													{invoiceData.discount != '0' ? <th>Dis</th> : ''}
													<th>Total Amount</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td>
														<div id='inv-product'>{invoiceData.items}</div>
													</td>
													{invoiceData.gst != '0' || invoiceData.discount != '0' ? (
														<td>
															<span className='inv-paid'>{invoiceData.amount || '-'}</span>
														</td>
													) : (
														''
													)}
													{invoiceData.gst != '0' ? (
														<td>
															<span className='inv-paid'>{invoiceData.gst || '0 '}%</span>
														</td>
													) : (
														''
													)}
													{invoiceData.discount != '0' ? (
														<td>
															<span className='inv-paid'>
																{' '}
																{invoiceData.discount || '0'}
																{isDiscountPercentage ? ' %' : ' ₹'}
															</span>
														</td>
													) : (
														''
													)}
													<td>
														<span className='inv-total'>{invoiceData.net_amount || '-'}</span>
													</td>
												</tr>
											</tbody>
										</table>
									</div>
									<div className='invoice-details d-flex'>
										<div className='col-md-6 border px-0'>
											<div className='bill-to px-2'>Description :-</div>
											<p
												style={{ fontSize: '16px' }}
												className='px-2'>
												<b></b> <span id='inv-notes'> {invoiceData.note || '-'}</span>{' '}
											</p>
										</div>
										<div className='col-md-6 border px-0'>
											<div className='bill-to px-2'>Amount :-</div>
											<div className='bill-name-date px-2'>
												<p>
													<strong>Paid Amount :-</strong>
													<span className='inv-paid'> {invoiceData.paid_amount || '-'}</span>
												</p>
												<p className=''>
													<strong>Due Amount :-</strong>
													<span id='inv-due'>
														{' '}
														{invoiceData.net_amount - invoiceData.paid_amount || '-'}
													</span>
												</p>
												{invoiceData.discount != '0' ? (
													<p className=''>
														<strong>Discount Amount :-</strong>
														<span id='inv-due'>
															{' '}
															{invoiceData.discount || '0'}
															{isDiscountPercentage ? ' %' : ' ₹'}
														</span>
													</p>
												) : (
													''
												)}
												<p className=''>
													<strong>Total Amount :-</strong>
													<span className='inv-total'> {invoiceData.net_amount || '-'}</span>
												</p>
											</div>
										</div>
									</div>
									<div className='invoice-details d-flex'>
										<div className='col-md-6 border border-black px-0'>
											<div className='bill-to px-2 border-bottom border-black'>Sign:</div>
										</div>
										<div className='col-md-6 border border-black px-0'>
											<div className='bill-to px-2 border-bottom border-black'>Administrator:</div>
											<div className='px-2 d-flex justify-content-center'>
												<img
													src={'/media/sign/goutam_sir.png'}
													alt='sign'
													width='90%'
												/>
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
				<div
					className='col-md-6 mt-3'
					style={{ height: '0px', overflow: 'hidden' }}>
					<div className='card'>
						<div className='card-body'>
							<div id='invoiceTermAndCondition'>
								<p className='fw-bold fs-5 text-center mb-2'>
									FGIIT Academy - Rules & Regulations for Enrolled Students
								</p>
								<div className='border'>
									<div className='invoice-details d-flex'>
										<div className='col-md-12 border px-0'>
											<div className='bill-to px-2'>Terms and Conditions :-</div>
											<div className='px-2'>
												<p
													style={{ fontSize: '10px' }}
													className='mt-1'>
													Welcome to FGIIT Academy, where we are committed to delivering
													professional education with discipline, structure, and results. Kindly
													read and follow the rules below to ensure a smooth and successful learning
													journey:
												</p>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>1. Payment Terms</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Students can enroll by paying 50% of the course fee
														initially.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> The remaining 50% must be paid within 15 days of the
														first payment or as per the date given by your counselor.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Failure to pay on or before the due date will result
														in:
														<ul>
															<li>Immediate removal from official groups.</li>
															<li>Permanent block of your student ID and learning access.</li>
															<li>
																No further communication, support, or certification eligibility.
															</li>
														</ul>
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>2. Session Attendance & Learning Mode</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> If you miss a live session, you must complete the
														topic through pre-recorded sessions available in the FGIIT App.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Live sessions will not be repeated for any individual
														under any circumstances.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Regular attendance with 75% and active participation
														are mandatory for certification.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>3. Exam Policy</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> If you miss your scheduled exam without prior
														information or approval from the FGIIT team:
														<ul>
															<li>A re-exam fee of ₹2700 will be applicable to appear again.</li>
														</ul>
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Students are expected to be responsible for tracking
														exam schedules shared in groups or app.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>4. Batch Transfer Policy</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> If you do not attend the course or wish to transfer
														to a new batch, then:
														<ul>
															<li>
																You will be required to pay 55% of your original course fee again to
																enroll in the new batch.
															</li>
														</ul>
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Batch transfers are subject to approval and
														availability and are considered only once per student.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>5. Refund & Cancellation Policy</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> All fees paid are strictly non-refundable and
														non-transferable.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> No refunds will be granted under any circumstances,
														including withdrawal or dissatisfaction.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>6. Platform Access & Usage</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> All study material, videos, notes, and assessments
														are available only through the official FGIIT App.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Do not share your login credentials. Sharing or
														misuse may result in termination of your access & Legal Action.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>7. Group Etiquette & Professional Conduct</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> Be respectful in all official groups and platforms.
													</p>
													<p style={{ fontSize: '10px' }}>
														<strong>*</strong> Misbehavior, spamming, or any form of disrespect
														towards Faculty or staff will result in immediate removal from the
														course without notice.
													</p>
												</div>
												<div>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>8. Certification Eligibility</strong>
													</p>
													<p
														style={{ fontSize: '10px' }}
														className='mt-1'>
														<strong>*</strong> To receive your certificate, you must:
														<ul>
															<li>Complete the course successfully</li>
															<li>Submit all assessments</li>
															<li>Clear the final exam</li>
															<li>Ensure full payment of your course fee</li>
														</ul>
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
			</div>
		</>
	)
}

export default FgroupInvoicePage
