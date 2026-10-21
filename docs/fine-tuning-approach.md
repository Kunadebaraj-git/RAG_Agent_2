# Fine-Tuning Approach for DocMind AI

## Context: RAG vs Fine-Tuning

DocMind AI currently uses **Retrieval-Augmented Generation (RAG)**, which is the correct approach for this use case because:

1. **Dynamic knowledge**: Users upload their own documents at runtime. Fine-tuning requires training data at model preparation time.
2. **User isolation**: Each user has different documents. Fine-tuning would create a single model for all users.
3. **Citation ability**: RAG naturally provides source attribution because the context is explicitly passed to the LLM.
4. **Cost**: Fine-tuning requires GPU time; RAG only requires inference.
5. **Freshness**: New documents are immediately available in RAG without retraining.

Fine-tuning would be useful for:
- Improving the model's *style* of responses (e.g., always formal, domain-specific terminology)
- Teaching the model domain-specific reasoning patterns
- Reducing hallucination for specific knowledge domains
- Optimizing prompt-following behavior for our specific prompt templates

## Proposed Fine-Tuning Strategy

### Base Model
**Llama 3.1 8B** - The same model we use via Groq. Fine-tuning this model would maintain compatibility while improving behavior.

### Technique: LoRA / QLoRA
- **LoRA (Low-Rank Adaptation)**: Freezes the base model weights and trains small adapter matrices. Requires ~16GB VRAM for 8B model.
- **QLoRA**: Combines LoRA with 4-bit quantization. Requires ~6GB VRAM, making it feasible on consumer GPUs (RTX 3090/4090) or cloud instances.

### Training Parameters (QLoRA)
```
rank: 16
alpha: 32
dropout: 0.05
target_modules: [q_proj, v_proj, k_proj, o_proj]
learning_rate: 2e-4
epochs: 3
batch_size: 4
gradient_accumulation: 4
```

### Dataset Construction

We would create training data from our actual app usage:

1. **RAG Response Quality Dataset** (~500-1000 examples)
   - Input: System prompt + context chunks + user question
   - Output: High-quality answer with proper citations [filename, p.N]
   - Source: Curated from real user interactions, manually verified for accuracy

2. **Intent Classification Dataset** (~200 examples)
   - Input: User messages
   - Output: Correct intent (rag/summarize/general)
   - This could replace the current LLM-based classification with a more reliable fine-tuned model

3. **Citation Format Dataset** (~300 examples)
   - Train the model to consistently use our citation format
   - Include negative examples where the model should say "insufficient information"

### Data Format (ShareGPT/Alpaca)
```json
{
  "instruction": "Answer the question using only the provided context...",
  "input": "<documents>...</documents>\n\nQUESTION: What is the company's PTO policy?",
  "output": "According to the employee handbook, new employees receive 15 days of PTO per year [handbook.pdf, p.3]. After 3 years, this increases to 20 days [handbook.pdf, p.3]."
}
```

### Training Infrastructure
- **Cloud**: RunPod, Lambda Labs, or Google Colab Pro ($10-50/run)
- **Framework**: Hugging Face Transformers + PEFT + bitsandbytes
- **Training time**: ~2-4 hours for QLoRA on a single A100

### Evaluation
- Measure citation accuracy (does it cite the right page?)
- Measure "insufficient information" recall (does it refuse when context is inadequate?)
- Measure answer relevance using a held-out test set
- Compare fine-tuned vs base model on our specific use cases

## Decision: Why Not Now

Fine-tuning is deferred because:
1. RAG already provides good results for our use case
2. We don't yet have enough real user data to create a quality training set
3. Deploying a fine-tuned model would require a GPU server (not Render free tier)
4. The ROI doesn't justify the infrastructure cost at our current scale

**Recommendation**: Collect user interaction data (with consent) for 3-6 months, then evaluate whether fine-tuning would meaningfully improve response quality.
