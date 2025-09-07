import { response } from "express";
import { ALPACA, ALPACA_SECRET, POLYGON1, POLYGON2 } from "../config/env.js";
import { ApiFailError, BadRequestError } from "../errors/customErrors.js";
import axios from "axios";
import Price from "../model/Price.js";
import Usd from "../model/Usd.js";
import Search from "../model/Search.js";
const BASE_URL = "https://www.alphavantage.co/query";

//company info - status - done
export const getSpecificCompanyDetail = async (req, res, next) => {
  const { symbol } = req.params;
  if (!symbol) return next(new BadRequestError("missing values"));
  try {
    const response = await axios.get(
      `https://api.polygon.io/v3/reference/tickers/${symbol}`,
      {
        params: { apiKey: POLYGON1 },
      }
    );
    if (response.status !== 200)
      return next(
        new BadRequestError(
          `Couldnt fetch data/rate limit exceeded: Status(${response.status})`
        )
      );
    res.status(200).json(response.data);
  } catch (error) {
    // console.error("Error fetching stock data:", error);
    res.status(400).json({
      error:
        error.response?.data?.message ||
        `Couldnt fetch data/rate limit exceeded: Status(${error.response.status})`,
    });
  }
};
//company icon - status - done
export const getCompanyIcon = async (req, res, next) => {
  const { link } = req.query;
  if (!link) return next(new BadRequestError("missing link"));
  try {
    const response = await axios.get(link, {
      headers: {
        Authorization: `Bearer ${POLYGON2}`,
      },
      responseType: "arraybuffer",
    });
    if (response.status !== 200)
      return next(new ApiFailError(`HTTP error! Status: ${response.status}`));
    res.setHeader("Content-Type", "image/png"); // Adjust if needed
    res.send(Buffer.from(response.data));
  } catch (error) {
    // console.error("Error fetching image:", error.response.status);
    res.status(400).json({
      error: `Error Fetching Image: status(${error.response.status}) `,
    });
  }
};

export const getSpecificStockData = async (req, res, next) => {
  const { symbol } = req.params;
  const { start, end } = req.query;
  if (!symbol || !start || !end)
    return next(new BadRequestError("missing values"));
  const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const params = new URLSearchParams({
    symbols: symbol,
    start: start || startDate,
    end: end || endDate,
    limit: 1000,
    feed: "sip",
    sort: "asc",
  });

  const response = await axios.get(
    `https://data.alpaca.markets/v2/stocks/auctions?${params.toString()}`,
    {
      headers: {
        accept: "application/json",
        "APCA-API-KEY-ID": ALPACA,
        "APCA-API-SECRET-KEY": ALPACA_SECRET,
      },
    }
  );
  res.status(200).json(response.data);
};

export const getSpecificStockLatest = async (req, res, next) => {
  const { symbol } = req.params;
  const response = await axios.get(
    `https://data.alpaca.markets/v2/stocks/${symbol.toUpperCase()}/snapshot`,
    {
      headers: {
        accept: "application/json",
        "APCA-API-KEY-ID": ALPACA,
        "APCA-API-SECRET-KEY": ALPACA_SECRET,
      },
    }
  );
  if (response.status !== 200)
    return next(new ApiFailError("Server couldnt fetch the values"));
  res.status(200).json(response.data);
};

export const getUsdToInr = async (req, res, next) => {
  const { year } = req.params;
  if (!year) return next(new BadRequestError("missing year"));
  const data = await Price.find({ Year: year }, { _id: 0, Price: 1, Date: 1 });
  res.json(data);
};

export const getLiveUsdInr = async (req, res, next) => {
  // const response = await axios.get(
  //   "https://v6.exchangerate-api.com/v6/5aa164227a07b5349b3ded99/latest/USD"
  // );
  //CREATION
  // const newData = new Usd({price:response.data.conversion_rates.INR})
  // await newData.save()
  // res.json({ success: true, rate: response.data.conversion_rates.INR });
  try {
    const data = await Usd.find({});
    const lastUpdate = data[0].updatedAt;
    if (new Date() - new Date(lastUpdate) > 86400000) {
      const response = await axios.get(
        "https://v6.exchangerate-api.com/v6/5aa164227a07b5349b3ded99/latest/USD"
      );
      await Usd.findByIdAndUpdate("682a07844931d5efd4d60001", {
        price: response.data.conversion_rates.INR,
        updatedAt: new Date(),
      });
    }
    res.json({ price: data[0].price });
  } catch (error) {
    // console.error(error);
  }
  // res.json({priceunit:response.data.conversion_rates.INR});
};

export const getPremiumData = async (req, res, next) => {
  const { symbol } = req.params;
  const { start, end } = req.query;
  if (!symbol || !start || !end)
    return next(new BadRequestError("missing values"));
  const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const params = new URLSearchParams({
    symbols: symbol,
    timeframe: "1D",
    start: start || startDate,
    end: end || endDate,
    limit: 1000,
    feed: "sip",
    sort: "asc",
  });

  const response = await axios.get(
    `https://data.alpaca.markets/v2/stocks/bars?${params.toString()}`,
    {
      headers: {
        accept: "application/json",
        "APCA-API-KEY-ID": ALPACA,
        "APCA-API-SECRET-KEY": ALPACA_SECRET,
      },
    }
  );
  res.status(200).json(response.data);
};

export const ActiveStocks = async (req, res, next) => {
  const response = await axios.get(
    `https://data.alpaca.markets/v1beta1/screener/stocks/most-actives?by=volume&top=20`,
    {
      headers: {
        accept: "application/json",
        "APCA-API-KEY-ID": ALPACA,
        "APCA-API-SECRET-KEY": ALPACA_SECRET,
      },
    }
  );
  if (response.status !== 200) {
    return res.status(400).json({ msg: "error occoured" });
  }
  res.status(200).json(response.data);
};

export const TopMovers = async (req, res, next) => {
  const response = await axios.get(
    `https://data.alpaca.markets/v1beta1/screener/stocks/movers?top=20`,
    {
      headers: {
        accept: "application/json",
        "APCA-API-KEY-ID": ALPACA,
        "APCA-API-SECRET-KEY": ALPACA_SECRET,
      },
    }
  );
  if (response.status !== 200) {
    return res.status(400).json({ msg: "error occoured" });
  }
  res.status(200).json(response.data);
};

export const CTopMovers = async (req, res, next) => {
  const response = await axios.get(
    `https://data.alpaca.markets/v1beta1/screener/stocks/movers?top=50`,
    {
      headers: {
        accept: "application/json",
        "APCA-API-KEY-ID": ALPACA,
        "APCA-API-SECRET-KEY": ALPACA_SECRET,
      },
    }
  );
  if (response.status !== 200) {
    return res.status(400).json({ msg: "error occoured" });
  }
  res.status(200).json(response.data);
};

export const StockSearcher = async (req, res, next) => {
  const { search } = req.params;
  try {
    const results = await Search.find(
      {
        $or: [
          { Name: { $regex: search, $options: "i" } },
          { Symbol: { $regex: search, $options: "i" } },
        ],
      },
      { Name: 1, Symbol: 1, _id: 0 }
    ).limit(10);

    res.status(200).json(results);
  } catch (error) {}
};
