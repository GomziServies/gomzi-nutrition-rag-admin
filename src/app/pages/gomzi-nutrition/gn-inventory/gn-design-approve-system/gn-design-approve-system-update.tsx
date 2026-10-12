import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import {
	FileUploadToFGGroup,
	GetGnClient,
	GetGnLabelDesignApprove,
	UpdateGnLabelDesignApprove,
} from '../../../../Functions/FGGroup'
import gomzilogo from './gomzi-life-science-logo.png'

const placeholderApprovalImage =
	'https://dummyimage.com/600x400/ced4da/343a40.png&text=Client+Approval+Preview'
const borderStyle = '1px solid #000'

interface FormData {
	clientName: string
	brandName: string
	issueDate: string
	remarks: string
	approvalImage: string | null
	labelPreview: string | null
	checkedByStatus: string[]
	verifiedByStatus: string[]
	finalApprovalBy: string[]
	clientApprovalStatus: string[]
}

const GnDesignApproveSystemUpdate: React.FC = () => {
	const formRef = useRef<HTMLDivElement>(null)
	const [isDownloading, setIsDownloading] = useState(false)
	const [isAdding, setIsAdding] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const designId = searchParams.get('id') || ''
	const [commonId, setCommonId] = useState('')
	const [clientId, setClientId] = useState('')

	const [clientItems, setClientItems] = useState<Array<{ _id: string; item_name: string }>>([])
	const [selectedItemId, setSelectedItemId] = useState('')
	const [approvalImageFile, setApprovalImageFile] = useState<File | null>(null)
	const [labelPreviewFile, setLabelPreviewFile] = useState<File | null>(null)

	const [formData, setFormData] = useState<FormData>({
		clientName: '',
		brandName: '',
		issueDate: '',
		remarks: '',
		approvalImage: null,
		labelPreview: null,
		checkedByStatus: Array(8).fill('yes'),
		verifiedByStatus: Array(8).fill('yes'),
		finalApprovalBy: Array(8).fill(''),
		clientApprovalStatus: Array(8).fill('yes'),
	})

	useEffect(() => {
		if (!designId) {
			toast.error('Design ID missing')
			navigate('/rag/inventory')
			return
		}
		fetchDesignData()
	}, [designId])

	const fetchDesignData = async () => {
		setIsLoading(true)
		try {
			const res: any = await GetGnLabelDesignApprove({ id: designId })
			const design = Array.isArray(res.data) ? res.data[0] : res.data
			if (design) {
				// Set IDs from API response
				if (design.common_id) setCommonId(design.common_id)
				if (design.clientId) setClientId(String(design.clientId))

				setSelectedItemId(design.item_id || '')
				setFormData({
					clientName: design.clientName || '',
					brandName: design.brandName || '',
					issueDate: design.issueDate ? new Date(design.issueDate).toISOString().split('T')[0] : '',
					remarks: design.remarks || '',
					approvalImage: design.final_approval_image || null,
					labelPreview: design.label_preview_image || null,
					checkedByStatus: (design.checklist || []).map((c: any) => (c.checkedBy ? 'yes' : 'no')),
					verifiedByStatus: (design.checklist || []).map((c: any) => (c.verifiedBy ? 'yes' : 'no')),
					finalApprovalBy: Array(8)
						.fill('')
						.map((_, i) => (i === 6 ? design.final_approval_by || '' : '')),
					clientApprovalStatus: Array(8).fill(design.final_approval_by_client ? 'yes' : 'no'),
				})

				// Fetch client items after we have clientId
				if (design.clientId) {
					fetchClientItems(design.clientId)
				}
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to load design data')
		} finally {
			setIsLoading(false)
		}
	}

	const fetchClientItems = async (fetchClientId: string) => {
		try {
			const res: any = await GetGnClient({ id: fetchClientId })
			const client = Array.isArray(res.data) ? res.data[0] : res.data
			if (client) {
				setClientItems(
					(client.items || []).map((i: any) => ({ _id: String(i._id), item_name: i.item_name }))
				)
			}
		} catch (error) {
			console.error('Failed to load client items')
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value })
	}

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			setApprovalImageFile(file)
			setFormData((prev) => ({ ...prev, approvalImage: URL.createObjectURL(file) }))
		}
	}

	const handleLabelPreviewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			setLabelPreviewFile(file)
			setFormData((prev) => ({ ...prev, labelPreview: URL.createObjectURL(file) }))
		}
	}

	const handleStatusChange = (field: string, index: number, value: string) => {
		const newArray = [...(formData as any)[field]]
		newArray[index] = value
		setFormData({ ...formData, [field]: newArray })
	}

	const handleTextChange = (field: string, index: number, value: string) => {
		const newArray = [...(formData as any)[field]]
		newArray[index] = value
		setFormData({ ...formData, [field]: newArray })
	}

	// Check if all items are marked as "yes"
	const areAllItemsApproved = () => {
		return (
			formData.checkedByStatus.every((status) => status === 'yes') &&
			formData.verifiedByStatus.every((status) => status === 'yes') &&
			formData.clientApprovalStatus.every((status) => status === 'yes')
		)
	}

	// Check if all required fields are filled
	const isFormComplete = () => {
		return (
			selectedItemId !== '' &&
			formData.clientName.trim() !== '' &&
			formData.brandName.trim() !== '' &&
			formData.issueDate.trim() !== '' &&
			formData.approvalImage !== null &&
			areAllItemsApproved()
		)
	}

	const handleAddDesign = async (): Promise<boolean> => {
		if (!designId) {
			toast.error('Design ID missing')
			return false
		}
		if (!formData.brandName || !formData.issueDate) {
			toast.error('Please fill in Brand Name and Issue Date')
			return false
		}
		if (!formData.finalApprovalBy[6]) {
			toast.error('Please select Final Checked by person')
			return false
		}

		setIsAdding(true)
		try {
			let finalApprovalImageUrl = formData.approvalImage || ''
			let labelPreviewImageUrl = formData.labelPreview || ''

			if (approvalImageFile) {
				const res: any = await FileUploadToFGGroup([approvalImageFile], {
					directory: 'label-design',
				})
				finalApprovalImageUrl = res.data?.fileURLs[0] || ''
			}
			if (labelPreviewFile) {
				const res: any = await FileUploadToFGGroup([labelPreviewFile], {
					directory: 'label-design',
				})
				labelPreviewImageUrl = res.data?.fileURLs[0] || ''
			}

			const checklist = details.map((detail, i) => ({
				details: detail,
				checkedBy: formData.checkedByStatus[i] === 'yes',
				verifiedBy: formData.verifiedByStatus[i] === 'yes',
			}))

			const allApproved = formData.clientApprovalStatus.every((s) => s === 'yes')

			await UpdateGnLabelDesignApprove({
				id: designId,
				brandName: formData.brandName,
				issueDate: formData.issueDate,
				final_approval_by: formData.finalApprovalBy[6],
				final_approval_by_client: allApproved,
				final_approval_image: finalApprovalImageUrl,
				label_preview_image: labelPreviewImageUrl,
				remarks: formData.remarks,
				checklist,
			})

			toast.success('Label Design Approval updated successfully')
			return true
		} catch (error: any) {
			toast.error(error?.message || 'Failed to update design approval')
			return false
		} finally {
			setIsAdding(false)
		}
	}

	const handleDownloadPDF = async () => {
		if (!formRef.current) return

		setIsDownloading(true)
		try {
			const script = document.createElement('script')
			script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'

			await new Promise((resolve, reject) => {
				script.onload = resolve
				script.onerror = reject
				if (!document.querySelector('script[src*="html2canvas"]')) {
					document.head.appendChild(script)
				} else {
					resolve(true)
				}
			})

			const jspdfScript = document.createElement('script')
			jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'

			await new Promise((resolve, reject) => {
				jspdfScript.onload = resolve
				jspdfScript.onerror = reject
				if (!document.querySelector('script[src*="jspdf"]')) {
					document.head.appendChild(jspdfScript)
				} else {
					resolve(true)
				}
			})

			// @ts-ignore
			const { jsPDF } = window.jspdf
			const pdf = new jsPDF('l', 'mm', 'a4')

			// Hide no-print elements temporarily
			const noPrintElements = document.querySelectorAll('.no-print')
			noPrintElements.forEach((el) => {
				;(el as HTMLElement).style.display = 'none'
			})

			// Capture main form
			// @ts-ignore
			const canvas = await window.html2canvas(formRef.current, {
				scale: 2,
				useCORS: true,
				allowTaint: true,
				logging: false,
				backgroundColor: '#ffffff',
				windowWidth: formRef.current.scrollWidth,
				windowHeight: formRef.current.scrollHeight,
				imageTimeout: 10000,
			})

			const imgData = canvas.toDataURL('image/png')
			const imgWidth = 297
			const pageHeight = 210
			const imgHeight = (canvas.height * imgWidth) / canvas.width

			let heightLeft = imgHeight
			let position = 0

			pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
			heightLeft -= pageHeight

			while (heightLeft >= 0) {
				position = heightLeft - imgHeight
				pdf.addPage()
				pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
				heightLeft -= pageHeight
			}

			// Add label preview on new page if exists
			if (formData.labelPreview && isFormComplete()) {
				try {
					pdf.addPage()

					// Add heading
					pdf.setFontSize(20)
					pdf.setFont('helvetica', 'bold')
					pdf.text('Label Preview', 148.5, 20, { align: 'center' })

					// Create image and wait for it to load
					const img = new Image()
					img.crossOrigin = 'anonymous'

					// Wait for image to load
					await new Promise((resolve, reject) => {
						img.onload = () => resolve(true)
						img.onerror = () => reject(new Error('Image load failed'))
						img.src = formData.labelPreview?.startsWith('blob:')
							? formData.labelPreview
							: `https://files.fggroup.in/${formData.labelPreview}`
					})

					// Calculate dimensions to fit the image nicely on the page
					const maxWidth = 277
					const maxHeight = 180
					let labelWidth = img.width
					let labelHeight = img.height

					// Scale down if needed
					if (labelWidth > maxWidth || labelHeight > maxHeight) {
						const widthRatio = maxWidth / labelWidth
						const heightRatio = maxHeight / labelHeight
						const ratio = Math.min(widthRatio, heightRatio)
						labelWidth = labelWidth * ratio
						labelHeight = labelHeight * ratio
					}

					// Center the image
					const xPos = (297 - labelWidth) / 2
					const yPos = 30

					pdf.addImage(img, 'JPEG', xPos, yPos, labelWidth, labelHeight)
				} catch (imgError) {
					console.error('Error adding label preview to PDF:', imgError)
					// Continue without label preview if there's an error
				}
			}

			const fileName = `GN_Design_Approval_${formData.clientName || 'Form'}_${
				formData.issueDate || new Date().toISOString().split('T')[0]
			}.pdf`
			pdf.save(fileName)

			// Restore no-print elements
			noPrintElements.forEach((el) => {
				;(el as HTMLElement).style.display = ''
			})
		} catch (error) {
			console.error('Download failed:', error)
			alert('Download failed. Please try again.')

			// Restore no-print elements even on error
			const noPrintElementsRestore = document.querySelectorAll('.no-print')
			noPrintElementsRestore.forEach((el) => {
				;(el as HTMLElement).style.display = ''
			})
		} finally {
			setIsDownloading(false)
		}
	}

	const handleSaveAndDownload = async () => {
		const success = await handleAddDesign()
		if (success) {
			await handleDownloadPDF()
			navigate(`/rag/inventory/view/list?clientId=${clientId}&commonId=${commonId}`)
		}
	}

	const details = [
		'Logo',
		'Label Design',
		'All Spellings check',
		'Ingredient list And Nutritional table',
		'Date (Mfg, Exp., USP)',
		'Batch Number',
		'Contact and Address details',
		'Lable Size Final',
	]

	if (isLoading) {
		return (
			<div
				className='d-flex justify-content-center align-items-center'
				style={{ minHeight: '400px' }}>
				<div className='text-center'>
					<div
						className='spinner-border text-primary'
						role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
					<p className='mt-3'>Loading design data...</p>
				</div>
			</div>
		)
	}

	return (
		<div
			className='container-fluid p-3'
			style={{ minWidth: '1200px' }}>
			<PageTitle breadcrumbs={[]}>Gn Design Approve System Update</PageTitle>

			<div
				ref={formRef}
				className='card border-dark shadow'
				style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
				<div className='card-body p-0'>
					{/* Header */}
					<div
						className='border-bottom border-dark'
						style={{ background: '#f8f9fa' }}>
						<div className='row g-0'>
							<div
								className='col-2 border-end border-dark py-3 px-3 d-flex align-items-center justify-content-center'
								style={{ borderRight: borderStyle }}>
								<div className='text-center'>
									<img
										src={gomzilogo}
										alt='GOMZI LIFE SCIENCE LLP'
										style={{ width: '100%', maxWidth: '160px', height: 'auto' }}
									/>
								</div>
							</div>

							<div
								className='col-5 border-end border-dark py-3 px-3 d-flex align-items-center justify-content-center'
								style={{ borderRight: borderStyle }}>
								<h3
									className='fw-bold mb-0'
									style={{ fontSize: '1.2rem' }}>
									Department Name - Graphic Design
								</h3>
							</div>

							<div className='col-5 p-0'>
								<div className='row g-0 h-100'>
									<div
										className='col-4 border-end border-dark p-2 px-3'
										style={{ borderRight: borderStyle }}>
										<div className='fw-semibold mb-1'>Client Name</div>
										<input
											type='text'
											name='clientName'
											className='form-control form-control-sm border-0 p-0 bg-transparent'
											style={{ fontSize: '0.8rem' }}
											value={formData.clientName}
											onChange={handleInputChange}
										/>
									</div>
									<div
										className='col-4 border-end border-dark p-2 px-3'
										style={{ borderRight: borderStyle }}>
										<div className='fw-semibold mb-1'>Brand Name</div>
										<input
											type='text'
											name='brandName'
											className='form-control form-control-sm border-0 p-0 bg-transparent'
											style={{ fontSize: '0.8rem' }}
											value={formData.brandName}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-4 p-2 px-3'>
										<div className='fw-semibold mb-1'>Issue Date:</div>
										<input
											type='date'
											name='issueDate'
											className='form-control form-control-sm border-0 p-0 bg-transparent'
											style={{ fontSize: '0.8rem' }}
											value={formData.issueDate}
											onChange={handleInputChange}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Main Content - Horizontal Layout */}
					<div className='row g-0'>
						{/* Left Side - Table */}
						<div className='col-7 border-end border-dark'>
							<table
								className='table mb-0'
								style={{
									borderSpacing: 0,
									width: '100%',
									borderCollapse: 'collapse',
								}}>
								<thead className='table-light'>
									<tr>
										<th
											className='text-center py-2'
											style={{
												width: '5%',
												borderBottom: borderStyle,
												borderRight: borderStyle,
												borderLeft: borderStyle,
											}}>
											No.
										</th>
										<th
											className='py-2'
											style={{ width: '25%', borderBottom: borderStyle, borderRight: borderStyle }}>
											Details
										</th>
										<th
											className='text-center py-2'
											style={{ width: '16%', borderBottom: borderStyle, borderRight: borderStyle }}>
											Checked By
										</th>
										<th
											className='text-center py-2'
											style={{
												width: '16%',
												borderBottom: borderStyle,
												borderRight: borderStyle,
											}}>
											Verified By
										</th>
										<th
											className='text-center py-2'
											style={{ width: '38%', borderBottom: borderStyle, borderRight: borderStyle }}>
											Final Approval by Client (yes/no)
										</th>
									</tr>
								</thead>
								<tbody>
									{details.map((detail, i) => (
										<tr key={i}>
											<td
												className='text-center fw-semibold py-2'
												style={{
													borderLeft: borderStyle,
													borderRight: borderStyle,
													borderBottom: borderStyle,
													verticalAlign: 'middle',
												}}>
												{i + 1}
											</td>
											<td
												className='py-2 px-2'
												style={{
													borderBottom: borderStyle,
													borderRight: borderStyle,
													verticalAlign: 'middle',
												}}>
												{detail}
											</td>
											<td
												className='py-2 px-2'
												style={{
													borderRight: borderStyle,
													borderBottom: borderStyle,
													verticalAlign: 'middle',
												}}>
												<select
													className='form-select form-select-sm'
													style={{ fontSize: '0.75rem' }}
													value={formData.checkedByStatus[i]}
													onChange={(e) =>
														handleStatusChange('checkedByStatus', i, e.target.value)
													}>
													<option value='yes'>Yes</option>
													<option value='no'>No</option>
												</select>
											</td>
											<td
												className='py-2 px-2'
												style={{
													borderBottom: borderStyle,
													borderRight: borderStyle,
													verticalAlign: 'middle',
												}}>
												<select
													className='form-select form-select-sm'
													style={{ fontSize: '0.75rem' }}
													value={formData.verifiedByStatus[i]}
													onChange={(e) =>
														handleStatusChange('verifiedByStatus', i, e.target.value)
													}>
													<option value='yes'>Yes</option>
													<option value='no'>No</option>
												</select>
											</td>
											{i === 1 ? (
												<td
													className='py-2 px-2 text-center'
													style={{
														borderRight: borderStyle,
														borderBottom: borderStyle,
														verticalAlign: 'middle',
													}}
													rowSpan={2}>
													<div style={{ fontSize: '0.75rem', fontWeight: '500' }}>
														*Share the screenshot of client's approval*
													</div>
												</td>
											) : i === 3 ? (
												<td
													className='py-2 px-2 text-center'
													style={{
														borderRight: borderStyle,
														borderBottom: borderStyle,
														verticalAlign: 'middle',
													}}>
													<div style={{ fontSize: '0.75rem', fontWeight: '500' }}>
														Products Details
													</div>
												</td>
											) : i === 4 ? (
												<td
													className='py-2 px-2 text-center'
													style={{
														borderRight: borderStyle,
														borderBottom: borderStyle,
														verticalAlign: 'middle',
													}}
													rowSpan={2}>
													<select
														className='form-select form-select-sm'
														style={{ fontSize: '0.75rem' }}
														value={selectedItemId}
														onChange={(e) => setSelectedItemId(e.target.value)}
														disabled>
														<option value=''>-- Select Product --</option>
														{clientItems.map((item) => (
															<option
																key={item._id}
																value={item._id}>
																{item.item_name}
															</option>
														))}
													</select>
												</td>
											) : i === 6 ? (
												<td
													className='py-2 px-2 text-center'
													style={{
														borderRight: borderStyle,
														borderBottom: borderStyle,
														verticalAlign: 'middle',
													}}
													rowSpan={2}>
													<div
														style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '8px' }}>
														Final Checked by
													</div>
													<select
														className='form-select form-select-sm'
														style={{ fontSize: '0.75rem' }}
														value={formData.finalApprovalBy[6]}
														onChange={(e) =>
															handleTextChange('finalApprovalBy', 6, e.target.value)
														}>
														<option value=''>Select Name</option>
														<option value='Virat'>Virat</option>
														<option value='Jayveer'>Jayveer</option>
													</select>
												</td>
											) : i !== 2 && i !== 5 && i !== 7 ? (
												<td
													className='py-2 px-2'
													style={{
														borderRight: borderStyle,
														borderBottom: borderStyle,
														verticalAlign: 'middle',
													}}>
													<select
														className='form-select form-select-sm'
														style={{ fontSize: '0.75rem' }}
														value={formData.clientApprovalStatus[i]}
														onChange={(e) =>
															handleStatusChange('clientApprovalStatus', i, e.target.value)
														}>
														<option value='yes'>Yes</option>
														<option value='no'>No</option>
													</select>
												</td>
											) : null}
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Right Side - Image Upload & Remarks */}
						<div className='col-5'>
							<div className='row g-0 h-100'>
								{/* Image Upload Section */}
								<div
									className='col-12 border-bottom border-dark p-3'
									style={{ minHeight: '300px', borderBottom: borderStyle }}>
									<h6
										className='fw-bold text-center mb-3'
										style={{ fontSize: '0.9rem' }}>
										Final Approval by Client
									</h6>
									<div
										className='d-flex flex-column align-items-center justify-content-center'
										style={{ minHeight: '240px' }}>
										{!formData.approvalImage ? (
											<>
												<input
													type='file'
													className='d-none'
													accept='image/*'
													id='imageUpload'
													onChange={handleImageUpload}
												/>
												<label
													htmlFor='imageUpload'
													className='btn btn-primary'
													style={{ fontSize: '0.9rem', padding: '10px 30px' }}>
													Upload Image
												</label>
											</>
										) : (
											<>
												<div
													className='w-100 mb-2'
													style={{ maxHeight: '200px', overflow: 'hidden' }}>
													<img
														src={
															formData.approvalImage?.startsWith('blob:')
																? formData.approvalImage
																: `https://files.fggroup.in/${formData.approvalImage}`
														}
														alt='Preview'
														className='w-100'
														style={{ display: 'block', objectFit: 'contain', maxHeight: '200px' }}
													/>
												</div>
												<button
													className='btn btn-sm mt-2 no-print'
													style={{
														backgroundColor: '#dc3545',
														color: '#fff',
														border: 'none',
														transition: 'background-color 0.3s ease',
													}}
													onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff5c6f')}
													onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
													onClick={() => setFormData({ ...formData, approvalImage: null })}
													disabled={isDownloading || isAdding}>
													Remove Image
												</button>
											</>
										)}
									</div>
								</div>

								{/* Remarks Section */}
								<div className='col-12 p-3'>
									<h6
										className='fw-bold mb-2'
										style={{ fontSize: '0.9rem' }}>
										REMARKS
									</h6>
									<textarea
										name='remarks'
										className='form-control border'
										value={formData.remarks}
										onChange={handleInputChange}
										style={{ resize: 'none', height: '180px', fontSize: '0.85rem' }}
										placeholder='Enter remarks here...'
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Footer - Authorized Sign */}
					<div
						className='border-top border-dark p-3'
						style={{ borderTop: borderStyle }}>
						<div className='text-end'>Authorised Sign.</div>
					</div>
				</div>
			</div>

			{/* Label Preview Section - Always visible, but upload enabled only when form is complete */}
			<div
				className='card border-dark shadow mt-4'
				style={{ width: '100%', maxWidth: '1400px', margin: '20px auto' }}>
				<div className='card-body p-4'>
					<h5
						className='fw-bold text-center mb-4'
						style={{ color: isFormComplete() ? '#198754' : '#6c757d' }}>
						📋 Label Preview Upload
					</h5>
					<div className='row'>
						<div className='col-12'>
							<div
								className='border border-2 rounded p-4 text-center'
								style={{
									borderColor: isFormComplete() ? '#198754' : '#dee2e6',
									backgroundColor: '#f8f9fa',
									opacity: isFormComplete() ? 1 : 0.6,
									transition: 'all 0.3s ease',
								}}>
								{!formData.labelPreview ? (
									<>
										<div className='mb-3'>
											<i
												className='bi bi-file-earmark-image'
												style={{
													fontSize: '3rem',
													color: isFormComplete() ? '#198754' : '#6c757d',
												}}></i>
										</div>
										{isFormComplete() ? (
											<p
												className='mb-3'
												style={{ fontSize: '1rem', color: '#198754', fontWeight: '500' }}>
												✅ All form fields are complete! You can now upload the label preview.
											</p>
										) : (
											<p
												className='mb-3'
												style={{ fontSize: '1rem', color: '#dc3545', fontWeight: '500' }}>
												⚠️ Please complete all required fields to upload label preview:
												<br />
												<small style={{ fontSize: '0.85rem', color: '#6c757d' }}>
													{!formData.clientName && '• Client Name, '}
													{!formData.brandName && '• Brand Name, '}
													{!formData.issueDate && '• Issue Date, '}
													{!formData.approvalImage && '• Approval Image, '}
													{!areAllItemsApproved() && '• All Items Approved'}
												</small>
											</p>
										)}
										<input
											type='file'
											className='d-none'
											accept='image/*'
											id='labelPreviewUpload'
											onChange={handleLabelPreviewUpload}
											disabled={!isFormComplete()}
										/>
										<label
											htmlFor='labelPreviewUpload'
											className={`btn btn-lg ${isFormComplete() ? 'btn-success' : 'btn-secondary'}`}
											style={{
												fontSize: '1rem',
												padding: '12px 40px',
												cursor: isFormComplete() ? 'pointer' : 'not-allowed',
												opacity: isFormComplete() ? 1 : 0.5,
											}}>
											{isFormComplete()
												? 'Upload Label Preview'
												: 'Upload Disabled - Fill All Fields'}
										</label>
									</>
								) : (
									<>
										<div className='mb-3'>
											<img
												src={
													formData.labelPreview?.startsWith('blob:')
														? formData.labelPreview
														: `https://files.fggroup.in/${formData.labelPreview}`
												}
												alt='Label Preview'
												style={{
													maxWidth: '100%',
													maxHeight: '500px',
													objectFit: 'contain',
													border: '2px solid #198754',
													borderRadius: '8px',
												}}
											/>
										</div>
										<button
											className='btn btn-sm'
											style={{
												backgroundColor: '#dc3545',
												color: '#fff',
												border: 'none',
												transition: 'background-color 0.3s ease',
											}}
											onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff5c6f')}
											onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
											onClick={() => setFormData({ ...formData, labelPreview: null })}>
											Remove Label Preview
										</button>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='text-end mt-4'>
				<button
					className='btn btn-primary btn-lg px-5'
					style={{
						color: '#fff',
						border: 'none',
						transition: 'background-color 0.3s ease',
					}}
					onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5FB3D6')}
					onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#87CEEB')}
					onClick={handleSaveAndDownload}
					disabled={isDownloading || isAdding}>
					{isDownloading || isAdding ? (
						<>
							<span
								className='spinner-border spinner-border-sm me-2'
								role='status'
								aria-hidden='true'></span>
							{isAdding ? 'Updating...' : 'Generating PDF...'}
						</>
					) : (
						<>Save & Download PDF</>
					)}
				</button>
			</div>
		</div>
	)
}

export default GnDesignApproveSystemUpdate
