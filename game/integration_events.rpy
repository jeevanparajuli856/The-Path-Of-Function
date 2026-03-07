# Shared Ren'Py telemetry helpers for game-side integration.
# This file only prepares events/state in game scripts; backend/frontend wiring is handled later.

init -10 python:
    import json
    from datetime import datetime, timezone

    _TELEMETRY_STATE_TEMPLATE = {
        "current_scene_id": None,
        "scene_entered_at": None,
        "topic_id": None,
        "learning_objective": None,
        "difficulty_level": "beginner",
        "concept_tags": [],
        "choices_made": [],
        "wrong_attempt_count": 0,
        "hints_used": 0,
        "quiz_id": None,
        "question_id": None,
        "allowed_help_level": "nudge",
        "spoiler_guard": "strict",
    }

    _telemetry_runtime_state = dict(_TELEMETRY_STATE_TEMPLATE)

    def _telemetry_now_iso():
        return datetime.now(timezone.utc).isoformat()

    def _telemetry_debug_enabled():
        return bool(getattr(store, "telemetry_debug", False))

    def _telemetry_log(message):
        if _telemetry_debug_enabled():
            renpy.log("[telemetry] %s" % message)

    def _merge_payload(base_payload, extra_payload=None):
        payload = dict(base_payload)
        if extra_payload:
            payload.update(extra_payload)
        return payload

    def send_to_frontend(event_type, payload=None):
        """Send telemetry message to frontend bridge when available."""
        if payload is None:
            payload = {}

        message = {
            "type": event_type,
            "payload": payload,
        }

        try:
            js = "window.sendToFrontend && window.sendToFrontend(%s, %s);" % (
                json.dumps(event_type),
                json.dumps(payload),
            )
            renpy.exports.eval_js(js)
            _telemetry_log("sent %s" % json.dumps(message))
            return True
        except Exception as exc:
            _telemetry_log("bridge unavailable for %s: %s" % (event_type, exc))
            return False

    def reset_telemetry_state():
        global _telemetry_runtime_state
        _telemetry_runtime_state = dict(_TELEMETRY_STATE_TEMPLATE)

    def _scene_elapsed_seconds():
        entered_at = _telemetry_runtime_state.get("scene_entered_at")
        if entered_at is None:
            return 0

        try:
            return max(0, int(renpy.get_game_runtime() - entered_at))
        except Exception:
            return 0

    def emit_scene_start(scene_id, extra=None):
        _telemetry_runtime_state["current_scene_id"] = scene_id
        _telemetry_runtime_state["scene_entered_at"] = renpy.get_game_runtime()

        payload = _merge_payload(
            {
                "scene_id": scene_id,
                "current_scene_id": scene_id,
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("scene_start", payload)

    def emit_dialogue(dialogue_id, character_id, dialogue_text, extra=None):
        payload = _merge_payload(
            {
                "scene_id": _telemetry_runtime_state.get("current_scene_id"),
                "dialogue_id": dialogue_id,
                "character_id": character_id,
                "dialogue_text": dialogue_text,
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("dialogue", payload)

    def emit_choice_made(choice_id, choice_text=None, extra=None):
        _telemetry_runtime_state["choices_made"].append(choice_id)

        payload = _merge_payload(
            {
                "scene_id": _telemetry_runtime_state.get("current_scene_id"),
                "choice_id": choice_id,
                "choice_text": choice_text,
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("choice_made", payload)

    def emit_learning_context_update(topic_id=None, learning_objective=None, difficulty_level="beginner", concept_tags=None, extra=None, **kwargs):
        if learning_objective is None:
            learning_objective = kwargs.get("objective")
        if "difficulty" in kwargs and difficulty_level == "beginner":
            difficulty_level = kwargs.get("difficulty")
        if concept_tags is None and kwargs.get("tags") is not None:
            concept_tags = kwargs.get("tags")
        if concept_tags is None:
            concept_tags = []

        _telemetry_runtime_state["topic_id"] = topic_id
        _telemetry_runtime_state["learning_objective"] = learning_objective
        _telemetry_runtime_state["difficulty_level"] = difficulty_level
        _telemetry_runtime_state["concept_tags"] = list(concept_tags)

        payload = _merge_payload(
            {
                "scene_id": _telemetry_runtime_state.get("current_scene_id"),
                "topic_id": topic_id,
                "learning_objective": learning_objective,
                "difficulty_level": difficulty_level,
                "concept_tags": list(concept_tags),
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("learning_context_update", payload)

    def emit_help_policy_update(allowed_help_level=None, spoiler_guard="strict", extra=None, **kwargs):
        if allowed_help_level is None:
            allowed_help_level = kwargs.get("help_level", "nudge")
        _telemetry_runtime_state["allowed_help_level"] = allowed_help_level
        _telemetry_runtime_state["spoiler_guard"] = spoiler_guard

        payload = _merge_payload(
            {
                "allowed_help_level": allowed_help_level,
                "spoiler_guard": spoiler_guard,
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("help_policy_update", payload)

    def emit_player_state_update(extra=None):
        payload = _merge_payload(
            {
                "current_scene_id": _telemetry_runtime_state.get("current_scene_id"),
                "topic_id": _telemetry_runtime_state.get("topic_id"),
                "choices_made": list(_telemetry_runtime_state.get("choices_made", [])),
                "quiz_id": _telemetry_runtime_state.get("quiz_id"),
                "question_id": _telemetry_runtime_state.get("question_id"),
                "wrong_attempt_count": _telemetry_runtime_state.get("wrong_attempt_count", 0),
                "hints_used": _telemetry_runtime_state.get("hints_used", 0),
                "time_in_scene_seconds": _scene_elapsed_seconds(),
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("player_state_update", payload)

    def emit_quiz_started(quiz_id, question_id, extra=None):
        _telemetry_runtime_state["quiz_id"] = quiz_id
        _telemetry_runtime_state["question_id"] = question_id

        payload = _merge_payload(
            {
                "scene_id": _telemetry_runtime_state.get("current_scene_id"),
                "quiz_id": quiz_id,
                "question_id": question_id,
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("quiz_started", payload)

    def emit_quiz_submitted(quiz_id, question_id, is_correct, extra=None):
        payload = _merge_payload(
            {
                "scene_id": _telemetry_runtime_state.get("current_scene_id"),
                "quiz_id": quiz_id,
                "question_id": question_id,
                "is_correct": bool(is_correct),
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("quiz_submitted", payload)

    def emit_player_prompt_started(prompt_id, prompt_kind="unknown", extra=None):
        payload = _merge_payload(
            {
                "scene_id": _telemetry_runtime_state.get("current_scene_id"),
                "prompt_id": prompt_id,
                "prompt_kind": prompt_kind,
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("player_prompt_started", payload)

    def emit_player_prompt_resolved(prompt_id, resolved_by="answered", extra=None):
        payload = _merge_payload(
            {
                "scene_id": _telemetry_runtime_state.get("current_scene_id"),
                "prompt_id": prompt_id,
                "resolved_by": resolved_by,
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("player_prompt_resolved", payload)

    def emit_game_ended(final_scene_id=None, extra=None, **kwargs):
        if final_scene_id is None:
            final_scene_id = kwargs.get("final_scene")
        payload = _merge_payload(
            {
                "final_scene": final_scene_id,
                "current_scene_id": _telemetry_runtime_state.get("current_scene_id"),
                "choices_made_count": len(_telemetry_runtime_state.get("choices_made", [])),
                "wrong_attempt_count": _telemetry_runtime_state.get("wrong_attempt_count", 0),
                "hints_used": _telemetry_runtime_state.get("hints_used", 0),
                "timestamp": _telemetry_now_iso(),
            },
            extra,
        )
        send_to_frontend("game_ended", payload)

    def telemetry_add_wrong_attempt(amount=1):
        _telemetry_runtime_state["wrong_attempt_count"] = max(
            0,
            int(_telemetry_runtime_state.get("wrong_attempt_count", 0)) + int(amount),
        )

    def telemetry_add_hint_used(amount=1):
        _telemetry_runtime_state["hints_used"] = max(
            0,
            int(_telemetry_runtime_state.get("hints_used", 0)) + int(amount),
        )


# Canonical IDs used by game scripts for stable payloads.
define TELEMETRY_SCENE_IDS = {
    "start": "start",
    "inbed": "inbed",
    "hallway": "hallway",
    "hallwayafter": "hallwayafter",
    "teachingfirst": "teaching1",
    "teachingsecond": "teaching2",
    "dragqns": "dragqns",
    "aftersubmission": "aftersubmission",
    "ending": "ending",
}

define TELEMETRY_TOPIC_IDS = {
    "builtin": "functions.builtin",
    "user_defined": "functions.user_defined",
    "parameters": "functions.parameters",
    "returns": "functions.return_values",
    "main": "functions.main",
    "call_stack": "functions.call_stack",
}

define TELEMETRY_QUIZ_IDS = {
    "dragdrop_main": "q1_dragdrop_main",
    "input_output": "q2_input_output",
    "celsius_value": "q3_celsius_value",
    "stack_last_removed": "q4_stack_last_removed",
}

define TELEMETRY_QUESTION_IDS = {
    "dragdrop_main_1": "dragdrop_main_1",
    "input_output_1": "input_output_1",
    "celsius_value_1": "celsius_value_1",
    "stack_last_removed_1": "stack_last_removed_1",
}

define TELEMETRY_DIALOGUE_IDS = {
    "teaching1_topic_intro": "dlg_teaching1_topic_intro",
    "teaching1_builtin_explain": "dlg_teaching1_builtin_explain",
    "teaching1_input_prompt": "dlg_teaching1_input_prompt",
    "teaching1_userdef_intro": "dlg_teaching1_userdef_intro",
    "teaching1_param_intro": "dlg_teaching1_param_intro",
    "teaching1_return_intro": "dlg_teaching1_return_intro",
    "teaching1_name_prompt": "dlg_teaching1_name_prompt",
    "teaching1_celsius_prompt": "dlg_teaching1_celsius_prompt",
    "teaching2_program_exec_intro": "dlg_teaching2_program_exec_intro",
    "teaching2_main_intro": "dlg_teaching2_main_intro",
    "teaching2_ready_prompt": "dlg_teaching2_ready_prompt",
    "after_stack_prompt": "dlg_after_stack_prompt",
}

# Optional debug flag in store for log output.
default telemetry_debug = False
