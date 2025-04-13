import socket
import sys
import time
import statistics # For calculating stats like mean, stdev

# --- Configuration ---
ESP32_IP = "192.168.4.1"  # Default IP address of ESP32 in AP mode
ESP32_PORT = 8080         # The port the ESP32 server is listening on
BUFFER_SIZE = 1           # Receive data 1 byte at a time
MEASUREMENT_DURATION_SEC = 10.0 # How long to measure for
# -------------------

print(f"Attempting to connect to ESP32 at {ESP32_IP}:{ESP32_PORT}...")
print(f"Will measure inter-packet delays for {MEASUREMENT_DURATION_SEC} seconds.")

arrival_times = [] # List to store timestamps of received bits

# Create a TCP/IP socket
try:
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.settimeout(10) # Connection timeout
    client_socket.connect((ESP32_IP, ESP32_PORT))
    client_socket.settimeout(1) # Shorter timeout for recv during measurement

    print("Connection successful! Receiving data...")
    print("Measurement started. Press Ctrl+C to stop early.")

    start_time = time.perf_counter() # High-resolution timer start
    last_print_time = start_time

    # Loop to receive data for the specified duration
    while True:
        current_time = time.perf_counter()
        elapsed_time = current_time - start_time

        # Check if measurement duration is over
        if elapsed_time >= MEASUREMENT_DURATION_SEC:
            print(f"\n[INFO] {MEASUREMENT_DURATION_SEC:.1f} seconds elapsed. Stopping data reception.")
            break

        try:
            # Receive data from the server
            data_bytes = client_socket.recv(BUFFER_SIZE)
            reception_time = time.perf_counter() # Record time immediately after recv returns

            if not data_bytes:
                print("\n[INFO] Connection closed by the ESP32 server during measurement.")
                break

            # Store the reception timestamp
            arrival_times.append(reception_time)

            # Decode and print the character
            data_char = data_bytes.decode('utf-8')
            print(data_char, end='', flush=True)


        except socket.timeout:
            # It's okay to timeout briefly, just means no data arrived
            # within the 1-second recv timeout. Continue the loop
            # until the main MEASUREMENT_DURATION_SEC is reached.
            # Check if the overall connection seems dead (e.g., no data for 5s)
             if current_time - (arrival_times[-1] if arrival_times else start_time) > 5.0:
                 print("\n[WARN] No data received for 5 seconds. Assuming connection lost.")
                 break
             continue # Continue waiting for data if measurement time isn't up
        except socket.error as e:
            print(f"\n[ERROR] Socket error during receiving: {e}")
            break
        except KeyboardInterrupt:
            print("\n[INFO] Measurement stopped early by user.")
            break
        except Exception as e:
            print(f"\n[ERROR] An unexpected error occurred during reception: {e}")
            break

except socket.timeout:
    print(f"[ERROR] Connection attempt timed out. Could not connect to {ESP32_IP}:{ESP32_PORT}.")
    # Add specific troubleshooting tips as before
except socket.error as e:
    print(f"[ERROR] Socket error during connection: {e}")
except Exception as e:
    print(f"[ERROR] An unexpected error occurred during setup: {e}")
finally:
    # Ensure the socket is closed
    if 'client_socket' in locals() and client_socket:
        print("\n[INFO] Closing socket.")
        client_socket.close()

# --- Calculate and Print Statistics ---
print("\n--- Measurement Statistics ---")
if len(arrival_times) < 2:
    print("Not enough data received to calculate delays (need at least 2 packets).")
    print(f"Received {len(arrival_times)} packets in total.")
else:
    # Calculate delays (difference between consecutive arrival times)
    delays_sec = [arrival_times[i] - arrival_times[i-1] for i in range(1, len(arrival_times))]
    delays_ms = [d * 1000.0 for d in delays_sec] # Convert to milliseconds

    total_packets = len(arrival_times)
    total_delays_calculated = len(delays_ms)
    actual_duration = arrival_times[-1] - arrival_times[0] if arrival_times else 0

    print(f"Received {total_packets} packets.")
    print(f"Calculated {total_delays_calculated} inter-packet delays over ~{actual_duration:.3f} seconds.")

    # Calculate statistics
    avg_delay_ms = statistics.mean(delays_ms)
    min_delay_ms = min(delays_ms)
    max_delay_ms = max(delays_ms)
    median_delay_ms = statistics.median(delays_ms)
    if len(delays_ms) >= 2:
        stdev_delay_ms = statistics.stdev(delays_ms)
    else:
        stdev_delay_ms = 0 # Cannot calculate stdev with only one delay

    print(f"\nInter-Packet Delay (milliseconds):")
    print(f"  Average: {avg_delay_ms:.4f} ms")
    print(f"  Median:  {median_delay_ms:.4f} ms")
    print(f"  Min:     {min_delay_ms:.4f} ms")
    print(f"  Max:     {max_delay_ms:.4f} ms")
    print(f"  Std Dev: {stdev_delay_ms:.4f} ms")

    # Calculate average data rate based on actual measurement period
    if actual_duration > 0:
         avg_rate_pps = total_packets / actual_duration
         print(f"\nApproximate Average Rate: {avg_rate_pps:.2f} packets/second")


print("[INFO] Client script finished.")
