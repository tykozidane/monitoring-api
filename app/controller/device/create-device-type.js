import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { createDeviceTypeService } from "../../service/device/create-device-type-service.js";

const controller = async (req, res) => {
    try {

        const {
            c_device_type,
            n_device_type,
            c_device,
            c_project,
            n_number
        } = req.body;

        if (!c_device_type || !c_device || !c_project || !n_number) {
            throw {
                code: "4000",
                message: "Required fields are missing"
            };
        }

        const createdBy = req.user?.username || "system";

        const result = await createDeviceTypeService(
            req.body,
            createdBy
        );

        if (result.code !== 0) {
            if (result.code === "02" || result.code === "03") {
                return response_success_data({
                    res,
                    status: result.code || "01",
                    message: result.message || "Device type already exists",
                    data: {}
                });
            } else {
            throw result;
            }
        }

        return response_success_data({
            res,
            status: "00",
            message: "Device type created successfully",
            data: result.message
        });

    } catch (err) {

        await saveError(
            err.code,
            err.message,
            JSON.stringify(err)
        );

        return response_error({
            res,
            status: err.code ||"2001",
            code: "1",
            message: err.message,
            data: err
        });
    }
};

export default controller;