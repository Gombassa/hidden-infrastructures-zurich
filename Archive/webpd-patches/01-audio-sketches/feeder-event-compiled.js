
        
                const i32 = (v) => v
                const f32 = i32
                const f64 = i32
                
function toInt(v) {
                    return v
                }
function toFloat(v) {
                    return v
                }
function createFloatArray(length) {
                    return new Float64Array(length)
                }
function setFloatDataView(dataView, position, value) {
                    dataView.setFloat64(position, value)
                }
function getFloatDataView(dataView, position) {
                    return dataView.getFloat64(position)
                }
let IT_FRAME = 0
let FRAME = 0
let BLOCK_SIZE = 0
let SAMPLE_RATE = 0
let NULL_SIGNAL = 0
let INPUT = createFloatArray(0)
let OUTPUT = createFloatArray(0)
const G_sked_ID_NULL = -1
const G_sked__ID_COUNTER_INIT = 1
const G_sked__MODE_WAIT = 0
const G_sked__MODE_SUBSCRIBE = 1


function G_sked_create(isLoggingEvents) {
                return {
                    eventLog: new Set(),
                    events: new Map(),
                    requests: new Map(),
                    idCounter: G_sked__ID_COUNTER_INIT,
                    isLoggingEvents,
                }
            }
function G_sked_wait(skeduler, event, callback) {
                if (skeduler.isLoggingEvents === false) {
                    throw new Error("Please activate skeduler's isLoggingEvents")
                }

                if (skeduler.eventLog.has(event)) {
                    callback(event)
                    return G_sked_ID_NULL
                } else {
                    return G_sked__createRequest(skeduler, event, callback, G_sked__MODE_WAIT)
                }
            }
function G_sked_waitFuture(skeduler, event, callback) {
                return G_sked__createRequest(skeduler, event, callback, G_sked__MODE_WAIT)
            }
function G_sked_subscribe(skeduler, event, callback) {
                return G_sked__createRequest(skeduler, event, callback, G_sked__MODE_SUBSCRIBE)
            }
function G_sked_emit(skeduler, event) {
                if (skeduler.isLoggingEvents === true) {
                    skeduler.eventLog.add(event)
                }
                if (skeduler.events.has(event)) {
                    const skedIds = skeduler.events.get(event)
                    const skedIdsStaying = []
                    for (let i = 0; i < skedIds.length; i++) {
                        if (skeduler.requests.has(skedIds[i])) {
                            const request = skeduler.requests.get(skedIds[i])
                            request.callback(event)
                            if (request.mode === G_sked__MODE_WAIT) {
                                skeduler.requests.delete(request.id)
                            } else {
                                skedIdsStaying.push(request.id)
                            }
                        }
                    }
                    skeduler.events.set(event, skedIdsStaying)
                }
            }
function G_sked_cancel(skeduler, id) {
                skeduler.requests.delete(id)
            }
function G_sked__createRequest(skeduler, event, callback, mode) {
                const id = G_sked__nextId(skeduler)
                const request = {
                    id, 
                    mode, 
                    callback,
                }
                skeduler.requests.set(id, request)
                if (!skeduler.events.has(event)) {
                    skeduler.events.set(event, [id])    
                } else {
                    skeduler.events.get(event).push(id)
                }
                return id
            }
function G_sked__nextId(skeduler) {
                return skeduler.idCounter++
            }
const G_commons__ARRAYS = new Map()
const G_commons__ARRAYS_SKEDULER = G_sked_create(false)
function G_commons_getArray(arrayName) {
            if (!G_commons__ARRAYS.has(arrayName)) {
                throw new Error('Unknown array ' + arrayName)
            }
            return G_commons__ARRAYS.get(arrayName)
        }
function G_commons_hasArray(arrayName) {
            return G_commons__ARRAYS.has(arrayName)
        }
function G_commons_setArray(arrayName, array) {
            G_commons__ARRAYS.set(arrayName, array)
            G_sked_emit(G_commons__ARRAYS_SKEDULER, arrayName)
        }
function G_commons_subscribeArrayChanges(arrayName, callback) {
            const id = G_sked_subscribe(G_commons__ARRAYS_SKEDULER, arrayName, callback)
            if (G_commons__ARRAYS.has(arrayName)) {
                callback(arrayName)
            }
            return id
        }
function G_commons_cancelArrayChangesSubscription(id) {
            G_sked_cancel(G_commons__ARRAYS_SKEDULER, id)
        }

const G_commons__FRAME_SKEDULER = G_sked_create(false)
function G_commons__emitFrame(frame) {
            G_sked_emit(G_commons__FRAME_SKEDULER, frame.toString())
        }
function G_commons_waitFrame(frame, callback) {
            return G_sked_waitFuture(G_commons__FRAME_SKEDULER, frame.toString(), callback)
        }
function G_commons_cancelWaitFrame(id) {
            G_sked_cancel(G_commons__FRAME_SKEDULER, id)
        }
const G_msg_FLOAT_TOKEN = "number"
const G_msg_STRING_TOKEN = "string"
function G_msg_create(template) {
                    const m = []
                    let i = 0
                    while (i < template.length) {
                        if (template[i] === G_msg_STRING_TOKEN) {
                            m.push('')
                            i += 2
                        } else if (template[i] === G_msg_FLOAT_TOKEN) {
                            m.push(0)
                            i += 1
                        }
                    }
                    return m
                }
function G_msg_getLength(message) {
                    return message.length
                }
