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

import { OverlayTemplate, TextAttrs, LineAttrs, Coordinate, Bounding, utils, Point, Overlay, Precision } from 'klinecharts'

import { currenttick } from '../../../store/tickStore'
import { useOrder } from '../../../store/positionStore'
import { instanceapi } from '../../../ChartProComponent'
import { buyStyle, takeProfitStyle,stopLossStyle } from '../../../store/overlayStyleStore'
import {useOverlaySetting} from '../../../store/overlaySettingStore'


type lineobj = { 'lines': LineAttrs[], 'recttexts': rectText[] }
type rectText = { x: number, y: number, text: string, align: CanvasTextAlign, baseline: CanvasTextBaseline }

/**
 * 获取平行线
 * @param coordinates
 * @param bounding
 * @param overlay
 * @param precision
 * @returns {Array}
 */
function getParallelLines (coordinates: Coordinate[], bounding: Bounding, overlay: Overlay, precision: Precision): lineobj {
  const lines: LineAttrs[] = []
  const recttext: rectText[] = []
  let text
  let data: lineobj = { 'lines': lines, 'recttexts': recttext }
  const startX = 0
  const endX = bounding.width

  if (coordinates.length > 0) {
      data.lines.push({ coordinates: [{ x: startX, y: coordinates[0].y }, { x: endX, y: coordinates[0].y }] })
      text = useOrder().calcPL(overlay.points[0].value!, precision.price, true)
      useOrder().updatePipsAndPL(overlay, text)
      data.recttexts.push({ x: endX, y: coordinates[0].y, text: `buyLimit | ${text}` ?? '', align: 'right', baseline: 'middle' })
  }
  if (coordinates.length > 1) {
    data.lines.push({ coordinates: [{ x: startX, y: coordinates[1].y }, { x: endX, y: coordinates[1].y }] })

    text = useOrder().calcStopOrTarget(overlay.points[0].value!, overlay.points[1].value!, precision.price, true)
    data.recttexts.push({ x: endX, y: coordinates[1].y, text: `tp | ${text}` ?? '', align: 'right', baseline: 'middle' })
  }
  if (coordinates.length > 2) {
    data.lines.push({ coordinates: [{ x: startX, y: coordinates[2].y }, { x: endX, y: coordinates[2].y }] })

    text = useOrder().calcStopOrTarget(overlay.points[0].value!, overlay.points[2].value!, precision.price, true)
    data.recttexts.push({ x: endX, y: coordinates[2].y, text: `sl | ${text}` ?? '', align: 'right', baseline: 'middle' })
  }
  return data
}

const buyLimitProfitLossLine: OverlayTemplate = {
  name: 'buyLimitProfitLossLine',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ overlay, coordinates, bounding, precision }) => {
    if (overlay.points[0].value! >= currenttick()?.close! ) { //TP was hit
      useOrder().triggerPending(overlay, 'buy')
    }
    const parallel = getParallelLines(coordinates, bounding, overlay, precision)
    return [
      {
        type: 'line',
        attrs: parallel.lines[0],
        styles: {
          style: 'dashed',
          dashedValue: [4, 4],
          size: 1,
          color: buyStyle().backgroundColor
        },
      },
      {
        type: 'line',
        attrs: parallel.lines[1],
        styles: {
          style: 'dashed',
          dashedValue: [4, 4],
          size: 1,
          color: takeProfitStyle().backgroundColor
        }
      },
      {
        type: 'line',
        attrs: parallel.lines[2],
        styles: {
          style: 'dashed',
          dashedValue: [4, 4],
          size: 1,
          color: stopLossStyle().backgroundColor
        }
      },
      {
        type: 'rectText',
        attrs: parallel.recttexts[0],
        styles: buyStyle(),
      },
      {
        type: 'rectText',
        attrs: parallel.recttexts[1],
        styles: takeProfitStyle()
      },
      {
        type: 'rectText',
        attrs: parallel.recttexts[2],
        styles: stopLossStyle()
      }
    ]
  },
  createYAxisFigures: ({ overlay, coordinates, bounding, yAxis, precision }) => {
    const isFromZero = yAxis?.isFromZero() ?? false
    let textAlign: CanvasTextAlign
    let x: number
    if (isFromZero) {
      textAlign = 'left'
      x = 0
    } else {
      textAlign = 'right'
      x = bounding.width
    }
    let text, text2, text3

    if (!utils.isValid(text) && overlay.points[0].value !== undefined) {
      text = utils.formatPrecision(overlay.points[0].value, precision.price)
    }
    if (!utils.isValid(text2) && overlay.points[1].value !== undefined) {
      text2 = utils.formatPrecision(overlay.points[1].value, precision.price)
    }
    if (!utils.isValid(text3) && overlay.points[2].value !== undefined) {
      text3 = utils.formatPrecision(overlay.points[2].value, precision.price)
    }
    return [
      {
        type: 'rectText',
        attrs: { x, y: coordinates[0].y, text: text ?? '', align: textAlign, baseline: 'middle' },
        styles: buyStyle(),
      },
      {
        type: 'rectText',
        attrs: { x, y: coordinates[1].y, text: text2 ?? '', align: textAlign, baseline: 'middle' },
        styles: takeProfitStyle(),
      },
      {
        type: 'rectText',
        attrs: { x, y: coordinates[2].y, text: text3 ?? '', align: textAlign, baseline: 'middle' },
        styles: stopLossStyle(),
      }
    ]
  },
  onPressedMoving: (event): boolean => {
    let coordinate: Partial<Coordinate>[] = [
      {x: event.x, y: event.y}
    ]
    const points = instanceapi()?.convertFromPixel(coordinate, {
      paneId: event.overlay.paneId
    })
    // for tp
    if ((points as Partial<Point>[])[0].value! > currenttick()?.close!) {
      // event.overlay.points[1].value = (points as Partial<Point>[])[0].value
      const res = useOrder().updateTakeProfitAndReturnValue(event, points)
      if(res) event.overlay.points[1].value = res
    }
    // for buylimit
    if (
      (points as Partial<Point>[])[0].value! < currenttick()?.close! && 
      (points as Partial<Point>[])[0].value! > event.overlay.points[2].value! && 
      event.figureIndex == 0
    ) {
      // event.overlay.points[0].value = (points as Partial<Point>[])[0].value
      const res = useOrder().updateEntryPointAndReturnValue(event, points)
      if (res) event.overlay.points[0].value = res
    }
    // for stoploss
    if (
      (points as Partial<Point>[])[0].value! < currenttick()?.close! && 
      (points as Partial<Point>[])[0].value! < event.overlay.points[0].value! && 
      event.figureIndex == 2
    ) {
      // event.overlay.points[2].value = (points as Partial<Point>[])[0].value
      const res = useOrder().updateStopLossAndReturnValue(event, points)
      if(res) event.overlay.points[2].value = res
    }
    return true
  },
  onPressedMoveEnd: (event): boolean => {
    useOrder().updatePositionOrder(event)
    //the overlay represented an order that does not exist on our pool, it should be handled here
    return false
  },
  onRightClick: (event): boolean => {
    useOverlaySetting().profitLossPopup(event, 'buy')
    return true
  }
}

export default buyLimitProfitLossLine