from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

@CrewBase
class FaturasPdfCrew():
    """Equipe de processamento de faturas usando Ollama"""

    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    @agent
    def analista_faturamento(self) -> Agent:
        return Agent(
            config=self.agents_config['analista_faturamento'],
            verbose=True,
            allow_delegation=False
        )

    @task
    def tarefa_extracao_dados(self) -> Task:
        return Task(
            config=self.tasks_config['tarefa_extracao_dados']
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True
        )