function G_msg_getTokenType(message, tokenIndex) {
                    return typeof message[tokenIndex]
                }
function G_msg_isStringToken(message, tokenIndex) {
                    return G_msg_getTokenType(message, tokenIndex) === 'string'
                }
function G_msg_isFloatToken(message, tokenIndex) {
                    return G_msg_getTokenType(message, tokenIndex) === 'number'
                }
function G_msg_isMatching(message, tokenTypes) {
                    return (message.length === tokenTypes.length) 
                        && message.every((v, i) => G_msg_getTokenType(message, i) === tokenTypes[i])
                }
function G_msg_writeFloatToken(message, tokenIndex, value) {
                    message[tokenIndex] = value
                }
function G_msg_writeStringToken(message, tokenIndex, value) {
                    message[tokenIndex] = value
                }
function G_msg_readFloatToken(message, tokenIndex) {
                    return message[tokenIndex]
                }
function G_msg_readStringToken(message, tokenIndex) {
                    return message[tokenIndex]
                }
function G_msg_floats(values) {
                    return values
                }
function G_msg_strings(values) {
                    return values
                }
function G_msg_display(message) {
                    return '[' + message
                        .map(t => typeof t === 'string' ? '"' + t + '"' : t.toString())
                        .join(', ') + ']'
                }
function G_msg_VOID_MESSAGE_RECEIVER(m) {}
let G_msg_EMPTY_MESSAGE = G_msg_create([])
function G_bangUtils_isBang(message) {
            return (
                G_msg_isStringToken(message, 0) 
                && G_msg_readStringToken(message, 0) === 'bang'
            )
        }
function G_bangUtils_bang() {
            const message = G_msg_create([G_msg_STRING_TOKEN, 4])
            G_msg_writeStringToken(message, 0, 'bang')
            return message
        }
function G_bangUtils_emptyToBang(message) {
            if (G_msg_getLength(message) === 0) {
                return G_bangUtils_bang()
            } else {
                return message
            }
        }
const G_msgBuses__BUSES = new Map()
function G_msgBuses_publish(busName, message) {
            let i = 0
            const callbacks = G_msgBuses__BUSES.has(busName) ? G_msgBuses__BUSES.get(busName): []
            for (i = 0; i < callbacks.length; i++) {
                callbacks[i](message)
            }
        }
function G_msgBuses_subscribe(busName, callback) {
            if (!G_msgBuses__BUSES.has(busName)) {
                G_msgBuses__BUSES.set(busName, [])
            }
            G_msgBuses__BUSES.get(busName).push(callback)
        }
function G_msgBuses_unsubscribe(busName, callback) {
            if (!G_msgBuses__BUSES.has(busName)) {
                return
            }
            const callbacks = G_msgBuses__BUSES.get(busName)
            const found = callbacks.indexOf(callback)
            if (found !== -1) {
                callbacks.splice(found, 1)
            }
        }
function G_tokenConversion_toFloat(m, i) {
        if (G_msg_isFloatToken(m, i)) {
            return G_msg_readFloatToken(m, i)
        } else {
            return 0
        }
    }
function G_tokenConversion_toString_(m, i) {
        if (G_msg_isStringToken(m, i)) {
            const str = G_msg_readStringToken(m, i)
            if (str === 'bang') {
                return 'symbol'
            } else {
                return str
            }
        } else {
            return 'float'
        }
    }

function G_points_interpolateLin(x, p0, p1) {
        return p0.y + (x - p0.x) * (p1.y - p0.y) / (p1.x - p0.x)
    }

function G_linesUtils_computeSlope(p0, p1) {
            return p1.x !== p0.x ? (p1.y - p0.y) / (p1.x - p0.x) : 0
        }
function G_linesUtils_removePointsBeforeFrame(points, frame) {
            const newPoints = []
            let i = 0
            while (i < points.length) {
                if (frame <= points[i].x) {
                    newPoints.push(points[i])
                }
                i++
            }
            return newPoints
        }
function G_linesUtils_insertNewLinePoints(points, p0, p1) {
            const newPoints = []
            let i = 0
            
            // Keep the points that are before the new points added
            while (i < points.length && points[i].x <= p0.x) {
                newPoints.push(points[i])
                i++
            }
            
            // Find the start value of the start point :
            
            // 1. If there is a previous point and that previous point
            // is on the same frame, we don't modify the start point value.
            // (represents a vertical line).
            if (0 < i - 1 && points[i - 1].x === p0.x) {

            // 2. If new points are inserted in between already existing points 
            // we need to interpolate the existing line to find the startValue.
            } else if (0 < i && i < points.length) {
                newPoints.push({
                    x: p0.x,
                    y: G_points_interpolateLin(p0.x, points[i - 1], points[i])
                })

            // 3. If new line is inserted after all existing points, 
            // we just take the value of the last point
            } else if (i >= points.length && points.length) {
                newPoints.push({
                    x: p0.x,
                    y: points[points.length - 1].y,
                })

            // 4. If new line placed in first position, we take the defaultStartValue.
            } else if (i === 0) {
                newPoints.push({
                    x: p0.x,
                    y: p0.y,
                })
            }
            
            newPoints.push({
                x: p1.x,
                y: p1.y,
            })
            return newPoints
        }
