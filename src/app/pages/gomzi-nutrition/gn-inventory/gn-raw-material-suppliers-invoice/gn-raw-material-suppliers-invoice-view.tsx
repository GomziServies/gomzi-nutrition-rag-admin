import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faBoxes,
	faBuilding,
	faCalendarAlt,
	faCheck,
	faCopy,
	faEdit,
	faEnvelope,
	faExternalLinkAlt,
	faFileInvoice,
	faFilePdf,
	faMapMarkerAlt,
	faPhone,
	faReceipt,
} from '@fortawesome/free-solid-svg-icons'
import { KTCard } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import {
	GetGnRawMaterialProduct,
	GetGnRawMaterialSupplier,
	GetGnRawMaterialSupplierInvoice,
} from '../../../../Functions/FGGroup/GNRawMaterialDetails'

interface InvoiceItem {
	product_id: string
	product_name?: string
	weight: number
	weight_type: string
	rate: number
	gst: number
}

interface SupplierInvoice {
	_id: string
	supplier_id: string
	items: InvoiceItem[]
	bill_image: string
	charges: number
	total_amount: number
	createdBy: string
	updatedBy: string
	status: boolean
	supplier_logo?: string
	name?: string
	email?: string
	number?: string
	address?: string
	date?: string
	issue_date?: string
	createdAt?: string
}

