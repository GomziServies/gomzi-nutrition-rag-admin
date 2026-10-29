import { useEffect, useState } from 'react'
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
import { GetCategoriesAdmin } from '../../../Functions/FGGroup'

interface SlotItem {
	category: string
	label: string
}

const DEFAULT_CATEGORIES = [
	'Whey Protein',
	'Creatine Monohydrate',
	'BCAA & Amino Acids',
	'Pre Workout',
	'Mass Gainer',
	'Plant Protein',
	'Wellness & Health',
	'Protein Bars & Snacks',
]

const newStack = (): ComboStackItem => ({
	name: '',
	tagline: '',
	categories: ['Whey Protein', 'Creatine Monohydrate'],
	labels: ['Whey Protein', 'Creatine'],
	order: 0,
	status: true,
})

const idOf = (item: ComboStackItem) => item._id || item.id || ''

const requireSuccess = (response: any) => {
	if (!response || Number(response.status) >= 400) {
		throw new Error(response?.message || 'The request failed. Please try again.')
	}
	return response
}

export default function ComboStackManage() {
	const [stacks, setStacks] = useState<ComboStackItem[]>([])
	const [loading, setLoading] = useState(true)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')
	const [form, setForm] = useState<ComboStackItem>(newStack)
	const [slots, setSlots] = useState<SlotItem[]>([
		{ category: 'Whey Protein', label: 'Whey Protein' },
		{ category: 'Creatine Monohydrate', label: 'Creatine' },
	])
	const [editing, setEditing] = useState<string | null>(null)
	const [open, setOpen] = useState(false)
	const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES)

	const load = async () => {
		setLoading(true)
		setError('')
		try {
			const response: any = requireSuccess(await GetComboStacksAdmin())
			setStacks(Array.isArray(response.data?.comboStacks) ? response.data.comboStacks : [])
		} catch (failure: any) {
			setError(failure.message || 'Could not load combo stacks.')
		} finally {
			setLoading(false)
		}
	}

	const loadCategories = async () => {
		try {
			const res: any = await GetCategoriesAdmin()
			if (res?.data?.categories && Array.isArray(res.data.categories)) {
				const names = res.data.categories.map((c: any) => c.title).filter(Boolean)
				if (names.length > 0) {
					setCategoryOptions(Array.from(new Set([...names, ...DEFAULT_CATEGORIES])))
				}
			}
		} catch (e) {
			// fallback to DEFAULT_CATEGORIES
		}
	}

	useEffect(() => {
		load()
		loadCategories()
	}, [])

	const startEdit = (stack?: ComboStackItem) => {
		setEditing(stack ? idOf(stack) : null)
		const current = stack ? { ...newStack(), ...stack } : newStack()
		setForm(current)

		// Synchronize slots
		const initialSlots: SlotItem[] = (current.categories || []).map((cat, idx) => ({
			category: cat,
			label: current.labels?.[idx] || cat,
		}))
		setSlots(initialSlots.length > 0 ? initialSlots : [{ category: 'Whey Protein', label: 'Whey Protein' }])
		setOpen(true)
	}

	const addSlot = () => {
		const nextCat = categoryOptions.find((c) => !slots.some((s) => s.category === c)) || categoryOptions[0]
		setSlots([...slots, { category: nextCat, label: nextCat }])
	}

	const removeSlot = (index: number) => {
		if (slots.length <= 1) {
			toast.error('A combo stack requires at least 1 category slot.')
			return
		}
		setSlots(slots.filter((_, i) => i !== index))
	}

	const updateSlot = (index: number, field: keyof SlotItem, val: string) => {
		setSlots(
			slots.map((s, i) => {
				if (i !== index) return s
				const updated = { ...s, [field]: val }
				if (field === 'category' && !s.label) {
					updated.label = val
				}
				return updated
			})
		)
	}

	const save = async (event: React.FormEvent) => {
		event.preventDefault()
		if (busy) return
		if (!form.name.trim()) {
			toast.error('Stack name is required.')
			return
		}
		const cleanCategories = slots.map((s) => s.category.trim()).filter(Boolean)
		const cleanLabels = slots.map((s) => s.label.trim() || s.category.trim()).filter(Boolean)

		if (cleanCategories.length === 0) {
			toast.error('Please configure at least one category slot.')
			return
		}

		setBusy(true)
		try {
			const { _id, id, createdAt, updatedAt, ...fields } = form
			const payload = {
				...fields,
				name: form.name.trim(),
				tagline: form.tagline?.trim() || '',
				categories: cleanCategories,
				labels: cleanLabels,
				status: Boolean(form.status),
			}
			requireSuccess(
				editing
					? await UpdateComboStackAdmin({ ...payload, id: editing })
					: await CreateComboStackAdmin(payload)
			)
			toast.success(editing ? 'Combo stack updated' : 'Combo stack created')
			setOpen(false)
			await load()
		} catch (failure: any) {
			toast.error(failure.message || 'Could not save combo stack.')
		} finally {
			setBusy(false)
		}
	}

	const toggle = async (stack: ComboStackItem) => {
		setBusy(true)
		try {
			requireSuccess(await UpdateComboStackAdmin({ id: idOf(stack), status: !stack.status }))
			await load()
		} catch (failure: any) {
			toast.error(failure.message || 'Could not change visibility.')
		} finally {
			setBusy(false)
		}
	}

	const remove = async (stack: ComboStackItem) => {
		if (!window.confirm(`Permanently delete "${stack.name}"? This cannot be undone.`)) return
		setBusy(true)
		try {
			requireSuccess(await DeleteComboStackAdmin(idOf(stack)))
			toast.success('Combo stack deleted')
			await load()
		} catch (failure: any) {
			toast.error(failure.message || 'Could not delete combo stack.')
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
			await load()
		} catch (failure: any) {
			toast.error(failure.message || 'Could not reorder combo stacks.')
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
						<h2 className='mb-2 fs-3 fw-bold'>Homepage Combo Stack Builder</h2>
						<p className='text-muted mb-0'>
							Manage interactive multi-item stacks shown in the "Better together / Your routine. Your stack." homepage section.
						</p>
					</div>
					<button className='btn btn-primary fw-bold' disabled={busy} onClick={() => startEdit()}>
						+ Add Combo Stack
					</button>
				</div>
				<div className='card-body'>
					{loading ? (
						<p role='status' className='text-muted'>Loading combo stacks…</p>
					) : error ? (
						<div role='alert' className='alert alert-danger'>
							{error}
							<button className='btn btn-sm btn-light ms-3' onClick={load}>
								Try again
							</button>
						</div>
					) : !stacks.length ? (
						<p className='text-muted'>No combo stacks found. Click "+ Add Combo Stack" to create your first routine stack.</p>
					) : (
						<div className='table-responsive'>
							<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
								<thead>
									<tr className='fw-bolder text-muted bg-light'>
										<th className='ps-4 min-w-40px rounded-start'>#</th>
										<th className='min-w-180px'>Stack Name & Tagline</th>
										<th className='min-w-260px'>Category Slots & Display Labels</th>
										<th className='min-w-100px'>Status</th>
										<th className='min-w-100px'>Order</th>
										<th className='min-w-180px text-end pe-4 rounded-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{stacks.map((stack, index) => (
										<tr key={idOf(stack)}>
											<td className='ps-4'>
												<span className='fw-bold text-gray-700'>{index + 1}</span>
											</td>
											<td>
												<div className='d-flex flex-column'>
													<span className='text-dark fw-bolder fs-6'>{stack.name}</span>
													{stack.tagline && (
														<span className='text-muted fs-7'>{stack.tagline}</span>
													)}
												</div>
											</td>
											<td>
												<div className='d-flex flex-wrap gap-1'>
													{(stack.categories || []).map((cat, idx) => (
														<span key={idx} className='badge badge-light-primary fs-8'>
															<span className='fw-bold'>{idx + 1}.</span> {cat}{' '}
															{stack.labels?.[idx] && stack.labels[idx] !== cat && (
																<span className='text-muted fst-italic'>({stack.labels[idx]})</span>
															)}
														</span>
													))}
												</div>
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
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

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
					<div className='modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable'>
						<form className='modal-content' onSubmit={save}>
							<div className='modal-header'>
								<h2 className='modal-title fs-4 fw-bolder'>
									{editing ? 'Edit Combo Stack' : 'Create New Combo Stack'}
								</h2>
								<button
									type='button'
									className='btn-close'
									disabled={busy}
									onClick={() => setOpen(false)}
								/>
							</div>
							<div className='modal-body'>
								<div className='row g-4'>
									<div className='col-12'>
										<label className='form-label required fw-bold'>Stack Title / Tab Name</label>
										<input
											autoFocus
											required
											className='form-control'
											placeholder='e.g. Muscle & recovery, Workout essentials'
											value={form.name}
											onChange={(e) => setForm({ ...form, name: e.target.value })}
										/>
									</div>
									<div className='col-12'>
										<label className='form-label fw-bold'>Tagline / Short Subtitle</label>
										<input
											className='form-control'
											placeholder='e.g. Post-workout repair & mass support'
											value={form.tagline || ''}
											onChange={(e) => setForm({ ...form, tagline: e.target.value })}
										/>
									</div>

									{/* Category Slots Builder */}
									<div className='col-12'>
										<div className='d-flex justify-content-between align-items-center mb-2'>
											<label className='form-label fw-bold mb-0'>
												Component Slots ({slots.length})
											</label>
											<button
												type='button'
												className='btn btn-sm btn-light-primary fw-bold'
												onClick={addSlot}
											>
												+ Add Component Slot
											</button>
										</div>
										<p className='text-muted fs-7 mb-3'>
											Each slot fetches an active, in-stock product from the chosen category. Users can customize each slot on the website.
										</p>

										<div className='d-flex flex-column gap-3'>
											{slots.map((slot, index) => (
												<div key={index} className='p-3 border rounded bg-light d-flex flex-wrap align-items-center gap-3'>
													<span className='badge badge-circle badge-primary fs-7'>
														{index + 1}
													</span>
													<div className='flex-grow-1' style={{ minWidth: 200 }}>
														<label className='form-label fs-8 text-muted mb-1'>Target Category</label>
														<select
															className='form-select form-select-sm'
															value={slot.category}
															onChange={(e) => updateSlot(index, 'category', e.target.value)}
														>
															{categoryOptions.map((cat) => (
																<option key={cat} value={cat}>
																	{cat}
																</option>
															))}
														</select>
													</div>
													<div className='flex-grow-1' style={{ minWidth: 160 }}>
														<label className='form-label fs-8 text-muted mb-1'>Display Slot Label</label>
														<input
															className='form-control form-control-sm'
															placeholder='e.g. Whey Protein, Creatine'
															value={slot.label}
															onChange={(e) => updateSlot(index, 'label', e.target.value)}
														/>
													</div>
													<div className='pt-4'>
														<button
															type='button'
															className='btn btn-sm btn-icon btn-light-danger'
															onClick={() => removeSlot(index)}
															title='Remove slot'
															disabled={slots.length <= 1}
														>
															✕
														</button>
													</div>
												</div>
											))}
										</div>
									</div>

									<div className='col-12'>
										<label className='form-check form-switch'>
											<input
												type='checkbox'
												className='form-check-input'
												checked={Boolean(form.status)}
												onChange={(e) => setForm({ ...form, status: e.target.checked })}
											/>
											<span className='form-check-label fw-bold'>
												Show this combo stack live on the website
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
									{busy ? 'Saving…' : 'Save Combo Stack'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	)
}

