import html2canvas from 'html2canvas'
//  PDF Packages
import jsPDF from 'jspdf'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import TableButton from '../../../../components/TableButton'
import { GetGnClient } from '../../../../Functions/FGGroup/GnClients'
import { GetGnProcurement, UpdateGnProcurement } from '../../../../Functions/FGGroup/GnProcurement'
import { GetGnRawMaterialProduct } from '../../../../Functions/FGGroup/GNRawMaterialDetails'

/* ─── Types ─── */
interface IngredientItem {
	_id: string
	ingredient: string
	qty: string
	rate: string
	gst: number
	price: number
}

interface PackingItem {
	_id: string
	material: string
	qty: string
	rate: string
	gst: number
	price: number
}

interface ProductItem {
	_id: string
	item_name: string
	item_weight: number
	item_weight_type: string
	quantity: number
}

interface FormData {
	clientName: string
	clientId: string
}

/* ─── Constants ─── */
const GST_OPTIONS: number[] = [5, 12, 18, 28]

const GNProcurementEdit: React.FC = () => {
	const navigate = useNavigate()
	const contentRef = useRef<HTMLDivElement>(null)
	const [searchParams] = useSearchParams()

	const procurementId = searchParams.get('procurement_id') || searchParams.get('id')

	/* ─── State ─── */
	const [formData, setFormData] = useState<FormData>({ clientName: '', clientId: '' })
	const [orderAmount, setOrderAmount] = useState<string>('0')
	const [transportation, setTransportation] = useState<string>('0')
	const [labour, setLabour] = useState<string>('0')
	const [productItems, setProductItems] = useState<ProductItem[]>([])
	const [ingredientItems, setIngredientItems] = useState<IngredientItem[]>([
		{ _id: '1', ingredient: '', qty: '', rate: '', gst: 18, price: 0 },
	])
	const [packingItems, setPackingItems] = useState<PackingItem[]>([
		{ _id: '1', material: '', qty: '', rate: '', gst: 18, price: 0 },
	])
	const [rawMaterials, setRawMaterials] = useState<any[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchRawMaterials()
	}, [])

	const fetchRawMaterials = async () => {
		try {
			const res = await GetGnRawMaterialProduct({ limit: 1000 })
			if (res.data) {
				setRawMaterials(res.data)
			}
		} catch (error) {
			console.error('Error fetching raw materials:', error)
		}
	}

	useEffect(() => {
		if (procurementId) {
			fetchData(procurementId)
		} else {
			setLoading(false)
		}
	}, [procurementId])

	const fetchData = async (id: string) => {
		setLoading(true)
		try {
			const res = await GetGnProcurement({ id })
			if (res.data) {
				const record = Array.isArray(res.data) ? res.data[0] : res.data

				setIngredientItems(record.ingredientItems || [])
				setPackingItems(record.packingItems || [])
				setTransportation(record.transportation?.toString() || '0')
				setLabour(record.labour?.toString() || '0')
				setOrderAmount(record.orderAmount?.toString() || '0')
				setFormData((prev) => ({ ...prev, clientId: record.clientId }))

				// Fetch client details
				if (record.clientId) {
					const clientRes = await GetGnClient({ id: record.clientId })
					if (clientRes.data) {
						const clientData = Array.isArray(clientRes.data) ? clientRes.data[0] : clientRes.data
						setFormData((prev) => ({ ...prev, clientName: clientData.name }))
						setProductItems(clientData.items || [])
					}
				}
			}
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	/* ─── Calculations ─── */
	const ingredientSubtotal = useMemo(
		() => ingredientItems.reduce((sum, item) => sum + (item.price || 0), 0),
		[ingredientItems]
	)
	const ingredientTotal = ingredientSubtotal

	const packingSubtotal = useMemo(
		() => packingItems.reduce((sum, item) => sum + (item.price || 0), 0),
		[packingItems]
	)

	const packingTotal = useMemo(() => {
		const trans = parseFloat(transportation) || 0
		const lab = parseFloat(labour) || 0
		return packingSubtotal + trans + lab
	}, [packingSubtotal, transportation, labour])

	const totalCost = useMemo(() => ingredientTotal + packingTotal, [ingredientTotal, packingTotal])

	const grossMargin = useMemo(() => {
		const orderAmt = parseFloat(orderAmount) || 0
		return orderAmt - totalCost
	}, [orderAmount, totalCost])

	const totalQty = useMemo(
		() => ingredientItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
		[ingredientItems]
	)

	/* ─── Ingredient handlers ─── */
	const handleIngredientChange = (id: string, field: keyof IngredientItem, value: string) => {
		setIngredientItems((prev) =>
			prev.map((item) => {
				if (item._id !== id) return item
				const updatedItem: IngredientItem = {
					...item,
					[field]: field === 'gst' ? Number(value) : value,
				}
				const qty = parseFloat(field === 'qty' ? value : updatedItem.qty) || 0
				const rate = parseFloat(field === 'rate' ? value : updatedItem.rate) || 0
				const gst = field === 'gst' ? Number(value) : updatedItem.gst
				updatedItem.price = qty * rate * (1 + gst / 100)
				return updatedItem
			})
		)
	}

	const addIngredientItem = () =>
		setIngredientItems((prev) => [
			...prev,
			{ _id: Date.now().toString(), ingredient: '', qty: '', rate: '', gst: 18, price: 0 },
		])

	const deleteIngredientItem = (id: string) => {
		if (ingredientItems.length > 1) setIngredientItems((prev) => prev.filter((i) => i._id !== id))
	}

	/* ─── Packing handlers ─── */
	const handlePackingChange = (id: string, field: keyof PackingItem, value: string) => {
		setPackingItems((prev) =>
			prev.map((item) => {
				if (item._id !== id) return item
				const updatedItem: PackingItem = {
					...item,
					[field]: field === 'gst' ? Number(value) : value,
				}
				const qty = parseFloat(field === 'qty' ? value : updatedItem.qty) || 0
				const rate = parseFloat(field === 'rate' ? value : updatedItem.rate) || 0
				const gst = field === 'gst' ? Number(value) : updatedItem.gst
				updatedItem.price = qty * rate * (1 + gst / 100)
				return updatedItem
			})
		)
	}

	const addPackingItem = () =>
		setPackingItems((prev) => [
			...prev,
			{ _id: Date.now().toString(), material: '', qty: '', rate: '', gst: 18, price: 0 },
		])

	const deletePackingItem = (id: string) => {
		if (packingItems.length > 1) setPackingItems((prev) => prev.filter((i) => i._id !== id))
	}

	const handleSubmit = async () => {
		try {
			const payload = {
				id: procurementId,
				clientId: formData.clientId,
				orderAmount: parseFloat(orderAmount),
				ingredientItems: ingredientItems.map(({ ingredient, qty, rate, gst }) => ({
					ingredient,
					qty: parseFloat(qty) || 0,
					rate: parseFloat(rate) || 0,
					gst: Number(gst) || 0,
				})),
				packingItems: packingItems.map(({ material, qty, rate, gst }) => ({
					material,
					qty: parseFloat(qty) || 0,
					rate: parseFloat(rate) || 0,
					gst: Number(gst) || 0,
				})),
				transportation: parseFloat(transportation),
				labour: parseFloat(labour),
				totalQty,
				totalCost,
				grossMargin,
			}
			const res = await UpdateGnProcurement(payload)
			if (res.status === 200 || res.status === 201) {
				toast.success('Procurement updated successfully')
			} else {
				toast.error(res.message || 'Error updating procurement')
			}
		} catch (error: any) {
			toast.error(error.message || 'Something went wrong')
		}
	}

	/* ─── Generate PDF ─── */
	const generatePDF = async () => {
		if (!contentRef.current) return

		try {
			const canvas = await html2canvas(contentRef.current, {
				scale: 2,
				useCORS: true,
				logging: false,
				ignoreElements: (el) => el.classList.contains('no-pdf'),
			})

			const imgData = canvas.toDataURL('image/png')
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			})

			// Add centered header with client name and order details
			pdf.setFontSize(18)
			pdf.setFont('helvetica', 'bold')
			pdf.text(formData.clientName || 'Procurement', 105, 15, { align: 'center' })

			// Add order details centered - Matching View Page layout
			pdf.setFontSize(12)
			pdf.setFont('helvetica', 'normal')
			let yPos = 25
			if (productItems && productItems.length > 0) {
				let orderPrefix = 'Order – '
				productItems.forEach((p, index: number) => {
					const text = `${index === 0 ? orderPrefix : ' '.repeat(orderPrefix.length - 2)}${
						p.item_name
					} (${p.item_weight} ${p.item_weight_type}): ${p.quantity}`
					pdf.text(text, 105, yPos, { align: 'center' })
					yPos += 6
				})
			}

			// Add horizontal line
			pdf.setLineWidth(0.1)
			pdf.line(15, yPos + 2, 195, yPos + 2)

			// Add the content image below header
			const imgWidth = 210
			const imgHeight = (canvas.height * imgWidth) / canvas.width

			pdf.addImage(imgData, 'PNG', 0, yPos + 5, imgWidth, imgHeight)
			pdf.save(`Procurement_${formData.clientName || 'Edit'}_${Date.now()}.pdf`)
		} catch (error) {
			alert('Failed to generate PDF. Please try again.')
		}
	}

	if (loading) {
		return <div className='p-10 text-center'>Loading...</div>
	}

	/* ─── Styles ─── */
	const inputStyle: React.CSSProperties = {
		width: '100%',
		padding: '10px 12px',
		border: '1px solid #d1d5db',
		borderRadius: '6px',
		outline: 'none',
	}
	const inputStyleSmall: React.CSSProperties = {
		width: '100%',
		padding: '8px 10px',
		border: '1px solid #d1d5db',
		borderRadius: '4px',
		outline: 'none',
	}
	const gstSelectStyle: React.CSSProperties = {
		width: '100%',
		padding: '8px 10px',
		border: '1px solid #d1d5db',
		borderRadius: '4px',
		background: 'white',
		fontWeight: 600,
		outline: 'none',
		fontSize: '13px',
	}

	/* ══════════════ RENDER ══════════════ */
	return (
		<div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
			<PageTitle breadcrumbs={[]}>GN Procurement Edit</PageTitle>

			<style>{`
				input:focus, select:focus, textarea:focus {
					border-color: #000000 !important;
					box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1) !important;
					outline: none !important;
				}
			`}</style>

			<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
				{/* ════════ CLIENT INFO ════════ */}
				<div
					style={{
						background: 'white',
						borderRadius: '6px',
						boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
						padding: '24px',
						marginBottom: '20px',
						border: '1px solid #e5e7eb',
					}}>
					<h2
						style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
						Client Information
					</h2>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr',
							gap: '16px',
							marginBottom: '16px',
						}}>
						<div>
							<label
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									marginBottom: '6px',
								}}>
								Client Name
							</label>
							<input
								type='text'
								name='clientName'
								value={formData.clientName}
								readOnly
								style={{ ...inputStyle, background: '#f3f4f6' }}
							/>
						</div>
					</div>

					{/* Product Fields - Display for info like Add page */}
					<div style={{ marginBottom: '16px' }}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '12px',
							}}>
							<label style={{ fontSize: '14px', fontWeight: '600' }}>Order Products</label>
						</div>

						{productItems.map((item, index) => (
							<div
								key={index}
								style={{
									marginBottom: '12px',
									padding: '16px',
									background: '#f9fafb',
									borderRadius: '6px',
									border: '1px solid #e5e7eb',
								}}>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: '1fr 1fr 1fr 1fr',
										gap: '12px',
										alignItems: 'end',
									}}>
									<div>
										<label
											style={{
												display: 'block',
												fontSize: '13px',
												fontWeight: 600,
												marginBottom: '6px',
											}}>
											Product Name
										</label>
										<input
											type='text'
											value={item.item_name}
											style={{ ...inputStyleSmall, background: '#f3f4f6' }}
											readOnly
										/>
									</div>

									<div>
										<label
											style={{
												display: 'block',
												fontSize: '13px',
												fontWeight: 600,
												marginBottom: '6px',
											}}>
											Quantity
										</label>
										<input
											type='number'
											value={item.quantity}
											style={{ ...inputStyleSmall, background: '#f3f4f6' }}
											readOnly
										/>
									</div>

									<div>
										<label
											style={{
												display: 'block',
												fontSize: '13px',
												fontWeight: 600,
												marginBottom: '6px',
											}}>
											Weight
										</label>
										<input
											type='number'
											value={item.item_weight}
											style={{ ...inputStyleSmall, background: '#f3f4f6' }}
											readOnly
										/>
									</div>

									<div>
										<label
											style={{
												display: 'block',
												fontSize: '13px',
												fontWeight: 600,
												marginBottom: '6px',
											}}>
											Unit
										</label>
										<select
											value={item.item_weight_type}
											style={{ ...gstSelectStyle, background: '#f3f4f6' }}
											disabled>
											<option value='gm'>gm</option>
											<option value='kg'>kg</option>
											<option value='ml'>ml</option>
											<option value='ltr'>ltr</option>
										</select>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* ════════ INGREDIENT ITEMS ════════ */}
				<div
					style={{
						background: 'white',
						borderRadius: '6px',
						boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
						padding: '24px',
						marginBottom: '20px',
						border: '1px solid #e5e7eb',
					}}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '16px',
						}}>
						<h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>Total</h2>
						<TableButton
							action='add'
							onClick={addIngredientItem}
							text='Add Ingredient'
						/>
					</div>
					{ingredientItems.map((item) => (
						<div
							key={item._id}
							style={{
								marginBottom: '12px',
								padding: '16px',
								background: '#f9fafb',
								borderRadius: '6px',
								border: '1px solid #e5e7eb',
							}}>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns:
										ingredientItems.length > 1
											? '1.8fr 1fr 1fr 1fr 1.2fr 40px'
											: '1.8fr 1fr 1fr 1fr 1.2fr',
									gap: '12px',
									alignItems: 'end',
								}}>
								<div>
									<label
										style={{
											display: 'block',
											fontSize: '13px',
											fontWeight: 600,
											marginBottom: '6px',
										}}>
										Ingredient
									</label>
									<input
										type='text'
										value={item.ingredient}
										onChange={(e) => handleIngredientChange(item._id, 'ingredient', e.target.value)}
										style={inputStyleSmall}
										placeholder='e.g., WPC'
									/>
								</div>
								<div>
									<label
										style={{
											display: 'block',
											fontSize: '13px',
											fontWeight: 600,
											marginBottom: '6px',
										}}>
										Qty.
									</label>
									<input
										type='number'
										step='0.01'
										value={item.qty}
										onChange={(e) => handleIngredientChange(item._id, 'qty', e.target.value)}
										style={inputStyleSmall}
										placeholder='9.80'
									/>
								</div>
								<div>
									<label
										style={{
											display: 'block',
											fontSize: '13px',
											fontWeight: 600,
											marginBottom: '6px',
										}}>
										Rate
									</label>
									<input
										type='number'
										step='0.01'
										value={item.rate}
										onChange={(e) => handleIngredientChange(item._id, 'rate', e.target.value)}
										style={inputStyleSmall}
										placeholder='1150'
									/>
								</div>
								<div>
									<label
										style={{
											display: 'block',
											fontSize: '13px',
											fontWeight: 600,
											marginBottom: '6px',
										}}>
										GST %
									</label>
									<select
										value={item.gst}
										onChange={(e) => handleIngredientChange(item._id, 'gst', e.target.value)}
										style={gstSelectStyle}>
										{GST_OPTIONS.map((opt) => (
											<option
												key={opt}
												value={opt}>
												{opt}%
											</option>
										))}
									</select>
								</div>
								<div>
									<label
										style={{
											display: 'block',
											fontSize: '13px',
											fontWeight: 600,
											marginBottom: '6px',
										}}>
										Price (incl. GST)
									</label>
									<input
										type='text'
										value={item.price.toFixed(2)}
										readOnly
										style={{ ...inputStyleSmall, background: '#f3f4f6', fontWeight: 700 }}
									/>
								</div>
								{ingredientItems.length > 1 && (
									<div>
										<TableButton
											action='remove'
											onClick={() => deleteIngredientItem(item._id)}
										/>
									</div>
								)}
							</div>
						</div>
					))}
				</div>

				{/* ════════ PACKING ITEMS ════════ */}
				<div
					style={{
						background: 'white',
						borderRadius: '6px',
						boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
						padding: '24px',
						marginBottom: '20px',
						border: '1px solid #e5e7eb',
					}}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '16px',
						}}>
						<h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
							Packing costing
						</h2>
						<TableButton
							action='add'
							onClick={addPackingItem}
							text='Add Material'
						/>
					</div>
					{packingItems.map((item) => (
						<div
							key={item._id}
							style={{
								marginBottom: '12px',
								padding: '16px',
								background: '#f9fafb',
								borderRadius: '6px',
								border: '1px solid #e5e7eb',
							}}>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns:
										packingItems.length > 1
											? '1.8fr 1fr 1fr 1fr 1.2fr 40px'
											: '1.8fr 1fr 1fr 1fr 1.2fr',
									gap: '12px',
									alignItems: 'end',
								}}>
								<div>
									<label
										style={{
											display: 'block',
											fontSize: '13px',
											fontWeight: 600,
											marginBottom: '6px',
										}}>
										Material
									</label>
									<select
										value={item.material}
										onChange={(e) => handlePackingChange(item._id, 'material', e.target.value)}
										style={{ ...inputStyleSmall, background: 'white' }}>
										<option value=''>Select Material</option>
										{rawMaterials
											.filter((mat: any) => mat.unit === 'pcs')
											.map((mat: any) => (
												<option
													key={mat._id}
													value={mat.name}>
													{mat.name}
												</option>
											))}
									</select>
								</div>
								<div>
									<label
										style={{
											display: 'block',
											fontSize: '13px',
											fontWeight: 600,
											marginBottom: '6px',
										}}>
										Qty
									</label>
									<input
										type='number'
										step='0.01'
										value={item.qty}
										onChange={(e) => handlePackingChange(item._id, 'qty', e.target.value)}
										style={inputStyleSmall}
										placeholder='25'
									/>
								</div>
								<div>
									<label
										style={{
											display: 'block',
											fontSize: '13px',
											fontWeight: 600,
											marginBottom: '6px',
										}}>
										Rate
									</label>
									<input
										type='number'
										step='0.01'
										value={item.rate}
										onChange={(e) => handlePackingChange(item._id, 'rate', e.target.value)}
										style={inputStyleSmall}
										placeholder='41'
									/>
								</div>
								<div>
									<label
										style={{
											display: 'block',
											fontSize: '13px',
											fontWeight: 600,
											marginBottom: '6px',
										}}>
										GST %
									</label>
									<select
										value={item.gst}
										onChange={(e) => handlePackingChange(item._id, 'gst', e.target.value)}
										style={gstSelectStyle}>
										{GST_OPTIONS.map((opt) => (
											<option
												key={opt}
												value={opt}>
												{opt}%
											</option>
										))}
									</select>
								</div>
								<div>
									<label
										style={{
											display: 'block',
											fontSize: '13px',
											fontWeight: 600,
											marginBottom: '6px',
										}}>
										Price (incl. GST)
									</label>
									<input
										type='text'
										value={item.price.toFixed(2)}
										readOnly
										style={{ ...inputStyleSmall, background: '#f3f4f6', fontWeight: 700 }}
									/>
								</div>
								{packingItems.length > 1 && (
									<div>
										<TableButton
											action='remove'
											onClick={() => deletePackingItem(item._id)}
										/>
									</div>
								)}
							</div>
						</div>
					))}

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '16px',
							marginTop: '16px',
						}}>
						<div>
							<label
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: 600,
									marginBottom: '6px',
								}}>
								Transportation Cost
							</label>
							<input
								type='number'
								step='0.01'
								value={transportation}
								onChange={(e) => setTransportation(e.target.value)}
								style={inputStyle}
								placeholder='1000'
							/>
						</div>
						<div>
							<label
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: 600,
									marginBottom: '6px',
								}}>
								Labour Cost
							</label>
							<input
								type='number'
								step='0.01'
								value={labour}
								onChange={(e) => setLabour(e.target.value)}
								style={inputStyle}
								placeholder='500'
							/>
						</div>
					</div>
					{/* Order Amount */}
					<div style={{ marginTop: '16px' }}>
						<label
							style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
							Order Amount
						</label>
						<input
							type='number'
							step='0.01'
							value={orderAmount}
							onChange={(e) => setOrderAmount(e.target.value)}
							style={inputStyle}
							placeholder='37420'
						/>
					</div>
				</div>

				{/* ════════ PREVIEW – INGREDIENT TABLE ════════ */}
				<div ref={contentRef}>
					<div
						style={{
							background: 'white',
							borderRadius: '6px',
							boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
							padding: '24px',
							marginBottom: '20px',
							border: '1px solid #e5e7eb',
						}}>
						<h2
							style={{ fontSize: '18px', fontWeight: 700, color: '#000000', marginBottom: '16px' }}>
							<span className='no-pdf'>Preview - </span>Total
						</h2>
						<div style={{ overflowX: 'auto' }}>
							<table
								style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
								<thead>
									<tr style={{ backgroundColor: 'rgb(225, 227, 234)', color: '#000' }}>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Ingredient
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Qty.
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Rate
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											GST
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Price (incl. GST)
										</th>
									</tr>
								</thead>
								<tbody>
									{ingredientItems.map((item) => (
										<tr key={item._id}>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.ingredient || '-'}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.qty || '-'}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.rate || '-'}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{item.gst}%</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 700 }}>
												₹ {item.price.toFixed(2)}
											</td>
										</tr>
									))}
									<tr style={{ background: '#f3f4f6' }}>
										<td style={{ border: '1px solid #d1d5db', padding: '10px' }}></td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 900 }}>
											{totalQty.toFixed(2)}
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px' }}></td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px' }}></td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 900 }}>
											₹ {ingredientSubtotal.toFixed(2)}
										</td>
									</tr>
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: 900,
											}}>
											Total
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 900 }}>
											₹ {ingredientTotal.toFixed(2)}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					{/* ════════ PREVIEW – PACKING TABLE ════════ */}
					<div
						style={{
							background: 'white',
							borderRadius: '6px',
							boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
							padding: '24px',
							marginBottom: '20px',
							border: '1px solid #e5e7eb',
						}}>
						<h2
							style={{ fontSize: '18px', fontWeight: 700, color: '#000000', marginBottom: '16px' }}>
							<span className='no-pdf'>Preview - </span>Packing costing
						</h2>
						<div style={{ overflowX: 'auto' }}>
							<table
								style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
								<thead>
									<tr style={{ backgroundColor: 'rgb(225, 227, 234)', color: '#000' }}>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Material
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Qty
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Rate
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											GST
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Price (incl. GST)
										</th>
									</tr>
								</thead>
								<tbody>
									{packingItems.map((item) => (
										<tr key={item._id}>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.material || '-'}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.qty || '-'}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.rate || '-'}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{item.gst}%</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 700 }}>
												₹ {item.price.toFixed(2)}
											</td>
										</tr>
									))}
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: 900,
											}}>
											Subtotal
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 900 }}>
											₹ {packingSubtotal.toFixed(2)}
										</td>
									</tr>
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: 900,
											}}>
											Transportation
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 900 }}>
											₹ {(parseFloat(transportation) || 0).toFixed(2)}
										</td>
									</tr>
									{/* Labour */}
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: 900,
											}}>
											Labour
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 900 }}>
											₹ {(parseFloat(labour) || 0).toFixed(2)}
										</td>
									</tr>
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: 900,
											}}>
											Total Cost
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 900 }}>
											₹ {totalCost.toFixed(2)}
										</td>
									</tr>
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: 900,
											}}>
											Order amount
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 900 }}>
											₹ {(parseFloat(orderAmount) || 0).toFixed(2)}
										</td>
									</tr>
									<tr style={{ background: '#f3f4f6', color: '#000' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: 900,
											}}>
											Profit
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: 900 }}>
											₹ {grossMargin.toFixed(2)}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* ════════ ACTIONS ════════ */}
				<div
					style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
					<button
						onClick={() => navigate(`/rag/inventory/view/list?clientId=${formData.clientId}`)}
						className='btn btn-light'>
						Cancel
					</button>
					<button
						onClick={generatePDF}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							background: '#6c757d',
							color: 'white',
							padding: '12px 24px',
							borderRadius: '6px',
							border: 'none',
							cursor: 'pointer',
							fontWeight: 700,
							fontSize: '15px',
						}}>
						<i
							className='bi bi-printer'
							style={{ fontSize: '18px', color: 'white' }}></i>
						Print
					</button>
					<button
						onClick={handleSubmit}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							background: '#009ef7',
							color: 'white',
							padding: '12px 24px',
							borderRadius: '6px',
							border: 'none',
							cursor: 'pointer',
							fontWeight: 700,
							fontSize: '15px',
						}}>
						<i
							className='bi bi-check-circle'
							style={{ fontSize: '18px', color: 'white' }}></i>
						Submit
					</button>
				</div>
			</div>
		</div>
	)
}

export default GNProcurementEdit
