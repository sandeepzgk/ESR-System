import network
import socket
import time
import json
import _thread
from machine import Pin
import gc

class WiFiController:
    def __init__(self, config):
        self.config = config
        self.network_config = config.get("network", {})
        self.ssid = self.network_config.get("ssid", "")
        self.password = self.network_config.get("password", "")
        self.server_port = self.network_config.get("server_port", 80)
        
        # Reconnection parameters
        self.max_retries = self.network_config.get("max_retries", 10)
        self.initial_retry_delay = self.network_config.get("initial_retry_delay_ms", 500)
        self.max_retry_delay = self.network_config.get("max_retry_delay_ms", 30000)
        self.backoff_factor = self.network_config.get("backoff_factor", 2)

        # State variables
        self.wifi_connected = False
        self.server_running = False
        self.audio_playing = False
        
        # Initialize shared resources and synchronization
        self.play_request_lock = _thread.allocate_lock()
        self.play_request = None
        self.gain_request = None
        
        # LEDs - get pin numbers from config
        pins = config.get("pins", {})
        self.leds = [
            Pin(pins.get("led1", 22), Pin.OUT),  # LED 1
            Pin(pins.get("led2", 20), Pin.OUT),  # LED 2
            Pin(pins.get("led3", 18), Pin.OUT),  # LED 3
            Pin(pins.get("led4", 16), Pin.OUT),  # LED 4
        ]
        
        # Wait briefly before WiFi initialization
        time.sleep(1)

        # Initialize WiFi interface
        self.wlan = network.WLAN(network.STA_IF)
        self.wlan.active(True)
        
        time.sleep(1)  # Wait for the interface to be active
    
    def set_led(self, led_num, state):
        """Control a specific LED by number (1-4)"""
        #print(f"Setting LED {led_num} to {'ON' if state else 'OFF'}")
        if 0 <= led_num <= 4:
            self.leds[led_num-1].value(1 if state else 0)
        else:
            print(f"Invalid LED number: {led_num}")
    
    def set_all_leds(self, state):
        """Set all LEDs to the same state"""
        for led in self.leds:
            led.value(1 if state else 0)
    
    def blink_all_leds(self, count, interval_ms=500):
        """Blink all LEDs a specified number of times"""
        for _ in range(count):
            self.set_all_leds(True)
            time.sleep_ms(interval_ms)
            self.set_all_leds(False)
            time.sleep_ms(interval_ms)

    def connect_wifi(self):
        """Connect to WiFi with exponential backoff and improved error handling"""
        try:
            if not self.ssid or not self.password:
                print("WiFi credentials not configured")
                return False
            
            print(f"Connecting to WiFi: {self.ssid}")
            print(f"Memory before connect: {gc.mem_free()} bytes")  # Add memory check
            retry_count = 0
            retry_delay = self.initial_retry_delay
            
            while retry_count < self.max_retries:
                # First try
                if retry_count == 0:
                    print("Calling wlan.connect()...")
                    self.wlan.connect(self.ssid, self.password)
                    print("After wlan.connect() call")
                    status = self.wlan.status()
                    print(f"WiFi status: {status}") 
                
                # Check connection status
                for i in range(10):  # Poll for up to 10*500ms = 5 seconds
                    print(f"Connection check {i+1}/10...")
                    if self.wlan.isconnected():
                        ip = self.wlan.ifconfig()[0]
                        print(f"Connected to WiFi. IP: {ip}")
                        self.wifi_connected = True
                        return True
                    time.sleep_ms(800)
                
                # If we got here, connection failed
                retry_count += 1
                print(f"Connection attempt {retry_count} failed")
                
                if retry_count >= self.max_retries:
                    print("Max retries reached. WiFi connection failed.")
                    break
                
                # Calculate next retry delay with exponential backoff
                retry_delay = min(retry_delay * self.backoff_factor, self.max_retry_delay)
                print(f"Retrying in {retry_delay}ms (attempt {retry_count+1}/{self.max_retries})")
                
                # Simple wait without LED blinking for testing
                time.sleep_ms(retry_delay)
            
            return False
        except Exception as e:
            print(f"Exception in connect_wifi: {e}")
            import sys
            sys.print_exception(e)  # Print full exception details
            return False   
    
    def start_server(self):
        """Start a simple HTTP server"""
        if not self.wifi_connected:
            print("Cannot start server: WiFi not connected")
            return False
        
        try:
            addr = socket.getaddrinfo('0.0.0.0', self.server_port)[0][-1]
            self.socket = socket.socket()
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.socket.bind(addr)
            self.socket.listen(1)
            
            print(f"Server started on port {self.server_port}")
            self.server_running = True
            return True
        except Exception as e:
            print(f"Failed to start server: {e}")
            return False
    
    def parse_request(self, request):
        """Parse an HTTP request and extract parameters"""
        try:
            # Extract the request line
            request_line = request.split('\r\n')[0]
            method, path, _ = request_line.split(' ')
            
            if method != 'GET':
                return {'error': 'Only GET requests are supported'}
            
            # Parse path and query parameters
            if '?' in path:
                path, query = path.split('?', 1)
                params = {}
                for param in query.split('&'):
                    if '=' in param:
                        key, value = param.split('=', 1)
                        params[key] = value
                return {'path': path, 'params': params}
            else:
                return {'path': path, 'params': {}}
        except Exception as e:
            print(f"Error parsing request: {e}")
            return {'error': 'Invalid request format'}
    
    def handle_request(self, client_sock, addr):
        """Handle an HTTP request from a client"""
        try:
            # Receive request
            request = client_sock.recv(1024).decode('utf-8')
            if not request:
                return
            
            # Parse the request
            parsed = self.parse_request(request)
            
            # Prepare response
            response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n"
            
            # Handle different endpoints
            if 'error' in parsed:
                response += json.dumps({'status': 'error', 'message': parsed['error']})

            elif parsed['path'] == '/play':
                # Handle play command
                duration = float(parsed['params'].get('duration', 5.0))
                volume = float(parsed['params'].get('volume', 0.5))
                
                # Check if audio is already playing
                with self.play_request_lock:
                    if self.audio_playing:
                        # Reject the request with 409 Conflict status
                        response = "HTTP/1.1 409 Conflict\r\nContent-Type: application/json\r\n\r\n"
                        response += json.dumps({
                            'status': 'error', 
                            'message': 'Audio already playing, request rejected'
                        })
                    else:
                        # Set play request and mark as playing
                        self.play_request = {
                            'duration': duration,
                            'volume': volume
                        }
                        self.audio_playing = True
                        
                        response += json.dumps({
                            'status': 'success', 
                            'message': f'Play request set: duration={duration}s, volume={volume}'
                        })
            
            elif parsed['path'] == '/led':
                # Handle LED control
                led_num = int(parsed['params'].get('num', 0))
                state = parsed['params'].get('state', 'off').lower() == 'on'
                
                if led_num == 0:  # Control all LEDs
                    self.set_all_leds(state)
                    response += json.dumps({'status': 'success', 'message': f'All LEDs set to {state}'})
                elif 1 <= led_num <= 4:
                    self.set_led(led_num, state)
                    response += json.dumps({'status': 'success', 'message': f'LED {led_num} set to {state}'})
                else:
                    response += json.dumps({'status': 'error', 'message': f'Invalid LED number: {led_num}'})
            
            elif parsed['path'] == '/gain':
                # Handle gain control (0-3)
                try:
                    gain_level = int(parsed['params'].get('level', 0))
                    if 0 <= gain_level <= 3:
                        # Set gain request using semaphore
                        with self.play_request_lock:
                            self.gain_request = gain_level
                        
                        response += json.dumps({
                            'status': 'success', 
                            'message': f'Gain level set to {gain_level}'
                        })
                    else:
                        response += json.dumps({
                            'status': 'error', 
                            'message': f'Invalid gain level: {gain_level}. Must be 0-3.'
                        })
                except ValueError:
                    response += json.dumps({
                        'status': 'error', 
                        'message': 'Gain level must be a number (0-3)'
                    })
            
            elif parsed['path'] == '/status':
                # Return system status
                response += json.dumps({
                    'status': 'success',
                    'wifi_connected': self.wifi_connected,
                    'server_running': self.server_running,
                    'ip_address': self.wlan.ifconfig()[0] if self.wifi_connected else 'Not connected'
                })
            
            else:
                # Unknown endpoint
                response += json.dumps({'status': 'error', 'message': f'Unknown endpoint: {parsed["path"]}'})
            
            # Send response
            client_sock.send(response)
        except Exception as e:
            print(f"Error handling request: {e}")
            try:
                client_sock.send("HTTP/1.1 500 Internal Server Error\r\n\r\n")
            except:
                pass
        finally:
            client_sock.close()
    
    def check_play_request(self):
        """Check if there's a pending play request, and return it if present"""
        with self.play_request_lock:
            request = self.play_request
            self.play_request = None
            return request
            
    def check_gain_request(self):
        """Check if there's a pending gain change request, and return it if present"""
        with self.play_request_lock:
            request = self.gain_request
            self.gain_request = None
            return request
    
    def server_loop(self):
        """Main server loop - accepts and processes client connections"""
        while True:
            if not self.wifi_connected:
                self.wifi_connected = self.connect_wifi()
                if not self.wifi_connected:
                    # Failed to connect - blink all LEDs as a warning
                    while not self.wifi_connected:
                        self.set_all_leds(True)
                        time.sleep_ms(500)
                        self.set_all_leds(False)
                        time.sleep_ms(500)
                        self.wifi_connected = self.connect_wifi()
            
            if self.wifi_connected and not self.server_running:
                self.server_running = self.start_server()
            
            if self.server_running:
                try:
                    # Set socket timeout to allow periodic reconnection check
                    self.socket.settimeout(1.0)
                    try:
                        client_sock, addr = self.socket.accept()
                        # Reset timeout for this client connection
                        client_sock.settimeout(3.0)
                        self.handle_request(client_sock, addr)
                    except OSError as e:
                        # Socket timeout - normal during accept()
                        pass
                    
                    # Briefly blink LED 1 to show server is running
                    self.set_led(3, True)
                    time.sleep_ms(50)
                    self.set_led(3, False)
                    
                    # Check if WiFi is still connected
                    if not self.wlan.isconnected():
                        print("WiFi connection lost")
                        self.wifi_connected = False
                        self.server_running = False
                        try:
                            self.socket.close()
                        except:
                            pass
                except Exception as e:
                    print(f"Server error: {e}")
                    self.server_running = False
            
            # Give other tasks a chance to run
            time.sleep_ms(50)
            gc.collect()  # Periodic garbage collection
    
    def start(self):
        """Start the WiFi controller in a new thread on the second core"""
        _thread.start_new_thread(self.server_loop, ())