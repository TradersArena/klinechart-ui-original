/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { KLineData, Styles, DeepPartial } from 'klinecharts'

export type OrderType = 'buy'|'sell'|'buystop'|'buylimit'|'sellstop'|'selllimit'
export type OrderModalType = 'placeorder'|'modifyorder'|'closepartial'
export interface SymbolInfo {
  ticker: string
  name?: string
  shortName?: string
  exchange?: string
  market?: string
  pricePrecision?: number
  volumePrecision?: number
  priceCurrency?: string
  type?: string
  logo?: string
}

export interface OrderInfo {
  entryPoint: number
  stopLoss?: number
  takeProfit?: number
  pl?: number
  sessionId: number
  orderId: number
  entryTime: string
  exitTime?: string
  exitPoint?: number
  action: OrderType
}

export interface Period {
  multiplier: number
  timespan: string
  text: string
}

export type DatafeedSubscribeCallback = (data: KLineData) => void
export type OrderPlacedCallback = (data: OrderInfo|null) => void     //this should be called when a user has successfully placed an order from consumer project side

export interface Datafeed {
  searchSymbols (search?: string): Promise<SymbolInfo[]>
  getHistoryKLineData (symbol: SymbolInfo, period: Period, from: number, to: number): Promise<KLineData[]>
  subscribe (symbol: SymbolInfo, period: Period, callback: DatafeedSubscribeCallback): void
  unsubscribe (symbol: SymbolInfo, period: Period): void
  triggerAction (name:string) : void
}

export interface OtherResource {
  retrieveOrder (order_id: number): Promise<OrderInfo>
  retrieveOrders ( session_id?: number, type?: OrderType): Promise<OrderInfo[]>
  openOrder (action: OrderType, entry_price: number, stop_loss?: number, take_profit?: number): Promise<OrderInfo>
  closeOrder (order_id: number): Promise<boolean>
  modifyOrder (order_id: number, action?: OrderType, entry_price?: number, stop_loss?: number, take_profit?: number, pl?: number): Promise<OrderInfo>
  launchOrderModal (type: OrderModalType, currentprice: number, callback: OrderPlacedCallback): void
  pausePlay?(status:boolean):void
  controlSpeed?(speed:number):void
}

export interface ChartProOptions {
  container: string | HTMLElement
  styles?: DeepPartial<Styles>
  watermark?: string | Node
  theme?: string
  locale?: string
  drawingBarVisible?: boolean
  orderPanelVisible?: boolean
  symbol: SymbolInfo
  period: Period
  periods?: Period[]
  timezone?: string
  mainIndicators?: string[]
  subIndicators?: string[]
  datafeed: Datafeed
  dataTimestamp: number
  otherController: OtherResource
}

export interface ChartPro {
  setTheme(theme: string): void
  getTheme(): string
  setStyles(styles: DeepPartial<Styles>): void
  getStyles(): Styles
  setLocale(locale: string): void
  getLocale(): string
  setTimezone(timezone: string): void
  getTimezone(): string
  setSymbol(symbol: SymbolInfo): void
  getSymbol(): SymbolInfo
  setPeriod(period: Period): void
  getPeriod(): Period
}
