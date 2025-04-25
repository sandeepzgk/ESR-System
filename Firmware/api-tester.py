#!/usr/bin/env python3
"""
Pico 2W API Tester
------------------
Tests all endpoints of the WiFi API on the Raspberry Pi Pico 2W audio playback system.
"""

import requests
import time
import sys
import argparse
import json

class PicoAPITester:
    def __init__(self, ip):
        self.base_url = f"http://{ip}"
        self.is_playing = False
        self.current_playback_end = 0
        
    def test_status(self):
        """Test the status endpoint"""
        print("\n--- Testing Status Endpoint ---")
        try:
            response = requests.get(f"{self.base_url}/status", timeout=5)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
                return True
            else:
                print(f"Error: Unexpected status code {response.status_code}")
                return False
        except Exception as e:
            print(f"Error: {e}")
            return False
            
    def test_leds(self):
        """Test the LED control endpoint"""
        print("\n--- Testing LED Control Endpoint ---")
        
        # Test each LED individually
        for led_num in range(1, 5):
            try:
                # Turn LED on
                print(f"\nTurning LED {led_num} ON")
                response = requests.get(f"{self.base_url}/led?num={led_num}&state=on", timeout=5)
                print(f"Status Code: {response.status_code}")
                if response.status_code == 200:
                    print(f"Response: {response.json()}")
                time.sleep(1)
                
                # Turn LED off
                print(f"Turning LED {led_num} OFF")
                response = requests.get(f"{self.base_url}/led?num={led_num}&state=off", timeout=5)
                print(f"Status Code: {response.status_code}")
                if response.status_code == 200:
                    print(f"Response: {response.json()}")
                time.sleep(0.5)
            except Exception as e:
                print(f"Error testing LED {led_num}: {e}")
        
        # Test all LEDs together
        try:
            print("\nTurning ALL LEDs ON")
            response = requests.get(f"{self.base_url}/led?num=0&state=on", timeout=5)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                print(f"Response: {response.json()}")
            time.sleep(1)
            
            print("Turning ALL LEDs OFF")
            response = requests.get(f"{self.base_url}/led?num=0&state=off", timeout=5)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                print(f"Response: {response.json()}")
        except Exception as e:
            print(f"Error testing all LEDs: {e}")
    
    def test_gain(self):
        """Test the gain control endpoint"""
        print("\n--- Testing Gain Control Endpoint ---")
        
        for gain_level in range(4):
            try:
                print(f"\nSetting gain to level {gain_level}")
                response = requests.get(f"{self.base_url}/gain?level={gain_level}", timeout=5)
                print(f"Status Code: {response.status_code}")
                if response.status_code == 200:
                    print(f"Response: {response.json()}")
                time.sleep(1)
            except Exception as e:
                print(f"Error setting gain to level {gain_level}: {e}")
    
    def play_audio(self, duration, volume):
        """Trigger audio playback and wait for completion"""
        if self.is_playing:
            print(f"Audio already playing. Will complete at {time.ctime(self.current_playback_end)}")
            # In a real implementation, we might wait or retry, but for testing purposes,
            # we'll just test if the device handles this correctly
            
        print(f"\nPlaying audio: duration={duration}s, volume={volume}")
        try:
            start_time = time.time()
            response = requests.get(f"{self.base_url}/play?duration={duration}&volume={volume}", timeout=5)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                print(f"Response: {response.json()}")
                
                # Mark as playing and calculate end time
                self.is_playing = True
                self.current_playback_end = time.time() + duration
                
                # Wait for playback to complete
                wait_time = duration + 0.5  # Add a small buffer
                print(f"Waiting {wait_time} seconds for playback to complete...")
                time.sleep(wait_time)
                
                self.is_playing = False
                print(f"Playback should be complete. Total elapsed time: {time.time() - start_time:.2f}s")
            else:
                print(f"Error: Unexpected status code {response.status_code}")
        except Exception as e:
            print(f"Error triggering audio playback: {e}")
    
    def test_concurrent_request(self):
        """Test what happens when a new request comes in during playback"""
        print("\n--- Testing Concurrent Play Requests ---")
        
        # Start a long playback
        print("Starting a 10-second playback")
        first_response = None
        try:
            start_time = time.time()
            first_response = requests.get(f"{self.base_url}/play?duration=10&volume=0.3", timeout=5)
            print(f"First request status code: {first_response.status_code}")
            if first_response.status_code == 200:
                print(f"First response: {first_response.json()}")
            
            # Wait 2 seconds and send a second request
            time.sleep(2)
            print("\nSending a second request after 2 seconds")
            second_response = requests.get(f"{self.base_url}/play?duration=3&volume=0.7", timeout=5)
            print(f"Second request status code: {second_response.status_code}")
            if second_response.status_code == 200:
                print(f"Second response: {second_response.json()}")
            
            # Wait for all playback to complete
            time.sleep(10)  # Wait long enough for both to be done
            print(f"All playback should be complete. Total elapsed time: {time.time() - start_time:.2f}s")
            
            print("\nCurrent behavior: Second request overwrites the first, but won't start until the first completes.")
            print("Recommendation: Consider explicitly rejecting concurrent requests with a 409 Conflict status code.")
            
        except Exception as e:
            print(f"Error testing concurrent requests: {e}")
    
    def test_playback_durations(self):
        """Test different playback durations"""
        print("\n--- Testing Different Playback Durations ---")
        
        # Test a short playback
        self.play_audio(1.0, 0.2)
        
        # Test a medium playback
        self.play_audio(3.0, 0.3)
        
        # Test a longer playback
        self.play_audio(5.0, 0.4)
    
    def test_all(self):
        """Run all tests"""
        print(f"Testing Pico 2W API at {self.base_url}")
        
        # First check if the device is reachable
        if not self.test_status():
            print("\nCould not connect to the device. Please check the IP and ensure the device is online.")
            return False
            
        # Test LED control
        self.test_leds()
        
        # Test gain control
        self.test_gain()
        
        # Test audio playback with different durations
        self.test_playback_durations()
        
        # Test concurrent requests
        self.test_concurrent_request()
        
        print("\n--- All tests completed ---")
        return True

def main():
    parser = argparse.ArgumentParser(description='Test Pico 2W WiFi API')
    parser.add_argument('--ip', type=str, default='192.168.86.215',
                        help='IP address of the Pico 2W (default: 192.168.86.215)')
    args = parser.parse_args()
    
    tester = PicoAPITester(args.ip)
    tester.test_all()

if __name__ == "__main__":
    main()