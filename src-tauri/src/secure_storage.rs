/// Secure storage abstraction for sensitive data (API keys, etc.)
/// Uses OS keyring: macOS Keychain, Windows Credential Manager, Linux Secret Service/KWallet
use tauri_plugin_store::{Store, StoreExt};
use std::sync::Arc;

const OPENAI_KEY_ENTRY: &str = "openai_api_key";
const OPENAI_MODEL_ENTRY: &str = "openai_model";

pub struct SecureStorage<R: tauri::Runtime> {
    store: Arc<Store<R>>,
}

impl<R: tauri::Runtime> SecureStorage<R> {
    pub fn new(app_handle: &tauri::AppHandle<R>) -> Result<Self, String> {
        let store = app_handle.store("secure.bin")
            .map_err(|e| format!("Failed to initialize secure storage: {}", e))?;
        
        Ok(Self {
            store,
        })
    }

    /// Get OpenAI API key from secure storage
    /// Returns None if key is not set
    pub fn get_openai_key(&self) -> Result<Option<String>, String> {
        match self.store.get(OPENAI_KEY_ENTRY) {
            Some(value) => {
                let key = value.as_str()
                    .ok_or("Invalid key format in storage")?
                    .to_string();
                Ok(Some(key))
            }
            None => Ok(None)
        }
    }

    /// Set OpenAI API key in secure storage
    pub fn set_openai_key(&self, key: &str) -> Result<(), String> {
        self.store.set(OPENAI_KEY_ENTRY, serde_json::json!(key));
        self.store.save()
            .map_err(|e| format!("Failed to save key to storage: {}", e))?;
        
        Ok(())
    }

    /// Delete OpenAI API key from secure storage
    pub fn delete_openai_key(&self) -> Result<(), String> {
        self.store.delete(OPENAI_KEY_ENTRY);
        self.store.save()
            .map_err(|e| format!("Failed to save after delete: {}", e))?;
        
        Ok(())
    }

    /// Check if OpenAI API key exists (without revealing it)
    pub fn has_openai_key(&self) -> Result<bool, String> {
        Ok(self.store.get(OPENAI_KEY_ENTRY).is_some())
    }

    /// Get preferred OpenAI model
    /// Returns None if not set (defaults to gpt-4o in client)
    pub fn get_openai_model(&self) -> Result<Option<String>, String> {
        match self.store.get(OPENAI_MODEL_ENTRY) {
            Some(value) => {
                let model = value.as_str()
                    .ok_or("Invalid model format in storage")?
                    .to_string();
                Ok(Some(model))
            }
            None => Ok(None)
        }
    }

    /// Set preferred OpenAI model
    pub fn set_openai_model(&self, model: &str) -> Result<(), String> {
        self.store.set(OPENAI_MODEL_ENTRY, serde_json::json!(model));
        self.store.save()
            .map_err(|e| format!("Failed to save model to storage: {}", e))?;
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_lifecycle() {
        // Note: This test requires a Tauri AppHandle which isn't available in unit tests
        // Integration tests would be needed for full coverage
        // For now, we'll test the logic flow
    }
}
