import {
	faAngleDown,
	faArrowRightLong,
	faBars,
	faBatteryFull,
	faCheck,
	faChevronLeft,
	faCircleInfo,
	faClock,
	faMagnifyingGlass,
	faMobileScreenButton,
	faPencil,
	faSignal,
	faSquarePlus,
	faTrash,
	faUserPlus,
	faWifi,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Collapse } from 'bootstrap'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import Modal from 'react-bootstrap/Modal'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { AsyncPaginate } from 'react-select-async-paginate'
import Swal from 'sweetalert2'
import '../../../../_metronic/assets/css/food-assign.css'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { loadFoodOptions } from '../../../components/loadFoodOptions'
import { loadUserOptions } from '../../../components/loadUserOptions'
import {
	AddDietPlanItem,
	AddFoodBundle,
	AddFoodBundleItem,
	AssignDietPlan,
	GetDietPlan,
	GetFood,
	GetFoodBundle,
	GetFoodCategory,
	GetFoodTime,
	RemoveDietPlanItem,
	RemoveFoodBundleItem,
	UpdateDietPlanItem,
	UpdateDietPlanSortIndex,
	UpdateFood,
	UpdateFoodBundle,
	UpdateFoodBundleItem,
	WithdrawDietPlan,
} from '../../../Functions/FWG'

const formatFoodOption = (food: any) => ({
	label: food.food_name,
	value: food._id,
	quantity: food.quantity,
	quantity_unit: food.quantity_unit,
	// add any other required properties here
})

