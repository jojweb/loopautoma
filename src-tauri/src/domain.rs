use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

// Basic geometry and region types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Rect {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Region {
    pub id: String,
    pub rect: Rect,
    pub name: Option<String>,
}

// Events flowing through the system (minimal for MVP)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Event {
    TriggerFired,
    ConditionEvaluated { result: bool },
    ActionStarted { action: String },
    ActionCompleted { action: String, success: bool },
    MonitorStateChanged { state: MonitorState },
    WatchdogTripped { reason: String },
    Error { message: String },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MonitorState { Stopped, Running, Stopping }

// Traits
pub trait Trigger {
    fn should_fire(&mut self, now: Instant) -> bool;
}

pub trait ScreenCapture {
    // A fast hash of a region (already downscaled by the impl as appropriate)
    fn hash_region(&self, region: &Region, downscale: u32) -> u64;
}

pub trait Condition {
    fn evaluate(&mut self, now: Instant, regions: &[Region], capture: &dyn ScreenCapture) -> bool;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MouseButton { Left, Right, Middle }

pub trait Automation {
    fn move_cursor(&self, x: u32, y: u32) -> Result<(), String>;
    fn click(&self, button: MouseButton) -> Result<(), String>;
    fn type_text(&self, text: &str) -> Result<(), String>;
    fn key(&self, key: &str) -> Result<(), String>;
}

pub trait Action {
    fn name(&self) -> &'static str;
    fn execute(&self, automation: &dyn Automation) -> Result<(), String>;
}

pub struct ActionSequence {
    pub actions: Vec<Box<dyn Action + Send + Sync>>, // keep it simple for now
}

impl ActionSequence {
    pub fn new(actions: Vec<Box<dyn Action + Send + Sync>>) -> Self { Self { actions } }

    pub fn run(&self, automation: &dyn Automation, events: &mut Vec<Event>) -> bool {
        for a in &self.actions {
            events.push(Event::ActionStarted { action: a.name().to_string() });
            match a.execute(automation) {
                Ok(()) => events.push(Event::ActionCompleted { action: a.name().to_string(), success: true }),
                Err(e) => {
                    events.push(Event::Error { message: format!("action '{}': {}", a.name(), e) });
                    events.push(Event::ActionCompleted { action: a.name().to_string(), success: false });
                    return false;
                }
            }
        }
        true
    }
}

// Guardrails
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Guardrails {
    pub cooldown: Duration,
    pub max_runtime: Option<Duration>,
    pub max_activations_per_hour: Option<u32>,
}

impl Default for Guardrails {
    fn default() -> Self {
        Self { cooldown: Duration::from_millis(0), max_runtime: None, max_activations_per_hour: None }
    }
}

// Minimal Profile model for JSON persistence
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub regions: Vec<Region>,
    // Simplified descriptors for MVP; full registry mapping later
    pub trigger: TriggerConfig,
    pub condition: ConditionConfig,
    pub actions: Vec<ActionConfig>,
    pub guardrails: Option<GuardrailsConfig>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TriggerConfig { pub r#type: String, pub interval_ms: u64 }

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ConditionConfig { pub r#type: String, pub stable_ms: u64, pub downscale: u32 }

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ActionConfig {
    MoveCursor { x: u32, y: u32 },
    Click { button: MouseButton },
    Type { text: String },
    Key { key: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GuardrailsConfig { pub max_runtime_ms: Option<u64>, pub max_activations_per_hour: Option<u32>, pub cooldown_ms: u64 }
