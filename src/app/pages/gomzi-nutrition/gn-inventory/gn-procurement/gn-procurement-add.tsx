import html2canvas from 'html2canvas'
//  PDF Packages
import jsPDF from 'jspdf'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import TableButton from '../../../../components/TableButton'
import { GetGnClient } from '../../../../Functions/FGGroup/GnClients'
import { AddGnProcurement } from '../../../../Functions/FGGroup/GnProcurement'
import { GetGnRawMaterialProduct } from '../../../../Functions/FGGroup/GNRawMaterialDetails'

/* Ingredient Item Types */
interface IngredientItem {
	id: string
	ingredient: string
	qty: string
	rate: string
	gst: number
	price: number
}

/* Packing Material Types */
interface PackingItem {
	id: string
	material: string
	qty: string
	rate: string
	gst: number
	price: number
}

/*  Product Item Types */
interface ProductItem {
	id: string
	productName: string
	productQty: string
	productWeight: string
	productWeightType: string
}

interface FormData {
	clientName: string
	clientId: string
	item_id: string
}

const GST_OPTIONS = [5, 12, 18, 28]

const GNProcurementAdd: React.FC = () => {
	const navigate = useNavigate()
	const contentRef = useRef<HTMLDivElement>(null)
	const [searchParams] = useSearchParams()

	const [formData, setFormData] = useState<FormData>({
		clientName: '',
		clientId: '',
		item_id: `PROC-${Date.now()}`,
	})

	const [rawMaterials, setRawMaterials] = useState<any[]>([])

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
		const clientId = searchParams.get('clientId')
		if (clientId) {
			setFormData((prev) => ({ ...prev, clientId }))
			fetchClient(clientId)
		}
	}, [searchParams])

	const fetchClient = async (id: string) => {
		try {
			const res = await GetGnClient({ id })
			if (res.data) {
				const client = Array.isArray(res.data) ? res.data[0] : res.data
				setFormData((prev) => ({ ...prev, clientName: client.name || '' }))

				if (client.items && Array.isArray(client.items)) {
					const mappedProducts: ProductItem[] = client.items.map((item: any, index: number) => ({
						id: item._id || (Date.now() + index).toString(),
						productName: item.item_name || '',
						productQty: item.quantity?.toString() || '0',
						productWeight: item.item_weight?.toString() || '0',
						productWeightType: item.item_weight_type || 'gm',
					}))
					setProductItems(mappedProducts)
				}
			}
		} catch (error) {
			console.error('Error fetching client:', error)
		}
	}

	const [orderAmount, setOrderAmount] = useState<string>('0')

	const [productItems, setProductItems] = useState<ProductItem[]>([
		{ id: '1', productName: '', productQty: '', productWeight: '', productWeightType: 'gm' },
	])

	const [ingredientItems, setIngredientItems] = useState<IngredientItem[]>([
		{ id: '1', ingredient: '', qty: '', rate: '', gst: 18, price: 0 },
	])

	const [packingItems, setPackingItems] = useState<PackingItem[]>([
		{ id: '1', material: '', qty: '', rate: '', gst: 18, price: 0 },
	])

	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData({ ...formData, [name]: value })
	}

	const handleProductChange = (id: string, field: keyof ProductItem, value: string) => {
		setProductItems((prev) =>
			prev.map((item) => {
				if (item.id !== id) return item
				return { ...item, [field]: value }
			})
		)
	}

	/*
	 *  Ingredient Calculations
	 *  price already includes GST, so subtotal = total
	 *  ======================= */
	const ingredientSubtotal = useMemo(() => {
		return ingredientItems.reduce((sum, item) => sum + (item.price || 0), 0)
	}, [ingredientItems])

	// ingredientTotal = subtotal (GST already in price)
	const ingredientTotal = ingredientSubtotal

	/** =======================
	 *  Packing Calculations
	 *  price already includes GST, so subtotal = total (+ transportation)
	 *  ======================= */
	const packingSubtotal = useMemo(() => {
		return packingItems.reduce((sum, item) => sum + (item.price || 0), 0)
	}, [packingItems])

	const [transportation, setTransportation] = useState<string>('0')
	const [labour, setLabour] = useState<string>('0')

	const packingTotal = useMemo(() => {
		const trans = parseFloat(transportation) || 0
		const lab = parseFloat(labour) || 0
		return packingSubtotal + trans + lab
	}, [packingSubtotal, transportation, labour])

	/** =======================
	 *  ✅ Grand Total Calculations
	 *  Total Cost = Ingredient Total + Packing Total
	 *  ======================= */
	const totalCost = useMemo(() => {
		return ingredientTotal + packingTotal
	}, [ingredientTotal, packingTotal])

	const grossMargin = useMemo(() => {
		const orderAmt = parseFloat(orderAmount) || 0
		return orderAmt - totalCost
	}, [orderAmount, totalCost])

	const marginPercentage = useMemo(() => {
		const orderAmt = parseFloat(orderAmount) || 0
		if (orderAmt === 0) return 0
		return (grossMargin / orderAmt) * 100
	}, [grossMargin, orderAmount])

	// ✅ Total Qty calculation
	const totalQty = useMemo(() => {
		return ingredientItems.reduce((sum, item) => {
			const qty = Number(item.qty) || 0
			return sum + qty
		}, 0)
	}, [ingredientItems])

	/** =======================
	 *  Ingredient handlers
	 *  ======================= */
	const handleIngredientChange = (id: string, field: keyof IngredientItem, value: string) => {
		setIngredientItems((prev) =>
			prev.map((item) => {
				if (item.id !== id) return item

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

	const addIngredientItem = () => {
		const newItem: IngredientItem = {
			id: Date.now().toString(),
			ingredient: '',
			qty: '',
			rate: '',
			gst: 18,
			price: 0,
		}
		setIngredientItems((prev) => [...prev, newItem])
	}

	const deleteIngredientItem = (id: string) => {
		if (ingredientItems.length > 1) {
			setIngredientItems((prev) => prev.filter((i) => i.id !== id))
		}
	}

	const handlePackingChange = (id: string, field: keyof PackingItem, value: string) => {
		setPackingItems((prev) =>
			prev.map((item) => {
				if (item.id !== id) return item

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

	const addPackingItem = () => {
		const newItem: PackingItem = {
			id: Date.now().toString(),
			material: '',
			qty: '',
			rate: '',
			gst: 18,
			price: 0,
		}
		setPackingItems((prev) => [...prev, newItem])
	}

	const deletePackingItem = (id: string) => {
		if (packingItems.length > 1) {
			setPackingItems((prev) => prev.filter((i) => i.id !== id))
		}
	}

	const handleSubmit = async () => {
		try {
			const payload = {
				clientId: formData.clientId,
				orderAmount: parseFloat(orderAmount) || 0,
				transportation: parseFloat(transportation) || 0,
				labour: parseFloat(labour) || 0,
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
			}

			const res = await AddGnProcurement(payload)
			if (res.status === 200 || res.status === 201 || res.status) {
				toast.success('Procurement added successfully')
			} else {
				toast.error(res.message || 'Failed to add procurement')
			}
		} catch (error: any) {
			toast.error(error?.message || 'Something went wrong')
		}
	}

	/* Generate PDF */
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

			pdf.setFontSize(18)
			pdf.setFont('helvetica', 'bold')
			pdf.text(formData.clientName || 'Procurement', 105, 15, { align: 'center' })

			pdf.setFontSize(12)
			pdf.setFont('helvetica', 'normal')
			let yPos = 25
			if (productItems && productItems.length > 0) {
				let orderPrefix = 'Order – '
				productItems.forEach((p, index: number) => {
					const text = `${index === 0 ? orderPrefix : ' '.repeat(orderPrefix.length - 2)}${
						p.productName
					} (${p.productWeight} ${p.productWeightType}): ${p.productQty}`
					pdf.text(text, 105, yPos, { align: 'center' })
					yPos += 6
				})
			}

			pdf.setLineWidth(0.1)
			pdf.line(15, yPos + 2, 195, yPos + 2)

			const imgWidth = 210
			const imgHeight = (canvas.height * imgWidth) / canvas.width

			pdf.addImage(imgData, 'PNG', 0, yPos + 5, imgWidth, imgHeight)
			pdf.save(`Procurement_${formData.clientName || 'Add'}_${Date.now()}.pdf`)
		} catch (error) {
			alert('Failed to generate PDF. Please try again.')
		}
	}

	//  Input style with focus border
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

	//  Shared GST select style (per-row)
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

	return (
		<div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
			<PageTitle breadcrumbs={[]}>GN Procurement Add</PageTitle>

			{/* ✅ Global CSS for input focus */}
			<style>
				{`
					input:focus, select:focus, textarea:focus {
						border-color: #000000 !important;
						box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1) !important;
						outline: none !important;
					}
				`}
			</style>

			<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
				{/* Client Info */}
				<div
					style={{
						background: 'white',
						borderRadius: '6px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
								onChange={handleFormChange}
								style={{ ...inputStyle, background: '#f3f4f6' }}
								placeholder='Enter client name'
								readOnly
							/>
						</div>
					</div>

					{/* ✅ Dynamic Product Fields */}
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

						{productItems.map((item) => (
							<div
								key={item.id}
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
											value={item.productName}
											onChange={(e) => handleProductChange(item.id, 'productName', e.target.value)}
											style={{ ...inputStyleSmall, background: '#f3f4f6' }}
											placeholder='e.g., Whey Protein'
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
											value={item.productQty}
											onChange={(e) => handleProductChange(item.id, 'productQty', e.target.value)}
											style={{ ...inputStyleSmall, background: '#f3f4f6' }}
											placeholder='e.g., 20'
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
											value={item.productWeight}
											onChange={(e) =>
												handleProductChange(item.id, 'productWeight', e.target.value)
											}
											style={{ ...inputStyleSmall, background: '#f3f4f6' }}
											placeholder='e.g., 500'
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
											value={item.productWeightType}
											onChange={(e) =>
												handleProductChange(item.id, 'productWeightType', e.target.value)
											}
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

				{/* ✅ Ingredient Items Section — per-row GST, no global GST dropdown */}
				<div
					style={{
						background: 'white',
						borderRadius: '6px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
							key={item.id}
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
								{/* Ingredient Name */}
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
										onChange={(e) => handleIngredientChange(item.id, 'ingredient', e.target.value)}
										style={inputStyleSmall}
										placeholder='e.g., WPC'
									/>
								</div>

								{/* Qty */}
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
										onChange={(e) => handleIngredientChange(item.id, 'qty', e.target.value)}
										style={inputStyleSmall}
										placeholder='9.80'
									/>
								</div>

								{/* Rate */}
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
										onChange={(e) => handleIngredientChange(item.id, 'rate', e.target.value)}
										style={inputStyleSmall}
										placeholder='1150'
									/>
								</div>

								{/* GST % — per row dropdown */}
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
										onChange={(e) => handleIngredientChange(item.id, 'gst', e.target.value)}
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

								{/* Price (incl. GST) — readonly */}
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
										style={{
											...inputStyleSmall,
											background: '#f3f4f6',
											fontWeight: 700,
										}}
									/>
								</div>

								{/* Delete btn */}
								{ingredientItems.length > 1 && (
									<div>
										<TableButton
											action='remove'
											onClick={() => deleteIngredientItem(item.id)}
										/>
									</div>
								)}
							</div>
						</div>
					))}
				</div>

				{/* ✅ Packing Items Section — per-row GST, no global GST dropdown */}
				<div
					style={{
						background: 'white',
						borderRadius: '6px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
							key={item.id}
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
								{/* Material Selection Dropdown */}
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
										onChange={(e) => handlePackingChange(item.id, 'material', e.target.value)}
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

								{/* Qty */}
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
										onChange={(e) => handlePackingChange(item.id, 'qty', e.target.value)}
										style={inputStyleSmall}
										placeholder='25'
									/>
								</div>

								{/* Rate */}
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
										onChange={(e) => handlePackingChange(item.id, 'rate', e.target.value)}
										style={inputStyleSmall}
										placeholder='41'
									/>
								</div>

								{/* GST % — per row dropdown */}
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
										onChange={(e) => handlePackingChange(item.id, 'gst', e.target.value)}
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

								{/* Price (incl. GST) — readonly */}
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
										style={{
											...inputStyleSmall,
											background: '#f3f4f6',
											fontWeight: 700,
										}}
									/>
								</div>

								{/* Delete btn */}
								{packingItems.length > 1 && (
									<div>
										<TableButton
											action='remove'
											onClick={() => deletePackingItem(item.id)}
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

					{/* ✅ Order Amount Field */}
					<div style={{ marginTop: '16px' }}>
						<label
							style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
							Order Amount
						</label>
						<input
							type='number'
							// step="0.01"
							value={orderAmount}
							onChange={(e) => setOrderAmount(e.target.value)}
							style={inputStyle}
							placeholder='37420'
						/>
					</div>
				</div>

				{/* ✅ PREVIEW Sections Wrapper for PDF */}
				<div ref={contentRef}>
					{/* ✅ PREVIEW - Total Section (Ingredient) */}
					<div
						style={{
							background: 'white',
							borderRadius: '6px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
										<tr key={item.id}>
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
									{/* Subtotal row — Total Qty + Subtotal price */}
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

					{/* ✅ PREVIEW - Packing Section */}
					<div
						style={{
							background: 'white',
							borderRadius: '6px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
										<tr key={item.id}>
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
									{/* Subtotal */}
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
									{/* Transportation */}
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
											₹ {parseFloat(transportation || '0').toFixed(2)}
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
											₹ {parseFloat(labour || '0').toFixed(2)}
										</td>
									</tr>
									{/* Total Cost */}
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
									{/* Order Amount */}
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
											₹ {parseFloat(orderAmount || '0').toFixed(2)}
										</td>
									</tr>
									{/* Profit */}
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

				{/* Actions */}
				<div
					style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
					<button
						onClick={() => navigate(`/rag/inventory/view/list?clientId=${formData.clientId}`)}
						className='btn btn-light btn-light-soft'>
						Cancel
					</button>
					<button
						onClick={async () => {
							await generatePDF()
						}}
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

export default GNProcurementAdd
