import React, { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	ComboStackItem,
	ComboStackHeaderConfig,
	GetComboStacksAdmin,
	CreateComboStackAdmin,
	UpdateComboStackAdmin,
	DeleteComboStackAdmin,
	ReorderComboStacksAdmin,
	UpdateComboHeaderConfigAdmin,
} from '../../../Functions/FGGroup/ComboStack'
import { GetProduct } from '../../../Functions/FGGroup'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'

interface ProductOption {
	_id: string
	name: string
	company?: string
	flavour?: string
	categories?: string[]
	price: number
	discountPrice?: number
	stock?: number
	displayImages?: string[]
}

interface ProductSlot {
	productId: string
	label: string
}

const idOf = (item: any) => item?._id || item?.id || ''

const resolveImage = (value?: string) => {
	if (!value) return ''
	return /^(https?:\/\/|\/)/i.test(value) ? value : `${FG_GROUP_FILE_BASE_URL}/${value}`
}

const requireSuccess = (response: any) => {
	if (!response || Number(response.status) >= 400) {
		throw new Error(response?.message || 'The request failed. Please try again.')
	}
	return response
}

const DEFAULT_HEADER_CONFIG: ComboStackHeaderConfig = {
	eyebrow: 'BETTER TOGETHER',
	title: 'Your routine. Your stack.',
	subtitle: 'Handpicked product essentials at special bundle pricing. Add them in one step.',
}

