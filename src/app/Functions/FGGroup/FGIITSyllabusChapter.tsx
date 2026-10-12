import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken';
import { APIPost, APIGet } from "../../../_metronic/helpers/Utils";
import {
    CreateFGIITSyllabusChapter,
    GetFGIITSyllabusChapter,
    GetFGIITSyllabusChapterById,
    UpdateFGIITSyllabusChapter,
    RemoveFGIITSyllabusChapter
} from "../../constants/fg_group_endpoints";

export interface FGIITSyllabusChapter {
    _id: string;
    syllabusId: string | { _id: string; syllabusName: string };
    classNumber: number;
    chapterName: string;
    pdfFileName?: string;
    pdfUrl?: string;
    batchType?: 'weekend' | 'weekday';
    createdAt: string;
    updatedAt: string;
}

export interface CreateFGIITSyllabusChapterParams {
    syllabusId: string;
    classNumber: number;
    chapterName: string;
    pdfFileName?: string;
    pdfUrl?: string;
    batchType?: 'weekend' | 'weekday';
}

export interface GetFGIITSyllabusChapterParams {
    syllabusId?: string;
    batchType?: 'weekend' | 'weekday';
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface UpdateFGIITSyllabusChapterParams {
    id: string;
    classNumber?: number;
    chapterName?: string;
    pdfFileName?: string;
    pdfUrl?: string;
    batchType?: 'weekend' | 'weekday';
}

// Create
export const createFGIITSyllabusChapter = async (data: CreateFGIITSyllabusChapterParams) => {
    return APIPost(CreateFGIITSyllabusChapter, getAPIHeaders('fg_group'), undefined, data);
};

// Get (list)
export const getFGIITSyllabusChapters = async (params: GetFGIITSyllabusChapterParams) => {
    return APIGet(GetFGIITSyllabusChapter, getAPIHeaders('fg_group'), params);
};

// Get by ID
export const getFGIITSyllabusChapterById = async (id: string) => {
    return APIGet(GetFGIITSyllabusChapterById, getAPIHeaders('fg_group'), { id });
};

// Update
export const updateFGIITSyllabusChapter = async (data: UpdateFGIITSyllabusChapterParams) => {
    return APIPost(UpdateFGIITSyllabusChapter, getAPIHeaders('fg_group'), undefined, data);
};

// Remove
export const removeFGIITSyllabusChapter = async (id: string) => {
    return APIPost(RemoveFGIITSyllabusChapter, getAPIHeaders('fg_group'), undefined, { id });
};
