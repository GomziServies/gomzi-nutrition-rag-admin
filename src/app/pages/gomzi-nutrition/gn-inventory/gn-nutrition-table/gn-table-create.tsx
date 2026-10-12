import html2canvas from 'html2canvas'
//  PDF Packages
import jsPDF from 'jspdf'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import TableButton from '../../../../components/TableButton'
import { GetGnClient } from '../../../../Functions/FGGroup/GnClients'
import { CreateGnFormulation, GetGnFormulation } from '../../../../Functions/FGGroup/GnFormulation'

/* Nutrition Table Types */
interface NutritionItem {
	id: string
	itemName: string
	weightPerScoop: string
	weightPer100g: string
	rda: string
}

/* Amino Profile Types */
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

interface ClientItem {
	_id: string
	item_name: string
	item_type?: string
	item_weight?: number
	item_weight_type?: string
	quantity?: number
}

interface ClientData {
	_id: string
	name: string
	common_id: string
	items: ClientItem[]
}

//  Enhanced Validation Errors Interface
interface ValidationErrors {
	productName: string
	scoopSize: string
	nutritionItems: {
		[key: string]: {
			itemName?: string
			weightPerScoop?: string
			weightPer100g?: string
			rda?: string
		}
	}
	aminoCategories: {
		[key: string]: {
			heading?: string
			weight?: string
			unit?: string
			items?: { [key: string]: { title?: string; weight?: string; unit?: string } }
		}
	}
}

