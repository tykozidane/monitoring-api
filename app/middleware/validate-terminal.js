import db from "../config/database.js";

export const validateTerminal = async (req, res, next) => {
    try {
        const { c_project, c_station, c_terminal_sn } = req.body;

        if (!c_terminal_sn) {
        return res.status(400).json({
            code: "4003",
            message: "c_terminal_sn is required"
        });
        }

        const terminal = await db("master.t_m_terminal")
        .where("c_project", c_project)
        .andWhereRaw("TRIM(c_station) = TRIM(?)", [c_station])
        .andWhere("c_terminal_sn", c_terminal_sn)
        .where("b_active", true)
        .whereNull("d_deleted_at")
        .first();

        if (!terminal) {
        return res.status(404).json({
            code: "4043",
            message: "c_terminal_sn not found for this c_project and c_station"
        });
        }

        req.terminal = terminal;
        next();

    } catch (err) {
        return res.status(500).json({
        code: "5003",
        message: "Failed to validate terminal",
        error: err
        });
    }
};
