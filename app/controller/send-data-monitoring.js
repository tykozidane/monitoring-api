import { response_success, response_error } from "../config/response.js";
import { reqLogLoki, resErrorLogLoki, resLogLoki } from "../middleware/logger_loki.js";
import { saveToDbFunc, checkDeviceFunc, getDataSensorFunc } from "../service/sendDataService.js";
import moment from 'moment';
import * as uuid from 'uuid'

const controller = async (req, res) => {
    const uuidReqRes = uuid.v4()
    try {
        const { uid, name, timestamp, sensors } = req.body;
        reqLogLoki.info({
            uuid: uuidReqRes,
            string: JSON.stringify(req.body)
        })
        console.log("getData", sensors)
        //Check Device
        const getDataDevice = await checkDeviceFunc(uid);
        var { code, message } = getDataDevice;
        console.log(getDataDevice);
        if (code !== 0) throw getDataDevice;
        const dataDevice = message

        //Change timestamp to timestamp
        const timeStampSendSensor = moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
        console.log('Timestamp', timeStampSendSensor)

        //set String to log
        let stringLog = "api=data_monitoring "
        stringLog += `c_project=${dataDevice.c_project} c_station=${dataDevice.c_station} c_terminal=${dataDevice.c_terminal} c_device=${dataDevice.c_device} n_device_name=${dataDevice.n_device_name} c_device_type=${dataDevice.c_device_type} c_device_subtype=${dataDevice.c_device_subtype} `
        //Get Data Sensor
        const getDataSensor = await getDataSensorFunc(dataDevice.l_sensor);
        var {code, message} = getDataSensor;
        if(code!=0) throw getDataSensor;
        const dataSensor = message

        const setDataSave = await Promise.all(
            dataSensor.map(async (item) => {
                return new Promise(async (resolve) => {
                    const data = {
                        name: item.n_sensor_name,
                        measure: item.c_measure,
                        type: item.c_sensor_type,
                        value: sensors.find(obj => obj.type === item.c_sensor_type)?.values || null
                    }
                    console.log(item.c_sensor_type + " = " +sensors.find(obj => obj.type === item.c_sensor_type)?.values )
                    stringLog += `${item.c_loki_name}=${data.value} `
                    resolve(data)
                })
                
            })
        )
        // console.log(setDataSave)

        // Save the data
        const saveData = await saveToDbFunc(setDataSave, uid, timeStampSendSensor);
        var{ code, message } = saveData;
        // console.log(saveData);
        if (code !== 0) throw saveData;

        resLogLoki.info({
            uuid: uuidReqRes,
            string: stringLog
        })
        return response_success({ res, message: "Success", status: "00", data: message, string: stringLog });
    } catch (err) {
        resErrorLogLoki.info({
            uuid: uuidReqRes,
            string: ` status=1001 message=${err.message}`
        })
        return response_error({ res, status: "1001", message: err.message, code: "1", data: err });
    }
};

export default controller;
