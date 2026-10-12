import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import TableButton from '../../../components/TableButton'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import {
	GetGnClient,
	UpdateLabelStatus,
	UpdateLabReportStatus,
} from '../../../Functions/FGGroup/GnClients'
import { GetGnDispatchBill } from '../../../Functions/FGGroup/GnDispatchBill'
import { GetGnFormulation } from '../../../Functions/FGGroup/GnFormulation'
import { GetGnLabelDesignApprove } from '../../../Functions/FGGroup/GnLabelDesignApprove'
import {
	AddGnLabReport,
	GetGnLabReport,
	UpdateGnLabReport,
} from '../../../Functions/FGGroup/GnLabReport'
import { GetGnProcurement } from '../../../Functions/FGGroup/GnProcurement'
import { GetGnProduction } from '../../../Functions/FGGroup/GnProduction'
import './gn-inventory-view.css'

interface ClientProcess {
	id: string
	clientName: string
	email: string
	phone: string
	commonId?: string
	items?: Array<{
		item_name: string
		item_type?: string
		item_weight?: number
		item_weight_type?: string
		quantity?: number
	}>
}

interface Production {
	id: string
	productName: string
	batchNo: string
	productRawType: string
	weight: string
	totalProductWeight: string
	totalRawWeight: string
	totalUsedWeight: string
	createdAt: string
	status: string
}

interface ClientDetails {
	client_name: string
	phone_no: string
	email: string
	address: string
	gst_number: string
	pan_number: string
	invoice_no: string
}

interface DesignApproval {
	id: string
	brandName: string
	productName: string
	issueDate: string
	createdDate: string
	status?: string
	approvalImage?: string
}

interface Procurement {
	_id: string
	clientId: string
	orderAmount: number
	totalCost: number
	grossMargin: number
	totalQty: number
	transportation: number
	updatedAt: string
	ingredientItems: any[]
	packingItems: any[]
}

interface LabReport {
	id: string
	productName: string
	image: string
	item_id: string
	createdAt: string
	updatedAt: string
}

interface Dispatch {
	id: string
	clientId: string
	clientName: string
	supplierName: string
	orderWeight: number
	orderValue: number
	shippingCharges: number
	trackingId: string
	image: string
	createdAt: string
	updatedAt: string
	status: string
}

interface Formulation {
	_id: string
	productName: string
	scoopSize: number
	updatedAt: string
	common_id: string
	clientId: string
	clientName: string
}

