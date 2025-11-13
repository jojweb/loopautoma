use crate::domain::{Action, Automation, MouseButton};

pub struct MoveCursor { pub x: u32, pub y: u32 }
impl Action for MoveCursor {
    fn name(&self) -> &'static str { "MoveCursor" }
    fn execute(&self, automation: &dyn Automation) -> Result<(), String> {
        automation.move_cursor(self.x, self.y)
    }
}

pub struct Click { pub button: MouseButton }
impl Action for Click {
    fn name(&self) -> &'static str { "Click" }
    fn execute(&self, automation: &dyn Automation) -> Result<(), String> {
        automation.click(self.button)
    }
}

pub struct TypeText { pub text: String }
impl Action for TypeText {
    fn name(&self) -> &'static str { "Type" }
    fn execute(&self, automation: &dyn Automation) -> Result<(), String> {
        automation.type_text(&self.text)
    }
}

pub struct Key { pub key: String }
impl Action for Key {
    fn name(&self) -> &'static str { "Key" }
    fn execute(&self, automation: &dyn Automation) -> Result<(), String> {
        automation.key(&self.key)
    }
}
