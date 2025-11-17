use std::time::{Duration, Instant};

use crate::domain::Trigger;

pub struct IntervalTrigger {
    interval: Duration,
    last: Option<Instant>,
}

impl IntervalTrigger {
    pub fn new(interval: Duration) -> Self {
        Self {
            interval,
            last: None,
        }
    }
}

impl Trigger for IntervalTrigger {
    fn should_fire(&mut self, now: Instant) -> bool {
        match self.last {
            None => {
                self.last = Some(now);
                true
            }
            Some(prev) => {
                if now.duration_since(prev) >= self.interval {
                    self.last = Some(now);
                    true
                } else {
                    false
                }
            }
        }
    }

    fn time_until_next_ms(&self, now: Instant) -> u64 {
        match self.last {
            None => 0, // Will fire immediately on first tick
            Some(prev) => {
                let elapsed = now.duration_since(prev);
                if elapsed >= self.interval {
                    0
                } else {
                    (self.interval - elapsed).as_millis() as u64
                }
            }
        }
    }
}
