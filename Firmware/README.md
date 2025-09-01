## Firmware : Pico 2W Audio Playback and Control

### 1) Overview
Firmware for a Raspberry Pi Pico W/2W running MicroPython to:
- Serve a simple HTTP API over Wi‑Fi for play/gain/LED/status
- Stream stereo PCM audio over I2S to a DAC and class‑D amplifier
- Read raw PCM from on‑device storage with triple‑buffering

Key modules
- main.py : boots Wi‑Fi and hardware, polls for requests, and drives playback
- network_controller.py : Wi‑Fi connect with exponential backoff; simple HTTP server; thread‑safe request passing
- hardware_controller.py : I2S init, DAC/amp control, LED control; in‑place Q15 volume scaling via a @micropython.viper function
- wav_file_player.py : RawFilePlayer: triple‑buffered raw PCM reader with wrap‑around
- config.json : pins, audio parameters (sample_rate, bits, buffer sizes), Wi‑Fi creds
- boot.py : ensures the amplifier shutdown pin is safe on boot
- misc/ : api-tester.py (exercise endpoints), wave-converter.py (WAV→RAW tool)

HTTP endpoints
- GET /play?duration=SECONDS&volume=0.0..1.0 : queue a fixed‑duration playback
- GET /gain?level=0..3 : set amplifier gain pins
- GET /led?num=0..4&state=on|off : control LEDs (0 = all)
- GET /status : return Wi‑Fi/server state and IP

Audio path
- I2S configured from config["audio"] (rate, bits, DMA/buffer sizes)
- Raw PCM file read in fixed‑size frames, scaled in‑place to Q15, written to I2S


### 2) How to deploy / run on hardware
Prerequisites
- Raspberry Pi Pico W/2W flashed with MicroPython
- A RAW PCM file on the device (default filename: my_sound.raw)
- Correct wiring for I2S BCK/LRCK/DATA to the DAC and amp control pins per config.json

Steps
1) Configure
- Edit Firmware/config.json: set network.ssid/password; verify pins and audio settings
- Optionally change audio.playback_frames/dma_buffer_frames for your I2S driver
2) Copy files to the board
- Copy all Firmware/*.py and config.json to the device (e.g., Thonny, mpremote)
- Copy your RAW audio file as my_sound.raw (or update main.py accordingly)
3) Boot and run
- Reset the board; boot.py sets amp shutdown low; main() starts automatically if invoked
- The Wi‑Fi controller runs on the second core/thread and starts the HTTP server
4) Invoke playback (examples)
- curl "http://<PICO_IP>/play?duration=5&volume=0.5"
- curl "http://<PICO_IP>/gain?level=2"
- curl "http://<PICO_IP>/led?num=0&state=on"; curl "http://<PICO_IP>/status"

Converting WAV to RAW
- Use Firmware/misc/wave-converter.py to resample/convert WAV → interleaved RAW matching config["audio"]


### 3) Where it has been tested
- On Raspberry Pi Pico 2W hardware with MicroPython (RP2040 + Wi‑Fi)
- Exercised via misc/api-tester.py and curl from a local network
- Exact MicroPython version and DAC/amp models depend on your setup; pins are configurable


### 4) History and rationale (commit highlights)
- 3d118a1 (Firmware): Initial firmware: I2S + Wi‑Fi + raw file player; simple HTTP API to decouple host and device
- c961120 (misc tools): Added wave-converter.py and moved api-tester under misc for easier audio prep and endpoint testing

Design choices
- Fixed‑point Q15 scaling in a @micropython.viper routine for fast per‑buffer volume without floating point
- Exponential backoff Wi‑Fi connect with LED signaling for robustness
- Triple‑buffer file reader to minimize glitches while looping
- Config‑driven pins/buffers so firmware can be tuned without code changes


### 5) Brief technical summary
- Platform: MicroPython on RP2040 (Pico W/2W) with _thread concurrency
- Peripherals: machine.I2S TX; GPIOs for DAC mute, amp gain (2 bits), amp shutdown, LEDs
- Networking: network + sockets, simple GET API, cooperative loop with short timeouts
- Audio: raw interleaved PCM, DMA‑sized I2S buffer, optional playback_frames override
- Synchronization: lock‑protected request queue (play/gain), state flags to reject concurrent play