const GomziNutritionMaterialSuppliersInvoiceView: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const invoice_id = searchParams.get('invoice_id')

	const [invoice, setInvoice] = useState<SupplierInvoice | null>(null)
	const [loading, setLoading] = useState(true)
	const [displayImg, setDisplayImg] = useState<string>('')
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		fetchInvoiceData()
	}, [invoice_id])

	const formatAddress = (address: any) => {
		if (!address) return 'N/A'
		if (typeof address === 'string') return address
		const parts = [
			address.address_line_1,
			address.city,
			address.state,
			address.pin_code,
			address.country,
		].filter(Boolean)
		return parts.length > 0 ? parts.join(', ') : 'N/A'
	}

	const fetchInvoiceData = async () => {
		if (!invoice_id) {
			toast.error('Invoice ID is required')
			setLoading(false)
			return
		}

		setLoading(true)
		try {
			// Fetch invoice data
			const invoiceResponse: any = await GetGnRawMaterialSupplierInvoice({ id: invoice_id })

			let invoiceData = null
			if (invoiceResponse?.data?.invoices && invoiceResponse.data.invoices.length > 0) {
				invoiceData = invoiceResponse.data.invoices[0]._doc || invoiceResponse.data.invoices[0]
			} else if (
				invoiceResponse?.data &&
				Array.isArray(invoiceResponse.data) &&
				invoiceResponse.data.length > 0
			) {
				invoiceData = invoiceResponse.data[0]._doc || invoiceResponse.data[0]
			} else if (invoiceResponse?.data && !Array.isArray(invoiceResponse.data)) {
				invoiceData = invoiceResponse.data._doc || invoiceResponse.data
			}

			if (!invoiceData) {
				toast.error('Invoice not found')
				setLoading(false)
				return
			}

			// Format date
			const dateStr = invoiceData.issue_date || invoiceData.createdAt
			const formattedDate = dateStr
				? new Date(dateStr).toLocaleDateString('en-IN', {
						day: '2-digit',
						month: 'short',
						year: 'numeric',
				  })
				: 'N/A'

			// Fetch supplier details
			let supplierData: any = {}
			if (invoiceData.supplier_id) {
				try {
					const supplierResponse: any = await GetGnRawMaterialSupplier({
						id: invoiceData.supplier_id,
					})
					if (
						supplierResponse?.data &&
						Array.isArray(supplierResponse.data) &&
						supplierResponse.data.length > 0
					) {
						supplierData = supplierResponse.data[0]._doc || supplierResponse.data[0]
					}
				} catch (error) {
					console.error('Failed to fetch supplier:', error)
				}
			}

			// Fetch product names
			let productsMap = new Map()
			if (invoiceData.items && invoiceData.items.length > 0) {
				try {
					const productResponse: any = await GetGnRawMaterialProduct({ limit: 1000 })
					if (productResponse?.data) {
						const productsArray = (productResponse.data || []).map((prod: any) => prod._doc || prod)
						productsArray.forEach((prod: any) => {
							if (prod && prod._id && prod.name) {
								productsMap.set(prod._id, prod.name)
							}
						})
					}
				} catch (error) {
					console.error('Failed to fetch products:', error)
				}
			}

			// Enrich items with product names
			const enrichedItems = (invoiceData.items || []).map((item: any) => ({
				...item,
				product_name: productsMap.get(item.product_id) || item.product_id,
			}))

			// Combine all data
			const combinedInvoice: SupplierInvoice = {
				_id: invoiceData._id,
				supplier_id: invoiceData.supplier_id,
				items: enrichedItems,
				bill_image: invoiceData.bill_image || '',
				charges: invoiceData.charges || 0,
				total_amount: invoiceData.total_amount || 0,
				createdBy: invoiceData.createdBy || '',
				updatedBy: invoiceData.updatedBy || '',
				status: invoiceData.status || false,
				supplier_logo: supplierData.supplier_logo || '',
				name: supplierData.name || 'N/A',
				email: supplierData.email || 'N/A',
				number: supplierData.number || 'N/A',
				address: formatAddress(supplierData.address),
				date: formattedDate,
			}

			setInvoice(combinedInvoice)

			// Set display image for bill
			if (invoiceData.bill_image) {
				setDisplayImg(`https://files.fggroup.in/${invoiceData.bill_image}`)
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to load invoice')
		} finally {
			setLoading(false)
		}
	}

	const handleGoBack = () => {
		navigate('/rag/inventory/suppliers/invoice/list')
	}

	const handleCopyId = () => {
		if (invoice?._id) {
			navigator.clipboard.writeText(invoice._id)
			setCopied(true)
			toast.success('Invoice ID copied to clipboard')
			setTimeout(() => setCopied(false), 2000)
		}
	}

	const calculateItemTotal = (item: InvoiceItem) => {
		const displayWeight =
			item.weight_type?.toLowerCase().includes('kg') ||
			item.weight_type?.toLowerCase().includes('ltr')
				? (item.weight || 0) / 1000
				: item.weight || 0
		const base = displayWeight * (item.rate || 0)
		const tax = item.gst ? (base * item.gst) / 100 : 0
		return base + tax
	}

	if (loading) {
		return (
			<>
				<PageTitle breadcrumbs={[]}>Supplier Invoice</PageTitle>
				<KTCard className='border-0 shadow-sm' style={{ borderRadius: '12px' }}>
					<div className='card-body py-15 text-center'>
						<div
							className='spinner-border text-primary'
							role='status'
							style={{ width: '3rem', height: '3rem' }}>
							<span className='visually-hidden'>Loading...</span>
						</div>
						<h5 className='fw-bold text-gray-700 mt-4'>Loading invoice details...</h5>
						<span className='text-muted fs-7'>Fetching supplier and items breakdown</span>
					</div>
				</KTCard>
			</>
		)
	}

	if (!invoice) {
		return (
			<>
				<PageTitle breadcrumbs={[]}>Supplier Invoice</PageTitle>
				<KTCard className='border-0 shadow-sm' style={{ borderRadius: '12px' }}>
					<div className='card-body py-15 text-center'>
						<div className='mb-4'>
							<FontAwesomeIcon
								icon={faFileInvoice}
								className='text-muted'
								style={{ fontSize: '3.5rem' }}
							/>
						</div>
						<h4 className='fw-bolder text-gray-800'>Invoice Not Found</h4>
						<p className='text-muted fs-7 mb-5'>
							The supplier invoice you are looking for does not exist or may have been deleted.
						</p>
						<button
							className='btn fw-bold d-inline-flex align-items-center gap-2'
							onClick={handleGoBack}
							style={{
								backgroundColor: '#0F172A',
								color: '#ffffff',
								height: '40px',
								borderRadius: '8px',
							}}>
							<FontAwesomeIcon icon={faArrowLeft} />
							Back to Invoices
						</button>
					</div>
				</KTCard>
			</>
		)
	}

	const calculatedItemsTotal =
		invoice.items?.reduce((sum, item) => sum + calculateItemTotal(item), 0) || 0
	const isPdf =
		invoice.bill_image?.toLowerCase().endsWith('.pdf') || displayImg?.toLowerCase().includes('.pdf')

	return (
		<>
			<PageTitle breadcrumbs={[]}>Supplier Invoice</PageTitle>

			<KTCard className='border-0 shadow-sm' style={{ borderRadius: '12px' }}>
				{/* 1. Header with Title & Action Toolbar */}
				<div className='card-header border-bottom py-5 px-6 px-lg-8 d-flex align-items-center justify-content-between flex-wrap gap-3'>
					<div className='d-flex align-items-center gap-3'>
						<span
							className='d-inline-flex align-items-center justify-content-center rounded-3'
							style={{
								width: '42px',
								height: '42px',
								backgroundColor: '#EEF2F6',
								color: '#1E3A5F',
							}}>
							<FontAwesomeIcon icon={faFileInvoice} className='fs-3' />
						</span>
						<div>
							<h3 className='card-title fw-bolder text-gray-900 fs-3 m-0'>
								Supplier Invoice Details
							</h3>
							<span className='text-muted fs-7 mt-1 d-block'>
								Invoice Date: <strong className='text-gray-800'>{invoice.date}</strong>
								{invoice.name ? ` • Supplier: ${invoice.name}` : ''}
							</span>
						</div>
					</div>

					<div className='d-flex align-items-center gap-2'>
						<button
							type='button'
							className='btn btn-light btn-active-light-primary fw-semibold d-flex align-items-center gap-2'
							onClick={handleGoBack}
							style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}>
							<FontAwesomeIcon icon={faArrowLeft} />
							Back to Invoices
						</button>

						<button
							type='button'
							className='btn fw-bold d-flex align-items-center gap-2'
							onClick={() =>
								navigate(`/rag/inventory/suppliers/invoice/edit?invoice_id=${invoice._id}`)
							}
							style={{
								backgroundColor: '#0F172A',
								color: '#ffffff',
								height: '38px',
								borderRadius: '8px',
								fontSize: '13px',
							}}>
							<FontAwesomeIcon icon={faEdit} />
							Edit Invoice
						</button>
					</div>
				</div>

				{/* 2. Body */}
				<div className='card-body px-6 px-lg-8 py-7'>
					{/* Top Summary Cards: Supplier Information & Invoice Metadata */}
					<div className='row g-5 mb-8'>
						{/* Supplier Information Card */}
						<div className='col-12 col-lg-6'>
							<div
								className='p-6 rounded-3 h-100'
								style={{
									backgroundColor: '#F8FAFC',
									border: '1px solid #E2E8F0',
								}}>
								<div
									className='d-flex align-items-center gap-2 mb-4 pb-2 border-bottom'
									style={{ borderColor: '#E2E8F0' }}>
									<FontAwesomeIcon icon={faBuilding} className='text-primary fs-6' />
									<h5 className='fw-bolder text-gray-900 fs-6 m-0'>Supplier Information</h5>
								</div>

								<div className='d-flex align-items-start gap-4'>
									{invoice.supplier_logo ? (
										<img
											src={`https://files.fggroup.in/${invoice.supplier_logo}`}
											alt={invoice.name || 'Supplier'}
											style={{
												width: '64px',
												height: '64px',
												objectFit: 'contain',
												borderRadius: '10px',
												border: '1px solid #E2E8F0',
												padding: '4px',
												backgroundColor: '#FFFFFF',
												flexShrink: 0,
											}}
										/>
									) : (
										<div
											className='d-flex align-items-center justify-content-center rounded-3'
											style={{
												width: '64px',
												height: '64px',
												backgroundColor: '#EEF2F6',
												color: '#1E3A5F',
												fontSize: '22px',
												fontWeight: 700,
												flexShrink: 0,
											}}>
											{(invoice.name || 'S').charAt(0).toUpperCase()}
										</div>
									)}

									<div className='flex-grow-1'>
										<h4 className='fw-bolder text-gray-900 fs-5 mb-2'>
											{invoice.name || 'N/A'}
										</h4>

										<div className='d-flex flex-column gap-2'>
											<div className='d-flex align-items-center gap-2 text-gray-700 fs-7'>
												<FontAwesomeIcon
													icon={faPhone}
													className='text-muted fs-8'
													style={{ width: '16px' }}
												/>
												<span>{invoice.number || 'N/A'}</span>
											</div>
											<div className='d-flex align-items-center gap-2 text-gray-700 fs-7'>
												<FontAwesomeIcon
													icon={faEnvelope}
													className='text-muted fs-8'
													style={{ width: '16px' }}
												/>
												<span>{invoice.email || 'N/A'}</span>
											</div>
											<div className='d-flex align-items-start gap-2 text-gray-700 fs-7'>
												<FontAwesomeIcon
													icon={faMapMarkerAlt}
													className='text-muted fs-8 mt-1'
													style={{ width: '16px' }}
												/>
												<span className='lh-sm'>{invoice.address || 'N/A'}</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Invoice Metadata Card */}
						<div className='col-12 col-lg-6'>
							<div
								className='p-6 rounded-3 h-100'
								style={{
									backgroundColor: '#F8FAFC',
									border: '1px solid #E2E8F0',
								}}>
								<div
									className='d-flex align-items-center gap-2 mb-4 pb-2 border-bottom'
									style={{ borderColor: '#E2E8F0' }}>
									<FontAwesomeIcon icon={faReceipt} className='text-primary fs-6' />
									<h5 className='fw-bolder text-gray-900 fs-6 m-0'>Invoice Metadata</h5>
								</div>

								<div className='row g-3'>
									<div className='col-12'>
										<div
											className='p-3 bg-white rounded-2 d-flex align-items-center justify-content-between'
											style={{ border: '1px solid #E2E8F0' }}>
											<div>
												<span className='text-muted fs-8 d-block'>Invoice ID</span>
												<span className='fw-bolder text-gray-900 fs-7 font-monospace'>
													{invoice._id}
												</span>
											</div>
											<button
												type='button'
												className='btn btn-sm btn-icon btn-light-primary rounded-2'
												onClick={handleCopyId}
												title={copied ? 'Copied!' : 'Copy Invoice ID'}
												style={{ width: '32px', height: '32px' }}>
												<FontAwesomeIcon icon={copied ? faCheck : faCopy} className='fs-7' />
											</button>
										</div>
									</div>

									<div className='col-6'>
										<div
											className='p-3 bg-white rounded-2'
											style={{ border: '1px solid #E2E8F0' }}>
											<span className='text-muted fs-8 d-block'>Issue Date</span>
											<div className='d-flex align-items-center gap-2 mt-1'>
												<FontAwesomeIcon icon={faCalendarAlt} className='text-primary fs-8' />
												<span className='fw-bold text-gray-800 fs-7'>{invoice.date}</span>
											</div>
										</div>
									</div>

									<div className='col-6'>
										<div
											className='p-3 bg-white rounded-2'
											style={{ border: '1px solid #E2E8F0' }}>
											<span className='text-muted fs-8 d-block'>Total Items</span>
											<div className='d-flex align-items-center gap-2 mt-1'>
												<FontAwesomeIcon icon={faBoxes} className='text-primary fs-8' />
												<span className='fw-bold text-gray-800 fs-7'>
													{invoice.items?.length || 0} Products
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Raw Material Items Breakdown Table */}
					<div className='mb-8'>
						<div className='d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2'>
							<div className='d-flex align-items-center gap-2'>
								<FontAwesomeIcon icon={faBoxes} className='text-primary fs-6' />
								<h5 className='fw-bolder text-gray-900 fs-5 m-0'>Purchased Raw Materials</h5>
								<span className='badge badge-light-primary fw-bold fs-8 ms-2'>
									{invoice.items?.length || 0} Items
								</span>
							</div>
						</div>

						<div className='table-responsive rounded-3' style={{ border: '1px solid #E2E8F0' }}>
							<table className='table align-middle gs-4 gy-3 mb-0' style={{ fontSize: '13px' }}>
								<thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
									<tr className='fw-bolder text-gray-700 text-uppercase fs-8'>
										<th style={{ width: '50px' }} className='ps-5'>
											#
										</th>
										<th>Product</th>
										<th style={{ width: '170px' }}>Quantity / Weight</th>
										<th style={{ width: '150px' }}>Rate per Unit</th>
										<th style={{ width: '110px' }}>GST Tax</th>
										<th style={{ width: '160px' }} className='text-end pe-5'>
											Subtotal (₹)
										</th>
									</tr>
								</thead>
								<tbody>
									{invoice.items && invoice.items.length > 0 ? (
										invoice.items.map((item, index) => {
											const displayWeight =
												item.weight_type?.toLowerCase().includes('kg') ||
												item.weight_type?.toLowerCase().includes('ltr')
													? item.weight / 1000
													: item.weight
											const itemSubtotal = calculateItemTotal(item)

											return (
												<tr
													key={index}
													style={{
														borderBottom:
															index === invoice.items.length - 1 ? 'none' : '1px solid #F1F5F9',
													}}>
													<td className='ps-5 text-muted fw-bold'>{index + 1}</td>
													<td>
														<span className='fw-bold text-gray-900 d-block fs-7'>
															{item.product_name || item.product_id}
														</span>
														<span className='text-muted fs-8 font-monospace'>
															ID: {item.product_id}
														</span>
													</td>
													<td>
														<span className='badge badge-light fw-bold text-gray-800 px-3 py-2 fs-7'>
															{displayWeight} {item.weight_type}
														</span>
													</td>
													<td>
														<span className='fw-semibold text-gray-800'>
															₹
															{Number(item.rate || 0).toLocaleString('en-IN', {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
														</span>
													</td>
													<td>
														<span className='badge badge-light-warning fw-bold fs-8'>
															{item.gst || 0}%
														</span>
													</td>
													<td className='text-end pe-5'>
														<span className='fw-bold text-gray-900 fs-7'>
															₹
															{itemSubtotal.toLocaleString('en-IN', {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
														</span>
													</td>
												</tr>
											)
										})
									) : (
										<tr>
											<td colSpan={6} className='text-center text-muted py-8'>
												No items recorded in this invoice.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* Bottom Row: Bill Receipt Preview & Financial Summary */}
					<div className='row g-5'>
						{/* Left Column: Bill Receipt Preview */}
						<div className='col-12 col-lg-6'>
							<div
								className='p-6 rounded-3 h-100 d-flex flex-column justify-content-between'
								style={{
									backgroundColor: '#F8FAFC',
									border: '1px solid #E2E8F0',
								}}>
								<div>
									<div
										className='d-flex align-items-center gap-2 mb-4 pb-2 border-bottom'
										style={{ borderColor: '#E2E8F0' }}>
										<FontAwesomeIcon icon={faFileInvoice} className='text-primary fs-6' />
										<h5 className='fw-bolder text-gray-900 fs-6 m-0'>Attached Bill / Receipt</h5>
									</div>

									{displayImg ? (
										isPdf ? (
											<div
												className='p-6 rounded-3 d-flex flex-column align-items-center justify-content-center text-center bg-white'
												style={{
													border: '1px solid #E2E8F0',
													minHeight: '220px',
												}}>
												<FontAwesomeIcon
													icon={faFilePdf}
													className='text-danger mb-3'
													style={{ fontSize: '3.5rem' }}
												/>
												<span className='fw-bold text-gray-800 fs-6 mb-1'>
													Invoice Document (PDF)
												</span>
												<span
													className='text-muted fs-8 mb-4 text-truncate'
													style={{ maxWidth: '280px' }}>
													{invoice.bill_image}
												</span>
												<a
													href={displayImg}
													target='_blank'
													rel='noreferrer'
													className='btn btn-sm btn-primary fw-bold d-inline-flex align-items-center gap-2'
													style={{ borderRadius: '8px' }}>
													<FontAwesomeIcon icon={faExternalLinkAlt} />
													Open PDF Document
												</a>
											</div>
										) : (
											<div
												className='p-4 rounded-3 text-center bg-white'
												style={{
													border: '1px solid #E2E8F0',
												}}>
												<a
													href={displayImg}
													target='_blank'
													rel='noreferrer'
													title='Click to view full image'>
													<img
														src={displayImg}
														alt='Invoice Receipt'
														style={{
															maxWidth: '100%',
															maxHeight: '280px',
															objectFit: 'contain',
															borderRadius: '6px',
															backgroundColor: '#FFFFFF',
														}}
													/>
												</a>
												<div className='mt-3'>
													<a
														href={displayImg}
														target='_blank'
														rel='noreferrer'
														className='btn btn-sm btn-light-primary fw-bold d-inline-flex align-items-center gap-2'
														style={{ borderRadius: '8px', fontSize: '12px' }}>
														<FontAwesomeIcon icon={faExternalLinkAlt} />
														Open Full Size Image
													</a>
												</div>
											</div>
										)
									) : (
										<div
											className='p-6 rounded-3 d-flex flex-column align-items-center justify-content-center text-center bg-white'
											style={{
												border: '1px dashed #CBD5E1',
												minHeight: '200px',
											}}>
											<FontAwesomeIcon
												icon={faFileInvoice}
												className='text-gray-400 mb-2'
												style={{ fontSize: '2.5rem' }}
											/>
											<span className='fw-bold text-gray-700 fs-7'>
												No Bill Document Uploaded
											</span>
											<span className='text-muted fs-8 mt-1'>
												No receipt file was attached when creating this invoice
											</span>
										</div>
									)}
								</div>

								<span className='text-muted fs-8 mt-4 d-block'>
									Attached document is stored securely in FG Group cloud storage.
								</span>
							</div>
						</div>

						{/* Right Column: Financial Summary */}
						<div className='col-12 col-lg-6'>
							<div
								className='p-6 rounded-3 h-100 d-flex flex-column justify-content-between'
								style={{
									backgroundColor: '#F8FAFC',
									border: '1px solid #E2E8F0',
								}}>
								<div>
									<div
										className='d-flex align-items-center gap-2 mb-4 pb-2 border-bottom'
										style={{ borderColor: '#E2E8F0' }}>
										<FontAwesomeIcon icon={faReceipt} className='text-primary fs-6' />
										<h5 className='fw-bolder text-gray-900 fs-6 m-0'>Financial Summary</h5>
									</div>

									<div className='d-flex flex-column gap-3 mb-5'>
										<div className='d-flex justify-content-between align-items-center text-gray-700 fs-7'>
											<span>Items Calculated Subtotal</span>
											<span className='fw-bold text-gray-900'>
												₹
												{calculatedItemsTotal.toLocaleString('en-IN', {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</span>
										</div>
										<div className='d-flex justify-content-between align-items-center text-gray-700 fs-7'>
											<span>Delivery & Additional Charges</span>
											<span className='fw-bold text-gray-900'>
												₹
												{Number(invoice.charges || 0).toLocaleString('en-IN', {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</span>
										</div>
									</div>
								</div>

								<div
									className='p-4 rounded-3 d-flex justify-content-between align-items-center'
									style={{
										backgroundColor: '#EEF2F6',
										border: '1px solid #DFE7F0',
									}}>
									<div>
										<span className='text-muted fs-8 fw-semibold text-uppercase d-block'>
											Grand Total Invoice Amount
										</span>
										<span className='fs-2 fw-bolder text-gray-900'>
											₹
											{Number(invoice.total_amount || 0).toLocaleString('en-IN', {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</span>
									</div>
									<span className='badge badge-light-success fw-bolder fs-8 px-3 py-2'>
										<FontAwesomeIcon icon={faCheck} className='me-1' />
										Confirmed
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* 3. Footer Actions */}
					<div
						className='d-flex align-items-center justify-content-between mt-8 pt-5 border-top'
						style={{ borderColor: '#E2E8F0' }}>
						<span className='text-muted fs-8'>
							Supplier invoice recorded in RAG Admin Inventory System
						</span>

						<div className='d-flex align-items-center gap-3'>
							<button
								type='button'
								className='btn btn-light btn-active-light-primary fw-semibold d-flex align-items-center gap-2'
								onClick={handleGoBack}
								style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}>
								<FontAwesomeIcon icon={faArrowLeft} />
								Back to Invoices
							</button>

							<button
								type='button'
								className='btn fw-bold d-flex align-items-center gap-2'
								onClick={() =>
									navigate(`/rag/inventory/suppliers/invoice/edit?invoice_id=${invoice._id}`)
								}
								style={{
									backgroundColor: '#0F172A',
									color: '#ffffff',
									height: '38px',
									borderRadius: '8px',
									fontSize: '13px',
								}}>
								<FontAwesomeIcon icon={faEdit} />
								Edit Invoice
							</button>
						</div>
					</div>
				</div>
			</KTCard>
		</>
	)
}

export default GomziNutritionMaterialSuppliersInvoiceView
