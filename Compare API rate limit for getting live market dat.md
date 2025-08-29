<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Compare API rate limit for getting live market data using API, between FLATTRADE, UPSTOX, and FYERS.

For getting **live market data via API**, the rate limits vary notably between FLATTRADE, UPSTOX, and FYERS, especially in terms of how many requests or subscriptions are permitted and in what time interval.

## FLATTRADE Rate Limit

- FLATTRADE does not publish strict documented rate limits for its live market data API. The general approach is more focused on streaming data and integrations for algo traders, but specific request-per-second or symbol subscription limits aren't detailed publicly. Users should be aware that aggressive polling or extremely high-frequency requests may risk IP bans or temporary access suspension, but ordinary trading volume is generally supported.[^1_1]


## UPSTOX Rate Limit

- **REST API**: For all standard API endpoints, including live data, the limit is **50 requests per second** and **500 requests per minute**, with a cap of **2000 requests per 30 minutes**.[^1_2]
- **Websocket Feed**: By subscribing to the market feeder WebSocket (ltpc mode), real-time updates can be received without being subject to standard REST rate limits. Subscriptions should be managed sensibly to avoid disconnections.[^1_3]

| Duration | REST Requests Allowed |
| :-- | :-- |
| Per second | 50 |
| Per minute | 500 |
| Per 30 min | 2000 |

## FYERS Rate Limit

- **WebSocket Data Feed**: FYERS allows streaming updates for live market data, but enforces a **subscription limit of 200 symbols at a time** in API v3.[^1_4][^1_5]
- **Rate Limits** (API v3): REST requests for symbol updates are capped at **10 requests per second**, **200 per minute**, and **100,000 per day**.[^1_6][^1_7]
- Users needing more than 200 concurrent symbols must unsubscribe from some before others can be added.[^1_4]

| Duration | Requests Allowed | Symbol Subscriptions |
| :-- | :-- | :-- |
| Per second | 10 | 200 |
| Per minute | 200 | 200 |
| Per day | 100,000 | 200 |

## Summary Table

| Broker | REST API Rate Limit | WebSocket Symbol Limit | Comments |
| :-- | :-- | :-- | :-- |
| FLATTRADE | Not clearly specified[^1_1] | Not specified[^1_1] | Streams live data |
| UPSTOX | 50/sec, 500/min, 2000/30min[^1_2] | No strict symbol cap[^1_3] | Use WebSocket to avoid REST limits |
| FYERS | 10/sec, 200/min, 100k/day[^1_6][^1_7] | 200 symbols/websocket[^1_4] | Unsubscribe for >200 symbols |

## Key Points

- **UPSTOX** provides the most generous REST limits, but also supports WebSocket streaming, which is suitable for fast tick data without hitting those limits.[^1_2][^1_3]
- **FYERS** is ideal for up to 200 concurrent symbols with stable tick-by-tick WebSocket updates, but REST polling is more restrictive.[^1_7][^1_6][^1_4]
- **FLATTRADE** isn't explicit on the numeric rate limits, so heavy users may want to start with basic implementations and monitor practical performance.[^1_1]
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_8][^1_9]</span>

<div style="text-align: center">⁂</div>

[^1_1]: https://pi.flattrade.in/docs

[^1_2]: https://upstox.com/developer/api-documentation/rate-limiting

[^1_3]: https://community.upstox.com/t/api-rate-limit-ltp/6093

[^1_4]: https://support.fyers.in/portal/en/kb/articles/is-there-a-limit-to-the-number-of-symbols-i-can-track-using-the-data-websocket-in-api-v3

[^1_5]: https://support.fyers.in/portal/en/kb/articles/how-can-developers-incorporate-real-time-stock-data-into-their-applications

[^1_6]: https://fyers.in/community/questions-5gz5j8db/post/apiv3---rate-limits-AFLejjYhJQDw9yI

[^1_7]: https://fyers.in/community/blogs-gdppin8d/post/unveiling-fyers-api-version-3-v3-0-0-a-comprehensive-update-to-enhance-NUuYJmm6gt9toPm

[^1_8]: https://pi.flattrade.in/terms

[^1_9]: https://flattrade.in/algotrading

[^1_10]: https://flattrade.in/products

[^1_11]: https://pi.flattrade.in

[^1_12]: https://community.upstox.com/t/rate-limits-on-api-usage/3384

[^1_13]: https://www.reddit.com/r/developersIndia/comments/1fw084c/need_near_realtime_api_for_indian_stock_market/

[^1_14]: https://github.com/flattrade/pythonAPI

[^1_15]: https://www.investorgain.com/compare-share-broker-india/upstox-vs-fyers/33/41/

[^1_16]: https://madefortrade.in/t/market-feed-api/4139?page=2

[^1_17]: https://www.faqprime.com/en/fyers-vs-upstox/

[^1_18]: https://developers.symphonyfintech.in/doc/marketdata/

[^1_19]: https://upstox.com/trading-api/

[^1_20]: https://www.marketdata.app