const GnViewList: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const [selectedClient, setSelectedClient] = useState<ClientProcess | null>(null)

	const [clientData, setClientData] = useState<ClientDetails>({
		client_name: 'Loading...',
		phone_no: '-',
		email: '-',
		address: '-',
		gst_number: '-',
		pan_number: '-',
		invoice_no: '-',
	})

	const [isLoadingClientData, setIsLoadingClientData] = useState(false)
	const [formulations, setFormulations] = useState<Formulation[]>([])
	const [isLoadingFormulations, setIsLoadingFormulations] = useState(false)
	const [procurements, setProcurements] = useState<Procurement[]>([])
	const [isLoadingProcurements, setIsLoadingProcurements] = useState(false)
	const [productions, setProductions] = useState<any[]>([])
	const [isLoadingProductions, setIsLoadingProductions] = useState(false)
	const [dispatches, setDispatches] = useState<Dispatch[]>([])
	const [isLoadingDispatches, setIsLoadingDispatches] = useState(false)

	// ✅ Fetch Formulations
	const fetchFormulations = async (clientId: string) => {
		setIsLoadingFormulations(true)
		try {
			const response: FGGroupAPIResponse = await GetGnFormulation({ clientId: clientId })

			if (response?.data && Array.isArray(response.data)) {
				setFormulations(response.data)
			} else {
				setFormulations([])
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch formulations')
			setFormulations([])
		} finally {
			setIsLoadingFormulations(false)
		}
	}

	// ✅ Fetch Procurements Data
	const fetchProcurements = async (clientId: string) => {
		setIsLoadingProcurements(true)
		try {
			const response: FGGroupAPIResponse = await GetGnProcurement({ clientId: clientId })

			if (response?.data && Array.isArray(response.data)) {
				setProcurements(response.data)
			} else {
				setProcurements([])
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch procurements')
			setProcurements([])
		} finally {
			setIsLoadingProcurements(false)
		}
	}

	// ✅ Fetch Productions
	const fetchProductions = async (clientId: string) => {
		setIsLoadingProductions(true)
		try {
			const response: FGGroupAPIResponse = await GetGnProduction({ clientId: clientId })

			if (response?.data && Array.isArray(response.data)) {
				setProductions(response.data)
			} else {
				setProductions([])
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch productions')
			setProductions([])
		} finally {
			setIsLoadingProductions(false)
		}
	}

	// ✅ Fetch Client Data from API
	const fetchClientData = async (clientId: string) => {
		setIsLoadingClientData(true)
		try {
			const response: FGGroupAPIResponse = await GetGnClient({ id: clientId })

			const clientDataResponse = response?.data
			if (clientDataResponse) {
				const client = Array.isArray(clientDataResponse)
					? clientDataResponse[0]
					: clientDataResponse
				if (client) {
					// Format billing address
					const addressParts = []
					if (client.billing_address?.address_line_1)
						addressParts.push(client.billing_address.address_line_1)
					if (client.billing_address?.city) addressParts.push(client.billing_address.city)
					if (client.billing_address?.state) addressParts.push(client.billing_address.state)
					if (client.billing_address?.pin_code) addressParts.push(client.billing_address.pin_code)
					if (client.billing_address?.country) addressParts.push(client.billing_address.country)

					const formattedAddress =
						addressParts.length > 0 ? addressParts.join(', ') : 'Address not provided'

					setClientData({
						client_name: client.name || 'N/A',
						phone_no: client.mobile || 'Not Provided',
						email: client.email || 'Not Provided',
						address: formattedAddress,
						gst_number: client.gst_number || 'Not Provided',
						pan_number: client.pan_number || 'Not Provided',
						invoice_no: client.invoice_number ? `INV-${client.invoice_number}` : 'Not Assigned',
					})

					// Update selectedClient with items for formulation check
					setSelectedClient((prev) => {
						const updated = prev
							? {
									...prev,
									items: client.items || [],
									clientName: client.name || '',
									email: client.email || '',
									phone: client.mobile || '',
									commonId: client.common_id || prev.commonId,
							  }
							: {
									id: clientId,
									commonId: client.common_id || '',
									clientName: client.name || '',
									email: client.email || '',
									phone: client.mobile || '',
									items: client.items || [],
							  }

						return updated
					})

					// Extract label sticker status from production_process
					const labelSticker = client.production_process?.label_sticker
					if (labelSticker) {
						setIsLabelToggleOn(labelSticker.is_outsourced === true)
					}

					// Extract lab report status from production_process
					if (client.production_process?.lab_report) {
						setIsLabReportToggleOn(client.production_process.lab_report.is_skipped === false)
					}
				} else {
					toast.error('Client data not found')
				}
			} else {
				toast.error('Client data not found')
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch client data')
		} finally {
			setIsLoadingClientData(false)
		}
	}

	const [isLoadingLabReports, setIsLoadingLabReports] = useState(false)
	const [labReports, setLabReports] = useState<LabReport[]>([])

	// ✅ Fetch Lab Reports Data from API filtered by clientId
	const fetchLabReports = async (clientId: string) => {
		setIsLoadingLabReports(true)
		try {
			const response: FGGroupAPIResponse = await GetGnLabReport({ clientId: clientId })
			if (response?.data && Array.isArray(response.data)) {
				setLabReports(
					response.data.map((item: any) => {
						return {
							id: item._id,
							productName: item.productName || 'Unknown Product',
							image: item.image,
							item_id: item.item_id,
							createdAt: item.createdAt,
							updatedAt: item.updatedAt,
						}
					})
				)
			} else {
				setLabReports([])
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch lab reports')
			setLabReports([])
		} finally {
			setIsLoadingLabReports(false)
		}
	}

	// ✅ Fetch Dispatches
	const fetchDispatches = async (clientId: string) => {
		setIsLoadingDispatches(true)
		try {
			const response: FGGroupAPIResponse = await GetGnDispatchBill({ clientId: clientId })
			if (response?.data && Array.isArray(response.data)) {
				setDispatches(
					response.data.map((item: any) => {
						let imageUrl = item.image || ''
						if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
							imageUrl = `https://files.fggroup.in/${imageUrl}`
						}
						return {
							id: item._id,
							clientId: item.clientId?._id || item.clientId,
							clientName: item.clientName || item.clientId?.name || 'N/A',
							supplierName: item.supplierName,
							orderWeight: item.orderWeight,
							orderValue: item.orderValue,
							shippingCharges: item.shippingCharges,
							trackingId: item.trackingId,
							image: imageUrl,
							createdAt: item.createdAt,
							updatedAt: item.updatedAt,
							status: item.status || 'Pending',
						}
					})
				)
			} else {
				setDispatches([])
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch dispatches')
			setDispatches([])
		} finally {
			setIsLoadingDispatches(false)
		}
	}

	const [isLabelToggleOn, setIsLabelToggleOn] = useState<boolean>(true)
	const [isLabReportToggleOn, setIsLabReportToggleOn] = useState<boolean>(false)
	const [isLoadingDesignApprovals, setIsLoadingDesignApprovals] = useState(false)

	// ✅ Load client data from URL parameters
	useEffect(() => {
		const clientId = searchParams.get('clientId')
		const commonId = searchParams.get('commonId')

		if (clientId) {
			fetchClientData(clientId)

			// Create a basic selectedClient object for UI purposes
			setSelectedClient({
				id: clientId,
				commonId: commonId || '',
				clientName: '',
				email: '',
				phone: '',
			})

			// Fetch all related data using clientId
			fetchFormulations(clientId)
			fetchDesignApprovals(clientId)
			fetchProcurements(clientId)
			fetchProductions(clientId)
			fetchLabReports(clientId)
			fetchDispatches(clientId)
		} else {
			toast.error('Client ID not found. Please select a client from inventory.')
			navigate('/rag/inventory')
		}
	}, [searchParams])

	const [designApprovals, setDesignApprovals] = useState<DesignApproval[]>([])
	const [showDispatchModal, setShowDispatchModal] = useState(false)
	const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null)
	const [showLabReportModal, setShowLabReportModal] = useState(false)

	const [selectedLabReportId, setSelectedLabReportId] = useState<string | null>(null)
	const [labReportFormData, setLabReportFormData] = useState({
		productName: '',
		item_id: '',
		image: null as File | null,
		imagePreview: '',
	})

	const handleLabReportAddClick = () => {
		setSelectedLabReportId(null)
		setLabReportFormData({
			productName: '',
			item_id: '',
			image: null,
			imagePreview: '',
		})
		setShowLabReportModal(true)
	}

	const handleLabReportEditClick = (item: LabReport) => {
		setSelectedLabReportId(item.id)
		setLabReportFormData({
			productName: item.productName,
			item_id: item.item_id,
			image: null,
			imagePreview: item.image,
		})
		setShowLabReportModal(true)
	}

	const handleLabReportInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		if (name === 'image' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			if (file) {
				setLabReportFormData((prev) => ({
					...prev,
					image: file,
					imagePreview: URL.createObjectURL(file),
				}))
			}
		} else if (name === 'item_id') {
			const selectedProduct = selectedClient?.items?.find((p: any) => p._id === value)
			setLabReportFormData((prev) => ({
				...prev,
				item_id: value,
				productName: selectedProduct?.item_name || '',
			}))
		} else {
			setLabReportFormData((prev) => ({
				...prev,
				[name]: value,
			}))
		}
	}

	const handleLabReportSubmit = async () => {
		if (!labReportFormData.item_id) {
			toast.error('Please select a product')
			return
		}

		if (!labReportFormData.image && !labReportFormData.imagePreview) {
			toast.error('Please select an image')
			return
		}

		setIsLoadingLabReports(true)
		try {
			let imageUrl = labReportFormData.imagePreview
			if (labReportFormData.image) {
				const uploadResponse: any = await FileUploadToFGGroup([labReportFormData.image], {
					directory: 'lab-reports',
				})
				if (uploadResponse?.status === 200 && uploadResponse?.data?.fileURLs?.[0]) {
					imageUrl = uploadResponse.data.fileURLs[0]
					if (imageUrl && !imageUrl.startsWith('http')) {
						imageUrl = `https://files.fggroup.in/${imageUrl}`
					}
				} else {
					throw new Error('Image upload failed')
				}
			}

			const payload = {
				clientId: selectedClient?.id,
				item_id: labReportFormData.item_id,
				image: imageUrl,
			}

			if (selectedLabReportId) {
				await UpdateGnLabReport({
					id: selectedLabReportId,
					image: imageUrl,
				})
				toast.success('Lab report updated successfully')
			} else {
				await AddGnLabReport(payload)
				toast.success('Lab report added successfully')
			}

			setShowLabReportModal(false)
			if (selectedClient?.id) {
				fetchLabReports(selectedClient.id)
				fetchClientData(selectedClient.id)
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to save lab report')
		} finally {
			setIsLoadingLabReports(false)
		}
	}

	const handleDispatchViewClick = (item: Dispatch) => {
		setSelectedDispatch(item)
		setShowDispatchModal(true)
	}

	const handleDispatchEditClick = (item: Dispatch) => {}

	const getStatusColor = (status: string) => {
		const statusColors: { [key: string]: string } = {
			Approved: 'success',
			Completed: 'success',
			Delivered: 'success',
			Pending: 'warning',
			'In Progress': 'info',
			'In Transit': 'info',
			'Quality Check': 'primary',
			Rejected: 'danger',
			Failed: 'danger',
		}
		return statusColors[status] || 'secondary'
	}

	const formatDateTime = (dateTimeString: string) => {
		const date = new Date(dateTimeString)
		const dateStr = date.toLocaleDateString('en-IN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
		const timeStr = date.toLocaleTimeString('en-IN', {
			hour: '2-digit',
			minute: '2-digit',
		})
		return { date: dateStr, time: timeStr }
	}

	const stats = [
		{
			title: 'Total Products',
			value: selectedClient?.items?.length,
			icon: 'bi-box-seam',
			color: 'primary',
			bgColor: '#f1f5ff',
		},
		{
			title: 'Design Approvals',
			value: designApprovals.length,
			icon: 'bi-palette',
			color: 'success',
			bgColor: '#e8f8f3',
		},
		{
			title: 'Production Batches',
			value: productions.length,
			icon: 'bi-boxes',
			color: 'info',
			bgColor: '#e5f6ff',
		},
		{
			title: 'Dispatch Orders',
			value: dispatches.length,
			icon: 'bi-truck',
			color: 'warning',
			bgColor: '#fff8e1',
		},
	]

	// ✅ Check if all formulations are created
	const allFormulationsAdded = (() => {
		const totalProducts = selectedClient?.items?.length || 0
		const totalFormulations = formulations.length
		return totalProducts > 0 && totalFormulations >= totalProducts
	})()

	// ✅ Check if all products have label design approvals
	const allLabelDesignsAdded = (() => {
		const totalProducts = selectedClient?.items?.length || 0
		const totalDesignApprovals = designApprovals.length
		return totalProducts > 0 && totalDesignApprovals >= totalProducts
	})()

	// ✅ Check if all products have been produced
	const allProductionsAdded = (() => {
		const totalProducts = selectedClient?.items?.length || 0
		const totalProductions = productions.length
		return totalProducts > 0 && totalProductions >= totalProducts
	})()

	const fetchDesignApprovals = async (clientId: string) => {
		setIsLoadingDesignApprovals(true)
		try {
			const response: FGGroupAPIResponse = await GetGnLabelDesignApprove({ clientId: clientId })
			if (response?.data && Array.isArray(response.data)) {
				setDesignApprovals(
					response.data.map((item: any) => ({
						id: item._id,
						brandName: item.brandName,
						productName: item.productName,
						issueDate: item.issueDate,
						createdDate: item.createdAt,
						status: item.final_approval_by_client ? 'Approved' : 'Pending',
						approvalImage: item.final_approval_image || item.label_preview_image,
					}))
				)
			} else {
				setDesignApprovals([])
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch label design approvals')
			setDesignApprovals([])
		} finally {
			setIsLoadingDesignApprovals(false)
		}
	}

	const handleLabelToggle = async () => {
		if (!selectedClient?.id) return
		const newValue = !isLabelToggleOn
		try {
			await UpdateLabelStatus({ clientId: selectedClient.id, is_outsourced: newValue })
			setIsLabelToggleOn(newValue)
			toast.success(`Label sticker ${newValue ? 'enabled' : 'disabled'} successfully`)
		} catch (error: any) {
			toast.error(error?.message || 'Failed to update label status')
		}
	}

	const handleLabReportToggle = async () => {
		if (!selectedClient?.id) return
		const newValue = !isLabReportToggleOn
		try {
			await UpdateLabReportStatus({ clientId: selectedClient.id, is_skipped: !newValue })
			setIsLabReportToggleOn(newValue)
			toast.success(`Lab report ${newValue ? 'enabled' : 'skipped'} successfully`)
		} catch (error: any) {
			toast.error(error?.message || 'Failed to update lab report status')
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Client Dashboard</PageTitle>

			{/* Client Info Banner */}
			<div className='card shadow-sm mb-7 client-info-card'>
				<div className='card-body p-0'>
					<div className='client-info-header'>
						<div className='d-flex align-items-center'>
							<div className='symbol symbol-70px symbol-circle me-4 client-avatar'>
								<span className='symbol-label fs-2x fw-bold client-avatar-label'>
									{clientData.client_name.charAt(0)}
								</span>
							</div>
							<div>
								<h1 className='text-dark fw-bold mb-2 fs-2x'>{clientData.client_name}</h1>
								<div className='d-flex flex-wrap gap-4'>
									<span className='text-dark opacity-90 fs-6'>
										<i className='bi bi-telephone-fill me-2'></i>
										{clientData.phone_no}
									</span>
									<span className='text-dark opacity-90 fs-6'>
										<i className='bi bi-envelope-fill me-2'></i>
										{clientData.email}
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className='p-6'>
						<div className='row g-4'>
							<div className='col-12'>
								<div className='d-flex align-items-start p-4 rounded-3 client-info-box'>
									<i className='bi bi-geo-alt-fill text-primary fs-5 me-3 mt-1'></i>
									<div>
										<div className='text-gray-500 fs-7 mb-1'>Address</div>
										<div className='text-gray-900 fw-semibold fs-6'>{clientData.address}</div>
									</div>
								</div>
							</div>

							<div className='col-md-4'>
								<div className='d-flex align-items-start p-4 rounded-3 client-info-box'>
									<i className='bi bi-receipt text-primary fs-5 me-3 mt-1'></i>
									<div>
										<div className='text-gray-500 fs-7 mb-1'>Invoice Number</div>
										<div className='text-gray-900 fw-semibold fs-6'>{clientData.invoice_no}</div>
									</div>
								</div>
							</div>

							<div className='col-md-4'>
								<div className='d-flex align-items-start p-4 rounded-3 client-info-box'>
									<i className='bi bi-bank text-primary fs-5 me-3 mt-1'></i>
									<div>
										<div className='text-gray-500 fs-7 mb-1'>GST Number</div>
										<div className='text-gray-900 fw-semibold fs-6'>{clientData.gst_number}</div>
									</div>
								</div>
							</div>

							<div className='col-md-4'>
								<div className='d-flex align-items-start p-4 rounded-3 client-info-box'>
									<i className='bi bi-credit-card text-primary fs-5 me-3 mt-1'></i>
									<div>
										<div className='text-gray-500 fs-7 mb-1'>PAN Number</div>
										<div className='text-gray-900 fw-semibold fs-6'>{clientData.pan_number}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='row g-4 mb-7'>
				{stats.map((stat, index) => (
					<div
						key={index}
						className='col-md-6 col-xl-3'>
						<div className='card h-100 stats-card'>
							<div className='card-body p-5'>
								<div className='d-flex align-items-center justify-content-between'>
									<div>
										<div className='fs-7 text-gray-600 fw-semibold mb-2'>{stat.title}</div>
										<div className='fs-2x fw-bolder text-gray-800'>{stat.value}</div>
									</div>
									<div
										className='symbol symbol-50px stats-icon-wrapper'
										style={{
											backgroundColor: stat.bgColor,
										}}>
										<span className={`symbol-label text-${stat.color}`}>
											<i className={`${stat.icon} fs-2x`}></i>
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Formulation Table Section */}
			<div className='card mb-7 inventory-view-card'>
				<div className='card-header border-0 pt-6 pb-0 inventory-view-card-header'>
					<div className='d-flex align-items-center justify-content-between w-100'>
						<div>
							<h3 className='card-title fw-bolder text-gray-800 fs-2'>Formulation Table</h3>
							<p className='text-gray-600 fs-7 mb-0 mt-1'>Manage nutritional information</p>
						</div>
						{!allFormulationsAdded && selectedClient && (
							<TableButton
								action='add'
								to={`/rag/inventory/gn-nutrition-table/add?clientId=${selectedClient.id}`}
								text='Add Formulation'
							/>
						)}
					</div>
				</div>
				<div className='card-body pt-6'>
					{isLoadingFormulations ? (
						<div className='text-center py-10'>
							<div
								className='spinner-border text-primary'
								role='status'>
								<span className='visually-hidden'>Loading...</span>
							</div>
							<p className='text-gray-600 fs-6 mt-3'>Loading formulations...</p>
						</div>
					) : formulations.length === 0 ? (
						<div className='text-center py-10'>
							<i className='bi bi-inbox fs-4x text-gray-400 mb-4'></i>
							<p className='text-gray-600 fs-5 mb-0'>No formulations available</p>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table table-row-bordered align-middle gs-0 gy-4'>
								<thead>
									<tr className='fw-bold text-gray-700 fs-7 text-uppercase'>
										<th className='min-w-200px'>Product Name</th>
										<th className='min-w-150px'>Scoop Size (gm)</th>
										<th className='min-w-150px'>Date</th>
										<th className='min-w-100px text-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{formulations.map((formulation) => {
										const { date, time } = formatDateTime(formulation.updatedAt)
										return (
											<tr key={formulation._id}>
												<td>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-40px me-3'>
															<span className='symbol-label bg-light-primary'>
																<i className='bi bi-clipboard-data text-primary fs-4'></i>
															</span>
														</div>
														<span className='text-gray-800 fw-bold fs-6'>
															{formulation.productName}
														</span>
													</div>
												</td>
												<td>
													<span className='text-gray-800 fw-bold fs-6'>
														{formulation.scoopSize} gm
													</span>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-gray-800 fw-bold fs-6'>{date}</span>
														<span className='text-gray-700 fs-8 fw-bold'>{time}</span>
													</div>
												</td>
												<td className='text-end'>
													<div className='d-flex justify-content-end gap-2'>
														<TableButton
															action='view'
															to={`/rag/inventory/gn-nutrition-table/view?formulation_id=${formulation._id}`}
														/>
														<TableButton
															action='edit'
															to={`/rag/inventory/gn-nutrition-table/edit?formulation_id=${formulation._id}`}
														/>
													</div>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Label Approvals Section with improved toggle */}
			<div className='card mb-7 inventory-view-card'>
				<div className='card-header border-0 pt-6 pb-0 inventory-view-card-header'>
					<div className='d-flex align-items-center justify-content-between w-100 flex-wrap gap-4'>
						<div className='d-flex align-items-center gap-4'>
							<div>
								<h3 className='card-title fw-bolder text-gray-800 fs-2'>Label Approvals</h3>
								<p className='text-gray-600 fs-7 mb-0 mt-1'>Product packaging and labels</p>
							</div>

							<div className='d-flex align-items-center gap-3'>
								<span
									className={`fs-7 fw-semibold ${
										!isLabelToggleOn ? 'text-gray-900' : 'text-gray-500'
									}`}>
									Off
								</span>

								<div
									className='form-check form-switch form-check-custom form-check-solid'
									style={{ margin: 0 }}>
									<input
										className='form-check-input'
										type='checkbox'
										id='labelToggle'
										checked={isLabelToggleOn}
										onChange={handleLabelToggle}
										style={{
											width: '3.5rem',
											height: '1.75rem',
											cursor: 'pointer',
											backgroundColor: isLabelToggleOn ? '#3b82f6' : '#cbd5e1',
											borderColor: isLabelToggleOn ? '#3b82f6' : '#cbd5e1',
											backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23ffffff'/%3e%3c/svg%3e")`,
											backgroundPosition: isLabelToggleOn
												? 'calc(100% - 0.25rem) center'
												: '0.25rem center',
											transition:
												'background-color .25s, border-color .25s, background-position .25s',
										}}
									/>
									<label
										className='form-check-label'
										htmlFor='labelToggle'
										style={{ cursor: 'pointer' }}
									/>
								</div>

								<span
									className={`fs-7 fw-semibold ${
										isLabelToggleOn ? 'text-gray-900' : 'text-gray-500'
									}`}>
									On
								</span>
							</div>
						</div>

						{isLabelToggleOn && selectedClient && !allLabelDesignsAdded && (
							<TableButton
								action='add'
								to={`/rag/inventory/gn-label-design-approve/create?clientId=${selectedClient.id}`}
								text='Add Design'
							/>
						)}
					</div>
				</div>

				<div className='card-body pt-6'>
					{!isLabelToggleOn ? (
						<div
							className='d-flex align-items-center justify-content-center rounded-3 py-8'
							style={{ background: '#f1f5f9', border: '1.5px dashed #cbd5e1' }}>
							<div className='text-center'>
								<div
									className='symbol symbol-60px symbol-circle mx-auto mb-3'
									style={{ background: '#e2e8f0' }}>
									<span className='symbol-label'>
										<i className='bi bi-slash-circle fs-2x text-gray-500'></i>
									</span>
								</div>
								<p className='text-gray-800 fw-bold fs-5 mb-1'>Label Approval Skipped</p>
							</div>
						</div>
					) : (
						<>
							{isLoadingDesignApprovals ? (
								<div className='text-center py-10'>
									<div
										className='spinner-border text-primary'
										role='status'>
										<span className='visually-hidden'>Loading...</span>
									</div>
									<p className='text-gray-600 fs-6 mt-3'>Loading label approvals...</p>
								</div>
							) : designApprovals.length === 0 ? (
								<div className='text-center py-10'>
									<i className='bi bi-palette fs-4x text-gray-400 mb-4'></i>
									<p className='text-gray-600 fs-5 mb-0'>No design approvals available</p>
								</div>
							) : (
								<div className='table-responsive'>
									<table className='table table-row-bordered align-middle gs-0 gy-4'>
										<thead>
											<tr className='fw-bold text-gray-700 fs-7 text-uppercase'>
												<th className='min-w-250px'>Product</th>
												<th className='min-w-150px'>Brand</th>
												<th className='min-w-120px'>Status</th>
												<th className='min-w-150px'>Issue Date</th>
												<th className='min-w-100px text-end'>Actions</th>
											</tr>
										</thead>
										<tbody>
											{designApprovals.map((item) => (
												<tr key={item.id}>
													<td>
														<div className='d-flex align-items-center'>
															<div className='symbol symbol-40px me-3'>
																<span className='symbol-label bg-light-warning'>
																	<i className='bi bi-tag text-warning fs-4'></i>
																</span>
															</div>
															<span className='text-gray-800 fw-bold fs-6'>{item.productName}</span>
														</div>
													</td>
													<td>
														<span className='text-gray-800 fw-bold fs-6'>{item.brandName}</span>
													</td>
													<td>
														<span
															className={`badge badge-light-${getStatusColor(
																item.status || 'Pending'
															)} fw-bold`}>
															{item.status || 'Pending'}
														</span>
													</td>
													<td>
														<span className='text-gray-800 fw-bold fs-6'>
															{new Date(item.issueDate).toLocaleDateString('en-IN', {
																year: 'numeric',
																month: 'short',
																day: 'numeric',
															})}
														</span>
													</td>
													<td className='text-end'>
														<div className='d-flex justify-content-end gap-2'>
															<TableButton
																action='view'
																to={`/rag/inventory/gn-label-design-approve/view?id=${item.id}`}
															/>
															<TableButton
																action='edit'
																to={`/rag/inventory/gn-label-design-approve/update?id=${item.id}`}
															/>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* Procurement Table Section */}
			<div className='card mb-7 inventory-view-card'>
				<div className='card-header border-0 pt-6 pb-0 inventory-view-card-header'>
					<div className='d-flex align-items-center justify-content-between w-100'>
						<div>
							<h3 className='card-title fw-bolder text-gray-800 fs-2'>Procurement</h3>
							<p className='text-gray-600 fs-7 mb-0 mt-1'>
								Manage order amounts, costs and margins
							</p>
						</div>
						{selectedClient && procurements.length === 0 && (
							<TableButton
								action='add'
								to={`/rag/inventory/gn-procurement/add?clientId=${selectedClient.id}`}
								text='Add Procurement'
							/>
						)}
					</div>
				</div>
				<div className='card-body pt-6'>
					{isLoadingProcurements ? (
						<div className='text-center py-10'>
							<div
								className='spinner-border text-primary'
								role='status'>
								<span className='visually-hidden'>Loading...</span>
							</div>
							<p className='text-gray-600 fs-6 mt-3'>Loading procurements...</p>
						</div>
					) : procurements.length === 0 ? (
						<div className='text-center py-10'>
							<i className='bi bi-cart-x fs-4x text-gray-400 mb-4'></i>
							<p className='text-gray-600 fs-5 mb-0'>No procurement records available</p>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table table-row-bordered align-middle gs-0 gy-4'>
								<thead>
									<tr className='fw-bold text-gray-700 fs-7 text-uppercase'>
										<th className='min-w-150px'>Order Amount</th>
										<th className='min-w-130px'>Total Cost</th>
										<th className='min-w-150px'>Gross Margin</th>
										<th className='min-w-100px'>In %</th>
										<th className='min-w-150px'>Date</th>
										<th className='min-w-100px text-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{procurements.map((item) => {
										const marginPercentage =
											item.orderAmount > 0
												? ((item.grossMargin / item.orderAmount) * 100).toFixed(2)
												: '0.00'
										const { date, time } = formatDateTime(item.updatedAt)
										return (
											<tr key={item._id}>
												<td>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-40px me-3'>
															<span className='symbol-label bg-light-info'>
																<i className='bi bi-cash-stack text-info fs-4'></i>
															</span>
														</div>

														<span className='text-gray-800 fw-bold fs-6'>
															₹ {item.orderAmount.toFixed(2)}
														</span>
													</div>
												</td>
												<td>
													<span className='text-gray-800 fw-bold fs-6'>
														₹ {item.totalCost.toFixed(2)}
													</span>
												</td>
												<td>
													<span className='text-gray-800 fw-bold fs-6'>
														₹ {item.grossMargin.toFixed(2)}
													</span>
												</td>
												<td>
													<span
														className={`badge badge-light-${
															parseFloat(marginPercentage) >= 25 ? 'success' : 'warning'
														} fw-bold`}>
														{marginPercentage}%
													</span>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-gray-800 fw-bold fs-6'>{date}</span>
														<span className='text-gray-600 fs-8'>{time}</span>
													</div>
												</td>

												<td className='text-end'>
													<div className='d-flex justify-content-end gap-2'>
														<TableButton
															action='view'
															to={`/rag/inventory/gn-procurement/view?id=${item._id}`}
														/>
														<TableButton
															action='edit'
															to={`/rag/inventory/gn-procurement/edit?id=${item._id}`}
														/>
													</div>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Production Section */}
			<div className='card mb-7 inventory-view-card'>
				<div className='card-header border-0 pt-6 pb-0 inventory-view-card-header'>
					<div className='d-flex align-items-center justify-content-between w-100'>
						<div>
							<h3 className='card-title fw-bolder text-gray-800 fs-2'>Production </h3>
							<p className='text-gray-600 fs-7 mb-0 mt-1'>
								Manufacturing batches and quality control
							</p>
						</div>
						{selectedClient && !allProductionsAdded && (
							<TableButton
								action='add'
								to={`/rag/inventory/production-details/add?clientId=${selectedClient.id}`}
								text='Add Production'
							/>
						)}
					</div>
				</div>
				<div className='card-body pt-6'>
					{isLoadingProductions ? (
						<div className='text-center py-10'>
							<div
								className='spinner-border text-primary'
								role='status'>
								<span className='visually-hidden'>Loading...</span>
							</div>
							<p className='text-gray-600 fs-6 mt-3'>Loading productions...</p>
						</div>
					) : productions.length === 0 ? (
						<div className='text-center py-10'>
							<i className='bi bi-boxes fs-4x text-gray-400 mb-4'></i>
							<p className='text-gray-600 fs-5 mb-0'>No production records available</p>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table table-row-bordered align-middle gs-0 gy-4'>
								<thead>
									<tr className='fw-bold text-gray-700 fs-7 text-uppercase'>
										<th className='min-w-200px'>Product Name</th>
										<th className='min-w-120px'>Batch No</th>
										<th className='min-w-150px'>Total Product Weight</th>
										<th className='min-w-150px'>Date</th>
										<th className='min-w-100px text-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{productions.map((item) => {
										const { date, time } = formatDateTime(item.updatedAt)
										return (
											<tr key={item._id}>
												<td>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-40px me-3'>
															<span className='symbol-label bg-light-success'>
																<i className='bi bi-diagram-2 text-success fs-4'></i>
															</span>
														</div>
														<span className='text-gray-800 fw-bold fs-6'>
															{item.production_itemId?.item_name || 'N/A'}
														</span>
													</div>
												</td>
												<td>
													<span className='text-gray-800 fw-bold fs-6'>{item.batch_no}</span>
												</td>
												<td>
													<span className='text-gray-800 fw-bold fs-6'>
														{item.total_product_weight}
													</span>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-gray-800 fw-bold fs-6'>{date}</span>
														<span className='text-gray-600 fs-8'>{time}</span>
													</div>
												</td>
												<td className='text-end'>
													<div className='d-flex justify-content-end gap-2'>
														<TableButton
															action='view'
															to={`/rag/inventory/production-details/view?id=${item._id}`}
														/>
														<TableButton
															action='edit'
															to={`/rag/inventory/production-details/update?id=${item._id}`}
														/>
													</div>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Lab Report Section with toggle */}
			<div className='card mb-7 inventory-view-card'>
				<div className='card-header border-0 pt-6 pb-0 inventory-view-card-header'>
					<div className='d-flex align-items-center justify-content-between w-100 flex-wrap gap-4'>
						<div className='d-flex align-items-center gap-4'>
							<div>
								<h3 className='card-title fw-bolder text-gray-800 fs-2'>Lab Report</h3>
								<p className='text-gray-600 fs-7 mb-0 mt-1'>
									Quality testing and certification reports
								</p>
							</div>

							<div className='d-flex align-items-center gap-3'>
								<span
									className={`fs-7 fw-semibold ${
										!isLabReportToggleOn ? 'text-gray-900' : 'text-gray-500'
									}`}>
									Off
								</span>

								<div
									className='form-check form-switch form-check-custom form-check-solid'
									style={{ margin: 0 }}>
									<input
										className='form-check-input'
										type='checkbox'
										id='labReportToggle'
										checked={isLabReportToggleOn}
										onChange={handleLabReportToggle}
										style={{
											width: '3.5rem',
											height: '1.75rem',
											cursor: 'pointer',
											backgroundColor: isLabReportToggleOn ? '#3b82f6' : '#cbd5e1',
											borderColor: isLabReportToggleOn ? '#3b82f6' : '#cbd5e1',
											backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23ffffff'/%3e%3c/svg%3e")`,
											backgroundPosition: isLabReportToggleOn
												? 'calc(100% - 0.25rem) center'
												: '0.25rem center',
											transition:
												'background-color .25s, border-color .25s, background-position .25s',
										}}
									/>
									<label
										className='form-check-label'
										htmlFor='labReportToggle'
										style={{ cursor: 'pointer' }}
									/>
								</div>

								<span
									className={`fs-7 fw-semibold ${
										isLabReportToggleOn ? 'text-gray-900' : 'text-gray-500'
									}`}>
									On
								</span>
							</div>
						</div>
						{isLabReportToggleOn && (
							<TableButton
								action='add'
								onClick={handleLabReportAddClick}
								text='Add Lab Report'
							/>
						)}
					</div>
				</div>
				<div className='card-body pt-6'>
					{!isLabReportToggleOn ? (
						<div
							className='d-flex align-items-center justify-content-center rounded-3 py-8'
							style={{ background: '#f1f5f9', border: '1.5px dashed #cbd5e1' }}>
							<div className='text-center'>
								<div
									className='symbol symbol-60px symbol-circle mx-auto mb-3'
									style={{ background: '#e2e8f0' }}>
									<span className='symbol-label'>
										<i className='bi bi-slash-circle fs-2x text-gray-500'></i>
									</span>
								</div>
								<p className='text-gray-800 fw-bold fs-5 mb-1'>Lab Report Skipped</p>
							</div>
						</div>
					) : labReports.length === 0 ? (
						<div className='text-center py-10'>
							<i className='bi bi-file-earmark-medical fs-4x text-gray-400 mb-4'></i>
							<p className='text-gray-600 fs-5 mb-0'>No lab reports available</p>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table table-row-bordered align-middle gs-0 gy-4'>
								<thead>
									<tr className='fw-bold text-gray-700 fs-7 text-uppercase'>
										<th className='min-w-200px'>Product Name</th>
										<th className='min-w-100px'>Image</th>
										<th className='min-w-150px'>Date</th>
										<th className='min-w-100px text-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{labReports.map((item) => (
										<tr key={item.id}>
											<td>
												<div className='d-flex align-items-center'>
													<div className='symbol symbol-40px me-3'>
														<span className='symbol-label bg-light-primary'>
															<i className='bi bi-file-earmark-text text-primary fs-4'></i>
														</span>
													</div>
													<span className='text-gray-800 fw-bold fs-6'>{item.productName}</span>
												</div>
											</td>
											<td>
												<div className='d-flex align-items-center'>
													<div
														className='symbol symbol-35px'
														style={{
															width: '100px',
															height: '100px',
															borderRadius: '4px',
															overflow: 'hidden',
															border: '1px solid #e2e8f0',
														}}>
														<img
															src={item.image}
															alt={item.productName}
															style={{ width: '100%', height: '100%', objectFit: 'cover' }}
															className='cursor-pointer'
															onClick={() => window.open(item.image, '_blank')}
														/>
													</div>
												</div>
											</td>
											<td>
												<div className='d-flex flex-column'>
													<span className='text-gray-800 fw-bold fs-6'>
														{formatDateTime(item.updatedAt).date}
													</span>
													<span className='text-gray-700 fs-8 fw-bold'>
														{formatDateTime(item.updatedAt).time}
													</span>
												</div>
											</td>
											<td className='text-end'>
												<div className='d-flex justify-content-end gap-2'>
													<TableButton
														action='view'
														onClick={() => window.open(item.image, '_blank')}
													/>
													<TableButton
														action='edit'
														onClick={() => handleLabReportEditClick(item)}
													/>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Dispatch Section */}
			<div className='card mb-7 inventory-view-card'>
				<div className='card-header border-0 pt-6 pb-0 inventory-view-card-header'>
					<div className='d-flex align-items-center justify-content-between w-100'>
						<div>
							<h3 className='card-title fw-bolder text-gray-800 fs-2'>Dispatch Orders</h3>
							<p className='text-gray-600 fs-7 mb-0 mt-1'>Shipping and delivery management</p>
						</div>
						{dispatches.length === 0 && (
							<TableButton
								action='add'
								to={`/rag/inventory/production-dispatch-details/add?clientId=${selectedClient?.id}`}
								text='Add Dispatch'
							/>
						)}
					</div>
				</div>
				<div className='card-body pt-6'>
					{isLoadingDispatches ? (
						<div className='text-center py-10'>
							<div
								className='spinner-border text-primary'
								role='status'>
								<span className='visually-hidden'>Loading...</span>
							</div>
							<p className='text-gray-600 fs-6 mt-3'>Loading dispatches...</p>
						</div>
					) : dispatches.length === 0 ? (
						<div className='text-center py-10'>
							<i className='bi bi-truck fs-4x text-gray-400 mb-4'></i>
							<p className='text-gray-600 fs-5 mb-0'>No dispatch orders available</p>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table table-row-bordered align-middle gs-0 gy-4'>
								<thead>
									<tr className='fw-bold text-gray-700 fs-7 text-uppercase'>
										<th className='min-w-150px'>Supplier Name</th>
										<th className='min-w-120px'>Order Weight</th>
										<th className='min-w-120px'>Order Value</th>
										<th className='min-w-150px'>Date</th>
										<th className='min-w-100px text-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{dispatches.map((item) => {
										const { date, time } = formatDateTime(item.updatedAt)
										return (
											<tr key={item.id}>
												<td>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-40px me-3'>
															<span className='symbol-label bg-light-warning'>
																<i className='bi bi-truck text-warning fs-4'></i>
															</span>
														</div>
														<span className='text-gray-800 fw-bold fs-6'>{item.supplierName}</span>
													</div>
												</td>
												<td>
													<span className='text-gray-800 fw-bold fs-6'>{item.orderWeight}</span>
												</td>
												<td>
													<span className='text-gray-800 fw-bold fs-6'>₹ {item.orderValue}</span>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-gray-800 fw-bold fs-6'>{date}</span>
														<span className='text-gray-600 fs-8'>{time}</span>
													</div>
												</td>
												<td className='text-end'>
													<div className='d-flex justify-content-end gap-2'>
														<TableButton
															action='view'
															onClick={() => handleDispatchViewClick(item)}
														/>
														<TableButton
															action='edit'
															to={`/rag/inventory/production-dispatch-details/edit?id=${item.id}`}
															onClick={() => handleDispatchEditClick(item)}
														/>
													</div>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Dispatch Modal */}
			<Modal
				show={showDispatchModal}
				onHide={() => setShowDispatchModal(false)}
				size='lg'
				centered>
				<Modal.Header
					closeButton
					className='border-0 pb-0'>
					<Modal.Title className='fw-bolder fs-2'>Order Dispatch Details</Modal.Title>
				</Modal.Header>
				<Modal.Body className='p-6'>
					{selectedDispatch && (
						<>
							<div className='row g-5 mb-5'>
								<div className='col-md-6'>
									<div className='d-flex align-items-start gap-3'>
										<div
											className='symbol symbol-45px symbol-circle'
											style={{ backgroundColor: '#E3F2FD' }}>
											<i className='bi bi-person-fill text-primary fs-3'></i>
										</div>
										<div className='flex-grow-1'>
											<div className='text-gray-500 fs-7 mb-1'>Client Name</div>
											<div className='text-gray-800 fw-bold fs-5'>
												{selectedDispatch.clientName}
											</div>
										</div>
									</div>
								</div>

								<div className='col-md-6'>
									<div className='d-flex align-items-start gap-3'>
										<div
											className='symbol symbol-45px symbol-circle'
											style={{ backgroundColor: '#E8F5E9' }}>
											<i className='bi bi-truck text-success fs-3'></i>
										</div>
										<div className='flex-grow-1'>
											<div className='text-gray-500 fs-7 mb-1'>Supplier Name</div>
											<div className='text-gray-800 fw-bold fs-5'>
												{selectedDispatch.supplierName}
											</div>
										</div>
									</div>
								</div>

								<div className='col-md-6'>
									<div className='d-flex align-items-start gap-3'>
										<div
											className='symbol symbol-45px symbol-circle'
											style={{ backgroundColor: '#F3E5F5' }}>
											<i className='bi bi-box-seam text-purple fs-3'></i>
										</div>
										<div className='flex-grow-1'>
											<div className='text-gray-500 fs-7 mb-1'>Order Weight</div>
											<div className='text-gray-800 fw-bold fs-5'>
												{selectedDispatch.orderWeight}
											</div>
										</div>
									</div>
								</div>

								<div className='col-md-6'>
									<div className='d-flex align-items-start gap-3'>
										<div
											className='symbol symbol-45px symbol-circle'
											style={{ backgroundColor: '#FFF9C4' }}>
											<i className='bi bi-currency-rupee text-warning fs-3'></i>
										</div>
										<div className='flex-grow-1'>
											<div className='text-gray-500 fs-7 mb-1'>Order Value</div>
											<div className='text-gray-800 fw-bold fs-5'>
												₹ {selectedDispatch.orderValue}
											</div>
										</div>
									</div>
								</div>

								<div className='col-md-6'>
									<div className='d-flex align-items-start gap-3'>
										<div
											className='symbol symbol-45px symbol-circle'
											style={{ backgroundColor: '#E0F2F1' }}>
											<i className='bi bi-credit-card text-teal fs-3'></i>
										</div>
										<div className='flex-grow-1'>
											<div className='text-gray-500 fs-7 mb-1'>Shipping Charges</div>
											<div className='text-gray-800 fw-bold fs-5'>
												₹ {selectedDispatch.shippingCharges}
											</div>
										</div>
									</div>
								</div>

								<div className='col-md-6'>
									<div className='d-flex align-items-start gap-3'>
										<div
											className='symbol symbol-45px symbol-circle'
											style={{ backgroundColor: '#FFEBEE' }}>
											<i className='bi bi-calendar-event text-danger fs-3'></i>
										</div>
										<div className='flex-grow-1'>
											<div className='text-gray-500 fs-7 mb-1'>Date & Time</div>
											<div className='text-gray-800 fw-bold fs-6'>
												{formatDateTime(selectedDispatch.updatedAt).date}
											</div>
											<div className='text-gray-600 fs-7'>
												{formatDateTime(selectedDispatch.updatedAt).time}
											</div>
										</div>
									</div>
								</div>

								<div className='col-md-6'>
									<div className='d-flex align-items-start gap-3'>
										<div
											className='symbol symbol-45px symbol-circle'
											style={{ backgroundColor: '#F5F5F5' }}>
											<i className='bi bi-upc-scan text-dark fs-3'></i>
										</div>
										<div className='flex-grow-1'>
											<div className='text-gray-500 fs-7 mb-1'>Tracking ID</div>
											<div className='text-gray-800 fw-bold fs-5 font-monospace'>
												{selectedDispatch.trackingId}
											</div>
										</div>
									</div>
								</div>
							</div>

							{selectedDispatch.image && (
								<div className='mt-8 text-center'>
									<h5 className='fw-bold text-gray-800 mb-6 fs-4'>Dispatch Bill File</h5>
									{/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(selectedDispatch.image) ||
									selectedDispatch.image.startsWith('data:image') ? (
										<img
											src={selectedDispatch.image}
											alt='Dispatch Bill'
											className='img-fluid rounded shadow-sm'
											style={{
												width: '100%',
												height: 'auto',
												maxHeight: '800px',
												objectFit: 'contain',
											}}
										/>
									) : (
										<div className='d-flex flex-column align-items-center p-10 border rounded bg-light'>
											<i className='bi bi-file-earmark-text fs-4x text-primary mb-4'></i>
											<a
												href={selectedDispatch.image}
												target='_blank'
												rel='noopener noreferrer'
												className='btn btn-primary btn-sm'>
												View / Download File
											</a>
										</div>
									)}
								</div>
							)}
						</>
					)}
				</Modal.Body>
			</Modal>

			{/* Lab Report Modal */}
			<Modal
				show={showLabReportModal}
				onHide={() => setShowLabReportModal(false)}
				centered>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>
							{selectedLabReportId ? 'Edit Lab Report' : 'Add Lab Report'}
						</h2>
						<button
							className='btn btn-sm btn-icon btn-active-color-primary'
							onClick={() => setShowLabReportModal(false)}>
							<i className='bi bi-x-lg fs-3'></i>
						</button>
					</div>
					<div className='modal-body scroll-y'>
						<div className='row'>
							<div className='col-12 fv-row mb-7'>
								<label className='fw-bold fs-6 mb-2'>Product Name</label>
								{selectedLabReportId ? (
									<input
										type='text'
										className='form-control form-control-solid'
										value={labReportFormData.productName}
										disabled
									/>
								) : (
									<select
										className='form-select form-select-solid'
										name='item_id'
										value={labReportFormData.item_id}
										onChange={handleLabReportInputChange}>
										<option value=''>Select Product</option>
										{(selectedClient?.items || [])
											.filter((product: any) => {
												const hasReport = labReports.some(
													(report) => report.item_id === product._id
												)
												return !hasReport
											})
											.map((product: any) => (
												<option
													key={product._id}
													value={product._id}>
													{product.item_name}
												</option>
											))}
									</select>
								)}
							</div>
							<div className='col-12 fv-row mb-7'>
								<label className='fw-bold fs-6 mb-2'>Upload Image</label>
								<input
									type='file'
									className='form-control form-control-solid'
									name='image'
									accept='image/*'
									onChange={handleLabReportInputChange}
								/>
								{labReportFormData.imagePreview && (
									<div className='mt-3'>
										<img
											src={labReportFormData.imagePreview}
											alt='Preview'
											className='img-fluid rounded'
											style={{ maxHeight: '200px', objectFit: 'contain' }}
										/>
									</div>
								)}
							</div>
						</div>
						<div className='d-flex justify-content-end'>
							<button
								className='btn btn-primary'
								onClick={handleLabReportSubmit}>
								{selectedLabReportId ? 'Update Lab Report' : 'Create Lab Report'}
							</button>
						</div>
					</div>
				</div>
			</Modal>

			<style>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .cursor-pointer:hover {
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .professional-design-modal .modal-content {
          border-radius: 16px;
          border: none;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        .professional-design-modal .modal-body {
          max-height: 80vh;
          overflow-y: auto;
        }
        .professional-design-modal .modal-body::-webkit-scrollbar {
          width: 8px;
        }
        .professional-design-modal .modal-body::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .professional-design-modal .modal-body::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 4px;
        }
        .professional-design-modal .modal-body::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
      `}</style>
		</>
	)
}

export default GnViewList