function G_linesUtils_computeFrameAjustedPoints(points) {
            if (points.length < 2) {
                throw new Error('invalid length for points')
            }

            const newPoints = []
            let i = 0
            let p = points[0]
            let frameLower = 0
            let frameUpper = 0
            
            while(i < points.length) {
                p = points[i]
                frameLower = Math.floor(p.x)
                frameUpper = frameLower + 1

                // I. Placing interpolated point at the lower bound of the current frame
                // ------------------------------------------------------------------------
                // 1. Point is already on an exact frame,
                if (p.x === frameLower) {
                    newPoints.push({ x: p.x, y: p.y })

                    // 1.a. if several of the next points are also on the same X,
                    // we find the last one to draw a vertical line.
                    while (
                        (i + 1) < points.length
                        && points[i + 1].x === frameLower
                    ) {
                        i++
                    }
                    if (points[i].y !== newPoints[newPoints.length - 1].y) {
                        newPoints.push({ x: points[i].x, y: points[i].y })
                    }

                    // 1.b. if last point, we quit
                    if (i + 1 >= points.length) {
                        break
                    }

                    // 1.c. if next point is in a different frame we can move on to next iteration
                    if (frameUpper <= points[i + 1].x) {
                        i++
                        continue
                    }
                
                // 2. Point isn't on an exact frame
                // 2.a. There's a previous point, the we use it to interpolate the value.
                } else if (newPoints.length) {
                    newPoints.push({
                        x: frameLower,
                        y: G_points_interpolateLin(frameLower, points[i - 1], p),
                    })
                
                // 2.b. It's the very first point, then we don't change its value.
                } else {
                    newPoints.push({ x: frameLower, y: p.y })
                }

                // II. Placing interpolated point at the upper bound of the current frame
                // ---------------------------------------------------------------------------
                // First, we find the closest point from the frame upper bound (could be the same p).
                // Or could be a point that is exactly placed on frameUpper.
                while (
                    (i + 1) < points.length 
                    && (
                        Math.ceil(points[i + 1].x) === frameUpper
                        || Math.floor(points[i + 1].x) === frameUpper
                    )
                ) {
                    i++
                }
                p = points[i]

                // 1. If the next point is directly in the next frame, 
                // we do nothing, as this corresponds with next iteration frameLower.
                if (Math.floor(p.x) === frameUpper) {
                    continue
                
                // 2. If there's still a point after p, we use it to interpolate the value
                } else if (i < points.length - 1) {
                    newPoints.push({
                        x: frameUpper,
                        y: G_points_interpolateLin(frameUpper, p, points[i + 1]),
                    })

                // 3. If it's the last point, we dont change the value
                } else {
                    newPoints.push({ x: frameUpper, y: p.y })
                }

                i++
            }

            return newPoints
        }
function G_linesUtils_computeLineSegments(points) {
            const lineSegments = []
            let i = 0
            let p0
            let p1

            while(i < points.length - 1) {
                p0 = points[i]
                p1 = points[i + 1]
                lineSegments.push({
                    p0, p1, 
                    dy: G_linesUtils_computeSlope(p0, p1),
                    dx: 1,
                })
                i++
            }
            return lineSegments
        }
function computeUnitInSamples(sampleRate, amount, unit) {
        if (unit.slice(0, 3) === 'per') {
            if (amount !== 0) {
                amount = 1 / amount
            }
            unit = unit.slice(3)
        }

        if (unit === 'msec' || unit === 'milliseconds' || unit === 'millisecond') {
            return amount / 1000 * sampleRate
        } else if (unit === 'sec' || unit === 'seconds' || unit === 'second') {
            return amount * sampleRate
        } else if (unit === 'min' || unit === 'minutes' || unit === 'minute') {
            return amount * 60 * sampleRate
        } else if (unit === 'samp' || unit === 'samples' || unit === 'sample') {
            return amount
        } else {
            throw new Error("invalid time unit : " + unit)
        }
    }
function G_actionUtils_isAction(message, action) {
            return G_msg_isMatching(message, [G_msg_STRING_TOKEN])
                && G_msg_readStringToken(message, 0) === action
        }
function G_msgUtils_slice(message, start, end) {
            if (G_msg_getLength(message) <= start) {
                throw new Error('message empty')
            }
            const template = G_msgUtils__copyTemplate(message, start, end)
            const newMessage = G_msg_create(template)
            G_msgUtils_copy(message, newMessage, start, end, 0)
            return newMessage
        }
function G_msgUtils_concat(message1, message2) {
            const newMessage = G_msg_create(G_msgUtils__copyTemplate(message1, 0, G_msg_getLength(message1)).concat(G_msgUtils__copyTemplate(message2, 0, G_msg_getLength(message2))))
            G_msgUtils_copy(message1, newMessage, 0, G_msg_getLength(message1), 0)
            G_msgUtils_copy(message2, newMessage, 0, G_msg_getLength(message2), G_msg_getLength(message1))
            return newMessage
        }
function G_msgUtils_shift(message) {
            switch (G_msg_getLength(message)) {
                case 0:
                    throw new Error('message empty')
                case 1:
                    return G_msg_create([])
                default:
                    return G_msgUtils_slice(message, 1, G_msg_getLength(message))
            }
        }
function G_msgUtils_copy(src, dest, srcStart, srcEnd, destStart) {
            let i = srcStart
            let j = destStart
            for (i, j; i < srcEnd; i++, j++) {
                if (G_msg_getTokenType(src, i) === G_msg_STRING_TOKEN) {
                    G_msg_writeStringToken(dest, j, G_msg_readStringToken(src, i))
                } else {
                    G_msg_writeFloatToken(dest, j, G_msg_readFloatToken(src, i))
                }
            }
        }
