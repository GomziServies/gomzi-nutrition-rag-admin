import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken';
import { APIPost, APIGet } from "../../../_metronic/helpers/Utils";
import * as FGGroupEndpoints from "../../constants/fg_group_endpoints";

export interface FGIITSyllabus {
    _id: string;
    syllabusName: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFGIITSyllabusParams {
    syllabusName: string;
}

export interface GetFGIITSyllabusParams {
    page?: number;
    limit?: number;
    search?: string;
    syllabus_id?: string;
}

export interface UpdateFGIITSyllabusParams {
    id: string;
    syllabusName: string;
}

// Create FGIIT Syllabus
export const createFGIITSyllabus = async (data: CreateFGIITSyllabusParams): Promise<FGGroupAPIResponse> => {
    return APIPost(FGGroupEndpoints.createFGIITSyllabus, getAPIHeaders('fg_group'), undefined, data);
};

// Get FGIIT Syllabus
export const getFGIITSyllabus = async (params: GetFGIITSyllabusParams): Promise<FGGroupAPIResponse> => {
    return APIGet(FGGroupEndpoints.getFGIITSyllabus, getAPIHeaders('fg_group'), params);
};

// Update FGIIT Syllabus
export const updateFGIITSyllabus = async (data: UpdateFGIITSyllabusParams): Promise<FGGroupAPIResponse> => {
    return APIPost(FGGroupEndpoints.updateFGIITSyllabus, getAPIHeaders('fg_group'), undefined, data);
};

// Remove FGIIT Syllabus
export const removeFGIITSyllabus = async (id: string): Promise<FGGroupAPIResponse> => {
    return APIPost(FGGroupEndpoints.removeFGIITSyllabus, getAPIHeaders('fg_group'), undefined, { id });
};

