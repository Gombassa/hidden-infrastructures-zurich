
        
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
function G_tokenConversion_toFloat(m, i) {
        if (G_msg_isFloatToken(m, i)) {
            return G_msg_readFloatToken(m, i)
        } else {
            return 0
        }
    }
function G_numbers_roundFloatAsPdInt(value) {
            return value > 0 ? Math.floor(value): Math.ceil(value)
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
        


function NT_metro_setRate(state, rate) {
                state.rate = Math.max(rate, 0)
            }
function NT_metro_scheduleNextTick(state) {
                state.snd0(G_bangUtils_bang())
                state.realNextTick = state.realNextTick + state.rate * state.sampleRatio
                state.skedId = G_commons_waitFrame(
                    toInt(Math.round(state.realNextTick)), 
                    state.tickCallback,
                )
            }
function NT_metro_stop(state) {
                if (state.skedId !== G_sked_ID_NULL) {
                    G_commons_cancelWaitFrame(state.skedId)
                    state.skedId = G_sked_ID_NULL
                }
                state.realNextTick = 0
            }

function NT_float_setValue(state, value) {
                state.value = value
            }

function NT_add_setLeft(state, value) {
                    state.leftOp = value
                }
function NT_add_setRight(state, value) {
                    state.rightOp = value
                }

function NT_div_setLeft(state, value) {
                    state.leftOp = value
                }
function NT_div_setRight(state, value) {
                    state.rightOp = value
                }













function NT_mul_setLeft(state, value) {
                    state.leftOp = value
                }
function NT_mul_setRight(state, value) {
                    state.rightOp = value
                }

function NT_vsl_setReceiveBusName(state, busName) {
            if (state.receiveBusName !== "empty") {
                G_msgBuses_unsubscribe(state.receiveBusName, state.messageReceiver)
            }
            state.receiveBusName = busName
            if (state.receiveBusName !== "empty") {
                G_msgBuses_subscribe(state.receiveBusName, state.messageReceiver)
            }
        }
function NT_vsl_setSendReceiveFromMessage(state, m) {
            if (
                G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_STRING_TOKEN])
                && G_msg_readStringToken(m, 0) === 'receive'
            ) {
                NT_vsl_setReceiveBusName(state, G_msg_readStringToken(m, 1))
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
function NT_vsl_defaultMessageHandler(m) {}
function NT_vsl_receiveMessage(state, m) {
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        state.valueFloat = G_msg_readFloatToken(m, 0)
                        const outMessage = G_msg_floats([state.valueFloat])
                        state.messageSender(outMessage)
                        if (state.sendBusName !== "empty") {
                            G_msgBuses_publish(state.sendBusName, outMessage)
                        }
                        return
        
                    } else if (G_bangUtils_isBang(m)) {
                        
                        const outMessage = G_msg_floats([state.valueFloat])
                        state.messageSender(outMessage)
                        if (state.sendBusName !== "empty") {
                            G_msgBuses_publish(state.sendBusName, outMessage)
                        }
                        return
        
                    } else if (
                        G_msg_isMatching(m, [G_msg_STRING_TOKEN, G_msg_FLOAT_TOKEN]) 
                        && G_msg_readStringToken(m, 0) === 'set'
                    ) {
                        state.valueFloat = G_msg_readFloatToken(m, 1)
                        return
                    
                    } else if (NT_vsl_setSendReceiveFromMessage(state, m) === true) {
                        return
                    }
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

function NT_osc_t_setStep(state, freq) {
                    state.step = (2 * Math.PI / SAMPLE_RATE) * freq
                }
function NT_osc_t_setPhase(state, phase) {
                    state.phase = phase % 1.0 * 2 * Math.PI
                }









function NT_lop_t_setFreq(state, freq) {
                state.coeff = Math.max(Math.min(freq * 2 * Math.PI / SAMPLE_RATE, 1), 0)
            }

function NT_receive_t_setBusName(state, busName) {
            if (busName.length) {
                state.busName = busName
                G_sigBuses_reset(state.busName)
            }
        }





function NT_send_t_setBusName(state, busName) {
            if (busName.length) {
                state.busName = busName
                G_sigBuses_reset(state.busName)
            }
        }

        const N_n_0_1_state = {
                                rate: 0,
sampleRatio: 1,
skedId: G_sked_ID_NULL,
realNextTick: -1,
snd0: function (m) {},
tickCallback: function () {},
                            }
const N_n_0_2_state = {
                                value: 0,
                            }
const N_n_0_3_state = {
                                leftOp: 0,
rightOp: 0,
                            }
const N_n_0_8_state = {
                                leftOp: 0,
rightOp: 0,
                            }
const N_n_0_9_state = {
                                floatInputs: new Map(),
stringInputs: new Map(),
outputs: new Array(1),
                            }
const N_n_0_4_state = {
                                busName: "base-freq",
                            }
const N_m_n_0_6_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_11_state = {
                                leftOp: 0,
rightOp: 0,
                            }
const N_m_n_0_12_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_18_state = {
                                leftOp: 0,
rightOp: 0,
                            }
const N_m_n_0_17_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_23_state = {
                                leftOp: 0,
rightOp: 0,
                            }
const N_m_n_0_22_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_29_state = {
                                minValue: 0,
maxValue: 1,
valueFloat: 0,
value: G_msg_create([]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_vsl_defaultMessageHandler,
messageSender: NT_vsl_defaultMessageHandler,
                            }
const N_n_0_32_state = {
                                value: G_msg_floats([0]),
receiveBusName: "empty",
sendBusName: "empty",
messageReceiver: NT_floatatom_defaultMessageHandler,
messageSender: NT_floatatom_defaultMessageHandler,
                            }
const N_n_0_45_state = {
                                busName: "tram-count",
                            }
const N_n_0_34_state = {
                                leftOp: 0,
rightOp: 0,
                            }
const N_n_0_35_state = {
                                busName: "pulse-depth",
                            }
const N_n_0_37_state = {
                                leftOp: 0,
rightOp: 0,
                            }
const N_n_0_50_state = {
                                leftOp: 0,
rightOp: 0,
                            }
const N_n_0_38_state = {
                                busName: "pulse-freq",
                            }
const N_m_n_0_42_0_sig_state = {
                                currentValue: 0,
                            }
const N_n_0_42_state = {
                                phase: 0,
step: 0,
                            }
const N_n_0_47_state = {
                                leftOp: 0,
rightOp: 0,
                            }
const N_n_0_48_state = {
                                minValue: 0,
maxValue: 1,
                            }
const N_n_0_49_state = {
                                busName: "tram-load",
                            }
const N_n_0_6_state = {
                                phase: 0,
step: 0,
                            }
const N_m_n_0_7_1_sig_state = {
                                currentValue: 0.8,
                            }
const N_n_0_12_state = {
                                phase: 0,
step: 0,
                            }
const N_m_n_0_13_1_sig_state = {
                                currentValue: 0.5,
                            }
const N_n_0_17_state = {
                                phase: 0,
step: 0,
                            }
const N_m_n_0_19_1_sig_state = {
                                currentValue: 0.3,
                            }
const N_m_n_0_25_0_sig_state = {
                                currentValue: 0,
                            }
const N_m_n_0_25_1_sig_state = {
                                currentValue: 200,
                            }
const N_n_0_25_state = {
                                previous: 0,
coeff: 0,
                            }
const N_m_n_0_27_1_sig_state = {
                                currentValue: 0.3,
                            }
const N_n_0_30_state = {
                                busName: "",
                            }
const N_m_n_0_28_1_sig_state = {
                                currentValue: 30,
                            }
const N_n_0_28_state = {
                                previous: 0,
current: 0,
coeff: 0,
normal: 0,
                            }
const N_m_n_0_43_1_sig_state = {
                                currentValue: 0,
                            }
const N_m_n_0_39_1_sig_state = {
                                currentValue: 1,
                            }
const N_n_0_40_state = {
                                busName: "",
                            }
        


function N_n_0_1_rcvs_0(m) {
                            
            if (G_msg_getLength(m) === 1) {
                if (
                    (G_msg_isFloatToken(m, 0) && G_msg_readFloatToken(m, 0) === 0)
                    || G_actionUtils_isAction(m, 'stop')
                ) {
                    NT_metro_stop(N_n_0_1_state)
                    return
    
                } else if (
                    G_msg_isFloatToken(m, 0)
                    || G_bangUtils_isBang(m)
                ) {
                    N_n_0_1_state.realNextTick = toFloat(FRAME)
                    NT_metro_scheduleNextTick(N_n_0_1_state)
                    return
                }
            }
        
                            throw new Error('Node "n_0_1", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_2_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                NT_float_setValue(N_n_0_2_state, G_msg_readFloatToken(m, 0))
                N_n_0_2_snds_0(G_msg_floats([N_n_0_2_state.value]))
                return 

            } else if (G_bangUtils_isBang(m)) {
                N_n_0_2_snds_0(G_msg_floats([N_n_0_2_state.value]))
                return
                
            }
        
                            throw new Error('Node "n_0_2", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
function N_n_0_2_rcvs_1(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        NT_float_setValue(N_n_0_2_state, G_msg_readFloatToken(m, 0))
        return
    }

                            throw new Error('Node "n_0_2", inlet "1", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_3_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        NT_add_setLeft(N_n_0_3_state, G_msg_readFloatToken(m, 0))
                        N_n_0_2_rcvs_1(G_msg_floats([N_n_0_3_state.leftOp + N_n_0_3_state.rightOp]))
                        return
                    
                    } else if (G_bangUtils_isBang(m)) {
                        N_n_0_2_rcvs_1(G_msg_floats([N_n_0_3_state.leftOp + N_n_0_3_state.rightOp]))
                        return
                    }
                
                            throw new Error('Node "n_0_3", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_8_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        NT_div_setLeft(N_n_0_8_state, G_msg_readFloatToken(m, 0))
                        N_n_0_9_rcvs_0(G_msg_floats([N_n_0_8_state.rightOp !== 0 ? N_n_0_8_state.leftOp / N_n_0_8_state.rightOp: 0]))
                        return
                    
                    } else if (G_bangUtils_isBang(m)) {
                        N_n_0_9_rcvs_0(G_msg_floats([N_n_0_8_state.rightOp !== 0 ? N_n_0_8_state.leftOp / N_n_0_8_state.rightOp: 0]))
                        return
                    }
                
                            throw new Error('Node "n_0_8", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_9_rcvs_0(m) {
                            
                if (!G_bangUtils_isBang(m)) {
                    for (let i = 0; i < G_msg_getLength(m); i++) {
                        N_n_0_9_state.stringInputs.set(i, G_tokenConversion_toString_(m, i))
                        N_n_0_9_state.floatInputs.set(i, G_tokenConversion_toFloat(m, i))
                    }
                }
    
                
                    N_n_0_9_state.outputs[0] = +(Math.sin(N_n_0_9_state.floatInputs.get(0)) * 0.4 + 50)
            
                    N_n_0_4_rcvs_0(G_msg_floats([N_n_0_9_state.outputs[0]]))
                
                
                return
            
                            throw new Error('Node "n_0_9", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_4_rcvs_0(m) {
                            
            G_msgBuses_publish(N_n_0_4_state.busName, m)
            return
        
                            throw new Error('Node "n_0_4", inlet "0", unsupported message : ' + G_msg_display(m))
                        }



function N_m_n_0_6_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_6_0__routemsg_snds_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_6_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
let N_m_n_0_6_0_sig_outs_0 = 0
function N_m_n_0_6_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_6_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_6_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_5_0_rcvs_0(m) {
                            
                IO_snd_n_0_5_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_5_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }



function N_n_0_11_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        NT_mul_setLeft(N_n_0_11_state, G_msg_readFloatToken(m, 0))
                        N_m_n_0_12_0__routemsg_rcvs_0(G_msg_floats([N_n_0_11_state.leftOp * N_n_0_11_state.rightOp]))
                        return
                    
                    } else if (G_bangUtils_isBang(m)) {
                        N_m_n_0_12_0__routemsg_rcvs_0(G_msg_floats([N_n_0_11_state.leftOp * N_n_0_11_state.rightOp]))
                        return
                    }
                
                            throw new Error('Node "n_0_11", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_12_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_12_0__routemsg_snds_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_12_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
let N_m_n_0_12_0_sig_outs_0 = 0
function N_m_n_0_12_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_12_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_12_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_10_0_rcvs_0(m) {
                            
                IO_snd_n_0_10_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_10_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }



function N_n_0_18_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        NT_mul_setLeft(N_n_0_18_state, G_msg_readFloatToken(m, 0))
                        N_m_n_0_17_0__routemsg_rcvs_0(G_msg_floats([N_n_0_18_state.leftOp * N_n_0_18_state.rightOp]))
                        return
                    
                    } else if (G_bangUtils_isBang(m)) {
                        N_m_n_0_17_0__routemsg_rcvs_0(G_msg_floats([N_n_0_18_state.leftOp * N_n_0_18_state.rightOp]))
                        return
                    }
                
                            throw new Error('Node "n_0_18", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_17_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_17_0__routemsg_snds_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_17_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
let N_m_n_0_17_0_sig_outs_0 = 0
function N_m_n_0_17_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_17_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_17_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_16_0_rcvs_0(m) {
                            
                IO_snd_n_0_16_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_16_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }



function N_n_0_23_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        NT_mul_setLeft(N_n_0_23_state, G_msg_readFloatToken(m, 0))
                        N_m_n_0_22_0__routemsg_rcvs_0(G_msg_floats([N_n_0_23_state.leftOp * N_n_0_23_state.rightOp]))
                        return
                    
                    } else if (G_bangUtils_isBang(m)) {
                        N_m_n_0_22_0__routemsg_rcvs_0(G_msg_floats([N_n_0_23_state.leftOp * N_n_0_23_state.rightOp]))
                        return
                    }
                
                            throw new Error('Node "n_0_23", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_22_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_22_0_sig_rcvs_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_22_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_m_n_0_22_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_22_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_22_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_21_0_rcvs_0(m) {
                            
                IO_snd_n_0_21_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_21_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_29_rcvs_0(m) {
                            
                NT_vsl_receiveMessage(N_n_0_29_state, m)
                return
            
                            throw new Error('Node "n_0_29", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_29_0_rcvs_0(m) {
                            
                IO_snd_n_0_29_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_29_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_32_rcvs_0(m) {
                            
                NT_floatatom_receiveMessage(N_n_0_32_state, m)
                return
            
                            throw new Error('Node "n_0_32", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_45_rcvs_0(m) {
                            
            G_msgBuses_publish(N_n_0_45_state.busName, m)
            return
        
                            throw new Error('Node "n_0_45", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_32_0_rcvs_0(m) {
                            
                IO_snd_n_0_32_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_32_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }



function N_n_0_34_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        NT_mul_setLeft(N_n_0_34_state, G_msg_readFloatToken(m, 0))
                        N_n_0_35_rcvs_0(G_msg_floats([N_n_0_34_state.leftOp * N_n_0_34_state.rightOp]))
                        return
                    
                    } else if (G_bangUtils_isBang(m)) {
                        N_n_0_35_rcvs_0(G_msg_floats([N_n_0_34_state.leftOp * N_n_0_34_state.rightOp]))
                        return
                    }
                
                            throw new Error('Node "n_0_34", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_35_rcvs_0(m) {
                            
            G_msgBuses_publish(N_n_0_35_state.busName, m)
            return
        
                            throw new Error('Node "n_0_35", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_33_0_rcvs_0(m) {
                            
                IO_snd_n_0_33_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_33_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }



function N_n_0_37_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        NT_mul_setLeft(N_n_0_37_state, G_msg_readFloatToken(m, 0))
                        N_n_0_50_rcvs_0(G_msg_floats([N_n_0_37_state.leftOp * N_n_0_37_state.rightOp]))
                        return
                    
                    } else if (G_bangUtils_isBang(m)) {
                        N_n_0_50_rcvs_0(G_msg_floats([N_n_0_37_state.leftOp * N_n_0_37_state.rightOp]))
                        return
                    }
                
                            throw new Error('Node "n_0_37", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_50_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        NT_add_setLeft(N_n_0_50_state, G_msg_readFloatToken(m, 0))
                        N_n_0_38_rcvs_0(G_msg_floats([N_n_0_50_state.leftOp + N_n_0_50_state.rightOp]))
                        return
                    
                    } else if (G_bangUtils_isBang(m)) {
                        N_n_0_38_rcvs_0(G_msg_floats([N_n_0_50_state.leftOp + N_n_0_50_state.rightOp]))
                        return
                    }
                
                            throw new Error('Node "n_0_50", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_38_rcvs_0(m) {
                            
            G_msgBuses_publish(N_n_0_38_state.busName, m)
            return
        
                            throw new Error('Node "n_0_38", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_36_0_rcvs_0(m) {
                            
                IO_snd_n_0_36_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_36_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }



function N_m_n_0_42_0__routemsg_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_m_n_0_42_0__routemsg_snds_0(m)
                return
            } else {
                G_msg_VOID_MESSAGE_RECEIVER(m)
                return
            }
        
                            throw new Error('Node "m_n_0_42_0__routemsg", inlet "0", unsupported message : ' + G_msg_display(m))
                        }
let N_m_n_0_42_0_sig_outs_0 = 0
function N_m_n_0_42_0_sig_rcvs_0(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        N_m_n_0_42_0_sig_state.currentValue = G_msg_readFloatToken(m, 0)
        return
    }

                            throw new Error('Node "m_n_0_42_0_sig", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_41_0_rcvs_0(m) {
                            
                IO_snd_n_0_41_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_41_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }


let N_n_0_42_outs_0 = 0
function N_n_0_42_rcvs_1(m) {
                            
    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
        NT_osc_t_setPhase(N_n_0_42_state, G_msg_readFloatToken(m, 0))
        return
    }

                            throw new Error('Node "n_0_42", inlet "1", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_44_0_rcvs_0(m) {
                            
                IO_snd_n_0_44_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_44_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }



function N_n_0_47_rcvs_0(m) {
                            
                    if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                        NT_div_setLeft(N_n_0_47_state, G_msg_readFloatToken(m, 0))
                        N_n_0_48_rcvs_0(G_msg_floats([N_n_0_47_state.rightOp !== 0 ? N_n_0_47_state.leftOp / N_n_0_47_state.rightOp: 0]))
                        return
                    
                    } else if (G_bangUtils_isBang(m)) {
                        N_n_0_48_rcvs_0(G_msg_floats([N_n_0_47_state.rightOp !== 0 ? N_n_0_47_state.leftOp / N_n_0_47_state.rightOp: 0]))
                        return
                    }
                
                            throw new Error('Node "n_0_47", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_48_rcvs_0(m) {
                            
            if (G_msg_isMatching(m, [G_msg_FLOAT_TOKEN])) {
                N_n_0_49_rcvs_0(G_msg_floats([
                    Math.max(
                        Math.min(
                            N_n_0_48_state.maxValue, 
                            G_msg_readFloatToken(m, 0)
                        ), 
                        N_n_0_48_state.minValue
                    )
                ]))
                return
            }
        
                            throw new Error('Node "n_0_48", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_0_49_rcvs_0(m) {
                            
            G_msgBuses_publish(N_n_0_49_state.busName, m)
            return
        
                            throw new Error('Node "n_0_49", inlet "0", unsupported message : ' + G_msg_display(m))
                        }

function N_n_ioSnd_n_0_46_0_rcvs_0(m) {
                            
                IO_snd_n_0_46_0(m)
                return
            
                            throw new Error('Node "n_ioSnd_n_0_46_0", inlet "0", unsupported message : ' + G_msg_display(m))
                        }














let N_n_0_6_outs_0 = 0





let N_n_0_12_outs_0 = 0







let N_n_0_17_outs_0 = 0







let N_m_n_0_25_0_sig_outs_0 = 0

let N_m_n_0_25_1_sig_outs_0 = 0

let N_n_0_25_outs_0 = 0











let N_m_n_0_28_1_sig_outs_0 = 0

let N_n_0_28_outs_0 = 0













function N_n_0_2_snds_0(m) {
                        N_n_0_3_rcvs_0(m)
N_n_0_8_rcvs_0(m)
                    }
function N_n_0_5_snds_0(m) {
                        N_m_n_0_6_0__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_5_0_rcvs_0(m)
                    }
function N_m_n_0_6_0__routemsg_snds_0(m) {
                        N_m_n_0_6_0_sig_rcvs_0(m)
COLD_0(m)
                    }
function N_n_0_10_snds_0(m) {
                        N_n_0_11_rcvs_0(m)
N_n_ioSnd_n_0_10_0_rcvs_0(m)
                    }
function N_m_n_0_12_0__routemsg_snds_0(m) {
                        N_m_n_0_12_0_sig_rcvs_0(m)
COLD_1(m)
                    }
function N_n_0_16_snds_0(m) {
                        N_n_0_18_rcvs_0(m)
N_n_ioSnd_n_0_16_0_rcvs_0(m)
                    }
function N_m_n_0_17_0__routemsg_snds_0(m) {
                        N_m_n_0_17_0_sig_rcvs_0(m)
COLD_2(m)
                    }
function N_n_0_21_snds_0(m) {
                        N_n_0_23_rcvs_0(m)
N_n_ioSnd_n_0_21_0_rcvs_0(m)
                    }
function N_n_0_29_snds_0(m) {
                        N_n_0_4_rcvs_0(m)
N_n_ioSnd_n_0_29_0_rcvs_0(m)
                    }
function N_n_0_32_snds_0(m) {
                        N_n_0_45_rcvs_0(m)
N_n_ioSnd_n_0_32_0_rcvs_0(m)
                    }
function N_n_0_33_snds_0(m) {
                        N_n_0_34_rcvs_0(m)
N_n_ioSnd_n_0_33_0_rcvs_0(m)
                    }
function N_n_0_36_snds_0(m) {
                        N_n_0_37_rcvs_0(m)
N_n_ioSnd_n_0_36_0_rcvs_0(m)
                    }
function N_n_0_41_snds_0(m) {
                        N_m_n_0_42_0__routemsg_rcvs_0(m)
N_n_ioSnd_n_0_41_0_rcvs_0(m)
                    }
function N_m_n_0_42_0__routemsg_snds_0(m) {
                        N_m_n_0_42_0_sig_rcvs_0(m)
COLD_6(m)
                    }
function N_n_0_44_snds_0(m) {
                        N_n_0_42_rcvs_1(m)
N_n_ioSnd_n_0_44_0_rcvs_0(m)
                    }
function N_n_0_46_snds_0(m) {
                        N_n_0_47_rcvs_0(m)
N_n_ioSnd_n_0_46_0_rcvs_0(m)
                    }

        function COLD_0(m) {
                    N_m_n_0_6_0_sig_outs_0 = N_m_n_0_6_0_sig_state.currentValue
                    NT_osc_t_setStep(N_n_0_6_state, N_m_n_0_6_0_sig_outs_0)
                }
function COLD_1(m) {
                    N_m_n_0_12_0_sig_outs_0 = N_m_n_0_12_0_sig_state.currentValue
                    NT_osc_t_setStep(N_n_0_12_state, N_m_n_0_12_0_sig_outs_0)
                }
function COLD_2(m) {
                    N_m_n_0_17_0_sig_outs_0 = N_m_n_0_17_0_sig_state.currentValue
                    NT_osc_t_setStep(N_n_0_17_state, N_m_n_0_17_0_sig_outs_0)
                }
function COLD_3(m) {
                    N_m_n_0_25_0_sig_outs_0 = N_m_n_0_25_0_sig_state.currentValue
                    
                }
function COLD_4(m) {
                    N_m_n_0_25_1_sig_outs_0 = N_m_n_0_25_1_sig_state.currentValue
                    NT_lop_t_setFreq(N_n_0_25_state, N_m_n_0_25_1_sig_outs_0)
                }
function COLD_5(m) {
                    N_m_n_0_28_1_sig_outs_0 = N_m_n_0_28_1_sig_state.currentValue
                    
                N_n_0_28_state.coeff = Math.min(Math.max(1 - N_m_n_0_28_1_sig_outs_0 * (2 * Math.PI) / SAMPLE_RATE, 0), 1)
                N_n_0_28_state.normal = 0.5 * (1 + N_n_0_28_state.coeff)
            
                }
function COLD_6(m) {
                    N_m_n_0_42_0_sig_outs_0 = N_m_n_0_42_0_sig_state.currentValue
                    NT_osc_t_setStep(N_n_0_42_state, N_m_n_0_42_0_sig_outs_0)
                }
        function IO_rcv_n_0_29_0(m) {
                    N_n_0_29_rcvs_0(m)
                }
function IO_rcv_n_0_32_0(m) {
                    N_n_0_32_rcvs_0(m)
                }
function IO_rcv_n_0_4_0(m) {
                    N_n_0_4_rcvs_0(m)
                }
function IO_rcv_n_0_35_0(m) {
                    N_n_0_35_rcvs_0(m)
                }
function IO_rcv_n_0_38_0(m) {
                    N_n_0_38_rcvs_0(m)
                }
function IO_rcv_n_0_45_0(m) {
                    N_n_0_45_rcvs_0(m)
                }
function IO_rcv_n_0_49_0(m) {
                    N_n_0_49_rcvs_0(m)
                }
        const IO_snd_n_0_29_0 = (m) => {exports.io.messageSenders['n_0_29']['0'](m)}
const IO_snd_n_0_32_0 = (m) => {exports.io.messageSenders['n_0_32']['0'](m)}
const IO_snd_n_0_5_0 = (m) => {exports.io.messageSenders['n_0_5']['0'](m)}
const IO_snd_n_0_10_0 = (m) => {exports.io.messageSenders['n_0_10']['0'](m)}
const IO_snd_n_0_16_0 = (m) => {exports.io.messageSenders['n_0_16']['0'](m)}
const IO_snd_n_0_21_0 = (m) => {exports.io.messageSenders['n_0_21']['0'](m)}
const IO_snd_n_0_33_0 = (m) => {exports.io.messageSenders['n_0_33']['0'](m)}
const IO_snd_n_0_36_0 = (m) => {exports.io.messageSenders['n_0_36']['0'](m)}
const IO_snd_n_0_41_0 = (m) => {exports.io.messageSenders['n_0_41']['0'](m)}
const IO_snd_n_0_44_0 = (m) => {exports.io.messageSenders['n_0_44']['0'](m)}
const IO_snd_n_0_46_0 = (m) => {exports.io.messageSenders['n_0_46']['0'](m)}

        const exports = {
            metadata: {"libVersion":"0.2.1","customMetadata":{"pdNodes":{"0":{"29":{"id":"29","type":"vsl","args":[0,1,0,0,"",""],"nodeClass":"control","layout":{"x":215,"y":17,"width":19,"height":162,"log":0,"label":"Freq\\ Control","labelX":0,"labelY":-9,"labelFont":"0","labelFontSize":12,"bgColor":"#fcfcfc","fgColor":"#000000","labelColor":"#000000","steadyOnClick":"1"}},"32":{"id":"32","type":"floatatom","args":[0,5,"",""],"nodeClass":"control","layout":{"x":547,"y":14,"widthInChars":5,"labelPos":0,"label":"Trams\\ Nearby"}}}},"graph":{"n_0_29":{"id":"n_0_29","type":"vsl","args":{"minValue":0,"maxValue":1,"sendBusName":"empty","receiveBusName":"empty","initValue":0,"outputOnLoad":false},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_29_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_4","portletId":"0"},{"nodeId":"n_ioSnd_n_0_29_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_32":{"id":"n_0_32","type":"floatatom","args":{"sendBusName":"empty","receiveBusName":"empty"},"sources":{"0":[{"nodeId":"n_ioRcv_n_0_32_0","portletId":"0"}]},"sinks":{"0":[{"nodeId":"n_0_45","portletId":"0"},{"nodeId":"n_ioSnd_n_0_32_0","portletId":"0"}]},"inlets":{"0":{"type":"message","id":"0"}},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_4":{"id":"n_0_4","type":"send","args":{"busName":"base-freq"},"sources":{"0":[{"nodeId":"n_0_9","portletId":"0"},{"nodeId":"n_0_29","portletId":"0"},{"nodeId":"n_ioRcv_n_0_4_0","portletId":"0"}]},"sinks":{},"inlets":{"0":{"type":"message","id":"0"},"1":{"type":"message","id":"1"}},"outlets":{}},"n_0_35":{"id":"n_0_35","type":"send","args":{"busName":"pulse-depth"},"sources":{"0":[{"nodeId":"n_0_34","portletId":"0"},{"nodeId":"n_ioRcv_n_0_35_0","portletId":"0"}]},"sinks":{},"inlets":{"0":{"type":"message","id":"0"},"1":{"type":"message","id":"1"}},"outlets":{}},"n_0_38":{"id":"n_0_38","type":"send","args":{"busName":"pulse-freq"},"sources":{"0":[{"nodeId":"n_0_50","portletId":"0"},{"nodeId":"n_ioRcv_n_0_38_0","portletId":"0"}]},"sinks":{},"inlets":{"0":{"type":"message","id":"0"},"1":{"type":"message","id":"1"}},"outlets":{}},"n_0_45":{"id":"n_0_45","type":"send","args":{"busName":"tram-count"},"sources":{"0":[{"nodeId":"n_0_32","portletId":"0"},{"nodeId":"n_ioRcv_n_0_45_0","portletId":"0"}]},"sinks":{},"inlets":{"0":{"type":"message","id":"0"},"1":{"type":"message","id":"1"}},"outlets":{}},"n_0_49":{"id":"n_0_49","type":"send","args":{"busName":"tram-load"},"sources":{"0":[{"nodeId":"n_0_48","portletId":"0"},{"nodeId":"n_ioRcv_n_0_49_0","portletId":"0"}]},"sinks":{},"inlets":{"0":{"type":"message","id":"0"},"1":{"type":"message","id":"1"}},"outlets":{}},"n_0_5":{"id":"n_0_5","type":"receive","args":{"busName":"base-freq"},"sources":{},"sinks":{"0":[{"nodeId":"m_n_0_6_0__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_5_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_10":{"id":"n_0_10","type":"receive","args":{"busName":"base-freq"},"sources":{},"sinks":{"0":[{"nodeId":"n_0_11","portletId":"0"},{"nodeId":"n_ioSnd_n_0_10_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_16":{"id":"n_0_16","type":"receive","args":{"busName":"base-freq"},"sources":{},"sinks":{"0":[{"nodeId":"n_0_18","portletId":"0"},{"nodeId":"n_ioSnd_n_0_16_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_21":{"id":"n_0_21","type":"receive","args":{"busName":"base-freq"},"sources":{},"sinks":{"0":[{"nodeId":"n_0_23","portletId":"0"},{"nodeId":"n_ioSnd_n_0_21_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_33":{"id":"n_0_33","type":"receive","args":{"busName":"tram-load"},"sources":{},"sinks":{"0":[{"nodeId":"n_0_34","portletId":"0"},{"nodeId":"n_ioSnd_n_0_33_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_36":{"id":"n_0_36","type":"receive","args":{"busName":"tram-load"},"sources":{},"sinks":{"0":[{"nodeId":"n_0_37","portletId":"0"},{"nodeId":"n_ioSnd_n_0_36_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_41":{"id":"n_0_41","type":"receive","args":{"busName":"pulse-freq"},"sources":{},"sinks":{"0":[{"nodeId":"m_n_0_42_0__routemsg","portletId":"0"},{"nodeId":"n_ioSnd_n_0_41_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_44":{"id":"n_0_44","type":"receive","args":{"busName":"pulse-depth"},"sources":{},"sinks":{"0":[{"nodeId":"n_0_42","portletId":"1"},{"nodeId":"n_ioSnd_n_0_44_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true},"n_0_46":{"id":"n_0_46","type":"receive","args":{"busName":"trams-count"},"sources":{},"sinks":{"0":[{"nodeId":"n_0_47","portletId":"0"},{"nodeId":"n_ioSnd_n_0_46_0","portletId":"0"}]},"inlets":{},"outlets":{"0":{"type":"message","id":"0"}},"isPushingMessages":true}},"pdGui":[{"nodeClass":"control","patchId":"0","pdNodeId":"29","nodeId":"n_0_29"},{"nodeClass":"control","patchId":"0","pdNodeId":"32","nodeId":"n_0_32"}]},"settings":{"audio":{"bitDepth":64,"channelCount":{"in":2,"out":2},"sampleRate":0,"blockSize":0},"io":{"messageReceivers":{"n_0_29":["0"],"n_0_32":["0"],"n_0_4":["0"],"n_0_35":["0"],"n_0_38":["0"],"n_0_45":["0"],"n_0_49":["0"]},"messageSenders":{"n_0_29":["0"],"n_0_32":["0"],"n_0_5":["0"],"n_0_10":["0"],"n_0_16":["0"],"n_0_21":["0"],"n_0_33":["0"],"n_0_36":["0"],"n_0_41":["0"],"n_0_44":["0"],"n_0_46":["0"]}}},"compilation":{"variableNamesIndex":{"io":{"messageReceivers":{"n_0_29":{"0":"IO_rcv_n_0_29_0"},"n_0_32":{"0":"IO_rcv_n_0_32_0"},"n_0_4":{"0":"IO_rcv_n_0_4_0"},"n_0_35":{"0":"IO_rcv_n_0_35_0"},"n_0_38":{"0":"IO_rcv_n_0_38_0"},"n_0_45":{"0":"IO_rcv_n_0_45_0"},"n_0_49":{"0":"IO_rcv_n_0_49_0"}},"messageSenders":{"n_0_29":{"0":"IO_snd_n_0_29_0"},"n_0_32":{"0":"IO_snd_n_0_32_0"},"n_0_5":{"0":"IO_snd_n_0_5_0"},"n_0_10":{"0":"IO_snd_n_0_10_0"},"n_0_16":{"0":"IO_snd_n_0_16_0"},"n_0_21":{"0":"IO_snd_n_0_21_0"},"n_0_33":{"0":"IO_snd_n_0_33_0"},"n_0_36":{"0":"IO_snd_n_0_36_0"},"n_0_41":{"0":"IO_snd_n_0_41_0"},"n_0_44":{"0":"IO_snd_n_0_44_0"},"n_0_46":{"0":"IO_snd_n_0_46_0"}}},"globals":{"commons":{"getArray":"G_commons_getArray","setArray":"G_commons_setArray"}}}}},
            initialize: (sampleRate, blockSize) => {
                exports.metadata.settings.audio.sampleRate = sampleRate
                exports.metadata.settings.audio.blockSize = blockSize
                SAMPLE_RATE = sampleRate
                BLOCK_SIZE = blockSize

                G_commons_waitFrame(0, () => N_n_0_1_rcvs_0(G_bangUtils_bang()))

            N_n_0_1_state.snd0 = N_n_0_2_rcvs_0
            N_n_0_1_state.sampleRatio = computeUnitInSamples(SAMPLE_RATE, 1, "msec")
            NT_metro_setRate(N_n_0_1_state, 10)
            N_n_0_1_state.tickCallback = function () {
                NT_metro_scheduleNextTick(N_n_0_1_state)
            }
        

            NT_float_setValue(N_n_0_2_state, 0)
        

            NT_add_setLeft(N_n_0_3_state, 0)
            NT_add_setRight(N_n_0_3_state, 1)
        

            NT_div_setLeft(N_n_0_8_state, 0)
            NT_div_setRight(N_n_0_8_state, 100)
        

            N_n_0_9_state.floatInputs.set(0, 0)
            
        


            G_msgBuses_subscribe("base-freq", N_n_0_5_snds_0)
        




            G_msgBuses_subscribe("base-freq", N_n_0_10_snds_0)
        

            NT_mul_setLeft(N_n_0_11_state, 0)
            NT_mul_setRight(N_n_0_11_state, 2)
        




            G_msgBuses_subscribe("base-freq", N_n_0_16_snds_0)
        

            NT_mul_setLeft(N_n_0_18_state, 0)
            NT_mul_setRight(N_n_0_18_state, 3)
        




            G_msgBuses_subscribe("base-freq", N_n_0_21_snds_0)
        

            NT_mul_setLeft(N_n_0_23_state, 0)
            NT_mul_setRight(N_n_0_23_state, 6)
        




                N_n_0_29_state.messageSender = N_n_0_29_snds_0
                N_n_0_29_state.messageReceiver = function (m) {
                    NT_vsl_receiveMessage(N_n_0_29_state, m)
                }
                NT_vsl_setReceiveBusName(N_n_0_29_state, "empty")
    
                
            


            N_n_0_32_state.messageReceiver = function (m) {
                NT_floatatom_receiveMessage(N_n_0_32_state, m)
            }
            N_n_0_32_state.messageSender = N_n_0_32_snds_0
            NT_floatatom_setReceiveBusName(N_n_0_32_state, "empty")
        



            G_msgBuses_subscribe("tram-load", N_n_0_33_snds_0)
        

            NT_mul_setLeft(N_n_0_34_state, 0)
            NT_mul_setRight(N_n_0_34_state, 0.5)
        



            G_msgBuses_subscribe("tram-load", N_n_0_36_snds_0)
        

            NT_mul_setLeft(N_n_0_37_state, 0)
            NT_mul_setRight(N_n_0_37_state, 1.5)
        

            NT_add_setLeft(N_n_0_50_state, 0)
            NT_add_setRight(N_n_0_50_state, 1.5)
        



            G_msgBuses_subscribe("pulse-freq", N_n_0_41_snds_0)
        




            G_msgBuses_subscribe("pulse-depth", N_n_0_44_snds_0)
        

            NT_osc_t_setStep(N_n_0_42_state, 0)
        


            G_msgBuses_subscribe("trams-count", N_n_0_46_snds_0)
        

            NT_div_setLeft(N_n_0_47_state, 0)
            NT_div_setRight(N_n_0_47_state, 3)
        











            NT_osc_t_setStep(N_n_0_6_state, 0)
        



            NT_osc_t_setStep(N_n_0_12_state, 0)
        




            NT_osc_t_setStep(N_n_0_17_state, 0)
        










        NT_receive_t_setBusName(N_n_0_30_state, "pulse-mod")
    









        NT_send_t_setBusName(N_n_0_40_state, "pulse-mod")
    
                COLD_0(G_msg_EMPTY_MESSAGE)
COLD_1(G_msg_EMPTY_MESSAGE)
COLD_2(G_msg_EMPTY_MESSAGE)
COLD_3(G_msg_EMPTY_MESSAGE)
COLD_4(G_msg_EMPTY_MESSAGE)
COLD_5(G_msg_EMPTY_MESSAGE)
COLD_6(G_msg_EMPTY_MESSAGE)
            },
            dspLoop: (INPUT, OUTPUT) => {
                
        for (IT_FRAME = 0; IT_FRAME < BLOCK_SIZE; IT_FRAME++) {
            G_commons__emitFrame(FRAME)
            
                N_n_0_6_outs_0 = Math.cos(N_n_0_6_state.phase)
                N_n_0_6_state.phase += N_n_0_6_state.step
            

                N_n_0_12_outs_0 = Math.cos(N_n_0_12_state.phase)
                N_n_0_12_state.phase += N_n_0_12_state.step
            

                N_n_0_17_outs_0 = Math.cos(N_n_0_17_state.phase)
                N_n_0_17_state.phase += N_n_0_17_state.step
            
N_n_0_25_state.previous = N_n_0_25_outs_0 = N_n_0_25_state.coeff * N_m_n_0_25_0_sig_outs_0 + (1 - N_n_0_25_state.coeff) * N_n_0_25_state.previous

            N_n_0_28_state.current = ((((((N_n_0_6_outs_0 * (N_m_n_0_7_1_sig_state.currentValue)) + (N_n_0_12_outs_0 * (N_m_n_0_13_1_sig_state.currentValue))) + (N_n_0_17_outs_0 * (N_m_n_0_19_1_sig_state.currentValue))) + N_n_0_25_outs_0) * (N_m_n_0_27_1_sig_state.currentValue)) * (G_sigBuses_read(N_n_0_30_state.busName))) + N_n_0_28_state.coeff * N_n_0_28_state.previous
            N_n_0_28_outs_0 = N_n_0_28_state.normal * (N_n_0_28_state.current - N_n_0_28_state.previous)
            N_n_0_28_state.previous = N_n_0_28_state.current
        
OUTPUT[0][IT_FRAME] = N_n_0_28_outs_0
OUTPUT[1][IT_FRAME] = N_n_0_28_outs_0

                N_n_0_42_outs_0 = Math.cos(N_n_0_42_state.phase)
                N_n_0_42_state.phase += N_n_0_42_state.step
            

        G_sigBuses_set(N_n_0_40_state.busName, ((N_n_0_42_outs_0 * (N_m_n_0_43_1_sig_state.currentValue)) + (N_m_n_0_39_1_sig_state.currentValue)))
    
            FRAME++
        }
    
            },
            io: {
                messageReceivers: {
                    n_0_29: {
                            "0": IO_rcv_n_0_29_0,
                        },
n_0_32: {
                            "0": IO_rcv_n_0_32_0,
                        },
n_0_4: {
                            "0": IO_rcv_n_0_4_0,
                        },
n_0_35: {
                            "0": IO_rcv_n_0_35_0,
                        },
n_0_38: {
                            "0": IO_rcv_n_0_38_0,
                        },
n_0_45: {
                            "0": IO_rcv_n_0_45_0,
                        },
n_0_49: {
                            "0": IO_rcv_n_0_49_0,
                        },
                },
                messageSenders: {
                    n_0_29: {
                            "0": () => undefined,
                        },
n_0_32: {
                            "0": () => undefined,
                        },
n_0_5: {
                            "0": () => undefined,
                        },
n_0_10: {
                            "0": () => undefined,
                        },
n_0_16: {
                            "0": () => undefined,
                        },
n_0_21: {
                            "0": () => undefined,
                        },
n_0_33: {
                            "0": () => undefined,
                        },
n_0_36: {
                            "0": () => undefined,
                        },
n_0_41: {
                            "0": () => undefined,
                        },
n_0_44: {
                            "0": () => undefined,
                        },
n_0_46: {
                            "0": () => undefined,
                        },
                },
            }
        }

        
exports.G_commons_getArray = G_commons_getArray
exports.G_commons_setArray = G_commons_setArray
    