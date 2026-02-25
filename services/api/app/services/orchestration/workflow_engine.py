"""
Professional Agent Builder Workflow Engine.
Executes custom agent graphs defined as nodes and edges.
"""
import asyncio
import structlog
import uuid
from typing import Dict, List, Optional, Any
from app.db.models import AgentWorkflow, WorkflowRun, WorkflowRunStatus
from app.db.session import AsyncSessionLocal
from app.services.llm.client import LLMClient
from app.services.agents.base import BaseAgent

log = structlog.get_logger()

class WorkflowEngine:
    def __init__(self, workflow_id: str, run_id: Optional[str] = None):
        self.workflow_id = workflow_id
        self.run_id = run_id or str(uuid.uuid4())
        self.context = {}

    async def execute(self, inputs: Dict[str, Any] = None):
        """
        Execute the agent workflow graph.
        """
        self.context.update(inputs or {})
        
        async with AsyncSessionLocal() as db:
            workflow = await db.get(AgentWorkflow, self.workflow_id)
            if not workflow:
                raise ValueError("Workflow not found")
            
            # Initialize Run
            run = WorkflowRun(
                id=self.run_id,
                workflow_id=self.workflow_id,
                status=WorkflowRunStatus.running,
                trigger_type="manual",
                steps_log=[]
            )
            db.add(run)
            await db.commit()

            try:
                # Naive sequential execution for now based on 'steps' array
                # In a full DAG, we'd use topological sort.
                for step in workflow.steps:
                    step_id = step.get("id")
                    node_type = step.get("type")
                    config = step.get("config", {})
                    
                    log.info("workflow.step.start", workflow_id=self.workflow_id, step=step_id, type=node_type)
                    
                    result = await self._execute_node(node_type, config)
                    
                    run.steps_log.append({
                        "id": step_id,
                        "type": node_type,
                        "status": "success",
                        "output": result
                    })
                    self.context[step_id] = result
                    await db.commit()

                run.status = WorkflowRunStatus.succeeded
                run.result = self.context
                await db.commit()
                
            except Exception as e:
                log.error("workflow.execution.failed", workflow_id=self.workflow_id, error=str(e))
                run.status = WorkflowRunStatus.failed
                run.error = str(e)
                await db.commit()
                raise e

    async def _execute_node(self, node_type: str, config: Dict) -> Any:
        """Execute a specific node type logic."""
        if node_type == "specialist_agent":
            agent_class_name = config.get("agent_class")
            # Dynamic import of agent
            from app.services.agents import (
                problem_framer, modeling_agent, insight_narrator, action_agent
            )
            agents = {
                "ProblemFramerAgent": problem_framer.ProblemFramerAgent,
                "ModelingAgent": modeling_agent.ModelingAgent,
                "InsightNarratorAgent": insight_narrator.InsightNarratorAgent,
                "ActionAgent": action_agent.ActionAgent
            }
            AgentClass = agents.get(agent_class_name)
            if not AgentClass:
                raise ValueError(f"Agent class {agent_class_name} not found")
            
            agent = AgentClass(
                session_id=self.run_id,
                domain=self.context.get("domain", "generic"),
                context=self.context,
                connector_ids=self.context.get("connector_ids", [])
            )
            return await agent.run(self.context.get("question", "Execute workflow step"))

        elif node_type == "tool":
            tool_name = config.get("tool_name")
            if tool_name == "sql_query":
                # Mock SQL execution
                return {"rows": [], "count": 0, "message": "SQL query simulated"}
            elif tool_name == "python_repl":
                # Mock Python REPL
                return {"output": "Python execution simulated"}
            
        elif node_type == "conditional":
            # Simple threshold check
            variable = self.context.get(config.get("variable"))
            threshold = config.get("threshold")
            if variable and threshold:
                return variable > threshold
            return True

        return {"status": "node_executed"}
