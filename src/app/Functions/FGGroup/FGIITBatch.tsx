import { getAPIHeaders } from '../../../_metronic/helpers/AuthToken';
import { APIPost, APIGet } from "../../../_metronic/helpers/Utils";
import * as FGGroupEndpoints from "../../constants/fg_group_endpoints";

export interface FGIITBatch {
    _id: string;
    batchName: string;
    batchType: 'weekend' | 'weekday';
    isRunning: boolean;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFGIITBatchParams {
    batchName: string;
    batchType: 'weekend' | 'weekday';
    isRunning?: boolean;
    status?: boolean;
}

export interface GetFGIITBatchParams {
    page?: number;
    limit?: number;
    search?: string;
    batchType?: 'weekend' | 'weekday';
}

export interface UpdateFGIITBatchParams {
    batchId: string;
    batchName?: string;
    batchType?: 'weekend' | 'weekday';
    isRunning?: boolean;
    status?: boolean;
}

// Create FGIIT Batch
export const createFGIITBatch = async (data: CreateFGIITBatchParams): Promise<FGGroupAPIResponse> => {
    return APIPost(FGGroupEndpoints.CreateFGIITBatch, getAPIHeaders('fg_group'), undefined, data);
};

// Get FGIIT Batch
export const getFGIITBatch = async (params: GetFGIITBatchParams): Promise<FGGroupAPIResponse> => {
    return APIGet(FGGroupEndpoints.GetFGIITBatch, getAPIHeaders('fg_group'), params);
};

// Update FGIIT Batch
export const updateFGIITBatch = async (data: UpdateFGIITBatchParams): Promise<FGGroupAPIResponse> => {
    return APIPost(FGGroupEndpoints.UpdateFGIITBatch, getAPIHeaders('fg_group'), undefined, data);
};

// Remove FGIIT Batch
export const removeFGIITBatch = async (id: string): Promise<FGGroupAPIResponse> => {
    return APIPost(FGGroupEndpoints.RemoveFGIITBatch, getAPIHeaders('fg_group'), undefined, { batch_id: id });
};