function G_msgUtils__copyTemplate(src, start, end) {
            const template = []
            for (let i = start; i < end; i++) {
                const tokenType = G_msg_getTokenType(src, i)
                template.push(tokenType)
                if (tokenType === G_msg_STRING_TOKEN) {
                    template.push(G_msg_readStringToken(src, i).length)
                }
            }
            return template
        }
const G_sigBuses__BUSES = new Map()
G_sigBuses__BUSES.set('', 0)
function G_sigBuses_addAssign(busName, value) {
            const newValue = G_sigBuses__BUSES.get(busName) + value
            G_sigBuses__BUSES.set(
                busName,
                newValue,
            )
            return newValue
        }
function G_sigBuses_set(busName, value) {
            G_sigBuses__BUSES.set(
                busName,
                value,
            )
        }
function G_sigBuses_reset(busName) {
            G_sigBuses__BUSES.set(busName, 0)
        }
function G_sigBuses_read(busName) {
            return G_sigBuses__BUSES.get(busName)
        }
        
function NT_bang_setReceiveBusName(state, busName) {
            if (state.receiveBusName !== "empty") {
                G_msgBuses_unsubscribe(state.receiveBusName, state.messageReceiver)
            }
            state.receiveBusName = busName
            if (state.receiveBusName !== "empty") {
                G_msgBuses_subscribe(state.receiveBusName, state.messageReceiver)
            }
        }
function NT_bang_setSendReceiveFromMessage(state, m) {
            if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'receive'
            ) {
                NT_bang_setReceiveBusName(state, G_msg_readStringToken(m, 1))
                return true

            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'send'
            ) {
                state.sendBusName = G_msg_readStringToken(m, 1)
                return true
            }
            return false
        }
function NT_bang_defaultMessageHandler(m) {}
function NT_bang_receiveMessage(state, m) {
                if (NT_bang_setSendReceiveFromMessage(state, m) === true) {
                    return
                }
                
                const outMessage = G_bangUtils_bang()
                state.messageSender(outMessage)
                if (state.sendBusName !== "empty") {
                    G_msgBuses_publish(state.sendBusName, outMessage)
                }
                return
            }





function NT_vline_t_setNewLine(state, targetValue) {
                state.points = G_linesUtils_removePointsBeforeFrame(state.points, toFloat(FRAME))
                const startFrame = toFloat(FRAME) + state.nextDelaySamp
                const endFrame = startFrame + state.nextDurationSamp
                if (endFrame === toFloat(FRAME)) {
                    state.currentValue = targetValue
                    state.lineSegments = []
                } else {
                    state.points = G_linesUtils_insertNewLinePoints(
                        state.points, 
                        {x: startFrame, y: state.currentValue},
                        {x: endFrame, y: targetValue}
                    )
                    state.lineSegments = G_linesUtils_computeLineSegments(
                        G_linesUtils_computeFrameAjustedPoints(state.points))
                }
                state.nextDurationSamp = 0
                state.nextDelaySamp = 0
            }
function NT_vline_t_setNextDuration(state, durationMsec) {
                state.nextDurationSamp = computeUnitInSamples(SAMPLE_RATE, durationMsec, 'msec')
            }
function NT_vline_t_setNextDelay(state, delayMsec) {
                state.nextDelaySamp = computeUnitInSamples(SAMPLE_RATE, delayMsec, 'msec')
            }



function NT_floatatom_setReceiveBusName(state, busName) {
            if (state.receiveBusName !== "empty") {
                G_msgBuses_unsubscribe(state.receiveBusName, state.messageReceiver)
            }
            state.receiveBusName = busName
            if (state.receiveBusName !== "empty") {
                G_msgBuses_subscribe(state.receiveBusName, state.messageReceiver)
            }
        }
function NT_floatatom_setSendReceiveFromMessage(state, m) {
            if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'receive'
            ) {
                NT_floatatom_setReceiveBusName(state, G_msg_readStringToken(m, 1))
                return true

            } else if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'send'
            ) {
                state.sendBusName = G_msg_readStringToken(m, 1)
                return true
            }
            return false
        }
function NT_floatatom_defaultMessageHandler(m) {}
function NT_floatatom_receiveMessage(state, m) {
                    if (G_bangUtils_isBang(m)) {
                        state.messageSender(state.value)
                        if (state.sendBusName !== "empty") {
                            G_msgBuses_publish(state.sendBusName, state.value)
                        }
                        return
                    
                    } else if (
                        G_msg_getTokenType(m, 0) === G_msg_STRING_TOKEN
                        && G_msg_readStringToken(m, 0) === 'set'
                    ) {
                        const setMessage = G_msgUtils_slice(m, 1, G_msg_getLength(m))
                        if (G_msg_isMatching(setMessage, [G_msg_FLOAT_TOKEN])) { 
                                state.value = setMessage    
                                return
                        }
        
                    } else if (NT_floatatom_setSendReceiveFromMessage(state, m) === true) {
                        return
                        
                    } else if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                    
                        state.value = m
                        state.messageSender(state.value)
                        if (state.sendBusName !== "empty") {
                            G_msgBuses_publish(state.sendBusName, state.value)
                        }
                        return
        
                    }
                }









function NT_mul_setLeft(state, value) {
                    state.leftOp = value
                }
