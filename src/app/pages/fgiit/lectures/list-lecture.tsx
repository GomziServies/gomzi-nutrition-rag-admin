import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetFitnessCourse, GetLecture } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const Lecture: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [lectureData, setLectureData] = useState<any>([])
	const [selectedSubject, setSelectedSubject] = useState({ label: '', value: '' })
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [courseOption, setCourseOption] = useState<any>([])

	const fetchUserData = async (page?: number) => {
		setLoading(true)
		try {
			const response = await GetLecture({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				course_id: selectedSubject.value,
				sort,
				sortOrder,
			})
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			let filteredData: any = response.data

			setLectureData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchCourseData = async (page?: number) => {
		setLoading(true)
		try {
			const course_response = await GetFitnessCourse()

			// Filter only (International) OR Flexible Learning courses
			const filteredCourses = course_response.data.filter(
				(course: any) =>
					course.course_name.toLowerCase().includes('(international)') ||
					course.course_name.toLowerCase().includes('flexible learning')
			)

			setCourseOption(filteredCourses)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}


	useEffect(() => {
		fetchUserData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder, selectedSubject])

	useEffect(() => {
		fetchCourseData()
	}, [])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchUserData()
		}
	}, [searchTerm])

	const handleSelectCourse = async (value: any) => {
		value = value.split('- (')[0].trim()

		courseOption.map((course: any) => {
			if (course.course_name === value) {
				setPagination((prev) => ({ ...prev, page: 1 }))
				setSelectedSubject({ label: value, value: course._id })
			}
		})
	}

	const handlePageChange = async (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}
	const sortableFields = [
		{ title: 'Title', field: 'title' },
		{ title: 'Lecture index', field: 'lecture_index' },
		{ title: 'Linked course', field: 'related_courses' },
		{ title: 'Created date', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Lectures</PageTitle>
			<KTCard>
				<div className='row justify-content-between mx-5 mt-7'>
					<div className='col-sm-6 col-12 d-flex pt-1'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<div>
							<LengthMenu
								expenseData={lectureData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='col-sm-6 col-12 d-flex justify-content-end position-relative my-2 mt-0 mt-1'>
						<SelectField
							className='col-7 fv-row me-5'
							label='Subject'
							showLabel={false}
							name='Filter Subject'
							marginRemove={true}
							value={selectedSubject.label}
							onChange={(e) => handleSelectCourse(e.target.value)}
							htmlFor='Filter Subject'
							options={courseOption.map(
								(el: any) => `${el?.course_name} - (${el?.course_category})`
							)}
						/>
						<div className='modal-footer justify-content-end align-items-start mt-1'>
							<TableButton
								action='add'
								to='/fgiit/lectures-add'
								text='Add Lecture'
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={lectureData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							disableSortFields={['thumbnail_image', 'related_courses']}
							onSortChange={handleSortChange}
							renderRow={(lecture: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={lecture._id}>
									<tr
										onClick={() => handleRowClick(lecture._id)}
										className='data-row'>
										<td className='text-center'>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-5'>
													<img
														src={`https://files.fggroup.in/${lecture.thumbnail_image}`}
														alt='User'
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{lecture.title}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												{lecture.lecture_index}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												<ul>
													{lecture.related_courses ? (
														lecture.related_courses.map((row: any, index: any) => {
															return <li key={index}>{row.course_name}</li>
														})
													) : (
														<ul>
															<li>{lecture.related_courses}</li>
														</ul>
													)}
												</ul>
											</span>
										</td>{' '}
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												{DayJS(lecture.createdAt).format('DD-MM-YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											<TableButton
												action='view'
												to={`/fgiit/lectures-view?lecture_id=${lecture._id}`}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<img
														src={`https://files.fggroup.in/${lecture.thumbnail_image}`}
														alt={lecture.title}
														className='fs-3 text-primary'
														style={{ width: '65px', height: '65px', borderRadius: '20%' }}
													/>
													<br />
													<strong>{sortableFields[0].title}: </strong> {lecture.lecture_index}
													<br />
													<strong>{sortableFields[1].title}: </strong> {lecture.title}
													<br />
													<strong>{sortableFields[3].title}: </strong>{' '}
													<ul>
														{lecture.related_courses ? (
															lecture.related_courses.map((row: any, index: any) => {
																return <li key={index}>{row.course_name}</li>
															})
														) : (
															<ul>
																<li>{lecture.related_courses}</li>
															</ul>
														)}
													</ul>
													<strong>{sortableFields[4].title}: </strong>{' '}
													{DayJS(lecture.createdAt).format('DD-MM-YYYY hh:mm:ss A')}
													<br />
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{lectureData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{lectureData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default Lecture
