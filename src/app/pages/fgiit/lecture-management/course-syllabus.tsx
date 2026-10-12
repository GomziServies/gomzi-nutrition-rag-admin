import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";
import { PageTitle } from "../../../../_metronic/layout/core";
import { KTCard } from '../../../../_metronic/helpers';
import LengthMenu from "../../../components/LengthMenu";
import SearchFilter from "../../../components/SearchFilter";
import Table from '../../../components/Table';
import TableButton from "../../../components/TableButton";
import UsersListPagination from '../../../components/TablePagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faArrowLeft, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { 
  getFGIITSyllabusChapters, 
  createFGIITSyllabusChapter, 
  updateFGIITSyllabusChapter, 
  removeFGIITSyllabusChapter,
  FGIITSyllabusChapter as SyllabusType
} from '../../../Functions/FGGroup/FGIITSyllabusChapter';
import { getFGIITSyllabus } from '../../../Functions/FGGroup/FGIITSyllabus';
import { FileUploadToFGGroup } from '../../../Functions/FGGroup/AccountFunctions';
import Swal from 'sweetalert2';

interface Course {
  id?: string;
  _id: string;
  lectureName: string;
}

const CourseSyllabus: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');
  
  const [visibleDetails, setVisibleDetails] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState<Course | null>(null);
  
  // Modal state
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [showEditChapterModal, setShowEditChapterModal] = useState(false);
  const [showViewChapterModal, setShowViewChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<SyllabusType | null>(null);
  const [viewingChapter, setViewingChapter] = useState<SyllabusType | null>(null);

  // Syllabus chapters
  const [syllabusChapters, setSyllabusChapters] = useState<SyllabusType[]>([]);

  // New chapter form
  const [newChapter, setNewChapter] = useState({
    classNumber: "",
    chapterName: ""
  });

  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingEditFile, setUploadingEditFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEditFile, setSelectedEditFile] = useState<File | null>(null);

  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('classNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState({
    page: 1,
    itemsPerPage: 10,
  });

  useEffect(() => {
    // Get course data from localStorage or URL param
    const storedCourse = localStorage.getItem('selectedCourseData');
    if (storedCourse) {
      const course = JSON.parse(storedCourse);
      setCourseData(course);
      loadSyllabusChapters(course.id || course._id);
    } else if (courseIdFromUrl) {
      // If no localStorage, use courseId from URL
      loadSyllabusChapters(courseIdFromUrl);
    } else {
      navigate('/fgiit/lecture-overview');
    }
  }, [navigate, courseIdFromUrl]);

  const loadSyllabusChapters = async (cId: string) => {
    try {
      setLoading(true);
      const response = await getFGIITSyllabusChapters({
        syllabusId: cId,
        page: pagination.page,
        limit: pagination.itemsPerPage,
        sort: sort,
        sortOrder: sortOrder
      });

      if (response.status === 200) {
        setSyllabusChapters(response.data);
        
        // Extract course name from the first syllabus entry if available
        if (response.data && response.data.length > 0) {
          const firstEntry = response.data[0];
          if (typeof firstEntry.syllabusId === 'object' && firstEntry.syllabusId !== null) {
            setCourseData({
              _id: (firstEntry.syllabusId as any)._id,
              id: (firstEntry.syllabusId as any)._id,
              lectureName: (firstEntry.syllabusId as any).syllabusName
            });
          }
        } 
        
        // If syllabus is empty or course data not found, try to fetch course details directly
        if ((!response.data || response.data.length === 0) && cId && !courseData) {
          try {
            // Fetch specific course by ID
            const courseResponse = await getFGIITSyllabus({
              syllabus_id: cId
            });

            if (courseResponse.status === 200 && courseResponse.data && courseResponse.data.length > 0) {
              const foundCourse = courseResponse.data[0];
              setCourseData({
                _id: foundCourse._id,
                id: foundCourse._id,
                lectureName: foundCourse.syllabusName
              });
            }
          } catch (err) {
            console.error('Error fetching course details:', err);
          }
        }
      } else {
        toast.error('Failed to load syllabus');
      }
    } catch (error: any) {
      console.error('Error loading syllabus:', error);
      toast.error(error?.response?.data?.message || 'Failed to load syllabus');
    } finally {
      setLoading(false);
    }
  };

  // Filter chapters
  const filteredChapters = syllabusChapters.filter(chapter => {
    const matchesSearch = searchTerm === '' || 
      chapter.chapterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chapter.classNumber.toString().includes(searchTerm) ||
      (chapter.pdfFileName && chapter.pdfFileName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Sort chapters
  const sortedChapters = [...filteredChapters].sort((a, b) => {
    if (sort === 'classNumber') {
      return sortOrder === 'asc' ? a.classNumber - b.classNumber : b.classNumber - a.classNumber;
    }
    if (sort === 'chapterName') {
      return sortOrder === 'asc' 
        ? a.chapterName.localeCompare(b.chapterName)
        : b.chapterName.localeCompare(a.chapterName);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedChapters.length / pagination.itemsPerPage);
  const startIndex = (pagination.page - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  const paginatedChapters = sortedChapters.slice(startIndex, endIndex);

  const handleAddChapter = async () => {
    if (!newChapter.classNumber || !newChapter.chapterName) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }

    const currentCourseId = courseData?.id || courseData?._id || courseIdFromUrl;
    if (!currentCourseId) {
      toast.error('Course ID not found');
      return;
    }

    try {
      setUploadingFile(true);

      // Upload file first
      const uploadResponse = await FileUploadToFGGroup(selectedFile, { directory: 'fgiit-course-syllabus' });

      if (!uploadResponse || uploadResponse.status !== 200 || !uploadResponse.data || !uploadResponse.data.fileURLs || uploadResponse.data.fileURLs.length === 0) {
        toast.error('Failed to upload file');
        setUploadingFile(false);
        return;
      }

      const fileURL = uploadResponse.data.fileURLs[0];
      const fileName = selectedFile.name;
      const fullFileURL = `https://files.fggroup.in/${fileURL}`;

      // Create chapter with uploaded file info
      const response = await createFGIITSyllabusChapter({
        syllabusId: currentCourseId,
        classNumber: parseInt(newChapter.classNumber),
        chapterName: newChapter.chapterName,
        pdfFileName: fileName,
        pdfUrl: fullFileURL
      });

      if (response.status === 201) {
        toast.success('Chapter added successfully');
        setShowAddChapterModal(false);
        setNewChapter({
          classNumber: "",
          chapterName: ""
        });
        setSelectedFile(null);
        // Reload syllabus
        loadSyllabusChapters(currentCourseId);
      } else {
        toast.error(response.message || 'Failed to add chapter');
      }
    } catch (error: any) {
      console.error('Error adding chapter:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add chapter';
      toast.error(errorMessage);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleEditChapter = async () => {
    if (!editingChapter) return;

    if (!editingChapter.classNumber || !editingChapter.chapterName) {
      toast.error('Please fill all required fields');
      return;
    }

    const currentCourseId = courseData?.id || courseData?._id || courseIdFromUrl;

    try {
      setUploadingEditFile(true);

      let pdfFileName = editingChapter.pdfFileName;
      let pdfUrl = editingChapter.pdfUrl;

      // If a new file is selected, upload it first
      if (selectedEditFile) {
        const uploadResponse = await FileUploadToFGGroup(selectedEditFile, { directory: 'fgiit-course-syllabus' });

        if (!uploadResponse || uploadResponse.status !== 200 || !uploadResponse.data || !uploadResponse.data.fileURLs || uploadResponse.data.fileURLs.length === 0) {
          toast.error('Failed to upload file');
          setUploadingEditFile(false);
          return;
        }

        pdfUrl = uploadResponse.data.fileURLs[0];
        pdfFileName = selectedEditFile.name;
        pdfUrl = `https://files.fggroup.in/${pdfUrl}`;
      }

      const response = await updateFGIITSyllabusChapter({
        id: editingChapter._id,
        classNumber: editingChapter.classNumber,
        chapterName: editingChapter.chapterName,
        pdfFileName: pdfFileName || undefined,
        pdfUrl: pdfUrl || undefined
      });

      if (response.status === 200) {
        toast.success('Chapter updated successfully');
        setShowEditChapterModal(false);
        setEditingChapter(null);
        setSelectedEditFile(null);
        // Reload syllabus
        if (currentCourseId) loadSyllabusChapters(currentCourseId);
      } else {
        toast.error(response.message || 'Failed to update chapter');
      }
    } catch (error: any) {
      console.error('Error updating chapter:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update chapter';
      toast.error(errorMessage);
    } finally {
      setUploadingEditFile(false);
    }
  };

  const handleViewChapter = (chapter: SyllabusType) => {
    setViewingChapter(chapter);
    setShowViewChapterModal(true);
  };

  const handleDeleteChapter = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      const currentCourseId = courseData?.id || courseData?._id || courseIdFromUrl;
      
      try {
        const response = await removeFGIITSyllabusChapter(id);
        
        if (response.status === 200) {
          Swal.fire({
            title: 'Deleted!',
            text: 'Chapter has been deleted successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          // Reload syllabus
          if (currentCourseId) loadSyllabusChapters(currentCourseId);
        } else {
          Swal.fire({
            title: 'Error!',
            text: response.message || 'Failed to delete chapter',
            icon: 'error'
          });
        }
      } catch (error: any) {
        console.error('Error deleting chapter:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete chapter';
        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error'
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload only PDF files');
      e.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should not exceed 10MB');
      e.target.value = '';
      return;
    }

    if (isEdit) {
      setSelectedEditFile(file);
    } else {
      setSelectedFile(file);
    }
  };

  const handleViewPdf = (pdfUrl: string, fileName: string) => {
    if (pdfUrl) {
      toast.success(`Opening ${fileName}`);
      window.open(pdfUrl, '_blank');
    } else {
      toast.error('PDF URL not available');
    }
  };

  const handleRowClick = (id: string) => {
    if (window.innerWidth <= 1024) {
      setVisibleDetails(visibleDetails === id ? null : id);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setPagination({ ...pagination, itemsPerPage: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
    setSort(newSort);
    setSortOrder(newSortOrder);
  };

  const sortableFields = [
    { title: 'Class No', field: 'classNumber' },
    { title: 'Chapter Name', field: 'chapterName' },
    { title: 'PDF', field: 'pdf' },
  ];

  return (
    <>
      <PageTitle breadcrumbs={[]}>
        {courseData?.lectureName || 'Course'} - Syllabus
      </PageTitle>

      {/* Syllabus Table */}
      <KTCard className="mb-5">
        <div className='card-header border-0 pt-6'>
          <div className='card-title'>
            <div className='d-flex align-items-center'>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "0.75rem",
                }}
              >
                <i className="bi bi-book-fill" style={{ color: "#fff", fontSize: "20px" }} />
              </div>
              <h5 style={{ fontWeight: 700, marginBottom: 0, color: "#0f172a", fontSize: "1.35rem" }}>
                Course Syllabus
              </h5>
            </div>
          </div>
          <div className='card-toolbar'>
            <TableButton
              action='add'
              onClick={() => setShowAddChapterModal(true)}
              text='Add Chapter'
            />
          </div>
        </div>

        <div className='card-body py-4'>
          {/* Filter Section */}
          <div className='row border-0 mb-4'>
            <div className='col-md-5'>
              <div className='d-flex align-items-center'>
                <SearchFilter
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
                <LengthMenu
                  expenseData={sortedChapters}
                  handleItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className='table-responsive'>
            <Table
              data={paginatedChapters}
              columns={sortableFields}
              sort={sort}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              renderRow={(chapter: SyllabusType, index: number, actualIndex: number, isVisible: boolean) => {
                return (
                  <React.Fragment key={chapter._id}>
                    <tr 
                      onClick={() => handleRowClick(chapter._id)}
                      className='data-row'
                    >
                      <td>
                        <span className='text-dark fw-bold ms-6 mb-1 fs-6'>
                          <FontAwesomeIcon
                            icon={faPlusCircle}
                            className='me-2 plus-icon'
                            style={{ color: '#607D8B', fontSize: '18px' }}
                          />
                          {startIndex + index + 1}
                        </span>
                      </td>
                      
                      <td>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0.5rem 1rem",
                          borderRadius: "10px",
                          background: "#fef3c7",
                          border: "1.5px solid #f59e0b",
                        }}>
                          <i className="bi bi-hash" style={{ color: "#f59e0b", marginRight: "0.5rem", fontSize: "16px" }} />
                          <span style={{ 
                            fontSize: "0.95rem", 
                            fontWeight: 700,
                            color: "#d97706"
                          }}>
                            Class {chapter.classNumber}
                          </span>
                        </div>
                      </td>
                      
                      <td>
                        <div className='d-flex flex-column'>
                          <span className='text-dark fw-bold d-block mb-1 fs-6'>
                            {chapter.chapterName}
                          </span>
                          <span className='text-muted fw-semibold d-block fs-7'>
                            <i className="bi bi-calendar3 me-2" style={{ color: '#8b5cf6' }} />
                            Updated: {new Date(chapter.updatedAt).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </td>

                      <td>
                        {chapter.pdfFileName && chapter.pdfUrl ? (
                          <div className='d-flex align-items-center'>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: "0.75rem",
                              }}
                            >
                              <FontAwesomeIcon icon={faFilePdf} style={{ color: "#fff", fontSize: "18px" }} />
                            </div>
                            <div className='d-flex flex-column'>
                              <span className='text-dark fw-bold d-block fs-7' style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {chapter.pdfFileName}
                              </span>
                              <span className='text-muted fw-semibold d-block fs-8'>
                                PDF Document
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className='text-muted fs-7'>No PDF</span>
                        )}
                      </td>

                      <td>
                        <div className='d-flex gap-2'>
                          <TableButton
                            action='view'
                            onClick={() => handleViewChapter(chapter)}
                          />
                          <TableButton
                            action='edit'
                            onClick={() => {
                              setEditingChapter(chapter);
                              setShowEditChapterModal(true);
                            }}
                          />
                          <TableButton
                            action='remove'
                            onClick={() => handleDeleteChapter(chapter._id)}
                          />
                        </div>
                      </td>
                    </tr>
                    {isVisible && (
                      <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                        <td colSpan={5}>
                          <div className='p-3'>
                            <strong>Class No: </strong> {chapter.classNumber}
                            <br />
                            <strong>Chapter Name: </strong> {chapter.chapterName}
                            <br />
                            {chapter.pdfFileName && (
                              <>
                                <strong>PDF File: </strong> {chapter.pdfFileName}
                                <br />
                              </>
                            )}
                            <strong>Last Updated: </strong> {new Date(chapter.updatedAt).toLocaleDateString('en-GB')}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }}
              visibleDetails={visibleDetails}
              pagination={pagination}
              setPagination={setPagination}
              loading={loading}
            />
          </div>

          {sortedChapters.length === 0 && !loading && (
            <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
              <b>No syllabus chapters found</b>
            </div>
          )}

          {sortedChapters.length > 0 && (
            <UsersListPagination
              totalPages={totalPages}
              currentPage={pagination.page}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </KTCard>
      
      {/* Back Button */}
      <div className='mb-5 d-flex justify-content-end'>
        <Button
          variant='primary'
          onClick={() => navigate(-1)}
          style={{ 
            borderRadius: '10px',
            padding: '0.65rem 1.25rem',
            fontWeight: 600
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} className='me-2' />
          Back to Courses
        </Button>
      </div>

      {/* Add Chapter Modal */}
      <Modal show={showAddChapterModal} onHide={() => setShowAddChapterModal(false)} size='lg' centered>
        <Modal.Header closeButton className='border-0 pb-0'>
          <Modal.Title className='fw-bolder fs-2'>
            <i className="bi bi-book-fill me-3" style={{ color: '#8b5cf6' }}></i>
            Add New Chapter
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='p-6'>
          <Form>
            <div className='row'>
              <div className='col-md-12 mb-4'>
                <Form.Group>
                  <Form.Label className='fw-bold'>Class No <span className='text-danger'>*</span></Form.Label>
                  <Form.Control
                    type='number'
                    placeholder='e.g., 1'
                    value={newChapter.classNumber}
                    onChange={(e) => setNewChapter({ ...newChapter, classNumber: e.target.value })}
                    style={{ borderRadius: '8px', padding: '0.75rem' }}
                  />
                </Form.Group>
              </div>
              <div className='col-md-12 mb-4'>
                <Form.Group>
                  <Form.Label className='fw-bold'>Chapter Name <span className='text-danger'>*</span></Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='e.g., Introduction to Physical Therapy'
                    value={newChapter.chapterName}
                    onChange={(e) => setNewChapter({ ...newChapter, chapterName: e.target.value })}
                    style={{ borderRadius: '8px', padding: '0.75rem' }}
                  />
                </Form.Group>
              </div>
              <div className='col-md-12 mb-4'>
                <Form.Group>
                  <Form.Label className='fw-bold'>Upload PDF File <span className='text-danger'>*</span></Form.Label>
                  <Form.Control
                    type='file'
                    accept='.pdf,application/pdf'
                    onChange={(e) => handleFileChange(e as React.ChangeEvent<HTMLInputElement>, false)}
                    disabled={uploadingFile}
                    style={{ borderRadius: '8px', padding: '0.75rem' }}
                  />
                  {selectedFile && (
                    <div className='mt-2'>
                      <span className='text-success'>
                        <i className="bi bi-check-circle me-2"></i>
                        Selected: {selectedFile.name}
                      </span>
                    </div>
                  )}
                  <Form.Text className='text-muted'>
                    Select a PDF file (max 10MB). File will be uploaded when you click "Add Chapter".
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className='border-0 pt-0'>
          <Button 
            variant='light' 
            onClick={() => {
              setShowAddChapterModal(false);
              setNewChapter({
                classNumber: "",
                chapterName: ""
              });
              setSelectedFile(null);
            }}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Cancel
          </Button>
          <Button 
            variant='primary' 
            onClick={handleAddChapter}
            disabled={uploadingFile}
            style={{ 
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none'
            }}
          >
            {uploadingFile ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading & Adding...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill me-2"></i>
                Add Chapter
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Chapter Modal */}
      <Modal show={showEditChapterModal} onHide={() => setShowEditChapterModal(false)} size='lg' centered>
        <Modal.Header closeButton className='border-0 pb-0'>
          <Modal.Title className='fw-bolder fs-2'>
            <i className="bi bi-pencil-square me-3" style={{ color: '#3b82f6' }}></i>
            Edit Chapter
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='p-6'>
          <Form>
            <div className='row'>
              <div className='col-md-12 mb-4'>
                <Form.Group>
                  <Form.Label className='fw-bold'>Class No <span className='text-danger'>*</span></Form.Label>
                  <Form.Control
                    type='number'
                    placeholder='e.g., 1'
                    value={editingChapter?.classNumber || ''}
                    onChange={(e) => setEditingChapter(editingChapter ? { ...editingChapter, classNumber: parseInt(e.target.value) || 0 } : null)}
                    style={{ borderRadius: '8px', padding: '0.75rem' }}
                  />
                </Form.Group>
              </div>
              <div className='col-md-12 mb-4'>
                <Form.Group>
                  <Form.Label className='fw-bold'>Chapter Name <span className='text-danger'>*</span></Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='e.g., Introduction to Physical Therapy'
                    value={editingChapter?.chapterName || ''}
                    onChange={(e) => setEditingChapter(editingChapter ? { ...editingChapter, chapterName: e.target.value } : null)}
                    style={{ borderRadius: '8px', padding: '0.75rem' }}
                  />
                </Form.Group>
              </div>
              <div className='col-md-12 mb-4'>
                <Form.Group>
                  <Form.Label className='fw-bold'>Upload New PDF File (Optional)</Form.Label>
                  <Form.Control
                    type='file'
                    accept='.pdf,application/pdf'
                    onChange={(e) => handleFileChange(e as React.ChangeEvent<HTMLInputElement>, true)}
                    disabled={uploadingEditFile}
                    style={{ borderRadius: '8px', padding: '0.75rem' }}
                  />
                  {selectedEditFile && (
                    <div className='mt-2'>
                      <span className='text-success'>
                        <i className="bi bi-check-circle me-2"></i>
                        Selected: {selectedEditFile.name}
                      </span>
                    </div>
                  )}
                  {editingChapter?.pdfFileName && !selectedEditFile && (
                    <div className='mt-2'>
                      <span className='text-muted'>
                        <i className="bi bi-file-pdf me-2"></i>
                        Current: {editingChapter.pdfFileName}
                      </span>
                    </div>
                  )}
                  <Form.Text className='text-muted'>
                    Upload a new PDF file (max 10MB) to replace the existing one. File will be uploaded when you click "Update Chapter".
                  </Form.Text>
                </Form.Group>
              </div>

              {/* PDF Preview Section */}
              {editingChapter?.pdfUrl && !selectedEditFile && (
                <div className='col-md-12 mb-4'>
                  <label className='fw-bold text-muted mb-2'>Current PDF Preview</label>
                  <div className='border rounded p-2' style={{ background: '#f8f9fa' }}>
                    <div className='d-flex align-items-center justify-content-between mb-3 p-2'>
                      <div className='d-flex align-items-center'>
                        <i className="bi bi-file-pdf me-2" style={{ color: '#dc2626', fontSize: '20px' }}></i>
                        <span className='fw-semibold'>{editingChapter.pdfFileName || 'document.pdf'}</span>
                      </div>
                      <Button
                        variant='outline-primary'
                        size='sm'
                        onClick={() => window.open(`https://files.fggroup.in/${editingChapter.pdfUrl}`, '_blank')}
                      >
                        <i className="bi bi-box-arrow-up-right me-2"></i>
                        Open in New Tab
                      </Button>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '400px', 
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <iframe
                        src={`https://files.fggroup.in/${editingChapter.pdfUrl}`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="PDF Preview"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className='border-0 pt-0'>
          <Button 
            variant='light' 
            onClick={() => {
              setShowEditChapterModal(false);
              setEditingChapter(null);
              setSelectedEditFile(null);
            }}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Cancel
          </Button>
          <Button 
            variant='primary' 
            onClick={handleEditChapter}
            disabled={uploadingEditFile}
            style={{ 
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none'
            }}
          >
            {uploadingEditFile ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading & Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill me-2"></i>
                Update Chapter
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Chapter Modal with PDF Preview */}
      <Modal 
        show={showViewChapterModal} 
        onHide={() => {
          setShowViewChapterModal(false);
          setViewingChapter(null);
        }}
        size="xl"
        centered
      >
        <Modal.Header closeButton className='border-0 pb-0'>
          <Modal.Title className='d-flex align-items-center w-100'>
            <i className="bi bi-eye me-3" style={{ color: '#10b981' }}></i>
            View Chapter Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className='p-6'>
          {viewingChapter && (
            <div>
              <div className='row mb-4'>
                <div className='col-md-6 mb-3'>
                  <label className='fw-bold text-muted mb-2'>Class Number</label>
                  <div className='p-3 bg-light rounded'>
                    <i className="bi bi-hash me-2" style={{ color: '#f59e0b' }}></i>
                    <span className='fw-bold'>Class {viewingChapter.classNumber}</span>
                  </div>
                </div>
                <div className='col-md-6 mb-3'>
                  <label className='fw-bold text-muted mb-2'>Chapter Name</label>
                  <div className='p-3 bg-light rounded'>
                    <i className="bi bi-book me-2" style={{ color: '#8b5cf6' }}></i>
                    <span className='fw-bold'>{viewingChapter.chapterName}</span>
                  </div>
                </div>
              </div>

              {viewingChapter.pdfUrl && (
                <div className='mb-4'>
                  <label className='fw-bold text-muted mb-2'>PDF Document</label>
                  <div className='border rounded p-2' style={{ background: '#f8f9fa' }}>
                    <div className='d-flex align-items-center justify-content-between mb-3 p-2'>
                      <div className='d-flex align-items-center'>
                        <i className="bi bi-file-pdf me-2" style={{ color: '#dc2626', fontSize: '24px' }}></i>
                        <span className='fw-semibold'>{viewingChapter.pdfFileName || 'document.pdf'}</span>
                      </div>
                      <Button
                        variant='outline-primary'
                        size='sm'
                        onClick={() => window.open(`https://files.fggroup.in/${viewingChapter.pdfUrl}`, '_blank')}
                      >
                        <i className="bi bi-box-arrow-up-right me-2"></i>
                        Open in New Tab
                      </Button>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '600px', 
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <iframe
                        src={`https://files.fggroup.in/${viewingChapter.pdfUrl}`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="PDF Preview"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!viewingChapter.pdfUrl && (
                <div className='alert alert-warning'>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  No PDF file available for this chapter
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className='border-0 pt-0'>
          <Button 
            variant='light' 
            onClick={() => {
              setShowViewChapterModal(false);
              setViewingChapter(null);
            }}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CourseSyllabus;