const GnTablePriceCreate: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	//  Unit Options
	const UNIT_OPTIONS = ['mg', 'g'] as const

	const [formData, setFormData] = useState<FormData>({
		clientName: '',
		productName: '',
		scoopSize: '',
	})

	//  Enhanced Validation Errors State
	const [errors, setErrors] = useState<ValidationErrors>({
		productName: '',
		scoopSize: '',
		nutritionItems: {},
		aminoCategories: {},
	})

	// ✅ Client Data States
	const [clientData, setClientData] = useState<ClientData | null>(null)
	const [clientItems, setClientItems] = useState<ClientItem[]>([])
	const [selectedItemId, setSelectedItemId] = useState<string>('')
	const [commonId, setCommonId] = useState<string>('')
	const [isLoadingClient, setIsLoadingClient] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [existingFormulations, setExistingFormulations] = useState<string[]>([])
	const [availableItems, setAvailableItems] = useState<ClientItem[]>([])

	const fetchExistingFormulations = async (commonId: string) => {
		try {
			const response: FGGroupAPIResponse = await GetGnFormulation({ common_id: commonId })

			if (response?.data && Array.isArray(response.data)) {
				const itemIds = response.data.map((formulation: any) => formulation.item_id)
				setExistingFormulations(itemIds)
				return itemIds
			}
			return []
		} catch (error: any) {
			return []
		}
	}

	const fetchClientData = async (clientId: string) => {
		setIsLoadingClient(true)
		try {
			const response: FGGroupAPIResponse = await GetGnClient({ id: clientId })

			if (response?.data) {
				const client = Array.isArray(response.data) ? response.data[0] : response.data

				if (client) {
					setClientData(client)
					setClientItems(client.items || [])
					setCommonId(client.common_id || '')
					setFormData((prev) => ({
						...prev,
						clientName: client.name || '',
					}))

					if (client.common_id) {
						const existingItemIds = await fetchExistingFormulations(client.common_id)
						const available = (client.items || []).filter(
							(item: ClientItem) => !existingItemIds.includes(item._id)
						)
						setAvailableItems(available)
					}
				}
			} else {
				toast.error('Client data not found')
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch client data')
		} finally {
			setIsLoadingClient(false)
		}
	}

	const [nutritionItems, setNutritionItems] = useState<NutritionItem[]>([
		{ id: '1', itemName: '', weightPerScoop: '', weightPer100g: '', rda: '' },
	])

	const [categories, setCategories] = useState<AminoCategory[]>([])
	const [showAmino, setShowAmino] = useState<boolean>(false)

	const printTimeText = useMemo(() => {
		return new Date().toLocaleString('en-IN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}, [])

	useEffect(() => {
		const clientId = searchParams.get('clientId')

		if (clientId) {
			fetchClientData(clientId)
		} else {
			toast.error('Client ID not found. Please select a client first.')
			navigate('/rag/inventory')
		}
	}, [searchParams])

	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData({ ...formData, [name]: value })

		if (name === 'scoopSize') {
			setErrors((prev) => ({ ...prev, scoopSize: '' }))
		}
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

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {
			productName: '',
			scoopSize: '',
			nutritionItems: {},
			aminoCategories: {},
		}

		let isValid = true

		if (!selectedItemId) {
			newErrors.productName = 'Product Name field is required.'
			isValid = false
		}

		if (!formData.scoopSize || parseFloat(formData.scoopSize) <= 0) {
			newErrors.scoopSize = 'Scoop Size field is required.'
			isValid = false
		}

		nutritionItems.forEach((item) => {
			const itemErrors: {
				itemName?: string
				weightPerScoop?: string
				weightPer100g?: string
				rda?: string
			} = {}

			if (!item.itemName || item.itemName.trim() === '') {
				itemErrors.itemName = 'Item Name is required'
				isValid = false
			}

			if (!item.weightPerScoop || item.weightPerScoop.trim() === '') {
				itemErrors.weightPerScoop = 'Weight Per Scoop is required'
				isValid = false
			}

			if (!item.weightPer100g || item.weightPer100g.trim() === '') {
				itemErrors.weightPer100g = 'Per 100g is required'
				isValid = false
			}

			if (!item.rda || item.rda.trim() === '') {
				itemErrors.rda = '%RDA is required'
				isValid = false
			}

			if (Object.keys(itemErrors).length > 0) {
				newErrors.nutritionItems[item.id] = itemErrors
			}
		})

		if (showAmino && categories.length > 0) {
			categories.forEach((cat) => {
				const catErrors: {
					heading?: string
					weight?: string
					unit?: string
					items?: { [key: string]: { title?: string; weight?: string; unit?: string } }
				} = {}

				if (!cat.heading || cat.heading.trim() === '' || cat.heading === 'New Category Heading') {
					catErrors.heading = 'Category heading is required'
					isValid = false
				}

				if (!cat.showWeightUnit) {
					if (!cat.weight || cat.weight.trim() === '') {
						catErrors.weight = 'Weight is required'
						isValid = false
					}
					if (!cat.unit || cat.unit.trim() === '') {
						catErrors.unit = 'Unit is required'
						isValid = false
					}
				}

				if (cat.showWeightUnit && cat.items.length > 0) {
					const itemErrors: { [key: string]: { title?: string; weight?: string; unit?: string } } =
						{}

					cat.items.forEach((item) => {
						const errors: { title?: string; weight?: string; unit?: string } = {}

						if (!item.title || item.title.trim() === '') {
							errors.title = 'Title is required'
							isValid = false
						}

						if (!item.weight || item.weight.trim() === '') {
							errors.weight = 'Weight is required'
							isValid = false
						}

						if (!item.unit || item.unit.trim() === '') {
							errors.unit = 'Unit is required'
							isValid = false
						}

						if (Object.keys(errors).length > 0) {
							itemErrors[item.id] = errors
						}
					})

					if (Object.keys(itemErrors).length > 0) {
						catErrors.items = itemErrors
					}
				}

				if (Object.keys(catErrors).length > 0) {
					newErrors.aminoCategories[cat.id] = catErrors
				}
			})
		}

		setErrors(newErrors)
		return isValid
	}

	const handleFormulationItemChange = (id: string, field: keyof NutritionItem, value: string) => {
		setNutritionItems((prev) =>
			prev.map((item) => {
				if (item.id !== id) return item

				const updatedItem: NutritionItem = { ...item, [field]: value }

				//  auto-calc per 100g based on scoopSize
				if (field === 'weightPerScoop') {
					const scoopWeight = parseFloat(value) || 0
					const scoopSize = parseFloat(formData.scoopSize) || 1
					const per100g = (scoopWeight / scoopSize) * 100
					updatedItem.weightPer100g = isFinite(per100g) ? per100g.toFixed(2) : ''
				}

				return updatedItem
			})
		)

		setErrors((prev) => {
			const newNutritionErrors = { ...prev.nutritionItems }
			if (newNutritionErrors[id]) {
				if (field === 'itemName') delete newNutritionErrors[id].itemName
				if (field === 'weightPerScoop') delete newNutritionErrors[id].weightPerScoop
				if (field === 'weightPer100g') delete newNutritionErrors[id].weightPer100g
				if (field === 'rda') delete newNutritionErrors[id].rda
				if (Object.keys(newNutritionErrors[id]).length === 0) {
					delete newNutritionErrors[id]
				}
			}
			return { ...prev, nutritionItems: newNutritionErrors }
		})
	}

	const addFormulationItem = () => {
		const newItem: NutritionItem = {
			id: Date.now().toString(),
			itemName: '',
			weightPerScoop: '',
			weightPer100g: '',
			rda: '',
		}
		setNutritionItems((prev) => [...prev, newItem])
	}

	const deleteFormulationItem = (id: string) => {
		if (nutritionItems.length > 1) {
			setNutritionItems((prev) => prev.filter((i) => i.id !== id))
			setErrors((prev) => {
				const newNutritionErrors = { ...prev.nutritionItems }
				delete newNutritionErrors[id]
				return { ...prev, nutritionItems: newNutritionErrors }
			})
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

		setErrors((prev) => {
			const newAminoErrors = { ...prev.aminoCategories }
			delete newAminoErrors[categoryId]
			return { ...prev, aminoCategories: newAminoErrors }
		})
	}

	const updateCategoryHeading = (categoryId: string, heading: string) => {
		setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, heading } : c)))

		setErrors((prev) => {
			const newAminoErrors = { ...prev.aminoCategories }
			if (newAminoErrors[categoryId]?.heading) {
				delete newAminoErrors[categoryId].heading
				if (Object.keys(newAminoErrors[categoryId]).length === 0) {
					delete newAminoErrors[categoryId]
				}
			}
			return { ...prev, aminoCategories: newAminoErrors }
		})
	}

	const updateCategoryField = (categoryId: string, field: 'weight' | 'unit', value: string) => {
		setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, [field]: value } : c)))

		setErrors((prev) => {
			const newAminoErrors = { ...prev.aminoCategories }
			if (newAminoErrors[categoryId]) {
				if (field === 'weight') delete newAminoErrors[categoryId].weight
				if (field === 'unit') delete newAminoErrors[categoryId].unit
				if (Object.keys(newAminoErrors[categoryId]).length === 0) {
					delete newAminoErrors[categoryId]
				}
			}
			return { ...prev, aminoCategories: newAminoErrors }
		})
	}

	const toggleWeightUnit = (categoryId: string) => {
		setCategories((prev) =>
			prev.map((c) => (c.id === categoryId ? { ...c, showWeightUnit: !c.showWeightUnit } : c))
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

		setErrors((prev) => {
			const newAminoErrors = { ...prev.aminoCategories }
			if (newAminoErrors[categoryId]?.items?.[itemId]) {
				delete newAminoErrors[categoryId].items![itemId]
				if (Object.keys(newAminoErrors[categoryId].items!).length === 0) {
					delete newAminoErrors[categoryId].items
				}
				if (Object.keys(newAminoErrors[categoryId]).length === 0) {
					delete newAminoErrors[categoryId]
				}
			}
			return { ...prev, aminoCategories: newAminoErrors }
		})
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

		setErrors((prev) => {
			const newAminoErrors = { ...prev.aminoCategories }
			if (newAminoErrors[categoryId]?.items?.[itemId]) {
				if (field === 'title') delete newAminoErrors[categoryId].items![itemId].title
				if (field === 'weight') delete newAminoErrors[categoryId].items![itemId].weight
				if (field === 'unit') delete newAminoErrors[categoryId].items![itemId].unit
				if (Object.keys(newAminoErrors[categoryId].items![itemId]).length === 0) {
					delete newAminoErrors[categoryId].items![itemId]
				}
				if (
					newAminoErrors[categoryId].items &&
					Object.keys(newAminoErrors[categoryId].items!).length === 0
				) {
					delete newAminoErrors[categoryId].items
				}
				if (Object.keys(newAminoErrors[categoryId]).length === 0) {
					delete newAminoErrors[categoryId]
				}
			}
			return { ...prev, aminoCategories: newAminoErrors }
		})
	}

	const handleSubmit = async () => {
		if (!validateForm()) {
			toast.error('Please fill all required fields correctly')
			return
		}

		if (!commonId) {
			toast.error('Client information is missing')
			return
		}

		setIsSubmitting(true)

		try {
			const nutritionPayload = nutritionItems.map((item) => ({
				itemName: item.itemName,
				weight35gm: parseFloat(item.weightPerScoop) || 0,
				weight100gm: parseFloat(item.weightPer100g) || undefined,
				rda: parseFloat(item.rda) || undefined,
			}))

			const aminoPayload = hasAminoData
				? categories.map((cat) => {
						const categoryData: any = {
							title: cat.heading || '',
						}

						if (cat.items && cat.items.length > 0) {
							categoryData.items = cat.items.map((item) => ({
								name: item.title || '',
								value: parseFloat(item.weight) || 0,
								unit: item.unit || 'mg',
							}))
						} else {
							categoryData.value = parseFloat(cat.weight || '') || 0
							categoryData.unit = cat.unit || 'mg'
						}

						return categoryData
				  })
				: undefined

			const requestBody = {
				common_id: commonId,
				item_id: selectedItemId,
				scoopSize: parseFloat(formData.scoopSize),
				nutritionItems: nutritionPayload,
				...(aminoPayload && { aminoAcidProfile: aminoPayload }),
			}

			//  Call API
			const response = await CreateGnFormulation(requestBody)

			if (response?.status === 200) {
				toast.success('Formulation created successfully!')
				const clientId = searchParams.get('clientId')
				navigate(`/rag/inventory/view/list${clientId ? `?clientId=${clientId}` : ''}`)
			} else {
				toast.error(response?.message || 'Failed to create formulation')
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to create formulation')
		} finally {
			setIsSubmitting(false)
		}
	}

	/*  Generate PDF (A4 Size) */
	const generatePDF = async () => {
		if (!validateForm()) {
			toast.error('Please fill all required fields correctly')
			return
		}

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
          font-weight: 700;
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
          font-weight: 700;
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
          color: #111827;
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

			pdf.save(`${formData.productName || 'Nutrition_Report'}.pdf`)
			// toast.success('PDF downloaded successfully!')

			// ✅ Submit formulation after PDF download
			await handleSubmit()
		} catch (error) {
			toast.error('PDF Generate failed')
		} finally {
			document.body.removeChild(wrapper)
		}
	}

	return (
		<div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
			<PageTitle breadcrumbs={[]}>Formulation Table Create</PageTitle>

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
						style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
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
								placeholder='Loading client...'
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
							{isLoadingClient ? (
								<div
									style={{
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										color: '#6b7280',
									}}>
									Loading products...
								</div>
							) : (
								<>
									<select
										value={selectedItemId}
										onChange={(e) => {
											const itemId = e.target.value
											setSelectedItemId(itemId)
											const selectedItem = availableItems.find((item) => item._id === itemId)
											if (selectedItem) {
												setFormData((prev) => ({
													...prev,
													productName: selectedItem.item_name,
												}))
											}
											// ✅ Clear error when product is selected
											setErrors((prev) => ({ ...prev, productName: '' }))
										}}
										style={{
											width: '100%',
											padding: '10px 12px',
											border: errors.productName ? '1px solid #ef4444' : '1px solid #d1d5db',
											borderRadius: '6px',
											backgroundColor: 'white',
										}}>
										<option value=''>Select Product</option>
										{availableItems.map((item) => (
											<option
												key={item._id}
												value={item._id}>
												{item.item_name} ({item.item_weight}
												{item.item_weight_type})
											</option>
										))}
									</select>
									{errors.productName && (
										<div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
											{errors.productName}
										</div>
									)}
								</>
							)}
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
									border: errors.scoopSize ? '1px solid #ef4444' : '1px solid #d1d5db',
									borderRadius: '6px',
								}}
								placeholder='35'
							/>
							{errors.scoopSize && (
								<div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
									{errors.scoopSize}
								</div>
							)}
						</div>
					</div>
				</div>

				{/*  Nutrition Items Section */}
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
							onClick={addFormulationItem}
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
											handleFormulationItemChange(item.id, 'itemName', e.target.value)
										}
										style={{
											width: '100%',
											padding: '8px 10px',
											border: errors.nutritionItems[item.id]?.itemName
												? '1px solid #ef4444'
												: '1px solid #d1d5db',
											borderRadius: '4px',
										}}
										placeholder='e.g., Energy (kcal)'
									/>
									{errors.nutritionItems[item.id]?.itemName && (
										<div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
											{errors.nutritionItems[item.id].itemName}
										</div>
									)}
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
											handleFormulationItemChange(item.id, 'weightPerScoop', e.target.value)
										}
										style={{
											width: '100%',
											padding: '8px 10px',
											border: errors.nutritionItems[item.id]?.weightPerScoop
												? '1px solid #ef4444'
												: '1px solid #d1d5db',
											borderRadius: '4px',
										}}
										placeholder='139.44'
									/>
									{errors.nutritionItems[item.id]?.weightPerScoop && (
										<div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
											{errors.nutritionItems[item.id].weightPerScoop}
										</div>
									)}
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
											handleFormulationItemChange(item.id, 'weightPer100g', e.target.value)
										}
										style={{
											width: '100%',
											padding: '8px 10px',
											border: errors.nutritionItems[item.id]?.weightPer100g
												? '1px solid #ef4444'
												: '1px solid #d1d5db',
											borderRadius: '4px',
										}}
										placeholder='Auto/Manual'
									/>
									{errors.nutritionItems[item.id]?.weightPer100g && (
										<div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
											{errors.nutritionItems[item.id].weightPer100g}
										</div>
									)}
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
										onChange={(e) => handleFormulationItemChange(item.id, 'rda', e.target.value)}
										style={{
											width: '100%',
											padding: '8px 10px',
											border: errors.nutritionItems[item.id]?.rda
												? '1px solid #ef4444'
												: '1px solid #d1d5db',
											borderRadius: '4px',
										}}
										placeholder='6.97'
									/>
									{errors.nutritionItems[item.id]?.rda && (
										<div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
											{errors.nutritionItems[item.id].rda}
										</div>
									)}
								</div>

								{nutritionItems.length > 1 && (
									<div>
										<TableButton
											action='remove'
											onClick={() => deleteFormulationItem(item.id)}
										/>
									</div>
								)}
							</div>
						</div>
					))}
				</div>

				{/*  Button to Enable Amino (HIDDEN AFTER ADD)  */}
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
							+ Add Amino Acid Item
						</button>
					</div>
				)}

				{/*  Amino Categories Section */}
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
								Amino Acid Item
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
									<div style={{ flex: 1 }}>
										<input
											type='text'
											placeholder={cat.heading}
											onChange={(e) => updateCategoryHeading(cat.id, e.target.value)}
											style={{
												width: '100%',
												padding: '10px 12px',
												border: errors.aminoCategories[cat.id]?.heading
													? '1px solid #ef4444'
													: '1px solid #d1d5db',
												borderRadius: '6px',
												fontSize: '14px',
												fontWeight: 700,
											}}
										/>
										{errors.aminoCategories[cat.id]?.heading && (
											<div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
												{errors.aminoCategories[cat.id].heading}
											</div>
										)}
									</div>

									{/*  OFF => Value Mode => Weight & Unit show */}
									{!cat.showWeightUnit && (
										<>
											<div>
												<input
													type='number'
													value={cat.weight || ''}
													onChange={(e) => updateCategoryField(cat.id, 'weight', e.target.value)}
													style={{
														width: '160px',
														padding: '10px 12px',
														border: errors.aminoCategories[cat.id]?.weight
															? '1px solid #ef4444'
															: '1px solid #d1d5db',
														borderRadius: '6px',
														fontSize: '14px',
														fontWeight: 700,
													}}
													placeholder='Weight'
												/>
												{errors.aminoCategories[cat.id]?.weight && (
													<div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
														{errors.aminoCategories[cat.id].weight}
													</div>
												)}
											</div>

											<div>
												<select
													value={cat.unit || 'mg'}
													onChange={(e) => updateCategoryField(cat.id, 'unit', e.target.value)}
													style={{
														width: '120px',
														padding: '10px 12px',
														border: errors.aminoCategories[cat.id]?.unit
															? '1px solid #ef4444'
															: '1px solid #d1d5db',
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
												{errors.aminoCategories[cat.id]?.unit && (
													<div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
														{errors.aminoCategories[cat.id].unit}
													</div>
												)}
											</div>
										</>
									)}

									{/*  TOGGLE SWITCH  */}
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											gap: '6px',
										}}>
										{/*  Switch Upar Text */}
										<span
											style={{
												fontSize: '12px',
												fontWeight: 900,
												color: cat.showWeightUnit ? '#009ef7' : '#111827',
											}}>
											{cat.showWeightUnit ? 'Add Items' : 'Add title'}
										</span>

										{/*  Toggle Switch */}
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

									{/*  ALWAYS show Category Remove */}
									<TableButton
										action='remove'
										onClick={() => deleteCategory(cat.id)}
									/>
								</div>

								{/*  ON => Items Mode => show items */}
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
														border: errors.aminoCategories[cat.id]?.items?.[item.id]?.title
															? '1px solid #ef4444'
															: '1px solid #d1d5db',
														borderRadius: '4px',
													}}
													placeholder='e.g., Leucine'
												/>
												{errors.aminoCategories[cat.id]?.items?.[item.id]?.title && (
													<div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
														{errors.aminoCategories[cat.id].items![item.id].title}
													</div>
												)}
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
														border: errors.aminoCategories[cat.id]?.items?.[item.id]?.weight
															? '1px solid #ef4444'
															: '1px solid #d1d5db',
														borderRadius: '4px',
													}}
													placeholder='2750'
												/>
												{errors.aminoCategories[cat.id]?.items?.[item.id]?.weight && (
													<div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
														{errors.aminoCategories[cat.id].items![item.id].weight}
													</div>
												)}
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
														border: errors.aminoCategories[cat.id]?.items?.[item.id]?.unit
															? '1px solid #ef4444'
															: '1px solid #d1d5db',
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
												{errors.aminoCategories[cat.id]?.items?.[item.id]?.unit && (
													<div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
														{errors.aminoCategories[cat.id].items![item.id].unit}
													</div>
												)}
											</div>

											<div>
												<TableButton
													action='remove'
													onClick={() => deleteItemFromCategory(cat.id, item.id)}
												/>
											</div>
										</div>
									))}

								{/* ON => Items Mode => Add Item button show */}
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

				{/*  Preview Nutrition */}
				<div
					style={{
						background: 'white',
						borderRadius: '6px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						padding: '24px',
						marginBottom: '20px',
						border: '1px solid #e5e7eb',
					}}>
					<h2 style={{ fontSize: '18px', fontWeight: 700, color: '#000000', marginBottom: '16px' }}>
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

				{/*  Preview Amino */}
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
							style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
							Preview - Amino Acid Profile
						</h2>

						<div style={{ overflowX: 'auto' }}>
							<table
								style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
								<tbody>
									{categories.map((cat) => (
										<React.Fragment key={cat.id}>
											<tr style={{ background: '#e1e3ea' }}>
												<td
													style={{ border: '1px solid #d1d5db', padding: '10px' }}
													colSpan={2}>
													<div style={{ display: 'flex', justifyContent: 'space-between' }}>
														<span style={{ fontWeight: 800 }}>{cat.heading || '-'}</span>

														{/*  Value Mode show right-side total */}
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

				{/* Actions */}
				<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
					<button
						onClick={generatePDF}
						disabled={isSubmitting || isLoadingClient}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							background: isSubmitting || isLoadingClient ? '#d1d5db' : '#009ef7',
							color: 'white',
							padding: '12px 24px',
							borderRadius: '6px',
							border: 'none',
							cursor: isSubmitting || isLoadingClient ? 'not-allowed' : 'pointer',
							fontWeight: 700,
							fontSize: '15px',
						}}>
						{isSubmitting ? (
							<>
								<span
									className='spinner-border spinner-border-sm'
									role='status'
									aria-hidden='true'></span>
								Submitting...
							</>
						) : (
							<>
								<i
									className='bi bi-download'
									style={{ fontSize: '18px', color: 'white' }}></i>
								Print & Submit
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

export default GnTablePriceCreate
