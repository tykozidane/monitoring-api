import express from 'express';
import basicAuth from '../../middleware/basic-auth.js';
import { validateTerminal } from '../../middleware/validate-terminal.js';
import { validateSignature } from '../../middleware/validate-signature.js';
import { validateProject } from '../../middleware/validate-project.js';
import getStationMiniController from "./get-station-mini.js";
import getAllStationMiniByProject from "./get-all-station-mini.js";
import listMapStationController from "./list-map-station.js";
import updateCoordinate from "./update-coordinate.js";
import jwtAuthMiddleware from '../../middleware/jwt-auth.js';

const router = express.Router();

router.get(
    "/mini",
    jwtAuthMiddleware,
    getStationMiniController
);
router.get(
    "/all-station-mini",
    jwtAuthMiddleware,
    getAllStationMiniByProject
);
router.post(
    "/list-map-station",
    jwtAuthMiddleware,
    listMapStationController
);
router.put(
    "/update-coordinate",
    jwtAuthMiddleware,
    updateCoordinate
);


export default router;
