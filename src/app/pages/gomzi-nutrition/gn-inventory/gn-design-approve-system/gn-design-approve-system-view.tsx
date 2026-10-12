import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import { GetGnLabelDesignApprove } from '../../../../Functions/FGGroup'

interface ViewData {
	clientName: string
	brandName: string
	productName: string
	issueDate: string
	approvalStatus: string
	approvedBy: string
	approvalImage: string | null
	labelPreview: string | null
	remarks: string
	checklist: Array<{ details: string; checkedBy: boolean; verifiedBy: boolean }>
}

const GnDesignApproveSystemView: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const designId = searchParams.get('id') || ''
	const [commonId, setCommonId] = useState('')
	const [clientId, setClientId] = useState('')

	const [isLoading, setIsLoading] = useState(true)
	const [viewData, setViewData] = useState<ViewData>({
		clientName: '',
		brandName: '',
		productName: '',
		issueDate: '',
		approvalStatus: 'Pending',
		approvedBy: '',
		approvalImage: null,
		labelPreview: null,
		remarks: '',
		checklist: [],
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

				setViewData({
					clientName: design.clientName || 'N/A',
					brandName: design.brandName || 'N/A',
					productName: design.productName || 'N/A',
					issueDate: design.issueDate || '',
					approvalStatus: design.final_approval_by_client ? 'Approved' : 'Pending',
					approvedBy: design.final_approval_by || 'N/A',
					approvalImage: design.final_approval_image || null,
					labelPreview: design.label_preview_image || null,
					remarks: design.remarks || '',
					checklist: design.checklist || [],
				})
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to load design data')
		} finally {
			setIsLoading(false)
		}
	}

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
					<p className='mt-3'>Loading design details...</p>
				</div>
			</div>
		)
	}

	return (
		<div
			className='container-fluid p-4'
			style={{ background: '#f5f5f5', minHeight: '100vh' }}>
			<PageTitle breadcrumbs={[]}>Design Approval Details</PageTitle>

			{/* Main Container */}
			<div className='row g-4'>
				{/* Left Column */}
				<div className='col-lg-6 d-flex flex-column'>
					{/* Basic Information Card */}
					<div
						className='card shadow-sm mb-4'
						style={{ border: 'none', borderRadius: '8px' }}>
						<div
							className='card-header bg-white border-bottom'
							style={{ padding: '20px' }}>
							<h5
								className='mb-0 fw-bold'
								style={{ color: '#2c3e50' }}>
								<i
									className='bi bi-info-circle me-2'
									style={{ color: '#3b82f6' }}></i>
								Design Information
							</h5>
						</div>
						<div
							className='card-body'
							style={{ padding: '24px' }}>
							<div className='row g-3'>
								{/* Client Name */}
								<div className='col-md-6'>
									<div className='mb-1'>
										<small className='text-muted fw-semibold'>Client Name</small>
									</div>
									<div
										className='d-flex align-items-center p-3 rounded'
										style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
										<i
											className='bi bi-building text-primary me-3'
											style={{ fontSize: '1.5rem' }}></i>
										<span
											className='fw-semibold'
											style={{ fontSize: '1.05rem', color: '#1e293b' }}>
											{viewData.clientName}
										</span>
									</div>
								</div>

								{/* Brand Name */}
								<div className='col-md-6'>
									<div className='mb-1'>
										<small className='text-muted fw-semibold'>Brand Name</small>
									</div>
									<div
										className='d-flex align-items-center p-3 rounded'
										style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
										<i
											className='bi bi-tag text-success me-3'
											style={{ fontSize: '1.5rem' }}></i>
										<span
											className='fw-semibold'
											style={{ fontSize: '1.05rem', color: '#1e293b' }}>
											{viewData.brandName}
										</span>
									</div>
								</div>

								{/* Product Name */}
								<div className='col-md-6'>
									<div className='mb-1'>
										<small className='text-muted fw-semibold'>Product Name</small>
									</div>
									<div
										className='d-flex align-items-center p-3 rounded'
										style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
										<i
											className='bi bi-box-seam text-info me-3'
											style={{ fontSize: '1.5rem' }}></i>
										<span
											className='fw-semibold'
											style={{ fontSize: '1.05rem', color: '#1e293b' }}>
											{viewData.productName}
										</span>
									</div>
								</div>

								{/* Issue Date */}
								<div className='col-md-6'>
									<div className='mb-1'>
										<small className='text-muted fw-semibold'>Issue Date</small>
									</div>
									<div
										className='d-flex align-items-center p-3 rounded'
										style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
										<i
											className='bi bi-calendar-check text-warning me-3'
											style={{ fontSize: '1.5rem' }}></i>
										<span
											className='fw-semibold'
											style={{ fontSize: '1.05rem', color: '#1e293b' }}>
											{new Date(viewData.issueDate).toLocaleDateString('en-GB')}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Approval Status Card */}
					<div
						className='card shadow-sm flex-grow-1'
						style={{ border: 'none', borderRadius: '8px' }}>
						<div
							className='card-header bg-white border-bottom'
							style={{ padding: '20px' }}>
							<h5
								className='mb-0 fw-bold'
								style={{ color: '#2c3e50' }}>
								<i
									className='bi bi-check-circle me-2'
									style={{ color: '#10b981' }}></i>
								Approval Status
							</h5>
						</div>
						<div
							className='card-body'
							style={{ padding: '24px' }}>
							<div className='row align-items-center'>
								<div className='col-md-6 mb-3 mb-md-0'>
									<div className='d-flex align-items-center'>
										<div
											className='rounded-circle d-flex align-items-center justify-content-center me-3'
											style={{
												width: '60px',
												height: '60px',
												background: viewData.approvalStatus === 'Approved' ? '#dcfce7' : '#fef3c7',
												border: `3px solid ${
													viewData.approvalStatus === 'Approved' ? '#10b981' : '#f59e0b'
												}`,
											}}>
											<i
												className={`bi ${
													viewData.approvalStatus === 'Approved' ? 'bi-check-lg' : 'bi-clock'
												}`}
												style={{
													fontSize: '1.8rem',
													color: viewData.approvalStatus === 'Approved' ? '#10b981' : '#f59e0b',
												}}></i>
										</div>
										<div>
											<small className='text-muted d-block mb-1'>Status</small>
											<span
												className='badge px-3 py-2'
												style={{
													fontSize: '0.95rem',
													background:
														viewData.approvalStatus === 'Approved' ? '#10b981' : '#f59e0b',
													color: '#fff',
												}}>
												{viewData.approvalStatus === 'Approved' ? '✓ Approved' : '⏳ Pending'}
											</span>
										</div>
									</div>
								</div>
								<div className='col-md-6'>
									<div
										className='p-3 rounded'
										style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
										<small className='text-muted d-block mb-1'>Approved By</small>
										<div className='d-flex align-items-center'>
											<i
												className='bi bi-person-check-fill text-primary me-2'
												style={{ fontSize: '1.3rem' }}></i>
											<span
												className='fw-bold'
												style={{ fontSize: '1.05rem', color: '#1e293b' }}>
												{viewData.approvedBy}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right Column - Client Approval Image */}
				<div className='col-lg-6'>
					{viewData.approvalImage && (
						<div
							className='card shadow-sm h-100'
							style={{ border: 'none', borderRadius: '8px' }}>
							<div
								className='card-header bg-white border-bottom'
								style={{ padding: '20px' }}>
								<h5
									className='mb-0 fw-bold'
									style={{ color: '#2c3e50' }}>
									<i
										className='bi bi-image me-2'
										style={{ color: '#8b5cf6' }}></i>
									Client Approval Screenshot
								</h5>
							</div>
							<div
								className='card-body d-flex align-items-center justify-content-center'
								style={{ padding: '24px', background: '#fafafa' }}>
								<img
									src={`https://files.fggroup.in/${viewData.approvalImage}`}
									alt='Client Approval'
									className='img-fluid rounded'
									style={{
										maxHeight: '100%',
										maxWidth: '100%',
										objectFit: 'contain',
										border: '2px solid #e2e8f0',
										boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
									}}
								/>
							</div>
						</div>
					)}
				</div>

				{/* Full Width - Product Label Preview */}
				<div className='col-12'>
					{viewData.labelPreview && (
						<div
							className='card shadow-sm'
							style={{ border: 'none', borderRadius: '8px' }}>
							<div
								className='card-header bg-white border-bottom'
								style={{ padding: '20px' }}>
								<h5
									className='mb-0 fw-bold'
									style={{ color: '#2c3e50' }}>
									<i
										className='bi bi-file-earmark-image me-2'
										style={{ color: '#ec4899' }}></i>
									Product Label Preview
								</h5>
							</div>
							<div
								className='card-body text-center'
								style={{ padding: '24px', background: '#fafafa' }}>
								<img
									src={`https://files.fggroup.in/${viewData.labelPreview}`}
									alt='Product Label'
									className='img-fluid rounded'
									style={{
										maxWidth: '100%',
										height: 'auto',
										border: '2px solid #e2e8f0',
										boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
									}}
								/>
								<div
									className='mt-3 p-2 rounded'
									style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
									<small className='text-muted'>
										<i className='bi bi-info-circle me-1'></i>
										Final approved label design
									</small>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Back Button - Bottom Right */}
				<div className='col-12'>
					<div className='d-flex justify-content-end'>
						<button
							className='btn btn-light'
							style={{ padding: '12px 32px', fontWeight: '500' }}
							onClick={() =>
								navigate(`/rag/inventory/view/list?clientId=${clientId}&commonId=${commonId}`)
							}>
							<i className='bi bi-arrow-left me-2'></i>
							Back
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default GnDesignApproveSystemView