const AssignFood: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const dietId = searchParams.get('diet_id')

	const [dietInfo, setDietInfo] = useState<any>(null)
	const [selectedItem, setSelectedItem] = useState<number | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [showTimeModal, setShowTimeModal] = useState(false)
	const [showViewModal, setShowViewModal] = useState(false)
	const [showBundleInfoModal, setShowBundleInfoModal] = useState(false)
	const [showEditModal, setShowEditModal] = useState(false)
	const [viewBundle, setViewBundle] = useState<any>(null)
	const [bundleInfoData, setBundleInfoData] = useState<any>(null)
	const [editBundle, setEditBundle] = useState<any>(null)
	const [value, onChange] = useState<any>(null)
	const [assignedUsers, setAssignedUsers] = useState<any[]>([])
	const [selectedBundle, setSelectedBundle] = useState<any>(null)
	const [assignTime, setAssignTime] = useState<string>('')
	const [editTime, setEditTime] = useState<string>('')

	const [bundleItems, setBundleItems] = useState<any[]>([])

	const [foodTimes, setFoodTimes] = useState<any[]>([])
	const [selectedFoodTime, setSelectedFoodTime] = useState('')
	const [foodItems, setFoodItems] = useState<any[]>([])
	const [filteredFoodItems, setFilteredFoodItems] = useState<any[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [pageLoading, setPageLoading] = useState(true)
	const [bundleAssignLoading, setBundleAssignLoading] = useState(false)

	// Infinite scroll and server-side search states
	const [page, setPage] = useState(1)
	const ITEMS_PER_PAGE = 50
	const [hasMore, setHasMore] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const loadMoreRef = useRef<HTMLDivElement | null>(null)
	const [debouncedSearch, setDebouncedSearch] = useState('')

	const [bundleItemsData, setBundleItemsData] = useState<any[]>([])
	const [bundleInfoLoading, setBundleInfoLoading] = useState(false)

	const [showUpdateBundleModal, setShowUpdateBundleModal] = useState(false)
	const [showUpdateBundleItemsModal, setShowUpdateBundleItemsModal] = useState(false)
	const [updateBundleData, setUpdateBundleData] = useState<any>(null)
	const [categories, setCategories] = useState<any[]>([])
	const [updateBundleForm, setUpdateBundleForm] = useState({
		bundle_name: '',
		category_id: '',
		time_id: '',
		video_url: '',
	})

	const [showCreateBundleModal, setShowCreateBundleModal] = useState(false)
	const [showCreateBundleItemsModal, setShowCreateBundleItemsModal] = useState(false)
	const [newCreatedBundleId, setNewCreatedBundleId] = useState<string>('')
	const [createBundleForm, setCreateBundleForm] = useState({
		bundle_name: '',
		category_id: '',
		time_id: '',
		video_url: '',
	})

	const [allFoodItems, setAllFoodItems] = useState<any[]>([])
	const [newFoodItem, setNewFoodItem] = useState({
		food_id: '',
		food_name: '',
		thumbnail_image: '',
		quantity: '0',
		quantity_unit: '',
		fat: '0',
		protein: '0',
		carbs: '0',
		calories: '0',
	})
	const [showNewItemRow, setShowNewItemRow] = useState(false)

	//  handler
	const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
	const [editLoadingId, setEditLoadingId] = useState<string | null>(null)

	// Loading states for various actions
	const [ishandleUpdateBundleSubmitLoading, setIshandleUpdateBundleSubmitLoading] = useState(false)
	const [ishandleSaveNewFoodItemLoading, setIshandleSaveNewFoodItemLoading] = useState(false)
	const [ishandleUpdateBundleItemsSubmitLoading, setIshandleUpdateBundleItemsSubmitLoading] =
		useState(false)
	const [ishandleDeleteBundleItemLoading, setIshandleDeleteBundleItemLoading] = useState(false)
	const [ishandleCreateBundleSubmitLoading, setIshandleCreateBundleSubmitLoading] = useState(false)
	const [ishandleCreateBundleItemsSubmitLoading, setIshandleCreateBundleItemsSubmitLoading] =
		useState(false)

	const [showMobilePreview, setShowMobilePreview] = useState(false)
	const [selectedMeal, setSelectedMeal] = useState<any>(null)
	const [mealIngredients, setMealIngredients] = useState<any[]>([])

	const userCollapseRef = useRef<HTMLDivElement | null>(null)
	const foodCollapseRef = useRef<HTMLDivElement | null>(null)

	const preloadImage = useCallback((url: string): Promise<HTMLImageElement> => {
		return new Promise((resolve, reject) => {
			if (!url) {
				reject(new Error('Invalid image URL'))
				return
			}
			const img = new Image()
			img.onload = () => resolve(img)
			img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
			img.src = url
		})
	}, [])

	const preloadBundleImages = useCallback(
		async (bundleItems: any[]) => {
			try {
				const imagePromises = bundleItems
					.filter(
						(item: any) =>
							item.food_bundle &&
							item.food_bundle.food_bundle_items &&
							item.food_bundle.food_bundle_items.length > 0 &&
							item.food_bundle.food_bundle_items[0].food_info &&
							item.food_bundle.food_bundle_items[0].food_info.thumbnail_image
					)
					.map((item: any) =>
						preloadImage(item.food_bundle.food_bundle_items[0].food_info.thumbnail_image)
					)

				await Promise.all(imagePromises)
			} catch (error) {
				console.error('Error preloading images:', error)
			}
		},
		[preloadImage]
	)

	// Load food times once
	useEffect(() => {
		const fetchFoodTimes = async () => {
			try {
				const response: any = await GetFoodTime()
				setFoodTimes(response.data)
			} catch (error) {
				console.error('Failed to fetch food times', error)
				toast.error('Failed to load food times')
			}
		}
		fetchFoodTimes()
	}, [])

	// IntersectionObserver for infinite scroll
	useEffect(() => {
		if (!loadMoreRef.current) return
		const sentinel = loadMoreRef.current
		const observer = new IntersectionObserver(
			(entries) => {
				const first = entries[0]
				if (first.isIntersecting && hasMore && !loadingMore && !loading) {
					setPage((prev) => prev + 1)
				}
			},
			{ root: null, rootMargin: '200px', threshold: 0 }
		)
		observer.observe(sentinel)
		return () => observer.unobserve(sentinel)
	}, [hasMore, loadingMore, loading])

	// useEffect(() => {
	// 	const fetchFoodBundles = async () => {
	// 		if (!selectedFoodTime) return

	// 		setLoading(true)
	// 		try {
	// 			const response: any = await GetFoodBundle({
	// 				food_time_id: selectedFoodTime,
	// 			})

	// 			const formattedItems = response.data.map((item: any, index: number) => ({
	// 				id: index,
	// 				bundle_id: item._id,
	// 				name: item.bundle_name,
	// 				calories: item.calories || 352,
	// 				time: item.food_time?.[0]?.food_time || 'Not specified',
	// 				category: item.food_category?.category || 'Not specified',
	// 				description: item.description || 'No description available',
	// 				ingredients: item.ingredients || [],
	// 				nutritional_value: item.nutritional_value || {
	// 					calories: 352,
	// 					protein: 20,
	// 					carbs: 40,
	// 					fat: 15,
	// 				},
	// 			}))

	// 			setFoodItems(formattedItems)
	// 			setFilteredFoodItems(formattedItems)
	// 		} catch (error) {
	// 			console.error('Failed to fetch food bundles', error)
	// 			toast.error('Failed to load food bundles')
	// 		} finally {
	// 			setLoading(false)
	// 		}
	// 	}

	// 	fetchFoodBundles()
	// }, [selectedFoodTime])

	useEffect(() => {
		let didCancel = false
		const fetchFoodBundles = async () => {
			const isFirstPage = page === 1
			if (isFirstPage) setLoading(true)
			else setLoadingMore(true)
			try {
				const params: any = {
					page,
					limit: ITEMS_PER_PAGE,
				}
				if (selectedFoodTime) params.food_time_id = selectedFoodTime
				if (debouncedSearch.trim()) params.search = debouncedSearch.trim()

				const response: any = await GetFoodBundle(params)
				const newItems = response.data.map((item: any, index: number) => ({
					id: (page - 1) * ITEMS_PER_PAGE + index,
					bundle_id: item._id,
					name: item.bundle_name,
					calories: item.bundle_items.reduce((total: number, bundleItem: any) => {
						return total + (bundleItem.calculated_calories || 0)
					}, 0),
					time: item.food_time?.[0]?.food_time || 'Not specified',
					food_time_id: item.food_time?.[0]?._id,
					category: item.food_category?.category || 'Not specified',
					description: item.description || 'No description available',
					ingredients: item.ingredients || [],
					nutritional_value: item.nutritional_value || {
						calories: 0,
						protein: 0,
						carbs: 0,
						fats: 0,
					},
				}))

				if (didCancel) return

				setHasMore(newItems.length === ITEMS_PER_PAGE)
				if (isFirstPage) {
					setFoodItems(newItems)
					setFilteredFoodItems(newItems)
				} else {
					setFoodItems((prev) => {
						// de-duplicate by bundle_id
						const merged = [...prev, ...newItems]
						const uniqueById = Array.from(new Map(merged.map((i) => [i.bundle_id, i])).values())
						return uniqueById
					})
					setFilteredFoodItems((prev) => {
						const merged = [...prev, ...newItems]
						const uniqueById = Array.from(new Map(merged.map((i) => [i.bundle_id, i])).values())
						return uniqueById
					})
				}
			} catch (error) {
				console.error('Failed to fetch food bundles', error)
				toast.error('Failed to load food bundles')
			} finally {
				setLoading(false)
				setLoadingMore(false)
			}
		}

		fetchFoodBundles()
		return () => {
			didCancel = true
		}
	}, [selectedFoodTime, page, debouncedSearch])

	// Debounce search input and trigger server-side search over all data
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(searchTerm)
			setPage(1)
			setHasMore(true)
		}, 500)
		return () => clearTimeout(handler)
	}, [searchTerm])

	// When local items update (e.g., after fetch), mirror to filtered list
	useEffect(() => {
		setFilteredFoodItems(foodItems)
	}, [foodItems])

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response: any = await GetFoodCategory()
				setCategories(response.data)
			} catch (error) {
				console.error('Failed to fetch categories', error)
				toast.error('Failed to load categories')
			}
		}

		fetchCategories()
	}, [])

	useEffect(() => {
		const fetchAllFoodItems = async () => {
			try {
				const response: any = await GetFood()
				if (response && response.data) {
					setAllFoodItems(response.data)
				}
			} catch (error) {
				console.error('Failed to fetch food items', error)
				toast.error('Failed to load food options')
			}
		}

		fetchAllFoodItems()
	}, [])

	useEffect(() => {
		const fetchDietInfo = async () => {
			if (dietId) {
				setPageLoading(true)
				try {
					const response: any = await GetDietPlan({ id: dietId })
					if (response && response.data && response.data.length > 0) {
						const dietData = response.data[0]
						setDietInfo(dietData)

						if (dietData.diet_items && dietData.diet_items.length > 0) {
							const loadedBundleItems = dietData.diet_items.map((item: any, index: number) => ({
								id: item._id,
								name: item.food_bundle?.bundle_name || 'Unnamed Bundle',
								time: item.time || '00:00',
								category: item.food_bundle?.food_category_info?.category || 'Not specified',
								food_bundle: item.food_bundle,
								bundle_id: item.food_bundle_id || item.food_bundle?._id || '',
								mealTime: item.diet_items_time_info?.food_time || 'Not specified',
								description: item.food_bundle?.description || 'No description available',
								ingredients: item.food_bundle?.ingredients || [],
								nutritional_value: item.food_bundle?.nutritional_value || {
									calories: 0,
									protein: 0,
									carbs: 0,
									fats: 0,
								},
							}))

							setBundleItems(loadedBundleItems)
							await preloadBundleImages(loadedBundleItems)
						}
					}
				} catch (error) {
					console.error('Failed to fetch diet information', error)
					toast.error('Failed to load diet details')
				} finally {
					setPageLoading(false)
				}
			}
		}

		fetchDietInfo()
	}, [dietId, preloadBundleImages])

	useEffect(() => {
		const fetchAssignedUsers = async () => {
			if (dietId) {
				try {
					const response: any = await GetDietPlan({ id: dietId })
					if (response && response.data && response.data.length > 0) {
						const dietData = response.data[0]
						if (dietData.diet_assigned_user && dietData.diet_assigned_user.length > 0) {
							const userList = dietData.diet_assigned_user.map((userAssignment: any) => {
								const userInfo = userAssignment.user_info || {}
								return {
									id: userAssignment.user_id,
									firstName: userInfo.firstName || 'User',
									lastName: userInfo.lastName || '',
									email: userInfo.email || 'user@example.com',
									country_code: userInfo.country_code || '+91',
									mobile: userInfo.mobile || '',
									profile_image: userInfo.profile_image || '/media/avatars/300-1.jpg',
								}
							})
							setAssignedUsers(userList)
						}
					}
				} catch (error: any) {
					console.error('Failed to fetch assigned users', error)
					toast.error('Failed to load assigned users')
				}
			}
		}

		fetchAssignedUsers()
	}, [dietId])

	const handleSelectItem = (id: number, bundle: any) => {
		if (selectedItem === id) {
			setSelectedItem(null)
			setSelectedBundle(null)
			return
		}

		setSelectedItem(id)
		setSelectedBundle(bundle)
	}

	const onDragEnd = async (result: any) => {
		if (!result.destination) {
			return
		}

		if (
			result.destination.droppableId === result.source.droppableId &&
			result.destination.index === result.source.index
		) {
			return
		}

		const items = Array.from(bundleItems)
		const [reorderedItem] = items.splice(result.source.index, 1)
		items.splice(result.destination.index, 0, reorderedItem)

		setBundleItems(items)

		try {
			if (dietId) {
				const sortUpdateData = items.map((item, index) => ({
					diet_id: dietId,
					diet_item_id: item.id,
					sort_index: index + 1,
				}))

				await UpdateDietPlanSortIndex(sortUpdateData)
				toast.success('Bundle order updated successfully')
			}
		} catch (error: any) {
			console.error('Failed to update bundle order', error)
			toast.error(error.message || 'Failed to update bundle order')
		}
	}

	const handleAssignUser = async () => {
		try {
			if (value && value.length > 0) {
				const newUsers = value.map((user: any) => ({
					id: user.value,
					firstName: user.label.split(' ')[0],
					lastName: user.label.split(' ')[1] || '',
					email: user.email || 'user@example.com',
					country_code: '+91',
					mobile: user.mobile || '',
					profile_image: user.image || '/media/avatars/300-1.jpg',
				}))

				if (dietId) {
					const userIds = newUsers.map((user: { id: string }) => user.id)

					await AssignDietPlan({
						diet_id: dietId,
						users: userIds,
					})
				}

				setAssignedUsers([...assignedUsers, ...newUsers])
				onChange(null)
				setShowModal(false)
				toast.success('User assigned successfully')
			} else {
				toast.error('Please select at least one user')
			}
		} catch (error: any) {
			toast.error(error.message)
		}
	}

	const handleRemoveUser = async (userId: string) => {
		try {
			if (dietId) {
				await WithdrawDietPlan({
					id: userId,
				})
			}

			setAssignedUsers(assignedUsers.filter((user) => user.id !== userId))
			toast.success('User removed successfully')
		} catch (error: any) {
			toast.error(error.message || 'Failed to remove user')
		}
	}

	const handleFoodTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedFoodTime(e.target.value)
		// Reset pagination and list when filter changes
		setPage(1)
		setHasMore(true)
		setFoodItems([])
		setFilteredFoodItems([])
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
		// Reset list and pagination; fetch will react via debouncedSearch effect
		setPage(1)
		setHasMore(true)
	}

	const handleAddBundle = () => {
		if (selectedItem === null || !selectedBundle) {
			toast.error('Please select a food bundle first')
			return
		}

		setShowTimeModal(true)
	}

	const handleViewBundle = async (bundle: any) => {
		setViewBundle(bundle)
		setShowViewModal(true)
		setBundleInfoLoading(true)

		try {
			const response: any = await GetFoodBundle({
				id: bundle.bundle_id || bundle.id,
			})

			if (response && response.data && response.data.bundle_items) {
				const processedItems = response.data.bundle_items.map((item: any) => {
					if (item.food && item.food.thumbnail_url && !item.food.thumbnail_image) {
						item.food.thumbnail_image = item.food.thumbnail_url
					}
					return item
				})
				setBundleItemsData(processedItems)
			}
		} catch (error) {
			console.error('Failed to fetch bundle details', error)
			toast.error('Failed to load bundle details')
		} finally {
			setBundleInfoLoading(false)
		}
	}

	const handleBundleInfo = async (bundle: any) => {
		setBundleInfoData(bundle)
		setShowBundleInfoModal(true)
		setBundleInfoLoading(true)

		try {
			const response: any = await GetFoodBundle({
				id: bundle.bundle_id,
			})

			if (response && response.data && response.data.bundle_items) {
				const processedItems = response.data.bundle_items.map((item: any) => {
					if (item.food && item.food.thumbnail_url && !item.food.thumbnail_image) {
						item.food.thumbnail_image = item.food.thumbnail_url
					}
					return item
				})
				setBundleItemsData(processedItems)
			}
		} catch (error) {
			console.error('Failed to fetch bundle details', error)
			toast.error('Failed to load bundle details')
		} finally {
			setBundleInfoLoading(false)
		}
	}

	const handleEditBundle = (bundle: any) => {
		setEditBundle(bundle)
		setEditTime(bundle.time)
		setSelectedFoodTime(bundle.food_time_id || '')
		setShowEditModal(true)
	}

	const handleEditSubmit = async () => {
		if (!editTime) {
			toast.error('Please select a time')
			return
		}
		// if (!editBundle?.food_time_id) {
		//     toast.error('Please select a food time')
		//     return
		// }

		try {
			let hours: number
			let minutes: number

			if (editTime.includes(':')) {
				const [h, m] = editTime.split(':')
				hours = parseInt(h, 10)
				minutes = parseInt(m, 10)
			} else {
				hours = parseInt(editTime, 10)
				minutes = 0
			}

			if (
				isNaN(hours) ||
				hours < 0 ||
				hours > 23 ||
				isNaN(minutes) ||
				minutes < 0 ||
				minutes > 59
			) {
				toast.error('Please enter a valid time in 24-hour format (HH:MM)')
				return
			}

			const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
				.toString()
				.padStart(2, '0')}`

			const payload = {
				diet_plan_item_id: editBundle.id,
				food_bundle_id: editBundle.bundle_id,
				time: formattedTime,
				food_time_id: editBundle.food_time_id,
			}

			await UpdateDietPlanItem(payload)

			const updatedBundles = bundleItems.map((item) => {
				if (item.id === editBundle.id) {
					return {
						...item,
						time: formattedTime,
					}
				}
				return item
			})

			setBundleItems(updatedBundles)
			setShowEditModal(false)
			toast.success('Bundle time updated successfully')
		} catch (error: any) {
			toast.error(error.message || 'Failed to update bundle time')
		}
	}

	const handleRemoveBundle = async (id: string, name: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: `Do you want to remove "${name}" bundle?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, remove it',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					await RemoveDietPlanItem({ diet_plan_item_id: id })

					setBundleItems(bundleItems.filter((item) => item.id !== id))
					toast.success('Bundle removed successfully')

					if (dietId) {
						const response: any = await GetDietPlan({ id: dietId })
						if (response && response.data && response.data.length > 0) {
							const dietData = response.data[0]
							setDietInfo(dietData)
						}
					}
				} catch (error: any) {
					toast.error(error.message || 'Failed to remove bundle')
				}
			}
		})
	}

	const handleTimeModalSubmit = async () => {
		if (!assignTime) {
			toast.error('Please select a time')
			return
		}

		setBundleAssignLoading(true)
		try {
			const formattedTime = assignTime.includes(':') ? assignTime : `${assignTime}:00`

			if (dietId && selectedBundle) {
				const data: any = {
					diet_id: dietId,
					food_bundle_id: selectedBundle.bundle_id,
					time: formattedTime,
					food_time_id: selectedFoodTime || selectedBundle.food_time_id,
				}
				const response = await AddDietPlanItem(data)

				const dietResponse: any = await GetDietPlan({ id: dietId })
				if (dietResponse && dietResponse.data && dietResponse.data.length > 0) {
					const dietData = dietResponse.data[0]
					setDietInfo(dietData)

					if (dietData.diet_items && dietData.diet_items.length > 0) {
						const loadedBundleItems = dietData.diet_items.map((item: any, index: number) => ({
							id: item._id,
							name: item.food_bundle?.bundle_name || 'Unnamed Bundle',
							time: item.time || '08:00',
							category: item.food_bundle?.food_category_info?.category || 'Not specified',
							mealTime: item.diet_items_time_info?.food_time || 'Not specified',
							bundle_id: item.food_bundle?._id || '',
							food_bundle: item.food_bundle || null,
							description: item.food_bundle?.description || 'No description available',
							ingredients: item.food_bundle?.ingredients || [],
							nutritional_value: item.food_bundle?.nutritional_value || {
								calories: 0,
								protein: 0,
								carbs: 0,
								fats: 0,
							},
						}))
						setBundleItems(loadedBundleItems)
						await preloadBundleImages(loadedBundleItems)
					}
				}
			}

			setSelectedItem(null)
			setSelectedBundle(null)
			setAssignTime('')
			setShowTimeModal(false)

			toast.success('Bundle assigned successfully')
		} catch (error: any) {
			toast.error(error.message || 'Failed to assign bundle')
		} finally {
			setBundleAssignLoading(false)
		}
	}

	const formatNumber = (value: number | null | undefined): string => {
		if (value == null) return ''
		return Number(value) % 1 === 0 ? Number(value).toString() : Number(value).toFixed(2)
	}

	const formatUnit = (unit: string | undefined): string => {
		if (!unit) return 'KG'

		const lowerUnit = unit.toLowerCase()

		if (lowerUnit.includes('kilogram') || lowerUnit.includes('kg') || lowerUnit === 'k') {
			return 'KG'
		} else if (lowerUnit.includes('gram') || lowerUnit.includes('gm') || lowerUnit === 'g') {
			return 'gm'
		} else if (
			lowerUnit.includes('millilitre') ||
			lowerUnit.includes('milliliter') ||
			lowerUnit.includes('ml')
		) {
			return 'ml'
		} else if (lowerUnit.includes('litre') || lowerUnit.includes('liter') || lowerUnit === 'l') {
			return 'L'
		} else if (
			lowerUnit.includes('tablespoon') ||
			lowerUnit.includes('tbsp') ||
			lowerUnit === 'tbs'
		) {
			return 'tbsp'
		}

		return unit
	}
	const handleBundleEdit = async (bundle: any) => {
		setEditLoadingId(bundle.bundle_id)
		setUpdateBundleData(bundle)
		try {
			const response: any = await GetFoodBundle({ id: bundle.bundle_id })

			if (response && response.data) {
				setUpdateBundleForm({
					bundle_name: response.data.bundle_name || '',
					category_id: response.data.food_category?._id || '',
					time_id: response.data.food_time?.[0]?._id || '',
					video_url: response.data.video_url || '',
				})

				if (response.data.bundle_items) {
					const processedItems = response.data.bundle_items.map((item: any) => {
						if (item.food && item.food.thumbnail_url && !item.food.thumbnail_image) {
							item.food.thumbnail_image = item.food.thumbnail_url
						}
						return item
					})

					setBundleItemsData(processedItems)

					const imagesToPreload = processedItems
						.filter((item: any) => item.food && item.food.thumbnail_image)
						.map((item: any) => preloadImage(item.food.thumbnail_image))

					await Promise.all(imagesToPreload)
				}

				setShowUpdateBundleModal(true)
			}
		} catch (error) {
			console.error('Failed to fetch bundle details for editing', error)
			toast.error('Failed to load bundle details')
		} finally {
			setEditLoadingId(null)
		}
	}

	const handleUpdateBundleSubmit = async () => {
		try {
			setIshandleUpdateBundleSubmitLoading(true)
			await UpdateFoodBundle({
				id: updateBundleData.bundle_id,
				bundle_name: updateBundleForm.bundle_name,
				food_category_id: updateBundleForm.category_id,
				food_time_id: updateBundleForm.time_id,
				video_url: updateBundleForm.video_url,
				thumbnail_url: updateBundleData.thumbnail_url,
			})

			setBundleItems((prevItems) =>
				prevItems.map((item) => {
					if (item.bundle_id === updateBundleData.bundle_id) {
						const selectedCategory = categories.find(
							(cat) => cat._id === updateBundleForm.category_id
						)
						const selectedTime = foodTimes.find((time) => time._id === updateBundleForm.time_id)

						return {
							...item,
							name: updateBundleForm.bundle_name,
							category: selectedCategory?.category || item.category,
							mealTime: selectedTime?.food_time || item.mealTime,
							food_bundle: {
								...item.food_bundle,
								bundle_name: updateBundleForm.bundle_name,
								food_category_info: selectedCategory
									? { ...selectedCategory }
									: item.food_bundle?.food_category_info,
								food_time_info: selectedTime
									? { ...selectedTime }
									: item.food_bundle?.food_time_info,
								food_bundle_items: item.food_bundle?.food_bundle_items || [],
								ingredients: item.food_bundle?.ingredients || [],
								nutritional_value: item.food_bundle?.nutritional_value || {},
								description: item.food_bundle?.description,
								thumbnail_url: item.food_bundle?.thumbnail_url,
								video_url: updateBundleForm.video_url,
							},
						}
					}
					return item
				})
			)

			const bundleResponse: any = await GetFoodBundle({
				id: updateBundleData.bundle_id,
			})

			if (bundleResponse && bundleResponse.data) {
				setBundleItems((prevItems) =>
					prevItems.map((item) => {
						if (item.bundle_id === updateBundleData.bundle_id) {
							const mergedFoodBundle = {
								...item.food_bundle,
								...bundleResponse.data,
								food_bundle_items:
									bundleResponse.data.food_bundle_items ||
									item.food_bundle?.food_bundle_items ||
									[],
							}

							return {
								...item,
								food_bundle: mergedFoodBundle,
							}
						}
						return item
					})
				)

				await preloadBundleImages(bundleItems)
			}
			setIshandleUpdateBundleSubmitLoading(false)
			setShowUpdateBundleModal(false)
			setShowUpdateBundleItemsModal(true)

			toast.success('Bundle updated successfully')
		} catch (error: any) {
			toast.error(error.message || 'Failed to update bundle')
		}
	}

	const handleUpdateBundleItemsSubmit = async () => {
		try {
			setIshandleUpdateBundleItemsSubmitLoading(true)
			if (bundleItemsData.length === 0) {
				toast.error('Please add at least one food item to the bundle')
				return
			}

			for (const item of bundleItemsData) {
				if (!item.food || !item.food._id) {
					toast.error('All food items must have a food selected')
					return
				}
				// if (!item.quantity || parseFloat(item.quantity) <= 0) {
				// 	toast.error('All food items must have a valid quantity')
				// 	return
				// }
			}

			for (const item of bundleItemsData) {
				await UpdateFoodBundleItem({
					id: item._id,
					bundle_id: updateBundleData.bundle_id,
					food_id: item.food._id,
					quantity: parseFloat(item.quantity),
					quantity_unit: item.food.quantity_unit || '',
				})
			}

			toast.success('Bundle items updated successfully')
			setShowUpdateBundleItemsModal(false)

			if (selectedFoodTime) {
				const response: any = await GetFoodBundle({
					food_time_id: selectedFoodTime,
				})

				const formattedItems = response.data.map((item: any, index: number) => ({
					id: index,
					bundle_id: item._id,
					name: item.bundle_name,
					calories: item.calories || 0,
					time: item.food_time?.[0]?.food_time || 'Not specified',
					category: item.food_category?.category || 'Not specified',
					description: item.description || 'No description available',
					ingredients: item.ingredients || [],
					nutritional_value: item.nutritional_value || {
						calories: 0,
						protein: 0,
						carbs: 0,
						fats: 0,
					},
				}))

				setFoodItems(formattedItems)
				setFilteredFoodItems(formattedItems)

				if (dietId) {
					const dietResponse: any = await GetDietPlan({ id: dietId })
					if (dietResponse && dietResponse.data && dietResponse.data.length > 0) {
						const dietData = dietResponse.data[0]

						if (dietData.diet_items && dietData.diet_items.length > 0) {
							const loadedBundleItems = dietData.diet_items.map((item: any, index: number) => ({
								id: item._id,
								name: item.food_bundle?.bundle_name || 'Unnamed Bundle',
								time: item.time || '08:00',
								category: item.food_bundle?.food_category?.category || 'Not specified',
								food_bundle: item.food_bundle,
								bundle_id: item.food_bundle_id || item.food_bundle?._id || '',
								mealTime: item.diet_items_time_info?.food_time || 'Not specified',
								description: item.food_bundle?.description || 'No description available',
								ingredients: item.food_bundle?.ingredients || [],
								nutritional_value: item.food_bundle?.nutritional_value || {
									calories: 0,
									protein: 0,
									carbs: 0,
									fats: 0,
								},
								startDate: item.start_date || DayJS().format('DD-MM-YYYY'),
								endDate: item.end_date || DayJS().add(30, 'day').format('DD-MM-YYYY'),
							}))

							setBundleItems(loadedBundleItems)
							await preloadBundleImages(loadedBundleItems)
						}
					}
				}
			}
			setShowNewItemRow(false)
			setIshandleUpdateBundleItemsSubmitLoading(false)
		} catch (error: any) {
			toast.error(error.message || 'Failed to update bundle items')
		}
	}

	const handleDeleteBundleItem = async (itemId: string) => {
		try {
			setDeletingItemId(itemId)
			setIshandleDeleteBundleItemLoading(true)
			await RemoveFoodBundleItem({ id: itemId })

			setBundleItemsData(bundleItemsData.filter((item) => item._id !== itemId))
			setIshandleDeleteBundleItemLoading(false)
			toast.success('Item removed successfully')
		} catch (error: any) {
			toast.error(error.message || 'Failed to remove item')
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		setUpdateBundleForm((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	const handleAddNewFoodItem = () => {
		setNewFoodItem({
			food_id: '',
			food_name: '',
			thumbnail_image: '',
			quantity: '0',
			quantity_unit: ' ',
			fat: '0',
			protein: '0',
			carbs: '0',
			calories: '0',
		})

		setShowNewItemRow(true)
	}

	const handleNewFoodItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target

		if (name === 'food_id' && value) {
			const selectedFood = allFoodItems.find((item) => item._id === value)
			if (selectedFood) {
				setNewFoodItem({
					...newFoodItem,
					food_id: value,
					food_name: selectedFood.food_name || '',
					thumbnail_image: selectedFood.thumbnail_image || selectedFood.thumbnail_url || '',
					fat: selectedFood.fats,
					protein: selectedFood.protein,
					carbs: selectedFood.carbs,
					calories: selectedFood.calories,
					quantity: selectedFood.quantity,
					quantity_unit: selectedFood.quantity_unit,
				})
			} else {
				setNewFoodItem({
					...newFoodItem,
					[name]: value,
				})
			}
		} else if (name === 'quantity') {
			const newQuantity = parseFloat(value as string)
			if (isNaN(newQuantity) || newQuantity < 0) {
				setNewFoodItem({
					...newFoodItem,
					quantity: '0',
					carbs: '0',
					calories: '0',
					protein: '0',
					fat: '0',
				})
				return
			}

			const selectedFood = allFoodItems.find((item) => item._id === newFoodItem.food_id)
			if (selectedFood && selectedFood.quantity) {
				const baseQty = Number(selectedFood.quantity) || 0
				const factor = baseQty > 0 ? newQuantity / baseQty : 0
				const safeNum = (v: any) => {
					const n = Number(v)
					return isNaN(n) ? 0 : n
				}

				setNewFoodItem({
					...newFoodItem,
					quantity: newQuantity.toString(),
					carbs: (safeNum(selectedFood.carbs) * factor).toString(),
					calories: (safeNum(selectedFood.calories) * factor).toString(),
					protein: (safeNum(selectedFood.protein) * factor).toString(),
					fat: (safeNum(selectedFood.fats) * factor).toString(),
				})
			} else {
				setNewFoodItem({ ...newFoodItem, quantity: newQuantity.toString() })
			}
		} else {
			setNewFoodItem({
				...newFoodItem,
				[name]: value,
			})
		}
	}

	const handleSaveNewFoodItem = async () => {
		try {
			if (!newFoodItem.food_id) {
				toast.error('Please select a food item')
				return
			}

			// if (!newFoodItem.quantity || parseFloat(newFoodItem.quantity) <= 0) {
			// 	toast.error('Please enter a valid quantity')
			// 	return
			// }

			// if (!newFoodItem.quantity_unit) {
			// 	toast.error('Please select a quantity unit')
			// 	return
			// }

			setIshandleSaveNewFoodItemLoading(true)
			const selectedFood = allFoodItems.find((item) => item._id === newFoodItem.food_id)

			if (selectedFood) {
				if (selectedFood.quantity_unit !== newFoodItem.quantity_unit) {
					await UpdateFood({
						id: selectedFood._id,
						food_name: selectedFood.food_name,
						calories: selectedFood.calories,
						carbs: selectedFood.carbs,
						protein: selectedFood.protein,
						fat: selectedFood.fats,
						quantity: selectedFood.quantity,
						quantity_unit: newFoodItem.quantity_unit,
						video_url: selectedFood.video_url || '',
						thumbnail_url: selectedFood.thumbnail_image || '',
					})
				}
			}

			const bundleId = showCreateBundleItemsModal ? newCreatedBundleId : updateBundleData?.bundle_id

			if (!bundleId) {
				toast.error('Bundle ID is missing')
				return
			}

			const response: any = await AddFoodBundleItem({
				bundle_id: bundleId,
				food_id: newFoodItem.food_id,
				quantity: parseFloat(newFoodItem.quantity),
				quantity_unit: newFoodItem.quantity_unit,
			})

			if (response) {
				// setIshandleSaveNewFoodItemLoading(false)
				// toast.success('Food item added successfully')

				const bundleResponse: any = await GetFoodBundle({
					id: bundleId,
				})

				if (bundleResponse && bundleResponse.data && bundleResponse.data.bundle_items) {
					const processedItems = bundleResponse.data.bundle_items.map((item: any) => {
						if (item.food && item.food.thumbnail_url && !item.food.thumbnail_image) {
							item.food.thumbnail_image = item.food.thumbnail_url
						}
						return item
					})
					setBundleItemsData(processedItems)
				} else {
					const newItem = {
						_id: response.data?._id || `temp-${Date.now()}`,
						food: selectedFood,
						quantity: newFoodItem.quantity,
					}

					setBundleItemsData((prevItems) => [...prevItems, newItem])
				}

				setNewFoodItem({
					food_id: '',
					food_name: '',
					thumbnail_image: '',
					quantity: '0',
					quantity_unit: '',
					fat: '0',
					protein: '0',
					carbs: '0',
					calories: '0',
				})

				setIshandleSaveNewFoodItemLoading(false)
				toast.success('Food item added successfully')
				setShowNewItemRow(false)
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to add food item')
		}
	}

	const handleCancelNewFoodItem = () => {
		setShowNewItemRow(false)
		setNewFoodItem({
			food_id: '',
			food_name: '',
			thumbnail_image: '',
			quantity: '0',
			quantity_unit: '',
			fat: '0',
			protein: '0',
			carbs: '0',
			calories: '0',
		})
	}

	const handleShowCreateBundleModal = () => {
		setCreateBundleForm({
			bundle_name: '',
			category_id: '',
			time_id: '',
			video_url: '',
		})
		setShowCreateBundleModal(true)
	}

	const handleCreateBundleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setCreateBundleForm((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	const handleCreateBundleSubmit = async () => {
		try {
			if (
				!createBundleForm.bundle_name ||
				!createBundleForm.category_id ||
				!createBundleForm.time_id
			) {
				toast.error('Please fill all required fields')
				return
			}
			setIshandleCreateBundleSubmitLoading(true)

			const response: any = await AddFoodBundle({
				bundle_name: createBundleForm.bundle_name,
				food_category_id: createBundleForm.category_id,
				food_time_id: createBundleForm.time_id,
				video_url: createBundleForm.video_url,
				thumbnail_url: '',
			})

			if (response && response.data) {
				const newBundleId = response.data._id || response.data.id
				setNewCreatedBundleId(newBundleId)

				try {
					const bundleResponse: any = await GetFoodBundle({
						id: newBundleId,
					})

					if (bundleResponse && bundleResponse.data) {
						const processedItems = (bundleResponse.data.bundle_items || []).map((item: any) => {
							if (item.food && item.food.thumbnail_url && !item.food.thumbnail_image) {
								item.food.thumbnail_image = item.food.thumbnail_url
							}
							return item
						})
						setBundleItemsData(processedItems)
					} else {
						setBundleItemsData([])
					}
				} catch (error) {
					console.error('Failed to fetch new bundle details', error)
					setBundleItemsData([])
				}
				setShowCreateBundleModal(false)
				setShowCreateBundleItemsModal(true)
				toast.success('Bundle created successfully. Now add food items.')
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to create bundle')
		} finally {
			setIshandleCreateBundleSubmitLoading(false)
		}
	}

	const handleCreateBundleItemsSubmit = async () => {
		try {
			setShowNewItemRow(false)
			if (bundleItemsData.length === 0) {
				toast.error('Please add at least one food item to the bundle')
				return
			}

			for (const item of bundleItemsData) {
				if (!item.food || !item.food._id) {
					toast.error('All food items must have a food selected')
					return
				}
			}
			setIshandleCreateBundleItemsSubmitLoading(true)

			toast.success('Bundle items saved successfully')
			setShowCreateBundleItemsModal(false)

			if (selectedFoodTime) {
				const response: any = await GetFoodBundle({
					food_time_id: selectedFoodTime,
				})

				const formattedItems = response.data.map((item: any, index: number) => ({
					id: index,
					bundle_id: item._id,
					name: item.bundle_name,
					calories: item.calories || 0,
					time: item.food_time?.[0]?.food_time || 'Not specified',
					category: item.food_category?.category || 'Not specified',
					description: item.description || 'No description available',
					ingredients: item.ingredients || [],
					nutritional_value: item.nutritional_value || {
						calories: 0,
						protein: 0,
						carbs: 0,
						fats: 0,
					},
				}))

				setFoodItems(formattedItems)
				setFilteredFoodItems(formattedItems)
			}

			setCreateBundleForm({
				bundle_name: '',
				category_id: '',
				time_id: '',
				video_url: '',
			})
			setNewCreatedBundleId('')
		} catch (error: any) {
			toast.error(error.message || 'Failed to save bundle items')
		} finally {
			setIshandleCreateBundleItemsSubmitLoading(false)
		}
	}

	const handleAppPreview = async () => {
		setShowMobilePreview(true)

		if (bundleItems.length > 0) {
			const firstMeal = { ...bundleItems[0] }
			setSelectedMeal(firstMeal)

			try {
				setBundleInfoLoading(true)
				const response: any = await GetFoodBundle({
					id: firstMeal.bundle_id,
				})

				if (response && response.data) {
					if (response.data.bundle_items) {
						setMealIngredients(response.data.bundle_items)
					}

					const updatedMeal = {
						...firstMeal,
						food_bundle: {
							...firstMeal.food_bundle,
							total_calculated_protein:
								response.data.total_calculated_protein ||
								firstMeal.food_bundle?.total_calculated_protein ||
								0,
							total_calculated_fats:
								response.data.total_calculated_fats ||
								firstMeal.food_bundle?.total_calculated_fats ||
								0,
							total_calculated_carbs:
								response.data.total_calculated_carbs ||
								firstMeal.food_bundle?.total_calculated_carbs ||
								0,
							total_calculated_calories:
								response.data.total_calculated_calories ||
								firstMeal.food_bundle?.total_calculated_calories ||
								0,
						},
					}
					setSelectedMeal(updatedMeal)
				}
			} catch (error) {
				console.error('Failed to fetch meal ingredients', error)
			} finally {
				setBundleInfoLoading(false)
			}
		}
	}

	const handleMealClick = async (meal: any) => {
		const mealData = {
			...meal,
		}
		setSelectedMeal(mealData)

		try {
			setBundleInfoLoading(true)
			const response: any = await GetFoodBundle({
				id: meal.bundle_id,
			})

			if (response && response.data) {
				if (response.data.bundle_items) {
					const ingredients = response.data.bundle_items
					const imagePromises = ingredients
						.filter((item: any) => item.food && item.food.thumbnail_image)
						.map((item: any) => preloadImage(item.food.thumbnail_image))

					await Promise.all(imagePromises)
					setMealIngredients(ingredients)
				}
				const updatedMeal = {
					...mealData,
					food_bundle: {
						...mealData.food_bundle,
						total_calculated_protein:
							response.data.total_calculated_protein ||
							mealData.food_bundle?.total_calculated_protein ||
							0,
						total_calculated_fats:
							response.data.total_calculated_fats ||
							mealData.food_bundle?.total_calculated_fats ||
							0,
						total_calculated_carbs:
							response.data.total_calculated_carbs ||
							mealData.food_bundle?.total_calculated_carbs ||
							0,
						total_calculated_calories:
							response.data.total_calculated_calories ||
							mealData.food_bundle?.total_calculated_calories ||
							0,
					},
				}

				setSelectedMeal(updatedMeal)
			}
		} catch (error) {
			console.error('Failed to fetch meal ingredients', error)
		} finally {
			setBundleInfoLoading(false)
		}
	}

	const handleCloseMobilePreview = () => {
		setShowMobilePreview(false)
		setSelectedMeal(null)
		setMealIngredients([])
	}

	useEffect(() => {
		const style = document.createElement('style')
		style.innerHTML = `
			@keyframes fadeIn {
				from { opacity: 0; }
				to { opacity: 1; }
			}
			.meal-card-image, .food-img img, .bundle-image img {
				animation: fadeIn 0.3s ease-in-out;
			}
		`
		document.head.appendChild(style)

		return () => {
			document.head.removeChild(style)
		}
	}, [])

	useEffect(() => {
		const foodCollapse = foodCollapseRef.current
			? new Collapse(foodCollapseRef.current, { toggle: false })
			: null

		if (
			foodCollapse &&
			foodCollapseRef.current &&
			!foodCollapseRef.current.classList.contains('show')
		) {
			foodCollapse.show()
		}
	}, [])

	const handleToggle = (panel: 'user' | 'food') => {
		const userCollapseEl = userCollapseRef.current
		const foodCollapseEl = foodCollapseRef.current

		const userCollapse = userCollapseEl ? new Collapse(userCollapseEl, { toggle: false }) : null

		const foodCollapse = foodCollapseEl ? new Collapse(foodCollapseEl, { toggle: false }) : null

		if (panel === 'user' && userCollapse && userCollapseEl) {
			if (userCollapseEl.classList.contains('show')) {
				userCollapse.hide()
			} else {
				userCollapse.show()
			}
		}

		if (panel === 'food' && foodCollapse && foodCollapseEl) {
			if (foodCollapseEl.classList.contains('show')) {
				foodCollapse.hide()
			} else {
				foodCollapse.show()
			}
		}
	}

	return (
		<div className='assign-food'>
			<div className='d-flex diet-detail-container '>
				<div
					className='food-bundles-and-users accordion'
					id='accordionExample'>
					<div className='user-collapse '>
						<div
							className='card-header row border-0 cursor-pointer'
							role='button'
							onClick={ () => handleToggle('user') }>
							<div className='card-title m-0 d-flex align-items-center justify-content-between'>
								<h3 className='fw-bolder m-0'>Users</h3>
								<FontAwesomeIcon
									icon={ faAngleDown }
									className='fs-3'
								/>
							</div>
						</div>
						<div
							id='kt_user_view'
							className='collapse'
							ref={ userCollapseRef }>
							<div className='card-body mt-10'>
								<div className='user-assign d-flex justify-content-end align-items-center mb-3'>
									<div
										className='user-assign-btn cursor-pointer'
										onClick={ () => setShowModal(true) }>
										<span>User Assign</span>
										<FontAwesomeIcon
											icon={ faSquarePlus }
											className='fs-2'
										/>
									</div>
								</div>
								<div className='user-card-container'>
									{ assignedUsers.length > 0 ? (
										assignedUsers.map((user, index) => (
											<div
												key={ `${user.id}_${index}` }
												className='user-card bg-white rounded p-3 mb-3 d-flex align-items-center justify-content-between'>
												<div className='d-flex align-items-center'>
													<div className='avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3'>
														<span>
															{ user.firstName[0] }
															{ user.lastName[0] }
														</span>
													</div>
													<div>
														<h5 className='mb-0'>
															{ user.firstName } { user.lastName }
														</h5>
														<p className='text-muted mb-0'>{ user.email }</p>
													</div>
												</div>
												<div
													className='remove-user-btn cursor-pointer'
													onClick={ () => handleRemoveUser(user.id) }>
													<FontAwesomeIcon
														icon={ faXmark }
														className='fs-4 text-dark'
													/>
												</div>
											</div>
										))
									) : (
										<div className='text-center p-5'>
											<FontAwesomeIcon
												icon={ faUserPlus }
												className='fs-1 text-muted mb-3'
											/>
											<p className='text-muted'>Please assign a user</p>
										</div>
									) }
								</div>
							</div>
						</div>
					</div>
					<div className='food-collapse '>
						<div
							className='card-header row border-0 cursor-pointer'
							role='button'
							onClick={ () => handleToggle('food') }>
							<div className='card-title m-0 d-flex align-items-center justify-content-between'>
								<h3 className='fw-bolder m-0'>Food Bundles</h3>
								<FontAwesomeIcon
									icon={ faAngleDown }
									className='fs-3'
								/>
							</div>
						</div>
						<div
							id='kt_food_bundle_view'
							className='collapse'
							ref={ foodCollapseRef }>
							<div className='food-bundle-body mt-10'>
								<div className='food-bundle-search d-flex align-items-center gap-2 '>
									<FontAwesomeIcon
										icon={ faMagnifyingGlass }
										className='fs-2 text-muted'
									/>
									<input
										type='text'
										placeholder='Search'
										className='border-0'
										value={ searchTerm }
										onChange={ handleSearchChange }
									/>
								</div>
							</div>
							<div className='food-bundle-time-and-create-bundle d-flex justify-content-between align-items-center '>
								<div className='food-bundle-select-time w-100'>
									<select
										className='form-select w-100'
										value={ selectedFoodTime }
										onChange={ handleFoodTimeChange }
										aria-label='Select food time'>
										<option value=''>Select Food Time</option>
										{ foodTimes.map((time, index) => (
											<option
												key={ `${time._id}_${index}` }
												value={ time._id }>
												{ time.food_time }
											</option>
										)) }
									</select>
								</div>
								<div className='food-bundle-create-bundle w-100'>
									<div
										className='food-bundle-create-bundle-btn'
										onClick={ handleShowCreateBundleModal }>
										<span>Create Bundle</span>
										<FontAwesomeIcon
											icon={ faSquarePlus }
											className='fs-2'
										/>
									</div>
								</div>
							</div>
							<div className='food-bundle-list'>
								{/* <div className='food-items-container'>
									{loading ? (
										<div className='d-flex justify-content-center align-items-center py-5'>
											<div
												className='spinner-border text-primary'
												role='status'>
												<span className='visually-hidden'>Loading...</span>
											</div>
										</div>
									) : selectedFoodTime ? (
										filteredFoodItems.length > 0 ? (
											filteredFoodItems.map((item) => (
												<div
													key={item.id}
													className={`food-item ${selectedItem === item.id ? 'selected' : ''}`}>
													<div className='food-item-radio'>
														<div
															className={`radio-circle ${
																selectedItem === item.id ? 'checked' : ''
															}`}
															onClick={() => handleSelectItem(item.id, item)}>
															<div className='radio-inner'>
																{selectedItem === item.id ? (
																	<FontAwesomeIcon
																		icon={faCheck}
																		className='check-icon'
																	/>
																) : (
																	<FontAwesomeIcon
																		icon={faCheck}
																		className='check-icon'
																	/>
																)}
															</div>
														</div>
													</div>
													<div className='food-item-content'>
														<div className='food-item-header d-flex justify-content-between align-items-center'>
															<h5>{item.name}</h5>
															<span className='calories'>{item.calories} cal</span>
														</div>
														<div className=' d-flex justify-content-between align-items-center'>
															<div className='d-flex gap-2'>
																<span className='food-time'>{item.time}</span>
																<span className='food-category'>{item.category}</span>
															</div>
															<button
																className='view-btn'
																onClick={() => handleViewBundle(item)}>
																View
															</button>
														</div>
													</div>
												</div>
											))
										) : (
											<div className='text-center py-5'>
												<p className='text-muted'>No food bundles found</p>
											</div>
										)
									) : (
										<div className='text-center py-5'>
											<img
												src='/media/svg/diet/select-time.svg'
												alt='Select Food Time'
												className='img-fluid mb-4'
												style={{ maxHeight: '115px' }}
											/>
											<p className='text-muted'>Please select a food time</p>
										</div>
									)}
								</div> */}
								<div className='food-items-container'>
									{ loading ? (
										<div className='d-flex justify-content-center align-items-center py-5'>
											<div
												className='spinner-border text-primary'
												role='status'>
												<span className='visually-hidden'>Loading...</span>
											</div>
										</div>
									) : filteredFoodItems.length > 0 ? (
										filteredFoodItems.map((item, index) => (
											<div
												key={ `${item._id}_${index}` }
												className={ `food-item ${selectedItem === item.id ? 'selected' : ''}` }>
												<div className='food-item-radio'>
													<div
														className={ `radio-circle ${selectedItem === item.id ? 'checked' : ''}` }
														onClick={ () => handleSelectItem(item.id, item) }>
														<div className='radio-inner'>
															<FontAwesomeIcon
																icon={ faCheck }
																className='check-icon'
															/>
														</div>
													</div>
												</div>
												<div className='food-item-content'>
													<div className='food-item-header d-flex justify-content-between align-items-center'>
														<h5
															title={ item.name }
															style={ {
																overflow: 'hidden',
																textOverflow: 'ellipsis',
															} }>
															{ (item.name.charAt(0).toUpperCase() + item.name.slice(1)).slice(
																0,
																50
															) }
															{ item.name.length > 50 ? '...' : '' }
														</h5>
														<span className='calories'>
															{ Number(item.calories) % 1 === 0
																? Number(item.calories).toString()
																: Number(item.calories).toFixed(2) }{ ' ' }
															cal
														</span>
													</div>
													<div className='d-flex justify-content-between align-items-center'>
														<div className='d-flex gap-2'>
															<span className='food-time'>{ item.time }</span>
															<span className='food-category'>{ item.category }</span>
														</div>
														<button
															className='view-btn'
															onClick={ () => handleViewBundle(item) }>
															View
														</button>
													</div>
												</div>
											</div>
										))
									) : (
										<div className='text-center py-5'>
											<p className='text-muted'>No food bundles found</p>
										</div>
									) }
									{/* Infinite loader sentinel */ }
									{ hasMore && !loading && (
										<div
											ref={ loadMoreRef }
											className='text-center py-3'>
											{ loadingMore ? (
												<div className='d-flex justify-content-center align-items-center'>
													<div
														className='spinner-border text-primary'
														role='status'>
														<span className='visually-hidden'>Loading...</span>
													</div>
												</div>
											) : (
												// <span className='text-muted'>Scroll to load more</span>
												<div className='d-flex justify-content-center align-items-center'>
													<div
														className='spinner-border text-primary'
														role='status'>
														<span className='visually-hidden'>Loading...</span>
													</div>
												</div>
											) }
										</div>
									) }
								</div>

								{/* <div className='food-item-add'>
									{selectedItem !== null && (
										<button
											className='add-btn'
											onClick={handleAddBundle}>
											Add
											<FontAwesomeIcon icon={faArrowRightLong} />
										</button>
									)}
								</div> */}

								<div className='food-item-add'>
									<button
										className={ `add-btn ${selectedItem === null ? 'btn-show' : ''}` }
										onClick={ handleAddBundle }>
										Add
										<FontAwesomeIcon icon={ faArrowRightLong } />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='bundle-assign-container'>
					<div className='bundle-title '>
						<div className='bundle-title-rigth-side'>
							<div>
								<h3>Diet Plan : { dietInfo ? dietInfo.plan_name : 'Loading...' }</h3>
								<p className='m-0'>Duration : { dietInfo ? dietInfo.days : 'Loading...' } Days</p>
							</div>
						</div>
						<h3>
							Food Category :{ ' ' }
							{ dietInfo && dietInfo.diet_food_category
								? dietInfo.diet_food_category.category
								: 'Loading...' }
						</h3>
						<div className='bundle-title-left-side'>
							<h3>Bundle Assignment</h3>
							<div className='total-bundle-count'>
								<span className='round'></span>
								<p>{ bundleItems.length } Assignments</p>
							</div>
						</div>
					</div>
					<div className='bundle-assign-list'>
						{ pageLoading ? (
							<div className='text-center py-5'>
								<div
									className='spinner-border text-primary'
									role='status'>
									<span className='visually-hidden'>Loading...</span>
								</div>
								<p className='mt-2'>Loading diet plan...</p>
							</div>
						) : bundleItems.length > 0 ? (
							<DragDropContext onDragEnd={ onDragEnd }>
								<Droppable droppableId='bundleList'>
									{ (provided: any) => (
										<div
											{ ...provided.droppableProps }
											ref={ provided.innerRef }>
											{ bundleItems.map((item, index) => (
												<Draggable
													key={ item.id }
													draggableId={ String(item.id) }
													index={ index }>
													{ (provided: any) => (
														<div
															className='bundle-assign-item'
															ref={ provided.innerRef }
															{ ...provided.draggableProps }
															style={ provided.draggableProps.style }>
															<div
																className='menu-icon-drag'
																{ ...provided.dragHandleProps }>
																<FontAwesomeIcon icon={ faBars } />
															</div>
															<div className='bundle-assign-item-content'>
																<div className='bundle-details col-5 pe-1'>
																	<div className='bundle-image'>
																		{ item.food_bundle &&
																			item.food_bundle.food_bundle_items &&
																			item.food_bundle.food_bundle_items.length > 0 &&
																			item.food_bundle.food_bundle_items[0].food_info &&
																			item.food_bundle.food_bundle_items[0].food_info
																				.thumbnail_image && (
																				<img
																					src={
																						item.food_bundle.food_bundle_items[0].food_info
																							.thumbnail_image
																					}
																					alt={
																						item.food_bundle.food_bundle_items[0].food_info
																							.food_name || 'Food item'
																					}
																				/>
																			) }
																	</div>
																	<div className='bundle-name-and-time'>
																		<div className='bundle-name'>
																			<h5
																				title={ item.name }
																				style={ {
																					overflow: 'hidden',
																					textOverflow: 'ellipsis',
																				} }>
																				{ (
																					item.name.charAt(0).toUpperCase() + item.name.slice(1)
																				).slice(0, 50) }
																				{ item.name.length > 50 ? '...' : '' }
																			</h5>
																		</div>
																		<div className='bundle-time-and-info'>
																			<div
																				className='bundle-info cursor-pointer'
																				onClick={ () => handleBundleInfo(item) }>
																				<p>bundle info</p>
																				<FontAwesomeIcon
																					icon={ faCircleInfo }
																					className='info-icon'
																				/>
																			</div>
																			<div
																				className='bundle-time cursor-pointer'
																				onClick={ () => handleEditBundle(item) }>
																				<FontAwesomeIcon
																					icon={ faClock }
																					className='time-icon'
																				/>
																				<p>{ DayJS(item.time, 'HH:mm').format('hh:mm A') }</p>
																			</div>
																		</div>
																	</div>
																</div>
																<div className='bundle-tags d-flex col-5 px-1'>
																	<div className='bundle-tag-time mx-1'>
																		<p>{ item.mealTime }</p>
																	</div>
																	<div className='bundle-tag-category mx-1'>
																		<p>{ item.category }</p>
																	</div>
																</div>
																<div className='bundle-edit-and-delete'>
																	<div
																		className='bundle-edit cursor-pointer'
																		onClick={ () => handleBundleEdit(item) }>
																		{ editLoadingId === item.bundle_id ? (
																			<div
																				className='spinner-border spinner-border-sm text-white'
																				role='status'>
																				<span className='visually-hidden'>Loading...</span>
																			</div>
																		) : (
																			<FontAwesomeIcon
																				icon={ faPencil }
																				className='edit-icon'
																			/>
																		) }
																	</div>
																	<div
																		className='bundle-delete cursor-pointer'
																		onClick={ () => handleRemoveBundle(item.id, item.name) }>
																		<FontAwesomeIcon
																			icon={ faTrash }
																			className='delete-icon'
																		/>
																	</div>
																</div>
															</div>
														</div>
													) }
												</Draggable>
											)) }
											{ provided.placeholder }
										</div>
									) }
								</Droppable>
							</DragDropContext>
						) : (
							<div className='text-center py-5'>
								<img
									src='/media/illustrations/food/no-food.png'
									alt='No Bundle Assigned'
									className='img-fluid'
									style={ { maxHeight: '350px' } }
								/>
								<p className='text-dark fw-bold mb-1 fs-1'>No bundle assigned</p>
								<p className='text-muted small'>Select a food bundle and click Add to assign</p>
							</div>
						) }
					</div>
				</div>
			</div>
			<div className='diet-footer d-flex  align-items-center'>
				<div className='app-preview-button'>
					<button
						className='app-preview-btn'
						onClick={ handleAppPreview }>
						<FontAwesomeIcon
							icon={ faMobileScreenButton }
							className='mobile-icon'
						/>
						<p>App Preview</p>
						<FontAwesomeIcon icon={ faArrowRightLong } />
					</button>
				</div>
				<div className='diet-macross-info'>
					<div className='diet-total-macross dite-edit d-flex justify-content-center align-items-center flex-column'>
						<p className='dite-edit-value'>Total</p>
						<p className='dite-edit-value'>Macros</p>
					</div>
					<div className='border-right'></div>
					<div className='diet-carbs dite-edit d-flex justify-content-center align-items-center flex-column'>
						<p className='dite-edit-value'>
							{ dietInfo?.total_diet_calculated_carbs != null
								? Number(dietInfo.total_diet_calculated_carbs) % 1 === 0
									? Number(dietInfo.total_diet_calculated_carbs).toString()
									: Number(dietInfo.total_diet_calculated_carbs).toFixed(2)
								: '' }
						</p>
						<p className='dite-edit-title'>Total Carbs</p>
					</div>
					<div className='diet-protein dite-edit d-flex justify-content-center align-items-center flex-column'>
						<p className='dite-edit-value'>
							{ dietInfo?.total_diet_calculated_protein != null
								? Number(dietInfo.total_diet_calculated_protein) % 1 === 0
									? Number(dietInfo.total_diet_calculated_protein).toString()
									: Number(dietInfo.total_diet_calculated_protein).toFixed(2)
								: '' }
						</p>
						<p className='dite-edit-title'>Total Protein</p>
					</div>
					<div className='diet-fat dite-edit d-flex justify-content-center align-items-center flex-column'>
						<p className='dite-edit-value'>
							{ dietInfo?.total_diet_calculated_fats != null
								? Number(dietInfo.total_diet_calculated_fats) % 1 === 0
									? Number(dietInfo.total_diet_calculated_fats).toString()
									: Number(dietInfo.total_diet_calculated_fats).toFixed(2)
								: '' }
						</p>
						<p className='dite-edit-title'>Total Fat</p>
					</div>
					<div className='diet-fat dite-edit d-flex justify-content-center align-items-center flex-column'>
						<p className='dite-edit-value'>
							{ dietInfo?.total_diet_calculated_calories != null
								? Number(dietInfo.total_diet_calculated_calories) % 1 === 0
									? Number(dietInfo.total_diet_calculated_calories).toString()
									: Number(dietInfo.total_diet_calculated_calories).toFixed(2)
								: '' }
						</p>
						<p className='dite-edit-title'>Total Calories</p>
					</div>
				</div>
			</div>

			{/* User Assign Modal */ }
			<Modal
				show={ showModal }
				centered
				onHide={ () => setShowModal(false) }
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-end'>
						<button
							onClick={ () => setShowModal(false) }
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={ faXmark }
							/>
						</button>
					</div>
					<div className='modal-body mx-3 pt-0 pb-15 overflow-visible'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>User Assign</h2>
						</div>
						<div>
							<label
								htmlFor='select'
								className='form-label'>
								Name
							</label>
							<AsyncPaginate
								debounceTimeout={ 1000 }
								value={ value }
								loadOptions={ loadUserOptions }
								closeMenuOnSelect={ false }
								onChange={ onChange }
								isMulti
							/>
						</div>
						<div className='mt-7 text-center'>
							<button
								type='button'
								onClick={ handleAssignUser }
								className='btn btn-primary w-50'>
								Add User
							</button>
						</div>
					</div>
				</div>
			</Modal>

			{/* Time Selection Modal */ }
			<Modal
				show={ showTimeModal }
				centered
				onHide={ () => setShowTimeModal(false) }
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Set Time</h2>
						<button
							onClick={ () => setShowTimeModal(false) }
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1'
								icon={ faXmark }
							/>
						</button>
					</div>
					<div className='modal-body mx-3'>
						<div className='mb-5'>
							<label
								htmlFor='assignTime'
								className='form-label required'>
								Bundle Time
							</label>
							<input
								type='time'
								id='assignTime'
								className='form-control'
								value={ assignTime }
								onChange={ (e) => setAssignTime(e.target.value) }
								required
							/>
						</div>
					</div>
					<div className='modal-footer'>
						<button
							type='button'
							className='btn btn-light'
							onClick={ () => setShowTimeModal(false) }>
							Cancel
						</button>
						<button
							type='button'
							className='btn btn-primary'
							onClick={ handleTimeModalSubmit }
							disabled={ bundleAssignLoading }>
							{ bundleAssignLoading ? (
								<>
									<span
										className='spinner-border spinner-border-sm'
										role='status'
										aria-hidden='true'></span>
									<span className='ms-2'>Assigning...</span>
								</>
							) : (
								'Assign Bundle'
							) }
						</button>
					</div>
				</div>
			</Modal>

			{/* Bundle Info Modal */ }
			<Modal
				show={ showBundleInfoModal }
				centered
				onHide={ () => setShowBundleInfoModal(false) }
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Food Bundle Info</h2>
						<button
							onClick={ () => setShowBundleInfoModal(false) }
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1'
								icon={ faXmark }
							/>
						</button>
					</div>
					<div className='modal-body mx-3'>
						{ bundleInfoData && (
							<div>
								<div className='mb-4'>
									<label className='form-label'>Bundle Name</label>
									<input
										type='text'
										className='form-control'
										value={ bundleInfoData.name }
										readOnly
									/>
								</div>

								{ bundleInfoLoading ? (
									<div className='d-flex justify-content-center my-5'>
										<div
											className='spinner-border text-primary'
											role='status'>
											<span className='visually-hidden'>Loading...</span>
										</div>
									</div>
								) : bundleItemsData && bundleItemsData.length > 0 ? (
									<div className='food-bundle-items'>
										{ bundleItemsData.map((item, index) => (
											<div
												key={ index }
												className='food-item-row mb-4'>
												<div className='mb-2'>
													<div className='row align-items-center'>
														<div className='col'>
															<label className='form-label'>Food</label>
															<div className='d-flex align-items-center'>
																<div className='food-img'>
																	<img
																		src={ item.food?.thumbnail_image || '/media/images/cheese.png' }
																		alt={ item.food?.food_name }
																	/>
																</div>
																<input
																	type='text'
																	className='form-control food-name-input'
																	value={ item?.food?.food_name || 'Food Item' }
																	readOnly
																/>
															</div>
														</div>
														<div className='col-4'>
															<label className='form-label'>Quantity</label>
															<div className='input-group'>
																<input
																	type='text'
																	className='form-control text-center'
																	value={
																		item?.quantity != null
																			? Number(item.quantity) % 1 === 0
																				? Number(item.quantity).toString()
																				: Number(item.quantity).toFixed(2)
																			: ''
																	}
																	readOnly
																/>
																<span className='input-group-text bg-light'>
																	{ formatUnit(item.food?.quantity_unit) }
																</span>
															</div>
														</div>
													</div>
												</div>
												<div>
													<div className='row'>
														<div className='col'>
															<label className='form-label'>Fat</label>
															<input
																type='text'
																className='form-control text-center'
																value={
																	item?.calculated_fat != null
																		? Number(item?.calculated_fat) % 1 === 0
																			? Number(item?.calculated_fat).toString()
																			: Number(item?.calculated_fat).toFixed(2)
																		: ''
																}
																readOnly
															/>
														</div>
														<div className='col'>
															<label className='form-label'>Protein</label>
															<input
																type='text'
																className='form-control text-center'
																value={
																	item?.calculated_protein != null
																		? Number(item?.calculated_protein) % 1 === 0
																			? Number(item?.calculated_protein).toString()
																			: Number(item?.calculated_protein).toFixed(2)
																		: ''
																}
																readOnly
															/>
														</div>
														<div className='col'>
															<label className='form-label'>Carbs</label>
															<input
																type='text'
																className='form-control text-center'
																value={
																	item?.calculated_carbs != null
																		? Number(item?.calculated_carbs) % 1 === 0
																			? Number(item?.calculated_carbs).toString()
																			: Number(item?.calculated_carbs).toFixed(2)
																		: ''
																}
																readOnly
															/>
														</div>
														<div className='col'>
															<label className='form-label'>Calories</label>
															<input
																type='text'
																className='form-control text-center'
																value={
																	item?.calculated_calories != null
																		? Number(item?.calculated_calories) % 1 === 0
																			? Number(item?.calculated_calories).toString()
																			: Number(item?.calculated_calories).toFixed(2)
																		: ''
																}
																readOnly
															/>
														</div>
													</div>
												</div>
												{ index < bundleItemsData.length - 1 && <hr className='my-4' /> }
											</div>
										)) }
									</div>
								) : (
									<div className='alert alert-info mb-0'>No food items found in this bundle.</div>
								) }
							</div>
						) }
					</div>
					<div className='modal-footer'>
						<button
							type='button'
							className='btn btn-light'
							onClick={ () => setShowBundleInfoModal(false) }>
							Close
						</button>
					</div>
				</div>
			</Modal>

			{/* Bundle View Modal */ }
			<Modal
				show={ showViewModal }
				centered
				onHide={ () => setShowViewModal(false) }
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Food Bundle Info</h2>
						<button
							onClick={ () => setShowViewModal(false) }
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1'
								icon={ faXmark }
							/>
						</button>
					</div>
					<div className='modal-body mx-3'>
						{ viewBundle && (
							<div>
								<div className='mb-4'>
									<label className='form-label'>Bundle Name</label>
									<input
										type='text'
										className='form-control'
										value={
											viewBundle.name
												? viewBundle.name.charAt(0).toUpperCase() + viewBundle.name.slice(1)
												: ''
										}
										readOnly
									/>
								</div>

								{ bundleInfoLoading ? (
									<div className='d-flex justify-content-center my-5'>
										<div
											className='spinner-border text-primary'
											role='status'>
											<span className='visually-hidden'>Loading...</span>
										</div>
									</div>
								) : bundleItemsData && bundleItemsData.length > 0 ? (
									<div className='food-bundle-items'>
										{ bundleItemsData.map((item, index) => (
											<div
												key={ index }
												className='food-item-row mb-4'>
												<div className='mb-2'>
													<div className='row align-items-center'>
														<div className='col'>
															<label className='form-label'>Food</label>
															<div className='d-flex align-items-center'>
																<div className='food-img'>
																	<img
																		src={ item.food?.thumbnail_image || '/media/images/cheese.png' }
																		alt={ item.food?.food_name }
																	/>
																</div>
																<input
																	type='text'
																	className='form-control food-name-input'
																	value={ item.food?.food_name || 'Food Item' }
																	readOnly
																/>
															</div>
														</div>
														<div className='col-4'>
															<label className='form-label'>Quantity</label>
															<div className='input-group'>
																<input
																	type='text'
																	className='form-control text-center'
																	value={
																		item?.quantity != null
																			? Number(item.quantity) % 1 === 0
																				? Number(item.quantity).toString()
																				: Number(item.quantity).toFixed(2)
																			: ''
																	}
																	readOnly
																/>
																<span className='input-group-text bg-light'>
																	{ formatUnit(item.food?.quantity_unit) }
																</span>
															</div>
														</div>
													</div>
												</div>
												<div>
													<div className='row'>
														<div className='col'>
															<label className='form-label'>Fat</label>
															<input
																type='text'
																className='form-control text-center'
																value={
																	item?.calculated_fat != null
																		? Number(item?.calculated_fat) % 1 === 0
																			? Number(item?.calculated_fat).toString()
																			: Number(item?.calculated_fat).toFixed(2)
																		: ''
																}
																readOnly
															/>
														</div>
														<div className='col'>
															<label className='form-label'>Protein</label>
															<input
																type='text'
																className='form-control text-center'
																value={
																	item?.calculated_protein != null
																		? Number(item?.calculated_protein) % 1 === 0
																			? Number(item?.calculated_protein).toString()
																			: Number(item?.calculated_protein).toFixed(2)
																		: ''
																}
																readOnly
															/>
														</div>
														<div className='col'>
															<label className='form-label'>Carbs</label>
															<input
																type='text'
																className='form-control text-center'
																value={
																	item?.calculated_carbs != null
																		? Number(item?.calculated_carbs) % 1 === 0
																			? Number(item?.calculated_carbs).toString()
																			: Number(item?.calculated_carbs).toFixed(2)
																		: ''
																}
																readOnly
															/>
														</div>
														<div className='col'>
															<label className='form-label'>Calories</label>
															<input
																type='text'
																className='form-control text-center'
																value={
																	item?.calculated_calories != null
																		? Number(item?.calculated_calories) % 1 === 0
																			? Number(item?.calculated_calories).toString()
																			: Number(item?.calculated_calories).toFixed(2)
																		: ''
																}
																readOnly
															/>
														</div>
													</div>
												</div>
												{ index < bundleItemsData.length - 1 && <hr className='my-4' /> }
											</div>
										)) }
									</div>
								) : (
									<div className='alert alert-info mb-0'>No food items found in this bundle.</div>
								) }
							</div>
						) }
					</div>
					<div className='modal-footer'>
						<button
							type='button'
							className='btn btn-light'
							onClick={ () => setShowViewModal(false) }>
							Close
						</button>
					</div>
				</div>
			</Modal>

			{/* Edit Bundle Time Modal */ }
			<Modal
				show={ showEditModal }
				centered
				onHide={ () => setShowEditModal(false) }
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Edit Bundle Time</h2>
						<button
							onClick={ () => setShowEditModal(false) }
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1'
								icon={ faXmark }
							/>
						</button>
					</div>
					<div className='modal-body mx-3'>
						{ editBundle && (
							<>
								<div className='mb-4'>
									<h4 className='fs-5 fw-bold mb-2'>{ editBundle.name }</h4>
								</div>
								<div className='mb-5'>
									<label
										htmlFor='editTime'
										className='form-label required'>
										Bundle Time
									</label>
									<input
										type='time'
										id='editTime'
										className='form-control'
										value={ editTime }
										onChange={ (e) => setEditTime(e.target.value) }
										required
									/>
								</div>
							</>
						) }
					</div>
					<div className='modal-footer'>
						<button
							type='button'
							className='btn btn-light'
							onClick={ () => setShowEditModal(false) }>
							Cancel
						</button>
						<button
							type='button'
							className='btn btn-primary'
							onClick={ handleEditSubmit }>
							Update Time
						</button>
					</div>
				</div>
			</Modal>

			{/* Update Bundle Modal - First Step */ }
			<Modal
				show={ showUpdateBundleModal }
				centered
				onHide={ () => setShowUpdateBundleModal(false) }
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Update Bundle</h2>
						<button
							onClick={ () => setShowUpdateBundleModal(false) }
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1'
								icon={ faXmark }
							/>
						</button>
					</div>
					<div className='modal-body mx-3'>
						{ updateBundleData && (
							<>
								<div className='mb-4'>
									<label
										htmlFor='bundleName'
										className='form-label'>
										Bundle Name
									</label>
									<input
										type='text'
										className='form-control'
										id='bundleName'
										name='bundle_name'
										value={
											updateBundleForm.bundle_name
												? updateBundleForm.bundle_name.charAt(0).toUpperCase() +
												updateBundleForm.bundle_name.slice(1)
												: ''
										}
										onChange={ handleInputChange }
									/>
								</div>

								<div className='row mb-4'>
									<div className='col-6'>
										<label
											htmlFor='category'
											className='form-label'>
											Category
										</label>
										<select
											className='form-select'
											id='category'
											name='category_id'
											value={ updateBundleForm.category_id }
											onChange={ handleInputChange }>
											<option value=''>Select Category</option>
											{ categories.map((category, index) => (
												<option
													key={ index }
													value={ category._id }>
													{ category.category }
												</option>
											)) }
										</select>
									</div>
									<div className='col-6'>
										<label
											htmlFor='time'
											className='form-label'>
											Time
										</label>
										<select
											className='form-select'
											id='time'
											name='time_id'
											value={ updateBundleForm.time_id }
											onChange={ handleInputChange }>
											<option value=''>Select Time</option>
											{ foodTimes.map((time, index) => (
												<option
													key={ `${time._id}_${index}` }
													value={ time._id }>
													{ time.food_time }
												</option>
											)) }
										</select>
									</div>
								</div>

								<div className='mb-4'>
									<label
										htmlFor='videoUrl'
										className='form-label'>
										Video URL
									</label>
									<input
										type='text'
										className='form-control'
										id='videoUrl'
										name='video_url'
										value={ updateBundleForm.video_url }
										onChange={ handleInputChange }
									/>
								</div>
							</>
						) }
					</div>
					<div className='modal-footer'>
						<button
							type='button'
							className='btn btn-light'
							onClick={ () => setShowUpdateBundleModal(false) }>
							Cancel
						</button>
						<button
							type='button'
							className={ `btn btn-primary d-flex align-items-center ${ishandleUpdateBundleSubmitLoading ? 'disabled' : ''
								}` }
							onClick={ handleUpdateBundleSubmit }
							disabled={ ishandleUpdateBundleSubmitLoading }>
							{ ishandleUpdateBundleSubmitLoading
								? 'Please wait, Updating Bundle...'
								: 'Update & Next' }
							{ !ishandleUpdateBundleSubmitLoading && (
								<FontAwesomeIcon
									icon={ faArrowRightLong }
									className='ms-2'
								/>
							) }
						</button>
					</div>
				</div>
			</Modal>

			{/* Update Bundle Items Modal - Second Step */ }
			<Modal
				show={ showUpdateBundleItemsModal }
				centered
				onHide={ () => setShowUpdateBundleItemsModal(false) }
				size='lg'
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Update Bundle Items</h2>
						<button
							onClick={ () => {
								setShowUpdateBundleItemsModal(false)
								setShowNewItemRow(false)
							} }
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1'
								icon={ faXmark }
							/>
						</button>
					</div>
					<div className='modal-body mx-3'>
						{ updateBundleData && (
							<>
								<div className='mb-4'>
									<label className='form-label'>Bundle Name</label>
									<input
										type='text'
										className='form-control'
										value={
											updateBundleForm.bundle_name
												? updateBundleForm.bundle_name.charAt(0).toUpperCase() +
												updateBundleForm.bundle_name.slice(1)
												: ''
										}
										readOnly
									/>
								</div>

								{ bundleItemsData && bundleItemsData.length > 0 ? (
									<div className='food-bundle-items'>
										{ bundleItemsData.map((item, index) => (
											<div
												key={ `bundle_item_${item._id || item.food?._id || Date.now()}_${index}` }
												className='food-item-row mb-4'>
												<div className='mb-2'>
													<div className='row align-items-center'>
														<div className='col'>
															<label className='form-label'>Food</label>
															<div className='d-flex align-items-center'>
																<div className='food-img'>
																	<img
																		src={ item.food?.thumbnail_image || '/media/images/cheese.png' }
																		alt={ item.food?.food_name }
																	/>
																</div>
																<AsyncPaginate
																	className='w-100'
																	placeholder='Select Food Item'
																	value={ item.food ? formatFoodOption(item.food) : null }
																	loadOptions={ loadFoodOptions }
																	onChange={ async (selectedOption: any) => {
																		if (selectedOption) {
																			try {
																				const response: any = await GetFood({
																					id: selectedOption.value,
																				})
																				const selectedFood =
																					(response?.data &&
																						(Array.isArray(response.data)
																							? response.data[0]
																							: response.data)) ||
																					null
																				const updatedItems = [...bundleItemsData]
																				updatedItems[index] = {
																					...updatedItems[index],
																					food: selectedFood,
																				}
																				setBundleItemsData(updatedItems)
																			} catch (error) {
																				console.error(
																					'Failed to fetch selected food details',
																					error
																				)
																			}
																		} else {
																			const updatedItems = [...bundleItemsData]
																			updatedItems[index] = {
																				...updatedItems[index],
																				food: null,
																			}
																			setBundleItemsData(updatedItems)
																		}
																	} }
																	getOptionLabel={ (option: any) => option.label }
																	getOptionValue={ (option: any) => option.value }
																/>
															</div>
														</div>
														<div className='col-3'>
															<label className='form-label'>Quantity</label>
															<div className='input-group'>
																<input
																	type='number'
																	min='0'
																	className='form-control text-center'
																	value={
																		item.quantity ??
																		(item?.quantity != null
																			? Number(item.quantity) % 1 === 0
																				? Number(item.quantity).toString()
																				: Number(item.quantity).toFixed(2)
																			: '')
																	}
																	onChange={ (e) => {
																		const newQuantity = parseFloat(e.target.value)
																		if (!isNaN(newQuantity)) {
																			const updatedItems = [...bundleItemsData]
																			updatedItems[index] = {
																				...updatedItems[index],
																				quantity: newQuantity,
																			}
																			setBundleItemsData(updatedItems)
																		}
																	} }
																/>

																<button
																	className='btn btn-light'
																	type='button'>
																	{ formatUnit(item.food?.quantity_unit) }
																</button>
															</div>
														</div>
														<div className='col-1 mt-auto pb-2 '>
															<button
																className='bundle-update-delete-btn'
																onClick={ () => handleDeleteBundleItem(item._id) }
																disabled={ deletingItemId === item._id }>
																{ deletingItemId === item._id ? (
																	<div
																		className='spinner-border spinner-border-sm text-light'
																		role='status'>
																		<span className='visually-hidden'>Loading...</span>
																	</div>
																) : (
																	<FontAwesomeIcon icon={ faTrash } />
																) }
															</button>
														</div>
													</div>
												</div>
												{ index < bundleItemsData.length - 1 && <hr className='my-4' /> }
											</div>
										)) }
										<button
											className='btn btn-primary btn-sm rounded-circle ms-auto d-flex align-items-center justify-content-center'
											style={ { width: '38px', height: '38px' } }
											onClick={ handleAddNewFoodItem }>
											<FontAwesomeIcon icon={ faSquarePlus } />
										</button>
									</div>
								) : (
									<>
										<div className='alert alert-info mb-4'>No food items found in this bundle.</div>
										<button
											className='btn btn-primary btn-sm rounded-circle ms-auto d-flex align-items-center justify-content-center'
											style={ { width: '38px', height: '38px' } }
											onClick={ handleAddNewFoodItem }>
											<FontAwesomeIcon icon={ faSquarePlus } />
										</button>
									</>
								) }

								{/* Add New Food Item Form */ }
								{ showNewItemRow && (
									<div className='new-food-item-form mt-4 mb-4'>
										<h5 className='mb-3'>Add New Food Item</h5>
										<div className='food-item-row'>
											<div className='row mb-3'>
												<div className='col'>
													<label className='form-label required'>Food</label>
													<div className='d-flex align-items-center'>
														<div className='d-flex align-items-center w-100'>
															<div className='food-img'>
																<img
																	src={
																		newFoodItem.thumbnail_image ||
																		allFoodItems.find((f) => f._id === newFoodItem.food_id)?.thumbnail_image ||
																		'/media/images/cheese.png'
																	}
																	alt={
																		newFoodItem.food_name ||
																		allFoodItems.find((f) => f._id === newFoodItem.food_id)?.food_name ||
																		'Food Image'
																	}
																	style={ {
																		width: '40px',
																		height: '40px',
																		objectFit: 'cover',
																		borderRadius: '4px',
																		marginRight: '10px',
																	} }
																/>
															</div>
															<AsyncPaginate
																className='w-100 food-name-input'
																placeholder='Select Food Item'
																value={
																	newFoodItem.food_id
																		? {
																			label:
																				newFoodItem.food_name ||
																				allFoodItems.find((f) => f._id === newFoodItem.food_id)?.food_name || '',
																			value: newFoodItem.food_id,
																			quantity: newFoodItem.quantity,
																			quantity_unit: newFoodItem.quantity_unit,
																		}
																		: null
																}
																loadOptions={ loadFoodOptions }
																onChange={ async (selectedOption: any) => {
																	if (selectedOption) {
																		try {
																			const response: any = await GetFood({ id: selectedOption.value })
																			const selectedFood =
																				(response?.data && (Array.isArray(response.data) ? response.data[0] : response.data)) ||
																				null

																			if (selectedFood) {
																				setNewFoodItem((prev) => ({
																					...prev,
																					food_id: selectedFood._id,
																					food_name: selectedFood.food_name || '',
																					thumbnail_image: selectedFood.thumbnail_image || selectedFood.thumbnail_url || '',
																					quantity: selectedFood.quantity?.toString?.() || '0',
																					quantity_unit: selectedFood.quantity_unit || '',
																					carbs: selectedFood.carbs?.toString?.() || '0',
																					calories: selectedFood.calories?.toString?.() || '0',
																					protein: selectedFood.protein?.toString?.() || '0',
																					fat: selectedFood.fats?.toString?.() || '0',
																				}))
																			}
																		} catch (error) {
																			console.error('Failed to fetch selected food details', error)
																		}
																	} else {
																		setNewFoodItem((prev) => ({
																			...prev,
																			food_id: '',
																			quantity: '0',
																			quantity_unit: '',
																			carbs: '0',
																			calories: '0',
																			protein: '0',
																			fat: '0',
																		}))
																	}
																} }
																getOptionLabel={ (option: any) => option.label }
																getOptionValue={ (option: any) => option.value }
															/>
														</div>
													</div>
												</div>
												<div className='col-3'>
													<label className='form-label'>Quantity</label>
													<div className='input-group'>
														<input
															type='number'
															name='quantity'
															className='form-control text-center'
															value={ newFoodItem.quantity }
															onChange={ handleNewFoodItemChange }
															min='0'
															step='0.1'
														/>
														<button
															className='btn btn-light'
															type='button'>
															{ newFoodItem.quantity_unit }
														</button>
													</div>
												</div>
												<div className='col-auto d-flex align-items-end'>
													<button
														className='btn btn-danger'
														onClick={ handleCancelNewFoodItem }>
														Delete
													</button>
												</div>
											</div>
											<div className='text-end'>
												<button
													type='button'
													className={ `btn btn-primary ${ishandleSaveNewFoodItemLoading ? 'disabled' : ''
														}` }
													onClick={ handleSaveNewFoodItem }
													disabled={ ishandleSaveNewFoodItemLoading }>
													{ ishandleSaveNewFoodItemLoading ? 'Please wait, Adding...' : 'Add' }
												</button>
											</div>
										</div>
									</div>
								) }
							</>
						) }
					</div>
					<div className='modal-footer d-flex justify-content-between'>
						<div>
							<button
								type='button'
								className='btn btn-light me-3'
								onClick={ () => {
									setShowUpdateBundleItemsModal(false)
									setShowNewItemRow(false)
								} }>
								Cancel
							</button>
							<button
								type='button'
								className={ `btn btn-primary ${ishandleUpdateBundleItemsSubmitLoading ? 'disabled' : ''
									}` }
								onClick={ handleUpdateBundleItemsSubmit }
								disabled={ ishandleUpdateBundleItemsSubmitLoading }>
								{ ishandleUpdateBundleItemsSubmitLoading ? 'Please wait, Updating...' : 'Update' }
							</button>
						</div>
					</div>
				</div>
			</Modal>

			{/* Create New Bundle Modal */ }
			<Modal
				show={ showCreateBundleModal }
				centered
				onHide={ () => setShowCreateBundleModal(false) }
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Create New Bundle</h2>
						<button
							onClick={ () => setShowCreateBundleModal(false) }
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1'
								icon={ faXmark }
							/>
						</button>
					</div>
					<div className='modal-body mx-3'>
						<div className='mb-4'>
							<label
								htmlFor='newBundleName'
								className='form-label required'>
								Bundle Name
							</label>
							<input
								type='text'
								className='form-control'
								id='newBundleName'
								name='bundle_name'
								value={ createBundleForm.bundle_name }
								onChange={ handleCreateBundleInputChange }
								placeholder='Enter bundle name'
							/>
						</div>
						<div className='row mb-4'>
							<div className='col-6'>
								<label
									htmlFor='newCategory'
									className='form-label required'>
									Category
								</label>
								<select
									className='form-select'
									id='newCategory'
									name='category_id'
									value={ createBundleForm.category_id }
									onChange={ handleCreateBundleInputChange }
									required>
									<option value=''>Select Category</option>
									{ categories.map((category, index) => (
										<option
											key={ `${category._id}_${index}` }
											value={ category._id }>
											{ category.category }
										</option>
									)) }
								</select>
							</div>
							<div className='col-6'>
								<label
									htmlFor='newTime'
									className='form-label required'>
									Time
								</label>
								<select
									className='form-select'
									id='newTime'
									name='time_id'
									value={ createBundleForm.time_id }
									onChange={ handleCreateBundleInputChange }
									required>
									<option value=''>Select Time</option>
									{ foodTimes.map((time, index) => (
										<option
											key={ index }
											value={ time._id }>
											{ time.food_time }
										</option>
									)) }
								</select>
							</div>
						</div>
						<div className='mb-4'>
							<label
								htmlFor='newVideoUrl'
								className='form-label'>
								Video URL (Optional)
							</label>
							<input
								type='text'
								className='form-control'
								id='newVideoUrl'
								name='video_url'
								value={ createBundleForm.video_url }
								onChange={ handleCreateBundleInputChange }
								placeholder='https://example.com/video'
							/>
						</div>
					</div>
					<div className='modal-footer'>
						<button
							type='button'
							className='btn btn-light'
							onClick={ () => setShowCreateBundleModal(false) }>
							Cancel
						</button>
						<button
							type='button'
							className='btn btn-primary'
							onClick={ handleCreateBundleSubmit }
							disabled={ ishandleCreateBundleSubmitLoading } // disable button while loading
						>
							{ ishandleCreateBundleSubmitLoading ? (
								<>
									<span
										className='spinner-border spinner-border-sm me-2'
										role='status'
										aria-hidden='true'></span>
									Creating...
								</>
							) : (
								'Create Bundle'
							) }
						</button>
					</div>
				</div>
			</Modal>

			{/* Create New Bundle Items Modal */ }
			<Modal
				show={ showCreateBundleItemsModal }
				centered
				onHide={ () => setShowCreateBundleItemsModal(false) }
				size='lg'
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header justify-content-between'>
						<h2 className='fw-bolder'>Add Food Items to New Bundle</h2>
						<button
							onClick={ () => {
								setShowCreateBundleItemsModal(false)
								setShowNewItemRow(false)
							} }
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1'
								icon={ faXmark }
							/>
						</button>
					</div>
					<div className='modal-body mx-3'>
						<div className='mb-4'>
							<label className='form-label'>Bundle Name</label>
							<input
								type='text'
								className='form-control'
								value={ createBundleForm.bundle_name }
								readOnly
							/>
						</div>

						{ bundleItemsData && bundleItemsData.length > 0 ? (
							<div className='food-bundle-items'>
								{ bundleItemsData.map((item, index) => (
									<div
										key={ index }
										className='food-item-row mb-4'>
										<div className='mb-2'>
											<div className='row align-items-center'>
												<div className='col'>
													<label className='form-label'>Food</label>
													<div className='d-flex align-items-center'>
														<div className='food-img'>
															<img
																src={ item.food?.thumbnail_image || '/media/images/cheese.png' }
																alt={ item.food?.food_name }
															/>
														</div>
														<AsyncPaginate
															className='w-100 food-name-input'
															value={
																item.food
																	? {
																		label: item.food.food_name,
																		value: item.food._id,
																		quantity: item.quantity,
																		quantity_unit: item.quantity_unit,
																	}
																	: null
															}
															loadOptions={ loadFoodOptions }
															onChange={ async (selectedOption: any) => {
																if (selectedOption) {
																	try {
																		const response: any = await GetFood({
																			id: selectedOption.value,
																		})
																		const selectedFood =
																			(response?.data &&
																				(Array.isArray(response.data)
																					? response.data[0]
																					: response.data)) ||
																			null
																		if (selectedFood) {
																			const updatedItems = [...bundleItemsData]
																			updatedItems[index] = {
																				...updatedItems[index],
																				food: selectedFood,
																			}
																			setBundleItemsData(updatedItems)
																		}
																	} catch (error) {
																		console.error('Failed to fetch selected food details', error)
																	}
																}
															} }
															placeholder='Select Food Item'
														/>
													</div>
												</div>
												<div className='col-3'>
													<label className='form-label'>Quantity</label>
													<div className='input-group'>
														<input
															type='number'
															min='0'
															className='form-control text-center'
															value={ item?.quantity }
															onChange={ (e) => {
																const newQuantity = parseFloat(e.target.value)
																if (!isNaN(newQuantity)) {
																	const updatedItems = [...bundleItemsData]
																	updatedItems[index] = {
																		...updatedItems[index],
																		quantity: newQuantity,
																	}
																	setBundleItemsData(updatedItems)
																}
															} }
															readOnly
														/>
														<button
															className='btn btn-light'
															type='button'>
															{ formatUnit(item.food.quantity_unit) }
														</button>
													</div>
												</div>
												<div className='col-1 mt-auto pb-2 '>
													<button
														className='bundle-update-delete-btn'
														onClick={ () => handleDeleteBundleItem(item._id) }
														disabled={ deletingItemId === item._id }>
														{ deletingItemId === item._id ? (
															<div
																className='spinner-border spinner-border-sm text-light'
																role='status'>
																<span className='visually-hidden'>Loading...</span>
															</div>
														) : (
															<FontAwesomeIcon icon={ faTrash } />
														) }
													</button>
												</div>
											</div>
										</div>
										{ index < bundleItemsData.length - 1 && <hr className='my-4' /> }
									</div>
								)) }
								<button
									className='btn btn-primary btn-sm rounded-circle ms-auto d-flex align-items-center justify-content-center'
									style={ { width: '38px', height: '38px' } }
									onClick={ handleAddNewFoodItem }>
									<FontAwesomeIcon icon={ faSquarePlus } />
								</button>
							</div>
						) : (
							<>
								<div className='alert alert-info mb-4'>No food items found in this bundle.</div>
								<button
									className='btn btn-primary btn-sm rounded-circle ms-auto d-flex align-items-center justify-content-center'
									style={ { width: '38px', height: '38px' } }
									onClick={ handleAddNewFoodItem }>
									<FontAwesomeIcon icon={ faSquarePlus } />
								</button>
							</>
						) }

						{/* Add New Food Item Form */ }
						{ showNewItemRow && (
							<div className='new-food-item-form mt-4 mb-4'>
								<h5 className='mb-3'>Add New Food Item</h5>
								<div className='food-item-row'>
									<div className='row mb-3'>
										<div className='col'>
											<label className='form-label required'>Food</label>
											<div className='d-flex align-items-center justify-content-center'>
												<img
													src={
														newFoodItem.thumbnail_image ||
														allFoodItems.find((f) => f._id === newFoodItem.food_id)?.thumbnail_image ||
														'/media/images/cheese.png'
													}
													alt={ newFoodItem.food_name ||
														allFoodItems.find((f) => f._id === newFoodItem.food_id)?.food_name ||
														'Food Image' }
													style={ {
														width: '40px',
														height: '40px',
														objectFit: 'cover',
														borderRadius: '4px',
														marginRight: '10px',
													} }
												/>
												<AsyncPaginate
													className='w-100 food-name-input'
													placeholder='Select Food Item'
													value={
														newFoodItem.food_id
															? {
																label: newFoodItem.food_name ||
																	allFoodItems.find((f) => f._id === newFoodItem.food_id)?.food_name || '',
																value: newFoodItem.food_id,
																quantity: newFoodItem.quantity,
																quantity_unit: newFoodItem.quantity_unit,
															}
															: null
													}
													loadOptions={ loadFoodOptions }
													onChange={ async (selectedOption: any) => {
														if (selectedOption) {
															try {
																const response: any = await GetFood({ id: selectedOption.value })
																const selectedFood =
																	(response?.data &&
																		(Array.isArray(response.data)
																			? response.data[0]
																			: response.data)) ||
																	null

																if (selectedFood) {
																	setNewFoodItem((prev) => ({
																		...prev,
																		food_id: selectedFood._id,
																		food_name: selectedFood.food_name || '',
																		thumbnail_image: selectedFood.thumbnail_image || selectedFood.thumbnail_url || '',
																		quantity: selectedFood.quantity?.toString?.() || '0',
																		quantity_unit: selectedFood.quantity_unit || '',
																		carbs: selectedFood.carbs?.toString?.() || '0',
																		calories: selectedFood.calories?.toString?.() || '0',
																		protein: selectedFood.protein?.toString?.() || '0',
																		fat: selectedFood.fats?.toString?.() || '0',
																	}))
																}
															} catch (error) {
																console.error('Failed to fetch selected food details', error)
															}
														} else {
															setNewFoodItem((prev) => ({
																...prev,
																food_id: '',
																quantity: '0',
																quantity_unit: '',
																carbs: '0',
																calories: '0',
																protein: '0',
																fat: '0',
															}))
														}
													} }
													getOptionLabel={ (option: any) => option.label }
													getOptionValue={ (option: any) => option.value }
												/>
											</div>
										</div>
										<div className='col-3'>
											<label className='form-label required'>Quantity</label>
											<div className='input-group'>
												<input
													type='number'
													name='quantity'
													className='form-control text-center'
													value={ newFoodItem.quantity }
													onChange={ (e) => {
														const newQuantity = parseFloat(e.target.value)
														if (isNaN(newQuantity) || newQuantity < 0) {
															setNewFoodItem((prev) => ({
																...prev,
																quantity: '0',
																carbs: '0',
																calories: '0',
																protein: '0',
																fat: '0',
															}))
															return
														}

														const selectedFood = allFoodItems.find((f) => f._id === newFoodItem.food_id)
														if (selectedFood && selectedFood.quantity) {
															const baseQty = Number(selectedFood.quantity) || 0
															const factor = baseQty > 0 ? newQuantity / baseQty : 0
															const safeNum = (v: any) => {
																const n = Number(v)
																return isNaN(n) ? 0 : n
															}

															setNewFoodItem((prev) => ({
																...prev,
																quantity: newQuantity.toString(),
																carbs: (safeNum(selectedFood.carbs) * factor).toString(),
																calories: (safeNum(selectedFood.calories) * factor).toString(),
																protein: (safeNum(selectedFood.protein) * factor).toString(),
																fat: (safeNum(selectedFood.fats) * factor).toString(),
															}))
														} else {
															setNewFoodItem((prev) => ({ ...prev, quantity: newQuantity.toString() }))
														}
													} }
													min='0'
													step='0.1'
												/>
												<button
													className='btn btn-light '
													type='button'>
													{ newFoodItem.quantity_unit || '-' }
												</button>
											</div>
										</div>
										<div className='col-auto d-flex align-items-end'>
											<button
												className='btn btn-danger'
												onClick={ handleCancelNewFoodItem }>
												Delete
											</button>
										</div>
									</div>
									<div className='text-end'>
										<button
											type='button'
											className={ `btn btn-primary ${ishandleSaveNewFoodItemLoading ? 'disabled' : ''
												}` }
											onClick={ handleSaveNewFoodItem }
											disabled={ ishandleSaveNewFoodItemLoading }>
											{ ishandleSaveNewFoodItemLoading ? 'Please wait, Adding...' : 'Add' }
										</button>
									</div>
								</div>
							</div>
						) }
					</div>
					<div className='modal-footer d-flex justify-content-between'>
						<div>
							<button
								type='button'
								className='btn btn-light me-3'
								onClick={ () => {
									setShowCreateBundleItemsModal(false)
									setShowNewItemRow(false)
								} }>
								Cancel
							</button>
							<button
								type='button'
								className='btn btn-primary'
								onClick={ handleCreateBundleItemsSubmit }
								disabled={ ishandleCreateBundleItemsSubmitLoading }>
								<span className='d-flex align-items-center gap-2'>
									{ ishandleCreateBundleItemsSubmitLoading && (
										<span
											className='spinner-border spinner-border-sm'
											role='status'
											aria-hidden='true'></span>
									) }
									{ ishandleCreateBundleItemsSubmitLoading ? 'Saving...' : 'Save Bundle' }
								</span>
							</button>
						</div>
					</div>
				</div>
			</Modal>

			{ showNewItemRow && (
				<div className='new-food-item-form mt-4 mb-4'>
					<h5 className='mb-3'>Add New Food Item</h5>
					<div className='food-item-row'>
						<div className='row mb-3'>
							<div className='col'>
								<label className='form-label required'>Food</label>
								<div className='d-flex align-items-center justify-content-center'>
									<img
										src={
											newFoodItem.thumbnail_image ||
											allFoodItems.find((f) => f._id === newFoodItem.food_id)?.thumbnail_image ||
											'/media/images/cheese.png'
										}
										alt={
											newFoodItem.food_name ||
											allFoodItems.find((f) => f._id === newFoodItem.food_id)?.food_name ||
											'Food Image'
										}
										style={ { width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' } }
									/>
									<AsyncPaginate
										className='w-100 food-name-input'
										placeholder='Select Food Item'
										value={
											newFoodItem.food_id
												? {
													label:
														newFoodItem.food_name ||
														allFoodItems.find((f) => f._id === newFoodItem.food_id)?.food_name || '',
													value: newFoodItem.food_id,
													quantity: newFoodItem.quantity,
													quantity_unit: newFoodItem.quantity_unit,
												}
												: null
										}
										loadOptions={ loadFoodOptions }
										onChange={ async (selectedOption: any) => {
											if (selectedOption) {
												try {
													const response: any = await GetFood({ id: selectedOption.value })
													const selectedFood =
														(response?.data && (Array.isArray(response.data) ? response.data[0] : response.data)) ||
														null

													if (selectedFood) {
														setNewFoodItem((prev) => ({
															...prev,
															food_id: selectedFood._id,
															food_name: selectedFood.food_name || '',
															thumbnail_image: selectedFood.thumbnail_image || selectedFood.thumbnail_url || '',
															quantity: selectedFood.quantity?.toString?.() || '0',
															quantity_unit: selectedFood.quantity_unit || '',
															carbs: selectedFood.carbs?.toString?.() || '0',
															calories: selectedFood.calories?.toString?.() || '0',
															protein: selectedFood.protein?.toString?.() || '0',
															fat: selectedFood.fats?.toString?.() || '0',
														}))
													}
												} catch (error) {
													console.error('Failed to fetch selected food details', error)
												}
											} else {
												setNewFoodItem((prev) => ({
													...prev,
													food_id: '',
													quantity: '0',
													quantity_unit: '',
													carbs: '0',
													calories: '0',
													protein: '0',
													fat: '0',
												}))
											}
										} }
										getOptionLabel={ (option: any) => option.label }
										getOptionValue={ (option: any) => option.value }
									/>
								</div>
							</div>
							<div className='col-3'>
								<label className='form-label required'>Quantity</label>
								<div className='input-group'>
									<input
										type='text'
										name='quantity'
										className='form-control text-center'
										value={ newFoodItem.quantity }
										onChange={ handleNewFoodItemChange }
									/>
									<button
										className='btn btn-light dropdown-toggle'
										type='button'
										data-bs-toggle='dropdown'>
										{ newFoodItem.quantity_unit }
									</button>
								</div>
							</div>
							<div className='col-auto d-flex align-items-end'>
								<button
									className='btn btn-danger'
									onClick={ handleCancelNewFoodItem }>
									Delete
								</button>
							</div>
						</div>
						<div className='row mb-3'>
							<div className='col'>
								<label className='form-label'>Fat</label>
								<input
									type='text'
									name='fat'
									className='form-control text-center'
									value={ newFoodItem.fat }
									onChange={ handleNewFoodItemChange }
								/>
							</div>
							<div className='col'>
								<label className='form-label'>Protein</label>
								<input
									type='text'
									name='protein'
									className='form-control text-center'
									value={ newFoodItem.protein }
									onChange={ handleNewFoodItemChange }
								/>
							</div>
							<div className='col'>
								<label className='form-label'>Carbs</label>
								<input
									type='text'
									name='carbs'
									className='form-control text-center'
									value={ newFoodItem.carbs }
									onChange={ handleNewFoodItemChange }
								/>
							</div>
							<div className='col'>
								<label className='form-label'>Calories</label>
								<input
									type='text'
									name='calories'
									className='form-control text-center'
									value={ newFoodItem.calories }
									onChange={ handleNewFoodItemChange }
								/>
							</div>
						</div>
						<div className='text-end'>
							<button
								type='button'
								className={ `btn btn-primary ${ishandleSaveNewFoodItemLoading ? 'disabled' : ''}` }
								onClick={ handleSaveNewFoodItem }
								disabled={ ishandleSaveNewFoodItemLoading }>
								{ ishandleSaveNewFoodItemLoading ? 'Please wait, Adding...' : 'Add' }
							</button>
						</div>
					</div>
				</div>
			) }

			{/* Mobile Preview Modal */ }
			{ showMobilePreview && (
				<div className='mobile-preview-container'>
					<div
						className='mobile-preview-close'
						onClick={ handleCloseMobilePreview }>
						<FontAwesomeIcon icon={ faXmark } />
					</div>

					{/* Diet Screen */ }
					<div className='mobile-preview-screen'>
						<div className='mobile-preview-header'>
							<div className='time'>18:00</div>
							<div className='status-icons'>
								<FontAwesomeIcon icon={ faSignal } />
								<FontAwesomeIcon icon={ faWifi } />
								<FontAwesomeIcon icon={ faBatteryFull } />
							</div>
							<div
								className='back-button '
								onClick={ handleCloseMobilePreview }>
								<FontAwesomeIcon icon={ faChevronLeft } />
							</div>
							<div className='title '>DIET</div>
						</div>
						<div className='diet-screen-content'>
							{ bundleItems.length > 0 ? (
								bundleItems.map((meal, index) => (
									<div
										key={ `meal_preview_${meal.id}_${index}` }
										className='meal-card '
										onClick={ () => handleMealClick(meal) }>
										<div className='meal-card-content '>
											<div className='d-flex align-items-center justify-content-between m-1'>
												<h3 className='meal-card-title'>Meal { index + 1 }</h3>
												<p className='m-0 macro-label'>
													{ DayJS(meal.time, 'HH:mm').format('hh:mm A') }
												</p>
											</div>
											<p className='meal-card-subtitle'>
												{ meal.name.charAt(0).toUpperCase() + meal.name.slice(1) }
											</p>

											<div className='meal-card-macros'>
												<div className='macro-item protein-color'>
													<p className='macro-value'>
														{ (() => {
															const val =
																meal.food_bundle?.total_calculated_protein ??
																meal.nutritional_value?.protein

															return val != null
																? Number(val) % 1 === 0
																	? Number(val).toString()
																	: Number(val).toFixed(2)
																: ''
														})() }
													</p>
													<p className='macro-label'>Protein</p>
												</div>
												<div className='macro-item fat-color'>
													<p className='macro-value'>
														{ (() => {
															const val =
																meal.food_bundle?.total_calculated_fats ??
																meal.nutritional_value?.fat

															return val != null
																? Number(val) % 1 === 0
																	? Number(val).toString()
																	: Number(val).toFixed(2)
																: ''
														})() }
													</p>
													<p className='macro-label'>Fat</p>
												</div>
												<div className='macro-item carbs-color'>
													<p className='macro-value'>
														{ (() => {
															const val =
																meal.food_bundle?.total_calculated_carbs ??
																meal.nutritional_value?.carbs

															return val != null
																? Number(val) % 1 === 0
																	? Number(val).toString()
																	: Number(val).toFixed(2)
																: ''
														})() }
													</p>
													<p className='macro-label'>Carbs</p>
												</div>
												<div className='macro-item calories-color'>
													<p className='macro-value'>
														{ (() => {
															const val =
																meal.food_bundle?.total_calculated_calories ??
																meal.nutritional_value?.calories

															return val != null
																? Number(val) % 1 === 0
																	? Number(val).toString()
																	: Number(val).toFixed(2)
																: ''
														})() }
													</p>
													<p className='macro-label'>Calories</p>
												</div>
											</div>
										</div>
										<div className='meal-card-image-container'>
											{/* <img
												src='/media/stock/600x400/img-1.jpg'
												className='meal-card-image'
												alt={meal.name}
											/> */}
											{ meal.food_bundle &&
												meal.food_bundle.food_bundle_items &&
												meal.food_bundle.food_bundle_items.length > 0 &&
												meal.food_bundle.food_bundle_items[0].food_info &&
												meal.food_bundle.food_bundle_items[0].food_info.thumbnail_image && (
													<img
														src={ meal.food_bundle.food_bundle_items[0].food_info.thumbnail_image }
														alt={
															meal.food_bundle.food_bundle_items[0].food_info.food_name ||
															'Food item'
														}
														className='meal-card-image'
													/>
												) }
										</div>
									</div>
								))
							) : (
								<div className='text-center p-5'>
									<p>No meals assigned yet</p>
								</div>
							) }
						</div>
					</div>

					{/* Meal Detail Screen */ }
					<div className='mobile-preview-screen'>
						<div className='mobile-preview-header'>
							<div className='time'>18:00</div>
							<div className='status-icons'>
								<FontAwesomeIcon icon={ faSignal } />
								<FontAwesomeIcon icon={ faWifi } />
								<FontAwesomeIcon icon={ faBatteryFull } />
							</div>
							<div
								className='back-button'
								onClick={ handleCloseMobilePreview }>
								<FontAwesomeIcon icon={ faChevronLeft } />
							</div>
							<div className='title'>
								MEAL{ ' ' }
								{ selectedMeal
									? bundleItems.findIndex((item) => item.id === selectedMeal.id) + 1
									: 1 }
							</div>
						</div>
						{ selectedMeal ? (
							<div className='meal-detail-screen-content'>
								{/* <img 
									src="/media/stock/600x400/img-1.jpg" 
									className="meal-detail-image" 
									alt={selectedMeal.name} 
								/> */}
								{ selectedMeal.food_bundle &&
									selectedMeal.food_bundle.food_bundle_items &&
									selectedMeal.food_bundle.food_bundle_items.length > 0 &&
									selectedMeal.food_bundle.food_bundle_items[0].food_info &&
									selectedMeal.food_bundle.food_bundle_items[0].food_info.thumbnail_image && (
										<img
											src={ selectedMeal.food_bundle.food_bundle_items[0].food_info.thumbnail_image }
											alt={
												selectedMeal.food_bundle.food_bundle_items[0].food_info.food_name ||
												'Food item'
											}
											className='meal-detail-image'
										/>
									) }

								<div className='meal-detail-macros'>
									<div className='macro-item protein-color'>
										<p className='macro-value-sec'>
											{ (() => {
												const val =
													selectedMeal.food_bundle?.total_calculated_protein ??
													selectedMeal.nutritional_value?.protein

												return val != null
													? Number(val) % 1 === 0
														? Number(val).toString()
														: Number(val).toFixed(2)
													: ''
											})() }
										</p>
										<p className='macro-label-sec'>Protein</p>
									</div>
									<div className='macro-item fat-color'>
										<p className='macro-value-sec'>
											{ (() => {
												const val =
													selectedMeal.food_bundle?.total_calculated_fats ??
													selectedMeal.nutritional_value?.fat

												return val != null
													? Number(val) % 1 === 0
														? Number(val).toString()
														: Number(val).toFixed(2)
													: ''
											})() }
										</p>
										<p className='macro-label-sec'>Fat</p>
									</div>
									<div className='macro-item carbs-color'>
										<p className='macro-value-sec'>
											{ (() => {
												const val =
													selectedMeal.food_bundle?.total_calculated_carbs ??
													selectedMeal.nutritional_value?.carbs

												return val != null
													? Number(val) % 1 === 0
														? Number(val).toString()
														: Number(val).toFixed(2)
													: ''
											})() }
										</p>
										<p className='macro-label-sec'>Carbs</p>
									</div>
									<div className='macro-item calories-color'>
										<p className='macro-value-sec'>
											{ (() => {
												const val =
													selectedMeal.food_bundle?.total_calculated_calories ??
													selectedMeal.nutritional_value?.calories

												return val != null
													? Number(val) % 1 === 0
														? Number(val).toString()
														: Number(val).toFixed(2)
													: ''
											})() }
										</p>
										<p className='macro-label-sec'>Calories</p>
									</div>
								</div>

								<div className='meal-detail-title'>
									{ selectedMeal.name.charAt(0).toUpperCase() + selectedMeal.name.slice(1) }
								</div>

								<div className='ingredients-list'>
									<div className='d-flex align-items-center justify-content-between '>
										<h4 className='ingredients-heading'>Ingredients</h4>
										<p className='ingredients-heading'>
											{ selectedMeal?.time && selectedMeal.time !== '--:--'
												? DayJS(selectedMeal.time, 'HH:mm').format('hh:mm A')
												: '--:--' }
										</p>
									</div>

									{ bundleInfoLoading ? (
										<div className='text-center py-3'>
											<div
												className='spinner-border spinner-border-sm text-primary'
												role='status'>
												<span className='visually-hidden'>Loading...</span>
											</div>
										</div>
									) : mealIngredients.length > 0 ? (
										mealIngredients.map((item, index) => (
											<div
												className='ingredient-item'
												key={ `ingredient_${item.food?._id}_${Date.now()}_${index}}` }>
												<div className='ingredient-info'>
													<img
														src={ item.food?.thumbnail_image || '/media/images/cheese.png' }
														className='ingredient-image'
														alt={ item.food?.food_name }
													/>
													<div>
														<div className='ingredient-name'>
															{ item.food?.food_name || 'Ingredient' }
														</div>
														<div className='ingredient-calories'>
															{ item.food?.calories != null
																? Number(item.food.calories) % 1 === 0
																	? Number(item.food.calories).toString()
																	: Number(item.food.calories).toFixed(2)
																: '' }{ ' ' }
															Calories
														</div>
													</div>
												</div>
												<div className='ingredient-quantity'>
													{ item?.quantity } { formatUnit(item.food?.quantity_unit) }
												</div>
											</div>
										))
									) : (
										<div className='text-center py-3'>
											<p>No ingredients found</p>
										</div>
									) }
								</div>
							</div>
						) : (
							<div className='text-center p-5'>
								<p>Select a meal from the left screen</p>
							</div>
						) }
					</div>
				</div>
			) }
		</div>
	)
}

export default AssignFood
