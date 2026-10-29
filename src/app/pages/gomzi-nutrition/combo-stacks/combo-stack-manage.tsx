import React, { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	ComboStackItem,
	GetComboStacksAdmin,
	CreateComboStackAdmin,
	UpdateComboStackAdmin,
	DeleteComboStackAdmin,
	ReorderComboStacksAdmin,
} from '../../../Functions/FGGroup/ComboStack'
import { GetProduct, GetCompaniesAdmin, CompanyItem } from '../../../Functions/FGGroup'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'

interface ProductOption {
	_id: string
	name: string
	company?: string
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

export default function ComboStackManage() {
	const [stacks, setStacks] = useState<ComboStackItem[]>([])
	const [catalogProducts, setCatalogProducts] = useState<ProductOption[]>([])
	const [companies, setCompanies] = useState<string[]>([])
	const [loading, setLoading] = useState(true)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')

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
	const [productFilterCompany, setProductFilterCompany] = useState('All')

	const loadStacks = async () => {
		setLoading(true)
		setError('')
		try {
			const res: any = requireSuccess(await GetComboStacksAdmin())
			setStacks(Array.isArray(res.data?.comboStacks) ? res.data.comboStacks : [])
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

				// Unique company list from products
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

	// Filtered catalog options in modal based on company filter
	const filteredCatalog = useMemo(() => {
		if (productFilterCompany === 'All') return catalogProducts
		return catalogProducts.filter((p) => (p.company || '').toLowerCase() === productFilterCompany.toLowerCase())
	}, [catalogProducts, productFilterCompany])

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

	const startEdit = (stack?: ComboStackItem) => {
		if (stack) {
			setEditing(idOf(stack))
			setName(stack.name)
			setTagline(stack.tagline || '')
			setCompany(stack.company || 'Gomzi Nutrition')
			setComboPrice(stack.comboPrice ?? '')
			setOriginalPrice(stack.originalPrice ?? '')
			setStatus(stack.status !== false)

			// Populate slots
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
				catalogProducts.length >= 2
					? [
							{ productId: catalogProducts[0]._id, label: 'Component 1' },
							{ productId: catalogProducts[1]._id, label: 'Component 2' },
					  ]
					: []
			)
		}
		setOpen(true)
	}

	const addProductSlot = () => {
		const nextUnused = filteredCatalog.find((p) => !slots.some((s) => s.productId === p._id)) || filteredCatalog[0]
		if (nextUnused) {
			setSlots([...slots, { productId: nextUnused._id, label: '' }])
		} else if (catalogProducts[0]) {
			setSlots([...slots, { productId: catalogProducts[0]._id, label: '' }])
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
				return {
					...s,
					productId: newProductId,
					label: s.label || found?.name || '',
				}
			})
		)
	}

	const updateSlotLabel = (index: number, newLabel: string) => {
		setSlots(
			slots.map((s, i) => (i === index ? { ...s, label: newLabel } : s))
		)
	}

	// Auto-fill original price from items MRP if left empty
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

