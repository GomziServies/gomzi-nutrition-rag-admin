/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import questionmark from './question-mark.png';

import { faBook, faChartBar, faDigitalTachograph, faDumbbell, faGraduationCap, faRunning, faShoppingCart, faUtensils } from '@fortawesome/free-solid-svg-icons';
import { KTCard, KTIcon } from '../../../../_metronic/helpers';
import { PageTitle } from '../../../../_metronic/layout/core';
import TableButton from '../../../components/TableButton';
interface PaginationProps {
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}
const ViewUserDetailsPage = () => (
    <>
        <h1 className='fw-bold text-dark fs-1 mb-6 '>User Details</h1>
        <div className='row'>
            <div className="col-12 mt-3">
                <div className='card py-10'>
                    <div className='card-body'>
                        <div className='row'>
                            <div className='col-md-2 text-center'>
                                <div className='symbol symbol-130px mb-5 symbol-lg-160px symbol-fixed position-relative'>
                                    <img src='/media/avatars/300-1.jpg' alt='User Image' />
                                </div>
                                <button type='button' className='btn btn-dark'>
                                    Upload Image
                                </button>
                            </div>
                            <div className='col-md-10'>
                                <div className='row'>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>First name</label>
                                        <input
                                            placeholder='First name'
                                            type='text'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Last Name</label>
                                        <input
                                            placeholder='Last Name'
                                            type='text'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Email</label>
                                        <input
                                            placeholder='Email'
                                            type='email'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Mobile no.</label>
                                        <input
                                            placeholder='Mobile no.'
                                            type='number'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Alumni Status</label>
                                        <select className='form-control form-select form-control-solid mb-3 mb-lg-0' autoComplete='off'>
                                            <option>Select</option>
                                            <option>Yes</option>
                                            <option>No</option>
                                        </select>
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Birth  Date</label>
                                        <input
                                            placeholder='Date'
                                            type='date'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Registration Date</label>
                                        <input
                                            placeholder='Registration'
                                            type='date'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Last Modification</label>
                                        <input
                                            placeholder='Modification'
                                            type='date'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>

                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Plot/House No.</label>
                                        <input
                                            placeholder='Plot/House No.'
                                            type='text'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Address</label>
                                        <input
                                            placeholder='Address'
                                            type='text'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>City</label>
                                        <input
                                            placeholder='City'
                                            type='text'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>State</label>
                                        <input
                                            placeholder='State'
                                            type='text'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Country</label>
                                        <input
                                            placeholder='Country'
                                            type='text'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>
                                    <div className='col-md-6 fv-row mb-7'>
                                        <label className='required fw-bold fs-6 mb-2'>Pincode</label>
                                        <input
                                            placeholder='Pincode'
                                            type='text'
                                            className='form-control form-control-solid mb-3 mb-lg-0'
                                            autoComplete='off'
                                        />
                                    </div>

                                    <div className='col-md-5 fv-row mb-2'>
                                        <TableButton
                                            action="edit"
                                            text="Update profile"
                                            backgroundDark={true}
                                        />
                                        <div data-bs-toggle='modal' data-bs-target='#kt_modal_exercise'>
                                            <TableButton
                                                action="remove"
                                                text="Remove user"
                                                backgroundDark={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className='card py-12  my-10'>
            <div className='card-body'>
                <h1 className='fw-bold text-dark fs-1 mb-6 '>View records</h1>

                <div className="row" style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="col-md-3 m-3" style={{ flex: '1', maxWidth: '100px', margin: '0 auto' }}>
                        <div className="category-box" style={{ backgroundColor: 'transparent', width: '100px', height: '100px', textAlign: 'center', padding: '20px', borderRadius: '20px', border: '2px solid red' }}>
                            <FontAwesomeIcon icon={faUtensils} className="category-icon" style={{ fontSize: '30px', alignItems: 'center', textAlign: 'center' }} />
                            <h3 style={{ fontSize: '12px' }}>Recipe</h3>
                        </div>
                    </div>

                    <div className="col-md-3 m-3" style={{ flex: '1', maxWidth: '100px', margin: '0 auto' }}>
                        <div className="category-box" style={{ backgroundColor: 'transparent', width: '100px', height: '100px', textAlign: 'center', padding: '20px', borderRadius: '20px', border: '2px solid blue' }}>
                            <FontAwesomeIcon icon={faGraduationCap} className="category-icon" style={{ fontSize: '30px' }} />
                            <h3 style={{ fontSize: '12px' }}>Scholarship</h3>
                        </div>
                    </div>
                    <div className="col-md-3 m-3" style={{ flex: '1', maxWidth: '100px', margin: '0 auto' }}>
                        <div className="category-box" style={{ backgroundColor: 'transparent', width: '100px', height: '100px', textAlign: 'center', padding: '20px', borderRadius: '20px', border: '2px solid lightblue' }}>
                            <FontAwesomeIcon icon={faDumbbell} className="category-icon" style={{ fontSize: '30px' }} />
                            <h3 style={{ fontSize: '12px' }}>Fitness Plan</h3>
                        </div>
                    </div>
                    <div className="col-md-3 m-3" style={{ flex: '1', maxWidth: '100px', margin: '0 auto' }}>
                        <div className="category-box" style={{ backgroundColor: 'transparent', width: '100px', height: '100px', textAlign: 'center', padding: '20px', borderRadius: '20px', border: '2px solid green' }}>
                            <FontAwesomeIcon icon={faRunning} className="category-icon" style={{ fontSize: '30px' }} />
                            <h3 style={{ fontSize: '12px' }}>Fitness Course</h3>
                        </div>
                    </div>
                    <div className="col-md-3 m-3" style={{ flex: '1', maxWidth: '100px', margin: '0 auto' }}>
                        <div className="category-box" style={{ backgroundColor: 'transparent', width: '100px', height: '100px', textAlign: 'center', padding: '20px', borderRadius: '20px', border: '2px solid pink' }}>
                            <FontAwesomeIcon icon={faChartBar} className="category-icon" style={{ fontSize: '25px' }} />
                            <h3 style={{ fontSize: '12px' }}>Diet Performance</h3>
                        </div>
                    </div>
                    <div className="col-md-3 m-3" style={{ flex: '1', maxWidth: '100px', margin: '0 auto' }}>
                        <div className="category-box" style={{ backgroundColor: 'transparent', width: '100px', height: '100px', textAlign: 'center', padding: '20px', borderRadius: '20px', border: '2px solid gold' }}>
                            <FontAwesomeIcon icon={faDigitalTachograph} className="category-icon" style={{ fontSize: '30px' }} />
                            <h3 style={{ fontSize: '12px' }}>Digital Plans</h3>
                        </div>
                    </div>
                    <div className="col-md-3 m-3" style={{ flex: '1', maxWidth: '100px', margin: '0 auto' }}>
                        <div className="category-box" style={{ backgroundColor: 'transparent', width: '100px', height: '100px', textAlign: 'center', padding: '20px', borderRadius: '20px', border: '2px solid maroon' }}>
                            <FontAwesomeIcon icon={faBook} className="category-icon" style={{ fontSize: '30px' }} />
                            <h3 style={{ fontSize: '12px' }}>Book</h3>
                        </div>
                    </div>
                    <div className="col-md-3 m-3" style={{ flex: '1', maxWidth: '100px', margin: '0 auto' }}>
                        <div className="category-box" style={{ backgroundColor: 'transparent', width: '100px', height: '100px', textAlign: 'center', padding: '20px', borderRadius: '20px', border: '2px solid royalblue' }}>
                            <FontAwesomeIcon icon={faShoppingCart} className="category-icon" style={{ fontSize: '30px' }} />
                            <h3 style={{ fontSize: '12px' }}>All Orders</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className='card py-12  my-10'>
            <div className='card-body'>
                <h1 className='fw-bold text-dark fs-1 mb-6 ' style={{ display: 'inline' }}>Active Service</h1>
                <span style={{ marginLeft: '5px' }}>(This services are purchased or enabled by admin.)
                </span>
                <div style={{ marginTop: '15px' }}>
                    <li>FGIIT</li>
                    <li>BUSINESS LISTING</li>
                </div>
            </div>
        </div>
    </>
)
const StudentsUserView: React.FC = () => {
    const intl = useIntl();
    const [searchTerm, setSearchTerm] = useState('');

    const [userData] = useState([
        { no: 1, courseName: 'Course A', mode: 'Online', category: 'Programming', price: '$100', paidAmount: '$50', startDate: '2024-05-01', validity: '30 days' },
        { no: 2, courseName: 'Course B', mode: 'Offline', category: 'Design', price: '$150', paidAmount: '$100', startDate: '2024-04-15', validity: '60 days' },
        { no: 3, courseName: 'Course C', mode: 'Online', category: 'Marketing', price: '$120', paidAmount: '$80', startDate: '2024-04-20', validity: '45 days' },
    ]);
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    });
    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page });
    };
    const filteredUserData = userData.filter((user) =>
        user.courseName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const paginatedUserData = filteredUserData.slice(
        (pagination.page - 1) * pagination.itemsPerPage,
        pagination.page * pagination.itemsPerPage
    );
    return (
        <>
            <PageTitle breadcrumbs={[]}>Students User Details</PageTitle>
            <KTCard>
                <div className='card-header border-0 pt-6'>
                    <div className='card-toolbar'>
                        <div data-bs-toggle='modal' data-bs-target='#kt_modal_invite_friendsssss'>
                            <TableButton
                                action="add"
                                text="Add course"
                            />
                        </div>
                    </div>
                </div>

                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center justify-content-between  p-2 m-7">
                        <div className="d-flex align-items-center">
                            <div className="position-relative p-1">
                                <select
                                    name="example1_length"
                                    aria-controls="example1"
                                    className="custom-select custom-select-sm form-control form-select form-control-sm"
                                    style={{
                                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'%23000\' viewBox=\'0 0 24 24\' width=\'18 \' height=\'18\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'top 50% left 90%',
                                        width: '100px',
                                        fontSize: '16px', // Adjust the font size as needed
                                    }}
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="75">75</option>
                                    <option value="100">100</option>
                                    <option value="500">500</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className='d-flex align-items-center position-relative m-7'>
                        <KTIcon iconName='magnifier' className='fs-1 position-absolute  m-2 me-2' />
                        <input
                            type='text'
                            data-kt-user-table-filter='search'
                            className='form-control form-control-solid w-200px ps-10'
                            placeholder='Search user'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className='card-body py-4'>
                    <div className='table-responsive'>
                        <table
                            id='kt_table_users'
                            className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'
                        >                            <thead>
                                <tr className='fw-bold text-muted'>
                                    <th>NO</th>
                                    <th>Course Name</th>
                                    <th>Mode</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Paid Amount</th>
                                    <th>Start Date</th>
                                    <th>Validity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUserData
                                    .slice()
                                    .reverse()
                                    .map((user, index) => (
                                        <tr key={user.no}>
                                            <td>
                                                <span className='text-dark fw-bold  d-block mb-1 fs-6'>{index + 1}
                                                </span></td>                                        <td>{user.courseName}</td>
                                            <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.mode}</span></td>

                                            <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.category}</span></td>
                                            <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.price}</span></td>
                                            <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.paidAmount}</span></td>
                                            <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.startDate}</span></td>
                                            <td><span className='text-dark fw-bold  d-block mb-1 fs-6'>{user.validity}</span></td>

                                            <td>
                                                <TableButton
                                                    action="view"
                                                    to='/fgiit/user-order-view'
                                                    text='View'
                                                />
                                                <TableButton
                                                    action="view"
                                                    text='update Order'
                                                />
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    <StudentsUserPagination
                        totalPages={Math.ceil(filteredUserData.length / pagination.itemsPerPage)}
                        currentPage={pagination.page}
                        onPageChange={handlePageChange}
                    />
                </div>
            </KTCard>
        </>
    );
};

