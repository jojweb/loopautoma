use std::collections::HashMap;
use std::time::{Duration, Instant};

use crate::domain::{Condition, Region, ScreenCapture};

pub struct RegionCondition {
    stable_ms: Duration,
    downscale: u32,
    // Track per-region last hash and last change time
    last: HashMap<String, (u64, Instant)>,
}

impl RegionCondition {
    pub fn new(stable_ms: Duration, downscale: u32) -> Self {
        Self {
            stable_ms,
            downscale: downscale.max(1),
            last: HashMap::new(),
        }
    }
}

impl Condition for RegionCondition {
    fn evaluate(&mut self, now: Instant, regions: &[Region], capture: &dyn ScreenCapture) -> bool {
        let mut all_stable = true;
        for r in regions {
            let h = capture.hash_region(r, self.downscale);
            match self.last.get_mut(&r.id) {
                None => {
                    // First observation: set change time to now and consider not yet stable
                    self.last.insert(r.id.clone(), (h, now));
                    all_stable = false;
                }
                Some((prev_h, last_change)) => {
                    if *prev_h != h {
                        *prev_h = h;
                        *last_change = now;
                        all_stable = false;
                    } else {
                        // unchanged; stable if duration exceeds stable_ms
                        if now.duration_since(*last_change) < self.stable_ms {
                            all_stable = false;
                        }
                    }
                }
            }
        }
        all_stable
    }
}
