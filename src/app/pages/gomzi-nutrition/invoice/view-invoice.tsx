/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPenToSquare,
	faFilePdf,
	faArrowLeft,
	faFileInvoice,
	faWallet,
	faClock,
	faUser,
	faCheck,
	faDownload,
	faXmark,
	faPrint,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { getInvoice } from '../../../Functions/FGGroup'
import {
	CompanyInvoiceDocument,
	generateCompanyInvoicePDF,
} from './CompanyInvoiceDocument'
import './invoice-theme.css'

export const NutritionViewInvoice: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoiceId = searchParams.get('invoice_id') || searchParams.get('id')

	const [loading, setLoading] = useState<boolean>(true)
	const [invoice, setInvoice] = useState<any>(null)
	const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'payments' | 'client' | 'documents'>('overview')
	const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(false)
	const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false)

	const fetchInvoice = async () => {
		if (!invoiceId) {
			setLoading(false)
			return
		}
		try {
			setLoading(true)
			const res: any = await getInvoice({ id: invoiceId })
			if (res?.data && res.data.length > 0) {
				setInvoice(res.data[0])
			} else {
				toast.error('Invoice not found')
			}
		} catch (err: any) {
			console.error('Error fetching invoice:', err)
			toast.error('Failed to load invoice details')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchInvoice()
	}, [invoiceId])

	const handleDownloadPDF = async () => {
		try {
			setDownloadingPdf(true)
			await generateCompanyInvoicePDF(
				invoice?.name || `invoice_${invoice?.invoice_number}`,
				'invoiceContent',
				'invoiceTermAndCondition'
			)
			toast.success('Invoice PDF downloaded successfully')
		} catch (err) {
			console.error('Error downloading invoice:', err)
			toast.error('Failed to generate PDF')
		} finally {
			setDownloadingPdf(false)
		}
	}

	if (loading) {
		return (
			<div className='gz-inv-container'>
				<PageTitle breadcrumbs={[]}>Invoice Details</PageTitle>

				{/* Breadcrumb Skeleton */}
				<div className='gz-inv-breadcrumb'>
					<Link to='/rag/invoice-list'>Invoices</Link>
					<span>&gt;</span>
					<span>Invoice Details</span>
				</div>

				{/* Header Skeleton */}
				<div className='gz-inv-header align-items-center'>
					<div>
						<div className='gz-inv-skeleton mb-2' style={{ width: '220px', height: '32px', borderRadius: '8px' }}></div>
						<div className='gz-inv-skeleton' style={{ width: '160px', height: '16px', borderRadius: '4px' }}></div>
					</div>
					<div className='d-flex align-items-center gap-3'>
						<div className='gz-inv-skeleton' style={{ width: '80px', height: '36px', borderRadius: '999px' }}></div>
						<div className='gz-inv-skeleton' style={{ width: '120px', height: '42px', borderRadius: '12px' }}></div>
					</div>
				</div>

				{/* 3 Metric Cards Skeleton */}
				<div className='gz-inv-metrics-grid'>
					<div className='gz-inv-metric-card soft-lavender'>
						<div className='gz-inv-metric-content'>
							<span className='gz-inv-metric-label'>Invoice Amount</span>
							<span className='gz-inv-metric-amount'>
								<span className='gz-inv-skeleton' style={{ width: '120px', height: '28px', borderRadius: '6px' }}></span>
							</span>
							<span className='gz-inv-metric-subtext' style={{ color: '#4C3AB3' }}>
								<span>Total billed value</span>
							</span>
						</div>
					</div>
					<div className='gz-inv-metric-card pale-mint'>
						<div className='gz-inv-metric-content'>
							<span className='gz-inv-metric-label'>Collected Amount</span>
							<span className='gz-inv-metric-amount'>
								<span className='gz-inv-skeleton' style={{ width: '120px', height: '28px', borderRadius: '6px' }}></span>
							</span>
							<span className='gz-inv-metric-subtext green'>
								<span>Recorded payments</span>
							</span>
						</div>
					</div>
					<div className='gz-inv-metric-card soft-pink'>
						<div className='gz-inv-metric-content'>
							<span className='gz-inv-metric-label'>Pending Balance</span>
							<span className='gz-inv-metric-amount'>
								<span className='gz-inv-skeleton' style={{ width: '120px', height: '28px', borderRadius: '6px' }}></span>
							</span>
							<span className='gz-inv-metric-subtext red'>
								<span>Balance due</span>
							</span>
						</div>
					</div>
				</div>

				{/* Tabs Skeleton */}
				<div className='gz-inv-tabs'>
					{['Overview', 'Line Items', 'Payments', 'Client Details', 'Documents'].map((lbl, idx) => (
						<div key={idx} className={`gz-inv-tab ${idx === 0 ? 'active' : ''}`}>
							{lbl}
						</div>
					))}
				</div>

				{/* 2x2 Overview Cards Skeleton */}
				<div className='row g-4'>
					<div className='col-12 col-lg-6'>
						<div className='gz-inv-form-card h-100 mb-0'>
							<h3 className='gz-inv-form-card-title'>Invoice Information</h3>
							<div className='d-flex flex-column gap-3'>
								{Array.from({ length: 5 }).map((_, idx) => (
									<div key={idx} className='d-flex justify-content-between py-2 border-bottom border-light'>
										<span className='gz-inv-skeleton' style={{ width: '100px', height: '14px', borderRadius: '4px' }}></span>
										<span className='gz-inv-skeleton' style={{ width: '130px', height: '14px', borderRadius: '4px' }}></span>
									</div>
								))}
							</div>
						</div>
					</div>
					<div className='col-12 col-lg-6'>
						<div className='gz-inv-form-card h-100 mb-0'>
							<h3 className='gz-inv-form-card-title'>Client Information</h3>
							<div className='d-flex align-items-center gap-3 mb-4'>
								<span className='gz-inv-skeleton' style={{ width: '44px', height: '44px', borderRadius: '50%' }}></span>
								<div>
									<div className='gz-inv-skeleton mb-1' style={{ width: '130px', height: '16px', borderRadius: '4px' }}></div>
									<div className='gz-inv-skeleton' style={{ width: '90px', height: '12px', borderRadius: '4px' }}></div>
								</div>
							</div>
							<div className='d-flex flex-column gap-3'>
								{Array.from({ length: 4 }).map((_, idx) => (
									<div key={idx} className='d-flex justify-content-between py-2 border-bottom border-light'>
										<span className='gz-inv-skeleton' style={{ width: '90px', height: '14px', borderRadius: '4px' }}></span>
										<span className='gz-inv-skeleton' style={{ width: '140px', height: '14px', borderRadius: '4px' }}></span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!invoice) {
		return (
			<div className='gz-inv-container d-flex flex-column align-items-center justify-content-center' style={{ minHeight: '60vh' }}>
				<div className='rounded-circle d-flex align-items-center justify-content-center mb-3' style={{ width: '64px', height: '64px', background: '#F1F5F9', color: '#94A3B8' }}>
					<FontAwesomeIcon icon={faFileInvoice} style={{ fontSize: '28px' }} />
				</div>
				<h3 style={{ fontSize: '18px', fontWeight: 600, color: '#172B4D' }}>Invoice Not Found</h3>
				<p className='text-muted mb-4'>The requested invoice record could not be located.</p>
				<Link to='/rag/invoice-list' className='gz-inv-btn-primary'>
					<FontAwesomeIcon icon={faArrowLeft} />
					<span>Back to Invoices</span>
				</Link>
			</div>
		)
	}

	const netAmount = Number(invoice?.net_amount || 0)
	const paidAmount = Number(invoice?.paid_amount || 0)
	const dueAmount = Math.max(0, netAmount - paidAmount)
	const isPaid = paidAmount >= netAmount && netAmount > 0

	const collectionRate = netAmount > 0 ? Math.round((paidAmount / netAmount) * 100) : 0
	const pendingRate = netAmount > 0 ? Math.round((dueAmount / netAmount) * 100) : 0

	const invoiceDateFormatted = invoice?.date ? DayJS(invoice.date).format('DD MMM YYYY') : '-'
	// Estimate due date (default net 15 days from invoice date if not explicitly set)
	const dueDateFormatted = invoice?.due_date
		? DayJS(invoice.due_date).format('DD MMM YYYY')
		: invoice?.date
		? DayJS(invoice.date).add(15, 'day').format('DD MMM YYYY')
		: '-'

	const invoiceNumberDisplay = invoice?.invoice_number ? `#INV-${invoice.invoice_number}` : (invoice?._id || '-')

	// Subtotal & GST calculations from items
	const itemsList = invoice?.items || []
	const subtotal = itemsList.reduce((sum: number, it: any) => {
		const q = parseFloat(it?.quantity || '0') || 0
		const a = parseFloat(it?.amount || '0') || 0
		return sum + q * a
	}, 0)
	const gstTotal = itemsList.reduce((sum: number, it: any) => {
		const q = parseFloat(it?.quantity || '0') || 0
		const a = parseFloat(it?.amount || '0') || 0
		const g = parseFloat(it?.gst || '0') || 0
		return sum + (q * a * g) / 100
	}, 0)

	const billingAddress = invoice?.billing_address || {}
	const addressString = [
		billingAddress.address_line_1 || invoice?.billing_address_line_1,
		billingAddress.city || invoice?.billing_city,
		billingAddress.state || invoice?.billing_state,
		billingAddress.pin_code || invoice?.billing_pin_code,
		billingAddress.country || invoice?.billing_country,
	]
		.filter(Boolean)
		.join(', ') || 'No billing address provided'

	return (
		<div className='gz-inv-container'>
			<PageTitle breadcrumbs={[]}>Invoice Details</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-inv-breadcrumb'>
				<Link to='/rag/invoice-list'>Invoices</Link>
				<span>&gt;</span>
				<span>Invoice Details</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-inv-header align-items-center'>
				<div>
					<h1 className='gz-inv-title'>{`Invoice ${invoiceNumberDisplay}`}</h1>
					<p className='gz-inv-subtitle'>
						{invoice?.name || 'Walk-in Customer'} • {invoiceDateFormatted}
					</p>
				</div>
				<div className='d-flex align-items-center gap-3'>
					{isPaid ? (
						<span className='gz-inv-badge paid' style={{ padding: '8px 16px', fontSize: '13px' }}>
							Paid
						</span>
					) : paidAmount > 0 ? (
						<span className='gz-inv-badge pending' style={{ padding: '8px 16px', fontSize: '13px' }}>
							Partial
						</span>
					) : (
						<span className='gz-inv-badge due' style={{ padding: '8px 16px', fontSize: '13px' }}>
							Pending
						</span>
					)}

					<Link
						to={`/rag/update-invoice?invoice_id=${invoice._id}`}
						className='gz-inv-btn-primary'>
						<FontAwesomeIcon icon={faPenToSquare} />
						<span>Edit Invoice</span>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    FINANCIAL SUMMARY MODULES (3 CARDS)
			    ========================================================================= */}
			<div className='gz-inv-metrics-grid'>
				{/* Invoice Amount */}
				<div className='gz-inv-metric-card soft-lavender'>
					<div className='gz-inv-metric-content'>
						<span className='gz-inv-metric-label'>Invoice Amount</span>
						<span className='gz-inv-metric-amount'>
							₹ {netAmount.toLocaleString('en-IN')}
						</span>
						<span className='gz-inv-metric-subtext' style={{ color: '#4C3AB3' }}>
							<span>Total billed value</span>
						</span>
					</div>
					<div className='gz-inv-metric-icon purple'>
						<FontAwesomeIcon icon={faFileInvoice} />
					</div>
				</div>

				{/* Collected Amount */}
				<div className='gz-inv-metric-card pale-mint'>
					<div className='gz-inv-metric-content'>
						<span className='gz-inv-metric-label'>Collected Amount</span>
						<span className='gz-inv-metric-amount'>
							₹ {paidAmount.toLocaleString('en-IN')}
						</span>
						<span className='gz-inv-metric-subtext green'>
							<span>{collectionRate}% collected</span>
						</span>
					</div>
					<div className='gz-inv-metric-icon green'>
						<FontAwesomeIcon icon={faWallet} />
					</div>
				</div>

				{/* Pending Amount */}
				<div className='gz-inv-metric-card soft-pink'>
					<div className='gz-inv-metric-content'>
						<span className='gz-inv-metric-label'>Pending Amount</span>
						<span className='gz-inv-metric-amount'>
							₹ {dueAmount.toLocaleString('en-IN')}
						</span>
						<span className='gz-inv-metric-subtext red'>
							<span>{pendingRate}% pending</span>
						</span>
					</div>
					<div className='gz-inv-metric-icon red'>
						<FontAwesomeIcon icon={faClock} />
					</div>
				</div>
			</div>

			{/* =========================================================================
			    TABS NAVIGATION
			    ========================================================================= */}
			<div className='gz-inv-tabs'>
				{[
					{ key: 'overview', label: 'Overview' },
					{ key: 'items', label: 'Line Items' },
					{ key: 'payments', label: 'Payments' },
					{ key: 'client', label: 'Client Details' },
					{ key: 'documents', label: 'Documents' },
				].map((t) => (
					<div
						key={t.key}
						className={`gz-inv-tab ${activeTab === t.key ? 'active' : ''}`}
						onClick={() => setActiveTab(t.key as any)}>
						{t.label}
					</div>
				))}
			</div>

			{/* =========================================================================
			    TAB 1: OVERVIEW (MATCHES SCREENSHOT 2)
			    ========================================================================= */}
			{activeTab === 'overview' && (
				<div className='row g-4'>
					{/* Top Left: Invoice Information */}
					<div className='col-12 col-lg-6'>
						<div className='gz-inv-form-card h-100 mb-0'>
							<h3 className='gz-inv-form-card-title'>Invoice Information</h3>
							<div className='d-flex flex-column gap-3'>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A', fontSize: '13.5px' }}>Invoice Number</span>
									<span style={{ fontWeight: 600, color: '#172B4D' }}>{invoiceNumberDisplay}</span>
								</div>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A', fontSize: '13.5px' }}>Invoice Date</span>
									<span style={{ fontWeight: 600, color: '#172B4D' }}>{invoiceDateFormatted}</span>
								</div>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A', fontSize: '13.5px' }}>Due Date</span>
									<span style={{ fontWeight: 600, color: '#172B4D' }}>{dueDateFormatted}</span>
								</div>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A', fontSize: '13.5px' }}>Payment Terms</span>
									<span style={{ fontWeight: 600, color: '#172B4D' }}>Net 15 Days</span>
								</div>
								<div className='d-flex justify-content-between py-1 border-bottom border-light align-items-center'>
									<span style={{ color: '#71809A', fontSize: '13.5px' }}>Status</span>
									{isPaid ? (
										<span className='gz-inv-badge paid'>Paid</span>
									) : (
										<span className='gz-inv-badge due'>Pending</span>
									)}
								</div>
								<div className='d-flex justify-content-between py-1'>
									<span style={{ color: '#71809A', fontSize: '13.5px' }}>Notes</span>
									<span style={{ color: invoice?.note ? '#172B4D' : '#94A3B8' }}>
										{invoice?.note || '—'}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Top Right: Client Information */}
					<div className='col-12 col-lg-6'>
						<div className='gz-inv-form-card h-100 mb-0'>
							<h3 className='gz-inv-form-card-title'>Client Information</h3>
							<div className='d-flex align-items-center gap-3 mb-4'>
								<div
									className='rounded-circle d-flex align-items-center justify-content-center'
									style={{ width: '44px', height: '44px', background: '#DCE8F8', color: '#172B4D' }}>
									<FontAwesomeIcon icon={faUser} />
								</div>
								<div>
									<h4 style={{ fontSize: '16px', fontWeight: 700, color: '#172B4D', margin: 0 }}>
										{invoice?.name || 'Walk-in Customer'}
									</h4>
									{invoice?.branch_name && (
										<span style={{ fontSize: '12px', color: '#71809A' }}>
											Branch: {invoice.branch_name}
										</span>
									)}
								</div>
							</div>

							<div className='d-flex flex-column gap-3'>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A', fontSize: '13.5px' }}>GSTIN</span>
									<span style={{ fontWeight: 600, color: '#172B4D' }}>
										{invoice?.gst_number || '—'}
									</span>
								</div>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A', fontSize: '13.5px' }}>Email</span>
									<span style={{ fontWeight: 600, color: '#172B4D' }}>
										{invoice?.email || '—'}
									</span>
								</div>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A', fontSize: '13.5px' }}>Phone</span>
									<span style={{ fontWeight: 600, color: '#172B4D' }}>
										{invoice?.mobile || '—'}
									</span>
								</div>
								<div className='d-flex justify-content-between py-1'>
									<span style={{ color: '#71809A', fontSize: '13.5px', minWidth: '80px' }}>Address</span>
									<span style={{ color: '#172B4D', textAlign: 'right', maxWidth: '320px' }}>
										{addressString}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Bottom Left: Amount Summary */}
					<div className='col-12 col-lg-6'>
						<div className='gz-inv-form-card h-100 mb-0'>
							<h3 className='gz-inv-form-card-title'>Amount Summary</h3>
							<div className='d-flex flex-column gap-3'>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A', fontSize: '13.5px' }}>Subtotal</span>
									<span style={{ fontWeight: 600, color: '#172B4D' }}>
										₹ {(subtotal || netAmount).toLocaleString('en-IN')}
									</span>
								</div>
								{gstTotal > 0 && (
									<div className='d-flex justify-content-between py-1 border-bottom border-light'>
										<span style={{ color: '#71809A', fontSize: '13.5px' }}>GST Total</span>
										<span style={{ fontWeight: 600, color: '#172B4D' }}>
											₹ {gstTotal.toLocaleString('en-IN')}
										</span>
									</div>
								)}
								{Number(invoice?.discount || 0) > 0 && (
									<div className='d-flex justify-content-between py-1 border-bottom border-light'>
										<span style={{ color: '#71809A', fontSize: '13.5px' }}>Discount</span>
										<span style={{ fontWeight: 600, color: '#168064' }}>
											- ₹ {Number(invoice.discount).toLocaleString('en-IN')}
										</span>
									</div>
								)}

								{/* Highlighted Total Amount Bar */}
								<div
									className='d-flex justify-content-between align-items-center p-3 rounded-3 mt-2'
									style={{ background: '#EAF1F8' }}>
									<span style={{ fontWeight: 700, color: '#172B4D', fontSize: '15px' }}>
										Total Amount
									</span>
									<span style={{ fontWeight: 800, color: '#172B4D', fontSize: '18px' }}>
										₹ {netAmount.toLocaleString('en-IN')}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Bottom Right: Actions */}
					<div className='col-12 col-lg-6'>
						<div className='gz-inv-form-card h-100 mb-0'>
							<h3 className='gz-inv-form-card-title'>Actions</h3>
							<div className='d-flex flex-column gap-3'>
								{/* View PDF Invoice Action Button */}
								<button
									type='button'
									className='d-flex align-items-center gap-3 p-3 rounded-3 border-0 text-start w-100 transition-all'
									style={{
										background: '#EEF4FC',
										color: '#1E4F8A',
										cursor: 'pointer',
										fontWeight: 600,
										fontSize: '14.5px',
									}}
									onClick={() => setPdfModalOpen(true)}>
									<div
										className='rounded-3 d-flex align-items-center justify-content-center'
										style={{ width: '40px', height: '40px', background: '#DCE8F8', color: '#1E4F8A' }}>
										<FontAwesomeIcon icon={faFilePdf} />
									</div>
									<div className='d-flex flex-column'>
										<span>View PDF Invoice</span>
										<span style={{ fontSize: '12px', color: '#71809A', fontWeight: 400 }}>
											Inspect official company document & download
										</span>
									</div>
								</button>

								{/* Edit Invoice Action Button */}
								<button
									type='button'
									className='d-flex align-items-center gap-3 p-3 rounded-3 border-0 text-start w-100 transition-all'
									style={{
										background: '#F3F1FD',
										color: '#4C3AB3',
										cursor: 'pointer',
										fontWeight: 600,
										fontSize: '14.5px',
									}}
									onClick={() => navigate(`/rag/update-invoice?invoice_id=${invoice._id}`)}>
									<div
										className='rounded-3 d-flex align-items-center justify-content-center'
										style={{ width: '40px', height: '40px', background: '#E4DFFE', color: '#4C3AB3' }}>
										<FontAwesomeIcon icon={faPenToSquare} />
									</div>
									<div className='d-flex flex-column'>
										<span>Edit Invoice</span>
										<span style={{ fontSize: '12px', color: '#71809A', fontWeight: 400 }}>
											Modify line items, prices, or client details
										</span>
									</div>
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    TAB 2: LINE ITEMS
			    ========================================================================= */}
			{activeTab === 'items' && (
				<div className='gz-inv-table-card'>
					<div className='table-responsive'>
						<table className='gz-inv-table'>
							<thead>
								<tr>
									<th>#</th>
									<th>Product Name</th>
									<th>Weight</th>
									<th style={{ textAlign: 'right' }}>Rate</th>
									<th style={{ textAlign: 'center' }}>Qty</th>
									<th style={{ textAlign: 'right' }}>Amount</th>
									<th style={{ textAlign: 'center' }}>GST</th>
									<th style={{ textAlign: 'center' }}>Discount</th>
									<th style={{ textAlign: 'right' }}>Total</th>
								</tr>
							</thead>
							<tbody>
								{itemsList.length === 0 ? (
									<tr>
										<td colSpan={9} className='text-center py-6 text-muted'>
											No line items recorded for this invoice.
										</td>
									</tr>
								) : (
									itemsList.map((item: any, idx: number) => {
										const itemWeight = item?.item_weight
											? `${item.item_weight} ${item.item_weight_type || 'kg'}`
											: '-'
										const lineAmount = (parseFloat(item?.amount || '0') || 0) * (parseFloat(item?.quantity || '0') || 0)
										return (
											<tr key={idx}>
												<td>{idx + 1}</td>
												<td style={{ fontWeight: 600, color: '#172B4D' }}>
													{item?.item_name || 'Standard Item'}
												</td>
												<td>{itemWeight}</td>
												<td style={{ textAlign: 'right' }}>₹{Number(item?.amount || 0).toLocaleString('en-IN')}</td>
												<td style={{ textAlign: 'center' }}>{item?.quantity || 1}</td>
												<td style={{ textAlign: 'right' }}>₹{lineAmount.toLocaleString('en-IN')}</td>
												<td style={{ textAlign: 'center' }}>{item?.gst ? `${item.gst}%` : '-'}</td>
												<td style={{ textAlign: 'center' }}>
													{item?.discount ? `${item.discount}${item.isDiscountPercentage ? '%' : '₹'}` : '-'}
												</td>
												<td style={{ textAlign: 'right', fontWeight: 700, color: '#172B4D' }}>
													₹{Number(item?.totalAmount || lineAmount).toLocaleString('en-IN')}
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* =========================================================================
			    TAB 3: PAYMENTS
			    ========================================================================= */}
			{activeTab === 'payments' && (
				<div className='row g-4'>
					<div className='col-12 col-md-6'>
						<div className='gz-inv-form-card'>
							<h3 className='gz-inv-form-card-title'>Payment Record</h3>
							<div className='d-flex flex-column gap-3'>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A' }}>Payment Method</span>
									<span style={{ fontWeight: 600, color: '#172B4D' }}>
										{invoice?.payment_method || 'Cash / UPI'}
									</span>
								</div>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A' }}>Paid Amount</span>
									<span style={{ fontWeight: 700, color: '#168064' }}>
										₹ {paidAmount.toLocaleString('en-IN')}
									</span>
								</div>
								<div className='d-flex justify-content-between py-1 border-bottom border-light'>
									<span style={{ color: '#71809A' }}>Due Amount</span>
									<span style={{ fontWeight: 700, color: '#D94A62' }}>
										₹ {dueAmount.toLocaleString('en-IN')}
									</span>
								</div>
								<div className='d-flex justify-content-between py-1'>
									<span style={{ color: '#71809A' }}>Payment Status</span>
									{isPaid ? (
										<span className='gz-inv-badge paid'>Fully Paid</span>
									) : (
										<span className='gz-inv-badge due'>Outstanding</span>
									)}
								</div>
							</div>
						</div>
					</div>

					<div className='col-12 col-md-6'>
						<div className='gz-inv-form-card'>
							<h3 className='gz-inv-form-card-title'>Bank & Account Details</h3>
							<div className='d-flex flex-column gap-2' style={{ fontSize: '13.5px', color: '#172B4D' }}>
								<div><strong>UPI ID:</strong> bom260801350628@mahb</div>
								<div><strong>Bank Name:</strong> Bank of Maharashtra, Jahangirabad</div>
								<div><strong>Account Name:</strong> RAG STRENGTH & NUTRITION</div>
								<div><strong>Account Number:</strong> 60587480966</div>
								<div><strong>IFSC Code:</strong> MAHB0002533</div>
								<div><strong>Account Type:</strong> Current Account</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    TAB 4: CLIENT DETAILS
			    ========================================================================= */}
			{activeTab === 'client' && (
				<div className='gz-inv-form-card' style={{ maxWidth: '720px' }}>
					<h3 className='gz-inv-form-card-title'>Client & Billing Profile</h3>
					<div className='d-flex flex-column gap-3'>
						<div className='d-flex justify-content-between py-2 border-bottom border-light'>
							<span style={{ color: '#71809A' }}>Client / Company Name</span>
							<span style={{ fontWeight: 600, color: '#172B4D' }}>{invoice?.name || 'Walk-in Customer'}</span>
						</div>
						<div className='d-flex justify-content-between py-2 border-bottom border-light'>
							<span style={{ color: '#71809A' }}>GSTIN</span>
							<span style={{ fontWeight: 600, color: '#172B4D' }}>{invoice?.gst_number || 'N/A'}</span>
						</div>
						<div className='d-flex justify-content-between py-2 border-bottom border-light'>
							<span style={{ color: '#71809A' }}>PAN Number</span>
							<span style={{ fontWeight: 600, color: '#172B4D' }}>{invoice?.pan_number || 'N/A'}</span>
						</div>
						<div className='d-flex justify-content-between py-2 border-bottom border-light'>
							<span style={{ color: '#71809A' }}>Contact Email</span>
							<span style={{ fontWeight: 600, color: '#172B4D' }}>{invoice?.email || 'N/A'}</span>
						</div>
						<div className='d-flex justify-content-between py-2 border-bottom border-light'>
							<span style={{ color: '#71809A' }}>Contact Phone</span>
							<span style={{ fontWeight: 600, color: '#172B4D' }}>{invoice?.mobile || 'N/A'}</span>
						</div>
						<div className='d-flex justify-content-between py-2'>
							<span style={{ color: '#71809A' }}>Billing Address</span>
							<span style={{ color: '#172B4D', textAlign: 'right', maxWidth: '400px' }}>{addressString}</span>
						</div>
					</div>
				</div>
			)}

			{/* =========================================================================
			    TAB 5: DOCUMENTS
			    ========================================================================= */}
			{activeTab === 'documents' && (
				<div className='gz-inv-form-card' style={{ maxWidth: '640px' }}>
					<h3 className='gz-inv-form-card-title'>Invoice Documents</h3>
					<div className='p-4 rounded-3 d-flex align-items-center justify-content-between' style={{ background: '#F8FAFD', border: '1px solid #E4EAF2' }}>
						<div className='d-flex align-items-center gap-3'>
							<div
								className='rounded-3 d-flex align-items-center justify-content-center'
								style={{ width: '48px', height: '48px', background: '#DCE8F8', color: '#172B4D' }}>
								<FontAwesomeIcon icon={faFilePdf} style={{ fontSize: '20px' }} />
							</div>
							<div>
								<h4 style={{ fontSize: '15px', fontWeight: 600, color: '#172B4D', margin: 0 }}>
									{`Official Tax Invoice ${invoiceNumberDisplay}.pdf`}
								</h4>
								<span style={{ fontSize: '12px', color: '#71809A' }}>
									Generated from authentic company billing template
								</span>
							</div>
						</div>
						<button
							type='button'
							className='gz-inv-btn-primary'
							onClick={handleDownloadPDF}
							disabled={downloadingPdf}>
							<FontAwesomeIcon icon={faDownload} />
							<span>{downloadingPdf ? 'Downloading...' : 'Download'}</span>
						</button>
					</div>
				</div>
			)}

			{/* =========================================================================
			    HIDDEN DOM FOR PDF GENERATION (PRESERVES EXISTING TEMPLATE 100%)
			    ========================================================================= */}
			<div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
				<CompanyInvoiceDocument
					invoiceData={{
						name: invoice?.name,
						email: invoice?.email,
						mobile: invoice?.mobile,
						gst_number: invoice?.gst_number,
						pan_number: invoice?.pan_number,
						invoice_number: invoice?.invoice_number,
						date: invoice?.date ? DayJS(invoice.date).format('YYYY/MM/DD') : '',
						billing_address_line_1: billingAddress.address_line_1 || invoice?.billing_address_line_1,
						billing_city: billingAddress.city || invoice?.billing_city,
						billing_state: billingAddress.state || invoice?.billing_state,
						billing_pin_code: billingAddress.pin_code || invoice?.billing_pin_code,
						billing_country: billingAddress.country || invoice?.billing_country,
						sales_person: invoice?.sales_person,
						discount: invoice?.discount,
						net_amount: invoice?.net_amount,
						paid_amount: invoice?.paid_amount,
						note: invoice?.note,
					}}
					items={itemsList}
					dueAmount={dueAmount}
					containerId='invoiceContent'
				/>
			</div>

			{/* =========================================================================
			    MODAL: AUTHENTIC COMPANY BILLING TEMPLATE PREVIEW
			    ========================================================================= */}
			{pdfModalOpen && (
				<div className='gz-inv-modal-backdrop' onClick={() => setPdfModalOpen(false)}>
					<div
						className='gz-inv-modal-content'
						onClick={(e) => e.stopPropagation()}
						style={{ maxWidth: '880px' }}>
						<div className='d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom'>
							<div>
								<h3 style={{ fontSize: '18px', fontWeight: 700, color: '#172B4D', margin: 0 }}>
									Official Company Tax Invoice
								</h3>
								<p style={{ fontSize: '13px', color: '#71809A', margin: '4px 0 0 0' }}>
									Original billing document preview
								</p>
							</div>
							<div className='d-flex align-items-center gap-2'>
								<button
									type='button'
									className='gz-inv-btn-primary'
									onClick={handleDownloadPDF}
									disabled={downloadingPdf}>
									<FontAwesomeIcon icon={faDownload} />
									<span>{downloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
								</button>
								<button
									type='button'
									className='btn btn-light btn-sm rounded-circle p-2'
									style={{ width: '36px', height: '36px' }}
									onClick={() => setPdfModalOpen(false)}>
									<FontAwesomeIcon icon={faXmark} />
								</button>
							</div>
						</div>

						{/* Actual Unchanged Billing Template */}
						<div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
							<CompanyInvoiceDocument
								invoiceData={{
									name: invoice?.name,
									email: invoice?.email,
									mobile: invoice?.mobile,
									gst_number: invoice?.gst_number,
									pan_number: invoice?.pan_number,
									invoice_number: invoice?.invoice_number,
									date: invoice?.date ? DayJS(invoice.date).format('YYYY/MM/DD') : '',
									billing_address_line_1: billingAddress.address_line_1 || invoice?.billing_address_line_1,
									billing_city: billingAddress.city || invoice?.billing_city,
									billing_state: billingAddress.state || invoice?.billing_state,
									billing_pin_code: billingAddress.pin_code || invoice?.billing_pin_code,
									billing_country: billingAddress.country || invoice?.billing_country,
									sales_person: invoice?.sales_person,
									discount: invoice?.discount,
									net_amount: invoice?.net_amount,
									paid_amount: invoice?.paid_amount,
									note: invoice?.note,
								}}
								items={itemsList}
								dueAmount={dueAmount}
								containerId='modalInvoiceContent'
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default NutritionViewInvoice
