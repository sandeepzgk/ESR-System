import machine

amp_sd = machine.Pin(13, machine.Pin.OUT)
amp_sd.value(0)