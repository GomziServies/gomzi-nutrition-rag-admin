import { useEffect, useState } from 'react';
import { PageTitle } from '../../../../_metronic/layout/core';
import InputField from '../../../components/InputField';
import { CreateExam, GetFitnessCourse } from '../../../Functions/FGGroup';
import toast from 'react-hot-toast';
import { MultiSelect } from 'react-multi-select-component';
import SelectField from '../../../components/SelectField';
import TableButton from '../../../components/TableButton';
import { useNavigate } from 'react-router-dom';

const ExamView = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [courses, setCourses] = useState([]);
    const [selected, setSelected] = useState<{ label: string, value: string, exam_course: string }[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: '',
        delayAllowed: '',
        exam_language: '',
    })

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target
        setFormData({ ...formData, [name]: value })
    }

    const handleCreateExam = async () => {
        try {
            setIsSubmitting(true);
            const formDataWith: any = {
                ...formData,
                duration: parseInt(formData.duration),
            };

            const selectedCourses = selected.map(course => course.value);

            await CreateExam({ ...formDataWith, exam_course: selectedCourses });
            toast.success('Exam Created Successfully');

            setFormData({
                title: '',
                description: '',
                duration: '',
                delayAllowed: '',
                exam_language: '',
            });
            setSelected([]);
            setIsSubmitting(false);

            navigate('/fgiit/exam');

        } catch (error: any) {
            toast.error(error.message)
            setIsSubmitting(false);
            console.error(error);
        }
    };

    const fetchCourses = async () => {
        try {
            const response: any = await GetFitnessCourse();
            const filteredCourses = response.data.filter((course: any) => course.coaching_mode === "VIRTUAL");
            const formattedCourses = filteredCourses.map((course: any) => ({
                label: `${course.course_name} - ${course.coaching_mode}`,
                value: course._id,
                exam_course: course.course_name,
            }));
            setCourses(formattedCourses);
        } catch (error: any) {
            console.error(error);
        }
    };

    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [shuffleOptions, setShuffleOptions] = useState(false);
    const [canStartAnytime, setCanStartAnytime] = useState(false);

    const handleShuffleQuestionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShuffleQuestions(event.target.checked);
    };

    const handleShuffleOptionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShuffleOptions(event.target.checked);
    };

    const handleCanStartAnytimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCanStartAnytime(event.target.checked);
    };


    useEffect(() => {
        fetchCourses()
    }, [])
    return (
        <>
            <PageTitle breadcrumbs={[]}>Add Exam</PageTitle>
            <div>
                <div className='row'>
                    <div className="col-md-12 mt-3">
                        <div className='card py-10'>
                            <div className='card-body row'>
                                <InputField
                                    placeholder='Exam Title'
                                    type='text'
                                    className="col-md-6  fv-row mb-7"
                                    name='title'
                                    label='Enter Exam Title'
                                    htmlFor='title'
                                    value={formData.title}
                                    onChange={handleInputChange}
                                />
                                <div className='col-md-6 '>
                                    <label htmlFor="selected" className='required fw-bold fs-6 mb-5'>Exam Course</label>
                                    <MultiSelect
                                        className='fv-row'
                                        options={courses}
                                        value={selected}
                                        onChange={setSelected}
                                        labelledBy="Select"
                                        hasSelectAll={false}
                                    />
                                </div>
                                <InputField
                                    placeholder='Description'
                                    type='text'
                                    className="col-md-6  fv-row mb-7"
                                    name='description'
                                    label='Enter Description'
                                    htmlFor='description'
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                                <InputField
                                    placeholder='Duration'
                                    type='number'
                                    className="col-md-6  fv-row mb-7"
                                    name='duration'
                                    label='Enter Duration'
                                    htmlFor='duration'
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                />
                                <InputField
                                    placeholder='Delay Allowed'
                                    type='number'
                                    className="col-md-6  fv-row mb-7"
                                    name='delayAllowed'
                                    label='in minute (ex. 5)'
                                    htmlFor='delayAllowed'
                                    value={formData.delayAllowed}
                                    onChange={handleInputChange}
                                />
                                <SelectField
                                    className='col-6 fv-row m-0'
                                    label='Exam Language'
                                    name='exam_language'
                                    value={formData.exam_language}
                                    onChange={handleInputChange}
                                    htmlFor='exam_language'
                                    options={[
                                        'English',
                                        'Hindi',
                                    ]}
                                />

                                {/* Shuffle Questions */}
                                <div className='d-flex mt-5'>
                                    <div className='col-md-3 mb-7'>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='shuffleQuestions'
                                                checked={shuffleQuestions}
                                                onChange={handleShuffleQuestionsChange}
                                            />
                                            <label className='form-check-label text-black' htmlFor='shuffleQuestions'>
                                                Shuffle Questions
                                            </label>
                                        </div>
                                    </div>


                                    <div className='col-md-3 mb-7'>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='shuffleOptions'
                                                checked={shuffleOptions}
                                                onChange={handleShuffleOptionsChange}
                                            />
                                            <label className='form-check-label text-black' htmlFor='shuffleOptions'>
                                                Shuffle Options
                                            </label>
                                        </div>
                                    </div>


                                    <div className='col-md-3 mb-7'>
                                        <div className='form-check'>
                                            <input
                                                className='form-check-input'
                                                type='checkbox'
                                                id='canStartAnytime'
                                                checked={canStartAnytime}
                                                onChange={handleCanStartAnytimeChange}
                                            />
                                            <label className='form-check-label text-black' htmlFor='canStartAnytime'>
                                                Can Start Anytime
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Exam Button */}
                                <div className='col-md-12 mt-3 d-flex justify-content-end'>
                                    <TableButton
                                        action="add"
                                        onClick={handleCreateExam}
                                        text="Add Exam"
                                    />
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

};
export default ExamView;