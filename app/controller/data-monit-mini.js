import { response_success, response_error } from "../config/response.js";
import { getBodyList, saveToDbFunc } from "../service/data-monit-mini-service.js";
import { saveError } from "../service/error-service.js";


const controller = async (req, res) => {
    try {
        const arrBody = JSON.parse(req.body)
        // console.log("Check", arrBody[9])
        let dataSave = {}
        //Get The body List 
        const getBody = await getBodyList(arrBody[0], arrBody[1])
        var {code, message} = getBody

        const bodyList = JSON.parse(message.n_list.trim().replace(/\s*'\s*/g, '"'))
        for(let i =0; i<bodyList.length; i++){
            dataSave[bodyList[i]] = arrBody[i]
        }
        // console.log("bodyList", JSON.stringify(dataSave) )

        //save The data
        const saveData = await saveToDbFunc(arrBody[0], arrBody[1], arrBody[2], dataSave)
        if(saveData.code != 0) throw saveData
        return response_success({ res, message: "Success", status: "00" });
    } catch (err) {
        const saveDataError = await saveError(err.code, err.message, JSON.stringify(err));
        return response_error({ res, status: "1002", message: err.message, code: "2", data: err });
    }
};

export default controller;