const StudentsUserPagination: React.FC<PaginationProps> = ({ totalPages, currentPage, onPageChange }) => {
    const getPageNumbers = () => {
        const pageNumbers = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    };
    return (
        <>
            <div className='row mt-4'>
                <div className='col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start'></div>
                <div className='col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end'>
                    <div id='kt_table_users_paginate'>
                        <ul className='pagination'>
                            <li className={currentPage === 1 ? 'page-item disabled' : 'page-item'}>
                                <a className='page-link' href='#' onClick={() => onPageChange(currentPage - 1)} aria-label='Previous'>
                                    <span aria-hidden='true'>&laquo;</span>
                                </a>
                            </li>
                            {getPageNumbers().map((number) => (
                                <li key={number} className={currentPage === number ? 'page-item active' : 'page-item'}>
                                    <a className='page-link' href='#' onClick={() => onPageChange(number)}>
                                        {number}
                                    </a>
                                </li>
                            ))}
                            <li className={currentPage === totalPages ? 'page-item disabled' : 'page-item'}>
                                <a className='page-link' href='#' onClick={() => onPageChange(currentPage + 1)} aria-label='Next'>
                                    <span aria-hidden='true'>&raquo;</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className='modal fade' id='kt_modal_invite_friendsssss' aria-hidden='true'>
                <div className='modal-dialog mw-600px p-0'>
                    <div className='modal-content'>
                        <div className='modal-header pb-0 border-0 justify-content-end'>
                            <div className='btn btn-sm btn-icon btn-active-color-primary' data-bs-dismiss='modal'>
                                <FontAwesomeIcon className='fs-1 position-absolute ms-3' icon={faXmark} />
                            </div>
                        </div>
                        <div className='modal-body scroll-y mx-5 mx-xl-10 pt-0 pb-15'>
                            <div className='modal-header p-0 pt-5 pb-8'>
                                <h2 className='fw-bolder'>Course</h2>
                            </div>
                            <div className='mb-3'>
                                <label className='required fw-bold fs-6 mb-2'>Offline Course Name</label>
                                <select className='form-control form-select form-control-solid mb-8' autoComplete='off'>
                                    <option value=''>Select Course</option>
                                    <option value='E-BOOK'>E-Book</option>
                                    <option value='YOUTUBE VIDEOS'>YouTube Videos</option>
                                    <option value='VODCAST'>Vod Cast</option>
                                    <option value='MOTIVATION SONG'>Motivation Song</option>
                                    <option value='DIET'>Diet Plans</option>
                                    <option value='EXERCISE'>Exercise</option>
                                    <option value='STEPS'>Steps Counter</option>
                                    <option value='WATER'>Water Reminder</option>
                                    <option value='BOOK TRAINER'>Trainer Book</option>
                                    <option value='DIET UPDATE'>Post Daily Diet</option>
                                    <option value='EXERCISE UPDATE'>Post Daily Exercise</option>
                                    <option value='MACRO CALCULATION'>Macro Calculation</option>
                                    <option value='GIFT'>Diet Ka Pitara</option>
                                    <option value='BMI CALCULATOR'>BMI Calculator</option>
                                    <option value='BMI'>BMI Report</option>
                                    <option value='BMR'>BMR Report</option>
                                    <option value='FEEDBACK'>Give Feedback</option>
                                </select>
                            </div>
                            <div className='mb-3'>
                                <label className='required fw-bold fs-6 mb-2'>Amount</label>
                                <input
                                    placeholder='Title'
                                    type='text'
                                    className='form-control form-control-solid mb-3 mb-lg-0'
                                    autoComplete='off'
                                />
                            </div>
                            <div className='mb-3'>
                                <label className='required fw-bold fs-6 mb-2'>Currency</label>
                                <select className='form-control form-select form-control-solid mb-8' autoComplete='off'>
                                    <option value=''>Select Currency</option>
                                    <option value='E-BOOK'>RUPEE</option>
                                    <option value='YOUTUBE VIDEOS'>USD</option>
                                    <option value='VODCAST'>URO</option>
                                </select>
                            </div>
                            <div className='mb-3'>
                                <label className='required fw-bold fs-6 mb-2'>Paid Amount</label>
                                <div className="input-group">
                                    <input
                                        placeholder='Paid Amount'
                                        type='text'
                                        className='form-control form-control-solid mb-3 mb-lg-0'
                                        autoComplete='off'
                                    />
                                </div>
                            </div>
                            <div className='mb-7 mt-7'>
                                <TableButton
                                    action="add"
                                    text="Add"
                                    className='w-100'
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='modal fade' id='kt_modal_exercise' aria-hidden='true'>
                <div className='modal-dialog modal-dialog-centered mw-600px'>
                    <div className='modal-content border-0'>

                        <div className='modal-header border-0 justify-content-end'>
                            <button type='button' className='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>
                        </div>
                        <div className='text-center mb-4'>
                            <img src={questionmark} alt="Question Mark" style={{ width: '80px', height: '80px' }} />
                            <h2 className='fw-bold mt-3' style={{ fontSize: '25px' }}>Are you sure?</h2>
                        </div>
                        <div className='modal-body p-5'>
                            <h3 className='text-center fw-20'>This user will be removed from the portal and will no longer access</h3>
                        </div>
                        <div className='modal-footer border-0 d-flex justify-content-center'>
                            <button className='btn btn-danger me-3 fs-24' style={{ padding: '12px 24px', fontSize: '20px' }}>
                                <FontAwesomeIcon className='me-2' icon={faCheck} />
                                Okay
                            </button>
                            <button className='btn btn-danger fs-29' data-bs-dismiss='modal' style={{ padding: '12px 24px', fontSize: '20px' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
const StudentsScolarUserView = () => {
    const intl = useIntl()
    return (
        <>
            <PageTitle breadcrumbs={[]}>Dashboard</PageTitle>
            <ViewUserDetailsPage />
            <StudentsUserView />
        </>
    )
}
export { StudentsScolarUserView };

