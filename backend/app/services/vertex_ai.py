"""
Vertex AI Service
Integration with Google Cloud Vertex AI for RAG-based chatbot responses
"""

import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import json

logger = logging.getLogger(__name__)


@dataclass
class AIResponse:
    """Response from Vertex AI service"""
    response: str
    citations: List[Dict[str, Any]]
    guardrail_applied_mode: str  # 'none', 'hint', 'spoiler', 'out_of_scope'
    token_count: int
    message_id: str
    help_requests_remaining: Optional[int] = None


class VertexAIService:
    """
    Vertex AI RAG integration for game-aware helper chatbot
    
    Responsibilities:
    - Query RAG index with game corpus
    - Apply guardrails (spoiler detection, help limits)
    - Generate grounded responses with citations
    - Track token usage for cost tracking
    """
    
    def __init__(self):
        """Initialize Vertex AI client"""
        self.project_id = None
        self.location = "us-central1"
        self.model_id = "gemini-1.5-flash"  # or your chosen model
        
        # Will be initialized on first use
        self._client = None
        self._initialized = False
        
        logger.info("VertexAIService initialized (lazy-loaded on first request)")
    
    async def _initialize(self):
        """
        Lazy initialization of Vertex AI client
        Import google.cloud.aiplatform only if actually using the service
        """
        if self._initialized:
            return
        
        try:
            from google.cloud import aiplatform
            from app.core.config import get_settings
            
            settings = get_settings()
            self.project_id = settings.GCP_PROJECT_ID
            
            aiplatform.init(
                project=self.project_id,
                location=self.location,
            )
            
            logger.info(f"Vertex AI initialized: project={self.project_id}, location={self.location}")
            self._initialized = True
            
        except ImportError:
            logger.error("google-cloud-aiplatform not installed. Install with: pip install google-cloud-aiplatform")
            raise RuntimeError("Vertex AI dependencies not installed")
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI: {str(e)}")
            raise
    
    async def generate_response(
        self,
        user_message: str,
        game_context: Optional[Any],
        session_id: str,
        student_id: Optional[str] = None,
    ) -> AIResponse:
        """
        Generate AI response with RAG grounding and guardrails
        
        Args:
            user_message: Student's question
            game_context: Game state (scene_id, topic_id, player_state, help_policy, etc)
            session_id: Unique session identifier
            student_id: Student identifier
        
        Returns:
            AIResponse with generated text, citations, guardrail info
        """
        await self._initialize()
        
        import uuid
        message_id = str(uuid.uuid4())
        
        logger.info(
            f"Generating response: message_id={message_id}, session={session_id}, "
            f"context_scene={game_context.scene_id if game_context else 'none'}"
        )
        
        try:
            # Step 1: Check guardrails (help limits, spoiler detection)
            guardrail_mode, help_remaining = self._check_guardrails(
                user_message=user_message,
                game_context=game_context,
                session_id=session_id
            )
            
            # Step 2: Query RAG corpus for relevant content
            rag_results = await self._query_rag_corpus(
                user_message=user_message,
                game_context=game_context,
                guardrail_mode=guardrail_mode
            )
            
            # Step 3: Build prompt with game tone + grounding
            prompt = self._build_prompt(
                user_message=user_message,
                rag_results=rag_results,
                game_context=game_context,
                guardrail_mode=guardrail_mode
            )
            
            # Step 4: Call Vertex AI Gemini model
            response_text, token_count = await self._call_vertex_ai(
                prompt=prompt,
                model_id=self.model_id
            )
            
            # Step 5: Extract citations from response
            citations = self._extract_citations(rag_results, response_text)
            
            logger.info(
                f"Response generated: message_id={message_id}, "
                f"tokens={token_count}, citations={len(citations)}, "
                f"guardrail={guardrail_mode}"
            )
            
            return AIResponse(
                response=response_text,
                citations=citations,
                guardrail_applied_mode=guardrail_mode,
                token_count=token_count,
                message_id=message_id,
                help_requests_remaining=help_remaining
            )
        
        except Exception as e:
            logger.error(
                f"Error generating response: message_id={message_id}, error={str(e)}",
                exc_info=True
            )
            raise
    
    def _check_guardrails(
        self,
        user_message: str,
        game_context: Optional[Any],
        session_id: str
    ) -> tuple[str, Optional[int]]:
        """
        Check help limits, spoiler patterns, out-of-scope questions
        
        Returns:
            (guardrail_mode, help_requests_remaining)
        """
        # TODO: Implement help limit tracking per session
        # For now, always allow (no limit)
        
        # Check for spoiler keywords in question
        spoiler_keywords = ["solution", "answer", "how do i beat", "skip this"]
        is_spoiler_request = any(kw in user_message.lower() for kw in spoiler_keywords)
        
        if is_spoiler_request and game_context and game_context.help_policy == "restricted":
            return ("spoiler", None)
        
        # Check if question is about game/programming
        if not self._is_game_related(user_message):
            return ("out_of_scope", None)
        
        # Check for hint-only policy
        if game_context and game_context.help_policy == "hint":
            return ("hint", None)
        
        return ("none", None)  # No guardrails needed
    
    def _is_game_related(self, message: str) -> bool:
        """Check if message is about the game or programming/functions"""
        game_keywords = ["function", "game", "scene", "code", "program", "variable", "loop", "if"]
        return any(kw in message.lower() for kw in game_keywords)
    
    async def _query_rag_corpus(
        self,
        user_message: str,
        game_context: Optional[Any],
        guardrail_mode: str
    ) -> List[Dict[str, Any]]:
        """
        Query RAG corpus (managed vector index) for relevant content
        
        TODO: Implement actual Vertex AI Vector Search integration
        For now, returns mock results
        """
        # In production, this would:
        # 1. Embed user_message using same model as corpus
        # 2. Query Vertex AI Vector Search index
        # 3. Return top-k relevant scenes/content with relevance scores
        
        logger.info("Querying RAG corpus (mock implementation)")
        
        # Mock results for demonstration
        rag_results = [
            {
                "source_type": "scene",
                "source_id": "scene_001",
                "content": "Functions are blocks of code that perform specific tasks and can be reused.",
                "relevance_score": 0.95,
                "topic": "function_basics"
            },
            {
                "source_type": "example",
                "source_id": "example_001",
                "content": "If a function calculates the sum of numbers, you call it with numbers and it returns the sum.",
                "relevance_score": 0.87,
                "topic": "function_behavior"
            },
        ]
        
        return rag_results
    
    def _build_prompt(
        self,
        user_message: str,
        rag_results: List[Dict[str, Any]],
        game_context: Optional[Any],
        guardrail_mode: str
    ) -> str:
        """
        Build system + user prompt with game tone and RAG grounding
        """
        # Game context
        scene_info = ""
        if game_context and game_context.scene_id:
            scene_info = f"Current scene: {game_context.scene_id}\nTopic: {game_context.topic_id}\n"
        
        # RAG corpus context
        rag_context = "\n".join([
            f"[{r['source_type']}: {r['source_id']}] {r['content']}"
            for r in rag_results
        ])
        
        # Guardrail instructions
        guardrail_instruction = ""
        if guardrail_mode == "hint":
            guardrail_instruction = "Provide hints rather than direct answers. Help them learn, don't give away solutions."
        elif guardrail_mode == "spoiler":
            guardrail_instruction = "Do not reveal plot details, solutions, or scene outcomes. Offer general guidance instead."
        elif guardrail_mode == "out_of_scope":
            guardrail_instruction = "The question is not about the game or programming. Politely redirect to game-related topics."
        
        prompt = f"""You are a helpful tutor in an educational game about programming and functions.
The learner is in the game and needs your help understanding concepts.

{scene_info}

Keep responses:
- Friendly and encouraging (matching the game tone)
- Focused on the game's learning objectives
- Short and conversational (1-2 paragraphs max)
- Grounded in the game's context

{guardrail_instruction}

Relevant game content:
{rag_context}

Student's question: {user_message}

Provide a helpful response:"""
        
        return prompt
    
    async def _call_vertex_ai(
        self,
        prompt: str,
        model_id: str
    ) -> tuple[str, int]:
        """
        Call Vertex AI Gemini model for response generation
        
        Returns:
            (response_text, token_count)
        """
        try:
            # TODO: Implement actual Vertex AI API call
            # This requires google-cloud-aiplatform and proper GCP auth
            
            # Mock response for now
            logger.info("Calling Vertex AI (mock implementation)")
            
            response_text = (
                "A function is a reusable block of code that does a specific task. "
                "Think of it like a helper character in the game - when you call a function, "
                "it performs its work and returns a result. In the game, this helps you break "
                "down complex problems into smaller, manageable pieces!"
            )
            
            token_count = len(prompt.split()) + len(response_text.split())
            
            return response_text, token_count
        
        except Exception as e:
            logger.error(f"Vertex AI API call failed: {str(e)}")
            raise
    
    def _extract_citations(
        self,
        rag_results: List[Dict[str, Any]],
        response_text: str
    ) -> List[Dict[str, Any]]:
        """
        Extract citations used in the response based on RAG results
        """
        citations = []
        
        for result in rag_results:
            # Simple heuristic: count how much of result content appears in response
            if result["content"].lower() in response_text.lower():
                citations.append({
                    "source_type": result["source_type"],
                    "source_id": result["source_id"],
                    "relevance_score": result["relevance_score"],
                    "excerpt": result["content"]
                })
        
        # If no matches found, return top-2 by relevance
        if not citations:
            citations = [
                {
                    "source_type": r["source_type"],
                    "source_id": r["source_id"],
                    "relevance_score": r["relevance_score"],
                    "excerpt": r["content"]
                }
                for r in sorted(rag_results, key=lambda x: x["relevance_score"], reverse=True)[:2]
            ]
        
        return citations