function NT_mul_setRight(state, value) {
                    state.rightOp = value
                }



function NT_osc_t_setStep(state, freq) {
                    state.step = (2 * Math.PI / SAMPLE_RATE) * freq
                }
function NT_osc_t_setPhase(state, phase) {
                    state.phase = phase % 1.0 * 2 * Math.PI
                }



function NT_receive_t_setBusName(state, busName) {
            if (busName.length) {
                state.busName = busName
                G_sigBuses_reset(state.busName)
            }
        }





function NT_filters_bp_t_updateCoefs(state) {
                let omega = state.frequency * (2.0 * Math.PI) / SAMPLE_RATE
                let oneminusr = state.Q < 0.001 ? 1.0 : Math.min(omega / state.Q, 1)
                let r = 1.0 - oneminusr
                let sigbp_qcos = (omega >= -(0.5 * Math.PI) && omega <= 0.5 * Math.PI) ? 
                    (((Math.pow(omega, 6) * (-1.0 / 720.0) + Math.pow(omega, 4) * (1.0 / 24)) - Math.pow(omega, 2) * 0.5) + 1)
                    : 0
        
                state.coef1 = 2.0 * sigbp_qcos * r
                state.coef2 = - r * r
                state.gain = 2 * oneminusr * (oneminusr + r * omega)
            }
function NT_filters_bp_t_setFrequency(state, frequency) {
                state.frequency = (frequency < 0.001) ? 10: frequency
                NT_filters_bp_t_updateCoefs(state)
            }
function NT_filters_bp_t_setQ(state, Q) {
                state.Q = Math.max(Q, 0)
                NT_filters_bp_t_updateCoefs(state)
            }
function NT_filters_bp_t_clear(state) {
                state.ym1 = 0
                state.ym2 = 0
            }



