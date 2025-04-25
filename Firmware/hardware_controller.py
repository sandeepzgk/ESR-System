from machine import Pin, I2S
import time, gc
import micropython

# --------------------
# fixed‑point scaler: in-place scale of signed 16‑bit samples
# scale a bytearray in-place, sample‑wise, with fixed-point Q15 volume
@micropython.viper
def _viper_scale16(buf: ptr8, n: int, vol_q15: int):
    i = int(0)
    # n = number of 16‑bit samples; buf is ptr8 to bytes
    while i < n:
        off = i * 2
        lo = buf[off]              # low byte
        hi = buf[off + 1]          # high byte
        raw = lo | (hi << 8)       # assemble little‑endian word
        # signed conversion
        if raw & 0x8000:
            s = raw - 0x10000
        else:
            s = raw
        # Q15 scale
        s = (s * vol_q15) >> 15
        # clamp
        if s < -32768:
            s = -32768
        elif s > 32767:
            s = 32767
        # write back
        v = s & 0xFFFF
        buf[off]     = v & 0xFF
        buf[off + 1] = (v >> 8) & 0xFF
        i += 1


# --------------------

class HardwareController:    
    def __init__(self, config):
        self.config = config
        self.audio = config["audio"]
        self.led = Pin(config["pins"]["led"], Pin.OUT)
        self.i2s = None

        self.dac_mute = Pin(config["pins"]["mute"], Pin.OUT)
        self.amp_gain0 = Pin(config["pins"]["amp_gain0"], Pin.OUT)
        self.amp_gain1 = Pin(config["pins"]["amp_gain1"], Pin.OUT)
        self.amp_sd = Pin(config["pins"]["amp_sd"], Pin.OUT)

    def blink_led(self, count):
        for _ in range(count):
            self.led.on()
            time.sleep(0.2)
            self.led.off()
            time.sleep(0.2)

    def enable_audio(self):
        """Enable audio output by unmuting DAC and enabling amplifier."""
        self.dac_mute.value(1)
        self.amp_sd.value(1)
        print("DAC and amplifier enabled")  

    def disable_audio(self):
        """Disable audio output by muting DAC and disabling amplifier."""
        self.dac_mute.value(0)
        self.amp_sd.value(0)
        print("DAC and amplifier disabled")

    def set_gain(self, gain_level):
        """
        Set amplifier gain level.
        gain_level: 0-3 (0: +20dB, 1: +26dB, 2: +32dB, 3: +36dB)
        """
        if gain_level < 0 or gain_level > 3:
            raise ValueError("Gain level must be between 0 and 3")
        self.amp_gain0.value(gain_level & 0x01)
        self.amp_gain1.value((gain_level >> 1) & 0x01)
        print(f"Amplifier gain set to level {gain_level}")        

    def initialize_i2s(self):
        """
        Initialize I2S interface with a DMA buffer sized in bytes.
        Uses 'dma_buffer_frames' (or falls back to 'buffer_length') and
        the pins from self.config["pins"].
        """
        # bytes per stereo frame = (bits per sample / 8) × 2 channels
        frame_size = (self.audio["bits_per_sample"] // 8) * 2

        # pick dma_buffer_frames if present, else buffer_length
        dma_frames = self.audio.get("dma_buffer_frames", self.audio["buffer_length"])
        ibuf_size = dma_frames * frame_size

        print(f"Initializing I2S: Using DMA buffer frames = {dma_frames} (ibuf = {ibuf_size} bytes)")

        pins = self.config["pins"]
        # id=0 must be passed positionally; pins come in as keywords
        self.i2s = I2S(
            0,                           # I2S peripheral ID as positional
            sck=Pin(pins["bck"]),        # BCK (bit clock)
            ws=Pin(pins["lrck"]),        # LRCK / WS (word select)
            sd=Pin(pins["data"]),        # SD (serial data)
            mode=I2S.TX,
            bits=self.audio["bits_per_sample"],
            format=I2S.STEREO,
            rate=self.audio["sample_rate"],
            ibuf=ibuf_size
        )


    def play_audio(self,
                   wave_generator,
                   playback_frames=None,
                   aggregate_count=16,
                   debug=False,
                   duration_seconds=None,
                   volume: float = 1.0):
        """
        volume: float in [0.0, 1.0]
        """
        import gc, time

        # pre‑compute integer Q15 volume
        vol_q15 = int(volume * 32767)

        # 1) determine frames per write
        if playback_frames is None:
            playback_frames = self.audio.get(
                "playback_frames",
                self.audio["buffer_length"]
            )

        # 2) init I2S if needed
        if self.i2s is None:
            self.initialize_i2s()

        # 3) free memory & enable audio
        gc.collect()
        self.enable_audio()

        # 4) fixed‑duration?
        if duration_seconds is not None:
            duration_ms = int(duration_seconds * 1000)
            start_ms = time.ticks_ms()

        # 5) pre‑fill 4 buffers
        for i in range(4):
            # always get a fresh bytearray so we can mutate it
            raw = wave_generator.generate_buffer(playback_frames)
            buf = bytearray(raw)
            if vol_q15 != 32767:
                _viper_scale16(buf, len(buf) // 2, vol_q15)
            written = self.i2s.write(buf)
            if debug:
                print(f"[DEBUG] Pre‑fill #{i+1}: wrote {written}/{len(buf)} bytes")

        last_loop = time.ticks_ms()
        write_count = 0
        total_dt    = 0

        print(f"Starting audio output{' for '+str(duration_seconds)+'s' if duration_seconds else ''}...")
        try:
            while (duration_seconds is None or
                   time.ticks_diff(time.ticks_ms(), start_ms) < duration_ms):

                ws = time.ticks_ms()

                # pull & scale each chunk
                raw = wave_generator.generate_buffer(playback_frames)
                buf = bytearray(raw)
                if vol_q15 != 32767:
                    _viper_scale16(buf, len(buf) // 2, vol_q15)

                written = self.i2s.write(buf)
                we = time.ticks_ms()
                dt  = time.ticks_diff(we, ws)
                gap = time.ticks_diff(we, last_loop)
                last_loop = we
                write_count += 1
                total_dt   += dt

                if debug:
                    print(f"[DIAG] Write#{write_count}: dt={dt}ms, gap={gap}ms, "
                        f"bytes={written}, free={gc.mem_free()}")

                # if I2S didn’t accept the full buffer, give it a moment
                expected = (aggregate_count
                            * playback_frames
                            * ((self.audio['bits_per_sample'] // 8) * 2))
                if written < expected:
                    if debug:
                        print("[DIAG] Incomplete write → sleep 5 ms")
                    time.sleep_ms(2)

                # every 100 writes, print the average
                if write_count % 100 == 0:
                    avg = total_dt / write_count
                    print(f"[DIAG] Avg write over {write_count} cycles: {avg:.2f} ms")

                if gc.mem_free() < 10000:
                    gc.collect()

        except KeyboardInterrupt:
            print("Audio playback interrupted by user")
        except Exception as e:
            print(f"Error during audio playback: {e}")
        finally:
            self.disable_audio()
