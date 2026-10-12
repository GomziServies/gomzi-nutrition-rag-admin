import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
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
			const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : 'N/A'

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

	if (loading) {
		return (
			<>
				<PageTitle breadcrumbs={[]}>Supplier Invoice</PageTitle>
				<div className='row mt-5'>
					<div className='col-md-12 text-center'>
						<div
							className='spinner-border text-primary'
							role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
						<p className='mt-3'>Loading invoice...</p>
					</div>
				</div>
			</>
		)
	}

	if (!invoice) {
		return (
			<>
				<PageTitle breadcrumbs={[]}>Supplier Invoice</PageTitle>
				<div className='row mt-5'>
					<div className='col-md-12 text-center'>
						<p>No invoice found.</p>
						<button
							className='btn btn-primary mt-3'
							onClick={handleGoBack}>
							Back to List
						</button>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Supplier Invoice</PageTitle>
			<div className='row mt-4 justify-content-center'>
				<div className='col-xl-9 col-lg-10'>
					<div className='card card-flush shadow-sm'>
						<div className='card-header border-0 py-4 bg-light-primary'>
							<div className='card-title flex-column'>
								<span className='fs-2 fw-bolder text-dark'>SUPPLIER INVOICE</span>
							</div>
							{/* <div className='card-toolbar'>
									<span
										className={`badge fw-bold px-4 py-2 ${
											invoice.status ? 'badge-light-success' : 'badge-light-danger'
										}`}
									>
										{invoice.status ? 'PAID' : 'PENDING'}
									</span>
								</div> */}
						</div>

						<div className='card-body p-9'>
							{/* Top section: supplier details + invoice meta */}
							<div className='row mb-7'>
								<div className='col-md-7 d-flex'>
									<div className='me-5'>
										{invoice.supplier_logo && (
											<div className='border rounded p-2 bg-white d-inline-flex align-items-center justify-content-center'>
												<img
													src={`https://files.fggroup.in/${invoice.supplier_logo}`}
													alt='Supplier Logo'
													style={{ maxWidth: '90px', maxHeight: '90px', objectFit: 'contain' }}
												/>
											</div>
										)}
									</div>
									<div>
										<p className='text-gray-600 fw-semibold mb-1'>Supplier</p>
										<p className='fs-3 fw-bolder mb-1 text-dark'>{invoice.name}</p>
										<p
											className='mb-1 text-gray-700'
											style={{ fontSize: '13px' }}>
											{invoice.address}
										</p>
										<p
											className='mb-1 text-gray-700'
											style={{ fontSize: '13px' }}>
											<strong>Phone:</strong> {invoice.number}
										</p>
										<p
											className='mb-0 text-gray-700'
											style={{ fontSize: '13px' }}>
											<strong>Email:</strong> {invoice.email}
										</p>
									</div>
								</div>
								<div className='col-md-5 mt-5 mt-md-0'>
									<div className='border rounded-3 p-4 bg-light text-gray-800'>
										<p className='fw-semibold text-gray-600 mb-3'>Invoice Details</p>

										<div
											className='d-flex justify-content-between mb-1'
											style={{ fontSize: '13px' }}>
											<span className='text-muted'>Invoice Date</span>
											<span className='fw-semibold'>{invoice.date}</span>
										</div>
									</div>
								</div>
							</div>

							{/* Items table */}
							<div className='table-responsive mb-5'>
								<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-3'>
									<thead className='border-bottom border-gray-300 bg-light'>
										<tr className='fw-bold text-gray-700 text-uppercase fs-8'>
											<th style={{ width: '5%' }}>No</th>
											<th>Product</th>
											<th style={{ width: '18%' }}>Weight</th>
											<th style={{ width: '15%' }}>Rate (₹)</th>
											<th style={{ width: '15%' }}>GST (%)</th>
										</tr>
									</thead>
									<tbody>
										{invoice.items && invoice.items.length > 0 ? (
											invoice.items.map((item, index) => (
												<tr key={index}>
													<td className='text-gray-700'>{index + 1}</td>
													<td className='text-gray-800 fw-semibold'>
														{item.product_name || item.product_id}
													</td>
													<td className='text-gray-700'>
														{item.weight_type?.toLowerCase().includes('kg') ||
														item.weight_type?.toLowerCase().includes('ltr')
															? item.weight / 1000
															: item.weight}{' '}
														{item.weight_type}
													</td>
													<td className='text-gray-700'>₹{item.rate}</td>
													<td className='text-gray-700'>{item.gst}%</td>
												</tr>
											))
										) : (
											<tr>
												<td
													colSpan={5}
													className='text-center text-gray-500 py-5'>
													No items found
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>

							{/* Totals section */}
							<div className='d-flex justify-content-end mb-5'>
								<div
									className='border rounded-3 px-5 py-3 bg-light text-end'
									style={{ minWidth: '260px' }}>
									<p
										className='mb-2 text-gray-700'
										style={{ fontSize: '13px' }}>
										<span className='fw-semibold me-2'>Extra Charges:</span>
										<span className='fw-bold'>₹{invoice.charges}</span>
									</p>
									<hr className='my-2' />
									<p className='mb-0 fs-5 fw-bolder text-dark'>
										Total Amount: ₹{invoice.total_amount}
									</p>
								</div>
							</div>

							{/* Bill preview */}
							{displayImg && (
								<div className='mt-6'>
									<p className='fw-semibold text-gray-700 mb-3'>Bill Preview</p>
									<div className='border rounded-3 p-4 bg-white text-center'>
										{displayImg.toLowerCase().endsWith('.pdf') ? (
											<div className='py-10'>
												<i
													className='bi bi-file-earmark-pdf text-danger'
													style={{ fontSize: '4rem' }}></i>
												<div className='mt-4'>
													<a
														href={displayImg}
														target='_blank'
														rel='noreferrer'
														className='btn btn-light-primary btn-sm'>
														<i className='bi bi-eye me-2'></i>
														View Invoice PDF
													</a>
												</div>
											</div>
										) : (
											<a
												href={displayImg}
												target='_blank'
												rel='noreferrer'>
												<img
													src={displayImg}
													alt='Bill'
													style={{
														maxWidth: '100%',
														maxHeight: '360px',
														objectFit: 'contain',
														cursor: 'pointer',
													}}
												/>
											</a>
										)}
										<p
											className='text-muted mt-3'
											style={{ fontSize: '12px' }}>
											Click{' '}
											{displayImg.toLowerCase().endsWith('.pdf') ? 'the button' : 'on the image'} to
											view the full invoice in a new tab.
										</p>
									</div>
								</div>
							)}
						</div>

						<div className='card-footer py-4 d-flex justify-content-between align-items-center'>
							<span
								className='text-muted'
								style={{ fontSize: '12px' }}>
								Generated for internal use only.
							</span>
							<button
								className='btn btn-primary'
								onClick={handleGoBack}>
								Back to List
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default GomziNutritionMaterialSuppliersInvoiceView