function NT_send_t_setBusName(state, busName) {
            if (busName.length) {
                state.busName = busName
                G_sigBuses_reset(state.busName)
            }
        }

        const N_n_0_0_state = {
                                value: G_msg_create([]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_bang_defaultMessageHandler,
messageSender: NT_bang_defaultMessageHandler,
                            }
const N_n_0_7_state = {
                                msgSpecs: [],
                            }
const N_n_0_6_state = {
                                points: [],
lineSegments: [],
currentValue: 0,
nextDurationSamp: 0,
nextDelaySamp: 0,
                            }
const N_n_0_2_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_3_state = {
                                busName: "event-pitch",
                            }
const N_m_n_0_5_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_13_state = {
                                leftOp: 0,
rightOp: 0,
                            }
const N_m_n_0_15_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_5_state = {
                                phase: 0,
step: 0,
                            }
const N_n_0_17_state = {
                                busName: "",
                            }
const N_m_n_0_16_1_sig_state = {
                                currentValue: 1000,
                            }
const N_n_0_11_state = {
                                frequency: 20,
Q: 0,
coef1: 0,
coef2: 0,
gain: 0,
y: 0,
ym1: 0,
ym2: 0,
                            }
const N_m_n_0_9_1_sig_state = {
                                currentValue: 0.5,
                            }
const N_n_0_14_state = {
                                busName: "",
                            }
        
function N_n_0_0_rcvs_0(m) {
                            
            NT_bang_receiveMessage(N_n_0_0_state, m)
            return
        
                            throw new Error('Node "n_0_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_1_rcvs_0(m) {
                            
            N_n_0_7_rcvs_0(G_bangUtils_bang())
G_msg_VOID_MESSAGE_RECEIVER(G_bangUtils_bang())
            return
        
                            throw new Error('Node "n_0_1", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_7_rcvs_0(m) {
                            
                if (
                    G_msg_isStringToken(m, 0) 
                    && G_msg_readStringToken(m, 0) === 'set'
                ) {
                    const outTemplate = []
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            outTemplate.push(G_msg_FLOAT_TOKEN)
                        } else {
                            outTemplate.push(G_msg_STRING_TOKEN)
                            outTemplate.push(G_msg_readStringToken(m, i).length)
                        }
                    }

                    const outMessage = G_msg_create(outTemplate)
                    for (let i = 1; i < G_msg_getLength(m); i++) {
                        if (G_msg_isFloatToken(m, i)) {
                            G_msg_writeFloatToken(
                                outMessage, i - 1, G_msg_readFloatToken(m, i)
                            )
                        } else {
                            G_msg_writeStringToken(
                                outMessage, i - 1, G_msg_readStringToken(m, i)
                            )
                        }
                    }

                    N_n_0_7_state.msgSpecs.splice(0, N_n_0_7_state.msgSpecs.length - 1)
                    N_n_0_7_state.msgSpecs[0] = {
                        transferFunction: function (m) {
                            return N_n_0_7_state.msgSpecs[0].outMessage
                        },
                        outTemplate: outTemplate,
                        outMessage: outMessage,
                        send: "",
                        hasSend: false,
                    }
                    return
    
                } else {
                    for (let i = 0; i < N_n_0_7_state.msgSpecs.length; i++) {
                        if (N_n_0_7_state.msgSpecs[i].hasSend) {
                            G_msgBuses_publish(N_n_0_7_state.msgSpecs[i].send, N_n_0_7_state.msgSpecs[i].transferFunction(m))
                        } else {
                            N_n_0_7_snds_0(N_n_0_7_state.msgSpecs[i].transferFunction(m))
                        }
                    }
                    return
                }
            
                            throw new Error('Node "n_0_7", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
let N_n_0_6_outs_0 = 0
function N_n_0_6_rcvs_0(m) {
                            
        if (
            G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])
            || G_msg_isMatching(m, [G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN])
            || G_msg_isMatching(m, [G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN, G_msg_FLOAT_TOKEN])
        ) {
            switch (G_msg_getLength(m)) {
                case 3:
                    NT_vline_t_setNextDelay(N_n_0_6_state, G_msg_readFloatToken(m, 2))
                case 2:
                    NT_vline_t_setNextDuration(N_n_0_6_state, G_msg_readFloatToken(m, 1))
                case 1:
                    NT_vline_t_setNewLine(N_n_0_6_state, G_msg_readFloatToken(m, 0))
            }
            return
    
        } else if (G_actionUtils_isAction(m, 'stop')) {
            N_n_0_6_state.points = []
            N_n_0_6_state.lineSegments = []
            return
        }
        
                            throw new Error('Node "n_0_6", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_7_0_rcvs_0(m) {
                            
                IO_snd_n_0_7_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_7_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_0_0_rcvs_0(m) {
                            
                IO_snd_n_0_0_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_0_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_2_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_2_state, m)
                return
            
                            throw new Error('Node "n_0_2", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_3_rcvs_0(m) {
                            
            G_msgBuses_publish(N_n_0_3_state.busName, m)
            return
        
                            throw new Error('Node "n_0_3", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_2_0_rcvs_0(m) {
                            
                IO_snd_n_0_2_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_2_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }



function N_m_n_0_5_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_5_0__routemsg_snds_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_5_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
let N_m_n_0_5_0_sig_outs_0 = 0
function N_m_n_0_5_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_5_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_5_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_4_0_rcvs_0(m) {
                            
                IO_snd_n_0_4_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_4_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }



function N_n_0_13_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        NT_mul_setLeft(N_n_0_13_state, G_msg_readFloatToken(m, 0))
                        N_m_n_0_15_0__routemsg_rcvs_0(G_msg_floats([N_n_0_13_state.leftOp * N_n_0_13_state.rightOp]))
                        return
                    
                    } else if (G_bangUtils_isBang(m)) {
                        N_m_n_0_15_0__routemsg_rcvs_0(G_msg_floats([N_n_0_13_state.leftOp * N_n_0_13_state.rightOp]))
                        return
                    }
                
                            throw new Error('Node "n_0_13", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_15_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_15_0_sig_rcvs_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_15_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_15_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_15_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_15_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_12_0_rcvs_0(m) {
                            
                IO_snd_n_0_12_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_12_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }








let N_n_0_5_outs_0 = 0













let N_n_0_11_outs_0 = 0



let N_n_0_9_outs_0 = 0





function N_n_0_0_snds_0(m) {
                        N_n_0_1_rcvs_0(m)
N_n_ioSnd_n_0_0_0_rcvs_0(m)
                    }
function N_n_0_7_snds_0(m) {
                        N_n_0_6_rcvs_0(m)
N_n_ioSnd_n_0_7_0_rcvs_0(m)
                    }
function N_n_0_2_snds_0(m) {
                        N_n_0_3_rcvs_0(m)
N_n_ioSnd_n_0_2_0_rcvs_0(m)
                    }
function N_n_0_4_snds_0(m) {
                        N_m_n_0_5_0__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_4_0_rcvs_0(m)
                    }
function N_m_n_0_5_0__routemsg_snds_0(m) {
                        N_m_n_0_5_0_sig_rcvs_0(m)
COLD_0(m)
                    }
function N_n_0_12_snds_0(m) {
                        N_n_0_13_rcvs_0(m)
N_n_ioSnd_n_0_12_0_rcvs_0(m)
                    }

        function COLD_0(m) {
                    N_m_n_0_5_0_sig_outs_0 = N_m_n_0_5_0_sig_state.currentValue
                    NT_osc_t_setStep(N_n_0_5_state, N_m_n_0_5_0_sig_outs_0)
                }
        function IO_rcv_n_0_0_0(m) {
                    N_n_0_0_rcvs_0(m)
                }
function IO_rcv_n_0_2_0(m) {
                    N_n_0_2_rcvs_0(m)
                }
function IO_rcv_n_0_7_0(m) {
                    N_n_0_7_rcvs_0(m)
                }
function IO_rcv_n_0_3_0(m) {
                    N_n_0_3_rcvs_0(m)
                }
        const IO_snd_n_0_0_0 = (m) => {exports.io.messageSenders['n_0_0']['0'](m)}
const IO_snd_n_0_2_0 = (m) => {exports.io.messageSenders['n_0_2']['0'](m)}
const IO_snd_n_0_7_0 = (m) => {exports.io.messageSenders['n_0_7']['0'](m)}
const IO_snd_n_0_4_0 = (m) => {exports.io.messageSenders['n_0_4']['0'](m)}
const IO_snd_n_0_12_0 = (m) => {exports.io.messageSenders['n_0_12']['0'](m)}

        const exports = {
            metadata: {"libVersion":"0.2.1","customMetadata":{"pdNodes":{"0":{"0":{"id":"0","type":"bng","args":[0,"",""],"nodeClass":"control","layout":{"x":162,"y":16,"size":19,"hold":250,"interrupt":50,"label":"","labelX":0,"labelY":-10,"labelFont":"0","labelFontSize":12,"bgColor":"#fcfcfc","fgColor":"#000000","labelColor":"#000000"}},"2":{"id":"2","type":"floatatom","args":[0,0,"",""],"nodeClass":"control","layout":{"x":322,"y":60,"widthInChars":5,"labelPos":0,"label":"pitch"}},"7":{"id":"7","type":"msg","args":[1,5,",",0.3,100,5,",",0,200,105],"nodeClass":"control","layout":{"x":153,"y":152}}}},"graph":{"n_0_0":{"id":"n_0_0","type":"bang","args":{"outputOnLoad":false,"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_0_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_1","portletId":"0"},{"nodeId":"n_ioSnd_n_0_0_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_2":{"id":"n_0_2","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_2_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_3","portletId":"0"},{"nodeId":"n_ioSnd_n_0_2_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_7":{"id":"n_0_7","type":"msg","args":{"msgSpecs":[{"tokens":[1,5],"send":null},{"tokens":[0.3,100,5],"send":null},{"tokens":[0,200,105],"send":null}]},"sources":{"0":[{"nodeId":"n_0_1","portletId":"1"},{"nodeId":"n_ioRcv_n_0_7_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_6","portletId":"0"},{"nodeId":"n_ioSnd_n_0_7_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}}},"n_0_3":{"id":"n_0_3","type":"send","args":{"busName":"event-pitch"},"sources":{"0":[{"nodeId":"n_0_2","portletId":"0"},{"nodeId":"n_ioRcv_n_0_3_0","portletId":"0"}]},"sinks":{},"inlets":{"0":{"type":"message","id":"0"},"1":{"type":"message","id":"1"}},"outlets":{}},"n_0_4":{"id":"n_0_4","type":"receive","args":{"busName":"event-pitch"},"sources":{},"sinks":{"0":[{"nodeId":"m_n_0_5_0__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_4_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_12":{"id":"n_0_12","type":"receive","args":{"busName":"event-pitch"},"sources":{},"sinks":{"0":[{"nodeId":"n_0_13","portletId":"0"},{"nodeId":"n_ioSnd_n_0_12_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true}},"pdGui":[{"nodeClass":"control","patchId":"0","pdNodeId":"0","nodeId":"n_0_0"},{"nodeClass":"control","patchId":"0","pdNodeId":"2","nodeId":"n_0_2"},{"nodeClass":"control","patchId":"0","pdNodeId":"7","nodeId":"n_0_7"}]},"settings":{"audio":{"bitDepth":64,"channelCount":{"in":2,"out":2},"sampleRate":0,"blockSize":0},"io":{"messageReceivers":{"n_0_0":["0"],"n_0_2":["0"],"n_0_7":["0"],"n_0_3":["0"]},"messageSenders":{"n_0_0":["0"],"n_0_2":["0"],"n_0_7":["0"],"n_0_4":["0"],"n_0_12":["0"]}}},"compilation":{"variableNamesIndex":{"io":{"messageReceivers":{"n_0_0":{"0":"IO_rcv_n_0_0_0"},"n_0_2":{"0":"IO_rcv_n_0_2_0"},"n_0_7":{"0":"IO_rcv_n_0_7_0"},"n_0_3":{"0":"IO_rcv_n_0_3_0"}},"messageSenders":{"n_0_0":{"0":"IO_snd_n_0_0_0"},"n_0_2":{"0":"IO_snd_n_0_2_0"},"n_0_7":{"0":"IO_snd_n_0_7_0"},"n_0_4":{"0":"IO_snd_n_0_4_0"},"n_0_12":{"0":"IO_snd_n_0_12_0"}}},"globals":{"commons":{"getArray":"G_commons_getArray","setArray":"G_commons_setArray"}}}}},
            initialize: (sampleRate, blockSize) => {
                exports.metadata.settings.audio.sampleRate = sampleRate
                exports.metadata.settings.audio.blockSize = blockSize
                SAMPLE_RATE = sampleRate
                BLOCK_SIZE = blockSize

                
        N_n_0_0_state.messageReceiver = function (m) {
            NT_bang_receiveMessage(N_n_0_0_state, m)
        }
        N_n_0_0_state.messageSender = N_n_0_0_snds_0
        NT_bang_setReceiveBusName(N_n_0_0_state, "empty")

        
    


            N_n_0_7_state.msgSpecs = [
                
                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_7_state.msgSpecs[0].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },

                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_7_state.msgSpecs[1].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },

                    {
                        transferFunction: function (inMessage) {
                            
                            return N_n_0_7_state.msgSpecs[2].outMessage
                        },
                        outTemplate: [],
                        outMessage: G_msg_EMPTY_MESSAGE,
                        send: "",
                        hasSend: false,
                    },
            ]

            
        
        
        
    
N_n_0_7_state.msgSpecs[0].outTemplate = []

                N_n_0_7_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_7_state.msgSpecs[0].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_7_state.msgSpecs[0].outMessage = G_msg_create(N_n_0_7_state.msgSpecs[0].outTemplate)

                G_msg_writeFloatToken(N_n_0_7_state.msgSpecs[0].outMessage, 0, 1)
            

                G_msg_writeFloatToken(N_n_0_7_state.msgSpecs[0].outMessage, 1, 5)
            

        
        
        
    
N_n_0_7_state.msgSpecs[1].outTemplate = []

                N_n_0_7_state.msgSpecs[1].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_7_state.msgSpecs[1].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_7_state.msgSpecs[1].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_7_state.msgSpecs[1].outMessage = G_msg_create(N_n_0_7_state.msgSpecs[1].outTemplate)

                G_msg_writeFloatToken(N_n_0_7_state.msgSpecs[1].outMessage, 0, 0.3)
            

                G_msg_writeFloatToken(N_n_0_7_state.msgSpecs[1].outMessage, 1, 100)
            

                G_msg_writeFloatToken(N_n_0_7_state.msgSpecs[1].outMessage, 2, 5)
            

        
        
        
    
N_n_0_7_state.msgSpecs[2].outTemplate = []

                N_n_0_7_state.msgSpecs[2].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_7_state.msgSpecs[2].outTemplate.push(G_msg_FLOAT_TOKEN)
            

                N_n_0_7_state.msgSpecs[2].outTemplate.push(G_msg_FLOAT_TOKEN)
            
N_n_0_7_state.msgSpecs[2].outMessage = G_msg_create(N_n_0_7_state.msgSpecs[2].outTemplate)

                G_msg_writeFloatToken(N_n_0_7_state.msgSpecs[2].outMessage, 0, 0)
            

                G_msg_writeFloatToken(N_n_0_7_state.msgSpecs[2].outMessage, 1, 200)
            

                G_msg_writeFloatToken(N_n_0_7_state.msgSpecs[2].outMessage, 2, 105)
            
        




            N_n_0_2_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_2_state, m)
            }
            N_n_0_2_state.messageSender = N_n_0_2_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_2_state, "empty")
        



            G_msgBuses_subscribe("event-pitch", N_n_0_4_snds_0)
        




            G_msgBuses_subscribe("event-pitch", N_n_0_12_snds_0)
        

            NT_mul_setLeft(N_n_0_13_state, 0)
            NT_mul_setRight(N_n_0_13_state, 2.5)
        








            NT_osc_t_setStep(N_n_0_5_state, 0)
        


        NT_receive_t_setBusName(N_n_0_17_state, "envelope")
    





        NT_filters_bp_t_updateCoefs(N_n_0_11_state)
    




        NT_send_t_setBusName(N_n_0_14_state, "envelope")
    
                COLD_0(G_msg_EMPTY_MESSAGE)
            },
            dspLoop: (INPUT, OUTPUT) => {
                
        for (IT_FRAME = 0; IT_FRAME < BLOCK_SIZE; IT_FRAME++) {
            G_commons__emitFrame(FRAME)
            
                N_n_0_5_outs_0 = Math.cos(N_n_0_5_state.phase)
                N_n_0_5_state.phase += N_n_0_5_state.step
            

        if (N_n_0_6_state.lineSegments.length) {
            if (toFloat(FRAME) < N_n_0_6_state.lineSegments[0].p0.x) {

            // This should come first to handle vertical lines
            } else if (toFloat(FRAME) === N_n_0_6_state.lineSegments[0].p1.x) {
                N_n_0_6_state.currentValue = N_n_0_6_state.lineSegments[0].p1.y
                N_n_0_6_state.lineSegments.shift()

            } else if (toFloat(FRAME) === N_n_0_6_state.lineSegments[0].p0.x) {
                N_n_0_6_state.currentValue = N_n_0_6_state.lineSegments[0].p0.y

            } else if (toFloat(FRAME) < N_n_0_6_state.lineSegments[0].p1.x) {
                N_n_0_6_state.currentValue += N_n_0_6_state.lineSegments[0].dy

            }
        }
        N_n_0_6_outs_0 = N_n_0_6_state.currentValue
    

        N_n_0_11_state.y = ((N_n_0_5_outs_0 * N_n_0_6_outs_0) + ((N_m_n_0_15_0_sig_state.currentValue) + ((G_sigBuses_read(N_n_0_17_state.busName)) * (N_m_n_0_16_1_sig_state.currentValue)))) + N_n_0_11_state.coef1 * N_n_0_11_state.ym1 + N_n_0_11_state.coef2 * N_n_0_11_state.ym2
        N_n_0_11_outs_0 = N_n_0_11_state.gain * N_n_0_11_state.y
        N_n_0_11_state.ym2 = N_n_0_11_state.ym1
        N_n_0_11_state.ym1 = N_n_0_11_state.y
    
N_n_0_9_outs_0 = N_n_0_11_outs_0 * (N_m_n_0_9_1_sig_state.currentValue)
OUTPUT[0][IT_FRAME] = N_n_0_9_outs_0
OUTPUT[1][IT_FRAME] = N_n_0_9_outs_0

        G_sigBuses_set(N_n_0_14_state.busName, N_n_0_6_outs_0)
    
            FRAME++
        }
    
            },
            io: {
                messageReceivers: {
                    n_0_0: {
                            "0": IO_rcv_n_0_0_0,
                        },
n_0_2: {
                            "0": IO_rcv_n_0_2_0,
                        },
n_0_7: {
                            "0": IO_rcv_n_0_7_0,
                        },
n_0_3: {
                            "0": IO_rcv_n_0_3_0,
                        },
                },
                messageSenders: {
                    n_0_0: {
                            "0": () => undefined,
                        },
n_0_2: {
                            "0": () => undefined,
                        },
n_0_7: {
                            "0": () => undefined,
                        },
n_0_4: {
                            "0": () => undefined,
                        },
n_0_12: {
                            "0": () => undefined,
                        },
                },
            }
        }

        
exports.G_commons_getArray = G_commons_getArray
exports.G_commons_setArray = G_commons_setArray
    