	return (
		<>
			<PageTitle>Combo Stacks Management</PageTitle>
			<div className='card shadow-sm'>
				<div className='card-header align-items-center py-5 gap-3'>
					<div>
						<h2 className='mb-2 fs-3 fw-bold'>Specific Product Combos & Stacks</h2>
						<p className='text-muted mb-0'>
							Select specific company products and set exact custom combo pricing (different from individual discount prices) for the website combo builder.
						</p>
					</div>
					<button className='btn btn-primary fw-bold' disabled={busy} onClick={() => startEdit()}>
						+ Create New Combo
					</button>
				</div>
				<div className='card-body'>
					{loading ? (
						<p role='status' className='text-muted'>Loading combo stacks…</p>
					) : error ? (
						<div role='alert' className='alert alert-danger'>
							{error}
							<button className='btn btn-sm btn-light ms-3' onClick={loadStacks}>
								Try again
							</button>
						</div>
					) : !stacks.length ? (
						<p className='text-muted'>No combos found. Click "+ Create New Combo" to define your first product stack.</p>
					) : (
						<div className='table-responsive'>
							<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
								<thead>
									<tr className='fw-bolder text-muted bg-light'>
										<th className='ps-4 min-w-40px rounded-start'>#</th>
										<th className='min-w-200px'>Combo Title & Brand</th>
										<th className='min-w-160px'>Custom Combo Pricing</th>
										<th className='min-w-280px'>Included Specific Products</th>
										<th className='min-w-90px'>Status</th>
										<th className='min-w-90px'>Order</th>
										<th className='min-w-180px text-end pe-4 rounded-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{stacks.map((stack, index) => {
										const savings =
											Number(stack.originalPrice || 0) > Number(stack.comboPrice || 0)
												? Number(stack.originalPrice) - Number(stack.comboPrice)
												: 0
										const productList = Array.isArray(stack.products) ? stack.products : []

										return (
											<tr key={idOf(stack)}>
												<td className='ps-4'>
													<span className='fw-bold text-gray-700'>{index + 1}</span>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-dark fw-bolder fs-6'>{stack.name}</span>
														{stack.tagline && <span className='text-muted fs-7 mb-1'>{stack.tagline}</span>}
														<span className='badge badge-light-info w-auto d-inline-block text-truncate fs-8' style={{ maxWidth: 140 }}>
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
																<del className='text-muted fs-7'>
																	₹{Number(stack.originalPrice).toLocaleString('en-IN')}
																</del>
															)}
														</div>
														{savings > 0 && (
															<span className='text-success fw-bold fs-8'>
																Save ₹{savings.toLocaleString('en-IN')}
															</span>
														)}
													</div>
												</td>
												<td>
													{productList.length > 0 ? (
														<div className='d-flex flex-column gap-1'>
															{productList.map((item: any, pIdx: number) => {
																const pObj = item?.product
																const pName = pObj?.name || item?.label || 'Product'
																const pPrice = pObj?.discountPrice || pObj?.price
																const pCompany = pObj?.company ? `[${pObj.company}] ` : ''

																return (
																	<div key={pIdx} className='d-flex align-items-center gap-2'>
																		<span className='badge badge-light-primary fs-8'>
																			{pIdx + 1}. {pCompany}{pName}
																		</span>
																		{pPrice && (
																			<span className='text-muted fs-9'>
																				(₹{Number(pPrice).toLocaleString('en-IN')})
																			</span>
																		)}
																	</div>
																)
															})}
														</div>
													) : stack.categories?.length ? (
														<div className='d-flex flex-wrap gap-1'>
															{stack.categories.map((c, cIdx) => (
																<span key={cIdx} className='badge badge-light-secondary fs-8'>
																	{c}
																</span>
															))}
														</div>
													) : (
														<span className='text-muted fs-8'>No products configured</span>
													)}
												</td>
												<td>
													<span
														className={`badge ${
															stack.status ? 'badge-light-success' : 'badge-light-secondary'
														}`}
													>
														{stack.status ? 'Active' : 'Hidden'}
													</span>
												</td>
												<td>
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

			{/* Modal: Add / Edit Combo */}
			{open && (
				<div
					className='modal d-block'
					role='dialog'
					aria-modal='true'
					style={{ background: 'rgba(0,0,0,.5)' }}
					onKeyDown={(e) => {
						if (e.key === 'Escape' && !busy) setOpen(false)
					}}
				>
					<div className='modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable'>
						<form className='modal-content' onSubmit={save}>
							<div className='modal-header'>
								<div>
									<h2 className='modal-title fs-4 fw-bolder mb-1'>
										{editing ? 'Edit Combo Stack' : 'Create New Specific Product Combo'}
									</h2>
									<p className='text-muted fs-7 mb-0'>
										Set an explicit bundle price and select the exact products included in this combo.
									</p>
								</div>
								<button
									type='button'
									className='btn-close'
									disabled={busy}
									onClick={() => setOpen(false)}
								/>
							</div>
							<div className='modal-body'>
								<div className='row g-4'>
									{/* Basic Details */}
									<div className='col-md-6'>
										<label className='form-label required fw-bold'>Combo Title / Stack Name</label>
										<input
											autoFocus
											required
											className='form-control'
											placeholder='e.g. Gomzi Ultimate Muscle & Shred Stack'
											value={name}
											onChange={(e) => setName(e.target.value)}
										/>
									</div>
									<div className='col-md-6'>
										<label className='form-label fw-bold'>Brand / Company</label>
										<input
											className='form-control'
											placeholder='Gomzi Nutrition'
											value={company}
											onChange={(e) => setCompany(e.target.value)}
										/>
									</div>
									<div className='col-12'>
										<label className='form-label fw-bold'>Tagline / Short Selling Proposition</label>
										<input
											className='form-control'
											placeholder='e.g. Whey 1kg + BCAA 250g + Ignite Fat Burner'
											value={tagline}
											onChange={(e) => setTagline(e.target.value)}
										/>
									</div>

									{/* PRICING SECTION */}
									<div className='col-12'>
										<div className='p-4 border rounded bg-light-primary border-primary border-dashed'>
											<h4 className='fw-bolder text-primary mb-3'>💰 Custom Combo Bundle Pricing</h4>
											<div className='row g-3'>
												<div className='col-md-6'>
													<label className='form-label required fw-bold'>
														Custom Combo Selling Price (₹)
													</label>
													<input
														required
														type='number'
														min='1'
														step='1'
														className='form-control form-control-solid fw-bolder fs-5 text-primary'
														placeholder='e.g. 4499'
														value={comboPrice}
														onChange={(e) =>
															setComboPrice(e.target.value === '' ? '' : Number(e.target.value))
														}
													/>
													<span className='text-muted fs-8'>
														This is the special package price charged for all components combined.
													</span>
												</div>
												<div className='col-md-6'>
													<div className='d-flex justify-content-between align-items-center mb-1'>
														<label className='form-label fw-bold mb-0'>
															Original / Combined MRP (₹)
														</label>
														{selectedSummary.sumMrp > 0 && (
															<button
																type='button'
																className='btn btn-link btn-color-primary p-0 fs-8 fw-bold'
																onClick={handleAutoFillOriginalPrice}
															>
																Auto-fill sum (₹{selectedSummary.sumMrp})
															</button>
														)}
													</div>
													<input
														type='number'
														min='0'
														step='1'
														className='form-control'
														placeholder={`e.g. ${selectedSummary.sumMrp || 5999}`}
														value={originalPrice}
														onChange={(e) =>
															setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))
														}
													/>
													<span className='text-muted fs-8'>
														Displayed with strikethrough to showcase total savings.
													</span>
												</div>
											</div>

											{/* Live Pricing Breakdown */}
											<div className='mt-3 pt-3 border-top d-flex flex-wrap gap-4 align-items-center'>
												<div className='fs-7 text-gray-700'>
													Items Combined MRP:{' '}
													<strong className='text-dark'>
														₹{selectedSummary.sumMrp.toLocaleString('en-IN')}
													</strong>
												</div>
												<div className='fs-7 text-gray-700'>
													Items Individual Discounts:{' '}
													<strong className='text-dark'>
														₹{selectedSummary.sumSelling.toLocaleString('en-IN')}
													</strong>
												</div>
												{comboPrice !== '' &&
													originalPrice !== '' &&
													Number(originalPrice) > Number(comboPrice) && (
														<div className='badge badge-success fs-7 fw-bolder'>
															Combo Deal Savings: ₹
															{(Number(originalPrice) - Number(comboPrice)).toLocaleString('en-IN')}
														</div>
													)}
											</div>
										</div>
									</div>

									{/* SPECIFIC PRODUCTS SECTION */}
									<div className='col-12'>
										<div className='d-flex justify-content-between align-items-center mb-2'>
											<div>
												<h4 className='fw-bolder mb-0'>
													Specific Products Included in this Combo ({slots.length})
												</h4>
												<p className='text-muted fs-8 mb-0'>
													Select the exact catalog products (not generic categories).
												</p>
											</div>
											<div className='d-flex gap-2 align-items-center'>
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
												<button
													type='button'
													className='btn btn-sm btn-primary fw-bold'
													onClick={addProductSlot}
												>
													+ Add Product Slot
												</button>
											</div>
										</div>

										<div className='d-flex flex-column gap-3 mt-3'>
											{slots.map((slot, index) => {
												const selectedProd = catalogProducts.find((p) => p._id === slot.productId)

												return (
													<div
														key={index}
														className='p-3 border rounded bg-white shadow-xs d-flex flex-wrap align-items-center gap-3'
													>
														<span className='badge badge-circle badge-primary fs-7'>
															{index + 1}
														</span>

														{/* Image Thumbnail Preview */}
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

														{/* Product Dropdown */}
														<div className='flex-grow-1' style={{ minWidth: 260 }}>
															<label className='form-label fs-8 text-muted mb-1'>
																Choose Specific Product
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

														{/* Slot Display Label */}
														<div style={{ width: 180 }}>
															<label className='form-label fs-8 text-muted mb-1'>
																Display Slot Label
															</label>
															<input
																className='form-control form-control-sm'
																placeholder='e.g. Whey Protein, Intra'
																value={slot.label}
																onChange={(e) => updateSlotLabel(index, e.target.value)}
															/>
														</div>

														{/* Product Price Tag */}
														{selectedProd && (
															<div className='pt-3 text-end' style={{ minWidth: 100 }}>
																<span className='fs-7 fw-bold text-dark d-block'>
																	₹{Number(selectedProd.discountPrice || selectedProd.price).toLocaleString('en-IN')}
																</span>
																<span className='fs-9 text-muted'>
																	Stock: {selectedProd.stock ?? 0}
																</span>
															</div>
														)}

														{/* Remove button */}
														<div className='pt-3'>
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

									{/* Status */}
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