export default function ComboStackManage() {
	const [stacks, setStacks] = useState<ComboStackItem[]>([])
	const [catalogProducts, setCatalogProducts] = useState<ProductOption[]>([])
	const [companies, setCompanies] = useState<string[]>([])
	const [loading, setLoading] = useState(true)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')

	// Section Header Customizer State
	const [headerConfig, setHeaderConfig] = useState<ComboStackHeaderConfig>(DEFAULT_HEADER_CONFIG)
	const [savingHeader, setSavingHeader] = useState(false)
	const [showHeaderEditor, setShowHeaderEditor] = useState(true)

	// Modal Form State
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState<string | null>(null)
	const [name, setName] = useState('')
	const [tagline, setTagline] = useState('')
	const [company, setCompany] = useState('Gomzi Nutrition')
	const [comboPrice, setComboPrice] = useState<number | ''>('')
	const [originalPrice, setOriginalPrice] = useState<number | ''>('')
	const [slots, setSlots] = useState<ProductSlot[]>([])
	const [status, setStatus] = useState(true)

	// Catalog search & filter in modal
	const [productFilterCompany, setProductFilterCompany] = useState('All')
	const [productSearch, setProductSearch] = useState('')

	const loadStacks = async () => {
		setLoading(true)
		setError('')
		try {
			const res: any = requireSuccess(await GetComboStacksAdmin())
			setStacks(Array.isArray(res.data?.comboStacks) ? res.data.comboStacks : [])
			if (res.data?.headerConfig) {
				setHeaderConfig({
					eyebrow: res.data.headerConfig.eyebrow || DEFAULT_HEADER_CONFIG.eyebrow,
					title: res.data.headerConfig.title || DEFAULT_HEADER_CONFIG.title,
					subtitle: res.data.headerConfig.subtitle || DEFAULT_HEADER_CONFIG.subtitle,
				})
			}
		} catch (err: any) {
			setError(err.message || 'Could not load combo stacks.')
		} finally {
			setLoading(false)
		}
	}

	const loadCatalog = async () => {
		try {
			const res: any = await GetProduct({ limit: 500, page: 1 })
			if (res?.data && Array.isArray(res.data)) {
				const active = res.data.filter((p: any) => p.status !== false && !p.is_deleted)
				setCatalogProducts(active)

				const compSet = new Set<string>()
				active.forEach((p: any) => {
					if (p.company) compSet.add(p.company.trim())
				})
				setCompanies(Array.from(compSet))
			}
		} catch (err) {
			console.error('Error fetching catalog products for combo builder:', err)
		}
	}

	useEffect(() => {
		loadStacks()
		loadCatalog()
	}, [])

	// Filtered catalog in modal
	const filteredCatalog = useMemo(() => {
		return catalogProducts.filter((p) => {
			const matchCompany =
				productFilterCompany === 'All' ||
				(p.company || '').toLowerCase() === productFilterCompany.toLowerCase()
			const matchSearch =
				!productSearch.trim() ||
				(p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
				(p.company || '').toLowerCase().includes(productSearch.toLowerCase()) ||
				(p.flavour || '').toLowerCase().includes(productSearch.toLowerCase())
			return matchCompany && matchSearch
		})
	}, [catalogProducts, productFilterCompany, productSearch])

	// Live sum of selected products' original prices and discount prices
	const selectedSummary = useMemo(() => {
		let sumMrp = 0
		let sumSelling = 0
		slots.forEach((slot) => {
			const found = catalogProducts.find((p) => p._id === slot.productId)
			if (found) {
				sumMrp += Number(found.price || 0)
				sumSelling += Number(found.discountPrice || found.price || 0)
			}
		})
		return { sumMrp, sumSelling }
	}, [slots, catalogProducts])

	// Live preview product objects
	const livePreviewProducts = useMemo(() => {
		return slots.map((slot, index) => {
			const found = catalogProducts.find((p) => p._id === slot.productId)
			return {
				slotIndex: index + 1,
				label: slot.label || found?.categories?.[0] || `Component 0${index + 1}`,
				name: found?.name || `Product 0${index + 1}`,
				flavour: found?.flavour || found?.company || 'Gomzi Nutrition',
				price: found ? Number(found.discountPrice || found.price || 0) : 0,
				image: resolveImage(found?.displayImages?.[0]),
			}
		})
	}, [slots, catalogProducts])

	const saveHeader = async () => {
		setSavingHeader(true)
		try {
			const res: any = requireSuccess(await UpdateComboHeaderConfigAdmin(headerConfig))
			toast.success('Website section header updated successfully!')
			if (res.data?.headerConfig) {
				setHeaderConfig(res.data.headerConfig)
			}
		} catch (err: any) {
			toast.error(err.message || 'Could not update section headers.')
		} finally {
			setSavingHeader(false)
		}
	}

	const applyDiscountPercentage = (percent: number) => {
		const base = Number(originalPrice) > 0 ? Number(originalPrice) : selectedSummary.sumMrp
		if (base <= 0) {
			toast.error('Please select products with valid prices first.')
			return
		}
		const discounted = Math.round(base * (1 - percent / 100))
		setComboPrice(discounted)
		if (!originalPrice || Number(originalPrice) <= 0) {
			setOriginalPrice(base)
		}
		toast.success(`Applied ${percent}% discount: ₹${discounted.toLocaleString('en-IN')}`)
	}

	const setFeaturedSlot = async (stackIndex: number, targetSlot: 1 | 2) => {
		if (stacks.length < targetSlot) return
		const targetIndex = targetSlot - 1
		if (stackIndex === targetIndex) return
		const reordered = [...stacks]
		const [item] = reordered.splice(stackIndex, 1)
		reordered.splice(targetIndex, 0, item)
		setBusy(true)
		try {
			requireSuccess(await ReorderComboStacksAdmin(reordered))
			toast.success(`Positioned as Combo 0${targetSlot} (Featured on website)`)
			await loadStacks()
		} catch (err: any) {
			toast.error(err.message || 'Could not reorder.')
		} finally {
			setBusy(false)
		}
	}

	const startEdit = (stack?: ComboStackItem) => {
		setProductSearch('')
		setProductFilterCompany('All')
		if (stack) {
			setEditing(idOf(stack))
			setName(stack.name)
			setTagline(stack.tagline || '')
			setCompany(stack.company || 'Gomzi Nutrition')
			setComboPrice(stack.comboPrice ?? '')
			setOriginalPrice(stack.originalPrice ?? '')
			setStatus(stack.status !== false)

			if (Array.isArray(stack.products) && stack.products.length > 0) {
				setSlots(
					stack.products.map((p: any) => ({
						productId: p.product?._id || p.product || '',
						label: p.label || '',
					}))
				)
			} else {
				setSlots([])
			}
		} else {
			setEditing(null)
			setName('')
			setTagline('')
			setCompany('Gomzi Nutrition')
			setComboPrice('')
			setOriginalPrice('')
			setStatus(true)
			setSlots(
				catalogProducts.length >= 3
					? [
							{ productId: catalogProducts[0]._id, label: 'Whey Protein' },
							{ productId: catalogProducts[1]._id, label: 'Creatine' },
							{ productId: catalogProducts[2]._id, label: 'BCAA & Intra' },
					  ]
					: catalogProducts.length >= 2
					? [
							{ productId: catalogProducts[0]._id, label: 'Whey Protein' },
							{ productId: catalogProducts[1]._id, label: 'Creatine' },
					  ]
					: []
			)
		}
		setOpen(true)
	}

	const addProductSlot = () => {
		const nextUnused =
			filteredCatalog.find((p) => !slots.some((s) => s.productId === p._id)) || filteredCatalog[0]
		if (nextUnused) {
			const label = (nextUnused as any)?.categories?.[0] || 'Component'
			setSlots([...slots, { productId: nextUnused._id, label }])
		} else if (catalogProducts[0]) {
			const label = (catalogProducts[0] as any)?.categories?.[0] || 'Component'
			setSlots([...slots, { productId: catalogProducts[0]._id, label }])
		} else {
			toast.error('No products available to add.')
		}
	}

	const removeSlot = (index: number) => {
		if (slots.length <= 1) {
			toast.error('A combo must include at least 1 product.')
			return
		}
		setSlots(slots.filter((_, i) => i !== index))
	}

	const updateSlotProduct = (index: number, newProductId: string) => {
		const found = catalogProducts.find((p) => p._id === newProductId)
		setSlots(
			slots.map((s, i) => {
				if (i !== index) return s
				const suggested = (found as any)?.categories?.[0] || 'Component'
				return {
					...s,
					productId: newProductId,
					label: s.label || suggested,
				}
			})
		)
	}

	const updateSlotLabel = (index: number, newLabel: string) => {
		setSlots(slots.map((s, i) => (i === index ? { ...s, label: newLabel } : s)))
	}

	const handleAutoFillOriginalPrice = () => {
		if (selectedSummary.sumMrp > 0) {
			setOriginalPrice(selectedSummary.sumMrp)
			toast.success(`Original price set to combined MRP ₹${selectedSummary.sumMrp.toLocaleString('en-IN')}`)
		}
	}

	const save = async (e: React.FormEvent) => {
		e.preventDefault()
		if (busy) return

		if (!name.trim()) {
			toast.error('Combo name is required.')
			return
		}

		if (comboPrice === '' || Number(comboPrice) <= 0) {
			toast.error('Please enter a valid combo price greater than ₹0.')
			return
		}

		const validSlots = slots.filter((s) => s.productId)
		if (validSlots.length === 0) {
			toast.error('Please select at least one specific product for this combo.')
			return
		}

		const formattedProducts = validSlots.map((s) => ({
			product: s.productId,
			label: s.label.trim(),
		}))

		const finalOriginalPrice =
			originalPrice !== '' && Number(originalPrice) > 0
				? Number(originalPrice)
				: selectedSummary.sumMrp > 0
				? selectedSummary.sumMrp
				: Number(comboPrice)

		setBusy(true)
		try {
			const payload: any = {
				name: name.trim(),
				tagline: tagline.trim(),
				company: company.trim() || 'Gomzi Nutrition',
				comboPrice: Number(comboPrice),
				originalPrice: finalOriginalPrice,
				products: formattedProducts,
				status,
			}

			if (editing) {
				requireSuccess(await UpdateComboStackAdmin({ ...payload, id: editing }))
				toast.success('Combo updated successfully')
			} else {
				requireSuccess(await CreateComboStackAdmin(payload))
				toast.success('Combo created successfully')
			}

			setOpen(false)
			await loadStacks()
		} catch (err: any) {
			toast.error(err.message || 'Could not save combo.')
		} finally {
			setBusy(false)
		}
	}

	const toggle = async (stack: ComboStackItem) => {
		setBusy(true)
		try {
			requireSuccess(await UpdateComboStackAdmin({ id: idOf(stack), status: !stack.status }))
			await loadStacks()
		} catch (err: any) {
			toast.error(err.message || 'Could not change visibility.')
		} finally {
			setBusy(false)
		}
	}

	const remove = async (stack: ComboStackItem) => {
		if (!window.confirm(`Permanently delete "${stack.name}"? This cannot be undone.`)) return
		setBusy(true)
		try {
			requireSuccess(await DeleteComboStackAdmin(idOf(stack)))
			toast.success('Combo deleted')
			await loadStacks()
		} catch (err: any) {
			toast.error(err.message || 'Could not delete combo.')
		} finally {
			setBusy(false)
		}
	}

	const move = async (index: number, delta: number) => {
		const next = index + delta
		if (next < 0 || next >= stacks.length) return
		const reordered = [...stacks]
		;[reordered[index], reordered[next]] = [reordered[next], reordered[index]]
		setBusy(true)
		try {
			requireSuccess(await ReorderComboStacksAdmin(reordered))
			await loadStacks()
		} catch (err: any) {
			toast.error(err.message || 'Could not reorder combos.')
		} finally {
			setBusy(false)
		}
	}

	const effectiveSelling = comboPrice !== '' ? Number(comboPrice) : 0
	const effectiveMrp =
		originalPrice !== '' && Number(originalPrice) > 0
			? Number(originalPrice)
			: selectedSummary.sumMrp > 0
			? selectedSummary.sumMrp
			: effectiveSelling
	const previewSavings = effectiveMrp > effectiveSelling ? effectiveMrp - effectiveSelling : 0

	return (
		<>
			<PageTitle>Combo Stacks Management</PageTitle>

			{/* SECTION 1: WEBSITE HEADER CONFIGURATION (Controls website title & eyebrow) */}
			<div className='card shadow-sm mb-6 border-0' style={{ background: '#faf6f2' }}>
				<div className='card-header border-0 pt-4 pb-2 d-flex justify-content-between align-items-center'>
					<div>
						<span className='badge badge-light-primary fw-bold text-uppercase fs-9 px-2 py-1 mb-1'>
							Storefront Section Sync
						</span>
						<h3 className='card-title fw-bolder text-dark fs-4 mb-0'>
							Website Section Headline & Subtitle
						</h3>
					</div>
					<button
						type='button'
						className='btn btn-sm btn-light-primary fw-bold'
						onClick={() => setShowHeaderEditor(!showHeaderEditor)}
					>
						{showHeaderEditor ? 'Hide Settings' : 'Customize Headlines'}
					</button>
				</div>

				{showHeaderEditor && (
					<div className='card-body pt-2'>
						<div className='row g-3'>
							<div className='col-md-3'>
								<label className='form-label fw-bold text-dark fs-7'>Eyebrow Tagline</label>
								<input
									className='form-control form-control-sm'
									placeholder='e.g. BETTER TOGETHER'
									value={headerConfig.eyebrow || ''}
									onChange={(e) => setHeaderConfig({ ...headerConfig, eyebrow: e.target.value })}
								/>
							</div>
							<div className='col-md-4'>
								<label className='form-label fw-bold text-dark fs-7'>Main Section Title</label>
								<input
									className='form-control form-control-sm'
									placeholder='e.g. Your routine. Your stack.'
									value={headerConfig.title || ''}
									onChange={(e) => setHeaderConfig({ ...headerConfig, title: e.target.value })}
								/>
							</div>
							<div className='col-md-5'>
								<label className='form-label fw-bold text-dark fs-7'>Subtitle Description</label>
								<input
									className='form-control form-control-sm'
									placeholder='e.g. Handpicked product essentials at special bundle pricing. Add them in one step.'
									value={headerConfig.subtitle || ''}
									onChange={(e) => setHeaderConfig({ ...headerConfig, subtitle: e.target.value })}
								/>
							</div>
						</div>

						{/* Live Banner Preview Pill */}
						<div className='mt-4 p-3 rounded-3 bg-white border d-flex flex-wrap align-items-center justify-content-between gap-3'>
							<div>
								<span className='text-primary fw-black text-uppercase fs-9 tracking-wider d-block mb-1'>
									{headerConfig.eyebrow || 'BETTER TOGETHER'}
								</span>
								<h4 className='fw-black text-dark mb-0 fs-5'>
									{headerConfig.title || 'Your routine. Your stack.'}
								</h4>
								<p className='text-muted fs-8 mb-0'>
									{headerConfig.subtitle ||
										'Handpicked product essentials at special bundle pricing. Add them in one step.'}
								</p>
							</div>
							<button
								type='button'
								disabled={savingHeader || busy}
								className='btn btn-primary btn-sm fw-bold px-4'
								onClick={saveHeader}
							>
								{savingHeader ? 'Saving…' : 'Save Section Headlines'}
							</button>
						</div>
					</div>
				)}
			</div>

			{/* SECTION 2: COMBO STACKS TABLE */}
			<div className='card shadow-sm border-0'>
				<div className='card-header align-items-center py-5 gap-3 border-0'>
					<div>
						<h2 className='mb-1 fs-3 fw-bolder text-dark'>Combos & Product Stacks</h2>
						<p className='text-muted mb-0 fs-7'>
							Configure custom bundle pricing and choose the exact products shown on the website combo builder.
						</p>
					</div>
					<button className='btn btn-primary fw-bold' disabled={busy} onClick={() => startEdit()}>
						+ Create New Combo
					</button>
				</div>

				<div className='card-body pt-0'>
					{loading ? (
						<p role='status' className='text-muted py-4'>
							Loading combo stacks…
						</p>
					) : error ? (
						<div role='alert' className='alert alert-danger'>
							{error}
							<button className='btn btn-sm btn-light ms-3' onClick={loadStacks}>
								Try again
							</button>
						</div>
					) : !stacks.length ? (
						<p className='text-muted py-4'>
							No combos found. Click "+ Create New Combo" to define your first product stack.
						</p>
					) : (
						<div className='table-responsive'>
							<table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-4'>
								<thead>
									<tr className='fw-bolder text-muted bg-light'>
										<th className='ps-4 min-w-50px rounded-start'>Slot</th>
										<th className='min-w-220px'>Combo Title & Brand</th>
										<th className='min-w-160px'>Custom Combo Pricing</th>
										<th className='min-w-320px'>Included Products (Website Slots)</th>
										<th className='min-w-90px'>Status</th>
										<th className='min-w-140px'>Display Position</th>
										<th className='min-w-160px text-end pe-4 rounded-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{stacks.map((stack, index) => {
										const savings =
											Number(stack.originalPrice || 0) > Number(stack.comboPrice || 0)
												? Number(stack.originalPrice) - Number(stack.comboPrice)
												: 0
										const productList = Array.isArray(stack.products) ? stack.products : []
										const isSlot1 = index === 0 && stack.status !== false
										const isSlot2 = index === 1 && stack.status !== false
										const isMissingProducts = productList.length === 0

										return (
											<tr key={idOf(stack)}>
												<td className='ps-4'>
													<div className='d-flex flex-column align-items-start'>
														<span className='fw-bolder fs-6 text-dark'>{index + 1}</span>
														{isSlot1 && (
															<span
																className='badge badge-success fs-9 fw-bold px-2 py-0.5 mt-1'
																title='Default featured combo on mobile and left side on desktop'
															>
																Combo 01
															</span>
														)}
														{isSlot2 && (
															<span
																className='badge badge-info fs-9 fw-bold px-2 py-0.5 mt-1'
																title='Default complementary combo on right side on desktop'
															>
																Combo 02
															</span>
														)}
													</div>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-dark fw-bolder fs-6'>{stack.name}</span>
														{stack.tagline && (
															<span className='text-muted fs-8 mb-1'>{stack.tagline}</span>
														)}
														<span
															className='badge badge-light-secondary w-auto d-inline-block text-truncate fs-9'
															style={{ maxWidth: 140 }}
														>
															{stack.company || 'Gomzi Nutrition'}
														</span>
													</div>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<div className='d-flex align-items-baseline gap-2'>
															<span className='fs-5 fw-bolder text-primary'>
																₹{Number(stack.comboPrice || 0).toLocaleString('en-IN')}
															</span>
															{Number(stack.originalPrice || 0) > Number(stack.comboPrice || 0) && (
																<del className='text-muted fs-8'>
																	₹{Number(stack.originalPrice).toLocaleString('en-IN')}
																</del>
															)}
														</div>
														{savings > 0 && (
															<span className='text-success fw-bold fs-9'>
																Save ₹{savings.toLocaleString('en-IN')}
															</span>
														)}
													</div>
												</td>
												<td>
													{isMissingProducts ? (
														<div className='alert alert-danger py-1 px-2 d-inline-flex align-items-center gap-2 mb-0 fs-8'>
															<span>⚠️ Missing Products</span>
															<button
																type='button'
																className='btn btn-link btn-color-danger p-0 fs-8 fw-bold text-decoration-underline'
																onClick={() => startEdit(stack)}
															>
																+ Assign Now
															</button>
														</div>
													) : (
														<div className='d-flex flex-column gap-1.5'>
															{productList.map((item: any, pIdx: number) => {
																const pObj = item?.product
																const pName = pObj?.name || item?.label || 'Product'
																const pFlavour = pObj?.flavour ? ` (${pObj.flavour})` : ''
																const pPrice = pObj?.discountPrice || pObj?.price
																const imgUrl = resolveImage(pObj?.displayImages?.[0])

																return (
																	<div key={pIdx} className='d-flex align-items-center gap-2'>
																		{imgUrl && (
																			<img
																				src={imgUrl}
																				alt={pName}
																				className='rounded border object-fit-contain bg-light p-0.5'
																				style={{ width: 24, height: 24 }}
																				onError={(e) => {
																					e.currentTarget.style.display = 'none'
																				}}
																			/>
																		)}
																		<span className='badge badge-light-primary fs-9'>
																			{item.label ? `${item.label}: ` : `Slot 0${pIdx + 1}: `}
																			{pName}
																			{pFlavour}
																		</span>
																		{pPrice && (
																			<span className='text-muted fs-9'>
																				₹{Number(pPrice).toLocaleString('en-IN')}
																			</span>
																		)}
																	</div>
																)
															})}
														</div>
													)}
												</td>
												<td>
													<span
														className={`badge ${
															stack.status ? 'badge-light-success' : 'badge-light-secondary'
														}`}
													>
														{stack.status ? 'Live' : 'Hidden'}
													</span>
												</td>
												<td>
													<div className='d-flex flex-column gap-1'>
														<div className='d-flex gap-1'>
															<button
																className='btn btn-icon btn-sm btn-light'
																disabled={busy || index === 0}
																onClick={() => move(index, -1)}
																title='Move Up'
															>
																↑
															</button>
															<button
																className='btn btn-icon btn-sm btn-light'
																disabled={busy || index === stacks.length - 1}
																onClick={() => move(index, 1)}
																title='Move Down'
															>
																↓
															</button>
														</div>
														<div className='d-flex gap-1 mt-1'>
															{index !== 0 && (
																<button
																	type='button'
																	className='btn btn-xs btn-light-success px-1 py-0 fs-9'
																	onClick={() => setFeaturedSlot(index, 1)}
																	title='Feature as Combo 01 (Home Left & Mobile)'
																>
																	To Combo 1
																</button>
															)}
															{index !== 1 && (
																<button
																	type='button'
																	className='btn btn-xs btn-light-info px-1 py-0 fs-9'
																	onClick={() => setFeaturedSlot(index, 2)}
																	title='Feature as Combo 02 (Home Right)'
																>
																	To Combo 2
																</button>
															)}
														</div>
													</div>
												</td>
												<td className='text-end pe-4'>
													<div className='d-inline-flex gap-2'>
														<button
															className='btn btn-sm btn-light-primary fw-bold'
															disabled={busy}
															onClick={() => startEdit(stack)}
														>
															Edit
														</button>
														<button
															className='btn btn-sm btn-light fw-bold'
															disabled={busy}
															onClick={() => toggle(stack)}
														>
															{stack.status ? 'Hide' : 'Show'}
														</button>
														<button
															className='btn btn-sm btn-light-danger fw-bold'
															disabled={busy}
															onClick={() => remove(stack)}
														>
															Delete
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

			{/* SECTION 3: MODAL WITH LIVE WEBSITE PREVIEW */}
			{open && (
				<div
					className='modal d-block'
					role='dialog'
					aria-modal='true'
					style={{ background: 'rgba(0,0,0,.6)' }}
					onKeyDown={(e) => {
						if (e.key === 'Escape' && !busy) setOpen(false)
					}}
				>
					<div className='modal-dialog modal-fullscreen-xl-down modal-xl modal-dialog-centered modal-dialog-scrollable'>
						<form className='modal-content' onSubmit={save}>
							<div className='modal-header'>
								<div>
									<h2 className='modal-title fs-4 fw-bolder mb-1'>
										{editing ? 'Edit Combo Stack' : 'Create New Combo Stack'}
									</h2>
									<p className='text-muted fs-8 mb-0'>
										Select specific catalog products, assign display slot labels, and set custom bundle pricing.
									</p>
								</div>
								<button
									type='button'
									className='btn-close'
									disabled={busy}
									onClick={() => setOpen(false)}
								/>
							</div>

							<div className='modal-body p-4 p-lg-6'>
								<div className='row g-5'>
									{/* LEFT COLUMN: FORM CONTROLS */}
									<div className='col-xl-7'>
										<div className='row g-4'>
											{/* Basic Info */}
											<div className='col-md-7'>
												<label className='form-label required fw-bold'>
													Combo Title / Stack Name
												</label>
												<input
													autoFocus
													required
													className='form-control'
													placeholder='e.g. Muscle & recovery'
													value={name}
													onChange={(e) => setName(e.target.value)}
												/>
											</div>
											<div className='col-md-5'>
												<label className='form-label fw-bold'>Brand / Company</label>
												<input
													className='form-control'
													placeholder='Gomzi Nutrition'
													value={company}
													onChange={(e) => setCompany(e.target.value)}
												/>
											</div>
											<div className='col-12'>
												<label className='form-label fw-bold'>Tagline / Short Hook</label>
												<input
													className='form-control'
													placeholder='e.g. Post-workout repair & mass support'
													value={tagline}
													onChange={(e) => setTagline(e.target.value)}
												/>
											</div>

											{/* PRICING & SAVINGS SECTION */}
											<div className='col-12'>
												<div
													className='p-4 rounded-3 border border-primary border-dashed'
													style={{ background: '#fdf9f6' }}
												>
													<div className='d-flex justify-content-between align-items-center mb-3'>
														<h5 className='fw-bolder text-primary mb-0'>
															💰 Custom Bundle Pricing & Discount
														</h5>
														{selectedSummary.sumMrp > 0 && (
															<button
																type='button'
																className='btn btn-link btn-color-primary p-0 fs-8 fw-bold'
																onClick={handleAutoFillOriginalPrice}
															>
																Auto-fill Combined MRP (₹
																{selectedSummary.sumMrp.toLocaleString('en-IN')})
															</button>
														)}
													</div>

													<div className='row g-3'>
														<div className='col-md-6'>
															<label className='form-label required fw-bold fs-7'>
																Custom Combo Selling Price (₹)
															</label>
															<input
																required
																type='number'
																min='1'
																step='1'
																className='form-control form-control-solid fw-bolder fs-5 text-primary'
																placeholder='e.g. 6299'
																value={comboPrice}
																onChange={(e) =>
																	setComboPrice(
																		e.target.value === '' ? '' : Number(e.target.value)
																	)
																}
															/>
															<span className='text-muted fs-9'>
																Package price customer pays for all selected components.
															</span>
														</div>

														<div className='col-md-6'>
															<label className='form-label fw-bold fs-7'>
																Original Combined MRP (₹)
															</label>
															<input
																type='number'
																min='0'
																step='1'
																className='form-control'
																placeholder={`e.g. ${selectedSummary.sumMrp || 7498}`}
																value={originalPrice}
																onChange={(e) =>
																	setOriginalPrice(
																		e.target.value === '' ? '' : Number(e.target.value)
																	)
																}
															/>
															<span className='text-muted fs-9'>
																Shown with strikethrough to showcase total customer savings.
															</span>
														</div>
													</div>

													{/* Quick Discount Buttons */}
													<div className='mt-3 pt-3 border-top'>
														<span className='fs-8 fw-bold text-muted me-2'>
															Quick Discounts:
														</span>
														<div className='btn-group btn-group-sm' role='group'>
															{[10, 15, 20, 25, 30].map((pct) => (
																<button
																	key={pct}
																	type='button'
																	className='btn btn-outline-primary btn-sm px-2 py-0.5 fs-8'
																	onClick={() => applyDiscountPercentage(pct)}
																>
																	{pct}% OFF
																</button>
															))}
														</div>
													</div>

													{/* Live Savings Alert */}
													{previewSavings > 0 && (
														<div className='alert alert-success py-2 px-3 mt-3 mb-0 fs-8 d-flex justify-content-between align-items-center'>
															<span>
																🎉 Customer Saves:{' '}
																<strong>₹{previewSavings.toLocaleString('en-IN')}</strong> (
																{Math.round((previewSavings / effectiveMrp) * 100)}% off MRP)
															</span>
															<span className='badge badge-success'>COMBO DEAL APPLIED</span>
														</div>
													)}
												</div>
											</div>

											{/* SPECIFIC PRODUCTS (SLOTS) */}
											<div className='col-12'>
												<div className='d-flex justify-content-between align-items-center mb-2'>
													<div>
														<h5 className='fw-bolder mb-0'>
															Specific Products Included ({slots.length})
														</h5>
														<span className='text-muted fs-8'>
															Usually 2 or 3 essential products per stack.
														</span>
													</div>
													<button
														type='button'
														className='btn btn-sm btn-primary fw-bold'
														onClick={addProductSlot}
													>
														+ Add Product Slot
													</button>
												</div>

												{/* Search & Brand Filter Bar */}
												<div className='d-flex gap-2 mb-3'>
													<input
														type='text'
														className='form-control form-control-sm'
														placeholder='Quick search product by name...'
														value={productSearch}
														onChange={(e) => setProductSearch(e.target.value)}
													/>
													{companies.length > 0 && (
														<select
															className='form-select form-select-sm w-auto'
															value={productFilterCompany}
															onChange={(e) => setProductFilterCompany(e.target.value)}
														>
															<option value='All'>All Brands ({catalogProducts.length})</option>
															{companies.map((c) => (
																<option key={c} value={c}>
																	{c}
																</option>
															))}
														</select>
													)}
												</div>

												{/* Slot Items */}
												<div className='d-flex flex-column gap-3'>
													{slots.map((slot, index) => {
														const selectedProd = catalogProducts.find(
															(p) => p._id === slot.productId
														)

														return (
															<div
																key={index}
																className='p-3 border rounded bg-white shadow-xs d-flex flex-wrap align-items-center gap-3'
															>
																<span className='badge badge-circle badge-primary fs-7'>
																	{index + 1}
																</span>

																{/* Image Preview */}
																{selectedProd?.displayImages?.[0] && (
																	<img
																		src={resolveImage(selectedProd.displayImages[0])}
																		alt={selectedProd.name}
																		className='rounded border object-fit-contain bg-light p-1'
																		style={{ width: 44, height: 44 }}
																		onError={(e) => {
																			e.currentTarget.style.display = 'none'
																		}}
																	/>
																)}

																{/* Product Select */}
																<div className='flex-grow-1' style={{ minWidth: 230 }}>
																	<label className='form-label fs-9 text-muted mb-0'>
																		Catalog Product
																	</label>
																	<select
																		className='form-select form-select-sm'
																		value={slot.productId}
																		onChange={(e) => updateSlotProduct(index, e.target.value)}
																	>
																		<option value=''>-- Select Product --</option>
																		{filteredCatalog.map((prod) => (
																			<option key={prod._id} value={prod._id}>
																				{prod.company ? `[${prod.company}] ` : ''}
																				{prod.name} (₹{prod.discountPrice || prod.price})
																			</option>
																		))}
																	</select>
																</div>

																{/* Display Slot Label */}
																<div style={{ width: 150 }}>
																	<label className='form-label fs-9 text-muted mb-0'>
																		Slot Label on Card
																	</label>
																	<input
																		className='form-control form-control-sm'
																		placeholder='e.g. Whey Protein'
																		value={slot.label}
																		onChange={(e) => updateSlotLabel(index, e.target.value)}
																	/>
																</div>

																{/* Product Price Tag */}
																{selectedProd && (
																	<div className='text-end' style={{ minWidth: 80 }}>
																		<span className='fs-8 fw-bold text-dark d-block'>
																			₹
																			{Number(
																				selectedProd.discountPrice || selectedProd.price
																			).toLocaleString('en-IN')}
																		</span>
																		<span className='fs-9 text-muted'>
																			Stock: {selectedProd.stock ?? 0}
																		</span>
																	</div>
																)}

																{/* Remove button */}
																<div>
																	<button
																		type='button'
																		className='btn btn-sm btn-icon btn-light-danger'
																		onClick={() => removeSlot(index)}
																		title='Remove product from combo'
																		disabled={slots.length <= 1}
																	>
																		✕
																	</button>
																</div>
															</div>
														)
													})}
												</div>
											</div>

											{/* Status toggle */}
											<div className='col-12'>
												<label className='form-check form-switch'>
													<input
														type='checkbox'
														className='form-check-input'
														checked={status}
														onChange={(e) => setStatus(e.target.checked)}
													/>
													<span className='form-check-label fw-bold'>
														Show this combo live on the website
													</span>
												</label>
											</div>
										</div>
									</div>

									{/* RIGHT COLUMN: LIVE WEBSITE PREVIEW MATCHING THE NEW DESIGN */}
									<div className='col-xl-5'>
										<div className='sticky-top' style={{ top: '1rem' }}>
											<div className='d-flex justify-content-between align-items-center mb-2'>
												<span className='badge badge-light-success fs-8 fw-bold px-2 py-1'>
													LIVE STOREFRONT PREVIEW
												</span>
												<span className='text-muted fs-9'>Updates as you type</span>
											</div>

											{/* Storefront Card Shell */}
											<div
												className='p-4 rounded-4 border shadow-sm'
												style={{
													background: '#fcf8f5',
													borderColor: '#e8ded5',
												}}
											>
												{/* Header: COMBO 01 / Brand / Dropdown */}
												<div className='d-flex align-items-center justify-content-between gap-2 mb-3'>
													<div>
														<div className='d-flex align-items-center gap-1 mb-1'>
															<span
																className='fs-9 fw-black text-uppercase px-1.5 py-0.5 rounded'
																style={{
																	background: 'rgba(139, 58, 26, 0.1)',
																	color: '#8b3a1a',
																	fontWeight: 900,
																	fontSize: '10px',
																}}
															>
																COMBO 01
															</span>
															<span
																className='fs-9 text-muted text-uppercase fw-bold'
																style={{ fontSize: '10px' }}
															>
																{company || 'GOMZI NUTRITION'}
															</span>
														</div>
														<h4 className='fw-black text-dark mb-0 fs-5'>
															{name || 'Combo Title'}
														</h4>
													</div>
													<div
														className='border rounded-2 bg-white px-2 py-1 text-muted fs-9 fw-bold'
														style={{ borderColor: '#ddd' }}
													>
														{name || 'Select Combo'} ▾
													</div>
												</div>

												{/* Product Sub-Cards Grid */}
												<div
													className='row g-2 mb-3'
													style={{
														gridTemplateColumns: `repeat(${Math.min(
															Math.max(livePreviewProducts.length, 1),
															3
														)}, 1fr)`,
													}}
												>
													{livePreviewProducts.map((p, idx) => (
														<div
															key={idx}
															className={`col-${
																livePreviewProducts.length === 1
																	? 12
																	: livePreviewProducts.length === 2
																	? 6
																	: 4
															}`}
														>
															<div
																className='p-2 rounded-3 bg-white border h-100 d-flex flex-column justify-content-between'
																style={{ borderColor: '#8b3a1a' }}
															>
																{/* Checkbox & Slot Label */}
																<div className='d-flex justify-content-between align-items-center mb-1'>
																	<span
																		className='fw-bold text-dark text-truncate'
																		style={{ fontSize: '10px' }}
																	>
																		0{idx + 1} / {p.label}
																	</span>
																	<input
																		type='checkbox'
																		checked={true}
																		readOnly
																		className='form-check-input ms-1'
																		style={{ width: 14, height: 14, accentColor: '#8b3a1a' }}
																	/>
																</div>

																{/* Image */}
																<div
																	className='my-1 rounded-2 p-1 d-flex align-items-center justify-content-center'
																	style={{ background: '#faf7f4', height: 80 }}
																>
																	{p.image ? (
																		<img
																			src={p.image}
																			alt={p.name}
																			style={{
																				maxHeight: '100%',
																				maxWidth: '100%',
																				objectFit: 'contain',
																			}}
																		/>
																	) : (
																		<span className='text-muted fs-9'>No Image</span>
																	)}
																</div>

																{/* Product Name */}
																<span
																	className='fw-bold text-dark text-truncate d-block'
																	style={{ fontSize: '11px' }}
																	title={p.name}
																>
																	{p.name}
																</span>

																{/* Flavour & Price */}
																<div
																	className='mt-1 pt-1 border-top'
																	style={{ borderColor: '#f0ece8' }}
																>
																	<span
																		className='text-muted text-truncate d-block'
																		style={{ fontSize: '10px' }}
																	>
																		{p.flavour}
																	</span>
																	<span className='fw-black text-dark d-block fs-7'>
																		₹{p.price.toLocaleString('en-IN')}
																	</span>
																</div>
															</div>
														</div>
													))}
												</div>

												{/* Bottom Bundle Offer Box */}
												<div
													className='rounded-3 p-3 border'
													style={{
														background: '#f5ede6',
														borderColor: '#e5d7cc',
													}}
												>
													<div className='d-flex justify-content-between align-items-center mb-1'>
														<div className='d-flex align-items-center gap-1.5'>
															<span style={{ fontSize: '14px' }}>🛍️</span>
															<span className='fw-bold fs-7 text-dark'>Special Bundle Offer</span>
														</div>
														<span
															className='badge text-white px-2 py-0.5 rounded-pill fs-9 fw-bold'
															style={{ background: '#8b3a1a' }}
														>
															# COMBO DEAL
														</span>
													</div>

													<span className='text-muted fs-9 d-block mb-2'>
														{slots.length} {slots.length === 1 ? 'product' : 'products'}{' '}
														selected · bundled together
													</span>

													<div className='d-flex align-items-baseline gap-2'>
														<span className='fs-3 fw-bolder text-dark'>
															₹{effectiveSelling.toLocaleString('en-IN')}
														</span>
														{effectiveMrp > effectiveSelling && (
															<del className='text-muted fs-8'>
																₹{effectiveMrp.toLocaleString('en-IN')}
															</del>
														)}
													</div>

													{previewSavings > 0 && (
														<span
															className='fw-bold d-block mt-1'
															style={{ color: '#8b3a1a', fontSize: '11px' }}
														>
															Save ₹{previewSavings.toLocaleString('en-IN')} with this combo
															offer!
														</span>
													)}

													{/* Add to cart mock */}
													<button
														type='button'
														className='btn w-100 text-white fw-bold py-2 mt-3 rounded-3 d-flex align-items-center justify-content-center gap-1'
														style={{ background: '#8b3a1a', fontSize: '12px' }}
													>
														+ Add Combo to Cart
													</button>

													<span
														className='d-block text-center mt-2 fw-bold'
														style={{ color: '#8b3a1a', fontSize: '11px' }}
													>
														View your cart →
													</span>

													<p
														className='text-muted text-center mt-2 mb-0'
														style={{ fontSize: '10px' }}
													>
														Direct bundle pricing applied. Verified inventory guaranteed at
														checkout.
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className='modal-footer'>
								<button
									type='button'
									className='btn btn-light'
									disabled={busy}
									onClick={() => setOpen(false)}
								>
									Cancel
								</button>
								<button type='submit' className='btn btn-primary fw-bold' disabled={busy}>
									{busy ? 'Saving…' : 'Save Combo & Prices'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	)
}
