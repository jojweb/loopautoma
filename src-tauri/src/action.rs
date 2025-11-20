use crate::domain::{Action, ActionContext, Automation, MouseButton, Region, ScreenCapture};
use crate::llm::{build_risk_guidance, capture_region_images, LLMClient};

pub struct MoveCursor {
    pub x: u32,
    pub y: u32,
}
impl Action for MoveCursor {
    fn name(&self) -> &'static str {
        "MoveCursor"
    }
    fn execute(
        &self,
        automation: &dyn Automation,
        _context: &mut ActionContext,
    ) -> Result<(), String> {
        automation.move_cursor(self.x, self.y)
    }
}

pub struct Click {
    pub button: MouseButton,
}
impl Action for Click {
    fn name(&self) -> &'static str {
        "Click"
    }
    fn execute(
        &self,
        automation: &dyn Automation,
        _context: &mut ActionContext,
    ) -> Result<(), String> {
        automation.click(self.button)
    }
}

pub struct TypeText {
    pub text: String,
}
impl Action for TypeText {
    fn name(&self) -> &'static str {
        "Type"
    }
    fn execute(
        &self,
        automation: &dyn Automation,
        context: &mut ActionContext,
    ) -> Result<(), String> {
        // Expand variables like $prompt
        let expanded = context.expand(&self.text);

        // Check for inline key syntax like {Key:Enter}
        if expanded.starts_with("{Key:") && expanded.ends_with("}") {
            let key = expanded[5..expanded.len() - 1].to_string();
            return automation.key(&key);
        }

        automation.type_text(&expanded)
    }
}

/// LLM Prompt Generation action that captures regions, calls LLM, and populates $prompt
pub struct LLMPromptGenerationAction {
    pub region_ids: Vec<String>,
    pub risk_threshold: f64,
    pub system_prompt: Option<String>,
    pub variable_name: String,
    pub ocr_mode: crate::domain::OcrMode,
    pub all_regions: Vec<Region>,
    pub capture: std::sync::Arc<dyn ScreenCapture + Send + Sync>,
    pub llm_client: std::sync::Arc<dyn LLMClient>,
}

impl Action for LLMPromptGenerationAction {
    fn name(&self) -> &'static str {
        "LLMPromptGeneration"
    }

    fn execute(
        &self,
        _automation: &dyn Automation,
        context: &mut ActionContext,
    ) -> Result<(), String> {
        // 1. Validate region_ids and collect regions
        let mut captured_regions = Vec::new();
        for region_id in &self.region_ids {
            if let Some(region) = self.all_regions.iter().find(|r| &r.id == region_id) {
                captured_regions.push(region.clone());
            } else {
                return Err(format!("Region '{}' not found", region_id));
            }
        }

        // 2. Determine mode and prepare LLM input
        let (region_images, extracted_text) = match self.ocr_mode {
            crate::domain::OcrMode::None => {
                // None mode: No OCR or vision, return error (LLM prompt generation requires at least vision mode)
                return Err("LLM prompt generation requires ocr_mode to be 'local' or 'vision' (currently 'none')".to_string());
            }
            crate::domain::OcrMode::Local => {
                // Local mode: Extract text from regions using OCR, send text-only to LLM
                #[cfg(feature = "ocr-integration")]
                {
                    use crate::domain::OCRCapture;
                    let ocr = crate::os::linux::LinuxOCR::new()
                        .map_err(|e| format!("Failed to initialize OCR: {}", e.message))?;
                    
                    let mut texts = Vec::new();
                    for region in &captured_regions {
                        let region_hash = self.capture.hash_region(region, 1);
                        let text = ocr.extract_text_cached(region, region_hash)
                            .map_err(|e| format!("OCR extraction failed for '{}': {}", region.id, e.message))?;
                        texts.push(format!("Region '{}': {}", region.id, text));
                    }
                    
                    // Return empty images vec + extracted text
                    (Vec::new(), Some(texts.join("\n\n")))
                }
                #[cfg(not(feature = "ocr-integration"))]
                {
                    return Err("Local OCR mode requires 'ocr-integration' feature".to_string());
                }
            }
            crate::domain::OcrMode::Vision => {
                // Vision mode: Capture screenshots and send to LLM vision API (current behavior)
                let images = capture_region_images(&captured_regions, self.capture.as_ref())?;
                (images, None::<String>)
            }
        };

        // 3. Build risk guidance
        let risk_guidance = build_risk_guidance();

        // 4. Build system prompt (append extracted text if in Local mode)
        let effective_system_prompt = if let Some(ref text) = extracted_text {
            let base = self.system_prompt.as_deref().unwrap_or(
                "You are an AI assistant helping with desktop automation."
            );
            Some(format!("{}\n\nExtracted text from screen regions:\n{}", base, text))
        } else {
            self.system_prompt.clone()
        };

        // 5. Call LLM with regions and images/text
        let llm_response = self.llm_client.generate_prompt(
            &captured_regions,
            region_images,
            effective_system_prompt.as_deref(),
            &risk_guidance,
        )?;

        // 5. Check if task is complete (new structured termination)
        if llm_response.task_complete {
            let reason = llm_response.task_complete_reason.clone()
                .unwrap_or_else(|| "LLM signaled task complete".to_string());
            context.request_termination(reason);
            
            // Still set variables for logging/inspection
            if let Some(ref prompt) = llm_response.continuation_prompt {
                context.set(&self.variable_name, prompt.clone());
            }
            context.set("task_complete", "true");
            
            return Ok(());
        }

        // 6. Validate continuation prompt exists
        let continuation_prompt = llm_response.continuation_prompt.as_ref()
            .ok_or("LLM did not provide continuation_prompt")?;

        // 7. Validate risk threshold (use new continuation_prompt_risk)
        let risk = llm_response.continuation_prompt_risk;
        if risk > self.risk_threshold {
            // Play audible alarm
            self.play_alarm();
            return Err(format!(
                "Risk threshold exceeded: {} > {} (generated prompt: '{}')",
                risk, self.risk_threshold, continuation_prompt
            ));
        }

        // 8. Validate prompt
        if continuation_prompt.is_empty() {
            return Err("LLM returned empty continuation_prompt".to_string());
        }
        if continuation_prompt.len() > 200 {
            return Err(format!(
                "LLM prompt too long: {} characters (max 200)",
                continuation_prompt.len()
            ));
        }

        // 9. Set the variables in context
        context.set(&self.variable_name, continuation_prompt.clone());
        context.set("continuation_prompt_risk", risk.to_string());
        context.set("task_complete", "false");

        Ok(())
    }
}

