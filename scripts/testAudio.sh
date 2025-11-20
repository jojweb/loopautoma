#!/usr/bin/env bash
# Quick test of audio playback using loopautoma's audio module

set -e

echo "Testing audio playback..."
echo "This will play two tones:"
echo "1. Intervention tone (880 Hz for 200ms)"
echo "2. Completion tone (440 Hz for 300ms)"
echo ""

cd "$(dirname "$0")/../src-tauri"

# Create a temporary test program
cat > /tmp/audio_test.rs << 'EOF'
use loopautoma_lib::audio::{AudioNotifier, create_audio_notifier};

fn main() -> Result<(), String> {
    println!("Creating audio notifier...");
    let notifier = create_audio_notifier()?;
    
    println!("Playing intervention sound (880 Hz)...");
    notifier.play_intervention_needed()?;
    
    println!("Waiting 500ms...");
    std::thread::sleep(std::time::Duration::from_millis(500));
    
    println!("Playing completion sound (440 Hz)...");
    notifier.play_profile_ended()?;
    
    println!("Audio test complete!");
    Ok(())
}
EOF

# Build and run the test
echo "Building test program..."
rustc --edition 2021 \
    -L target/debug/deps \
    --extern loopautoma_lib=target/debug/libloopautoma_lib.rlib \
    --extern rodio=target/debug/deps/librodio-*.rlib \
    /tmp/audio_test.rs -o /tmp/audio_test

echo ""
echo "Running audio test..."
/tmp/audio_test

echo ""
echo "If you heard two beeps (high then low), audio is working!"
