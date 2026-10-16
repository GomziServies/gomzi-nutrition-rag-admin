import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	BankOfferItem,
	GetBankOffersAdmin,
	CreateBankOfferAdmin,
	UpdateBankOfferAdmin,
	DeleteBankOfferAdmin,
	ReorderBankOffersAdmin,
	FileUploadToFGGroup,
} from '../../../Functions/FGGroup'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPlus,
	faTrash,
	faEdit,
	faArrowUp,
	faArrowDown,
	faUpload,
	faLink,
	faBuildingColumns,
	faPalette,
	faTimes,
} from '@fortawesome/free-solid-svg-icons'

const GRADIENT_PRESETS = [
	{ label: 'Festive Sunset Purple', value: 'linear-gradient(180deg, #5b1d7d 0%, #681f8f 65%, #c83d09 95%, #ea580c 100%)' },
	{ label: 'Royal Violet', value: 'linear-gradient(180deg, #4c1d95 0%, #5b21b6 65%, #7c3aed 100%)' },
	{ label: 'Midnight Indigo', value: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 65%, #4338ca 100%)' },
	{ label: 'Emerald Mint', value: 'linear-gradient(180deg, #064e3b 0%, #047857 65%, #059669 100%)' },
]

const getPreviewUrl = (url?: string) => {
	if (!url) return ''
	if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
	if (url.startsWith('/images/')) return `http://localhost:5173${url}`
	return `${FG_GROUP_FILE_BASE_URL}${url}`
}

export default function BankOfferManage() {
	const [offers, setOffers] = useState<BankOfferItem[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [saving, setSaving] = useState<boolean>(false)
	const [uploadingImage, setUploadingImage] = useState<boolean>(false)
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	const [editingOffer, setEditingOffer] = useState<BankOfferItem | null>(null)

	const [formData, setFormData] = useState<{
		bankName: string
		heading: string
		subheading: string
		terms: string
		logo: string
		bankPreset: string
		bgGradient: string
		url: string
		status: boolean
	}>({
		bankName: 'ICICI Bank',
		heading: 'FLAT ₹300 OFF*',
		subheading: 'on ICICI NetBanking & Cards',
		terms: '*Applicable on Gomzi supplements above ₹1,999. T&C Apply.',
		logo: '',
		bankPreset: 'icici',
		bgGradient: GRADIENT_PRESETS[0].value,
		url: '/gomzi-supplement',
		status: true,
	})

	const fetchOffers = async () => {
		try {
			setLoading(true)
			const res = await GetBankOffersAdmin()
			if (res?.data?.offers) {
				setOffers(res.data.offers)
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to load bank offers')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchOffers()
	}, [])

	const handleOpenModal = (offer?: BankOfferItem) => {
		if (offer) {
			setEditingOffer(offer)
			setFormData({
				bankName: offer.bankName || '',
				heading: offer.heading || '',
				subheading: offer.subheading || '',
				terms: offer.terms || '*T&C Apply.',
				logo: offer.logo || '',
				bankPreset: offer.bankPreset || 'other',
				bgGradient: offer.bgGradient || GRADIENT_PRESETS[0].value,
				url: offer.url || '/gomzi-supplement',
				status: offer.status !== undefined ? offer.status : true,
			})
		} else {
			setEditingOffer(null)
			setFormData({
				bankName: 'ICICI Bank',
				heading: 'FLAT ₹300 OFF*',
				subheading: 'on ICICI NetBanking & Cards',
				terms: '*Applicable on Gomzi supplements above ₹1,999. T&C Apply.',
				logo: '',
				bankPreset: 'icici',
				bgGradient: GRADIENT_PRESETS[0].value,
				url: '/gomzi-supplement',
				status: true,
			})
		}
		setIsModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsModalOpen(false)
		setEditingOffer(null)
	}

	const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		try {
			setUploadingImage(true)
			const res = await FileUploadToFGGroup(file)
			if (res?.data?.file) {
				setFormData((prev) => ({ ...prev, logo: res.data.file, bankPreset: 'other' }))
				toast.success('Bank logo uploaded successfully')
			}
		} catch (err: any) {
			toast.error(err.message || 'Logo upload failed')
		} finally {
			setUploadingImage(false)
			e.target.value = ''
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.bankName.trim()) {
			toast.error('Please enter bank name')
			return
		}
		if (!formData.heading.trim()) {
			toast.error('Please enter offer heading (e.g. FLAT ₹300 OFF*)')
			return
		}

		try {
			setSaving(true)
			const payload = {
				bankName: formData.bankName.trim(),
				heading: formData.heading.trim(),
				subheading: formData.subheading.trim(),
				terms: formData.terms.trim() || '*T&C Apply.',
				logo: formData.logo.trim(),
				bankPreset: formData.bankPreset,
				bgGradient: formData.bgGradient.trim() || GRADIENT_PRESETS[0].value,
				url: formData.url.trim() || '/gomzi-supplement',
				status: formData.status,
			}

			if (editingOffer) {
				await UpdateBankOfferAdmin({ ...payload, id: editingOffer._id || editingOffer.id || '' })
				toast.success('Bank offer updated successfully')
			} else {
				await CreateBankOfferAdmin(payload)
				toast.success('Bank offer created successfully')
			}

			handleCloseModal()
			fetchOffers()
		} catch (err: any) {
			toast.error(err.message || 'Failed to save bank offer')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id: string, name: string) => {
		if (!window.confirm(`Are you sure you want to delete bank offer "${name}"?`)) return

		try {
			await DeleteBankOfferAdmin(id)
			toast.success('Bank offer deleted successfully')
			fetchOffers()
		} catch (err: any) {
			toast.error(err.message || 'Failed to delete offer')
		}
	}

	const handleToggleStatus = async (offer: BankOfferItem) => {
		try {
			const id = offer._id || offer.id || ''
			await UpdateBankOfferAdmin({ id, status: !offer.status })
			toast.success(`Bank offer ${!offer.status ? 'activated' : 'deactivated'}`)
			fetchOffers()
		} catch (err: any) {
			toast.error(err.message || 'Failed to toggle status')
		}
	}

	const handleMove = async (index: number, direction: 'up' | 'down') => {
		const targetIndex = direction === 'up' ? index - 1 : index + 1
		if (targetIndex < 0 || targetIndex >= offers.length) return

		const updated = [...offers]
		const temp = updated[index]
		updated[index] = updated[targetIndex]
		updated[targetIndex] = temp

		setOffers(updated)

		try {
			await ReorderBankOffersAdmin(updated)
			toast.success('Bank offer order updated')
		} catch (err: any) {
			toast.error(err.message || 'Failed to reorder')
			fetchOffers()
		}
	}

	const renderBankLogoBadge = (item: { bankPreset?: string; logo?: string; bankName: string }) => {
		if (item.logo) {
			return (
				<img
					src={getPreviewUrl(item.logo)}
					alt={item.bankName}
					style={{ height: '32px', maxWidth: '90px', objectFit: 'contain' }}
				/>
			)
		}

		const preset = (item.bankPreset || '').toLowerCase()
		if (preset === 'icici') {
			return (
				<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
					<span
						style={{
							background: '#f37021',
							color: '#fff',
							width: '24px',
							height: '24px',
							borderRadius: '50%',
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontWeight: 900,
							fontSize: '11px',
						}}
					>
						i
					</span>
					<span style={{ fontWeight: 900, color: '#f37021', fontSize: '14px' }}>ICICI Bank</span>
				</div>
			)
		}
		if (preset === 'hdfc') {
			return (
				<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
					<span
						style={{
							background: '#004c8f',
							color: '#fff',
							padding: '2px 5px',
							borderRadius: '3px',
							fontWeight: 900,
							fontSize: '8px',
						}}
					>
						HDFC
					</span>
					<span style={{ fontWeight: 900, color: '#0f172a', fontSize: '14px' }}>HDFC</span>
				</div>
			)
		}
		if (preset === 'hsbc') {
			return (
				<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
					<span style={{ color: '#dc2626', fontWeight: 900, fontSize: '13px' }}>▲▼</span>
					<span style={{ fontWeight: 900, color: '#0f172a', fontSize: '14px' }}>HSBC</span>
				</div>
			)
		}
		if (preset === 'upi') {
			return (
				<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
					<span
						style={{
							background: '#059669',
							color: '#fff',
							padding: '2px 6px',
							borderRadius: '4px',
							fontWeight: 900,
							fontSize: '9px',
						}}
					>
						UPI
					</span>
					<span style={{ fontWeight: 900, color: '#0f172a', fontSize: '14px' }}>UPI Pay</span>
				</div>
			)
		}

		return (
			<span className="badge badge-light-primary fw-bold fs-7">
				<FontAwesomeIcon icon={faBuildingColumns} className="me-1" />
				{item.bankName}
			</span>
		)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Bank Offers Banner (Purple Festive Slider)</PageTitle>

			<div className="card shadow-sm border-0 mb-6" style={{ borderRadius: '16px' }}>
				<div className="card-header border-0 pt-6 d-flex justify-content-between align-items-center flex-wrap gap-4">
					<div>
						<h3 className="card-title align-items-start flex-column mb-1">
							<span className="card-label fw-bold fs-3 text-gray-900">
								Homepage Bank Tie-Up Offers
							</span>
							<span className="text-muted mt-1 fw-semibold fs-7">
								Manage card discounts, netbanking cashbacks, and instant UPI checkout perks on the homepage carousel.
							</span>
						</h3>
					</div>
					<div className="card-toolbar">
						<button
							type="button"
							className="btn btn-primary d-flex align-items-center gap-2"
							style={{
								background: 'linear-gradient(135deg, #7c3aed 0%, #5b1d7d 100%)',
								border: 'none',
								borderRadius: '10px',
								boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
							}}
							onClick={() => handleOpenModal()}
						>
							<FontAwesomeIcon icon={faPlus} />
							<span>Add Bank Offer</span>
						</button>
					</div>
				</div>

				<div className="card-body pt-4">
					{loading ? (
						<div className="d-flex justify-content-center align-items-center py-16">
							<div className="spinner-border" style={{ color: '#7c3aed' }} role="status">
								<span className="visually-hidden">Loading...</span>
							</div>
						</div>
					) : offers.length === 0 ? (
						<div className="text-center py-16">
							<div
								className="d-inline-flex align-items-center justify-content-center mb-4"
								style={{
									width: '72px',
									height: '72px',
									borderRadius: '20px',
									background: 'rgba(124, 58, 237, 0.1)',
									color: '#7c3aed',
								}}
							>
								<FontAwesomeIcon icon={faBuildingColumns} size="2x" />
							</div>
							<h4 className="fw-bold text-gray-800 mb-2">No Bank Offers Configured</h4>
							<p className="text-muted fs-6 mb-6">
								Add bank card cashbacks and netbanking discount offers to drive orders.
							</p>
							<button
								type="button"
								className="btn btn-primary"
								style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
								onClick={() => handleOpenModal()}
							>
								Create First Offer
							</button>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table align-middle table-row-dashed fs-6 gy-5">
								<thead>
									<tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
										<th style={{ width: '60px' }}>Order</th>
										<th style={{ minWidth: '380px' }}>Live Banner Preview</th>
										<th style={{ minWidth: '160px' }}>Bank / Partner</th>
										<th style={{ minWidth: '160px' }}>Terms & Link</th>
										<th style={{ width: '100px' }} className="text-center">Status</th>
										<th style={{ width: '120px' }} className="text-end">Actions</th>
									</tr>
								</thead>
								<tbody className="text-gray-600 fw-semibold">
									{offers.map((offer, index) => {
										const id = offer._id || offer.id || ''
										return (
											<tr key={id}>
												<td>
													<div className="d-flex flex-column align-items-center gap-1">
														<button
															type="button"
															className="btn btn-icon btn-sm btn-light-primary"
															disabled={index === 0}
															onClick={() => handleMove(index, 'up')}
															title="Move Up"
															style={{ width: '28px', height: '28px' }}
														>
															<FontAwesomeIcon icon={faArrowUp} />
														</button>
														<span className="badge badge-light fw-bold fs-8">{index + 1}</span>
														<button
															type="button"
															className="btn btn-icon btn-sm btn-light-primary"
															disabled={index === offers.length - 1}
															onClick={() => handleMove(index, 'down')}
															title="Move Down"
															style={{ width: '28px', height: '28px' }}
														>
															<FontAwesomeIcon icon={faArrowDown} />
														</button>
													</div>
												</td>
												<td>
													{/* Live Purple Banner Strip Preview */}
													<div
														style={{
															background: offer.bgGradient || GRADIENT_PRESETS[0].value,
															borderRadius: '16px',
															padding: '16px 20px',
															color: '#ffffff',
															position: 'relative',
															overflow: 'hidden',
															boxShadow: '0 8px 24px rgba(91, 29, 125, 0.25)',
														}}
													>
														{/* Centered White Pill Card */}
														<div
															style={{
																background: '#ffffff',
																borderRadius: '12px',
																padding: '10px 18px',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																gap: '14px',
																color: '#0f172a',
																boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
															}}
														>
															<div>{renderBankLogoBadge(offer)}</div>
															<div style={{ width: '1.5px', height: '28px', background: '#e2e8f0' }} />
															<div style={{ textAlign: 'left' }}>
																<div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', lineHeight: 1.15 }}>
																	{offer.heading}
																</div>
																<div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
																	{offer.subheading}
																</div>
															</div>
														</div>

														<div
															style={{
																textAlign: 'center',
																fontSize: '9px',
																color: 'rgba(255,255,255,0.85)',
																marginTop: '8px',
																fontWeight: 500,
															}}
														>
															{offer.terms || '*T&C Apply.'}
														</div>
													</div>
												</td>
												<td>
													<div className="d-flex flex-column gap-1">
														<span className="fw-bold text-gray-800 fs-7">{offer.bankName}</span>
														<span className="badge badge-light-info fs-8 align-self-start">
															Preset: {offer.bankPreset || 'Custom'}
														</span>
													</div>
												</td>
												<td>
													<div className="d-flex flex-column gap-1">
														<div className="d-flex align-items-center gap-1">
															<FontAwesomeIcon icon={faLink} className="text-muted fs-8" />
															<span className="text-gray-700 fs-8 text-truncate" style={{ maxWidth: '140px' }}>
																{offer.url || '/gomzi-supplement'}
															</span>
														</div>
														<span className="text-muted fs-8 text-truncate" style={{ maxWidth: '180px' }}>
															{offer.terms}
														</span>
													</div>
												</td>
												<td className="text-center">
													<div className="form-check form-switch form-check-custom form-check-solid justify-content-center">
														<input
															className="form-check-input h-20px w-35px cursor-pointer"
															type="checkbox"
															checked={!!offer.status}
															onChange={() => handleToggleStatus(offer)}
														/>
													</div>
													<span className={`badge ${offer.status ? 'badge-light-success' : 'badge-light-danger'} fs-8 mt-1`}>
														{offer.status ? 'Active' : 'Draft'}
													</span>
												</td>
												<td className="text-end">
													<div className="d-flex justify-content-end gap-2">
														<button
															type="button"
															className="btn btn-icon btn-light btn-sm"
															onClick={() => handleOpenModal(offer)}
															title="Edit Offer"
														>
															<FontAwesomeIcon icon={faEdit} className="text-primary" />
														</button>
														<button
															type="button"
															className="btn btn-icon btn-light btn-sm"
															onClick={() => handleDelete(id, offer.bankName)}
															title="Delete Offer"
														>
															<FontAwesomeIcon icon={faTrash} className="text-danger" />
														</button>
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

			{/* Modal for Create / Edit */}
			{isModalOpen && (
				<div
					className="modal fade show d-block"
					tabIndex={-1}
					style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
				>
					<div className="modal-dialog modal-dialog-centered modal-lg">
						<div className="modal-content shadow-lg border-0" style={{ borderRadius: '20px' }}>
							<div className="modal-header border-0 pb-0">
								<h3 className="modal-title fw-bold text-gray-900">
									{editingOffer ? 'Edit Bank Offer' : 'Create Bank Offer'}
								</h3>
								<button
									type="button"
									className="btn btn-icon btn-sm btn-light"
									onClick={handleCloseModal}
								>
									<FontAwesomeIcon icon={faTimes} />
								</button>
							</div>

							<form onSubmit={handleSubmit}>
								<div className="modal-body py-6">
									{/* Interactive Realtime Preview */}
									<div className="mb-6">
										<label className="form-label fs-7 fw-bold text-muted text-uppercase mb-2">
											Live Realtime Preview
										</label>
										<div
											style={{
												background: formData.bgGradient || GRADIENT_PRESETS[0].value,
												borderRadius: '18px',
												padding: '20px 24px',
												position: 'relative',
												overflow: 'hidden',
												boxShadow: '0 8px 24px rgba(91, 29, 125, 0.25)',
											}}
										>
											<div
												style={{
													background: '#ffffff',
													borderRadius: '14px',
													padding: '14px 24px',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													gap: '18px',
													boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
													maxWidth: '560px',
													margin: '0 auto',
												}}
											>
												<div>{renderBankLogoBadge(formData)}</div>
												<div style={{ width: '1.5px', height: '36px', background: '#e2e8f0' }} />
												<div style={{ textAlign: 'left' }}>
													<div style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a', lineHeight: 1.2 }}>
														{formData.heading || 'FLAT ₹300 OFF*'}
													</div>
													<div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
														{formData.subheading || 'on ICICI NetBanking & Cards'}
													</div>
												</div>
											</div>

											<div
												style={{
													textAlign: 'center',
													fontSize: '10px',
													color: 'rgba(255,255,255,0.9)',
													marginTop: '10px',
													fontWeight: 500,
												}}
											>
												{formData.terms || '*Applicable on Gomzi supplements above ₹1,999. T&C Apply.'}
											</div>
										</div>
									</div>

									{/* Form Fields */}
									<div className="row g-4">
										<div className="col-md-6">
											<label className="form-label required fw-bold text-gray-700 fs-7">Bank / Partner Name</label>
											<input
												type="text"
												className="form-control form-control-solid"
												placeholder="e.g. ICICI Bank, HDFC, SBI"
												value={formData.bankName}
												onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
												required
											/>
										</div>

										<div className="col-md-6">
											<label className="form-label fw-bold text-gray-700 fs-7">Bank Icon / Logo Preset</label>
											<select
												className="form-select form-select-solid"
												value={formData.bankPreset}
												onChange={(e) => setFormData({ ...formData, bankPreset: e.target.value })}
											>
												<option value="icici">ICICI Bank (Vector Logo)</option>
												<option value="hdfc">HDFC Bank (Vector Logo)</option>
												<option value="hsbc">HSBC (Vector Logo)</option>
												<option value="upi">UPI Pay (Vector Logo)</option>
												<option value="other">Custom (Use Uploaded Image or Generic Icon)</option>
											</select>
										</div>

										<div className="col-md-6">
											<label className="form-label required fw-bold text-gray-700 fs-7">Offer Headline</label>
											<input
												type="text"
												className="form-control form-control-solid"
												placeholder="e.g. FLAT ₹300 OFF*, 10% CASHBACK*"
												value={formData.heading}
												onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
												required
											/>
										</div>

										<div className="col-md-6">
											<label className="form-label fw-bold text-gray-700 fs-7">Subheading / Eligibility</label>
											<input
												type="text"
												className="form-control form-control-solid"
												placeholder="e.g. on ICICI NetBanking & Cards"
												value={formData.subheading}
												onChange={(e) => setFormData({ ...formData, subheading: e.target.value })}
											/>
										</div>

										<div className="col-md-12">
											<label className="form-label fw-bold text-gray-700 fs-7">Terms & Conditions Disclaimer</label>
											<input
												type="text"
												className="form-control form-control-solid"
												placeholder="e.g. *Applicable on Gomzi supplements above ₹1,999. T&C Apply."
												value={formData.terms}
												onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
											/>
										</div>

										<div className="col-md-6">
											<label className="form-label fw-bold text-gray-700 fs-7">Target Click Link</label>
											<input
												type="text"
												className="form-control form-control-solid"
												placeholder="/gomzi-supplement"
												value={formData.url}
												onChange={(e) => setFormData({ ...formData, url: e.target.value })}
											/>
										</div>

										<div className="col-md-6">
											<label className="form-label fw-bold text-gray-700 fs-7 d-flex justify-content-between">
												<span>Upload Custom Bank Logo</span>
												<span className="text-muted fw-normal fs-8">Optional</span>
											</label>
											<div className="d-flex align-items-center gap-2">
												<input
													type="file"
													id="bank-offer-logo-file"
													className="d-none"
													accept="image/*"
													onChange={handleImageFileUpload}
												/>
												<label
													htmlFor="bank-offer-logo-file"
													className="btn btn-light-primary d-flex align-items-center gap-2 flex-grow-1"
													style={{ cursor: 'pointer' }}
												>
													<FontAwesomeIcon icon={faUpload} />
													<span>{uploadingImage ? 'Uploading...' : formData.logo ? 'Change Logo' : 'Upload PNG/SVG'}</span>
												</label>
												{formData.logo && (
													<button
														type="button"
														className="btn btn-light-danger btn-icon"
														onClick={() => setFormData({ ...formData, logo: '' })}
														title="Reset to Vector Logo"
													>
														<FontAwesomeIcon icon={faTrash} />
													</button>
												)}
											</div>
										</div>

										{/* Theme Gradients */}
										<div className="col-12">
											<label className="form-label fw-bold text-gray-700 fs-7 mb-2 d-flex align-items-center gap-2">
												<FontAwesomeIcon icon={faPalette} className="text-primary" />
												<span>Background Theme Gradient</span>
											</label>
											<div className="d-flex flex-wrap gap-2 mb-2">
												{GRADIENT_PRESETS.map((p) => (
													<button
														type="button"
														key={p.label}
														className={`btn btn-sm ${
															formData.bgGradient === p.value
																? 'btn-primary shadow-sm'
																: 'btn-light border'
														}`}
														style={{ borderRadius: '8px' }}
														onClick={() => setFormData({ ...formData, bgGradient: p.value })}
													>
														<span
															style={{
																display: 'inline-block',
																width: '12px',
																height: '12px',
																borderRadius: '3px',
																background: p.value,
																marginRight: '6px',
																verticalAlign: 'middle',
															}}
														/>
														{p.label}
													</button>
												))}
											</div>
											<input
												type="text"
												className="form-control form-control-solid fs-8"
												placeholder="Custom CSS Gradient"
												value={formData.bgGradient}
												onChange={(e) => setFormData({ ...formData, bgGradient: e.target.value })}
											/>
										</div>

										<div className="col-12">
											<div className="form-check form-switch form-check-custom form-check-solid">
												<input
													className="form-check-input h-20px w-35px"
													type="checkbox"
													id="offer-status-toggle"
													checked={formData.status}
													onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
												/>
												<label className="form-check-label fw-bold text-gray-700 fs-7" htmlFor="offer-status-toggle">
													Active on Homepage Carousel
												</label>
											</div>
										</div>
									</div>
								</div>

								<div className="modal-footer border-0 pt-0">
									<button
										type="button"
										className="btn btn-light"
										onClick={handleCloseModal}
										disabled={saving}
									>
										Cancel
									</button>
									<button
										type="submit"
										className="btn btn-primary d-flex align-items-center gap-2"
										style={{
											background: 'linear-gradient(135deg, #7c3aed 0%, #5b1d7d 100%)',
											border: 'none',
											borderRadius: '10px',
										}}
										disabled={saving}
									>
										{saving && <span className="spinner-border spinner-border-sm" role="status" />}
										<span>{editingOffer ? 'Update Offer' : 'Create Offer'}</span>
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
