import {
    response_success,
    response_error,
    response_success_data
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import {
    checkUniqueness,
    saveToDatabase
} from "../../service/project-service.js";

const controller = async (req, res) => {
    try {
        const { c_project, n_project_name, n_project_desc } = req.body;

        // Basic validation
        if (!c_project || !n_project_name) {
        throw {
            code: "4000",
            message: "c_project and n_project_name are required"
        };
        }

        // Check uniqueness
        const check = await checkUniqueness(c_project, n_project_name);
        if (check.code !== 0) throw check;

        // Save to database
        const save = await saveToDatabase({
        c_project,
        n_project_name,
        n_project_desc
        });

        if (save.code !== 0) throw save;

        return response_success_data({
        res,
        status: "00",
        message: "Project created successfully",
        data: save.data
        });

    } catch (err) {
        await saveError(
        err.code || "5000",
        err.message,
        JSON.stringify(err)
        );

        return response_error({
        res,
        status: "2001",
        code: "1",
        message: err.message || "Internal Server Error",
        data: err
        });
    }
};

export default controller;
