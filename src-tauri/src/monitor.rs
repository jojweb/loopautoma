use std::time::Instant;

use crate::domain::{ActionSequence, Condition, Event, Guardrails, MonitorState, Trigger};

pub struct Monitor<'a> {
    pub trigger: Box<dyn Trigger + Send + 'a>,
    pub condition: Box<dyn Condition + Send + 'a>,
    pub actions: ActionSequence,
    pub guardrails: Guardrails,
    pub started_at: Option<Instant>,
    pub activations: u32,
    pub last_activation_at: Option<Instant>,
}

impl<'a> Monitor<'a> {
    pub fn new(
        trigger: Box<dyn Trigger + Send + 'a>,
        condition: Box<dyn Condition + Send + 'a>,
        actions: ActionSequence,
        guardrails: Guardrails,
    ) -> Self {
        Self { trigger, condition, actions, guardrails, started_at: None, activations: 0, last_activation_at: None }
    }

    pub fn start(&mut self, events: &mut Vec<Event>) { self.started_at = Some(Instant::now()); events.push(Event::MonitorStateChanged{state: MonitorState::Running}); }
    pub fn stop(&mut self, events: &mut Vec<Event>) { self.started_at = None; events.push(Event::MonitorStateChanged{state: MonitorState::Stopped}); }

    pub fn tick(
        &mut self,
        now: Instant,
        regions: &[crate::domain::Region],
        capture: &dyn crate::domain::ScreenCapture,
        automation: &dyn crate::domain::Automation,
        out_events: &mut Vec<Event>,
    ) {
        if self.started_at.is_none() { return; }

        // guard: max runtime
        if let Some(start) = self.started_at {
            if let Some(max_rt) = self.guardrails.max_runtime {
                if now.duration_since(start) > max_rt {
                    out_events.push(Event::WatchdogTripped { reason: "max_runtime".into() });
                    self.stop(out_events);
                    return;
                }
            }
        }

        if !self.trigger.should_fire(now) { return; }
        out_events.push(Event::TriggerFired);

        // cooldown: ensure min time between activations
        if let Some(last) = self.last_activation_at {
            if now.duration_since(last) < self.guardrails.cooldown { return; }
        }

        let cond = self.condition.evaluate(now, regions, capture);
        out_events.push(Event::ConditionEvaluated { result: cond });
        if !cond { return; }

        // rate limit
        if let Some(max_per_hour) = self.guardrails.max_activations_per_hour {
            if self.activations >= max_per_hour {
                out_events.push(Event::WatchdogTripped { reason: "max_activations_per_hour".into() });
                return;
            }
        }

        let ok = self.actions.run(automation, out_events);
        if ok {
            self.activations += 1;
            self.last_activation_at = Some(now);
        }
    }
}
