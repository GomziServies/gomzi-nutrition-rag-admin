/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from 'react';
import { KTCard } from '../../../../_metronic/helpers';
import { PageTitle } from '../../../../_metronic/layout/core';
import LengthMenu from '../../../components/LengthMenu';
import SearchFilter from '../../../components/SearchFilter';
import UsersListPagination from '../../../components/TablePagination';

const FreeSession: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [userData] = useState<any[]>([
        { 
            id: 1,
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com',
            mobile: '1234567890',
            timeSlot: '9:00 AM - 10:00 AM',
            registeredOn: '2024-04-30',
            
        },
        {
            id: 2,
            firstname: 'Jane',
            lastname: 'Smith',
            email: 'jane@example.com',
            mobile: '0987654321',
            timeSlot: '10:00 AM - 11:00 AM',
            registeredOn: '2024-04-30',
            
        },
    ]);
   
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    });

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page });
    };

    const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

    const filteredUserData = userData.filter((user) =>
        user.firstname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedUserData = filteredUserData.slice(
        (pagination.page - 1) * pagination.itemsPerPage,
        pagination.page * pagination.itemsPerPage
    );
    
	
    return (
        <>
            <PageTitle breadcrumbs={[]}>Students User Details</PageTitle>
            <KTCard>
                <div className="d-flex align-items-center justify-content-between p-3 px-md-7 py-md-3">
                <SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                <LengthMenu expenseData={userData} handleItemsPerPageChange={handleItemsPerPageChange} />
                </div>
                <div className='card-body py-4'>
                    <div className='table-responsive'>
                        <table
                            id='kt_table_users'
                            className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'
                        >                            <thead>
                                <tr className='fw-bold text-muted'>
                                    <th className='text-end'>NO</th>
                                    <th className='text-center'>First Name</th>
                                    <th>Last Name</th>
                                    <th>Email</th>
                                    <th>Mobile No</th>
                                    <th>Time Slot</th>
                                    <th>Registered On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUserData
								.slice()
								.reverse()
								.map((user, index) => (
                                    <tr key={user.id}>
                                        <td className='text-end'>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>{index + 1}
                                            </span></td>
                                        <td className='text-center'><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.firstname}</span></td>

                                        <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.lastname}</span></td>
                                        <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.email}</span></td>
                                        <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.mobile}</span></td>
                                        <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.timeSlot}</span></td>
                                        <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.registeredOn}</span></td>

                                    </tr>
                                ))}



                            </tbody>
                        </table>
                    </div>
                    <UsersListPagination
							totalPages={Math.ceil(filteredUserData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
                </div>
            </KTCard>
         
        </>
    );
};
export default FreeSession;
