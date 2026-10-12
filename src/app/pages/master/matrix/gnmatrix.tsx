import GoogleMapReact from 'google-map-react'
import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import {
	createGnTargetMatrix,
	getGnData,
	getGnTargetMatrix,
	ProductTarget,
	updateArchivedGnTargetMatrix,
	updateGnTargetMatrix,
} from '../../../Functions/FGGroup/GnMatrix'
import { getInvoice } from '../../../Functions/FGGroup/Invoice'

// Add this function to fetch coordinates from Nominatim API
const fetchCoordinates = async (
	city: string,
	state: string,
	country: string
): Promise<{ lat: number; lng: number } | null> => {
	try {
		// Create a key for the coordinates array in localStorage
		const coordinatesArrayKey = 'gnCoordinatesArray'

		// Get existing coordinates array from localStorage
		const cachedArrayString = localStorage.getItem(coordinatesArrayKey)
		let coordinatesArray: { key: string; lat: number; lng: number; timestamp: number }[] = []

		if (cachedArrayString) {
			try {
				coordinatesArray = JSON.parse(cachedArrayString)
			} catch (parseError) {
				console.warn('Failed to parse coordinates array, starting fresh')
				coordinatesArray = []
			}
		}

		// Create a cache key for this specific location
		const cacheKey = `${city}-${state}-${country}`

		// Look for existing coordinates in the array
		const existingEntry = coordinatesArray.find((entry) => entry.key === cacheKey)

		// Check if we have a recent cache (less than 7 days old)
		if (existingEntry && Date.now() - existingEntry.timestamp < 7 * 24 * 60 * 60 * 1000) {
			return { lat: existingEntry.lat, lng: existingEntry.lng }
		}

		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
				city
			)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(
				country
			)}&format=json&limit=1`
		)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const data = await response.json()

		if (data && data.length > 0) {
			const result = {
				lat: parseFloat(data[0].lat),
				lng: parseFloat(data[0].lon),
			}

			// Update or add to the coordinates array
			if (existingEntry) {
				existingEntry.lat = result.lat
				existingEntry.lng = result.lng
				existingEntry.timestamp = Date.now()
			} else {
				coordinatesArray.push({
					key: cacheKey,
					...result,
					timestamp: Date.now(),
				})
			}

			// Save the updated array back to localStorage
			localStorage.setItem(coordinatesArrayKey, JSON.stringify(coordinatesArray))

			return result
		}

		return null
	} catch (error) {
		console.error('Error fetching coordinates:', error)
		return null
	}
}

interface GnTargetMatrix {
	_id: string
	year: number
	month: number
	totalTarget: number
	totalAchieved: number
	products: ProductTarget[]
	createdAt: string
	updatedAt: string
}

interface Pagination {
	page: number
	limit: number
	totalCount: number
	totalPages: number
}

interface NewTargetProduct extends Pick<ProductTarget, 'productName' | 'target'> {}

// Add interfaces for invoice and location data
interface Invoice {
	_id: string
	name?: string
	billing_address?: {
		city?: string
		state?: string
		country?: string
		pin_code?: string
	}
	items?: {
		item_name: string
		amount: number
		quantity: number
	}[]
	net_amount: number
	paid_amount: number
	createdAt: string
}

interface UserLocation {
	invoiceId: string
	customerName: string
	city: string
	state: string
	country: string
	lat: number
	lng: number
}

interface MapMarker {
	id: string
	lat: number
	lng: number
	title: string
	info: string
}

const monthNames = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]

const productOptions = [
	'peanut butter',
	'mass gainer',
	'whey protein',
	'eaa',
	'bcaa',
	'pre-workout',
	'creatine',
	'energy drink',
] as const

function Gnmatrix() {
	const [targetMatrices, setTargetMatrices] = useState<GnTargetMatrix[]>([])
	const [pagination, setPagination] = useState<Pagination>({
		page: 1,
		limit: 10,
		totalCount: 0,
		totalPages: 0,
	})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Add state for location data
	const [invoices, setInvoices] = useState<Invoice[]>([])
	const [userLocations, setUserLocations] = useState<UserLocation[]>([])
	const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
	const [mapLoading, setMapLoading] = useState(false)
	const [mapError, setMapError] = useState<string | null>(null)

	// Add state for GN data summary
	const [gnDataSummary, setGnDataSummary] = useState<any>(null)
	const [gnDataLoading, setGnDataLoading] = useState(false)

	// Filter states - Set current month and year as default
	const currentDate = new Date()
	const [selectedMonth, setSelectedMonth] = useState<number | ''>(currentDate.getMonth() + 1)
	const [selectedYear, setSelectedYear] = useState<number | ''>(currentDate.getFullYear())

	// Modal states
	const [showModal, setShowModal] = useState(false)
	const [showEditModal, setShowEditModal] = useState(false)
	const [showEmptyFilterModal, setShowEmptyFilterModal] = useState(false)
	const [editingMatrix, setEditingMatrix] = useState<GnTargetMatrix | null>(null)
	const [newTarget, setNewTarget] = useState({
		year: new Date().getFullYear(),
		month: new Date().getMonth() + 1,
		products: [] as NewTargetProduct[],
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({})

	// Function to fetch GN data summary
	const fetchGnDataSummary = async () => {
		try {
			setGnDataLoading(true)
			const response: any = await getGnData()
			if (response.status === 200) {
				setGnDataSummary(response.data?.summary || null)
			}
		} catch (error) {
			console.error('Error fetching GN data summary:', error)
		} finally {
			setGnDataLoading(false)
		}
	}

	// Fetch GN data summary when component mounts
	useEffect(() => {
		fetchGnDataSummary()
	}, []) // Added empty dependency array to run only once

	const fetchData = async (page: number = 1) => {
		try {
			setLoading(true)
			let response: any = await getGnTargetMatrix({
				page: page,
				limit: pagination.limit,
				month: selectedMonth || undefined,
				year: selectedYear || undefined,
			})

			// Check if user manually selected a filter and it has no data
			const hasUserSelectedFilter = selectedMonth !== '' && selectedYear !== ''
			const hasNoData = !response.data?.data || response.data.data.length === 0

			if (hasUserSelectedFilter && hasNoData) {
				// Show modal to inform user and allow creating target for selected month/year
				setShowEmptyFilterModal(true)
				setTargetMatrices([]) // Clear any existing data
				setPagination({
					page: 1,
					limit: pagination.limit,
					totalCount: 0,
					totalPages: 0,
				})
			} else if (!response.data?.data || response.data.data.length === 0) {
				// If no data for current month/year (default values), try to find data from previous months
				const currentDate = new Date()
				let currentMonth = currentDate.getMonth() + 1
				let currentYear = currentDate.getFullYear()

				// Try up to 12 previous months
				for (let i = 1; i <= 12; i++) {
					// Move to previous month
					currentMonth--
					if (currentMonth === 0) {
						currentMonth = 12
						currentYear--
					}

					response = await getGnTargetMatrix({
						page: page,
						limit: pagination.limit,
						month: currentMonth,
						year: currentYear,
					})

					// If we found data, update the filter states and break
					if (response.data?.data && response.data.data.length > 0) {
						setSelectedMonth(currentMonth)
						setSelectedYear(currentYear)
						break
					}
				}
			}

			if (response.status === 200) {
				setTargetMatrices(response.data?.data || [])
				setPagination({
					page: response.data?.pagination?.page || 1,
					limit: response.data?.pagination?.limit || 10,
					totalCount: response.data?.pagination?.totalCount || 0,
					totalPages: response.data?.pagination?.totalPages || 0,
				})
			} else if (response.status !== 200) {
				setError(response.message || 'Failed to fetch GN Target Matrix data')
			}
		} catch (err: any) {
			console.error('Error fetching GN Target Matrix data:', err)
			setError('Failed to fetch data. Please try again later.')
		} finally {
			setLoading(false)
		}
	}

	// Add function to fetch location data
	const fetchLocationData = async () => {
		try {
			setMapLoading(true)
			setMapError(null)

			// Fetch invoices for Gomzi Nutrition
			const invoiceResponse: any = await getInvoice({
				invoice_category: 'Gomzi Nutrition',
				limit: 1000,
			})

			const invoiceData = invoiceResponse.data || []
			setInvoices(invoiceData)

			// Check if we have cached map markers
			const cachedMapMarkers = localStorage.getItem('gnMapMarkers')
			const cachedTimestamp = localStorage.getItem('gnMapMarkersTimestamp')

			// If we have cached data that's less than 1 hour old, use it
			if (
				cachedMapMarkers &&
				cachedTimestamp &&
				Date.now() - parseInt(cachedTimestamp) < 60 * 60 * 1000
			) {
				try {
					const parsedMarkers = JSON.parse(cachedMapMarkers)
					setMapMarkers(parsedMarkers)
					setMapLoading(false)
					return
				} catch (e) {
					console.warn('Failed to parse cached map markers, fetching fresh data')
				}
			}

			// Fetch user locations with coordinates
			const locationData: UserLocation[] = []
			const markerData: MapMarker[] = []

			// Process invoices to get location data
			const invoicesWithLocations = invoiceData.filter(
				(invoice: Invoice) => invoice.billing_address?.city && invoice.billing_address?.state
			)

			// Limit to first 100 invoices to avoid too many API requests
			const limitedInvoices = invoicesWithLocations.slice(0, 100)

			for (const invoice of limitedInvoices) {
				try {
					// Determine country - use provided country, don't default to India
					const country = invoice.billing_address?.country || 'Unknown'

					const coords = await fetchCoordinates(
						invoice.billing_address!.city!,
						invoice.billing_address!.state!,
						country
					)

					if (coords) {
						const userLocation: UserLocation = {
							invoiceId: invoice._id,
							customerName: invoice.name || 'Unknown Customer',
							city: invoice.billing_address!.city!,
							state: invoice.billing_address!.state!,
							country: country,
							lat: coords.lat,
							lng: coords.lng,
						}

						locationData.push(userLocation)

						const marker: MapMarker = {
							id: invoice._id,
							lat: coords.lat,
							lng: coords.lng,
							title: invoice.name || 'Unknown Customer',
							info: `${invoice.billing_address!.city}, ${invoice.billing_address!.state}${
								country !== 'Unknown' ? `, ${country}` : ''
							}`,
						}

						markerData.push(marker)
					}
				} catch (err) {
					console.warn(`Could not fetch coordinates for invoice ${invoice._id}:`, err)
				}
			}

			// Store markers in localStorage
			localStorage.setItem('gnMapMarkers', JSON.stringify(markerData))
			localStorage.setItem('gnMapMarkersTimestamp', Date.now().toString())

			setUserLocations(locationData)
			setMapMarkers(markerData)
		} catch (err: any) {
			console.error('Error fetching location data:', err)
			setMapError('Failed to load map data.')
		} finally {
			setMapLoading(false)
		}
	}
	// Add function to refresh user locations
	const refreshUserLocations = async () => {
		try {
			setMapLoading(true)
			setMapError(null)

			// Clear the localStorage cache
			localStorage.removeItem('gnMapMarkers')
			localStorage.removeItem('gnMapMarkersTimestamp')
			localStorage.removeItem('gnCoordinatesArray')

			// Fetch fresh invoice data
			const invoiceResponse: any = await getInvoice({
				invoice_category: 'Gomzi Nutrition',
				limit: 1000,
			})

			const invoiceData = invoiceResponse.data || []
			setInvoices(invoiceData)

			// Fetch user locations with coordinates
			const locationData: UserLocation[] = []
			const markerData: MapMarker[] = []

			// Process invoices to get location data
			const invoicesWithLocations = invoiceData.filter(
				(invoice: Invoice) => invoice.billing_address?.city && invoice.billing_address?.state
			)

			// Limit to first 100 invoices to avoid too many API requests
			const limitedInvoices = invoicesWithLocations.slice(0, 100)

			for (const invoice of limitedInvoices) {
				try {
					// Determine country - use provided country, don't default to India
					const country = invoice.billing_address?.country || 'Unknown'

					const coords = await fetchCoordinates(
						invoice.billing_address!.city!,
						invoice.billing_address!.state!,
						country
					)

					if (coords) {
						const userLocation: UserLocation = {
							invoiceId: invoice._id,
							customerName: invoice.name || 'Unknown Customer',
							city: invoice.billing_address!.city!,
							state: invoice.billing_address!.state!,
							country: country,
							lat: coords.lat,
							lng: coords.lng,
						}

						locationData.push(userLocation)

						const marker: MapMarker = {
							id: invoice._id,
							lat: coords.lat,
							lng: coords.lng,
							title: invoice.name || 'Unknown Customer',
							info: `${invoice.billing_address!.city}, ${invoice.billing_address!.state}${
								country !== 'Unknown' ? `, ${country}` : ''
							}`,
						}

						markerData.push(marker)
					}
				} catch (err) {
					console.warn(`Could not fetch coordinates for invoice ${invoice._id}:`, err)
				}
			}

			// Store markers in localStorage
			localStorage.setItem('gnMapMarkers', JSON.stringify(markerData))
			localStorage.setItem('gnMapMarkersTimestamp', Date.now().toString())

			setUserLocations(locationData)
			setMapMarkers(markerData)
		} catch (err: any) {
			console.error('Error refreshing user locations:', err)
			setMapError('Failed to refresh map data.')
		} finally {
			setMapLoading(false)
		}
	}
	useEffect(() => {
		fetchData(1)
		fetchLocationData() // Fetch location data when component mounts
	}, [selectedMonth, selectedYear])

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= pagination.totalPages) {
			fetchData(newPage)
		}
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	const getMonthName = (month: number) => {
		return monthNames[month - 1] || `Month ${month}`
	}

	const getProductColor = (productName: string) => {
		const colors: Record<string, string> = {
			'peanut butter': 'primary',
			'mass gainer': 'success',
			'whey protein': 'info',
			eaa: 'warning',
			bcaa: 'danger',
			'pre-workout': 'dark',
			creatine: 'secondary',
			'energy drink': 'dark',
		}
		return colors[productName] || 'primary'
	}

	// Calculate location-based statistics
	const calculateLocationStats = () => {
		// Group invoices by city
		const invoicesByCity: Record<string, Invoice[]> = {}

		invoices.forEach((invoice) => {
			const city = invoice.billing_address?.city || 'Unknown'
			if (!invoicesByCity[city]) {
				invoicesByCity[city] = []
			}
			invoicesByCity[city].push(invoice)
		})

		// Group invoices by state
		const invoicesByState: Record<string, Invoice[]> = {}

		invoices.forEach((invoice) => {
			const state = invoice.billing_address?.state || 'Unknown'
			if (!invoicesByState[state]) {
				invoicesByState[state] = []
			}
			invoicesByState[state].push(invoice)
		})

		// Group invoices by country
		const invoicesByCountry: Record<string, Invoice[]> = {}

		invoices.forEach((invoice) => {
			const country = invoice.billing_address?.country || 'Unknown'
			if (!invoicesByCountry[country]) {
				invoicesByCountry[country] = []
			}
			invoicesByCountry[country].push(invoice)
		})

		// Calculate total sales by city
		const salesByCity: Record<string, number> = {}
		Object.keys(invoicesByCity).forEach((city) => {
			salesByCity[city] = invoicesByCity[city].reduce(
				(sum, invoice) => sum + (invoice.net_amount || 0),
				0
			)
		})

		// Calculate total sales by state
		const salesByState: Record<string, number> = {}
		Object.keys(invoicesByState).forEach((state) => {
			salesByState[state] = invoicesByState[state].reduce(
				(sum, invoice) => sum + (invoice.net_amount || 0),
				0
			)
		})

		// Calculate total sales by country
		const salesByCountry: Record<string, number> = {}
		Object.keys(invoicesByCountry).forEach((country) => {
			salesByCountry[country] = invoicesByCountry[country].reduce(
				(sum, invoice) => sum + (invoice.net_amount || 0),
				0
			)
		})

		// Get top cities by order count
		const topCitiesByOrders = Object.entries(invoicesByCity)
			.map(([city, cityInvoices]) => ({
				city,
				orderCount: cityInvoices.length,
				totalSales: cityInvoices.reduce((sum, invoice) => sum + (invoice.net_amount || 0), 0),
			}))
			.sort((a, b) => b.orderCount - a.orderCount)
			.slice(0, 10)

		// Get top states by order count
		const topStatesByOrders = Object.entries(invoicesByState)
			.map(([state, stateInvoices]) => ({
				state,
				orderCount: stateInvoices.length,
				totalSales: stateInvoices.reduce((sum, invoice) => sum + (invoice.net_amount || 0), 0),
			}))
			.sort((a, b) => b.orderCount - a.orderCount)
			.slice(0, 10)

		// Get top countries by order count
		const topCountriesByOrders = Object.entries(invoicesByCountry)
			.map(([country, countryInvoices]) => ({
				country,
				orderCount: countryInvoices.length,
				totalSales: countryInvoices.reduce((sum, invoice) => sum + (invoice.net_amount || 0), 0),
			}))
			.sort((a, b) => b.orderCount - a.orderCount)
			.slice(0, 10)

		return {
			totalCustomers: invoices.length,
			topCitiesByOrders,
			topStatesByOrders,
			topCountriesByOrders,
			salesByCity,
			salesByState,
			salesByCountry,
		}
	}

	const locationStats = calculateLocationStats()

	// Modal functions
	const openModal = () => {
		setNewTarget({
			year: new Date().getFullYear(),
			month: new Date().getMonth() + 1,
			products: [],
		})
		setFormError(null)
		setShowModal(true)
	}

	const closeEditModal = () => {
		setShowEditModal(false)
		setEditingMatrix(null)
		setFormError(null)
	}

	const openEditModal = (matrix: GnTargetMatrix) => {
		setEditingMatrix(matrix)
		setNewTarget({
			year: matrix.year,
			month: matrix.month,
			products: matrix.products.map((product) => ({
				productName: product.productName,
				target: product.target,
			})),
		})
		setFormError(null)
		setShowEditModal(true)
	}

	const closeModal = () => {
		setShowModal(false)
		setFormError(null)
	}

	const handleAddProduct = () => {
		// Check if we've already added all available products
		if (newTarget.products.length >= productOptions.length) {
			setFormError('All products have already been added')
			return
		}

		// Find the first product option that hasn't been added yet
		const existingProductNames = newTarget.products.map((p) => p.productName)
		const availableProducts = productOptions.filter(
			(option) => !existingProductNames.includes(option)
		)

		if (availableProducts.length > 0) {
			setNewTarget({
				...newTarget,
				products: [
					...newTarget.products,
					{
						productName: availableProducts[0] as NewTargetProduct['productName'],
						target: 0,
					},
				],
			})
			setFormError(null) // Clear any previous error
		} else {
			setFormError('All products have already been added')
		}
	}

	const handleRemoveProduct = (index: number) => {
		const updatedProducts = [...newTarget.products]
		updatedProducts.splice(index, 1)
		setNewTarget({
			...newTarget,
			products: updatedProducts,
		})
	}

	const handleProductChange = (
		index: number,
		field: keyof NewTargetProduct,
		value: string | number
	) => {
		const updatedProducts = [...newTarget.products]
		updatedProducts[index] = {
			...updatedProducts[index],
			[field]: value,
		}

		// If changing product name, ensure no duplicates
		if (field === 'productName') {
			const productNameValue = value as NewTargetProduct['productName']
			const isDuplicate = updatedProducts.some(
				(product, i) => i !== index && product.productName === productNameValue
			)

			if (isDuplicate) {
				setFormError('This product has already been added')
				return
			}
		}

		setNewTarget({
			...newTarget,
			products: updatedProducts,
		})
		setFormError(null) // Clear any previous error
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (newTarget.products.length === 0) {
			setFormError('Please add at least one product')
			return
		}

		if (newTarget.products.some((product) => product.target <= 0)) {
			setFormError('All product targets must be greater than 0')
			return
		}

		// Check if a target matrix already exists for the selected month and year
		const isDuplicate = targetMatrices.some(
			(matrix) => matrix.month === newTarget.month && matrix.year === newTarget.year
		)

		if (isDuplicate) {
			setFormError(
				`A target matrix already exists for ${getMonthName(newTarget.month)} ${
					newTarget.year
				}. Please edit the existing one instead.`
			)
			return
		}

		try {
			setIsSubmitting(true)
			const response: any = await createGnTargetMatrix({
				year: newTarget.year,
				month: newTarget.month,
				products: newTarget.products as Pick<ProductTarget, 'productName' | 'target'>[],
			})

			if (response.status === 200) {
				closeModal()
				fetchData(1) // Refresh the data
				// Show success message
			} else {
				setFormError(response.message || 'Failed to create target matrix')
			}
		} catch (err: any) {
			console.error('Error creating GN Target Matrix:', err)
			setFormError(err?.message || 'Failed to create target matrix. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSync = async (id: string) => {
		try {
			setSyncingIds((prev) => ({ ...prev, [id]: true }))

			const response: any = await updateArchivedGnTargetMatrix({
				id: id,
				isArchived: true, // This triggers the sync process
			})

			if (response.status === 200) {
				// Refresh the data after sync
				fetchData(pagination.page)
			} else {
				setFormError(response.message || 'Failed to sync target matrix')
			}
		} catch (err: any) {
			console.error('Error syncing GN Target Matrix:', err)
			setFormError('Failed to sync target matrix. Please try again.')
		} finally {
			setSyncingIds((prev) => ({ ...prev, [id]: false }))
		}
	}

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!editingMatrix) return

		if (newTarget.products.length === 0) {
			setFormError('Please add at least one product')
			return
		}

		if (newTarget.products.some((product) => product.target <= 0)) {
			setFormError('All product targets must be greater than 0')
			return
		}

		try {
			setIsSubmitting(true)
			const response: any = await updateGnTargetMatrix({
				id: editingMatrix._id,
				year: newTarget.year,
				month: newTarget.month,
				products: newTarget.products as Pick<ProductTarget, 'productName' | 'target'>[],
			})

			if (response.status === 200) {
				closeEditModal()
				fetchData(pagination.page) // Refresh the data
			} else {
				setFormError(response.message || 'Failed to update target matrix')
			}
		} catch (err: any) {
			console.error('Error updating GN Target Matrix:', err)
			setFormError('Failed to update target matrix. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	if (loading) {
		return (
			<div
				className='d-flex justify-content-center align-items-center'
				style={{ height: '50vh' }}>
				<div
					className='spinner-border text-primary'
					role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<KTCard>
				<div className='card-body'>
					<div className='alert alert-danger'>
						<h4 className='alert-heading'>Error!</h4>
						<p>{error}</p>
					</div>
				</div>
			</KTCard>
		)
	}

	// Calculate statistics
	const totalRecords = targetMatrices.length
	const totalTarget = targetMatrices.reduce((sum, matrix) => sum + matrix.totalTarget, 0)
	const totalAchieved = targetMatrices.reduce((sum, matrix) => sum + matrix.totalAchieved, 0)
	const overallAchievement = totalRecords > 0 ? (totalAchieved / totalTarget) * 100 : 0

	// Calculate exceeded targets
	const exceededTargets = targetMatrices.flatMap((matrix) =>
		matrix.products.filter((product) => product.achieved > product.target)
	).length

	// Map marker component for Google Maps
	const MapMarker: React.FC<{
		lat: number
		lng: number
		title: string
		info: string
		onClick?: () => void
	}> = ({ title, info, onClick }) => {
		const [showInfo, setShowInfo] = useState(false)

		return (
			<div
				style={{
					position: 'relative',
					transform: 'translate(-50%, -100%)',
					cursor: 'pointer',
				}}
				onClick={onClick}
				onMouseEnter={() => setShowInfo(true)}
				onMouseLeave={() => setShowInfo(false)}>
				<div
					style={{
						width: '20px',
						height: '20px',
						borderRadius: '50%',
						backgroundColor: '#3699FF',
						border: '2px solid white',
						boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
					}}
				/>
				{showInfo && (
					<div
						style={{
							position: 'absolute',
							top: '-40px',
							left: '50%',
							transform: 'translateX(-50%)',
							backgroundColor: 'white',
							padding: '6px 10px',
							borderRadius: '4px',
							fontSize: '12px',
							fontWeight: 'bold',
							boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
							whiteSpace: 'nowrap',
							zIndex: 1000,
							minWidth: '120px',
							textAlign: 'center',
						}}>
						<div style={{ color: '#181C32', fontWeight: '600' }}>{title}</div>
						<div style={{ color: '#7E8299', fontSize: '11px', marginTop: '2px' }}>{info}</div>
					</div>
				)}
			</div>
		)
	}

	return (
		<div className='container-fluid'>
			{/* GN Data Summary Section */}
			<KTCard className='card-body mb-10'>
				<div className='d-flex align-items-center justify-content-between mb-8'>
					<div>
						<h2 className='text-gray-800 fw-bolder mb-1'>GN Data Summary</h2>
						<span className='text-muted fw-semibold fs-7'>
							Gomzi Nutrition Order Details Summary
						</span>
					</div>
				</div>

				{gnDataLoading ? (
					<div
						className='d-flex justify-content-center align-items-center'
						style={{ height: '200px' }}>
						<div
							className='spinner-border text-primary'
							role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
					</div>
				) : gnDataSummary ? (
					<>
						<div className='row g-5 mb-8'>
							<div className='col-md-6 col-lg-3'>
								<div className='card border border-2 border-primary shadow-sm hover-elevate-up h-100'>
									<div className='card-body d-flex flex-column align-items-center justify-content-center'>
										<span className='fs-1 text-primary fw-bold'>
											{gnDataSummary.total_orders || 0}
										</span>
										<span className='text-muted fw-semibold fs-7 mt-2'>Total Orders</span>
									</div>
								</div>
							</div>

							<div className='col-md-6 col-lg-3'>
								<div className='card border border-2 border-success shadow-sm hover-elevate-up h-100'>
									<div className='card-body d-flex flex-column align-items-center justify-content-center'>
										<span className='fs-1 text-success fw-bold'>
											{gnDataSummary.category_breakdown
												?.reduce((sum: number, cat: any) => sum + cat.total_kg, 0)
												?.toFixed(2) || 0}
										</span>
										<span className='text-muted fw-semibold fs-7 mt-2'>Total KG Sold</span>
									</div>
								</div>
							</div>

							<div className='col-md-6 col-lg-3'>
								<div className='card border border-2 border-info shadow-sm hover-elevate-up h-100'>
									<div className='card-body d-flex flex-column align-items-center justify-content-center'>
										<span className='fs-1 text-info fw-bold'>
											{gnDataSummary.category_breakdown
												?.reduce((sum: number, cat: any) => sum + cat.total_ltr, 0)
												?.toFixed(2) || 0}
										</span>
										<span className='text-muted fw-semibold fs-7 mt-2'>Total Liters Sold</span>
									</div>
								</div>
							</div>

							<div className='col-md-6 col-lg-3'>
								<div className='card border border-2 border-warning shadow-sm hover-elevate-up h-100'>
									<div className='card-body d-flex flex-column align-items-center justify-content-center'>
										<span className='fs-1 text-warning fw-bold'>
											{gnDataSummary.category_breakdown?.length || 0}
										</span>
										<span className='text-muted fw-semibold fs-7 mt-2'>Product Categories</span>
									</div>
								</div>
							</div>
						</div>

						{/* Category Breakdown Table */}
						<div className='card-header border-0 pt-5'>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold fs-3 text-gray-800'>Category Breakdown</span>
								<span className='text-muted mt-1 fw-semibold fs-7'>
									Detailed view of each product category
								</span>
							</h3>
						</div>
						<div className='card-body py-3'>
							<div className='table-responsive'>
								<table className='table table-row-dashed table-row-gray-300 align-middle gy-4'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th className='min-w-150px'>Category</th>
											<th className='min-w-100px text-center'>Orders</th>
											<th className='min-w-120px text-center'>Quantity</th>
											<th className='min-w-120px text-center'>Amount (₹)</th>
											<th className='min-w-120px text-center'>KG</th>
											<th className='min-w-120px text-center'>Liters</th>
										</tr>
									</thead>
									<tbody>
										{gnDataSummary.category_breakdown?.map((category: any, index: number) => (
											<tr key={index}>
												<td>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-5'>
															<span
																className={`symbol-label bg-light-${getProductColor(
																	category.category
																)} rounded-circle`}>
																<i
																	className={`bi bi-box fs-3 text-${getProductColor(
																		category.category
																	)}`}></i>
															</span>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold text-hover-primary fs-6'>
																{category.category.charAt(0).toUpperCase() +
																	category.category.slice(1)}
															</span>
														</div>
													</div>
												</td>
												<td className='text-center'>
													<span className='text-dark fw-bold d-block fs-6'>{category.count}</span>
												</td>
												<td className='text-center'>
													<span className='text-dark fw-bold d-block fs-6'>
														{category.total_quantity}
													</span>
												</td>
												<td className='text-center'>
													<span className='text-dark fw-bold d-block fs-6'>
														₹{category.total_amount?.toFixed(2)}
													</span>
												</td>
												<td className='text-center'>
													<span className='text-dark fw-bold d-block fs-6'>
														{category.total_kg?.toFixed(2)}
													</span>
												</td>
												<td className='text-center'>
													<span className='text-dark fw-bold d-block fs-6'>
														{category.total_ltr?.toFixed(2)}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</>
				) : (
					<div className='text-center py-10'>
						<div className='text-muted fw-semibold fs-6'>No GN data summary available</div>
					</div>
				)}
			</KTCard>
			<KTCard className='card-body mb-10'>
				{exceededTargets > 0 && (
					<div className='alert alert-success d-flex align-items-center p-5 mb-8 rounded-2 shadow-sm'>
						<span className='svg-icon svg-icon-2hx svg-icon-success me-4'>
							<i className='bi bi-stars fs-1'></i>
						</span>
						<div className='d-flex flex-column pe-0 pe-sm-10'>
							<h4 className='mb-1 text-success'>Outstanding Performance!</h4>
							<span>
								<strong>{exceededTargets}</strong> product{exceededTargets > 1 ? 's have' : ' has'}{' '}
								exceeded target{exceededTargets > 1 ? 's' : ''}.
							</span>
						</div>
					</div>
				)}
				<div className='d-flex align-items-center justify-content-between mb-8'>
					<div>
						<h1 className='text-gray-800 fw-bolder mb-1'>GN Target Matrix</h1>
						<span className='text-muted fw-semibold fs-7'>
							Gomzi Nutrition Target & Achievement Overview
						</span>
					</div>
					<button
						className='btn btn-sm btn-primary'
						onClick={openModal}>
						<i className='bi bi-plus-circle me-2'></i>
						Add New Target
					</button>
				</div>

				{/* Summary Cards */}
				<div className='row g-5 mb-8'>
					<div className='col-md-6 col-lg-3'>
						<div className='card border border-2 border-primary shadow-sm hover-elevate-up h-100'>
							<div className='card-body d-flex flex-column align-items-center justify-content-center'>
								<span className='fs-1 text-primary fw-bold'>{totalRecords}</span>
								<span className='text-muted fw-semibold fs-7 mt-2'>Total Records</span>
							</div>
						</div>
					</div>

					<div className='col-md-6 col-lg-3'>
						<div className='card border border-2 border-success shadow-sm hover-elevate-up h-100'>
							<div className='card-body d-flex flex-column align-items-center justify-content-center'>
								<span className='fs-1 text-success fw-bold'>{totalTarget.toFixed(2)}</span>
								<span className='text-muted fw-semibold fs-7 mt-2'>Total Target (kg/ltr)</span>
							</div>
						</div>
					</div>

					<div className='col-md-6 col-lg-3'>
						<div className='card border border-2 border-info shadow-sm hover-elevate-up h-100'>
							<div className='card-body d-flex flex-column align-items-center justify-content-center'>
								<span className='fs-1 text-info fw-bold'>{totalAchieved.toFixed(2)}</span>
								<span className='text-muted fw-semibold fs-7 mt-2'>Total Achieved (kg/ltr)</span>
							</div>
						</div>
					</div>

					<div className='col-md-6 col-lg-3'>
						<div className='card border border-2 border-warning shadow-sm hover-elevate-up h-100'>
							<div className='card-body d-flex flex-column align-items-center justify-content-center'>
								<span className='fs-1 text-warning fw-bold'>{overallAchievement.toFixed(2)}%</span>
								<span className='text-muted fw-semibold fs-7 mt-2'>Overall Achievement</span>
								{overallAchievement > 100 && (
									<span className='badge badge-light-success fs-8 mt-2'>
										<i className='bi bi-arrow-up-circle-fill me-1'></i>
										Exceeded!
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</KTCard>

			{/* Data Tables */}
			{targetMatrices.length === 0 ? (
				<KTCard className='border border-2 border-dashed border-gray-300'>
					<div className='card-body'>
						<div className='text-center py-15'>
							<div className='symbol symbol-80px symbol-circle mx-auto mb-5'>
								<div className='symbol-label bg-light-primary'>
									<i className='bi bi-clipboard-data fs-3x text-primary'></i>
								</div>
							</div>
							<h3 className='text-gray-700 fw-bold mb-2'>No Target Matrix Data Found</h3>
							<p className='text-gray-500 fw-semibold fs-6 mb-8'>
								There is no GN target matrix data available for the selected filters.
							</p>
							<div className='row justify-content-center mb-8'>
								<div className='col-md-6 col-lg-4 mb-4'>
									<select
										className='form-select form-select-solid'
										value={selectedMonth}
										onChange={(e) =>
											setSelectedMonth(e.target.value ? Number(e.target.value) : '')
										}>
										<option value=''>All Months</option>
										{monthNames.map((month, index) => (
											<option
												key={index}
												value={index + 1}>
												{month}
											</option>
										))}
									</select>
								</div>
								<div className='col-md-6 col-lg-4'>
									<select
										className='form-select form-select-solid'
										value={selectedYear}
										onChange={(e) =>
											setSelectedYear(e.target.value ? Number(e.target.value) : '')
										}>
										<option value=''>All Years</option>
										{Array.from(
											{ length: 10 },
											(_, i) => new Date().getFullYear() - 5 + i
										).map((year) => (
											<option
												key={year}
												value={year}>
												{year}
											</option>
										))}
									</select>
								</div>
							</div>
							<div className='d-flex flex-column align-items-center'>
								<button
									className='btn btn-primary mb-3'
									onClick={openModal}>
									<i className='bi bi-plus-circle me-2'></i>
									Create First Target
								</button>
								<button
									className='btn btn-light'
									onClick={() => {
												// Reset to default filters and fetch data
												const currentDate = new Date();
												setSelectedMonth(currentDate.getMonth() + 1);
												setSelectedYear(currentDate.getFullYear());
												fetchData(1);
											}}>
											Reset Filters
									</button>
								</div>
							</div>
					</div>
				</KTCard>
			) : (
				<>
					{/* Target Matrix Tables */}
					<div className='row g-5'>
						{targetMatrices.map((matrix) => (
							<div
								className='col-12'
								key={matrix._id}>
								<KTCard className='hover-elevate-shadow mb-8 border border-2 border-gray-200'>
									<div className='card-header border-0 pt-5 pb-3'>
										<div className='card-title d-flex align-items-start flex-column'>
											<span className='card-label fw-bold fs-3 text-gray-800'>
												<i className='bi bi-calendar me-2'></i>
												{getMonthName(matrix.month)} {matrix.year}
											</span>
											<div className='text-muted fw-semibold fs-7 mt-1'>
												<span className='me-3'>
													<i className='bi bi-calendar-plus me-1'></i>
													Created: {formatDate(matrix.createdAt)}
												</span>
												<span>
													<i className='bi bi-calendar-check me-1'></i>
													Updated: {formatDate(matrix.updatedAt)}
												</span>
											</div>
										</div>
										<div className='card-toolbar'>
											<div className='d-flex flex-wrap gap-3'>
												<div className='d-flex flex-column text-end mx-3'>
													<span className='text-muted fs-7'>Total Target</span>
													<span className='fw-bold fs-6 text-primary'>
														{matrix.totalTarget.toFixed(2)} kg/ltr
													</span>
												</div>
												<div className='d-flex flex-column text-end mx-3'>
													<span className='text-muted fs-7'>Total Achieved</span>
													<span
														className={`fw-bold fs-6 ${
															matrix.totalAchieved > matrix.totalTarget
																? 'text-success'
																: 'text-info'
														}`}>
														{matrix.totalAchieved.toFixed(2)} kg/ltr
														{matrix.totalAchieved > matrix.totalTarget && (
															<i
																className='bi bi-arrow-up-circle-fill ms-1 text-success'
																title='Exceeded target'></i>
														)}
													</span>
												</div>
												<div className='d-flex flex-column text-end mx-3'>
													<span className='text-muted fs-7'>Achievement</span>
													<span
														className={`fw-bold fs-6 ${
															(matrix.totalAchieved / matrix.totalTarget) * 100 >= 100
																? 'text-success'
																: (matrix.totalAchieved / matrix.totalTarget) * 100 >= 75
																? 'text-warning'
																: 'text-danger'
														}`}>
														{matrix.totalTarget > 0
															? ((matrix.totalAchieved / matrix.totalTarget) * 100).toFixed(2) + '%'
															: '0.00%'}
														{(matrix.totalAchieved / matrix.totalTarget) * 100 > 100 && (
															<i
																className='bi bi-stars ms-1 text-success'
																title='Exceeded target'></i>
														)}
													</span>
												</div>
												<div className='d-flex align-items-center gap-2'>
													<button
														className='btn btn-sm btn-success btn-active-light-primary'
														onClick={() => openEditModal(matrix)}
														title='Edit Target'>
														<i className='p-0 bi bi-pencil'></i>
													</button>
													<button
														className='btn btn-sm btn-primary btn-active-light-success'
														onClick={() => handleSync(matrix._id)}
														disabled={syncingIds[matrix._id]}
														title='Sync with Invoice Data'>
														{syncingIds[matrix._id] ? (
															<span
																className='spinner-border spinner-border-sm'
																role='status'></span>
														) : (
															<i className='p-0 bi bi-arrow-repeat'></i>
														)}
													</button>
												</div>
											</div>
										</div>
									</div>
									<div className='card-body pt-0'>
										<div className='row g-5 align-items-end'>
											<div className='col-md-6 col-lg-6'>
												<select
													className='form-select form-select-solid'
													value={selectedMonth}
													onChange={(e) =>
														setSelectedMonth(e.target.value ? Number(e.target.value) : '')
													}>
													<option value=''>All Months</option>
													{monthNames.map((month, index) => (
														<option
															key={index}
															value={index + 1}>
															{month}
														</option>
													))}
												</select>
											</div>

											<div className='col-md-6 col-lg-6'>
												<select
													className='form-select form-select-solid'
													value={selectedYear}
													onChange={(e) =>
														setSelectedYear(e.target.value ? Number(e.target.value) : '')
													}>
													<option value=''>All Years</option>
													{Array.from(
														{ length: 10 },
														(_, i) => new Date().getFullYear() - 5 + i
													).map((year) => (
														<option
															key={year}
															value={year}>
															{year}
														</option>
													))}
												</select>
											</div>
										</div>
									</div>

									<div className='card-body py-3'>
										<div className='table-responsive'>
											<table className='table table-row-dashed table-row-gray-300 align-middle gy-4'>
												<thead>
													<tr className='fw-bold text-muted bg-light'>
														<th className='min-w-150px text-center'>Product</th>
														<th className='min-w-100px text-center'>Unit</th>
														<th className='min-w-120px text-center'>Target</th>
														<th className='min-w-120px text-center'>Achieved</th>
														<th className='min-w-120px text-center'>Pending</th>
														<th className='min-w-150px text-center'>Achievement %</th>
														<th className='min-w-200px text-center'>Progress</th>
													</tr>
												</thead>
												<tbody>
													{matrix.products.map((product, index) => {
														const achievementPercentage =
															product.target > 0 ? (product.achieved / product.target) * 100 : 0

														return (
															<tr key={index}>
																<td>
																	<div className='d-flex align-items-center'>
																		<div className={`symbol symbol-45px me-5`}>
																			<span
																				className={`symbol-label bg-light-${getProductColor(
																					product.productName
																				)} rounded-circle`}>
																				<i
																					className={`bi bi-box fs-3 text-${getProductColor(
																						product.productName
																					)}`}></i>
																			</span>
																		</div>
																		<div className='d-flex justify-content-start flex-column'>
																			<span className='text-dark fw-bold text-hover-primary fs-6'>
																				{product.productName.charAt(0).toUpperCase() +
																					product.productName.slice(1)}
																			</span>
																			{/* Exceeded Target Indicator */}
																			{product.achieved > product.target && (
																				<span className='badge badge-light-success fs-8 mt-1'>
																					<i className='bi bi-arrow-up-circle-fill me-1'></i>
																					Exceeded Target
																				</span>
																			)}
																		</div>
																	</div>
																</td>
																<td className='text-center'>
																	<span className='text-dark fw-bold d-block fs-6'>
																		{product.unit}
																	</span>
																</td>
																<td className='text-end'>
																	<span className='text-dark fw-bold d-block fs-6'>
																		{product.target.toFixed(2)}
																	</span>
																</td>
																<td className='text-end'>
																	<span
																		className={`fw-bold d-block fs-6 ${
																			product.achieved > product.target ? 'text-success' : ''
																		}`}>
																		{product.achieved.toFixed(2)}
																		{product.achieved > product.target && (
																			<span
																				className='ms-1'
																				title='Exceeded target'>
																				<i className='bi bi-arrow-up-right text-success'></i>
																			</span>
																		)}
																	</span>
																</td>
																<td className='text-end'>
																	<span
																		className={`fw-bold d-block fs-6 ${
																			product.pending < 0
																				? 'text-dark'
																				: product.pending > 0
																				? 'text-warning'
																				: 'text-success'
																		}`}>
																		{product.pending < 0 ? 0 : product.pending.toFixed(2)}
																	</span>
																</td>
																<td className='text-end'>
																	<span
																		className={`fw-bold d-block fs-6 ${
																			achievementPercentage >= 100
																				? 'text-success'
																				: achievementPercentage >= 75
																				? 'text-warning'
																				: 'text-danger'
																		}`}>
																		{achievementPercentage.toFixed(2)}%
																		{achievementPercentage > 100 && (
																			<span
																				className='ms-1'
																				title='Exceeded target'>
																				<i className='bi bi-stars text-success'></i>
																			</span>
																		)}
																	</span>
																</td>
																<td className='text-end'>
																	<div className='d-flex justify-content-end flex-column'>
																		<div className='d-flex justify-content-end align-items-center'>
																			<div className='progress w-100px w-xl-150px h-15px me-3'>
																				<div
																					className={`progress-bar bg-${
																						achievementPercentage >= 100
																							? 'success'
																							: achievementPercentage >= 75
																							? 'warning'
																							: 'danger'
																					}`}
																					role='progressbar'
																					style={{
																						width: `${Math.min(100, achievementPercentage)}%`,
																					}}></div>
																				{/* Extra bar for exceeded targets */}
																				{achievementPercentage > 100 && (
																					<div
																						className='progress-bar bg-success'
																						role='progressbar'
																						style={{
																							width: `${Math.min(
																								20,
																								achievementPercentage - 100
																							)}%`,
																						}}></div>
																				)}
																			</div>
																			<span className='text-muted fw-semibold fs-7'>
																				{Math.min(100, achievementPercentage).toFixed(0)}%
																			</span>
																		</div>
																		{/* Show exceeded amount */}
																		{product.achieved > product.target && (
																			<div className='text-success fs-8 mt-1'>
																				<b>
																					<i className='bi bi-arrow-up-circle-fill me-1'></i>+
																					{(product.achieved - product.target).toFixed(2)}{' '}
																					{product.unit} exceeded
																				</b>
																			</div>
																		)}
																	</div>
																</td>
															</tr>
														)
													})}
												</tbody>
											</table>
										</div>
									</div>
								</KTCard>
							</div>
						))}
					</div>

					{/* Pagination */}
					{pagination.totalPages > 1 && (
						<div className='row'>
							<div className='col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start'>
								<div className='dataTables_info'>
									Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
									{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
									{pagination.totalCount} entries
								</div>
							</div>
							<div className='col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end'>
								<div className='dataTables_paginate paging_simple_numbers'>
									<ul className='pagination'>
										<li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
											<button
												className='page-link'
												onClick={() => handlePageChange(pagination.page - 1)}
												disabled={pagination.page === 1}>
												Previous
											</button>
										</li>

										{/* Page numbers */}
										{Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
											let startPage = 1
											if (pagination.totalPages > 5) {
												if (pagination.page <= 3) {
													startPage = 1
												} else if (pagination.page >= pagination.totalPages - 2) {
													startPage = pagination.totalPages - 4
												} else {
													startPage = pagination.page - 2
												}
											}

											const page = startPage + i
											return (
												<li
													key={page}
													className={`page-item ${pagination.page === page ? 'active' : ''}`}>
													<button
														className='page-link'
														onClick={() => handlePageChange(page)}>
														{page}
													</button>
												</li>
											)
										})}

										<li
											className={`page-item ${
												pagination.page === pagination.totalPages ? 'disabled' : ''
											}`}>
											<button
												className='page-link'
												onClick={() => handlePageChange(pagination.page + 1)}
												disabled={pagination.page === pagination.totalPages}>
												Next
											</button>
										</li>
									</ul>
								</div>
							</div>
						</div>
					)}
				</>
			)}

			{/* Location Statistics Section */}
			<div className='row g-5 mb-8'>
				{/* Top Cities by Orders */}
				<div className='col-md-6'>
					<KTCard className='hover-elevate-shadow'>
						<div className='card-header border-0 pt-5'>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold fs-3 text-gray-800'>Top Cities by Orders</span>
								<span className='text-muted mt-1 fw-semibold fs-7'>
									Customer distribution by city
								</span>
							</h3>
						</div>
						<div className='card-body py-3'>
							{locationStats.topCitiesByOrders.length > 0 ? (
								<div className='table-responsive'>
									<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
										<thead>
											<tr className='fw-bold text-muted'>
												<th className='min-w-150px'>City</th>
												<th className='min-w-100px text-end'>Orders</th>
												<th className='min-w-100px text-end'>Sales (₹)</th>
											</tr>
										</thead>
										<tbody>
											{locationStats.topCitiesByOrders.map(({ city, orderCount, totalSales }) => (
												<tr key={city}>
													<td>
														<div className='d-flex align-items-center'>
															<div className='symbol symbol-45px me-5'>
																<span className='symbol-label bg-light-primary rounded-circle'>
																	<i className='bi bi-geo-alt-fill fs-3 text-primary'></i>
																</span>
															</div>
															<div className='d-flex justify-content-start flex-column'>
																<span className='text-dark fw-bold text-hover-primary fs-6'>
																	{city}
																</span>
															</div>
														</div>
													</td>
													<td className='text-end'>
														<span className='text-dark fw-bold d-block fs-6'>{orderCount}</span>
													</td>
													<td className='text-end'>
														<span className='text-dark fw-bold d-block fs-6'>
															₹{totalSales.toLocaleString('en-IN')}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className='text-center py-10'>
									<div className='text-muted fw-semibold fs-6'>No location data available</div>
								</div>
							)}
						</div>
					</KTCard>
				</div>

				{/* Top States by Orders */}
				<div className='col-md-6'>
					<KTCard className='hover-elevate-shadow'>
						<div className='card-header border-0 pt-5'>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold fs-3 text-gray-800'>Top States by Orders</span>
								<span className='text-muted mt-1 fw-semibold fs-7'>
									Customer distribution by state
								</span>
							</h3>
						</div>
						<div className='card-body py-3'>
							{locationStats.topStatesByOrders.length > 0 ? (
								<div className='table-responsive'>
									<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
										<thead>
											<tr className='fw-bold text-muted'>
												<th className='min-w-150px'>State</th>
												<th className='min-w-100px text-end'>Orders</th>
												<th className='min-w-100px text-end'>Sales (₹)</th>
											</tr>
										</thead>
										<tbody>
											{locationStats.topStatesByOrders.map(({ state, orderCount, totalSales }) => (
												<tr key={state}>
													<td>
														<div className='d-flex align-items-center'>
															<div className='symbol symbol-45px me-5'>
																<span className='symbol-label bg-light-success rounded-circle'>
																	<i className='bi bi-map-fill fs-3 text-success'></i>
																</span>
															</div>
															<div className='d-flex justify-content-start flex-column'>
																<span className='text-dark fw-bold text-hover-primary fs-6'>
																	{state}
																</span>
															</div>
														</div>
													</td>
													<td className='text-end'>
														<span className='text-dark fw-bold d-block fs-6'>{orderCount}</span>
													</td>
													<td className='text-end'>
														<span className='text-dark fw-bold d-block fs-6'>
															₹{totalSales.toLocaleString('en-IN')}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className='text-center py-10'>
									<div className='text-muted fw-semibold fs-6'>No location data available</div>
								</div>
							)}
						</div>
					</KTCard>
				</div>

				{/* Top Countries by Orders */}
				<div className='col-md-12'>
					<KTCard className='hover-elevate-shadow'>
						<div className='card-header border-0 pt-5'>
							<h3 className='card-title align-items-start flex-column'>
								<span className='card-label fw-bold fs-3 text-gray-800'>
									Top Countries by Orders
								</span>
								<span className='text-muted mt-1 fw-semibold fs-7'>
									Customer distribution by country
								</span>
							</h3>
						</div>
						<div className='card-body py-3'>
							{locationStats.topCountriesByOrders.length > 0 ? (
								<div className='table-responsive'>
									<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
										<thead>
											<tr className='fw-bold text-muted'>
												<th className='min-w-150px'>Country</th>
												<th className='min-w-100px text-end'>Orders</th>
												<th className='min-w-100px text-end'>Sales (₹)</th>
											</tr>
										</thead>
										<tbody>
											{locationStats.topCountriesByOrders.map(
												({ country, orderCount, totalSales }) => (
													<tr key={country}>
														<td>
															<div className='d-flex align-items-center'>
																<div className='symbol symbol-45px me-5'>
																	<span className='symbol-label bg-light-warning rounded-circle'>
																		<i className='bi bi-globe fs-3 text-warning'></i>
																	</span>
																</div>
																<div className='d-flex justify-content-start flex-column'>
																	<span className='text-dark fw-bold text-hover-primary fs-6'>
																		{country}
																	</span>
																</div>
															</div>
														</td>
														<td className='text-end'>
															<span className='text-dark fw-bold d-block fs-6'>{orderCount}</span>
														</td>
														<td className='text-end'>
															<span className='text-dark fw-bold d-block fs-6'>
																₹{totalSales.toLocaleString('en-IN')}
															</span>
														</td>
													</tr>
												)
											)}
										</tbody>
									</table>
								</div>
							) : (
								<div className='text-center py-10'>
									<div className='text-muted fw-semibold fs-6'>No location data available</div>
								</div>
							)}
						</div>
					</KTCard>
				</div>
			</div>

			{/* User Location Map */}
			<div className='row g-5 mb-8'>
				<div className='col-12'>
					<KTCard className='hover-elevate-shadow'>
						<div className='card-header border-0 pt-5'>
							<div className='d-flex align-items-center justify-content-between'>
								<h3 className='card-title align-items-start flex-column mb-0'>
									<span className='card-label fw-bold fs-3 text-gray-800'>
										Customer Locations Map
									</span>
									<span className='text-muted mt-1 fw-semibold fs-7'>
										Geographic distribution of customers
									</span>
								</h3>
								<button
									className='btn btn-sm btn-primary'
									onClick={refreshUserLocations}
									disabled={mapLoading}>
									<i
										className={`bi ${
											mapLoading ? 'bi-arrow-repeat spin' : 'bi-arrow-repeat'
										} me-1`}></i>
									Refresh
								</button>
							</div>
						</div>
						<div className='card-body py-3'>
							{mapLoading ? (
								<div
									className='d-flex justify-content-center align-items-center'
									style={{ height: '400px' }}>
									<div
										className='spinner-border text-primary'
										role='status'>
										<span className='visually-hidden'>Loading map...</span>
									</div>
								</div>
							) : mapError ? (
								<div className='alert alert-danger'>
									<h4 className='alert-heading'>Map Error!</h4>
									<p>{mapError}</p>
								</div>
							) : mapMarkers.length > 0 ? (
								<div style={{ height: '400px', width: '100%' }}>
									<GoogleMapReact
										bootstrapURLKeys={{ key: '' }} // Add your Google Maps API key here if needed
										defaultCenter={{ lat: 20, lng: 0 }} // Center on world map
										defaultZoom={2} // Zoom out to show global view
										options={{
											fullscreenControl: true,
											zoomControl: true,
											mapTypeControl: true,
											streetViewControl: true,
										}}>
										{mapMarkers.map((marker) => (
											<MapMarker
												key={marker.id}
												lat={marker.lat}
												lng={marker.lng}
												title={marker.title}
												info={marker.info}
											/>
										))}
									</GoogleMapReact>
								</div>
							) : (
								<div className='text-center py-10'>
									<div className='text-muted fw-semibold fs-6'>No location data available</div>
								</div>
							)}
						</div>
					</KTCard>
				</div>
			</div>

			{/* Add Target Modal */}
			{showModal && (
				<div
					className='modal fade show d-block'
					tabIndex={-1}
					role='dialog'
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<div
						className='modal-dialog modal-xl'
						role='document'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title'>
									<i className='bi bi-plus-circle me-2'></i>
									Add New GN Target Matrix
								</h5>
								<button
									type='button'
									className='btn-close'
									onClick={closeModal}></button>
							</div>
							<form onSubmit={handleSubmit}>
								<div className='modal-body'>
									{formError && (
										<div className='alert alert-danger'>
											<i className='bi bi-exclamation-circle me-2'></i>
											{formError}
										</div>
									)}

									<div className='row mb-6'>
										<div className='col-md-6'>
											<label className='form-label required fw-bold'>Month</label>
											<select
												className='form-select form-select-solid'
												value={newTarget.month}
												onChange={(e) =>
													setNewTarget({ ...newTarget, month: Number(e.target.value) })
												}
												required>
												{monthNames.map((month, index) => (
													<option
														key={index}
														value={index + 1}>
														{month}
													</option>
												))}
											</select>
										</div>

										<div className='col-md-6'>
											<label className='form-label required fw-bold'>Year</label>
											<select
												className='form-select form-select-solid'
												value={newTarget.year}
												onChange={(e) =>
													setNewTarget({ ...newTarget, year: Number(e.target.value) })
												}
												required>
												{Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(
													(year) => (
														<option
															key={year}
															value={year}>
															{year}
														</option>
													)
												)}
											</select>
										</div>
									</div>

									<div className='mb-6'>
										<div className='d-flex justify-content-between align-items-center mb-4'>
											<h5 className='mb-0'>
												<i className='bi bi-list me-2'></i>
												Products
											</h5>
											<button
												type='button'
												className='btn btn-sm btn-primary'
												onClick={handleAddProduct}>
												<i className='bi bi-plus-circle me-1'></i>
												Add Product
											</button>
										</div>

										{newTarget.products.length === 0 ? (
											<div className='text-center py-10 bg-light rounded'>
												<i className='bi bi-box fs-1 text-muted mb-3'></i>
												<p className='text-muted'>
													No products added yet. Click "Add Product" to get started.
												</p>
											</div>
										) : (
											<div className='table-responsive'>
												<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
													<thead>
														<tr className='fw-bold text-muted bg-light'>
															<th className='min-w-150px'>Product</th>
															<th className='min-w-150px'>Target Value</th>
															<th className='min-w-100px text-end'>Actions</th>
														</tr>
													</thead>
													<tbody>
														{newTarget.products.map((product, index) => (
															<tr key={index}>
																<td>
																	<select
																		className='form-select form-select-solid'
																		value={product.productName}
																		onChange={(e) =>
																			handleProductChange(
																				index,
																				'productName',
																				e.target.value as NewTargetProduct['productName']
																			)
																		}>
																		{productOptions
																			.filter(
																				(option) =>
																					!newTarget.products.some(
																						(p, i) => p.productName === option && i !== index
																					)
																			)
																			.map((option) => (
																				<option
																					key={option}
																					value={option}>
																					{option.charAt(0).toUpperCase() + option.slice(1)}
																				</option>
																			))}
																	</select>
																</td>
																<td>
																	<div className='input-group'>
																		<input
																			type='number'
																			className='form-control form-control-solid'
																			placeholder='Target value'
																			min='0'
																			step='0.01'
																			value={product.target}
																			onChange={(e) =>
																				handleProductChange(
																					index,
																					'target',
																					parseFloat(e.target.value) || 0
																				)
																			}
																			required
																		/>
																		<span className='input-group-text'>
																			{product.productName === 'energy drink' ? 'ltr' : 'kg'}
																		</span>
																	</div>
																</td>
																<td className='text-end'>
																	<button
																		type='button'
																		className='btn btn-sm btn-danger'
																		onClick={() => handleRemoveProduct(index)}>
																		<i className='bi bi-trash'></i>
																	</button>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										)}
									</div>
								</div>
								<div className='modal-footer'>
									<button
										type='button'
										className='btn btn-light'
										onClick={closeModal}
										disabled={isSubmitting}>
										Cancel
									</button>
									<button
										type='submit'
										className='btn btn-primary'
										disabled={isSubmitting}>
										{isSubmitting ? (
											<>
												<span
													className='spinner-border spinner-border-sm me-2'
													role='status'></span>
												Creating...
											</>
										) : (
											<>
												<i className='bi bi-check-circle me-2'></i>
												Create Target
											</>
										)}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Edit Target Modal */}
			{showEditModal && editingMatrix && (
				<div
					className='modal fade show d-block'
					tabIndex={-1}
					role='dialog'
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<div
						className='modal-dialog modal-xl'
						role='document'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title'>
									<i className='bi bi-pencil me-2'></i>
									Edit GN Target Matrix
								</h5>
								<button
									type='button'
									className='btn-close'
									onClick={closeEditModal}></button>
							</div>
							<form onSubmit={handleEditSubmit}>
								<div className='modal-body'>
									{formError && (
										<div className='alert alert-danger'>
											<i className='bi bi-exclamation-circle me-2'></i>
											{formError}
										</div>
									)}

									<div className='row mb-6'>
										<div className='col-md-6'>
											<label className='form-label required fw-bold'>Month</label>
											<select
												className='form-select form-select-solid'
												value={newTarget.month}
												onChange={(e) =>
													setNewTarget({ ...newTarget, month: Number(e.target.value) })
												}
												required>
												{monthNames.map((month, index) => (
													<option
														key={index}
														value={index + 1}>
														{month}
													</option>
												))}
											</select>
										</div>

										<div className='col-md-6'>
											<label className='form-label required fw-bold'>Year</label>
											<select
												className='form-select form-select-solid'
												value={newTarget.year}
												onChange={(e) =>
													setNewTarget({ ...newTarget, year: Number(e.target.value) })
												}
												required>
												{Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(
													(year) => (
														<option
															key={year}
															value={year}>
															{year}
														</option>
													)
												)}
											</select>
										</div>
									</div>

									<div className='mb-6'>
										<div className='d-flex justify-content-between align-items-center mb-4'>
											<h5 className='mb-0'>
												<i className='bi bi-list me-2'></i>
												Products
											</h5>
											<button
												type='button'
												className='btn btn-sm btn-primary'
												onClick={handleAddProduct}>
												<i className='bi bi-plus-circle me-1'></i>
												Add Product
											</button>
										</div>

										{newTarget.products.length === 0 ? (
											<div className='text-center py-10 bg-light rounded'>
												<i className='bi bi-box fs-1 text-muted mb-3'></i>
												<p className='text-muted'>
													No products added yet. Click "Add Product" to get started.
												</p>
											</div>
										) : (
											<div className='table-responsive'>
												<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
													<thead>
														<tr className='fw-bold text-muted bg-light'>
															<th className='min-w-150px'>Product</th>
															<th className='min-w-150px'>Target Value</th>
															<th className='min-w-100px text-end'>Actions</th>
														</tr>
													</thead>
													<tbody>
														{newTarget.products.map((product, index) => (
															<tr key={index}>
																<td>
																	<select
																		className='form-select form-select-solid'
																		value={product.productName}
																		onChange={(e) =>
																			handleProductChange(
																				index,
																				'productName',
																				e.target.value as NewTargetProduct['productName']
																			)
																		}>
																		{productOptions
																			.filter(
																				(option) =>
																					!newTarget.products.some(
																						(p, i) => p.productName === option && i !== index
																					)
																			)
																			.map((option) => (
																				<option
																					key={option}
																					value={option}>
																					{option.charAt(0).toUpperCase() + option.slice(1)}
																				</option>
																			))}
																	</select>
																</td>
																<td>
																	<div className='input-group'>
																		<input
																			type='number'
																			className='form-control form-control-solid'
																			placeholder='Target value'
																			min='0'
																			step='0.01'
																			value={product.target}
																			onChange={(e) =>
																				handleProductChange(
																					index,
																					'target',
																					parseFloat(e.target.value) || 0
																				)
																			}
																			required
																		/>
																		<span className='input-group-text'>
																			{product.productName === 'energy drink' ? 'ltr' : 'kg'}
																		</span>
																	</div>
																</td>
																<td className='text-end'>
																	<button
																		type='button'
																		className='btn btn-sm btn-danger'
																		onClick={() => handleRemoveProduct(index)}>
																		<i className='bi bi-trash'></i>
																	</button>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										)}
									</div>
								</div>
								<div className='modal-footer'>
									<button
										type='button'
										className='btn btn-light'
										onClick={closeEditModal}
										disabled={isSubmitting}>
										Cancel
									</button>
									<button
										type='submit'
										className='btn btn-primary'
										disabled={isSubmitting}>
										{isSubmitting ? (
											<>
												<span
													className='spinner-border spinner-border-sm me-2'
													role='status'></span>
												Updating...
											</>
										) : (
											<>
												<i className='bi bi-check-circle me-2'></i>
												Update Target
											</>
										)}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default Gnmatrix
