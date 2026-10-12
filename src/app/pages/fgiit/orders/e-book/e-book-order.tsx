import React, { useEffect, useRef, useState } from 'react'
import { KTCard, toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import SelectField from '../../../../components/SelectField'
import UsersListPagination from '../../../../components/TablePagination'
import { GetOrders } from '../../../../Functions/FGGroup'
import TableButton from '../../../../components/TableButton'
import { DayJS } from '../../../../../_metronic/helpers/Utils'

const EBookOrder: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [bookName, setBookName] = useState('')
    const [shipmentStatus, setShipmentStatus] = useState('')
    const [formData, setFormData] = useState<any>({
			from_date: DayJS().startOf('month').format('YYYY-MM-DD'),
			to_date: DayJS().endOf('month').format('YYYY-MM-DD'),
		})
    const [orderData, setOrderData] = useState<any>([])

    const fetchOrderData = async () => {
        try {
            const filterQuery: any = {
                order_status: 'SUCCESS',
                item_type: 'EBOOKS',
            }

            if (formData.from_date && formData.to_date) {
                filterQuery.from_date = formData.from_date
                filterQuery.to_date = formData.to_date
            }

            const response = await GetOrders(filterQuery)
            const data: any = response.data

            data.sort(
                (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            setOrderData(data)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchOrderData()
    }, [formData.from_date, formData.to_date, shipmentStatus, bookName])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
            setPagination((prev) => ({ ...prev, page: 1 }))
            if (pagination.page === 1) fetchOrderData()
        }
    }, [searchTerm])

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target

        setFormData((prevData: any) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 50,
    })

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page })
    }

    const handleItemsPerPageChange = (value: number) => {
        setPagination({ ...pagination, itemsPerPage: value })
    }

    const filteredOrderData = orderData.filter((order: any) => {
        const userMatch =
            order?.user_info?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order?.user_info?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order?.user_info?.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            searchTerm === ''

        const bookMatch = bookName
            ? order.order_item_type === 'BOOKS' &&
            order.book?.book_title?.toLowerCase().includes(bookName.toLowerCase())
            : true

        const shipmentMatch = shipmentStatus
            ? order?.book_subscription?.tracking?.some(
                (tracking: { shipment_status: string; status: boolean }) =>
                    tracking.status && tracking.shipment_status === shipmentStatus
            )
            : true

        return userMatch && bookMatch && shipmentMatch
    })

    const paginatedOrderData = filteredOrderData.slice(
        (pagination.page - 1) * pagination.itemsPerPage,
        pagination.page * pagination.itemsPerPage
    )

    const orderStatusOption = ['PLACED', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURN']

    return (
        <>
            <PageTitle breadcrumbs={[]}>E-Book Order</PageTitle>
            <KTCard>
                <div className='col-md-12 mt-5 px-5'>
                    <div className='row'>
                        <InputField
                            placeholder='Enter Book Name'
                            type='text'
                            className='col-md-3 fv-row'
                            name='bookName'
                            label='Book Name'
                            htmlFor='bookName'
                            value={bookName}
                            onChange={(e) => setBookName(e.target.value)}
                        />
                        <InputField
                            placeholder='From Date'
                            type='date'
                            className='col-md-2 fv-row'
                            name='from_date'
                            label='From Date'
                            htmlFor='from_date'
                            value={formData.from_date}
                            onChange={handleInputChange}
                        />
                        <InputField
                            placeholder='To Date'
                            type='date'
                            className='col-md-2 fv-row'
                            name='to_date'
                            label='To Date'
                            htmlFor='to_date'
                            value={formData.to_date}
                            onChange={handleInputChange}
                        />
                        <SelectField
                            className='col-md-3 fv-row'
                            name='shipmentStatus'
                            label='Shipment Status'
                            htmlFor='shipmentStatus'
                            value={shipmentStatus}
                            onChange={(e) => setShipmentStatus(e.target.value)}
                            options={orderStatusOption}
                        />
                    </div>
                </div>
                <div className='d-flex justify-content-between mx-3 m-5'>
                    <div className='d-flex pt-1 mx-2'>
                        <SearchFilter
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                        />
                    </div>
                    <div className='me-5'>
                        <LengthMenu
                            expenseData={orderData}
                            handleItemsPerPageChange={handleItemsPerPageChange}
                        />
                    </div>
                </div>

                <div className='py-4 card-body'>
                    <div className='table-responsive'>
                        <table
                            id='kt_table_users'
                            className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
                            <thead>
                                <tr className='fw-bold text-muted'>
                                    <th>No.</th>
                                    <th>User</th>
                                    <th>Receipt ID</th>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Purchased On</th>
                                    <th>Shipment Status</th>
                                    <th className='ps-4 rounded-end'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedOrderData
								.slice()
								.reverse()
								.map((order: any, index: number) => {
                                    const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
                                    let currentPlanData: any
                                    let itemName: any = '-'
                                    switch (order.order_item_type) {
                                        case 'BOOKS':
                                            currentPlanData = order.book
                                            itemName = currentPlanData?.book_title || 'N/A'
                                            break
                                        case 'EBOOKS':
                                            currentPlanData = order.ebook
                                            itemName = currentPlanData?.ebook_title || 'N/A'
                                            break
                                    }
                                    const shipment_status =
                                        order?.book_subscription?.tracking?.find(
                                            (tracking: { shipment_status: string; status: boolean }) =>
                                                tracking.status && tracking.shipment_status === 'DELIVERED'
                                        )?.shipment_status ||
                                        order?.book_subscription?.tracking?.find(
                                            (tracking: { shipment_status: string; status: boolean }) =>
                                                tracking.status && tracking.shipment_status === 'DISPATCHED'
                                        )?.shipment_status ||
                                        order?.book_subscription?.tracking?.find(
                                            (tracking: { shipment_status: string; status: boolean }) =>
                                                tracking.status && tracking.shipment_status === 'PLACED'
                                        )?.shipment_status

                                    return (
                                        <tr key={actualIndex}>
                                            <td>
                                                <span className='text-dark fw-bold   mb-1 fs-6'>
                                                    {actualIndex}
                                                </span>
                                            </td>
                                            <td>
                                                <div className='d-flex align-items-center'>
                                                    <div className='symbol symbol-45px me-3'>
                                                        <img
                                                            src={
                                                                order?.user_info?.profile_image
                                                                    ? `https://files.fggroup.in/${order?.user_info?.profile_image}`
                                                                    : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                                            }
                                                            alt='User'
                                                            style={{ width: '50px', height: '50px' }}
                                                        />
                                                    </div>
                                                    <div className='d-flex justify-content-start flex-column'>
                                                        <span className='text-dark fw-bold  fs-6'>
                                                            {(order?.user_info?.first_name || 'DELETED USER') +
                                                                ' ' +
                                                                (order?.user_info?.last_name || ' ') || 'N/A'}
                                                        </span>
                                                        <span className='text-muted fw-semibold text-muted d-flex fs-7'>
                                                            {order?.user_info?.mobile || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                    {order.receipt_id || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                    {itemName}
                                                </span>
                                            </td>
                                            <td>
                                                <span className='text-dark fw-bold   mb-1 fs-6'>
                                                    {order?.notes?.quantity || '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                    {order.amount + ' ' + (order.currency || 'INR')}
                                                </span>
                                            </td>
                                            <td>
                                                <span className='text-dark fw-bold d-block mb-1 fs-6'>
                                                    {DayJS(order.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
                                                </span>
                                            </td>
                                            <td>
                                                <span className='text-dark fw-bold   mb-1 fs-6'>
                                                    {shipment_status ? shipment_status : '-'}
                                                </span>
                                            </td>
                                            <td className='d-flex '>
                                                <TableButton
                                                    action="view"
                                                    to={'/fgiit/book-order-view?order_id=' + order._id}
                                                    text="View"
                                                    showIcon={false}
                                                    backgroundDark={true}
                                                />
                                                <TableButton
                                                    action="assign"
                                                    to={'/fgiit/all-order/view-order?order_id=' + order._id}
                                                    text="Explore"
                                                    showIcon={false}
                                                    backgroundDark={true}
                                                />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    {orderData.length === 0 && (
                        <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
                            <b>No records found</b>
                        </div>
                    )}
                    {orderData.length > 0 && (
                        <UsersListPagination
                            totalPages={Math.ceil(filteredOrderData.length / pagination.itemsPerPage)}
                            currentPage={pagination.page}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </KTCard>
        </>
    )
}

export default EBookOrder