impl LLMPromptGenerationAction {
    /// Play audible alarm when risk threshold is exceeded
    fn play_alarm(&self) {
        // In a real implementation, this would:
        // - Use platform-specific audio API
        // - Play a beep or alert sound
        // For now, just print to stderr
        eprintln!("⚠️  RISK THRESHOLD EXCEEDED - ALARM ⚠️");
    }
}

/// Termination check action that evaluates conditions and requests termination
pub struct TerminationCheckAction {
    pub check_type: String,
    pub context_vars: Vec<String>,
    pub ocr_region_ids: Vec<String>,
    pub ai_query_prompt: Option<String>,
    pub termination_condition: String,
    pub all_regions: Vec<crate::domain::Region>,
    pub capture: std::sync::Arc<dyn crate::domain::ScreenCapture + Send + Sync>,
    pub llm_client: std::sync::Arc<dyn crate::llm::LLMClient>,
}

impl Action for TerminationCheckAction {
    fn name(&self) -> &'static str {
        "TerminationCheck"
    }

    fn execute(
        &self,
        _automation: &dyn crate::domain::Automation,
        context: &mut crate::domain::ActionContext,
    ) -> Result<(), String> {
        use regex::Regex;
        
        let condition_met = match self.check_type.as_str() {
            "context" => {
                // Inspect context variables
                let mut values = Vec::new();
                for var_name in &self.context_vars {
                    if let Some(value) = context.get(var_name) {
                        values.push(value);
                    }
                }
                
                // Check if termination_condition regex matches any value
                let pattern = Regex::new(&self.termination_condition)
                    .map_err(|e| format!("Invalid termination condition regex: {}", e))?;
                
                values.iter().any(|v| pattern.is_match(v))
            }
            "ocr" => {
                // Extract text from OCR regions and check pattern
                #[cfg(feature = "ocr-integration")]
                {
                    use crate::domain::OCRCapture;
                    let ocr = crate::os::linux::LinuxOCR::new()
                        .map_err(|e| format!("Failed to initialize OCR: {}", e.message))?;
                    
                    let pattern = Regex::new(&self.termination_condition)
                        .map_err(|e| format!("Invalid termination condition regex: {}", e))?;
                    
                    let mut found = false;
                    for region_id in &self.ocr_region_ids {
                        if let Some(region) = self.all_regions.iter().find(|r| &r.id == region_id) {
                            let region_hash = self.capture.hash_region(region, 1);
                            if let Ok(text) = ocr.extract_text_cached(region, region_hash) {
                                if pattern.is_match(&text) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                    }
                    found
                }
                #[cfg(not(feature = "ocr-integration"))]
                {
                    return Err("OCR termination check requires 'ocr-integration' feature".to_string());
                }
            }
            "ai_query" => {
                // Call LLM with custom query and check task_complete
                let query_prompt = self.ai_query_prompt.as_deref()
                    .ok_or("ai_query_prompt required for ai_query check_type")?;
                
                // Collect all regions for LLM
                let mut captured_regions = Vec::new();
                for region in &self.all_regions {
                    captured_regions.push(region.clone());
                }
                
                // Capture images
                let region_images = crate::llm::capture_region_images(&captured_regions, self.capture.as_ref())?;
                
                // Call LLM
                let risk_guidance = crate::llm::build_risk_guidance();
                let llm_response = self.llm_client.generate_prompt(
                    &captured_regions,
                    region_images,
                    Some(query_prompt),
                    &risk_guidance,
                )?;
                
                llm_response.task_complete
            }
            _ => {
                return Err(format!("Unknown check_type: {}", self.check_type));
            }
        };
        
        if condition_met {
            context.request_termination(format!("TerminationCheck: {}", self.termination_condition));
        }
        
        Ok(())
    }
}
