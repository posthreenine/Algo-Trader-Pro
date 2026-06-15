import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import analysesRouter from "./analyses";
import journalRouter from "./journal";
import statisticsRouter from "./statistics";
import watchlistRouter from "./watchlist";
import adminRouter from "./admin";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(analysesRouter);
router.use(journalRouter);
router.use(statisticsRouter);
router.use(watchlistRouter);
router.use(adminRouter);
router.use(uploadRouter);

export default router;
