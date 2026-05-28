import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import qrRouter from "./qr";
import reportsRouter from "./reports";
import contactRouter from "./contact";
import statsRouter from "./stats";
import threatmapRouter from "./threatmap";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(qrRouter);
router.use(reportsRouter);
router.use(contactRouter);
router.use(statsRouter);
router.use(threatmapRouter);

export default router;
