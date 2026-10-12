import {
	faClosedCaptioning,
	faComment,
	faEye,
	faHeart,
	faShare,
	faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { LeadTable } from '../../../../_metronic/partials/widgets/tables/LeadTable'
import SingleDatePicker from '../../../components/SingleDatePicker'
import * as FGGroupAPIs from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const MasterFacebook = () => {
	const [instagramData, setInstagramData] = useState<any[]>([{}])
	const [instagramAccountOptions, setInstagramAccountOptions] = useState<any[]>([{}])
	const [videoViews, setVideoViews] = useState<any>('')
	const [shareCount, setShareCount] = useState<any>('')
	const [isExpanded, setIsExpanded] = useState(false)
	const [instagramMediaData, setInstagramMediaData] = useState<any[]>([{}])
	const [singleInstagramMediaData, setSingleInstagramMediaData] = useState<any>({})
	const [selectedBrand, setSelectedBrand] = useState<string>('17841423812698385')
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [next, setNext] = useState<any>('')
	const [loading, setLoading] = useState<boolean>(false)

	const toggleCaption = () => {
		setIsExpanded(!isExpanded)
	}

	const handleFilterApply = () => {
		fetchInstagramInsightData()
	}

	const fetchInstagramData = async () => {
		try {
			const response: any = await FGGroupAPIs.getInstagramAccounts()
			const filteredData = response.data.filter((account: any) => account.id === selectedBrand)
			setInstagramAccountOptions(response.data)
			setInstagramData(filteredData)
		} catch (error) {
			console.error(error)
		}
	}
	const fetchInstagramInsightData = async () => {
		try {
			const response: any = await FGGroupAPIs.getInstagramMedia(selectedBrand, {
				fields:
					'ig_id,id,like_count,media_type,media_url,thumbnail_url,timestamp,username,comments_count,caption,video_views',
				limit: 30,
			})
			setNext(response?.metadata?.cursor?.after)
			setInstagramMediaData(response.data)
			const singleData: any = response.data[0]
			setSingleInstagramMediaData(singleData)
			const data: any = response.data[0].id
			fetchInstagramInsight1Data(data)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchInstagramInsight2Data = async (next?: string, date?: any) => {
		try {
			const response: any = await FGGroupAPIs.getInstagramMedia(selectedBrand, {
				fields:
					'ig_id,id,like_count,media_type,media_url,thumbnail_url,timestamp,username,comments_count,caption,video_views',
				after: next,
			})
			setInstagramMediaData((prevData) => [...prevData, ...response.data])
			setNext(response?.metadata?.cursor?.after)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchInstagramInsight1Data = async (id: string) => {
		try {
			const response: any = await FGGroupAPIs.getInstagramMediaInsights(id, {
				metric: 'comments,likes,video_views,shares',
			})

			const dataArray = response.data

			let videoViews = 0
			let shares = 0

			dataArray.forEach((item: any) => {
				if (item.name === 'video_views') {
					videoViews = item.values[0].value
				} else if (item.name === 'shares') {
					shares = item.values[0].value
				}
			})

			setVideoViews(videoViews)
			setShareCount(shares)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchInstagramData()
		fetchInstagramInsightData()
	}, [selectedBrand])

	const handleDateChange = async (date: Date | null) => {
		setSelectedDate(date)

		if (!date) return

		setLoading(true) // Start loading

		try {
			const selectedDateString = DayJS(date).format('YYYY-MM-DD')

			// Filter existing data based on the selected date
			const filteredData = instagramMediaData.filter((mediaItem: any) => {
				const mediaDate = DayJS(mediaItem.timestamp).format('YYYY-MM-DD')
				return mediaDate === selectedDateString
			})

			if (filteredData.length > 0) {
				// Data found in existing data
				setSingleInstagramMediaData(filteredData[0])
				const dataId: any = filteredData[0].id
				await fetchInstagramInsight1Data(dataId)
			} else {
				let nextCursor = next

				// Fetch more data and check if new data contains the desired date
				await fetchInstagramInsight2Data(nextCursor)
				const newFilteredData = instagramMediaData.filter((mediaItem: any) => {
					const mediaDate = DayJS(mediaItem.timestamp).format('YYYY-MM-DD')
					return mediaDate === selectedDateString
				})

				if (newFilteredData.length > 0) {
					setSingleInstagramMediaData(newFilteredData[0])
					const dataId: any = newFilteredData[0].id
					await fetchInstagramInsight1Data(dataId)
				}
			}
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Facebook and Instagram</PageTitle>
			<div className='row g-5 g-xl-5'>
				<div className='col-md-12'>
					<div className='card'>
						<div
							className='card-header border-0 px-3'
							style={{ minHeight: '0px' }}>
							<h3 className='card-title align-items-start flex-column py-2'>
								<span className='card-label fw-bold fs-3 mb-0'>Social Media Report</span>
								<span className='text-muted mt-1 fw-semibold fs-7'>
									{singleInstagramMediaData.username}
								</span>
							</h3>

							<div className='d-flex'>
								<div className='mx-4 mt-4'>
									<SingleDatePicker
										onDateChange={handleDateChange}
										leftValue='0px'
									/>
								</div>
								<div className='mx-4 mt-4'>
									<button
										type='button'
										className={'btn border-0 fs-4 px-3 py-1 btn-primary'}
										data-kt-menu-trigger='click'
										data-kt-menu-placement='bottom-end'
										data-kt-menu-flip='top-end'>
										<KTIcon
											iconName='filter'
											className='fs-4'
										/>
										Filter
									</button>
									<div
										className='menu menu-sub menu-sub-dropdown w-250px w-md-300px'
										data-kt-menu='true'>
										<div className='px-7 py-5'>
											<div className='fs-5 text-dark fw-bolder'>Filter Options</div>
										</div>

										<div className='separator border-gray-200'></div>

										<div className='px-7 py-5'>
											<div className='mb-10'>
												<label
													htmlFor='brand-select'
													className='form-label fw-bold'>
													Brand:
												</label>
												{/* <SelectFieldManual
													className='form-select form-select-solid'
													label='Account'
													showLabel={false}
													name='brand-select'
													value={selectedBrand}
													onChange={(e) => setSelectedBrand(e.target.value)}
													htmlFor='account_id'
													marginRemove={true}
													options={instagramData.map((data: any) => ({
														value: data.id,
														name: data.username,
													}))}
												/> */}
												<select
													id='brand-select'
													className='form-select form-select-solid'
													data-kt-select2='true'
													data-placeholder='Select option'
													data-allow-clear='true'
													value={selectedBrand}
													onChange={(e) => setSelectedBrand(e.target.value)}>
													{instagramAccountOptions.map((data: any) => (
														<option value={data.id}>{data.username}</option>
													))}
												</select>
											</div>

											<div className='d-flex justify-content-end'>
												<button
													type='reset'
													className='btn btn-sm btn-light btn-active-light-primary me-2'
													onClick={() => {
														setSelectedBrand('17841423812698385')
													}}
													data-kt-menu-dismiss='true'>
													Reset
												</button>

												<button
													type='button'
													className='btn btn-sm btn-primary'
													onClick={handleFilterApply}
													data-kt-menu-dismiss='true'>
													Apply
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div
							className='card-body'
							style={{ paddingTop: '0!important' }}>
							{loading ? (
								<div
									style={{ height: '350px' }}
									className='d-flex justify-content-center align-items-center'>
									<div className='d-flex justify-content-center align-items-center'>
										<div
											className='spinner-border'
											role='status'>
											<span className='visually-hidden'>Loading...</span>
										</div>
									</div>
								</div>
							) : (
								<div className='row'>
									<div className='col-md-4 post text-center'>
										{singleInstagramMediaData.media_type === 'VIDEO' ? (
											<video
												className='w-75'
												controls
												src={singleInstagramMediaData.media_url}
											/>
										) : (
											<img
												className='img-fluid'
												src={singleInstagramMediaData.media_url}
												alt=''
											/>
										)}
									</div>
									<div className='col-md-8 mt-3 pe-20'>
										<div className='d-flex flex-stack mb-5'>
											<div className='d-flex align-items-center me-2'>
												<div className='symbol symbol-50px me-3'>
													<div className='symbol-label bg-light-primary'>
														<FontAwesomeIcon
															icon={faUsers}
															className='h-50 text-primary'
														/>
													</div>
												</div>
												<div>
													<a
														href='#'
														className='fs-6 text-gray-800  fw-bold'>
														Total Follower
													</a>
													<span className='text-muted fw-semibold d-block fs-7'>
														Last Update Just Now
													</span>
												</div>
											</div>
											<div className='badge badge-primary fw-semibold py-3 col-2 justify-content-center fs-6'>
												{instagramData[0]?.followers_count || '0'}
											</div>
										</div>
										<div className='d-flex flex-stack justify mb-5'>
											<div className='d-flex align-items-center me-2'>
												<div className='symbol symbol-50px me-3'>
													<div className='symbol-label bg-light-danger'>
														<FontAwesomeIcon
															icon={faHeart}
															className='h-50 text-danger text-hover-danger'
														/>
													</div>
												</div>
												<div>
													<a
														href='#'
														className='fs-6 text-gray-800 text-hover-danger fw-bold'>
														Like
													</a>
													<span className='text-muted fw-semibold d-block fs-7'>
														Last Post Likes
													</span>
												</div>
											</div>
											<div className='badge badge-danger fw-semibold py-3 col-2 justify-content-center fs-6'>
												{singleInstagramMediaData.like_count || '0'}
											</div>
										</div>
										<div className='d-flex flex-stack mb-5'>
											<div className='d-flex align-items-center me-2'>
												<div className='symbol symbol-50px me-3'>
													<div className='symbol-label bg-light-warning'>
														<FontAwesomeIcon
															icon={faComment}
															className='h-50 text-warning'
														/>
													</div>
												</div>
												<div>
													<a
														href='#'
														className='fs-6 text-gray-800 text-hover-warning fw-bold'>
														Comment
													</a>
													<span className='text-muted fw-semibold d-block fs-7'>
														Last Post Comments
													</span>
												</div>
											</div>
											<div className='badge badge-warning fw-semibold py-3 col-2 justify-content-center fs-6'>
												{singleInstagramMediaData.comments_count || '0'}
											</div>
										</div>
										<div className='d-flex flex-stack justify mb-5'>
											<div className='d-flex align-items-center me-2'>
												<div className='symbol symbol-50px me-3'>
													<div className='symbol-label bg-light-info'>
														<FontAwesomeIcon
															icon={faEye}
															className='h-50 text-info text-hover-info'
														/>
													</div>
												</div>
												<div>
													<a
														href='#'
														className='fs-6 text-gray-800 text-hover-info fw-bold'>
														Views
													</a>
													<span className='text-muted fw-semibold d-block fs-7'>
														Last Post Likes
													</span>
												</div>
											</div>
											<div className='badge badge-info fw-semibold py-3 col-2 justify-content-center fs-6'>
												{videoViews || '0'}
											</div>
										</div>
										<div className='d-flex flex-stack justify mb-5'>
											<div className='d-flex align-items-center me-2'>
												<div className='symbol symbol-50px me-3'>
													<div className='symbol-label bg-light-primary'>
														<FontAwesomeIcon
															icon={faShare}
															className='h-50 text-primary '
														/>
													</div>
												</div>
												<div>
													<a
														href='#'
														className='fs-6 text-gray-800  fw-bold'>
														Shares
													</a>
													<span className='text-muted fw-semibold d-block fs-7'>
														Last Post Shares
													</span>
												</div>
											</div>
											<div className='badge badge-primary fw-semibold py-3 col-2 justify-content-center fs-6'>
												{shareCount || '0'}
											</div>
										</div>
										<div className='d-flex flex-stack mb-0'>
											<div className='d-flex align-items-center me-2'>
												<div className='symbol symbol-50px me-3'>
													<div className='symbol-label bg-light-warning'>
														<FontAwesomeIcon
															icon={faClosedCaptioning}
															className='h-50 text-warning'
														/>
													</div>
												</div>
												<div>
													<a
														href='#'
														onClick={toggleCaption}
														className='fs-6 text-gray-800 text-hover-warning fw-bold'>
														Caption
													</a>
													<span
														className='text-muted fw-semibold d-block fs-7'
														onClick={toggleCaption}>
														{isExpanded
															? singleInstagramMediaData?.caption
															: singleInstagramMediaData?.caption?.length > 85
															? singleInstagramMediaData?.caption.substring(0, 85) + '...'
															: singleInstagramMediaData?.caption || '0'}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				<div className='col-md-12'>
					<LeadTable className='' />
				</div>
			</div>
		</>
	)
}

export { MasterFacebook }
