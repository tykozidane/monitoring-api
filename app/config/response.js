
export const response_error = async function ({ res, status, message, code, data, string }) {
    return res.status(200).send({ 
        status: status,
        message: {
            ina: 'SEDANG TIDAK DAPAT MELAKUKAN TRANSAKSI \nSILAHKAN HUBUNGI PETUGAS \n(' + code + ')' ,
            eng: 'THE SYSTEM IS UNDER MAINTENANCE'
        },
        data: {
            msg: message,
            data: data
        },
        string: string
    });
}

export const response_success = async function ({ res, message, status, code, data, string }) {
    try {
    
        return res.status(200).send();
    } catch (e) {
        return response_error({ res: res, status: e.status || "6834", message: e.message })
    }
}

export const response_success_data = async function ({ res, message, status, code, data, string }) {
    try {
    
        return res.status(200).send({status: status || code || 0, message: message || 'success', data: data });
    } catch (e) {
        return response_error({ res: res, status: e.status || "6834", message: e.message })
    }
}

