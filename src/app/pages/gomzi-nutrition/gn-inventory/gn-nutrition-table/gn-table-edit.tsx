import html2canvas from 'html2canvas'
// ✅ PDF Packages
import jsPDF from 'jspdf'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import TableButton from '../../../../components/TableButton'
import { GetGnFormulation, UpdateGnFormulation } from '../../../../Functions/FGGroup/GnFormulation'

/*  Nutrition Types */
interface NutritionItem {
	id: string
	itemName: string
	weightPerScoop: string
	weightPer100g: string
	rda: string
}

/*  Amino Profile Types */
interface AminoItem {
	id: string
	title: string
	weight: string
	unit: string
}

interface AminoCategory {
	id: string
	heading: string
	weight?: string
	unit?: string
	items: AminoItem[]
	showWeightUnit: boolean
}

interface FormData {
	clientName: string
	productName: string
	scoopSize: string
}

interface EditDataType {
	_id: string
	client_name: string
	product_name: string
	scoop_size?: string
	nutrition_items?: any[]
	amino_profile?: any[]
	createdAt?: string
}

interface LocationState {
	editData?: EditDataType
}

const GnTablePriceEdit: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const [searchParams] = useSearchParams()
	const editData = (location.state as LocationState)?.editData

	// ✅ Get formulation_id from URL
	const formulation_id = searchParams.get('formulation_id')

	const [isLoading, setIsLoading] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [clientId, setClientId] = useState<string>('')

	const UNIT_OPTIONS = ['mg', 'g', 'mcg', 'IU'] as const

	/*  Form State */
	const [formData, setFormData] = useState<FormData>({
		clientName: editData?.client_name || 'Fitness Pro Gym',
		productName: editData?.product_name || 'Whey Protein Isolate',
		scoopSize: editData?.scoop_size || '35',
	})

	/*  Nutrition Items State */
	const [nutritionItems, setNutritionItems] = useState<NutritionItem[]>(
		editData?.nutrition_items && editData?.nutrition_items.length > 0
			? editData.nutrition_items.map((it: any, idx: number) => ({
					id: (idx + 1).toString(),
					itemName: it.itemName || it.item_name || '',
					weightPerScoop: it.weightPerScoop || it.weight_per_scoop || '',
					weightPer100g: it.weightPer100g || it.weight_per_100g || '',
					rda: it.rda || '',
			  }))
			: [
					{
						id: '1',
						itemName: 'Energy (kcal)',
						weightPerScoop: '139.44',
						weightPer100g: '398.40',
						rda: '6.97',
					},
					{ id: '2', itemName: 'Protein', weightPerScoop: '25', weightPer100g: '71.43', rda: '50' },
					{
						id: '3',
						itemName: 'Carbohydrates',
						weightPerScoop: '3',
						weightPer100g: '8.57',
						rda: '1',
					},
			  ]
	)

	/*  Amino Profile State */
	const [categories, setCategories] = useState<AminoCategory[]>(
		editData?.amino_profile && editData?.amino_profile.length > 0
			? editData.amino_profile.map((cat: any, idx: number) => ({
					id: cat.id || `cat-${Date.now()}-${idx}`,
					heading: cat.heading || '',
					weight: cat.weight || '',
					unit: cat.unit || 'mg',
					items: Array.isArray(cat.items)
						? cat.items.map((it: any, iidx: number) => ({
								id: it.id || `item-${Date.now()}-${iidx}`,
								title: it.title || '',
								weight: it.weight || '',
								unit: it.unit || 'mg',
						  }))
						: [],

					showWeightUnit:
						typeof cat.showWeightUnit === 'boolean'
							? cat.showWeightUnit
							: (cat.items?.length || 0) > 0,
			  }))
			: []
	)

	const [showAmino, setShowAmino] = useState<boolean>((editData?.amino_profile?.length || 0) > 0)

	useEffect(() => {
		if (!formulation_id) {
			toast.error('Formulation ID is missing')
			return
		}

		const fetchFormulationData = async () => {
			setIsLoading(true)
			try {
				const response: FGGroupAPIResponse = await GetGnFormulation({ id: formulation_id })

				if (response?.data && !Array.isArray(response.data)) {
					const data = response.data

					setFormData({
						clientName: data.clientName || '',
						productName: data.productName || '',
						scoopSize: data.scoopSize?.toString() || '35',
					})
					setClientId(data.clientId || '')

					if (data.nutritionItems && Array.isArray(data.nutritionItems)) {
						setNutritionItems(
							data.nutritionItems.map((item: any, idx: number) => ({
								id: (idx + 1).toString(),
								itemName: item.itemName || '',
								weightPerScoop: item.weight35gm?.toString() || '',
								weightPer100g: item.weight100gm?.toString() || '',
								rda: item.rda?.toString() || '',
							}))
						)
					}

					if (
						data.aminoAcidProfile &&
						Array.isArray(data.aminoAcidProfile) &&
						data.aminoAcidProfile.length > 0
					) {
						setShowAmino(true)
						setCategories(
							data.aminoAcidProfile.map((cat: any, idx: number) => ({
								id: cat._id || `cat-${Date.now()}-${idx}`,
								heading: cat.title || '',
								weight: cat.value?.toString() || '',
								unit: cat.unit || 'mg',
								items: Array.isArray(cat.items)
									? cat.items.map((it: any, iidx: number) => ({
											id: it._id || `item-${Date.now()}-${iidx}`,
											title: it.name || '',
											weight: it.value?.toString() || '',
											unit: it.unit || 'mg',
									  }))
									: [],
								showWeightUnit: Array.isArray(cat.items) && cat.items.length > 0,
							}))
						)
					}
				} else if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
					const data = response.data[0]

					setFormData({
						clientName: data.clientName || '',
						productName: data.productName || '',
						scoopSize: data.scoopSize?.toString() || '35',
					})
					setClientId(data.clientId || '')

					if (data.nutritionItems && Array.isArray(data.nutritionItems)) {
						setNutritionItems(
							data.nutritionItems.map((item: any, idx: number) => ({
								id: (idx + 1).toString(),
								itemName: item.itemName || '',
								weightPerScoop: item.weight35gm?.toString() || '',
								weightPer100g: item.weight100gm?.toString() || '',
								rda: item.rda?.toString() || '',
							}))
						)
					}

					if (
						data.aminoAcidProfile &&
						Array.isArray(data.aminoAcidProfile) &&
						data.aminoAcidProfile.length > 0
					) {
						setShowAmino(true)
						setCategories(
							data.aminoAcidProfile.map((cat: any, idx: number) => ({
								id: cat._id || `cat-${Date.now()}-${idx}`,
								heading: cat.title || '',
								weight: cat.value?.toString() || '',
								unit: cat.unit || 'mg',
								items: Array.isArray(cat.items)
									? cat.items.map((it: any, iidx: number) => ({
											id: it._id || `item-${Date.now()}-${iidx}`,
											title: it.name || '',
											weight: it.value?.toString() || '',
											unit: it.unit || 'mg',
									  }))
									: [],
								showWeightUnit: Array.isArray(cat.items) && cat.items.length > 0,
							}))
						)
					}
				} else {
					toast.error('Formulation data not found')
				}
			} catch (error: any) {
				toast.error(error?.message || 'Failed to load formulation data')
			} finally {
				setIsLoading(false)
			}
		}

		fetchFormulationData()
	}, [formulation_id])

	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData({ ...formData, [name]: value })
	}

	const formatRDA = (value: string) => {
		const v = (value || '').trim()
		if (!v) return '-'
		return v.includes('%') ? v : `${v}%`
	}

	const hasAminoData = useMemo(() => {
		if (!showAmino) return false
		if (!categories || categories.length === 0) return false

		return categories.some((c) => {
			const hasHeading = (c.heading || '').trim() !== ''
			const hasWeight = (c.weight || '').toString().trim() !== ''
			const hasItems = c.items && c.items.length > 0
			return hasHeading || hasWeight || hasItems
		})
	}, [categories, showAmino])

	const handleNutritionItemChange = (id: string, field: keyof NutritionItem, value: string) => {
		setNutritionItems((prev) =>
			prev.map((item) => {
				if (item.id !== id) return item

				const updatedItem: NutritionItem = { ...item, [field]: value }

				// ✅ auto-calc per 100g based on scoopSize
				if (field === 'weightPerScoop') {
					const scoopWeight = parseFloat(value) || 0
					const scoopSize = parseFloat(formData.scoopSize) || 1
					const per100g = (scoopWeight / scoopSize) * 100
					updatedItem.weightPer100g = isFinite(per100g) ? per100g.toFixed(2) : ''
				}

				return updatedItem
			})
		)
	}

	const addNutritionItem = () => {
		const newItem: NutritionItem = {
			id: Date.now().toString(),
			itemName: '',
			weightPerScoop: '',
			weightPer100g: '',
			rda: '',
		}
		setNutritionItems((prev) => [...prev, newItem])
	}

	const deleteNutritionItem = (id: string) => {
		if (nutritionItems.length > 1) {
			setNutritionItems((prev) => prev.filter((i) => i.id !== id))
		}
	}

	const addCategory = () => {
		const newCategory: AminoCategory = {
			id: `cat-${Date.now()}`,
			heading: 'New Category Heading',
			weight: '',
			unit: 'mg',
			items: [],
			showWeightUnit: false,
		}
		setCategories((prev) => [...prev, newCategory])
	}

	const deleteCategory = (categoryId: string) => {
		setCategories((prev) => {
			const updated = prev.filter((c) => c.id !== categoryId)

			if (updated.length === 0) {
				setShowAmino(false)
			}
			return updated
		})
	}

	const updateCategoryHeading = (categoryId: string, heading: string) => {
		setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, heading } : c)))
	}

	const updateCategoryField = (categoryId: string, field: 'weight' | 'unit', value: string) => {
		setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, [field]: value } : c)))
	}

	const toggleWeightUnit = (categoryId: string) => {
		setCategories((prev) =>
			prev.map((c) => {
				if (c.id !== categoryId) return c
				const next = !c.showWeightUnit
				return { ...c, showWeightUnit: next }
			})
		)
	}

	const addItemToCategory = (categoryId: string) => {
		setCategories((prev) =>
			prev.map((c) => {
				if (c.id !== categoryId) return c
				const newItem: AminoItem = { id: `item-${Date.now()}`, title: '', weight: '', unit: 'mg' }
				return { ...c, items: [...c.items, newItem] }
			})
		)
	}

	const deleteItemFromCategory = (categoryId: string, itemId: string) => {
		setCategories((prev) =>
			prev.map((c) => {
				if (c.id !== categoryId) return c
				const updatedItems = c.items.filter((i) => i.id !== itemId)
				return { ...c, items: updatedItems }
			})
		)
	}

	const updateItem = (
		categoryId: string,
		itemId: string,
		field: keyof AminoItem,
		value: string
	) => {
		setCategories((prev) =>
			prev.map((c) => {
				if (c.id !== categoryId) return c
				return {
					...c,
					items: c.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
				}
			})
		)
	}

	/*  Download PDF & Submit */
	const handleDownloadAndSubmit = async () => {
		if (!formulation_id) {
			toast.error('Formulation ID is missing')
			return
		}

		if (!formData.scoopSize || parseFloat(formData.scoopSize) <= 0) {
			toast.error('Please enter a valid scoop size')
			return
		}

		if (nutritionItems.length === 0) {
			toast.error('Please add at least one nutrition item')
			return
		}

		setIsSubmitting(true)
		try {
			const nutritionItemsPayload = nutritionItems.map((item) => ({
				itemName: item.itemName,
				weight35gm: parseFloat(item.weightPerScoop) || 0,
				weight100gm: parseFloat(item.weightPer100g) || 0,
				rda: parseFloat(item.rda) || 0,
			}))

			const aminoAcidProfilePayload = categories
				.filter((cat) => cat.heading.trim() !== '')
				.map((cat) => ({
					title: cat.heading,
					...(cat.items.length > 0
						? {
								items: cat.items.map((item) => ({
									name: item.title,
									value: parseFloat(item.weight) || 0,
									unit: item.unit || 'mg',
								})),
						  }
						: {
								value: parseFloat(cat.weight || '0') || 0,
								unit: cat.unit || 'mg',
						  }),
				}))

			//  update payload
			const updatePayload = {
				formulation_id: formulation_id,
				scoopSize: parseFloat(formData.scoopSize),
				nutritionItems: nutritionItemsPayload,
				...(aminoAcidProfilePayload.length > 0 && { aminoAcidProfile: aminoAcidProfilePayload }),
			}

			const response: FGGroupAPIResponse = await UpdateGnFormulation(updatePayload)

			if (response?.status === 200) {
				toast.success('Formulation updated successfully!')

				await generatePDFInternal()

				setTimeout(() => {
					navigate(
						clientId ? `/rag/inventory/view/list?clientId=${clientId}` : '/rag/inventory/view/list'
					)
				}, 1000)
			} else {
				toast.error(response?.message || 'Failed to update formulation')
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to update formulation ❌')
		} finally {
			setIsSubmitting(false)
		}
	}

	/* Generate PDF Internal Function */
	const generatePDFInternal = async () => {
		const aminoSectionHTML = hasAminoData
			? `
        <div class="sectionTitle">Amino Acid Profile</div>
        <table>
          <tbody>
            ${categories
							.map((cat) => {
								const categoryRow = `
                  <tr class="categoryRow">
                    <td colspan="2">
                      <div class="catRowFlex">
                        <div class="catName">${cat.heading || '-----'}</div>
                        ${
													cat.items.length === 0 && !cat.showWeightUnit
														? `<div class="catValue">${cat.weight || '-'} ${
																cat.unit ? cat.unit : ''
														  }</div>`
														: ``
												}
                      </div>
                    </td>
                  </tr>
                `

								const itemRows =
									cat.items.length > 0
										? cat.items
												.map(
													(it) => `
                      <tr>
                        <td>${it.title || '-'}</td>
                        <td style="font-weight:700; text-align:right;">
                          ${it.weight || '-'} ${it.unit ? it.unit : ''}
                        </td>
                      </tr>
                    `
												)
												.join('')
										: ''

								return categoryRow + itemRows
							})
							.join('')}
          </tbody>
        </table>
      `
			: ``

		const htmlContent = `
      <div id="pdf-root">
        <div class="topHeader">
          <h1>${formData.productName || 'Nutrition Report'}</h1>
        </div>

        <div class="sectionTitle">Formulation Table</div>
        <table>
          <thead>
            <tr>
              <th style="width:40%;">Nutrients</th>
              <th style="width:20%;">Per ${formData.scoopSize || '__'}g</th>
              <th style="width:20%;">Per 100g</th>
              <th style="width:20%;">%RDA</th>
            </tr>
          </thead>
          <tbody>
            ${nutritionItems
							.map(
								(item) => `
              <tr>
                <td style="font-weight:700;">${item.itemName || '-'}</td>
                <td>${item.weightPerScoop || '-'}</td>
                <td>${item.weightPer100g || '-'}</td>
                <td>${formatRDA(item.rda)}</td>
              </tr>
            `
							)
							.join('')}
          </tbody>
        </table>

        ${aminoSectionHTML}
      </div>
    `

		const wrapper = document.createElement('div')
		wrapper.style.position = 'fixed'
		wrapper.style.left = '-9999px'
		wrapper.style.top = '0'
		wrapper.style.width = '794px'
		wrapper.style.background = '#fff'
		wrapper.innerHTML = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        #pdf-root {
          padding: 18px;
          background: #fff;
          color: #111827;
        }

        .topHeader {
          text-align: center;
          margin-bottom: 14px;
          border-bottom: 1px solid #111827;
          padding-bottom: 10px;
        }

        .topHeader h1 {
          font-size: 16px;
          font-weight: 900;
          color: #000;
          margin-bottom: 4px;
        }

        .smallTime{
          font-size: 10px;
          font-weight: 600;
          color: #374151;
        }

        .sectionTitle {
          font-size: 14px;
          font-weight: 900;
          color: #000;
          margin-top: 14px;
          margin-bottom: 8px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #d1d5db;
          margin-bottom: 14px;
        }

        th {
          background: #e1e3ea;
          color: #000000;
          padding: 10px 12px;
          font-size: 11px;
          text-align: left;
          border: 1px solid #d1d5db;
          font-weight: 700;
        }

        td {
          padding: 10px 12px;
          font-size: 11px;
          border: 1px solid #d1d5db;
          color: #111827;
        }

        .categoryRow td {
          font-weight: 700;
          border: 1px solid #d1d5db;
          background: #e1e3ea;
          color: #000000;
        }
        .catRowFlex{
          display:flex;
          justify-content: space-between;
          align-items:center;
        }

        .catName{
          font-weight: 800;
        }

        .catValue{
          font-weight: 800;
        }
      </style>

      ${htmlContent}
    `

		document.body.appendChild(wrapper)

		try {
			const canvas = await html2canvas(wrapper, {
				scale: 2,
				useCORS: true,
				backgroundColor: '#ffffff',
			})

			const imgData = canvas.toDataURL('image/JPEG', 1.0)

			const pdf = new jsPDF('p', 'mm', 'a4')
			const pdfWidth = pdf.internal.pageSize.getWidth()
			const pdfHeight = pdf.internal.pageSize.getHeight()

			const imgWidth = pdfWidth
			const imgHeight = (canvas.height * imgWidth) / canvas.width

			let heightLeft = imgHeight
			let position = 0

			pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
			heightLeft -= pdfHeight

			while (heightLeft > 0) {
				position = heightLeft - imgHeight
				pdf.addPage()
				pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
				heightLeft -= pdfHeight
			}

			pdf.save(`${formData.productName || 'Formulation_Report'}.pdf`)
		} catch (error) {
			alert('PDF Generate failed ❌')
		} finally {
			document.body.removeChild(wrapper)
		}
	}

	return (
		<div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
			<PageTitle breadcrumbs={[]}>Formulation Table Edit</PageTitle>

			{isLoading ? (
				<div
					style={{
						maxWidth: '1200px',
						margin: '0 auto',
						textAlign: 'center',
						paddingTop: '100px',
					}}>
					<div
						className='spinner-border text-primary'
						role='status'
						style={{ width: '3rem', height: '3rem' }}>
						<span className='visually-hidden'>Loading...</span>
					</div>
					<p style={{ marginTop: '20px', fontSize: '16px', color: '#6c757d' }}>
						Loading formulation data...
					</p>
				</div>
			) : (
				<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
					{/* Product Info */}
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
							style={{
								fontSize: '18px',
								fontWeight: '700',
								color: '#111827',
								marginBottom: '16px',
							}}>
							Information
						</h2>

						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
									disabled
									style={{
										width: '100%',
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										backgroundColor: '#f3f4f6',
										cursor: 'not-allowed',
										color: '#6b7280',
									}}
								/>
							</div>

							<div>
								<label
									style={{
										display: 'block',
										fontSize: '14px',
										fontWeight: '600',
										marginBottom: '6px',
									}}>
									Product Name
								</label>
								<input
									type='text'
									name='productName'
									value={formData.productName}
									readOnly
									disabled
									style={{
										width: '100%',
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										backgroundColor: '#f3f4f6',
										cursor: 'not-allowed',
										color: '#6b7280',
									}}
								/>
							</div>

							<div>
								<label
									style={{
										display: 'block',
										fontSize: '14px',
										fontWeight: '600',
										marginBottom: '6px',
									}}>
									Scoop Size (gm)
								</label>
								<input
									type='number'
									name='scoopSize'
									value={formData.scoopSize}
									onChange={handleFormChange}
									style={{
										width: '100%',
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
									}}
								/>
							</div>
						</div>
					</div>

					{/* Nutrition Items */}
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
								Nutrition Items
							</h2>
							<TableButton
								action='add'
								onClick={addNutritionItem}
								text='Add Nutrition Item'
							/>
						</div>

						{nutritionItems.map((item) => (
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
											nutritionItems.length > 1 ? '1fr 1fr 1fr 1fr 40px' : '1fr 1fr 1fr 1fr',
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
											Item Name
										</label>
										<input
											type='text'
											value={item.itemName}
											onChange={(e) =>
												handleNutritionItemChange(item.id, 'itemName', e.target.value)
											}
											style={{
												width: '100%',
												padding: '8px 10px',
												border: '1px solid #d1d5db',
												borderRadius: '4px',
											}}
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
											Per {formData.scoopSize || '__'}g
										</label>
										<input
											type='number'
											step='0.01'
											value={item.weightPerScoop}
											onChange={(e) =>
												handleNutritionItemChange(item.id, 'weightPerScoop', e.target.value)
											}
											style={{
												width: '100%',
												padding: '8px 10px',
												border: '1px solid #d1d5db',
												borderRadius: '4px',
											}}
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
											Per 100g
										</label>
										<input
											type='number'
											step='0.01'
											value={item.weightPer100g}
											onChange={(e) =>
												handleNutritionItemChange(item.id, 'weightPer100g', e.target.value)
											}
											style={{
												width: '100%',
												padding: '8px 10px',
												border: '1px solid #d1d5db',
												borderRadius: '4px',
											}}
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
											%RDA
										</label>
										<input
											type='number'
											value={item.rda}
											onChange={(e) => handleNutritionItemChange(item.id, 'rda', e.target.value)}
											style={{
												width: '100%',
												padding: '8px 10px',
												border: '1px solid #d1d5db',
												borderRadius: '4px',
											}}
										/>
									</div>

									{nutritionItems.length > 1 && (
										<div>
											<TableButton
												action='remove'
												onClick={() => deleteNutritionItem(item.id)}
											/>
										</div>
									)}
								</div>
							</div>
						))}
					</div>

					{/* Add Amino */}
					{!showAmino && (
						<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
							<button
								onClick={() => {
									setShowAmino(true)
									if (categories.length === 0) addCategory()
								}}
								style={{
									background: '#009ef7',
									color: 'white',
									border: 'none',
									padding: '10px 16px',
									borderRadius: '6px',
									cursor: 'pointer',
									fontWeight: 700,
								}}>
								+ Add Amino Acid Profile
							</button>
						</div>
					)}

					{/* Amino Categories */}
					{showAmino && (
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
									Amino Acid Profile
								</h2>
								<TableButton
									action='add'
									onClick={addCategory}
									text='Add Category'
								/>
							</div>

							{categories.map((cat) => (
								<div
									key={cat.id}
									style={{
										marginBottom: '16px',
										padding: '16px',
										background: '#f9fafb',
										borderRadius: '6px',
										border: '1px solid #e5e7eb',
									}}>
									<div
										style={{
											display: 'flex',
											gap: '10px',
											alignItems: 'center',
											marginBottom: '12px',
										}}>
										<input
											type='text'
											value={cat.heading}
											onChange={(e) => updateCategoryHeading(cat.id, e.target.value)}
											style={{
												flex: 1,
												padding: '10px 12px',
												border: '1px solid #d1d5db',
												borderRadius: '6px',
												fontSize: '14px',
												fontWeight: 700,
											}}
										/>

										{/* ✅ OFF = Value Mode => show Weight + Unit */}
										{!cat.showWeightUnit && (
											<>
												<input
													type='number'
													value={cat.weight || ''}
													onChange={(e) => updateCategoryField(cat.id, 'weight', e.target.value)}
													style={{
														width: '160px',
														padding: '10px 12px',
														border: '1px solid #d1d5db',
														borderRadius: '6px',
														fontSize: '14px',
														fontWeight: 700,
													}}
													placeholder='Weight'
												/>

												<select
													value={cat.unit || 'mg'}
													onChange={(e) => updateCategoryField(cat.id, 'unit', e.target.value)}
													style={{
														width: '120px',
														padding: '10px 12px',
														border: '1px solid #d1d5db',
														borderRadius: '6px',
														fontSize: '14px',
														fontWeight: 700,
														background: 'white',
													}}>
													{UNIT_OPTIONS.map((u) => (
														<option
															key={u}
															value={u}>
															{u}
														</option>
													))}
												</select>
											</>
										)}

										{/* ✅ Switch with label on TOP */}
										<div
											style={{
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												gap: '6px',
											}}>
											<span
												style={{
													fontSize: '12px',
													fontWeight: 900,
													color: cat.showWeightUnit ? '#009ef7' : '#111827',
												}}>
												{cat.showWeightUnit ? 'Add Items' : 'Add title'}
											</span>

											<div
												onClick={() => toggleWeightUnit(cat.id)}
												style={{
													width: '50px',
													height: '26px',
													borderRadius: '13px',
													background: cat.showWeightUnit ? '#009ef7' : '#d1d5db',
													position: 'relative',
													cursor: 'pointer',
													transition: 'background 0.3s',
												}}>
												<div
													style={{
														width: '20px',
														height: '20px',
														borderRadius: '50%',
														background: 'white',
														position: 'absolute',
														top: '3px',
														left: cat.showWeightUnit ? '27px' : '3px',
														transition: 'left 0.3s',
													}}
												/>
											</div>
										</div>

										{/* ✅ remove category always */}
										<TableButton
											action='remove'
											onClick={() => deleteCategory(cat.id)}
										/>
									</div>

									{/* ✅ ON = Items Mode => show items */}
									{cat.showWeightUnit &&
										cat.items.map((item) => (
											<div
												key={item.id}
												style={{
													display: 'grid',
													gridTemplateColumns: '1fr 160px 120px 50px',
													gap: '10px',
													marginBottom: '10px',
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
														Title
													</label>
													<input
														type='text'
														value={item.title}
														onChange={(e) => updateItem(cat.id, item.id, 'title', e.target.value)}
														style={{
															width: '100%',
															padding: '8px 10px',
															border: '1px solid #d1d5db',
															borderRadius: '4px',
														}}
														placeholder='e.g., Leucine'
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
														value={item.weight}
														onChange={(e) => updateItem(cat.id, item.id, 'weight', e.target.value)}
														style={{
															width: '100%',
															padding: '8px 10px',
															border: '1px solid #d1d5db',
															borderRadius: '4px',
														}}
														placeholder='2750'
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
														value={item.unit}
														onChange={(e) => updateItem(cat.id, item.id, 'unit', e.target.value)}
														style={{
															width: '100%',
															padding: '8px 10px',
															border: '1px solid #d1d5db',
															borderRadius: '4px',
															background: 'white',
														}}>
														{UNIT_OPTIONS.map((u) => (
															<option
																key={u}
																value={u}>
																{u}
															</option>
														))}
													</select>
												</div>

												{/* ✅ remove item always */}
												<div>
													<TableButton
														action='remove'
														onClick={() => deleteItemFromCategory(cat.id, item.id)}
													/>
												</div>
											</div>
										))}

									{/* ✅ ON = Items Mode => Add Item button */}
									{cat.showWeightUnit && (
										<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
											<TableButton
												action='add'
												onClick={() => addItemToCategory(cat.id)}
												text='Add Item'
											/>
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{/* Preview Nutrition */}
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
							Preview - Formulation Table
						</h2>

						<div style={{ overflowX: 'auto' }}>
							<table
								style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
								<thead>
									<tr style={{ backgroundColor: '#e1e3ea', color: '#000000' }}>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Nutrients
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Per {formData.scoopSize || '__'}g
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											Per 100g
										</th>
										<th style={{ border: '1px solid #d1d5db', padding: '12px', textAlign: 'left' }}>
											%RDA
										</th>
									</tr>
								</thead>
								<tbody>
									{nutritionItems.map((item) => (
										<tr key={item.id}>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.itemName || '-'}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.weightPerScoop || '-'}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.weightPer100g || '-'}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{formatRDA(item.rda)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Preview Amino */}
					{hasAminoData && (
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
								style={{
									fontSize: '18px',
									fontWeight: 700,
									color: '#111827',
									marginBottom: '16px',
								}}>
								Preview - Amino Acid Profile
							</h2>

							<div style={{ overflowX: 'auto' }}>
								<table
									style={{
										width: '100%',
										borderCollapse: 'collapse',
										border: '1px solid #d1d5db',
									}}>
									<tbody>
										{categories.map((cat) => (
											<React.Fragment key={cat.id}>
												<tr style={{ background: '#e1e3ea' }}>
													<td
														style={{ border: '1px solid #d1d5db', padding: '10px' }}
														colSpan={2}>
														<div style={{ display: 'flex', justifyContent: 'space-between' }}>
															<span style={{ fontWeight: 800 }}>{cat.heading || '-'}</span>

															{/* ✅ Value Mode show right-side total */}
															{cat.items.length === 0 && !cat.showWeightUnit && (
																<span style={{ fontWeight: 800 }}>
																	{cat.weight || '-'} {cat.unit || ''}
																</span>
															)}
														</div>
													</td>
												</tr>

												{cat.items.length > 0 &&
													cat.items.map((it) => (
														<tr key={it.id}>
															<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
																{it.title || '-'}
															</td>
															<td
																style={{
																	border: '1px solid #d1d5db',
																	padding: '10px',
																	fontWeight: 700,
																	textAlign: 'right',
																}}>
																{it.weight || '-'} {it.unit || ''}
															</td>
														</tr>
													))}
											</React.Fragment>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Action Button */}
					<div
						style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
						<button
							onClick={handleDownloadAndSubmit}
							disabled={isSubmitting}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								background: isSubmitting ? '#6c757d' : '#009ef7',
								color: 'white',
								padding: '12px 24px',
								borderRadius: '6px',
								border: 'none',
								cursor: isSubmitting ? 'not-allowed' : 'pointer',
								fontWeight: 700,
								fontSize: '15px',
								opacity: isSubmitting ? 0.7 : 1,
							}}>
							{isSubmitting ? (
								<>
									<span
										className='spinner-border spinner-border-sm'
										role='status'
										aria-hidden='true'></span>
									Updating...
								</>
							) : (
								<>
									<i
										className='bi bi-download'
										style={{ fontSize: '18px', color: 'white' }}></i>
									Print & Update
								</>
							)}
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

export default GnTablePriceEdit
