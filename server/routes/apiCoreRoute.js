import { Router } from "express";
import {
  ActiveStocks,
  CTopMovers,
  getCompanyIcon,
  getLiveUsdInr,
  getPremiumData,
  getSpecificCompanyDetail,
  getSpecificStockData,
  getSpecificStockLatest,
  getUsdToInr,
  StockSearcher,
  TopMovers,
} from "../controller/apiCoreController.js";
const router = Router();

router.route("/:symbol/company").get(getSpecificCompanyDetail);
router.route("/icon").get(getCompanyIcon);
router.route("/:symbol/data").get(getSpecificStockData);
router.route("/:symbol/latest").get(getSpecificStockLatest);
router.route("/:year/inr").get(getUsdToInr);
router.route("/usdtoinr").get(getLiveUsdInr);
router.route("/:symbol/datapremium").get(getPremiumData)
router.route("/activestock").get(ActiveStocks)
router.route("/topmovers").get(TopMovers)
router.route("/ctopmovers").get(CTopMovers)
router.route("/:search/stocksearch").get(StockSearcher)




export default router;
