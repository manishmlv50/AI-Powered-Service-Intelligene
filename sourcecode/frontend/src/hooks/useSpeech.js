import { useRef, useState, useCallback } from 'react'

const WS_URL = () => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${window.location.host}/api/speech/ws/transcribe`
}

const TARGET_SR = 16000
const BUFFER_SIZE = 4096

export function useSpeech({ onPartial, onFinal } = {}) {
    const [recording, setRecording] = useState(false)
    const [error, setError] = useState(null)

    const wsRef = useRef(null)
    const ctxRef = useRef(null)
    const procRef = useRef(null)
    const srcRef = useRef(null)
    const streamRef = useRef(null)

    const downsample = (buf, inSR, outSR) => {
        if (outSR >= inSR) return buf
        const ratio = inSR / outSR
        const out = new Float32Array(Math.round(buf.length / ratio))
        for (let i = 0; i < out.length; i++) {
            const next = Math.round((i + 1) * ratio)
            let sum = 0, count = 0
            for (let j = Math.round(i * ratio); j < next && j < buf.length; j++) { sum += buf[j]; count++ }
            out[i] = sum / count
        }
        return out
    }

    const toInt16 = f32 => {
        const out = new Int16Array(f32.length)
        for (let i = 0; i < f32.length; i++) {
            const s = Math.max(-1, Math.min(1, f32[i]))
            out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
        }
        return out
    }

    const start = useCallback(async () => {
        setError(null)
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: TARGET_SR })
            srcRef.current = ctxRef.current.createMediaStreamSource(streamRef.current)
            procRef.current = ctxRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1)

            procRef.current.onaudioprocess = e => {
                const raw = e.inputBuffer.getChannelData(0)
                const ds = downsample(raw, ctxRef.current.sampleRate, TARGET_SR)
                const pcm = toInt16(ds)
                if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(pcm.buffer)
            }
            srcRef.current.connect(procRef.current)
            procRef.current.connect(ctxRef.current.destination)

            wsRef.current = new WebSocket(WS_URL())
            wsRef.current.binaryType = 'arraybuffer'
            wsRef.current.onmessage = e => {
                const msg = JSON.parse(e.data)
                if (msg.type === 'partial' && onPartial) onPartial(msg.text)
                if (msg.type === 'final' && onFinal) onFinal(msg.text)
            }
            wsRef.current.onopen = () => setRecording(true)
            wsRef.current.onclose = () => setRecording(false)
        } catch (err) {
            setError(err.message || 'Microphone access failed')
        }
    }, [onPartial, onFinal])

    const stop = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send('__flush__')
            wsRef.current.close()
        }
        procRef.current?.disconnect()
        srcRef.current?.disconnect()
        ctxRef.current?.close()
        streamRef.current?.getTracks().forEach(t => t.stop())
        setRecording(false)
    }, [])

    return { recording, error, start, stop }
}
